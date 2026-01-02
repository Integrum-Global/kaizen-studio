"""
Organization API Endpoints

Handles organization CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from studio.api.auth import get_current_user
from studio.services.organization_service import OrganizationService

router = APIRouter(prefix="/organizations", tags=["Organizations"])

# Initialize service
org_service = OrganizationService()


# Request/Response Models
class CreateOrganizationRequest(BaseModel):
    """Create organization request."""

    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    plan_tier: str = Field(default="free", pattern=r"^(free|pro|enterprise)$")


class UpdateOrganizationRequest(BaseModel):
    """Update organization request."""

    name: str | None = Field(None, min_length=1, max_length=100)
    slug: str | None = Field(
        None, min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$"
    )
    plan_tier: str | None = Field(None, pattern=r"^(free|pro|enterprise)$")
    status: str | None = Field(None, pattern=r"^(active|suspended)$")


class OrganizationResponse(BaseModel):
    """Organization response."""

    id: str
    name: str
    slug: str
    status: str
    plan_tier: str
    created_by: str
    created_at: str
    updated_at: str


class OrganizationListResponse(BaseModel):
    """Organization list response."""

    records: list[OrganizationResponse]
    total: int


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


@router.get("", response_model=OrganizationListResponse)
async def list_organizations(
    status: str | None = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """
    List organizations.

    Admin users can see all organizations, others see only their own.
    """
    # Check if user is admin (for now, only org_owner can list all)
    if current_user["role"] != "org_owner":
        # Non-admin users only see their organization
        org = await org_service.get_organization(current_user["organization_id"])
        if org:
            return OrganizationListResponse(
                records=[OrganizationResponse(**org)],
                total=1,
            )
        return OrganizationListResponse(records=[], total=0)

    filters = {}
    if status:
        filters["status"] = status

    result = await org_service.list_organizations(filters, limit, offset)
    return OrganizationListResponse(
        records=[OrganizationResponse(**r) for r in result["records"]],
        total=result["total"],
    )


@router.post(
    "", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED
)
async def create_organization(
    request: CreateOrganizationRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new organization.

    Only org_owner or org_admin can create organizations.
    """
    if current_user["role"] not in ["org_owner", "org_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create organizations",
        )

    org = await org_service.create_organization(
        name=request.name,
        slug=request.slug,
        plan_tier=request.plan_tier,
        created_by=current_user["id"],
    )

    return OrganizationResponse(**org)


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get an organization by ID.

    Users can only access their own organization.
    """
    # Check authorization
    if (
        current_user["organization_id"] != org_id
        and current_user["role"] != "org_owner"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this organization",
        )

    org = await org_service.get_organization(org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return OrganizationResponse(**org)


@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    request: UpdateOrganizationRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update an organization.

    Only org_owner or org_admin can update organizations.
    """
    # Check authorization
    if current_user["organization_id"] != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this organization",
        )

    if current_user["role"] not in ["org_owner", "org_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update organizations",
        )

    # Build update data
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    org = await org_service.update_organization(org_id, update_data)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return OrganizationResponse(**org)


@router.delete("/{org_id}", response_model=MessageResponse)
async def delete_organization(
    org_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete an organization (soft delete).

    Only org_owner can delete organizations.
    """
    # Check authorization
    if current_user["organization_id"] != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this organization",
        )

    if current_user["role"] != "org_owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owner can delete organizations",
        )

    await org_service.delete_organization(org_id)
    return MessageResponse(message="Organization deleted successfully")
