"""Stripe + Clerk webhook handlers with signature verification."""
from __future__ import annotations

import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models import User, Subscription, Payment, PlanTier, SubscriptionStatus

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    import stripe

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    if not settings.STRIPE_WEBHOOK_SECRET:
        if settings.is_production:
            raise HTTPException(status_code=503, detail="Webhook not configured")
        # Dev: parse raw
        event = json.loads(payload)
    else:
        try:
            event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)
        except stripe.error.SignatureVerificationError as e:
            logger.warning(f"Stripe webhook signature invalid: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
        except Exception as e:
            logger.error(f"Stripe webhook parse error: {e}")
            raise HTTPException(status_code=400, detail="Webhook parse error")

    etype = event.get("type", "")
    data = event.get("data", {}).get("object", {})
    logger.info(f"Stripe webhook: {etype}")

    if etype == "checkout.session.completed":
        await _handle_checkout_completed(db, data)

    elif etype in ("customer.subscription.created", "customer.subscription.updated"):
        await _handle_subscription_updated(db, data)

    elif etype == "customer.subscription.deleted":
        await _handle_subscription_deleted(db, data)

    elif etype in ("invoice.payment_succeeded", "invoice.paid"):
        await _handle_invoice_paid(db, data)

    elif etype == "invoice.payment_failed":
        await _handle_payment_failed(db, data)

    return {"received": True}


async def _handle_checkout_completed(db: AsyncSession, data: dict) -> None:
    import stripe
    user_id = data.get("metadata", {}).get("user_id")
    plan = data.get("metadata", {}).get("plan", "starter")
    customer_id = data.get("customer")
    subscription_id = data.get("subscription")

    if not user_id:
        logger.warning("checkout.session.completed: no user_id in metadata")
        return

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        logger.warning(f"checkout.session.completed: user {user_id} not found")
        return

    try:
        user.plan_tier = PlanTier(plan)
    except ValueError:
        logger.error(f"Unknown plan tier in checkout: {plan}")
        return

    if customer_id:
        user.stripe_customer_id = customer_id

    # Create or update Subscription record
    if subscription_id:
        try:
            import stripe as stripe_lib
            stripe_lib.api_key = settings.STRIPE_SECRET_KEY
            sub_data = stripe_lib.Subscription.retrieve(subscription_id)

            result2 = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
            sub = result2.scalar_one_or_none()

            if not sub:
                sub = Subscription(user_id=user.id)
                db.add(sub)

            sub.stripe_subscription_id = subscription_id
            sub.stripe_price_id = sub_data["items"]["data"][0]["price"]["id"] if sub_data.get("items") else None
            sub.plan_tier = PlanTier(plan)
            sub.status = SubscriptionStatus.active
            sub.current_period_start = datetime.fromtimestamp(sub_data.get("current_period_start", 0))
            sub.current_period_end = datetime.fromtimestamp(sub_data.get("current_period_end", 0))
            sub.cancel_at_period_end = sub_data.get("cancel_at_period_end", False)
        except Exception as e:
            logger.error(f"Failed to create subscription record: {e}")

    await db.commit()
    logger.info(f"User {user_id} upgraded to {plan}")


async def _handle_subscription_updated(db: AsyncSession, data: dict) -> None:
    customer_id = data.get("customer")
    if not customer_id:
        return

    result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
    user = result.scalar_one_or_none()
    if not user:
        return

    result2 = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result2.scalar_one_or_none()
    if not sub:
        sub = Subscription(user_id=user.id)
        db.add(sub)

    status_str = data.get("status", "active")
    try:
        sub.status = SubscriptionStatus(status_str)
    except ValueError:
        logger.warning(f"Unknown subscription status: {status_str}")

    sub.cancel_at_period_end = data.get("cancel_at_period_end", False)
    if data.get("current_period_end"):
        sub.current_period_end = datetime.fromtimestamp(data["current_period_end"])
    if data.get("current_period_start"):
        sub.current_period_start = datetime.fromtimestamp(data["current_period_start"])

    # Sync plan tier if subscription has a known price
    items = data.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id", "")
        plan_map = {
            settings.STRIPE_PRICE_STARTER: PlanTier.starter,
            settings.STRIPE_PRICE_PRO: PlanTier.pro,
            settings.STRIPE_PRICE_AGENCY: PlanTier.agency,
        }
        if price_id in plan_map:
            new_tier = plan_map[price_id]
            user.plan_tier = new_tier
            sub.plan_tier = new_tier

    await db.commit()


async def _handle_subscription_deleted(db: AsyncSession, data: dict) -> None:
    customer_id = data.get("customer")
    if not customer_id:
        return

    result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
    user = result.scalar_one_or_none()
    if not user:
        return

    user.plan_tier = PlanTier.free

    result2 = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result2.scalar_one_or_none()
    if sub:
        sub.status = SubscriptionStatus.cancelled

    await db.commit()
    logger.info(f"User {user.email} downgraded to free (subscription deleted)")


async def _handle_invoice_paid(db: AsyncSession, data: dict) -> None:
    customer_id = data.get("customer")
    amount = data.get("amount_paid", 0)
    currency = data.get("currency", "gbp")
    payment_intent_id = data.get("payment_intent")

    if not customer_id or not payment_intent_id:
        return

    result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
    user = result.scalar_one_or_none()

    payment = Payment(
        user_id=user.id if user else None,
        stripe_payment_intent_id=payment_intent_id,
        amount=amount,
        currency=currency,
        status="succeeded",
        metadata_json={"invoice_id": data.get("id")},
    )
    db.add(payment)
    await db.commit()


async def _handle_payment_failed(db: AsyncSession, data: dict) -> None:
    customer_id = data.get("customer")
    if not customer_id:
        return

    result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
    user = result.scalar_one_or_none()
    if not user:
        return

    # Update subscription to past_due
    result2 = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result2.scalar_one_or_none()
    if sub:
        sub.status = SubscriptionStatus.past_due
        await db.commit()

    logger.warning(f"Payment failed for user {user.email}")


@router.post("/clerk")
async def clerk_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Clerk user lifecycle events with Svix signature verification."""
    payload_bytes = await request.body()

    # Verify Svix signature
    if settings.CLERK_WEBHOOK_SECRET:
        try:
            from svix.webhooks import Webhook, WebhookVerificationError
            wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
            headers = {
                "svix-id": request.headers.get("svix-id", ""),
                "svix-timestamp": request.headers.get("svix-timestamp", ""),
                "svix-signature": request.headers.get("svix-signature", ""),
            }
            payload = wh.verify(payload_bytes, headers)
        except Exception as e:
            logger.warning(f"Clerk webhook verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    else:
        payload = json.loads(payload_bytes)
        if settings.is_production:
            raise HTTPException(status_code=503, detail="Webhook secret not configured")

    etype = payload.get("type", "")
    data = payload.get("data", {})
    logger.info(f"Clerk webhook: {etype}")

    if etype == "user.created":
        clerk_id = data.get("id")
        emails = data.get("email_addresses", [])
        email = emails[0].get("email_address", "") if emails else ""
        full_name = f"{data.get('first_name', '') or ''} {data.get('last_name', '') or ''}".strip()

        if clerk_id and email:
            existing = await db.execute(select(User).where(User.clerk_id == clerk_id))
            if not existing.scalar_one_or_none():
                is_founder = (email == settings.FOUNDER_EMAIL) or settings.FOUNDER_MODE
                user = User(
                    clerk_id=clerk_id,
                    email=email,
                    full_name=full_name or None,
                    plan_tier=PlanTier.agency if is_founder else PlanTier.free,
                    is_founder=is_founder,
                )
                db.add(user)
                await db.commit()
                logger.info(f"Provisioned user {email} (founder={is_founder})")

    elif etype == "user.updated":
        clerk_id = data.get("id")
        if clerk_id:
            result = await db.execute(select(User).where(User.clerk_id == clerk_id))
            user = result.scalar_one_or_none()
            if user:
                emails = data.get("email_addresses", [])
                if emails:
                    user.email = emails[0].get("email_address", user.email)
                full_name = f"{data.get('first_name', '') or ''} {data.get('last_name', '') or ''}".strip()
                if full_name:
                    user.full_name = full_name
                await db.commit()

    elif etype == "user.deleted":
        clerk_id = data.get("id")
        if clerk_id:
            result = await db.execute(select(User).where(User.clerk_id == clerk_id))
            user = result.scalar_one_or_none()
            if user:
                user.is_active = False
                await db.commit()
                logger.info(f"Deactivated user {user.email}")

    return {"received": True}
