"""
External Agent Approval Manager Module

Provides the ExternalAgentApprovalManager class for human-in-the-loop
approval workflows for sensitive external agent operations.

Features:
- Configurable approval triggers (cost, pattern, rate-based)
- Multi-approver support with escalation
- Timeout and expiration handling
- Full audit trail
- Notification integration
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Protocol

from studio_kaizen.trust.governance.config import (
    ApprovalTriggerConfig,
    ApprovalWorkflowConfig,
)
from studio_kaizen.trust.governance.store import (
    ApprovalStore,
    InMemoryApprovalStore,
)
from studio_kaizen.trust.governance.triggers import (
    ApprovalTriggerEvaluator,
    TriggerContext,
    InMemoryHistoryProvider,
)
from studio_kaizen.trust.governance.types import (
    ApprovalCheckResult,
    ApprovalDecision,
    ApprovalRequest,
    ApprovalStatus,
)

logger = logging.getLogger(__name__)


class NotificationService(Protocol):
    """Protocol for notification service."""

    async def notify_approvers(
        self,
        request: ApprovalRequest,
        approver_roles: list[str],
        approver_users: list[str]
    ) -> None:
        """Send notifications to approvers."""
        ...

    async def notify_requestor(
        self,
        request: ApprovalRequest,
        decision: str,
        reason: str | None
    ) -> None:
        """Notify the requestor of a decision."""
        ...


class ApprovalNotFoundError(Exception):
    """Raised when approval request is not found."""

    def __init__(self, request_id: str):
        self.request_id = request_id
        super().__init__(f"Approval request not found: {request_id}")


class UnauthorizedApproverError(Exception):
    """Raised when approver is not authorized."""

    def __init__(self, approver_id: str):
        self.approver_id = approver_id
        super().__init__(f"Approver not authorized: {approver_id}")


class SelfApprovalNotAllowedError(Exception):
    """Raised when self-approval is attempted but not allowed."""

    def __init__(self):
        super().__init__("Self-approval is not allowed")


class ApprovalExpiredError(Exception):
    """Raised when approval request has expired."""

    def __init__(self, request_id: str):
        self.request_id = request_id
        super().__init__(f"Approval request has expired: {request_id}")


class AlreadyDecidedError(Exception):
    """Raised when trying to decide on an already-decided request."""

    def __init__(self, request_id: str, status: ApprovalStatus):
        self.request_id = request_id
        self.status = status
        super().__init__(f"Request {request_id} already has status: {status.value}")


class ExternalAgentApprovalManager:
    """
    Approval manager for external agent invocations.

    Provides human-in-the-loop approval workflows for sensitive operations.

    Examples:
        >>> # Basic setup
        >>> trigger_config = ApprovalTriggerConfig(
        ...     cost_threshold=100.0,
        ...     require_first_invocation=True
        ... )
        >>> workflow_config = ApprovalWorkflowConfig(
        ...     timeout=timedelta(hours=24),
        ...     approver_roles=["admin"]
        ... )
        >>> manager = ExternalAgentApprovalManager(
        ...     trigger_config=trigger_config,
        ...     workflow_config=workflow_config
        ... )

        >>> # Check if approval required
        >>> check = await manager.check_approval_required(
        ...     agent_id="agent-001",
        ...     payload={"action": "process"},
        ...     context=context
        ... )
        >>> if check.required:
        ...     request = await manager.create_approval_request(...)
    """

    def __init__(
        self,
        trigger_config: ApprovalTriggerConfig | None = None,
        workflow_config: ApprovalWorkflowConfig | None = None,
        notification_service: NotificationService | None = None,
        store: ApprovalStore | None = None,
        history_provider: Any | None = None
    ):
        """
        Initialize the approval manager.

        Args:
            trigger_config: Configuration for approval triggers
            workflow_config: Configuration for workflow behavior
            notification_service: Optional notification service
            store: Optional approval request store
            history_provider: Optional invocation history provider
        """
        self.trigger_config = trigger_config or ApprovalTriggerConfig()
        self.workflow_config = workflow_config or ApprovalWorkflowConfig()
        self.notification_service = notification_service
        self.store = store or InMemoryApprovalStore()
        self.history_provider = history_provider or InMemoryHistoryProvider()

        # Initialize trigger evaluator
        self.trigger_evaluator = ApprovalTriggerEvaluator(
            config=self.trigger_config,
            history_provider=self.history_provider
        )

    async def check_approval_required(
        self,
        agent_id: str,
        payload: dict[str, Any],
        user_id: str,
        organization_id: str,
        estimated_cost: float = 0.0,
        estimated_tokens: int = 0,
        environment: str = "production"
    ) -> ApprovalCheckResult:
        """
        Check if this invocation requires approval.

        Args:
            agent_id: External agent ID
            payload: Invocation payload
            user_id: Requesting user ID
            organization_id: Organization ID
            estimated_cost: Estimated cost of invocation
            estimated_tokens: Estimated tokens
            environment: Environment (production, staging, etc.)

        Returns:
            ApprovalCheckResult with required status and any existing request

        Examples:
            >>> check = await manager.check_approval_required(
            ...     agent_id="agent-001",
            ...     payload={"input": "Process document"},
            ...     user_id="user-001",
            ...     organization_id="org-001",
            ...     estimated_cost=150.0
            ... )
            >>> if check.required:
            ...     if check.existing_request:
            ...         # Already pending approval
            ...         print(f"Pending: {check.existing_request.id}")
            ...     else:
            ...         # Need to create new request
            ...         request = await manager.create_approval_request(...)
        """
        # Check auto-approval rules first
        if await self._should_auto_approve(user_id, organization_id):
            return ApprovalCheckResult(
                required=False,
                trigger_reason="Auto-approved for trusted user"
            )

        # Get invocation count for rate triggers
        invocation_count = 0
        if self.trigger_config.rate_trigger_count is not None:
            invocation_count = await self.history_provider.get_invocation_count(
                agent_id=agent_id,
                user_id=user_id,
                organization_id=organization_id,
                window_seconds=self.trigger_config.rate_trigger_window_seconds
            )

        # Check first invocation
        is_first_invocation = await self.history_provider.is_first_invocation(
            agent_id=agent_id,
            user_id=user_id,
            organization_id=organization_id
        )

        # Build trigger context
        context = TriggerContext(
            agent_id=agent_id,
            user_id=user_id,
            organization_id=organization_id,
            payload=payload,
            estimated_cost=estimated_cost,
            estimated_tokens=estimated_tokens,
            environment=environment,
            is_first_invocation=is_first_invocation,
            is_new_agent=False,  # TODO: Check if agent was recently registered
            invocation_count_in_window=invocation_count
        )

        # Evaluate triggers
        trigger_result = await self.trigger_evaluator.evaluate(context)

        if not trigger_result.triggered:
            return ApprovalCheckResult(
                required=False,
                trigger_reason=""
            )

        # Check for existing pending request
        existing_requests = await self.store.get_pending_for_agent(
            agent_id=agent_id,
            organization_id=organization_id
        )

        # Find request from same user
        existing_request = None
        for req in existing_requests:
            if req.requested_by_user_id == user_id:
                existing_request = req
                break

        return ApprovalCheckResult(
            required=True,
            trigger_reason=trigger_result.reason,
            existing_request=existing_request,
            triggers_matched=trigger_result.triggers_matched
        )

    async def create_approval_request(
        self,
        agent_id: str,
        payload: dict[str, Any],
        user_id: str,
        organization_id: str,
        trigger_reason: str,
        estimated_cost: float | None = None,
        estimated_tokens: int | None = None,
        team_id: str | None = None
    ) -> ApprovalRequest:
        """
        Create a new approval request and notify approvers.

        Args:
            agent_id: External agent ID
            payload: Invocation payload (will be sanitized)
            user_id: Requesting user ID
            organization_id: Organization ID
            trigger_reason: Why approval is required
            estimated_cost: Estimated cost
            estimated_tokens: Estimated tokens
            team_id: Optional team ID

        Returns:
            Created ApprovalRequest

        Examples:
            >>> request = await manager.create_approval_request(
            ...     agent_id="agent-001",
            ...     payload={"action": "transfer", "amount": 50000},
            ...     user_id="user-001",
            ...     organization_id="org-001",
            ...     trigger_reason="Cost threshold exceeded ($150.00 > $100.00)"
            ... )
            >>> print(f"Request created: {request.id}")
        """
        now = datetime.utcnow()
        expires_at = now + self.workflow_config.timeout

        request = ApprovalRequest(
            id=f"apr-{uuid.uuid4().hex[:12]}",
            external_agent_id=agent_id,
            organization_id=organization_id,
            requested_by_user_id=user_id,
            requested_by_team_id=team_id,
            trigger_reason=trigger_reason,
            invocation_context=self._sanitize_context(payload),
            payload_summary=self._summarize_payload(payload),
            estimated_cost=estimated_cost,
            estimated_tokens=estimated_tokens,
            status=ApprovalStatus.PENDING,
            created_at=now,
            expires_at=expires_at,
            required_approvals=self.workflow_config.require_multiple_approvers,
        )

        # Save to store
        await self.store.save(request)

        # Send notifications
        if self.notification_service and self.workflow_config.notify_on_create:
            try:
                await self.notification_service.notify_approvers(
                    request=request,
                    approver_roles=self.workflow_config.approver_roles,
                    approver_users=self.workflow_config.approver_users
                )
            except Exception as e:
                logger.warning(f"Failed to send approval notifications: {e}")
                # Don't fail the request creation if notifications fail

        logger.info(f"Created approval request {request.id} for agent {agent_id}")
        return request

    async def approve(
        self,
        request_id: str,
        approver_id: str,
        reason: str | None = None,
        metadata: dict[str, Any] | None = None
    ) -> ApprovalRequest:
        """
        Approve an approval request.

        Args:
            request_id: ID of the request to approve
            approver_id: ID of the approver
            reason: Optional reason for approval
            metadata: Optional metadata

        Returns:
            Updated ApprovalRequest

        Raises:
            ApprovalNotFoundError: If request doesn't exist
            ApprovalExpiredError: If request has expired
            AlreadyDecidedError: If request is already decided
            SelfApprovalNotAllowedError: If self-approval is not allowed
            UnauthorizedApproverError: If approver is not authorized

        Examples:
            >>> request = await manager.approve(
            ...     request_id="apr-abc123",
            ...     approver_id="admin-001",
            ...     reason="Business justification verified"
            ... )
            >>> if request.status == ApprovalStatus.APPROVED:
            ...     print("Request fully approved!")
        """
        request = await self.store.get(request_id)
        if not request:
            raise ApprovalNotFoundError(request_id)

        # Check if already decided
        if request.status != ApprovalStatus.PENDING:
            raise AlreadyDecidedError(request_id, request.status)

        # Check expiration
        if request.is_expired():
            request.status = ApprovalStatus.EXPIRED
            await self.store.save(request)
            raise ApprovalExpiredError(request_id)

        # Check self-approval
        if not self.workflow_config.allow_self_approval:
            if request.requested_by_user_id == approver_id:
                raise SelfApprovalNotAllowedError()

        # Check authorization (simplified - real implementation would check roles)
        if not await self._can_approve(approver_id, request):
            raise UnauthorizedApproverError(approver_id)

        # Check if already approved by this approver
        for decision in request.approvals:
            if decision.approver_id == approver_id:
                return request  # Already approved by this approver

        # Record approval
        decision = ApprovalDecision(
            approver_id=approver_id,
            decision="approve",
            reason=reason,
            timestamp=datetime.utcnow(),
            metadata=metadata or {}
        )
        request.approvals.append(decision)

        # Check if fully approved
        if len(request.approvals) >= request.required_approvals:
            request.status = ApprovalStatus.APPROVED

        # Save
        await self.store.save(request)

        # Log
        logger.info(
            f"Approval {request_id} approved by {approver_id} "
            f"({len(request.approvals)}/{request.required_approvals})"
        )

        # Notify requestor if fully approved
        if request.status == ApprovalStatus.APPROVED:
            if self.notification_service and self.workflow_config.notify_on_decision:
                try:
                    await self.notification_service.notify_requestor(
                        request=request,
                        decision="approved",
                        reason=reason
                    )
                except Exception as e:
                    logger.warning(f"Failed to notify requestor: {e}")

        return request

    async def reject(
        self,
        request_id: str,
        approver_id: str,
        reason: str,
        metadata: dict[str, Any] | None = None
    ) -> ApprovalRequest:
        """
        Reject an approval request.

        A single rejection is sufficient to reject the entire request.

        Args:
            request_id: ID of the request to reject
            approver_id: ID of the approver
            reason: Required reason for rejection
            metadata: Optional metadata

        Returns:
            Updated ApprovalRequest

        Raises:
            ApprovalNotFoundError: If request doesn't exist
            AlreadyDecidedError: If request is already decided
            UnauthorizedApproverError: If approver is not authorized

        Examples:
            >>> request = await manager.reject(
            ...     request_id="apr-abc123",
            ...     approver_id="admin-001",
            ...     reason="Amount exceeds department budget limit"
            ... )
        """
        request = await self.store.get(request_id)
        if not request:
            raise ApprovalNotFoundError(request_id)

        # Check if already decided
        if request.status != ApprovalStatus.PENDING:
            raise AlreadyDecidedError(request_id, request.status)

        # Check authorization
        if not await self._can_approve(approver_id, request):
            raise UnauthorizedApproverError(approver_id)

        # Record rejection
        decision = ApprovalDecision(
            approver_id=approver_id,
            decision="reject",
            reason=reason,
            timestamp=datetime.utcnow(),
            metadata=metadata or {}
        )
        request.rejections.append(decision)

        # A single rejection rejects the entire request
        request.status = ApprovalStatus.REJECTED

        # Save
        await self.store.save(request)

        # Log
        logger.info(f"Approval {request_id} rejected by {approver_id}: {reason}")

        # Notify requestor
        if self.notification_service and self.workflow_config.notify_on_decision:
            try:
                await self.notification_service.notify_requestor(
                    request=request,
                    decision="rejected",
                    reason=reason
                )
            except Exception as e:
                logger.warning(f"Failed to notify requestor: {e}")

        return request

    async def get_pending_requests(
        self,
        approver_id: str,
        organization_id: str | None = None
    ) -> list[ApprovalRequest]:
        """
        Get pending approval requests for an approver.

        Args:
            approver_id: ID of the approver
            organization_id: Optional organization filter

        Returns:
            List of pending requests

        Examples:
            >>> pending = await manager.get_pending_requests(
            ...     approver_id="admin-001",
            ...     organization_id="org-001"
            ... )
            >>> for req in pending:
            ...     print(f"{req.id}: {req.trigger_reason}")
        """
        return await self.store.get_pending_for_approver(
            approver_id=approver_id,
            organization_id=organization_id
        )

    async def get_request(self, request_id: str) -> ApprovalRequest | None:
        """
        Get an approval request by ID.

        Args:
            request_id: Request ID

        Returns:
            ApprovalRequest or None if not found
        """
        return await self.store.get(request_id)

    async def process_expired_requests(self) -> list[ApprovalRequest]:
        """
        Process all expired approval requests.

        Called by a scheduler to handle request timeouts.

        Returns:
            List of processed expired requests

        Examples:
            >>> # Called by background scheduler
            >>> expired = await manager.process_expired_requests()
            >>> for req in expired:
            ...     print(f"Expired: {req.id}")
        """
        expired_requests = await self.store.get_expired()
        processed = []

        for request in expired_requests:
            if self.workflow_config.auto_reject_on_timeout:
                request.status = ApprovalStatus.EXPIRED
                request.rejections.append(ApprovalDecision(
                    approver_id="system",
                    decision="reject",
                    reason="Request expired due to timeout",
                    timestamp=datetime.utcnow()
                ))
            elif self.workflow_config.auto_approve_on_timeout:
                # Dangerous - but supported for specific use cases
                request.status = ApprovalStatus.APPROVED
                request.approvals.append(ApprovalDecision(
                    approver_id="system",
                    decision="approve",
                    reason="Auto-approved due to timeout",
                    timestamp=datetime.utcnow()
                ))
            else:
                request.status = ApprovalStatus.EXPIRED

            await self.store.save(request)
            processed.append(request)

            # Notify requestor
            if self.notification_service and self.workflow_config.notify_on_expiration:
                try:
                    await self.notification_service.notify_requestor(
                        request=request,
                        decision="expired",
                        reason="Request timed out"
                    )
                except Exception as e:
                    logger.warning(f"Failed to notify about expiration: {e}")

            logger.info(f"Processed expired request {request.id}")

        return processed

    async def escalate(
        self,
        request_id: str,
        reason: str = "Escalation timeout reached"
    ) -> ApprovalRequest:
        """
        Escalate an approval request.

        Args:
            request_id: Request to escalate
            reason: Reason for escalation

        Returns:
            Updated ApprovalRequest

        Raises:
            ApprovalNotFoundError: If request doesn't exist
        """
        request = await self.store.get(request_id)
        if not request:
            raise ApprovalNotFoundError(request_id)

        if request.status != ApprovalStatus.PENDING:
            return request

        request.status = ApprovalStatus.ESCALATED
        await self.store.save(request)

        # Notify escalation targets
        if self.notification_service and self.workflow_config.escalation_to:
            try:
                await self.notification_service.notify_approvers(
                    request=request,
                    approver_roles=[],
                    approver_users=self.workflow_config.escalation_to
                )
            except Exception as e:
                logger.warning(f"Failed to notify escalation targets: {e}")

        logger.info(f"Escalated approval {request_id}: {reason}")
        return request

    async def _should_auto_approve(
        self,
        user_id: str,
        organization_id: str
    ) -> bool:
        """Check if user qualifies for auto-approval."""
        # Check trusted users
        if user_id in self.workflow_config.auto_approve_trusted_users:
            return True

        # Check admin auto-approval (would need role lookup in real implementation)
        if self.workflow_config.auto_approve_for_admins:
            # TODO: Check if user has admin role
            pass

        return False

    async def _can_approve(
        self,
        approver_id: str,
        request: ApprovalRequest
    ) -> bool:
        """
        Check if user can approve this request.

        In a real implementation, this would check:
        - User has required roles
        - User is in approver_users list
        - User is in same organization
        """
        # For now, allow any user to approve (real implementation needs role checking)
        # This is a simplified version for the initial implementation

        # Check if in explicit user list
        if approver_id in self.workflow_config.approver_users:
            return True

        # If no explicit users configured, allow any user with the right roles
        # In a real implementation, we'd check the user's roles against approver_roles
        return True

    def _sanitize_context(self, payload: dict[str, Any]) -> dict[str, Any]:
        """
        Sanitize payload by removing sensitive data.

        Removes or masks fields that might contain secrets.
        """
        sensitive_keys = {
            "password", "secret", "token", "api_key", "apikey",
            "private_key", "access_token", "refresh_token",
            "authorization", "auth", "credential", "credentials"
        }

        def sanitize(obj: Any, depth: int = 0) -> Any:
            if depth > 10:  # Prevent infinite recursion
                return "<truncated>"

            if isinstance(obj, dict):
                result = {}
                for key, value in obj.items():
                    if key.lower() in sensitive_keys:
                        result[key] = "<REDACTED>"
                    else:
                        result[key] = sanitize(value, depth + 1)
                return result
            elif isinstance(obj, list):
                return [sanitize(item, depth + 1) for item in obj[:100]]  # Limit list size
            elif isinstance(obj, str) and len(obj) > 1000:
                return obj[:1000] + "...<truncated>"
            else:
                return obj

        return sanitize(payload)

    def _summarize_payload(self, payload: dict[str, Any]) -> str:
        """Create a human-readable summary of the payload."""
        parts = []

        # Extract key information
        if "action" in payload:
            parts.append(f"Action: {payload['action']}")
        if "input" in payload:
            input_val = str(payload["input"])[:100]
            parts.append(f"Input: {input_val}")
        if "amount" in payload:
            parts.append(f"Amount: {payload['amount']}")

        if not parts:
            # Generic summary
            keys = list(payload.keys())[:5]
            parts.append(f"Fields: {', '.join(keys)}")

        return " | ".join(parts)


__all__ = [
    "ExternalAgentApprovalManager",
    "ApprovalNotFoundError",
    "UnauthorizedApproverError",
    "SelfApprovalNotAllowedError",
    "ApprovalExpiredError",
    "AlreadyDecidedError",
    "NotificationService",
]
