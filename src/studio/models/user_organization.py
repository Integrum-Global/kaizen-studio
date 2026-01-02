"""
User Organization DataFlow Model

Represents a user's membership in an organization for multi-tenant support.
This junction table enables users to belong to multiple organizations.
"""

from studio.models import db


@db.model
class UserOrganization:
    """
    User-Organization junction table for multi-tenant support.

    This model enables:
    - Users belonging to multiple organizations
    - Different roles per organization
    - Tracking how users joined each organization
    - Primary organization designation

    DataFlow generates these nodes automatically:
    - UserOrganizationCreateNode
    - UserOrganizationReadNode
    - UserOrganizationUpdateNode
    - UserOrganizationDeleteNode
    - UserOrganizationListNode
    - UserOrganizationCountNode
    - UserOrganizationUpsertNode
    - UserOrganizationBulkCreateNode
    - UserOrganizationBulkUpdateNode
    - UserOrganizationBulkDeleteNode
    - UserOrganizationBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # References
    user_id: str
    organization_id: str

    # Role within organization: tenant_admin, org_admin, developer, viewer
    # tenant_admin: Full org control, can manage admins
    # org_admin: Manage users, teams, resources within org
    # developer: Create/edit agents, pipelines, deployments
    # viewer: Read-only access
    role: str

    # Whether this is the user's primary organization
    is_primary: bool

    # How the user joined this organization
    # Values: invitation, sso, domain_match, created
    joined_via: str

    # When the user joined this organization (ISO 8601)
    joined_at: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
