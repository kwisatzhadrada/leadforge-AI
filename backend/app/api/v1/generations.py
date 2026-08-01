"""V2 Generations API — with demo rate limiting and full webhook-safe generation tracking."""
from __future__ import annotations

import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_optional_user, check_generation_limit
from app.core.config import settings
from app.core.database import get_db
from app.middleware.rate_limit import check_demo_rate_limit
from app.models import Generation, GenerationStatus, ServiceType, User
from app.services.analytics import track, Events
from app.tasks.report_tasks import generate_growth_package

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generations", tags=["generations"])


class GenerationCreate(BaseModel):
    business_name: str
    service_type: ServiceType
    service_area: str
    website_url: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    years_trading: Optional[int] = None
    team_size: Optional[int] = None
    avg_job_value: Optional[float] = None
    is_demo: bool = False


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
async def create_generation(
    payload: GenerationCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    auth_result: tuple[Optional[User], Optional[str]] = Depends(get_optional_user),
):
    current_user, auth_fail_reason = auth_result
    ip = request.client.host if request.client else "unknown"

    if payload.is_demo:
        # Rate limit demo runs per IP
        await check_demo_rate_limit(request)

        gen = Generation(
            user_id=None,
            business_name=payload.business_name[:255],
            service_type=payload.service_type,
            service_area=payload.service_area[:500],
            website_url=str(payload.website_url)[:2000] if payload.website_url else None,
            description=payload.description[:2000] if payload.description else None,
            is_demo=True,
            status=GenerationStatus.pending,
        )
        db.add(gen)
        await db.commit()
        await db.refresh(gen)

        task = generate_growth_package.delay(str(gen.id), founder_mode=False)
        gen.task_id = task.id
        await db.commit()

        await track(db, Events.DEMO_STARTED, ip_address=ip, properties={
            "service_type": payload.service_type.value,
            "service_area": payload.service_area,
            "gen_id": str(gen.id),
        })
        return {"id": str(gen.id), "status": "pending"}

    # Authenticated generation
    if not current_user:
        logger.warning(f"POST /generations/ rejected — {auth_fail_reason}")
        # TEMP DEBUG: the reason is included directly in the response body
        # (visible in the browser's Network tab) rather than only in server
        # logs, which proved unreliable to retrieve during this incident.
        # Revert to a plain "Authentication required" once resolved.
        raise HTTPException(status_code=401, detail=f"Authentication required: {auth_fail_reason}")

    await check_generation_limit(current_user, db)

    is_founder = current_user.is_founder or settings.FOUNDER_MODE

    gen = Generation(
        user_id=current_user.id,
        business_name=payload.business_name[:255],
        service_type=payload.service_type,
        service_area=payload.service_area[:500],
        website_url=str(payload.website_url)[:2000] if payload.website_url else None,
        phone=payload.phone[:50] if payload.phone else None,
        description=payload.description[:2000] if payload.description else None,
        years_trading=min(payload.years_trading, 200) if payload.years_trading else None,
        team_size=min(payload.team_size, 10000) if payload.team_size else None,
        avg_job_value=min(float(payload.avg_job_value), 1_000_000) if payload.avg_job_value else None,
        is_demo=False,
        is_founder=is_founder,
        status=GenerationStatus.pending,
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)

    task = generate_growth_package.delay(str(gen.id), founder_mode=is_founder)
    gen.task_id = task.id
    await db.commit()

    await track(db, Events.GENERATION_STARTED, user_id=current_user.id, ip_address=ip, properties={
        "plan": current_user.plan_tier.value,
        "service_type": payload.service_type.value,
        "is_founder": is_founder,
        "gen_id": str(gen.id),
    })

    return {"id": str(gen.id), "status": "pending"}


@router.get("/{gen_id}/status")
async def get_status(gen_id: str, db: AsyncSession = Depends(get_db)):
    gen = await _get_gen(gen_id, db)

    if gen.status == GenerationStatus.generating and gen.task_id:
        try:
            from app.tasks.celery_app import celery_app
            task = celery_app.AsyncResult(gen.task_id)
            if task.state == "PROGRESS":
                info = task.info or {}
                return {
                    "id": gen_id,
                    "status": "generating",
                    "percent": info.get("percent", 0),
                    "message": info.get("message", "Working..."),
                }
        except Exception as e:
            logger.debug(f"Celery state check failed: {e}")

    return {
        "id": gen_id,
        "status": gen.status.value,
        "percent": 100 if gen.status == GenerationStatus.completed else 0,
        "message": None,
        "error_message": gen.error_message if gen.status == GenerationStatus.failed else None,
    }


