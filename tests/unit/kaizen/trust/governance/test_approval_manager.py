"""
Tier 1 Unit Tests: Approval Manager

Tests approval workflow management without any infrastructure dependencies.
"""

import pytest
from datetime import datetime, timedelta

from kaizen.trust.governance.types import (
    ApprovalStatus,
    ApprovalRequest,
    ApprovalCheckResult,
)
from kaizen.trust.governance.config import (
    ApprovalTriggerConfig,
    ApprovalWorkflowConfig,
)
from kaizen.trust.governance.store import InMemoryApprovalStore
from kaizen.trust.governance.approval_manager import (
    ExternalAgentApprovalManager,
    ApprovalNotFoundError,
    UnauthorizedApproverError,
    SelfApprovalNotAllowedError,
    ApprovalExpiredError,
    AlreadyDecidedError,
)


class TestExternalAgentApprovalManager:
    """Tests for ExternalAgentApprovalManager."""

    @pytest.fixture
    def manager(self):
        """Create an approval manager with default config."""
        return ExternalAgentApprovalManager(
            store=InMemoryApprovalStore(),
            trigger_config=ApprovalTriggerConfig(),
            workflow_config=ApprovalWorkflowConfig(),
        )

    @pytest.fixture
    def manager_with_cost_threshold(self):
        """Create a manager with cost threshold."""
        return ExternalAgentApprovalManager(
            store=InMemoryApprovalStore(),
            trigger_config=ApprovalTriggerConfig(cost_threshold=100.0),
            workflow_config=ApprovalWorkflowConfig(),
        )

    @pytest.fixture
    def manager_no_self_approval(self):
        """Create a manager that disallows self-approval."""
        return ExternalAgentApprovalManager(
            store=InMemoryApprovalStore(),
            trigger_config=ApprovalTriggerConfig(),
            workflow_config=ApprovalWorkflowConfig(allow_self_approval=False),
        )

    @pytest.fixture
    def manager_multi_approver(self):
        """Create a manager requiring multiple approvers."""
        return ExternalAgentApprovalManager(
            store=InMemoryApprovalStore(),
            trigger_config=ApprovalTriggerConfig(),
            workflow_config=ApprovalWorkflowConfig(require_multiple_approvers=2),
        )

    @pytest.mark.asyncio
    async def test_check_approval_not_required(self, manager):
        """Test check when approval not required."""
        result = await manager.check_approval_required(
            agent_id="agent-001",
            payload={},
            user_id="user-001",
            organization_id="org-001",
        )
        assert result.required is False

    @pytest.mark.asyncio
    async def test_check_approval_required_cost_threshold(self, manager_with_cost_threshold):
        """Test check when cost exceeds threshold."""
        result = await manager_with_cost_threshold.check_approval_required(
            agent_id="agent-001",
            payload={},
            user_id="user-001",
            organization_id="org-001",
            estimated_cost=150.0,
        )
        assert result.required is True
        assert "cost_threshold" in result.triggers_matched

    @pytest.mark.asyncio
    async def test_create_approval_request(self, manager):
        """Test creating an approval request."""
        request = await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Cost exceeds threshold",
        )
        assert request.id is not None
        assert request.external_agent_id == "agent-001"
        assert request.status == ApprovalStatus.PENDING

    @pytest.mark.asyncio
    async def test_create_approval_request_with_cost(self, manager):
        """Test creating request with estimated cost."""
        request = await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Cost exceeds threshold",
            estimated_cost=150.0,
        )
        assert request.estimated_cost == 150.0

    @pytest.mark.asyncio
    async def test_create_approval_request_with_expiry(self, manager):
        """Test that created request has expiry set."""
        request = await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        assert request.expires_at is not None
        # Should expire in the future
        assert request.expires_at > datetime.utcnow()

    @pytest.mark.asyncio
    async def test_get_request(self, manager):
        """Test getting a request by ID."""
        created = await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        retrieved = await manager.get_request(created.id)
        assert retrieved is not None
        assert retrieved.id == created.id

    @pytest.mark.asyncio
    async def test_get_request_nonexistent(self, manager):
        """Test getting a nonexistent request."""
        retrieved = await manager.get_request("nonexistent-id")
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_approve_request(self, manager):
        """Test approving a request."""
        request = await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        approved = await manager.approve(
            request_id=request.id,
            approver_id="admin-001",
            reason="Approved for production",
        )
        assert approved.status == ApprovalStatus.APPROVED
        assert len(approved.approvals) == 1
        assert approved.approvals[0].approver_id == "admin-001"

    @pytest.mark.asyncio
    async def test_approve_nonexistent_request(self, manager):
        """Test approving a nonexistent request."""
        with pytest.raises(ApprovalNotFoundError):
            await manager.approve(
                request_id="nonexistent-id",
                approver_id="admin-001",
            )

    @pytest.mark.asyncio
    async def test_approve_expired_request(self, manager):
        """Test approving an expired request."""
        # Create a request
        request = await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        # Manually set expiry to past
        request.expires_at = datetime.utcnow() - timedelta(hours=1)
        await manager.store.save(request)

        with pytest.raises(ApprovalExpiredError):
            await manager.approve(
                request_id=request.id,
                approver_id="admin-001",
            )

    @pytest.mark.asyncio
    async def test_approve_already_approved(self, manager):
        """Test approving an already approved request."""
        request = await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        await manager.approve(
            request_id=request.id,
            approver_id="admin-001",
        )

        with pytest.raises(AlreadyDecidedError):
            await manager.approve(
                request_id=request.id,
                approver_id="admin-002",
            )

    @pytest.mark.asyncio
    async def test_self_approval_not_allowed(self, manager_no_self_approval):
        """Test that self-approval is blocked when configured."""
        request = await manager_no_self_approval.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",  # Requester
            organization_id="org-001",
            trigger_reason="Policy",
        )
        with pytest.raises(SelfApprovalNotAllowedError):
            await manager_no_self_approval.approve(
                request_id=request.id,
                approver_id="user-001",  # Same as requester
            )

    @pytest.mark.asyncio
    async def test_reject_request(self, manager):
        """Test rejecting a request."""
        request = await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        rejected = await manager.reject(
            request_id=request.id,
            approver_id="admin-001",
            reason="Not authorized for this operation",
        )
        assert rejected.status == ApprovalStatus.REJECTED
        assert len(rejected.rejections) == 1
        assert rejected.rejections[0].reason == "Not authorized for this operation"

    @pytest.mark.asyncio
    async def test_reject_nonexistent_request(self, manager):
        """Test rejecting a nonexistent request."""
        with pytest.raises(ApprovalNotFoundError):
            await manager.reject(
                request_id="nonexistent-id",
                approver_id="admin-001",
                reason="Rejected",
            )

    @pytest.mark.asyncio
    async def test_reject_already_rejected(self, manager):
        """Test rejecting an already rejected request."""
        request = await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        await manager.reject(
            request_id=request.id,
            approver_id="admin-001",
            reason="Not authorized",
        )

        with pytest.raises(AlreadyDecidedError):
            await manager.reject(
                request_id=request.id,
                approver_id="admin-002",
                reason="Also rejected",
            )

    @pytest.mark.asyncio
    async def test_multi_approver_partial_approval(self, manager_multi_approver):
        """Test that request remains pending after partial approval."""
        request = await manager_multi_approver.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        # First approval
        partial = await manager_multi_approver.approve(
            request_id=request.id,
            approver_id="admin-001",
        )
        assert partial.status == ApprovalStatus.PENDING
        assert len(partial.approvals) == 1

    @pytest.mark.asyncio
    async def test_multi_approver_full_approval(self, manager_multi_approver):
        """Test that request is approved after all required approvals."""
        request = await manager_multi_approver.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        # First approval
        await manager_multi_approver.approve(
            request_id=request.id,
            approver_id="admin-001",
        )
        # Second approval
        approved = await manager_multi_approver.approve(
            request_id=request.id,
            approver_id="admin-002",
        )
        assert approved.status == ApprovalStatus.APPROVED
        assert len(approved.approvals) == 2

    @pytest.mark.asyncio
    async def test_get_pending_requests(self, manager):
        """Test getting pending requests for an approver."""
        # Create multiple requests
        await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        await manager.create_approval_request(
            agent_id="agent-002",
            payload={"action": "execute"},
            user_id="user-002",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        await manager.create_approval_request(
            agent_id="agent-003",
            payload={"action": "execute"},
            user_id="user-003",
            organization_id="org-002",  # Different org
            trigger_reason="Policy",
        )

        pending = await manager.get_pending_requests(
            approver_id="admin-001",
            organization_id="org-001",
        )
        assert len(pending) == 2

    @pytest.mark.asyncio
    async def test_process_expired_requests(self, manager):
        """Test processing expired requests."""
        # Create a request
        request = await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        # Manually expire it
        request.expires_at = datetime.utcnow() - timedelta(hours=1)
        await manager.store.save(request)

        # Process expired
        expired = await manager.process_expired_requests()
        assert len(expired) == 1
        assert expired[0].status == ApprovalStatus.EXPIRED

    @pytest.mark.asyncio
    async def test_escalate_request(self, manager):
        """Test escalating a request."""
        request = await manager.create_approval_request(
            agent_id="agent-001",
            payload={"action": "execute"},
            user_id="user-001",
            organization_id="org-001",
            trigger_reason="Policy",
        )
        escalated = await manager.escalate(
            request_id=request.id,
            reason="No response from primary approvers",
        )
        assert escalated.status == ApprovalStatus.ESCALATED

    @pytest.mark.asyncio
    async def test_escalate_nonexistent_request(self, manager):
        """Test escalating a nonexistent request."""
        with pytest.raises(ApprovalNotFoundError):
            await manager.escalate(
                request_id="nonexistent-id",
                reason="Escalation",
            )


class TestApprovalErrors:
    """Tests for approval error classes."""

    def test_approval_not_found_error(self):
        """Test ApprovalNotFoundError."""
        error = ApprovalNotFoundError("req-001")
        assert "req-001" in str(error)

    def test_unauthorized_approver_error(self):
        """Test UnauthorizedApproverError."""
        error = UnauthorizedApproverError("user-001")
        assert "user-001" in str(error)

    def test_self_approval_not_allowed_error(self):
        """Test SelfApprovalNotAllowedError."""
        error = SelfApprovalNotAllowedError()
        assert "self" in str(error).lower()

    def test_approval_expired_error(self):
        """Test ApprovalExpiredError."""
        error = ApprovalExpiredError("req-001")
        assert "req-001" in str(error)
        assert "expired" in str(error).lower()

    def test_already_decided_error(self):
        """Test AlreadyDecidedError."""
        error = AlreadyDecidedError("req-001", ApprovalStatus.APPROVED)
        assert "req-001" in str(error)
        assert error.status == ApprovalStatus.APPROVED
