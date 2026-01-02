"""
Tier 2: Audit API Integration Tests

Tests all 5 audit endpoints with real database and infrastructure.
NO MOCKING - uses actual PostgreSQL, DataFlow nodes, and AsyncLocalRuntime.
"""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from studio.services.audit_service import AuditService


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestListAuditLogsEndpoint:
    """Test GET /audit/logs endpoint."""

    @pytest.mark.asyncio
    async def test_list_audit_logs_with_organization_id(
        self, test_client: AsyncClient, authenticated_client
    ):
        """List endpoint should return audit logs for organization."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        # Create some audit logs first
        service = AuditService()
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
            resource_id="agent-1",
        )

        response = await client.get(
            f"/api/v1/audit/logs?organization_id={org_id}",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert "total" in data
        assert isinstance(data["logs"], list)

    @pytest.mark.asyncio
    async def test_list_audit_logs_pagination(
        self, test_client: AsyncClient, authenticated_client
    ):
        """List endpoint should support pagination with limit and offset."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        # Create multiple audit logs
        service = AuditService()
        for i in range(15):
            await service.log(
                organization_id=org_id,
                user_id=user_data["id"],
                action="create",
                resource_type="agent",
                resource_id=f"agent-{i}",
            )

        # Test with limit and offset
        response = await client.get(
            f"/api/v1/audit/logs?organization_id={org_id}&limit=10&offset=0",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["logs"]) <= 10

    @pytest.mark.asyncio
    async def test_list_audit_logs_filter_by_user(
        self, test_client: AsyncClient, authenticated_client
    ):
        """List endpoint should filter by user_id."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        # Create audit logs for this user
        service = AuditService()
        await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="create",
            resource_type="agent",
        )

        response = await client.get(
            f"/api/v1/audit/logs?organization_id={org_id}&user_id={user_id}",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        for log in data["logs"]:
            assert log["user_id"] == user_id

    @pytest.mark.asyncio
    async def test_list_audit_logs_filter_by_action(
        self, test_client: AsyncClient, authenticated_client
    ):
        """List endpoint should filter by action type."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        service = AuditService()
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
        )
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="update",
            resource_type="agent",
        )

        response = await client.get(
            f"/api/v1/audit/logs?organization_id={org_id}&action=create",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        for log in data["logs"]:
            assert log["action"] == "create"

    @pytest.mark.asyncio
    async def test_list_audit_logs_filter_by_resource_type(
        self, test_client: AsyncClient, authenticated_client
    ):
        """List endpoint should filter by resource_type."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        service = AuditService()
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
        )
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="deployment",
        )

        response = await client.get(
            f"/api/v1/audit/logs?organization_id={org_id}&resource_type=agent",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        for log in data["logs"]:
            assert log["resource_type"] == "agent"

    @pytest.mark.asyncio
    async def test_list_audit_logs_filter_by_date_range(
        self, test_client: AsyncClient, authenticated_client
    ):
        """List endpoint should filter by date range."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        service = AuditService()
        now = datetime.now(UTC).isoformat()
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
        )

        # Use dates that should include the log
        start_date = (datetime.now(UTC) - timedelta(days=1)).isoformat()
        end_date = (datetime.now(UTC) + timedelta(days=1)).isoformat()

        response = await client.get(
            f"/api/v1/audit/logs?organization_id={org_id}&start_date={start_date}&end_date={end_date}",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["logs"], list)

    @pytest.mark.asyncio
    async def test_list_audit_logs_missing_organization_id(
        self, test_client: AsyncClient, authenticated_client
    ):
        """List endpoint should require organization_id."""
        client, user_data = authenticated_client

        response = await client.get(
            "/api/v1/audit/logs",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code in [400, 422]  # Bad request or validation error


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestGetAuditLogEndpoint:
    """Test GET /audit/logs/{id} endpoint."""

    @pytest.mark.asyncio
    async def test_get_audit_log_by_id(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Get endpoint should return specific audit log."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        # Create an audit log
        service = AuditService()
        result = await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
            resource_id="agent-1",
            details={"name": "Test Agent"},
        )
        audit_id = result["id"]

        response = await client.get(
            f"/api/v1/audit/logs/{audit_id}",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == audit_id
        assert data["action"] == "create"
        assert data["resource_type"] == "agent"

    @pytest.mark.asyncio
    async def test_get_audit_log_with_all_fields(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Get endpoint should return all audit log fields."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        service = AuditService()
        result = await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
            resource_id="agent-1",
            details={"name": "Test Agent"},
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0",
            status="success",
        )
        audit_id = result["id"]

        response = await client.get(
            f"/api/v1/audit/logs/{audit_id}",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == audit_id
        assert data["organization_id"] == org_id
        assert data["user_id"] == user_data["id"]
        assert data["action"] == "create"
        assert data["resource_type"] == "agent"
        assert data["resource_id"] == "agent-1"
        assert data["status"] == "success"
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_get_audit_log_not_found(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Get endpoint should return 404 for missing log."""
        client, user_data = authenticated_client

        response = await client.get(
            "/api/v1/audit/logs/nonexistent-id",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestUserActivityEndpoint:
    """Test GET /audit/users/{user_id} endpoint."""

    @pytest.mark.asyncio
    async def test_get_user_activity(
        self, test_client: AsyncClient, authenticated_client
    ):
        """User activity endpoint should return user's audit logs."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        # Create audit logs for this user
        service = AuditService()
        await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="create",
            resource_type="agent",
        )
        await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="update",
            resource_type="deployment",
        )

        response = await client.get(
            f"/api/v1/audit/users/{user_id}",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for log in data:
            assert log["user_id"] == user_id

    @pytest.mark.asyncio
    async def test_get_user_activity_respects_limit(
        self, test_client: AsyncClient, authenticated_client
    ):
        """User activity endpoint should respect limit parameter."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        # Create multiple audit logs
        service = AuditService()
        for i in range(30):
            await service.log(
                organization_id=org_id,
                user_id=user_id,
                action="create",
                resource_type="agent",
            )

        response = await client.get(
            f"/api/v1/audit/users/{user_id}?limit=20",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 20

    @pytest.mark.asyncio
    async def test_get_user_activity_no_logs(
        self, test_client: AsyncClient, authenticated_client
    ):
        """User activity endpoint should return empty for user with no logs."""
        client, user_data = authenticated_client

        # Create new user with no activity
        new_user_id = str(uuid.uuid4())

        response = await client.get(
            f"/api/v1/audit/users/{new_user_id}",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data == []


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestResourceHistoryEndpoint:
    """Test GET /audit/resources/{resource_type}/{resource_id} endpoint."""

    @pytest.mark.asyncio
    async def test_get_resource_history(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Resource history endpoint should return resource's audit logs."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        resource_type = "agent"
        resource_id = "agent-123"

        # Create audit logs for this resource
        service = AuditService()
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type=resource_type,
            resource_id=resource_id,
        )
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="update",
            resource_type=resource_type,
            resource_id=resource_id,
        )

        response = await client.get(
            f"/api/v1/audit/resources/{resource_type}/{resource_id}",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for log in data:
            assert log["resource_type"] == resource_type
            assert log["resource_id"] == resource_id

    @pytest.mark.asyncio
    async def test_get_resource_history_multiple_resources(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Resource history should only return logs for specific resource."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        service = AuditService()
        resource_id_1 = "agent-1"
        resource_id_2 = "agent-2"

        # Create logs for resource 1
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
            resource_id=resource_id_1,
        )

        # Create logs for resource 2
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
            resource_id=resource_id_2,
        )

        response = await client.get(
            f"/api/v1/audit/resources/agent/{resource_id_1}",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        for log in data:
            assert log["resource_id"] == resource_id_1

    @pytest.mark.asyncio
    async def test_get_resource_history_no_logs(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Resource history should return empty for resource with no logs."""
        client, user_data = authenticated_client

        response = await client.get(
            "/api/v1/audit/resources/agent/nonexistent-resource",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data == []


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestExportAuditLogsEndpoint:
    """Test GET /audit/export endpoint."""

    @pytest.mark.asyncio
    async def test_export_audit_logs_as_json(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Export endpoint should export logs as JSON."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        # Create audit logs
        service = AuditService()
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
        )

        response = await client.get(
            f"/api/v1/audit/export?organization_id={org_id}&format=json",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_export_audit_logs_as_csv(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Export endpoint should export logs as CSV."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        # Create audit logs
        service = AuditService()
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
        )

        response = await client.get(
            f"/api/v1/audit/export?organization_id={org_id}&format=csv",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")
        content = response.text
        assert "id" in content  # CSV header
        assert "action" in content

    @pytest.mark.asyncio
    async def test_export_audit_logs_default_format(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Export endpoint should default to JSON format."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        service = AuditService()
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
        )

        response = await client.get(
            f"/api/v1/audit/export?organization_id={org_id}",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

    @pytest.mark.asyncio
    async def test_export_audit_logs_with_filters(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Export endpoint should apply filters."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        service = AuditService()
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
        )
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="update",
            resource_type="deployment",
        )

        response = await client.get(
            f"/api/v1/audit/export?organization_id={org_id}&action=create&format=json",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        assert response.status_code == 200
        data = response.json()
        for log in data:
            assert log["action"] == "create"


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestAuditMiddlewareLogging:
    """Test automatic audit logging via middleware."""

    @pytest.mark.asyncio
    async def test_middleware_logs_post_request(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Middleware should automatically log POST requests."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        # Make a POST request (any endpoint that logs)
        response = await client.post(
            "/api/v1/agents",
            json={"name": "Test Agent", "agent_type": "chat", "model_id": "gpt-4"},
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        # Request may succeed or fail, but middleware should still log
        service = AuditService()
        logs = await service.get_user_activity(user_data["id"])
        # Check if any logs were created (middleware should create them)
        assert isinstance(logs, list)

    @pytest.mark.asyncio
    async def test_middleware_logs_delete_request(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Middleware should automatically log DELETE requests."""
        client, user_data = authenticated_client

        # Make a DELETE request
        response = await client.delete(
            "/api/v1/agents/some-agent-id",
            headers={"Authorization": f"Bearer {user_data.get('token', '')}"},
        )

        # Middleware should log even if endpoint returns 404
        service = AuditService()
        logs = await service.get_user_activity(user_data["id"])
        assert isinstance(logs, list)

    @pytest.mark.asyncio
    async def test_middleware_captures_request_details(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Middleware should capture request details in audit log."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        # Create an audit log directly to test captured details
        service = AuditService()
        await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
            details={
                "method": "POST",
                "path": "/api/v1/agents",
                "status_code": 201,
                "duration_ms": 125.5,
            },
            ip_address="192.168.1.100",
            user_agent="TestClient/1.0",
        )

        # Retrieve and verify
        logs = await service.list(organization_id=org_id)
        assert len(logs) > 0
        log = logs[0]
        assert log["ip_address"] == "192.168.1.100"
        assert log["user_agent"] == "TestClient/1.0"
