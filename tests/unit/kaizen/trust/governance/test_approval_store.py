"""
Tier 1 Unit Tests: Approval Store

Tests approval request storage without any infrastructure dependencies.
"""

import pytest
from datetime import datetime, timedelta

from kaizen.trust.governance.types import (
    ApprovalStatus,
    ApprovalRequest,
    ApprovalDecision,
)
from kaizen.trust.governance.store import (
    InMemoryApprovalStore,
)


class TestApprovalRequest:
    """Tests for ApprovalRequest dataclass."""

    def test_approval_request_creation(self):
        """Test creating an approval request."""
        request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Cost exceeds threshold",
            payload_summary="Execute financial transaction",
        )
        assert request.id == "req-001"
        assert request.external_agent_id == "agent-001"
        assert request.status == ApprovalStatus.PENDING
        assert request.required_approvals == 1

    def test_approval_request_with_cost(self):
        """Test approval request with estimated cost."""
        request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Cost exceeds threshold",
            payload_summary="Transaction",
            estimated_cost=150.0,
        )
        assert request.estimated_cost == 150.0

    def test_approval_request_with_tokens(self):
        """Test approval request with estimated tokens."""
        request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Token limit",
            payload_summary="Large query",
            estimated_tokens=10000,
        )
        assert request.estimated_tokens == 10000

    def test_approval_request_with_team(self):
        """Test approval request with team."""
        request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            requested_by_team_id="team-001",
            trigger_reason="Team policy",
            payload_summary="Team operation",
        )
        assert request.requested_by_team_id == "team-001"

    def test_approval_request_with_expiry(self):
        """Test approval request with expiry."""
        expires = datetime.utcnow() + timedelta(hours=24)
        request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Policy",
            payload_summary="Operation",
            expires_at=expires,
        )
        assert request.expires_at is not None

    def test_is_approved_single_approval(self):
        """Test is_approved with single approval requirement."""
        request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Policy",
            payload_summary="Operation",
            required_approvals=1,
        )
        assert request.is_approved() is False

        # Add one approval
        request.approvals.append(
            ApprovalDecision(
                approver_id="admin-001",
                decision="approve",
            )
        )
        assert request.is_approved() is True

    def test_is_approved_multiple_approvals(self):
        """Test is_approved with multiple approval requirement."""
        request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Policy",
            payload_summary="Operation",
            required_approvals=2,
        )
        assert request.is_approved() is False

        # Add one approval
        request.approvals.append(
            ApprovalDecision(
                approver_id="admin-001",
                decision="approve",
            )
        )
        assert request.is_approved() is False

        # Add second approval
        request.approvals.append(
            ApprovalDecision(
                approver_id="admin-002",
                decision="approve",
            )
        )
        assert request.is_approved() is True

    def test_is_expired_not_expired(self):
        """Test is_expired when not expired."""
        request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Policy",
            payload_summary="Operation",
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )
        assert request.is_expired() is False

    def test_is_expired_expired(self):
        """Test is_expired when expired."""
        request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Policy",
            payload_summary="Operation",
            expires_at=datetime.utcnow() - timedelta(hours=1),
        )
        assert request.is_expired() is True

    def test_is_expired_no_expiry(self):
        """Test is_expired with no expiry set."""
        request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Policy",
            payload_summary="Operation",
            expires_at=None,
        )
        assert request.is_expired() is False


class TestApprovalDecision:
    """Tests for ApprovalDecision dataclass."""

    def test_approval_decision_approve(self):
        """Test creating an approve decision."""
        decision = ApprovalDecision(
            approver_id="admin-001",
            decision="approve",
        )
        assert decision.approver_id == "admin-001"
        assert decision.decision == "approve"
        assert decision.timestamp is not None

    def test_approval_decision_reject(self):
        """Test creating a reject decision."""
        decision = ApprovalDecision(
            approver_id="admin-001",
            decision="reject",
            reason="Not authorized for this operation",
        )
        assert decision.decision == "reject"
        assert decision.reason == "Not authorized for this operation"

    def test_approval_decision_with_metadata(self):
        """Test decision with metadata."""
        decision = ApprovalDecision(
            approver_id="admin-001",
            decision="approve",
            metadata={"source": "api", "ip": "192.168.1.1"},
        )
        assert decision.metadata["source"] == "api"


