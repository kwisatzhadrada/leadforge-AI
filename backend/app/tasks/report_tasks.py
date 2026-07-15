"""Celery tasks — async AI generation with proper connection cleanup and counter increment."""
from __future__ import annotations

import asyncio
import logging
from uuid import UUID

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()
        asyncio.set_event_loop(None)


async def _generate_async(generation_id: str, task_self, founder_mode: bool = False) -> None:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings
    from app.agents.pipeline import LeadForgeAgentPipeline
    from app.models import Generation, GenerationStatus, User

    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with AsyncSessionLocal() as db:
            gen = await db.get(Generation, UUID(generation_id))
            if not gen:
                logger.error(f"Generation {generation_id} not found in DB")
                return

            gen.status = GenerationStatus.generating
            await db.commit()

            ai_logs = []

            def ai_log_cb(agent: str, prompt: str, response: str):
                if founder_mode:
                    ai_logs.append({
                        "agent": agent,
                        "prompt": prompt[:3000],
                        "response": response[:3000],
                    })

            def progress_cb(msg: str, pct: int):
                logger.info(f"[{generation_id[:8]}] {pct}% — {msg}")
                try:
                    task_self.update_state(
                        state="PROGRESS",
                        meta={"message": msg, "percent": pct},
                    )
                except Exception:
                    pass  # update_state may not be available in all contexts

            business_data = {
                "name": gen.business_name,
                "service_type": gen.service_type.value if gen.service_type else "other",
                "service_area": gen.service_area,
                "website_url": gen.website_url,
                "description": gen.description,
                "years_trading": gen.years_trading,
                "team_size": gen.team_size,
                "avg_job_value": float(gen.avg_job_value) if gen.avg_job_value else None,
            }

            try:
                pipeline = LeadForgeAgentPipeline(
                    business_data=business_data,
                    progress_callback=progress_cb,
                    is_demo=gen.is_demo,
                    founder_mode=founder_mode,
                    ai_log_callback=ai_log_cb if founder_mode else None,
                )
                result = await pipeline.run()

                agent_errors = result.get("errors") or []
                if len(agent_errors) >= 5:
                    # Every agent failed (e.g. Anthropic outage / bad key) — the
                    # pipeline's per-agent recovery means run() never raises, so
                    # this must be checked explicitly or "completed" reports go
                    # out with entirely empty content.
                    gen.status = GenerationStatus.failed
                    gen.error_message = (
                        f"AI generation failed: {agent_errors[0].get('error', 'unknown error')}"
                    )[:2000]
                    await db.commit()
                    logger.error(f"Generation {generation_id[:8]} failed — all agents errored: {agent_errors}")
                    return

                gen.lead_opportunities = result.get("lead_opportunities") or {}
                gen.quote_followup     = result.get("quote_followup") or {}
                gen.gbp_optimizer      = result.get("gbp_optimizer") or {}
                gen.content_quickwins  = result.get("content_quickwins") or {}
                gen.revenue_plan       = result.get("revenue_plan") or {}

                # Denormalise scores for fast reads
                gen.lead_score    = int(gen.lead_opportunities.get("lead_score", 0) or 0)
                gen.gbp_score     = int(gen.gbp_optimizer.get("gbp_score", 0) or 0)
                gen.revenue_score = int(gen.revenue_plan.get("revenue_score", 0) or 0)

                gen.ai_cost_usd         = result.get("total_cost_usd", 0)
                gen.tokens_used         = result.get("total_tokens", 0)
                gen.generation_time_sec = result.get("generation_time_seconds", 0)

                if founder_mode and ai_logs:
                    gen.ai_logs = ai_logs

                gen.status = GenerationStatus.completed

                # Increment user counter
                if gen.user_id:
                    user = await db.get(User, gen.user_id)
                    if user:
                        user.generations_used = (user.generations_used or 0) + 1

                await db.commit()
                logger.info(
                    f"Generation {generation_id[:8]} completed — "
                    f"cost=${result.get('total_cost_usd', 0):.4f} "
                    f"tokens={result.get('total_tokens', 0)} "
                    f"time={result.get('generation_time_seconds', 0):.1f}s"
                    + (f" ({len(agent_errors)} agent(s) failed, partial report)" if agent_errors else "")
                )

            except Exception as e:
                logger.error(f"Generation {generation_id[:8]} pipeline failed: {e}", exc_info=True)
                gen.status = GenerationStatus.failed
                gen.error_message = str(e)[:2000]
                await db.commit()
    finally:
        await engine.dispose()


@celery_app.task(
    bind=True,
    name="app.tasks.report_tasks.generate_growth_package",
    max_retries=2,
    default_retry_delay=30,
    queue="reports",
    acks_late=True,
)
def generate_growth_package(self, generation_id: str, founder_mode: bool = False):
    """Main Celery task. Retries up to 2 times on infrastructure failures."""
    try:
        _run_async(_generate_async(generation_id, self, founder_mode))
    except Exception as exc:
        error_str = str(exc)
        logger.error(f"Task {self.request.id} failed: {error_str}", exc_info=True)
        try:
            raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))
        except self.MaxRetriesExceededError:
            # Final failure — mark in DB
            async def _mark_failed():
                from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
                from sqlalchemy.orm import sessionmaker
                from app.core.config import settings
                from app.models import Generation, GenerationStatus
                engine = create_async_engine(settings.DATABASE_URL)
                AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
                async with AsyncSessionLocal() as db:
                    gen = await db.get(Generation, UUID(generation_id))
                    if gen and gen.status != GenerationStatus.completed:
                        gen.status = GenerationStatus.failed
                        gen.error_message = f"Failed after {self.max_retries} retries: {error_str}"
                        await db.commit()
                await engine.dispose()
            _run_async(_mark_failed())
