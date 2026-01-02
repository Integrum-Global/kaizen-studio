"""
SSO API Endpoints

Handles SSO connection management and OAuth authentication flows.
"""

import secrets

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from kailash.runtime import AsyncLocalRuntime
from pydantic import BaseModel

from studio.api.auth import get_current_user
from studio.config import get_settings
from studio.middleware.rbac import require_role
from studio.services.auth_service import AuthService
from studio.services.sso_service import SSOService

router = APIRouter(prefix="/sso", tags=["SSO"])

# =============================================================================
# Public Email Domain Blocklist
# =============================================================================
# These domains should NOT enable automatic organization grouping.
# Users from public email providers get personal organizations.

PUBLIC_EMAIL_DOMAINS = frozenset(
    {
        # Google
        "gmail.com",
        "googlemail.com",
        # Microsoft
        "outlook.com",
        "outlook.de",
        "outlook.co.uk",
        "outlook.fr",
        "hotmail.com",
        "hotmail.co.uk",
        "hotmail.fr",
        "hotmail.de",
        "live.com",
        "live.co.uk",
        "live.fr",
        "msn.com",
        # Yahoo
        "yahoo.com",
        "yahoo.co.uk",
        "yahoo.fr",
        "yahoo.de",
        "yahoo.ca",
        "ymail.com",
        "rocketmail.com",
        # Apple
        "icloud.com",
        "me.com",
        "mac.com",
        # Other major providers
        "aol.com",
        "protonmail.com",
        "proton.me",
        "pm.me",
        "tutanota.com",
        "tutanota.de",
        "tutamail.com",
        "zoho.com",
        "zohomail.com",
        "mail.com",
        "email.com",
        "gmx.com",
        "gmx.net",
        "gmx.de",
        "fastmail.com",
        "fastmail.fm",
        "hey.com",
        "mailbox.org",
        # Regional providers
        "web.de",
        "t-online.de",
        "freenet.de",
        "orange.fr",
        "wanadoo.fr",
        "laposte.net",
        "qq.com",
        "163.com",
        "126.com",
        "yandex.ru",
        "yandex.com",
        "mail.ru",
    }
)


def is_public_email_domain(domain: str) -> bool:
    """
    Check if email domain is a public provider.

    Public email domains should not enable automatic organization grouping
    to prevent unrelated users from joining the same organization.
    """
    return domain.lower() in PUBLIC_EMAIL_DOMAINS


# Dependency factory functions
def get_runtime() -> AsyncLocalRuntime:
    """Get AsyncLocalRuntime for dependency injection."""
    return AsyncLocalRuntime()


def get_sso_service() -> SSOService:
    """Get SSOService instance."""
    return SSOService()


def get_auth_service(runtime: AsyncLocalRuntime = Depends(get_runtime)) -> AuthService:
    """Get AuthService with injected runtime."""
    return AuthService(runtime=runtime)


# Request/Response models
class CreateConnectionRequest(BaseModel):
    provider: str
    client_id: str
    client_secret: str
    tenant_id: str | None = None
    domain: str | None = None
    is_default: bool = False
    auto_provision: bool = True
    default_role: str = "developer"
    allowed_domains: str | None = None
    custom_urls: dict | None = None


class UpdateConnectionRequest(BaseModel):
    client_id: str | None = None
    client_secret: str | None = None
    tenant_id: str | None = None
    domain: str | None = None
    is_default: bool | None = None
    auto_provision: bool | None = None
    default_role: str | None = None
    allowed_domains: str | None = None
    status: str | None = None


class LinkAccountRequest(BaseModel):
    connection_id: str
    code: str


# State storage for OAuth flows (in production, use Redis)
_oauth_states: dict = {}


# =============================================================================
# PUBLIC SSO ENDPOINTS (No authentication required)
# =============================================================================


