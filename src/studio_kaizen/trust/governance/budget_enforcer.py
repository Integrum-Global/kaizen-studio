"""
External Agent Budget Enforcer

Production-ready budget enforcement for external agent invocations.
Provides:
- Pre-invocation budget checks
- Post-invocation cost recording
- Budget status reporting
- Alert triggering
"""

import logging
from datetime import datetime
from typing import Any

from studio_kaizen.trust.governance.config import ExternalAgentBudgetConfig
from studio_kaizen.trust.governance.store import (
    BudgetStore,
    DataFlowBudgetStore,
    InMemoryBudgetStore,
)
from studio_kaizen.trust.governance.types import (
    BudgetCheckResult,
    BudgetScope,
    BudgetStatus,
    BudgetUsageRecord,
    ExternalAgentBudget,
)

logger = logging.getLogger(__name__)


class ExternalAgentBudgetEnforcer:
    """
    Budget enforcer for external agent invocations.

    Handles budget checking, usage recording, and status reporting
    for external agents. Integrates with GovernanceService.

    Examples:
        >>> # Initialize with default config
        >>> enforcer = ExternalAgentBudgetEnforcer()
        >>>
        >>> # Check budget before invocation
        >>> result = await enforcer.check_budget(budget, estimated_cost=0.05)
        >>> if not result.allowed:
        ...     raise HTTPException(402, detail=result.reason)
        >>>
        >>> # Record usage after invocation
        >>> await enforcer.record_usage(
        ...     budget,
        ...     actual_cost=0.04,
        ...     execution_success=True,
        ...     metadata={"duration_ms": 1500}
        ... )

        >>> # With custom configuration
        >>> config = ExternalAgentBudgetConfig(
        ...     max_cost_per_period=1000.0,
        ...     warning_threshold=0.75,
        ...     period="monthly"
        ... )
        >>> enforcer = ExternalAgentBudgetEnforcer(config=config)
    """

    def __init__(
        self,
        config: ExternalAgentBudgetConfig | None = None,
        runtime: Any = None,
        db: Any = None,
        store: BudgetStore | None = None,
    ):
        """
        Initialize budget enforcer.

        Args:
            config: Budget configuration (optional, uses defaults)
            runtime: AsyncLocalRuntime for DataFlow operations
            db: Optional DataFlow instance
            store: Budget storage backend (optional, auto-selected)
        """
        self.config = config or ExternalAgentBudgetConfig()
        self.runtime = runtime
        self.db = db

        # Initialize store
        if store:
            self.store = store
        elif runtime:
            self.store = DataFlowBudgetStore(runtime, db)
        else:
            self.store = InMemoryBudgetStore()

        # Alert tracking (prevent duplicate alerts)
        self._triggered_alerts: dict[str, set[float]] = {}

    async def check_budget(
        self,
        budget: ExternalAgentBudget,
        estimated_cost: float,
        estimated_tokens: int = 0,
    ) -> BudgetCheckResult:
        """
        Pre-invocation budget check.

        Verifies that the estimated cost/tokens won't exceed budget limits.

        Args:
            budget: Agent's budget configuration
            estimated_cost: Estimated cost in USD
            estimated_tokens: Estimated tokens (optional)

        Returns:
            BudgetCheckResult with allowed status and metadata

        Examples:
            >>> result = await enforcer.check_budget(budget, estimated_cost=0.10)
            >>> if result.allowed:
            ...     await execute_invocation()
            >>> else:
            ...     print(f"Budget exceeded: {result.reason}")
        """
        # Calculate current usage percentages
        monthly_usage_pct = 0.0
        daily_usage_pct = 0.0

        if budget.monthly_budget_usd > 0:
            monthly_usage_pct = budget.monthly_spent_usd / budget.monthly_budget_usd

        if budget.daily_budget_usd and budget.daily_budget_usd > 0:
            daily_usage_pct = budget.daily_spent_usd / budget.daily_budget_usd

        # Calculate remaining budget
        remaining_monthly = budget.monthly_budget_usd - budget.monthly_spent_usd
        remaining_daily = None
        if budget.daily_budget_usd:
            remaining_daily = budget.daily_budget_usd - budget.daily_spent_usd

        # Check execution count limit
        remaining_executions = budget.monthly_execution_limit - budget.monthly_execution_count

        # Determine which limit would be exceeded
        exceeds_monthly_cost = estimated_cost > remaining_monthly
        exceeds_daily_cost = remaining_daily is not None and estimated_cost > remaining_daily
        exceeds_execution_count = remaining_executions <= 0

        # Build result
        if exceeds_monthly_cost:
            return BudgetCheckResult(
                allowed=False if budget.enforcement_mode == "hard" else True,
                reason=f"Monthly budget exceeded. Remaining: ${remaining_monthly:.2f}, Requested: ${estimated_cost:.2f}",
                remaining_budget_usd=remaining_monthly,
                remaining_executions=remaining_executions,
                usage_percentage=monthly_usage_pct,
                degraded_mode=budget.enforcement_mode == "soft",
            )

        if exceeds_daily_cost:
            return BudgetCheckResult(
                allowed=False if budget.enforcement_mode == "hard" else True,
                reason=f"Daily budget exceeded. Remaining: ${remaining_daily:.2f}, Requested: ${estimated_cost:.2f}",
                remaining_budget_usd=remaining_daily,
                remaining_executions=remaining_executions,
                usage_percentage=daily_usage_pct,
                degraded_mode=budget.enforcement_mode == "soft",
            )

        if exceeds_execution_count:
            return BudgetCheckResult(
                allowed=False if budget.enforcement_mode == "hard" else True,
                reason=f"Monthly execution limit exceeded. Limit: {budget.monthly_execution_limit}",
                remaining_budget_usd=remaining_monthly,
                remaining_executions=0,
                usage_percentage=budget.monthly_execution_count / budget.monthly_execution_limit,
                degraded_mode=budget.enforcement_mode == "soft",
            )

        # Check for warnings
        warning_triggered = False
        warning_message = None

        if self.config.is_warning_threshold_reached(monthly_usage_pct):
            warning_triggered = True
            warning_message = f"Budget warning: {monthly_usage_pct:.0%} of monthly budget used"

        if self.config.is_degradation_threshold_reached(monthly_usage_pct):
            return BudgetCheckResult(
                allowed=True,
                reason="Budget in degraded mode",
                remaining_budget_usd=remaining_monthly,
                remaining_executions=remaining_executions,
                usage_percentage=monthly_usage_pct,
                degraded_mode=True,
                warning_triggered=True,
                warning_message=f"Budget at {monthly_usage_pct:.0%} - degraded mode active",
            )

        return BudgetCheckResult(
            allowed=True,
            reason="Within budget",
            remaining_budget_usd=remaining_monthly,
            remaining_executions=remaining_executions,
            usage_percentage=monthly_usage_pct,
            degraded_mode=False,
            warning_triggered=warning_triggered,
            warning_message=warning_message,
        )

    async def record_usage(
        self,
        budget: ExternalAgentBudget,
        actual_cost: float,
        execution_success: bool,
        metadata: dict[str, Any] | None = None,
        invocation_id: str | None = None,
    ) -> ExternalAgentBudget:
        """
        Record usage after invocation completes.

        Updates budget tracking with actual costs and records
        the usage event for auditing.

        Args:
            budget: Agent's budget configuration
            actual_cost: Actual cost in USD
            execution_success: Whether invocation succeeded
            metadata: Optional metadata (duration, tokens, etc.)
            invocation_id: Optional invocation ID for tracking

        Returns:
            Updated ExternalAgentBudget

        Examples:
            >>> updated = await enforcer.record_usage(
            ...     budget,
            ...     actual_cost=0.04,
            ...     execution_success=True,
            ...     metadata={"duration_ms": 1500, "tokens": 500}
            ... )
            >>> print(f"New monthly spend: ${updated.monthly_spent_usd:.2f}")
        """
        import uuid

        # Update budget counters
        budget.monthly_spent_usd += actual_cost
        budget.daily_spent_usd += actual_cost
        budget.monthly_execution_count += 1

        # Create usage record
        scope = BudgetScope(organization_id=budget.external_agent_id)  # Simplified scope
        record = BudgetUsageRecord(
            invocation_id=invocation_id or str(uuid.uuid4()),
            agent_id=budget.external_agent_id,
            scope=scope,
            cost=actual_cost,
            success=execution_success,
            metadata=metadata or {},
        )

        # Persist to store
        try:
            await self.store.record_usage(record)
        except Exception as e:
            logger.warning(f"Failed to persist usage record: {e}")
            # Don't fail the main operation

        # Check and trigger alerts
        await self._check_and_trigger_alerts(budget)

        return budget

    async def get_budget_status(
        self,
        agent_id: str,
        scope: BudgetScope,
    ) -> BudgetStatus:
        """
        Get comprehensive budget status for reporting.

        Args:
            agent_id: External agent ID
            scope: Budget scope (org/team/user)

        Returns:
            BudgetStatus with detailed usage information

        Examples:
            >>> status = await enforcer.get_budget_status("agent-001", scope)
            >>> print(f"Used: ${status.cost_used:.2f} / ${status.cost_limit:.2f}")
            >>> if status.warning_triggered:
            ...     print(f"Warning: {status.usage_percentage:.0%} used")
        """
        # Get budget from store
        budget = await self.store.get_budget(agent_id, scope)

        if not budget:
            # Return empty status if no budget configured
            period_start, period_end = self.config.get_period_boundaries()
            return BudgetStatus(
                scope=scope,
                period=self.config.period,
                period_start=period_start,
                period_end=period_end,
            )

        # Get period boundaries
        period_start, period_end = self.config.get_period_boundaries()

        # Calculate percentages
        cost_usage_pct = 0.0
        if budget.monthly_budget_usd > 0:
            cost_usage_pct = budget.monthly_spent_usd / budget.monthly_budget_usd

        invocation_usage_pct = 0.0
        if budget.monthly_execution_limit > 0:
            invocation_usage_pct = budget.monthly_execution_count / budget.monthly_execution_limit

        return BudgetStatus(
            scope=scope,
            period=self.config.period,
            period_start=period_start,
            period_end=period_end,
            cost_used=budget.monthly_spent_usd,
            cost_limit=budget.monthly_budget_usd,
            cost_remaining=budget.monthly_budget_usd - budget.monthly_spent_usd,
            invocations=budget.monthly_execution_count,
            invocations_limit=budget.monthly_execution_limit,
            invocations_remaining=budget.monthly_execution_limit - budget.monthly_execution_count,
            warning_triggered=self.config.is_warning_threshold_reached(cost_usage_pct),
            limit_exceeded=cost_usage_pct >= 1.0 or invocation_usage_pct >= 1.0,
            usage_percentage=cost_usage_pct,
        )

    async def _check_and_trigger_alerts(
        self,
        budget: ExternalAgentBudget,
    ) -> None:
        """
        Check usage against alert thresholds and trigger notifications.

        Args:
            budget: Current budget state
        """
        if budget.monthly_budget_usd <= 0:
            return

        usage_pct = budget.monthly_spent_usd / budget.monthly_budget_usd
        triggered = self.config.get_triggered_alerts(usage_pct)

        # Get previously triggered alerts for this agent
        agent_key = budget.external_agent_id
        previously_triggered = self._triggered_alerts.get(agent_key, set())

        # Find new alerts
        new_alerts = [t for t in triggered if t not in previously_triggered]

        if new_alerts:
            # Log alerts
            for threshold in new_alerts:
                logger.warning(
                    f"Budget alert for {budget.external_agent_id}: "
                    f"{threshold:.0%} threshold reached "
                    f"(current: {usage_pct:.1%})"
                )

            # Update tracked alerts
            self._triggered_alerts[agent_key] = previously_triggered | set(new_alerts)

            # TODO: Trigger webhook notifications
            # This would integrate with WebhookDeliveryService

    async def reset_period(
        self,
        agent_id: str,
        scope: BudgetScope,
    ) -> None:
        """
        Reset budget counters for a new period.

        Called at period boundaries (daily, weekly, monthly) to
        reset usage counters.

        Args:
            agent_id: External agent ID
            scope: Budget scope
        """
        budget = await self.store.get_budget(agent_id, scope)
        if not budget:
            return

        # Handle rollover if configured
        rollover_amount = 0.0
        if self.config.rollover_unused:
            unused = budget.monthly_budget_usd - budget.monthly_spent_usd
            max_rollover = budget.monthly_budget_usd * self.config.max_rollover_percentage
            rollover_amount = min(unused, max_rollover)

        # Reset counters
        budget.monthly_spent_usd = 0.0
        budget.daily_spent_usd = 0.0
        budget.monthly_execution_count = 0

        # Apply rollover as negative spend (credit)
        if rollover_amount > 0:
            budget.monthly_budget_usd += rollover_amount
            logger.info(
                f"Rolled over ${rollover_amount:.2f} to new period for {agent_id}"
            )

        # Update store
        await self.store.update_budget(agent_id, scope, budget)

        # Clear alert tracking for new period
        if agent_id in self._triggered_alerts:
            self._triggered_alerts[agent_id].clear()

        logger.info(f"Reset budget period for {agent_id}")


__all__ = [
    "ExternalAgentBudgetEnforcer",
]
