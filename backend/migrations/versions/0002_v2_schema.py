"""V2 schema — revenue-first rebuild

Revision ID: 0002_v2_schema
Revises: 0001_initial_schema
Create Date: 2025-01-02 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_v2_schema"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE generationstatus AS ENUM ('pending','generating','completed','failed')")

    op.create_table(
        "generations",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("business_name", sa.String(255), nullable=False),
        sa.Column("service_type", postgresql.ENUM("plumber","electrician","roofer","builder","landscaper","cleaner","hvac","other", name="servicetype", create_type=False), nullable=False),
        sa.Column("service_area", sa.String(500), nullable=False),
        sa.Column("website_url", sa.String(2000)),
        sa.Column("phone", sa.String(50)),
        sa.Column("description", sa.Text()),
        sa.Column("years_trading", sa.Integer()),
        sa.Column("team_size", sa.Integer()),
        sa.Column("avg_job_value", sa.Numeric(10, 2)),
        sa.Column("status", postgresql.ENUM("pending","generating","completed","failed", name="generationstatus", create_type=False), nullable=False, server_default="pending"),
        sa.Column("task_id", sa.String(255)),
        sa.Column("error_message", sa.Text()),
        sa.Column("lead_opportunities", postgresql.JSONB()),
        sa.Column("quote_followup", postgresql.JSONB()),
        sa.Column("gbp_optimizer", postgresql.JSONB()),
        sa.Column("content_quickwins", postgresql.JSONB()),
        sa.Column("revenue_plan", postgresql.JSONB()),
        sa.Column("lead_score", sa.Integer()),
        sa.Column("revenue_score", sa.Integer()),
        sa.Column("gbp_score", sa.Integer()),
        sa.Column("ai_cost_usd", sa.Numeric(10, 6), server_default="0"),
        sa.Column("tokens_used", sa.Integer(), server_default="0"),
        sa.Column("generation_time_sec", sa.Numeric(6, 2)),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_founder", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("ai_logs", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "analytics_events",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("session_id", sa.String(255)),
        sa.Column("event_name", sa.String(100), nullable=False),
        sa.Column("properties", postgresql.JSONB()),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.add_column("users", sa.Column("is_founder", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("generations_used", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("last_active_at", sa.DateTime(timezone=True)))

    op.create_index("ix_generations_user_id", "generations", ["user_id"])
    op.create_index("ix_generations_status", "generations", ["status"])
    op.create_index("ix_generations_is_demo", "generations", ["is_demo"])
    op.create_index("ix_analytics_events_name", "analytics_events", ["event_name"])
    op.create_index("ix_analytics_events_created_at", "analytics_events", ["created_at"])


def downgrade() -> None:
    op.drop_table("analytics_events")
    op.drop_table("generations")
    op.drop_column("users", "last_active_at")
    op.drop_column("users", "generations_used")
    op.drop_column("users", "is_founder")
    op.execute("DROP TYPE IF EXISTS generationstatus")
