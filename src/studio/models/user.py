"""
User DataFlow Model

Represents a user in the Kaizen Studio platform.
"""

from studio.models import db


@db.model
class User:
    """
    User model for authentication and authorization.

    Multi-tenant support:
    - Users can belong to multiple organizations via UserOrganization junction table
    - is_super_admin grants platform-wide access
    - primary_organization_id indicates the user's default organization
    - organization_id and role are kept for backward compatibility during migration

    DataFlow generates these nodes automatically:
    - UserCreateNode
    - UserReadNode
    - UserUpdateNode
    - UserDeleteNode
    - UserListNode
    - UserCountNode
    - UserUpsertNode
    - UserBulkCreateNode
    - UserBulkUpdateNode
    - UserBulkDeleteNode
    - UserBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization reference (kept for backward compatibility)
    # New code should use UserOrganization for multi-org support
    organization_id: str

    # User details
    email: str
    name: str
    password_hash: str

    # Status: active, invited, suspended
    status: str

    # Role in current organization (kept for backward compatibility)
    # New code should use UserOrganization.role for org-specific roles
    role: str

    # Optional last login timestamp
    last_login_at: str | None = None

    # MFA settings
    mfa_enabled: bool

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str

    # Multi-tenant support fields
    # Super admin can manage all organizations
    is_super_admin: bool = False

    # User's primary/default organization
    primary_organization_id: str | None = None
