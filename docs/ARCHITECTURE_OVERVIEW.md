# LeadForge AI — Architecture Overview

## System Overview

```
Browser / Mobile
      │
      ▼
┌─────────────────┐     ┌──────────────────────┐
│  Next.js 15     │────▶│  Clerk (Auth)        │
│  Vercel Edge    │     └──────────────────────┘
│  /demo          │
│  /results/[id]  │     ┌──────────────────────┐
│  /onboarding    │────▶│  FastAPI (Python)     │
│  /dashboard/*   │     │  Railway              │
│  /founder       │     │  4 uvicorn workers    │
└─────────────────┘     └──────────┬───────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
           ┌──────────────┐  ┌─────────┐  ┌──────────┐
           │ PostgreSQL   │  │  Redis  │  │  Stripe  │
           │ Railway      │  │ Railway │  │  API     │
           └──────────────┘  └────┬────┘  └──────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Celery Worker   │
                         │  Railway         │
                         │  4 workers       │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Anthropic API   │
                         │  claude-sonnet   │
                         │  5-agent pipeline│
                         └──────────────────┘
```

## Request Flow: Generation

```
1. User submits form (onboarding or demo)
2. POST /api/v1/generations/
   ├── Auth: Clerk JWT verified (cached 5min in Redis)
   ├── Rate limit: 60 req/min (API), 5/day (demo)
   ├── Plan limit: COUNT query on generations table
   └── Generation row inserted (status=pending)
3. Celery task dispatched via Redis broker
   └── Returns task_id immediately → 202 response
4. Frontend polls GET /api/v1/generations/{id}/status every 2.5s
5. Celery worker picks up task:
   ├── Agent 1: Lead Opportunity Engine → lead_opportunities JSON
   ├── Agent 2: Quote Follow-Up System  → quote_followup JSON
   ├── Agent 3: GBP Optimizer           → gbp_optimizer JSON
   ├── Agent 4: Content Quick-Wins      → content_quickwins JSON
   └── Agent 5: Revenue Plan (uses 1-3) → revenue_plan JSON
6. All results saved to generations table
7. user.generations_used incremented
8. Status poll returns status=completed
9. Frontend loads results via GET /api/v1/generations/{id}
```

## Data Model

```
users ──────────────────────────────────────────
  id (UUID)
  clerk_id        — Clerk user identifier
  email
  plan_tier       — free | starter | pro | agency
  generations_used — monthly counter (incremented by task)
  is_founder      — bypasses all plan limits
  stripe_customer_id

generations ─────────────────────────────────────
  id (UUID)
  user_id         — NULL for demo generations
  business_name, service_type, service_area
  status          — pending | generating | completed | failed
  task_id         — Celery task ID for progress polling
  lead_opportunities  JSONB
  quote_followup      JSONB
  gbp_optimizer       JSONB
  content_quickwins   JSONB
  revenue_plan        JSONB
  lead_score, gbp_score, revenue_score  — denormalised for UI
  ai_cost_usd, tokens_used              — cost tracking
  is_demo, is_founder
  ai_logs         — JSONB, populated only for founder_mode=true

subscriptions ───────────────────────────────────
  stripe_subscription_id
  plan_tier, status, current_period_end
  cancel_at_period_end

payments ────────────────────────────────────────
  stripe_payment_intent_id, amount, currency, status

analytics_events ────────────────────────────────
  event_name, properties, session_id, user_id
```

## Security Layers

```
Request → CORS (origin whitelist)
       → Rate limit (Redis sliding window)
       → Clerk JWT verification (Redis cached 5min)
       → Plan limit check (DB COUNT)
       → Input sanitisation (string truncation, numeric bounds)
       → Response security headers (HSTS, X-Frame-Options, etc.)
```

## AI Pipeline

Each agent receives the business context plus all previous agent outputs. Agents run sequentially to allow downstream agents to refine based on earlier findings.

```
Input: { name, service_type, service_area, website_url, description, avg_job_value }
       │
       ▼
Agent 1: Lead Opportunity Engine
  Outputs: this_week_actions, top_keywords, competitor_gaps, quick_wins, lead_score
       │
       ▼
Agent 2: Quote Follow-Up System
  Outputs: sms_followup, email_sequence, missed_quote_recovery, review_requests
       │
       ▼
Agent 3: GBP Optimizer
  Outputs: profile_checklist, weekly_posts, review_response_templates, gbp_score
       │
       ▼
Agent 4: Content Quick-Wins
  Outputs: 10 facebook_posts, 10 google_business_posts, 10 review_requests, 10 seasonal_promotions
       │
       ▼
Agent 5: Revenue Plan (receives lead_score, gbp_score from agents 1+3)
  Outputs: 12-week plan, revenue_projections, daily_habits, revenue_score
```

**Cost per generation:** ~$0.015 (7,500 tokens average at claude-sonnet-4-6 rates)  
**Time per generation:** ~45–75 seconds  
**Retry policy:** 3 attempts per agent with exponential backoff

## Environment Configuration

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | PostgreSQL only in production |
| `REDIS_URL` | ✅ | Used by Celery + rate limiter + token cache |
| `ANTHROPIC_API_KEY` | ✅ | Validated at startup in production |
| `CLERK_SECRET_KEY` | ✅ | JWT verification |
| `CLERK_WEBHOOK_SECRET` | ✅ | Svix signature verification |
| `STRIPE_SECRET_KEY` | ✅ | Checkout + portal |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Payment event verification |
| `STRIPE_PRICE_STARTER/PRO/AGENCY` | ✅ | Checkout line items |
| `SECRET_KEY` | ✅ | Must be 32+ chars, not default |
| `APP_ENV` | ✅ | Set to `production` |
| `SENTRY_DSN` | ⚠️ | Strongly recommended |
| `FOUNDER_EMAIL` | ⚙️ | Grants founder role on signup |
| `FOUNDER_MODE` | ⚙️ | All users become founders (dev only) |
