"""
Tier 1: Unit Tests for Billing Service

Tests billing service functions with mocked DataFlow operations.
Mocking is ALLOWED in Tier 1 only.
"""

import json
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from studio.services.billing_service import BillingService

# Mark all tests in this file as unit tests
pytestmark = pytest.mark.unit


class TestBillingServiceUsageRecording:
    """Unit tests for usage recording functionality."""

    @pytest.fixture
    def billing_service(self):
        """Create billing service instance."""
        return BillingService()

    @pytest.mark.asyncio
    async def test_record_usage_creates_record(self, billing_service):
        """Test recording usage creates a usage record."""
        with patch.object(
            billing_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "create": {
                        "id": "usage-123",
                        "organization_id": "org-123",
                        "resource_type": "agent_execution",
                        "quantity": 10.0,
                        "unit": "count",
                        "unit_cost": 0.01,
                        "total_cost": 0.10,
                        "metadata": None,
                        "recorded_at": datetime.now(UTC).isoformat(),
                        "created_at": datetime.now(UTC).isoformat(),
                    }
                },
                "run-123",
            )

            result = await billing_service.record_usage(
                org_id="org-123",
                resource_type="agent_execution",
                quantity=10.0,
                metadata=None,
            )

            assert result["id"] == "usage-123"
            assert result["organization_id"] == "org-123"
            assert result["resource_type"] == "agent_execution"
            assert result["quantity"] == 10.0
            assert result["total_cost"] == 0.10
            mock_execute.assert_called()

    @pytest.mark.asyncio
    async def test_record_usage_with_metadata(self, billing_service):
        """Test recording usage with metadata."""
        with patch.object(
            billing_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            metadata = {"agent_id": "agent-456", "model": "gpt-4"}
            mock_execute.return_value = (
                {
                    "create": {
                        "id": "usage-456",
                        "organization_id": "org-123",
                        "resource_type": "token",
                        "quantity": 5000.0,
                        "unit": "1000 tokens",
                        "unit_cost": 0.002,
                        "total_cost": 0.01,
                        "metadata": json.dumps(metadata),
                        "recorded_at": datetime.now(UTC).isoformat(),
                        "created_at": datetime.now(UTC).isoformat(),
                    }
                },
                "run-123",
            )

            result = await billing_service.record_usage(
                org_id="org-123",
                resource_type="token",
                quantity=5000.0,
                metadata=metadata,
            )

            assert result["id"] == "usage-456"
            assert result["metadata"] is not None
            assert json.loads(result["metadata"])["agent_id"] == "agent-456"
            mock_execute.assert_called()

    @pytest.mark.asyncio
    async def test_record_usage_calculates_cost(self, billing_service):
        """Test that recording usage calculates correct cost."""
        with patch.object(
            billing_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "create": {
                        "id": "usage-789",
                        "organization_id": "org-123",
                        "resource_type": "storage",
                        "quantity": 5.0,
                        "unit": "GB",
                        "unit_cost": 0.10,
                        "total_cost": 0.50,
                        "metadata": None,
                        "recorded_at": datetime.now(UTC).isoformat(),
                        "created_at": datetime.now(UTC).isoformat(),
                    }
                },
                "run-123",
            )

            result = await billing_service.record_usage(
                org_id="org-123",
                resource_type="storage",
                quantity=5.0,
            )

            # Verify cost calculation
            expected_cost = 5.0 * 0.10
            assert result["total_cost"] == expected_cost

    @pytest.mark.asyncio
    async def test_record_usage_unknown_resource_type(self, billing_service):
        """Test recording usage with unknown resource type."""
        with patch.object(
            billing_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "create": {
                        "id": "usage-999",
                        "organization_id": "org-123",
                        "resource_type": "unknown_resource",
                        "quantity": 10.0,
                        "unit": "count",
                        "unit_cost": 0,
                        "total_cost": 0,
                        "metadata": None,
                        "recorded_at": datetime.now(UTC).isoformat(),
                        "created_at": datetime.now(UTC).isoformat(),
                    }
                },
                "run-123",
            )

            result = await billing_service.record_usage(
                org_id="org-123",
                resource_type="unknown_resource",
                quantity=10.0,
            )

            # Unknown resource type should have 0 cost
            assert result["unit_cost"] == 0
            assert result["total_cost"] == 0

    @pytest.mark.asyncio
    async def test_record_usage_updates_quota(self, billing_service):
        """Test that recording usage updates quota usage."""
        with patch.object(
            billing_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            # First call for usage record creation
            # Second call for quota update
            mock_execute.side_effect = [
                (
                    {
                        "create": {
                            "id": "usage-111",
                            "organization_id": "org-123",
                            "resource_type": "api_call",
                            "quantity": 100.0,
                            "unit": "count",
                            "unit_cost": 0.001,
                            "total_cost": 0.10,
                            "metadata": None,
                            "recorded_at": datetime.now(UTC).isoformat(),
                            "created_at": datetime.now(UTC).isoformat(),
                        }
                    },
                    "run-123",
                ),
                ({}, "run-124"),  # Quota update
            ]

            result = await billing_service.record_usage(
                org_id="org-123",
                resource_type="api_call",
                quantity=100.0,
            )

            assert result["id"] == "usage-111"
            # Verify two calls were made (create + update quota)
            assert mock_execute.call_count == 2


class TestBillingServiceCostCalculation:
    """Unit tests for cost calculation functionality."""

    @pytest.fixture
    def billing_service(self):
        """Create billing service instance."""
        return BillingService()

    @pytest.mark.asyncio
    async def test_estimate_cost_agent_execution(self, billing_service):
        """Test cost estimation for agent execution."""
        result = await billing_service.estimate_cost("agent_execution", 50.0)

        assert result["resource_type"] == "agent_execution"
        assert result["quantity"] == 50.0
        assert result["unit"] == "count"
        assert result["unit_cost"] == 0.01
        assert result["total_cost"] == 0.50

    @pytest.mark.asyncio
    async def test_estimate_cost_token(self, billing_service):
        """Test cost estimation for tokens."""
        result = await billing_service.estimate_cost("token", 100000.0)

        assert result["resource_type"] == "token"
        assert result["quantity"] == 100000.0
        assert result["unit"] == "1000 tokens"
        assert result["unit_cost"] == 0.002
        assert result["total_cost"] == 200.0

    @pytest.mark.asyncio
    async def test_estimate_cost_storage(self, billing_service):
        """Test cost estimation for storage."""
        result = await billing_service.estimate_cost("storage", 100.0)

        assert result["resource_type"] == "storage"
        assert result["quantity"] == 100.0
        assert result["unit"] == "GB"
        assert result["unit_cost"] == 0.10
        assert result["total_cost"] == 10.0

    @pytest.mark.asyncio
    async def test_estimate_cost_api_call(self, billing_service):
        """Test cost estimation for API calls."""
        result = await billing_service.estimate_cost("api_call", 10000.0)

        assert result["resource_type"] == "api_call"
        assert result["quantity"] == 10000.0
        assert result["unit"] == "count"
        assert result["unit_cost"] == 0.001
        assert result["total_cost"] == 10.0

    @pytest.mark.asyncio
    async def test_estimate_cost_zero_quantity(self, billing_service):
        """Test cost estimation with zero quantity."""
        result = await billing_service.estimate_cost("agent_execution", 0.0)

        assert result["total_cost"] == 0.0

    @pytest.mark.asyncio
    async def test_estimate_cost_fractional_quantity(self, billing_service):
        """Test cost estimation with fractional quantity."""
        result = await billing_service.estimate_cost("agent_execution", 0.5)

        assert result["total_cost"] == 0.005

    @pytest.mark.asyncio
    async def test_estimate_cost_unknown_resource(self, billing_service):
        """Test cost estimation for unknown resource type."""
        result = await billing_service.estimate_cost("unknown", 100.0)

        assert result["resource_type"] == "unknown"
        assert result["quantity"] == 100.0
        assert result["unit"] == "count"
        assert result["unit_cost"] == 0
        assert result["total_cost"] == 0

    @pytest.mark.asyncio
    async def test_get_pricing(self, billing_service):
        """Test retrieving pricing configuration."""
        pricing = await billing_service.get_pricing()

        assert isinstance(pricing, dict)
        assert "agent_execution" in pricing
        assert "token" in pricing
        assert "storage" in pricing
        assert "api_call" in pricing

        # Verify pricing structure
        for resource_type, pricing_info in pricing.items():
            assert "unit" in pricing_info
            assert "price" in pricing_info


class TestBillingServiceQuotaChecking:
    """Unit tests for quota checking functionality."""

    @pytest.fixture
    def billing_service(self):
        """Create billing service instance."""
        return BillingService()

    @pytest.mark.asyncio
    async def test_check_quota_within_limit(self, billing_service):
        """Test quota check when usage is within limit."""
        with patch.object(
            billing_service, "_get_quota", new_callable=AsyncMock
        ) as mock_get_quota:
            mock_get_quota.return_value = {
                "id": "quota-123",
                "organization_id": "org-123",
                "resource_type": "agent_execution",
                "limit_value": 1000.0,
                "current_usage": 500.0,
                "reset_period": "monthly",
                "last_reset_at": datetime.now(UTC).isoformat(),
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            }

            is_within = await billing_service.check_quota(
                org_id="org-123",
                resource_type="agent_execution",
                quantity=200.0,
            )

            assert is_within is True

    @pytest.mark.asyncio
    async def test_check_quota_exceeds_limit(self, billing_service):
        """Test quota check when usage would exceed limit."""
        with patch.object(
            billing_service, "_get_quota", new_callable=AsyncMock
        ) as mock_get_quota:
            mock_get_quota.return_value = {
                "id": "quota-123",
                "organization_id": "org-123",
                "resource_type": "agent_execution",
                "limit_value": 1000.0,
                "current_usage": 900.0,
                "reset_period": "monthly",
                "last_reset_at": datetime.now(UTC).isoformat(),
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            }

            is_within = await billing_service.check_quota(
                org_id="org-123",
                resource_type="agent_execution",
                quantity=200.0,
            )

            assert is_within is False

    @pytest.mark.asyncio
    async def test_check_quota_unlimited(self, billing_service):
        """Test quota check for unlimited quota."""
        with patch.object(
            billing_service, "_get_quota", new_callable=AsyncMock
        ) as mock_get_quota:
            mock_get_quota.return_value = {
                "id": "quota-123",
                "organization_id": "org-123",
                "resource_type": "agent_execution",
                "limit_value": -1,  # Unlimited
                "current_usage": 999999.0,
                "reset_period": "monthly",
                "last_reset_at": datetime.now(UTC).isoformat(),
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            }

            is_within = await billing_service.check_quota(
                org_id="org-123",
                resource_type="agent_execution",
                quantity=100000.0,
            )

            assert is_within is True

    @pytest.mark.asyncio
    async def test_check_quota_no_quota_exists(self, billing_service):
        """Test quota check when no quota exists."""
        with patch.object(
            billing_service, "_get_quota", new_callable=AsyncMock
        ) as mock_get_quota:
            mock_get_quota.return_value = None

            is_within = await billing_service.check_quota(
                org_id="org-123",
                resource_type="agent_execution",
                quantity=100.0,
            )

            # No quota means unlimited
            assert is_within is True

    @pytest.mark.asyncio
    async def test_check_quota_at_exact_limit(self, billing_service):
        """Test quota check when usage is exactly at limit."""
        with patch.object(
            billing_service, "_get_quota", new_callable=AsyncMock
        ) as mock_get_quota:
            mock_get_quota.return_value = {
                "id": "quota-123",
                "organization_id": "org-123",
                "resource_type": "agent_execution",
                "limit_value": 1000.0,
                "current_usage": 900.0,
                "reset_period": "monthly",
                "last_reset_at": datetime.now(UTC).isoformat(),
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            }

            is_within = await billing_service.check_quota(
                org_id="org-123",
                resource_type="agent_execution",
                quantity=100.0,
            )

            assert is_within is True

    @pytest.mark.asyncio
    async def test_get_quotas(self, billing_service):
        """Test retrieving quotas for organization."""
        with patch.object(
            billing_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "list": {
                        "records": [
                            {
                                "id": "quota-1",
                                "organization_id": "org-123",
                                "resource_type": "agent_execution",
                                "limit_value": 1000.0,
                                "current_usage": 100.0,
                                "reset_period": "monthly",
                                "last_reset_at": datetime.now(UTC).isoformat(),
                                "created_at": datetime.now(UTC).isoformat(),
                                "updated_at": datetime.now(UTC).isoformat(),
                            },
                            {
                                "id": "quota-2",
                                "organization_id": "org-123",
                                "resource_type": "token",
                                "limit_value": 1000000.0,
                                "current_usage": 50000.0,
                                "reset_period": "monthly",
                                "last_reset_at": datetime.now(UTC).isoformat(),
                                "created_at": datetime.now(UTC).isoformat(),
                                "updated_at": datetime.now(UTC).isoformat(),
                            },
                        ],
                        "total": 2,
                    }
                },
                "run-123",
            )

            quotas = await billing_service.get_quotas("org-123")

            assert len(quotas) == 2
            assert quotas[0]["resource_type"] == "agent_execution"
            assert quotas[1]["resource_type"] == "token"

    @pytest.mark.asyncio
    async def test_initialize_quotas_free_plan(self, billing_service):
        """Test initializing quotas for free plan."""
        with patch.object(
            billing_service, "_create_quota", new_callable=AsyncMock
        ) as mock_create_quota:
            mock_create_quota.side_effect = [
                {
                    "id": "quota-1",
                    "resource_type": "agent_execution",
                    "limit_value": 1000.0,
                },
                {"id": "quota-2", "resource_type": "token", "limit_value": 100000.0},
                {"id": "quota-3", "resource_type": "storage", "limit_value": 1.0},
                {"id": "quota-4", "resource_type": "api_call", "limit_value": 10000.0},
            ]

            quotas = await billing_service.initialize_quotas("org-123", "free")

            assert len(quotas) == 4
            assert mock_create_quota.call_count == 4

    @pytest.mark.asyncio
    async def test_initialize_quotas_pro_plan(self, billing_service):
        """Test initializing quotas for pro plan."""
        with patch.object(
            billing_service, "_create_quota", new_callable=AsyncMock
        ) as mock_create_quota:
            mock_create_quota.side_effect = [
                {
                    "id": "quota-1",
                    "resource_type": "agent_execution",
                    "limit_value": 10000.0,
                },
                {"id": "quota-2", "resource_type": "token", "limit_value": 1000000.0},
                {"id": "quota-3", "resource_type": "storage", "limit_value": 10.0},
                {"id": "quota-4", "resource_type": "api_call", "limit_value": 100000.0},
            ]

            quotas = await billing_service.initialize_quotas("org-123", "pro")

            assert len(quotas) == 4
            assert quotas[0]["limit_value"] == 10000.0

    @pytest.mark.asyncio
    async def test_initialize_quotas_enterprise_plan(self, billing_service):
        """Test initializing quotas for enterprise plan."""
        with patch.object(
            billing_service, "_create_quota", new_callable=AsyncMock
        ) as mock_create_quota:
            mock_create_quota.side_effect = [
                {
                    "id": "quota-1",
                    "resource_type": "agent_execution",
                    "limit_value": -1,
                },
                {"id": "quota-2", "resource_type": "token", "limit_value": -1},
                {"id": "quota-3", "resource_type": "storage", "limit_value": -1},
                {"id": "quota-4", "resource_type": "api_call", "limit_value": -1},
            ]

            quotas = await billing_service.initialize_quotas("org-123", "enterprise")

            assert len(quotas) == 4
            assert all(q["limit_value"] == -1 for q in quotas)

    @pytest.mark.asyncio
    async def test_update_quota_existing(self, billing_service):
        """Test updating an existing quota."""
        with patch.object(
            billing_service, "_get_quota", new_callable=AsyncMock
        ) as mock_get_quota:
            with patch.object(
                billing_service.runtime,
                "execute_workflow_async",
                new_callable=AsyncMock,
            ) as mock_execute:
                # First call to check if quota exists
                mock_get_quota.return_value = {
                    "id": "quota-123",
                    "organization_id": "org-123",
                    "resource_type": "agent_execution",
                    "limit_value": 1000.0,
                    "current_usage": 100.0,
                    "reset_period": "monthly",
                    "last_reset_at": datetime.now(UTC).isoformat(),
                    "created_at": datetime.now(UTC).isoformat(),
                    "updated_at": datetime.now(UTC).isoformat(),
                }

                # Return value for second _get_quota call (after update)
                mock_get_quota.side_effect = [
                    {
                        "id": "quota-123",
                        "organization_id": "org-123",
                        "resource_type": "agent_execution",
                        "limit_value": 1000.0,
                        "current_usage": 100.0,
                        "reset_period": "monthly",
                        "last_reset_at": datetime.now(UTC).isoformat(),
                        "created_at": datetime.now(UTC).isoformat(),
                        "updated_at": datetime.now(UTC).isoformat(),
                    },
                    {
                        "id": "quota-123",
                        "organization_id": "org-123",
                        "resource_type": "agent_execution",
                        "limit_value": 2000.0,
                        "current_usage": 100.0,
                        "reset_period": "monthly",
                        "last_reset_at": datetime.now(UTC).isoformat(),
                        "created_at": datetime.now(UTC).isoformat(),
                        "updated_at": datetime.now(UTC).isoformat(),
                    },
                ]

                mock_execute.return_value = ({}, "run-123")

                result = await billing_service.update_quota(
                    org_id="org-123",
                    resource_type="agent_execution",
                    limit_value=2000.0,
                )

                assert result["limit_value"] == 2000.0