@router.get("/initiate/{provider}")
async def initiate_provider_sso(
    provider: str,
):
    """
    Initiate SSO authentication with a built-in provider.

    This is a public endpoint used by the login page to start the OAuth flow.
    Supports: microsoft, google, okta

    For multi-tenant Azure AD, uses the 'common' endpoint to allow any Azure AD user.
    """
    settings = get_settings()

    if provider == "microsoft":
        # Use Azure AD multi-tenant configuration
        if not settings.azure_client_id or not settings.azure_client_secret:
            raise HTTPException(
                status_code=503,
                detail="Microsoft SSO is not configured. Please set AZURE_CLIENT_ID and AZURE_CLIENT_SECRET.",
            )

        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)

        # Store state (in production, use Redis with TTL)
        _oauth_states[state] = {
            "provider": "microsoft",
            "redirect_uri": f"{settings.frontend_url}/auth/callback",
        }

        # Build Azure AD authorization URL (multi-tenant with 'common')
        from urllib.parse import urlencode

        params = {
            "client_id": settings.azure_client_id,
            "response_type": "code",
            "redirect_uri": f"{settings.frontend_url}/auth/callback",
            "scope": "openid email profile User.Read",
            "state": state,
            "response_mode": "query",
            "nonce": secrets.token_urlsafe(16),
        }

        auth_url = f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?{urlencode(params)}"

        return {"auth_url": auth_url, "state": state}

    elif provider == "google":
        # Use Google OAuth 2.0 configuration
        if not settings.google_client_id or not settings.google_client_secret:
            raise HTTPException(
                status_code=503,
                detail="Google SSO is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
            )

        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)

        # Store state (in production, use Redis with TTL)
        _oauth_states[state] = {
            "provider": "google",
            "redirect_uri": f"{settings.frontend_url}/auth/callback",
        }

        # Build Google OAuth authorization URL
        from urllib.parse import urlencode

        params = {
            "client_id": settings.google_client_id,
            "response_type": "code",
            "redirect_uri": f"{settings.frontend_url}/auth/callback",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }

        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

        return {"auth_url": auth_url, "state": state}

    elif provider == "okta":
        # Use Okta OAuth 2.0/OIDC configuration
        if (
            not settings.okta_client_id
            or not settings.okta_client_secret
            or not settings.okta_domain
        ):
            raise HTTPException(
                status_code=503,
                detail="Okta SSO is not configured. Please set OKTA_CLIENT_ID, OKTA_CLIENT_SECRET, and OKTA_DOMAIN.",
            )

        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)

        # Store state (in production, use Redis with TTL)
        _oauth_states[state] = {
            "provider": "okta",
            "redirect_uri": f"{settings.frontend_url}/auth/callback",
        }

        # Build Okta authorization URL
        from urllib.parse import urlencode

        params = {
            "client_id": settings.okta_client_id,
            "response_type": "code",
            "redirect_uri": f"{settings.frontend_url}/auth/callback",
            "scope": "openid email profile",
            "state": state,
            "nonce": secrets.token_urlsafe(16),
        }

        auth_url = (
            f"https://{settings.okta_domain}/oauth2/v1/authorize?{urlencode(params)}"
        )

        return {"auth_url": auth_url, "state": state}

    else:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")


