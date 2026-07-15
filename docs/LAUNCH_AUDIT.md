# LeadForge AI — Launch Audit
**Date:** 2025-01-01  
**Auditor:** Senior Staff Engineer  
**Codebase state:** V2 post-rebuild, pre-production

---

## Summary

| Severity | Count | Fixed in this sprint |
|----------|-------|----------------------|
| 🔴 Critical | 8 | 8 |
| 🟠 High | 11 | 11 |
| 🟡 Medium | 9 | 9 |
| 🔵 Low | 6 | 6 |

---

## 🔴 Critical Issues

**C1 — Dead V1 files still on disk, router imports them**  
`app/api/v1/projects.py` and `app/api/v1/reports.py` import deleted V1 models (`Project`, `Business`, `Report`, `Campaign`, `ContentAsset`). Router excludes them but they will crash `import *` tooling and confuse future devs. Dead code is a liability.  
_Fix: Delete both files._

**C2 — Integration tests use SQLite with PostgreSQL JSONB columns**  
`tests/conftest.py` uses `sqlite+aiosqlite:///:memory:` but models declare `JSONB` columns (PostgreSQL-specific). Every integration test ERRORs on setup. 9 of 18 tests are broken.  
_Fix: Replace conftest to use JSON for SQLite compatibility, or switch to PostgreSQL test containers._

**C3 — Pipeline result keys renamed in V2 but unit tests assert V1 keys**  
`test_pipeline_runs_all_agents` asserts `result["business_analysis"]` — V2 pipeline returns `result["lead_opportunities"]`. Tests will always fail.  
_Fix: Update test assertions to V2 keys._

**C4 — Founder page has no authentication guard**  
`/founder` page calls `/admin/metrics` but there is no middleware protecting the route. Anyone who knows the URL can view all platform metrics in production.  
_Fix: Add `auth()` guard from Clerk on the page, redirect unauthenticated users._

**C5 — Demo IP rate limiting is a comment, not code**  
`generations.py` has a comment `# Simple: count demo generations from this IP today` but implements zero rate limiting. Demo is fully open to abuse — a bot can generate 10,000 demo runs and spend thousands in AI costs overnight.  
_Fix: Implement Redis-backed IP rate limiting on demo endpoint._

**C6 — Stripe webhook does not create Subscription record on checkout.completed**  
When a user upgrades, `checkout.session.completed` updates `user.plan_tier` but never creates a `Subscription` row. `/billing/subscription` then returns null `current_period_end` and `cancel_at_period_end` is always false. Downgrades and renewals break silently.  
_Fix: Create Subscription record in webhook handler._

**C7 — Clerk webhook has no signature verification**  
`/webhooks/clerk` accepts any POST without verifying `svix-signature`. Anyone can forge user creation events and provision accounts.  
_Fix: Verify Svix signature using `CLERK_WEBHOOK_SECRET`._

**C8 — `generations_used` counter never incremented**  
`User.generations_used` is declared but no code increments it after a generation completes. Dashboard shows 0 always. Plan limits fall back to DB count query (correct) but the UI stat is permanently wrong.  
_Fix: Increment in `report_tasks.py` on completion._

---

## 🟠 High Priority Issues

**H1 — No rate limiting on any API endpoint**  
No slowapi, no Redis rate limiting, no Cloudflare rules. Every endpoint is open to brute force and abuse.  
_Fix: Add slowapi middleware with per-IP limits._

**H2 — `get_current_user` makes an external HTTP call on every request**  
Every authenticated request POSTs to `api.clerk.dev/v1/tokens/verify`. At 100 req/s this is 100 external calls/s with unbounded latency. No caching, no timeout fallback.  
_Fix: Cache verified tokens in Redis with 5-minute TTL. Add circuit breaker._

**H3 — `SECRET_KEY` has a weak default that passes startup**  
`settings.SECRET_KEY` defaults to `"change-me-32-chars-minimum-please"`. No startup validation rejects this in production. A leaked default secret compromises session security.  
_Fix: Add startup validation that rejects default/short keys in production._

