"""
Organization Domain DataFlow Model

Represents a verified domain associated with an organization for SSO auto-join.
"""

from studio.models import db


@db.model
class OrganizationDomain:
    """
    Organization domain model for SSO domain-based grouping.

    This model enables:
    - Automatic organization joining based on email domain
    - Domain verification for security
    - Default role assignment for domain-based joins

    DataFlow generates these nodes automatically:
    - OrganizationDomainCreateNode
    - OrganizationDomainReadNode
    - OrganizationDomainUpdateNode
    - OrganizationDomainDeleteNode
    - OrganizationDomainListNode
    - OrganizationDomainCountNode
    - OrganizationDomainUpsertNode
    - OrganizationDomainBulkCreateNode
    - OrganizationDomainBulkUpdateNode
    - OrganizationDomainBulkDeleteNode
    - OrganizationDomainBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization reference
    organization_id: str

    # Domain name (e.g., "company.com")
    domain: str

    # Whether the domain has been verified
    is_verified: bool

    # Verification method used: dns_txt, email, manual
    verification_method: str

    # Whether users from this domain can auto-join the organization
    auto_join_enabled: bool

    # Default role for users who join via domain match
    # Values: developer, viewer
    default_role: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str

    # When the domain was verified (ISO 8601, nullable)
    verified_at: str | None = None
