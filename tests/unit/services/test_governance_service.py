"""
Tier 1 Unit Tests for GovernanceService

Tests governance logic in isolation with mocked dependencies.
Intent: Verify budget, rate limiting, and policy evaluation logic.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest
from studio_kaizen.trust.governance import (
    ExternalAgentBudget,
    ExternalAgentPolicyContext,
    ExternalAgentPrincipal,
    PolicyEffect,
    PolicyEvaluationResult,
    RateLimitCheckResult,
)
from studio.services.governance_service import GovernanceService


class TestGovernanceServiceBudget:
    """Test budget enforcement functionality."""

    @pytest.mark.asyncio
    async def test_check_budget_returns_false_when_budget_exceeded(self):
        """
        Intent: Ensure budget enforcement blocks over-budget invocations.

        Verifies that check_budget() returns allowed=False when monthly budget
        would be exceeded by the estimated cost.
        """
        # Arrange
        service = GovernanceService()

        # Mock budget with 90% spent
        budget = ExternalAgentBudget(
            external_agent_id="test-agent",
            monthly_budget_usd=100.0,
            monthly_spent_usd=95.0,  # 95% used
            monthly_execution_limit=1000,
            monthly_execution_count=100,
        )

        # Mock _get_agent_budget to return our test budget
        service._get_agent_budget = AsyncMock(return_value=budget)

        # Act - Try to spend $10 (would exceed $100 budget)
        result = await service.check_budget(
            external_agent_id="test-agent",
            organization_id="org-001",
            estimated_cost=10.0,
        )

        # Assert
        assert result.allowed is False
        assert "budget" in result.reason.lower()
        assert result.remaining_budget_usd == 5.0  # $100 - $95

    @pytest.mark.asyncio
    async def test_check_budget_returns_true_when_budget_available(self):
        """
        Intent: Ensure budget enforcement allows within-budget invocations.

        Verifies that check_budget() returns allowed=True when sufficient
        budget remains for the estimated cost.
        """
        # Arrange
        service = GovernanceService()

        # Mock budget with 50% spent
        budget = ExternalAgentBudget(
            external_agent_id="test-agent",
            monthly_budget_usd=100.0,
            monthly_spent_usd=50.0,  # 50% used
            monthly_execution_limit=1000,
            monthly_execution_count=100,
        )

        service._get_agent_budget = AsyncMock(return_value=budget)

        # Act - Try to spend $10 (within budget)
        result = await service.check_budget(
            external_agent_id="test-agent",
            organization_id="org-001",
            estimated_cost=10.0,
        )

        # Assert
        assert result.allowed is True
        assert result.reason == "Within budget"  # Now includes reason when allowed
        assert result.remaining_budget_usd == 50.0  # $100 - $50

    @pytest.mark.asyncio
    async def test_check_budget_triggers_warning_at_threshold(self):
        """
        Intent: Verify warning threshold detection.

        Ensures that check_budget() detects when usage exceeds warning threshold
        (80% by default) even if invocation is still allowed.
        """
        # Arrange
        service = GovernanceService()

        # Mock budget at 85% (above 80% warning threshold)
        budget = ExternalAgentBudget(
            external_agent_id="test-agent",
            monthly_budget_usd=100.0,
            monthly_spent_usd=85.0,  # 85% used
            warning_threshold=0.80,
            degradation_threshold=0.90,
        )

        service._get_agent_budget = AsyncMock(return_value=budget)

        # Act
        result = await service.check_budget(
            external_agent_id="test-agent",
            organization_id="org-001",
            estimated_cost=5.0,
        )

        # Assert
        assert result.allowed is True
        assert result.warning_triggered is True
        assert result.usage_percentage >= 0.80

    @pytest.mark.asyncio
    async def test_check_budget_triggers_degradation_at_threshold(self):
        """
        Intent: Verify degradation threshold detection.

        Ensures that check_budget() detects when usage exceeds degradation
        threshold (90% by default) and sets degraded_mode=True.
        """
        # Arrange
        service = GovernanceService()

        # Mock budget at 92% (above 90% degradation threshold)
        budget = ExternalAgentBudget(
            external_agent_id="test-agent",
            monthly_budget_usd=100.0,
            monthly_spent_usd=92.0,  # 92% used
            degradation_threshold=0.90,
        )

        service._get_agent_budget = AsyncMock(return_value=budget)

        # Act
        result = await service.check_budget(
            external_agent_id="test-agent",
            organization_id="org-001",
            estimated_cost=3.0,
        )

        # Assert
        assert result.allowed is True
        assert result.degraded_mode is True
        assert result.usage_percentage >= 0.90

    @pytest.mark.asyncio
    async def test_record_invocation_cost_updates_budget(self):
        """
        Intent: Verify cost tracking updates budget state.

        Ensures that record_invocation_cost() correctly updates monthly_spent_usd
        and monthly_execution_count.
        """
        # Arrange
        service = GovernanceService()

        budget = ExternalAgentBudget(
            external_agent_id="test-agent",
            monthly_budget_usd=100.0,
            monthly_spent_usd=50.0,
            monthly_execution_count=10,
        )

        service._get_agent_budget = AsyncMock(return_value=budget)

        # Mock budget enforcer record_usage
        service.budget_enforcer.record_usage = AsyncMock(
            return_value=ExternalAgentBudget(
                external_agent_id="test-agent",
                monthly_budget_usd=100.0,
                monthly_spent_usd=60.0,  # Updated
                monthly_execution_count=11,  # Updated
            )
        )

        # Act
        await service.record_invocation_cost(
            external_agent_id="test-agent",
            organization_id="org-001",
            actual_cost=10.0,
            execution_success=True,
        )

        # Assert
        service.budget_enforcer.record_usage.assert_called_once()
        call_args = service.budget_enforcer.record_usage.call_args
        assert call_args[0][1] == 10.0  # actual_cost
        assert call_args[0][2] is True  # execution_success


class TestGovernanceServiceRateLimit:
    """Test rate limiting functionality."""

    @pytest.mark.asyncio
    async def test_check_rate_limit_returns_false_when_minute_limit_exceeded(self):
        """
        Intent: Ensure rate limiting blocks over-limit invocations in minute window.

        Verifies that check_rate_limit() returns allowed=False when the
        per-minute rate limit is exceeded.
        """
        # Arrange
        service = GovernanceService()

        # Mock rate limiter to return exceeded result
        mock_result = RateLimitCheckResult(
            allowed=False,
            limit_exceeded="per_minute",
            remaining=0,
            retry_after_seconds=30,
            current_usage={"minute": 60, "hour": 500, "day": 1000},
        )

        service.rate_limiter = MagicMock()
        service.rate_limiter.check_rate_limit = AsyncMock(return_value=mock_result)
        service._rate_limiter_initialized = True

        # Act
        result = await service.check_rate_limit(
            external_agent_id="test-agent",
            user_id="user-001",
        )

        # Assert
        assert result.allowed is False
        assert result.limit_exceeded == "per_minute"
        assert result.retry_after_seconds == 30
        assert result.current_usage["minute"] == 60

    @pytest.mark.asyncio
    async def test_check_rate_limit_returns_false_when_hour_limit_exceeded(self):
        """
        Intent: Ensure rate limiting blocks over-limit invocations in hour window.

        Verifies that check_rate_limit() returns allowed=False when the
        per-hour rate limit is exceeded.
        """
        # Arrange
        service = GovernanceService()

        # Mock rate limiter to return exceeded result
        mock_result = RateLimitCheckResult(
            allowed=False,
            limit_exceeded="per_hour",
            remaining=0,
            retry_after_seconds=1800,
            current_usage={"minute": 50, "hour": 1000, "day": 5000},
        )

        service.rate_limiter = MagicMock()
        service.rate_limiter.check_rate_limit = AsyncMock(return_value=mock_result)
        service._rate_limiter_initialized = True

        # Act
        result = await service.check_rate_limit(
            external_agent_id="test-agent",
            user_id="user-001",
        )

        # Assert
        assert result.allowed is False
        assert result.limit_exceeded == "per_hour"
        assert result.retry_after_seconds == 1800

    @pytest.mark.asyncio
    async def test_check_rate_limit_returns_true_when_under_limit(self):
        """
        Intent: Ensure rate limiting allows under-limit invocations.

        Verifies that check_rate_limit() returns allowed=True when all
        rate limit windows have capacity.
        """
        # Arrange
        service = GovernanceService()

        # Mock rate limiter to return allowed result
        mock_result = RateLimitCheckResult(
            allowed=True,
            limit_exceeded=None,
            remaining=40,
            retry_after_seconds=None,
            current_usage={"minute": 20, "hour": 500, "day": 2000},
        )

        service.rate_limiter = MagicMock()
        service.rate_limiter.check_rate_limit = AsyncMock(return_value=mock_result)
        service._rate_limiter_initialized = True

        # Act
        result = await service.check_rate_limit(
            external_agent_id="test-agent",
            user_id="user-001",
        )

        # Assert
        assert result.allowed is True
        assert result.limit_exceeded is None
        assert result.remaining == 40

    @pytest.mark.asyncio
    async def test_check_rate_limit_fails_open_when_redis_unavailable(self):
        """
        Intent: Ensure graceful degradation when Redis unavailable.

        Verifies that check_rate_limit() returns allowed=True (fail-open)
        when rate limiter is not initialized.
        """
        # Arrange
        service = GovernanceService()
        service.rate_limiter = None
        service._rate_limiter_initialized = False

        # Act
        result = await service.check_rate_limit(
            external_agent_id="test-agent",
            user_id="user-001",
        )

        # Assert - Should fail-open (allow request)
        assert result.allowed is True
        assert result.remaining == -1  # Unknown


class TestGovernanceServicePolicy:
    """Test policy evaluation functionality."""

    @pytest.mark.asyncio
    async def test_evaluate_policy_returns_allow_when_conditions_met(self):
        """
        Intent: Verify policy evaluation returns ALLOW when conditions satisfied.

        Ensures that evaluate_policy() returns effect=ALLOW when all policy
        conditions are met.
        """
        # Arrange
        service = GovernanceService()

        # Mock policy evaluation result
        mock_result = PolicyEvaluationResult(
            effect=PolicyEffect.ALLOW,
            reason="Allowed by policy: allow_production",
            matched_policies=["policy-001"],
            evaluation_time_ms=5.2,
        )

        service.policy_engine.evaluate_policies = AsyncMock(return_value=mock_result)

        # Create test context
        context = ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="test-agent",
                provider="copilot_studio",
                environment="production",
                org_id="org-001",
            ),
            action="invoke",
            resource="test-agent",
        )

        # Act
        result = await service.evaluate_policy("test-agent", context)

        # Assert
        assert result.effect == PolicyEffect.ALLOW
        assert "allow_production" in result.reason
        assert "policy-001" in result.matched_policies

    @pytest.mark.asyncio
    async def test_evaluate_policy_returns_deny_when_conditions_not_met(self):
        """
        Intent: Verify policy evaluation returns DENY when conditions not satisfied.

        Ensures that evaluate_policy() returns effect=DENY when policy
        conditions are not met (e.g., wrong environment, blocked provider).
        """
        # Arrange
        service = GovernanceService()

        # Mock policy evaluation result
        mock_result = PolicyEvaluationResult(
            effect=PolicyEffect.DENY,
            reason="Denied by policy: block_development",
            matched_policies=["policy-002"],
            evaluation_time_ms=3.1,
        )

        service.policy_engine.evaluate_policies = AsyncMock(return_value=mock_result)

        # Create test context
        context = ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="test-agent",
                provider="webhook",
                environment="development",
                org_id="org-001",
            ),
            action="invoke",
            resource="test-agent",
        )

        # Act
        result = await service.evaluate_policy("test-agent", context)

        # Assert
        assert result.effect == PolicyEffect.DENY
        assert "block_development" in result.reason

    @pytest.mark.asyncio
    async def test_evaluate_policy_fails_closed_on_error(self):
        """
        Intent: Ensure policy evaluation fails-closed (DENY) on error.

        Verifies that evaluate_policy() returns effect=DENY when policy
        engine raises an exception (fail-closed for security).
        """
        # Arrange
        service = GovernanceService()

        # Mock policy engine to raise exception
        service.policy_engine.evaluate_policies = AsyncMock(
            side_effect=Exception("Policy database unavailable")
        )

        # Create test context
        context = ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="test-agent",
                provider="copilot_studio",
                environment="production",
                org_id="org-001",
            ),
            action="invoke",
            resource="test-agent",
        )

        # Act
        result = await service.evaluate_policy("test-agent", context)

        # Assert - Should fail-closed (DENY)
        assert result.effect == PolicyEffect.DENY
        assert "failed" in result.reason.lower()


class TestGovernanceServiceStatus:
    """Test governance status reporting."""

    @pytest.mark.asyncio
    async def test_get_governance_status_returns_comprehensive_data(self):
        """
        Intent: Verify governance status endpoint returns all required data.

        Ensures that get_governance_status() returns budget, rate limit,
        and policy information in the expected format.
        """
        # Arrange
        service = GovernanceService()

        # Mock budget
        budget = ExternalAgentBudget(
            external_agent_id="test-agent",
            monthly_budget_usd=100.0,
            monthly_spent_usd=60.0,
            monthly_execution_limit=1000,
            monthly_execution_count=500,
        )

        service._get_agent_budget = AsyncMock(return_value=budget)

        # Mock rate limit check
        rate_limit_result = RateLimitCheckResult(
            allowed=True,
            remaining=40,
            current_usage={"minute": 20, "hour": 500, "day": 2000},
        )

        service.rate_limiter = MagicMock()
        service.rate_limiter.check_rate_limit = AsyncMock(
            return_value=rate_limit_result
        )
        service._rate_limiter_initialized = True

        # Act
        status = await service.get_governance_status(
            external_agent_id="test-agent",
            organization_id="org-001",
            user_id="user-001",
        )

        # Assert
        assert status["external_agent_id"] == "test-agent"
        assert status["organization_id"] == "org-001"

        # Budget status
        assert status["budget"]["monthly_budget_usd"] == 100.0
        assert status["budget"]["monthly_spent_usd"] == 60.0
        assert status["budget"]["remaining_monthly_usd"] == 40.0
        assert status["budget"]["usage_percentage"] == 0.6

        # Rate limit status
        assert status["rate_limit"]["allowed"] is True
        assert status["rate_limit"]["remaining"] == 40

        # Policy status
        assert "policy" in status
        assert isinstance(status["timestamp"], str)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
