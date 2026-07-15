"""
LeadForge V2 — Revenue-First Agent Pipeline
Five focused agents. Every output answers: "What gets me more customers?"
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
from dataclasses import dataclass
from typing import Callable, Optional

import anthropic

logger = logging.getLogger(__name__)

# claude-sonnet-4-6 pricing (per million tokens)
INPUT_COST_PER_M  = 3.00
OUTPUT_COST_PER_M = 15.00

DEMO_BUSINESSES = {
    "plumber": {
        "name": "City Plumbing Solutions",
        "service_type": "plumber",
        "service_area": "Manchester",
        "website_url": "https://cityplumbing.co.uk",
        "description": "Emergency plumbing and bathroom fitting. 15 years trading.",
        "years_trading": 15,
        "team_size": 4,
        "avg_job_value": 280,
    },
    "electrician": {
        "name": "Spark Right Electrical",
        "service_type": "electrician",
        "service_area": "Birmingham",
        "website_url": "https://sparkright.co.uk",
        "description": "Domestic and commercial electrical installations.",
        "years_trading": 8,
        "team_size": 3,
        "avg_job_value": 350,
    },
    "roofer": {
        "name": "Summit Roofing Co",
        "service_type": "roofer",
        "service_area": "Leeds",
        "website_url": "https://summitroofing.co.uk",
        "description": "Domestic roofing repairs and replacements.",
        "years_trading": 12,
        "team_size": 6,
        "avg_job_value": 1800,
    },
}


@dataclass
class AgentResult:
    data: dict
    input_tokens: int = 0
    output_tokens: int = 0

    @property
    def cost_usd(self) -> float:
        return (self.input_tokens * INPUT_COST_PER_M / 1_000_000) + \
               (self.output_tokens * OUTPUT_COST_PER_M / 1_000_000)


class LeadForgeAgentPipeline:
    """
    Five focused agents that answer one question: "What gets more customers?"
    """

    def __init__(
        self,
        business_data: dict,
        progress_callback: Optional[Callable[[str, int], None]] = None,
        is_demo: bool = False,
        founder_mode: bool = False,
        ai_log_callback: Optional[Callable[[str, str, str], None]] = None,
    ):
        self.business = business_data
        self.progress = progress_callback or (lambda msg, pct: None)
        self.is_demo = is_demo
        self.founder_mode = founder_mode
        self.ai_log = ai_log_callback  # (agent_name, prompt, response)
        self.client = anthropic.AsyncAnthropic()
        self.results: list[AgentResult] = []

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _business_context(self) -> str:
        b = self.business
        lines = [
            f"Business: {b.get('name', 'Unknown')}",
            f"Trade: {b.get('service_type', 'tradesperson')}",
            f"Service area: {b.get('service_area', 'UK')}",
        ]
        if b.get("website_url"):
            lines.append(f"Website: {b['website_url']}")
        if b.get("description"):
            lines.append(f"About: {b['description']}")
        if b.get("avg_job_value"):
            lines.append(f"Average job value: £{b['avg_job_value']}")
        if b.get("years_trading"):
            lines.append(f"Years trading: {b['years_trading']}")
        if b.get("team_size"):
            lines.append(f"Team size: {b['team_size']}")
        return "\n".join(lines)

    async def _call(self, agent_name: str, system: str, prompt: str, max_tokens: int = 2000) -> AgentResult:
        """Call Claude with retry logic and structured JSON output."""
        last_error = None
        for attempt in range(3):
            try:
                if attempt > 0:
                    await asyncio.sleep(2 ** attempt)
                    logger.warning(f"[{agent_name}] Retry {attempt}/2")

                response = await self.client.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=max_tokens,
                    system=system,
                    messages=[{"role": "user", "content": prompt}],
                )

                raw = response.content[0].text
                if self.ai_log:
                    self.ai_log(agent_name, prompt, raw)

                # Strip markdown fences if present
                clean = raw.strip()
                if clean.startswith("```"):
                    clean = clean.split("\n", 1)[1] if "\n" in clean else clean
                    clean = clean.rsplit("```", 1)[0] if "```" in clean else clean
                clean = clean.strip()

                data = json.loads(clean)
                return AgentResult(
                    data=data,
                    input_tokens=response.usage.input_tokens,
                    output_tokens=response.usage.output_tokens,
                )

            except json.JSONDecodeError as e:
                logger.error(f"[{agent_name}] JSON parse failed (attempt {attempt+1}): {e}")
                last_error = e
            except anthropic.RateLimitError:
                logger.warning(f"[{agent_name}] Rate limited, backing off")
                await asyncio.sleep(30)
                last_error = Exception("Rate limited")
            except anthropic.APIError as e:
                logger.error(f"[{agent_name}] API error: {e}")
                last_error = e

        raise RuntimeError(f"[{agent_name}] Failed after 3 attempts: {last_error}")

    # ── Agent 1: Lead Opportunity Engine ──────────────────────────────────────

    async def agent_lead_opportunities(self) -> AgentResult:
        system = """You are a local SEO and lead generation expert for UK/US tradespeople.
