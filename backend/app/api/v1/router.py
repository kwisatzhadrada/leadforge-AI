from fastapi import APIRouter
from app.api.v1 import generations, users, billing, webhooks, admin

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(generations.router)
api_router.include_router(users.router)
api_router.include_router(billing.router)
api_router.include_router(webhooks.router)
api_router.include_router(admin.router)
