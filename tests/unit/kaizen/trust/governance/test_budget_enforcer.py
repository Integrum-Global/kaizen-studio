"""
Tier 1 Unit Tests: Budget Enforcer

Tests ExternalAgentBudgetEnforcer logic without database/infrastructure.
Uses InMemoryBudgetStore for isolation.
"""

import pytest
from datetime import datetime

from studio_kaizen.trust.governance.budget_enforcer import ExternalAgentBudgetEnforcer
from studio_kaizen.trust.governance.config import ExternalAgentBudgetConfig
from studio_kaizen.trust.governance.store import InMemoryBudgetStore
from studio_kaizen.trust.governance.types import (
    BudgetScope,
    ExternalAgentBudget,
)


class TestBudgetCheckWithinLimit:
    """Tests for budget checks when within limits."""

    @pytest.fixture
    def enforcer(self):
        """Create enforcer with in-memory store."""
        store = InMemoryBudgetStore()
        return ExternalAgentBudgetEnforcer(store=store)

    @pytest.mark.asyncio
    async def test_check_budget_allowed(self, enforcer):
        """Test budget check when under budget."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            monthly_spent_usd=100.0
        )

        result = await enforcer.check_budget(budget, estimated_cost=50.0)

        assert result.allowed is True
        assert result.remaining_budget_usd == 900.0
        assert result.usage_percentage == pytest.approx(0.1, rel=0.01)
        assert result.degraded_mode is False

    @pytest.mark.asyncio
    async def test_check_budget_allowed_near_limit(self, enforcer):
        """Test budget check when near but under limit."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=100.0,
            monthly_spent_usd=95.0
        )

        result = await enforcer.check_budget(budget, estimated_cost=4.0)

        assert result.allowed is True
        assert result.remaining_budget_usd == 5.0

    @pytest.mark.asyncio
    async def test_check_budget_with_zero_spend(self, enforcer):
        """Test budget check with no previous spending."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            monthly_spent_usd=0.0
        )

        result = await enforcer.check_budget(budget, estimated_cost=100.0)

        assert result.allowed is True
        assert result.remaining_budget_usd == 1000.0
        assert result.usage_percentage == 0.0


class TestBudgetCheckExceedsLimit:
    """Tests for budget checks when exceeding limits."""

    @pytest.fixture
    def enforcer(self):
        """Create enforcer with hard enforcement."""
        config = ExternalAgentBudgetConfig(enforcement_mode="hard")
        store = InMemoryBudgetStore()
        return ExternalAgentBudgetEnforcer(config=config, store=store)

    @pytest.mark.asyncio
    async def test_check_budget_exceeds_monthly(self, enforcer):
        """Test budget check when monthly budget exceeded."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=100.0,
            monthly_spent_usd=95.0,
            enforcement_mode="hard"
        )

        result = await enforcer.check_budget(budget, estimated_cost=10.0)

        assert result.allowed is False
        assert "exceeded" in result.reason.lower()
        assert result.remaining_budget_usd == 5.0

    @pytest.mark.asyncio
    async def test_check_budget_exceeds_daily(self, enforcer):
        """Test budget check when daily budget exceeded."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            monthly_spent_usd=50.0,
            daily_budget_usd=10.0,
            daily_spent_usd=8.0,
            enforcement_mode="hard"
        )

        result = await enforcer.check_budget(budget, estimated_cost=5.0)

        assert result.allowed is False
        assert "daily" in result.reason.lower()

    @pytest.mark.asyncio
    async def test_check_budget_exceeds_execution_limit(self, enforcer):
        """Test budget check when execution count exceeded."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            monthly_spent_usd=50.0,
            monthly_execution_limit=100,
            monthly_execution_count=100,
            enforcement_mode="hard"
        )

        result = await enforcer.check_budget(budget, estimated_cost=1.0)

        assert result.allowed is False
        assert "execution" in result.reason.lower()


