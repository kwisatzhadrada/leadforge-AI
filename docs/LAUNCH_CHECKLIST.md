# LeadForge AI — Launch Checklist

Check every item before accepting paying customers.

---

## 🔑 Accounts & Keys

- [ ] Clerk application created, publishable key and secret key noted
- [ ] Clerk webhooks configured: `user.created`, `user.updated`, `user.deleted` → `https://api.yourdomain.com/api/v1/webhooks/clerk`
- [ ] Clerk webhook secret noted as `CLERK_WEBHOOK_SECRET`
- [ ] Anthropic API key created at console.anthropic.com
- [ ] Stripe account in live mode (not test mode for production)
- [ ] Stripe products created: Starter £29/mo, Pro £99/mo, Agency £299/mo
- [ ] Stripe price IDs noted: `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_AGENCY`
- [ ] Stripe webhook configured: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed` → `https://api.yourdomain.com/api/v1/webhooks/stripe`
- [ ] Stripe webhook signing secret noted as `STRIPE_WEBHOOK_SECRET`
- [ ] AWS S3 bucket created: `leadforge-reports` (or Cloudflare R2 equivalent)
- [ ] AWS IAM user created with S3 write access; keys noted
- [ ] Sentry project created; DSN noted
- [ ] PostHog project created; API key noted

---

## 🏗️ Infrastructure

- [ ] Railway project created
- [ ] `leadforge-api` service configured with `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4`
- [ ] `leadforge-worker` service configured with `celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4`
- [ ] Railway PostgreSQL plugin added
- [ ] Railway Redis plugin added
- [ ] All backend environment variables set in Railway (see `.env.example`)
- [ ] `APP_ENV=production` set
- [ ] `SECRET_KEY` set to a random 64-character string
- [ ] Migrations run: `railway run alembic upgrade head`
- [ ] Vercel project created and linked to frontend directory
- [ ] All frontend environment variables set in Vercel (see `frontend/.env.example`)
- [ ] Custom domain configured (if applicable)
- [ ] SSL/TLS active on both services

---

## ✅ Pre-launch Testing

- [ ] Visit homepage → loads correctly
- [ ] Click "Try Demo" → demo form loads
- [ ] Complete demo with "City Plumbing Solutions / plumber / Manchester"
- [ ] Generation completes within 90 seconds
- [ ] All 5 tabs (Leads, Quotes, GBP, Content, Plan) display data
- [ ] Copy button works on at least 3 items
- [ ] Upgrade banner visible on demo results page
- [ ] Sign up for a new account via Clerk
- [ ] User appears in Railway DB: `SELECT * FROM users WHERE email = 'your@email.com';`
- [ ] Complete onboarding wizard (5 steps)
- [ ] Generation dispatched; results visible on `/results/[id]`
- [ ] Billing page loads with 4 plans
- [ ] Click "Upgrade" → Stripe checkout page opens
- [ ] Complete Stripe test checkout with card `4242 4242 4242 4242`
- [ ] User plan_tier updated to `starter` in DB
- [ ] `generations_used` increments after successful generation
- [ ] Free user hitting limit sees upgrade prompt (not raw 429)
- [ ] `/founder` page accessible with founder account, shows metrics
- [ ] AI log inspector shows prompts for a founder-mode generation
- [ ] Sentry receives at least one test event
- [ ] Health endpoint returns `{"status": "ok", "redis": "ok"}`

---

## 🔒 Security

- [ ] `APP_ENV=production` confirmed
- [ ] `docs/` swagger UI not accessible at `/docs` in production
- [ ] Founder page redirects to sign-in when not authenticated
- [ ] Demo rate limit triggers after 5 runs from same IP
- [ ] Stripe webhook rejects requests without valid signature
- [ ] Clerk webhook rejects requests without valid Svix signature

---

## 📊 Monitoring

- [ ] Sentry receiving events
- [ ] PostHog receiving `signup`, `demo_started`, `generation_completed` events
- [ ] Celery Flower accessible (internal only, or behind auth)
- [ ] Log aggregation configured (Railway logs, or external)

---

## 🚀 Go-Live

- [ ] All items above checked
- [ ] Founder account created and tested
- [ ] DNS propagated (if custom domain)
- [ ] Marketing copy reviewed on homepage
- [ ] Support email set up
- [ ] **LAUNCH** 🎉
