"""
Workspace Service

CRUD operations for workspaces using DataFlow nodes.
"""

import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


class WorkspaceService:
    """
    Workspace service for managing workspaces.

    Uses DataFlow nodes for all database operations.
    """

    def __init__(self):
        """Initialize the workspace service."""
        self.runtime = AsyncLocalRuntime()

    async def create_workspace(
        self,
        name: str,
        organization_id: str,
        environment_type: str,
        description: str = "",
    ) -> dict:
        """
        Create a new workspace.

        Args:
            name: Workspace name
            organization_id: Organization ID
            environment_type: Environment type (development, staging, production)
            description: Optional description

        Returns:
            Created workspace data
        """
        now = datetime.now(UTC).isoformat()
        workspace_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "WorkspaceCreateNode",
            "create",
            {
                "id": workspace_id,
                "organization_id": organization_id,
                "name": name,
                "environment_type": environment_type,
                "description": description,
                "created_at": now,
                "updated_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create", {})

    async def get_workspace(self, workspace_id: str) -> dict | None:
        """
        Get a workspace by ID.

        Args:
            workspace_id: Workspace ID

        Returns:
            Workspace data if found, None otherwise
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WorkspaceReadNode",
            "read",
            {
                "id": workspace_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("read")

    async def update_workspace(self, workspace_id: str, data: dict) -> dict | None:
        """
        Update a workspace.

        Args:
            workspace_id: Workspace ID
            data: Fields to update

        Returns:
            Updated workspace data
        """
        # NOTE: Do NOT set updated_at - DataFlow manages it automatically

        workflow = WorkflowBuilder()
        workflow.add_node(
            "WorkspaceUpdateNode",
            "update",
            {
                "filter": {"id": workspace_id},
                "fields": data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return await self.get_workspace(workspace_id)

    async def delete_workspace(self, workspace_id: str) -> bool:
        """
        Delete a workspace.

        Args:
            workspace_id: Workspace ID

        Returns:
            True if deleted successfully
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WorkspaceDeleteNode",
            "delete",
            {
                "id": workspace_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return True

    async def list_workspaces(
        self,
        organization_id: str,
        filters: dict | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        List workspaces in an organization with optional filters.

        Args:
            organization_id: Organization ID
            filters: Optional additional filter conditions
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        workflow = WorkflowBuilder()

        # Combine organization filter with additional filters
        combined_filters = {"organization_id": organization_id}
        if filters:
            combined_filters.update(filters)

        workflow.add_node(
            "WorkspaceListNode",
            "list",
            {
                "filter": combined_filters,
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