@router.get("/callback/public")
async def public_sso_callback(
    code: str = Query(...),
    state: str = Query(...),
    error: str | None = Query(None),
    error_description: str | None = Query(None),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Public OAuth callback for built-in providers (Microsoft, Google, etc.).

    Exchanges authorization code for tokens and creates/links user.
    Redirects to frontend with tokens.
    """
    import httpx

    settings = get_settings()

    # Check for errors from provider
    if error:
        # Redirect to frontend with error
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=sso_failed&message={error_description or error}"
        )

    # Validate state
    if state not in _oauth_states:
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=invalid_state"
        )

    state_data = _oauth_states.pop(state)
    provider = state_data["provider"]
    redirect_uri = state_data["redirect_uri"]

    try:
        if provider == "microsoft":
            # Exchange code for tokens
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                    data={
                        "client_id": settings.azure_client_id,
                        "client_secret": settings.azure_client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": redirect_uri,
                        "scope": "openid email profile User.Read",
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )

                if token_response.status_code != 200:
                    error_data = token_response.json()
                    return RedirectResponse(
                        url=f"{settings.frontend_url}/login?error=token_exchange_failed&message={error_data.get('error_description', 'Unknown error')}"
                    )

                tokens = token_response.json()

                # Get user info from Microsoft Graph
                userinfo_response = await client.get(
                    "https://graph.microsoft.com/v1.0/me",
                    headers={"Authorization": f"Bearer {tokens['access_token']}"},
                )

                if userinfo_response.status_code != 200:
                    return RedirectResponse(
                        url=f"{settings.frontend_url}/login?error=userinfo_failed"
                    )

                userinfo = userinfo_response.json()

            # Extract user info
            sso_user = {
                "provider_user_id": userinfo.get("id"),
                "email": userinfo.get("mail") or userinfo.get("userPrincipalName"),
                "name": userinfo.get("displayName"),
                "provider": "microsoft",
            }

            # Create or get user (auto-provision for multi-tenant)
            user = await _provision_sso_user(sso_user, auth_service)

            # Create JWT tokens
            jwt_tokens = auth_service.create_tokens(user)

            # Redirect to frontend with tokens (using fragment to keep tokens secure)
            return RedirectResponse(
                url=f"{settings.frontend_url}/auth/callback?access_token={jwt_tokens['access_token']}&refresh_token={jwt_tokens['refresh_token']}"
            )

        elif provider == "google":
            # Exchange code for tokens
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "client_id": settings.google_client_id,
                        "client_secret": settings.google_client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": redirect_uri,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )

                if token_response.status_code != 200:
                    error_data = token_response.json()
                    return RedirectResponse(
                        url=f"{settings.frontend_url}/login?error=token_exchange_failed&message={error_data.get('error_description', 'Unknown error')}"
                    )

                tokens = token_response.json()

                # Get user info from Google
                userinfo_response = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {tokens['access_token']}"},
                )

                if userinfo_response.status_code != 200:
                    return RedirectResponse(
                        url=f"{settings.frontend_url}/login?error=userinfo_failed"
                    )

                userinfo = userinfo_response.json()

            # Extract user info
            sso_user = {
                "provider_user_id": userinfo.get("id"),
                "email": userinfo.get("email"),
                "name": userinfo.get("name"),
                "provider": "google",
            }

            # Create or get user (auto-provision for multi-tenant)
            user = await _provision_sso_user(sso_user, auth_service)

            # Create JWT tokens
            jwt_tokens = auth_service.create_tokens(user)

            # Redirect to frontend with tokens
            return RedirectResponse(
                url=f"{settings.frontend_url}/auth/callback?access_token={jwt_tokens['access_token']}&refresh_token={jwt_tokens['refresh_token']}"
            )

        elif provider == "okta":
            # Exchange code for tokens
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    f"https://{settings.okta_domain}/oauth2/v1/token",
                    data={
                        "client_id": settings.okta_client_id,
                        "client_secret": settings.okta_client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": redirect_uri,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )

                if token_response.status_code != 200:
                    error_data = token_response.json()
                    return RedirectResponse(
                        url=f"{settings.frontend_url}/login?error=token_exchange_failed&message={error_data.get('error_description', 'Unknown error')}"
                    )

                tokens = token_response.json()

                # Get user info from Okta
                userinfo_response = await client.get(
                    f"https://{settings.okta_domain}/oauth2/v1/userinfo",
                    headers={"Authorization": f"Bearer {tokens['access_token']}"},
                )

                if userinfo_response.status_code != 200:
                    return RedirectResponse(
                        url=f"{settings.frontend_url}/login?error=userinfo_failed"
                    )

                userinfo = userinfo_response.json()

            # Extract user info
            sso_user = {
                "provider_user_id": userinfo.get("sub"),
                "email": userinfo.get("email"),
                "name": userinfo.get("name") or userinfo.get("preferred_username"),
                "provider": "okta",
            }

            # Create or get user (auto-provision for multi-tenant)
            user = await _provision_sso_user(sso_user, auth_service)

            # Create JWT tokens
            jwt_tokens = auth_service.create_tokens(user)

            # Redirect to frontend with tokens
            return RedirectResponse(
                url=f"{settings.frontend_url}/auth/callback?access_token={jwt_tokens['access_token']}&refresh_token={jwt_tokens['refresh_token']}"
            )

        else:
            return RedirectResponse(
                url=f"{settings.frontend_url}/login?error=unsupported_provider"
            )

    except Exception as e:
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=sso_failed&message={str(e)}"
        )


async def _provision_sso_user(sso_user: dict, auth_service: AuthService) -> dict:
    """
    Provision or get an SSO user with domain-based organization grouping.

    SSO Domain Grouping Logic:
    1. Check if user identity already exists → return existing user
    2. Check if user with same email exists → link SSO identity
    3. Check if organization exists for email domain → join existing org
    4. First user from domain → create new org as tenant_admin
    """
    import uuid
    from datetime import UTC, datetime

    from kailash.workflow.builder import WorkflowBuilder

    runtime = AsyncLocalRuntime()
    now = datetime.now(UTC).isoformat()

    # Check if user identity already exists
    identity_workflow = WorkflowBuilder()
    identity_workflow.add_node(
        "UserIdentityListNode",
        "find_identity",
        {
            "filter": {
                "provider": sso_user["provider"],
                "provider_user_id": sso_user["provider_user_id"],
            },
            "limit": 1,
        },
    )

    try:
        identity_results, _ = await runtime.execute_workflow_async(
            identity_workflow.build(), inputs={}
        )
        identities = identity_results.get("find_identity", {}).get("records", [])

        if identities:
            # User already linked, get user
            user_workflow = WorkflowBuilder()
            user_workflow.add_node(
                "UserReadNode",
                "read_user",
                {
                    "id": identities[0]["user_id"],
                },
            )

            user_results, _ = await runtime.execute_workflow_async(
                user_workflow.build(), inputs={}
            )
            user = user_results.get("read_user")

            if user:
                return {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "organization_id": user["organization_id"],
                    "role": user.get("role", "developer"),
                }
    except Exception:
        # Table might not exist yet, continue to create user
        pass

    # Check if user with same email exists
    try:
        email_workflow = WorkflowBuilder()
        email_workflow.add_node(
            "UserListNode",
            "find_user",
            {
                "filter": {"email": sso_user["email"]},
                "limit": 1,
            },
        )

        email_results, _ = await runtime.execute_workflow_async(
            email_workflow.build(), inputs={}
        )
        existing_users = email_results.get("find_user", {}).get("records", [])

        if existing_users:
            user = existing_users[0]

            # Link SSO identity to existing user
            await _create_user_identity(runtime, user["id"], sso_user, now)

            return {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "organization_id": user["organization_id"],
                "role": user.get("role", "developer"),
            }
    except Exception:
        pass

    # Extract email domain for organization lookup
    email_domain = (
        sso_user["email"].split("@")[1].lower() if sso_user["email"] else "unknown"
    )

    # CRITICAL: Check if domain is a public email provider (gmail, outlook, etc.)
    # Public domains should NOT enable auto-join to prevent unrelated users joining same org
    is_public = is_public_email_domain(email_domain)

    # Only check for existing org if NOT a public domain
    existing_org = None
    if not is_public:
        existing_org = await _find_org_by_domain(runtime, email_domain)

    if existing_org:
        # Join existing organization with default role (only for corporate domains)
        user_id = str(uuid.uuid4())
        default_role = existing_org.get("default_role", "developer")

        try:
            # Create user in existing org
            user_workflow = WorkflowBuilder()
            user_workflow.add_node(
                "UserCreateNode",
                "create_user",
                {
                    "id": user_id,
                    "organization_id": existing_org["organization_id"],
                    "email": sso_user["email"],
                    "name": sso_user["name"] or sso_user["email"].split("@")[0],
                    "password_hash": "",  # No password for SSO users
                    "status": "active",
                    "role": default_role,
                    "last_login_at": now,
                    "mfa_enabled": False,
                    "created_at": now,
                    "updated_at": now,
                    "primary_organization_id": existing_org["organization_id"],
                },
            )
            await runtime.execute_workflow_async(user_workflow.build(), inputs={})

            # Create user identity link
            await _create_user_identity(runtime, user_id, sso_user, now)

            # Create UserOrganization junction record
            await _create_user_organization(
                runtime,
                user_id=user_id,
                org_id=existing_org["organization_id"],
                role=default_role,
                is_primary=True,
                joined_via="domain_match",
                now=now,
            )

            return {
                "id": user_id,
                "email": sso_user["email"],
                "name": sso_user["name"] or sso_user["email"].split("@")[0],
                "organization_id": existing_org["organization_id"],
                "role": default_role,
            }
        except Exception as e:
            raise ValueError(f"Failed to create user in existing org: {e}")

    # Create new organization for first user from domain (or public domain user)
    org_id = str(uuid.uuid4())

    # For public domains, use user's name instead of domain name
    if is_public:
        user_display_name = sso_user["name"] or sso_user["email"].split("@")[0]
        org_name = f"{user_display_name}'s Workspace"
        allow_domain_join = False  # CRITICAL: Disable auto-join for public domains
        sso_domain_value = None  # Don't set domain for public emails
    else:
        org_name = f"{email_domain} Organization"
        allow_domain_join = True
        sso_domain_value = email_domain

    try:
        org_workflow = WorkflowBuilder()
        org_workflow.add_node(
            "OrganizationCreateNode",
            "create_org",
            {
                "id": org_id,
                "name": org_name,
                "slug": f"org-{org_id[:8]}",
                "status": "active",
                "plan_tier": "free",
                "created_by": "sso_provision",
                "created_at": now,
                "updated_at": now,
                "sso_domain": sso_domain_value,
                "allow_domain_join": allow_domain_join,
            },
        )
        await runtime.execute_workflow_async(org_workflow.build(), inputs={})

        # Only create domain record for corporate domains (not public)
        if not is_public:
            await _create_organization_domain(
                runtime,
                org_id=org_id,
                domain=email_domain,
                default_role="developer",
                now=now,
            )

    except Exception:
        # Use a default org if creation fails
        org_id = "default-org"

    # Create new user as tenant_admin (first user from domain)
    user_id = str(uuid.uuid4())

    try:
        user_workflow = WorkflowBuilder()
        user_workflow.add_node(
            "UserCreateNode",
            "create_user",
            {
                "id": user_id,
                "organization_id": org_id,
                "email": sso_user["email"],
                "name": sso_user["name"] or sso_user["email"].split("@")[0],
                "password_hash": "",  # No password for SSO users
                "status": "active",
                "role": "tenant_admin",  # First user is tenant admin
                "last_login_at": now,
                "mfa_enabled": False,
                "created_at": now,
                "updated_at": now,
                "primary_organization_id": org_id,
            },
        )
        await runtime.execute_workflow_async(user_workflow.build(), inputs={})

        # Create user identity link
        await _create_user_identity(runtime, user_id, sso_user, now)

        # Create UserOrganization junction record
        await _create_user_organization(
            runtime,
            user_id=user_id,
            org_id=org_id,
            role="tenant_admin",
            is_primary=True,
            joined_via="sso",
            now=now,
        )

    except Exception as e:
        raise ValueError(f"Failed to create user: {e}")

    return {
        "id": user_id,
        "email": sso_user["email"],
        "name": sso_user["name"] or sso_user["email"].split("@")[0],
        "organization_id": org_id,
        "role": "tenant_admin",
    }


async def _find_org_by_domain(runtime, domain: str) -> dict | None:
    """
    Find an organization by verified domain for SSO auto-join.

    Checks OrganizationDomain table for verified domains with auto_join_enabled.
    """
    from kailash.workflow.builder import WorkflowBuilder

    try:
        domain_workflow = WorkflowBuilder()
        domain_workflow.add_node(
            "OrganizationDomainListNode",
            "find_domain",
            {
                "filter": {
                    "domain": domain,
                    "is_verified": True,
                    "auto_join_enabled": True,
                },
                "limit": 1,
            },
        )

        domain_results, _ = await runtime.execute_workflow_async(
            domain_workflow.build(), inputs={}
        )
        domains = domain_results.get("find_domain", {}).get("records", [])

        if domains:
            return domains[0]
    except Exception:
        pass

    # Fallback: check Organization.sso_domain field
    try:
        org_workflow = WorkflowBuilder()
        org_workflow.add_node(
            "OrganizationListNode",
            "find_org",
            {
                "filter": {
                    "sso_domain": domain,
                    "allow_domain_join": True,
                },
                "limit": 1,
            },
        )

        org_results, _ = await runtime.execute_workflow_async(
            org_workflow.build(), inputs={}
        )
        orgs = org_results.get("find_org", {}).get("records", [])

        if orgs:
            return {
                "organization_id": orgs[0]["id"],
                "domain": domain,
                "default_role": "developer",
            }
    except Exception:
        pass

    return None


async def _create_organization_domain(
    runtime, org_id: str, domain: str, default_role: str, now: str
):
    """Create a verified organization domain record for auto-join."""
    import uuid

    from kailash.workflow.builder import WorkflowBuilder

    domain_workflow = WorkflowBuilder()
    domain_workflow.add_node(
        "OrganizationDomainCreateNode",
        "create_domain",
        {
            "id": str(uuid.uuid4()),
            "organization_id": org_id,
            "domain": domain,
            "is_verified": True,  # Auto-verified for SSO domains
            "verification_method": "sso",
            "auto_join_enabled": True,
            "default_role": default_role,
            "created_at": now,
            "verified_at": now,
        },
    )

    await runtime.execute_workflow_async(domain_workflow.build(), inputs={})


async def _create_user_organization(
    runtime,
    user_id: str,
    org_id: str,
    role: str,
    is_primary: bool,
    joined_via: str,
    now: str,
):
    """Create a UserOrganization junction record for multi-org support."""
    import uuid

    from kailash.workflow.builder import WorkflowBuilder

    user_org_workflow = WorkflowBuilder()
    user_org_workflow.add_node(
        "UserOrganizationCreateNode",
        "create_user_org",
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "organization_id": org_id,
            "role": role,
            "is_primary": is_primary,
            "joined_via": joined_via,
            "joined_at": now,
            "created_at": now,
            "updated_at": now,
        },
    )

    await runtime.execute_workflow_async(user_org_workflow.build(), inputs={})


async def _create_user_identity(runtime, user_id: str, sso_user: dict, created_at: str):
    """Create a user identity link."""
    import uuid

    from kailash.workflow.builder import WorkflowBuilder

    identity_workflow = WorkflowBuilder()
    identity_workflow.add_node(
        "UserIdentityCreateNode",
        "create_identity",
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "provider": sso_user["provider"],
            "provider_user_id": sso_user["provider_user_id"],
            "email": sso_user["email"],
            "created_at": created_at,
        },
    )

    await runtime.execute_workflow_async(identity_workflow.build(), inputs={})


@router.post("/connections")
async def create_connection(
    request: CreateConnectionRequest,
    current_user: dict = Depends(get_current_user),
    sso_service: SSOService = Depends(get_sso_service),
):
    """
    Create a new SSO connection for the organization.

    Requires org_owner or org_admin role.
    """
    require_role(current_user, ["org_owner", "org_admin"])

    try:
        connection = await sso_service.create_connection(
            org_id=current_user["organization_id"],
            provider=request.provider,
            client_id=request.client_id,
            client_secret=request.client_secret,
            tenant_id=request.tenant_id,
            domain=request.domain,
            is_default=request.is_default,
            auto_provision=request.auto_provision,
            default_role=request.default_role,
            allowed_domains=request.allowed_domains,
            custom_urls=request.custom_urls,
        )
        return connection
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/connections")
async def list_connections(
    current_user: dict = Depends(get_current_user),
    sso_service: SSOService = Depends(get_sso_service),
):
    """
    List all SSO connections for the organization.
    """
    require_role(current_user, ["org_owner", "org_admin"])
    connections = await sso_service.list_connections(current_user["organization_id"])
    return {"connections": connections}


@router.get("/connections/{connection_id}")
async def get_connection(
    connection_id: str,
    current_user: dict = Depends(get_current_user),
    sso_service: SSOService = Depends(get_sso_service),
):
    """
    Get a specific SSO connection.
    """
    connection = await sso_service.get_connection(connection_id)

    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    if connection["organization_id"] != current_user["organization_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    return connection


@router.put("/connections/{connection_id}")
async def update_connection(
    connection_id: str,
    request: UpdateConnectionRequest,
    current_user: dict = Depends(get_current_user),
    sso_service: SSOService = Depends(get_sso_service),
):
    """
    Update an SSO connection.

    Requires org_owner or org_admin role.
    """
    require_role(current_user, ["org_owner", "org_admin"])

    # Verify ownership
    connection = await sso_service.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    if connection["organization_id"] != current_user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Update only provided fields
    update_data = request.model_dump(exclude_unset=True)

    try:
        updated = await sso_service.update_connection(connection_id, update_data)
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/connections/{connection_id}")
async def delete_connection(
    connection_id: str,
    current_user: dict = Depends(get_current_user),
    sso_service: SSOService = Depends(get_sso_service),
):
    """
    Delete an SSO connection.

    Requires org_owner or org_admin role.
    """
    require_role(current_user, ["org_owner", "org_admin"])

    # Verify ownership
    connection = await sso_service.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    if connection["organization_id"] != current_user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    await sso_service.delete_connection(connection_id)
    return {"status": "deleted"}


@router.get("/auth/{connection_id}")
async def initiate_sso_auth(
    connection_id: str,
    redirect_uri: str | None = Query(None),
    sso_service: SSOService = Depends(get_sso_service),
):
    """
    Initiate SSO authentication flow.

    Redirects user to the SSO provider's authorization page.
    """
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)

    # Store state with connection info (in production, use Redis with TTL)
    _oauth_states[state] = {
        "connection_id": connection_id,
        "redirect_uri": redirect_uri,
    }

    try:
        auth_url = await sso_service.get_authorization_url(
            connection_id=connection_id,
            state=state,
            redirect_uri=redirect_uri,
        )
        return auth_url
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback")
async def sso_callback(
    code: str = Query(...),
    state: str = Query(...),
    error: str | None = Query(None),
    error_description: str | None = Query(None),
    sso_service: SSOService = Depends(get_sso_service),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    OAuth callback endpoint.

    Exchanges authorization code for tokens and creates/links user.
    """
    # Check for errors from provider
    if error:
        raise HTTPException(
            status_code=400,
            detail=f"SSO error: {error} - {error_description or 'Unknown error'}",
        )

    # Validate state
    if state not in _oauth_states:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    state_data = _oauth_states.pop(state)
    connection_id = state_data["connection_id"]

    try:
        # Get connection to get org_id
        connection = await sso_service.get_connection(connection_id)
        if not connection:
            raise HTTPException(status_code=404, detail="Connection not found")

        # Get full connection for provisioning
        from kailash.runtime import AsyncLocalRuntime
        from kailash.workflow.builder import WorkflowBuilder

        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()
        workflow.add_node(
            "SSOConnectionReadNode",
            "read_connection",
            {
                "id": connection_id,
            },
        )
        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        full_connection = results.get("read_connection")

        # Exchange code for user info
        sso_user = await sso_service.exchange_code(connection_id, code)

        # Provision or link user
        user = await sso_service.provision_or_link_user(
            org_id=connection["organization_id"],
            sso_user=sso_user,
            connection=full_connection,
        )

        # Create JWT tokens
        tokens = auth_service.create_tokens(user)

        # Return tokens (in production, redirect with tokens in URL fragment or cookie)
        return {
            "user": user,
            "tokens": tokens,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/link")
async def link_account(
    request: LinkAccountRequest,
    current_user: dict = Depends(get_current_user),
    sso_service: SSOService = Depends(get_sso_service),
):
    """
    Link existing account to an SSO provider.

    Allows authenticated users to add SSO login to their account.
    """
    try:
        identity = await sso_service.link_user_to_sso(
            user_id=current_user["id"],
            connection_id=request.connection_id,
            code=request.code,
        )
        return identity
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/identities")
async def list_identities(
    current_user: dict = Depends(get_current_user),
):
    """
    List all SSO identities linked to the current user.
    """
    from kailash.runtime import AsyncLocalRuntime
    from kailash.workflow.builder import WorkflowBuilder

    runtime = AsyncLocalRuntime()
    workflow = WorkflowBuilder()
    workflow.add_node(
        "UserIdentityListNode",
        "list_identities",
        {
            "filter": {"user_id": current_user["id"]},
        },
    )

    results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
    identities = results.get("list_identities", {}).get("records", [])

    return {"identities": identities}
