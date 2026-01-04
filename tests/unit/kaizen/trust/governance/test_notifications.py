"""
Tier 1 Unit Tests: Approval Notifications

Tests notification adapters without any infrastructure dependencies.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

from kaizen.trust.governance.types import (
    ApprovalStatus,
    ApprovalRequest,
)
from kaizen.trust.governance.notifications import (
    ApproverInfo,
    ApprovalNotificationService,
    EmailNotificationAdapter,
    SlackNotificationAdapter,
    TeamsNotificationAdapter,
    WebhookNotificationAdapter,
    SimpleApproverResolver,
)


class TestApproverInfo:
    """Tests for ApproverInfo dataclass."""

    def test_approver_info_creation(self):
        """Test creating approver info."""
        info = ApproverInfo(
            user_id="admin-001",
            email="admin@example.com",
            name="Admin User",
        )
        assert info.user_id == "admin-001"
        assert info.email == "admin@example.com"
        assert info.name == "Admin User"

    def test_approver_info_defaults(self):
        """Test approver info default values."""
        info = ApproverInfo(user_id="admin-001")
        assert info.email is None
        assert info.name is None
        assert "email" in info.notification_channels

    def test_approver_info_with_channels(self):
        """Test approver info with custom notification channels."""
        info = ApproverInfo(
            user_id="admin-001",
            notification_channels=["email", "slack", "teams"],
        )
        assert "email" in info.notification_channels
        assert "slack" in info.notification_channels
        assert "teams" in info.notification_channels


class TestSimpleApproverResolver:
    """Tests for SimpleApproverResolver."""

    @pytest.fixture
    def resolver(self):
        """Create a simple resolver with test user emails."""
        return SimpleApproverResolver(
            user_emails={
                "admin-001": "admin@example.com",
                "admin-002": "admin2@example.com",
                "user-001": "user@example.com",
            }
        )

    @pytest.mark.asyncio
    async def test_resolve_approvers_by_users(self, resolver):
        """Test resolving approvers from user list."""
        approvers = await resolver.resolve_approvers(
            roles=[],
            users=["admin-001", "admin-002"],
            organization_id="org-001",
        )
        assert len(approvers) == 2
        assert approvers[0].user_id == "admin-001"
        assert approvers[0].email == "admin@example.com"

    @pytest.mark.asyncio
    async def test_resolve_approvers_empty_list(self, resolver):
        """Test resolving with empty user list."""
        approvers = await resolver.resolve_approvers(
            roles=[],
            users=[],
            organization_id="org-001",
        )
        assert len(approvers) == 0

    @pytest.mark.asyncio
    async def test_resolve_approvers_unknown_user(self):
        """Test resolving with unknown user (no email)."""
        resolver = SimpleApproverResolver()
        approvers = await resolver.resolve_approvers(
            roles=[],
            users=["unknown-user"],
            organization_id="org-001",
        )
        assert len(approvers) == 1
        assert approvers[0].user_id == "unknown-user"
        assert approvers[0].email is None


class TestEmailNotificationAdapter:
    """Tests for EmailNotificationAdapter."""

    @pytest.fixture
    def adapter(self):
        """Create an email adapter."""
        return EmailNotificationAdapter(
            smtp_host="smtp.example.com",
            smtp_port=587,
            from_address="notifications@example.com",
        )

    @pytest.fixture
    def sample_request(self):
        """Create a sample approval request."""
        return ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Cost exceeds threshold",
            payload_summary="Execute financial transaction: transfer $10,000",
            estimated_cost=150.0,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )

    @pytest.fixture
    def sample_approver(self):
        """Create sample approver."""
        return ApproverInfo(
            user_id="admin-001",
            email="admin@example.com",
            name="Admin User",
        )

    def test_adapter_creation(self, adapter):
        """Test adapter creation."""
        assert adapter.smtp_host == "smtp.example.com"
        assert adapter.smtp_port == 587
        assert adapter.from_address == "notifications@example.com"

    @pytest.mark.asyncio
    async def test_send_approval_request_no_email(self, adapter, sample_request):
        """Test that send fails if approver has no email."""
        approver = ApproverInfo(user_id="admin-001")  # No email
        result = await adapter.send_approval_request(
            request=sample_request,
            approver=approver,
        )
        assert result is False

    @pytest.mark.asyncio
    async def test_send_approval_request_with_mock(self, adapter, sample_request, sample_approver):
        """Test send with mocked email."""
        with patch.object(adapter, "_send_email", new_callable=AsyncMock) as mock_send:
            result = await adapter.send_approval_request(
                request=sample_request,
                approver=sample_approver,
            )
            assert mock_send.called
            assert result is True


class TestSlackNotificationAdapter:
    """Tests for SlackNotificationAdapter."""

    @pytest.fixture
    def adapter(self):
        """Create a Slack adapter."""
        return SlackNotificationAdapter(
            webhook_url="https://hooks.slack.com/services/test",
            channel="#approvals",
        )

    @pytest.fixture
    def sample_request(self):
        """Create a sample approval request."""
        return ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Cost exceeds threshold",
            payload_summary="Execute financial transaction",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )

    @pytest.fixture
    def sample_approver(self):
        """Create sample approver."""
        return ApproverInfo(
            user_id="admin-001",
            email="admin@example.com",
        )

    def test_adapter_creation(self, adapter):
        """Test adapter creation."""
        assert "hooks.slack.com" in adapter.webhook_url
        assert adapter.channel == "#approvals"

    @pytest.mark.asyncio
    async def test_send_with_mock(self, adapter, sample_request, sample_approver):
        """Test send with mocked webhook."""
        with patch.object(adapter, "_post_webhook", new_callable=AsyncMock, return_value=True) as mock_post:
            result = await adapter.send_approval_request(
                request=sample_request,
                approver=sample_approver,
            )
            assert mock_post.called
            assert result is True


class TestTeamsNotificationAdapter:
    """Tests for TeamsNotificationAdapter."""

    @pytest.fixture
    def adapter(self):
        """Create a Teams adapter."""
        return TeamsNotificationAdapter(
            webhook_url="https://outlook.office.com/webhook/test",
        )

    @pytest.fixture
    def sample_request(self):
        """Create a sample approval request."""
        return ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Cost exceeds threshold",
            payload_summary="Execute financial transaction",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )

    @pytest.fixture
    def sample_approver(self):
        """Create sample approver."""
        return ApproverInfo(
            user_id="admin-001",
            email="admin@example.com",
        )

    def test_adapter_creation(self, adapter):
        """Test adapter creation."""
        assert "outlook.office.com" in adapter.webhook_url

    @pytest.mark.asyncio
    async def test_send_with_mock(self, adapter, sample_request, sample_approver):
        """Test send with mocked webhook."""
        with patch.object(adapter, "_post_webhook", new_callable=AsyncMock, return_value=True) as mock_post:
            result = await adapter.send_approval_request(
                request=sample_request,
                approver=sample_approver,
            )
            assert mock_post.called
            assert result is True


class TestWebhookNotificationAdapter:
    """Tests for WebhookNotificationAdapter."""

    @pytest.fixture
    def adapter(self):
        """Create a webhook adapter."""
        return WebhookNotificationAdapter(
            webhook_url="https://api.example.com/webhooks/approvals",
            headers={"Authorization": "Bearer test-token"},
        )

    @pytest.fixture
    def sample_request(self):
        """Create a sample approval request."""
        return ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Cost exceeds threshold",
            payload_summary="Execute financial transaction",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )

    @pytest.fixture
    def sample_approver(self):
        """Create sample approver."""
        return ApproverInfo(
            user_id="admin-001",
            email="admin@example.com",
        )

    def test_adapter_creation(self, adapter):
        """Test adapter creation."""
        assert adapter.webhook_url == "https://api.example.com/webhooks/approvals"
        assert "Authorization" in adapter.headers

    @pytest.mark.asyncio
    async def test_send_with_mock(self, adapter, sample_request, sample_approver):
        """Test send with mocked webhook."""
        with patch.object(adapter, "_post_webhook", new_callable=AsyncMock, return_value=True) as mock_post:
            result = await adapter.send_approval_request(
                request=sample_request,
                approver=sample_approver,
            )
            assert mock_post.called
            assert result is True


class TestApprovalNotificationService:
    """Tests for ApprovalNotificationService."""

    @pytest.fixture
    def service(self):
        """Create a notification service with mock adapters."""
        email_adapter = EmailNotificationAdapter(
            smtp_host="smtp.example.com",
            smtp_port=587,
            from_address="notifications@example.com",
        )
        resolver = SimpleApproverResolver(
            user_emails={
                "admin-001": "admin@example.com",
            }
        )
        service = ApprovalNotificationService(
            approver_resolver=resolver,
        )
        service.register_adapter("email", email_adapter)
        return service

    @pytest.fixture
    def sample_request(self):
        """Create a sample approval request."""
        return ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Cost exceeds threshold",
            payload_summary="Execute financial transaction",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )

    @pytest.mark.asyncio
    async def test_notify_approvers(self, service, sample_request):
        """Test notifying approvers."""
        # Mock the adapter send method
        adapter = service.adapters.get("email")
        with patch.object(adapter, "send_approval_request", new_callable=AsyncMock, return_value=True):
            results = await service.notify_approvers(
                request=sample_request,
                approver_roles=[],
                approver_users=["admin-001"],
            )
            assert "admin-001" in results
            assert results["admin-001"] is True

    @pytest.mark.asyncio
    async def test_notify_requestor(self, service, sample_request):
        """Test notifying requestor about decision."""
        adapter = service.adapters.get("email")
        with patch.object(adapter, "send_decision_notification", new_callable=AsyncMock, return_value=True):
            result = await service.notify_requestor(
                request=sample_request,
                decision="approved",
                reason="Approved for production",
            )
            assert result is True

    @pytest.mark.asyncio
    async def test_adapter_failure_handled(self, service, sample_request):
        """Test that adapter failure is handled gracefully."""
        adapter = service.adapters.get("email")
        with patch.object(adapter, "send_approval_request", new_callable=AsyncMock, side_effect=Exception("SMTP error")):
            # Should not raise, should return failure
            results = await service.notify_approvers(
                request=sample_request,
                approver_roles=[],
                approver_users=["admin-001"],
            )
            assert "admin-001" in results
            assert results["admin-001"] is False
