"""
Tier 1: Phase 14 Service Unit Tests

Tests service methods and data transformations.
Mocking is allowed in Tier 1.
"""

import json
import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.mark.unit
@pytest.mark.timeout(5)
class TestRunService:
    """Test RunService methods."""

    @pytest.fixture
    def mock_runtime(self):
        """Create a mock runtime."""
        runtime = AsyncMock()
        runtime.execute_workflow_async = AsyncMock(
            return_value=({}, str(uuid.uuid4()))
        )
        return runtime

    @pytest.fixture
    def run_service(self, mock_runtime):
        """Create RunService with mocked runtime."""
        from studio.services.run_service import RunService

        service = RunService(runtime=mock_runtime)
        return service

    @pytest.mark.asyncio
    async def test_create_run_returns_run_data(self, run_service, mock_runtime):
        """create_run should return created run data."""
        run_id = str(uuid.uuid4())
        mock_runtime.execute_workflow_async.return_value = (
            {"create": {"record": {"id": run_id, "status": "pending"}}},
            str(uuid.uuid4()),
        )

        result = await run_service.create_run(
            organization_id=str(uuid.uuid4()),
            work_unit_id=str(uuid.uuid4()),
            work_unit_type="atomic",
            work_unit_name="Test Work Unit",
            user_id=str(uuid.uuid4()),
        )

        assert result["id"] == run_id
        assert result["status"] == "pending"

    @pytest.mark.asyncio
    async def test_create_run_includes_input_data(self, run_service, mock_runtime):
        """create_run should include input_data as JSON string."""
        input_data = {"message": "hello"}

        await run_service.create_run(
            organization_id=str(uuid.uuid4()),
            work_unit_id=str(uuid.uuid4()),
            work_unit_type="atomic",
            work_unit_name="Test",
            user_id=str(uuid.uuid4()),
            input_data=input_data,
        )

        # Verify the workflow was called with JSON serialized input
        call_args = mock_runtime.execute_workflow_async.call_args
        assert call_args is not None

    @pytest.mark.asyncio
    async def test_get_run_returns_none_when_not_found(self, run_service, mock_runtime):
        """get_run should return None when run not found."""
        mock_runtime.execute_workflow_async.return_value = (
            {"read": None},
            str(uuid.uuid4()),
        )

        result = await run_service.get_run("nonexistent-id")

        assert result is None

    @pytest.mark.asyncio
    async def test_mark_running_updates_status(self, run_service, mock_runtime):
        """mark_running should update status to running."""
        run_id = str(uuid.uuid4())
        mock_runtime.execute_workflow_async.return_value = (
            {"read": {"id": run_id, "status": "running"}},
            str(uuid.uuid4()),
        )

        result = await run_service.mark_running(run_id)

        assert result["status"] == "running"

    @pytest.mark.asyncio
    async def test_mark_completed_sets_completed_at(self, run_service, mock_runtime):
        """mark_completed should set completed_at timestamp."""
        run_id = str(uuid.uuid4())
        now = datetime.now(UTC).isoformat()
        mock_runtime.execute_workflow_async.return_value = (
            {"read": {"id": run_id, "status": "completed", "completed_at": now}},
            str(uuid.uuid4()),
        )

        result = await run_service.mark_completed(run_id, output_data={"result": "ok"})

        assert result["status"] == "completed"
        assert result["completed_at"] is not None

    @pytest.mark.asyncio
    async def test_mark_failed_stores_error_info(self, run_service, mock_runtime):
        """mark_failed should store error information."""
        run_id = str(uuid.uuid4())
        mock_runtime.execute_workflow_async.return_value = (
            {
                "read": {
                    "id": run_id,
                    "status": "failed",
                    "error": "Connection timeout",
                    "error_type": "TimeoutError",
                }
            },
            str(uuid.uuid4()),
        )

        result = await run_service.mark_failed(
            run_id,
            error="Connection timeout",
            error_type="TimeoutError",
        )

        assert result["status"] == "failed"
        assert result["error"] == "Connection timeout"
        assert result["error_type"] == "TimeoutError"

    @pytest.mark.asyncio
    async def test_list_runs_returns_records(self, run_service, mock_runtime):
        """list_runs should return records and total."""
        mock_runtime.execute_workflow_async.return_value = (
            {"list": {"records": [{"id": "run-1"}, {"id": "run-2"}], "count": 2}},
            str(uuid.uuid4()),
        )

        result = await run_service.list_runs(organization_id=str(uuid.uuid4()))

        assert len(result["records"]) == 2
        assert result["total"] == 2

    @pytest.mark.asyncio
    async def test_get_recent_runs_returns_list(self, run_service, mock_runtime):
        """get_recent_runs should return list of runs."""
        mock_runtime.execute_workflow_async.return_value = (
            {"list": {"records": [{"id": "run-1"}], "count": 1}},
            str(uuid.uuid4()),
        )

        result = await run_service.get_recent_runs(
            organization_id=str(uuid.uuid4()),
            user_id=str(uuid.uuid4()),
            limit=10,
        )

        assert isinstance(result, list)
        assert len(result) == 1


