"""
Tier 1: Phase 14 API Unit Tests

Tests API endpoint handlers and response transformations.
Mocking is allowed in Tier 1.
"""

import json
import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException


@pytest.mark.unit
@pytest.mark.timeout(5)
class TestRunsAPI:
    """Test Runs API endpoints."""

    @pytest.mark.asyncio
    async def test_run_to_response_parses_json_input(self):
        """_run_to_response should parse JSON input_data."""
        from studio.api.runs import _run_to_response

        run = {
            "id": str(uuid.uuid4()),
            "status": "completed",
            "started_at": datetime.now(UTC).isoformat(),
            "input_data": json.dumps({"message": "hello"}),
            "output_data": None,
        }

        result = _run_to_response(run)

        assert result.input == {"message": "hello"}

    @pytest.mark.asyncio
    async def test_run_to_response_parses_json_output(self):
        """_run_to_response should parse JSON output_data."""
        from studio.api.runs import _run_to_response

        run = {
            "id": str(uuid.uuid4()),
            "status": "completed",
            "started_at": datetime.now(UTC).isoformat(),
            "input_data": None,
            "output_data": json.dumps({"result": "success"}),
        }

        result = _run_to_response(run)

        assert result.output == {"result": "success"}

    @pytest.mark.asyncio
    async def test_run_to_response_handles_invalid_json(self):
        """_run_to_response should handle invalid JSON gracefully."""
        from studio.api.runs import _run_to_response

        run = {
            "id": str(uuid.uuid4()),
            "status": "completed",
            "started_at": datetime.now(UTC).isoformat(),
            "input_data": "not valid json",
            "output_data": None,
        }

        result = _run_to_response(run)

        assert result.input is None

    @pytest.mark.asyncio
    async def test_run_to_response_includes_error_fields(self):
        """_run_to_response should include error fields."""
        from studio.api.runs import _run_to_response

        run = {
            "id": str(uuid.uuid4()),
            "status": "failed",
            "started_at": datetime.now(UTC).isoformat(),
            "error": "Connection timeout",
            "error_type": "TimeoutError",
        }

        result = _run_to_response(run)

        assert result.error == "Connection timeout"
        assert result.errorType == "TimeoutError"


@pytest.mark.unit
@pytest.mark.timeout(5)
class TestActivityAPI:
    """Test Activity API endpoints."""

    @pytest.mark.asyncio
    async def test_activity_event_response_fields(self):
        """ActivityEventResponse should have correct fields."""
        from studio.api.activity import ActivityEventResponse

        event = ActivityEventResponse(
            id="event-1",
            type="run",
            userId="user-1",
            userName="Test User",
            workUnitId="wu-1",
            workUnitName="Test Work Unit",
            timestamp=datetime.now(UTC).isoformat(),
            details={"runId": "run-1"},
        )

        assert event.id == "event-1"
        assert event.type == "run"
        assert event.details == {"runId": "run-1"}

    @pytest.mark.asyncio
    async def test_activity_summary_response_fields(self):
        """ActivitySummaryResponse should have correct fields."""
        from studio.api.activity import ActivitySummaryResponse

        summary = ActivitySummaryResponse(
            periodHours=24,
            totalRuns=100,
            completed=80,
            failed=10,
            pending=5,
            running=5,
            successRate=80.0,
        )

        assert summary.periodHours == 24
        assert summary.totalRuns == 100
        assert summary.successRate == 80.0


@pytest.mark.unit
@pytest.mark.timeout(5)
class TestWorkUnitsAPI:
    """Test Work Units API run-related endpoints."""

    @pytest.mark.asyncio
    async def test_run_result_response_fields(self):
        """RunResultResponse should have correct fields."""
        from studio.api.work_units import RunResultResponse

        run = RunResultResponse(
            id=str(uuid.uuid4()),
            status="running",
            startedAt=datetime.now(UTC).isoformat(),
            input={"message": "hello"},
        )

        assert run.status == "running"
        assert run.input == {"message": "hello"}

    @pytest.mark.asyncio
    async def test_run_result_response_optional_fields(self):
        """RunResultResponse optional fields should default to None."""
        from studio.api.work_units import RunResultResponse

        run = RunResultResponse(
            id=str(uuid.uuid4()),
            status="pending",
            startedAt=datetime.now(UTC).isoformat(),
        )

        assert run.completedAt is None
        assert run.input is None
        assert run.output is None
        assert run.error is None


