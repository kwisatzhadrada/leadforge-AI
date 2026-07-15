"""Users API — V2."""
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models import User, PlanTier

router = APIRouter(prefix="/users", tags=["users"])


class RegisterRequest(BaseModel):
    clerk_id: str
    email: EmailStr
    full_name: str = ""


@router.post("/register", status_code=201)
async def register_user(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.clerk_id == request.clerk_id))
    if existing.scalar_one_or_none():
        return {"message": "already exists"}

    is_founder = (
        request.email == settings.FOUNDER_EMAIL
        or settings.FOUNDER_MODE
    )
    user = User(
        clerk_id=request.clerk_id,
        email=request.email,
        full_name=request.full_name,
        plan_tier=PlanTier.agency if is_founder else PlanTier.free,
        is_founder=is_founder,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"user_id": str(user.id), "message": "created"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "plan_tier": current_user.plan_tier.value if current_user.plan_tier else "free",
        "generations_used": current_user.generations_used,
        "is_founder": current_user.is_founder,
        "role": current_user.role.value if current_user.role else "user",
    }


@router.patch("/me")
async def update_me(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if "full_name" in data:
        current_user.full_name = data["full_name"]
    current_user.last_active_at = datetime.utcnow()
    await db.commit()
    return {"message": "updated"}
