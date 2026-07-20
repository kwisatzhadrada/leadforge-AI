"""LeadForge AI — Production configuration with startup validation."""
from __future__ import annotations

import sys
from functools import lru_cache
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-32-chars-minimum-please"
    FRONTEND_URL: str = "http://localhost:3000"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://leadforge:leadforge_dev@localhost:5432/leadforge"

    @field_validator("DATABASE_URL")
    @classmethod
    def _force_asyncpg_driver(cls, v: str) -> str:
        """
        Railway (and Heroku-style hosts) inject a driverless
        postgres://... or postgresql://... URL. SQLAlchemy's async engine
        needs the asyncpg driver explicit, or it falls back to psycopg2
        (not installed — this app only depends on asyncpg) and fails with
        ModuleNotFoundError at startup. Normalise regardless of source so
        a plain host-provided URL always works without manual editing.
        """
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://"):]
        if v.startswith("postgresql://"):
            v = "postgresql+asyncpg://" + v[len("postgresql://"):]
        return v

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Clerk
    CLERK_SECRET_KEY: str = ""
    CLERK_WEBHOOK_SECRET: str = ""

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_STARTER: str = ""
    STRIPE_PRICE_PRO: str = ""
    STRIPE_PRICE_AGENCY: str = ""

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # AWS / S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "eu-west-2"
    AWS_ENDPOINT_URL: Optional[str] = None
    S3_BUCKET_NAME: str = "leadforge-assets"

    # Monitoring
    SENTRY_DSN: str = ""
    POSTHOG_API_KEY: str = ""

    # Founder
    FOUNDER_MODE: bool = False
    FOUNDER_EMAIL: str = ""

    # Demo rate limiting
    DEMO_RATE_LIMIT_PER_IP_PER_DAY: int = 5

    # Plan limits (generations per month, None = unlimited)
    PLAN_LIMIT_FREE: int = 1
    PLAN_LIMIT_STARTER: int = 5
    PLAN_LIMIT_PRO: int = 25
    PLAN_LIMIT_AGENCY: Optional[int] = None

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    def get_plan_limit(self, plan: str) -> Optional[int]:
        return {
            "free":    self.PLAN_LIMIT_FREE,
            "starter": self.PLAN_LIMIT_STARTER,
            "pro":     self.PLAN_LIMIT_PRO,
            "agency":  self.PLAN_LIMIT_AGENCY,
        }.get(plan, self.PLAN_LIMIT_FREE)

    def validate_for_production(self) -> None:
        """Called at startup. Exits immediately if critical secrets are missing in production."""
        if not self.is_production:
            return

        errors = []

        if not self.ANTHROPIC_API_KEY or self.ANTHROPIC_API_KEY == "sk-ant-test-key":
            errors.append("ANTHROPIC_API_KEY is not set")

        if not self.CLERK_SECRET_KEY:
            errors.append("CLERK_SECRET_KEY is not set")

        if not self.CLERK_WEBHOOK_SECRET:
            errors.append("CLERK_WEBHOOK_SECRET is not set")

        if not self.STRIPE_SECRET_KEY:
            errors.append("STRIPE_SECRET_KEY is not set")

        if not self.STRIPE_WEBHOOK_SECRET:
            errors.append("STRIPE_WEBHOOK_SECRET is not set")

        if self.SECRET_KEY == "change-me-32-chars-minimum-please" or len(self.SECRET_KEY) < 32:
            errors.append("SECRET_KEY must be at least 32 characters and not the default value")

        if "postgresql" not in self.DATABASE_URL:
            errors.append("DATABASE_URL must use PostgreSQL in production")

        if errors:
            print("FATAL: Cannot start in production — missing required configuration:", file=sys.stderr)
            for e in errors:
                print(f"  ✗ {e}", file=sys.stderr)
            sys.exit(1)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
