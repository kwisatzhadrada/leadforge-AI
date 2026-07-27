# LeadForge AI — Deployment Guide (Railway + Vercel)

This guide reflects the actual codebase as verified locally: backend tests
(41/41), `ruff check`, frontend `tsc`/`eslint`/`next build`, real Postgres
migrations (`alembic upgrade head`), and the production commands below run
end-to-end against local Postgres/Redis with the actual FastAPI, Celery, and
Next.js standalone servers.

## Architecture

```
Vercel (Next.js frontend)
   │  NEXT_PUBLIC_API_URL
   ▼
Railway
   ├─ leadforge-api      (FastAPI, uvicorn --workers 4)
   ├─ leadforge-worker   (Celery, concurrency 4)
   ├─ PostgreSQL (managed plugin)
   └─ Redis (managed plugin)
```

Backend and worker share the same Postgres and Redis. The frontend never
talks to Postgres/Redis directly — everything goes through the API.

---

## 1. Prerequisites — accounts to create before you start

| Service | Why | Where |
|---|---|---|
| Railway | Hosts API + worker + Postgres + Redis | railway.app |
| Vercel | Hosts the Next.js frontend | vercel.com |
| Clerk | Auth | clerk.com |
| Stripe | Billing (live mode for real launch) | stripe.com |
| Anthropic | AI generation | console.anthropic.com |
| AWS S3 (or Cloudflare R2) | PDF report storage | — |
| Sentry (optional but recommended) | Error tracking | sentry.io |
| PostHog (optional) | Product analytics | posthog.com |

---

## 2. Backend — Railway

### 2.1 Create the project and services

```bash
railway login
railway init          # from repo root
```

Add two services from the same repo, each pointing at a different start
command (Railway builds from `docker/Dockerfile.backend` / `Dockerfile.worker`
automatically if you set the Dockerfile path, or use Nixpacks with the
commands below — either works since both Dockerfiles' `prod` stage already
run these):

