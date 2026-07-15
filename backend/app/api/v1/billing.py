"""Billing API — Stripe checkout, portal, plan management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import stripe

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User

router = APIRouter(prefix="/billing", tags=["billing"])

stripe.api_key = settings.STRIPE_SECRET_KEY

PLAN_DISPLAY = [
    {
        "id": "free",
        "name": "Free",
        "price": 0,
        "currency": "gbp",
        "interval": "month",
        "reports_per_month": 1,
        "features": ["1 growth package/month", "All 5 modules", "Copy-paste content", "Demo mode"],
        "highlight": False,
        "stripe_price_id": None,
    },
    {
        "id": "starter",
        "name": "Starter",
        "price": 29,
        "currency": "gbp",
        "interval": "month",
        "reports_per_month": 5,
        "features": ["5 growth packages/month", "All 5 modules", "Copy-paste content", "Email support"],
        "highlight": False,
        "stripe_price_id": settings.STRIPE_PRICE_STARTER or None,
    },
    {
        "id": "pro",
        "name": "Pro",
        "price": 99,
        "currency": "gbp",
        "interval": "month",
        "reports_per_month": 25,
        "features": ["25 growth packages/month", "Priority generation", "Copy-paste content", "Priority support"],
        "highlight": True,
        "stripe_price_id": settings.STRIPE_PRICE_PRO or None,
    },
    {
        "id": "agency",
        "name": "Agency",
        "price": 299,
        "currency": "gbp",
        "interval": "month",
        "reports_per_month": None,
        "features": ["Unlimited growth packages", "White-label ready", "API access", "Dedicated support"],
        "highlight": False,
        "stripe_price_id": settings.STRIPE_PRICE_AGENCY or None,
    },
]


@router.get("/plans")
async def get_plans():
    return {"plans": PLAN_DISPLAY}


@router.post("/checkout/{plan}")
async def create_checkout_session(
    plan: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan_obj = next((p for p in PLAN_DISPLAY if p["id"] == plan), None)
    if not plan_obj or plan == "free":
        raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")

    price_id = plan_obj.get("stripe_price_id")
    if not price_id:
        raise HTTPException(status_code=503, detail="Stripe not configured. Set STRIPE_PRICE_* env vars.")

    customer_id = current_user.stripe_customer_id
    if not customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.full_name or "",
            metadata={"user_id": str(current_user.id)},
        )
        customer_id = customer.id
        current_user.stripe_customer_id = customer_id
        await db.commit()

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/dashboard/billing?success=true",
        cancel_url=f"{settings.FRONTEND_URL}/dashboard/billing",
        metadata={"user_id": str(current_user.id), "plan": plan},
        allow_promotion_codes=True,
    )
    return {"checkout_url": session.url}


@router.post("/portal")
async def create_billing_portal(current_user: User = Depends(get_current_user)):
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")
    session = stripe.billing_portal.Session.create(
        customer=current_user.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/dashboard/billing",
    )
    return {"portal_url": session.url}


@router.get("/subscription")
async def get_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import select
    from app.models import Subscription

    result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = result.scalar_one_or_none()

    limit_map = {"free": 1, "starter": 5, "pro": 25, "agency": None}
    return {
        "plan_tier": current_user.plan_tier.value,
        "reports_used": current_user.generations_used,
        "reports_limit": limit_map.get(current_user.plan_tier.value, 1),
        "cancel_at_period_end": sub.cancel_at_period_end if sub else False,
        "current_period_end": sub.current_period_end.isoformat() if sub and sub.current_period_end else None,
        "status": sub.status.value if sub else "free",
    }
