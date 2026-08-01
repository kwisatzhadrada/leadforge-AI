"""
FastAPI dependencies — production-ready auth with token caching.
Dev-mode bypass active only when CLERK_SECRET_KEY is unset AND APP_ENV != production.
"""
from __future__ import annotations

import hashlib
import json
import logging
import time
from datetime import datetime
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, Request
from jose import jwt
from jose.exceptions import JOSEError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import cache_get, cache_set
from app.models import Generation, GenerationStatus, PlanTier, User

logger = logging.getLogger(__name__)

_CLERK_TOKEN_TTL = 300  # 5 minutes — Clerk tokens are short-lived
_JWKS_TTL_SECONDS = 3600  # Clerk's signing keys rotate rarely; cache in-process

_jwks_cache: dict = {"keys": [], "fetched_at": 0.0}


def _token_cache_key(token: str) -> str:
    # Never store raw tokens in Redis; store hash
    return f"clerk_token:{hashlib.sha256(token.encode()).hexdigest()[:32]}"


def _token_preview(token: str) -> str:
    """Short, non-sensitive fingerprint for logs — never the raw token."""
    return hashlib.sha256(token.encode()).hexdigest()[:12]


async def _fetch_jwks(force_refresh: bool = False) -> list[dict]:
    """
    Fetch Clerk's JSON Web Key Set for local, networkless JWT verification,
    from the standard OIDC discovery path off this instance's own issuer
    (CLERK_ISSUER, e.g. https://brave-elk-85.clerk.accounts.dev) — a public
    endpoint, no secret key needed for this call. This is the standard,
    documented pattern: verify a JWT's signature using JWKS fetched from
    {iss}/.well-known/jwks.json, and separately confirm the token's own
    "iss" claim equals your configured, trusted issuer (done in
    _verify_clerk_token) so a token can't point verification at an
    attacker-controlled issuer.

    An earlier version of this function called Clerk's Backend API
    (https://api.clerk.com/v1/jwks, secret-key authenticated) instead, and
    before that POSTed to https://api.clerk.dev/v1/tokens/verify (Clerk's
    pre-rebrand legacy domain) on every request — both replaced because
    they left every authenticated request 401ing.
    """
    now = time.time()
    if not force_refresh and _jwks_cache["keys"] and (now - _jwks_cache["fetched_at"]) < _JWKS_TTL_SECONDS:
        return _jwks_cache["keys"]

    jwks_url = f"{settings.CLERK_ISSUER}/.well-known/jwks.json"
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(jwks_url)
    resp.raise_for_status()
    keys = resp.json().get("keys", [])
    _jwks_cache["keys"] = keys
    _jwks_cache["fetched_at"] = now
    logger.info(f"Fetched Clerk JWKS from {jwks_url}: {len(keys)} key(s)")
    return keys


async def _verify_clerk_token(token: str, db: AsyncSession) -> Optional[User]:
    """Verify a Clerk session JWT locally against Clerk's JWKS, and resolve
    it to our own User row. Caches the resolved clerk_id in Redis for 5
    minutes so we don't redo signature verification on every request."""
    cache_key = _token_cache_key(token)
    preview = _token_preview(token)

    cached = await cache_get(cache_key)
    if cached:
        try:
            data = json.loads(cached)
            clerk_id = data.get("clerk_id")
            if clerk_id:
                result = await db.execute(select(User).where(User.clerk_id == clerk_id))
                user = result.scalar_one_or_none()
                if not user:
                    logger.warning(
                        f"Token {preview}: cached clerk_id={clerk_id} verified but no matching "
                        f"User row exists (Clerk webhook may not have provisioned this user yet)"
                    )
                return user
        except Exception:
            pass

    try:
        unverified_header = jwt.get_unverified_header(token)
    except JOSEError as e:
        logger.warning(f"Token {preview}: malformed JWT header — {e}")
        return None

    kid = unverified_header.get("kid")
    if not kid:
        logger.warning(f"Token {preview}: JWT header missing 'kid'")
        return None

    if not settings.CLERK_ISSUER:
        logger.error(f"Token {preview}: CLERK_ISSUER is not configured — cannot verify any token")
        return None

    try:
        keys = await _fetch_jwks()
        matching_key = next((k for k in keys if k.get("kid") == kid), None)
        if not matching_key:
            # Key may have rotated since our last fetch — refresh once and retry.
            keys = await _fetch_jwks(force_refresh=True)
            matching_key = next((k for k in keys if k.get("kid") == kid), None)
        if not matching_key:
            logger.warning(f"Token {preview}: no JWKS key found for kid={kid}")
            return None
    except httpx.HTTPStatusError as e:
        logger.error(
            f"Token {preview}: fetching Clerk JWKS failed — "
            f"{e.response.status_code} {e.response.text[:300]}"
        )
        return None
    except httpx.TimeoutException:
        logger.error(f"Token {preview}: fetching Clerk JWKS timed out")
        return None
    except Exception as e:
        logger.error(f"Token {preview}: fetching Clerk JWKS errored — {type(e).__name__}: {e}")
        return None

    try:
        claims = jwt.decode(
            token,
            matching_key,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER,
            options={
                "verify_aud": False,  # Clerk session tokens don't set aud
                "leeway": 30,  # tolerate clock skew between this host and Clerk on exp/nbf
            },
        )
    except JOSEError as e:
        logger.warning(f"Token {preview}: signature/claims verification failed — {type(e).__name__}: {e}")
        return None

    clerk_id = claims.get("sub")
    if not clerk_id:
        logger.warning(f"Token {preview}: verified JWT has no 'sub' claim")
        return None

    await cache_set(cache_key, json.dumps({"clerk_id": clerk_id}), ttl=_CLERK_TOKEN_TTL)

    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalar_one_or_none()
    if not user:
        logger.warning(
            f"Token {preview}: JWT verified OK for clerk_id={clerk_id} but no matching User row "
            f"exists — check the Clerk webhook (user.created) actually fired and was accepted"
        )
    else:
        logger.info(f"Token {preview}: verified — clerk_id={clerk_id} user_id={user.id}")
    return user


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
        has_auth_header = "Authorization" in request.headers
        logger.warning(
            f"{request.method} {request.url.path}: no bearer token — "
            f"Authorization header {'present but not Bearer-scheme' if has_auth_header else 'missing entirely'}"
        )
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user = await _verify_clerk_token(token, db)
    except Exception as e:
        logger.error(
            f"{request.method} {request.url.path}: unexpected exception in _verify_clerk_token "
            f"— {type(e).__name__}: {e}",
            exc_info=True,
        )
        user = None
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
        has_auth_header = "Authorization" in request.headers
        logger.warning(
            f"{request.method} {request.url.path}: no bearer token — "
            f"Authorization header {'present but not Bearer-scheme' if has_auth_header else 'missing entirely'}"
        )
        return None
    try:
        user = await _verify_clerk_token(token, db)
    except Exception as e:
        # _verify_clerk_token catches its own expected failure modes and
        # returns None; this is a defensive catch-all so an unexpected
        # exception here surfaces in logs instead of propagating as an
        # opaque 500, or - via FastAPI's dependency error handling -
        # potentially masking as a 401 with no explanation.
        logger.error(
            f"{request.method} {request.url.path}: unexpected exception in _verify_clerk_token "
            f"— {type(e).__name__}: {e}",
            exc_info=True,
        )
        return None
    if not user:
        logger.warning(f"{request.method} {request.url.path}: _verify_clerk_token returned no user for this token")
    return user


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
