"""
Policy API Routes

FastAPI router for ABAC policy management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from studio.middleware.rbac import Permission
from studio.services.abac_service import ABACService

router = APIRouter(prefix="/policies", tags=["policies"])

# Global ABAC service instance
_abac_service = None


def get_abac_service() -> ABACService:
    """Get or create the ABAC service singleton."""
    global _abac_service
    if _abac_service is None:
        _abac_service = ABACService()
    return _abac_service


# ==================== Request/Response Models ====================


class CreatePolicyRequest(BaseModel):
    """Request model for creating a policy."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)
    resource_type: str = Field(..., pattern="^[a-z_*]+$")
    action: str = Field(..., pattern="^[a-z_*]+$")
    effect: str = Field(..., pattern="^(allow|deny)$")
    conditions: dict = Field(default_factory=dict)
    priority: int = Field(default=0, ge=0, le=1000)
    status: str = Field(default="active", pattern="^(active|inactive)$")


class UpdatePolicyRequest(BaseModel):
    """Request model for updating a policy."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)
    resource_type: str | None = Field(None, pattern="^[a-z_*]+$")
    action: str | None = Field(None, pattern="^[a-z_*]+$")
    effect: str | None = Field(None, pattern="^(allow|deny)$")
    conditions: dict | None = None
    priority: int | None = Field(None, ge=0, le=1000)
    status: str | None = Field(None, pattern="^(active|inactive)$")


class AssignPolicyRequest(BaseModel):
    """Request model for assigning a policy."""

    principal_type: str = Field(..., pattern="^(user|team|role)$")
    principal_id: str = Field(..., min_length=1)


class EvaluatePolicyRequest(BaseModel):
    """Request model for evaluating policy access."""

    user_id: str = Field(..., min_length=1)
    resource_type: str = Field(..., min_length=1)
    action: str = Field(..., min_length=1)
    resource: dict | None = Field(default_factory=dict)
    context: dict | None = Field(default_factory=dict)


# ==================== Policy CRUD Endpoints ====================


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_policy(
    request: CreatePolicyRequest,
    user: dict = Depends(Permission("policies:create")),
    abac: ABACService = Depends(get_abac_service),
):
    """
    Create a new ABAC policy.

    Requires permission: policies:create
    """
    org_id = user.get("organization_id")
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID required",
        )

    policy = await abac.create_policy(
        organization_id=org_id,
        name=request.name,
        description=request.description,
        resource_type=request.resource_type,
        action=request.action,
        effect=request.effect,
        conditions=request.conditions,
        priority=request.priority,
        status=request.status,
        created_by=user["id"],
    )

    return policy


@router.get("")
async def list_policies(
    status: str | None = None,
    resource_type: str | None = None,
    limit: int = 100,
    offset: int = 0,
    user: dict = Depends(Permission("policies:read")),
    abac: ABACService = Depends(get_abac_service),
):
    """
    List policies for the organization.

    Requires permission: policies:read
    """
    org_id = user.get("organization_id")
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID required",
        )

    policies = await abac.list_policies(
        organization_id=org_id,
        status=status,
        resource_type=resource_type,
        limit=limit,
        offset=offset,
    )

    # Return in standard paginated format for frontend compatibility
    return {"records": policies, "total": len(policies)}


@router.get("/{policy_id}")
async def get_policy(
    policy_id: str,
    user: dict = Depends(Permission("policies:read")),
    abac: ABACService = Depends(get_abac_service),
):
    """
    Get a specific policy.

    Requires permission: policies:read
    """
    policy = await abac.get_policy(policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )

    # Verify organization access
    org_id = user.get("organization_id")
    if policy.get("organization_id") != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this policy",
        )

    return policy


@router.put("/{policy_id}")
async def update_policy(
    policy_id: str,
    request: UpdatePolicyRequest,
    user: dict = Depends(Permission("policies:update")),
    abac: ABACService = Depends(get_abac_service),
):
    """
    Update a policy.

    Requires permission: policies:update
    """
    # Check policy exists and belongs to org
    existing = await abac.get_policy(policy_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )

    org_id = user.get("organization_id")
    if existing.get("organization_id") != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this policy",
        )

    # Build update data
    update_data = request.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    policy = await abac.update_policy(policy_id, update_data)
    return policy


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    policy_id: str,
    user: dict = Depends(Permission("policies:delete")),
    abac: ABACService = Depends(get_abac_service),
):
    """
    Delete a policy.

    Requires permission: policies:delete
    """
    # Check policy exists and belongs to org
    existing = await abac.get_policy(policy_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )

    org_id = user.get("organization_id")
    if existing.get("organization_id") != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this policy",
        )

    await abac.delete_policy(policy_id)


# ==================== Policy Assignment Endpoints ====================


@router.post("/{policy_id}/assign", status_code=status.HTTP_201_CREATED)
async def assign_policy(
    policy_id: str,
    request: AssignPolicyRequest,
    user: dict = Depends(Permission("policies:assign")),
    abac: ABACService = Depends(get_abac_service),
):
    """
    Assign a policy to a principal (user, team, or role).

    Requires permission: policies:assign
    """
    # Check policy exists and belongs to org
    existing = await abac.get_policy(policy_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )

    org_id = user.get("organization_id")
    if existing.get("organization_id") != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this policy",
        )

    assignment = await abac.assign_policy(
        policy_id=policy_id,
        principal_type=request.principal_type,
        principal_id=request.principal_id,
    )

    return assignment


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_policy(
    assignment_id: str,
    user: dict = Depends(Permission("policies:assign")),
    abac: ABACService = Depends(get_abac_service),
):
    """
    Remove a policy assignment.

    Requires permission: policies:assign
    """
    await abac.unassign_policy(assignment_id)


@router.get("/user/{user_id}")
async def get_user_policies(
    user_id: str,
    user: dict = Depends(Permission("policies:read")),
    abac: ABACService = Depends(get_abac_service),
):
    """
    Get all policies applicable to a user.

    Requires permission: policies:read
    """
    policies = await abac.get_user_policies(user_id)
    return {"records": policies, "total": len(policies)}


# ==================== Policy Evaluation Endpoint ====================


@router.post("/evaluate")
async def evaluate_access(
    request: EvaluatePolicyRequest,
    user: dict = Depends(Permission("policies:evaluate")),
    abac: ABACService = Depends(get_abac_service),
):
    """
    Evaluate if a user has access to perform an action.

    Requires permission: policies:evaluate
    """
    allowed = await abac.evaluate(
        user_id=request.user_id,
        resource_type=request.resource_type,
        action=request.action,
        resource=request.resource,
        context=request.context,
    )

    return {
        "allowed": allowed,
        "user_id": request.user_id,
        "resource_type": request.resource_type,
        "action": request.action,
    }
