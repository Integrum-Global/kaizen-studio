"""
SSO Provider Configuration

Defines SSO provider configurations and presets for OAuth 2.0 / OIDC integration.
"""

from pydantic import BaseModel


class SSOProviderConfig(BaseModel):
    """Configuration for an SSO provider."""

    name: str
    client_id: str
    client_secret: str
    authorize_url: str
    token_url: str
    userinfo_url: str
    scope: str = "openid email profile"


# Provider presets for common OAuth/OIDC providers
PROVIDER_PRESETS = {
    "azure": {
        "authorize_url": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
        "token_url": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
        "userinfo_url": "https://graph.microsoft.com/oidc/userinfo",
        "scope": "openid email profile",
    },
    "google": {
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://openidconnect.googleapis.com/v1/userinfo",
        "scope": "openid email profile",
    },
    "okta": {
        "authorize_url": "https://{domain}/oauth2/v1/authorize",
        "token_url": "https://{domain}/oauth2/v1/token",
        "userinfo_url": "https://{domain}/oauth2/v1/userinfo",
        "scope": "openid email profile",
    },
    "auth0": {
        "authorize_url": "https://{domain}/authorize",
        "token_url": "https://{domain}/oauth/token",
        "userinfo_url": "https://{domain}/userinfo",
        "scope": "openid email profile",
    },
}


def get_provider_urls(
    provider: str, tenant_id: str | None = None, domain: str | None = None
) -> dict:
    """
    Get provider URLs with placeholders replaced.

    Args:
        provider: Provider name (azure, google, okta, auth0)
        tenant_id: Azure tenant ID (defaults to 'common')
        domain: Okta/Auth0 domain

    Returns:
        Dict with authorize_url, token_url, userinfo_url
    """
    if provider not in PROVIDER_PRESETS:
        raise ValueError(f"Unknown provider: {provider}")

    preset = PROVIDER_PRESETS[provider].copy()

    # Replace placeholders
    tenant = tenant_id or "common"
    domain = domain or ""

    for key in ["authorize_url", "token_url", "userinfo_url"]:
        preset[key] = preset[key].format(tenant=tenant, domain=domain)

    return preset


__all__ = [
    "SSOProviderConfig",
    "PROVIDER_PRESETS",
    "get_provider_urls",
]
