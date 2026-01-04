"""
Core Types for Governance Module

Defines all data classes and enums used throughout the governance system:
- BudgetScope, BudgetCheckResult, BudgetStatus
- RateLimitConfig, RateLimitCheckResult
- PolicyEffect, PolicyEvaluationResult, PolicyContext
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Literal


# ===================
# Budget Types
# ===================


@dataclass
class BudgetScope:
    """
    Scope for budget enforcement.

    Defines the hierarchical context for budget checks:
    organization -> team -> user -> agent.

    Examples:
        >>> # Organization-wide budget
        >>> scope = BudgetScope(organization_id="org-001")

        >>> # Team-specific budget
        >>> scope = BudgetScope(organization_id="org-001", team_id="team-001")

        >>> # User-specific budget within a team
        >>> scope = BudgetScope(
        ...     organization_id="org-001",
        ...     team_id="team-001",
        ...     user_id="user-001"
        ... )
    """

    organization_id: str
    team_id: str | None = None
    user_id: str | None = None
    agent_id: str | None = None

    def to_key(self) -> str:
        """Generate a unique cache key for this scope."""
        parts = [f"org:{self.organization_id}"]
        if self.team_id:
            parts.append(f"team:{self.team_id}")
        if self.user_id:
            parts.append(f"user:{self.user_id}")
        if self.agent_id:
            parts.append(f"agent:{self.agent_id}")
        return ":".join(parts)


@dataclass
class BudgetCheckResult:
    """
    Result of a budget check operation.

    Examples:
        >>> result = BudgetCheckResult(allowed=True, remaining_budget_usd=50.0)
        >>> if result.allowed:
        ...     print(f"Proceeding with ${result.remaining_budget_usd:.2f} remaining")

        >>> result = BudgetCheckResult(
        ...     allowed=False,
        ...     reason="Monthly budget exceeded",
        ...     remaining_budget_usd=0.0
        ... )
        >>> if not result.allowed:
        ...     print(f"Blocked: {result.reason}")
    """

    allowed: bool
    reason: str = ""
    remaining_budget_usd: float | None = None
    remaining_executions: int | None = None
    usage_percentage: float = 0.0
    degraded_mode: bool = False
    warning_triggered: bool = False
    warning_message: str | None = None

    def __post_init__(self):
        """Calculate usage percentage if remaining budget is known."""
        if self.remaining_budget_usd is not None and self.remaining_budget_usd >= 0:
            # Calculate if we have enough info
            pass  # Will be set by the enforcer


@dataclass
class BudgetStatus:
    """
    Comprehensive budget status for reporting.

    Provides detailed information about budget usage including:
    - Token usage (input, output, total)
    - Cost usage in USD
    - Invocation counts
    - Time period information
    - Alert status

    Examples:
        >>> status = await budget_enforcer.get_budget_status(agent_id, scope)
        >>> print(f"Used {status.cost_used:.2f} of {status.cost_limit:.2f} USD")
        >>> if status.warning_triggered:
        ...     print(f"Warning: {status.usage_percentage:.0%} of budget used")
    """

    scope: BudgetScope
    period: Literal["daily", "weekly", "monthly"]
    period_start: datetime
    period_end: datetime

    # Token usage
    tokens_used: int = 0
    tokens_limit: int | None = None
    tokens_remaining: int | None = None

    # Cost usage
    cost_used: float = 0.0
    cost_limit: float | None = None
    cost_remaining: float | None = None

    # Invocation count
    invocations: int = 0
    invocations_limit: int | None = None
    invocations_remaining: int | None = None

    # Alerts
    warning_triggered: bool = False
    limit_exceeded: bool = False
    usage_percentage: float = 0.0


@dataclass
class BudgetUsageRecord:
    """
    Record of budget usage for a single invocation.

    Used for tracking and auditing individual usage events.

    Examples:
        >>> record = BudgetUsageRecord(
        ...     invocation_id="inv-001",
        ...     agent_id="agent-001",
        ...     scope=scope,
        ...     tokens_used=1000,
        ...     cost=0.05,
        ...     success=True
        ... )
    """

    invocation_id: str
    agent_id: str
    scope: BudgetScope
    tokens_used: int = 0
    cost: float = 0.0
    success: bool = True
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)


# ===================
# Rate Limit Types
# ===================


@dataclass
class RateLimitConfig:
    """
    Rate limiting configuration.

    Defines limits for different time windows.

    Examples:
        >>> config = RateLimitConfig(
        ...     requests_per_minute=60,
        ...     requests_per_hour=1000,
        ...     requests_per_day=10000
        ... )
    """

    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    requests_per_day: int = 10000
    burst_limit: int = 10  # Max requests in burst window
    burst_window_seconds: int = 1  # Burst window size


@dataclass
class RateLimitCheckResult:
    """
    Result of a rate limit check.

    Examples:
        >>> result = await rate_limiter.check_rate_limit(agent_id=agent_id, user_id=user_id)
        >>> if result.allowed:
        ...     await execute_request()
        ... else:
        ...     raise HTTPException(429, headers={"Retry-After": str(result.retry_after_seconds)})
    """

    allowed: bool
    limit_exceeded: str | None = None  # Which limit was exceeded
    remaining: int = -1  # Remaining requests in current window
    retry_after_seconds: int | None = None  # When to retry
    current_usage: dict[str, int] = field(default_factory=dict)  # Usage by window


# ===================
# Policy Types
# ===================


class PolicyEffect(Enum):
    """Effect of a policy decision."""

    ALLOW = "allow"
    DENY = "deny"


class ConflictResolutionStrategy(Enum):
    """
    Strategy for resolving conflicting policy decisions.

    - DENY_OVERRIDES: Any DENY policy takes precedence
    - ALLOW_OVERRIDES: Any ALLOW policy takes precedence
    - FIRST_MATCH: First matching policy wins
    """

    DENY_OVERRIDES = "deny_overrides"
    ALLOW_OVERRIDES = "allow_overrides"
    FIRST_MATCH = "first_match"


@dataclass
class PolicyCondition:
    """
    A single condition in a policy rule.

    Examples:
        >>> # Environment condition
        >>> condition = PolicyCondition(
        ...     type="environment",
        ...     environments=["production", "staging"]
        ... )

        >>> # Time-based condition
        >>> condition = PolicyCondition(
        ...     type="time",
        ...     time_range={"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]}
        ... )
    """

    type: str  # "environment", "time", "ip", "role", "team", etc.
    environments: list[str] | None = None
    time_range: dict[str, Any] | None = None
    ip_ranges: list[str] | None = None
    roles: list[str] | None = None
    teams: list[str] | None = None
    custom: dict[str, Any] | None = None


@dataclass
class ExternalAgentPrincipal:
    """
    Principal (subject) for policy evaluation.

    Represents the entity requesting access.

    Examples:
        >>> principal = ExternalAgentPrincipal(
        ...     external_agent_id="agent-001",
        ...     provider="copilot_studio",
        ...     environment="production",
        ...     org_id="org-001",
        ...     user_id="user-001"
        ... )
    """

    external_agent_id: str
    provider: str  # "copilot_studio", "custom", etc.
    environment: str  # "production", "staging", "development"
    org_id: str
    user_id: str | None = None
    team_id: str | None = None
    roles: list[str] = field(default_factory=list)
    ip_address: str | None = None


@dataclass
class ExternalAgentPolicyContext:
    """
    Context for policy evaluation.

    Contains all information needed to evaluate policies.

    Examples:
        >>> context = ExternalAgentPolicyContext(
        ...     principal=principal,
        ...     action="invoke",
        ...     resource="agent-001",
        ...     timestamp=datetime.utcnow()
        ... )
    """

    principal: ExternalAgentPrincipal
    action: str  # "invoke", "configure", "delete", etc.
    resource: str  # Resource identifier
    timestamp: datetime = field(default_factory=datetime.utcnow)
    attributes: dict[str, Any] = field(default_factory=dict)


@dataclass
class ExternalAgentPolicy:
    """
    Policy definition for external agents.

    Examples:
        >>> policy = ExternalAgentPolicy(
        ...     policy_id="pol-001",
        ...     name="Production Access",
        ...     effect=PolicyEffect.ALLOW,
        ...     conditions=[
        ...         PolicyCondition(type="environment", environments=["production"])
        ...     ],
        ...     enabled=True
        ... )
    """

    policy_id: str
    name: str
    effect: PolicyEffect
    conditions: list[PolicyCondition] = field(default_factory=list)
    priority: int = 0  # Higher priority = evaluated first
    enabled: bool = True
    description: str = ""


@dataclass
class PolicyEvaluationResult:
    """
    Result of policy evaluation.

    Examples:
        >>> result = await policy_engine.evaluate_policies(context)
        >>> if result.effect == PolicyEffect.DENY:
        ...     raise HTTPException(403, detail=result.reason)
    """

    effect: PolicyEffect
    reason: str = ""
    matched_policies: list[str] = field(default_factory=list)
    evaluation_time_ms: float = 0.0


# ===================
# External Agent Budget
# ===================


@dataclass
class ExternalAgentBudget:
    """
    Budget configuration for an external agent.

    Tracks both cost-based and execution-based limits.

    Examples:
        >>> budget = ExternalAgentBudget(
        ...     external_agent_id="agent-001",
        ...     monthly_budget_usd=1000.0,
        ...     monthly_spent_usd=250.0,
        ...     daily_budget_usd=50.0,
        ...     daily_spent_usd=10.0
        ... )
        >>> remaining = budget.monthly_budget_usd - budget.monthly_spent_usd
        >>> print(f"${remaining:.2f} remaining this month")
    """

    external_agent_id: str
    monthly_budget_usd: float = 1000.0
    monthly_spent_usd: float = 0.0
    daily_budget_usd: float | None = None  # None = no daily limit
    daily_spent_usd: float = 0.0
    cost_per_execution: float = 0.05  # Default estimate per invocation
    warning_threshold: float = 0.80  # 80% triggers warning
    degradation_threshold: float = 0.90  # 90% triggers degraded mode
    enforcement_mode: Literal["hard", "soft"] = "hard"
    monthly_execution_limit: int = 10000
    monthly_execution_count: int = 0
    period_start: datetime | None = None
    period_end: datetime | None = None


# ===================
# Approval Types
# ===================


class ApprovalStatus(Enum):
    """Status of an approval request."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"
    ESCALATED = "escalated"


@dataclass
class ApprovalDecision:
    """
    A single approval or rejection decision.

    Records who made the decision, when, and why.

    Examples:
        >>> decision = ApprovalDecision(
        ...     approver_id="user-admin-001",
        ...     decision="approve",
        ...     reason="Business justification provided",
        ...     timestamp=datetime.utcnow()
        ... )
    """

    approver_id: str
    decision: Literal["approve", "reject"]
    reason: str | None = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class ApprovalRequest:
    """
    An approval request for an external agent invocation.

    Tracks the full lifecycle of an approval from request to decision.

    Examples:
        >>> request = ApprovalRequest(
        ...     id="apr-001",
        ...     external_agent_id="agent-001",
        ...     organization_id="org-001",
        ...     requested_by_user_id="user-001",
        ...     trigger_reason="Cost threshold exceeded: $150.00 > $100.00",
        ...     estimated_cost=150.0
        ... )
        >>> if request.status == ApprovalStatus.PENDING:
        ...     print(f"Awaiting approval, expires at {request.expires_at}")
    """

    id: str
    external_agent_id: str
    organization_id: str
    requested_by_user_id: str
    trigger_reason: str

    # Invocation context
    invocation_context: dict[str, Any] = field(default_factory=dict)
    payload_summary: str = ""  # Sanitized summary (no secrets)

    # Cost estimation
    estimated_cost: float | None = None
    estimated_tokens: int | None = None

    # Status tracking
    status: ApprovalStatus = ApprovalStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime | None = None

    # Approver tracking
    required_approvals: int = 1
    approvals: list[ApprovalDecision] = field(default_factory=list)
    rejections: list[ApprovalDecision] = field(default_factory=list)

    # Requestor context
    requested_by_team_id: str | None = None

    def is_approved(self) -> bool:
        """Check if request has sufficient approvals."""
        return len(self.approvals) >= self.required_approvals

    def is_expired(self) -> bool:
        """Check if request has expired."""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at


@dataclass
class ApprovalCheckResult:
    """
    Result of checking if an invocation requires approval.

    Examples:
        >>> check = ApprovalCheckResult(
        ...     required=True,
        ...     trigger_reason="First invocation of new agent",
        ...     existing_request=None
        ... )
        >>> if check.required and not check.existing_request:
        ...     # Create new approval request
        ...     pass
    """

    required: bool
    trigger_reason: str = ""
    existing_request: ApprovalRequest | None = None
    triggers_matched: list[str] = field(default_factory=list)


__all__ = [
    # Budget types
    "BudgetScope",
    "BudgetCheckResult",
    "BudgetStatus",
    "BudgetUsageRecord",
    "ExternalAgentBudget",
    # Rate limit types
    "RateLimitConfig",
    "RateLimitCheckResult",
    # Policy types
    "PolicyEffect",
    "ConflictResolutionStrategy",
    "PolicyCondition",
    "ExternalAgentPrincipal",
    "ExternalAgentPolicyContext",
    "ExternalAgentPolicy",
    "PolicyEvaluationResult",
    # Approval types
    "ApprovalStatus",
    "ApprovalDecision",
    "ApprovalRequest",
    "ApprovalCheckResult",
]
