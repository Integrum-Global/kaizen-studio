"""
Tier 1 Unit Tests: Policy Engine

Tests ExternalAgentPolicyEngine logic without database/infrastructure.
"""

import pytest
from datetime import datetime

from kaizen.trust.governance.policy_engine import ExternalAgentPolicyEngine
from kaizen.trust.governance.types import (
    ConflictResolutionStrategy,
    ExternalAgentPolicy,
    ExternalAgentPolicyContext,
    ExternalAgentPrincipal,
    PolicyCondition,
    PolicyEffect,
)


class TestPolicyEngineBasics:
    """Tests for basic policy engine operations."""

    @pytest.fixture
    def engine(self):
        """Create policy engine."""
        return ExternalAgentPolicyEngine()

    def test_add_policy(self, engine):
        """Test adding a policy."""
        policy = ExternalAgentPolicy(
            policy_id="pol-001",
            name="Test Policy",
            effect=PolicyEffect.ALLOW
        )

        engine.add_policy(policy)

        assert "pol-001" in engine.policies
        assert engine.policies["pol-001"].name == "Test Policy"

    def test_remove_policy(self, engine):
        """Test removing a policy."""
        policy = ExternalAgentPolicy(
            policy_id="pol-001",
            name="Test Policy",
            effect=PolicyEffect.ALLOW
        )
        engine.add_policy(policy)

        result = engine.remove_policy("pol-001")

        assert result is True
        assert "pol-001" not in engine.policies

    def test_remove_nonexistent_policy(self, engine):
        """Test removing a policy that doesn't exist."""
        result = engine.remove_policy("pol-999")
        assert result is False

    def test_get_policy(self, engine):
        """Test getting a policy by ID."""
        policy = ExternalAgentPolicy(
            policy_id="pol-001",
            name="Test Policy",
            effect=PolicyEffect.ALLOW
        )
        engine.add_policy(policy)

        retrieved = engine.get_policy("pol-001")

        assert retrieved is not None
        assert retrieved.name == "Test Policy"

    def test_list_policies(self, engine):
        """Test listing all policies."""
        policy1 = ExternalAgentPolicy(
            policy_id="pol-001",
            name="Policy 1",
            effect=PolicyEffect.ALLOW
        )
        policy2 = ExternalAgentPolicy(
            policy_id="pol-002",
            name="Policy 2",
            effect=PolicyEffect.DENY
        )
        engine.add_policy(policy1)
        engine.add_policy(policy2)

        policies = engine.list_policies()

        assert len(policies) == 2

    def test_clear_policies(self, engine):
        """Test clearing all policies."""
        engine.add_policy(ExternalAgentPolicy(
            policy_id="pol-001",
            name="Policy 1",
            effect=PolicyEffect.ALLOW
        ))
        engine.add_policy(ExternalAgentPolicy(
            policy_id="pol-002",
            name="Policy 2",
            effect=PolicyEffect.DENY
        ))

        engine.clear_policies()

        assert len(engine.policies) == 0


class TestPolicyEvaluationNoPolicies:
    """Tests for policy evaluation when no policies configured."""

    @pytest.fixture
    def context(self):
        """Create test context."""
        return ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="agent-001",
                provider="custom",
                environment="production",
                org_id="org-001"
            ),
            action="invoke",
            resource="agent-001"
        )

    @pytest.mark.asyncio
    async def test_no_policies_fail_closed(self, context):
        """Test that no policies results in DENY when fail_closed=True."""
        engine = ExternalAgentPolicyEngine(fail_closed=True)

        result = await engine.evaluate_policies(context)

        assert result.effect == PolicyEffect.DENY
        assert "no policies" in result.reason.lower()

    @pytest.mark.asyncio
    async def test_no_policies_fail_open(self, context):
        """Test that no policies results in ALLOW when fail_closed=False."""
        engine = ExternalAgentPolicyEngine(fail_closed=False)

        result = await engine.evaluate_policies(context)

        assert result.effect == PolicyEffect.ALLOW


class TestPolicyEvaluationEnvironment:
    """Tests for environment-based policy evaluation."""

    @pytest.fixture
    def engine(self):
        """Create policy engine with environment policy."""
        engine = ExternalAgentPolicyEngine()
        engine.add_policy(ExternalAgentPolicy(
            policy_id="prod-access",
            name="Production Access",
            effect=PolicyEffect.ALLOW,
            conditions=[
                PolicyCondition(
                    type="environment",
                    environments=["production"]
                )
            ]
        ))
        return engine

    @pytest.mark.asyncio
    async def test_environment_match_allows(self, engine):
        """Test that matching environment allows access."""
        context = ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="agent-001",
                provider="custom",
                environment="production",
                org_id="org-001"
            ),
            action="invoke",
            resource="agent-001"
        )

        result = await engine.evaluate_policies(context)

        assert result.effect == PolicyEffect.ALLOW
        assert "prod-access" in result.matched_policies

    @pytest.mark.asyncio
    async def test_environment_no_match_denies(self, engine):
        """Test that non-matching environment denies access."""
        context = ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="agent-001",
                provider="custom",
                environment="development",
                org_id="org-001"
            ),
            action="invoke",
            resource="agent-001"
        )

        result = await engine.evaluate_policies(context)

        assert result.effect == PolicyEffect.DENY
        assert len(result.matched_policies) == 0