Return ONLY valid JSON. No markdown, no preamble, no explanation outside the JSON."""

        prompt = f"""{self._business_context()}

Generate a focused lead opportunity analysis. Return JSON:
{{
  "this_week_actions": [
    {{"priority": 1, "action": "string", "why": "string", "time_needed": "string", "expected_impact": "string"}}
  ],
  "top_keywords": [
    {{"keyword": "string", "monthly_searches": number, "difficulty": "Low|Medium|High", "opportunity": "string"}}
  ],
  "high_value_services": [
    {{"service": "string", "avg_value": number, "demand_level": "High|Medium|Low", "competition": "Low|Medium|High"}}
  ],
  "competitor_gaps": [
    {{"gap": "string", "opportunity": "string", "how_to_exploit": "string"}}
  ],
  "quick_wins": [
    {{"win": "string", "effort": "Low|Medium", "impact": "High|Medium", "do_it_today": "string"}}
  ],
  "lead_score": number
}}

Rules:
- this_week_actions: 5 items max, ranked by impact
- top_keywords: 8 items, focus on buyer-intent (emergency, near me, cost, hire)
- high_value_services: 4 items specific to their trade and area
- competitor_gaps: 3 realistic gaps a small business can exploit
- quick_wins: 5 actions doable within 48 hours
- lead_score: 0-100 rating of their current lead generation potential"""

        return await self._call("lead_opportunities", system, prompt, 2000)

    # ── Agent 2: Quote Follow-Up System ───────────────────────────────────────

    async def agent_quote_followup(self) -> AgentResult:
        system = """You are a sales conversion specialist for UK tradespeople.
Write messages that sound human, not corporate. Return ONLY valid JSON."""

        prompt = f"""{self._business_context()}

Generate a complete quote follow-up and conversion system. Return JSON:
{{
  "sms_followup": [
    {{"timing": "string", "message": "string", "purpose": "string"}}
  ],
  "email_sequence": [
    {{"day": number, "subject": "string", "body": "string", "cta": "string"}}
  ],
  "missed_quote_recovery": [
    {{"timing": "string", "channel": "SMS|Email", "message": "string"}}
  ],
  "review_requests": [
    {{"timing": "string", "channel": "SMS|Email|WhatsApp", "message": "string", "platform": "Google|Facebook|Checkatrade"}}
  ],
  "objection_handlers": [
    {{"objection": "string", "response": "string"}}
  ],
  "conversion_tips": ["string"]
}}

Rules:
- sms_followup: 4 messages (same day, day 2, day 4, day 7)
- email_sequence: 3 emails (day 1, day 3, day 7)
- missed_quote_recovery: 3 messages for quotes gone cold (2+ weeks)
- review_requests: 4 templates across different platforms
- All messages must use [CUSTOMER_NAME], [YOUR_NAME], [BUSINESS_NAME] placeholders
- SMS under 160 characters each
- Tone: professional but friendly, not salesy"""

        return await self._call("quote_followup", system, prompt, 2500)

    # ── Agent 3: Google Business Profile Optimizer ────────────────────────────

    async def agent_gbp_optimizer(self) -> AgentResult:
        system = """You are a Google Business Profile expert for local trades businesses.
Return ONLY valid JSON. Focus on actionable items, not generic advice."""

        prompt = f"""{self._business_context()}

Generate a complete Google Business Profile optimisation plan. Return JSON:
{{
  "profile_checklist": [
    {{"item": "string", "status": "Missing|Incomplete|Optimise", "action": "string", "impact": "High|Medium|Low"}}
  ],
  "weekly_posts": [
    {{"week": number, "post_type": "string", "title": "string", "content": "string", "call_to_action": "string"}}
  ],
  "review_response_templates": [
    {{"type": "5_star|4_star|negative|no_text", "template": "string"}}
  ],
  "local_ranking_opportunities": [
    {{"keyword": "string", "current_opportunity": "string", "action": "string"}}
  ],
  "categories_to_add": ["string"],
  "services_to_list": ["string"],
  "gbp_score": number,
  "priority_fix": "string"
}}

Rules:
- profile_checklist: 10 items covering all major GBP sections
- weekly_posts: 4 weeks of posts (service spotlight, tip, promotion, testimonial)
- review_response_templates: 4 templates
- local_ranking_opportunities: 5 keyword opportunities specific to their area
- All posts must be copy/paste ready, include emojis where appropriate
- gbp_score: 0-100 estimate of current GBP strength"""

        return await self._call("gbp_optimizer", system, prompt, 2500)

    # ── Agent 4: Content Quick-Wins ───────────────────────────────────────────

    async def agent_content_quickwins(self) -> AgentResult:
        system = """You are a social media manager for UK tradespeople.
Write real, copy/paste ready content. Not templates. Not placeholders. Actual posts.
Return ONLY valid JSON."""

        prompt = f"""{self._business_context()}

