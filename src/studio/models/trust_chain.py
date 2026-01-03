"""
Trust Chain DataFlow Model

Represents a trust chain for an agent in the EATP system.
Every trust chain traces back to a human origin through the PseudoAgent.
"""

from studio.models import db


@db.model
class TrustChain:
    """
    Trust chain model for agent trust lineage.

    EATP Principle: Every agent action must trace to a human authorizer.

    DataFlow generates these nodes automatically:
    - TrustChainCreateNode
    - TrustChainReadNode
    - TrustChainUpdateNode
    - TrustChainDeleteNode
    - TrustChainListNode
    - TrustChainCountNode
    - TrustChainUpsertNode
    - TrustChainBulkCreateNode
    - TrustChainBulkUpdateNode
    - TrustChainBulkDeleteNode
    - TrustChainBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Agent this chain belongs to
    agent_id: str

    # Organization context
    organization_id: str

    # Genesis record (JSON serialized)
    # Contains: authority_id, authority_type, established_at, expires_at
    genesis_data: str

    # Current status: active, expired, revoked
    status: str

    # Human origin (JSON serialized) - EATP requirement
    # Contains: human_id, display_name, auth_provider, session_id, authenticated_at
    human_origin_data: str

    # Computed constraint envelope (JSON serialized)
    constraint_envelope_data: str

    # Expiration (ISO 8601)
    expires_at: str

    # Revocation info (if revoked)
    revoked_at: str  # Empty string if not revoked
    revoked_by: str  # Empty string if not revoked
    revocation_reason: str  # Empty string if not revoked

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
