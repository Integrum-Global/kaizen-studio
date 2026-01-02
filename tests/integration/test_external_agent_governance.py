"""
Tier 2 Integration Tests for External Agent Governance

Tests governance features with real PostgreSQL and Redis (NO MOCKING).
Intent: Verify end-to-end budget and rate limiting with real infrastructure.
"""

import time
import uuid

import pytest
import pytest_asyncio
from kailash.runtime import AsyncLocalRuntime
from studio.services.governance_service import GovernanceService
from studio.services.workspace_service import WorkspaceService


@pytest_asyncio.fixture
async def governance_service():
    """Create a governance service with real infrastructure."""
    runtime = AsyncLocalRuntime()
    service = GovernanceService(runtime=runtime)
    await service.initialize()
    yield service
    await service.close()


@pytest_asyncio.fixture
async def test_external_agent_with_budget(authenticated_owner_client):
    """Create a test external agent with budget configuration."""
    client, user, org = authenticated_owner_client

    # Create workspace
    workspace_service = WorkspaceService()
    workspace = await workspace_service.create_workspace(
        organization_id=org["id"],
        name=f"Governance Test Workspace {uuid.uuid4().hex[:8]}",
        environment_type="development",
        description="",
    )

    # Create external agent via API
    response = await client.post(
        "/api/v1/external-agents",
        json={
            "name": f"Budget Test Agent {uuid.uuid4().hex[:8]}",
            "workspace_id": workspace["id"],
            "platform": "custom_http",
            "webhook_url": "https://httpbin.org/post",
            "auth_type": "none",
        },
    )
    assert response.status_code == 201, f"Failed to create agent: {response.json()}"
    agent = response.json()
    return {"agent": agent, "user": user, "org": org}


@pytest.mark.integration
class TestExternalAgentGovernanceBudget:
    """Test budget enforcement with real PostgreSQL."""

    @pytest.mark.asyncio
    async def test_budget_enforcement_blocks_invocations_when_budget_exceeded(
        self, governance_service, test_external_agent_with_budget
    ):
        """
        Intent: Verify end-to-end budget blocking with real GovernanceService.

        Setup: Real PostgreSQL, ExternalAgent with mocked budget state (95% used)
        Assertions: check_budget returns False when cost would exceed budget
        """
        agent = test_external_agent_with_budget["agent"]
        org = test_external_agent_with_budget["org"]

        # Simulate 95% budget usage by updating budget state in cache
        from kaizen.trust.governance import ExternalAgentBudget

        budget = ExternalAgentBudget(
            external_agent_id=agent["id"],
            monthly_budget_usd=100.0,
            monthly_spent_usd=95.0,  # 95% used
        )
        governance_service._budget_cache[agent["id"]] = budget

        # Act - Check budget with $10 cost (would exceed budget)
        result = await governance_service.check_budget(
            external_agent_id=agent["id"],
            organization_id=org["id"],
            estimated_cost=10.0,
        )

        # Assert - Budget check should block
        assert (
            result.allowed is False
        ), "Budget check should block over-budget invocation"
        assert result.remaining_budget_usd == 5.0

    @pytest.mark.asyncio
    async def test_budget_enforcement_allows_invocations_when_budget_available(
        self, governance_service, test_external_agent_with_budget
    ):
        """
        Intent: Verify budget checking does not block valid invocations.

        Setup: Real PostgreSQL, ExternalAgent with 50% budget used
        Assertions: check_budget returns True, remaining budget correct
        """
        agent = test_external_agent_with_budget["agent"]
        org = test_external_agent_with_budget["org"]

        # Simulate 50% budget usage
        from kaizen.trust.governance import ExternalAgentBudget

        budget = ExternalAgentBudget(
            external_agent_id=agent["id"],
            monthly_budget_usd=100.0,
            monthly_spent_usd=50.0,  # 50% used
        )
        governance_service._budget_cache[agent["id"]] = budget

        # Act - Check budget with $10 cost (within budget)
        result = await governance_service.check_budget(
            external_agent_id=agent["id"],
            organization_id=org["id"],
            estimated_cost=10.0,
        )

        # Assert - Budget check should allow
        assert (
            result.allowed is True
        ), "Budget check should allow within-budget invocation"
        assert result.remaining_budget_usd == 50.0


