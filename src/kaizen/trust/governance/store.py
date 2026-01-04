"""
Governance Storage Module

Provides storage backends for governance features:

Budget Storage:
- InMemoryBudgetStore: For testing and development
- DataFlowBudgetStore: Production storage using DataFlow

Approval Storage:
- InMemoryApprovalStore: For testing and development
- DataFlowApprovalStore: Production storage using DataFlow

All stores implement their respective protocols.
"""

import json
import logging
from abc import ABC, abstractmethod
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Protocol

from kaizen.trust.governance.types import (
    ApprovalRequest,
    ApprovalStatus,
    BudgetScope,
    BudgetUsageRecord,
    ExternalAgentBudget,
)

logger = logging.getLogger(__name__)


class BudgetStore(Protocol):
    """
    Protocol for budget storage backends.

    All budget stores must implement these methods to ensure
    consistent behavior across different backends.
    """

    async def get_budget(
        self,
        agent_id: str,
        scope: BudgetScope
    ) -> ExternalAgentBudget | None:
        """Get budget for an agent within a scope."""
        ...

    async def update_budget(
        self,
        agent_id: str,
        scope: BudgetScope,
        budget: ExternalAgentBudget
    ) -> ExternalAgentBudget:
        """Update budget for an agent."""
        ...

    async def record_usage(
        self,
        record: BudgetUsageRecord
    ) -> None:
        """Record a usage event."""
        ...

    async def get_period_usage(
        self,
        agent_id: str,
        scope: BudgetScope,
        period_start: datetime,
        period_end: datetime
    ) -> dict[str, float]:
        """Get aggregated usage for a period."""
        ...

    async def reset_period_usage(
        self,
        agent_id: str,
        scope: BudgetScope
    ) -> None:
        """Reset usage counters for a new period."""
        ...


class InMemoryBudgetStore:
    """
    In-memory budget store for testing and development.

    Thread-safe storage using dictionaries. Data is lost on restart.

    Examples:
        >>> store = InMemoryBudgetStore()
        >>> budget = await store.get_budget("agent-001", scope)
        >>> if budget is None:
        ...     budget = ExternalAgentBudget(external_agent_id="agent-001")
        ...     await store.update_budget("agent-001", scope, budget)
    """

    def __init__(self):
        """Initialize empty storage."""
        self._budgets: dict[str, ExternalAgentBudget] = {}
        self._usage_records: list[BudgetUsageRecord] = []
        self._period_usage: dict[str, dict[str, float]] = defaultdict(
            lambda: {"cost": 0.0, "tokens": 0, "invocations": 0}
        )

    def _make_key(self, agent_id: str, scope: BudgetScope) -> str:
        """Generate storage key for agent/scope combination."""
        return f"{agent_id}:{scope.to_key()}"

    async def get_budget(
        self,
        agent_id: str,
        scope: BudgetScope
    ) -> ExternalAgentBudget | None:
        """Get budget for an agent within a scope."""
        key = self._make_key(agent_id, scope)
        return self._budgets.get(key)

    async def update_budget(
        self,
        agent_id: str,
        scope: BudgetScope,
        budget: ExternalAgentBudget
    ) -> ExternalAgentBudget:
        """Update budget for an agent."""
        key = self._make_key(agent_id, scope)
        self._budgets[key] = budget
        return budget

    async def record_usage(self, record: BudgetUsageRecord) -> None:
        """Record a usage event."""
        self._usage_records.append(record)

        # Update aggregated period usage
        key = self._make_key(record.agent_id, record.scope)
        self._period_usage[key]["cost"] += record.cost
        self._period_usage[key]["tokens"] += record.tokens_used
        self._period_usage[key]["invocations"] += 1

    async def get_period_usage(
        self,
        agent_id: str,
        scope: BudgetScope,
        period_start: datetime,
        period_end: datetime
    ) -> dict[str, float]:
        """Get aggregated usage for a period."""
        key = self._make_key(agent_id, scope)

        # Filter records by period
        total_cost = 0.0
        total_tokens = 0
        total_invocations = 0

        for record in self._usage_records:
            if (
                record.agent_id == agent_id
                and record.scope.to_key() == scope.to_key()
                and period_start <= record.timestamp < period_end
            ):
                total_cost += record.cost
                total_tokens += record.tokens_used
                total_invocations += 1

        return {
            "cost": total_cost,
            "tokens": total_tokens,
            "invocations": total_invocations,
        }

    async def reset_period_usage(
        self,
        agent_id: str,
        scope: BudgetScope
    ) -> None:
        """Reset usage counters for a new period."""
        key = self._make_key(agent_id, scope)
        self._period_usage[key] = {"cost": 0.0, "tokens": 0, "invocations": 0}

    async def clear(self) -> None:
        """Clear all stored data (for testing)."""
        self._budgets.clear()
        self._usage_records.clear()
        self._period_usage.clear()