- **leadforge-api**
  - Build: `docker/Dockerfile.backend`, target `prod`
  - Start command (already the image's `CMD`): `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4`
  - Healthcheck path: `/health`
- **leadforge-worker**
  - Build: `docker/Dockerfile.worker`
  - Start command (already the image's `CMD`): `celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4 -Q reports,default`

Add managed **PostgreSQL** and **Redis** plugins to the project — Railway
injects `DATABASE_URL` (plain `postgresql://`, no driver) and `REDIS_URL`
automatically. No manual override needed: `Settings.DATABASE_URL` normalises
`postgres://`/`postgresql://` to `postgresql+asyncpg://` automatically,
regardless of what's injected.

### 2.2 Environment variables

Same values on both services, except `CLERK_ISSUER` (api only — see below).

```bash
APP_ENV=production
SECRET_KEY=<random 64-char string, e.g. `openssl rand -hex 32`>
FRONTEND_URL=https://your-app.vercel.app

DATABASE_URL=${{Postgres.DATABASE_URL}}   # Railway plugin reference — plain postgresql://
                                           # is fine, Settings normalises it to +asyncpg automatically
REDIS_URL=${{Redis.REDIS_URL}}            # Railway plugin reference

CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
# Frontend API issuer for this Clerk instance — Clerk Dashboard > API Keys,
# or the "iss" claim of a decoded session JWT, e.g.
# https://brave-elk-85.clerk.accounts.dev (dev instance) or your custom
# domain in production. Required for local JWT/JWKS verification — see
# app/api/deps.py.
CLERK_ISSUER=https://your-instance.clerk.accounts.dev

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...

ANTHROPIC_API_KEY=sk-ant-...

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-2
S3_BUCKET_NAME=leadforge-reports

SENTRY_DSN=https://...@sentry.io/...
POSTHOG_API_KEY=phc_...

FOUNDER_MODE=false
FOUNDER_EMAIL=you@yourcompany.com
DEMO_RATE_LIMIT_PER_IP_PER_DAY=5
```

`app/core/config.py`'s `validate_for_production()` runs on every boot and
**exits the process immediately** (`sys.exit(1)`) if `APP_ENV=production` and
any of `ANTHROPIC_API_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`,
`CLERK_ISSUER`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` are missing, if
`SECRET_KEY` is short/default, or if `DATABASE_URL` doesn't contain
`postgresql`. This is a real, verified gate — deploys will crash-loop rather
than silently boot half-configured, which is the behaviour you want, but
don't be surprised by it if a variable is missing.

`CLERK_ISSUER` is only needed on `leadforge-api`, not `leadforge-worker` —
Celery tasks never verify a user's session token.

### 2.3 Run migrations after first deploy

```bash
railway run --service leadforge-api -- alembic upgrade head
```

This was broken in the original codebase (alembic's async engine fell back to
a driver that isn't installed) and is fixed in this branch — confirmed
working against a real Postgres instance during this pass.

### 2.4 Verify

```bash
curl https://leadforge-api.up.railway.app/health
# {"status":"ok","version":"2.0.0","env":"production","redis":"ok"}
```

`/docs` and `/openapi.json` are intentionally disabled when `APP_ENV=production`
(confirmed by test — returns 404).

---

## 3. Frontend — Vercel

Vercel auto-detects Next.js from `frontend/` — set the project root directory
to `frontend` in the Vercel dashboard (or `vercel --cwd frontend`). It builds
directly from source with `npm ci` (there's a committed `package-lock.json`),
**not** from `docker/Dockerfile.frontend` — that Dockerfile exists only for
teams who want to self-host the frontend in a container instead.

```bash
cd frontend
npx vercel link
npx vercel --prod
```

### Environment variables (Vercel dashboard → Settings → Environment Variables)

```bash
NEXT_PUBLIC_API_URL=https://leadforge-api.up.railway.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...            # needed at runtime by clerkMiddleware, not just build
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_POSTHOG_KEY=phc_...          # optional
```

`CLERK_SECRET_KEY` must be set as a **runtime** env var, not just at build
time — this was verified directly: the standalone server throws
`Missing secretKey` on every request until it's present in the running
process's environment, independent of what was baked in at build time.

### Post-deploy checks

```bash
curl -I https://your-app.vercel.app/           # 200
curl -I https://your-app.vercel.app/demo       # 200
curl -I https://your-app.vercel.app/dashboard  # redirects to /sign-in (unauthenticated)
```

---

## 4. Third-party service configuration

### Clerk
1. Create an application, switch to **production** instance for the live domain.
2. Redirect URLs: sign-in `https://your-app.vercel.app/sign-in`, after sign-in `https://your-app.vercel.app/dashboard`.
3. Webhooks → add endpoint `https://leadforge-api.up.railway.app/api/v1/webhooks/clerk`, subscribe to `user.created`, `user.updated`, `user.deleted`. Copy the signing secret into `CLERK_WEBHOOK_SECRET`.

### Stripe
1. Switch to **live mode**. Create three recurring products/prices: Starter £29/mo, Pro £99/mo, Agency £299/mo. Copy each price ID into `STRIPE_PRICE_*`.
2. Webhooks → add endpoint `https://leadforge-api.up.railway.app/api/v1/webhooks/stripe`, subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Both webhook handlers verify signatures (Svix for Clerk, Stripe's own for Stripe) — confirmed present in `app/api/v1/webhooks.py`. Unsigned/malformed requests are rejected with 400/503, not silently accepted.

### Anthropic
Create a key at console.anthropic.com. Set usage alerts (R2 in `docs/RISK_REGISTER.md` recommends $50/$200) — demo abuse is bounded by Redis rate limiting (5 runs/IP/day by default), confirmed present and wired into the demo generation endpoint.

### S3 / R2
Create a bucket, IAM user with `PutObject`/`GetObject`/`DeleteObject` scoped to it. Note: **`pdf_generator.py` is currently disconnected from the V2 pipeline** (see Known Issues below) — S3 isn't actually written to yet even though the config exists for it.

---

## 5. CI/CD

`.github/workflows/ci.yml` runs backend tests (pytest against real Postgres +
Redis service containers) and frontend checks (`tsc`, `eslint`, `next build`)
on every push/PR, then builds and pushes Docker images and deploys to Railway
+ Vercel on `main`. Required GitHub secrets: `RAILWAY_TOKEN`, `VERCEL_TOKEN`,
`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`
(Sentry step is optional if you don't set `SENTRY_DSN`).

---

## 6. Known issues carried into this deployment

These are pre-existing gaps not fixed in this pass because they're feature
work or need a product decision, not stability fixes:

- **PDF export is not wired to the V2 pipeline** (`app/services/pdf_generator.py`
  expects V1 field names and nothing calls it — no code path invokes it at
  all). `docs/RISK_REGISTER.md` (R10) already flagged removing the "PDF
  export" claim from billing plan feature lists as required-before-launch;
  that text edit is done in this pass (`app/api/v1/billing.py`). Actually
  implementing PDF export against the V2 data shape is still open — it's
  feature work, out of scope here.
- Legacy V1 SQLAlchemy models (`Project`, `Business`, `Report`, `Campaign`,
  `ContentAsset`) are still declared in `app/models/__init__.py` and get
  migrated as empty tables. Harmless but dead.
- `docker-compose.prod.yml` (Swarm-style, nginx + TLS) references
  `docker/nginx.conf` and `docker/ssl/`, neither of which exist in the repo.
  It's an alternate self-hosted path, unused by the Railway+Vercel deploy
  described here — fix it only if you actually intend to self-host.
- Partial AI-generation failures (1-4 of 5 agents fail) still produce a
  `completed` report with blank sections for the failed agents, with no
  indication to the user which sections failed. Only *total* failure (all 5)
  is now caught and marked `failed` — see the "Verified end-to-end" commit
  for why that specific case matters most (it's what a bad/expired API key
  or a full Anthropic outage looks like).

---

## 7. Troubleshooting

**Backend crash-loops on boot in Railway** — check `validate_for_production()`'s
stderr output in the deploy logs; it prints exactly which env var is missing.

**Celery task stuck in `pending`** — worker isn't running or can't reach
Redis. Check `leadforge-worker` logs; confirm `REDIS_URL` matches between
api and worker services.

**Generation completes but all 5 tabs are empty** — check the worker logs for
`API error` from Anthropic (wrong/expired key, or Anthropic outage). As of
this pass a *total* failure now surfaces as `status=failed` with a real error
message instead of a blank "completed" report — if you still see this,
you're on an older build.

**`/dashboard` returns a raw 404 instead of redirecting to sign-in** — this
happens when Clerk's publishable key doesn't correspond to a real Clerk
instance (its dev-mode handshake redirect has nowhere valid to go). Confirm
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are both real,
matching keys from the same Clerk application.
