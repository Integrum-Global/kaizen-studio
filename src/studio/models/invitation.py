"""
Invitation DataFlow Model

Represents an invitation to join an organization.
"""

from studio.models import db


@db.model
class Invitation:
    """
    Invitation model for inviting users to organizations.

    DataFlow generates these nodes automatically:
    - InvitationCreateNode
    - InvitationReadNode
    - InvitationUpdateNode
    - InvitationDeleteNode
    - InvitationListNode
    - InvitationCountNode
    - InvitationUpsertNode
    - InvitationBulkCreateNode
    - InvitationBulkUpdateNode
    - InvitationBulkDeleteNode
    - InvitationBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization reference
    organization_id: str

    # Invitation details
    email: str
    role: str  # org_admin, developer, viewer
    invited_by: str  # User ID of inviter

    # Token for accepting invitation
    token: str

    # Status: pending, accepted, expired
    status: str

    # Expiration
    expires_at: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