class TestBudgetCheckSoftEnforcement:
    """Tests for soft enforcement mode."""

    @pytest.fixture
    def enforcer(self):
        """Create enforcer with soft enforcement."""
        config = ExternalAgentBudgetConfig(enforcement_mode="soft")
        store = InMemoryBudgetStore()
        return ExternalAgentBudgetEnforcer(config=config, store=store)

    @pytest.mark.asyncio
    async def test_soft_enforcement_allows_over_budget(self, enforcer):
        """Test soft enforcement allows requests when over budget."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=100.0,
            monthly_spent_usd=95.0,
            enforcement_mode="soft"
        )

        result = await enforcer.check_budget(budget, estimated_cost=10.0)

        # Soft enforcement allows but marks degraded
        assert result.allowed is True
        assert result.degraded_mode is True


class TestBudgetWarningThreshold:
    """Tests for warning threshold detection."""

    @pytest.fixture
    def enforcer(self):
        """Create enforcer with custom warning threshold."""
        config = ExternalAgentBudgetConfig(warning_threshold=0.75)
        store = InMemoryBudgetStore()
        return ExternalAgentBudgetEnforcer(config=config, store=store)

    @pytest.mark.asyncio
    async def test_warning_below_threshold(self, enforcer):
        """Test no warning when below threshold."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=100.0,
            monthly_spent_usd=70.0
        )

        result = await enforcer.check_budget(budget, estimated_cost=1.0)

        assert result.allowed is True
        assert result.warning_triggered is False

    @pytest.mark.asyncio
    async def test_warning_at_threshold(self, enforcer):
        """Test warning triggered at threshold."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=100.0,
            monthly_spent_usd=75.0
        )

        result = await enforcer.check_budget(budget, estimated_cost=1.0)

        assert result.allowed is True
        assert result.warning_triggered is True
        assert result.warning_message is not None

    @pytest.mark.asyncio
    async def test_warning_above_threshold(self, enforcer):
        """Test warning when above threshold."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=100.0,
            monthly_spent_usd=80.0
        )

        result = await enforcer.check_budget(budget, estimated_cost=1.0)

        assert result.allowed is True
        assert result.warning_triggered is True