**H4 — Celery task `generate_growth_package` imports `app.core.config` inside a sync function run in a new event loop — no connection pool cleanup**  
Each Celery task creates a new SQLAlchemy engine and never disposes it properly on error paths. Under concurrent workers, this leaks DB connections.  
_Fix: Ensure `engine.dispose()` is called in all code paths including exceptions._

**H5 — Dashboard `/campaigns` and `/content` pages call old V1 `/reports/` endpoints**  
Both pages still `apiFetch("/reports/...")` which no longer exists. They will 404 in production silently.  
_Fix: Remove stale pages or redirect to results view._

**H6 — Frontend `layout.tsx` body uses `bg-slate-950` (Tailwind default) conflicting with `globals.css` `--bg: #0a0a0f`**  
Visual inconsistency between marketing page and authenticated pages. Body background flashes.  
_Fix: Standardise to CSS variable throughout._

**H7 — No `middleware.ts` in Next.js — all dashboard routes are publicly accessible**  
Without Clerk's Next.js middleware, `/dashboard/*`, `/onboarding`, `/founder` are all accessible without authentication. Clerk `useAuth()` provides client-side protection only.  
_Fix: Add `middleware.ts` with Clerk `authMiddleware`._

**H8 — `ANTHROPIC_API_KEY` not validated at startup**  
App starts and serves traffic with an empty or invalid Anthropic key. First generation attempt will fail with a cryptic 401.  
_Fix: Validate required secrets on startup and refuse to start if missing._

**H9 — No `postcss.config.js` in frontend**  
Tailwind requires PostCSS. Missing config means Tailwind CSS will not compile in production builds.  
_Fix: Add `postcss.config.js`._

**H10 — No Sentry initialisation in frontend**  
`next/layout.tsx` imports nothing from Sentry. Frontend errors are invisible.  
_Fix: Add `@sentry/nextjs` instrumentation._

**H11 — `leadforge_dev.db` SQLite file committed to repo**  
A development database file is sitting in `/backend/`. Contains any test data from dev sessions.  
_Fix: Add to `.gitignore`, delete file._

---

## 🟡 Medium Priority Issues

**M1 — No database connection health check before startup completes**  
`init_db()` runs `create_all` but doesn't verify the connection. Startup succeeds even if the DB is unreachable; first request fails.

**M2 — PDF generator is V1, not connected to V2 pipeline**  
`pdf_generator.py` references old field names (`business_analysis`, `seo_strategy`, etc.). PDF download feature is broken end-to-end.

**M3 — No `CORS` origin list for production**  
`allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"]` — localhost is always allowed. Production should strip dev origins.

**M4 — `check_generation_limit` runs a `COUNT` query on every generation attempt**  
No caching. High-volume users will hammer the DB on every click.

**M5 — AI pipeline progress callback calls Celery `update_state` from inside `_generate_async` which runs in a separate event loop**  
The task state update is called correctly but `generate_growth_package.update_state` is not accessible inside `_generate_async`. Progress updates silently fail.

**M6 — No loading skeleton on results page**  
When polling and status transitions from `generating` to `done`, there's a flash of empty content before tab data loads.

**M7 — `tailwind.config.js` doesn't include all content paths**  
`content: []` is empty in the current tailwind config, meaning unused CSS is not purged. Production bundle will be ~3MB of CSS.

**M8 — No `robots.txt` or `sitemap.xml`**  
SEO basics missing for a marketing-first product.

**M9 — `axios` is in `package.json` but never used (api.ts uses `fetch`)**  
Dead dependency, adds ~40KB to bundle.

---

## 🔵 Low Priority Issues

**L1 — `@radix-ui/react-badge` does not exist as a package**  
Listed in `package.json` but Radix UI has no badge package. Will fail `npm install`.

**L2 — `date-fns` v4 is imported but never used in any component**

**L3 — Progress callback count mismatch (6 calls vs expected 5)**  
The "Complete" callback at 100% is an extra call not accounted for in tests.

**L4 — No favicon or OG image**

**L5 — Admin dashboard at `/dashboard/admin` has no nav link**  
Accessible only by direct URL.

**L6 — Demo page "custom" input does not validate service_area before submitting**
