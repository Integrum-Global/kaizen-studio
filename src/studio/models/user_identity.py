"""
User Identity DataFlow Model

Links a user to external identity providers for SSO.
"""

from studio.models import db


@db.model
class UserIdentity:
    """
    User Identity model for SSO provider linkage.

    Each record links a user to an external identity provider,
    allowing multiple SSO providers per user.

    DataFlow generates these nodes automatically:
    - UserIdentityCreateNode
    - UserIdentityReadNode
    - UserIdentityUpdateNode
    - UserIdentityDeleteNode
    - UserIdentityListNode
    - UserIdentityCountNode
    - UserIdentityUpsertNode
    - UserIdentityBulkCreateNode
    - UserIdentityBulkUpdateNode
    - UserIdentityBulkDeleteNode
    - UserIdentityBulkUpsertNode
    """

    # Primary key
    id: str

    # User reference
    user_id: str

    # Provider info
    provider: str  # azure, google, okta, etc.
    provider_user_id: str  # Unique ID from the provider

    # Cached email from provider
    email: str

    # Timestamps
    created_at: str
