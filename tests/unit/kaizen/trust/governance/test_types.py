"""
Tier 1 Unit Tests: Budget Types

Tests core type definitions without any infrastructure.
"""

import pytest
from datetime import datetime

from studio_kaizen.trust.governance.types import (
    BudgetScope,
    BudgetCheckResult,
    BudgetStatus,
    BudgetUsageRecord,
    ExternalAgentBudget,
    RateLimitConfig,
    RateLimitCheckResult,
    PolicyEffect,
    ConflictResolutionStrategy,
    PolicyCondition,
    ExternalAgentPrincipal,
    ExternalAgentPolicyContext,
    ExternalAgentPolicy,
    PolicyEvaluationResult,
)


class TestBudgetScope:
    """Tests for BudgetScope dataclass."""

    def test_budget_scope_creation(self):
        """Test creating a budget scope."""
        scope = BudgetScope(organization_id="org-001")
        assert scope.organization_id == "org-001"
        assert scope.team_id is None
        assert scope.user_id is None
        assert scope.agent_id is None

    def test_budget_scope_with_team(self):
        """Test budget scope with team."""
        scope = BudgetScope(organization_id="org-001", team_id="team-001")
        assert scope.team_id == "team-001"

    def test_budget_scope_full(self):
        """Test budget scope with all fields."""
        scope = BudgetScope(
            organization_id="org-001",
            team_id="team-001",
            user_id="user-001",
            agent_id="agent-001"
        )
        assert scope.organization_id == "org-001"
        assert scope.team_id == "team-001"
        assert scope.user_id == "user-001"
        assert scope.agent_id == "agent-001"

    def test_budget_scope_to_key(self):
        """Test generating cache key from scope."""
        scope = BudgetScope(organization_id="org-001")
        assert scope.to_key() == "org:org-001"

    def test_budget_scope_to_key_full(self):
        """Test generating cache key with all fields."""
        scope = BudgetScope(
            organization_id="org-001",
            team_id="team-001",
            user_id="user-001",
            agent_id="agent-001"
        )
        key = scope.to_key()
        assert "org:org-001" in key
        assert "team:team-001" in key
        assert "user:user-001" in key
        assert "agent:agent-001" in key


class TestBudgetCheckResult:
    """Tests for BudgetCheckResult dataclass."""

    def test_budget_check_result_allowed(self):
        """Test allowed budget check result."""
        result = BudgetCheckResult(
            allowed=True,
            remaining_budget_usd=500.0,
            usage_percentage=0.5
        )
        assert result.allowed is True
        assert result.remaining_budget_usd == 500.0
        assert result.usage_percentage == 0.5
        assert result.degraded_mode is False

    def test_budget_check_result_denied(self):
        """Test denied budget check result."""
        result = BudgetCheckResult(
            allowed=False,
            reason="Monthly budget exceeded",
            remaining_budget_usd=0.0,
            usage_percentage=1.0
        )
        assert result.allowed is False
        assert "exceeded" in result.reason
        assert result.remaining_budget_usd == 0.0

    def test_budget_check_result_warning(self):
        """Test budget check result with warning."""
        result = BudgetCheckResult(
            allowed=True,
            warning_triggered=True,
            warning_message="Budget at 80%",
            usage_percentage=0.8
        )
        assert result.allowed is True
        assert result.warning_triggered is True
        assert result.warning_message is not None

    def test_budget_check_result_degraded(self):
        """Test budget check result in degraded mode."""
        result = BudgetCheckResult(
            allowed=True,
            degraded_mode=True,
            usage_percentage=0.95
        )
        assert result.allowed is True
        assert result.degraded_mode is True


class TestExternalAgentBudget:
    """Tests for ExternalAgentBudget dataclass."""

    def test_external_agent_budget_creation(self):
        """Test creating an external agent budget."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0
        )
        assert budget.external_agent_id == "agent-001"
        assert budget.monthly_budget_usd == 1000.0
        assert budget.monthly_spent_usd == 0.0

    def test_external_agent_budget_with_spending(self):
        """Test budget with some spending."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            monthly_spent_usd=250.0
        )
        remaining = budget.monthly_budget_usd - budget.monthly_spent_usd
        assert remaining == 750.0

    def test_external_agent_budget_with_daily_limit(self):
        """Test budget with daily limit."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            daily_budget_usd=50.0,
            daily_spent_usd=10.0
        )
        assert budget.daily_budget_usd == 50.0
        assert budget.daily_spent_usd == 10.0

    def test_external_agent_budget_execution_limits(self):
        """Test budget with execution limits."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            monthly_execution_limit=10000,
            monthly_execution_count=500
        )
        remaining = budget.monthly_execution_limit - budget.monthly_execution_count
        assert remaining == 9500

    def test_external_agent_budget_enforcement_modes(self):
        """Test different enforcement modes."""
        hard_budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            enforcement_mode="hard"
        )
        assert hard_budget.enforcement_mode == "hard"

        soft_budget = ExternalAgentBudget(
            external_agent_id="agent-002",
            monthly_budget_usd=1000.0,
            enforcement_mode="soft"
        )
        assert soft_budget.enforcement_mode == "soft"


