"""
Invocation Lineage DataFlow Model

Represents complete lineage record for external agent invocations.
Captures the full chain: external user → external system → Kaizen → external agent.
"""

from studio.models import db


@db.model
class InvocationLineage:
    """
    Invocation lineage model for external agent governance.

    Captures the complete audit trail of an external agent invocation,
    including all identity layers, context, and execution results.

    DataFlow auto-generates 11 nodes:
    - InvocationLineageCreateNode
    - InvocationLineageReadNode
    - InvocationLineageUpdateNode
    - InvocationLineageDeleteNode
    - InvocationLineageListNode
    - InvocationLineageCountNode
    - InvocationLineageUpsertNode
    - InvocationLineageBulkCreateNode
    - InvocationLineageBulkUpdateNode
    - InvocationLineageBulkDeleteNode
    - InvocationLineageBulkUpsertNode
    """

    # ===== Primary Key =====
    id: str  # invocation_id (e.g., "inv-def456")

    # ===== External User Identity (Layer 1) =====
    external_user_id: str  # From X-External-User-ID header
    external_user_email: str  # From X-External-User-Email header
    external_user_name: str | None = None  # Optional display name
    external_user_role: str | None = None  # Role in external system

    # ===== External System Identity (Layer 2) =====
    external_system: str  # Enum: "copilot", "custom", "zapier", etc.
    external_session_id: str  # External system session ID
    external_trace_id: str | None = None  # Parent trace ID (if provided)
    external_context: str | None = None  # JSON context from external system

    # ===== Kaizen Authentication (Layer 3) =====
    api_key_id: str  # API key used for authentication
    api_key_prefix: str  # For display (e.g., "sk_live_a1b2c3d4")
    organization_id: str  # Organization context
    team_id: str | None = None  # Team context (if scoped)

    # ===== External Agent (Layer 4) =====
    external_agent_id: str  # External agent being invoked
    external_agent_name: str  # Display name
    external_agent_endpoint: str  # Actual endpoint URL
    external_agent_version: str | None = None  # Version (if tracked)

    # ===== Invocation Metadata (Layer 5) =====
    trace_id: str  # OpenTelemetry trace ID
    span_id: str  # OpenTelemetry span ID
    parent_trace_id: str | None = None  # Link to external_trace_id if provided

    # ===== Request Context =====
    ip_address: str  # Client IP address
    user_agent: str  # Client user agent
    request_timestamp: str  # ISO 8601 timestamp when request started
    request_headers: str | None = None  # JSON of relevant headers
    request_body: str | None = None  # JSON of request body (sanitized)

    # ===== Execution Results =====
    # Enum: "pending", "success", "failure", "timeout", "budget_exceeded", "approval_required"
    status: str
    response_timestamp: str | None = None  # ISO 8601 timestamp when response completed
    duration_ms: int | None = None  # Total execution time in milliseconds

    # ===== Cost Attribution =====
    cost_usd: float | None = None  # Total cost incurred (calculated)
    input_tokens: int | None = None  # If applicable
    output_tokens: int | None = None  # If applicable
    api_calls_count: int | None = None  # Number of API calls made

    # ===== Error Handling =====
    error_type: str | None = None  # Error classification
    error_message: str | None = None  # Error details
    error_stacktrace: str | None = None  # Full stacktrace (for debugging)

    # ===== Response Data =====
    response_status_code: int | None = None  # HTTP status code
    response_headers: str | None = None  # JSON of response headers
    response_body: str | None = None  # JSON of response body (sanitized)

    # ===== Governance Decisions =====
    budget_checked: bool = False  # Was budget check performed?
    budget_remaining_before: float | None = None  # Budget before invocation
    budget_remaining_after: float | None = None  # Budget after invocation
    approval_required: bool = False  # Was approval required?
    approval_status: str | None = None  # "pending", "approved", "rejected"
    approval_id: str | None = None  # Link to approval record

    # ===== Timestamps =====
    created_at: str  # Record creation timestamp (ISO 8601)
    updated_at: str | None = None  # Last update timestamp (ISO 8601)
