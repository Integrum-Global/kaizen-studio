"""
Team API Endpoints

Handles team and team membership operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from studio.api.auth import get_current_user
from studio.middleware.rbac import require_admin_role
from studio.services.team_service import TeamService

router = APIRouter(prefix="/teams", tags=["Teams"])

# Initialize service
team_service = TeamService()


def get_team_service() -> TeamService:
    """Get TeamService for dependency injection."""
    return TeamService()


# Request/Response Models
class CreateTeamRequest(BaseModel):
    """Create team request."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)


class UpdateTeamRequest(BaseModel):
    """Update team request."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)


class AddMemberRequest(BaseModel):
    """Add member request."""

    user_id: str
    role: str = Field(default="member", pattern=r"^(team_lead|member)$")


class TeamMemberResponse(BaseModel):
    """Team member response."""

    id: str
    team_id: str
    user_id: str
    role: str
    created_at: str


class TeamResponse(BaseModel):
    """Team response."""

    id: str
    organization_id: str
    name: str
    description: str | None = None
    created_at: str
    updated_at: str


class TeamWithMembersResponse(BaseModel):
    """Team with members response."""

    id: str
    organization_id: str
    name: str
    description: str | None = None
    created_at: str
    updated_at: str
    members: list[TeamMemberResponse]


class TeamListResponse(BaseModel):
    """Team list response."""

    records: list[TeamResponse]
    total: int


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


@router.get("", response_model=TeamListResponse)
async def list_teams(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """
    List teams in the current user's organization.
    """
    result = await team_service.list_teams(
        organization_id=current_user["organization_id"],
        limit=limit,
        offset=offset,
    )

    return TeamListResponse(
        records=[TeamResponse(**r) for r in result["records"]],
        total=result["total"],
    )


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    request: CreateTeamRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new team.

    Only org_owner or org_admin can create teams.
    """
    require_admin_role(current_user)

    team = await team_service.create_team(
        name=request.name,
        organization_id=current_user["organization_id"],
        description=request.description,
    )

    return TeamResponse(**team)


@router.get("/{team_id}", response_model=TeamWithMembersResponse)
async def get_team(
    team_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get a team by ID with its members.
    """
    team = await team_service.get_team_with_members(team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Check authorization
    if team["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this team",
        )

    return TeamWithMembersResponse(
        id=team["id"],
        organization_id=team["organization_id"],
        name=team["name"],
        description=team.get("description"),
        created_at=team["created_at"],
        updated_at=team["updated_at"],
        members=[TeamMemberResponse(**m) for m in team.get("members", [])],
    )


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: str,
    request: UpdateTeamRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update a team.

    Only org_owner or org_admin can update teams.
    """
    team = await team_service.get_team(team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Check authorization
    if team["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this team",
        )

    require_admin_role(current_user)

    # Build update data
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    updated_team = await team_service.update_team(team_id, update_data)
    return TeamResponse(**updated_team)


@router.delete("/{team_id}", response_model=MessageResponse)
async def delete_team(
    team_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a team.

    Only org_owner or org_admin can delete teams.
    """
    team = await team_service.get_team(team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Check authorization
    if team["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this team",
        )

    require_admin_role(current_user)

    await team_service.delete_team(team_id)
    return MessageResponse(message="Team deleted successfully")


@router.post(
    "/{team_id}/members",
    response_model=TeamMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_member(
    team_id: str,
    request: AddMemberRequest,
    current_user: dict = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """
    Add a member to a team.

    Only org_owner or org_admin can add members.
    """
    team = await team_service.get_team(team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Check authorization
    if team["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this team",
        )

    require_admin_role(current_user)

    membership = await team_service.add_member(
        team_id=team_id,
        user_id=request.user_id,
        role=request.role,
    )

    return TeamMemberResponse(**membership)


class UpdateMemberRoleRequest(BaseModel):
    """Update member role request."""

    role: str = Field(..., pattern=r"^(team_lead|member)$")


@router.patch("/{team_id}/members/{user_id}", response_model=TeamMemberResponse)
async def update_member_role(
    team_id: str,
    user_id: str,
    request: UpdateMemberRoleRequest,
    current_user: dict = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """
    Update a team member's role.

    Only org_owner or org_admin can update member roles.
    """
    team = await team_service.get_team(team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Check authorization
    if team["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this team",
        )

    require_admin_role(current_user)

    updated = await team_service.update_member_role(
        team_id=team_id,
        user_id=user_id,
        role=request.role,
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in team",
        )

    return TeamMemberResponse(**updated)


@router.delete("/{team_id}/members/{user_id}", response_model=MessageResponse)
async def remove_member(
    team_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Remove a member from a team.

    Only org_owner or org_admin can remove members.
    """
    team = await team_service.get_team(team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Check authorization
    if team["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this team",
        )

    require_admin_role(current_user)

    removed = await team_service.remove_member(team_id, user_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in team",
        )

    return MessageResponse(message="Member removed successfully")
