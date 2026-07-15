"""Admin API — V2 metrics and founder tools."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_admin_user
from app.core.database import get_db
from app.models import User, Generation, GenerationStatus, AnalyticsEvent, PlanTier

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metrics")
async def get_metrics(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Users
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    new_7d = (await db.execute(select(func.count(User.id)).where(User.created_at >= week_ago))).scalar()

    # Generations
    total_gens = (await db.execute(
        select(func.count(Generation.id)).where(Generation.is_demo.is_(False))
    )).scalar()
    gens_7d = (await db.execute(
        select(func.count(Generation.id))
        .where(Generation.is_demo.is_(False), Generation.created_at >= week_ago)
    )).scalar()
    demo_total = (await db.execute(
        select(func.count(Generation.id)).where(Generation.is_demo.is_(True))
    )).scalar()
    demo_7d = (await db.execute(
        select(func.count(Generation.id))
        .where(Generation.is_demo.is_(True), Generation.created_at >= week_ago)
    )).scalar()

    # AI costs
    total_cost = (await db.execute(
        select(func.sum(Generation.ai_cost_usd)).where(Generation.status == GenerationStatus.completed)
    )).scalar() or 0
    cost_7d = (await db.execute(
        select(func.sum(Generation.ai_cost_usd))
        .where(Generation.status == GenerationStatus.completed, Generation.created_at >= week_ago)
    )).scalar() or 0
    avg_cost = float(total_cost) / max(int(total_gens or 0), 1)

    # Plan distribution
    plan_dist = {}
    for tier in PlanTier:
        count = (await db.execute(
            select(func.count(User.id)).where(User.plan_tier == tier)
        )).scalar() or 0
        plan_dist[tier.value] = count

    paid_users = sum(plan_dist.get(t, 0) for t in ("starter", "pro", "agency"))
    free_users = plan_dist.get("free", 0)
    conversion_rate = (paid_users / max(total_users or 1, 1)) * 100

    return {
        "total_users": total_users,
        "new_users_7d": new_7d,
        "total_generations": total_gens,
        "generations_7d": gens_7d,
        "demo_runs": demo_total,
        "demo_runs_7d": demo_7d,
        "total_ai_cost_usd": float(total_cost),
        "cost_7d": float(cost_7d),
        "avg_cost_per_gen": avg_cost,
        "plan_distribution": plan_dist,
        "conversion_rate": conversion_rate,
    }


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
    search: str = "",
    limit: int = 20,
    page: int = 1,
):
    q = select(User).order_by(User.created_at.desc())
    if search:
        q = q.where(User.email.ilike(f"%{search}%"))
    q = q.offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    users = result.scalars().all()
    return {
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "plan_tier": u.plan_tier.value if u.plan_tier else "free",
                "generations_used": u.generations_used,
                "is_founder": u.is_founder,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
    }
