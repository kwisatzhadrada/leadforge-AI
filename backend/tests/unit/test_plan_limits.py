

PLAN_LIMITS = {
    "free": 1,
    "starter": 5,
    "pro": 25,
    "agency": None,  # unlimited
}


def get_report_limit(plan_tier: str) -> int | None:
    return PLAN_LIMITS.get(plan_tier, 1)


def can_generate_report(user_plan: str, reports_used: int) -> bool:
    limit = get_report_limit(user_plan)
    if limit is None:
        return True
    return reports_used < limit


class TestPlanLimits:
    def test_free_plan_allows_one_report(self):
        assert can_generate_report("free", 0) is True

    def test_free_plan_blocks_second_report(self):
        assert can_generate_report("free", 1) is False

    def test_starter_allows_five(self):
        assert can_generate_report("starter", 4) is True
        assert can_generate_report("starter", 5) is False

    def test_pro_allows_25(self):
        assert can_generate_report("pro", 24) is True
        assert can_generate_report("pro", 25) is False

    def test_agency_unlimited(self):
        assert can_generate_report("agency", 1000) is True

    def test_unknown_plan_treated_as_free(self):
        assert can_generate_report("unknown_plan", 0) is True
        assert can_generate_report("unknown_plan", 1) is False
