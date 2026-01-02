"""
User Service

CRUD operations for users using DataFlow nodes.
"""

import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    """
    User service for managing users.

    Uses DataFlow nodes for all database operations.
    """

    def __init__(self, runtime=None):
        """Initialize the user service."""
        self.runtime = runtime or AsyncLocalRuntime()

    def hash_password(self, password: str) -> str:
        """
        Hash a password using bcrypt.

        Bcrypt has a 72-byte limit, so we truncate long passwords.
        """
        # Truncate password to 72 bytes for bcrypt compatibility
        if len(password.encode("utf-8")) > 72:
            password = password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
        return pwd_context.hash(password)

    async def create_user(
        self,
        email: str,
        password: str,
        name: str,
        organization_id: str,
        role: str,
    ) -> dict:
        """
        Create a new user.

        Args:
            email: User email
            password: Plain text password
            name: User display name
            organization_id: Organization ID
            role: User role (org_owner, org_admin, developer, viewer)

        Returns:
            Created user data (without password_hash)
        """
        now = datetime.now(UTC).isoformat()
        user_id = str(uuid.uuid4())
        password_hash = self.hash_password(password)

        workflow = WorkflowBuilder()
        workflow.add_node(
            "UserCreateNode",
            "create",
            {
                "id": user_id,
                "organization_id": organization_id,
                "email": email,
                "name": name,
                "password_hash": password_hash,
                "status": "active",
                "role": role,
                # Note: last_login_at, created_at and updated_at are auto-managed by DataFlow
                "mfa_enabled": False,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Check for errors in workflow result
        result = results.get("create")
        if result is None:
            raise ValueError("Failed to create user: No result from UserCreateNode")
        if isinstance(result, dict):
            if result.get("error") or result.get("success") is False:
                raise ValueError(
                    f"Failed to create user: {result.get('error', 'Unknown error')}"
                )

        # Return the created record from DataFlow (with password_hash removed)
        if isinstance(result, dict) and "id" in result:
            result.pop("password_hash", None)
            return result

        # Fallback to constructed response if result doesn't have expected fields
        return {
            "id": user_id,
            "organization_id": organization_id,
            "email": email,
            "name": name,
            "status": "active",
            "role": role,
            "last_login_at": "",  # Empty string instead of None
            "mfa_enabled": False,
            "created_at": now,
            "updated_at": now,
        }

    async def get_user(self, user_id: str) -> dict | None:
        """
        Get a user by ID.

        Args:
            user_id: User ID

        Returns:
            User data if found (without password_hash), None otherwise
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UserReadNode",
            "read",
            {
                "id": user_id,
            },
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            user = results.get("read")
            if user:
                user.pop("password_hash", None)
            return user
        except Exception:
            # ReadNode throws when record not found
            return None

    async def get_user_by_email(self, email: str) -> dict | None:
        """
        Get a user by email.

        Args:
            email: User email

        Returns:
            User data if found (without password_hash), None otherwise
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UserListNode",
            "find",
            {
                "filter": {"email": email},
                "limit": 1,
                "enable_cache": False,  # Bypass cache to avoid stale data issues
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        users = results.get("find", {}).get("records", [])
        if not users:
            return None

        user = users[0]
        user.pop("password_hash", None)
        return user

    async def update_user(self, user_id: str, data: dict) -> dict | None:
        """
        Update a user.

        Args:
            user_id: User ID
            data: Fields to update

        Returns:
            Updated user data (without password_hash)
        """
        now = datetime.now(UTC).isoformat()

        # Hash password if being updated
        if "password" in data:
            data["password_hash"] = self.hash_password(data.pop("password"))

        workflow = WorkflowBuilder()
        workflow.add_node(
            "UserUpdateNode",
            "update",
            {
                "filter": {"id": user_id},
                "fields": data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return await self.get_user(user_id)

    async def delete_user(self, user_id: str) -> bool:
        """
        Delete a user (soft delete by setting status).

        Args:
            user_id: User ID

        Returns:
            True if deleted successfully
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "UserUpdateNode",
            "delete",
            {
                "filter": {"id": user_id},
                "fields": {
                    "status": "deleted"
                },  # updated_at is auto-managed by DataFlow
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return True

    async def list_users(
        self,
        organization_id: str,
        filters: dict | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        List users in an organization with optional filters.

        Args:
            organization_id: Organization ID
            filters: Optional additional filter conditions
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        workflow = WorkflowBuilder()

        # Combine organization filter with additional filters
        combined_filters = {"organization_id": organization_id}
        if filters:
            combined_filters.update(filters)

        workflow.add_node(
            "UserListNode",
            "list",
            {
                "filter": combined_filters,
                "limit": limit,
                "offset": offset,
                "return_total": True,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        records = list_result.get("records", [])

        # Remove sensitive data from all records
        for record in records:
            record.pop("password_hash", None)

        # DataFlow returns 'count' not 'total' when return_total=True
        return {
            "records": records,
            "total": list_result.get("count", list_result.get("total", 0)),
        }
