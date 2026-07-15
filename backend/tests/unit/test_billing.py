"""Unit tests for billing logic and plan enforcement."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestPlanLimits:
    def test_free_limit_is_one(self):
        from app.core.config import settings
        assert settings.get_plan_limit("free") == 1

    def test_starter_limit_is_five(self):
        from app.core.config import settings
        assert settings.get_plan_limit("starter") == 5

    def test_pro_limit_is_25(self):
        from app.core.config import settings
        assert settings.get_plan_limit("pro") == 25

    def test_agency_is_unlimited(self):
        from app.core.config import settings
        assert settings.get_plan_limit("agency") is None

    def test_unknown_plan_defaults_to_free(self):
        from app.core.config import settings
        assert settings.get_plan_limit("enterprise_unknown") == 1


class TestFounderBypass:
    @pytest.mark.asyncio
    async def test_founder_bypasses_limit(self):
        from app.api.deps import check_generation_limit
        from unittest.mock import MagicMock, AsyncMock

        founder_user = MagicMock()
        founder_user.is_founder = True
        founder_user.plan_tier = MagicMock(value="free")

        mock_db = AsyncMock()
        # Should not raise — founder always passes
        await check_generation_limit(founder_user, mock_db)

    @pytest.mark.asyncio
    async def test_agency_bypasses_limit(self):
        from app.api.deps import check_generation_limit
        from app.core.config import settings

        user = MagicMock()
        user.is_founder = False
        user.plan_tier = MagicMock(value="agency")

        mock_db = AsyncMock()
        with patch.object(settings, "FOUNDER_MODE", False):
            # None limit = unlimited, should not raise
            await check_generation_limit(user, mock_db)


class TestStripeWebhookHandlers:
    @pytest.mark.asyncio
    async def test_checkout_completed_upgrades_user(self):
        from app.api.v1.webhooks import _handle_checkout_completed
        from app.models import PlanTier

        user = MagicMock()
        user.id = "test-user-id"
        user.plan_tier = PlanTier.free
        user.stripe_customer_id = None

        mock_db = AsyncMock()
        mock_db.execute.return_value.scalar_one_or_none = MagicMock(return_value=user)

        data = {
            "metadata": {"user_id": "test-user-id", "plan": "pro"},
            "customer": "cus_test123",
            "subscription": None,
        }
        await _handle_checkout_completed(mock_db, data)

        assert user.plan_tier == PlanTier.pro
        assert user.stripe_customer_id == "cus_test123"
        mock_db.commit.assert_called()

    @pytest.mark.asyncio
    async def test_subscription_deleted_downgrades_to_free(self):
        from app.api.v1.webhooks import _handle_subscription_deleted
        from app.models import PlanTier, SubscriptionStatus

        user = MagicMock()
        user.plan_tier = PlanTier.pro
        sub = MagicMock()
        sub.status = SubscriptionStatus.active

        mock_db = AsyncMock()
        # First execute returns user, second returns subscription
        mock_db.execute.return_value.scalar_one_or_none = MagicMock(
            side_effect=[user, sub]
        )

        await _handle_subscription_deleted(mock_db, {"customer": "cus_test123"})

        assert user.plan_tier == PlanTier.free
        assert sub.status == SubscriptionStatus.cancelled
        mock_db.commit.assert_called()

    @pytest.mark.asyncio
    async def test_payment_failed_sets_past_due(self):
        from app.api.v1.webhooks import _handle_payment_failed
        from app.models import SubscriptionStatus

        user = MagicMock()
        sub = MagicMock()
        sub.status = SubscriptionStatus.active

        mock_db = AsyncMock()
        mock_db.execute.return_value.scalar_one_or_none = MagicMock(
            side_effect=[user, sub]
        )

        await _handle_payment_failed(mock_db, {"customer": "cus_test123"})

        assert sub.status == SubscriptionStatus.past_due
        mock_db.commit.assert_called()
