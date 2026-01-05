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
        workspace_type: str = "permanent",
        description: str = "",
    ) -> dict:
        """
        Create a new workspace.

        Args:
            name: Workspace name
            organization_id: Organization ID
            environment_type: Environment type (development, staging, production)
            workspace_type: Workspace type (permanent, temporary, personal)
            description: Optional description

        Returns:
            Created workspace data
        """
        workspace_id = str(uuid.uuid4())

        # NOTE: Do NOT set created_at or updated_at manually - DataFlow manages them
        # For nullable string fields, use empty string "" instead of None
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WorkspaceCreateNode",
            "create",
            {
                "id": workspace_id,
                "organization_id": organization_id,
                "name": name,
                "workspace_type": workspace_type,
                "environment_type": environment_type,
                "description": description,
                "is_archived": False,
                "archived_at": "",  # Empty string for nullable timestamp
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
        try:
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
        except Exception:
            # Record not found or other database error
            return None

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

    # ==========================================================================
    # Workspace Member Methods
    # ==========================================================================

    async def add_member(
        self,
        workspace_id: str,
        user_id: str,
        role: str = "member",
        invited_by: str | None = None,
        constraints: str | None = None,
        department: str | None = None,
    ) -> dict:
        """
        Add a member to a workspace.

        Args:
            workspace_id: Workspace ID
            user_id: User ID to add
            role: Member role (owner, admin, member, viewer)
            invited_by: ID of user who invited
            constraints: Optional EATP constraints (JSON string)
            department: Optional department for cross-org visibility

        Returns:
            Created workspace member data
        """
        member_id = str(uuid.uuid4())

        # NOTE: Do NOT set created_at/updated_at - DataFlow manages them automatically
        # For nullable string fields, use empty string "" instead of None
        member_data = {
            "id": member_id,
            "workspace_id": workspace_id,
            "user_id": user_id,
            "role": role,
            "constraints": constraints or "",  # Empty string for nullable
            "invited_by": invited_by or "",
            "department": department or "",
        }

        workflow = WorkflowBuilder()
        workflow.add_node("WorkspaceMemberCreateNode", "create_member", member_data)

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        result = results.get("create_member", {})
        # Check if operation succeeded
        if isinstance(result, dict) and result.get("success") is False:
            raise RuntimeError(f"Failed to create member: {result.get('error')}")

        # DataFlow returns the record directly, not nested under "record"
        return result if "id" in result else member_data

    async def update_member(
        self,
        workspace_id: str,
        user_id: str,
        role: str | None = None,
        constraints: str | None = None,
        department: str | None = None,
    ) -> dict | None:
        """
        Update a workspace member's role or constraints.

        Args:
            workspace_id: Workspace ID
            user_id: User ID to update
            role: New role (optional)
            constraints: New constraints (optional)
            department: New department (optional)

        Returns:
            Updated member data
        """
        fields = {}
        if role is not None:
            fields["role"] = role
        if constraints is not None:
            fields["constraints"] = constraints
        if department is not None:
            fields["department"] = department

        if not fields:
            return await self.get_member(workspace_id, user_id)

        # First get the member to retrieve its ID (DataFlow requires 'id' in filter)
        member = await self.get_member(workspace_id, user_id)
        if not member:
            return None

        workflow = WorkflowBuilder()
        workflow.add_node(
            "WorkspaceMemberUpdateNode",
            "update_member",
            {
                "filter": {"id": member["id"]},  # DataFlow requires 'id' in filter
                "fields": fields,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})
        return await self.get_member(workspace_id, user_id)

    async def remove_member(self, workspace_id: str, user_id: str) -> bool:
        """
        Remove a member from a workspace.

        Args:
            workspace_id: Workspace ID
            user_id: User ID to remove

        Returns:
            True if removed successfully
        """
        # First find the member record
        member = await self.get_member(workspace_id, user_id)
        if not member:
            return False

        workflow = WorkflowBuilder()
        workflow.add_node(
            "WorkspaceMemberDeleteNode",
            "delete_member",
            {"id": member["id"]},
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})
        return True

    async def get_member(self, workspace_id: str, user_id: str) -> dict | None:
        """
        Get a specific workspace member.

        Args:
            workspace_id: Workspace ID
            user_id: User ID

        Returns:
            Member data if found, None otherwise
        """
        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "WorkspaceMemberListNode",
                "find_member",
                {
                    "filter": {"workspace_id": workspace_id, "user_id": user_id},
                    "limit": 1,
                    "enable_cache": False,  # Disable cache for this query
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            result_data = results.get("find_member", {})
            records = result_data.get("records", [])
            return records[0] if records else None
        except Exception:
            # Table might not exist yet
            return None

    async def get_members(
        self,
        workspace_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        Get all members of a workspace.

        Args:
            workspace_id: Workspace ID
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "WorkspaceMemberListNode",
                "list_members",
                {
                    "filter": {"workspace_id": workspace_id},
                    "limit": limit,
                    "offset": offset,
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            list_result = results.get("list_members", {})
            return {
                "records": list_result.get("records", []),
                "total": list_result.get("count", list_result.get("total", 0)),
            }
        except Exception:
            # Table might not exist yet
            return {"records": [], "total": 0}

    # ==========================================================================
    # Workspace Work Unit Methods
    # ==========================================================================

    async def add_work_unit(
        self,
        workspace_id: str,
        work_unit_id: str,
        work_unit_type: str,
        added_by: str,
        delegation_id: str | None = None,
        constraints: str | None = None,
        department: str | None = None,
    ) -> dict:
        """
        Add a work unit to a workspace.

        Args:
            workspace_id: Workspace ID
            work_unit_id: Work unit ID (agent or pipeline)
            work_unit_type: Type (atomic or composite)
            added_by: ID of user adding the work unit
            delegation_id: Optional EATP delegation reference
            constraints: Optional access constraints (JSON string)
            department: Optional department for cross-org visibility

        Returns:
            Created workspace work unit data
        """
        wwu_id = str(uuid.uuid4())

        # NOTE: Do NOT set created_at/updated_at - DataFlow manages them automatically
        # For nullable string fields, use empty string "" instead of None
        wwu_data = {
            "id": wwu_id,
            "workspace_id": workspace_id,
            "work_unit_id": work_unit_id,
            "work_unit_type": work_unit_type,
            "delegation_id": delegation_id or "",
            "constraints": constraints or "",
            "added_by": added_by,
            "department": department or "",
        }

        workflow = WorkflowBuilder()
        workflow.add_node("WorkspaceWorkUnitCreateNode", "create_wwu", wwu_data)

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        result = results.get("create_wwu", {})
        # Check if operation succeeded
        if isinstance(result, dict) and result.get("success") is False:
            raise RuntimeError(f"Failed to create work unit: {result.get('error')}")

        # DataFlow returns the record directly
        return result if "id" in result else wwu_data

    async def remove_work_unit(self, workspace_id: str, work_unit_id: str) -> bool:
        """
        Remove a work unit from a workspace.

        Args:
            workspace_id: Workspace ID
            work_unit_id: Work unit ID to remove

        Returns:
            True if removed successfully
        """
        # First find the workspace work unit record
        wwu = await self.get_work_unit(workspace_id, work_unit_id)
        if not wwu:
            return False

        workflow = WorkflowBuilder()
        workflow.add_node(
            "WorkspaceWorkUnitDeleteNode",
            "delete_wwu",
            {"id": wwu["id"]},
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})
        return True

    async def get_work_unit(
        self, workspace_id: str, work_unit_id: str
    ) -> dict | None:
        """
        Get a specific work unit from a workspace.

        Args:
            workspace_id: Workspace ID
            work_unit_id: Work unit ID

        Returns:
            Work unit data if found, None otherwise
        """
        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "WorkspaceWorkUnitListNode",
                "list_wwu",
                {
                    "filter": {"workspace_id": workspace_id, "work_unit_id": work_unit_id},
                    "limit": 1,
                    "enable_cache": False,  # Disable cache for this query
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            records = results.get("list_wwu", {}).get("records", [])
            return records[0] if records else None
        except Exception:
            # Table might not exist yet
            return None

    async def get_work_units(
        self,
        workspace_id: str,
        work_unit_type: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        Get all work units in a workspace.

        Args:
            workspace_id: Workspace ID
            work_unit_type: Optional filter by type (atomic or composite)
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        try:
            filter_data = {"workspace_id": workspace_id}
            if work_unit_type:
                filter_data["work_unit_type"] = work_unit_type

            workflow = WorkflowBuilder()
            workflow.add_node(
                "WorkspaceWorkUnitListNode",
                "list_wwu",
                {
                    "filter": filter_data,
                    "limit": limit,
                    "offset": offset,
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            list_result = results.get("list_wwu", {})
            return {
                "records": list_result.get("records", []),
                "total": list_result.get("count", list_result.get("total", 0)),
            }
        except Exception:
            # Table might not exist yet
            return {"records": [], "total": 0}