class TestPolicyEvaluationTime:
    """Tests for time-based policy evaluation."""

    @pytest.fixture
    def engine(self):
        """Create policy engine with time policy."""
        engine = ExternalAgentPolicyEngine()
        engine.add_policy(ExternalAgentPolicy(
            policy_id="business-hours",
            name="Business Hours",
            effect=PolicyEffect.ALLOW,
            conditions=[
                PolicyCondition(
                    type="time",
                    time_range={
                        "start": "09:00",
                        "end": "17:00",
                        "days": [0, 1, 2, 3, 4]  # Mon-Fri
                    }
                )
            ]
        ))
        return engine

    @pytest.mark.asyncio
    async def test_time_within_range_allows(self, engine):
        """Test that time within range allows access."""
        # Tuesday at 10:00 (within business hours)
        context = ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="agent-001",
                provider="custom",
                environment="production",
                org_id="org-001"
            ),
            action="invoke",
            resource="agent-001",
            timestamp=datetime(2026, 1, 6, 10, 0, 0)  # Tuesday 10:00
        )

        result = await engine.evaluate_policies(context)

        assert result.effect == PolicyEffect.ALLOW

    @pytest.mark.asyncio
    async def test_time_outside_range_denies(self, engine):
        """Test that time outside range denies access."""
        # Tuesday at 20:00 (outside business hours)
        context = ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="agent-001",
                provider="custom",
                environment="production",
                org_id="org-001"
            ),
            action="invoke",
            resource="agent-001",
            timestamp=datetime(2026, 1, 6, 20, 0, 0)  # Tuesday 20:00
        )

        result = await engine.evaluate_policies(context)

        assert result.effect == PolicyEffect.DENY


class TestPolicyEvaluationRole:
    """Tests for role-based policy evaluation."""

    @pytest.fixture
    def engine(self):
        """Create policy engine with role policy."""
        engine = ExternalAgentPolicyEngine()
        engine.add_policy(ExternalAgentPolicy(
            policy_id="admin-access",
            name="Admin Access",
            effect=PolicyEffect.ALLOW,
            conditions=[
                PolicyCondition(
                    type="role",
                    roles=["admin", "superuser"]
                )
            ]
        ))
        return engine

    @pytest.mark.asyncio
    async def test_role_match_allows(self, engine):
        """Test that matching role allows access."""
        context = ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="agent-001",
                provider="custom",
                environment="production",
                org_id="org-001",
                roles=["admin"]
            ),
            action="invoke",
            resource="agent-001"
        )

        result = await engine.evaluate_policies(context)

        assert result.effect == PolicyEffect.ALLOW

    @pytest.mark.asyncio
    async def test_role_no_match_denies(self, engine):
        """Test that non-matching role denies access."""
        context = ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="agent-001",
                provider="custom",
                environment="production",
                org_id="org-001",
                roles=["viewer"]
            ),
            action="invoke",
            resource="agent-001"
        )

        result = await engine.evaluate_policies(context)

        assert result.effect == PolicyEffect.DENY