class DataFlowBudgetStore:
    """
    Production budget store using DataFlow for persistence.

    Uses DataFlow nodes to persist budget data to the database.
    Requires UsageRecord and BudgetConfig DataFlow models.

    Examples:
        >>> from kailash.runtime import AsyncLocalRuntime
        >>> runtime = AsyncLocalRuntime()
        >>> store = DataFlowBudgetStore(runtime)
        >>> budget = await store.get_budget("agent-001", scope)
    """

    def __init__(self, runtime: Any, db: Any = None):
        """
        Initialize DataFlow budget store.

        Args:
            runtime: AsyncLocalRuntime instance
            db: Optional DataFlow instance
        """
        self.runtime = runtime
        self.db = db

    async def get_budget(
        self,
        agent_id: str,
        scope: BudgetScope
    ) -> ExternalAgentBudget | None:
        """Get budget for an agent by reading from ExternalAgent model."""
        from kailash.workflow.builder import WorkflowBuilder

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentReadNode",
            "read_agent",
            {"id": agent_id}
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(),
            inputs={}
        )

        agent = results.get("read_agent")
        if not agent:
            return None

        # Convert agent record to budget object
        monthly_limit = agent.get("budget_limit_monthly", 1000.0)
        if monthly_limit < 0:
            monthly_limit = 10_000_000.0  # Effectively unlimited

        daily_limit = agent.get("budget_limit_daily", -1.0)
        if daily_limit < 0:
            daily_limit = None

        # Get period usage from usage records
        period_usage = await self._get_period_usage_from_db(agent_id, scope)

        return ExternalAgentBudget(
            external_agent_id=agent_id,
            monthly_budget_usd=monthly_limit,
            monthly_spent_usd=period_usage.get("monthly_cost", 0.0),
            daily_budget_usd=daily_limit,
            daily_spent_usd=period_usage.get("daily_cost", 0.0),
            monthly_execution_count=int(period_usage.get("monthly_invocations", 0)),
        )

    async def _get_period_usage_from_db(
        self,
        agent_id: str,
        scope: BudgetScope
    ) -> dict[str, float]:
        """Get usage from UsageRecord model for current period."""
        from datetime import UTC

        from kailash.workflow.builder import WorkflowBuilder

        now = datetime.now(UTC)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Query usage records for this agent in current month
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UsageRecordListNode",
            "list_usage",
            {
                "filter": {
                    "external_agent_id": agent_id,
                    "organization_id": scope.organization_id,
                },
                "limit": 10000,  # Get all records for aggregation
            }
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(),
                inputs={}
            )

            records = results.get("list_usage", {}).get("records", [])

            monthly_cost = 0.0
            daily_cost = 0.0
            monthly_invocations = 0

            for record in records:
                record_time_str = record.get("recorded_at", "")
                if record_time_str:
                    try:
                        record_time = datetime.fromisoformat(record_time_str.replace("Z", "+00:00"))
                        cost = record.get("cost", 0.0)

                        if record_time >= month_start:
                            monthly_cost += cost
                            monthly_invocations += 1

                            if record_time >= day_start:
                                daily_cost += cost
                    except (ValueError, TypeError):
                        continue

            return {
                "monthly_cost": monthly_cost,
                "daily_cost": daily_cost,
                "monthly_invocations": monthly_invocations,
            }

        except Exception as e:
            logger.warning(f"Failed to get usage from DB: {e}")
            return {"monthly_cost": 0.0, "daily_cost": 0.0, "monthly_invocations": 0}

    async def update_budget(
        self,
        agent_id: str,
        scope: BudgetScope,
        budget: ExternalAgentBudget
    ) -> ExternalAgentBudget:
        """Update budget configuration for an agent."""
        from kailash.workflow.builder import WorkflowBuilder

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentUpdateNode",
            "update_agent",
            {
                "filter": {"id": agent_id},
                "fields": {
                    "budget_limit_monthly": budget.monthly_budget_usd,
                    "budget_limit_daily": budget.daily_budget_usd if budget.daily_budget_usd else -1.0,
                }
            }
        )

        await self.runtime.execute_workflow_async(
            workflow.build(),
            inputs={}
        )

        return budget

    async def record_usage(self, record: BudgetUsageRecord) -> None:
        """Record usage to UsageRecord model."""
        import uuid

        from kailash.workflow.builder import WorkflowBuilder

        now = datetime.utcnow().isoformat()

        workflow = WorkflowBuilder()
        workflow.add_node(
            "UsageRecordCreateNode",
            "create_usage",
            {
                "id": str(uuid.uuid4()),
                "organization_id": record.scope.organization_id,
                "external_agent_id": record.agent_id,
                "user_id": record.scope.user_id or "",
                "resource_type": "external_agent_invocation",
                "resource_id": record.invocation_id,
                "quantity": 1,
                "unit": "invocation",
                "cost": record.cost,
                "metadata": json.dumps(record.metadata),
                "recorded_at": now,
                "created_at": now,
            }
        )

        try:
            await self.runtime.execute_workflow_async(
                workflow.build(),
                inputs={}
            )
        except Exception as e:
            logger.error(f"Failed to record usage: {e}")
            # Don't fail the main operation if usage recording fails

    async def get_period_usage(
        self,
        agent_id: str,
        scope: BudgetScope,
        period_start: datetime,
        period_end: datetime
    ) -> dict[str, float]:
        """Get aggregated usage for a period."""
        return await self._get_period_usage_from_db(agent_id, scope)

    async def reset_period_usage(
        self,
        agent_id: str,
        scope: BudgetScope
    ) -> None:
        """
        Reset usage counters for a new period.

        For DataFlow store, this is a no-op since we calculate
        period usage dynamically from timestamps.
        """
        pass  # Period resets are handled by timestamp filtering


