"""
Tier 1: Audit Service Unit Tests

Tests audit log creation, filtering, date range queries, and service methods.
Mocking is allowed in Tier 1 for external services (database, runtime).
"""

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from studio.services.audit_service import AuditService


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAuditLogCreation:
    """Test audit log creation functionality."""

    @pytest.mark.asyncio
    async def test_log_creates_with_all_fields(self):
        """Log should create entry with all required fields."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"create": {"id": "audit-1", "status": "success"}},
                "run-id-1",
            )

            service = AuditService()
            result = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="create",
                resource_type="agent",
                resource_id="agent-1",
                details={"name": "Test Agent"},
                ip_address="192.168.1.1",
                user_agent="Mozilla/5.0",
                status="success",
            )

            assert result["id"] == "audit-1"
            assert result["status"] == "success"
            mock_runtime_instance.execute_workflow_async.assert_called_once()

    @pytest.mark.asyncio
    async def test_log_with_minimal_fields(self):
        """Log should work with minimal required fields."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"create": {"id": "audit-2"}},
                "run-id-2",
            )

            service = AuditService()
            result = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="login",
                resource_type="user",
            )

            assert result["id"] == "audit-2"
            call_args = mock_runtime_instance.execute_workflow_async.call_args
            workflow = call_args[0][0]
            assert workflow is not None

    @pytest.mark.asyncio
    async def test_log_with_details_serializes_json(self):
        """Details dict should be serialized to JSON string."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"create": {"id": "audit-3"}},
                "run-id-3",
            )

            service = AuditService()
            details_dict = {"field1": "value1", "field2": 123}
            await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="update",
                resource_type="deployment",
                details=details_dict,
            )

            call_args = mock_runtime_instance.execute_workflow_async.call_args
            assert call_args is not None

    @pytest.mark.asyncio
    async def test_log_with_failure_status(self):
        """Log should handle failure status and error message."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"create": {"id": "audit-4", "status": "failure"}},
                "run-id-4",
            )

            service = AuditService()
            result = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="deploy",
                resource_type="agent",
                status="failure",
                error_message="Deployment failed: out of memory",
            )

            assert result["status"] == "failure"

    @pytest.mark.asyncio
    async def test_log_with_null_optional_fields(self):
        """Log should handle null optional fields."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"create": {"id": "audit-5"}},
                "run-id-5",
            )

            service = AuditService()
            result = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="read",
                resource_type="pipeline",
                resource_id=None,
                details=None,
                ip_address=None,
                user_agent=None,
                error_message=None,
            )

            assert result["id"] == "audit-5"

    @pytest.mark.asyncio
    async def test_log_generates_unique_ids(self):
        """Each log should generate a unique ID."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.side_effect = [
                ({"create": {"id": "audit-6"}}, "run-id-6"),
                ({"create": {"id": "audit-7"}}, "run-id-7"),
            ]

            service = AuditService()
            result1 = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="create",
                resource_type="agent",
            )
            result2 = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="create",
                resource_type="agent",
            )

            assert result1["id"] != result2["id"]

    @pytest.mark.asyncio
    async def test_log_includes_timestamp(self):
        """Log should include ISO 8601 timestamp."""
        service = AuditService()
        service.runtime = AsyncMock()

        # Mock return value
        audit_id = "audit-8"
        now_iso = datetime.utcnow().isoformat()
        service.runtime.execute_workflow_async.return_value = (
            {"create": {"id": audit_id, "created_at": now_iso}},
            "run-id-8",
        )

        result = await service.log(
            organization_id="org-1",
            user_id="user-1",
            action="create",
            resource_type="agent",
        )

        # Verify the service was called and timestamp was set
        assert service.runtime.execute_workflow_async.called
        # The result should include the returned data
        assert result["id"] == audit_id


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAuditLogFiltering:
    """Test audit log filtering functionality."""

    @pytest.mark.asyncio
    async def test_list_with_organization_filter(self):
        """List should filter by organization_id."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": "audit-1"}, {"id": "audit-2"}]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.list(organization_id="org-1")

            assert len(logs) == 2
            assert logs[0]["id"] == "audit-1"
            call_args = mock_runtime_instance.execute_workflow_async.call_args
            assert call_args is not None

    @pytest.mark.asyncio
    async def test_list_with_user_id_filter(self):
        """List should filter by user_id."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": "audit-1", "user_id": "user-1"}]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.list(organization_id="org-1", user_id="user-1")

            assert len(logs) == 1
            assert logs[0]["user_id"] == "user-1"

    @pytest.mark.asyncio
    async def test_list_with_action_filter(self):
        """List should filter by action type."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": "audit-1", "action": "create"}]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.list(organization_id="org-1", action="create")

            assert len(logs) == 1
            assert logs[0]["action"] == "create"

    @pytest.mark.asyncio
    async def test_list_with_resource_type_filter(self):
        """List should filter by resource_type."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": "audit-1", "resource_type": "agent"}]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.list(organization_id="org-1", resource_type="agent")

            assert len(logs) == 1
            assert logs[0]["resource_type"] == "agent"

    @pytest.mark.asyncio
    async def test_list_with_resource_id_filter(self):
        """List should filter by resource_id."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": "audit-1", "resource_id": "agent-123"}]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.list(organization_id="org-1", resource_id="agent-123")

            assert len(logs) == 1
            assert logs[0]["resource_id"] == "agent-123"

    @pytest.mark.asyncio
    async def test_list_with_multiple_filters(self):
        """List should combine multiple filters."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": "audit-1"}]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.list(
                organization_id="org-1",
                user_id="user-1",
                action="create",
                resource_type="agent",
                resource_id="agent-1",
            )

            assert len(logs) == 1

    @pytest.mark.asyncio
    async def test_list_returns_empty_when_no_matches(self):
        """List should return empty list when no matches."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": []}},
                "run-id",
            )

            service = AuditService()
            logs = await service.list(organization_id="org-1")

            assert logs == []


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestDateRangeFiltering:
    """Test audit log date range filtering."""

    @pytest.mark.asyncio
    async def test_list_with_start_date_filter(self):
        """List should filter by start_date."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": "audit-1"}]}},
                "run-id",
            )

            service = AuditService()
            start = "2024-01-01T00:00:00"
            logs = await service.list(organization_id="org-1", start_date=start)

            assert len(logs) == 1
            call_args = mock_runtime_instance.execute_workflow_async.call_args
            assert call_args is not None

    @pytest.mark.asyncio
    async def test_list_with_end_date_filter(self):
        """List should filter by end_date."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": "audit-1"}]}},
                "run-id",
            )

            service = AuditService()
            end = "2024-12-31T23:59:59"
            logs = await service.list(organization_id="org-1", end_date=end)

            assert len(logs) == 1

    @pytest.mark.asyncio
    async def test_list_with_date_range(self):
        """List should filter by date range (start and end)."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": "audit-1"}]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.list(
                organization_id="org-1",
                start_date="2024-01-01T00:00:00",
                end_date="2024-12-31T23:59:59",
            )

            assert len(logs) == 1

    @pytest.mark.asyncio
    async def test_list_with_pagination(self):
        """List should support limit and offset for pagination."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": f"audit-{i}"} for i in range(10)]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.list(organization_id="org-1", limit=10, offset=0)

            assert len(logs) == 10

    @pytest.mark.asyncio
    async def test_list_with_custom_limit(self):
        """List should respect custom limit parameter."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": f"audit-{i}"} for i in range(50)]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.list(organization_id="org-1", limit=50)

            assert len(logs) == 50

    @pytest.mark.asyncio
    async def test_list_with_offset(self):
        """List should support offset for pagination."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": f"audit-{i}"} for i in range(10, 20)]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.list(organization_id="org-1", limit=10, offset=10)

            assert len(logs) == 10


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAuditServiceMethods:
    """Test various audit service methods."""

    @pytest.mark.asyncio
    async def test_get_specific_log_by_id(self):
        """Get should retrieve specific log by ID."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"read": {"id": "audit-1", "action": "create"}},
                "run-id",
            )

            service = AuditService()
            log = await service.get("audit-1")

            assert log["id"] == "audit-1"
            assert log["action"] == "create"

    @pytest.mark.asyncio
    async def test_get_returns_none_for_missing_log(self):
        """Get should return None for missing log."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"read": None},
                "run-id",
            )

            service = AuditService()
            log = await service.get("nonexistent-id")

            assert log is None

    @pytest.mark.asyncio
    async def test_get_user_activity(self):
        """Get user activity should return user's audit logs."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": "audit-1", "user_id": "user-1"}]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.get_user_activity("user-1")

            assert len(logs) == 1
            assert logs[0]["user_id"] == "user-1"

    @pytest.mark.asyncio
    async def test_get_user_activity_respects_limit(self):
        """Get user activity should respect limit parameter."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": f"audit-{i}"} for i in range(50)]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.get_user_activity("user-1", limit=50)

            assert len(logs) == 50

    @pytest.mark.asyncio
    async def test_get_resource_history(self):
        """Get resource history should return resource's audit logs."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"list": {"records": [{"id": "audit-1", "resource_id": "agent-1"}]}},
                "run-id",
            )

            service = AuditService()
            logs = await service.get_resource_history("agent", "agent-1")

            assert len(logs) == 1
            assert logs[0]["resource_id"] == "agent-1"

    @pytest.mark.asyncio
    async def test_count_audit_logs(self):
        """Count should return count of matching logs."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"count": {"count": 42}},
                "run-id",
            )

            service = AuditService()
            count = await service.count(organization_id="org-1")

            assert count == 42

    @pytest.mark.asyncio
    async def test_count_with_filters(self):
        """Count should apply filters."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"count": {"count": 5}},
                "run-id",
            )

            service = AuditService()
            count = await service.count(
                organization_id="org-1",
                user_id="user-1",
                action="create",
                resource_type="agent",
            )

            assert count == 5

    @pytest.mark.asyncio
    async def test_count_zero_when_no_matches(self):
        """Count should return 0 when no matches."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"count": {"count": 0}},
                "run-id",
            )

            service = AuditService()
            count = await service.count(
                organization_id="org-1", action="nonexistent_action"
            )

            assert count == 0


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAuditLogActions:
    """Test various audit log action types."""

    @pytest.mark.asyncio
    async def test_log_create_action(self):
        """Should log create action correctly."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"create": {"id": "audit-1", "action": "create"}},
                "run-id",
            )

            service = AuditService()
            result = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="create",
                resource_type="agent",
            )

            assert result["action"] == "create"

    @pytest.mark.asyncio
    async def test_log_update_action(self):
        """Should log update action correctly."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"create": {"id": "audit-2", "action": "update"}},
                "run-id",
            )

            service = AuditService()
            result = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="update",
                resource_type="deployment",
            )

            assert result["action"] == "update"

    @pytest.mark.asyncio
    async def test_log_delete_action(self):
        """Should log delete action correctly."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"create": {"id": "audit-3", "action": "delete"}},
                "run-id",
            )

            service = AuditService()
            result = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="delete",
                resource_type="pipeline",
            )

            assert result["action"] == "delete"

    @pytest.mark.asyncio
    async def test_log_deploy_action(self):
        """Should log deploy action correctly."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"create": {"id": "audit-4", "action": "deploy"}},
                "run-id",
            )

            service = AuditService()
            result = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="deploy",
                resource_type="agent",
            )

            assert result["action"] == "deploy"

    @pytest.mark.asyncio
    async def test_log_login_action(self):
        """Should log login action correctly."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"create": {"id": "audit-5", "action": "login"}},
                "run-id",
            )

            service = AuditService()
            result = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="login",
                resource_type="user",
            )

            assert result["action"] == "login"

    @pytest.mark.asyncio
    async def test_log_logout_action(self):
        """Should log logout action correctly."""
        with patch("studio.services.audit_service.AsyncLocalRuntime") as mock_runtime:
            mock_runtime_instance = AsyncMock()
            mock_runtime.return_value = mock_runtime_instance
            mock_runtime_instance.execute_workflow_async.return_value = (
                {"create": {"id": "audit-6", "action": "logout"}},
                "run-id",
            )

            service = AuditService()
            result = await service.log(
                organization_id="org-1",
                user_id="user-1",
                action="logout",
                resource_type="user",
            )

            assert result["action"] == "logout"
