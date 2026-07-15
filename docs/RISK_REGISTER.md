# LeadForge AI — Risk Register

| # | Risk | Likelihood | Impact | Mitigation | Status |
|---|------|-----------|--------|------------|--------|
| R1 | Anthropic API outage | Medium | High | 3-retry with backoff; generation fails gracefully with `status=failed`; user sees friendly error and retry button | Mitigated |
| R2 | AI cost overrun from demo abuse | Medium | High | 5 demo runs/IP/day via Redis rate limiter. Monitor via `/admin/metrics` AI cost 7d. Set Anthropic usage alerts at $50, $200 | Mitigated |
| R3 | Stripe webhook delivery failure | Low | High | Stripe retries webhooks for 72h. Idempotent handlers. User plan sync also verified on subscription endpoint. | Mitigated |
| R4 | Database connection exhaustion under load | Low | High | Pool: 10 connections + 20 overflow. Celery tasks create isolated engines that dispose on completion. PgBouncer recommended at 500+ concurrent users | Low risk at launch scale |
| R5 | Clerk outage blocking all auth | Low | High | Token cache (Redis, 5min TTL) means existing sessions survive short outages. No alternative auth fallback. | Accepted |
| R6 | Redis outage | Medium | Medium | Rate limiting fails open (traffic continues). Token cache misses fall back to live Clerk verification. Celery uses Redis as broker — Celery stops until Redis recovers. | Partially mitigated |
| R7 | AI generates harmful or inappropriate content | Low | Medium | All outputs are trade-specific business advice. Content is structured JSON, not free-form. No image generation. Low risk by nature of use case. | Low risk |
| R8 | GDPR / data protection | Medium | High | No PII beyond email and business name stored. No cookies beyond Clerk session. No third-party tracking pixels. PostHog configured with anonymised IDs. Add privacy policy before launch. | Action required |
| R9 | Celery worker failure mid-generation | Medium | Medium | `acks_late=True` — task re-queued if worker dies mid-flight. Max 2 retries. Generation marked `failed` after max retries with user-visible error. | Mitigated |
| R10 | PDF generation not connected in V2 | High | Low | PDF download is listed as a Starter+ feature but not implemented. **Do not advertise PDF download until connected.** Remove PDF references from billing page features list before launch. | Action required |
| R11 | No email notifications | High | Low | No welcome email, generation complete email, or payment receipt beyond Stripe's built-in receipts. Acceptable for launch; add Resend integration post-launch. | Accepted |
| R12 | Content quality variance | Medium | Medium | AI output quality depends on business description richness. Demo mode uses seeded businesses with known good prompts. Real users with sparse input may get generic output. Add quality scoring and re-generation option post-launch. | Accepted |
| R13 | Competitor keyword data is AI-generated | Medium | Low | Keywords and search volumes are AI estimates, not live data from Google/Ahrefs. Clear disclosure needed: "AI-estimated search volumes". Add disclaimer to keyword section. | Action required |

---

## Actions Required Before Launch

1. **Remove PDF references from billing feature lists** (R10) — do not promise what doesn't work
2. **Add privacy policy page** (R8) — legal requirement for UK/EU users
3. **Add keyword data disclaimer** (R13) — "Estimated search volumes. Verify with Google Search Console."
4. **Set Anthropic usage alerts** (R2) — 30 seconds in Anthropic console
