"""
Scaling API Routes

FastAPI routes for gateway auto-scaling management.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from kailash.runtime import AsyncLocalRuntime
from pydantic import BaseModel, Field

from studio.services.scaling_service import ScalingService

router = APIRouter(prefix="/scaling", tags=["Scaling"])


# Dependency factory functions
def get_runtime() -> AsyncLocalRuntime:
    """Get AsyncLocalRuntime for dependency injection."""
    return AsyncLocalRuntime()


def get_scaling_service() -> ScalingService:
    """Get ScalingService instance."""
    return ScalingService()


# ========================
# Request/Response Models
# ========================


class CreatePolicyRequest(BaseModel):
    """Request model for creating a scaling policy."""

    organization_id: str
    gateway_id: str
    name: str
    min_instances: int = Field(default=1, ge=1)
    max_instances: int = Field(default=10, ge=1)
    target_metric: str = Field(default="cpu")
    target_value: float = Field(default=70.0, ge=0)
    scale_up_threshold: float = Field(default=80.0, ge=0, le=100)
    scale_down_threshold: float = Field(default=20.0, ge=0, le=100)
    cooldown_seconds: int = Field(default=300, ge=60)
    status: str = Field(default="active")


class UpdatePolicyRequest(BaseModel):
    """Request model for updating a scaling policy."""

    name: str | None = None
    min_instances: int | None = Field(default=None, ge=1)
    max_instances: int | None = Field(default=None, ge=1)
    target_metric: str | None = None
    target_value: float | None = Field(default=None, ge=0)
    scale_up_threshold: float | None = Field(default=None, ge=0, le=100)
    scale_down_threshold: float | None = Field(default=None, ge=0, le=100)
    cooldown_seconds: int | None = Field(default=None, ge=60)
    status: str | None = None


class ScaleGatewayRequest(BaseModel):
    """Request model for manual gateway scaling."""

    target_instances: int = Field(ge=1)


# ========================
# Policy Endpoints
# ========================


@router.post("/policies", response_model=dict)
async def create_policy(
    request: CreatePolicyRequest,
    service: ScalingService = Depends(get_scaling_service),
):
    """
    Create a new scaling policy.

    Defines auto-scaling rules for a gateway based on metrics.
    """
    try:
        return await service.create_policy(request.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/policies", response_model=list)
async def list_policies(
    organization_id: str = Query(..., description="Organization ID"),
    gateway_id: str | None = Query(None, description="Filter by gateway"),
    service: ScalingService = Depends(get_scaling_service),
):
    """
    List scaling policies for an organization.

    Optionally filter by gateway ID.
    """
    return await service.list_policies(organization_id, gateway_id)


@router.get("/policies/{policy_id}", response_model=dict)
async def get_policy(
    policy_id: str,
    service: ScalingService = Depends(get_scaling_service),
):
    """
    Get a scaling policy by ID.
    """
    policy = await service.get_policy(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.put("/policies/{policy_id}", response_model=dict)
async def update_policy(
    policy_id: str,
    request: UpdatePolicyRequest,
    service: ScalingService = Depends(get_scaling_service),
):
    """
    Update a scaling policy.

    Only provided fields will be updated.
    """

    # Check if policy exists
    existing = await service.get_policy(policy_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Policy not found")

    # Filter out None values
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}

    if not update_data:
        return existing

    try:
        return await service.update_policy(policy_id, update_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/policies/{policy_id}", status_code=204)
async def delete_policy(
    policy_id: str,
    service: ScalingService = Depends(get_scaling_service),
):
    """
    Delete a scaling policy.
    """

    # Check if policy exists
    existing = await service.get_policy(policy_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Policy not found")

    await service.delete_policy(policy_id)


# ========================
# Scaling Action Endpoints
# ========================


@router.post("/gateways/{gateway_id}/scale", response_model=dict)
async def scale_gateway(
    gateway_id: str,
    request: ScaleGatewayRequest,
    service: ScalingService = Depends(get_scaling_service),
):
    """
    Manually scale a gateway to target instances.

    Bypasses auto-scaling policies for immediate scaling.
    """
    return await service.scale_gateway(gateway_id, request.target_instances)


@router.post("/gateways/{gateway_id}/evaluate", response_model=dict)
async def evaluate_scaling(
    gateway_id: str,
    service: ScalingService = Depends(get_scaling_service),
):
    """
    Evaluate scaling policies and auto-scale if needed.

    Checks current metrics against active policies and
    scales up or down based on thresholds.
    """
    return await service.evaluate_scaling(gateway_id)


# ========================
@router.get("/gateways/{gateway_id}/events", response_model=list)
async def list_scaling_events(
    gateway_id: str,
    limit: int = Query(50, ge=1, le=500),
    service: ScalingService = Depends(get_scaling_service),
):
    """
    List scaling events for a gateway.

    Returns history of scaling actions taken.
    """
    return await service.list_events(gateway_id, limit)


@router.get("/events/{event_id}", response_model=dict)
async def get_scaling_event(
    event_id: str,
    service: ScalingService = Depends(get_scaling_service),
):
    """
    Get a scaling event by ID.
    """
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


# ========================
# Metrics Endpoints
# ========================


@router.get("/gateways/{gateway_id}/metrics", response_model=dict)
async def get_gateway_metrics(
    gateway_id: str,
    service: ScalingService = Depends(get_scaling_service),
):
    """
    Get current metrics for a gateway.

    Returns CPU, memory, requests/sec, latency, and error rate.
    """
    return await service.get_gateway_metrics(gateway_id)


@router.get("/metrics/supported", response_model=dict)
async def get_supported_metrics(
    service: ScalingService = Depends(get_scaling_service),
):
    """
    Get list of supported scaling metrics.

    Returns metric names and descriptions for policy configuration.
    """
    return service.get_supported_metrics()
