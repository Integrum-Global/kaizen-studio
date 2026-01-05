"""
Tier 1: Phase 14 Model Unit Tests

Tests model field validation and data structure for stub endpoint models.
Mocking is allowed in Tier 1.
"""

import uuid
from datetime import datetime

import pytest


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestWorkspaceMemberModel:
    """Test WorkspaceMember model field validation."""

    def test_workspace_member_required_fields(self, workspace_member_factory):
        """WorkspaceMember should have all required fields."""
        member = workspace_member_factory()

        required_fields = [
            "id",
            "workspace_id",
            "user_id",
            "role",
            "created_at",
            "updated_at",
        ]

        for field in required_fields:
            assert field in member, f"Missing required field: {field}"

    def test_workspace_member_id_is_valid_uuid(self, workspace_member_factory):
        """WorkspaceMember ID should be valid UUID string."""
        member = workspace_member_factory()

        parsed = uuid.UUID(member["id"])
        assert str(parsed) == member["id"]

    def test_workspace_member_workspace_id_is_valid_uuid(self, workspace_member_factory):
        """WorkspaceMember workspace_id should be valid UUID string."""
        member = workspace_member_factory()

        parsed = uuid.UUID(member["workspace_id"])
        assert str(parsed) == member["workspace_id"]

    def test_workspace_member_user_id_is_valid_uuid(self, workspace_member_factory):
        """WorkspaceMember user_id should be valid UUID string."""
        member = workspace_member_factory()

        parsed = uuid.UUID(member["user_id"])
        assert str(parsed) == member["user_id"]

    def test_workspace_member_role_values(self, workspace_member_factory):
        """WorkspaceMember role should be valid."""
        valid_roles = ["owner", "admin", "member", "viewer"]

        for role in valid_roles:
            member = workspace_member_factory(role=role)
            assert member["role"] == role

    def test_workspace_member_optional_fields(self, workspace_member_factory):
        """WorkspaceMember should have optional fields."""
        member = workspace_member_factory()

        optional_fields = ["constraints", "invited_by", "department"]
        for field in optional_fields:
            assert field in member, f"Missing optional field: {field}"

    def test_workspace_member_constraints_json(self, workspace_member_factory):
        """WorkspaceMember constraints should accept JSON string."""
        import json

        constraints = json.dumps({"max_executions_per_day": 100})
        member = workspace_member_factory(constraints=constraints)

        assert member["constraints"] == constraints
        parsed = json.loads(member["constraints"])
        assert parsed["max_executions_per_day"] == 100

    def test_workspace_member_timestamps_iso8601(self, workspace_member_factory):
        """WorkspaceMember timestamps should be ISO 8601 format."""
        member = workspace_member_factory()

        created = datetime.fromisoformat(member["created_at"].replace("Z", "+00:00"))
        updated = datetime.fromisoformat(member["updated_at"].replace("Z", "+00:00"))

        assert created is not None
        assert updated is not None


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestWorkspaceWorkUnitModel:
    """Test WorkspaceWorkUnit model field validation."""

    def test_workspace_work_unit_required_fields(self, workspace_work_unit_factory):
        """WorkspaceWorkUnit should have all required fields."""
        wwu = workspace_work_unit_factory()

        required_fields = [
            "id",
            "workspace_id",
            "work_unit_id",
            "work_unit_type",
            "added_by",
            "created_at",
            "updated_at",
        ]

        for field in required_fields:
            assert field in wwu, f"Missing required field: {field}"

    def test_workspace_work_unit_id_is_valid_uuid(self, workspace_work_unit_factory):
        """WorkspaceWorkUnit ID should be valid UUID string."""
        wwu = workspace_work_unit_factory()

        parsed = uuid.UUID(wwu["id"])
        assert str(parsed) == wwu["id"]

    def test_workspace_work_unit_workspace_id_is_valid_uuid(self, workspace_work_unit_factory):
        """WorkspaceWorkUnit workspace_id should be valid UUID string."""
        wwu = workspace_work_unit_factory()

        parsed = uuid.UUID(wwu["workspace_id"])
        assert str(parsed) == wwu["workspace_id"]

    def test_workspace_work_unit_work_unit_id_is_valid_uuid(self, workspace_work_unit_factory):
        """WorkspaceWorkUnit work_unit_id should be valid UUID string."""
        wwu = workspace_work_unit_factory()

        parsed = uuid.UUID(wwu["work_unit_id"])
        assert str(parsed) == wwu["work_unit_id"]

    def test_workspace_work_unit_type_values(self, workspace_work_unit_factory):
        """WorkspaceWorkUnit work_unit_type should be valid."""
        valid_types = ["atomic", "composite"]

        for wut in valid_types:
            wwu = workspace_work_unit_factory(work_unit_type=wut)
            assert wwu["work_unit_type"] == wut

    def test_workspace_work_unit_optional_fields(self, workspace_work_unit_factory):
        """WorkspaceWorkUnit should have optional fields."""
        wwu = workspace_work_unit_factory()

        optional_fields = ["delegation_id", "constraints", "department"]
        for field in optional_fields:
            assert field in wwu, f"Missing optional field: {field}"

    def test_workspace_work_unit_delegation_id(self, workspace_work_unit_factory):
        """WorkspaceWorkUnit delegation_id should accept UUID string."""
        delegation_id = str(uuid.uuid4())
        wwu = workspace_work_unit_factory(delegation_id=delegation_id)

        assert wwu["delegation_id"] == delegation_id
        parsed = uuid.UUID(wwu["delegation_id"])
        assert str(parsed) == delegation_id

    def test_workspace_work_unit_timestamps_iso8601(self, workspace_work_unit_factory):
        """WorkspaceWorkUnit timestamps should be ISO 8601 format."""
        wwu = workspace_work_unit_factory()

        created = datetime.fromisoformat(wwu["created_at"].replace("Z", "+00:00"))
        updated = datetime.fromisoformat(wwu["updated_at"].replace("Z", "+00:00"))

        assert created is not None
        assert updated is not None


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestRunModel:
    """Test Run model field validation."""

    def test_run_required_fields(self, run_factory):
        """Run should have all required fields."""
        run = run_factory()

        required_fields = [
            "id",
            "organization_id",
            "work_unit_id",
            "work_unit_type",
            "work_unit_name",
            "user_id",
            "status",
            "started_at",
            "created_at",
            "updated_at",
        ]

        for field in required_fields:
            assert field in run, f"Missing required field: {field}"

    def test_run_id_is_valid_uuid(self, run_factory):
        """Run ID should be valid UUID string."""
        run = run_factory()

        parsed = uuid.UUID(run["id"])
        assert str(parsed) == run["id"]

    def test_run_organization_id_is_valid_uuid(self, run_factory):
        """Run organization_id should be valid UUID string."""
        run = run_factory()

        parsed = uuid.UUID(run["organization_id"])
        assert str(parsed) == run["organization_id"]

    def test_run_work_unit_id_is_valid_uuid(self, run_factory):
        """Run work_unit_id should be valid UUID string."""
        run = run_factory()

        parsed = uuid.UUID(run["work_unit_id"])
        assert str(parsed) == run["work_unit_id"]

    def test_run_user_id_is_valid_uuid(self, run_factory):
        """Run user_id should be valid UUID string."""
        run = run_factory()

        parsed = uuid.UUID(run["user_id"])
        assert str(parsed) == run["user_id"]

    def test_run_status_values(self, run_factory):
        """Run status should be valid."""
        valid_statuses = ["pending", "running", "completed", "failed", "cancelled"]

        for status in valid_statuses:
            run = run_factory(status=status)
            assert run["status"] == status

    def test_run_work_unit_type_values(self, run_factory):
        """Run work_unit_type should be valid."""
        valid_types = ["atomic", "composite"]

        for wut in valid_types:
            run = run_factory(work_unit_type=wut)
            assert run["work_unit_type"] == wut

    def test_run_optional_fields(self, run_factory):
        """Run should have optional fields."""
        run = run_factory()

        optional_fields = [
            "user_name",
            "input_data",
            "output_data",
            "error",
            "error_type",
            "completed_at",
            "execution_metric_id",
        ]
        for field in optional_fields:
            assert field in run, f"Missing optional field: {field}"

    def test_run_input_output_json(self, run_factory):
        """Run input_data and output_data should accept JSON strings."""
        import json

        input_data = json.dumps({"message": "hello"})
        output_data = json.dumps({"response": "world"})

        run = run_factory(input_data=input_data, output_data=output_data)

        assert run["input_data"] == input_data
        assert run["output_data"] == output_data

        parsed_input = json.loads(run["input_data"])
        assert parsed_input["message"] == "hello"

        parsed_output = json.loads(run["output_data"])
        assert parsed_output["response"] == "world"

    def test_run_error_fields(self, run_factory):
        """Run error fields should store error information."""
        run = run_factory(
            status="failed",
            error="Connection timeout",
            error_type="TimeoutError",
        )

        assert run["status"] == "failed"
        assert run["error"] == "Connection timeout"
        assert run["error_type"] == "TimeoutError"

    def test_run_timestamps_iso8601(self, run_factory):
        """Run timestamps should be ISO 8601 format."""
        run = run_factory()

        created = datetime.fromisoformat(run["created_at"].replace("Z", "+00:00"))
        updated = datetime.fromisoformat(run["updated_at"].replace("Z", "+00:00"))
        started = datetime.fromisoformat(run["started_at"].replace("Z", "+00:00"))

        assert created is not None
        assert updated is not None
        assert started is not None

    def test_run_completed_at_optional(self, run_factory):
        """Run completed_at should be optional (None for pending runs)."""
        pending_run = run_factory(status="pending", completed_at=None)
        assert pending_run["completed_at"] is None

        completed_run = run_factory(
            status="completed",
            completed_at=datetime.now().isoformat(),
        )
        assert completed_run["completed_at"] is not None


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPhase14FactoryFunctions:
    """Test that Phase 14 factory functions produce valid data."""

    def test_workspace_member_factory_generates_unique_ids(self, workspace_member_factory):
        """Each workspace_member_factory call should generate unique ID."""
        members = [workspace_member_factory() for _ in range(5)]
        ids = [m["id"] for m in members]

        assert len(ids) == len(set(ids)), "IDs should be unique"

    def test_workspace_work_unit_factory_generates_unique_ids(self, workspace_work_unit_factory):
        """Each workspace_work_unit_factory call should generate unique ID."""
        wwus = [workspace_work_unit_factory() for _ in range(5)]
        ids = [w["id"] for w in wwus]

        assert len(ids) == len(set(ids)), "IDs should be unique"

    def test_run_factory_generates_unique_ids(self, run_factory):
        """Each run_factory call should generate unique ID."""
        runs = [run_factory() for _ in range(5)]
        ids = [r["id"] for r in runs]

        assert len(ids) == len(set(ids)), "IDs should be unique"

    def test_workspace_member_factory_defaults(self, workspace_member_factory):
        """workspace_member_factory should have sensible defaults."""
        member = workspace_member_factory()

        assert member["role"] == "member"
        assert member["constraints"] is None
        assert member["invited_by"] is None
        assert member["department"] is None

    def test_workspace_work_unit_factory_defaults(self, workspace_work_unit_factory):
        """workspace_work_unit_factory should have sensible defaults."""
        wwu = workspace_work_unit_factory()

        assert wwu["work_unit_type"] == "atomic"
        assert wwu["delegation_id"] is None
        assert wwu["constraints"] is None
        assert wwu["department"] is None

    def test_run_factory_defaults(self, run_factory):
        """run_factory should have sensible defaults."""
        run = run_factory()

        assert run["status"] == "pending"
        assert run["work_unit_type"] == "atomic"
        assert run["input_data"] is None
        assert run["output_data"] is None
        assert run["error"] is None
        assert run["error_type"] is None

    def test_workspace_member_factory_custom_values(self, workspace_member_factory):
        """workspace_member_factory should accept custom values."""
        custom_id = str(uuid.uuid4())
        custom_role = "admin"

        member = workspace_member_factory(id=custom_id, role=custom_role)

        assert member["id"] == custom_id
        assert member["role"] == custom_role

    def test_run_factory_custom_values(self, run_factory):
        """run_factory should accept custom values."""
        custom_id = str(uuid.uuid4())
        custom_name = "My Test Run"
        custom_status = "completed"

        run = run_factory(id=custom_id, work_unit_name=custom_name, status=custom_status)

        assert run["id"] == custom_id
        assert run["work_unit_name"] == custom_name
        assert run["status"] == custom_status
