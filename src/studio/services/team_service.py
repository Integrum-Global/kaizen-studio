"""
Team Service

CRUD operations for teams and team memberships using DataFlow nodes.
"""

import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


class TeamService:
    """
    Team service for managing teams and memberships.

    Uses DataFlow nodes for all database operations.
    """

    def __init__(self, runtime=None):
        """Initialize the team service."""
        self.runtime = runtime or AsyncLocalRuntime()

    async def create_team(
        self,
        name: str,
        organization_id: str,
        description: str | None = None,
    ) -> dict:
        """
        Create a new team.

        Args:
            name: Team name
            organization_id: Organization ID
            description: Optional description

        Returns:
            Created team data
        """
        now = datetime.now(UTC).isoformat()
        team_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "TeamCreateNode",
            "create",
            {
                "id": team_id,
                "organization_id": organization_id,
                "name": name,
                "description": description or "",  # Kailash requires string, not None
                # Note: created_at and updated_at are auto-managed by DataFlow
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Return the created team data
        return {
            "id": team_id,
            "organization_id": organization_id,
            "name": name,
            "description": description or "",
            "created_at": now,
            "updated_at": now,
        }

    async def get_team(self, team_id: str) -> dict | None:
        """
        Get a team by ID.

        Args:
            team_id: Team ID

        Returns:
            Team data if found, None otherwise
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "TeamReadNode",
            "read",
            {
                "id": team_id,
            },
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            return results.get("read")
        except Exception as e:
            # TeamReadNode throws exception when record not found
            if "not found" in str(e).lower():
                return None
            raise

    async def get_team_with_members(self, team_id: str) -> dict | None:
        """
        Get a team with its members.

        Args:
            team_id: Team ID

        Returns:
            Team data with members list, None if team not found
        """
        team = await self.get_team(team_id)
        if not team:
            return None

        # Get team members
        workflow = WorkflowBuilder()
        workflow.add_node(
            "TeamMembershipListNode",
            "members",
            {
                "filter": {"team_id": team_id},
                "enable_cache": False,  # Bypass cache to avoid stale data
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        memberships = results.get("members", {}).get("records", [])
        team["members"] = memberships

        return team

    async def update_team(self, team_id: str, data: dict) -> dict | None:
        """
        Update a team.

        Args:
            team_id: Team ID
            data: Fields to update

        Returns:
            Updated team data
        """
        now = datetime.now(UTC).isoformat()

        workflow = WorkflowBuilder()
        workflow.add_node(
            "TeamUpdateNode",
            "update",
            {
                "filter": {"id": team_id},
                "fields": data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return await self.get_team(team_id)

    async def delete_team(self, team_id: str) -> bool:
        """
        Delete a team and all its memberships.

        Args:
            team_id: Team ID

        Returns:
            True if deleted successfully
        """
        # Delete all memberships first
        workflow = WorkflowBuilder()
        workflow.add_node(
            "TeamMembershipListNode",
            "find_members",
            {
                "filter": {"team_id": team_id},
                "enable_cache": False,  # Bypass cache to avoid stale data
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        memberships = results.get("find_members", {}).get("records", [])

        # Delete each membership
        for membership in memberships:
            delete_workflow = WorkflowBuilder()
            delete_workflow.add_node(
                "TeamMembershipDeleteNode",
                "delete_member",
                {
                    "id": membership["id"],
                },
            )
            await self.runtime.execute_workflow_async(
                delete_workflow.build(), inputs={}
            )

        # Delete the team
        delete_team_workflow = WorkflowBuilder()
        delete_team_workflow.add_node(
            "TeamDeleteNode",
            "delete",
            {
                "id": team_id,
            },
        )

        await self.runtime.execute_workflow_async(
            delete_team_workflow.build(), inputs={}
        )

        return True

    async def list_teams(
        self,
        organization_id: str,
        filters: dict | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        List teams in an organization.

        Args:
            organization_id: Organization ID
            filters: Optional additional filter conditions
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        workflow = WorkflowBuilder()

        combined_filters = {"organization_id": organization_id}
        if filters:
            combined_filters.update(filters)

        workflow.add_node(
            "TeamListNode",
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

    async def add_member(
        self,
        team_id: str,
        user_id: str,
        role: str = "member",
    ) -> dict:
        """
        Add a member to a team.

        Args:
            team_id: Team ID
            user_id: User ID to add
            role: Role in team (team_lead, member)

        Returns:
            Created membership data
        """
        now = datetime.now(UTC).isoformat()
        membership_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "TeamMembershipCreateNode",
            "create",
            {
                "id": membership_id,
                "team_id": team_id,
                "user_id": user_id,
                "role": role,
                # Note: created_at is auto-managed by DataFlow
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Return the created membership data
        return {
            "id": membership_id,
            "team_id": team_id,
            "user_id": user_id,
            "role": role,
            "created_at": now,
        }

    async def remove_member(self, team_id: str, user_id: str) -> bool:
        """
        Remove a member from a team.

        Args:
            team_id: Team ID
            user_id: User ID to remove

        Returns:
            True if removed successfully
        """
        # Find the membership
        workflow = WorkflowBuilder()
        workflow.add_node(
            "TeamMembershipListNode",
            "find",
            {
                "filter": {"team_id": team_id, "user_id": user_id},
                "limit": 1,
                "enable_cache": False,  # Bypass cache to avoid stale data
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        memberships = results.get("find", {}).get("records", [])
        if not memberships:
            return False

        # Delete the membership
        delete_workflow = WorkflowBuilder()
        delete_workflow.add_node(
            "TeamMembershipDeleteNode",
            "delete",
            {
                "id": memberships[0]["id"],
            },
        )

        await self.runtime.execute_workflow_async(delete_workflow.build(), inputs={})

        return True

    async def update_member_role(
        self,
        team_id: str,
        user_id: str,
        role: str,
    ) -> dict | None:
        """
        Update a member's role in a team.

        Args:
            team_id: Team ID
            user_id: User ID
            role: New role

        Returns:
            Updated membership data
        """
        # Find the membership
        workflow = WorkflowBuilder()
        workflow.add_node(
            "TeamMembershipListNode",
            "find",
            {
                "filter": {"team_id": team_id, "user_id": user_id},
                "limit": 1,
                "enable_cache": False,  # Bypass cache to avoid stale data
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        memberships = results.get("find", {}).get("records", [])
        if not memberships:
            return None

        # Update the role
        update_workflow = WorkflowBuilder()
        update_workflow.add_node(
            "TeamMembershipUpdateNode",
            "update",
            {
                "filter": {"id": memberships[0]["id"]},
                "fields": {"role": role},
            },
        )

        await self.runtime.execute_workflow_async(update_workflow.build(), inputs={})

        # Return updated membership
        read_workflow = WorkflowBuilder()
        read_workflow.add_node(
            "TeamMembershipReadNode",
            "read",
            {
                "id": memberships[0]["id"],
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            read_workflow.build(), inputs={}
        )

        return results.get("read")
