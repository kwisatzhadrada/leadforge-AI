# LeadForge AI

> AI-powered customer acquisition system for UK/US tradespeople. Enter your business details, receive a complete growth package in 60 seconds.

[![CI/CD](https://github.com/yourorg/leadforge/actions/workflows/ci.yml/badge.svg)](https://github.com/yourorg/leadforge/actions)

## What it does

A tradesperson signs up, enters their business name and trade, and within 60 seconds receives:

- **SEO audit** — local keyword targets, Google Business Profile improvements, competitor analysis
- **Content calendar** — 30 days of social posts, 30 blog ideas, 10 GBP posts
- **Email campaigns** — quote follow-up sequences, review request templates, re-engagement flows
- **90-day growth plan** — weekly action plan, revenue projections, quick wins
- **Branded PDF** — everything above as a downloadable professional report

The equivalent from a marketing agency costs £500–£2,000. LeadForge delivers it in under a minute.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Clerk |
| Backend | FastAPI (Python 3.12), SQLAlchemy async |
| Database | PostgreSQL 16 |
| Queue | Celery + Redis |
| AI | Anthropic Claude claude-sonnet-4-6 (5-agent pipeline) |
| Payments | Stripe (subscriptions + webhooks) |
| Storage | S3 / Cloudflare R2 (PDF reports) |
| Monitoring | Sentry, PostHog, Flower |

## Plans

| Plan | Price | Reports/month |
|------|-------|---------------|
| Free | £0 | 1 |
| Starter | £29/mo | 5 |
| Pro | £99/mo | 25 |
| Agency | £299/mo | Unlimited |

## Quick Start

```bash
# Clone
git clone https://github.com/yourorg/leadforge.git && cd leadforge

# Configure
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit both files with your API keys

# Start everything
docker compose up -d

# Run migrations
docker compose exec api alembic upgrade head

# Open
open http://localhost:3000
```

Full setup: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## AI Architecture

Five agents run sequentially, each building on the previous output:

```
Business Analyzer → SEO Strategist → Content Creator → Lead Conversion → Growth Planner
```

Total cost per report: ~$0.015 (claude-sonnet-4-6 at 7,500 tokens average).

## Development

```bash
# Backend tests
cd backend && pytest tests/ -v --cov=app

# Frontend type check
cd frontend && npx tsc --noEmit

# Format backend
cd backend && ruff check app/ --fix

# Run a single test
cd backend && pytest tests/unit/test_pipeline.py -v
```

## License

MIT
