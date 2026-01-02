"""
RBAC Middleware and Dependencies

FastAPI dependencies for permission checking.
"""

import logging
from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status

from studio.config.permissions import ADMIN_ROLES, CREATOR_ROLES, VALID_ROLES
from studio.services.abac_service import ABACService
from studio.services.rbac_service import RBACService

logger = logging.getLogger(__name__)

# Global RBAC service instance
_rbac_service = None

# Global ABAC service instance
_abac_service = None


def get_rbac_service() -> RBACService:
    """Get or create the RBAC service singleton."""
    global _rbac_service
    if _rbac_service is None:
        _rbac_service = RBACService()
    return _rbac_service


def get_abac_service() -> ABACService:
    """Get or create the ABAC service singleton."""
    global _abac_service
    if _abac_service is None:
        _abac_service = ABACService()
    return _abac_service


# Map permission strings to ABAC resource types
PERMISSION_TO_RESOURCE = {
    "agents": "agent",
    "pipelines": "pipeline",
    "deployments": "deployment",
    "gateways": "gateway",
    "teams": "team",
    "users": "user",
    "organizations": "organization",
    "workspaces": "workspace",
    "external_agents": "external_agent",
    "policies": "policy",
    "settings": "settings",
    "billing": "billing",
    "audit": "audit",
    "connectors": "connector",
    "invitations": "invitation",
    "api_keys": "api_key",
}