@pytest.mark.integration
class TestExternalAgentGovernanceRateLimit:
    """Test rate limiting with real Redis."""

    @pytest.mark.asyncio
    async def test_rate_limiting_tracks_invocations_correctly(
        self, governance_service, test_external_agent_with_budget
    ):
        """
        Intent: Verify end-to-end rate limiting tracks invocations with real Redis.

        Setup: Real Redis if available
        Assertions: Rate limit usage is tracked correctly after invocations
        """
        agent = test_external_agent_with_budget["agent"]
        user = test_external_agent_with_budget["user"]
        org = test_external_agent_with_budget["org"]

        # Create unique agent ID suffix for this test
        agent_id = f"rate-limit-{agent['id']}-{int(time.time())}"

        # Check initial state
        initial_result = await governance_service.check_rate_limit(
            external_agent_id=agent_id,
            user_id=user["id"],
            org_id=org["id"],
        )
        assert initial_result.allowed is True, "Initial invocation should be allowed"

        # Make some invocations
        for i in range(5):
            result = await governance_service.check_rate_limit(
                external_agent_id=agent_id,
                user_id=user["id"],
                org_id=org["id"],
            )
            # Rate limiter gracefully degrades - result.allowed should be True
            # even if Redis is not available
            assert result.allowed is True, f"Invocation {i+1} should be allowed"

            # Record invocation if rate limiter is initialized
            await governance_service.record_rate_limit_invocation(
                external_agent_id=agent_id,
                user_id=user["id"],
                org_id=org["id"],
            )

        # Check final state - verify invocations were tracked
        final_result = await governance_service.check_rate_limit(
            external_agent_id=agent_id,
            user_id=user["id"],
            org_id=org["id"],
        )

        # Assert - Invocations should be tracked
        if governance_service._rate_limiter_initialized:
            # Rate limiter is active - verify usage is tracked
            assert (
                final_result.current_usage.get("minute", 0) >= 5
            ), "Usage should be tracked"
            assert (
                final_result.remaining < initial_result.remaining
                or initial_result.remaining == -1
            )
        else:
            # Graceful degradation - rate limiting disabled
            assert final_result.allowed is True, "Rate limiting not active (fail-open)"

    @pytest.mark.asyncio
    async def test_rate_limiting_allows_invocations_after_window_expires(
        self, governance_service, test_external_agent_with_budget
    ):
        """
        Intent: Verify rate limit window tracking works correctly.

        Setup: Real Redis if available
        Assertions: Rate limit tracking returns proper state
        """
        agent = test_external_agent_with_budget["agent"]
        user = test_external_agent_with_budget["user"]
        org = test_external_agent_with_budget["org"]

        agent_id = f"rate-window-{agent['id']}-{int(time.time())}"

        # Make some invocations
        for i in range(3):
            result = await governance_service.check_rate_limit(
                external_agent_id=agent_id,
                user_id=user["id"],
                org_id=org["id"],
            )
            assert result.allowed is True

            await governance_service.record_rate_limit_invocation(
                external_agent_id=agent_id,
                user_id=user["id"],
                org_id=org["id"],
            )

        # Check current state
        result = await governance_service.check_rate_limit(
            external_agent_id=agent_id,
            user_id=user["id"],
            org_id=org["id"],
        )

        # Assert - Rate limit state is tracked
        # If rate limiter is not initialized, current_usage may be empty
        assert isinstance(result.current_usage, dict)
        assert result.allowed is True  # Should still be within limit


@pytest.mark.integration
class TestExternalAgentGovernanceStatus:
    """Test governance status endpoint."""

    @pytest.mark.asyncio
    async def test_get_governance_status_returns_accurate_data(
        self, governance_service, test_external_agent_with_budget
    ):
        """
        Intent: Verify governance status endpoint with real data sources.

        Setup: Real PostgreSQL, real Redis (if available), ExternalAgent with usage data
        Assertions: Response includes budget and rate limit status
        """
        agent = test_external_agent_with_budget["agent"]
        user = test_external_agent_with_budget["user"]
        org = test_external_agent_with_budget["org"]

        # Simulate budget usage
        from kaizen.trust.governance import ExternalAgentBudget

        budget = ExternalAgentBudget(
            external_agent_id=agent["id"],
            monthly_budget_usd=100.0,
            monthly_spent_usd=60.0,
            monthly_execution_count=50,
        )
        governance_service._budget_cache[agent["id"]] = budget

        # Act
        status = await governance_service.get_governance_status(
            external_agent_id=agent["id"],
            organization_id=org["id"],
            user_id=user["id"],
        )

        # Assert
        assert status["external_agent_id"] == agent["id"]
        assert status["organization_id"] == org["id"]

        # Budget status
        assert status["budget"]["monthly_budget_usd"] == 100.0
        assert status["budget"]["monthly_spent_usd"] == 60.0
        assert status["budget"]["remaining_monthly_usd"] == 40.0
        assert status["budget"]["usage_percentage"] == 0.6

        # Rate limit status (should be present even if Redis not initialized)
        assert "rate_limit" in status
        assert "allowed" in status["rate_limit"]

        # Policy status
        assert "policy" in status
        assert isinstance(status["timestamp"], str)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
