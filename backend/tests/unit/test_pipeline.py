"""Unit tests for the V2 agent pipeline."""
import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch

from app.agents.pipeline import LeadForgeAgentPipeline


def make_mock_response(data: dict, input_tokens: int = 1000, output_tokens: int = 500):
    mock = MagicMock()
    mock.content = [MagicMock(text=json.dumps(data))]
    mock.usage = MagicMock(input_tokens=input_tokens, output_tokens=output_tokens)
    return mock


MOCK_LEADS = {
    "this_week_actions": [{"priority": 1, "action": "Set up GBP", "why": "Free leads", "time_needed": "1h", "expected_impact": "+5 calls/week"}],
    "top_keywords": [{"keyword": "emergency plumber Manchester", "monthly_searches": 2400, "difficulty": "Medium", "opportunity": "High buyer intent"}],
    "high_value_services": [{"service": "Boiler repair", "avg_value": 350, "demand_level": "High", "competition": "Medium"}],
    "competitor_gaps": [{"gap": "No 24/7 service", "opportunity": "Offer emergency cover", "how_to_exploit": "Add to GBP"}],
    "quick_wins": [{"win": "Add 10 photos to GBP", "effort": "Low", "impact": "High", "do_it_today": "Upload job photos"}],
    "lead_score": 42,
}

MOCK_QUOTES = {
    "sms_followup": [{"timing": "Same day", "message": "Hi [CUSTOMER_NAME], thanks for your enquiry...", "purpose": "Initial contact"}],
    "email_sequence": [{"day": 1, "subject": "Your quote from City Plumbing", "body": "Dear [CUSTOMER_NAME]...", "cta": "Reply to book"}],
    "missed_quote_recovery": [{"timing": "2 weeks", "channel": "SMS", "message": "Still looking for a plumber?"}],
    "review_requests": [{"timing": "After job", "channel": "SMS", "message": "Would you leave us a review?", "platform": "Google"}],
    "objection_handlers": [{"objection": "Too expensive", "response": "We offer flexible payment"}],
    "conversion_tips": ["Follow up within 1 hour"],
}

MOCK_GBP = {
    "profile_checklist": [{"item": "Business description", "status": "Missing", "action": "Write 750 char description", "impact": "High"}],
    "weekly_posts": [{"week": 1, "post_type": "Service spotlight", "title": "Emergency Plumber Available 24/7", "content": "...", "call_to_action": "Call now"}],
    "review_response_templates": [{"type": "5_star", "template": "Thank you so much for the kind words!"}],
    "local_ranking_opportunities": [{"keyword": "plumber Manchester", "current_opportunity": "Ranking #8", "action": "Add location pages"}],
    "categories_to_add": ["Emergency Plumber"],
    "services_to_list": ["Boiler repair", "Leak detection"],
    "gbp_score": 35,
    "priority_fix": "Add business description",
}

MOCK_CONTENT = {
    "facebook_posts": [{"post": "🔧 Did you know a dripping tap wastes 15 litres a day? Call us!", "image_suggestion": "Dripping tap photo", "best_time": "Tuesday 7pm"}],
    "google_business_posts": [{"title": "Emergency Plumber Manchester", "content": "Available 24/7 for all plumbing emergencies.", "offer": "Free call-out"}],
    "review_request_messages": [{"platform": "Google", "message": "Would you mind leaving us a Google review?"}],
    "seasonal_promotions": [{"season": "Winter", "offer": "Boiler health check £49", "post": "❄️ Winter special...", "sms": "Boiler check offer"}],
}

MOCK_PLAN = {
    "revenue_projections": {"current_monthly_leads": 5, "month_1_leads": 8, "month_3_leads": 15, "month_3_revenue": 5250, "assumptions": ["Average job value £350"]},
    "weekly_plan": [{"week": 1, "theme": "GBP Optimisation", "tasks": [{"task": "Complete GBP profile", "time_needed": "2h", "customer_impact": "More calls"}], "success_metric": "GBP fully complete"}],
    "month_1_focus": "Get found on Google",
    "month_2_focus": "Convert more enquiries",
    "month_3_focus": "Scale what works",
    "daily_habits": ["Check and respond to GBP reviews", "Follow up all quotes within 24h"],
    "revenue_score": 62,
    "biggest_opportunity": "Optimise your Google Business Profile — currently leaving 60% of local searches on the table.",
}


