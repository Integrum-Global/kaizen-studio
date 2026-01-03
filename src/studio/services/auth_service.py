"""
Authentication Service

Handles JWT token generation, validation, and user authentication.
Uses RS256 algorithm for production security.

EATP Integration:
- Creates PseudoAgent trust chains for authenticated users
- Stores session-to-human mapping in Redis for traceability
- Every user action can be traced back to the authorizing human
"""

import json
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
import redis
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.config import get_redis_url, get_settings


class AuthService:
    """
    Authentication service for JWT-based authentication.

    Features:
    - RS256 JWT tokens (asymmetric encryption)
    - Access tokens (15 minutes expiry)
    - Refresh tokens (7 days expiry)
    - Token blacklisting via Redis
    - Password hashing with bcrypt
    """

    def __init__(self, runtime: AsyncLocalRuntime | None = None):
        """Initialize the authentication service."""
        self.settings = get_settings()
        self.redis_client = redis.from_url(get_redis_url())
        self.runtime = runtime if runtime else AsyncLocalRuntime()

        # Use HS256 for development if no RSA keys provided
        if self.settings.jwt_private_key and self.settings.jwt_public_key:
            self.algorithm = "RS256"
            self.private_key = self.settings.jwt_private_key
            self.public_key = self.settings.jwt_public_key
        else:
            # Fall back to HS256 for development
            self.algorithm = "HS256"
            self.private_key = self.settings.jwt_secret_key
            self.public_key = self.settings.jwt_secret_key

    def hash_password(self, password: str) -> str:
        """
        Hash a password using bcrypt.

        Args:
            password: Plain text password

        Returns:
            Hashed password string
        """
        # Bcrypt has a 72-byte limit - truncate if needed
        password_bytes = password.encode("utf-8")[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode("utf-8")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.

        Args:
            plain_password: Plain text password to verify
            hashed_password: Stored hash to compare against

        Returns:
            True if password matches, False otherwise
        """
        # Bcrypt has a 72-byte limit - truncate if needed (same as hash_password)
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        try:
            return bcrypt.checkpw(password_bytes, hashed_bytes)
        except (ValueError, TypeError):
            return False

    def create_session(
        self,
        user_id: str,
        organization_id: str,
        role: str,
        email: str = "",
        name: str = "",
    ) -> dict:
        """
        Create a session with access token.

        Args:
            user_id: User's unique identifier
            organization_id: User's organization ID
            role: User's role
            email: User's email address
            name: User's display name

        Returns:
            Dict with 'token' key containing the access token
        """
        token = self.create_access_token(
            user_id=user_id,
            organization_id=organization_id,
            role=role,
            email=email,
            name=name,
        )
        return {"token": token}

    def create_access_token(
        self,
        user_id: str,
        organization_id: str,
        role: str,
        email: str = "",
        name: str = "",
        expires_delta: timedelta | None = None,
    ) -> str:
        """
        Create a JWT access token.

        Args:
            user_id: User's unique identifier
            organization_id: User's organization ID
            role: User's role
            email: User's email address
            name: User's display name
            expires_delta: Custom expiration time

        Returns:
            Encoded JWT token string
        """
        if expires_delta is None:
            expires_delta = timedelta(
                minutes=self.settings.jwt_access_token_expire_minutes
            )

        now = datetime.now(UTC)
        expire = now + expires_delta

        payload = {
            "sub": user_id,
            "org_id": organization_id,
            "role": role,
            "email": email,
            "name": name,
            "type": "access",
            "iat": now,
            "exp": expire,
            "jti": str(uuid.uuid4()),
        }

        return jwt.encode(payload, self.private_key, algorithm=self.algorithm)

    def create_refresh_token(
        self,
        user_id: str,
        expires_delta: timedelta | None = None,
    ) -> str:
        """
        Create a JWT refresh token.

        Args:
            user_id: User's unique identifier
            expires_delta: Custom expiration time

        Returns:
            Encoded JWT refresh token string
        """
        if expires_delta is None:
            expires_delta = timedelta(days=self.settings.jwt_refresh_token_expire_days)

        now = datetime.now(UTC)
        expire = now + expires_delta

        payload = {
            "sub": user_id,
            "type": "refresh",
            "iat": now,
            "exp": expire,
            "jti": str(uuid.uuid4()),
        }

        return jwt.encode(payload, self.private_key, algorithm=self.algorithm)

    def decode_token(self, token: str) -> dict:
        """
        Decode and validate a JWT token.

        Args:
            token: JWT token string

        Returns:
            Decoded token payload

        Raises:
            jwt.ExpiredSignatureError: Token has expired
            jwt.InvalidTokenError: Token is invalid
        """
        return jwt.decode(token, self.public_key, algorithms=[self.algorithm])

    def verify_token(self, token: str) -> dict | None:
        """
        Verify a token is valid and not blacklisted.

        Args:
            token: JWT token string

        Returns:
            Decoded payload if valid, None otherwise
        """
        try:
            payload = self.decode_token(token)

            # Check if token is blacklisted
            jti = payload.get("jti")
            if jti and self.is_token_blacklisted(jti):
                return None

            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def blacklist_token(self, jti: str, expires_in: int) -> None:
        """
        Add a token to the blacklist in Redis.

        Args:
            jti: JWT ID to blacklist
            expires_in: Seconds until the blacklist entry expires
        """
        key = f"blacklist:{jti}"
        self.redis_client.setex(key, expires_in, "blacklisted")

    def is_token_blacklisted(self, jti: str) -> bool:
        """
        Check if a token is blacklisted.

        Args:
            jti: JWT ID to check

        Returns:
            True if blacklisted, False otherwise
        """
        key = f"blacklist:{jti}"
        return self.redis_client.exists(key) > 0

    async def register_user(
        self,
        email: str,
        password: str,
        name: str,
        organization_name: str,
    ) -> dict:
        """
        Register a new user and organization.

        Args:
            email: User's email
            password: User's password
            name: User's display name
            organization_name: Organization name

        Returns:
            Dict with user and organization data

        Raises:
            ValueError: If email is already registered
        """
        # Check if email already exists
        import logging

        logger = logging.getLogger(__name__)

        check_workflow = WorkflowBuilder()
        check_workflow.add_node(
            "UserListNode",
            "check_email",
            {
                "filter": {"email": email},
                "limit": 1,
                "enable_cache": False,  # Bypass cache to ensure fresh data
            },
        )
        check_results, _ = await self.runtime.execute_workflow_async(
            check_workflow.build(), inputs={}
        )
        logger.warning(f"REGISTER DEBUG: check_results={check_results}")
        existing_users = check_results.get("check_email", {}).get("records", [])
        logger.warning(f"REGISTER DEBUG: existing_users={existing_users}")
        if existing_users:
            raise ValueError("duplicate email: Email already registered")

        now = datetime.now(UTC).isoformat()

        # Generate IDs
        org_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())

        # Create organization slug from name
        slug = organization_name.lower().replace(" ", "-")

        # Create organization workflow
        org_workflow = WorkflowBuilder()
        org_workflow.add_node(
            "OrganizationCreateNode",
            "create_org",
            {
                "id": org_id,
                "name": organization_name,
                "slug": slug,
                "status": "active",
                "plan_tier": "free",
                "created_by": user_id,
                "created_at": now,
                "updated_at": now,
            },
        )

        # Execute organization creation
        org_results, _ = await self.runtime.execute_workflow_async(
            org_workflow.build(), inputs={}
        )

        # Hash password
        password_hash = self.hash_password(password)

        # Create user workflow
        user_workflow = WorkflowBuilder()
        user_workflow.add_node(
            "UserCreateNode",
            "create_user",
            {
                "id": user_id,
                "organization_id": org_id,
                "email": email,
                "name": name,
                "password_hash": password_hash,
                "status": "active",
                "role": "org_owner",
                "last_login_at": now,
                "mfa_enabled": False,
                "created_at": now,
                "updated_at": now,
                "primary_organization_id": org_id,  # Multi-org support
            },
        )

        # Execute user creation
        user_results, _ = await self.runtime.execute_workflow_async(
            user_workflow.build(), inputs={}
        )

        # Create UserOrganization junction record for multi-org support
        user_org_workflow = WorkflowBuilder()
        user_org_workflow.add_node(
            "UserOrganizationCreateNode",
            "create_user_org",
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "organization_id": org_id,
                "role": "org_owner",
                "is_primary": True,
                "joined_via": "created",
                "joined_at": now,
                "created_at": now,
                "updated_at": now,
            },
        )

        await self.runtime.execute_workflow_async(user_org_workflow.build(), inputs={})

        # Create default workspace
        workspace_id = str(uuid.uuid4())
        workspace_workflow = WorkflowBuilder()
        workspace_workflow.add_node(
            "WorkspaceCreateNode",
            "create_workspace",
            {
                "id": workspace_id,
                "organization_id": org_id,
                "name": "Development",
                "environment_type": "development",
                "description": "Default development workspace",
                "created_at": now,
                "updated_at": now,
            },
        )

        await self.runtime.execute_workflow_async(workspace_workflow.build(), inputs={})

        return {
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
                "organization_id": org_id,
                "role": "org_owner",
            },
            "organization": {
                "id": org_id,
                "name": organization_name,
                "slug": slug,
            },
        }

    async def authenticate_user(self, email: str, password: str) -> dict | None:
        """
        Authenticate a user by email and password.

        Args:
            email: User's email
            password: User's password

        Returns:
            User data if authenticated, None otherwise
        """
        import logging

        logger = logging.getLogger(__name__)

        # Find user by email using DataFlow ListNode
        # Bypass cache to avoid stale data issues
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UserListNode",
            "find_user",
            {
                "filter": {"email": email},
                "limit": 1,
                "enable_cache": False,  # Bypass cache for authentication
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        logger.warning(f"AUTH DEBUG: find_user results={results}")
        users = results.get("find_user", {}).get("records", [])
        logger.warning(f"AUTH DEBUG: users found={len(users)}")
        if not users:
            return None

        user = users[0]

        # Verify password
        if not self.verify_password(password, user["password_hash"]):
            return None

        # Update last login
        now = datetime.now(UTC).isoformat()
        update_workflow = WorkflowBuilder()
        update_workflow.add_node(
            "UserUpdateNode",
            "update_login",
            {
                "filter": {"id": user["id"]},
                "fields": {"last_login_at": now},
            },
        )

        await self.runtime.execute_workflow_async(update_workflow.build(), inputs={})

        return {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "organization_id": user["organization_id"],
            "role": user["role"],
        }

    async def get_user_by_id(self, user_id: str) -> dict | None:
        """
        Get a user by their ID.

        Args:
            user_id: User's unique identifier

        Returns:
            User data if found, None otherwise
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UserReadNode",
            "read_user",
            {
                "id": user_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        user = results.get("read_user")
        if not user:
            return None

        return {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "organization_id": user["organization_id"],
            "role": user["role"],
            "status": user["status"],
            "mfa_enabled": user["mfa_enabled"],
            "last_login_at": user.get("last_login_at"),
            "created_at": user["created_at"],
            "is_super_admin": user.get("is_super_admin", False),
            "primary_organization_id": user.get("primary_organization_id"),
        }

    def create_tokens(self, user: dict) -> dict:
        """
        Create access and refresh tokens for a user.

        Args:
            user: User data dictionary

        Returns:
            Dict with access_token and refresh_token
        """
        access_token = self.create_access_token(
            user_id=user["id"],
            organization_id=user["organization_id"],
            role=user["role"],
            email=user.get("email", ""),
            name=user.get("name", ""),
        )

        refresh_token = self.create_refresh_token(user_id=user["id"])

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.settings.jwt_access_token_expire_minutes * 60,
        }

    async def refresh_access_token(self, refresh_token: str) -> dict | None:
        """
        Refresh an access token using a refresh token.

        Args:
            refresh_token: Valid refresh token

        Returns:
            New token pair if valid, None otherwise
        """
        payload = self.verify_token(refresh_token)
        if not payload:
            return None

        if payload.get("type") != "refresh":
            return None

        user_id = payload.get("sub")
        user = await self.get_user_by_id(user_id)

        if not user:
            return None

        # CRITICAL: Verify user still has access to their current organization
        # This prevents removed users from refreshing tokens and accessing the org
        current_org_id = user.get("organization_id")
        user_orgs = await self.get_user_organizations(user_id)

        if not user_orgs:
            # User has no organizations - cannot refresh
            return None

        # Check if user still has access to their current org
        target_org = None
        for org in user_orgs:
            if org["id"] == current_org_id:
                target_org = org
                break

        if not target_org:
            # User no longer has access to current org - use primary or first available
            target_org = next(
                (o for o in user_orgs if o.get("is_primary")), user_orgs[0]
            )
            # Update user context with new organization
            user["organization_id"] = target_org["id"]
            user["role"] = target_org["role"]

        # Blacklist the old refresh token
        jti = payload.get("jti")
        if jti:
            # Calculate remaining time until expiration
            exp = payload.get("exp", 0)
            now = datetime.now(UTC).timestamp()
            expires_in = max(int(exp - now), 1)
            self.blacklist_token(jti, expires_in)

        # Create new tokens
        return self.create_tokens(user)

    def logout(self, access_token: str, refresh_token: str | None = None) -> None:
        """
        Logout by blacklisting tokens.

        Args:
            access_token: Access token to blacklist
            refresh_token: Optional refresh token to blacklist
        """
        # Blacklist access token
        try:
            payload = self.decode_token(access_token)
            jti = payload.get("jti")
            if jti:
                exp = payload.get("exp", 0)
                now = datetime.now(UTC).timestamp()
                expires_in = max(int(exp - now), 1)
                self.blacklist_token(jti, expires_in)
        except jwt.InvalidTokenError:
            pass

        # Blacklist refresh token if provided
        if refresh_token:
            try:
                payload = self.decode_token(refresh_token)
                jti = payload.get("jti")
                if jti:
                    exp = payload.get("exp", 0)
                    now = datetime.now(UTC).timestamp()
                    expires_in = max(int(exp - now), 1)
                    self.blacklist_token(jti, expires_in)
            except jwt.InvalidTokenError:
                pass

    # =========================================================================
    # Multi-Organization Support Methods
    # =========================================================================

    async def get_user_organizations(self, user_id: str) -> list[dict]:
        """
        Get all organizations a user belongs to.

        Args:
            user_id: User's unique identifier

        Returns:
            List of organization memberships with role information
        """
        # Query UserOrganization junction table
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UserOrganizationListNode",
            "list_user_orgs",
            {
                "filter": {"user_id": user_id},
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        user_orgs = results.get("list_user_orgs", {}).get("records", [])

        # Enrich with organization details
        organizations = []
        for user_org in user_orgs:
            org_workflow = WorkflowBuilder()
            org_workflow.add_node(
                "OrganizationReadNode",
                "read_org",
                {"id": user_org["organization_id"]},
            )
            org_results, _ = await self.runtime.execute_workflow_async(
                org_workflow.build(), inputs={}
            )
            org = org_results.get("read_org")
            if org:
                organizations.append(
                    {
                        "id": org["id"],
                        "name": org["name"],
                        "slug": org.get("slug", ""),
                        "role": user_org["role"],
                        "is_primary": user_org["is_primary"],
                        "joined_at": user_org["joined_at"],
                        "joined_via": user_org["joined_via"],
                    }
                )

        # If no UserOrganization records, fall back to User.organization_id
        if not organizations:
            user = await self.get_user_by_id(user_id)
            if user and user.get("organization_id"):
                org_workflow = WorkflowBuilder()
                org_workflow.add_node(
                    "OrganizationReadNode",
                    "read_org",
                    {"id": user["organization_id"]},
                )
                org_results, _ = await self.runtime.execute_workflow_async(
                    org_workflow.build(), inputs={}
                )
                org = org_results.get("read_org")
                if org:
                    organizations.append(
                        {
                            "id": org["id"],
                            "name": org["name"],
                            "slug": org.get("slug", ""),
                            "role": user.get("role", "developer"),
                            "is_primary": True,
                            "joined_at": user.get("created_at", ""),
                            "joined_via": "legacy",
                        }
                    )

        return organizations

    async def switch_organization(
        self, user_id: str, target_org_id: str
    ) -> dict | None:
        """
        Switch user's active organization and return new tokens.

        Args:
            user_id: User's unique identifier
            target_org_id: Target organization to switch to

        Returns:
            New tokens with updated organization, or None if not authorized

        Raises:
            ValueError: If user doesn't have access to target organization
        """
        # Get user's organizations
        user_orgs = await self.get_user_organizations(user_id)

        # Find the target organization in user's orgs
        target_org = None
        for org in user_orgs:
            if org["id"] == target_org_id:
                target_org = org
                break

        if not target_org:
            raise ValueError("User does not have access to this organization")

        # Get user details
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        # Create user dict with new organization context
        user_with_org = {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "organization_id": target_org_id,
            "role": target_org["role"],
            "is_super_admin": user.get("is_super_admin", False),
        }

        # Create new tokens with updated organization
        tokens = self.create_tokens(user_with_org)

        return {
            **tokens,
            "active_organization": target_org,
        }

    async def check_super_admin(self, user_id: str) -> bool:
        """
        Check if a user is a super admin.

        Args:
            user_id: User's unique identifier

        Returns:
            True if user is super admin, False otherwise
        """
        user = await self.get_user_by_id(user_id)
        return user.get("is_super_admin", False) if user else False

    # =========================================================================
    # EATP PseudoAgent Integration
    # =========================================================================

    async def create_pseudo_agent_for_user(
        self,
        user: dict,
        session_id: str,
        auth_provider: str = "session",
    ) -> dict:
        """
        Create a PseudoAgent trust chain for a logged-in user.

        EATP: Every user gets a PseudoAgent that represents them in the
        trust system. This ensures all actions trace back to a human.

        Args:
            user: User data dictionary
            session_id: JWT token ID (jti) for session tracking
            auth_provider: Authentication provider (session, oauth, sso)

        Returns:
            PseudoAgent data with trust chain info
        """
        from studio.services.trust_service import HumanOrigin, TrustService

        trust_service = TrustService()
        now = datetime.now(UTC)

        # Create HumanOrigin from user
        human_origin = HumanOrigin(
            human_id=user.get("email", user.get("id", "")),
            display_name=user.get("name", user.get("email", "")),
            auth_provider=auth_provider,
            session_id=session_id,
            authenticated_at=now.isoformat(),
        )

        # Create PseudoAgent ID (prefixed to distinguish from regular agents)
        pseudo_agent_id = f"pseudo:{user['id']}"

        # Check if PseudoAgent already has active trust chain
        existing_chain = await trust_service.get_trust_chain(pseudo_agent_id)
        if existing_chain and existing_chain.get("status") == "active":
            # Update session mapping and return existing
            await self._store_session_mapping(session_id, user, human_origin)
            return {
                "pseudo_agent_id": pseudo_agent_id,
                "human_origin": human_origin.to_dict(),
                "trust_chain": existing_chain,
                "is_new": False,
            }

        # Get or create default authority for the organization
        authorities = await trust_service.list_authorities(
            organization_id=user.get("organization_id")
        )
        if authorities:
            authority_id = authorities[0]["id"]
        else:
            # Create default organizational authority
            authority = await trust_service.create_authority(
                organization_id=user.get("organization_id", ""),
                name="Default Authority",
                description="Auto-created authority for EATP",
                authority_type="organizational",
            )
            authority_id = authority["id"]

        # Establish trust chain for PseudoAgent
        chain = await trust_service.establish_trust(
            agent_id=pseudo_agent_id,
            authority_id=authority_id,
            organization_id=user.get("organization_id", ""),
            human_origin=human_origin,
            capabilities=["*"],  # PseudoAgents have all capabilities
            constraints=[],  # No constraints for human users
            expires_in_days=1,  # Short-lived, renewed on each login
        )

        # Store session-to-human mapping in Redis
        await self._store_session_mapping(session_id, user, human_origin)

        return {
            "pseudo_agent_id": pseudo_agent_id,
            "human_origin": human_origin.to_dict(),
            "trust_chain": chain,
            "is_new": True,
        }

    async def _store_session_mapping(
        self,
        session_id: str,
        user: dict,
        human_origin: "HumanOrigin",
    ) -> None:
        """
        Store session-to-human mapping in Redis for EATP traceability.

        This allows any request with a session to be traced back to
        the authorizing human.
        """
        key = f"eatp:session:{session_id}"
        mapping = {
            "user_id": user.get("id"),
            "email": user.get("email"),
            "name": user.get("name"),
            "organization_id": user.get("organization_id"),
            "human_origin": human_origin.to_dict(),
            "created_at": datetime.now(UTC).isoformat(),
        }
        # Store for 24 hours (matches PseudoAgent trust chain expiry)
        self.redis_client.setex(key, 86400, json.dumps(mapping))

    def get_session_human_origin(self, session_id: str) -> dict | None:
        """
        Get human origin data for a session.

        Args:
            session_id: JWT token ID (jti)

        Returns:
            Human origin data if found, None otherwise
        """
        key = f"eatp:session:{session_id}"
        data = self.redis_client.get(key)
        if data:
            mapping = json.loads(data)
            return mapping.get("human_origin")
        return None

    async def revoke_user_pseudo_agent(self, user_id: str, reason: str) -> dict:
        """
        Revoke a user's PseudoAgent trust chain.

        EATP: When a user's access is revoked, their PseudoAgent
        and all downstream delegations must be revoked.

        Args:
            user_id: User's unique identifier
            reason: Reason for revocation

        Returns:
            Revocation result
        """
        from studio.services.trust_service import TrustService

        trust_service = TrustService()
        pseudo_agent_id = f"pseudo:{user_id}"

        return await trust_service.revoke_cascade(
            agent_id=pseudo_agent_id,
            reason=reason,
            initiated_by="system",
        )
