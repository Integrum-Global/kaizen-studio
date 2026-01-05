"""
Activity Service

Aggregates activity events from runs, audit logs, and other sources.
"""

from datetime import UTC, datetime, timedelta

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


class ActivityService:
    """
    Activity service for aggregating activity events.

    Combines data from multiple sources to provide a unified
    activity feed for teams and users.
    """

    def __init__(self, runtime=None):
        """Initialize the activity service."""
        self.runtime = runtime or AsyncLocalRuntime()

    def _parse_iso_date(self, date_str: str) -> datetime:
        """
        Parse ISO 8601 date string to timezone-aware datetime object.

        Args:
            date_str: ISO 8601 formatted date string

        Returns:
            Parsed datetime object (always timezone-aware in UTC)
        """
        if not date_str:
            raise ValueError("Date string cannot be empty")

        normalized = date_str
        if normalized.endswith("Z"):
            normalized = normalized[:-1] + "+00:00"

        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        return parsed

    async def get_team_activity(
        self,
        organization_id: str,
        limit: int = 10,
    ) -> list:
        """
        Get team activity events for an organization.

        Aggregates recent runs, delegations, errors, and completions
        across all users in the organization.

        Args:
            organization_id: Organization ID
            limit: Maximum events to return

        Returns:
            List of activity events
        """
        events = []
        runs = []

        # Get recent runs from RunListNode
        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "RunListNode",
                "list_runs",
                {
                    "filter": {"organization_id": organization_id},
                    "limit": limit * 2,  # Get more to filter and sort
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            runs = results.get("list_runs", {}).get("records", [])
        except Exception:
            # Table might not exist yet - return empty list
            runs = []

        # Transform runs into activity events
        for run in runs:
            event_type = self._determine_event_type(run)
            event = {
                "id": f"activity-{run['id']}",
                "type": event_type,
                "userId": run.get("user_id", ""),
                "userName": run.get("user_name", "Unknown User"),
                "workUnitId": run.get("work_unit_id", ""),
                "workUnitName": run.get("work_unit_name", "Unknown Work Unit"),
                "timestamp": run.get("started_at", run.get("created_at", "")),
                "details": self._build_event_details(run, event_type),
            }
            events.append(event)

        # Get trust delegations if available
        try:
            delegation_events = await self._get_delegation_events(
                organization_id, limit
            )
            events.extend(delegation_events)
        except Exception:
            # Trust delegation table might not exist yet
            pass

        # Sort by timestamp (newest first) and limit
        events.sort(key=lambda e: e.get("timestamp", ""), reverse=True)
        return events[:limit]

    async def get_my_activity(
        self,
        organization_id: str,
        user_id: str,
        limit: int = 10,
    ) -> list:
        """
        Get activity events for a specific user.

        Args:
            organization_id: Organization ID
            user_id: User ID
            limit: Maximum events to return

        Returns:
            List of activity events for the user
        """
        events = []
        runs = []

        # Get user's runs
        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "RunListNode",
                "list_runs",
                {
                    "filter": {
                        "organization_id": organization_id,
                        "user_id": user_id,
                    },
                    "limit": limit * 2,
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            runs = results.get("list_runs", {}).get("records", [])
        except Exception:
            # Table might not exist yet - return empty list
            runs = []

        for run in runs:
            event_type = self._determine_event_type(run)
            event = {
                "id": f"activity-{run['id']}",
                "type": event_type,
                "userId": run.get("user_id", ""),
                "userName": run.get("user_name", "You"),
                "workUnitId": run.get("work_unit_id", ""),
                "workUnitName": run.get("work_unit_name", "Unknown Work Unit"),
                "timestamp": run.get("started_at", run.get("created_at", "")),
                "details": self._build_event_details(run, event_type),
            }
            events.append(event)

        # Sort by timestamp (newest first) and limit
        events.sort(key=lambda e: e.get("timestamp", ""), reverse=True)
        return events[:limit]

    def _determine_event_type(self, run: dict) -> str:
        """Determine the activity event type from a run record."""
        status = run.get("status", "")

        if status == "failed":
            return "error"
        elif status == "completed":
            return "completion"
        elif status == "running":
            return "run"
        elif status == "pending":
            return "run"
        else:
            return "run"

    def _build_event_details(self, run: dict, event_type: str) -> dict:
        """Build details object for an activity event."""
        details = {"runId": run.get("id", "")}

        if event_type == "error":
            details["errorMessage"] = run.get("error", "Unknown error")

        return details

    async def _get_delegation_events(
        self,
        organization_id: str,
        limit: int,
    ) -> list:
        """
        Get trust delegation events.

        Args:
            organization_id: Organization ID
            limit: Maximum events to return

        Returns:
            List of delegation events
        """
        events = []

        # Try to get trust delegations
        workflow = WorkflowBuilder()
        workflow.add_node(
            "TrustDelegationListNode",
            "list_delegations",
            {
                "filter": {"organization_id": organization_id},
                "limit": limit,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        delegations = results.get("list_delegations", {}).get("records", [])

        for delegation in delegations:
            event = {
                "id": f"delegation-{delegation.get('id', '')}",
                "type": "delegation",
                "userId": delegation.get("delegator_id", ""),
                "userName": delegation.get("delegator_name", "Unknown"),
                "workUnitId": delegation.get("work_unit_id", ""),
                "workUnitName": delegation.get("work_unit_name", "Unknown"),
                "timestamp": delegation.get("created_at", ""),
                "details": {
                    "delegateeId": delegation.get("delegatee_id", ""),
                    "delegateeName": delegation.get("delegatee_name", ""),
                },
            }
            events.append(event)

        return events

    async def get_activity_summary(
        self,
        organization_id: str,
        hours: int = 24,
    ) -> dict:
        """
        Get activity summary for the specified time period.

        Args:
            organization_id: Organization ID
            hours: Number of hours to look back

        Returns:
            Summary with counts by event type
        """
        cutoff = datetime.now(UTC) - timedelta(hours=hours)
        cutoff_str = cutoff.isoformat()
        runs = []

        # Get runs in time period
        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "RunListNode",
                "list_runs",
                {
                    "filter": {"organization_id": organization_id},
                    "limit": 10000,  # Get all for aggregation
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            runs = results.get("list_runs", {}).get("records", [])
        except Exception:
            # Table might not exist yet - return empty summary
            runs = []

        # Filter by time
        recent_runs = []
        for run in runs:
            try:
                run_time = self._parse_iso_date(
                    run.get("started_at", run.get("created_at", ""))
                )
                if run_time >= cutoff:
                    recent_runs.append(run)
            except (ValueError, KeyError):
                pass

        # Count by status
        total_runs = len(recent_runs)
        completed = sum(1 for r in recent_runs if r.get("status") == "completed")
        failed = sum(1 for r in recent_runs if r.get("status") == "failed")
        pending = sum(1 for r in recent_runs if r.get("status") == "pending")
        running = sum(1 for r in recent_runs if r.get("status") == "running")

        return {
            "period_hours": hours,
            "total_runs": total_runs,
            "completed": completed,
            "failed": failed,
            "pending": pending,
            "running": running,
            "success_rate": round(completed / total_runs * 100, 1) if total_runs > 0 else 0,
        }