@pytest.mark.asyncio
async def test_pipeline_returns_all_five_modules():
    """V2: pipeline result must contain all 5 module keys."""
    business_data = {
        "name": "City Plumbing",
        "service_type": "plumber",
        "service_area": "Manchester",
    }
    responses = [
        make_mock_response(MOCK_LEADS),
        make_mock_response(MOCK_QUOTES),
        make_mock_response(MOCK_GBP),
        make_mock_response(MOCK_CONTENT),
        make_mock_response(MOCK_PLAN),
    ]
    with patch("app.agents.pipeline.anthropic.AsyncAnthropic") as MockClient:
        MockClient.return_value.messages.create = AsyncMock(side_effect=responses)
        pipeline = LeadForgeAgentPipeline(business_data)
        result = await pipeline.run()

    assert result["lead_opportunities"]["lead_score"] == 42
    assert result["gbp_optimizer"]["gbp_score"] == 35
    assert result["revenue_plan"]["revenue_score"] == 62
    assert result["content_quickwins"]["facebook_posts"][0]["post"].startswith("🔧")
    assert len(result["quote_followup"]["sms_followup"]) == 1


@pytest.mark.asyncio
async def test_pipeline_cost_calculation():
    """Token cost must be calculated correctly at claude-sonnet-4-6 rates."""
    business_data = {"name": "Test", "service_type": "electrician", "service_area": "Leeds"}
    responses = [make_mock_response(d) for d in [MOCK_LEADS, MOCK_QUOTES, MOCK_GBP, MOCK_CONTENT, MOCK_PLAN]]

    with patch("app.agents.pipeline.anthropic.AsyncAnthropic") as MockClient:
        MockClient.return_value.messages.create = AsyncMock(side_effect=responses)
        result = await LeadForgeAgentPipeline(business_data).run()

    # 5 agents × 1000 input tokens × $3/M + 5 × 500 output × $15/M
    expected = (5 * 1000 * 3 / 1_000_000) + (5 * 500 * 15 / 1_000_000)
    assert abs(result["total_cost_usd"] - expected) < 0.0001
    assert result["total_tokens"] == 7500


@pytest.mark.asyncio
async def test_pipeline_progress_callback():
    """Should emit exactly 6 progress calls (5 agents + final 100%)."""
    business_data = {"name": "Test", "service_type": "roofer", "service_area": "Leeds"}
    calls = []
    responses = [make_mock_response(d) for d in [MOCK_LEADS, MOCK_QUOTES, MOCK_GBP, MOCK_CONTENT, MOCK_PLAN]]

    with patch("app.agents.pipeline.anthropic.AsyncAnthropic") as MockClient:
        MockClient.return_value.messages.create = AsyncMock(side_effect=responses)
        await LeadForgeAgentPipeline(business_data, progress_callback=lambda m, p: calls.append(p)).run()

    assert len(calls) == 6
    assert calls[-1] == 100
    assert calls[0] < calls[-1]


@pytest.mark.asyncio
async def test_pipeline_handles_partial_failure():
    """If one agent fails, result should still have other modules and record the error."""
    business_data = {"name": "Test", "service_type": "builder", "service_area": "London"}
    responses = [
        make_mock_response(MOCK_LEADS),
        Exception("API timeout"),  # quotes agent fails
        make_mock_response(MOCK_GBP),
        make_mock_response(MOCK_CONTENT),
        make_mock_response(MOCK_PLAN),
    ]

    async def side_effect(*args, **kwargs):
        r = responses.pop(0)
        if isinstance(r, Exception):
            raise r
        return r

    with patch("app.agents.pipeline.anthropic.AsyncAnthropic") as MockClient:
        MockClient.return_value.messages.create = AsyncMock(side_effect=side_effect)
        result = await LeadForgeAgentPipeline(business_data).run()

    # Other modules should still have data
    assert result["lead_opportunities"].get("lead_score") == 42
    assert result["quote_followup"] == {}  # failed
    assert len(result["errors"]) >= 1


@pytest.mark.asyncio
async def test_pipeline_json_fence_stripping():
    """Pipeline must strip markdown code fences from AI responses."""
    business_data = {"name": "Test", "service_type": "cleaner", "service_area": "Bristol"}
    fenced = f"```json\n{json.dumps(MOCK_LEADS)}\n```"

    mock = MagicMock()
    mock.content = [MagicMock(text=fenced)]
    mock.usage = MagicMock(input_tokens=500, output_tokens=200)

    responses = [mock] + [make_mock_response(d) for d in [MOCK_QUOTES, MOCK_GBP, MOCK_CONTENT, MOCK_PLAN]]

    with patch("app.agents.pipeline.anthropic.AsyncAnthropic") as MockClient:
        MockClient.return_value.messages.create = AsyncMock(side_effect=responses)
        result = await LeadForgeAgentPipeline(business_data).run()

    assert result["lead_opportunities"]["lead_score"] == 42
