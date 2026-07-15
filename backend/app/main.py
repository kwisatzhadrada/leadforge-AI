"""LeadForge AI V2 — Production FastAPI application."""
from __future__ import annotations

import logging
import time

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from app.core.config import settings
from app.core.logging import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

# ── Startup validation (exits if production secrets missing) ─────────────────
settings.validate_for_production()

# ── Sentry ────────────────────────────────────────────────────────────────────
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.APP_ENV,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        traces_sample_rate=0.05,
        profiles_sample_rate=0.05,
        send_default_pii=False,
    )
    logger.info("Sentry initialized")

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="LeadForge AI",
    description="AI-powered customer acquisition for tradespeople",
    version="2.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
    openapi_url="/openapi.json" if not settings.is_production else None,
)


@app.on_event("startup")
async def startup():
    from app.core.database import init_db
    from app.core.redis import init_redis
    await init_db()
    await init_redis()
    logger.info(
        f"LeadForge V2 started — env={settings.APP_ENV} "
        f"founder_mode={settings.FOUNDER_MODE} "
        f"sentry={'on' if settings.SENTRY_DSN else 'off'}"
    )


# ── CORS ──────────────────────────────────────────────────────────────────────
allowed_origins = [settings.FRONTEND_URL]
if settings.is_development:
    allowed_origins += ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Dev-User-Id", "X-Session-ID"],
    expose_headers=["X-Response-Time"],
)


# ── Middleware ─────────────────────────────────────────────────────────────────
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Response-Time"] = f"{round((time.time() - start) * 1000)}ms"
    return response


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ── Error handlers ─────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "An unexpected error occurred. Our team has been notified.",
            "code": "SERVER_ERROR",
        },
    )


# ── Routes ─────────────────────────────────────────────────────────────────────
from app.api.v1.router import api_router  # noqa: E402
app.include_router(api_router)


@app.get("/health", tags=["ops"])
async def health():
    from app.core.redis import redis_client
    redis_ok = False
    if redis_client:
        try:
            await redis_client.ping()
            redis_ok = True
        except Exception:
            pass
    return {
        "status": "ok",
        "version": "2.0.0",
        "env": settings.APP_ENV,
        "redis": "ok" if redis_ok else "unavailable",
    }
