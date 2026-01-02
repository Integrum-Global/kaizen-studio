"""
Deployment API Routes

API endpoints for managing agent deployments.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from studio.middleware.rbac import require_permission
from studio.services.deployment_service import DeploymentService

router = APIRouter(prefix="/deployments", tags=["Deployments"])


class DeploymentCreate(BaseModel):
    """Create deployment request."""

    agent_id: str = Field(..., min_length=1)
    gateway_id: str = Field(..., min_length=1)
    agent_version_id: str | None = None


@router.post("")
async def create_deployment(
    data: DeploymentCreate, user: dict = require_permission("deployments:create")
):
    """
    Create and start a new deployment.

    Deploys an agent to the specified gateway.
    Requires deployments:create permission.
    """
    service = DeploymentService()

    try:
        deployment = await service.deploy(
            agent_id=data.agent_id,
            gateway_id=data.gateway_id,
            user_id=user["id"],
            agent_version_id=data.agent_version_id,
        )
        return deployment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_deployments(
    agent_id: str | None = None,
    gateway_id: str | None = None,
    status: str | None = None,
    user: dict = require_permission("deployments:read"),
):
    """
    List deployments for the organization.

    Supports filtering by agent, gateway, and status.
    Requires deployments:read permission.
    """
    service = DeploymentService()

    deployments = await service.list(
        organization_id=user["organization_id"],
        agent_id=agent_id,
        gateway_id=gateway_id,
        status=status,
    )
    return {"deployments": deployments}


@router.get("/{deployment_id}")
async def get_deployment(
    deployment_id: str, user: dict = require_permission("deployments:read")
):
    """
    Get a deployment by ID.

    Requires deployments:read permission.
    """
    service = DeploymentService()

    deployment = await service.get(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    if deployment["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return deployment


@router.post("/{deployment_id}/stop")
async def stop_deployment(
    deployment_id: str, user: dict = require_permission("deployments:delete")
):
    """
    Stop a deployment.

    Stops the agent on the gateway and updates status.
    Requires deployments:delete permission.
    """
    service = DeploymentService()

    # Verify ownership
    deployment = await service.get(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    if deployment["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        result = await service.stop(deployment_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{deployment_id}/redeploy")
async def redeploy(
    deployment_id: str, user: dict = require_permission("deployments:update")
):
    """
    Redeploy an existing deployment.

    Stops current deployment and creates a new one with same parameters.
    Requires deployments:update permission.
    """
    service = DeploymentService()

    # Verify ownership
    deployment = await service.get(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    if deployment["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        result = await service.redeploy(deployment_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{deployment_id}/logs")
async def get_deployment_logs(
    deployment_id: str, user: dict = require_permission("deployments:read")
):
    """
    Get logs for a deployment.

    Returns deployment lifecycle events.
    Requires deployments:read permission.
    """
    service = DeploymentService()

    # Verify ownership
    deployment = await service.get(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    if deployment["organization_id"] != user["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    logs = await service.get_logs(deployment_id)
    return {"logs": logs}
