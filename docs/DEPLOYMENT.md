# LeadForge AI — Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- Node.js 20+, Python 3.12+
- Accounts: Clerk, Stripe, Anthropic, AWS/Cloudflare R2, Sentry, PostHog
- Railway or Render account (backend), Vercel account (frontend)

---

## 1. Local Development

### Clone and configure

```bash
git clone https://github.com/yourorg/leadforge.git
cd leadforge

# Backend config
cp backend/.env.example backend/.env
# Edit backend/.env with your keys

# Frontend config
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your keys
```

### Start all services

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, MinIO (local S3), the FastAPI server, Celery worker, Flower UI, and Next.js dev server.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Flower (queue) | http://localhost:5555 |
| MinIO console | http://localhost:9001 |

### Run migrations

```bash
docker compose exec api alembic upgrade head
```

### Create a MinIO bucket for local development

```bash
docker compose exec minio mc alias set local http://minio:9000 leadforge leadforge_dev
docker compose exec minio mc mb local/leadforge-reports
```

---

## 2. Third-Party Service Configuration

### Clerk

1. Create a new application at [clerk.com](https://clerk.com)
2. Set allowed redirect URLs:
   - Sign-in: `http://localhost:3000/sign-in`
   - After sign-in: `http://localhost:3000/dashboard`
3. Enable **Webhooks** → add endpoint `https://your-api.railway.app/api/v1/webhooks/clerk`
   - Subscribe to: `user.created`, `user.deleted`, `user.updated`
4. Copy `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### Stripe

1. Create products and prices in the Stripe Dashboard:

```
Product: LeadForge Starter
  Price: £29/month recurring → copy price ID → STRIPE_PRICE_STARTER

Product: LeadForge Pro
  Price: £99/month recurring → copy price ID → STRIPE_PRICE_PRO

Product: LeadForge Agency
  Price: £299/month recurring → copy price ID → STRIPE_PRICE_AGENCY
```

2. Set success/cancel URLs in Stripe Checkout:
   - Success: `https://yourdomain.com/dashboard?upgraded=true`
   - Cancel: `https://yourdomain.com/dashboard/billing`

3. Add a webhook endpoint: `https://your-api/api/v1/webhooks/stripe`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`

### AWS S3

1. Create an S3 bucket (or Cloudflare R2 bucket) named `leadforge-reports`
2. Set bucket lifecycle: expire objects after 90 days
3. Create an IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on the bucket
4. Note: Pre-signed URL expiry defaults to 7 days — adjust `PDF_URL_EXPIRY_SECONDS` in config

### Anthropic

1. Create an API key at [console.anthropic.com](https://console.anthropic.com)
2. Set rate limits appropriate for your expected volume
3. Recommended: set usage alerts at $50, $200, $500 intervals

---

## 3. Production Deployment

### Backend — Railway

1. Install Railway CLI: `curl -fsSL https://railway.app/install.sh | sh`
2. Login: `railway login`
3. Create project: `railway init`
4. Add services:
   - **leadforge-api**: root command `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4`
   - **leadforge-worker**: root command `celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4`
5. Add managed **PostgreSQL** and **Redis** plugins
6. Set all environment variables from `backend/.env.example`
7. Deploy: `railway up`

**Run migrations on first deploy:**
```bash
railway run alembic upgrade head
```

### Frontend — Vercel

```bash
cd frontend
npx vercel
```

Set environment variables in the Vercel dashboard:
- `NEXT_PUBLIC_API_URL` → your Railway API URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### Alternative: Render

For Render, create a `render.yaml`:
```yaml
services:
  - type: web
    name: leadforge-api
    runtime: docker
    dockerfilePath: docker/Dockerfile.backend
    dockerContext: .
    dockerCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - fromGroup: leadforge-production
  - type: worker
    name: leadforge-celery
    runtime: docker
    dockerfilePath: docker/Dockerfile.worker
    dockerContext: .
    envVars:
      - fromGroup: leadforge-production
```

---

## 4. Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description of change"

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# View migration history
alembic history

# Check current version
alembic current
```

Always test migrations against a staging database before running on production.

---

## 5. CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push to `main`:

1. **Backend tests** — pytest with real PostgreSQL + Redis
2. **Frontend tests** — TypeScript check, ESLint, Next.js build
3. **Docker build** — pushes images to GitHub Container Registry
4. **Deploy staging** — Railway (backend) + Vercel (frontend)
5. **Sentry release** — tags deployment for error tracking

### Required GitHub Secrets

| Secret | Where to get it |
|--------|----------------|
| `RAILWAY_TOKEN` | Railway dashboard → Account → Tokens |
| `VERCEL_TOKEN` | Vercel dashboard → Account → Tokens |
| `VERCEL_ORG_ID` | `vercel whoami` output |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after first deploy |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → Auth Tokens |
| `SENTRY_ORG` | Your Sentry organisation slug |

---

## 6. Monitoring

### Sentry

Error tracking is automatically configured via `SENTRY_DSN`. Set up:
- **Alerts**: error rate > 1% over 5 minutes
- **Performance**: P95 latency alerts
- **Cron monitors**: for Celery task health

### PostHog

Events tracked automatically:
- `sign_up`, `onboarded`
- `project_created`, `report_completed`, `report_failed`
- `pdf_downloaded`
- `plan_upgraded`, `plan_cancelled`

Build a funnel in PostHog: Sign Up → Onboard → Create Project → View Report → Upgrade

### Flower (Celery monitoring)

In production, run Flower as a separate Railway service:
```
celery -A app.tasks.celery_app flower --port=$PORT --basic_auth=admin:yourpassword
```

---

## 7. Security Checklist

Before going live:

- [ ] `SECRET_KEY` is a random 64-char string (not the example value)
- [ ] `STRIPE_WEBHOOK_SECRET` verified against Stripe dashboard
- [ ] `CLERK_WEBHOOK_SECRET` verified against Clerk dashboard
- [ ] S3 bucket is **not** public — all access via pre-signed URLs only
- [ ] Rate limiting is enabled (configured in `app/main.py` via `slowapi`)
- [ ] CORS origin is locked to your frontend domain in production
- [ ] All environment variables set (none missing from `.env.example`)
- [ ] Sentry DSN is set and receiving events
- [ ] Admin routes (`/admin/*`) are not accessible to non-admin users

---

## 8. Scaling

### Horizontal scaling (10,000+ users)

| Layer | Approach |
|-------|----------|
| API | Scale `uvicorn --workers` or add Railway replicas |
| Workers | Add more Celery worker instances (`--concurrency 8`) |
| Database | Upgrade to PgBouncer connection pooling; read replicas for analytics |
| Cache | Redis Cluster or Upstash |
| PDF generation | Offload to dedicated `pdf` Celery queue |

### Cost model at scale

At 1,000 active Pro users generating 10 reports/month each:
- 10,000 reports/month × ~$0.015 AI cost = **~$150/month in AI costs**
- Revenue: 1,000 × £99 = **£99,000 MRR**
- Gross margin on AI cost alone: **>99%**

AI cost per report scales linearly; infrastructure costs are essentially fixed until ~50,000 reports/month.

---

## 9. Troubleshooting

### Celery task stuck in PENDING

```bash
# Check worker is running
docker compose ps worker

# Check task queue depth
docker compose exec redis redis-cli llen celery

# Restart worker
docker compose restart worker
```

### PDF not generated

```bash
# Check worker logs
docker compose logs worker --tail=100

# Check S3 bucket exists and is writable
aws s3 ls s3://leadforge-reports
```

### Report status polling hangs

The frontend polls `/api/v1/projects/{id}/status` every 3 seconds. If the task is stuck:
1. Check the `projects.task_id` in the DB matches a real Celery task ID
2. Inspect via Flower: `http://localhost:5555/tasks/{task_id}`
3. Manually requeue: call `POST /api/v1/projects/{id}/retry` (admin only)

---

## 10. Project Structure

```
leadforge/
├── backend/
│   ├── app/
│   │   ├── agents/          # 5-agent AI pipeline
│   │   ├── api/v1/          # FastAPI route handlers
│   │   ├── core/            # Config, DB, Redis
│   │   ├── models/          # SQLAlchemy models
│   │   ├── services/        # PDF generator
│   │   └── tasks/           # Celery tasks
│   ├── migrations/          # Alembic migrations
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/             # Next.js App Router pages
│       │   └── dashboard/   # Authenticated pages
│       └── lib/             # API client, utilities
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── Dockerfile.worker
├── .github/workflows/ci.yml
├── docker-compose.yml
└── docker-compose.prod.yml
```
