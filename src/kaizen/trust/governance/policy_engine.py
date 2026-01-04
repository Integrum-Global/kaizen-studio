"""
External Agent Policy Engine

ABAC (Attribute-Based Access Control) policy engine for external agents.
Evaluates policies based on:
- Principal attributes (user, team, roles)
- Resource attributes (agent, workspace)
- Environment attributes (production, staging)
- Context attributes (time, IP, etc.)
"""

import logging
from datetime import datetime
from typing import Any

from kaizen.trust.governance.types import (
    ConflictResolutionStrategy,
    ExternalAgentPolicy,
    ExternalAgentPolicyContext,
    PolicyCondition,
    PolicyEffect,
    PolicyEvaluationResult,
)

logger = logging.getLogger(__name__)


class ExternalAgentPolicyEngine:
    """
    ABAC policy engine for external agent access control.

    Evaluates policies against request context and returns
    ALLOW or DENY decisions based on configured rules.

    Examples:
        >>> engine = ExternalAgentPolicyEngine(
        ...     conflict_resolution_strategy=ConflictResolutionStrategy.DENY_OVERRIDES
        ... )
        >>>
        >>> # Add policies
        >>> engine.add_policy(ExternalAgentPolicy(
        ...     policy_id="prod-access",
        ...     name="Production Access",
        ...     effect=PolicyEffect.ALLOW,
        ...     conditions=[
        ...         PolicyCondition(type="environment", environments=["production"])
        ...     ]
        ... ))
        >>>
        >>> # Evaluate
        >>> result = await engine.evaluate_policies(context)
        >>> if result.effect == PolicyEffect.DENY:
        ...     raise HTTPException(403, detail=result.reason)
    """

    def __init__(
        self,
        runtime: Any = None,
        db: Any = None,
        conflict_resolution_strategy: ConflictResolutionStrategy | None = None,
        default_effect: PolicyEffect = PolicyEffect.DENY,
        fail_closed: bool = True,
    ):
        """
        Initialize policy engine.

        Args:
            runtime: AsyncLocalRuntime for DataFlow operations
            db: Optional DataFlow instance
            conflict_resolution_strategy: How to resolve conflicting policies
            default_effect: Default when no policies match
            fail_closed: If True, deny on errors (production-safe)
        """
        self.runtime = runtime
        self.db = db
        self.conflict_resolution_strategy = (
            conflict_resolution_strategy or ConflictResolutionStrategy.DENY_OVERRIDES
        )
        self.default_effect = default_effect
        self.fail_closed = fail_closed

        # Policy storage
        self.policies: dict[str, ExternalAgentPolicy] = {}

    async def evaluate_policies(
        self,
        context: ExternalAgentPolicyContext,
    ) -> PolicyEvaluationResult:
        """
        Evaluate all policies against the given context.

        Args:
            context: Policy evaluation context

        Returns:
            PolicyEvaluationResult with ALLOW or DENY decision

        Examples:
            >>> context = ExternalAgentPolicyContext(
            ...     principal=ExternalAgentPrincipal(
            ...         external_agent_id="agent-001",
            ...         provider="copilot_studio",
            ...         environment="production",
            ...         org_id="org-001"
            ...     ),
            ...     action="invoke",
            ...     resource="agent-001"
            ... )
            >>> result = await engine.evaluate_policies(context)
        """
        import time

        start_time = time.time()

        try:
            # If no policies configured, use default behavior
            if not self.policies:
                return self._no_policies_result()

            # Evaluate all enabled policies
            matched_policies: list[str] = []
            allow_policies: list[str] = []
            deny_policies: list[str] = []

            # Sort by priority (higher first)
            sorted_policies = sorted(
                self.policies.values(),
                key=lambda p: p.priority,
                reverse=True,
            )

            for policy in sorted_policies:
                if not policy.enabled:
                    continue

                if self._policy_matches(policy, context):
                    matched_policies.append(policy.policy_id)

                    if policy.effect == PolicyEffect.DENY:
                        deny_policies.append(policy.policy_id)
                    else:
                        allow_policies.append(policy.policy_id)

                    # For FIRST_MATCH, return immediately
                    if (
                        self.conflict_resolution_strategy
                        == ConflictResolutionStrategy.FIRST_MATCH
                    ):
                        return PolicyEvaluationResult(
                            effect=policy.effect,
                            reason=f"First match: {policy.name}",
                            matched_policies=[policy.policy_id],
                            evaluation_time_ms=(time.time() - start_time) * 1000,
                        )

            # Apply conflict resolution strategy
            result = self._resolve_conflicts(
                matched_policies,
                allow_policies,
                deny_policies,
            )
            result.evaluation_time_ms = (time.time() - start_time) * 1000

            logger.info(
                f"Policy evaluation: effect={result.effect.value}, "
                f"matched={len(matched_policies)}, "
                f"reason={result.reason}"
            )

            return result

        except Exception as e:
            logger.error(f"Policy evaluation error: {e}", exc_info=True)
            if self.fail_closed:
                return PolicyEvaluationResult(
                    effect=PolicyEffect.DENY,
                    reason=f"Policy evaluation failed (fail-closed): {str(e)}",
                    matched_policies=[],
                    evaluation_time_ms=(time.time() - start_time) * 1000,
                )
            return PolicyEvaluationResult(
                effect=PolicyEffect.ALLOW,
                reason=f"Policy evaluation failed (fail-open): {str(e)}",
                matched_policies=[],
                evaluation_time_ms=(time.time() - start_time) * 1000,
            )

    def _no_policies_result(self) -> PolicyEvaluationResult:
        """Result when no policies are configured."""
        if self.fail_closed:
            return PolicyEvaluationResult(
                effect=PolicyEffect.DENY,
                reason="No policies configured (fail-closed)",
                matched_policies=[],
            )
        return PolicyEvaluationResult(
            effect=PolicyEffect.ALLOW,
            reason="No policies configured (fail-open)",
            matched_policies=[],
        )

    def _policy_matches(
        self,
        policy: ExternalAgentPolicy,
        context: ExternalAgentPolicyContext,
    ) -> bool:
        """
        Check if policy conditions match the context.

        All conditions must match (AND logic).

        Args:
            policy: Policy to evaluate
            context: Request context

        Returns:
            True if all conditions match
        """
        if not policy.conditions:
            # No conditions = always match
            return True

        for condition in policy.conditions:
            if not self._condition_matches(condition, context):
                return False

        return True

    def _condition_matches(
        self,
        condition: PolicyCondition,
        context: ExternalAgentPolicyContext,
    ) -> bool:
        """
        Check if a single condition matches the context.

        Args:
            condition: Condition to evaluate
            context: Request context

        Returns:
            True if condition matches
        """
        condition_type = condition.type.lower()

        if condition_type == "environment":
            return self._match_environment(condition, context)
        elif condition_type == "time":
            return self._match_time(condition, context)
        elif condition_type == "ip":
            return self._match_ip(condition, context)
        elif condition_type == "role":
            return self._match_role(condition, context)
        elif condition_type == "team":
            return self._match_team(condition, context)
        elif condition_type == "custom":
            return self._match_custom(condition, context)
        else:
            logger.warning(f"Unknown condition type: {condition_type}")
            return False

    def _match_environment(
        self,
        condition: PolicyCondition,
        context: ExternalAgentPolicyContext,
    ) -> bool:
        """Match environment condition."""
        if not condition.environments:
            return True
        principal = context.principal
        env = getattr(principal, "environment", None)
        return env in condition.environments if env else False

    def _match_time(
        self,
        condition: PolicyCondition,
        context: ExternalAgentPolicyContext,
    ) -> bool:
        """Match time-based condition."""
        if not condition.time_range:
            return True

        time_range = condition.time_range
        now = context.timestamp or datetime.utcnow()

        # Check time of day
        start_time = time_range.get("start")
        end_time = time_range.get("end")

        if start_time and end_time:
            try:
                start_hour, start_min = map(int, start_time.split(":"))
                end_hour, end_min = map(int, end_time.split(":"))

                current_minutes = now.hour * 60 + now.minute
                start_minutes = start_hour * 60 + start_min
                end_minutes = end_hour * 60 + end_min

                if not (start_minutes <= current_minutes <= end_minutes):
                    return False
            except (ValueError, AttributeError):
                logger.warning(f"Invalid time format in condition: {time_range}")

        # Check day of week (0=Monday, 6=Sunday)
        allowed_days = time_range.get("days", [])
        if allowed_days and now.weekday() not in allowed_days:
            return False

        return True

    def _match_ip(
        self,
        condition: PolicyCondition,
        context: ExternalAgentPolicyContext,
    ) -> bool:
        """Match IP address condition."""
        if not condition.ip_ranges:
            return True

        principal = context.principal
        ip = getattr(principal, "ip_address", None)
        if not ip:
            return False

        # Check against each allowed range
        for ip_range in condition.ip_ranges:
            if self._ip_in_range(ip, ip_range):
                return True

        return False

    def _ip_in_range(self, ip: str, ip_range: str) -> bool:
        """Check if IP is in range (supports CIDR notation)."""
        import ipaddress

        try:
            ip_addr = ipaddress.ip_address(ip)

            if "/" in ip_range:
                # CIDR notation
                network = ipaddress.ip_network(ip_range, strict=False)
                return ip_addr in network
            else:
                # Single IP
                return ip == ip_range

        except ValueError:
            return False

    def _match_role(
        self,
        condition: PolicyCondition,
        context: ExternalAgentPolicyContext,
    ) -> bool:
        """Match role condition."""
        if not condition.roles:
            return True

        principal = context.principal
        user_roles = getattr(principal, "roles", [])

        # Check if any user role is in allowed roles
        return bool(set(user_roles) & set(condition.roles))

    def _match_team(
        self,
        condition: PolicyCondition,
        context: ExternalAgentPolicyContext,
    ) -> bool:
        """Match team condition."""
        if not condition.teams:
            return True

        principal = context.principal
        team_id = getattr(principal, "team_id", None)

        return team_id in condition.teams if team_id else False

    def _match_custom(
        self,
        condition: PolicyCondition,
        context: ExternalAgentPolicyContext,
    ) -> bool:
        """Match custom condition using context attributes."""
        if not condition.custom:
            return True

        for key, expected in condition.custom.items():
            actual = context.attributes.get(key)
            if actual != expected:
                return False

        return True

    def _resolve_conflicts(
        self,
        matched_policies: list[str],
        allow_policies: list[str],
        deny_policies: list[str],
    ) -> PolicyEvaluationResult:
        """
        Resolve conflicts between ALLOW and DENY policies.

        Args:
            matched_policies: All matched policy IDs
            allow_policies: Policies with ALLOW effect
            deny_policies: Policies with DENY effect

        Returns:
            Final PolicyEvaluationResult
        """
        if self.conflict_resolution_strategy == ConflictResolutionStrategy.DENY_OVERRIDES:
            # Any DENY wins
            if deny_policies:
                return PolicyEvaluationResult(
                    effect=PolicyEffect.DENY,
                    reason=f"Denied by: {', '.join(deny_policies)}",
                    matched_policies=matched_policies,
                )
            if allow_policies:
                return PolicyEvaluationResult(
                    effect=PolicyEffect.ALLOW,
                    reason=f"Allowed by: {', '.join(allow_policies)}",
                    matched_policies=matched_policies,
                )

        elif self.conflict_resolution_strategy == ConflictResolutionStrategy.ALLOW_OVERRIDES:
            # Any ALLOW wins
            if allow_policies:
                return PolicyEvaluationResult(
                    effect=PolicyEffect.ALLOW,
                    reason=f"Allowed by: {', '.join(allow_policies)}",
                    matched_policies=matched_policies,
                )
            if deny_policies:
                return PolicyEvaluationResult(
                    effect=PolicyEffect.DENY,
                    reason=f"Denied by: {', '.join(deny_policies)}",
                    matched_policies=matched_policies,
                )

        # No matching policies - use default
        return PolicyEvaluationResult(
            effect=self.default_effect,
            reason="No matching policies (default)",
            matched_policies=[],
        )

    def add_policy(self, policy: ExternalAgentPolicy) -> None:
        """
        Add a policy to the engine.

        Args:
            policy: Policy to add
        """
        self.policies[policy.policy_id] = policy
        logger.info(f"Added policy: {policy.policy_id} ({policy.name})")

    def remove_policy(self, policy_id: str) -> bool:
        """
        Remove a policy from the engine.

        Args:
            policy_id: Policy ID to remove

        Returns:
            True if policy was removed, False if not found
        """
        if policy_id in self.policies:
            del self.policies[policy_id]
            logger.info(f"Removed policy: {policy_id}")
            return True
        return False

    def get_policy(self, policy_id: str) -> ExternalAgentPolicy | None:
        """Get a policy by ID."""
        return self.policies.get(policy_id)

    def list_policies(self) -> list[ExternalAgentPolicy]:
        """List all policies."""
        return list(self.policies.values())

    def clear_policies(self) -> None:
        """Remove all policies."""
        self.policies.clear()
        logger.info("Cleared all policies")


__all__ = [
    "ExternalAgentPolicyEngine",
]
