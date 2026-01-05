"""
Run Service

Manages work unit execution runs using DataFlow nodes.
"""

import json
import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


class RunService:
    """
    Run service for managing work unit execution runs.

    Uses DataFlow nodes for all database operations.
    Tracks execution lifecycle from pending to completed/failed.
    """

    def __init__(self, runtime=None):
        """Initialize the run service."""
        self.runtime = runtime or AsyncLocalRuntime()

    async def create_run(
        self,
        organization_id: str,
        work_unit_id: str,
        work_unit_type: str,
        work_unit_name: str,
        user_id: str,
        user_name: str | None = None,
        input_data: dict | None = None,
    ) -> dict:
        """
        Create a new execution run.

        Args:
            organization_id: Organization ID
            work_unit_id: Work unit ID (agent or pipeline)
            work_unit_type: Type of work unit (atomic or composite)
            work_unit_name: Name of the work unit
            user_id: ID of user initiating the run
            user_name: Optional name of user
            input_data: Optional input data for the run

        Returns:
            Created run data
        """
        now = datetime.now(UTC).isoformat()
        run_id = str(uuid.uuid4())

        run_data = {
            "id": run_id,
            "organization_id": organization_id,
            "work_unit_id": work_unit_id,
            "work_unit_type": work_unit_type,
            "work_unit_name": work_unit_name,
            "user_id": user_id,
            "user_name": user_name,
            "status": "pending",
            "input_data": json.dumps(input_data) if input_data else None,
            "output_data": None,
            "error": None,
            "error_type": None,
            "started_at": now,
            "completed_at": None,
            "execution_metric_id": None,
            "created_at": now,
            "updated_at": now,
        }

        workflow = WorkflowBuilder()
        workflow.add_node("RunCreateNode", "create", run_data)

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create", {}).get("record", run_data)

    async def get_run(self, run_id: str) -> dict | None:
        """
        Get a run by ID.

        Args:
            run_id: Run ID

        Returns:
            Run data if found, None otherwise
        """
        try:
            workflow = WorkflowBuilder()
            workflow.add_node("RunReadNode", "read", {"id": run_id})

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            return results.get("read")
        except Exception:
            # Table might not exist yet
            return None

    async def update_run_status(
        self,
        run_id: str,
        status: str,
        output_data: dict | None = None,
        error: str | None = None,
        error_type: str | None = None,
        execution_metric_id: str | None = None,
    ) -> dict | None:
        """
        Update a run's status.

        Args:
            run_id: Run ID
            status: New status (running, completed, failed, cancelled)
            output_data: Optional output data (for completed runs)
            error: Optional error message (for failed runs)
            error_type: Optional error type (for failed runs)
            execution_metric_id: Optional link to execution metric

        Returns:
            Updated run data
        """
        fields = {"status": status}

        if status in ("completed", "failed", "cancelled"):
            fields["completed_at"] = datetime.now(UTC).isoformat()

        if output_data is not None:
            fields["output_data"] = json.dumps(output_data)

        if error is not None:
            fields["error"] = error

        if error_type is not None:
            fields["error_type"] = error_type

        if execution_metric_id is not None:
            fields["execution_metric_id"] = execution_metric_id

        workflow = WorkflowBuilder()
        workflow.add_node(
            "RunUpdateNode",
            "update",
            {"filter": {"id": run_id}, "fields": fields},
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return await self.get_run(run_id)

    async def mark_running(self, run_id: str) -> dict | None:
        """Mark a run as running."""
        return await self.update_run_status(run_id, "running")

    async def mark_completed(
        self,
        run_id: str,
        output_data: dict | None = None,
        execution_metric_id: str | None = None,
    ) -> dict | None:
        """Mark a run as completed with optional output."""
        return await self.update_run_status(
            run_id,
            "completed",
            output_data=output_data,
            execution_metric_id=execution_metric_id,
        )

    async def mark_failed(
        self,
        run_id: str,
        error: str,
        error_type: str | None = None,
    ) -> dict | None:
        """Mark a run as failed with error information."""
        return await self.update_run_status(
            run_id, "failed", error=error, error_type=error_type
        )

    async def mark_cancelled(self, run_id: str) -> dict | None:
        """Mark a run as cancelled."""
        return await self.update_run_status(run_id, "cancelled")

    async def list_runs(
        self,
        organization_id: str,
        work_unit_id: str | None = None,
        user_id: str | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        List runs with optional filters.

        Args:
            organization_id: Organization ID
            work_unit_id: Optional work unit filter
            user_id: Optional user filter
            status: Optional status filter
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        try:
            filter_data = {"organization_id": organization_id}

            if work_unit_id:
                filter_data["work_unit_id"] = work_unit_id
            if user_id:
                filter_data["user_id"] = user_id
            if status:
                filter_data["status"] = status

            workflow = WorkflowBuilder()
            workflow.add_node(
                "RunListNode",
                "list",
                {"filter": filter_data, "limit": limit, "offset": offset},
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            list_result = results.get("list", {})
            return {
                "records": list_result.get("records", []),
                "total": list_result.get("count", list_result.get("total", 0)),
            }
        except Exception:
            # Table might not exist yet
            return {"records": [], "total": 0}

    async def get_recent_runs(
        self,
        organization_id: str,
        user_id: str | None = None,
        limit: int = 10,
    ) -> list:
        """
        Get recent runs for an organization or user.

        Args:
            organization_id: Organization ID
            user_id: Optional user filter
            limit: Maximum records to return

        Returns:
            List of recent runs
        """
        result = await self.list_runs(
            organization_id=organization_id,
            user_id=user_id,
            limit=limit,
        )
        return result.get("records", [])

    async def get_work_unit_runs(
        self,
        work_unit_id: str,
        organization_id: str,
        limit: int = 10,
    ) -> list:
        """
        Get recent runs for a specific work unit.

        Args:
            work_unit_id: Work unit ID
            organization_id: Organization ID
            limit: Maximum records to return

        Returns:
            List of runs for the work unit
        """
        result = await self.list_runs(
            organization_id=organization_id,
            work_unit_id=work_unit_id,
            limit=limit,
        )
        return result.get("records", [])

    async def delete_run(self, run_id: str) -> bool:
        """
        Delete a run.

        Args:
            run_id: Run ID

        Returns:
            True if deleted successfully
        """
        workflow = WorkflowBuilder()
        workflow.add_node("RunDeleteNode", "delete", {"id": run_id})

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})
        return True
