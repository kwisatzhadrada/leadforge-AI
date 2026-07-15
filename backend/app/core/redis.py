"""Redis connection management."""
from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.logging import logger

redis_client: Optional[aioredis.Redis] = None


async def init_redis():
    """Initialize Redis connection."""
    global redis_client
    try:
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
        await redis_client.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}. Rate limiting disabled.")
        redis_client = None


async def get_redis() -> Optional[aioredis.Redis]:
    return redis_client


async def cache_set(key: str, value: str, ttl: int = 3600):
    if redis_client:
        await redis_client.setex(key, ttl, value)


async def cache_get(key: str) -> Optional[str]:
    if redis_client:
        return await redis_client.get(key)
    return None


async def cache_delete(key: str):
    if redis_client:
        await redis_client.delete(key)
