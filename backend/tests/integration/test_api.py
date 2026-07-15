"""Integration tests for V2 API endpoints."""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


class TestHealth:
    async def test_health_endpoint(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["version"] == "2.0.0"


class TestGenerationsAPI:
    async def test_list_generations_returns_empty(self, client: AsyncClient):
        resp = await client.get("/api/v1/generations/")
        assert resp.status_code == 200
        assert resp.json()["generations"] == []

    async def test_create_generation_dispatches_task(self, client: AsyncClient):
        payload = {
            "business_name": "Test Plumbing",
            "service_type": "plumber",
            "service_area": "Manchester",
            "is_demo": False,
        }
        with patch("app.api.v1.generations.generate_growth_package") as mock_task:
            mock_task.delay.return_value = MagicMock(id="task-abc-123")
            resp = await client.post("/api/v1/generations/", json=payload)

        assert resp.status_code == 202
        data = resp.json()
        assert data["status"] == "pending"
        assert "id" in data
        mock_task.delay.assert_called_once()

    async def test_create_demo_generation(self, anon_client: AsyncClient):
        payload = {
            "business_name": "Demo Plumbing",
            "service_type": "plumber",
            "service_area": "Leeds",
            "is_demo": True,
        }
        with patch("app.api.v1.generations.generate_growth_package") as mock_task, \
             patch("app.api.v1.generations.check_demo_rate_limit", new_callable=AsyncMock):
            mock_task.delay.return_value = MagicMock(id="task-demo-456")
            resp = await anon_client.post("/api/v1/generations/", json=payload)

        assert resp.status_code == 202

    async def test_get_status_not_found(self, client: AsyncClient):
        resp = await client.get("/api/v1/generations/00000000-0000-0000-0000-000000000000/status")
        assert resp.status_code == 404

    async def test_get_generation_not_found(self, client: AsyncClient):
        resp = await client.get("/api/v1/generations/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    async def test_invalid_service_type_rejected(self, client: AsyncClient):
        payload = {
            "business_name": "Test",
            "service_type": "wizard",
            "service_area": "London",
        }
        resp = await client.post("/api/v1/generations/", json=payload)
        assert resp.status_code == 422

    async def test_missing_required_fields_rejected(self, client: AsyncClient):
        resp = await client.post("/api/v1/generations/", json={"service_type": "plumber"})
        assert resp.status_code == 422

    async def test_invalid_uuid_returns_422(self, client: AsyncClient):
        resp = await client.get("/api/v1/generations/not-a-uuid/status")
        assert resp.status_code in (404, 422)


class TestBillingAPI:
    async def test_get_plans(self, client: AsyncClient):
        resp = await client.get("/api/v1/billing/plans")
        assert resp.status_code == 200
        plans = resp.json()["plans"]
        assert len(plans) == 4
        ids = [p["id"] for p in plans]
        assert set(ids) == {"free", "starter", "pro", "agency"}

    async def test_plans_have_required_fields(self, client: AsyncClient):
        resp = await client.get("/api/v1/billing/plans")
        for plan in resp.json()["plans"]:
            assert "id" in plan
            assert "price" in plan
            assert "features" in plan
            assert isinstance(plan["features"], list)

    async def test_checkout_invalid_plan(self, client: AsyncClient):
        resp = await client.post("/api/v1/billing/checkout/invalid_plan")
        assert resp.status_code in (400, 422, 503)

    async def test_checkout_free_plan_rejected(self, client: AsyncClient):
        resp = await client.post("/api/v1/billing/checkout/free")
        assert resp.status_code == 400

    async def test_get_subscription(self, client: AsyncClient):
        resp = await client.get("/api/v1/billing/subscription")
        assert resp.status_code == 200
        data = resp.json()
        assert "plan_tier" in data
        assert "reports_used" in data


class TestUsersAPI:
    async def test_get_me(self, client: AsyncClient):
        resp = await client.get("/api/v1/users/me")
        assert resp.status_code == 200
        data = resp.json()
        assert "email" in data
        assert "plan_tier" in data
        assert "generations_used" in data

    async def test_register_user(self, client: AsyncClient):
        payload = {
            "clerk_id": "clerk_test_new_user",
            "email": "newuser@test.com",
            "full_name": "New User",
        }
        resp = await client.post("/api/v1/users/register", json=payload)
        assert resp.status_code in (200, 201)


class TestWebhooksAPI:
    async def test_stripe_webhook_invalid_payload(self, anon_client: AsyncClient):
        """Webhook with no secret configured should parse raw JSON."""
        resp = await anon_client.post(
            "/api/v1/webhooks/stripe",
            json={"type": "unknown.event", "data": {"object": {}}},
        )
        # Should succeed (returns received: true for unknown events)
        assert resp.status_code == 200

    async def test_clerk_webhook_user_created(self, anon_client: AsyncClient):
        payload = {
            "type": "user.created",
            "data": {
                "id": "clerk_new_123",
                "email_addresses": [{"email_address": "webhook_test@example.com"}],
                "first_name": "Test",
                "last_name": "User",
            },
        }
        resp = await anon_client.post("/api/v1/webhooks/clerk", json=payload)
        assert resp.status_code == 200


class TestAdminAPI:
    async def test_metrics_requires_admin(self, client: AsyncClient):
        """Regular user (mock_user has role=user) should get 403."""
        resp = await client.get("/api/v1/admin/metrics")
        assert resp.status_code == 403

    async def test_metrics_accessible_to_founder(self, db_session, mock_user):
        """Founder should access admin metrics."""
        mock_user.is_founder = True
        mock_user.role = MagicMock(value="user")

        from app.main import app
        from app.core.database import get_db
        from app.api.deps import get_current_user

        async def override_db():
            yield db_session

        async def override_user():
            return mock_user

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = override_user

        async with AsyncClient(transport=__import__("httpx").ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/api/v1/admin/metrics")
        
        app.dependency_overrides.clear()
        assert resp.status_code == 200
        data = resp.json()
        assert "total_users" in data
        assert "total_generations" in data