@pytest.mark.unit
@pytest.mark.timeout(5)
class TestWorkspacesAPI:
    """Test Workspaces API member and work unit endpoints."""

    @pytest.mark.asyncio
    async def test_workspace_member_response_fields(self):
        """WorkspaceMemberResponse should have correct fields."""
        from studio.api.workspaces import WorkspaceMemberResponse

        member = WorkspaceMemberResponse(
            userId="user-1",
            userName="Test User",
            email="test@example.com",
            role="admin",
            department="Engineering",
            joinedAt=datetime.now(UTC).isoformat(),
            invitedBy="owner-1",
        )

        assert member.userId == "user-1"
        assert member.role == "admin"
        assert member.department == "Engineering"

    @pytest.mark.asyncio
    async def test_workspace_work_unit_response_fields(self):
        """WorkspaceWorkUnitResponse should have correct fields."""
        from studio.api.workspaces import WorkspaceWorkUnitResponse

        wwu = WorkspaceWorkUnitResponse(
            workUnitId="wu-1",
            workUnitName="Test Work Unit",
            workUnitType="atomic",
            trustStatus="valid",
            delegationId="del-1",
            addedAt=datetime.now(UTC).isoformat(),
            addedBy="user-1",
        )

        assert wwu.workUnitId == "wu-1"
        assert wwu.workUnitType == "atomic"
        assert wwu.trustStatus == "valid"

    @pytest.mark.asyncio
    async def test_add_member_request_validation(self):
        """AddMemberRequest should validate role field."""
        from studio.api.workspaces import AddMemberRequest
        from pydantic import ValidationError

        # Valid roles
        valid_request = AddMemberRequest(userId="user-1", role="admin")
        assert valid_request.role == "admin"

        # Invalid role should fail
        with pytest.raises(ValidationError):
            AddMemberRequest(userId="user-1", role="superadmin")

    @pytest.mark.asyncio
    async def test_add_work_unit_request_optional_constraints(self):
        """AddWorkUnitRequest constraints should be optional."""
        from studio.api.workspaces import AddWorkUnitRequest

        # Without constraints
        request = AddWorkUnitRequest(workUnitId="wu-1")
        assert request.constraints is None

        # With constraints
        request_with = AddWorkUnitRequest(
            workUnitId="wu-1",
            constraints={"read_only": True},
        )
        assert request_with.constraints == {"read_only": True}


@pytest.mark.unit
@pytest.mark.timeout(5)
class TestResponseModelTransformations:
    """Test response model transformations."""

    @pytest.mark.asyncio
    async def test_workspace_to_response_with_details(self):
        """_workspace_to_response_with_details should include members and work units."""
        from studio.api.workspaces import (
            _workspace_to_response_with_details,
            WorkspaceMemberResponse,
            WorkspaceWorkUnitResponse,
        )

        workspace = {
            "id": str(uuid.uuid4()),
            "name": "Test Workspace",
            "organization_id": str(uuid.uuid4()),
            "created_at": datetime.now(UTC).isoformat(),
            "updated_at": datetime.now(UTC).isoformat(),
        }

        members = [
            WorkspaceMemberResponse(
                userId="user-1",
                userName="User 1",
                role="member",
                joinedAt=datetime.now(UTC).isoformat(),
            )
        ]

        work_units = [
            WorkspaceWorkUnitResponse(
                workUnitId="wu-1",
                workUnitName="Work Unit 1",
                workUnitType="atomic",
                trustStatus="valid",
                addedAt=datetime.now(UTC).isoformat(),
                addedBy="user-1",
            )
        ]

        current_user = {"id": "user-1", "name": "Test User"}

        result = _workspace_to_response_with_details(
            workspace, current_user, members, work_units
        )

        assert result.memberCount == 1
        assert result.workUnitCount == 1
        assert len(result.members) == 1
        assert len(result.workUnits) == 1

    @pytest.mark.asyncio
    async def test_workspace_to_summary(self):
        """_workspace_to_summary should create summary response."""
        from studio.api.workspaces import _workspace_to_summary

        workspace = {
            "id": str(uuid.uuid4()),
            "name": "Test Workspace",
            "organization_id": str(uuid.uuid4()),
            "workspace_type": "permanent",
            "member_count": 5,
            "work_unit_count": 10,
        }

        current_user = {"id": "user-1", "name": "Owner"}

        result = _workspace_to_summary(workspace, current_user)

        assert result.name == "Test Workspace"
        assert result.workspaceType == "permanent"
        assert result.memberCount == 5
        assert result.workUnitCount == 10