class TestPolicyConflictResolution:
    """Tests for conflict resolution strategies."""

    @pytest.fixture
    def context(self):
        """Create test context."""
        return ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="agent-001",
                provider="custom",
                environment="production",
                org_id="org-001"
            ),
            action="invoke",
            resource="agent-001"
        )

    @pytest.mark.asyncio
    async def test_deny_overrides_strategy(self, context):
        """Test DENY_OVERRIDES strategy."""
        engine = ExternalAgentPolicyEngine(
            conflict_resolution_strategy=ConflictResolutionStrategy.DENY_OVERRIDES
        )

        # Add both ALLOW and DENY policies
        engine.add_policy(ExternalAgentPolicy(
            policy_id="allow-prod",
            name="Allow Production",
            effect=PolicyEffect.ALLOW,
            conditions=[
                PolicyCondition(type="environment", environments=["production"])
            ]
        ))
        engine.add_policy(ExternalAgentPolicy(
            policy_id="deny-all",
            name="Deny All",
            effect=PolicyEffect.DENY,
            conditions=[
                PolicyCondition(type="environment", environments=["production"])
            ]
        ))

        result = await engine.evaluate_policies(context)

        # DENY should win
        assert result.effect == PolicyEffect.DENY

    @pytest.mark.asyncio
    async def test_allow_overrides_strategy(self, context):
        """Test ALLOW_OVERRIDES strategy."""
        engine = ExternalAgentPolicyEngine(
            conflict_resolution_strategy=ConflictResolutionStrategy.ALLOW_OVERRIDES
        )

        # Add both ALLOW and DENY policies
        engine.add_policy(ExternalAgentPolicy(
            policy_id="deny-all",
            name="Deny All",
            effect=PolicyEffect.DENY,
            conditions=[
                PolicyCondition(type="environment", environments=["production"])
            ]
        ))
        engine.add_policy(ExternalAgentPolicy(
            policy_id="allow-prod",
            name="Allow Production",
            effect=PolicyEffect.ALLOW,
            conditions=[
                PolicyCondition(type="environment", environments=["production"])
            ]
        ))

        result = await engine.evaluate_policies(context)

        # ALLOW should win
        assert result.effect == PolicyEffect.ALLOW

    @pytest.mark.asyncio
    async def test_first_match_strategy(self, context):
        """Test FIRST_MATCH strategy."""
        engine = ExternalAgentPolicyEngine(
            conflict_resolution_strategy=ConflictResolutionStrategy.FIRST_MATCH
        )

        # Add policies with different priorities
        engine.add_policy(ExternalAgentPolicy(
            policy_id="low-priority-deny",
            name="Low Priority Deny",
            effect=PolicyEffect.DENY,
            priority=1,
            conditions=[
                PolicyCondition(type="environment", environments=["production"])
            ]
        ))
        engine.add_policy(ExternalAgentPolicy(
            policy_id="high-priority-allow",
            name="High Priority Allow",
            effect=PolicyEffect.ALLOW,
            priority=10,
            conditions=[
                PolicyCondition(type="environment", environments=["production"])
            ]
        ))

        result = await engine.evaluate_policies(context)

        # Higher priority (10) should be evaluated first and win
        assert result.effect == PolicyEffect.ALLOW
        assert len(result.matched_policies) == 1


class TestPolicyEvaluationDisabledPolicies:
    """Tests for disabled policy handling."""

    @pytest.fixture
    def context(self):
        """Create test context."""
        return ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="agent-001",
                provider="custom",
                environment="production",
                org_id="org-001"
            ),
            action="invoke",
            resource="agent-001"
        )

    @pytest.mark.asyncio
    async def test_disabled_policy_ignored(self, context):
        """Test that disabled policies are ignored."""
        engine = ExternalAgentPolicyEngine()

        # Add a disabled policy
        engine.add_policy(ExternalAgentPolicy(
            policy_id="disabled-allow",
            name="Disabled Allow",
            effect=PolicyEffect.ALLOW,
            enabled=False,
            conditions=[
                PolicyCondition(type="environment", environments=["production"])
            ]
        ))

        result = await engine.evaluate_policies(context)

        # Should not match disabled policy
        assert "disabled-allow" not in result.matched_policies


class TestPolicyEvaluationError:
    """Tests for error handling in policy evaluation."""

    @pytest.fixture
    def context(self):
        """Create test context."""
        return ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="agent-001",
                provider="custom",
                environment="production",
                org_id="org-001"
            ),
            action="invoke",
            resource="agent-001"
        )

    @pytest.mark.asyncio
    async def test_error_fail_closed(self, context):
        """Test that errors result in DENY when fail_closed=True."""
        engine = ExternalAgentPolicyEngine(fail_closed=True)

        # Add a policy with invalid condition type
        engine.add_policy(ExternalAgentPolicy(
            policy_id="bad-policy",
            name="Bad Policy",
            effect=PolicyEffect.ALLOW,
            conditions=[
                PolicyCondition(type="nonexistent_type")
            ]
        ))

        result = await engine.evaluate_policies(context)

        # Policy shouldn't match due to unknown condition type
        # But evaluation should complete without error
        assert result.effect == PolicyEffect.DENY


class TestPolicyEvaluationTiming:
    """Tests for evaluation timing."""

    @pytest.fixture
    def context(self):
        """Create test context."""
        return ExternalAgentPolicyContext(
            principal=ExternalAgentPrincipal(
                external_agent_id="agent-001",
                provider="custom",
                environment="production",
                org_id="org-001"
            ),
            action="invoke",
            resource="agent-001"
        )

    @pytest.mark.asyncio
    async def test_evaluation_time_recorded(self, context):
        """Test that evaluation time is recorded."""
        engine = ExternalAgentPolicyEngine()
        engine.add_policy(ExternalAgentPolicy(
            policy_id="test-policy",
            name="Test Policy",
            effect=PolicyEffect.ALLOW,
            conditions=[
                PolicyCondition(type="environment", environments=["production"])
            ]
        ))

        result = await engine.evaluate_policies(context)

        assert result.evaluation_time_ms >= 0