class TestRateLimitConfig:
    """Tests for RateLimitConfig dataclass."""

    def test_rate_limit_config_defaults(self):
        """Test default rate limit config."""
        config = RateLimitConfig()
        assert config.requests_per_minute == 60
        assert config.requests_per_hour == 1000
        assert config.requests_per_day == 10000

    def test_rate_limit_config_custom(self):
        """Test custom rate limit config."""
        config = RateLimitConfig(
            requests_per_minute=120,
            requests_per_hour=5000,
            requests_per_day=50000
        )
        assert config.requests_per_minute == 120
        assert config.requests_per_hour == 5000
        assert config.requests_per_day == 50000


class TestRateLimitCheckResult:
    """Tests for RateLimitCheckResult dataclass."""

    def test_rate_limit_allowed(self):
        """Test allowed rate limit result."""
        result = RateLimitCheckResult(
            allowed=True,
            remaining=50,
            current_usage={"minute": 10}
        )
        assert result.allowed is True
        assert result.remaining == 50
        assert result.limit_exceeded is None

    def test_rate_limit_exceeded(self):
        """Test rate limit exceeded result."""
        result = RateLimitCheckResult(
            allowed=False,
            limit_exceeded="requests_per_minute",
            remaining=0,
            retry_after_seconds=60
        )
        assert result.allowed is False
        assert result.limit_exceeded == "requests_per_minute"
        assert result.retry_after_seconds == 60


class TestPolicyTypes:
    """Tests for policy-related types."""

    def test_policy_effect_enum(self):
        """Test PolicyEffect enum values."""
        assert PolicyEffect.ALLOW.value == "allow"
        assert PolicyEffect.DENY.value == "deny"

    def test_conflict_resolution_strategy_enum(self):
        """Test ConflictResolutionStrategy enum values."""
        assert ConflictResolutionStrategy.DENY_OVERRIDES.value == "deny_overrides"
        assert ConflictResolutionStrategy.ALLOW_OVERRIDES.value == "allow_overrides"
        assert ConflictResolutionStrategy.FIRST_MATCH.value == "first_match"

    def test_policy_condition_environment(self):
        """Test environment policy condition."""
        condition = PolicyCondition(
            type="environment",
            environments=["production", "staging"]
        )
        assert condition.type == "environment"
        assert "production" in condition.environments

    def test_policy_condition_time(self):
        """Test time-based policy condition."""
        condition = PolicyCondition(
            type="time",
            time_range={"start": "09:00", "end": "17:00", "days": [1, 2, 3, 4, 5]}
        )
        assert condition.type == "time"
        assert condition.time_range["start"] == "09:00"

    def test_external_agent_principal(self):
        """Test ExternalAgentPrincipal creation."""
        principal = ExternalAgentPrincipal(
            external_agent_id="agent-001",
            provider="copilot_studio",
            environment="production",
            org_id="org-001",
            user_id="user-001",
            roles=["admin", "user"]
        )
        assert principal.external_agent_id == "agent-001"
        assert principal.provider == "copilot_studio"
        assert "admin" in principal.roles

    def test_external_agent_policy_context(self):
        """Test ExternalAgentPolicyContext creation."""
        principal = ExternalAgentPrincipal(
            external_agent_id="agent-001",
            provider="custom",
            environment="production",
            org_id="org-001"
        )
        context = ExternalAgentPolicyContext(
            principal=principal,
            action="invoke",
            resource="agent-001"
        )
        assert context.action == "invoke"
        assert context.resource == "agent-001"
        assert context.principal.environment == "production"

    def test_external_agent_policy(self):
        """Test ExternalAgentPolicy creation."""
        policy = ExternalAgentPolicy(
            policy_id="pol-001",
            name="Production Access",
            effect=PolicyEffect.ALLOW,
            conditions=[
                PolicyCondition(type="environment", environments=["production"])
            ],
            priority=10,
            enabled=True
        )
        assert policy.policy_id == "pol-001"
        assert policy.effect == PolicyEffect.ALLOW
        assert len(policy.conditions) == 1
        assert policy.priority == 10

    def test_policy_evaluation_result(self):
        """Test PolicyEvaluationResult creation."""
        result = PolicyEvaluationResult(
            effect=PolicyEffect.ALLOW,
            reason="Allowed by production policy",
            matched_policies=["pol-001", "pol-002"],
            evaluation_time_ms=1.5
        )
        assert result.effect == PolicyEffect.ALLOW
        assert len(result.matched_policies) == 2
        assert result.evaluation_time_ms == 1.5