# ===================
# Approval Storage
# ===================


class ApprovalStore(Protocol):
    """
    Protocol for approval request storage backends.

    All approval stores must implement these methods.
    """

    async def save(self, request: ApprovalRequest) -> ApprovalRequest:
        """Save an approval request."""
        ...

    async def get(self, request_id: str) -> ApprovalRequest | None:
        """Get an approval request by ID."""
        ...

    async def get_pending_for_approver(
        self,
        approver_id: str,
        organization_id: str | None = None
    ) -> list[ApprovalRequest]:
        """Get pending requests that an approver can act on."""
        ...

    async def get_pending_for_agent(
        self,
        agent_id: str,
        organization_id: str
    ) -> list[ApprovalRequest]:
        """Get pending requests for a specific agent."""
        ...

    async def get_expired(self) -> list[ApprovalRequest]:
        """Get all expired but not yet processed requests."""
        ...

    async def delete(self, request_id: str) -> bool:
        """Delete an approval request."""
        ...


class InMemoryApprovalStore:
    """
    In-memory approval store for testing and development.

    Examples:
        >>> store = InMemoryApprovalStore()
        >>> request = ApprovalRequest(
        ...     id="apr-001",
        ...     external_agent_id="agent-001",
        ...     organization_id="org-001",
        ...     requested_by_user_id="user-001",
        ...     trigger_reason="Cost threshold exceeded"
        ... )
        >>> saved = await store.save(request)
        >>> retrieved = await store.get("apr-001")
    """

    def __init__(self):
        """Initialize empty storage."""
        self._requests: dict[str, ApprovalRequest] = {}

    async def save(self, request: ApprovalRequest) -> ApprovalRequest:
        """Save an approval request."""
        self._requests[request.id] = request
        return request

    async def get(self, request_id: str) -> ApprovalRequest | None:
        """Get an approval request by ID."""
        return self._requests.get(request_id)

    async def get_pending_for_approver(
        self,
        approver_id: str,
        organization_id: str | None = None
    ) -> list[ApprovalRequest]:
        """Get pending requests that an approver can act on."""
        result = []
        for request in self._requests.values():
            if request.status != ApprovalStatus.PENDING:
                continue
            if organization_id and request.organization_id != organization_id:
                continue
            result.append(request)
        return result

    async def get_pending_for_agent(
        self,
        agent_id: str,
        organization_id: str
    ) -> list[ApprovalRequest]:
        """Get pending requests for a specific agent."""
        result = []
        for request in self._requests.values():
            if request.status != ApprovalStatus.PENDING:
                continue
            if request.external_agent_id != agent_id:
                continue
            if request.organization_id != organization_id:
                continue
            result.append(request)
        return result

    async def get_expired(self) -> list[ApprovalRequest]:
        """Get all expired but not yet processed requests."""
        now = datetime.utcnow()
        result = []
        for request in self._requests.values():
            if request.status != ApprovalStatus.PENDING:
                continue
            if request.expires_at and request.expires_at < now:
                result.append(request)
        return result

    async def delete(self, request_id: str) -> bool:
        """Delete an approval request."""
        if request_id in self._requests:
            del self._requests[request_id]
            return True
        return False

    async def clear(self) -> None:
        """Clear all stored data (for testing)."""
        self._requests.clear()


