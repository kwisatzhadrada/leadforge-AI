"""Lightweight analytics — local DB event store + optional PostHog."""
from __future__ import annotations

import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models import AnalyticsEvent

logger = logging.getLogger(__name__)


async def track(
    db: AsyncSession,
    event_name: str,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    properties: Optional[dict] = None,
) -> None:
    try:
        event = AnalyticsEvent(
            user_id=user_id,
            session_id=session_id,
            event_name=event_name,
            properties=properties or {},
            ip_address=ip_address,
        )
        db.add(event)
        await db.flush()  # Don't commit — let caller commit

        if settings.POSTHOG_API_KEY:
            try:
                import posthog
                posthog.api_key = settings.POSTHOG_API_KEY
                distinct_id = user_id or session_id or "anonymous"
                posthog.capture(distinct_id, event_name, properties or {})
            except Exception as e:
                logger.debug(f"PostHog failed: {e}")
    except Exception as e:
        logger.warning(f"Analytics track failed ({event_name}): {e}")


class Events:
    SIGNUP              = "signup"
    DEMO_STARTED        = "demo_started"
    DEMO_COMPLETED      = "demo_completed"
    GENERATION_STARTED  = "generation_started"
    GENERATION_COMPLETE = "generation_completed"
    GENERATION_FAILED   = "generation_failed"
    CONTENT_COPIED      = "content_copied"
    PLAN_UPGRADED       = "plan_upgraded"
    PLAN_CANCELLED      = "plan_cancelled"
