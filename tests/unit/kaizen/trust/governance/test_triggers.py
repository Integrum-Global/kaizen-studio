"""
Tier 1 Unit Tests: Approval Trigger Evaluation

Tests trigger evaluation without any infrastructure dependencies.
"""

import pytest
from datetime import datetime, timedelta

from studio_kaizen.trust.governance.triggers import (
    TriggerContext,
    TriggerResult,
    ApprovalTriggerEvaluator,
    InMemoryHistoryProvider,
)
from studio_kaizen.trust.governance.config import ApprovalTriggerConfig


class TestTriggerContext:
    """Tests for TriggerContext dataclass."""

    def test_trigger_context_creation(self):
        """Test creating a trigger context."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={"action": "execute"},
        )
        assert context.agent_id == "agent-001"
        assert context.organization_id == "org-001"
        assert context.user_id == "user-001"
        assert context.payload == {"action": "execute"}

    def test_trigger_context_with_cost(self):
        """Test trigger context with estimated cost."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            estimated_cost=150.0,
        )
        assert context.estimated_cost == 150.0

    def test_trigger_context_with_tokens(self):
        """Test trigger context with estimated tokens."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            estimated_tokens=5000,
        )
        assert context.estimated_tokens == 5000

    def test_trigger_context_with_environment(self):
        """Test trigger context with environment."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            environment="production",
        )
        assert context.environment == "production"

    def test_trigger_context_defaults(self):
        """Test trigger context default values."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
        )
        assert context.payload == {}
        assert context.estimated_cost == 0.0
        assert context.estimated_tokens == 0
        assert context.environment == "production"
        assert context.is_first_invocation is False
        assert context.is_new_agent is False
        assert context.invocation_count_in_window == 0


class TestTriggerResult:
    """Tests for TriggerResult dataclass."""

    def test_trigger_result_not_triggered(self):
        """Test trigger result when not triggered."""
        result = TriggerResult(triggered=False)
        assert result.triggered is False
        assert result.triggers_matched == []

    def test_trigger_result_triggered(self):
        """Test trigger result when triggered."""
        result = TriggerResult(
            triggered=True,
            reason="Cost exceeds threshold",
            triggers_matched=["cost_threshold"],
        )
        assert result.triggered is True
        assert "cost_threshold" in result.triggers_matched

    def test_trigger_result_multiple_triggers(self):
        """Test trigger result with multiple triggers."""
        result = TriggerResult(
            triggered=True,
            reason="Multiple triggers matched",
            triggers_matched=["cost_threshold", "sensitive_data", "production_environment"],
        )
        assert len(result.triggers_matched) == 3


class TestApprovalTriggerConfig:
    """Tests for ApprovalTriggerConfig."""

    def test_default_config(self):
        """Test default trigger configuration."""
        config = ApprovalTriggerConfig()
        assert config.cost_threshold is None
        assert config.token_threshold is None
        assert config.require_first_invocation is False
        assert config.require_production_approval is False

    def test_config_with_cost_threshold(self):
        """Test config with cost threshold."""
        config = ApprovalTriggerConfig(cost_threshold=100.0)
        assert config.cost_threshold == 100.0

    def test_config_with_token_threshold(self):
        """Test config with token threshold."""
        config = ApprovalTriggerConfig(token_threshold=10000)
        assert config.token_threshold == 10000

    def test_config_with_patterns(self):
        """Test config with payload patterns."""
        config = ApprovalTriggerConfig(
            payload_patterns=["delete.*", "admin.*"],
            sensitive_data_patterns=["credit_card", "ssn"],
        )
        assert len(config.payload_patterns) == 2
        assert len(config.sensitive_data_patterns) == 2

    def test_config_with_environments(self):
        """Test config with environment requirements."""
        config = ApprovalTriggerConfig(
            require_production_approval=True,
            environments_requiring_approval=["production", "staging"],
        )
        assert config.require_production_approval is True
        assert "production" in config.environments_requiring_approval


class TestInMemoryHistoryProvider:
    """Tests for InMemoryHistoryProvider."""

    @pytest.fixture
    def history_provider(self):
        """Create a history provider."""
        return InMemoryHistoryProvider()

    @pytest.mark.asyncio
    async def test_empty_history(self, history_provider):
        """Test empty invocation history."""
        count = await history_provider.get_invocation_count(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            window_seconds=3600,
        )
        assert count == 0

    @pytest.mark.asyncio
    async def test_record_invocation(self, history_provider):
        """Test recording an invocation."""
        history_provider.record_invocation(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
        )
        count = await history_provider.get_invocation_count(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            window_seconds=3600,
        )
        assert count == 1

    @pytest.mark.asyncio
    async def test_multiple_invocations(self, history_provider):
        """Test multiple invocations."""
        for _ in range(5):
            history_provider.record_invocation(
                agent_id="agent-001",
                user_id="user-001",
                organization_id="org-001",
            )
        count = await history_provider.get_invocation_count(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            window_seconds=3600,
        )
        assert count == 5

    @pytest.mark.asyncio
    async def test_first_invocation_true(self, history_provider):
        """Test first invocation detection."""
        is_first = await history_provider.is_first_invocation(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
        )
        assert is_first is True

    @pytest.mark.asyncio
    async def test_first_invocation_false(self, history_provider):
        """Test subsequent invocation detection."""
        history_provider.record_invocation(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
        )
        is_first = await history_provider.is_first_invocation(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
        )
        assert is_first is False


class TestApprovalTriggerEvaluator:
    """Tests for ApprovalTriggerEvaluator."""

    @pytest.fixture
    def evaluator(self):
        """Create a trigger evaluator with default config."""
        config = ApprovalTriggerConfig()
        return ApprovalTriggerEvaluator(config=config)

    @pytest.fixture
    def evaluator_with_cost_threshold(self):
        """Create a trigger evaluator with cost threshold."""
        config = ApprovalTriggerConfig(cost_threshold=100.0)
        return ApprovalTriggerEvaluator(config=config)

    @pytest.fixture
    def evaluator_with_token_threshold(self):
        """Create a trigger evaluator with token threshold."""
        config = ApprovalTriggerConfig(token_threshold=5000)
        return ApprovalTriggerEvaluator(config=config)

    @pytest.fixture
    def evaluator_with_production_requirement(self):
        """Create a trigger evaluator requiring production approval."""
        config = ApprovalTriggerConfig(
            require_production_approval=True,
            environments_requiring_approval=["production"],
        )
        return ApprovalTriggerEvaluator(config=config)

    @pytest.fixture
    def evaluator_with_patterns(self):
        """Create a trigger evaluator with pattern matching."""
        config = ApprovalTriggerConfig(
            payload_patterns=["delete.*", ".*admin.*"],
        )
        return ApprovalTriggerEvaluator(config=config)

    @pytest.mark.asyncio
    async def test_no_triggers_configured(self, evaluator):
        """Test evaluation when no triggers are configured."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
        )
        result = await evaluator.evaluate(context)
        assert result.triggered is False

    @pytest.mark.asyncio
    async def test_cost_threshold_not_exceeded(self, evaluator_with_cost_threshold):
        """Test cost below threshold."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            estimated_cost=50.0,  # Below 100.0 threshold
        )
        result = await evaluator_with_cost_threshold.evaluate(context)
        assert result.triggered is False

    @pytest.mark.asyncio
    async def test_cost_threshold_exceeded(self, evaluator_with_cost_threshold):
        """Test cost exceeds threshold."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            estimated_cost=150.0,  # Above 100.0 threshold
        )
        result = await evaluator_with_cost_threshold.evaluate(context)
        assert result.triggered is True
        assert "cost_threshold" in result.triggers_matched

    @pytest.mark.asyncio
    async def test_cost_threshold_at_exact_boundary(self, evaluator_with_cost_threshold):
        """Test cost at exact threshold does not trigger (uses > not >=)."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            estimated_cost=100.0,  # At threshold
        )
        result = await evaluator_with_cost_threshold.evaluate(context)
        # Implementation uses > not >=
        assert result.triggered is False

    @pytest.mark.asyncio
    async def test_token_threshold_not_exceeded(self, evaluator_with_token_threshold):
        """Test tokens below threshold."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            estimated_tokens=3000,  # Below 5000 threshold
        )
        result = await evaluator_with_token_threshold.evaluate(context)
        assert result.triggered is False

    @pytest.mark.asyncio
    async def test_token_threshold_exceeded(self, evaluator_with_token_threshold):
        """Test tokens exceeds threshold."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            estimated_tokens=10000,  # Above 5000 threshold
        )
        result = await evaluator_with_token_threshold.evaluate(context)
        assert result.triggered is True
        assert "token_threshold" in result.triggers_matched

    @pytest.mark.asyncio
    async def test_production_environment_trigger(self, evaluator_with_production_requirement):
        """Test production environment triggers approval."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            environment="production",
        )
        result = await evaluator_with_production_requirement.evaluate(context)
        assert result.triggered is True
        assert "production_environment" in result.triggers_matched

    @pytest.mark.asyncio
    async def test_non_production_environment_no_trigger(self, evaluator_with_production_requirement):
        """Test non-production environment does not trigger."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            environment="development",
        )
        result = await evaluator_with_production_requirement.evaluate(context)
        assert result.triggered is False

    @pytest.mark.asyncio
    async def test_payload_pattern_match(self, evaluator_with_patterns):
        """Test payload pattern matching."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={"action": "delete_user"},
        )
        result = await evaluator_with_patterns.evaluate(context)
        assert result.triggered is True
        assert "payload_pattern" in result.triggers_matched

    @pytest.mark.asyncio
    async def test_payload_pattern_no_match(self, evaluator_with_patterns):
        """Test payload without pattern match."""
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={"action": "read_user"},
        )
        result = await evaluator_with_patterns.evaluate(context)
        assert result.triggered is False

    @pytest.mark.asyncio
    async def test_sensitive_data_detection_ssn(self):
        """Test sensitive data detection for SSN."""
        config = ApprovalTriggerConfig()  # Built-in patterns
        evaluator = ApprovalTriggerEvaluator(config=config)
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={"data": "SSN: 123-45-6789"},
        )
        result = await evaluator.evaluate(context)
        assert result.triggered is True
        assert "sensitive_data" in result.triggers_matched

    @pytest.mark.asyncio
    async def test_sensitive_data_detection_credit_card(self):
        """Test sensitive data detection for credit card."""
        config = ApprovalTriggerConfig()  # Built-in patterns
        evaluator = ApprovalTriggerEvaluator(config=config)
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={"card": "4111 1111 1111 1111"},
        )
        result = await evaluator.evaluate(context)
        assert result.triggered is True
        assert "sensitive_data" in result.triggers_matched

    @pytest.mark.asyncio
    async def test_no_sensitive_data(self):
        """Test payload without sensitive data."""
        config = ApprovalTriggerConfig()
        evaluator = ApprovalTriggerEvaluator(config=config)
        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={"message": "Hello, world!"},
        )
        result = await evaluator.evaluate(context)
        assert result.triggered is False

    @pytest.mark.asyncio
    async def test_first_invocation_trigger(self):
        """Test first invocation trigger."""
        config = ApprovalTriggerConfig(require_first_invocation=True)
        evaluator = ApprovalTriggerEvaluator(config=config)

        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            is_first_invocation=True,
        )
        result = await evaluator.evaluate(context)
        assert result.triggered is True
        assert "first_invocation" in result.triggers_matched

    @pytest.mark.asyncio
    async def test_subsequent_invocation_no_trigger(self):
        """Test subsequent invocation does not trigger."""
        config = ApprovalTriggerConfig(require_first_invocation=True)
        evaluator = ApprovalTriggerEvaluator(config=config)

        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            is_first_invocation=False,
        )
        result = await evaluator.evaluate(context)
        assert result.triggered is False

    @pytest.mark.asyncio
    async def test_new_agent_trigger(self):
        """Test new agent trigger."""
        config = ApprovalTriggerConfig(require_new_agent=True)
        evaluator = ApprovalTriggerEvaluator(config=config)

        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            is_new_agent=True,
        )
        result = await evaluator.evaluate(context)
        assert result.triggered is True
        assert "new_agent" in result.triggers_matched

    @pytest.mark.asyncio
    async def test_rate_trigger(self):
        """Test rate-based trigger."""
        config = ApprovalTriggerConfig(
            rate_trigger_count=3,
            rate_trigger_window_seconds=3600,
        )
        evaluator = ApprovalTriggerEvaluator(config=config)

        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            invocation_count_in_window=5,  # Above threshold
        )
        result = await evaluator.evaluate(context)
        assert result.triggered is True
        assert "rate_trigger" in result.triggers_matched

    @pytest.mark.asyncio
    async def test_multiple_triggers(self):
        """Test multiple triggers matching."""
        config = ApprovalTriggerConfig(
            cost_threshold=100.0,
            require_production_approval=True,
            environments_requiring_approval=["production"],
        )
        evaluator = ApprovalTriggerEvaluator(config=config)

        context = TriggerContext(
            agent_id="agent-001",
            user_id="user-001",
            organization_id="org-001",
            payload={},
            estimated_cost=150.0,
            environment="production",
        )
        result = await evaluator.evaluate(context)
        assert result.triggered is True
        assert "cost_threshold" in result.triggers_matched
        assert "production_environment" in result.triggers_matched
        assert len(result.triggers_matched) >= 2
