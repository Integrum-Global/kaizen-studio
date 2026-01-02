"""
Organization DataFlow Model

Represents an organization/tenant in the Kaizen Studio platform.
"""

from studio.models import db


@db.model
class Organization:
    """
    Organization model for multi-tenant support.

    SSO domain grouping:
    - sso_domain: Primary SSO domain associated with this organization
    - allow_domain_join: Whether users from verified domains can auto-join
    - Use OrganizationDomain table for multiple verified domains

    DataFlow generates these nodes automatically:
    - OrganizationCreateNode
    - OrganizationReadNode
    - OrganizationUpdateNode
    - OrganizationDeleteNode
    - OrganizationListNode
    - OrganizationCountNode
    - OrganizationUpsertNode
    - OrganizationBulkCreateNode
    - OrganizationBulkUpdateNode
    - OrganizationBulkDeleteNode
    - OrganizationBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization details
    name: str
    slug: str

    # Status: active, suspended, deleted
    status: str

    # Plan tier: free, pro, enterprise
    plan_tier: str

    # Creator reference
    created_by: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str

    # SSO domain grouping fields
    # Primary SSO domain (e.g., "company.com")
    sso_domain: str | None = None

    # Whether users from verified domains can auto-join
    allow_domain_join: bool = False

    # Organization settings (JSON string for custom configuration)
    settings: str | None = None
