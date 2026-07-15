"""LeadForge V2 Models — Revenue-first rebuild."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey,
    Integer, Numeric, String, Text, func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ── Enums ─────────────────────────────────────────────────────────────────────

class PlanTier(str, enum.Enum):
    free    = "free"
    starter = "starter"
    pro     = "pro"
    agency  = "agency"

class UserRole(str, enum.Enum):
    user       = "user"
    admin      = "admin"
    superadmin = "superadmin"

class GenerationStatus(str, enum.Enum):
    pending    = "pending"
    generating = "generating"
    completed  = "completed"
    failed     = "failed"

class ServiceType(str, enum.Enum):
    plumber     = "plumber"
    electrician = "electrician"
    roofer      = "roofer"
    builder     = "builder"
    landscaper  = "landscaper"
    cleaner     = "cleaner"
    hvac        = "hvac"
    other       = "other"

class SubscriptionStatus(str, enum.Enum):
    active     = "active"
    past_due   = "past_due"
    cancelled  = "cancelled"
    trialing   = "trialing"
    paused     = "paused"


# ── Models ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id          = Column(String(255), unique=True, nullable=True)   # null for demo users
    email             = Column(String(255), unique=True, nullable=False)
    full_name         = Column(String(255))
    plan_tier         = Column(Enum(PlanTier), nullable=False, default=PlanTier.free)
    role              = Column(Enum(UserRole), nullable=False, default=UserRole.user)
    is_active         = Column(Boolean, nullable=False, default=True)
    is_founder        = Column(Boolean, nullable=False, default=False)   # bypass billing
    stripe_customer_id = Column(String(255))
    generations_used  = Column(Integer, nullable=False, default=0)
    onboarded_at      = Column(DateTime(timezone=True))
    last_active_at    = Column(DateTime(timezone=True))
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    updated_at        = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    generations   = relationship("Generation", back_populates="user", cascade="all, delete-orphan")
    subscription  = relationship("Subscription", back_populates="user", uselist=False)


class Generation(Base):
    """Core entity — one growth package per business/session."""
    __tablename__ = "generations"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # null = demo
    business_name = Column(String(255), nullable=False)
    service_type  = Column(Enum(ServiceType), nullable=False)
    service_area  = Column(String(500), nullable=False)
    website_url   = Column(String(2000))
    phone         = Column(String(50))
    description   = Column(Text)
    years_trading = Column(Integer)
    team_size     = Column(Integer)
    avg_job_value = Column(Numeric(10, 2))

    # Status
    status        = Column(Enum(GenerationStatus), nullable=False, default=GenerationStatus.pending)
    task_id       = Column(String(255))
    error_message = Column(Text)

    # Results (V2 modules)
    lead_opportunities  = Column(JSONB)
    quote_followup      = Column(JSONB)
    gbp_optimizer       = Column(JSONB)
    content_quickwins   = Column(JSONB)
    revenue_plan        = Column(JSONB)

    # Derived scores (denormalised for quick reads)
    lead_score          = Column(Integer)
    revenue_score       = Column(Integer)
    gbp_score           = Column(Integer)

    # Costs
    ai_cost_usd         = Column(Numeric(10, 6), default=0)
    tokens_used         = Column(Integer, default=0)
    generation_time_sec = Column(Numeric(6, 2))

    # Flags
    is_demo             = Column(Boolean, nullable=False, default=False)
    is_founder          = Column(Boolean, nullable=False, default=False)
    ai_logs             = Column(JSONB)   # founder_mode prompt/response pairs

    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="generations")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id                     = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id                = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    stripe_subscription_id = Column(String(255), unique=True)
    stripe_price_id        = Column(String(255))
    plan_tier              = Column(Enum(PlanTier), nullable=False)
    status                 = Column(Enum(SubscriptionStatus), nullable=False)
    current_period_start   = Column(DateTime(timezone=True))
    current_period_end     = Column(DateTime(timezone=True))
    cancel_at_period_end   = Column(Boolean, default=False)
    created_at             = Column(DateTime(timezone=True), server_default=func.now())
    updated_at             = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="subscription")


class Payment(Base):
    __tablename__ = "payments"

    id                       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id                  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    stripe_payment_intent_id = Column(String(255), unique=True)
    amount                   = Column(Integer, nullable=False)
    currency                 = Column(String(3), nullable=False, default="gbp")
    status                   = Column(String(50), nullable=False)
    metadata_json            = Column(JSONB)
    created_at               = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    action        = Column(String(255), nullable=False)
    resource_type = Column(String(100))
    resource_id   = Column(String(255))
    ip_address    = Column(String(45))
    metadata_json = Column(JSONB)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())


class AnalyticsEvent(Base):
    """Lightweight event store for product analytics."""
    __tablename__ = "analytics_events"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_id    = Column(String(255))   # for anonymous/demo tracking
    event_name    = Column(String(100), nullable=False)
    properties    = Column(JSONB)
    ip_address    = Column(String(45))
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