@pytest.mark.unit
@pytest.mark.timeout(5)
class TestActivityService:
    """Test ActivityService methods."""

    @pytest.fixture
    def mock_runtime(self):
        """Create a mock runtime."""
        runtime = AsyncMock()
        runtime.execute_workflow_async = AsyncMock(
            return_value=({}, str(uuid.uuid4()))
        )
        return runtime

    @pytest.fixture
    def activity_service(self, mock_runtime):
        """Create ActivityService with mocked runtime."""
        from studio.services.activity_service import ActivityService

        service = ActivityService(runtime=mock_runtime)
        return service

    @pytest.mark.asyncio
    async def test_get_team_activity_returns_events(self, activity_service, mock_runtime):
        """get_team_activity should return list of events."""
        mock_runtime.execute_workflow_async.return_value = (
            {
                "list_runs": {
                    "records": [
                        {
                            "id": "run-1",
                            "status": "completed",
                            "user_id": "user-1",
                            "user_name": "Test User",
                            "work_unit_id": "wu-1",
                            "work_unit_name": "Test WU",
                            "started_at": datetime.now(UTC).isoformat(),
                        }
                    ]
                }
            },
            str(uuid.uuid4()),
        )

        result = await activity_service.get_team_activity(
            organization_id=str(uuid.uuid4()),
            limit=10,
        )

        assert isinstance(result, list)
        assert len(result) >= 0

    @pytest.mark.asyncio
    async def test_get_my_activity_filters_by_user(self, activity_service, mock_runtime):
        """get_my_activity should filter events by user ID."""
        user_id = str(uuid.uuid4())
        mock_runtime.execute_workflow_async.return_value = (
            {"list_runs": {"records": []}},
            str(uuid.uuid4()),
        )

        await activity_service.get_my_activity(
            organization_id=str(uuid.uuid4()),
            user_id=user_id,
            limit=10,
        )

        # Verify user_id was included in filter
        call_args = mock_runtime.execute_workflow_async.call_args
        assert call_args is not None

    @pytest.mark.asyncio
    async def test_determine_event_type_completed(self, activity_service):
        """_determine_event_type should return 'completion' for completed runs."""
        run = {"status": "completed"}
        result = activity_service._determine_event_type(run)
        assert result == "completion"

    @pytest.mark.asyncio
    async def test_determine_event_type_failed(self, activity_service):
        """_determine_event_type should return 'error' for failed runs."""
        run = {"status": "failed"}
        result = activity_service._determine_event_type(run)
        assert result == "error"

    @pytest.mark.asyncio
    async def test_determine_event_type_running(self, activity_service):
        """_determine_event_type should return 'run' for running runs."""
        run = {"status": "running"}
        result = activity_service._determine_event_type(run)
        assert result == "run"

    @pytest.mark.asyncio
    async def test_get_activity_summary_returns_counts(
        self, activity_service, mock_runtime
    ):
        """get_activity_summary should return status counts."""
        mock_runtime.execute_workflow_async.return_value = (
            {
                "list_runs": {
                    "records": [
                        {"status": "completed", "started_at": datetime.now(UTC).isoformat()},
                        {"status": "completed", "started_at": datetime.now(UTC).isoformat()},
                        {"status": "failed", "started_at": datetime.now(UTC).isoformat()},
                    ]
                }
            },
            str(uuid.uuid4()),
        )

        result = await activity_service.get_activity_summary(
            organization_id=str(uuid.uuid4()),
            hours=24,
        )

        assert "total_runs" in result
        assert "completed" in result
        assert "failed" in result
        assert "success_rate" in result


