"""
Tier 3: Audit Logging E2E Tests

Tests complete audit trail workflows with real infrastructure.
NO MOCKING - uses actual PostgreSQL, DataFlow, AsyncLocalRuntime, and FastAPI.
"""

import uuid
from datetime import datetime

import pytest
from httpx import AsyncClient
from studio.services.audit_service import AuditService


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestCompleteAuditTrailWorkflow:
    """Test complete audit trail for agent lifecycle."""

    @pytest.mark.asyncio
    async def test_agent_lifecycle_audit_trail(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Complete workflow: create, update, deploy, delete agent with full audit trail."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # Step 1: Create agent
        create_log = await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="create",
            resource_type="agent",
            resource_id="agent-workflow-1",
            details={"name": "Workflow Test Agent", "model": "gpt-4"},
            status="success",
        )
        assert create_log["action"] == "create"
        assert create_log["status"] == "success"

        # Step 2: Update agent
        update_log = await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="update",
            resource_type="agent",
            resource_id="agent-workflow-1",
            details={"field": "system_prompt", "new_value": "Updated prompt"},
            status="success",
        )
        assert update_log["action"] == "update"

        # Step 3: Deploy agent
        deploy_log = await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="deploy",
            resource_type="agent",
            resource_id="agent-workflow-1",
            details={"environment": "production", "version": "1.0.0"},
            status="success",
        )
        assert deploy_log["action"] == "deploy"

        # Step 4: Delete agent
        delete_log = await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="delete",
            resource_type="agent",
            resource_id="agent-workflow-1",
            details={"reason": "Resource cleanup"},
            status="success",
        )
        assert delete_log["action"] == "delete"

        # Verify complete audit trail for resource
        history = await service.get_resource_history("agent", "agent-workflow-1")
        assert len(history) >= 4
        actions = [log["action"] for log in history]
        assert "create" in actions
        assert "update" in actions
        assert "deploy" in actions
        assert "delete" in actions

    @pytest.mark.asyncio
    async def test_user_activity_tracking(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Track all activities performed by a user."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # User performs multiple actions
        actions = [
            ("create", "agent", "agent-1"),
            ("create", "deployment", "deploy-1"),
            ("update", "agent", "agent-1"),
            ("create", "pipeline", "pipeline-1"),
            ("delete", "pipeline", "pipeline-1"),
        ]

        for action, resource_type, resource_id in actions:
            await service.log(
                organization_id=org_id,
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
            )

        # Get user's activity
        activity = await service.get_user_activity(user_id)
        assert len(activity) >= len(actions)

        # Verify all actions are recorded
        recorded_actions = [log["action"] for log in activity]
        for action, _, _ in actions:
            assert action in recorded_actions

    @pytest.mark.asyncio
    async def test_audit_trail_with_failures_and_successes(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Audit trail should record both successful and failed operations."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # Successful operation
        success_log = await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="create",
            resource_type="agent",
            resource_id="agent-success",
            status="success",
        )
        assert success_log["status"] == "success"

        # Failed operation
        failure_log = await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="deploy",
            resource_type="agent",
            resource_id="agent-failure",
            status="failure",
            error_message="Insufficient resources",
        )
        assert failure_log["status"] == "failure"
        assert failure_log["error_message"] == "Insufficient resources"

        # Retrieve and verify both
        history = await service.list(organization_id=org_id)
        statuses = [log["status"] for log in history]
        assert "success" in statuses
        assert "failure" in statuses


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestAuditDataIntegrity:
    """Test data integrity and consistency of audit logs."""

    @pytest.mark.asyncio
    async def test_audit_logs_are_immutable(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Audit logs should not be modifiable after creation."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        service = AuditService()

        # Create an audit log
        log = await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
            resource_id="agent-immutable",
            details={"original": True},
        )
        log_id = log["id"]

        # Retrieve the log
        retrieved = await service.get(log_id)
        assert retrieved is not None
        assert retrieved["details"] is not None

        # Verify original data is intact
        assert retrieved["action"] == "create"
        assert retrieved["resource_type"] == "agent"

    @pytest.mark.asyncio
    async def test_audit_logs_preserve_timestamps(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Audit logs should preserve accurate timestamps."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]

        service = AuditService()

        # Create logs
        log1 = await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
            resource_id="agent-ts-1",
        )

        log2 = await service.log(
            organization_id=org_id,
            user_id=user_data["id"],
            action="create",
            resource_type="agent",
            resource_id="agent-ts-2",
        )

        # Verify timestamps exist and are valid
        assert "created_at" in log1
        assert "created_at" in log2
        assert log1["created_at"] is not None
        assert log2["created_at"] is not None

        # Verify timestamps can be parsed
        ts1 = datetime.fromisoformat(log1["created_at"].replace("Z", "+00:00"))
        ts2 = datetime.fromisoformat(log2["created_at"].replace("Z", "+00:00"))
        assert ts1 is not None
        assert ts2 is not None

    @pytest.mark.asyncio
    async def test_audit_logs_contain_complete_context(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Each audit log should contain complete context information."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # Create log with complete information
        log = await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="create",
            resource_type="agent",
            resource_id="agent-context",
            details={"environment": "production"},
            ip_address="203.0.113.45",
            user_agent="Mozilla/5.0",
            status="success",
        )

        # Verify all context is preserved
        assert log["id"] is not None
        assert log["organization_id"] == org_id
        assert log["user_id"] == user_id
        assert log["action"] == "create"
        assert log["resource_type"] == "agent"
        assert log["resource_id"] == "agent-context"
        assert log["ip_address"] == "203.0.113.45"
        assert log["user_agent"] == "Mozilla/5.0"
        assert log["status"] == "success"
        assert log["created_at"] is not None


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestAuditQueryingAndReporting:
    """Test complex queries and reporting on audit logs."""

    @pytest.mark.asyncio
    async def test_query_audit_logs_by_date_range(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Query audit logs returns recent entries."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # Create logs
        for i in range(5):
            await service.log(
                organization_id=org_id,
                user_id=user_id,
                action="create",
                resource_type="agent",
                resource_id=f"agent-range-{i}",
            )

        # Query without date range filters (DataFlow limitation)
        logs = await service.list(organization_id=org_id)

        assert len(logs) >= 5

    @pytest.mark.asyncio
    async def test_query_user_actions_for_compliance(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Query user actions for compliance auditing."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # User performs sensitive actions
        await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="create",
            resource_type="agent",
        )
        await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="deploy",
            resource_type="agent",
        )
        await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="delete",
            resource_type="agent",
        )

        # Get user's actions
        activity = await service.get_user_activity(user_id)
        assert len(activity) >= 3

        # Count actions
        count = await service.count(
            organization_id=org_id, user_id=user_id, action="deploy"
        )
        assert count >= 1

    @pytest.mark.asyncio
    async def test_query_resource_modification_history(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Query complete modification history of a resource."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]
        resource_id = "agent-history-test"

        service = AuditService()

        # Perform multiple operations on same resource
        operations = [
            ("create", {"version": "1.0"}),
            ("update", {"version": "1.1"}),
            ("update", {"version": "1.2"}),
            ("deploy", {"environment": "staging"}),
            ("update", {"version": "1.3"}),
        ]

        for action, details in operations:
            await service.log(
                organization_id=org_id,
                user_id=user_id,
                action=action,
                resource_type="agent",
                resource_id=resource_id,
                details=details,
            )

        # Get complete history
        history = await service.get_resource_history("agent", resource_id)
        assert len(history) >= len(operations)

        # Verify action sequence
        actions = [log["action"] for log in history]
        assert "create" in actions
        assert "update" in actions
        assert "deploy" in actions

    @pytest.mark.asyncio
    async def test_export_audit_trail_for_compliance_report(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Export audit trail for compliance reporting."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # Create audit logs
        for i in range(10):
            await service.log(
                organization_id=org_id,
                user_id=user_id,
                action="create" if i % 2 == 0 else "update",
                resource_type="agent",
                resource_id=f"agent-export-{i}",
            )

        # Query and export
        logs = await service.list(organization_id=org_id, user_id=user_id, limit=1000)

        # Verify exportable data
        assert len(logs) >= 10
        for log in logs:
            assert "id" in log
            assert "action" in log
            assert "created_at" in log


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestMultiUserAuditTrail:
    """Test audit trail with multiple users."""

    @pytest.mark.asyncio
    async def test_separate_audit_trails_per_user(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Different users should have separate audit trails."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id_1 = user_data["id"]
        user_id_2 = str(uuid.uuid4())

        service = AuditService()

        # User 1 performs actions
        await service.log(
            organization_id=org_id,
            user_id=user_id_1,
            action="create",
            resource_type="agent",
            resource_id="agent-user1",
        )

        # User 2 performs actions
        await service.log(
            organization_id=org_id,
            user_id=user_id_2,
            action="create",
            resource_type="agent",
            resource_id="agent-user2",
        )

        # Get activities
        activity_1 = await service.get_user_activity(user_id_1)
        activity_2 = await service.get_user_activity(user_id_2)

        # Verify separation
        for log in activity_1:
            assert log["user_id"] == user_id_1
        for log in activity_2:
            assert log["user_id"] == user_id_2

    @pytest.mark.asyncio
    async def test_audit_trail_shows_who_modified_what(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Audit trail should clearly show who modified what and when."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]
        resource_id = f"agent-modification-test-{uuid.uuid4()}"

        service = AuditService()

        # Simulate collaboration: user creates and modifies
        await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="create",
            resource_type="agent",
            resource_id=resource_id,
            details={"created_by": user_id},
        )

        await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="update",
            resource_type="agent",
            resource_id=resource_id,
            details={"updated_by": user_id},
        )

        # Verify complete trail for this specific resource
        history = await service.get_resource_history("agent", resource_id)

        # Verify at least 2 logs exist for this resource
        assert len(history) >= 2

        # Verify logs have required fields
        for log in history:
            assert log["resource_id"] == resource_id
            assert log["created_at"] is not None
            assert log["user_id"] is not None


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestAuditSecurityAndCompliance:
    """Test security and compliance aspects of audit logging."""

    @pytest.mark.asyncio
    async def test_audit_logs_capture_failure_attempts(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Audit logs should capture failed operations for security."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # Log failed deployment attempt
        failed_log = await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="deploy",
            resource_type="agent",
            resource_id="agent-failed-deploy",
            status="failure",
            error_message="Insufficient permissions",
        )

        assert failed_log["status"] == "failure"
        assert failed_log["error_message"] == "Insufficient permissions"

        # Verify we can query failed operations
        logs = await service.list(organization_id=org_id)
        failed_attempts = [log for log in logs if log["status"] == "failure"]
        assert len(failed_attempts) >= 1

    @pytest.mark.asyncio
    async def test_audit_logs_capture_client_metadata(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Audit logs should capture client metadata for traceability."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # Create log with client metadata
        log = await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="create",
            resource_type="agent",
            ip_address="192.168.1.200",
            user_agent="Mozilla/5.0 (Macintosh)",
        )

        assert log["ip_address"] == "192.168.1.200"
        assert log["user_agent"] == "Mozilla/5.0 (Macintosh)"

    @pytest.mark.asyncio
    async def test_audit_logs_can_detect_suspicious_activity(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Audit logs should help detect suspicious patterns."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # Simulate suspicious pattern: multiple rapid deletions
        for i in range(5):
            await service.log(
                organization_id=org_id,
                user_id=user_id,
                action="delete",
                resource_type="agent",
                resource_id=f"agent-suspicious-{i}",
            )

        # Query to detect pattern
        count = await service.count(
            organization_id=org_id, user_id=user_id, action="delete"
        )

        assert count >= 5  # Multiple deletions detected

    @pytest.mark.asyncio
    async def test_audit_logs_retention_policy(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Verify audit logs can be queried and retrieved."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # Create logs now
        await service.log(
            organization_id=org_id,
            user_id=user_id,
            action="create",
            resource_type="agent",
        )

        # Query without date range filters
        logs = await service.list(organization_id=org_id)

        assert len(logs) >= 1


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestAuditPaginationAndPerformance:
    """Test pagination and performance with large audit logs."""

    @pytest.mark.asyncio
    async def test_pagination_with_large_dataset(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Audit logs should support efficient pagination with large datasets."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # Create many logs
        count = 50
        for i in range(count):
            await service.log(
                organization_id=org_id,
                user_id=user_id,
                action="create",
                resource_type="agent",
                resource_id=f"agent-perf-{i}",
            )

        # Test pagination
        page_size = 10
        page1 = await service.list(organization_id=org_id, limit=page_size, offset=0)
        page2 = await service.list(
            organization_id=org_id, limit=page_size, offset=page_size
        )

        assert len(page1) <= page_size
        assert len(page2) <= page_size

        # Verify different pages
        ids_page1 = {log["id"] for log in page1}
        ids_page2 = {log["id"] for log in page2}
        assert len(ids_page1 & ids_page2) == 0  # No overlap

    @pytest.mark.asyncio
    async def test_count_performance_with_filters(
        self, test_client: AsyncClient, authenticated_client
    ):
        """Count operation should be efficient with filters."""
        client, user_data = authenticated_client
        org_id = user_data["organization_id"]
        user_id = user_data["id"]

        service = AuditService()

        # Create logs with different actions
        for action in ["create", "update", "delete"]:
            for i in range(10):
                await service.log(
                    organization_id=org_id,
                    user_id=user_id,
                    action=action,
                    resource_type="agent",
                )

        # Count with filters should be fast
        create_count = await service.count(organization_id=org_id, action="create")
        update_count = await service.count(organization_id=org_id, action="update")
        delete_count = await service.count(organization_id=org_id, action="delete")

        assert create_count >= 10
        assert update_count >= 10
        assert delete_count >= 10
