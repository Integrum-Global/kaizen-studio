# Governance Features for External Agents

**Date**: 2025-12-20
**Status**: Planning
**Dependencies**: [01-external-agent-wrapper.md](01-external-agent-wrapper.md), [03-auth-lineage-integration.md](03-auth-lineage-integration.md)

---

## Executive Summary

This document specifies the governance layer for external agents in Kaizen Studio. External agents (Microsoft Copilot, custom enterprise tools, third-party AI systems) are "wrapped" with Kaizen's enterprise governance features to provide:

- **Budget Enforcement**: Cost control and execution limits per agent/team
- **Approval Workflows**: Human-in-the-loop for sensitive operations
- **Rate Limiting**: Protection against runaway costs and abuse
- **Policy-Based Controls (ABAC)**: Time, location, and environment restrictions
- **Compliance Controls**: Data classification, PII detection, retention
- **Alerting & Notifications**: Real-time governance violation alerts

**Design Principle**: Leverage existing Kaizen systems (`BudgetEnforcer`, `ApprovalManager`, `RateLimitService`, `PolicyEngine`) by extending them for external agent contexts. Do NOT create parallel systems.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Budget Enforcement](#budget-enforcement)
3. [Approval Workflows](#approval-workflows)
4. [Rate Limiting](#rate-limiting)
5. [Policy-Based Controls (ABAC)](#policy-based-controls-abac)
6. [Compliance Controls](#compliance-controls)
7. [Alerting & Notifications](#alerting--notifications)
8. [Configuration Model](#configuration-model)
9. [Enforcement Flow](#enforcement-flow)
10. [Database Schema](#database-schema)
11. [API Design](#api-design)
12. [Testing Strategy](#testing-strategy)
13. [Implementation Roadmap](#implementation-roadmap)

---

## Architecture Overview

### Governance Layer Position

```
┌─────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL AGENT REQUEST                         │
│                    (e.g., Copilot invocation)                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   KAIZEN GOVERNANCE LAYER                            │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  1. Authentication & Lineage                                │    │
│  │     - Verify caller identity                                │    │
│  │     - Build full lineage chain                              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  2. Pre-Execution Governance Checks                         │    │
│  │     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │     │   Budget     │  │  Rate Limit  │  │  ABAC Policy │  │    │
│  │     │   Enforcer   │  │   Service    │  │   Engine     │  │    │
│  │     └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  │     - Check budget availability                             │    │
│  │     - Check rate limits (per-agent, per-user)               │    │
│  │     - Evaluate ABAC policies (time, location, env)          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  3. Approval Workflow (if required)                         │    │
│  │     - Determine if approval needed                          │    │
│  │     - Route to appropriate approvers                        │    │
│  │     - Wait for async approval decision                      │    │
│  └────────────────────────────────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  4. Compliance Controls                                     │    │
│  │     - Data classification check                             │    │
│  │     - PII detection and masking                             │    │
│  │     - Compliance validation                                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  EXTERNAL AGENT EXECUTION                            │
│              (Original platform: Copilot, Custom, etc.)              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  POST-EXECUTION GOVERNANCE                           │
│  - Record actual cost                                                │
│  - Update rate limit counters                                        │
│  - Create audit log entry                                            │
│  - Trigger alerts (if thresholds exceeded)                           │
│  - Store execution metadata                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Integration with Existing Systems

| Governance Feature | Existing System | Integration Strategy |
|-------------------|-----------------|---------------------|
| **Budget Enforcement** | `kaizen.core.autonomy.permissions.budget_enforcer.BudgetEnforcer` | Extend cost estimation for external agent calls; add external agent context to `ExecutionContext` |
| **Approval Workflows** | `kaizen.core.autonomy.permissions.approval_manager.ToolApprovalManager` | Create `ExternalAgentApprovalManager` that wraps `ToolApprovalManager` with external agent metadata |
| **Rate Limiting** | `studio.services.rate_limit_service.RateLimitService` | Add external agent-specific keys and limits; extend sliding window to support multi-tier limits |
| **Policy Engine** | `kaizen.core.autonomy.permissions.policy.PermissionPolicy` | Add `external_agent` principal type; extend conditions to include agent metadata |
| **Audit Logging** | `studio.services.audit_service.AuditService` | Add external agent context fields; create immutable audit entries |
| **Webhooks** | `studio.services.webhook_service.WebhookService` | Trigger webhooks for governance events (budget threshold, approval required, etc.) |

---

## Budget Enforcement

### Overview

External agents can incur significant costs (API calls, compute, data transfer). Budget enforcement prevents runaway costs by:

1. **Estimating cost before execution**
2. **Checking budget availability**
3. **Recording actual cost after execution**
4. **Automatic degradation when limits approached**

### Budget Dimensions

```python
class ExternalAgentBudget:
    """
    Multi-dimensional budget tracking for external agents.

    Budgets can be set at multiple levels:
    - Per external agent
    - Per team
    - Per organization
    - Per user (individual caller)
    """

    # Primary budget (monthly)
    monthly_budget_usd: float  # e.g., 500.00
    monthly_spent_usd: float   # Current month's spending

    # Execution limits (non-monetary)
    monthly_execution_limit: int  # e.g., 10000 executions/month
    monthly_execution_count: int  # Current month's executions

    # Daily limits (prevent daily spikes)
    daily_budget_usd: float | None     # e.g., 50.00/day
    daily_spent_usd: float             # Today's spending
    daily_execution_limit: int | None  # e.g., 1000/day
    daily_execution_count: int         # Today's executions

    # Cost estimation
    cost_per_execution: float  # Estimated cost per invocation

    # Degradation thresholds
    warning_threshold: float   # 0.80 = warn at 80% budget
    degradation_threshold: float  # 0.90 = degrade at 90% budget
```

### Cost Estimation

Leverage `BudgetEnforcer.estimate_cost()` with external agent context:

```python
from kaizen.core.autonomy.permissions.budget_enforcer import BudgetEnforcer

class ExternalAgentCostEstimator:
    """
    Cost estimation for external agent executions.

    Extends BudgetEnforcer with external agent-specific costs.
    """

    # Cost table for external agent platforms
    EXTERNAL_AGENT_COSTS = {
        "copilot_studio": 0.05,      # $0.05 per invocation (Microsoft pricing)
        "custom_rest_api": 0.01,     # $0.01 per API call (conservative estimate)
        "third_party_agent": 0.03,   # $0.03 per invocation
    }

    @staticmethod
    def estimate_cost(
        agent_type: str,
        platform: str,
        input_tokens: int | None = None,
        complexity: str = "standard"
    ) -> float:
        """
        Estimate cost for external agent execution.

        Args:
            agent_type: Type of external agent (copilot_studio, custom, etc.)
            platform: Platform identifier
            input_tokens: Estimated input tokens (for LLM-based agents)
            complexity: Execution complexity (simple, standard, complex)

        Returns:
            Estimated cost in USD

        Examples:
            >>> estimator = ExternalAgentCostEstimator()
            >>> cost = estimator.estimate_cost("copilot_studio", "ms_teams")
            >>> print(f"${cost:.4f}")
            $0.0500
        """
        # Base cost from platform
        base_cost = ExternalAgentCostEstimator.EXTERNAL_AGENT_COSTS.get(
            agent_type,
            0.02  # Default conservative estimate
        )

        # Adjust for complexity
        complexity_multiplier = {
            "simple": 0.5,
            "standard": 1.0,
            "complex": 2.0
        }.get(complexity, 1.0)

        # Adjust for token usage (if LLM-based)
        token_cost = 0.0
        if input_tokens:
            # Assume GPT-4 pricing: $0.03/1K input tokens
            token_cost = (input_tokens / 1000.0) * 0.03

        # Apply 20% buffer for safety
        estimated_cost = (base_cost * complexity_multiplier + token_cost) * 1.20

        return estimated_cost
```

### Budget Check Logic

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class BudgetCheckResult:
    """Result of budget availability check."""
    allowed: bool
    reason: str | None
    remaining_budget_usd: float | None
    remaining_executions: int | None
    degraded_mode: bool  # True if approaching limits

class ExternalAgentBudgetEnforcer:
    """
    Budget enforcement for external agents.

    Integrates with BudgetEnforcer for cost tracking.
    """

    async def check_budget(
        self,
        external_agent_id: str,
        estimated_cost: float,
        user_id: str
    ) -> BudgetCheckResult:
        """
        Check if external agent execution is within budget.

        Checks multiple budget dimensions:
        1. Monthly budget (primary)
        2. Daily budget (prevent spikes)
        3. Execution count limits
        4. Per-user limits (if configured)

        Args:
            external_agent_id: External agent identifier
            estimated_cost: Estimated cost in USD
            user_id: User requesting execution

        Returns:
            BudgetCheckResult with decision and metadata
        """
        # Fetch agent budget configuration
        config = await self._get_budget_config(external_agent_id)

        # Check 1: Monthly budget (USD)
        if config.monthly_budget_usd is not None:
            remaining_monthly = config.monthly_budget_usd - config.monthly_spent_usd

            if estimated_cost > remaining_monthly:
                return BudgetCheckResult(
                    allowed=False,
                    reason=f"Monthly budget exceeded: ${config.monthly_spent_usd:.2f} / ${config.monthly_budget_usd:.2f} spent, needs ${estimated_cost:.2f}",
                    remaining_budget_usd=remaining_monthly,
                    remaining_executions=None,
                    degraded_mode=False
                )

        # Check 2: Daily budget (USD)
        if config.daily_budget_usd is not None:
            remaining_daily = config.daily_budget_usd - config.daily_spent_usd

            if estimated_cost > remaining_daily:
                return BudgetCheckResult(
                    allowed=False,
                    reason=f"Daily budget exceeded: ${config.daily_spent_usd:.2f} / ${config.daily_budget_usd:.2f} spent today",
                    remaining_budget_usd=remaining_daily,
                    remaining_executions=None,
                    degraded_mode=False
                )

        # Check 3: Monthly execution limit
        if config.monthly_execution_limit is not None:
            remaining_executions = config.monthly_execution_limit - config.monthly_execution_count

            if remaining_executions <= 0:
                return BudgetCheckResult(
                    allowed=False,
                    reason=f"Monthly execution limit reached: {config.monthly_execution_count} / {config.monthly_execution_limit}",
                    remaining_budget_usd=None,
                    remaining_executions=0,
                    degraded_mode=False
                )

        # Check 4: Degradation thresholds
        degraded_mode = False
        if config.monthly_budget_usd is not None:
            usage_percentage = config.monthly_spent_usd / config.monthly_budget_usd

            if usage_percentage >= config.degradation_threshold:
                degraded_mode = True
                # Trigger alert for degradation
                await self._trigger_degradation_alert(external_agent_id, usage_percentage)

        # Budget available
        return BudgetCheckResult(
            allowed=True,
            reason=None,
            remaining_budget_usd=remaining_monthly if config.monthly_budget_usd else None,
            remaining_executions=remaining_executions if config.monthly_execution_limit else None,
            degraded_mode=degraded_mode
        )

    async def record_usage(
        self,
        external_agent_id: str,
        actual_cost: float,
        execution_metadata: dict
    ) -> None:
        """
        Record actual cost and execution after completion.

        Updates:
        - monthly_spent_usd
        - daily_spent_usd
        - monthly_execution_count
        - daily_execution_count

        Args:
            external_agent_id: External agent identifier
            actual_cost: Actual cost in USD
            execution_metadata: Metadata about execution
        """
        workflow = WorkflowBuilder()

        # Fetch current budget record
        workflow.add_node(
            "ExternalAgentBudgetReadNode",
            "read_budget",
            {"id": external_agent_id}
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        budget = results.get("read_budget", {}).get("record", {})

        # Update budget counters
        update_workflow = WorkflowBuilder()
        update_workflow.add_node(
            "ExternalAgentBudgetUpdateNode",
            "update_budget",
            {
                "filter": {"id": external_agent_id},
                "fields": {
                    "monthly_spent_usd": budget["monthly_spent_usd"] + actual_cost,
                    "daily_spent_usd": budget["daily_spent_usd"] + actual_cost,
                    "monthly_execution_count": budget["monthly_execution_count"] + 1,
                    "daily_execution_count": budget["daily_execution_count"] + 1,
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )

        await self.runtime.execute_workflow_async(
            update_workflow.build(), inputs={}
        )
```

### Budget Reset Workflow

```python
class BudgetResetService:
    """
    Automated budget reset service.

    Runs on schedule (daily/monthly) to reset budget counters.
    """

    async def reset_daily_budgets(self):
        """
        Reset daily budget counters for all external agents.

        Scheduled to run at midnight UTC.
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentBudgetListNode",
            "list_all",
            {"filter": {}, "limit": 10000}
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        agents = results.get("list_all", {}).get("records", [])

        for agent in agents:
            update_workflow = WorkflowBuilder()
            update_workflow.add_node(
                "ExternalAgentBudgetUpdateNode",
                "reset_daily",
                {
                    "filter": {"id": agent["id"]},
                    "fields": {
                        "daily_spent_usd": 0.0,
                        "daily_execution_count": 0
                    }
                }
            )

            await self.runtime.execute_workflow_async(
                update_workflow.build(), inputs={}
            )

    async def reset_monthly_budgets(self):
        """
        Reset monthly budget counters for all external agents.

        Scheduled to run on the 1st of each month.
        """
        # Similar to reset_daily_budgets but for monthly counters
        pass
```

---

## Approval Workflows

### Overview

Certain external agent operations require human approval before execution:

- **Production deployments**: Require team lead approval
- **High-cost operations**: Require admin approval (cost > threshold)
- **Sensitive data access**: Require owner approval
- **Cross-environment operations**: Require approval to execute in production

### Approval Levels

```python
from enum import Enum

class ApprovalLevel(str, Enum):
    """Approval authority levels."""
    TEAM_LEAD = "team_lead"      # Team lead approval
    ADMIN = "admin"               # Organization admin
    OWNER = "owner"               # Organization owner
    CUSTOM = "custom"             # Custom approver list

class ApprovalRequirement:
    """
    Configuration for when approval is required.
    """

    # Trigger conditions
    require_for_environments: list[str]  # ["production"]
    require_for_cost_above: float | None  # e.g., 10.00 (require approval if cost > $10)
    require_for_data_classifications: list[str]  # ["confidential", "restricted"]
    require_for_operations: list[str]  # ["deployment", "data_access"]

    # Approver configuration
    approval_level: ApprovalLevel
    custom_approvers: list[str]  # User IDs (if approval_level=CUSTOM)

    # Timeout configuration
    approval_timeout_seconds: int  # Default: 3600 (1 hour)
    default_decision: str  # "deny" (fail-closed) or "approve" (fail-open)
```

### Integration with ApprovalManager

Extend `kaizen.core.autonomy.permissions.approval_manager.ToolApprovalManager`:

```python
from kaizen.core.autonomy.permissions.approval_manager import ToolApprovalManager
from kaizen.core.autonomy.control.protocol import ControlProtocol

class ExternalAgentApprovalManager:
    """
    Approval manager for external agent executions.

    Wraps ToolApprovalManager with external agent context.
    """

    def __init__(self, control_protocol: ControlProtocol):
        self.tool_approval_manager = ToolApprovalManager(control_protocol)
        self.runtime = AsyncLocalRuntime()

    async def request_approval(
        self,
        external_agent_id: str,
        execution_request: dict,
        user_id: str,
        estimated_cost: float,
        environment: str
    ) -> tuple[bool, str | None]:
        """
        Request approval for external agent execution.

        Args:
            external_agent_id: External agent identifier
            execution_request: Execution request payload
            user_id: User requesting execution
            estimated_cost: Estimated cost in USD
            environment: Target environment (dev, staging, production)

        Returns:
            Tuple of (approved, approval_id)
        """
        # Fetch approval requirements for this agent
        requirements = await self._get_approval_requirements(external_agent_id)

        # Check if approval is required
        if not self._should_require_approval(requirements, estimated_cost, environment):
            return True, None  # No approval needed

        # Determine approvers
        approvers = await self._get_approvers(requirements)

        # Create approval request record
        approval_id = await self._create_approval_request(
            external_agent_id=external_agent_id,
            user_id=user_id,
            execution_request=execution_request,
            estimated_cost=estimated_cost,
            environment=environment,
            approvers=approvers
        )

        # Generate approval prompt
        prompt = self._generate_approval_prompt(
            external_agent_id=external_agent_id,
            execution_request=execution_request,
            estimated_cost=estimated_cost,
            environment=environment
        )

        # Delegate to ToolApprovalManager for interactive approval
        # (This sends request via Control Protocol and waits for response)
        approved = await self.tool_approval_manager.request_approval(
            tool_name=f"ExternalAgent:{external_agent_id}",
            tool_input=execution_request,
            context=self._build_execution_context(estimated_cost),
            timeout=requirements.approval_timeout_seconds
        )

        # Update approval request with decision
        await self._update_approval_decision(approval_id, approved)

        return approved, approval_id

    def _should_require_approval(
        self,
        requirements: ApprovalRequirement,
        estimated_cost: float,
        environment: str
    ) -> bool:
        """
        Determine if approval is required based on requirements.

        Args:
            requirements: Approval requirements configuration
            estimated_cost: Estimated cost in USD
            environment: Target environment

        Returns:
            True if approval required, False otherwise
        """
        # Check environment
        if environment in requirements.require_for_environments:
            return True

        # Check cost threshold
        if (requirements.require_for_cost_above is not None and
            estimated_cost > requirements.require_for_cost_above):
            return True

        # No approval required
        return False

    async def _get_approvers(self, requirements: ApprovalRequirement) -> list[str]:
        """
        Get list of approver user IDs based on approval level.

        Args:
            requirements: Approval requirements configuration

        Returns:
            List of user IDs who can approve
        """
        if requirements.approval_level == ApprovalLevel.CUSTOM:
            return requirements.custom_approvers

        # Query users by role
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UserListNode",
            "find_approvers",
            {
                "filter": {"role": requirements.approval_level.value},
                "limit": 100
            }
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        users = results.get("find_approvers", {}).get("records", [])
        return [user["id"] for user in users]

    async def _create_approval_request(
        self,
        external_agent_id: str,
        user_id: str,
        execution_request: dict,
        estimated_cost: float,
        environment: str,
        approvers: list[str]
    ) -> str:
        """
        Create approval request record in database.

        Returns:
            Approval request ID
        """
        approval_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentApprovalCreateNode",
            "create_approval",
            {
                "id": approval_id,
                "external_agent_id": external_agent_id,
                "requested_by": user_id,
                "execution_request": json.dumps(execution_request),
                "estimated_cost": estimated_cost,
                "environment": environment,
                "approvers": json.dumps(approvers),
                "status": "pending",
                "created_at": datetime.utcnow().isoformat()
            }
        )

        await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return approval_id

    def _generate_approval_prompt(
        self,
        external_agent_id: str,
        execution_request: dict,
        estimated_cost: float,
        environment: str
    ) -> str:
        """
        Generate human-readable approval prompt.

        Returns:
            Formatted approval prompt
        """
        return f"""
🤖 External Agent Execution Approval Required

Agent: {external_agent_id}
Environment: {environment.upper()}
Estimated Cost: ${estimated_cost:.2f}

Request Details:
{json.dumps(execution_request, indent=2)}

⚠️  This operation requires approval before execution.

Approve this execution?
        """.strip()
```

### Async Approval with Callback

For operations that require async approval (user not immediately available):

```python
class AsyncApprovalHandler:
    """
    Handler for asynchronous approval workflows.

    Supports approval via webhook callback when decision is made.
    """

    async def create_async_approval(
        self,
        external_agent_id: str,
        execution_request: dict,
        callback_url: str
    ) -> str:
        """
        Create async approval request with webhook callback.

        Args:
            external_agent_id: External agent identifier
            execution_request: Execution request payload
            callback_url: URL to POST approval decision

        Returns:
            Approval request ID
        """
        approval_id = str(uuid.uuid4())

        # Create approval request with callback URL
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentApprovalCreateNode",
            "create_approval",
            {
                "id": approval_id,
                "external_agent_id": external_agent_id,
                "execution_request": json.dumps(execution_request),
                "callback_url": callback_url,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat()
            }
        )

        await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Send notification to approvers (via webhook/email)
        await self._notify_approvers(approval_id)

        return approval_id

    async def process_approval_decision(
        self,
        approval_id: str,
        approved: bool,
        approver_id: str
    ) -> None:
        """
        Process approval decision and trigger callback.

        Args:
            approval_id: Approval request ID
            approved: Approval decision
            approver_id: User who made the decision
        """
        # Update approval record
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentApprovalUpdateNode",
            "update_approval",
            {
                "filter": {"id": approval_id},
                "fields": {
                    "status": "approved" if approved else "denied",
                    "approver_id": approver_id,
                    "decided_at": datetime.utcnow().isoformat()
                }
            }
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Fetch approval record to get callback URL
        read_workflow = WorkflowBuilder()
        read_workflow.add_node(
            "ExternalAgentApprovalReadNode",
            "read_approval",
            {"id": approval_id}
        )

        results, _ = await self.runtime.execute_workflow_async(
            read_workflow.build(), inputs={}
        )

        approval = results.get("read_approval", {}).get("record", {})

        # Trigger callback webhook
        if approval.get("callback_url"):
            await self._trigger_callback(
                callback_url=approval["callback_url"],
                approved=approved,
                approval_id=approval_id
            )
```

---

## Rate Limiting

### Overview

Rate limiting protects against:

- **Abuse**: Prevent malicious actors from overloading external agents
- **Cost spikes**: Limit burst executions to control costs
- **Service degradation**: Protect backend systems from overload

### Multi-Tier Rate Limits

```python
class RateLimitConfig:
    """
    Multi-tier rate limit configuration.

    Supports limits at multiple dimensions:
    - Per external agent
    - Per user
    - Per team
    - Per organization
    """

    # Per-agent limits
    agent_rate_limit_per_minute: int  # e.g., 60 requests/minute
    agent_burst_limit: int            # e.g., 100 (allow bursts up to 100)

    # Per-user limits (prevents single user abuse)
    user_rate_limit_per_minute: int | None  # e.g., 10 requests/minute

    # Per-team limits
    team_rate_limit_per_minute: int | None  # e.g., 200 requests/minute

    # Per-organization limits (global cap)
    org_rate_limit_per_minute: int | None  # e.g., 1000 requests/minute
```

### Integration with RateLimitService

Extend `studio.services.rate_limit_service.RateLimitService`:

```python
from studio.services.rate_limit_service import RateLimitService

class ExternalAgentRateLimiter:
    """
    Rate limiter for external agent executions.

    Extends RateLimitService with multi-tier limits.
    """

    def __init__(self):
        self.rate_limit_service = RateLimitService()
        self.runtime = AsyncLocalRuntime()

    async def check_rate_limit(
        self,
        external_agent_id: str,
        user_id: str,
        team_id: str,
        organization_id: str
    ) -> tuple[bool, int, str | None]:
        """
        Check rate limits at all tiers.

        Checks in order:
        1. Per-agent limit
        2. Per-user limit
        3. Per-team limit
        4. Per-organization limit

        Returns first violation encountered.

        Args:
            external_agent_id: External agent identifier
            user_id: User requesting execution
            team_id: Team identifier
            organization_id: Organization identifier

        Returns:
            Tuple of (allowed, remaining, reason)
        """
        # Fetch rate limit configuration
        config = await self._get_rate_limit_config(external_agent_id)

        # Check 1: Per-agent limit
        allowed, remaining = await self.rate_limit_service.check_rate_limit(
            key_id=f"agent:{external_agent_id}",
            limit=config.agent_rate_limit_per_minute
        )

        if not allowed:
            return False, remaining, f"Agent rate limit exceeded: {config.agent_rate_limit_per_minute} requests/minute"

        # Check 2: Per-user limit (if configured)
        if config.user_rate_limit_per_minute:
            allowed, remaining = await self.rate_limit_service.check_rate_limit(
                key_id=f"user:{user_id}:agent:{external_agent_id}",
                limit=config.user_rate_limit_per_minute
            )

            if not allowed:
                return False, remaining, f"User rate limit exceeded: {config.user_rate_limit_per_minute} requests/minute"

        # Check 3: Per-team limit (if configured)
        if config.team_rate_limit_per_minute:
            allowed, remaining = await self.rate_limit_service.check_rate_limit(
                key_id=f"team:{team_id}",
                limit=config.team_rate_limit_per_minute
            )

            if not allowed:
                return False, remaining, f"Team rate limit exceeded: {config.team_rate_limit_per_minute} requests/minute"

        # Check 4: Per-organization limit (if configured)
        if config.org_rate_limit_per_minute:
            allowed, remaining = await self.rate_limit_service.check_rate_limit(
                key_id=f"org:{organization_id}",
                limit=config.org_rate_limit_per_minute
            )

            if not allowed:
                return False, remaining, f"Organization rate limit exceeded: {config.org_rate_limit_per_minute} requests/minute"

        # All checks passed
        return True, remaining, None

    async def increment(
        self,
        external_agent_id: str,
        user_id: str,
        team_id: str,
        organization_id: str
    ) -> None:
        """
        Increment rate limit counters at all tiers.

        Args:
            external_agent_id: External agent identifier
            user_id: User who made the request
            team_id: Team identifier
            organization_id: Organization identifier
        """
        config = await self._get_rate_limit_config(external_agent_id)

        # Increment all applicable counters
        await self.rate_limit_service.increment(f"agent:{external_agent_id}")

        if config.user_rate_limit_per_minute:
            await self.rate_limit_service.increment(f"user:{user_id}:agent:{external_agent_id}")

        if config.team_rate_limit_per_minute:
            await self.rate_limit_service.increment(f"team:{team_id}")

        if config.org_rate_limit_per_minute:
            await self.rate_limit_service.increment(f"org:{organization_id}")
```

### Burst Handling

```python
class BurstHandler:
    """
    Token bucket algorithm for burst handling.

    Allows short bursts above the rate limit while maintaining long-term average.
    """

    async def check_burst_limit(
        self,
        external_agent_id: str,
        burst_limit: int
    ) -> tuple[bool, int]:
        """
        Check if request is within burst limit.

        Uses token bucket algorithm:
        - Tokens refill at rate_limit_per_minute rate
        - Bucket capacity is burst_limit
        - Each request consumes 1 token

        Args:
            external_agent_id: External agent identifier
            burst_limit: Maximum burst size

        Returns:
            Tuple of (allowed, tokens_remaining)
        """
        # Fetch current token bucket state
        workflow = WorkflowBuilder()
        workflow.add_node(
            "RateLimitTokenBucketReadNode",
            "read_bucket",
            {"id": f"burst:{external_agent_id}"}
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        bucket = results.get("read_bucket", {}).get("record")

        if not bucket:
            # Initialize bucket
            bucket = {
                "tokens": burst_limit,
                "last_refill": datetime.utcnow().isoformat()
            }

        # Refill tokens based on elapsed time
        now = datetime.utcnow()
        last_refill = datetime.fromisoformat(bucket["last_refill"])
        elapsed_seconds = (now - last_refill).total_seconds()

        # Refill rate: rate_limit_per_minute / 60 tokens per second
        config = await self._get_rate_limit_config(external_agent_id)
        refill_rate = config.agent_rate_limit_per_minute / 60.0
        tokens_to_add = int(elapsed_seconds * refill_rate)

        bucket["tokens"] = min(bucket["tokens"] + tokens_to_add, burst_limit)
        bucket["last_refill"] = now.isoformat()

        # Check if token available
        if bucket["tokens"] >= 1:
            bucket["tokens"] -= 1
            allowed = True
        else:
            allowed = False

        # Update bucket state
        update_workflow = WorkflowBuilder()
        update_workflow.add_node(
            "RateLimitTokenBucketUpdateNode",
            "update_bucket",
            {
                "filter": {"id": f"burst:{external_agent_id}"},
                "fields": {
                    "tokens": bucket["tokens"],
                    "last_refill": bucket["last_refill"]
                }
            }
        )

        await self.runtime.execute_workflow_async(
            update_workflow.build(), inputs={}
        )

        return allowed, bucket["tokens"]
```

---

## Policy-Based Controls (ABAC)

### Overview

Attribute-Based Access Control (ABAC) provides fine-grained restrictions based on:

- **Time**: Business hours only, weekdays only
- **Location**: IP allowlist, geographic restrictions
- **Environment**: Only dev/staging, no production
- **Data classification**: Restrict based on data sensitivity

### Integration with PolicyEngine

Extend `kaizen.core.autonomy.permissions.policy.PermissionPolicy`:

```python
from kaizen.core.autonomy.permissions.policy import PermissionPolicy
from kaizen.core.autonomy.permissions.types import PermissionType

class ExternalAgentPolicyEngine:
    """
    ABAC policy engine for external agents.

    Extends PermissionPolicy with external agent-specific attributes.
    """

    async def evaluate_policy(
        self,
        external_agent_id: str,
        execution_context: dict
    ) -> tuple[bool, str | None]:
        """
        Evaluate ABAC policies for external agent execution.

        Args:
            external_agent_id: External agent identifier
            execution_context: Context with attributes:
                - user_id: User requesting execution
                - ip_address: Client IP address
                - environment: Target environment (dev, staging, production)
                - timestamp: Request timestamp
                - data_classification: Data classification level

        Returns:
            Tuple of (allowed, reason)
        """
        # Fetch policies for this agent
        policies = await self._get_policies(external_agent_id)

        # Evaluate each policy in priority order
        for policy in sorted(policies, key=lambda p: p.priority, reverse=True):
            result = await self._evaluate_single_policy(policy, execution_context)

            if result is not None:
                return result

        # Default: allow if no policies deny
        return True, None

    async def _evaluate_single_policy(
        self,
        policy: dict,
        execution_context: dict
    ) -> tuple[bool, str | None] | None:
        """
        Evaluate a single ABAC policy.

        Returns:
            (allowed, reason) if policy matches, None if no match
        """
        conditions = json.loads(policy["conditions"])

        # Evaluate conditions
        if not self._evaluate_conditions(conditions, execution_context):
            return None  # Policy doesn't apply

        # Policy applies - check effect
        if policy["effect"] == "deny":
            return False, policy.get("description", "Denied by policy")
        elif policy["effect"] == "allow":
            return True, None

        return None

    def _evaluate_conditions(self, conditions: dict, context: dict) -> bool:
        """
        Evaluate policy conditions against execution context.

        Conditions format:
        {
            "all": [  # All conditions must match (AND)
                {"field": "time.hour", "op": "gte", "value": 9},
                {"field": "time.hour", "op": "lte", "value": 17},
                {"field": "time.weekday", "op": "in", "value": [0,1,2,3,4]}
            ]
        }

        Args:
            conditions: Policy conditions dict
            context: Execution context

        Returns:
            True if all conditions match, False otherwise
        """
        if "all" in conditions:
            return all(
                self._evaluate_condition(cond, context)
                for cond in conditions["all"]
            )

        if "any" in conditions:
            return any(
                self._evaluate_condition(cond, context)
                for cond in conditions["any"]
            )

        return True

    def _evaluate_condition(self, condition: dict, context: dict) -> bool:
        """
        Evaluate a single condition.

        Args:
            condition: Condition dict with field, op, value
            context: Execution context

        Returns:
            True if condition matches, False otherwise
        """
        field = condition["field"]
        op = condition["op"]
        expected_value = condition["value"]

        # Extract actual value from context
        actual_value = self._extract_field_value(field, context)

        # Evaluate operator
        if op == "eq":
            return actual_value == expected_value
        elif op == "ne":
            return actual_value != expected_value
        elif op == "gt":
            return actual_value > expected_value
        elif op == "gte":
            return actual_value >= expected_value
        elif op == "lt":
            return actual_value < expected_value
        elif op == "lte":
            return actual_value <= expected_value
        elif op == "in":
            return actual_value in expected_value
        elif op == "not_in":
            return actual_value not in expected_value
        elif op == "contains":
            return expected_value in actual_value
        elif op == "regex":
            import re
            return bool(re.match(expected_value, str(actual_value)))

        return False

    def _extract_field_value(self, field: str, context: dict):
        """
        Extract field value from context.

        Supports nested fields with dot notation:
        - "user.role" -> context["user"]["role"]
        - "time.hour" -> extract hour from timestamp

        Args:
            field: Field path (dot-separated)
            context: Execution context

        Returns:
            Field value
        """
        # Special handling for time fields
        if field.startswith("time."):
            timestamp = datetime.fromisoformat(context.get("timestamp", datetime.utcnow().isoformat()))

            if field == "time.hour":
                return timestamp.hour
            elif field == "time.weekday":
                return timestamp.weekday()
            elif field == "time.day":
                return timestamp.day

        # Standard nested field extraction
        parts = field.split(".")
        value = context

        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            else:
                return None

        return value
```

### Example Policy Configurations

```python
# Policy 1: Business hours only
business_hours_policy = {
    "name": "Business Hours Only",
    "description": "Allow execution only during business hours (9am-5pm, Mon-Fri)",
    "effect": "deny",
    "conditions": {
        "any": [
            {"field": "time.hour", "op": "lt", "value": 9},
            {"field": "time.hour", "op": "gte", "value": 17},
            {"field": "time.weekday", "op": "in", "value": [5, 6]}  # Sat, Sun
        ]
    },
    "priority": 100
}

# Policy 2: IP allowlist
ip_allowlist_policy = {
    "name": "IP Allowlist",
    "description": "Only allow execution from corporate IP ranges",
    "effect": "deny",
    "conditions": {
        "all": [
            {"field": "ip_address", "op": "not_in", "value": [
                "10.0.0.0/8",
                "192.168.1.0/24",
                "203.0.113.0/24"
            ]}
        ]
    },
    "priority": 90
}

# Policy 3: Environment restrictions
environment_policy = {
    "name": "No Production Access",
    "description": "Deny execution in production environment",
    "effect": "deny",
    "conditions": {
        "all": [
            {"field": "environment", "op": "eq", "value": "production"}
        ]
    },
    "priority": 80
}

# Policy 4: Data classification
data_classification_policy = {
    "name": "No Confidential Data Access",
    "description": "Deny access to confidential data without approval",
    "effect": "deny",
    "conditions": {
        "all": [
            {"field": "data_classification", "op": "in", "value": ["confidential", "restricted"]}
        ]
    },
    "priority": 70
}
```

---

## Compliance Controls

### Overview

Compliance controls ensure external agent executions meet regulatory requirements:

- **Data Classification**: Enforce handling based on sensitivity
- **PII Detection**: Automatically detect and mask PII
- **Retention Policies**: Manage data lifecycle
- **Audit Immutability**: Ensure audit logs cannot be tampered with

### Data Classification Enforcement

```python
from enum import Enum

class DataClassification(str, Enum):
    """Data sensitivity levels."""
    PUBLIC = "public"                # Public data, no restrictions
    INTERNAL = "internal"            # Internal use, basic controls
    CONFIDENTIAL = "confidential"    # Sensitive, strict controls
    RESTRICTED = "restricted"        # Highly sensitive, maximum controls

class DataClassificationEnforcer:
    """
    Enforce data classification policies for external agents.
    """

    async def check_classification_compliance(
        self,
        external_agent_id: str,
        data_classification: DataClassification,
        execution_request: dict
    ) -> tuple[bool, str | None]:
        """
        Check if execution complies with data classification policies.

        Args:
            external_agent_id: External agent identifier
            data_classification: Data classification level
            execution_request: Execution request payload

        Returns:
            Tuple of (compliant, reason)
        """
        # Fetch agent's allowed classifications
        config = await self._get_classification_config(external_agent_id)

        # Check if agent is authorized for this classification
        if data_classification not in config.allowed_classifications:
            return False, f"Agent not authorized for {data_classification.value} data"

        # Check encryption requirements for confidential/restricted data
        if data_classification in [DataClassification.CONFIDENTIAL, DataClassification.RESTRICTED]:
            if not execution_request.get("encryption_enabled"):
                return False, f"{data_classification.value} data requires encryption"

        # Check audit requirements for restricted data
        if data_classification == DataClassification.RESTRICTED:
            if not execution_request.get("audit_trail_enabled"):
                return False, "Restricted data requires full audit trail"

        return True, None
```

### PII Detection and Masking

```python
import re

class PIIDetector:
    """
    Detect and mask Personally Identifiable Information (PII).

    Supports detection of:
    - Email addresses
    - Phone numbers
    - Social Security Numbers (SSN)
    - Credit card numbers
    - IP addresses
    """

    # Regex patterns for common PII types
    PATTERNS = {
        "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
        "phone": r"\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b",
        "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
        "credit_card": r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",
        "ip_address": r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    }

    @staticmethod
    def detect(text: str) -> dict[str, list[str]]:
        """
        Detect PII in text.

        Args:
            text: Text to scan for PII

        Returns:
            Dict mapping PII type to list of detected values

        Examples:
            >>> detector = PIIDetector()
            >>> text = "Contact john@example.com or 555-123-4567"
            >>> pii = detector.detect(text)
            >>> print(pii)
            {'email': ['john@example.com'], 'phone': ['555-123-4567']}
        """
        detected = {}

        for pii_type, pattern in PIIDetector.PATTERNS.items():
            matches = re.findall(pattern, text)
            if matches:
                detected[pii_type] = matches

        return detected

    @staticmethod
    def mask(text: str, pii_types: list[str] | None = None) -> str:
        """
        Mask PII in text.

        Args:
            text: Text containing PII
            pii_types: Specific PII types to mask (default: all)

        Returns:
            Text with PII masked

        Examples:
            >>> detector = PIIDetector()
            >>> text = "Contact john@example.com or 555-123-4567"
            >>> masked = detector.mask(text)
            >>> print(masked)
            'Contact [EMAIL_REDACTED] or [PHONE_REDACTED]'
        """
        masked_text = text

        patterns_to_mask = (
            {k: v for k, v in PIIDetector.PATTERNS.items() if k in pii_types}
            if pii_types
            else PIIDetector.PATTERNS
        )

        for pii_type, pattern in patterns_to_mask.items():
            replacement = f"[{pii_type.upper()}_REDACTED]"
            masked_text = re.sub(pattern, replacement, masked_text)

        return masked_text

class PIIComplianceEnforcer:
    """
    Enforce PII detection and masking for external agent executions.
    """

    def __init__(self):
        self.detector = PIIDetector()

    async def enforce_pii_compliance(
        self,
        external_agent_id: str,
        execution_request: dict,
        execution_response: dict
    ) -> tuple[dict, dict]:
        """
        Enforce PII compliance by detecting and masking PII.

        Args:
            external_agent_id: External agent identifier
            execution_request: Execution request payload
            execution_response: Execution response payload

        Returns:
            Tuple of (masked_request, masked_response)
        """
        # Fetch PII configuration
        config = await self._get_pii_config(external_agent_id)

        if not config.pii_detection_enabled:
            return execution_request, execution_response

        # Detect PII in request
        request_text = json.dumps(execution_request)
        detected_pii = self.detector.detect(request_text)

        # Log PII detection
        if detected_pii:
            await self._log_pii_detection(
                external_agent_id=external_agent_id,
                pii_types=list(detected_pii.keys()),
                context="request"
            )

        # Mask PII if configured
        if config.pii_masking_enabled:
            masked_request = json.loads(
                self.detector.mask(request_text, config.mask_pii_types)
            )
            masked_response = json.loads(
                self.detector.mask(json.dumps(execution_response), config.mask_pii_types)
            )

            return masked_request, masked_response

        return execution_request, execution_response
```

### Retention Policies

```python
class RetentionPolicy:
    """
    Data retention policy for external agent executions.

    Defines how long execution data is retained.
    """

    retention_days: int  # Days to retain execution data
    archive_after_days: int | None  # Days until archival (if configured)
    delete_after_days: int  # Days until permanent deletion

    # Data types subject to retention
    apply_to_execution_requests: bool
    apply_to_execution_responses: bool
    apply_to_audit_logs: bool  # Typically NEVER deleted (compliance)

class RetentionEnforcer:
    """
    Enforce retention policies for external agent data.
    """

    async def apply_retention_policy(
        self,
        external_agent_id: str
    ) -> dict:
        """
        Apply retention policy to external agent data.

        Runs on schedule (daily) to:
        1. Archive old execution records
        2. Delete expired execution records
        3. Preserve audit logs (never deleted)

        Args:
            external_agent_id: External agent identifier

        Returns:
            Summary of retention actions
        """
        policy = await self._get_retention_policy(external_agent_id)

        now = datetime.utcnow()
        cutoff_date = now - timedelta(days=policy.delete_after_days)

        # Find expired execution records
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentExecutionListNode",
            "find_expired",
            {
                "filter": {
                    "external_agent_id": external_agent_id,
                    "created_at": {"lt": cutoff_date.isoformat()}
                },
                "limit": 10000
            }
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        expired_records = results.get("find_expired", {}).get("records", [])

        # Delete expired records
        deleted_count = 0
        for record in expired_records:
            delete_workflow = WorkflowBuilder()
            delete_workflow.add_node(
                "ExternalAgentExecutionDeleteNode",
                "delete_record",
                {"id": record["id"]}
            )

            await self.runtime.execute_workflow_async(
                delete_workflow.build(), inputs={}
            )

            deleted_count += 1

        # NOTE: Audit logs are NEVER deleted (compliance requirement)

        return {
            "external_agent_id": external_agent_id,
            "deleted_records": deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
```

### Audit Immutability

```python
class AuditImmutabilityEnforcer:
    """
    Ensure audit logs are immutable (cannot be modified or deleted).

    Uses cryptographic hashing to detect tampering.
    """

    @staticmethod
    def compute_hash(audit_log: dict) -> str:
        """
        Compute cryptographic hash of audit log.

        Args:
            audit_log: Audit log record

        Returns:
            SHA-256 hash of audit log
        """
        import hashlib

        # Serialize audit log (excluding hash field)
        log_data = {k: v for k, v in audit_log.items() if k != "hash"}
        serialized = json.dumps(log_data, sort_keys=True)

        # Compute SHA-256 hash
        return hashlib.sha256(serialized.encode()).hexdigest()

    async def create_immutable_audit_log(
        self,
        organization_id: str,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        details: dict
    ) -> str:
        """
        Create immutable audit log entry.

        Args:
            organization_id: Organization context
            user_id: User who performed action
            action: Action type
            resource_type: Resource type
            resource_id: Resource identifier
            details: Additional details

        Returns:
            Audit log ID
        """
        audit_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        audit_log = {
            "id": audit_id,
            "organization_id": organization_id,
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": json.dumps(details),
            "created_at": now,
            "status": "success"
        }

        # Compute hash
        audit_log["hash"] = self.compute_hash(audit_log)

        # Store audit log
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AuditLogCreateNode",
            "create_audit",
            audit_log
        )

        await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return audit_id

    async def verify_audit_integrity(self, audit_id: str) -> bool:
        """
        Verify audit log integrity by checking hash.

        Args:
            audit_id: Audit log identifier

        Returns:
            True if integrity verified, False if tampered
        """
        # Fetch audit log
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AuditLogReadNode",
            "read_audit",
            {"id": audit_id}
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        audit_log = results.get("read_audit", {}).get("record", {})

        if not audit_log:
            return False

        # Compute expected hash
        stored_hash = audit_log.pop("hash")
        expected_hash = self.compute_hash(audit_log)

        # Compare hashes
        return stored_hash == expected_hash
```

---

## Alerting & Notifications

### Overview

Governance events trigger alerts to notify stakeholders:

- **Budget thresholds**: Warn when approaching budget limits
- **Unusual activity**: Detect anomalies (spike in executions, high error rate)
- **Policy violations**: Alert when policies are violated
- **Approval required**: Notify approvers when action needed

### Integration with Webhook Service

Leverage `studio.services.webhook_service.WebhookService`:

```python
from studio.services.webhook_service import WebhookService

class GovernanceAlertService:
    """
    Alert service for governance events.

    Sends alerts via webhooks to configured platforms (Teams, Discord, Telegram, Slack).
    """

    def __init__(self):
        self.webhook_service = WebhookService()
        self.runtime = AsyncLocalRuntime()

    async def trigger_budget_threshold_alert(
        self,
        external_agent_id: str,
        current_spent: float,
        budget_limit: float,
        threshold_percentage: float
    ) -> None:
        """
        Trigger alert when budget threshold is reached.

        Args:
            external_agent_id: External agent identifier
            current_spent: Current spending in USD
            budget_limit: Budget limit in USD
            threshold_percentage: Threshold percentage (e.g., 0.80 for 80%)
        """
        # Fetch webhook subscriptions for this event type
        subscriptions = await self._get_webhook_subscriptions(
            external_agent_id=external_agent_id,
            event_type="governance.budget_threshold"
        )

        # Build alert payload
        alert_payload = {
            "event": "governance.budget_threshold",
            "external_agent_id": external_agent_id,
            "threshold_percentage": threshold_percentage,
            "current_spent_usd": current_spent,
            "budget_limit_usd": budget_limit,
            "remaining_usd": budget_limit - current_spent,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Send to all subscribed webhooks
        for subscription in subscriptions:
            await self.webhook_service.trigger(
                webhook_id=subscription["webhook_id"],
                event_type="governance.budget_threshold",
                payload=alert_payload
            )

    async def trigger_unusual_activity_alert(
        self,
        external_agent_id: str,
        activity_type: str,
        details: dict
    ) -> None:
        """
        Trigger alert for unusual activity.

        Args:
            external_agent_id: External agent identifier
            activity_type: Type of unusual activity (spike, high_error_rate, etc.)
            details: Additional details about the activity
        """
        subscriptions = await self._get_webhook_subscriptions(
            external_agent_id=external_agent_id,
            event_type="governance.unusual_activity"
        )

        alert_payload = {
            "event": "governance.unusual_activity",
            "external_agent_id": external_agent_id,
            "activity_type": activity_type,
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        }

        for subscription in subscriptions:
            await self.webhook_service.trigger(
                webhook_id=subscription["webhook_id"],
                event_type="governance.unusual_activity",
                payload=alert_payload
            )

    async def trigger_approval_required_alert(
        self,
        approval_id: str,
        external_agent_id: str,
        approvers: list[str],
        approval_url: str
    ) -> None:
        """
        Trigger alert when approval is required.

        Args:
            approval_id: Approval request identifier
            external_agent_id: External agent identifier
            approvers: List of user IDs who can approve
            approval_url: URL to approval interface
        """
        subscriptions = await self._get_webhook_subscriptions(
            external_agent_id=external_agent_id,
            event_type="governance.approval_required"
        )

        alert_payload = {
            "event": "governance.approval_required",
            "approval_id": approval_id,
            "external_agent_id": external_agent_id,
            "approvers": approvers,
            "approval_url": approval_url,
            "timestamp": datetime.utcnow().isoformat()
        }

        for subscription in subscriptions:
            await self.webhook_service.trigger(
                webhook_id=subscription["webhook_id"],
                event_type="governance.approval_required",
                payload=alert_payload
            )
```

### Anomaly Detection

```python
class AnomalyDetector:
    """
    Detect anomalies in external agent execution patterns.

    Uses statistical analysis to identify unusual behavior.
    """

    async def detect_execution_spike(
        self,
        external_agent_id: str,
        window_minutes: int = 60
    ) -> bool:
        """
        Detect sudden spike in execution rate.

        Compares current window to historical average.

        Args:
            external_agent_id: External agent identifier
            window_minutes: Time window in minutes

        Returns:
            True if spike detected, False otherwise
        """
        # Fetch execution count for current window
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=window_minutes)

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentExecutionCountNode",
            "count_recent",
            {
                "filter": {
                    "external_agent_id": external_agent_id,
                    "created_at": {"gte": window_start.isoformat()}
                }
            }
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        current_count = results.get("count_recent", {}).get("count", 0)

        # Fetch historical average
        historical_avg = await self._get_historical_average(
            external_agent_id, window_minutes
        )

        # Spike detected if current > 3x historical average
        spike_threshold = historical_avg * 3

        if current_count > spike_threshold:
            # Trigger alert
            await self.alert_service.trigger_unusual_activity_alert(
                external_agent_id=external_agent_id,
                activity_type="execution_spike",
                details={
                    "current_count": current_count,
                    "historical_average": historical_avg,
                    "window_minutes": window_minutes
                }
            )
            return True

        return False

    async def detect_high_error_rate(
        self,
        external_agent_id: str,
        window_minutes: int = 60,
        error_threshold: float = 0.25
    ) -> bool:
        """
        Detect high error rate.

        Args:
            external_agent_id: External agent identifier
            window_minutes: Time window in minutes
            error_threshold: Error rate threshold (e.g., 0.25 = 25%)

        Returns:
            True if high error rate detected, False otherwise
        """
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=window_minutes)

        # Count total executions
        total_workflow = WorkflowBuilder()
        total_workflow.add_node(
            "ExternalAgentExecutionCountNode",
            "count_total",
            {
                "filter": {
                    "external_agent_id": external_agent_id,
                    "created_at": {"gte": window_start.isoformat()}
                }
            }
        )

        results, _ = await self.runtime.execute_workflow_async(
            total_workflow.build(), inputs={}
        )

        total_count = results.get("count_total", {}).get("count", 0)

        if total_count == 0:
            return False

        # Count failed executions
        error_workflow = WorkflowBuilder()
        error_workflow.add_node(
            "ExternalAgentExecutionCountNode",
            "count_errors",
            {
                "filter": {
                    "external_agent_id": external_agent_id,
                    "created_at": {"gte": window_start.isoformat()},
                    "status": "failed"
                }
            }
        )

        results, _ = await self.runtime.execute_workflow_async(
            error_workflow.build(), inputs={}
        )

        error_count = results.get("count_errors", {}).get("count", 0)

        # Calculate error rate
        error_rate = error_count / total_count

        if error_rate > error_threshold:
            await self.alert_service.trigger_unusual_activity_alert(
                external_agent_id=external_agent_id,
                activity_type="high_error_rate",
                details={
                    "error_rate": error_rate,
                    "error_count": error_count,
                    "total_count": total_count,
                    "window_minutes": window_minutes
                }
            )
            return True

        return False
```

---

## Configuration Model

### Complete Configuration Schema

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class ExternalAgentGovernanceConfig:
    """
    Complete governance configuration for an external agent.

    This is the master configuration that combines all governance features.
    """

    # ─────────────────────────────────────────────────────────
    # BUDGET ENFORCEMENT
    # ─────────────────────────────────────────────────────────

    # Monthly budget (primary limit)
    monthly_budget_usd: Optional[float] = None  # e.g., 500.00
    monthly_execution_limit: Optional[int] = None  # e.g., 10000

    # Daily budget (prevent spikes)
    daily_budget_usd: Optional[float] = None  # e.g., 50.00
    daily_execution_limit: Optional[int] = None  # e.g., 1000

    # Cost estimation
    cost_per_execution: float = 0.02  # Default estimate

    # Degradation thresholds
    warning_threshold: float = 0.80   # Warn at 80%
    degradation_threshold: float = 0.90  # Degrade at 90%

    # ─────────────────────────────────────────────────────────
    # RATE LIMITING
    # ─────────────────────────────────────────────────────────

    # Per-agent limits
    rate_limit_per_minute: int = 60  # Default: 60 req/min
    burst_limit: int = 100           # Allow bursts up to 100

    # Per-user limits (optional)
    user_rate_limit_per_minute: Optional[int] = None  # e.g., 10

    # ─────────────────────────────────────────────────────────
    # APPROVAL WORKFLOWS
    # ─────────────────────────────────────────────────────────

    # When to require approval
    require_approval_for: list[str] = None  # ["production", "high_cost"]
    approval_cost_threshold: Optional[float] = None  # e.g., 10.00

    # Approver configuration
    approvers: list[str] = None  # User IDs or roles
    approval_level: str = "team_lead"  # team_lead, admin, owner

    # Timeout
    approval_timeout_seconds: int = 3600  # 1 hour
    approval_default_decision: str = "deny"  # fail-closed

    # ─────────────────────────────────────────────────────────
    # ABAC POLICY
    # ─────────────────────────────────────────────────────────

    # Time restrictions
    allowed_hours: Optional[tuple[int, int]] = None  # (9, 17) = 9am-5pm
    allowed_days: Optional[list[int]] = None  # [0,1,2,3,4] = Mon-Fri

    # Location restrictions
    ip_allowlist: Optional[list[str]] = None  # ["10.0.0.0/8"]

    # Environment restrictions
    allowed_environments: list[str] = None  # ["dev", "staging"]

    # ─────────────────────────────────────────────────────────
    # COMPLIANCE CONTROLS
    # ─────────────────────────────────────────────────────────

    # Data classification
    data_classification: str = "internal"  # public, internal, confidential, restricted
    allowed_data_classifications: list[str] = None  # Classifications agent can access

    # PII detection
    pii_detection_enabled: bool = True
    pii_masking_enabled: bool = True
    mask_pii_types: list[str] = None  # ["email", "phone", "ssn"]

    # Retention
    retention_days: int = 90  # Default: 90 days
    archive_after_days: Optional[int] = None  # Optional archival

    # Audit immutability
    audit_immutability_enabled: bool = True

    # ─────────────────────────────────────────────────────────
    # ALERTING
    # ─────────────────────────────────────────────────────────

    # Alert thresholds
    alert_on_budget_threshold: bool = True
    alert_on_unusual_activity: bool = True
    alert_on_policy_violation: bool = True

    # Webhook subscriptions
    webhook_ids: list[str] = None  # Webhook IDs for alerts
```

### Database Model

```python
from studio.models import db

@db.model
class ExternalAgentGovernance:
    """
    External Agent Governance Configuration Model.

    Stores governance settings for each external agent.
    """

    # Primary key
    id: str

    # External agent reference
    external_agent_id: str

    # Budget settings (JSON)
    budget_config: str  # JSON-serialized budget configuration

    # Rate limit settings (JSON)
    rate_limit_config: str  # JSON-serialized rate limit configuration

    # Approval settings (JSON)
    approval_config: str  # JSON-serialized approval configuration

    # ABAC policy settings (JSON)
    policy_config: str  # JSON-serialized policy configuration

    # Compliance settings (JSON)
    compliance_config: str  # JSON-serialized compliance configuration

    # Alerting settings (JSON)
    alert_config: str  # JSON-serialized alert configuration

    # Metadata
    created_by: str
    created_at: str
    updated_at: str
```

---

## Enforcement Flow

### Pre-Execution Decision Tree

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL AGENT EXECUTION REQUEST                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  1. Authentication   │
                │  & Lineage Check     │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │   Valid user?        │
                └──────────┬───────────┘
                           │
                ┌──────────┴────────┐
                │ NO                │ YES
                ▼                   ▼
        ┌──────────────┐   ┌──────────────────────┐
        │  DENY        │   │  2. Rate Limit Check │
        │  (401)       │   └──────────┬───────────┘
        └──────────────┘              │
                                      ▼
                           ┌──────────────────────┐
                           │  Within rate limit?  │
                           └──────────┬───────────┘
                                      │
                           ┌──────────┴────────┐
                           │ NO                │ YES
                           ▼                   ▼
                   ┌──────────────┐   ┌──────────────────────┐
                   │  DENY        │   │  3. Budget Check     │
                   │  (429)       │   └──────────┬───────────┘
                   └──────────────┘              │
                                                 ▼
                                      ┌──────────────────────┐
                                      │  Within budget?      │
                                      └──────────┬───────────┘
                                                 │
                                      ┌──────────┴────────┐
                                      │ NO                │ YES
                                      ▼                   ▼
                              ┌──────────────┐   ┌──────────────────────┐
                              │  DENY        │   │  4. ABAC Policy      │
                              │  (402)       │   │     Evaluation       │
                              └──────────────┘   └──────────┬───────────┘
                                                            │
                                                            ▼
                                                 ┌──────────────────────┐
                                                 │  Policy allows?      │
                                                 └──────────┬───────────┘
                                                            │
                                                 ┌──────────┴────────┐
                                                 │ NO                │ YES
                                                 ▼                   ▼
                                         ┌──────────────┐   ┌──────────────────────┐
                                         │  DENY        │   │  5. Compliance Check │
                                         │  (403)       │   └──────────┬───────────┘
                                         └──────────────┘              │
                                                                       ▼
                                                            ┌──────────────────────┐
                                                            │  Compliant?          │
                                                            └──────────┬───────────┘
                                                                       │
                                                            ┌──────────┴────────┐
                                                            │ NO                │ YES
                                                            ▼                   ▼
                                                    ┌──────────────┐   ┌──────────────────────┐
                                                    │  DENY        │   │  6. Approval Check   │
                                                    │  (403)       │   └──────────┬───────────┘
                                                    └──────────────┘              │
                                                                                  ▼
                                                                       ┌──────────────────────┐
                                                                       │  Approval required?  │
                                                                       └──────────┬───────────┘
                                                                                  │
                                                                       ┌──────────┴────────┐
                                                                       │ YES               │ NO
                                                                       ▼                   ▼
                                                              ┌─────────────────┐  ┌──────────────┐
                                                              │  Request        │  │  ALLOW       │
                                                              │  Approval       │  │  EXECUTION   │
                                                              └────────┬────────┘  └──────────────┘
                                                                       │
                                                                       ▼
                                                            ┌──────────────────────┐
                                                            │  Wait for approval   │
                                                            │  (timeout: 1 hour)   │
                                                            └──────────┬───────────┘
                                                                       │
                                                            ┌──────────┴────────┐
                                                            │ APPROVED          │ DENIED/TIMEOUT
                                                            ▼                   ▼
                                                   ┌──────────────┐   ┌──────────────┐
                                                   │  ALLOW       │   │  DENY        │
                                                   │  EXECUTION   │   │  (403)       │
                                                   └──────────────┘   └──────────────┘
```

### Enforcement Workflow Implementation

```python
class GovernanceEnforcementService:
    """
    Master service for enforcing all governance controls.

    Orchestrates all governance checks in the correct order.
    """

    def __init__(self):
        self.budget_enforcer = ExternalAgentBudgetEnforcer()
        self.rate_limiter = ExternalAgentRateLimiter()
        self.policy_engine = ExternalAgentPolicyEngine()
        self.approval_manager = ExternalAgentApprovalManager()
        self.compliance_enforcer = DataClassificationEnforcer()
        self.alert_service = GovernanceAlertService()

    async def enforce_governance(
        self,
        external_agent_id: str,
        execution_request: dict,
        user_id: str,
        team_id: str,
        organization_id: str,
        ip_address: str,
        environment: str
    ) -> tuple[bool, str | None, dict]:
        """
        Enforce all governance controls for external agent execution.

        Returns:
            Tuple of (allowed, denial_reason, metadata)
        """
        metadata = {}

        # Step 1: Authentication & Lineage (handled by caller)
        # Assumed to be complete before this method is called

        # Step 2: Rate Limit Check
        allowed, remaining, reason = await self.rate_limiter.check_rate_limit(
            external_agent_id=external_agent_id,
            user_id=user_id,
            team_id=team_id,
            organization_id=organization_id
        )

        if not allowed:
            metadata["rate_limit_remaining"] = remaining
            return False, reason, metadata

        metadata["rate_limit_remaining"] = remaining

        # Step 3: Budget Check
        estimated_cost = await self._estimate_cost(
            external_agent_id, execution_request
        )

        budget_result = await self.budget_enforcer.check_budget(
            external_agent_id=external_agent_id,
            estimated_cost=estimated_cost,
            user_id=user_id
        )

        if not budget_result.allowed:
            metadata["budget_remaining"] = budget_result.remaining_budget_usd
            return False, budget_result.reason, metadata

        metadata["budget_remaining"] = budget_result.remaining_budget_usd
        metadata["degraded_mode"] = budget_result.degraded_mode

        # Step 4: ABAC Policy Evaluation
        execution_context = {
            "user_id": user_id,
            "ip_address": ip_address,
            "environment": environment,
            "timestamp": datetime.utcnow().isoformat(),
            "data_classification": execution_request.get("data_classification", "internal")
        }

        allowed, reason = await self.policy_engine.evaluate_policy(
            external_agent_id=external_agent_id,
            execution_context=execution_context
        )

        if not allowed:
            return False, reason, metadata

        # Step 5: Compliance Check
        compliant, reason = await self.compliance_enforcer.check_classification_compliance(
            external_agent_id=external_agent_id,
            data_classification=execution_request.get("data_classification", "internal"),
            execution_request=execution_request
        )

        if not compliant:
            return False, reason, metadata

        # Step 6: Approval Check
        approved, approval_id = await self.approval_manager.request_approval(
            external_agent_id=external_agent_id,
            execution_request=execution_request,
            user_id=user_id,
            estimated_cost=estimated_cost,
            environment=environment
        )

        if not approved:
            metadata["approval_id"] = approval_id
            return False, "Approval required but not granted", metadata

        if approval_id:
            metadata["approval_id"] = approval_id

        # All checks passed
        return True, None, metadata
```

---

## Database Schema

### External Agent Governance Tables

```sql
-- External Agent Governance Configuration
CREATE TABLE external_agent_governance (
    id VARCHAR(36) PRIMARY KEY,
    external_agent_id VARCHAR(36) NOT NULL,

    -- Budget configuration (JSON)
    budget_config TEXT,

    -- Rate limit configuration (JSON)
    rate_limit_config TEXT,

    -- Approval configuration (JSON)
    approval_config TEXT,

    -- ABAC policy configuration (JSON)
    policy_config TEXT,

    -- Compliance configuration (JSON)
    compliance_config TEXT,

    -- Alerting configuration (JSON)
    alert_config TEXT,

    -- Metadata
    created_by VARCHAR(36),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (external_agent_id) REFERENCES external_agents(id) ON DELETE CASCADE
);

-- Budget tracking
CREATE TABLE external_agent_budgets (
    id VARCHAR(36) PRIMARY KEY,
    external_agent_id VARCHAR(36) NOT NULL,

    -- Monthly budget
    monthly_budget_usd DECIMAL(10, 2),
    monthly_spent_usd DECIMAL(10, 2) DEFAULT 0,
    monthly_execution_limit INTEGER,
    monthly_execution_count INTEGER DEFAULT 0,

    -- Daily budget
    daily_budget_usd DECIMAL(10, 2),
    daily_spent_usd DECIMAL(10, 2) DEFAULT 0,
    daily_execution_limit INTEGER,
    daily_execution_count INTEGER DEFAULT 0,

    -- Reset timestamps
    last_monthly_reset TIMESTAMP,
    last_daily_reset TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (external_agent_id) REFERENCES external_agents(id) ON DELETE CASCADE
);

-- Approval requests
CREATE TABLE external_agent_approvals (
    id VARCHAR(36) PRIMARY KEY,
    external_agent_id VARCHAR(36) NOT NULL,

    -- Request details
    requested_by VARCHAR(36) NOT NULL,
    execution_request TEXT NOT NULL,  -- JSON
    estimated_cost DECIMAL(10, 2),
    environment VARCHAR(50),

    -- Approver configuration
    approvers TEXT,  -- JSON array of user IDs
    approval_level VARCHAR(50),

    -- Decision
    status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, denied, expired
    approver_id VARCHAR(36),
    decided_at TIMESTAMP,

    -- Callback
    callback_url TEXT,

    -- Metadata
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (external_agent_id) REFERENCES external_agents(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Execution records (for retention and audit)
CREATE TABLE external_agent_executions (
    id VARCHAR(36) PRIMARY KEY,
    external_agent_id VARCHAR(36) NOT NULL,

    -- Execution details
    user_id VARCHAR(36) NOT NULL,
    execution_request TEXT,  -- JSON (potentially masked)
    execution_response TEXT,  -- JSON (potentially masked)

    -- Cost and performance
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    duration_ms INTEGER,

    -- Status
    status VARCHAR(50),  -- success, failed, denied
    error_message TEXT,

    -- Governance metadata
    approval_id VARCHAR(36),
    policy_violations TEXT,  -- JSON array

    -- Metadata
    created_at TIMESTAMP,

    FOREIGN KEY (external_agent_id) REFERENCES external_agents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approval_id) REFERENCES external_agent_approvals(id)
);

-- Indexes for performance
CREATE INDEX idx_external_agent_budgets_agent_id ON external_agent_budgets(external_agent_id);
CREATE INDEX idx_external_agent_approvals_agent_id ON external_agent_approvals(external_agent_id);
CREATE INDEX idx_external_agent_approvals_status ON external_agent_approvals(status);
CREATE INDEX idx_external_agent_executions_agent_id ON external_agent_executions(external_agent_id);
CREATE INDEX idx_external_agent_executions_user_id ON external_agent_executions(user_id);
CREATE INDEX idx_external_agent_executions_created_at ON external_agent_executions(created_at);
```

---

## API Design

### Governance Enforcement API

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/external-agents", tags=["External Agents - Governance"])

class ExecutionRequest(BaseModel):
    external_agent_id: str
    payload: dict
    environment: str = "dev"
    data_classification: str = "internal"

class ExecutionResponse(BaseModel):
    allowed: bool
    execution_id: str | None = None
    denial_reason: str | None = None
    metadata: dict = {}

@router.post("/{external_agent_id}/execute", response_model=ExecutionResponse)
async def execute_external_agent(
    external_agent_id: str,
    request: ExecutionRequest,
    current_user = Depends(get_current_user)
):
    """
    Execute external agent with full governance enforcement.

    Enforces:
    - Rate limiting
    - Budget checks
    - ABAC policies
    - Compliance controls
    - Approval workflows
    """
    enforcement_service = GovernanceEnforcementService()

    # Enforce governance
    allowed, reason, metadata = await enforcement_service.enforce_governance(
        external_agent_id=external_agent_id,
        execution_request=request.payload,
        user_id=current_user.id,
        team_id=current_user.team_id,
        organization_id=current_user.organization_id,
        ip_address=request.client.host,
        environment=request.environment
    )

    if not allowed:
        return ExecutionResponse(
            allowed=False,
            denial_reason=reason,
            metadata=metadata
        )

    # Execute external agent (implementation-specific)
    execution_id = await execute_agent(external_agent_id, request.payload)

    return ExecutionResponse(
        allowed=True,
        execution_id=execution_id,
        metadata=metadata
    )
```

### Budget Management API

```python
@router.get("/{external_agent_id}/budget", response_model=BudgetStatus)
async def get_budget_status(
    external_agent_id: str,
    current_user = Depends(get_current_user)
):
    """Get current budget status for external agent."""
    budget_enforcer = ExternalAgentBudgetEnforcer()
    budget = await budget_enforcer._get_budget_config(external_agent_id)

    return BudgetStatus(
        monthly_budget_usd=budget.monthly_budget_usd,
        monthly_spent_usd=budget.monthly_spent_usd,
        monthly_remaining_usd=budget.monthly_budget_usd - budget.monthly_spent_usd,
        monthly_execution_count=budget.monthly_execution_count,
        monthly_execution_limit=budget.monthly_execution_limit,
        degraded_mode=budget.monthly_spent_usd / budget.monthly_budget_usd >= 0.90
    )

@router.put("/{external_agent_id}/budget", response_model=dict)
async def update_budget(
    external_agent_id: str,
    budget_update: BudgetUpdate,
    current_user = Depends(require_admin)
):
    """Update budget configuration (admin only)."""
    # Implementation
    pass
```

### Approval Management API

```python
@router.get("/approvals/pending", response_model=list[ApprovalRequest])
async def get_pending_approvals(
    current_user = Depends(get_current_user)
):
    """Get pending approval requests for current user."""
    # Implementation
    pass

@router.post("/approvals/{approval_id}/approve", response_model=dict)
async def approve_request(
    approval_id: str,
    current_user = Depends(get_current_user)
):
    """Approve external agent execution request."""
    handler = AsyncApprovalHandler()
    await handler.process_approval_decision(
        approval_id=approval_id,
        approved=True,
        approver_id=current_user.id
    )

    return {"status": "approved"}

@router.post("/approvals/{approval_id}/deny", response_model=dict)
async def deny_request(
    approval_id: str,
    current_user = Depends(get_current_user)
):
    """Deny external agent execution request."""
    handler = AsyncApprovalHandler()
    await handler.process_approval_decision(
        approval_id=approval_id,
        approved=False,
        approver_id=current_user.id
    )

    return {"status": "denied"}
```

---

## Testing Strategy

### Unit Tests

```python
import pytest
from datetime import datetime, timedelta

class TestBudgetEnforcer:
    """Unit tests for budget enforcement."""

    async def test_budget_check_within_limit(self):
        """Test budget check when within limit."""
        enforcer = ExternalAgentBudgetEnforcer()

        result = await enforcer.check_budget(
            external_agent_id="agent-123",
            estimated_cost=5.0,
            user_id="user-123"
        )

        assert result.allowed is True
        assert result.remaining_budget_usd > 0

    async def test_budget_check_exceeded(self):
        """Test budget check when limit exceeded."""
        enforcer = ExternalAgentBudgetEnforcer()

        # Simulate exhausted budget
        result = await enforcer.check_budget(
            external_agent_id="agent-123",
            estimated_cost=1000.0,  # Exceeds limit
            user_id="user-123"
        )

        assert result.allowed is False
        assert "exceeded" in result.reason.lower()

    async def test_budget_degradation_threshold(self):
        """Test degradation mode activation."""
        enforcer = ExternalAgentBudgetEnforcer()

        # Simulate 91% budget usage (above 90% threshold)
        result = await enforcer.check_budget(
            external_agent_id="agent-123",
            estimated_cost=1.0,
            user_id="user-123"
        )

        assert result.degraded_mode is True

class TestRateLimiter:
    """Unit tests for rate limiting."""

    async def test_rate_limit_within_limit(self):
        """Test rate limit check when within limit."""
        limiter = ExternalAgentRateLimiter()

        allowed, remaining, reason = await limiter.check_rate_limit(
            external_agent_id="agent-123",
            user_id="user-123",
            team_id="team-123",
            organization_id="org-123"
        )

        assert allowed is True
        assert remaining > 0

    async def test_rate_limit_exceeded(self):
        """Test rate limit check when limit exceeded."""
        limiter = ExternalAgentRateLimiter()

        # Simulate rate limit exhaustion
        # (Execute 61 requests in same minute window)
        for _ in range(61):
            await limiter.increment(
                external_agent_id="agent-123",
                user_id="user-123",
                team_id="team-123",
                organization_id="org-123"
            )

        allowed, remaining, reason = await limiter.check_rate_limit(
            external_agent_id="agent-123",
            user_id="user-123",
            team_id="team-123",
            organization_id="org-123"
        )

        assert allowed is False
        assert "rate limit exceeded" in reason.lower()

class TestPolicyEngine:
    """Unit tests for ABAC policy engine."""

    async def test_policy_business_hours(self):
        """Test business hours policy enforcement."""
        engine = ExternalAgentPolicyEngine()

        # Create business hours policy
        policy = {
            "effect": "deny",
            "conditions": {
                "any": [
                    {"field": "time.hour", "op": "lt", "value": 9},
                    {"field": "time.hour", "op": "gte", "value": 17}
                ]
            }
        }

        # Test during business hours (10am)
        context = {
            "timestamp": datetime.now().replace(hour=10).isoformat()
        }

        result = await engine._evaluate_single_policy(policy, context)
        assert result is None  # Policy doesn't apply

        # Test outside business hours (8am)
        context = {
            "timestamp": datetime.now().replace(hour=8).isoformat()
        }

        result = await engine._evaluate_single_policy(policy, context)
        assert result is not None
        assert result[0] is False  # Denied
```

### Integration Tests

```python
class TestGovernanceIntegration:
    """Integration tests for complete governance flow."""

    async def test_full_enforcement_flow(self):
        """Test complete governance enforcement flow."""
        enforcement = GovernanceEnforcementService()

        # Execute with all governance checks
        allowed, reason, metadata = await enforcement.enforce_governance(
            external_agent_id="agent-123",
            execution_request={"input": "test"},
            user_id="user-123",
            team_id="team-123",
            organization_id="org-123",
            ip_address="10.0.0.1",
            environment="dev"
        )

        assert allowed is True
        assert metadata["rate_limit_remaining"] > 0
        assert metadata["budget_remaining"] > 0

    async def test_budget_exhaustion_blocks_execution(self):
        """Test that budget exhaustion blocks execution."""
        enforcement = GovernanceEnforcementService()

        # Exhaust budget
        # (Implementation-specific)

        allowed, reason, metadata = await enforcement.enforce_governance(
            external_agent_id="agent-123",
            execution_request={"input": "test"},
            user_id="user-123",
            team_id="team-123",
            organization_id="org-123",
            ip_address="10.0.0.1",
            environment="dev"
        )

        assert allowed is False
        assert "budget" in reason.lower()
```

### End-to-End Tests

```python
class TestGovernanceE2E:
    """End-to-end tests for governance features."""

    async def test_execution_with_approval(self):
        """Test execution requiring approval."""
        # Setup: Create external agent with approval requirement
        # Execute: Request execution
        # Verify: Approval request created
        # Approve: Grant approval
        # Verify: Execution proceeds
        pass

    async def test_budget_threshold_alert(self):
        """Test budget threshold alert triggering."""
        # Setup: Configure budget with 80% warning threshold
        # Execute: Consume 81% of budget
        # Verify: Alert webhook triggered
        pass
```

---

## Implementation Roadmap

### Phase 1: Budget Enforcement (Days 1-2)

**Deliverables**:
- `ExternalAgentBudgetEnforcer` with cost estimation and checking
- `external_agent_budgets` database table
- Budget reset service (daily/monthly)
- Unit tests for budget enforcement

**Tasks**:
1. Create database model for budget tracking
2. Implement cost estimation logic
3. Implement budget check logic
4. Implement usage recording
5. Create budget reset scheduled tasks
6. Write unit tests

### Phase 2: Rate Limiting (Day 3)

**Deliverables**:
- `ExternalAgentRateLimiter` with multi-tier limits
- Integration with existing `RateLimitService`
- Burst handling with token bucket algorithm
- Unit tests for rate limiting

**Tasks**:
1. Extend `RateLimitService` for external agents
2. Implement multi-tier rate limiting
3. Implement burst handling
4. Write unit tests

### Phase 3: Approval Workflows (Days 4-5)

**Deliverables**:
- `ExternalAgentApprovalManager` with sync/async approval
- `external_agent_approvals` database table
- Integration with `ToolApprovalManager`
- Approval APIs
- Unit tests for approval workflows

**Tasks**:
1. Create database model for approval requests
2. Implement approval requirement logic
3. Implement approval request creation
4. Implement async approval with callbacks
5. Create approval management APIs
6. Write unit tests

### Phase 4: ABAC Policy Engine (Days 6-7)

**Deliverables**:
- `ExternalAgentPolicyEngine` with condition evaluation
- Policy configuration support
- Time/location/environment restrictions
- Unit tests for policy evaluation

**Tasks**:
1. Extend `PermissionPolicy` for external agents
2. Implement condition evaluation logic
3. Create policy configuration management
4. Write unit tests

### Phase 5: Compliance Controls (Days 8-9)

**Deliverables**:
- Data classification enforcement
- PII detection and masking
- Retention policy enforcement
- Audit immutability
- Unit tests for compliance controls

**Tasks**:
1. Implement data classification enforcer
2. Implement PII detector with regex patterns
3. Implement retention policy service
4. Implement audit immutability with hashing
5. Write unit tests

### Phase 6: Alerting & Integration (Days 10-11)

**Deliverables**:
- `GovernanceAlertService` with webhook integration
- Anomaly detection (execution spikes, error rates)
- Integration tests
- E2E tests

**Tasks**:
1. Implement alert service with webhook integration
2. Implement anomaly detection algorithms
3. Write integration tests
4. Write E2E tests

### Phase 7: API & Documentation (Days 12-13)

**Deliverables**:
- Complete API endpoints for governance
- API documentation
- User guides
- Admin guides

**Tasks**:
1. Create governance enforcement API
2. Create budget management API
3. Create approval management API
4. Write API documentation
5. Write user guides

### Phase 8: Testing & Polish (Day 14)

**Deliverables**:
- Full test coverage (>90%)
- Performance testing
- Security audit
- Final documentation review

**Tasks**:
1. Run full test suite
2. Performance testing (load testing for rate limits)
3. Security audit (policy bypass attempts)
4. Documentation review

---

## Success Criteria

### Functional Requirements

- [ ] Budget enforcement prevents executions exceeding limits
- [ ] Rate limiting protects against abuse (60 req/min default)
- [ ] Approval workflows require human approval for sensitive operations
- [ ] ABAC policies enforce time/location/environment restrictions
- [ ] Data classification enforcement prevents unauthorized data access
- [ ] PII detection identifies and masks sensitive data
- [ ] Retention policies automatically delete expired data
- [ ] Audit logs are immutable and tamper-proof
- [ ] Alerts trigger for budget thresholds and unusual activity

### Non-Functional Requirements

- [ ] Governance checks complete in <100ms (95th percentile)
- [ ] Rate limiting scales to 10,000 agents
- [ ] Budget tracking handles 1M+ executions/month
- [ ] Approval workflows support 1-hour timeout
- [ ] Policy evaluation supports complex nested conditions
- [ ] PII detection covers 99% of common patterns
- [ ] Audit logs retained indefinitely (compliance)

### Compliance Requirements

- [ ] SOC2 Type II: Audit immutability with cryptographic hashing
- [ ] GDPR: PII detection and right-to-deletion support
- [ ] HIPAA: Data classification enforcement for PHI
- [ ] ISO 27001: Role-based approval workflows

---

## Appendix: Example Configurations

### Example 1: Production Agent with Strict Governance

```python
production_governance = ExternalAgentGovernanceConfig(
    # Budget: $1000/month, $100/day
    monthly_budget_usd=1000.0,
    daily_budget_usd=100.0,
    monthly_execution_limit=50000,

    # Rate limiting: 30 req/min per agent, 5 req/min per user
    rate_limit_per_minute=30,
    user_rate_limit_per_minute=5,
    burst_limit=50,

    # Approval: Required for production environment
    require_approval_for=["production"],
    approval_level="admin",
    approval_timeout_seconds=1800,  # 30 minutes

    # ABAC: Business hours only, corporate IP only
    allowed_hours=(9, 17),
    allowed_days=[0, 1, 2, 3, 4],  # Mon-Fri
    ip_allowlist=["10.0.0.0/8", "192.168.1.0/24"],
    allowed_environments=["production"],

    # Compliance: Confidential data, full PII detection
    data_classification="confidential",
    pii_detection_enabled=True,
    pii_masking_enabled=True,
    retention_days=365,  # 1 year
    audit_immutability_enabled=True,

    # Alerting: All alerts enabled
    alert_on_budget_threshold=True,
    alert_on_unusual_activity=True,
    alert_on_policy_violation=True
)
```

### Example 2: Development Agent with Relaxed Governance

```python
dev_governance = ExternalAgentGovernanceConfig(
    # Budget: $100/month (relaxed)
    monthly_budget_usd=100.0,

    # Rate limiting: 120 req/min (higher limit)
    rate_limit_per_minute=120,
    burst_limit=200,

    # Approval: Not required for dev
    require_approval_for=[],

    # ABAC: No restrictions
    allowed_environments=["dev", "staging"],

    # Compliance: Internal data only
    data_classification="internal",
    pii_detection_enabled=False,
    retention_days=30,  # 30 days

    # Alerting: Budget only
    alert_on_budget_threshold=True,
    alert_on_unusual_activity=False,
    alert_on_policy_violation=False
)
```

---

## Conclusion

This governance framework provides comprehensive controls for external agents while leveraging Kaizen's existing infrastructure. The design ensures:

1. **Budget Control**: Multi-dimensional budget enforcement prevents runaway costs
2. **Access Control**: ABAC policies provide fine-grained restrictions
3. **Compliance**: Data classification, PII detection, and immutable audit logs meet regulatory requirements
4. **Operational Safety**: Rate limiting and approval workflows protect against abuse
5. **Observability**: Alerting and anomaly detection enable proactive monitoring

The implementation roadmap delivers a complete solution in 2 weeks with incremental testing and validation at each phase.
