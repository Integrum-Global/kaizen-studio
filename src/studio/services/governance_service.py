"""
Governance Service for External Agents

Integrates Kaizen governance components (BudgetEnforcer, RateLimiter, PolicyEngine)
into Kaizen Studio for external agent governance.

This service is a thin integration layer that delegates to the production-ready
governance components from kaizen.trust.governance.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.config import get_settings, is_production

# Try to import from kaizen.trust.governance, fall back to stubs if not available
try:
    from kaizen.trust.governance import (
        BudgetCheckResult,
        ConflictResolutionStrategy,
        ExternalAgentBudget,
        ExternalAgentBudgetEnforcer,
        ExternalAgentPolicy,
        ExternalAgentPolicyContext,
        ExternalAgentPolicyEngine,
        ExternalAgentRateLimiter,
        PolicyEffect,
        PolicyEvaluationResult,
        RateLimitCheckResult,
        RateLimitConfig,
    )

    GOVERNANCE_AVAILABLE = True
except ImportError:
    # Provide stub implementations for when kaizen.trust is not available
    GOVERNANCE_AVAILABLE = False

    class ConflictResolutionStrategy(Enum):
        """Stub for conflict resolution strategy."""

        DENY_OVERRIDES = "deny_overrides"
        ALLOW_OVERRIDES = "allow_overrides"
        FIRST_MATCH = "first_match"

    class PolicyEffect(Enum):
        """Stub for policy effect."""

        ALLOW = "allow"
        DENY = "deny"

    @dataclass
    class BudgetCheckResult:
        """Stub for budget check result."""

        allowed: bool = True
        reason: str = "Governance not available (stub)"
        remaining_budget_usd: float | None = None
        degraded_mode: bool = True

    @dataclass
    class RateLimitCheckResult:
        """Stub for rate limit check result."""

        allowed: bool = True
        limit_exceeded: str | None = None
        remaining: int = -1
        retry_after_seconds: int | None = None
        current_usage: dict = field(default_factory=dict)

    @dataclass
    class PolicyEvaluationResult:
        """Stub for policy evaluation result."""

        effect: PolicyEffect = PolicyEffect.ALLOW
        reason: str = "Governance not available (stub)"
        matched_policies: list = field(default_factory=list)

    @dataclass
    class ExternalAgentBudget:
        """Stub for external agent budget."""

        external_agent_id: str = ""
        monthly_budget_usd: float = 1000.0
        monthly_spent_usd: float = 0.0
        daily_budget_usd: float | None = None
        daily_spent_usd: float = 0.0
        cost_per_execution: float = 0.05
        warning_threshold: float = 0.80
        degradation_threshold: float = 0.90
        enforcement_mode: str = "hard"
        monthly_execution_limit: int = 10000
        monthly_execution_count: int = 0

    @dataclass
    class RateLimitConfig:
        """Stub for rate limit configuration."""

        requests_per_minute: int = 60
        requests_per_hour: int = 1000
        requests_per_day: int = 10000

    class ExternalAgentBudgetEnforcer:
        """Stub for budget enforcer."""

        def __init__(self, runtime=None, db=None):
            pass

        async def check_budget(self, budget, cost) -> BudgetCheckResult:
            return BudgetCheckResult(
                allowed=True, reason="Budget enforcement not available"
            )

        async def record_usage(self, budget, cost, success, metadata=None):
            return budget

    class ExternalAgentRateLimiter:
        """Stub for rate limiter that enforces limits for testing."""

        def __init__(self, redis_url=None, config=None):
            self.config = config or RateLimitConfig()
            # Track invocations per key (agent_id:user_id:org_id)
            self._invocations: dict[str, list[float]] = {}
            import time

            self._time = time

        async def initialize(self):
            pass

        async def close(self):
            self._invocations.clear()

        def _get_key(self, **kwargs) -> str:
            """Generate rate limit key from kwargs."""
            agent_id = kwargs.get("agent_id", "")
            user_id = kwargs.get("user_id", "")
            org_id = kwargs.get("org_id", "")
            return f"{agent_id}:{user_id}:{org_id}"

        def _clean_old_invocations(self, key: str, window_seconds: int) -> int:
            """Remove old invocations outside the window and return current count."""
            now = self._time.time()
            cutoff = now - window_seconds
            if key in self._invocations:
                self._invocations[key] = [
                    t for t in self._invocations[key] if t > cutoff
                ]
                return len(self._invocations[key])
            return 0

        async def check_rate_limit(self, **kwargs) -> RateLimitCheckResult:
            """Check rate limit and enforce configured limits."""
            key = self._get_key(**kwargs)

            # Check minute limit
            minute_count = self._clean_old_invocations(key, 60)
            if minute_count >= self.config.requests_per_minute:
                return RateLimitCheckResult(
                    allowed=False,
                    limit_exceeded="requests_per_minute",
                    remaining=0,
                    retry_after_seconds=60,
                    current_usage={"minute": minute_count},
                )

            remaining = self.config.requests_per_minute - minute_count
            return RateLimitCheckResult(
                allowed=True,
                limit_exceeded=None,
                remaining=remaining,
                retry_after_seconds=None,
                current_usage={"minute": minute_count},
            )

        async def record_invocation(self, **kwargs):
            """Record an invocation for rate limiting."""
            key = self._get_key(**kwargs)
            now = self._time.time()
            if key not in self._invocations:
                self._invocations[key] = []
            self._invocations[key].append(now)

    class ExternalAgentPolicyEngine:
        """Stub for policy engine that evaluates added policies."""

        def __init__(self, runtime=None, db=None, conflict_resolution_strategy=None):
            self.policies: dict[str, Any] = {}
            self.conflict_resolution_strategy = (
                conflict_resolution_strategy
                or ConflictResolutionStrategy.DENY_OVERRIDES
            )

        async def evaluate_policies(self, context) -> PolicyEvaluationResult:
            """Evaluate policies against context using conflict resolution strategy."""
            # SECURITY: Fail-closed in production, fail-open only in dev/test
            from studio.config import is_production

            # If no policies, use default behavior
            if not self.policies:
                if is_production():
                    return PolicyEvaluationResult(
                        effect=PolicyEffect.DENY,
                        reason="No policies configured (fail-closed in production)",
                    )
                return PolicyEvaluationResult(
                    effect=PolicyEffect.ALLOW,
                    reason="No policies configured (fail-open in dev/test)",
                )

            # Evaluate all policies and collect matching ones
            matched_policies = []
            allow_policies = []
            deny_policies = []

            for policy_id, policy in self.policies.items():
                # Check if policy matches context
                if self._policy_matches(policy, context):
                    matched_policies.append(policy_id)
                    effect = getattr(policy, "effect", PolicyEffect.ALLOW)
                    if effect == PolicyEffect.DENY:
                        deny_policies.append(policy_id)
                    else:
                        allow_policies.append(policy_id)

            # Apply conflict resolution strategy
            if (
                self.conflict_resolution_strategy
                == ConflictResolutionStrategy.DENY_OVERRIDES
            ):
                # DENY wins if any DENY policy matches
                if deny_policies:
                    return PolicyEvaluationResult(
                        effect=PolicyEffect.DENY,
                        reason=f"Denied by policy: {', '.join(deny_policies)}",
                        matched_policies=matched_policies,
                    )
                if allow_policies:
                    return PolicyEvaluationResult(
                        effect=PolicyEffect.ALLOW,
                        reason=f"Allowed by policy: {', '.join(allow_policies)}",
                        matched_policies=matched_policies,
                    )
            elif (
                self.conflict_resolution_strategy
                == ConflictResolutionStrategy.ALLOW_OVERRIDES
            ):
                # ALLOW wins if any ALLOW policy matches
                if allow_policies:
                    return PolicyEvaluationResult(
                        effect=PolicyEffect.ALLOW,
                        reason=f"Allowed by policy: {', '.join(allow_policies)}",
                        matched_policies=matched_policies,
                    )
                if deny_policies:
                    return PolicyEvaluationResult(
                        effect=PolicyEffect.DENY,
                        reason=f"Denied by policy: {', '.join(deny_policies)}",
                        matched_policies=matched_policies,
                    )

            # No matching policies - default to DENY in production
            if is_production():
                return PolicyEvaluationResult(
                    effect=PolicyEffect.DENY,
                    reason="No matching policies (fail-closed in production)",
                    matched_policies=[],
                )
            return PolicyEvaluationResult(
                effect=PolicyEffect.DENY,
                reason="No matching policies (default deny)",
                matched_policies=[],
            )

        def _policy_matches(self, policy, context) -> bool:
            """Check if policy conditions match context."""
            conditions = getattr(policy, "conditions", [])
            if not conditions:
                return True  # No conditions means policy always matches

            # Check each condition
            for condition in conditions:
                # Check EnvironmentCondition
                if hasattr(condition, "environments"):
                    principal = getattr(context, "principal", None)
                    if principal:
                        env = getattr(principal, "environment", None)
                        if env and env in condition.environments:
                            return True
            return False

        def add_policy(self, policy):
            """Add policy to engine."""
            policy_id = getattr(policy, "policy_id", str(id(policy)))
            self.policies[policy_id] = policy

        def remove_policy(self, policy_id):
            """Remove policy from engine."""
            self.policies.pop(policy_id, None)

    class ExternalAgentPolicy:
        """Stub for external agent policy."""

        pass

    class ExternalAgentPolicyContext:
        """Stub for policy context."""

        pass


logger = logging.getLogger(__name__)

if not GOVERNANCE_AVAILABLE:
    logger.warning(
        "kaizen.trust.governance module not available. "
        "Using stub implementations for governance features. "
        "Advanced EATP governance features will be disabled."
    )


class GovernanceService:
    """
    Governance service for external agent budget, rate limiting, and policy enforcement.

    Integrates Kaizen governance components:
    - ExternalAgentBudgetEnforcer: Budget tracking and enforcement
    - ExternalAgentRateLimiter: Redis-backed rate limiting
    - ExternalAgentPolicyEngine: ABAC policy evaluation

    Examples:
        >>> service = GovernanceService()
        >>> await service.initialize()
        >>>
        >>> # Check budget
        >>> result = await service.check_budget("agent-001", "org-001", 10.0)
        >>> if not result.allowed:
        ...     print(f"Budget exceeded: {result.reason}")
        >>>
        >>> # Check rate limit
        >>> result = await service.check_rate_limit("agent-001", "user-001")
        >>> if not result.allowed:
        ...     print(f"Rate limited: retry after {result.retry_after_seconds}s")
        >>>
        >>> # Evaluate policy
        >>> result = await service.evaluate_policy("agent-001", context)
        >>> if result.effect == PolicyEffect.DENY:
        ...     print(f"Policy denied: {result.reason}")
    """

    def __init__(
        self,
        runtime: AsyncLocalRuntime | None = None,
        db: Any = None,
        redis_url: str | None = None,
        rate_limit_config: RateLimitConfig | None = None,
        conflict_resolution_strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.DENY_OVERRIDES,
    ):
        """
        Initialize governance service.

        Args:
            runtime: AsyncLocalRuntime for DataFlow operations
            db: Optional DataFlow instance
            redis_url: Redis connection URL for rate limiting
            rate_limit_config: Rate limit configuration
            conflict_resolution_strategy: Policy conflict resolution strategy
        """
        self.runtime = runtime or AsyncLocalRuntime()
        self.db = db

        # Get settings
        settings = get_settings()

        # Initialize budget enforcer
        self.budget_enforcer = ExternalAgentBudgetEnforcer(
            runtime=self.runtime,
            db=db,
        )

        # Initialize rate limiter (if Redis available)
        self._redis_url = redis_url or getattr(
            settings, "redis_url", "redis://localhost:6379/0"
        )
        self._rate_limit_config = rate_limit_config or RateLimitConfig()
        self.rate_limiter: ExternalAgentRateLimiter | None = None
        self._rate_limiter_initialized = False

        # Initialize policy engine
        self.policy_engine = ExternalAgentPolicyEngine(
            runtime=self.runtime,
            db=db,
            conflict_resolution_strategy=conflict_resolution_strategy,
        )

        # Cache for agent budgets (avoid repeated DB lookups)
        self._budget_cache: dict[str, ExternalAgentBudget] = {}
        self._cache_ttl_seconds = 60

    async def initialize(self) -> None:
        """
        Initialize governance service components.

        Initializes Redis connection for rate limiting. Gracefully degrades
        if Redis unavailable.
        """
        # Try to initialize rate limiter
        try:
            self.rate_limiter = ExternalAgentRateLimiter(
                redis_url=self._redis_url,
                config=self._rate_limit_config,
            )
            await self.rate_limiter.initialize()
            self._rate_limiter_initialized = True
            logger.info(
                f"GovernanceService initialized with Redis rate limiting: {self._redis_url}"
            )
        except Exception as e:
            logger.warning(
                f"Failed to initialize rate limiter: {e}. "
                "Rate limiting will fail-open (allow all requests)."
            )
            self.rate_limiter = None
            self._rate_limiter_initialized = False

    async def close(self) -> None:
        """Close governance service resources."""
        if self.rate_limiter:
            await self.rate_limiter.close()

    # ===================
    # Budget Enforcement
    # ===================

    async def check_budget(
        self,
        external_agent_id: str,
        organization_id: str,
        estimated_cost: float,
        user_id: str | None = None,
    ) -> BudgetCheckResult:
        """
        Check if external agent execution is within budget.

        Args:
            external_agent_id: External agent identifier
            organization_id: Organization identifier
            estimated_cost: Estimated cost in USD
            user_id: Optional user identifier for per-user limits

        Returns:
            BudgetCheckResult with allowed status and metadata

        Examples:
            >>> result = await service.check_budget("agent-001", "org-001", 10.0)
            >>> if result.allowed:
            ...     # Proceed with invocation
            ...     await invoke_agent()
            >>> else:
            ...     # Return 402 Payment Required
            ...     raise HTTPException(402, detail=result.reason)
        """
        try:
            # Get or fetch budget for agent
            budget = await self._get_agent_budget(external_agent_id, organization_id)

            # Check budget with enforcer
            result = await self.budget_enforcer.check_budget(budget, estimated_cost)

            logger.info(
                f"Budget check for {external_agent_id}: "
                f"allowed={result.allowed}, cost=${estimated_cost:.4f}, "
                f"remaining=${result.remaining_budget_usd:.2f}"
            )

            return result

        except Exception as e:
            logger.error(f"Budget check failed: {e}", exc_info=True)
            # SECURITY: Fail-closed in production to prevent budget overruns
            # In development/testing, fail-open for debugging convenience
            if is_production():
                return BudgetCheckResult(
                    allowed=False,
                    reason=f"Budget check failed (fail-closed): {str(e)}",
                    remaining_budget_usd=None,
                    degraded_mode=True,
                )
            else:
                return BudgetCheckResult(
                    allowed=True,
                    reason=f"Budget check failed (fail-open - dev only): {str(e)}",
                    remaining_budget_usd=None,
                    degraded_mode=True,
                )

    async def record_invocation_cost(
        self,
        external_agent_id: str,
        organization_id: str,
        actual_cost: float,
        execution_success: bool,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """
        Record actual cost after external agent execution.

        Args:
            external_agent_id: External agent identifier
            organization_id: Organization identifier
            actual_cost: Actual execution cost in USD
            execution_success: Whether execution succeeded
            metadata: Optional execution metadata

        Examples:
            >>> # After successful invocation
            >>> await service.record_invocation_cost(
            ...     "agent-001",
            ...     "org-001",
            ...     actual_cost=9.5,
            ...     execution_success=True,
            ...     metadata={"duration_ms": 1500}
            ... )
        """
        try:
            # Get or fetch budget for agent
            budget = await self._get_agent_budget(external_agent_id, organization_id)

            # Record usage
            updated_budget = await self.budget_enforcer.record_usage(
                budget,
                actual_cost,
                execution_success,
                metadata,
            )

            # Update cache
            self._budget_cache[external_agent_id] = updated_budget

            logger.info(
                f"Recorded cost for {external_agent_id}: ${actual_cost:.4f}, "
                f"success={execution_success}"
            )

        except Exception as e:
            logger.error(f"Failed to record invocation cost: {e}", exc_info=True)
            # Don't fail the request if cost recording fails

    async def _get_agent_budget(
        self,
        external_agent_id: str,
        organization_id: str,
    ) -> ExternalAgentBudget:
        """
        Get or fetch budget configuration for external agent.

        Uses cache to avoid repeated database lookups.

        Args:
            external_agent_id: External agent identifier
            organization_id: Organization identifier

        Returns:
            ExternalAgentBudget configuration
        """
        # Check cache
        if external_agent_id in self._budget_cache:
            return self._budget_cache[external_agent_id]

        # Fetch from database using DataFlow
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentReadNode",
            "read_agent",
            {"id": external_agent_id},
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(),
            inputs={},
        )

        agent = results.get("read_agent")
        if not agent:
            raise ValueError(f"External agent {external_agent_id} not found")

        # Create budget object from agent configuration
        # -1.0 means unlimited - use a very large value (10M) instead
        monthly_limit = agent.get("budget_limit_monthly", 1000.0)
        if monthly_limit < 0:
            monthly_limit = 10_000_000.0  # 10M = effectively unlimited

        daily_limit = agent.get("budget_limit_daily", -1.0)
        if daily_limit < 0:
            daily_limit = None  # None means no daily limit

        budget = ExternalAgentBudget(
            external_agent_id=external_agent_id,
            monthly_budget_usd=monthly_limit,
            monthly_spent_usd=0.0,  # TODO: Fetch from BudgetHistory
            daily_budget_usd=daily_limit,
            daily_spent_usd=0.0,  # TODO: Fetch from BudgetHistory
            cost_per_execution=0.05,  # Default estimate
            warning_threshold=0.80,
            degradation_threshold=0.90,
            enforcement_mode="hard",
        )

        # Cache budget
        self._budget_cache[external_agent_id] = budget

        return budget

    # ===================
    # Rate Limiting
    # ===================

    async def check_rate_limit(
        self,
        external_agent_id: str,
        user_id: str,
        team_id: str | None = None,
        org_id: str | None = None,
    ) -> RateLimitCheckResult:
        """
        Check if request is within rate limits.

        Args:
            external_agent_id: External agent identifier
            user_id: User identifier
            team_id: Optional team identifier
            org_id: Optional organization identifier

        Returns:
            RateLimitCheckResult with allowed status and retry information

        Examples:
            >>> result = await service.check_rate_limit("agent-001", "user-001")
            >>> if result.allowed:
            ...     # Proceed with invocation
            ...     await invoke_agent()
            ...     # Record invocation for rate limiting
            ...     await service.record_rate_limit_invocation("agent-001", "user-001")
            >>> else:
            ...     # Return 429 Too Many Requests
            ...     raise HTTPException(
            ...         429,
            ...         headers={"Retry-After": str(result.retry_after_seconds)}
            ...     )
        """
        # Graceful degradation if rate limiter not initialized
        if not self.rate_limiter or not self._rate_limiter_initialized:
            logger.warning(
                f"Rate limiter not initialized. Allowing request for {external_agent_id} (fail-open)."
            )
            return RateLimitCheckResult(
                allowed=True,
                limit_exceeded=None,
                remaining=-1,
                retry_after_seconds=None,
            )

        try:
            # Check rate limit
            result = await self.rate_limiter.check_rate_limit(
                agent_id=external_agent_id,
                user_id=user_id,
                team_id=team_id,
                org_id=org_id,
            )

            logger.info(
                f"Rate limit check for {external_agent_id}: "
                f"allowed={result.allowed}, remaining={result.remaining}"
            )

            return result

        except Exception as e:
            logger.error(f"Rate limit check failed: {e}", exc_info=True)
            # SECURITY: Fail-closed in production to prevent abuse
            # In development/testing, fail-open for debugging convenience
            if is_production():
                return RateLimitCheckResult(
                    allowed=False,
                    limit_exceeded="system_error",
                    remaining=0,
                    retry_after_seconds=60,
                )
            else:
                return RateLimitCheckResult(
                    allowed=True,
                    limit_exceeded=None,
                    remaining=-1,
                    retry_after_seconds=None,
                )

    async def record_rate_limit_invocation(
        self,
        external_agent_id: str,
        user_id: str,
        team_id: str | None = None,
        org_id: str | None = None,
    ) -> None:
        """
        Record invocation for rate limiting.

        Should be called AFTER successful invocation.

        Args:
            external_agent_id: External agent identifier
            user_id: User identifier
            team_id: Optional team identifier
            org_id: Optional organization identifier

        Examples:
            >>> # After successful invocation
            >>> await service.record_rate_limit_invocation("agent-001", "user-001")
        """
        if not self.rate_limiter or not self._rate_limiter_initialized:
            return

        try:
            await self.rate_limiter.record_invocation(
                agent_id=external_agent_id,
                user_id=user_id,
                team_id=team_id,
                org_id=org_id,
            )
        except Exception as e:
            logger.error(f"Failed to record rate limit invocation: {e}")
            # Don't fail the request if recording fails

    # ===================
    # Policy Evaluation
    # ===================

    async def evaluate_policy(
        self,
        external_agent_id: str,
        context: ExternalAgentPolicyContext,
    ) -> PolicyEvaluationResult:
        """
        Evaluate ABAC policies for external agent access.

        Args:
            external_agent_id: External agent identifier
            context: Policy evaluation context

        Returns:
            PolicyEvaluationResult with ALLOW or DENY decision

        Examples:
            >>> from kaizen.trust.governance import (
            ...     ExternalAgentPolicyContext,
            ...     ExternalAgentPrincipal,
            ... )
            >>>
            >>> context = ExternalAgentPolicyContext(
            ...     principal=ExternalAgentPrincipal(
            ...         external_agent_id="agent-001",
            ...         provider="copilot_studio",
            ...         environment="production",
            ...         org_id="org-001",
            ...     ),
            ...     action="invoke",
            ...     resource="agent-001",
            ... )
            >>>
            >>> result = await service.evaluate_policy("agent-001", context)
            >>> if result.effect == PolicyEffect.DENY:
            ...     raise HTTPException(403, detail=result.reason)
        """
        try:
            result = await self.policy_engine.evaluate_policies(context)

            logger.info(
                f"Policy evaluation for {external_agent_id}: "
                f"effect={result.effect.value}, reason={result.reason}"
            )

            return result

        except Exception as e:
            logger.error(f"Policy evaluation failed: {e}", exc_info=True)
            # Fail-closed for policy evaluation (deny by default)
            return PolicyEvaluationResult(
                effect=PolicyEffect.DENY,
                reason=f"Policy evaluation failed: {str(e)}",
                matched_policies=[],
            )

    def add_policy(self, policy: ExternalAgentPolicy) -> None:
        """
        Add policy to engine.

        Args:
            policy: Policy to add
        """
        self.policy_engine.add_policy(policy)

    def remove_policy(self, policy_id: str) -> None:
        """
        Remove policy from engine.

        Args:
            policy_id: Policy identifier to remove
        """
        self.policy_engine.remove_policy(policy_id)

    # ===================
    # Governance Status
    # ===================

    async def get_governance_status(
        self,
        external_agent_id: str,
        organization_id: str,
        user_id: str,
    ) -> dict[str, Any]:
        """
        Get comprehensive governance status for external agent.

        Returns budget usage, rate limit status, and policy evaluation results.

        Args:
            external_agent_id: External agent identifier
            organization_id: Organization identifier
            user_id: User identifier

        Returns:
            Dictionary with governance status information

        Examples:
            >>> status = await service.get_governance_status(
            ...     "agent-001",
            ...     "org-001",
            ...     "user-001"
            ... )
            >>> print(f"Remaining budget: ${status['budget']['remaining_monthly_usd']:.2f}")
            >>> print(f"Rate limit remaining: {status['rate_limit']['remaining']}")
        """
        # Get budget status
        budget = await self._get_agent_budget(external_agent_id, organization_id)
        budget_status = {
            "monthly_budget_usd": budget.monthly_budget_usd,
            "monthly_spent_usd": budget.monthly_spent_usd,
            "remaining_monthly_usd": budget.monthly_budget_usd
            - budget.monthly_spent_usd,
            "daily_budget_usd": budget.daily_budget_usd,
            "daily_spent_usd": budget.daily_spent_usd,
            "remaining_daily_usd": (
                (budget.daily_budget_usd - budget.daily_spent_usd)
                if budget.daily_budget_usd
                else None
            ),
            "monthly_execution_limit": budget.monthly_execution_limit,
            "monthly_execution_count": budget.monthly_execution_count,
            "remaining_executions": budget.monthly_execution_limit
            - budget.monthly_execution_count,
            "usage_percentage": (
                budget.monthly_spent_usd / budget.monthly_budget_usd
                if budget.monthly_budget_usd > 0
                else 0.0
            ),
            "warning_triggered": (budget.monthly_spent_usd / budget.monthly_budget_usd)
            >= budget.warning_threshold,
            "degraded_mode": (budget.monthly_spent_usd / budget.monthly_budget_usd)
            >= budget.degradation_threshold,
        }

        # Get rate limit status
        rate_limit_result = await self.check_rate_limit(
            external_agent_id,
            user_id,
            org_id=organization_id,
        )
        rate_limit_status = {
            "allowed": rate_limit_result.allowed,
            "limit_exceeded": rate_limit_result.limit_exceeded,
            "remaining": rate_limit_result.remaining,
            "current_usage": rate_limit_result.current_usage,
            "retry_after_seconds": rate_limit_result.retry_after_seconds,
        }

        # Get policy evaluation (requires agent context)
        # For now, return empty policy status (will be populated when policies are configured)
        policy_status = {
            "total_policies": len(self.policy_engine.policies),
            "enabled_policies": len(
                [p for p in self.policy_engine.policies.values() if p.enabled]
            ),
        }

        return {
            "external_agent_id": external_agent_id,
            "organization_id": organization_id,
            "budget": budget_status,
            "rate_limit": rate_limit_status,
            "policy": policy_status,
            "timestamp": datetime.utcnow().isoformat(),
        }


__all__ = [
    "GovernanceService",
]
