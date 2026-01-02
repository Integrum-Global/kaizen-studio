"""
External Agent Invocation DataFlow Model

Records each invocation of an external agent for audit and analytics.
"""

from studio.models import db


@db.model
class ExternalAgentInvocation:
    """
    External agent invocation tracking.

    Captures full lineage for compliance and debugging.

    DataFlow generates these nodes automatically:
    - ExternalAgentInvocationCreateNode
    - ExternalAgentInvocationReadNode
    - ExternalAgentInvocationUpdateNode
    - ExternalAgentInvocationDeleteNode
    - ExternalAgentInvocationListNode
    - ExternalAgentInvocationCountNode
    - ExternalAgentInvocationUpsertNode
    - ExternalAgentInvocationBulkCreateNode
    - ExternalAgentInvocationBulkUpdateNode
    - ExternalAgentInvocationBulkDeleteNode
    - ExternalAgentInvocationBulkUpsertNode
    """

    # Primary key
    id: str

    # References
    organization_id: str
    external_agent_id: str  # FK to ExternalAgent
    user_id: str  # Who invoked the agent

    # Request context
    request_payload: str  # JSON string of request
    request_ip: str  # Client IP address
    request_user_agent: str  # Client user agent

    # Response context
    response_payload: str  # JSON string of response
    response_status_code: int  # HTTP status code from external agent
    execution_time_ms: int  # Execution time in milliseconds

    # Governance decisions (for Phase 3, stub for Phase 1)
    auth_passed: bool  # Authentication check result (always true in Phase 1)
    budget_passed: bool  # Budget check result (always true in Phase 1)
    rate_limit_passed: bool  # Rate limit check result (always true in Phase 1)

    # Execution metadata
    status: str  # Enum: "pending", "success", "failed"
    error_message: str  # Error details if failed (empty string if success)
    trace_id: str  # Unique trace ID for distributed tracing

    # Cost tracking (for Phase 3, stub for Phase 1)
    estimated_cost: float  # Estimated cost in USD (0.0 in Phase 1)
    actual_cost: float  # Actual cost from external platform (0.0 in Phase 1)

    # Webhook delivery tracking (Phase 4)
    webhook_delivery_status: str  # Enum: "pending", "delivered", "failed"
    webhook_delivery_error: str  # Error details if webhook delivery failed
    webhook_delivered_at: str  # When webhook was delivered

    # Timestamps
    invoked_at: str  # When invocation was initiated
    completed_at: str  # When invocation completed
    created_at: str  # Record creation timestamp
