"""
Trust Authority DataFlow Model

Represents an organizational authority that can establish trust for agents.
"""

from studio.models import db


@db.model
class TrustAuthority:
    """
    Trust authority model for organizational trust roots.

    Authorities are the root of trust for agents within an organization.
    They provide the genesis of trust chains.

    DataFlow generates these nodes automatically:
    - TrustAuthorityCreateNode
    - TrustAuthorityReadNode
    - TrustAuthorityUpdateNode
    - TrustAuthorityDeleteNode
    - TrustAuthorityListNode
    - TrustAuthorityCountNode
    - TrustAuthorityUpsertNode
    - TrustAuthorityBulkCreateNode
    - TrustAuthorityBulkUpdateNode
    - TrustAuthorityBulkDeleteNode
    - TrustAuthorityBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization this authority belongs to
    organization_id: str

    # Authority details
    name: str
    description: str

    # Authority type: organizational, department, team
    authority_type: str

    # Status: active, inactive
    status: str

    # Cryptographic keys (for signing)
    public_key: str
    signing_key_id: str  # Reference to key in secure storage

    # Permissions (JSON array)
    permissions: str

    # Deactivation info
    deactivated_at: str  # Empty string if active
    deactivated_by: str  # Empty string if active
    deactivation_reason: str  # Empty string if active

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