class TestBillingServiceBillingPeriods:
    """Unit tests for billing period functionality."""

    @pytest.fixture
    def billing_service(self):
        """Create billing service instance."""
        return BillingService()

    @pytest.mark.asyncio
    async def test_get_current_period_exists(self, billing_service):
        """Test getting current period when it exists."""
        with patch.object(
            billing_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            period_data = {
                "id": "period-123",
                "organization_id": "org-123",
                "start_date": datetime.now(UTC).replace(day=1).isoformat(),
                "end_date": (datetime.now(UTC) + timedelta(days=30)).isoformat(),
                "status": "active",
                "total_usage": 100.0,
                "total_cost": 10.0,
                "invoice_id": None,
                "created_at": datetime.now(UTC).isoformat(),
            }

            mock_execute.return_value = (
                {
                    "list": {
                        "records": [period_data],
                        "total": 1,
                    }
                },
                "run-123",
            )

            period = await billing_service.get_current_period("org-123")

            assert period["id"] == "period-123"
            assert period["status"] == "active"

    @pytest.mark.asyncio
    async def test_list_periods(self, billing_service):
        """Test listing billing periods."""
        with patch.object(
            billing_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "list": {
                        "records": [
                            {
                                "id": "period-1",
                                "organization_id": "org-123",
                                "start_date": "2024-01-01T00:00:00+00:00",
                                "end_date": "2024-01-31T23:59:59+00:00",
                                "status": "closed",
                                "total_usage": 500.0,
                                "total_cost": 50.0,
                                "invoice_id": "inv-123",
                                "created_at": "2024-01-01T00:00:00+00:00",
                            },
                            {
                                "id": "period-2",
                                "organization_id": "org-123",
                                "start_date": "2024-02-01T00:00:00+00:00",
                                "end_date": "2024-02-29T23:59:59+00:00",
                                "status": "active",
                                "total_usage": 0.0,
                                "total_cost": 0.0,
                                "invoice_id": None,
                                "created_at": "2024-02-01T00:00:00+00:00",
                            },
                        ],
                        "total": 2,
                    }
                },
                "run-123",
            )

            result = await billing_service.list_periods("org-123", limit=10, offset=0)

            assert result["total"] == 2
            assert len(result["records"]) == 2