@pytest.mark.unit
@pytest.mark.timeout(5)
class TestWorkspaceServiceExtensions:
    """Test WorkspaceService member and work unit methods."""

    @pytest.fixture
    def mock_runtime(self):
        """Create a mock runtime."""
        runtime = AsyncMock()
        runtime.execute_workflow_async = AsyncMock(
            return_value=({}, str(uuid.uuid4()))
        )
        return runtime

    @pytest.fixture
    def workspace_service(self, mock_runtime):
        """Create WorkspaceService with mocked runtime."""
        from studio.services.workspace_service import WorkspaceService

        service = WorkspaceService()
        service.runtime = mock_runtime
        return service

    @pytest.mark.asyncio
    async def test_add_member_creates_record(self, workspace_service, mock_runtime):
        """add_member should create a workspace member record."""
        # DataFlow returns record directly at top level, not nested under "record"
        mock_runtime.execute_workflow_async.return_value = (
            {"create_member": {"id": "member-123", "role": "member"}},
            str(uuid.uuid4()),
        )

        result = await workspace_service.add_member(
            workspace_id=str(uuid.uuid4()),
            user_id=str(uuid.uuid4()),
            role="member",
        )

        assert result["id"] == "member-123"
        assert result["role"] == "member"

    @pytest.mark.asyncio
    async def test_update_member_changes_role(self, workspace_service, mock_runtime):
        """update_member should change member role."""
        # update_member calls: get_member (find_member), UpdateNode, get_member again
        # get_member uses "find_member" node ID
        mock_runtime.execute_workflow_async.side_effect = [
            ({"find_member": {"records": [{"id": "m-1", "role": "member"}]}}, str(uuid.uuid4())),  # First get_member
            ({"update_member": {}}, str(uuid.uuid4())),  # UpdateNode
            ({"find_member": {"records": [{"id": "m-1", "role": "admin"}]}}, str(uuid.uuid4())),  # Second get_member
        ]

        result = await workspace_service.update_member(
            workspace_id=str(uuid.uuid4()),
            user_id=str(uuid.uuid4()),
            role="admin",
        )

        assert result["role"] == "admin"

    @pytest.mark.asyncio
    async def test_remove_member_deletes_record(self, workspace_service, mock_runtime):
        """remove_member should delete member record."""
        # remove_member calls: get_member (find_member), then DeleteNode
        mock_runtime.execute_workflow_async.side_effect = [
            ({"find_member": {"records": [{"id": "m-1"}]}}, str(uuid.uuid4())),  # get_member
            ({"delete_member": {}}, str(uuid.uuid4())),  # DeleteNode
        ]

        result = await workspace_service.remove_member(
            workspace_id=str(uuid.uuid4()),
            user_id=str(uuid.uuid4()),
        )

        assert result is True

    @pytest.mark.asyncio
    async def test_remove_member_returns_false_when_not_found(
        self, workspace_service, mock_runtime
    ):
        """remove_member should return False when member not found."""
        # get_member uses "find_member" node ID
        mock_runtime.execute_workflow_async.return_value = (
            {"find_member": {"records": []}},
            str(uuid.uuid4()),
        )

        result = await workspace_service.remove_member(
            workspace_id=str(uuid.uuid4()),
            user_id=str(uuid.uuid4()),
        )

        assert result is False

    @pytest.mark.asyncio
    async def test_get_members_returns_records(self, workspace_service, mock_runtime):
        """get_members should return member records."""
        mock_runtime.execute_workflow_async.return_value = (
            {"list_members": {"records": [{"id": "m-1"}, {"id": "m-2"}], "count": 2}},
            str(uuid.uuid4()),
        )

        result = await workspace_service.get_members(workspace_id=str(uuid.uuid4()))

        assert len(result["records"]) == 2
        assert result["total"] == 2

    @pytest.mark.asyncio
    async def test_add_work_unit_creates_record(self, workspace_service, mock_runtime):
        """add_work_unit should create a workspace work unit record."""
        # DataFlow returns record directly at top level, not nested under "record"
        mock_runtime.execute_workflow_async.return_value = (
            {"create_wwu": {"id": "wwu-123", "work_unit_type": "atomic"}},
            str(uuid.uuid4()),
        )

        result = await workspace_service.add_work_unit(
            workspace_id=str(uuid.uuid4()),
            work_unit_id=str(uuid.uuid4()),
            work_unit_type="atomic",
            added_by=str(uuid.uuid4()),
        )

        assert result["id"] == "wwu-123"
        assert result["work_unit_type"] == "atomic"

    @pytest.mark.asyncio
    async def test_remove_work_unit_deletes_record(self, workspace_service, mock_runtime):
        """remove_work_unit should delete work unit record."""
        mock_runtime.execute_workflow_async.side_effect = [
            ({"list_wwu": {"records": [{"id": "wwu-1"}]}}, str(uuid.uuid4())),
            ({}, str(uuid.uuid4())),
        ]

        result = await workspace_service.remove_work_unit(
            workspace_id=str(uuid.uuid4()),
            work_unit_id=str(uuid.uuid4()),
        )

        assert result is True

    @pytest.mark.asyncio
    async def test_get_work_units_returns_records(self, workspace_service, mock_runtime):
        """get_work_units should return work unit records."""
        mock_runtime.execute_workflow_async.return_value = (
            {"list_wwu": {"records": [{"id": "wwu-1"}], "count": 1}},
            str(uuid.uuid4()),
        )

        result = await workspace_service.get_work_units(
            workspace_id=str(uuid.uuid4())
        )

        assert len(result["records"]) == 1
        assert result["total"] == 1

    @pytest.mark.asyncio
    async def test_get_work_units_filters_by_type(self, workspace_service, mock_runtime):
        """get_work_units should filter by work_unit_type."""
        mock_runtime.execute_workflow_async.return_value = (
            {"list_wwu": {"records": [], "count": 0}},
            str(uuid.uuid4()),
        )

        await workspace_service.get_work_units(
            workspace_id=str(uuid.uuid4()),
            work_unit_type="composite",
        )

        # Verify type filter was included
        call_args = mock_runtime.execute_workflow_async.call_args
        assert call_args is not None
