"""
SSO Service

Handles SSO connection management and OAuth 2.0 / OIDC flows.
"""

import secrets
import uuid
from datetime import UTC, datetime
from urllib.parse import urlencode

import httpx
from cryptography.fernet import Fernet
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.config import get_settings
from studio.config.sso import PROVIDER_PRESETS, get_provider_urls


class SSOService:
    """
    SSO service for managing connections and OAuth flows.

    Features:
    - SSO connection CRUD operations
    - OAuth 2.0 authorization code flow
    - User provisioning and linking
    - Secret encryption with Fernet
    """

    def __init__(self):
        """Initialize the SSO service."""
        self.settings = get_settings()
        self.runtime = AsyncLocalRuntime()
        self._fernet = None

    @property
    def fernet(self) -> Fernet:
        """Get Fernet instance for encryption."""
        if self._fernet is None:
            encryption_key = getattr(self.settings, "encryption_key", None)
            if not encryption_key:
                # Generate a key for development (not for production!)
                encryption_key = Fernet.generate_key().decode()
            self._fernet = Fernet(
                encryption_key.encode()
                if isinstance(encryption_key, str)
                else encryption_key
            )
        return self._fernet

    def encrypt_secret(self, secret: str) -> str:
        """Encrypt a secret using Fernet."""
        return self.fernet.encrypt(secret.encode()).decode()

    def decrypt_secret(self, encrypted: str) -> str:
        """Decrypt a secret using Fernet."""
        return self.fernet.decrypt(encrypted.encode()).decode()

    async def create_connection(
        self,
        org_id: str,
        provider: str,
        client_id: str,
        client_secret: str,
        tenant_id: str | None = None,
        domain: str | None = None,
        is_default: bool = False,
        auto_provision: bool = True,
        default_role: str = "developer",
        allowed_domains: str | None = None,
        custom_urls: dict | None = None,
    ) -> dict:
        """
        Create a new SSO connection for an organization.

        Args:
            org_id: Organization ID
            provider: Provider type (azure, google, okta, auth0, custom)
            client_id: OAuth client ID
            client_secret: OAuth client secret (will be encrypted)
            tenant_id: Azure tenant ID
            domain: Okta/Auth0 domain
            is_default: Set as default connection
            auto_provision: Auto-create users on first login
            default_role: Role for auto-provisioned users
            allowed_domains: Comma-separated allowed email domains
            custom_urls: Custom URLs for 'custom' provider

        Returns:
            Created connection data
        """
        now = datetime.now(UTC).isoformat()
        connection_id = str(uuid.uuid4())

        # If setting as default, unset other defaults
        if is_default:
            await self._unset_default_connections(org_id)

        # Build connection data
        connection_data = {
            "id": connection_id,
            "organization_id": org_id,
            "provider": provider,
            "client_id": client_id,
            "client_secret_encrypted": self.encrypt_secret(client_secret),
            "tenant_id": tenant_id,
            "domain": domain,
            "is_default": is_default,
            "auto_provision": auto_provision,
            "default_role": default_role,
            "allowed_domains": allowed_domains,
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }

        # Add custom URLs if provided
        if custom_urls and provider == "custom":
            connection_data["custom_authorize_url"] = custom_urls.get("authorize_url")
            connection_data["custom_token_url"] = custom_urls.get("token_url")
            connection_data["custom_userinfo_url"] = custom_urls.get("userinfo_url")

        # Create connection
        workflow = WorkflowBuilder()
        workflow.add_node(
            "SSOConnectionCreateNode", "create_connection", connection_data
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Return without encrypted secret
        connection_data.pop("client_secret_encrypted")
        return connection_data

    async def _unset_default_connections(self, org_id: str):
        """Unset default flag on all org connections."""
        workflow = WorkflowBuilder()
        workflow.add_node(
            "SSOConnectionListNode",
            "list_connections",
            {
                "filter": {"organization_id": org_id, "is_default": True},
                "enable_cache": False,  # Disable cache to get fresh data
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        connections = results.get("list_connections", {}).get("records", [])

        for conn in connections:
            update_workflow = WorkflowBuilder()
            update_workflow.add_node(
                "SSOConnectionUpdateNode",
                "update_connection",
                {
                    "filter": {"id": conn["id"]},
                    "fields": {
                        "is_default": False,
                        # NOTE: Do NOT set updated_at - DataFlow manages it automatically
                    },
                },
            )
            await self.runtime.execute_workflow_async(
                update_workflow.build(), inputs={}
            )

    async def get_connection(self, connection_id: str) -> dict | None:
        """
        Get an SSO connection by ID.

        Args:
            connection_id: Connection ID

        Returns:
            Connection data if found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "SSOConnectionReadNode",
            "read_connection",
            {
                "id": connection_id,
            },
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            connection = results.get("read_connection")

            if connection:
                # Remove encrypted secret from response
                connection.pop("client_secret_encrypted", None)

            return connection
        except Exception:
            # ReadNode throws when record not found
            return None

    async def list_connections(self, org_id: str) -> list:
        """
        List all SSO connections for an organization.

        Args:
            org_id: Organization ID

        Returns:
            List of connections
        """
        return await self.get_org_connections(org_id)

    async def get_org_connections(self, org_id: str) -> list:
        """
        Get all SSO connections for an organization.

        Args:
            org_id: Organization ID

        Returns:
            List of connections
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "SSOConnectionListNode",
            "list_connections",
            {
                "filter": {"organization_id": org_id},
                "enable_cache": False,  # Disable cache to ensure fresh data
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        connections = results.get("list_connections", {}).get("records", [])

        # Remove encrypted secrets
        for conn in connections:
            conn.pop("client_secret_encrypted", None)

        return connections

    async def update_connection(self, connection_id: str, data: dict) -> dict:
        """
        Update an SSO connection.

        Args:
            connection_id: Connection ID
            data: Fields to update

        Returns:
            Updated connection data
        """
        # Encrypt secret if provided
        if "client_secret" in data:
            data["client_secret_encrypted"] = self.encrypt_secret(
                data.pop("client_secret")
            )

        # Handle default flag
        if data.get("is_default"):
            connection = await self.get_connection(connection_id)
            if connection:
                await self._unset_default_connections(connection["organization_id"])

        # NOTE: Do NOT set updated_at - DataFlow manages it automatically

        workflow = WorkflowBuilder()
        workflow.add_node(
            "SSOConnectionUpdateNode",
            "update_connection",
            {
                "filter": {"id": connection_id},
                "fields": data,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return await self.get_connection(connection_id)

    async def delete_connection(self, connection_id: str):
        """
        Delete an SSO connection.

        Args:
            connection_id: Connection ID
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "SSOConnectionDeleteNode",
            "delete_connection",
            {
                "filter": {"id": connection_id},
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    async def get_authorization_url(
        self, connection_id: str, state: str, redirect_uri: str | None = None
    ) -> str:
        """
        Get the OAuth authorization URL for a connection.

        Args:
            connection_id: Connection ID
            state: State parameter for CSRF protection
            redirect_uri: Optional custom redirect URI

        Returns:
            Authorization URL
        """
        # Get connection with encrypted secret
        workflow = WorkflowBuilder()
        workflow.add_node(
            "SSOConnectionReadNode",
            "read_connection",
            {
                "id": connection_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        connection = results.get("read_connection")

        if not connection:
            raise ValueError(f"Connection not found: {connection_id}")

        if connection["status"] != "active":
            raise ValueError("SSO connection is not active")

        # Get provider URLs
        provider = connection["provider"]
        if provider == "custom":
            urls = {
                "authorize_url": connection["custom_authorize_url"],
                "token_url": connection["custom_token_url"],
                "userinfo_url": connection["custom_userinfo_url"],
            }
        else:
            urls = get_provider_urls(
                provider,
                tenant_id=connection.get("tenant_id"),
                domain=connection.get("domain"),
            )

        # Build authorization URL
        callback_uri = (
            redirect_uri or f"{self.settings.frontend_url}/api/v1/sso/callback"
        )

        params = {
            "client_id": connection["client_id"],
            "response_type": "code",
            "redirect_uri": callback_uri,
            "scope": PROVIDER_PRESETS.get(provider, {}).get(
                "scope", "openid email profile"
            ),
            "state": state,
        }

        # Azure-specific: add nonce for OIDC
        if provider == "azure":
            params["nonce"] = secrets.token_urlsafe(16)

        return f"{urls['authorize_url']}?{urlencode(params)}"

    async def exchange_code(
        self, connection_id: str, code: str, redirect_uri: str | None = None
    ) -> dict:
        """
        Exchange authorization code for tokens and user info.

        Args:
            connection_id: Connection ID
            code: Authorization code
            redirect_uri: Redirect URI used in auth request

        Returns:
            User info from provider
        """
        # Get connection with encrypted secret
        workflow = WorkflowBuilder()
        workflow.add_node(
            "SSOConnectionReadNode",
            "read_connection",
            {
                "id": connection_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        connection = results.get("read_connection")

        if not connection:
            raise ValueError(f"Connection not found: {connection_id}")

        # Get provider URLs
        provider = connection["provider"]
        if provider == "custom":
            urls = {
                "authorize_url": connection["custom_authorize_url"],
                "token_url": connection["custom_token_url"],
                "userinfo_url": connection["custom_userinfo_url"],
            }
        else:
            urls = get_provider_urls(
                provider,
                tenant_id=connection.get("tenant_id"),
                domain=connection.get("domain"),
            )

        callback_uri = (
            redirect_uri or f"{self.settings.frontend_url}/api/v1/sso/callback"
        )

        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                urls["token_url"],
                data={
                    "client_id": connection["client_id"],
                    "client_secret": self.decrypt_secret(
                        connection["client_secret_encrypted"]
                    ),
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": callback_uri,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if token_response.status_code != 200:
                raise ValueError(f"Token exchange failed: {token_response.text}")

            tokens = token_response.json()

            # Get user info
            userinfo_response = await client.get(
                urls["userinfo_url"],
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )

            if userinfo_response.status_code != 200:
                raise ValueError(f"User info fetch failed: {userinfo_response.text}")

            userinfo = userinfo_response.json()

        # Normalize user info based on provider
        if provider == "google":
            # Google uses "id" instead of "sub" for user ID
            return {
                "provider_user_id": userinfo.get("id") or userinfo.get("sub"),
                "email": userinfo.get("email"),
                "name": userinfo.get("name") or userinfo.get("given_name", ""),
                "provider": provider,
            }
        elif provider == "okta":
            # Okta uses "sub" and may use "preferred_username" instead of "name"
            return {
                "provider_user_id": userinfo.get("sub"),
                "email": userinfo.get("email"),
                "name": userinfo.get("name") or userinfo.get("preferred_username", ""),
                "provider": provider,
            }
        elif provider == "azure":
            # Azure AD uses various fields from Microsoft Graph
            return {
                "provider_user_id": userinfo.get("id") or userinfo.get("sub"),
                "email": userinfo.get("email")
                or userinfo.get("mail")
                or userinfo.get("userPrincipalName"),
                "name": userinfo.get("displayName")
                or userinfo.get("name")
                or userinfo.get("given_name", ""),
                "provider": provider,
            }
        else:
            # Generic normalization for other providers
            return {
                "provider_user_id": userinfo.get("sub") or userinfo.get("id"),
                "email": userinfo.get("email"),
                "name": userinfo.get("name") or userinfo.get("given_name", ""),
                "provider": provider,
            }

    async def provision_or_link_user(
        self, org_id: str, sso_user: dict, connection: dict
    ) -> dict:
        """
        Provision a new user or link to existing user.

        Args:
            org_id: Organization ID
            sso_user: User info from SSO provider
            connection: SSO connection config

        Returns:
            User data
        """
        now = datetime.now(UTC).isoformat()

        # Check allowed domains
        if connection.get("allowed_domains"):
            allowed = [
                d.strip().lower() for d in connection["allowed_domains"].split(",")
            ]
            email_domain = sso_user["email"].split("@")[1].lower()
            if email_domain not in allowed:
                raise ValueError(
                    f"Email domain '{email_domain}' is not allowed for this SSO connection"
                )

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

        identity_results, _ = await self.runtime.execute_workflow_async(
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

            user_results, _ = await self.runtime.execute_workflow_async(
                user_workflow.build(), inputs={}
            )
            user = user_results.get("read_user")

            if user:
                # Update last login
                update_workflow = WorkflowBuilder()
                # NOTE: Do NOT set updated_at - DataFlow manages it automatically
                update_workflow.add_node(
                    "UserUpdateNode",
                    "update_login",
                    {
                        "filter": {"id": user["id"]},
                        "fields": {"last_login_at": now},
                    },
                )
                await self.runtime.execute_workflow_async(
                    update_workflow.build(), inputs={}
                )

                return {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "organization_id": user["organization_id"],
                    "role": user["role"],
                }

        # Check if user with same email exists in org
        email_workflow = WorkflowBuilder()
        email_workflow.add_node(
            "UserListNode",
            "find_user",
            {
                "filter": {
                    "email": sso_user["email"],
                    "organization_id": org_id,
                },
                "limit": 1,
            },
        )

        email_results, _ = await self.runtime.execute_workflow_async(
            email_workflow.build(), inputs={}
        )
        existing_users = email_results.get("find_user", {}).get("records", [])

        if existing_users:
            # Link existing user to SSO
            user = existing_users[0]
            await self._create_user_identity(user["id"], sso_user, now)

            # Update last login
            # NOTE: Do NOT set updated_at - DataFlow manages it automatically
            update_workflow = WorkflowBuilder()
            update_workflow.add_node(
                "UserUpdateNode",
                "update_login",
                {
                    "filter": {"id": user["id"]},
                    "fields": {"last_login_at": now},
                },
            )
            await self.runtime.execute_workflow_async(
                update_workflow.build(), inputs={}
            )

            return {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "organization_id": user["organization_id"],
                "role": user["role"],
            }

        # Auto-provision new user
        if not connection.get("auto_provision"):
            raise ValueError(
                "Auto-provisioning is disabled. User must be invited first."
            )

        user_id = str(uuid.uuid4())

        # Create user
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
                "role": connection.get("default_role", "developer"),
                "last_login_at": now,
                "mfa_enabled": False,
                "created_at": now,
                "updated_at": now,
            },
        )

        await self.runtime.execute_workflow_async(user_workflow.build(), inputs={})

        # Create user identity link
        await self._create_user_identity(user_id, sso_user, now)

        return {
            "id": user_id,
            "email": sso_user["email"],
            "name": sso_user["name"] or sso_user["email"].split("@")[0],
            "organization_id": org_id,
            "role": connection.get("default_role", "developer"),
        }

    async def _create_user_identity(
        self, user_id: str, sso_user: dict, created_at: str
    ):
        """Create a user identity link."""
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

        await self.runtime.execute_workflow_async(identity_workflow.build(), inputs={})

    async def link_user_to_sso(
        self, user_id: str, connection_id: str, code: str
    ) -> dict:
        """
        Link an existing user account to an SSO provider.

        Args:
            user_id: User ID to link
            connection_id: SSO connection ID
            code: Authorization code from OAuth flow

        Returns:
            User identity data
        """
        # Exchange code for user info
        sso_user = await self.exchange_code(connection_id, code)
        now = datetime.now(UTC).isoformat()

        # Check if already linked
        check_workflow = WorkflowBuilder()
        check_workflow.add_node(
            "UserIdentityListNode",
            "check_identity",
            {
                "filter": {
                    "user_id": user_id,
                    "provider": sso_user["provider"],
                },
                "limit": 1,
            },
        )

        check_results, _ = await self.runtime.execute_workflow_async(
            check_workflow.build(), inputs={}
        )
        existing = check_results.get("check_identity", {}).get("records", [])

        if existing:
            raise ValueError("User already linked to this SSO provider")

        # Create identity link
        identity_id = str(uuid.uuid4())
        identity_workflow = WorkflowBuilder()
        identity_workflow.add_node(
            "UserIdentityCreateNode",
            "create_identity",
            {
                "id": identity_id,
                "user_id": user_id,
                "provider": sso_user["provider"],
                "provider_user_id": sso_user["provider_user_id"],
                "email": sso_user["email"],
                "created_at": now,
            },
        )

        await self.runtime.execute_workflow_async(identity_workflow.build(), inputs={})

        return {
            "id": identity_id,
            "user_id": user_id,
            "provider": sso_user["provider"],
            "email": sso_user["email"],
        }