class TestInMemoryApprovalStore:
    """Tests for InMemoryApprovalStore."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store."""
        return InMemoryApprovalStore()

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
        )

    @pytest.mark.asyncio
    async def test_save_and_get(self, store, sample_request):
        """Test saving and retrieving a request."""
        await store.save(sample_request)
        retrieved = await store.get(sample_request.id)
        assert retrieved is not None
        assert retrieved.id == sample_request.id
        assert retrieved.external_agent_id == sample_request.external_agent_id

    @pytest.mark.asyncio
    async def test_get_nonexistent(self, store):
        """Test getting a nonexistent request."""
        retrieved = await store.get("nonexistent-id")
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_get_pending_for_approver(self, store):
        """Test getting pending requests for an approver."""
        # Create multiple requests
        request1 = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Policy",
            payload_summary="Operation 1",
        )
        request2 = ApprovalRequest(
            id="req-002",
            external_agent_id="agent-002",
            organization_id="org-001",
            requested_by_user_id="user-002",
            trigger_reason="Policy",
            payload_summary="Operation 2",
        )
        request3 = ApprovalRequest(
            id="req-003",
            external_agent_id="agent-003",
            organization_id="org-002",  # Different org
            requested_by_user_id="user-003",
            trigger_reason="Policy",
            payload_summary="Operation 3",
        )

        await store.save(request1)
        await store.save(request2)
        await store.save(request3)

        # Get pending for org-001
        pending = await store.get_pending_for_approver(
            approver_id="admin-001",
            organization_id="org-001",
        )
        assert len(pending) == 2
        assert all(r.organization_id == "org-001" for r in pending)

    @pytest.mark.asyncio
    async def test_get_pending_for_approver_all_orgs(self, store):
        """Test getting pending requests for all organizations."""
        request1 = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Policy",
            payload_summary="Operation 1",
        )
        request2 = ApprovalRequest(
            id="req-002",
            external_agent_id="agent-002",
            organization_id="org-002",
            requested_by_user_id="user-002",
            trigger_reason="Policy",
            payload_summary="Operation 2",
        )

        await store.save(request1)
        await store.save(request2)

        # Get all pending without org filter
        pending = await store.get_pending_for_approver(approver_id="admin-001")
        assert len(pending) == 2

    @pytest.mark.asyncio
    async def test_get_pending_excludes_non_pending(self, store):
        """Test that non-pending requests are excluded."""
        pending_request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Policy",
            payload_summary="Operation 1",
            status=ApprovalStatus.PENDING,
        )
        approved_request = ApprovalRequest(
            id="req-002",
            external_agent_id="agent-002",
            organization_id="org-001",
            requested_by_user_id="user-002",
            trigger_reason="Policy",
            payload_summary="Operation 2",
            status=ApprovalStatus.APPROVED,
        )
        rejected_request = ApprovalRequest(
            id="req-003",
            external_agent_id="agent-003",
            organization_id="org-001",
            requested_by_user_id="user-003",
            trigger_reason="Policy",
            payload_summary="Operation 3",
            status=ApprovalStatus.REJECTED,
        )

        await store.save(pending_request)
        await store.save(approved_request)
        await store.save(rejected_request)

        pending = await store.get_pending_for_approver(
            approver_id="admin-001",
            organization_id="org-001",
        )
        assert len(pending) == 1
        assert pending[0].id == "req-001"

    @pytest.mark.asyncio
    async def test_get_pending_for_agent(self, store):
        """Test getting pending requests for an agent."""
        request1 = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Policy",
            payload_summary="Operation 1",
        )
        request2 = ApprovalRequest(
            id="req-002",
            external_agent_id="agent-001",  # Same agent
            organization_id="org-001",
            requested_by_user_id="user-002",
            trigger_reason="Policy",
            payload_summary="Operation 2",
        )
        request3 = ApprovalRequest(
            id="req-003",
            external_agent_id="agent-002",  # Different agent
            organization_id="org-001",
            requested_by_user_id="user-003",
            trigger_reason="Policy",
            payload_summary="Operation 3",
        )

        await store.save(request1)
        await store.save(request2)
        await store.save(request3)

        pending = await store.get_pending_for_agent(
            agent_id="agent-001",
            organization_id="org-001",
        )
        assert len(pending) == 2
        assert all(r.external_agent_id == "agent-001" for r in pending)

    @pytest.mark.asyncio
    async def test_get_expired(self, store):
        """Test getting expired requests."""
        expired_request = ApprovalRequest(
            id="req-001",
            external_agent_id="agent-001",
            organization_id="org-001",
            requested_by_user_id="user-001",
            trigger_reason="Policy",
            payload_summary="Operation 1",
            expires_at=datetime.utcnow() - timedelta(hours=1),
        )
        valid_request = ApprovalRequest(
            id="req-002",
            external_agent_id="agent-002",
            organization_id="org-001",
            requested_by_user_id="user-002",
            trigger_reason="Policy",
            payload_summary="Operation 2",
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )

        await store.save(expired_request)
        await store.save(valid_request)

        expired = await store.get_expired()
        assert len(expired) == 1
        assert expired[0].id == "req-001"

    @pytest.mark.asyncio
    async def test_delete(self, store, sample_request):
        """Test deleting a request."""
        await store.save(sample_request)

        # Verify it exists
        retrieved = await store.get(sample_request.id)
        assert retrieved is not None

        # Delete it
        await store.delete(sample_request.id)

        # Verify it's gone
        retrieved = await store.get(sample_request.id)
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent(self, store):
        """Test deleting a nonexistent request (should not raise)."""
        await store.delete("nonexistent-id")  # Should not raise

    @pytest.mark.asyncio
    async def test_update_request(self, store, sample_request):
        """Test updating a request."""
        await store.save(sample_request)

        # Update the request
        sample_request.status = ApprovalStatus.APPROVED
        sample_request.approvals.append(
            ApprovalDecision(
                approver_id="admin-001",
                decision="approve",
            )
        )
        await store.save(sample_request)

        # Verify update
        retrieved = await store.get(sample_request.id)
        assert retrieved.status == ApprovalStatus.APPROVED
        assert len(retrieved.approvals) == 1
