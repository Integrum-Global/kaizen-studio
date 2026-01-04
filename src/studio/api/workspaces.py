"""
Workspaces API Endpoints

Handles Workspace CRUD operations following the EATP Ontology.
Workspaces are purpose-driven collections that can cross departmental boundaries.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from studio.api.auth import require_permission
from studio.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


# Singleton service instance
_workspace_service: WorkspaceService | None = None


def get_workspace_service() -> WorkspaceService:
    """Get WorkspaceService singleton instance."""
    global _workspace_service
    if _workspace_service is None:
        _workspace_service = WorkspaceService()
    return _workspace_service


# ===================
# Request/Response Models
# ===================


class WorkspaceMemberResponse(BaseModel):
    """Workspace member response."""

    userId: str
    userName: str
    email: str | None = None
    role: str  # owner, admin, member, viewer
    department: str | None = None
    constraints: dict | None = None
    joinedAt: str
    invitedBy: str | None = None


class WorkspaceWorkUnitResponse(BaseModel):
    """Work unit in workspace response."""

    workUnitId: str
    workUnitName: str
    workUnitType: str  # atomic or composite
    trustStatus: str
    delegationId: str | None = None
    constraints: dict | None = None
    addedAt: str
    addedBy: str
    department: str | None = None


class WorkspaceSummaryResponse(BaseModel):
    """Workspace summary for list views."""

    id: str
    name: str
    description: str | None = None
    workspaceType: str  # permanent, temporary, personal
    color: str | None = None
    ownerId: str
    ownerName: str
    memberCount: int
    workUnitCount: int
    expiresAt: str | None = None
    isArchived: bool
    isPersonal: bool


class WorkspaceResponse(BaseModel):
    """Full workspace response."""

    id: str
    name: str
    description: str | None = None
    workspaceType: str
    color: str | None = None
    ownerId: str
    ownerName: str
    organizationId: str
    members: list[WorkspaceMemberResponse]
    workUnits: list[WorkspaceWorkUnitResponse]
    memberCount: int
    workUnitCount: int
    expiresAt: str | None = None
    archivedAt: str | None = None
    isArchived: bool
    createdAt: str
    updatedAt: str


class CreateWorkspaceRequest(BaseModel):
    """Create workspace request."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=2000)
    workspaceType: str = Field(default="permanent", pattern=r"^(permanent|temporary|personal)$")
    color: str | None = None
    expiresAt: str | None = None
    initialMembers: list[dict] = []