async def get_current_user_from_request(request: Request) -> dict:
    """
    Get current user from request state.

    Args:
        request: FastAPI request object

    Returns:
        User context dict

    Raises:
        HTTPException: If user is not authenticated
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id": user_id,
        "user_id": user_id,
        "organization_id": getattr(request.state, "org_id", None),
        "role": getattr(request.state, "role", None),
    }


class Permission:
    """
    Dependency for checking a single permission.

    Checks both RBAC (role-based) and ABAC (attribute-based) policies.

    Usage:
        @router.post("/agents")
        async def create_agent(
            user: dict = Depends(Permission("agents:create"))
        ):
            ...
    """

    def __init__(self, required: str, check_abac: bool = True):
        """
        Initialize the permission dependency.

        Args:
            required: Required permission (e.g., "agents:create")
            check_abac: Whether to also check ABAC policies (default: True)
        """
        self.required = required
        self.check_abac = check_abac

        # Parse permission into resource and action
        parts = required.split(":")
        self.resource = parts[0] if parts else ""
        self.action = parts[1] if len(parts) > 1 else "*"

    async def __call__(
        self,
        request: Request,
        rbac: RBACService = Depends(get_rbac_service),
        abac: ABACService = Depends(get_abac_service),
    ) -> dict:
        """
        Check if user has the required permission.

        Performs RBAC check first, then ABAC policy evaluation.

        Args:
            request: FastAPI request object
            rbac: RBAC service instance
            abac: ABAC service instance

        Returns:
            User context dict if authorized

        Raises:
            HTTPException: If permission denied
        """
        user = await get_current_user_from_request(request)

        # Step 1: RBAC check (role-based)
        has_permission = await rbac.check_permission(user["id"], self.required)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {self.required}",
            )

        # Step 2: ABAC check (attribute-based)
        if self.check_abac and self.action != "*":
            resource_type = PERMISSION_TO_RESOURCE.get(self.resource, self.resource)
            action = self.action

            # Build context for ABAC evaluation
            context = {
                "ip_address": request.client.host if request.client else None,
                "path": request.url.path,
                "method": request.method,
                "org_id": user.get("organization_id"),
            }

            try:
                # Evaluate ABAC policies
                allowed = await abac.evaluate(
                    user_id=user["id"],
                    resource_type=resource_type,
                    action=action,
                    resource={},  # Resource details not available at this point
                    context=context,
                )

                if not allowed:
                    logger.info(
                        f"ABAC denied: user={user['id']}, "
                        f"resource={resource_type}, action={action}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Access denied by policy: {resource_type}:{action}",
                    )

            except HTTPException:
                raise
            except Exception as e:
                # Log error but don't fail - ABAC is additional layer
                logger.warning(f"ABAC evaluation error: {e}")

        return user


class AnyPermission:
    """
    Dependency for checking any of multiple permissions.

    Usage:
        @router.get("/agents")
        async def list_agents(
            user: dict = Depends(AnyPermission("agents:read", "agents:*"))
        ):
            ...
    """

    def __init__(self, *permissions: str):
        """
        Initialize the permission dependency.

        Args:
            permissions: Required permissions (user needs any one)
        """
        self.permissions = permissions

    async def __call__(
        self,
        request: Request,
        rbac: RBACService = Depends(get_rbac_service),
    ) -> dict:
        """
        Check if user has any of the required permissions.

        Args:
            request: FastAPI request object
            rbac: RBAC service instance

        Returns:
            User context dict if authorized

        Raises:
            HTTPException: If no permissions granted
        """
        user = await get_current_user_from_request(request)

        for permission in self.permissions:
            has_permission = await rbac.check_permission(user["id"], permission)
            if has_permission:
                return user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: requires any of {', '.join(self.permissions)}",
        )


class AllPermissions:
    """
    Dependency for checking all of multiple permissions.

    Usage:
        @router.delete("/agents/{id}")
        async def delete_agent(
            user: dict = Depends(AllPermissions("agents:delete", "agents:read"))
        ):
            ...
    """

    def __init__(self, *permissions: str):
        """
        Initialize the permission dependency.

        Args:
            permissions: Required permissions (user needs all)
        """
        self.permissions = permissions

    async def __call__(
        self,
        request: Request,
        rbac: RBACService = Depends(get_rbac_service),
    ) -> dict:
        """
        Check if user has all of the required permissions.

        Args:
            request: FastAPI request object
            rbac: RBAC service instance

        Returns:
            User context dict if authorized

        Raises:
            HTTPException: If any permission denied
        """
        user = await get_current_user_from_request(request)

        missing = []
        for permission in self.permissions:
            has_permission = await rbac.check_permission(user["id"], permission)
            if not has_permission:
                missing.append(permission)

        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: missing {', '.join(missing)}",
            )

        return user


def require_permission(permission: str) -> Callable:
    """
    Convenience function for requiring a single permission.

    Usage:
        @router.post("/agents")
        async def create_agent(
            user: dict = require_permission("agents:create")
        ):
            ...
    """
    return Depends(Permission(permission))


def require_any_permission(*permissions: str) -> Callable:
    """
    Convenience function for requiring any of multiple permissions.

    Usage:
        @router.get("/agents")
        async def list_agents(
            user: dict = require_any_permission("agents:read", "agents:*")
        ):
            ...
    """
    return Depends(AnyPermission(*permissions))


def require_all_permissions(*permissions: str) -> Callable:
    """
    Convenience function for requiring all permissions.

    Usage:
        @router.delete("/agents/{id}")
        async def delete_agent(
            user: dict = require_all_permissions("agents:delete", "agents:read")
        ):
            ...
    """
    return Depends(AllPermissions(*permissions))


def require_role(user: dict, allowed_roles: list[str]) -> None:
    """
    Check if user has one of the required roles.

    Usage:
        current_user = await get_current_user_from_request(request)
        require_role(current_user, ["org_owner", "org_admin"])

    Args:
        user: User context dict with 'role' key
        allowed_roles: List of allowed roles

    Raises:
        HTTPException: If user doesn't have any of the required roles
    """
    user_role = user.get("role")
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: requires one of {', '.join(allowed_roles)}",
        )


def require_admin_role(user: dict) -> None:
    """
    Check if user has an admin role (org_owner or org_admin).

    Uses centralized ADMIN_ROLES constant for consistency.

    Usage:
        current_user = await get_current_user_from_request(request)
        require_admin_role(current_user)

    Args:
        user: User context dict with 'role' key

    Raises:
        HTTPException: If user is not an admin
    """
    require_role(user, ADMIN_ROLES)


def require_creator_role(user: dict) -> None:
    """
    Check if user has a creator role (org_owner, org_admin, or developer).

    Uses centralized CREATOR_ROLES constant for consistency.

    Args:
        user: User context dict with 'role' key

    Raises:
        HTTPException: If user cannot create resources
    """
    require_role(user, CREATOR_ROLES)


def is_admin_role(role: str | None) -> bool:
    """
    Check if role is an admin role.

    Args:
        role: Role string to check

    Returns:
        True if role is an admin role
    """
    return role in ADMIN_ROLES


def is_valid_role(role: str | None) -> bool:
    """
    Check if role is a valid system role.

    Args:
        role: Role string to check

    Returns:
        True if role is valid
    """
    return role in VALID_ROLES