class TestBillingServiceUsageSummary:
    """Unit tests for usage summary functionality."""

    @pytest.fixture
    def billing_service(self):
        """Create billing service instance."""
        return BillingService()

    @pytest.mark.asyncio
    async def test_get_usage_summary(self, billing_service):
        """Test getting usage summary."""
        with patch.object(
            billing_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "list": {
                        "records": [
                            {
                                "id": "usage-1",
                                "organization_id": "org-123",
                                "resource_type": "agent_execution",
                                "quantity": 100.0,
                                "unit": "count",
                                "unit_cost": 0.01,
                                "total_cost": 1.0,
                                "metadata": None,
                                "recorded_at": "2024-02-01T00:00:00+00:00",
                                "created_at": "2024-02-01T00:00:00+00:00",
                            },
                            {
                                "id": "usage-2",
                                "organization_id": "org-123",
                                "resource_type": "token",
                                "quantity": 10000.0,
                                "unit": "1000 tokens",
                                "unit_cost": 0.002,
                                "total_cost": 20.0,
                                "metadata": None,
                                "recorded_at": "2024-02-05T00:00:00+00:00",
                                "created_at": "2024-02-05T00:00:00+00:00",
                            },
                        ],
                        "total": 2,
                    }
                },
                "run-123",
            )

            summary = await billing_service.get_usage_summary(
                org_id="org-123",
                start_date="2024-02-01T00:00:00+00:00",
                end_date="2024-02-29T23:59:59+00:00",
            )

            assert summary["organization_id"] == "org-123"
            assert summary["record_count"] == 2
            assert summary["total_cost"] == 21.0
            assert "agent_execution" in summary["by_resource"]
            assert "token" in summary["by_resource"]

    @pytest.mark.asyncio
    async def test_get_usage_details(self, billing_service):
        """Test getting detailed usage records."""
        with patch.object(
            billing_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "list": {
                        "records": [
                            {
                                "id": "usage-1",
                                "organization_id": "org-123",
                                "resource_type": "agent_execution",
                                "quantity": 10.0,
                                "unit": "count",
                                "unit_cost": 0.01,
                                "total_cost": 0.10,
                                "metadata": None,
                                "recorded_at": "2024-02-01T00:00:00+00:00",
                                "created_at": "2024-02-01T00:00:00+00:00",
                            },
                        ],
                        "total": 1,
                    }
                },
                "run-123",
            )

            result = await billing_service.get_usage_details(
                org_id="org-123",
                resource_type="agent_execution",
                limit=100,
                offset=0,
            )

            assert result["total"] == 1
            assert len(result["records"]) == 1
            assert result["records"][0]["resource_type"] == "agent_execution"
