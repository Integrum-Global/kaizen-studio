"""
RBAC Service

Handles role-based access control operations.
"""

import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.config.permissions import (
    PERMISSION_DESCRIPTIONS,
    PERMISSION_MATRIX,
    VALID_ROLES,
)


class RBACService:
    """
    RBAC service for managing permissions and authorization.

    Features:
    - Permission checking for users
    - Role-permission mapping management
    - Default permission seeding
    - Wildcard permission support
    """

    def __init__(self, runtime: AsyncLocalRuntime | None = None):
        """Initialize the RBAC service."""
        self.runtime = runtime if runtime else AsyncLocalRuntime()

    async def check_permission(self, user_id: str, permission: str) -> bool:
        """
        Check if a user has a specific permission.

        Args:
            user_id: User's unique identifier
            permission: Permission to check (e.g., "agents:create")

        Returns:
            True if user has permission, False otherwise
        """
        # Get user's role
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
            return False

        role = user.get("role")
        if not role:
            return False

        # Get user's effective permissions
        user_permissions = await self.get_user_permissions(user_id)

        # Check for exact match
        if permission in user_permissions:
            return True

        # Check for wildcard permission
        resource = permission.split(":")[0]
        wildcard = f"{resource}:*"
        if wildcard in user_permissions:
            return True

        return False

    async def get_user_permissions(self, user_id: str) -> list[str]:
        """
        Get all permissions for a user based on their role.

        Args:
            user_id: User's unique identifier

        Returns:
            List of permission names
        """
        # Get user's role
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
            return []

        role = user.get("role")
        if not role:
            return []

        # Get permissions for role from database
        perm_workflow = WorkflowBuilder()
        perm_workflow.add_node(
            "RolePermissionListNode",
            "list_role_perms",
            {
                "filter": {"role": role},
            },
        )

        perm_results, _ = await self.runtime.execute_workflow_async(
            perm_workflow.build(), inputs={}
        )

        role_permissions = perm_results.get("list_role_perms", {}).get("records", [])

        if not role_permissions:
            # Fall back to default matrix if no database entries
            return PERMISSION_MATRIX.get(role, [])

        # Get permission names
        permission_ids = [rp["permission_id"] for rp in role_permissions]
        if not permission_ids:
            return []

        # Fetch permissions
        permissions = []
        for perm_id in permission_ids:
            perm_wf = WorkflowBuilder()
            perm_wf.add_node(
                "PermissionReadNode",
                "read_perm",
                {
                    "id": perm_id,
                },
            )

            perm_res, _ = await self.runtime.execute_workflow_async(
                perm_wf.build(), inputs={}
            )

            perm = perm_res.get("read_perm")
            if perm:
                permissions.append(perm["name"])

        return permissions

    async def grant_permission(self, role: str, permission_id: str) -> dict:
        """
        Grant a permission to a role.

        Args:
            role: Role name
            permission_id: Permission ID to grant

        Returns:
            Created RolePermission record
        """
        if role not in VALID_ROLES:
            raise ValueError(f"Invalid role: {role}")

        now = datetime.now(UTC).isoformat()
        role_perm_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "RolePermissionCreateNode",
            "create_role_perm",
            {
                "id": role_perm_id,
                "role": role,
                "permission_id": permission_id,
                "created_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create_role_perm")

    async def revoke_permission(self, role: str, permission_id: str) -> bool:
        """
        Revoke a permission from a role.

        Args:
            role: Role name
            permission_id: Permission ID to revoke

        Returns:
            True if revoked, False if not found
        """
        # Find the role permission
        workflow = WorkflowBuilder()
        workflow.add_node(
            "RolePermissionListNode",
            "find_role_perm",
            {
                "filter": {
                    "role": role,
                    "permission_id": permission_id,
                },
                "limit": 1,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        role_perms = results.get("find_role_perm", {}).get("records", [])
        if not role_perms:
            return False

        # Delete the role permission
        role_perm_id = role_perms[0]["id"]
        delete_workflow = WorkflowBuilder()
        delete_workflow.add_node(
            "RolePermissionDeleteNode",
            "delete_role_perm",
            {
                "id": role_perm_id,
            },
        )

        await self.runtime.execute_workflow_async(delete_workflow.build(), inputs={})

        return True

    async def list_permissions(self) -> list[dict]:
        """
        List all available permissions.

        Returns:
            List of permission dictionaries
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PermissionListNode",
            "list_perms",
            {
                "limit": 1000,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("list_perms", {}).get("records", [])

    async def get_role_member_count(self, role: str) -> int:
        """
        Get the number of users with a specific role.

        Args:
            role: Role name

        Returns:
            Count of users with this role
        """
        if role not in VALID_ROLES:
            return 0

        workflow = WorkflowBuilder()
        workflow.add_node(
            "UserListNode",
            "list_users",
            {
                "filter": {"role": role},
                "limit": 10000,  # Get count of all users with this role
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        user_data = results.get("list_users", {})
        return user_data.get("total", len(user_data.get("records", [])))

    async def get_role_permissions(self, role: str) -> list[dict]:
        """
        Get all permissions for a specific role.

        Args:
            role: Role name

        Returns:
            List of permission dictionaries
        """
        if role not in VALID_ROLES:
            raise ValueError(f"Invalid role: {role}")

        # Get role permission mappings
        workflow = WorkflowBuilder()
        workflow.add_node(
            "RolePermissionListNode",
            "list_role_perms",
            {
                "filter": {"role": role},
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        role_permissions = results.get("list_role_perms", {}).get("records", [])

        if not role_permissions:
            # Return default matrix permissions
            return [
                {"name": perm, "description": PERMISSION_DESCRIPTIONS.get(perm, "")}
                for perm in PERMISSION_MATRIX.get(role, [])
            ]

        # Fetch full permission details
        permissions = []
        for rp in role_permissions:
            perm_wf = WorkflowBuilder()
            perm_wf.add_node(
                "PermissionReadNode",
                "read_perm",
                {
                    "id": rp["permission_id"],
                },
            )

            perm_res, _ = await self.runtime.execute_workflow_async(
                perm_wf.build(), inputs={}
            )

            perm = perm_res.get("read_perm")
            if perm:
                permissions.append(perm)

        return permissions

    async def seed_default_permissions(self) -> dict:
        """
        Seed default permissions from PERMISSION_MATRIX.

        Creates all permissions and role-permission mappings
        if they don't exist.

        Returns:
            Dict with counts of created permissions and mappings
        """
        now = datetime.now(UTC).isoformat()
        created_permissions = 0
        created_mappings = 0

        # Collect all unique permissions from the matrix
        all_permissions = set()
        for role, perms in PERMISSION_MATRIX.items():
            all_permissions.update(perms)

        # Create permissions
        permission_map = {}  # name -> id
        for perm_name in all_permissions:
            # Check if permission exists
            check_workflow = WorkflowBuilder()
            check_workflow.add_node(
                "PermissionListNode",
                "check_perm",
                {
                    "filter": {"name": perm_name},
                    "limit": 1,
                },
            )

            check_results, _ = await self.runtime.execute_workflow_async(
                check_workflow.build(), inputs={}
            )

            existing = check_results.get("check_perm", {}).get("records", [])
            if existing:
                permission_map[perm_name] = existing[0]["id"]
                continue

            # Create permission
            perm_id = str(uuid.uuid4())
            parts = perm_name.split(":")
            resource = parts[0]
            action = parts[1] if len(parts) > 1 else "*"

            create_workflow = WorkflowBuilder()
            create_workflow.add_node(
                "PermissionCreateNode",
                "create_perm",
                {
                    "id": perm_id,
                    "name": perm_name,
                    "resource": resource,
                    "action": action,
                    "description": PERMISSION_DESCRIPTIONS.get(
                        perm_name, f"{action} {resource}"
                    ),
                },
            )

            await self.runtime.execute_workflow_async(
                create_workflow.build(), inputs={}
            )

            permission_map[perm_name] = perm_id
            created_permissions += 1

        # Create role-permission mappings
        for role, perms in PERMISSION_MATRIX.items():
            for perm_name in perms:
                perm_id = permission_map.get(perm_name)
                if not perm_id:
                    continue

                # Check if mapping exists
                check_workflow = WorkflowBuilder()
                check_workflow.add_node(
                    "RolePermissionListNode",
                    "check_mapping",
                    {
                        "filter": {
                            "role": role,
                            "permission_id": perm_id,
                        },
                        "limit": 1,
                    },
                )

                check_results, _ = await self.runtime.execute_workflow_async(
                    check_workflow.build(), inputs={}
                )

                existing = check_results.get("check_mapping", {}).get("records", [])
                if existing:
                    continue

                # Create mapping
                mapping_id = str(uuid.uuid4())
                create_workflow = WorkflowBuilder()
                create_workflow.add_node(
                    "RolePermissionCreateNode",
                    "create_mapping",
                    {
                        "id": mapping_id,
                        "role": role,
                        "permission_id": perm_id,
                        "created_at": now,
                    },
                )

                await self.runtime.execute_workflow_async(
                    create_workflow.build(), inputs={}
                )

                created_mappings += 1

        return {
            "permissions_created": created_permissions,
            "mappings_created": created_mappings,
        }