@router.get("/{gen_id}/leads")
async def get_leads(gen_id: str, db: AsyncSession = Depends(get_db)):
    gen = await _get_completed(gen_id, db)
    return {"data": gen.lead_opportunities, "lead_score": gen.lead_score}


@router.get("/{gen_id}/quotes")
async def get_quotes(gen_id: str, db: AsyncSession = Depends(get_db)):
    gen = await _get_completed(gen_id, db)
    return {"data": gen.quote_followup}


@router.get("/{gen_id}/gbp")
async def get_gbp(gen_id: str, db: AsyncSession = Depends(get_db)):
    gen = await _get_completed(gen_id, db)
    return {"data": gen.gbp_optimizer, "gbp_score": gen.gbp_score}


@router.get("/{gen_id}/content")
async def get_content(gen_id: str, db: AsyncSession = Depends(get_db)):
    gen = await _get_completed(gen_id, db)
    return {"data": gen.content_quickwins}


@router.get("/{gen_id}/plan")
async def get_plan(gen_id: str, db: AsyncSession = Depends(get_db)):
    gen = await _get_completed(gen_id, db)
    return {"data": gen.revenue_plan, "revenue_score": gen.revenue_score}


@router.get("/{gen_id}/ai-logs")
async def get_ai_logs(
    gen_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_founder and current_user.role.value not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Founder access required")
    gen = await _get_gen(gen_id, db)
    return {"ai_logs": gen.ai_logs or [], "generation_id": gen_id}


@router.get("/{gen_id}")
async def get_full(gen_id: str, db: AsyncSession = Depends(get_db)):
    gen = await _get_completed(gen_id, db)
    return {
        "id": str(gen.id),
        "business_name": gen.business_name,
        "service_type": gen.service_type.value if gen.service_type else None,
        "service_area": gen.service_area,
        "lead_score": gen.lead_score,
        "gbp_score": gen.gbp_score,
        "revenue_score": gen.revenue_score,
        "ai_cost_usd": float(gen.ai_cost_usd or 0),
        "generation_time_sec": float(gen.generation_time_sec or 0),
        "is_demo": gen.is_demo,
        "created_at": gen.created_at.isoformat() if gen.created_at else None,
        "leads": gen.lead_opportunities,
        "quotes": gen.quote_followup,
        "gbp": gen.gbp_optimizer,
        "content": gen.content_quickwins,
        "plan": gen.revenue_plan,
    }


@router.get("/")
async def list_generations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = 1,
    limit: int = 10,
):
    limit = min(limit, 50)  # cap
    offset = (page - 1) * limit
    result = await db.execute(
        select(Generation)
        .where(Generation.user_id == current_user.id, Generation.is_demo.is_(False))
        .order_by(Generation.created_at.desc())
        .offset(offset).limit(limit)
    )
    gens = result.scalars().all()
    return {
        "generations": [
            {
                "id": str(g.id),
                "business_name": g.business_name,
                "service_type": g.service_type.value if g.service_type else None,
                "service_area": g.service_area,
                "status": g.status.value,
                "lead_score": g.lead_score,
                "revenue_score": g.revenue_score,
                "created_at": g.created_at.isoformat() if g.created_at else None,
            }
            for g in gens
        ],
        "page": page,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_gen(gen_id: str, db: AsyncSession) -> Generation:
    try:
        uid = uuid.UUID(gen_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid generation ID format")
    gen = await db.get(Generation, uid)
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    return gen


async def _get_completed(gen_id: str, db: AsyncSession) -> Generation:
    gen = await _get_gen(gen_id, db)
    if gen.status == GenerationStatus.failed:
        raise HTTPException(status_code=409, detail=f"Generation failed: {gen.error_message}")
    if gen.status != GenerationStatus.completed:
        raise HTTPException(status_code=202, detail="Generation still in progress")
    return gen
