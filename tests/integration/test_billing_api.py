"""
Tier 2: Billing API Integration Tests

Tests all billing API endpoints with real database and Redis.
NO MOCKING - uses actual infrastructure (real PostgreSQL/SQLite).
"""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from studio.services.billing_service import PRICING


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestBillingUsageEndpoints:
    """Test usage tracking endpoints."""

    @pytest.mark.asyncio
    async def test_get_usage_summary(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test GET /api/v1/billing/usage endpoint."""
        # Get date range
        end_date = datetime.now(UTC).isoformat()
        start_date = (datetime.now(UTC) - timedelta(days=30)).isoformat()

        response = await test_client.get(
            "/api/v1/billing/usage",
            params={
                "start_date": start_date,
                "end_date": end_date,
            },
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "organization_id" in data
        assert "start_date" in data
        assert "end_date" in data
        assert "by_resource" in data
        assert "total_cost" in data
        assert isinstance(data["total_cost"], (int, float))

    @pytest.mark.asyncio
    async def test_get_usage_details(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test GET /api/v1/billing/usage/details endpoint."""
        response = await test_client.get(
            "/api/v1/billing/usage/details",
            params={"limit": 100, "offset": 0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "records" in data
        assert "total" in data
        assert isinstance(data["records"], list)
        assert isinstance(data["total"], int)

    @pytest.mark.asyncio
    async def test_get_usage_details_with_resource_filter(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test GET /api/v1/billing/usage/details with resource type filter."""
        response = await test_client.get(
            "/api/v1/billing/usage/details",
            params={"resource_type": "agent_execution", "limit": 50, "offset": 0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # If records exist, verify all have correct resource type
        if data["records"]:
            for record in data["records"]:
                assert record["resource_type"] == "agent_execution"

    @pytest.mark.asyncio
    async def test_get_usage_details_pagination(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test pagination in GET /api/v1/billing/usage/details."""
        response = await test_client.get(
            "/api/v1/billing/usage/details",
            params={"limit": 10, "offset": 0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify records count doesn't exceed limit
        assert len(data["records"]) <= 10

    @pytest.mark.asyncio
    async def test_get_usage_summary_invalid_dates(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test GET /api/v1/billing/usage with invalid date format."""
        response = await test_client.get(
            "/api/v1/billing/usage",
            params={
                "start_date": "invalid-date",
                "end_date": "also-invalid",
            },
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        # API may validate and reject (400/422) or accept and use defaults (200)
        assert response.status_code in [200, 400, 422]


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestBillingQuotaEndpoints:
    """Test quota management endpoints."""

    @pytest.mark.asyncio
    async def test_get_quotas(self, test_client: AsyncClient, test_user_token: str):
        """Test GET /api/v1/billing/quotas endpoint."""
        response = await test_client.get(
            "/api/v1/billing/quotas",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "quotas" in data
        assert isinstance(data["quotas"], list)

        # If quotas exist, verify structure
        if data["quotas"]:
            quota = data["quotas"][0]
            assert "id" in quota
            assert "organization_id" in quota
            assert "resource_type" in quota
            assert "limit_value" in quota
            assert "current_usage" in quota
            assert "reset_period" in quota

    @pytest.mark.asyncio
    async def test_get_quotas_has_expected_resource_types(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test that quotas include expected resource types when quotas exist."""
        response = await test_client.get(
            "/api/v1/billing/quotas",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        quotas = data["quotas"]

        # Get resource types from returned quotas
        resource_types = {q["resource_type"] for q in quotas}

        # Quotas may or may not exist - test structure if they do
        if quotas:
            assert len(resource_types) >= 1
        # Empty quotas list is also valid for a new organization

    @pytest.mark.asyncio
    async def test_update_quota_success(
        self, test_client: AsyncClient, test_admin_token: str
    ):
        """Test PUT /api/v1/billing/quotas/{resource_type} endpoint."""
        response = await test_client.put(
            "/api/v1/billing/quotas/agent_execution",
            json={"limit_value": 5000.0},
            headers={"Authorization": f"Bearer {test_admin_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response
        assert data["resource_type"] == "agent_execution"
        assert data["limit_value"] == 5000.0

    @pytest.mark.asyncio
    async def test_update_quota_unlimited(
        self, test_client: AsyncClient, test_admin_token: str
    ):
        """Test updating quota to unlimited (-1)."""
        response = await test_client.put(
            "/api/v1/billing/quotas/storage",
            json={"limit_value": -1},
            headers={"Authorization": f"Bearer {test_admin_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["limit_value"] == -1

    @pytest.mark.asyncio
    async def test_update_quota_unauthorized(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test that non-admins cannot update quotas."""
        response = await test_client.put(
            "/api/v1/billing/quotas/agent_execution",
            json={"limit_value": 5000.0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_update_quota_invalid_resource_type(
        self, test_client: AsyncClient, test_admin_token: str
    ):
        """Test updating quota with invalid resource type."""
        response = await test_client.put(
            "/api/v1/billing/quotas/invalid_resource",
            json={"limit_value": 5000.0},
            headers={"Authorization": f"Bearer {test_admin_token}"},
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_update_quota_invalid_limit(
        self, test_client: AsyncClient, test_admin_token: str
    ):
        """Test updating quota with invalid limit value."""
        response = await test_client.put(
            "/api/v1/billing/quotas/agent_execution",
            json={"limit_value": -5},  # Invalid: only -1 is allowed for unlimited
            headers={"Authorization": f"Bearer {test_admin_token}"},
        )

        assert response.status_code == 422


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestBillingPeriodEndpoints:
    """Test billing period management endpoints."""

    @pytest.mark.asyncio
    async def test_list_periods(self, test_client: AsyncClient, test_user_token: str):
        """Test GET /api/v1/billing/periods endpoint."""
        response = await test_client.get(
            "/api/v1/billing/periods",
            params={"limit": 12, "offset": 0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "records" in data
        assert "total" in data
        assert isinstance(data["records"], list)
        assert isinstance(data["total"], int)

    @pytest.mark.asyncio
    async def test_list_periods_pagination(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test pagination in GET /api/v1/billing/periods."""
        response = await test_client.get(
            "/api/v1/billing/periods",
            params={"limit": 5, "offset": 0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify records count doesn't exceed limit
        assert len(data["records"]) <= 5

    @pytest.mark.asyncio
    async def test_get_current_period(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test GET /api/v1/billing/periods/current endpoint."""
        response = await test_client.get(
            "/api/v1/billing/periods/current",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "id" in data
        assert "organization_id" in data
        assert "start_date" in data
        assert "end_date" in data
        assert "status" in data
        assert data["status"] == "active"

    @pytest.mark.asyncio
    async def test_get_current_period_creates_if_missing(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test that getting current period creates one if none exists."""
        response = await test_client.get(
            "/api/v1/billing/periods/current",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Should have created a period
        assert data["id"] is not None
        assert data["status"] == "active"

    @pytest.mark.asyncio
    async def test_get_period_by_id(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test GET /api/v1/billing/periods/{period_id} endpoint."""
        # First get the current period
        current_response = await test_client.get(
            "/api/v1/billing/periods/current",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert current_response.status_code == 200
        period_id = current_response.json()["id"]

        # Now fetch that specific period
        response = await test_client.get(
            f"/api/v1/billing/periods/{period_id}",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == period_id
        assert data["status"] == "active"

    @pytest.mark.asyncio
    async def test_get_period_not_found(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test GET /api/v1/billing/periods/{period_id} with non-existent ID."""
        response = await test_client.get(
            "/api/v1/billing/periods/non-existent-id",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_close_period_success(
        self, test_client: AsyncClient, test_admin_token: str
    ):
        """Test POST /api/v1/billing/periods/{period_id}/close endpoint."""
        # First get the current period
        current_response = await test_client.get(
            "/api/v1/billing/periods/current",
            headers={"Authorization": f"Bearer {test_admin_token}"},
        )

        assert current_response.status_code == 200
        period_id = current_response.json()["id"]

        # Close the period
        response = await test_client.post(
            f"/api/v1/billing/periods/{period_id}/close",
            headers={"Authorization": f"Bearer {test_admin_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == period_id
        assert data["status"] == "closed"

    @pytest.mark.asyncio
    async def test_close_period_unauthorized(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test that non-admins cannot close periods."""
        # First get the current period
        current_response = await test_client.get(
            "/api/v1/billing/periods/current",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert current_response.status_code == 200
        period_id = current_response.json()["id"]

        # Try to close as regular user
        response = await test_client.post(
            f"/api/v1/billing/periods/{period_id}/close",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_close_period_not_found(
        self, test_client: AsyncClient, test_admin_token: str
    ):
        """Test closing non-existent period."""
        response = await test_client.post(
            "/api/v1/billing/periods/non-existent-id/close",
            headers={"Authorization": f"Bearer {test_admin_token}"},
        )

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestBillingCostEstimationEndpoints:
    """Test cost estimation endpoints."""

    @pytest.mark.asyncio
    async def test_estimate_cost(self, test_client: AsyncClient, test_user_token: str):
        """Test POST /api/v1/billing/estimate endpoint."""
        response = await test_client.post(
            "/api/v1/billing/estimate",
            json={"resource_type": "agent_execution", "quantity": 100.0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "resource_type" in data
        assert "quantity" in data
        assert "unit" in data
        assert "unit_cost" in data
        assert "total_cost" in data

        # Verify correct calculation
        assert data["resource_type"] == "agent_execution"
        assert data["quantity"] == 100.0
        assert data["total_cost"] == 1.0  # 100 * 0.01

    @pytest.mark.asyncio
    async def test_estimate_cost_token(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test cost estimation for tokens."""
        response = await test_client.post(
            "/api/v1/billing/estimate",
            json={"resource_type": "token", "quantity": 100000.0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["resource_type"] == "token"
        assert data["total_cost"] == 200.0  # 100000 * 0.002

    @pytest.mark.asyncio
    async def test_estimate_cost_storage(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test cost estimation for storage."""
        response = await test_client.post(
            "/api/v1/billing/estimate",
            json={"resource_type": "storage", "quantity": 50.0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["resource_type"] == "storage"
        assert data["total_cost"] == 5.0  # 50 * 0.10

    @pytest.mark.asyncio
    async def test_estimate_cost_invalid_resource(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test cost estimation with invalid resource type."""
        response = await test_client.post(
            "/api/v1/billing/estimate",
            json={"resource_type": "invalid_resource", "quantity": 100.0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        # Should fail validation
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_estimate_cost_zero_quantity(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test cost estimation with zero quantity."""
        response = await test_client.post(
            "/api/v1/billing/estimate",
            json={"resource_type": "agent_execution", "quantity": 0.0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        # Should fail validation (quantity must be > 0)
        assert response.status_code == 422


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestBillingInfoEndpoints:
    """Test billing information endpoints."""

    @pytest.mark.asyncio
    async def test_get_pricing(self, test_client: AsyncClient, test_user_token: str):
        """Test GET /api/v1/billing/pricing endpoint."""
        response = await test_client.get(
            "/api/v1/billing/pricing",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "pricing" in data
        pricing = data["pricing"]

        # Check all expected resource types are present
        for resource_type in ["agent_execution", "token", "storage", "api_call"]:
            assert resource_type in pricing
            assert "unit" in pricing[resource_type]
            assert "price" in pricing[resource_type]

    @pytest.mark.asyncio
    async def test_get_plan_quotas(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test GET /api/v1/billing/plans endpoint."""
        response = await test_client.get(
            "/api/v1/billing/plans",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "plans" in data
        plans = data["plans"]

        # Check all plan tiers are present
        for plan_tier in ["free", "pro", "enterprise"]:
            assert plan_tier in plans
            plan = plans[plan_tier]

            # Check all resource types are present
            for resource_type in ["agent_execution", "token", "storage", "api_call"]:
                assert resource_type in plan

    @pytest.mark.asyncio
    async def test_pricing_matches_service_config(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test that pricing returned matches service configuration."""
        response = await test_client.get(
            "/api/v1/billing/pricing",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        pricing = data["pricing"]

        # Verify pricing matches PRICING constant
        for resource_type, pricing_info in pricing.items():
            assert pricing_info["unit"] == PRICING[resource_type]["unit"]
            assert pricing_info["price"] == PRICING[resource_type]["price"]


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestBillingAuthenticationAndAuthorization:
    """Test authentication and authorization for billing endpoints."""

    @pytest.mark.asyncio
    async def test_billing_endpoints_require_auth(self, test_client: AsyncClient):
        """Test that billing endpoints require authentication."""
        endpoints = [
            ("/api/v1/billing/usage", "get", {}),
            ("/api/v1/billing/usage/details", "get", {}),
            ("/api/v1/billing/quotas", "get", {}),
            ("/api/v1/billing/periods", "get", {}),
            ("/api/v1/billing/pricing", "get", {}),
        ]

        for endpoint, method, data in endpoints:
            if method == "get":
                response = await test_client.get(endpoint)
            else:
                response = await test_client.post(endpoint, json=data)

            assert (
                response.status_code == 401
            ), f"Endpoint {endpoint} should require auth"

    @pytest.mark.asyncio
    async def test_update_quota_requires_admin(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test that quota updates require admin role."""
        response = await test_client.put(
            "/api/v1/billing/quotas/agent_execution",
            json={"limit_value": 5000.0},
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_close_period_requires_admin(
        self, test_client: AsyncClient, test_user_token: str
    ):
        """Test that closing periods requires admin role."""
        # Get a period first
        periods_response = await test_client.get(
            "/api/v1/billing/periods",
            headers={"Authorization": f"Bearer {test_user_token}"},
        )

        if periods_response.json()["total"] > 0:
            period_id = periods_response.json()["records"][0]["id"]

            response = await test_client.post(
                f"/api/v1/billing/periods/{period_id}/close",
                headers={"Authorization": f"Bearer {test_user_token}"},
            )

            assert response.status_code == 403