class TestBudgetDegradationThreshold:
    """Tests for degradation threshold detection."""

    @pytest.fixture
    def enforcer(self):
        """Create enforcer with custom degradation threshold."""
        config = ExternalAgentBudgetConfig(degradation_threshold=0.90)
        store = InMemoryBudgetStore()
        return ExternalAgentBudgetEnforcer(config=config, store=store)

    @pytest.mark.asyncio
    async def test_degraded_mode_at_threshold(self, enforcer):
        """Test degraded mode at degradation threshold."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=100.0,
            monthly_spent_usd=90.0
        )

        result = await enforcer.check_budget(budget, estimated_cost=1.0)

        assert result.allowed is True
        assert result.degraded_mode is True


class TestRecordUsage:
    """Tests for usage recording."""

    @pytest.fixture
    def enforcer(self):
        """Create enforcer with in-memory store."""
        store = InMemoryBudgetStore()
        return ExternalAgentBudgetEnforcer(store=store)

    @pytest.mark.asyncio
    async def test_record_usage_updates_budget(self, enforcer):
        """Test that recording usage updates budget counters."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            monthly_spent_usd=100.0,
            monthly_execution_count=10
        )

        updated = await enforcer.record_usage(
            budget,
            actual_cost=50.0,
            execution_success=True,
            metadata={"duration_ms": 1500}
        )

        assert updated.monthly_spent_usd == 150.0
        assert updated.monthly_execution_count == 11

    @pytest.mark.asyncio
    async def test_record_usage_updates_daily(self, enforcer):
        """Test that recording usage updates daily counters."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            monthly_spent_usd=0.0,
            daily_budget_usd=50.0,
            daily_spent_usd=10.0
        )

        updated = await enforcer.record_usage(
            budget,
            actual_cost=5.0,
            execution_success=True
        )

        assert updated.daily_spent_usd == 15.0

    @pytest.mark.asyncio
    async def test_record_usage_with_failure(self, enforcer):
        """Test recording usage for failed execution."""
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            monthly_spent_usd=0.0
        )

        updated = await enforcer.record_usage(
            budget,
            actual_cost=0.01,  # Minimal cost for failed request
            execution_success=False
        )

        # Cost still recorded even for failures
        assert updated.monthly_spent_usd == 0.01


class TestBudgetStatus:
    """Tests for budget status retrieval."""

    @pytest.fixture
    def enforcer(self):
        """Create enforcer with in-memory store."""
        store = InMemoryBudgetStore()
        return ExternalAgentBudgetEnforcer(store=store)

    @pytest.mark.asyncio
    async def test_get_budget_status_no_budget(self, enforcer):
        """Test status when no budget configured."""
        scope = BudgetScope(organization_id="org-001", agent_id="agent-001")

        status = await enforcer.get_budget_status("agent-001", scope)

        # Should return empty/default status
        assert status.cost_used == 0.0
        assert status.period == "monthly"

    @pytest.mark.asyncio
    async def test_get_budget_status_with_budget(self, enforcer):
        """Test status with configured budget."""
        scope = BudgetScope(organization_id="org-001", agent_id="agent-001")
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0,
            monthly_spent_usd=500.0,
            monthly_execution_limit=1000,
            monthly_execution_count=250
        )

        # Store the budget
        await enforcer.store.update_budget("agent-001", scope, budget)

        status = await enforcer.get_budget_status("agent-001", scope)

        assert status.cost_used == 500.0
        assert status.cost_limit == 1000.0
        assert status.cost_remaining == 500.0
        assert status.invocations == 250
        assert status.usage_percentage == pytest.approx(0.5, rel=0.01)


class TestHierarchicalScopes:
    """Tests for hierarchical budget scopes."""

    @pytest.fixture
    def enforcer(self):
        """Create enforcer with in-memory store."""
        store = InMemoryBudgetStore()
        return ExternalAgentBudgetEnforcer(store=store)

    @pytest.mark.asyncio
    async def test_org_scope(self, enforcer):
        """Test organization-level scope."""
        scope = BudgetScope(organization_id="org-001")
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=10000.0
        )

        await enforcer.store.update_budget("agent-001", scope, budget)
        retrieved = await enforcer.store.get_budget("agent-001", scope)

        assert retrieved is not None
        assert retrieved.monthly_budget_usd == 10000.0

    @pytest.mark.asyncio
    async def test_team_scope(self, enforcer):
        """Test team-level scope."""
        scope = BudgetScope(organization_id="org-001", team_id="team-001")
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=5000.0
        )

        await enforcer.store.update_budget("agent-001", scope, budget)
        retrieved = await enforcer.store.get_budget("agent-001", scope)

        assert retrieved is not None
        assert retrieved.monthly_budget_usd == 5000.0

    @pytest.mark.asyncio
    async def test_user_scope(self, enforcer):
        """Test user-level scope."""
        scope = BudgetScope(
            organization_id="org-001",
            team_id="team-001",
            user_id="user-001"
        )
        budget = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=1000.0
        )

        await enforcer.store.update_budget("agent-001", scope, budget)
        retrieved = await enforcer.store.get_budget("agent-001", scope)

        assert retrieved is not None
        assert retrieved.monthly_budget_usd == 1000.0

    @pytest.mark.asyncio
    async def test_scope_isolation(self, enforcer):
        """Test that different scopes are isolated."""
        scope_org = BudgetScope(organization_id="org-001")
        scope_team = BudgetScope(organization_id="org-001", team_id="team-001")

        budget_org = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=10000.0
        )
        budget_team = ExternalAgentBudget(
            external_agent_id="agent-001",
            monthly_budget_usd=5000.0
        )

        await enforcer.store.update_budget("agent-001", scope_org, budget_org)
        await enforcer.store.update_budget("agent-001", scope_team, budget_team)

        retrieved_org = await enforcer.store.get_budget("agent-001", scope_org)
        retrieved_team = await enforcer.store.get_budget("agent-001", scope_team)

        assert retrieved_org.monthly_budget_usd == 10000.0
        assert retrieved_team.monthly_budget_usd == 5000.0
