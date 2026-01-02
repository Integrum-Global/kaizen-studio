"""
Invitation Service

CRUD operations for invitations using DataFlow nodes.
"""

import secrets
import uuid
from datetime import UTC, datetime, timedelta

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


class InvitationService:
    """
    Invitation service for managing organization invitations.

    Uses DataFlow nodes for all database operations.
    """

    def __init__(self, runtime=None):
        """Initialize the invitation service."""
        self.runtime = runtime or AsyncLocalRuntime()

    async def create_invitation(
        self,
        organization_id: str,
        email: str,
        role: str,
        invited_by: str,
        expires_in_days: int = 7,
    ) -> dict:
        """
        Create a new invitation.

        Args:
            organization_id: Organization ID
            email: Invitee email
            role: Role to assign (org_admin, developer, viewer)
            invited_by: User ID of inviter
            expires_in_days: Days until invitation expires

        Returns:
            Created invitation data
        """
        now = datetime.now(UTC)
        invitation_id = str(uuid.uuid4())
        token = secrets.token_urlsafe(32)
        expires_at = (now + timedelta(days=expires_in_days)).isoformat()

        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvitationCreateNode",
            "create",
            {
                "id": invitation_id,
                "organization_id": organization_id,
                "email": email,
                "role": role,
                "invited_by": invited_by,
                "token": token,
                "status": "pending",
                "expires_at": expires_at,
                # Note: created_at is auto-managed by DataFlow
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Return the created invitation data
        return {
            "id": invitation_id,
            "organization_id": organization_id,
            "email": email,
            "role": role,
            "invited_by": invited_by,
            "token": token,
            "status": "pending",
            "expires_at": expires_at,
            "created_at": now.isoformat(),
        }

    async def get_invitation(self, invitation_id: str) -> dict | None:
        """
        Get an invitation by ID.

        Args:
            invitation_id: Invitation ID

        Returns:
            Invitation data if found, None otherwise
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvitationReadNode",
            "read",
            {
                "id": invitation_id,
            },
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            return results.get("read")
        except Exception:
            # ReadNode throws when record not found
            return None

    async def get_invitation_by_token(self, token: str) -> dict | None:
        """
        Get an invitation by token.

        Args:
            token: Invitation token

        Returns:
            Invitation data if found, None otherwise
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvitationListNode",
            "find",
            {
                "filter": {"token": token},
                "limit": 1,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        invitations = results.get("find", {}).get("records", [])
        return invitations[0] if invitations else None

    async def accept_invitation(self, token: str) -> dict | None:
        """
        Accept an invitation by token.

        Args:
            token: Invitation token

        Returns:
            Updated invitation data if successful, None otherwise
        """
        invitation = await self.get_invitation_by_token(token)
        if not invitation:
            return None

        # Check if expired
        expires_at = datetime.fromisoformat(
            invitation["expires_at"].replace("Z", "+00:00")
        )
        if datetime.now(UTC) > expires_at:
            # Mark as expired
            await self._update_invitation_status(invitation["id"], "expired")
            return None

        # Check if already used
        if invitation["status"] != "pending":
            return None

        # Mark as accepted
        await self._update_invitation_status(invitation["id"], "accepted")

        return {
            "id": invitation["id"],
            "organization_id": invitation["organization_id"],
            "email": invitation["email"],
            "role": invitation["role"],
            "status": "accepted",
        }

    async def _update_invitation_status(self, invitation_id: str, status: str) -> None:
        """Update an invitation's status."""
        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvitationUpdateNode",
            "update",
            {
                "filter": {"id": invitation_id},
                "fields": {"status": status},
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    async def cancel_invitation(self, invitation_id: str) -> bool:
        """
        Cancel an invitation.

        Args:
            invitation_id: Invitation ID

        Returns:
            True if cancelled successfully
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvitationDeleteNode",
            "delete",
            {
                "id": invitation_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return True

    async def list_invitations(
        self,
        organization_id: str,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        List invitations for an organization.

        Args:
            organization_id: Organization ID
            status: Optional status filter (pending, accepted, expired)
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        workflow = WorkflowBuilder()

        filters = {"organization_id": organization_id}
        if status:
            filters["status"] = status

        workflow.add_node(
            "InvitationListNode",
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

    async def cleanup_expired_invitations(self, organization_id: str) -> int:
        """
        Mark all expired invitations as expired.

        Args:
            organization_id: Organization ID

        Returns:
            Number of invitations marked as expired
        """
        now = datetime.now(UTC).isoformat()

        # Find pending invitations
        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvitationListNode",
            "find_expired",
            {
                "filter": {
                    "organization_id": organization_id,
                    "status": "pending",
                },
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        invitations = results.get("find_expired", {}).get("records", [])
        expired_count = 0

        for invitation in invitations:
            expires_at = datetime.fromisoformat(
                invitation["expires_at"].replace("Z", "+00:00")
            )
            if datetime.now(UTC) > expires_at:
                await self._update_invitation_status(invitation["id"], "expired")
                expired_count += 1

        return expired_count
