"""
API Key Service

Business logic for API key management including creation, validation, and revocation.
"""

import json
import secrets
import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder
from passlib.context import CryptContext

# Password/key hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Available API key scopes
API_KEY_SCOPES = [
    "agents:read",
    "agents:write",
    "deployments:read",
    "deployments:write",
    "metrics:read",
    "pipelines:read",
    "pipelines:write",
    "gateways:read",
    "gateways:write",
]


class APIKeyService:
    """
    Service for managing API keys.

    Features:
    - Secure key generation with prefixes
    - Bcrypt hashing for key storage
    - Scope-based access control
    - Rate limit configuration per key
    """

    def __init__(self, runtime=None):
        """Initialize the API key service."""
        self.runtime = runtime or AsyncLocalRuntime()

    def _generate_key(self) -> tuple[str, str]:
        """
        Generate a new API key with prefix.

        Returns:
            Tuple of (plain_key, key_prefix)
        """
        # Generate prefix (8 chars for identification)
        prefix = secrets.token_hex(4)
        # Generate suffix (32 chars for security)
        suffix = secrets.token_urlsafe(32)
        # Full key format: sk_live_<prefix>_<suffix>
        plain_key = f"sk_live_{prefix}_{suffix}"
        key_prefix = f"sk_live_{prefix}"
        return plain_key, key_prefix

    def _hash_key(self, plain_key: str) -> str:
        """
        Hash an API key using bcrypt.

        Args:
            plain_key: Plain text API key

        Returns:
            Hashed key string
        """
        return pwd_context.hash(plain_key)

    def _verify_key(self, plain_key: str, hashed_key: str) -> bool:
        """
        Verify an API key against its hash.

        Args:
            plain_key: Plain text API key
            hashed_key: Stored hash

        Returns:
            True if key matches, False otherwise
        """
        return pwd_context.verify(plain_key, hashed_key)

    async def create(
        self,
        org_id: str,
        name: str,
        scopes: list,
        rate_limit: int,
        user_id: str,
        expires_at: str | None = None,
    ) -> tuple[dict, str]:
        """
        Create a new API key.

        Args:
            org_id: Organization ID
            name: Human-readable name for the key
            scopes: List of permission scopes
            rate_limit: Requests per minute
            user_id: User creating the key
            expires_at: Optional expiration timestamp

        Returns:
            Tuple of (key_record, plain_key) - plain key shown once
        """
        now = datetime.now(UTC).isoformat()
        key_id = str(uuid.uuid4())

        # Generate key
        plain_key, key_prefix = self._generate_key()
        key_hash = self._hash_key(plain_key)

        # Validate scopes
        valid_scopes = [s for s in scopes if s in API_KEY_SCOPES]

        # Create API key
        workflow = WorkflowBuilder()
        workflow.add_node(
            "APIKeyCreateNode",
            "create_key",
            {
                "id": key_id,
                "organization_id": org_id,
                "name": name,
                "key_hash": key_hash,
                "key_prefix": key_prefix,
                "scopes": json.dumps(valid_scopes),
                "rate_limit": rate_limit,
                "expires_at": expires_at or "",  # Kailash requires string, not None
                "last_used_at": "",  # Kailash requires string, not None
                "status": "active",
                "created_by": user_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        key_record = {
            "id": key_id,
            "organization_id": org_id,
            "name": name,
            "key_prefix": key_prefix,
            "scopes": valid_scopes,
            "rate_limit": rate_limit,
            "expires_at": expires_at,
            "status": "active",
            "created_by": user_id,
            "created_at": now,
        }

        return key_record, plain_key

    async def get(self, key_id: str) -> dict | None:
        """
        Get an API key by ID.

        Args:
            key_id: API key ID

        Returns:
            API key record or None
        """
        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "APIKeyReadNode",
                "read_key",
                {
                    "id": key_id,
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            key = results.get("read_key")
            if not key:
                return None

            return {
                "id": key["id"],
                "organization_id": key["organization_id"],
                "name": key["name"],
                "key_prefix": key["key_prefix"],
                "scopes": json.loads(key["scopes"]) if key["scopes"] else [],
                "rate_limit": key["rate_limit"],
                "expires_at": key.get("expires_at"),
                "last_used_at": key.get("last_used_at"),
                "status": key["status"],
                "created_by": key["created_by"],
                "created_at": key["created_at"],
            }
        except Exception:
            # ReadNode throws when record not found
            return None

    async def list(self, organization_id: str) -> list:
        """
        List all API keys for an organization.

        Args:
            organization_id: Organization ID

        Returns:
            List of API key records
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "APIKeyListNode",
            "list_keys",
            {
                "filter": {"organization_id": organization_id},
                "limit": 100,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        keys = results.get("list_keys", {}).get("records", [])
        return [
            {
                "id": key["id"],
                "organization_id": key["organization_id"],
                "name": key["name"],
                "key_prefix": key["key_prefix"],
                "scopes": json.loads(key["scopes"]) if key["scopes"] else [],
                "rate_limit": key["rate_limit"],
                "expires_at": key.get("expires_at"),
                "last_used_at": key.get("last_used_at"),
                "status": key["status"],
                "created_by": key["created_by"],
                "created_at": key["created_at"],
            }
            for key in keys
        ]

    async def revoke(self, key_id: str) -> None:
        """
        Revoke an API key.

        Args:
            key_id: API key ID to revoke
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "APIKeyUpdateNode",
            "revoke_key",
            {
                "filter": {"id": key_id},
                "fields": {
                    "status": "revoked",
                },
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    async def validate(self, plain_key: str) -> dict | None:
        """
        Validate an API key and return its record if valid.

        Args:
            plain_key: Plain text API key

        Returns:
            API key record if valid, None otherwise
        """
        # Extract prefix from key
        if not plain_key.startswith("sk_live_"):
            return None

        parts = plain_key.split("_")
        if len(parts) < 4:
            return None

        key_prefix = f"{parts[0]}_{parts[1]}_{parts[2]}"

        # Find key by prefix
        workflow = WorkflowBuilder()
        workflow.add_node(
            "APIKeyListNode",
            "find_key",
            {
                "filter": {"key_prefix": key_prefix},
                "limit": 1,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        keys = results.get("find_key", {}).get("records", [])
        if not keys:
            return None

        key = keys[0]

        # Verify the full key hash
        if not self._verify_key(plain_key, key["key_hash"]):
            return None

        # Check if key is active
        if key["status"] != "active":
            return None

        # Check if key is expired
        if key.get("expires_at"):
            expires_at = datetime.fromisoformat(
                key["expires_at"].replace("Z", "+00:00")
            )
            if datetime.now(UTC) > expires_at:
                return None

        return {
            "id": key["id"],
            "organization_id": key["organization_id"],
            "name": key["name"],
            "key_prefix": key["key_prefix"],
            "scopes": json.loads(key["scopes"]) if key["scopes"] else [],
            "rate_limit": key["rate_limit"],
            "expires_at": key.get("expires_at"),
            "last_used_at": key.get("last_used_at"),
            "status": key["status"],
            "created_by": key["created_by"],
            "created_at": key["created_at"],
        }

    async def update_last_used(self, key_id: str) -> None:
        """
        Update the last_used_at timestamp for an API key.

        Args:
            key_id: API key ID
        """
        now = datetime.now(UTC).isoformat()

        workflow = WorkflowBuilder()
        workflow.add_node(
            "APIKeyUpdateNode",
            "update_last_used",
            {
                "filter": {"id": key_id},
                "fields": {"last_used_at": now},
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    def check_scope(self, key: dict, required_scope: str) -> bool:
        """
        Check if an API key has a required scope.

        Args:
            key: API key record
            required_scope: Scope to check for

        Returns:
            True if key has the scope, False otherwise
        """
        scopes = key.get("scopes", [])

        # Check exact match
        if required_scope in scopes:
            return True

        # Check wildcard (e.g., "agents:write" includes "agents:read")
        if required_scope.endswith(":read"):
            write_scope = required_scope.replace(":read", ":write")
            if write_scope in scopes:
                return True

        return False
