"""
Billing Service

Usage tracking, quota management, and billing operations using DataFlow nodes.
"""

import json
import uuid
from datetime import UTC, datetime, timedelta

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

# Pricing configuration
PRICING = {
    "agent_execution": {"unit": "count", "price": 0.01},
    "token": {"unit": "1000 tokens", "price": 0.002},
    "storage": {"unit": "GB", "price": 0.10},
    "api_call": {"unit": "count", "price": 0.001},
}

# Default quotas by plan tier
PLAN_QUOTAS = {
    "free": {
        "agent_execution": 1000,
        "token": 100000,
        "storage": 1,
        "api_call": 10000,
    },
    "pro": {
        "agent_execution": 10000,
        "token": 1000000,
        "storage": 10,
        "api_call": 100000,
    },
    "enterprise": {
        "agent_execution": -1,  # Unlimited
        "token": -1,
        "storage": -1,
        "api_call": -1,
    },
}


class BillingService:
    """
    Billing service for usage tracking and quota management.

    Uses DataFlow nodes for all database operations.
    """

    def __init__(self):
        """Initialize the billing service."""
        self.runtime = AsyncLocalRuntime()

    async def record_usage(
        self,
        org_id: str,
        resource_type: str,
        quantity: float,
        metadata: dict | None = None,
    ) -> dict:
        """
        Record usage for an organization.

        Args:
            org_id: Organization ID
            resource_type: Type of resource (agent_execution, token, storage, api_call)
            quantity: Usage quantity
            metadata: Optional metadata dict

        Returns:
            Created usage record
        """
        now = datetime.now(UTC).isoformat()
        record_id = str(uuid.uuid4())

        # Get pricing for resource type
        pricing = PRICING.get(resource_type, {"unit": "count", "price": 0})
        unit_cost = pricing["price"]
        total_cost = quantity * unit_cost

        workflow = WorkflowBuilder()
        workflow.add_node(
            "UsageRecordCreateNode",
            "create",
            {
                "id": record_id,
                "organization_id": org_id,
                "resource_type": resource_type,
                "quantity": quantity,
                "unit": pricing["unit"],
                "unit_cost": unit_cost,
                "total_cost": total_cost,
                "metadata": json.dumps(metadata) if metadata else None,
                "recorded_at": now,
                "created_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Update current quota usage
        await self._update_quota_usage(org_id, resource_type, quantity)

        return results.get("create", {})

    async def get_usage_summary(
        self,
        org_id: str,
        start_date: str,
        end_date: str,
    ) -> dict:
        """
        Get usage summary for an organization within a date range.

        Args:
            org_id: Organization ID
            start_date: Start date (ISO 8601)
            end_date: End date (ISO 8601)

        Returns:
            Usage summary with totals by resource type
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UsageRecordListNode",
            "list",
            {
                "filter": {
                    "organization_id": org_id,
                    "recorded_at": {"$gte": start_date, "$lte": end_date},
                },
                "limit": 10000,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        records = results.get("list", {}).get("records", [])

        # Aggregate by resource type
        summary = {}
        total_cost = 0.0

        for record in records:
            resource_type = record["resource_type"]
            if resource_type not in summary:
                summary[resource_type] = {
                    "quantity": 0,
                    "cost": 0,
                    "unit": record["unit"],
                }
            summary[resource_type]["quantity"] += record["quantity"]
            summary[resource_type]["cost"] += record["total_cost"]
            total_cost += record["total_cost"]

        return {
            "organization_id": org_id,
            "start_date": start_date,
            "end_date": end_date,
            "by_resource": summary,
            "total_cost": total_cost,
            "record_count": len(records),
        }

    async def get_usage_details(
        self,
        org_id: str,
        resource_type: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict:
        """
        Get detailed usage records for an organization.

        Args:
            org_id: Organization ID
            resource_type: Optional filter by resource type
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        filters = {"organization_id": org_id}
        if resource_type:
            filters["resource_type"] = resource_type

        workflow = WorkflowBuilder()
        workflow.add_node(
            "UsageRecordListNode",
            "list",
            {
                "filter": filters,
                "limit": limit,
                "offset": offset,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        return {
            "records": list_result.get("records", []),
            "total": list_result.get("count", list_result.get("total", 0)),
        }

    async def get_current_period(self, org_id: str) -> dict | None:
        """
        Get the current active billing period for an organization.

        Args:
            org_id: Organization ID

        Returns:
            Current billing period if exists
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "BillingPeriodListNode",
            "list",
            {
                "filter": {
                    "organization_id": org_id,
                    "status": "active",
                },
                "limit": 1,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        records = results.get("list", {}).get("records", [])
        if records:
            return records[0]

        # Create a new billing period if none exists
        return await self._create_billing_period(org_id)

    async def _create_billing_period(self, org_id: str) -> dict:
        """
        Create a new billing period for an organization.

        Args:
            org_id: Organization ID

        Returns:
            Created billing period
        """
        now = datetime.now(UTC)
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # End of month
        if start_date.month == 12:
            end_date = start_date.replace(
                year=start_date.year + 1, month=1
            ) - timedelta(seconds=1)
        else:
            end_date = start_date.replace(month=start_date.month + 1) - timedelta(
                seconds=1
            )

        period_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "BillingPeriodCreateNode",
            "create",
            {
                "id": period_id,
                "organization_id": org_id,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "status": "active",
                "total_usage": 0.0,
                "total_cost": 0.0,
                "invoice_id": None,
                "created_at": now.isoformat(),
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create", {})

    async def close_period(self, period_id: str) -> dict:
        """
        Close a billing period.

        Args:
            period_id: Billing period ID

        Returns:
            Updated billing period
        """
        # Get the period to get org_id and dates
        workflow = WorkflowBuilder()
        workflow.add_node(
            "BillingPeriodReadNode",
            "read",
            {
                "id": period_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        period = results.get("read")
        if not period:
            return {}

        # Get usage summary for the period
        summary = await self.get_usage_summary(
            period["organization_id"],
            period["start_date"],
            period["end_date"],
        )

        # Update period with totals
        workflow = WorkflowBuilder()
        workflow.add_node(
            "BillingPeriodUpdateNode",
            "update",
            {
                "filter": {"id": period_id},
                "fields": {
                    "status": "closed",
                    "total_usage": summary["record_count"],
                    "total_cost": summary["total_cost"],
                },
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Return updated period
        workflow = WorkflowBuilder()
        workflow.add_node(
            "BillingPeriodReadNode",
            "read",
            {
                "id": period_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("read", {})

    async def list_periods(
        self,
        org_id: str,
        limit: int = 12,
        offset: int = 0,
    ) -> dict:
        """
        List billing periods for an organization.

        Args:
            org_id: Organization ID
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with periods and total count
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "BillingPeriodListNode",
            "list",
            {
                "filter": {"organization_id": org_id},
                "limit": limit,
                "offset": offset,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        return {
            "records": list_result.get("records", []),
            "total": list_result.get("count", list_result.get("total", 0)),
        }

    async def check_quota(
        self,
        org_id: str,
        resource_type: str,
        quantity: float,
    ) -> bool:
        """
        Check if usage would exceed quota.

        Args:
            org_id: Organization ID
            resource_type: Resource type
            quantity: Requested quantity

        Returns:
            True if within quota, False if would exceed
        """
        quota = await self._get_quota(org_id, resource_type)
        if not quota:
            return True  # No quota means unlimited

        limit = quota["limit_value"]
        if limit == -1:
            return True  # Unlimited

        current = quota["current_usage"]
        return (current + quantity) <= limit

    async def get_quotas(self, org_id: str) -> list:
        """
        Get all quotas for an organization.

        Args:
            org_id: Organization ID

        Returns:
            List of quota records
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UsageQuotaListNode",
            "list",
            {
                "filter": {"organization_id": org_id},
                "limit": 100,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("list", {}).get("records", [])

    async def update_quota(
        self,
        org_id: str,
        resource_type: str,
        limit_value: float,
    ) -> dict:
        """
        Update quota limit for a resource type.

        Args:
            org_id: Organization ID
            resource_type: Resource type
            limit_value: New limit value (-1 for unlimited)

        Returns:
            Updated quota record
        """
        now = datetime.now(UTC).isoformat()

        # Check if quota exists
        quota = await self._get_quota(org_id, resource_type)

        if quota:
            # Update existing quota
            # NOTE: Do NOT set updated_at - DataFlow manages it automatically
            workflow = WorkflowBuilder()
            workflow.add_node(
                "UsageQuotaUpdateNode",
                "update",
                {
                    "filter": {"id": quota["id"]},
                    "fields": {
                        "limit_value": limit_value,
                    },
                },
            )

            await self.runtime.execute_workflow_async(workflow.build(), inputs={})

            return await self._get_quota(org_id, resource_type)
        else:
            # Create new quota
            return await self._create_quota(org_id, resource_type, limit_value)

    async def initialize_quotas(self, org_id: str, plan_tier: str) -> list:
        """
        Initialize quotas for an organization based on plan tier.

        Args:
            org_id: Organization ID
            plan_tier: Plan tier (free, pro, enterprise)

        Returns:
            List of created quota records
        """
        plan_quotas = PLAN_QUOTAS.get(plan_tier, PLAN_QUOTAS["free"])
        quotas = []

        for resource_type, limit_value in plan_quotas.items():
            quota = await self._create_quota(org_id, resource_type, limit_value)
            quotas.append(quota)

        return quotas

    async def _get_quota(
        self,
        org_id: str,
        resource_type: str,
    ) -> dict | None:
        """Get quota for a specific resource type."""
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UsageQuotaListNode",
            "list",
            {
                "filter": {
                    "organization_id": org_id,
                    "resource_type": resource_type,
                },
                "limit": 1,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        records = results.get("list", {}).get("records", [])
        return records[0] if records else None

    async def _create_quota(
        self,
        org_id: str,
        resource_type: str,
        limit_value: float,
    ) -> dict:
        """Create a new quota record."""
        now = datetime.now(UTC).isoformat()
        quota_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "UsageQuotaCreateNode",
            "create",
            {
                "id": quota_id,
                "organization_id": org_id,
                "resource_type": resource_type,
                "limit_value": limit_value,
                "current_usage": 0.0,
                "reset_period": "monthly",
                "last_reset_at": now,
                "created_at": now,
                "updated_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create", {})

    async def _update_quota_usage(
        self,
        org_id: str,
        resource_type: str,
        quantity: float,
    ):
        """Update current usage for a quota."""
        quota = await self._get_quota(org_id, resource_type)
        if not quota:
            return

        new_usage = quota["current_usage"] + quantity

        # NOTE: Do NOT set updated_at - DataFlow manages it automatically
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UsageQuotaUpdateNode",
            "update",
            {
                "filter": {"id": quota["id"]},
                "fields": {
                    "current_usage": new_usage,
                },
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    async def estimate_cost(
        self,
        resource_type: str,
        quantity: float,
    ) -> dict:
        """
        Estimate cost for usage.

        Args:
            resource_type: Resource type
            quantity: Quantity

        Returns:
            Cost estimate with breakdown
        """
        pricing = PRICING.get(resource_type, {"unit": "count", "price": 0})

        return {
            "resource_type": resource_type,
            "quantity": quantity,
            "unit": pricing["unit"],
            "unit_cost": pricing["price"],
            "total_cost": quantity * pricing["price"],
        }

    async def get_pricing(self) -> dict:
        """
        Get all pricing information.

        Returns:
            Pricing configuration
        """
        return PRICING
