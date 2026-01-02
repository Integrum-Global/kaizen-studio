"""
Promotion API Routes

API endpoints for managing environment promotions.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from kailash.runtime import AsyncLocalRuntime
from pydantic import BaseModel, Field

from studio.middleware.rbac import require_permission
from studio.services.promotion_service import PromotionService

router = APIRouter(prefix="/promotions", tags=["Promotions"])


# Dependency factory functions
def get_runtime() -> AsyncLocalRuntime:
    """Get AsyncLocalRuntime for dependency injection."""
    return AsyncLocalRuntime()


def get_promotion_service(
    runtime: AsyncLocalRuntime = Depends(get_runtime),
) -> PromotionService:
    """Get PromotionService with injected runtime."""
    return PromotionService(runtime=runtime)


# Pydantic models for request validation


class PromotionCreate(BaseModel):
    """Create promotion request."""

    agent_id: str = Field(..., min_length=1)
    source_deployment_id: str = Field(..., min_length=1)
    target_gateway_id: str = Field(..., min_length=1)
    source_environment: str = Field(..., min_length=1)
    target_environment: str = Field(..., min_length=1)


class PromotionReject(BaseModel):
    """Reject promotion request."""

    reason: str = Field(..., min_length=1)


class PromotionRuleCreate(BaseModel):
    """Create promotion rule request."""

    name: str = Field(..., min_length=1)
    source_environment: str = Field(..., min_length=1)
    target_environment: str = Field(..., min_length=1)
    requires_approval: bool = True
    auto_promote: bool = False
    required_approvers: int = 1
    conditions: dict | None = None
    status: str = "active"


class PromotionRuleUpdate(BaseModel):
    """Update promotion rule request."""

    name: str | None = None
    requires_approval: bool | None = None
    auto_promote: bool | None = None
    required_approvers: int | None = None
    conditions: dict | None = None
    status: str | None = None


# ====================
# Promotion endpoints (base path)
# ====================


@router.post("")
async def create_promotion(
    request: Request,
    data: PromotionCreate,
    user: dict = require_permission("promotions:create"),
    service: PromotionService = Depends(get_promotion_service),
):
    """
    Create a new promotion request.

    Creates a request to promote an agent deployment from one environment to another.
    May auto-execute if no approval is required.
    Requires promotions:create permission.
    """

    try:
        promotion = await service.create(
            {
                "organization_id": user["organization_id"],
                "agent_id": data.agent_id,
                "source_deployment_id": data.source_deployment_id,
                "target_gateway_id": data.target_gateway_id,
                "source_environment": data.source_environment,
                "target_environment": data.target_environment,
                "created_by": user["id"],
            }
        )
        return promotion
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_promotions(
    request: Request,
    status: str | None = None,
    agent_id: str | None = None,
    user: dict = require_permission("promotions:read"),
    service: PromotionService = Depends(get_promotion_service),
):
    """
    List promotions for the organization.

    Supports filtering by status and agent.
    Requires promotions:read permission.
    """

    promotions = await service.list(
        organization_id=user["organization_id"],
        status=status,
        agent_id=agent_id,
    )
    return promotions


# ====================
# Rule endpoints (MUST come BEFORE /{promotion_id} to prevent route conflicts)
# ====================


@router.post("/rules")
async def create_promotion_rule(
    request: Request,
    data: PromotionRuleCreate,
    user: dict = require_permission("promotions:rules:create"),
    service: PromotionService = Depends(get_promotion_service),
):
    """
    Create a new promotion rule.

    Defines rules for automatic promotion between environments.
    Requires promotions:rules:create permission.
    """

    try:
        rule = await service.create_rule(
            {
                "organization_id": user["organization_id"],
                "name": data.name,
                "source_environment": data.source_environment,
                "target_environment": data.target_environment,
                "requires_approval": data.requires_approval,
                "auto_promote": data.auto_promote,
                "required_approvers": data.required_approvers,
                "conditions": data.conditions,
                "status": data.status,
            }
        )
        return rule
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/rules")
async def list_promotion_rules(
    request: Request,
    status: str | None = None,
    user: dict = require_permission("promotions:rules:read"),
    service: PromotionService = Depends(get_promotion_service),
):
    """
    List promotion rules for the organization.

    Supports filtering by status.
    Requires promotions:rules:read permission.
    """

    rules = await service.list_rules(
        organization_id=user["organization_id"],
        status=status,
    )
    return {"rules": rules}


@router.get("/rules/{rule_id}")
async def get_promotion_rule(
    request: Request,
    rule_id: str,
    user: dict = require_permission("promotions:rules:read"),
    service: PromotionService = Depends(get_promotion_service),
):
    """
    Get a promotion rule by ID.

    Requires promotions:rules:read permission.
    """

    rule = await service.get_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Promotion rule not found")

    # Verify organization ownership
    if rule["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return rule


@router.put("/rules/{rule_id}")
async def update_promotion_rule(
    request: Request,
    rule_id: str,
    data: PromotionRuleUpdate,
    user: dict = require_permission("promotions:rules:update"),
    service: PromotionService = Depends(get_promotion_service),
):
    """
    Update a promotion rule.

    Requires promotions:rules:update permission.
    """

    # Verify ownership
    rule = await service.get_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Promotion rule not found")

    if rule["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        update_data = data.model_dump(exclude_none=True)
        result = await service.update_rule(rule_id, update_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/rules/{rule_id}")
async def delete_promotion_rule(
    request: Request,
    rule_id: str,
    user: dict = require_permission("promotions:rules:delete"),
    service: PromotionService = Depends(get_promotion_service),
):
    """
    Delete a promotion rule.

    Requires promotions:rules:delete permission.
    """

    # Verify ownership
    rule = await service.get_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Promotion rule not found")

    if rule["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        await service.delete_rule(rule_id)
        return {"message": "Promotion rule deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ====================
# Promotion by ID endpoints (MUST come AFTER /rules to prevent route conflicts)
# ====================


@router.get("/{promotion_id}")
async def get_promotion(
    request: Request,
    promotion_id: str,
    user: dict = require_permission("promotions:read"),
    service: PromotionService = Depends(get_promotion_service),
):
    """
    Get a promotion by ID.

    Requires promotions:read permission.
    """

    promotion = await service.get(promotion_id)
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")

    if promotion["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    return promotion


@router.post("/{promotion_id}/approve")
async def approve_promotion(
    request: Request,
    promotion_id: str,
    user: dict = require_permission("promotions:approve"),
    service: PromotionService = Depends(get_promotion_service),
):
    """
    Approve a promotion request.

    Approves and automatically executes the promotion.
    Requires promotions:approve permission.
    """

    # Verify ownership
    promotion = await service.get(promotion_id)
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")

    if promotion["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        result = await service.approve(promotion_id, user["id"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{promotion_id}/reject")
async def reject_promotion(
    request: Request,
    promotion_id: str,
    data: PromotionReject,
    user: dict = require_permission("promotions:approve"),
    service: PromotionService = Depends(get_promotion_service),
):
    """
    Reject a promotion request.

    Requires promotions:approve permission.
    """

    # Verify ownership
    promotion = await service.get(promotion_id)
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")

    if promotion["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        result = await service.reject(promotion_id, user["id"], data.reason)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{promotion_id}/execute")
async def execute_promotion(
    request: Request,
    promotion_id: str,
    user: dict = require_permission("promotions:execute"),
    service: PromotionService = Depends(get_promotion_service),
):
    """
    Execute a promotion.

    Manually execute a pending or approved promotion.
    Requires promotions:execute permission.
    """

    # Verify ownership
    promotion = await service.get(promotion_id)
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")

    if promotion["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        result = await service.execute(promotion_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
