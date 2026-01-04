"""
User API Endpoints

Handles user CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field

from studio.api.auth import get_current_user
from studio.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])

# Initialize service
user_service = UserService()


def get_user_service() -> UserService:
    """Get UserService for dependency injection."""
    return UserService()


# Request/Response Models
class UpdateUserRequest(BaseModel):
    """Update user request."""

    name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None
    role: str | None = Field(None, pattern=r"^(org_owner|org_admin|developer|viewer)$")
    status: str | None = Field(None, pattern=r"^(active|suspended)$")
    mfa_enabled: bool | None = None


class UserResponse(BaseModel):
    """User response."""

    id: str
    organization_id: str
    email: str
    name: str
    status: str
    role: str
    mfa_enabled: bool
    last_login_at: str | None = None
    created_at: str
    updated_at: str


class UserListResponse(BaseModel):
    """User list response."""

    records: list[UserResponse]
    total: int


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


class UserLevelResponse(BaseModel):
    """User level response for EATP ontology."""

    level: int  # 1, 2, or 3
    permissions: dict


class DelegateeResponse(BaseModel):
    """Delegatee response for user selection."""

    id: str
    name: str
    level: int


class CreateUserRequest(BaseModel):
    """Create user request."""

    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8)
    role: str = Field(..., pattern=r"^(org_admin|developer|viewer)$")


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """
    Get the current authenticated user's profile.
    """
    user = await user_service.get_user(current_user["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserResponse(**user)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: CreateUserRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new user in the organization.

    Only org_owner and org_admin can create users.
    """
    # Authorization check
    if current_user["role"] not in ["org_owner", "org_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create users",
        )

    # Check if email already exists
    existing = await user_service.get_user_by_email(request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    try:
        user = await user_service.create_user(
            email=request.email,
            password=request.password,
            name=request.name,
            organization_id=current_user["organization_id"],
            role=request.role,
        )
        return UserResponse(**user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("", response_model=UserListResponse)
async def list_users(
    search: str | None = Query(None, description="Search by name or email"),
    status: str | None = Query(None, description="Filter by status"),
    role: str | None = Query(None, description="Filter by role"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """
    List users in the current user's organization.
    """
    filters = {}
    if status:
        filters["status"] = status
    if role:
        filters["role"] = role

    result = await user_service.list_users(
        organization_id=current_user["organization_id"],
        filters=filters if filters else None,
        limit=limit,
        offset=offset,
    )

    # Apply search filter if provided
    records = result["records"]
    if search:
        search_lower = search.lower()
        records = [
            r for r in records
            if search_lower in r.get("name", "").lower()
            or search_lower in r.get("email", "").lower()
        ]

    return UserListResponse(
        records=[UserResponse(**r) for r in records],
        total=len(records) if search else result["total"],
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get a user by ID.

    Users can only access users in their organization.
    """
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Treat deleted users as not found
    if user.get("status") == "deleted":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check authorization - same organization
    if user["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this user",
        )

    return UserResponse(**user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update a user.

    Users can update themselves, org_admin+ can update others.
    """
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check authorization
    if user["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user",
        )

    # Users can update themselves, admins can update others
    is_self = user_id == current_user["id"]
    is_admin = current_user["role"] in ["org_owner", "org_admin"]

    if not is_self and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update other users",
        )

    # Role changes require admin
    if request.role is not None and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can change user roles",
        )

    # Status changes require admin
    if request.status is not None and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can change user status",
        )

    # Build update data
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    updated_user = await user_service.update_user(user_id, update_data)
    return UserResponse(**updated_user)


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a user (soft delete).

    Only org_owner or org_admin can delete users.
    Users cannot delete themselves.
    """
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself",
        )

    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check authorization
    if user["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this user",
        )

    if current_user["role"] not in ["org_owner", "org_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete users",
        )

    # Cannot delete org_owner
    if user["role"] == "org_owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete organization owner",
        )

    await user_service.delete_user(user_id)
    return MessageResponse(message="User deleted successfully")


def _get_level_for_role(role: str) -> int:
    """
    Map user role to EATP level.

    Level 1: Task performers (viewer, developer)
    Level 2: Process owners (org_admin)
    Level 3: Value chain owners (org_owner)
    """
    level_map = {
        "viewer": 1,
        "developer": 1,
        "org_admin": 2,
        "org_owner": 3,
    }
    return level_map.get(role, 1)


def _get_permissions_for_level(level: int) -> dict:
    """Get permissions for a given EATP level."""
    return {
        "canRun": level >= 1,
        "canConfigure": level >= 2,
        "canDelegate": level >= 2,
        "canCreateWorkUnits": level >= 2,
        "canManageWorkspaces": level >= 2,
        "canViewValueChains": level >= 3,
        "canAccessCompliance": level >= 3,
        "canEstablishTrust": level >= 3,
        "canDelete": level >= 3,
    }


@router.get("/delegatees", response_model=list[DelegateeResponse])
async def list_delegatees(
    current_user: dict = Depends(get_current_user),
):
    """
    List users available for delegation.
    Returns users in the same organization that can be delegated to.
    """
    result = await user_service.list_users(
        organization_id=current_user["organization_id"],
        filters={"status": "active"},
        limit=100,
        offset=0,
    )

    delegatees = []
    for user in result.get("records", []):
        # Skip current user
        if user["id"] == current_user["id"]:
            continue
        delegatees.append(
            DelegateeResponse(
                id=user["id"],
                name=user.get("name", user["email"]),
                level=_get_level_for_role(user.get("role", "viewer")),
            )
        )

    return delegatees


@router.get("/{user_id}/level", response_model=UserLevelResponse)
async def get_user_level(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get the EATP level for a user.
    Level determines what features and permissions are available.
    """
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check authorization - same organization
    if user["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this user",
        )

    level = _get_level_for_role(user.get("role", "viewer"))

    return UserLevelResponse(
        level=level,
        permissions=_get_permissions_for_level(level),
    )
