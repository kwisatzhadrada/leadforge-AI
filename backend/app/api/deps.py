"""
FastAPI dependencies — production-ready auth with token caching.
Dev-mode bypass active only when CLERK_SECRET_KEY is unset AND APP_ENV != production.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import cache_get, cache_set
from app.models import Generation, GenerationStatus, PlanTier, User

logger = logging.getLogger(__name__)

_CLERK_TOKEN_TTL = 300  # 5 minutes — Clerk tokens are short-lived


def _token_cache_key(token: str) -> str:
    # Never store raw tokens in Redis; store hash
    return f"clerk_token:{hashlib.sha256(token.encode()).hexdigest()[:32]}"


async def _verify_clerk_token(token: str, db: AsyncSession) -> Optional[User]:
    """Verify Clerk JWT. Caches result in Redis for 5 minutes."""
    cache_key = _token_cache_key(token)

    # Check cache first
    cached = await cache_get(cache_key)
    if cached:
        try:
            data = json.loads(cached)
            clerk_id = data.get("clerk_id")
            if clerk_id:
                result = await db.execute(select(User).where(User.clerk_id == clerk_id))
                return result.scalar_one_or_none()
        except Exception:
            pass

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                "https://api.clerk.dev/v1/tokens/verify",
                headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
                json={"token": token},
            )
        if resp.status_code != 200:
            logger.warning(f"Clerk token verification failed: {resp.status_code}")
            return None

        claims = resp.json()
        clerk_id = claims.get("sub")
        if not clerk_id:
            return None

        # Cache the clerk_id
        await cache_set(cache_key, json.dumps({"clerk_id": clerk_id}), ttl=_CLERK_TOKEN_TTL)

        result = await db.execute(select(User).where(User.clerk_id == clerk_id))
        return result.scalar_one_or_none()

    except httpx.TimeoutException:
        logger.error("Clerk token verification timed out")
        return None
    except Exception as e:
        logger.error(f"Clerk token verification error: {e}")
        return None


def _extract_bearer(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    return auth[7:] if auth.startswith("Bearer ") else None


async def _dev_user(user_id: str, db: AsyncSession) -> User:
    """Dev-mode: auto-create a founder user. Never runs in production."""
    result = await db.execute(select(User).where(User.clerk_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            clerk_id=user_id,
            email=f"{user_id}@dev.local",
            full_name="Dev User",
            plan_tier=PlanTier.agency,
            is_founder=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    # Dev bypass — ONLY when no Clerk key configured AND not in production
    if not settings.CLERK_SECRET_KEY and not settings.is_production:
        dev_id = request.headers.get("X-Dev-User-Id", "dev-founder-001")
        return await _dev_user(dev_id, db)

    token = _extract_bearer(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = await _verify_clerk_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account suspended")

    # Update last active (fire-and-forget)
    try:
        user.last_active_at = datetime.utcnow()
        await db.commit()
    except Exception:
        pass

    return user


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Returns authenticated user or None — for demo endpoints."""
    if not settings.CLERK_SECRET_KEY and not settings.is_production:
        dev_id = request.headers.get("X-Dev-User-Id")
        if dev_id:
            return await _dev_user(dev_id, db)
        return None

    token = _extract_bearer(request)
    if not token:
        return None
    return await _verify_clerk_token(token, db)


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_founder and current_user.role.value not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def check_generation_limit(user: User, db: AsyncSession) -> None:
    """Enforce monthly plan limits. Founders always pass."""
    if user.is_founder or settings.FOUNDER_MODE:
        return

    limit = settings.get_plan_limit(user.plan_tier.value)
    if limit is None:
        return  # unlimited (agency)

    first_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    from sqlalchemy import func
    result = await db.execute(
        select(func.count(Generation.id)).where(
            Generation.user_id == user.id,
            Generation.is_demo.is_(False),
            Generation.created_at >= first_of_month,
            Generation.status != GenerationStatus.failed,
        )
    )
    used = result.scalar() or 0

    if used >= limit:
        raise HTTPException(
            status_code=429,
            detail={
                "code": "LIMIT_REACHED",
                "message": f"You've used {used}/{limit} generations this month.",
                "plan": user.plan_tier.value,
                "upgrade_url": "/dashboard/billing",
            },
        )
