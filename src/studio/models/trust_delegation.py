"""
Trust Delegation DataFlow Model

Represents a delegation of trust from one agent to another.
EATP: Delegations can only TIGHTEN constraints, never loosen them.
"""

from studio.models import db


@db.model
class TrustDelegation:
    """
    Trust delegation model for agent-to-agent trust transfer.

    EATP Principles:
    - Trust flows DOWN the hierarchy, never UP
    - Constraints can only TIGHTEN through delegation
    - Every delegation traces to a human origin

    DataFlow generates these nodes automatically:
    - TrustDelegationCreateNode
    - TrustDelegationReadNode
    - TrustDelegationUpdateNode
    - TrustDelegationDeleteNode
    - TrustDelegationListNode
    - TrustDelegationCountNode
    - TrustDelegationUpsertNode
    - TrustDelegationBulkCreateNode
    - TrustDelegationBulkUpdateNode
    - TrustDelegationBulkDeleteNode
    - TrustDelegationBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Delegation parties
    delegator_id: str  # Agent delegating trust
    delegatee_id: str  # Agent receiving trust

    # Task context
    task_id: str

    # Organization context
    organization_id: str

    # Capabilities delegated (JSON array)
    capabilities_delegated: str

    # Constraints (JSON array) - tightened from delegator
    constraint_subset: str

    # Status: active, revoked, expired
    status: str

    # Human origin - EATP requirement (JSON serialized)
    # Every delegation must trace to a human authorizer
    human_origin_data: str

    # Delegation chain (JSON array of agent IDs leading back to human)
    delegation_chain: str

    # Delegation depth (0 = direct from human via PseudoAgent)
    delegation_depth: int

    # Expiration (ISO 8601)
    expires_at: str

    # Revocation info
    revoked_at: str  # Empty string if not revoked
    revoked_by: str  # Empty string if not revoked
    revocation_reason: str  # Empty string if not revoked

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