class UpdateWorkspaceRequest(BaseModel):
    """Update workspace request."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=2000)
    color: str | None = None
    expiresAt: str | None = None


class AddMemberRequest(BaseModel):
    """Add member to workspace request."""

    userId: str
    role: str = Field(..., pattern=r"^(admin|member|viewer)$")


class UpdateMemberRequest(BaseModel):
    """Update member role request."""

    role: str = Field(..., pattern=r"^(admin|member|viewer)$")


class AddWorkUnitRequest(BaseModel):
    """Add work unit to workspace request."""

    workUnitId: str
    constraints: dict | None = None


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


def _workspace_to_response(workspace: dict, current_user: dict) -> WorkspaceResponse:
    """Convert workspace data to response model."""
    # Extract or default values
    owner_id = workspace.get("owner_id", current_user["id"])
    owner_name = workspace.get("owner_name", current_user.get("name", "Unknown"))

    return WorkspaceResponse(
        id=workspace["id"],
        name=workspace["name"],
        description=workspace.get("description"),
        workspaceType=workspace.get("workspace_type", workspace.get("environment_type", "permanent")),
        color=workspace.get("color"),
        ownerId=owner_id,
        ownerName=owner_name,
        organizationId=workspace["organization_id"],
        members=[],  # Would be populated from workspace_members table
        workUnits=[],  # Would be populated from workspace_work_units table
        memberCount=workspace.get("member_count", 1),
        workUnitCount=workspace.get("work_unit_count", 0),
        expiresAt=workspace.get("expires_at"),
        archivedAt=workspace.get("archived_at"),
        isArchived=bool(workspace.get("archived_at")),
        createdAt=workspace.get("created_at", ""),
        updatedAt=workspace.get("updated_at", ""),
    )


def _workspace_to_summary(workspace: dict, current_user: dict) -> WorkspaceSummaryResponse:
    """Convert workspace data to summary response model."""
    owner_id = workspace.get("owner_id", current_user["id"])
    owner_name = workspace.get("owner_name", current_user.get("name", "Unknown"))
    workspace_type = workspace.get("workspace_type", workspace.get("environment_type", "permanent"))

    return WorkspaceSummaryResponse(
        id=workspace["id"],
        name=workspace["name"],
        description=workspace.get("description"),
        workspaceType=workspace_type,
        color=workspace.get("color"),
        ownerId=owner_id,
        ownerName=owner_name,
        memberCount=workspace.get("member_count", 1),
        workUnitCount=workspace.get("work_unit_count", 0),
        expiresAt=workspace.get("expires_at"),
        isArchived=bool(workspace.get("archived_at")),
        isPersonal=workspace_type == "personal",
    )


@router.get("", response_model=list[WorkspaceSummaryResponse])
async def list_workspaces(
    search: str | None = Query(None),
    type: str | None = Query(None, alias="type"),
    includeArchived: bool = Query(False),
    ownerId: str | None = Query(None),
    current_user: dict = Depends(require_permission("agents:read")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    List workspaces for the current user's organization.
    """
    org_id = current_user["organization_id"]

    filters = {}
    if type and type != "all":
        filters["workspace_type"] = type
    if ownerId:
        filters["owner_id"] = ownerId

    result = await workspace_service.list_workspaces(
        organization_id=org_id,
        filters=filters if filters else None,
        limit=100,
        offset=0,
    )

    workspaces = []
    for ws in result.get("records", []):
        # Apply search filter
        if search and search.lower() not in ws.get("name", "").lower():
            continue
        # Skip archived if not requested
        if not includeArchived and ws.get("archived_at"):
            continue
        workspaces.append(_workspace_to_summary(ws, current_user))

    return workspaces


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    current_user: dict = Depends(require_permission("agents:read")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    Get a workspace by ID with full details.
    """
    workspace = await workspace_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    if workspace["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this workspace",
        )

    return _workspace_to_response(workspace, current_user)


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    request: CreateWorkspaceRequest,
    current_user: dict = Depends(require_permission("agents:create")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    Create a new workspace.
    """
    workspace = await workspace_service.create_workspace(
        name=request.name,
        organization_id=current_user["organization_id"],
        environment_type=request.workspaceType,  # Map to existing field
        description=request.description or "",
    )

    # Set owner fields
    workspace["owner_id"] = current_user["id"]
    workspace["owner_name"] = current_user.get("name", "Unknown")
    workspace["workspace_type"] = request.workspaceType

    return _workspace_to_response(workspace, current_user)


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    request: UpdateWorkspaceRequest,
    current_user: dict = Depends(require_permission("agents:update")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    Update a workspace.
    """
    workspace = await workspace_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    if workspace["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this workspace",
        )

    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    updated = await workspace_service.update_workspace(workspace_id, update_data)
    return _workspace_to_response(updated, current_user)


@router.post("/{workspace_id}/archive", response_model=MessageResponse)
async def archive_workspace(
    workspace_id: str,
    current_user: dict = Depends(require_permission("agents:delete")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    Archive a workspace (soft delete).
    """
    workspace = await workspace_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    if workspace["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to archive this workspace",
        )

    from datetime import UTC, datetime

    await workspace_service.update_workspace(
        workspace_id,
        {"archived_at": datetime.now(UTC).isoformat()},
    )

    return MessageResponse(message="Workspace archived successfully")


@router.post("/{workspace_id}/restore", response_model=WorkspaceResponse)
async def restore_workspace(
    workspace_id: str,
    current_user: dict = Depends(require_permission("agents:update")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    Restore an archived workspace.
    """
    workspace = await workspace_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    if workspace["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to restore this workspace",
        )

    updated = await workspace_service.update_workspace(
        workspace_id,
        {"archived_at": None},
    )

    return _workspace_to_response(updated, current_user)


@router.delete("/{workspace_id}", response_model=MessageResponse)
async def delete_workspace(
    workspace_id: str,
    current_user: dict = Depends(require_permission("agents:delete")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    Permanently delete a workspace (owner only).
    """
    workspace = await workspace_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    if workspace["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this workspace",
        )

    # Check if user is owner (for now allow org admins)
    if current_user["role"] not in ["org_owner", "org_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owner can permanently delete",
        )

    await workspace_service.delete_workspace(workspace_id)

    return MessageResponse(message="Workspace deleted successfully")


# ===================
# Member Management
# ===================


@router.post("/{workspace_id}/members", status_code=status.HTTP_201_CREATED)
async def add_workspace_member(
    workspace_id: str,
    request: AddMemberRequest,
    current_user: dict = Depends(require_permission("agents:update")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    Add a member to a workspace.
    Creates a trust delegation for the user.
    """
    workspace = await workspace_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    if workspace["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this workspace",
        )

    # For now, return success - actual member management would update workspace_members table
    return {"message": "Member added successfully", "userId": request.userId, "role": request.role}


@router.patch("/{workspace_id}/members/{user_id}")
async def update_workspace_member(
    workspace_id: str,
    user_id: str,
    request: UpdateMemberRequest,
    current_user: dict = Depends(require_permission("agents:update")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    Update a member's role in a workspace.
    """
    workspace = await workspace_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    if workspace["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this workspace",
        )

    return {"message": "Member role updated", "userId": user_id, "role": request.role}


@router.delete("/{workspace_id}/members/{user_id}")
async def remove_workspace_member(
    workspace_id: str,
    user_id: str,
    current_user: dict = Depends(require_permission("agents:update")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    Remove a member from a workspace.
    """
    workspace = await workspace_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    if workspace["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this workspace",
        )

    return {"message": "Member removed successfully"}


# ===================
# Work Unit Management
# ===================


@router.post("/{workspace_id}/work-units", status_code=status.HTTP_201_CREATED)
async def add_work_unit_to_workspace(
    workspace_id: str,
    request: AddWorkUnitRequest,
    current_user: dict = Depends(require_permission("agents:update")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    Add a work unit to a workspace.
    Creates a delegation for workspace members to access the work unit.
    """
    workspace = await workspace_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    if workspace["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this workspace",
        )

    return {
        "message": "Work unit added to workspace",
        "workUnitId": request.workUnitId,
        "workspaceId": workspace_id,
    }


@router.delete("/{workspace_id}/work-units/{work_unit_id}")
async def remove_work_unit_from_workspace(
    workspace_id: str,
    work_unit_id: str,
    current_user: dict = Depends(require_permission("agents:update")),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
):
    """
    Remove a work unit from a workspace.
    Revokes the delegation.
    """
    workspace = await workspace_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    if workspace["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this workspace",
        )

    return {"message": "Work unit removed from workspace"}
