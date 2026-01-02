"""
Gateway API Routes

API endpoints for managing Nexus gateways.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from studio.middleware.rbac import require_permission
from studio.services.gateway_service import GatewayService

router = APIRouter(prefix="/gateways", tags=["Gateways"])


class GatewayCreate(BaseModel):
    """Create gateway request."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    api_url: str = Field(..., min_length=1)
    api_key: str = Field(..., min_length=1)
    environment: str = Field(default="development")
    health_check_url: str | None = None


class GatewayUpdate(BaseModel):
    """Update gateway request."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    api_url: str | None = None
    api_key: str | None = None
    environment: str | None = None
    health_check_url: str | None = None
    status: str | None = None


@router.post("")
async def create_gateway(
    data: GatewayCreate, user: dict = require_permission("deployments:create")
):
    """
    Create a new gateway.

    Requires deployments:create permission.
    """
    service = GatewayService()

    gateway_data = data.model_dump()
    gateway_data["organization_id"] = user["organization_id"]

    gateway = await service.create(gateway_data)
    return gateway


@router.get("")
async def list_gateways(
    environment: str | None = None,
    user: dict = require_permission("deployments:read"),
):
    """
    List gateways for the organization.

    Requires deployments:read permission.
    """
    service = GatewayService()

    gateways = await service.list(
        organization_id=user["organization_id"], environment=environment
    )
    return {"gateways": gateways}


@router.get("/{gateway_id}")
async def get_gateway(
    gateway_id: str, user: dict = require_permission("deployments:read")
):
    """
    Get a gateway by ID.

    Requires deployments:read permission.
    """
    service = GatewayService()

    gateway = await service.get(gateway_id)
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway not found")

    if gateway["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return gateway


@router.put("/{gateway_id}")
async def update_gateway(
    gateway_id: str,
    data: GatewayUpdate,
    user: dict = require_permission("deployments:update"),
):
    """
    Update a gateway.

    Requires deployments:update permission.
    """
    service = GatewayService()

    # Verify ownership
    gateway = await service.get(gateway_id)
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway not found")

    if gateway["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Update with non-null values
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    updated = await service.update(gateway_id, update_data)
    return updated


@router.delete("/{gateway_id}")
async def delete_gateway(
    gateway_id: str, user: dict = require_permission("deployments:delete")
):
    """
    Delete a gateway.

    Requires deployments:delete permission.
    """
    service = GatewayService()

    # Verify ownership
    gateway = await service.get(gateway_id)
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway not found")

    if gateway["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    await service.delete(gateway_id)
    return {"message": "Gateway deleted"}


@router.post("/{gateway_id}/health")
async def check_gateway_health(
    gateway_id: str, user: dict = require_permission("deployments:read")
):
    """
    Check health of a gateway.

    Requires deployments:read permission.
    """
    service = GatewayService()

    # Verify ownership
    gateway = await service.get(gateway_id)
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway not found")

    if gateway["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        result = await service.check_health(gateway_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
