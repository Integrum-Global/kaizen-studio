"""
Invitation API Endpoints

Handles invitation operations for inviting users to organizations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from kailash.runtime import AsyncLocalRuntime
from pydantic import BaseModel, EmailStr, Field

from studio.api.auth import get_current_user
from studio.services.invitation_service import InvitationService
from studio.services.user_service import UserService

router = APIRouter(prefix="/invitations", tags=["Invitations"])


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


# Dependency factory functions
def get_runtime() -> AsyncLocalRuntime:
    """Get AsyncLocalRuntime for dependency injection."""
    return AsyncLocalRuntime()


def get_invitation_service(
    runtime: AsyncLocalRuntime = Depends(get_runtime),
) -> InvitationService:
    """Get InvitationService with injected runtime."""
    return InvitationService(runtime=runtime)


def get_user_service(
    runtime: AsyncLocalRuntime = Depends(get_runtime),
) -> UserService:
    """Get UserService with injected runtime."""
    return UserService(runtime=runtime)


# Request/Response Models
class CreateInvitationRequest(BaseModel):
    """Create invitation request."""

    email: EmailStr
    role: str = Field(..., pattern=r"^(org_admin|developer|viewer)$")


class AcceptInvitationRequest(BaseModel):
    """Accept invitation request."""

    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8)


class InvitationResponse(BaseModel):
    """Invitation response."""

    id: str
    organization_id: str
    email: str
    role: str
    invited_by: str
    status: str
    expires_at: str
    created_at: str


class InvitationWithTokenResponse(BaseModel):
    """Invitation response with token (shown on create only)."""

    id: str
    organization_id: str
    email: str
    role: str
    invited_by: str
    token: str
    status: str
    expires_at: str
    created_at: str


class InvitationListResponse(BaseModel):
    """Invitation list response."""

    records: list[InvitationResponse]
    total: int


class AcceptInvitationResponse(BaseModel):
    """Accept invitation response."""

    message: str
    user_id: str
    organization_id: str


@router.get("", response_model=InvitationListResponse)
async def list_invitations(
    status: str | None = Query(
        None, description="Filter by status (pending, accepted, expired)"
    ),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    invitation_service: InvitationService = Depends(get_invitation_service),
):
    """
    List invitations for the current user's organization.

    Only org_owner or org_admin can view invitations.
    """
    if current_user["role"] not in ["org_owner", "org_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view invitations",
        )

    result = await invitation_service.list_invitations(
        organization_id=current_user["organization_id"],
        status=status,
        limit=limit,
        offset=offset,
    )

    return InvitationListResponse(
        records=[InvitationResponse(**r) for r in result["records"]],
        total=result["total"],
    )


@router.post(
    "", response_model=InvitationWithTokenResponse, status_code=status.HTTP_201_CREATED
)
async def create_invitation(
    request: CreateInvitationRequest,
    current_user: dict = Depends(get_current_user),
    invitation_service: InvitationService = Depends(get_invitation_service),
    user_service: UserService = Depends(get_user_service),
):
    """
    Create a new invitation.

    Only org_owner or org_admin can create invitations.
    Returns invitation with token (token is only shown once).
    """
    if current_user["role"] not in ["org_owner", "org_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create invitations",
        )

    # Check if user already exists
    existing_user = await user_service.get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    invitation = await invitation_service.create_invitation(
        organization_id=current_user["organization_id"],
        email=request.email,
        role=request.role,
        invited_by=current_user["id"],
    )

    return invitation


@router.post("/{token}/accept", response_model=AcceptInvitationResponse)
async def accept_invitation(
    token: str,
    request: AcceptInvitationRequest,
    invitation_service: InvitationService = Depends(get_invitation_service),
    user_service: UserService = Depends(get_user_service),
):
    """
    Accept an invitation and create user account.

    This endpoint does not require authentication.
    """
    # Accept the invitation
    accepted = await invitation_service.accept_invitation(token)
    if not accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or already used invitation",
        )

    # Create the user
    user = await user_service.create_user(
        email=accepted["email"],
        password=request.password,
        name=request.name,
        organization_id=accepted["organization_id"],
        role=accepted["role"],
    )

    return AcceptInvitationResponse(
        message="Invitation accepted successfully",
        user_id=user["id"],
        organization_id=accepted["organization_id"],
    )


@router.delete("/{invitation_id}", response_model=MessageResponse)
async def cancel_invitation(
    invitation_id: str,
    current_user: dict = Depends(get_current_user),
    invitation_service: InvitationService = Depends(get_invitation_service),
):
    """
    Cancel an invitation.

    Only org_owner or org_admin can cancel invitations.
    """
    if current_user["role"] not in ["org_owner", "org_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel invitations",
        )

    # Get invitation to check organization
    invitation = await invitation_service.get_invitation(invitation_id)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )

    # Check authorization
    if invitation["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this invitation",
        )

    await invitation_service.cancel_invitation(invitation_id)
    return MessageResponse(message="Invitation cancelled successfully")
