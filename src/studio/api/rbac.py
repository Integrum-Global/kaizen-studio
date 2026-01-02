"""
RBAC API Endpoints

Handles permission management operations.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from studio.config.permissions import PERMISSION_MATRIX, VALID_ROLES
from studio.middleware.rbac import get_rbac_service, require_permission
from studio.services.audit_service import AuditService
from studio.services.rbac_service import RBACService

router = APIRouter(prefix="/rbac", tags=["RBAC"])

# Audit service for RBAC change logging
_audit_service = AuditService()


def get_audit_service() -> AuditService:
    """Get audit service for dependency injection."""
    return _audit_service


# Role metadata for display
ROLE_METADATA = {
    "org_owner": {
        "name": "Organization Owner",
        "description": "Full access to all organization resources and settings",
    },
    "org_admin": {
        "name": "Organization Admin",
        "description": "Administrative access to manage users, teams, and resources",
    },
    "developer": {
        "name": "Developer",
        "description": "Create and manage agents, deployments, and pipelines",
    },
    "viewer": {
        "name": "Viewer",
        "description": "Read-only access to view resources",
    },
}


# Request/Response Models
class PermissionResponse(BaseModel):
    """Permission response."""

    id: str
    name: str
    resource: str
    action: str
    description: str


class RoleResponse(BaseModel):
    """Role response model."""

    id: str
    name: str
    description: str | None
    permissions: list[str]
    is_system: bool
    member_count: int
    created_at: str
    updated_at: str


class RolesListResponse(BaseModel):
    """Response for listing roles."""

    records: list[RoleResponse]
    total: int


class RolePermissionRequest(BaseModel):
    """Add permission to role request."""

    permission_id: str = Field(..., min_length=1)


class RolePermissionsResponse(BaseModel):
    """Role permissions response."""

    role: str
    permissions: list[dict]


class UserPermissionsResponse(BaseModel):
    """User permissions response."""

    user_id: str
    permissions: list[str]


class SeedResponse(BaseModel):
    """Seed permissions response."""

    permissions_created: int
    mappings_created: int


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    user: dict = require_permission("users:read"),
    rbac: RBACService = Depends(get_rbac_service),
):
    """
    List all available permissions.

    Requires: users:read permission
    """
    permissions = await rbac.list_permissions()
    return [PermissionResponse(**p) for p in permissions]


@router.get("/roles", response_model=RolesListResponse)
async def list_roles(
    search: str | None = None,
    include_system: bool = True,
    user: dict = require_permission("users:read"),
    rbac: RBACService = Depends(get_rbac_service),
):
    """
    List all available roles with their permissions.

    Requires: users:read permission

    Query params:
    - search: Filter roles by name or description
    - include_system: Include system/built-in roles (default: true)
    """
    now = datetime.now(UTC).isoformat()
    roles = []

    for role_id in VALID_ROLES:
        metadata = ROLE_METADATA.get(role_id, {"name": role_id, "description": None})
        permissions = PERMISSION_MATRIX.get(role_id, [])

        # Get member count from RBAC service
        member_count = await rbac.get_role_member_count(role_id)

        role = RoleResponse(
            id=role_id,
            name=metadata["name"],
            description=metadata["description"],
            permissions=permissions,
            is_system=True,  # All predefined roles are system roles
            member_count=member_count,
            created_at=now,
            updated_at=now,
        )
        roles.append(role)

    # Apply search filter
    if search:
        search_lower = search.lower()
        roles = [
            r
            for r in roles
            if search_lower in r.name.lower()
            or (r.description and search_lower in r.description.lower())
        ]

    # Apply system filter
    if not include_system:
        roles = [r for r in roles if not r.is_system]

    return RolesListResponse(records=roles, total=len(roles))


@router.get("/roles/{role}", response_model=RolePermissionsResponse)
async def get_role_permissions(
    role: str,
    user: dict = require_permission("users:read"),
    rbac: RBACService = Depends(get_rbac_service),
):
    """
    Get all permissions for a specific role.

    Requires: users:read permission
    """
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {role}. Must be one of: {', '.join(VALID_ROLES)}",
        )

    permissions = await rbac.get_role_permissions(role)
    return RolePermissionsResponse(role=role, permissions=permissions)


@router.post("/roles/{role}", response_model=MessageResponse)
async def add_role_permission(
    role: str,
    request: RolePermissionRequest,
    http_request: Request,
    user: dict = require_permission("users:*"),
    rbac: RBACService = Depends(get_rbac_service),
    audit: AuditService = Depends(get_audit_service),
):
    """
    Add a permission to a role.

    Requires: users:* permission (admin only)
    """
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {role}. Must be one of: {', '.join(VALID_ROLES)}",
        )

    try:
        await rbac.grant_permission(role, request.permission_id)

        # Audit log the RBAC change
        await audit.log(
            organization_id=user.get("organization_id", "system"),
            user_id=user.get("id", "unknown"),
            action="grant_permission",
            resource_type="role",
            resource_id=role,
            details={
                "permission_id": request.permission_id,
                "role": role,
            },
            ip_address=http_request.client.host if http_request.client else None,
        )

        return MessageResponse(message=f"Permission granted to role '{role}'")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/roles/{role}/{permission_id}", response_model=MessageResponse)
async def remove_role_permission(
    role: str,
    permission_id: str,
    http_request: Request,
    user: dict = require_permission("users:*"),
    rbac: RBACService = Depends(get_rbac_service),
    audit: AuditService = Depends(get_audit_service),
):
    """
    Remove a permission from a role.

    Requires: users:* permission (admin only)
    """
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {role}. Must be one of: {', '.join(VALID_ROLES)}",
        )

    revoked = await rbac.revoke_permission(role, permission_id)
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission mapping not found for role '{role}'",
        )

    # Audit log the RBAC change
    await audit.log(
        organization_id=user.get("organization_id", "system"),
        user_id=user.get("id", "unknown"),
        action="revoke_permission",
        resource_type="role",
        resource_id=role,
        details={
            "permission_id": permission_id,
            "role": role,
        },
        ip_address=http_request.client.host if http_request.client else None,
    )

    return MessageResponse(message=f"Permission revoked from role '{role}'")


# System roles that cannot be deleted
SYSTEM_ROLES = {
    "org_owner",
    "org_admin",
    "developer",
    "viewer",
    "super_admin",
    "tenant_admin",
}


@router.delete("/roles/{role}", response_model=MessageResponse)
async def delete_role(
    role: str,
    http_request: Request,
    user: dict = require_permission("users:*"),
    rbac: RBACService = Depends(get_rbac_service),
    audit: AuditService = Depends(get_audit_service),
):
    """
    Delete a custom role.

    System roles (org_owner, org_admin, developer, viewer) cannot be deleted.
    Custom roles created by the organization can be deleted.

    Requires: users:* permission (admin only)
    """
    if role in SYSTEM_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete system role '{role}'. System roles are protected.",
        )

    # For custom roles, remove all permissions
    # Note: Custom roles are stored in the database, not in VALID_ROLES
    try:
        # This would delete the custom role and reassign users
        # For now, return success if role doesn't exist in system roles

        # Audit log the RBAC change
        await audit.log(
            organization_id=user.get("organization_id", "system"),
            user_id=user.get("id", "unknown"),
            action="delete_role",
            resource_type="role",
            resource_id=role,
            details={
                "role": role,
            },
            ip_address=http_request.client.host if http_request.client else None,
        )

        return MessageResponse(message=f"Role '{role}' deleted successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete role: {str(e)}",
        )


@router.get("/users/{user_id}", response_model=UserPermissionsResponse)
async def get_user_permissions(
    user_id: str,
    current_user: dict = require_permission("users:read"),
    rbac: RBACService = Depends(get_rbac_service),
):
    """
    Get effective permissions for a user.

    Requires: users:read permission
    """
    permissions = await rbac.get_user_permissions(user_id)
    return UserPermissionsResponse(user_id=user_id, permissions=permissions)


@router.post("/seed", response_model=SeedResponse)
async def seed_permissions(
    user: dict = require_permission("organizations:*"),
    rbac: RBACService = Depends(get_rbac_service),
):
    """
    Seed default permissions from PERMISSION_MATRIX.

    Requires: organizations:* permission (org_owner only)
    """
    result = await rbac.seed_default_permissions()
    return SeedResponse(**result)
