"""
Organization Service

CRUD operations for organizations using DataFlow nodes.
"""

import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


class OrganizationService:
    """
    Organization service for managing organizations.

    Uses DataFlow nodes for all database operations.
    """

    def __init__(self):
        """Initialize the organization service."""
        self.runtime = AsyncLocalRuntime()

    async def create_organization(
        self,
        name: str,
        slug: str,
        plan_tier: str,
        created_by: str,
    ) -> dict:
        """
        Create a new organization.

        Args:
            name: Organization name
            slug: URL-friendly slug
            plan_tier: Plan tier (free, pro, enterprise)
            created_by: User ID of creator

        Returns:
            Created organization data
        """
        now = datetime.now(UTC).isoformat()
        org_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "OrganizationCreateNode",
            "create",
            {
                "id": org_id,
                "name": name,
                "slug": slug,
                "status": "active",
                "plan_tier": plan_tier,
                "created_by": created_by,
                "created_at": now,
                "updated_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create", {})

    async def get_organization(self, org_id: str) -> dict | None:
        """
        Get an organization by ID.

        Args:
            org_id: Organization ID

        Returns:
            Organization data if found, None otherwise
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "OrganizationReadNode",
            "read",
            {
                "id": org_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("read")

    async def update_organization(self, org_id: str, data: dict) -> dict | None:
        """
        Update an organization.

        Args:
            org_id: Organization ID
            data: Fields to update

        Returns:
            Updated organization data
        """
        # NOTE: Do NOT set updated_at - DataFlow manages it automatically

        workflow = WorkflowBuilder()
        workflow.add_node(
            "OrganizationUpdateNode",
            "update",
            {
                "filter": {"id": org_id},
                "fields": data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Fetch the updated record
        return await self.get_organization(org_id)

    async def delete_organization(self, org_id: str) -> bool:
        """
        Delete an organization (soft delete by setting status).

        Args:
            org_id: Organization ID

        Returns:
            True if deleted successfully
        """
        # NOTE: Do NOT set updated_at - DataFlow manages it automatically

        workflow = WorkflowBuilder()
        workflow.add_node(
            "OrganizationUpdateNode",
            "delete",
            {
                "filter": {"id": org_id},
                "fields": {"status": "deleted"},
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return True

    async def list_organizations(
        self,
        filters: dict | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        List organizations with optional filters.

        Args:
            filters: Optional filter conditions
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        workflow = WorkflowBuilder()

        list_params = {
            "limit": limit,
            "offset": offset,
        }
        if filters:
            list_params["filter"] = filters

        workflow.add_node("OrganizationListNode", "list", list_params)

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        return {
            "records": list_result.get("records", []),
            "total": list_result.get("count", list_result.get("total", 0)),
        }
