"""
Trust Audit Anchor DataFlow Model

Represents an audit record for agent actions.
EATP: Every action is verified BEFORE and audited AFTER execution.
"""

from studio.models import db


@db.model
class TrustAuditAnchor:
    """
    Trust audit anchor model for immutable action records.

    EATP Principles:
    - Every action is AUDITED after execution
    - Every audit record includes human_origin
    - Audit trail is immutable (append-only)

    DataFlow generates these nodes automatically:
    - TrustAuditAnchorCreateNode
    - TrustAuditAnchorReadNode
    - TrustAuditAnchorUpdateNode (should not be used - audit is immutable)
    - TrustAuditAnchorDeleteNode (should not be used - audit is immutable)
    - TrustAuditAnchorListNode
    - TrustAuditAnchorCountNode
    - TrustAuditAnchorUpsertNode
    - TrustAuditAnchorBulkCreateNode
    - TrustAuditAnchorBulkUpdateNode
    - TrustAuditAnchorBulkDeleteNode
    - TrustAuditAnchorBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Agent that performed the action
    agent_id: str

    # Organization context
    organization_id: str

    # Action details
    action: str
    resource_type: str
    resource_id: str  # Empty string if not applicable

    # Result: success, failure, denied
    result: str

    # Human origin - EATP requirement (JSON serialized)
    # Answers: "Who ultimately authorized this action?"
    human_origin_data: str

    # Trust chain hash at time of action (for tamper detection)
    trust_chain_hash: str

    # Parent anchor for causal chains (empty if root action)
    parent_anchor_id: str

    # Context data (JSON serialized)
    context_data: str

    # Timestamp (ISO 8601)
    timestamp: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