Generate 40 pieces of copy/paste ready content. Return JSON:
{{
  "facebook_posts": [
    {{"post": "string", "image_suggestion": "string", "best_time": "string"}}
  ],
  "google_business_posts": [
    {{"title": "string", "content": "string", "offer": "string"}}
  ],
  "review_request_messages": [
    {{"platform": "string", "message": "string"}}
  ],
  "seasonal_promotions": [
    {{"season": "string", "offer": "string", "post": "string", "sms": "string"}}
  ]
}}

Rules:
- facebook_posts: 10 posts (mix of tips, jobs completed, promotions, trust-builders)
- google_business_posts: 10 posts for GBP (service highlights, seasonal, emergency)
- review_request_messages: 10 messages across Google, Facebook, Checkatrade, Trustpilot
- seasonal_promotions: 10 promotions across all seasons/occasions
- Every piece must be written for their specific trade and service area
- No [PLACEHOLDER] brackets — write real content they can use immediately
- Facebook posts should be 2-4 sentences, conversational
- Include relevant emojis"""

        return await self._call("content_quickwins", system, prompt, 3000)

    # ── Agent 5: 90-Day Revenue Plan ──────────────────────────────────────────

    async def agent_revenue_plan(
        self,
        lead_data: dict,
        quote_data: dict,
        gbp_data: dict,
    ) -> AgentResult:
        system = """You are a business growth advisor for trades companies.
Every task must answer: "What action gets me more customers this week?"
Return ONLY valid JSON."""

        prompt = f"""{self._business_context()}

Lead score: {lead_data.get('lead_score', 50)}/100
Priority fix: {gbp_data.get('priority_fix', 'N/A')}
Top keyword opportunity: {lead_data.get('top_keywords', [{}])[0].get('keyword', 'N/A') if lead_data.get('top_keywords') else 'N/A'}

Generate a 90-day revenue growth plan. Return JSON:
{{
  "revenue_projections": {{
    "current_monthly_leads": number,
    "month_1_leads": number,
    "month_3_leads": number,
    "month_3_revenue": number,
    "assumptions": ["string"]
  }},
  "weekly_plan": [
    {{
      "week": number,
      "theme": "string",
      "tasks": [
        {{"task": "string", "time_needed": "string", "customer_impact": "string"}}
      ],
      "success_metric": "string"
    }}
  ],
  "month_1_focus": "string",
  "month_2_focus": "string",
  "month_3_focus": "string",
  "daily_habits": ["string"],
  "revenue_score": number,
  "biggest_opportunity": "string"
}}

Rules:
- weekly_plan: 12 weeks (full 90 days)
- Each week has 3-4 tasks max — keep it achievable
- Tasks must be specific to their trade and location
- daily_habits: 5 things to do every working day to get leads
- revenue_projections: realistic based on local market
- revenue_score: 0-100 rating of revenue potential
- biggest_opportunity: one sentence, the single highest-impact thing they can do"""

        return await self._call("revenue_plan", system, prompt, 3000)

    # ── Orchestrator ──────────────────────────────────────────────────────────

    async def run(self) -> dict:
        start = time.time()
        self.results = []
        errors = []

        agents = [
            ("Analysing lead opportunities", 20, "agent_lead_opportunities"),
            ("Building quote follow-up system", 40, "agent_quote_followup"),
            ("Optimising Google Business Profile", 60, "agent_gbp_optimizer"),
            ("Creating content quick-wins", 80, "agent_content_quickwins"),
        ]

        outputs = {}
        for msg, pct, method in agents:
            self.progress(msg, pct)
            try:
                result = await getattr(self, method)()
                self.results.append(result)
                outputs[method] = result.data
            except Exception as e:
                logger.error(f"[{method}] Failed: {e}", exc_info=True)
                errors.append({"agent": method, "error": str(e)})
                outputs[method] = {}

        # Agent 5 uses outputs from 1, 2, 3
        self.progress("Building 90-day revenue plan", 90)
        try:
            revenue_result = await self.agent_revenue_plan(
                lead_data=outputs.get("agent_lead_opportunities", {}),
                quote_data=outputs.get("agent_quote_followup", {}),
                gbp_data=outputs.get("agent_gbp_optimizer", {}),
            )
            self.results.append(revenue_result)
            outputs["agent_revenue_plan"] = revenue_result.data
        except Exception as e:
            logger.error(f"[agent_revenue_plan] Failed: {e}", exc_info=True)
            errors.append({"agent": "agent_revenue_plan", "error": str(e)})
            outputs["agent_revenue_plan"] = {}

        self.progress("Complete", 100)

        total_tokens = sum(r.input_tokens + r.output_tokens for r in self.results)
        total_cost = sum(r.cost_usd for r in self.results)
        elapsed = round(time.time() - start, 2)

        return {
            "lead_opportunities": outputs.get("agent_lead_opportunities", {}),
            "quote_followup": outputs.get("agent_quote_followup", {}),
            "gbp_optimizer": outputs.get("agent_gbp_optimizer", {}),
            "content_quickwins": outputs.get("agent_content_quickwins", {}),
            "revenue_plan": outputs.get("agent_revenue_plan", {}),
            "total_tokens": total_tokens,
            "total_cost_usd": total_cost,
            "generation_time_seconds": elapsed,
            "errors": errors,
            "is_demo": self.is_demo,
        }
