"""
Audit Service

Business logic for audit logging operations.
"""

import json
import uuid
from datetime import UTC, datetime

from dateutil.parser import isoparse
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


def _parse_datetime(value: str) -> datetime:
    """Parse ISO 8601 datetime string to datetime object.

    Handles URL-encoded dates where '+' may become ' ' (space).
    Returns timezone-naive datetime for compatibility with database columns.
    """
    if isinstance(value, datetime):
        dt = value
    else:
        # Handle URL decoding issue where '+' becomes ' '
        # e.g., "2025-12-09T10:36:08.886354 00:00" should be "2025-12-09T10:36:08.886354+00:00"
        if " " in value and "+" not in value:
            value = value.replace(" ", "+")
        dt = isoparse(value)

    # Convert to naive datetime (strip timezone) for database compatibility
    # The database stores naive datetimes, so we need to match
    if dt.tzinfo is not None:
        # Convert to UTC and strip timezone

        dt = dt.astimezone(UTC).replace(tzinfo=None)
    return dt


class AuditService:
    """
    Service for managing audit logs.

    Provides methods for logging events and querying audit history.
    """

    def __init__(self):
        self.runtime = AsyncLocalRuntime()

    async def log(
        self,
        organization_id: str,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str = None,
        details: dict = None,
        ip_address: str = None,
        user_agent: str = None,
        status: str = "success",
        error_message: str = None,
    ) -> dict:
        """
        Create an audit log entry.

        Args:
            organization_id: Organization context
            user_id: User who performed the action
            action: Action type (create, read, update, delete, deploy, login, logout)
            resource_type: Type of resource affected
            resource_id: ID of the resource (optional)
            details: Additional details as dict (will be JSON serialized)
            ip_address: Client IP address
            user_agent: Client user agent
            status: Outcome (success, failure)
            error_message: Error message if status is failure

        Returns:
            Created audit log entry
        """
        audit_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        workflow = WorkflowBuilder()
        workflow.add_node(
            "AuditLogCreateNode",
            "create",
            {
                "id": audit_id,
                "organization_id": organization_id,
                "user_id": user_id,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "details": json.dumps(details) if details else None,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "status": status,
                "error_message": error_message,
                "created_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        return results.get("create", {})

    async def list(
        self,
        organization_id: str,
        user_id: str = None,
        action: str = None,
        resource_type: str = None,
        resource_id: str = None,
        start_date: str = None,
        end_date: str = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list:
        """
        List audit logs with filters.

        Args:
            organization_id: Filter by organization
            user_id: Filter by user
            action: Filter by action type
            resource_type: Filter by resource type
            resource_id: Filter by resource ID
            start_date: Filter by start date (ISO 8601)
            end_date: Filter by end date (ISO 8601)
            limit: Maximum number of results
            offset: Offset for pagination

        Returns:
            List of audit log entries
        """
        # Build filter
        filters = {"organization_id": organization_id}

        if user_id:
            filters["user_id"] = user_id
        if action:
            filters["action"] = action
        if resource_type:
            filters["resource_type"] = resource_type
        if resource_id:
            filters["resource_id"] = resource_id
        if start_date:
            filters["created_at"] = {"$gte": _parse_datetime(start_date)}
        if end_date:
            if "created_at" in filters:
                filters["created_at"]["$lte"] = _parse_datetime(end_date)
            else:
                filters["created_at"] = {"$lte": _parse_datetime(end_date)}

        workflow = WorkflowBuilder()
        workflow.add_node(
            "AuditLogListNode",
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
        return results.get("list", {}).get("records", [])

    async def get(self, id: str) -> dict | None:
        """
        Get a specific audit log entry.

        Args:
            id: Audit log ID

        Returns:
            Audit log entry or None
        """
        workflow = WorkflowBuilder()
        workflow.add_node("AuditLogReadNode", "read", {"id": id})

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            return results.get("read")
        except Exception:
            # ReadNode throws when record not found
            return None

    async def get_user_activity(self, user_id: str, limit: int = 50) -> list:
        """
        Get activity history for a specific user.

        Args:
            user_id: User ID
            limit: Maximum number of results

        Returns:
            List of audit log entries for the user
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AuditLogListNode",
            "list",
            {
                "filter": {"user_id": user_id},
                "limit": limit,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        return results.get("list", {}).get("records", [])

    async def get_resource_history(self, resource_type: str, resource_id: str) -> list:
        """
        Get audit history for a specific resource.

        Args:
            resource_type: Type of resource
            resource_id: Resource ID

        Returns:
            List of audit log entries for the resource
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AuditLogListNode",
            "list",
            {
                "filter": {
                    "resource_type": resource_type,
                    "resource_id": resource_id,
                },
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        return results.get("list", {}).get("records", [])

    async def count(
        self,
        organization_id: str,
        user_id: str = None,
        action: str = None,
        resource_type: str = None,
    ) -> int:
        """
        Count audit logs with filters.

        Args:
            organization_id: Filter by organization
            user_id: Filter by user
            action: Filter by action type
            resource_type: Filter by resource type

        Returns:
            Count of matching audit logs
        """
        filters = {"organization_id": organization_id}

        if user_id:
            filters["user_id"] = user_id
        if action:
            filters["action"] = action
        if resource_type:
            filters["resource_type"] = resource_type

        workflow = WorkflowBuilder()
        workflow.add_node("AuditLogCountNode", "count", {"filter": filters})

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        return results.get("count", {}).get("count", 0)
