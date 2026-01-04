"""
Policy DataFlow Model

Represents an ABAC policy for attribute-based access control.
"""

from studio.models import db


@db.model
class Policy:
    """
    Policy model for ABAC authorization.

    DataFlow generates these nodes automatically:
    - PolicyCreateNode
    - PolicyReadNode
    - PolicyUpdateNode
    - PolicyDeleteNode
    - PolicyListNode
    - PolicyCountNode
    - PolicyUpsertNode
    - PolicyBulkCreateNode
    - PolicyBulkUpdateNode
    - PolicyBulkDeleteNode
    - PolicyBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization this policy belongs to
    organization_id: str

    # Policy name (e.g., "Allow workspace access during business hours")
    name: str

    # Human-readable description
    description: str | None

    # Resource type this policy applies to (agent, deployment, pipeline, *)
    resource_type: str

    # Action this policy governs (create, read, update, delete, *)
    action: str

    # Effect of the policy (allow, deny)
    effect: str

    # JSON-encoded conditions for evaluation
    # Example: {"all": [{"field": "resource.status", "op": "eq", "value": "active"}]}
    conditions: str

    # JSON-encoded resource references extracted from conditions
    # Format: [{"type": "agent", "id": "agent-123", "name": "My Agent"}, ...]
    # Used for orphan detection and reference validation
    resource_refs: str | None

    # Priority for evaluation order (higher = evaluated first)
    priority: int

    # Policy status (active, inactive)
    status: str

    # User who created this policy
    created_by: str

    # Timestamps
    created_at: str
    updated_at: str
