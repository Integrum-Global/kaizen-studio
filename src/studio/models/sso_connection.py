"""
SSO Connection DataFlow Model

Represents an SSO connection configuration for an organization.
"""

from studio.models import db


@db.model
class SSOConnection:
    """
    SSO Connection model for organization SSO configurations.

    DataFlow generates these nodes automatically:
    - SSOConnectionCreateNode
    - SSOConnectionReadNode
    - SSOConnectionUpdateNode
    - SSOConnectionDeleteNode
    - SSOConnectionListNode
    - SSOConnectionCountNode
    - SSOConnectionUpsertNode
    - SSOConnectionBulkCreateNode
    - SSOConnectionBulkUpdateNode
    - SSOConnectionBulkDeleteNode
    - SSOConnectionBulkUpsertNode
    """

    # Primary key
    id: str

    # Organization reference
    organization_id: str

    # Provider type: azure, google, okta, auth0, custom
    provider: str

    # OAuth client credentials
    client_id: str
    client_secret_encrypted: str

    # Provider-specific settings
    tenant_id: str | None = None  # For Azure AD
    domain: str | None = None  # For Okta/Auth0

    # Custom URLs for 'custom' provider
    custom_authorize_url: str | None = None
    custom_token_url: str | None = None
    custom_userinfo_url: str | None = None

    # Connection settings
    is_default: bool  # Default connection for org
    auto_provision: bool  # Auto-create users on first login
    default_role: str  # Role for auto-provisioned users (developer, viewer)

    # Domain restrictions (comma-separated email domains)
    allowed_domains: str | None = None

    # Status: active, inactive
    status: str

    # Timestamps (ISO 8601 strings)
    created_at: str
    updated_at: str