class DataFlowApprovalStore:
    """
    Production approval store using DataFlow for persistence.

    Uses DataFlow nodes to persist approval requests to the database.
    Requires ApprovalRequest DataFlow model.

    Examples:
        >>> from kailash.runtime import AsyncLocalRuntime
        >>> runtime = AsyncLocalRuntime()
        >>> store = DataFlowApprovalStore(runtime)
        >>> request = await store.get("apr-001")
    """

    def __init__(self, runtime: Any, db: Any = None):
        """
        Initialize DataFlow approval store.

        Args:
            runtime: AsyncLocalRuntime instance
            db: Optional DataFlow instance
        """
        self.runtime = runtime
        self.db = db

    async def save(self, request: ApprovalRequest) -> ApprovalRequest:
        """Save an approval request."""
        from kailash.workflow.builder import WorkflowBuilder

        # Serialize complex fields
        invocation_context_json = json.dumps(request.invocation_context)
        approvals_json = json.dumps([
            {
                "approver_id": d.approver_id,
                "decision": d.decision,
                "reason": d.reason,
                "timestamp": d.timestamp.isoformat() if d.timestamp else None,
                "metadata": d.metadata
            }
            for d in request.approvals
        ])
        rejections_json = json.dumps([
            {
                "approver_id": d.approver_id,
                "decision": d.decision,
                "reason": d.reason,
                "timestamp": d.timestamp.isoformat() if d.timestamp else None,
                "metadata": d.metadata
            }
            for d in request.rejections
        ])

        # Check if request exists (upsert logic)
        existing = await self.get(request.id)

        workflow = WorkflowBuilder()

        if existing:
            # Update existing
            workflow.add_node(
                "ApprovalRequestUpdateNode",
                "update_request",
                {
                    "filter": {"id": request.id},
                    "fields": {
                        "status": request.status.value,
                        "approvals": approvals_json,
                        "rejections": rejections_json,
                        "required_approvals": request.required_approvals,
                    }
                }
            )
        else:
            # Create new
            workflow.add_node(
                "ApprovalRequestCreateNode",
                "create_request",
                {
                    "id": request.id,
                    "external_agent_id": request.external_agent_id,
                    "organization_id": request.organization_id,
                    "requested_by_user_id": request.requested_by_user_id,
                    "requested_by_team_id": request.requested_by_team_id or "",
                    "trigger_reason": request.trigger_reason,
                    "invocation_context": invocation_context_json,
                    "payload_summary": request.payload_summary,
                    "estimated_cost": request.estimated_cost or 0.0,
                    "estimated_tokens": request.estimated_tokens or 0,
                    "status": request.status.value,
                    "created_at": request.created_at.isoformat(),
                    "expires_at": request.expires_at.isoformat() if request.expires_at else None,
                    "required_approvals": request.required_approvals,
                    "approvals": approvals_json,
                    "rejections": rejections_json,
                }
            )

        try:
            await self.runtime.execute_workflow_async(
                workflow.build(),
                inputs={}
            )
        except Exception as e:
            logger.error(f"Failed to save approval request: {e}")
            raise

        return request

    async def get(self, request_id: str) -> ApprovalRequest | None:
        """Get an approval request by ID."""
        from kailash.workflow.builder import WorkflowBuilder

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ApprovalRequestReadNode",
            "read_request",
            {"id": request_id}
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(),
                inputs={}
            )

            record = results.get("read_request")
            if not record:
                return None

            return self._record_to_request(record)

        except Exception as e:
            logger.warning(f"Failed to get approval request: {e}")
            return None

    async def get_pending_for_approver(
        self,
        approver_id: str,
        organization_id: str | None = None
    ) -> list[ApprovalRequest]:
        """Get pending requests that an approver can act on."""
        from kailash.workflow.builder import WorkflowBuilder

        workflow = WorkflowBuilder()

        filter_params: dict[str, Any] = {"status": "pending"}
        if organization_id:
            filter_params["organization_id"] = organization_id

        workflow.add_node(
            "ApprovalRequestListNode",
            "list_requests",
            {"filter": filter_params, "limit": 100}
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(),
                inputs={}
            )

            records = results.get("list_requests", {}).get("records", [])
            return [self._record_to_request(r) for r in records]

        except Exception as e:
            logger.warning(f"Failed to get pending requests: {e}")
            return []

    async def get_pending_for_agent(
        self,
        agent_id: str,
        organization_id: str
    ) -> list[ApprovalRequest]:
        """Get pending requests for a specific agent."""
        from kailash.workflow.builder import WorkflowBuilder

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ApprovalRequestListNode",
            "list_requests",
            {
                "filter": {
                    "external_agent_id": agent_id,
                    "organization_id": organization_id,
                    "status": "pending"
                },
                "limit": 100
            }
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(),
                inputs={}
            )

            records = results.get("list_requests", {}).get("records", [])
            return [self._record_to_request(r) for r in records]

        except Exception as e:
            logger.warning(f"Failed to get pending requests for agent: {e}")
            return []

    async def get_expired(self) -> list[ApprovalRequest]:
        """Get all expired but not yet processed requests."""
        from kailash.workflow.builder import WorkflowBuilder

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ApprovalRequestListNode",
            "list_requests",
            {"filter": {"status": "pending"}, "limit": 1000}
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(),
                inputs={}
            )

            records = results.get("list_requests", {}).get("records", [])
            now = datetime.utcnow()

            expired = []
            for record in records:
                request = self._record_to_request(record)
                if request.expires_at and request.expires_at < now:
                    expired.append(request)

            return expired

        except Exception as e:
            logger.warning(f"Failed to get expired requests: {e}")
            return []

    async def delete(self, request_id: str) -> bool:
        """Delete an approval request."""
        from kailash.workflow.builder import WorkflowBuilder

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ApprovalRequestDeleteNode",
            "delete_request",
            {"id": request_id}
        )

        try:
            await self.runtime.execute_workflow_async(
                workflow.build(),
                inputs={}
            )
            return True
        except Exception as e:
            logger.warning(f"Failed to delete approval request: {e}")
            return False

    def _record_to_request(self, record: dict[str, Any]) -> ApprovalRequest:
        """Convert database record to ApprovalRequest."""
        from kaizen.trust.governance.types import ApprovalDecision

        # Parse JSON fields
        invocation_context = {}
        if record.get("invocation_context"):
            try:
                invocation_context = json.loads(record["invocation_context"])
            except (json.JSONDecodeError, TypeError):
                pass

        approvals = []
        if record.get("approvals"):
            try:
                approvals_data = json.loads(record["approvals"])
                approvals = [
                    ApprovalDecision(
                        approver_id=a["approver_id"],
                        decision=a["decision"],
                        reason=a.get("reason"),
                        timestamp=datetime.fromisoformat(a["timestamp"]) if a.get("timestamp") else datetime.utcnow(),
                        metadata=a.get("metadata", {})
                    )
                    for a in approvals_data
                ]
            except (json.JSONDecodeError, TypeError, KeyError):
                pass

        rejections = []
        if record.get("rejections"):
            try:
                rejections_data = json.loads(record["rejections"])
                rejections = [
                    ApprovalDecision(
                        approver_id=r["approver_id"],
                        decision=r["decision"],
                        reason=r.get("reason"),
                        timestamp=datetime.fromisoformat(r["timestamp"]) if r.get("timestamp") else datetime.utcnow(),
                        metadata=r.get("metadata", {})
                    )
                    for r in rejections_data
                ]
            except (json.JSONDecodeError, TypeError, KeyError):
                pass

        # Parse timestamps
        created_at = datetime.utcnow()
        if record.get("created_at"):
            try:
                created_at = datetime.fromisoformat(record["created_at"].replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                pass

        expires_at = None
        if record.get("expires_at"):
            try:
                expires_at = datetime.fromisoformat(record["expires_at"].replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                pass

        return ApprovalRequest(
            id=record["id"],
            external_agent_id=record["external_agent_id"],
            organization_id=record["organization_id"],
            requested_by_user_id=record["requested_by_user_id"],
            requested_by_team_id=record.get("requested_by_team_id") or None,
            trigger_reason=record.get("trigger_reason", ""),
            invocation_context=invocation_context,
            payload_summary=record.get("payload_summary", ""),
            estimated_cost=record.get("estimated_cost"),
            estimated_tokens=record.get("estimated_tokens"),
            status=ApprovalStatus(record.get("status", "pending")),
            created_at=created_at,
            expires_at=expires_at,
            required_approvals=record.get("required_approvals", 1),
            approvals=approvals,
            rejections=rejections,
        )


__all__ = [
    # Budget stores
    "BudgetStore",
    "InMemoryBudgetStore",
    "DataFlowBudgetStore",
    # Approval stores
    "ApprovalStore",
    "InMemoryApprovalStore",
    "DataFlowApprovalStore",
]
