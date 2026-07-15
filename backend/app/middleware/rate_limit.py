"""Redis-backed rate limiting middleware."""
from __future__ import annotations

import logging
import time
from typing import Optional

from fastapi import Request, HTTPException
from app.core.redis import redis_client

logger = logging.getLogger(__name__)


async def check_rate_limit(
    request: Request,
    key_prefix: str,
    limit: int,
    window_seconds: int,
    identifier: Optional[str] = None,
) -> None:
    """
    Sliding window rate limiter using Redis.
    Raises HTTP 429 if limit exceeded.
    Silently passes if Redis is unavailable (fail-open for availability).
    """
    if redis_client is None:
        return  # Redis down — fail open

    ip = identifier or (request.client.host if request.client else "unknown")
    window = int(time.time()) // window_seconds
    key = f"rl:{key_prefix}:{ip}:{window}"

    try:
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds * 2)
        results = await pipe.execute()
        count = results[0]

        if count > limit:
            raise HTTPException(
                status_code=429,
                detail={
                    "code": "RATE_LIMITED",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": window_seconds - (int(time.time()) % window_seconds),
                },
                headers={"Retry-After": str(window_seconds)},
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Rate limit check failed: {e}")


async def check_demo_rate_limit(request: Request) -> None:
    """5 demo runs per IP per day."""
    from app.core.config import settings
    await check_rate_limit(
        request=request,
        key_prefix="demo",
        limit=settings.DEMO_RATE_LIMIT_PER_IP_PER_DAY,
        window_seconds=86400,  # 24h window
    )


async def check_api_rate_limit(request: Request) -> None:
    """General API: 60 requests per minute per IP."""
    await check_rate_limit(
        request=request,
        key_prefix="api",
        limit=60,
        window_seconds=60,
    )


async def check_auth_rate_limit(request: Request) -> None:
    """Auth endpoints: 10 attempts per 15 minutes."""
    await check_rate_limit(
        request=request,
        key_prefix="auth",
        limit=10,
        window_seconds=900,
    )
