"""Initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enums
    op.execute("CREATE TYPE plantier AS ENUM ('free','starter','pro','agency')")
    op.execute("CREATE TYPE subscriptionstatus AS ENUM ('active','past_due','cancelled','trialing','paused')")
    op.execute("CREATE TYPE projectstatus AS ENUM ('pending','generating','completed','failed')")
    op.execute("CREATE TYPE reportstatus AS ENUM ('pending','processing','completed','failed')")
    op.execute("CREATE TYPE servicetype AS ENUM ('plumber','electrician','roofer','builder','landscaper','cleaner','hvac','other')")
    op.execute("CREATE TYPE userrole AS ENUM ('user','admin','superadmin')")

    # users
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clerk_id", sa.String(255), unique=True, nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("plan_tier", postgresql.ENUM("free","starter","pro","agency", name="plantier", create_type=False), nullable=False, server_default="free"),
        sa.Column("reports_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("stripe_customer_id", sa.String(255)),
        sa.Column("role", postgresql.ENUM("user","admin","superadmin", name="userrole", create_type=False), nullable=False, server_default="user"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("onboarded_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # businesses
    op.create_table(
        "businesses",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("service_type", postgresql.ENUM("plumber","electrician","roofer","builder","landscaper","cleaner","hvac","other", name="servicetype", create_type=False), nullable=False),
        sa.Column("service_area", sa.String(500), nullable=False),
        sa.Column("website_url", sa.String(2000)),
        sa.Column("phone", sa.String(50)),
        sa.Column("description", sa.Text()),
        sa.Column("years_trading", sa.Integer()),
        sa.Column("team_size", sa.Integer()),
        sa.Column("avg_job_value", sa.Numeric(10, 2)),
        sa.Column("monthly_revenue_target", sa.Numeric(10, 2)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # projects
    op.create_table(
        "projects",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("business_id", sa.UUID(), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("status", postgresql.ENUM("pending","generating","completed","failed", name="projectstatus", create_type=False), nullable=False, server_default="pending"),
        sa.Column("growth_score", sa.Integer()),
        sa.Column("task_id", sa.String(255)),
        sa.Column("pdf_url", sa.Text()),
        sa.Column("pdf_expires_at", sa.DateTime(timezone=True)),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # reports
    op.create_table(
        "reports",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", sa.UUID(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("status", postgresql.ENUM("pending","processing","completed","failed", name="reportstatus", create_type=False), nullable=False, server_default="pending"),
        sa.Column("business_analysis", postgresql.JSONB()),
        sa.Column("seo_strategy", postgresql.JSONB()),
        sa.Column("content_plan", postgresql.JSONB()),
        sa.Column("lead_conversion", postgresql.JSONB()),
        sa.Column("growth_plan", postgresql.JSONB()),
        sa.Column("error_message", sa.Text()),
        sa.Column("ai_cost_usd", sa.Numeric(10, 6), server_default="0"),
        sa.Column("tokens_used", sa.Integer(), server_default="0"),
        sa.Column("generation_time_seconds", sa.Numeric(6, 2)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # campaigns
    op.create_table(
        "campaigns",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("report_id", sa.UUID(), sa.ForeignKey("reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("campaign_type", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255)),
        sa.Column("sequence_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("subject", sa.String(500)),
        sa.Column("content", sa.Text()),
        sa.Column("delay_days", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # content_assets
    op.create_table(
        "content_assets",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("report_id", sa.UUID(), sa.ForeignKey("reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("asset_type", sa.String(100), nullable=False),
        sa.Column("platform", sa.String(100)),
        sa.Column("week_number", sa.Integer()),
        sa.Column("title", sa.String(500)),
        sa.Column("content", sa.Text()),
        sa.Column("hashtags", postgresql.ARRAY(sa.String())),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # subscriptions
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("stripe_subscription_id", sa.String(255), unique=True),
        sa.Column("stripe_price_id", sa.String(255)),
        sa.Column("plan_tier", postgresql.ENUM("free","starter","pro","agency", name="plantier", create_type=False), nullable=False),
        sa.Column("status", postgresql.ENUM("active","past_due","cancelled","trialing","paused", name="subscriptionstatus", create_type=False), nullable=False),
        sa.Column("current_period_start", sa.DateTime(timezone=True)),
        sa.Column("current_period_end", sa.DateTime(timezone=True)),
        sa.Column("cancel_at_period_end", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # payments
    op.create_table(
        "payments",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("stripe_payment_intent_id", sa.String(255), unique=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="gbp"),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("metadata", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # audit_logs
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("action", sa.String(255), nullable=False),
        sa.Column("resource_type", sa.String(100)),
        sa.Column("resource_id", sa.String(255)),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("user_agent", sa.String(500)),
        sa.Column("metadata", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # api_keys
    op.create_table(
        "api_keys",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("key_hash", sa.String(255), nullable=False),
        sa.Column("prefix", sa.String(20), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True)),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # Indexes
    op.create_index("ix_users_clerk_id", "users", ["clerk_id"])
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_businesses_user_id", "businesses", ["user_id"])
    op.create_index("ix_projects_user_id", "projects", ["user_id"])
    op.create_index("ix_projects_status", "projects", ["status"])
    op.create_index("ix_reports_project_id", "reports", ["project_id"])
    op.create_index("ix_campaigns_report_id", "campaigns", ["report_id"])
    op.create_index("ix_content_assets_report_id", "content_assets", ["report_id"])
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("api_keys")
    op.drop_table("audit_logs")
    op.drop_table("payments")
    op.drop_table("subscriptions")
    op.drop_table("content_assets")
    op.drop_table("campaigns")
    op.drop_table("reports")
    op.drop_table("projects")
    op.drop_table("businesses")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS servicetype")
    op.execute("DROP TYPE IF EXISTS reportstatus")
    op.execute("DROP TYPE IF EXISTS projectstatus")
    op.execute("DROP TYPE IF EXISTS subscriptionstatus")
    op.execute("DROP TYPE IF EXISTS plantier")
