"""
Governance Configuration Module

Provides configuration classes for governance features including:
- ExternalAgentBudgetConfig: Full budget configuration for external agents
- BudgetAlertConfig: Alert configuration for budget thresholds
- ApprovalTriggerConfig: Configuration for approval triggers
- ApprovalWorkflowConfig: Configuration for approval workflows
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Literal
from zoneinfo import ZoneInfo


@dataclass
class ExternalAgentBudgetConfig:
    """
    Complete budget configuration for external agents.

    Defines all budget parameters including:
    - Token-based limits
    - Cost-based limits
    - Invocation count limits
    - Time periods
    - Cost rates
    - Alert thresholds

    Examples:
        >>> config = ExternalAgentBudgetConfig(
        ...     max_cost_per_period=500.0,
        ...     max_invocations_per_period=10000,
        ...     period="monthly",
        ...     warning_threshold=0.75
        ... )

        >>> # With token-based limits
        >>> config = ExternalAgentBudgetConfig(
        ...     max_tokens_per_period=1000000,
        ...     max_cost_per_period=100.0,
        ...     input_token_rate=0.00001,
        ...     output_token_rate=0.00003
        ... )
    """

    # Budget limits
    max_tokens_per_period: int | None = None
    max_cost_per_period: float | None = None
    max_invocations_per_period: int | None = None

    # Time period
    period: Literal["daily", "weekly", "monthly"] = "monthly"
    period_start: datetime | None = None  # Custom period start
    timezone: str = "UTC"

    # Soft limits (warnings)
    warning_threshold: float = 0.75  # 75% triggers warning
    degradation_threshold: float = 0.90  # 90% triggers degraded mode

    # Cost rates (USD per unit)
    input_token_rate: float = 0.00001  # $0.01 per 1000 tokens
    output_token_rate: float = 0.00003  # $0.03 per 1000 tokens
    base_invocation_cost: float = 0.001  # $0.001 per call (base overhead)

    # Enforcement mode
    enforcement_mode: Literal["hard", "soft"] = "hard"
    # hard: Block requests when limit exceeded
    # soft: Allow with warning (for emergency/override scenarios)

    # Rollover configuration
    rollover_unused: bool = False  # Carry unused budget to next period
    max_rollover_percentage: float = 0.25  # Max 25% of budget can roll over

    # Alert configuration
    alert_thresholds: list[float] = field(
        default_factory=lambda: [0.50, 0.75, 0.90, 1.00]
    )

    def get_period_boundaries(self, reference_time: datetime | None = None) -> tuple[datetime, datetime]:
        """
        Calculate period start and end times.

        Args:
            reference_time: Reference time (defaults to now)

        Returns:
            Tuple of (period_start, period_end)

        Examples:
            >>> config = ExternalAgentBudgetConfig(period="monthly")
            >>> start, end = config.get_period_boundaries()
            >>> print(f"Period: {start.date()} to {end.date()}")
        """
        tz = ZoneInfo(self.timezone)
        now = reference_time or datetime.now(tz)

        # Ensure now has timezone
        if now.tzinfo is None:
            now = now.replace(tzinfo=tz)

        if self.period_start:
            # Custom period start
            start = self.period_start
            if start.tzinfo is None:
                start = start.replace(tzinfo=tz)
        elif self.period == "daily":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif self.period == "weekly":
            # Week starts on Monday
            days_since_monday = now.weekday()
            start = (now - timedelta(days=days_since_monday)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        elif self.period == "monthly":
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Calculate end
        if self.period == "daily":
            end = start + timedelta(days=1)
        elif self.period == "weekly":
            end = start + timedelta(weeks=1)
        elif self.period == "monthly":
            # Next month, same day (day 1)
            if start.month == 12:
                end = start.replace(year=start.year + 1, month=1)
            else:
                end = start.replace(month=start.month + 1)
        else:
            end = start + timedelta(days=1)

        return start, end

    def calculate_cost(
        self,
        input_tokens: int = 0,
        output_tokens: int = 0,
        invocations: int = 1
    ) -> float:
        """
        Calculate cost for given usage.

        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            invocations: Number of invocations

        Returns:
            Total cost in USD

        Examples:
            >>> config = ExternalAgentBudgetConfig(
            ...     input_token_rate=0.00001,
            ...     output_token_rate=0.00003,
            ...     base_invocation_cost=0.001
            ... )
            >>> cost = config.calculate_cost(input_tokens=1000, output_tokens=500)
            >>> print(f"Cost: ${cost:.4f}")
        """
        input_cost = input_tokens * self.input_token_rate
        output_cost = output_tokens * self.output_token_rate
        invocation_cost = invocations * self.base_invocation_cost
        return input_cost + output_cost + invocation_cost

    def is_warning_threshold_reached(self, usage_percentage: float) -> bool:
        """Check if warning threshold is reached."""
        return usage_percentage >= self.warning_threshold

    def is_degradation_threshold_reached(self, usage_percentage: float) -> bool:
        """Check if degradation threshold is reached."""
        return usage_percentage >= self.degradation_threshold

    def get_triggered_alerts(self, usage_percentage: float) -> list[float]:
        """Get list of alert thresholds that have been triggered."""
        return [t for t in self.alert_thresholds if usage_percentage >= t]


@dataclass
class BudgetAlertConfig:
    """
    Configuration for budget alerts and notifications.

    Examples:
        >>> alert_config = BudgetAlertConfig(
        ...     webhook_url="https://hooks.slack.com/...",
        ...     email_recipients=["admin@company.com"],
        ...     thresholds=[0.50, 0.75, 0.90, 1.00]
        ... )
    """

    # Notification endpoints
    webhook_url: str | None = None
    email_recipients: list[str] = field(default_factory=list)

    # Alert thresholds (percentage of budget)
    thresholds: list[float] = field(
        default_factory=lambda: [0.50, 0.75, 0.90, 1.00]
    )

    # Alert behavior
    alert_once_per_threshold: bool = True  # Don't re-alert for same threshold
    include_forecast: bool = True  # Include projected end-of-period spend

    # Cooldown between alerts (prevent spam)
    cooldown_minutes: int = 15


# ===================
# Approval Configuration
# ===================


@dataclass
class ApprovalTriggerConfig:
    """
    Configuration for approval triggers.

    Defines when approval is required for external agent invocations.

    Examples:
        >>> # Cost threshold trigger
        >>> config = ApprovalTriggerConfig(
        ...     cost_threshold=100.0,  # Require approval for invocations > $100
        ...     require_first_invocation=True
        ... )

        >>> # Pattern-based trigger
        >>> config = ApprovalTriggerConfig(
        ...     payload_patterns=["password", "secret", "api_key"],
        ...     sensitive_data_patterns=["\\b\\d{3}-\\d{2}-\\d{4}\\b"]  # SSN pattern
        ... )

        >>> # Rate-based trigger
        >>> config = ApprovalTriggerConfig(
        ...     rate_trigger_count=100,  # Require approval after 100 invocations
        ...     rate_trigger_window_seconds=3600  # in 1 hour
        ... )
    """

    # Pattern-based triggers
    payload_patterns: list[str] = field(default_factory=list)  # Regex patterns to match in payload
    json_path_conditions: dict[str, object] = field(default_factory=dict)  # JSONPath conditions

    # Sensitive data detection
    sensitive_data_patterns: list[str] = field(default_factory=list)  # Regex for PII, financial data

    # Threshold triggers
    cost_threshold: float | None = None  # Require approval if estimated cost > threshold
    token_threshold: int | None = None  # Require approval if tokens > threshold

    # Context triggers
    require_first_invocation: bool = False  # Require approval for first invocation of agent
    require_new_agent: bool = False  # Require approval for newly registered agents

    # Rate triggers
    rate_trigger_count: int | None = None  # Trigger after N invocations
    rate_trigger_window_seconds: int = 3600  # Time window for rate trigger

    # Environment triggers
    require_production_approval: bool = False  # Require approval in production
    environments_requiring_approval: list[str] = field(default_factory=list)


@dataclass
class ApprovalWorkflowConfig:
    """
    Configuration for approval workflow behavior.

    Defines how approvals are processed, escalated, and timed out.

    Examples:
        >>> # Basic workflow with timeout
        >>> config = ApprovalWorkflowConfig(
        ...     timeout=timedelta(hours=24),
        ...     auto_reject_on_timeout=True,
        ...     approver_roles=["admin", "security_officer"]
        ... )

        >>> # Multi-approver workflow with escalation
        >>> config = ApprovalWorkflowConfig(
        ...     require_multiple_approvers=2,
        ...     escalation_timeout=timedelta(hours=4),
        ...     escalation_to=["manager@company.com"]
        ... )
    """

    # Timing
    timeout: timedelta = field(default_factory=lambda: timedelta(hours=24))
    reminder_interval: timedelta = field(default_factory=lambda: timedelta(hours=4))
    auto_reject_on_timeout: bool = False
    auto_approve_on_timeout: bool = False  # Dangerous - use with extreme caution

    # Approvers
    approver_roles: list[str] = field(default_factory=lambda: ["admin"])
    approver_users: list[str] = field(default_factory=list)
    require_multiple_approvers: int = 1
    allow_self_approval: bool = False  # Requestor cannot approve their own request

    # Escalation
    escalation_timeout: timedelta | None = None
    escalation_to: list[str] = field(default_factory=list)  # User IDs or email addresses

    # Auto-approval rules
    auto_approve_for_admins: bool = False
    auto_approve_trusted_users: list[str] = field(default_factory=list)

    # Notification settings
    notify_on_create: bool = True
    notify_on_decision: bool = True
    notify_on_expiration: bool = True
    notification_channels: list[str] = field(default_factory=lambda: ["email"])


__all__ = [
    "ExternalAgentBudgetConfig",
    "BudgetAlertConfig",
    "ApprovalTriggerConfig",
    "ApprovalWorkflowConfig",
]
