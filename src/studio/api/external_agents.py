"""
External Agents API Endpoints

Handles external agent CRUD and invocation operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from kailash.runtime import AsyncLocalRuntime
from pydantic import BaseModel, Field

from studio.api.auth import require_permission
from studio.services.external_agent_service import ExternalAgentService

router = APIRouter(prefix="/external-agents", tags=["External Agents"])


# Dependency factory functions
def get_runtime() -> AsyncLocalRuntime:
    """Get AsyncLocalRuntime for dependency injection."""
    return AsyncLocalRuntime()


def get_external_agent_service(
    runtime: AsyncLocalRuntime = Depends(get_runtime),
) -> ExternalAgentService:
    """Get ExternalAgentService with injected runtime."""
    return ExternalAgentService(runtime=runtime)


# ===================
# Request/Response Models
# ===================


class CreateExternalAgentRequest(BaseModel):
    """Create external agent request."""

    workspace_id: str
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    platform: str = Field(
        ..., pattern=r"^(teams|discord|slack|telegram|notion|custom_http)$"
    )
    platform_agent_id: str | None = Field(None, max_length=200)
    webhook_url: str = Field(..., min_length=1, max_length=500)
    auth_type: str = Field(
        ..., pattern=r"^(oauth2|api_key|bearer_token|basic|custom|none)$"
    )
    auth_config: dict | None = Field(default_factory=dict)
    platform_config: dict | None = Field(default_factory=dict)
    capabilities: list | None = Field(default_factory=list)
    config: dict | None = Field(default_factory=dict)
    budget_limit_daily: float = Field(default=-1.0)
    budget_limit_monthly: float = Field(default=-1.0)
    rate_limit_per_minute: int = Field(default=-1)
    rate_limit_per_hour: int = Field(default=-1)
    tags: list | None = Field(default_factory=list)


class UpdateExternalAgentRequest(BaseModel):
    """Update external agent request."""

    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    webhook_url: str | None = Field(None, min_length=1, max_length=500)
    auth_type: str | None = Field(
        None, pattern=r"^(oauth2|api_key|bearer_token|basic|custom|none)$"
    )
    auth_config: dict | None = None
    platform_config: dict | None = None
    config: dict | None = None
    budget_limit_daily: float | None = None
    budget_limit_monthly: float | None = None
    rate_limit_per_minute: int | None = None
    rate_limit_per_hour: int | None = None
    status: str | None = Field(None, pattern=r"^(active|inactive|deleted)$")
    tags: list | None = None


class InvokeExternalAgentRequest(BaseModel):
    """Invoke external agent request."""

    input: str = Field(..., min_length=1)
    context: dict | None = Field(default_factory=dict)
    metadata: dict | None = Field(default_factory=dict)


# Response models
class ExternalAgentResponse(BaseModel):
    """External agent response."""

    id: str
    organization_id: str
    workspace_id: str
    name: str
    description: str | None = None
    platform: str
    platform_agent_id: str | None = None
    webhook_url: str
    auth_type: str
    platform_config: str
    capabilities: str
    config: str
    budget_limit_daily: float
    budget_limit_monthly: float
    rate_limit_per_minute: int
    rate_limit_per_hour: int
    tags: str = Field(None, validation_alias="agent_tags")  # alias for DB field
    status: str
    created_by: str
    created_at: str
    updated_at: str


class ExternalAgentListResponse(BaseModel):
    """External agent list response."""

    agents: list[dict]
    total: int
    limit: int
    offset: int


class InvokeExternalAgentResponse(BaseModel):
    """Invoke external agent response."""

    invocation_id: str
    trace_id: str
    status: str
    output: str | None = None
    metadata: dict | None = None


class GovernanceStatusResponse(BaseModel):
    """Governance status response."""

    external_agent_id: str
    organization_id: str
    budget: dict
    rate_limit: dict
    policy: dict
    timestamp: str


# ===================
# Endpoints
# ===================


@router.post(
    "",
    response_model=ExternalAgentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_external_agent(
    request: Request,
    data: CreateExternalAgentRequest,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("external_agents:create")),
):
    """
    Create a new external agent.

    Requires: create:external_agent permission
    """
    try:
        agent = await service.create(
            organization_id=current_user["organization_id"],
            workspace_id=data.workspace_id,
            name=data.name,
            description=data.description or "",
            platform=data.platform,
            platform_agent_id=data.platform_agent_id or "",
            webhook_url=data.webhook_url,
            auth_type=data.auth_type,
            auth_config=data.auth_config,
            platform_config=data.platform_config,
            capabilities=data.capabilities,
            config=data.config,
            budget_limit_daily=data.budget_limit_daily,
            budget_limit_monthly=data.budget_limit_monthly,
            rate_limit_per_minute=data.rate_limit_per_minute,
            rate_limit_per_hour=data.rate_limit_per_hour,
            tags=data.tags,
            created_by=current_user["id"],
        )

        return agent

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create external agent: {str(e)}"
        )


@router.get(
    "",
    response_model=ExternalAgentListResponse,
)
async def list_external_agents(
    workspace_id: str | None = Query(None),
    platform: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("external_agents:read")),
):
    """
    List external agents with filtering and pagination.

    Requires: read:external_agent permission
    """
    try:
        result = await service.list(
            organization_id=current_user["organization_id"],
            workspace_id=workspace_id,
            platform=platform,
            status=status,
            limit=limit,
            offset=offset,
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to list external agents: {str(e)}"
        )


@router.get(
    "/{agent_id}",
    response_model=ExternalAgentResponse,
)
async def get_external_agent(
    agent_id: str,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("external_agents:read")),
):
    """
    Get an external agent by ID.

    Requires: read:external_agent permission
    """
    try:
        agent = await service.get(agent_id)

        if not agent:
            raise HTTPException(
                status_code=404, detail=f"External agent {agent_id} not found"
            )

        # Verify organization access
        if agent.get("organization_id") != current_user["organization_id"]:
            raise HTTPException(
                status_code=403, detail="Access denied to this external agent"
            )

        return agent

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get external agent: {str(e)}"
        )


@router.patch(
    "/{agent_id}",
    response_model=ExternalAgentResponse,
)
async def update_external_agent(
    agent_id: str,
    data: UpdateExternalAgentRequest,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("external_agents:update")),
):
    """
    Update an external agent.

    Requires: update:external_agent permission
    """
    try:
        # Verify agent exists and user has access
        existing = await service.get(agent_id)
        if not existing:
            raise HTTPException(
                status_code=404, detail=f"External agent {agent_id} not found"
            )

        if existing.get("organization_id") != current_user["organization_id"]:
            raise HTTPException(
                status_code=403, detail="Access denied to this external agent"
            )

        # Build updates dict (only include provided fields)
        updates = {}
        if data.name is not None:
            updates["name"] = data.name
        if data.description is not None:
            updates["description"] = data.description
        if data.webhook_url is not None:
            updates["webhook_url"] = data.webhook_url
        if data.auth_type is not None:
            updates["auth_type"] = data.auth_type
        if data.auth_config is not None:
            updates["auth_config"] = data.auth_config
        if data.platform_config is not None:
            updates["platform_config"] = data.platform_config
        if data.config is not None:
            updates["config"] = data.config
        if data.budget_limit_daily is not None:
            updates["budget_limit_daily"] = data.budget_limit_daily
        if data.budget_limit_monthly is not None:
            updates["budget_limit_monthly"] = data.budget_limit_monthly
        if data.rate_limit_per_minute is not None:
            updates["rate_limit_per_minute"] = data.rate_limit_per_minute
        if data.rate_limit_per_hour is not None:
            updates["rate_limit_per_hour"] = data.rate_limit_per_hour
        if data.status is not None:
            updates["status"] = data.status
        if data.tags is not None:
            updates["tags"] = data.tags

        if not updates:
            # No updates provided, return existing
            return existing

        # For auth_config updates, we need both auth_type and auth_config
        if "auth_config" in updates and "auth_type" not in updates:
            updates["auth_type"] = existing.get("auth_type", "none")

        # For platform_config updates, we need platform
        if "platform_config" in updates:
            updates["platform"] = existing.get("platform", "custom_http")

        agent = await service.update(agent_id, updates)

        if not agent:
            raise HTTPException(
                status_code=404, detail=f"External agent {agent_id} not found"
            )

        return agent

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update external agent: {str(e)}"
        )


@router.delete(
    "/{agent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_external_agent(
    agent_id: str,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("external_agents:delete")),
):
    """
    Soft delete an external agent (set status='deleted').

    Requires: delete:external_agent permission
    """
    try:
        # Verify agent exists and user has access
        existing = await service.get(agent_id)
        if not existing:
            raise HTTPException(
                status_code=404, detail=f"External agent {agent_id} not found"
            )

        if existing.get("organization_id") != current_user["organization_id"]:
            raise HTTPException(
                status_code=403, detail="Access denied to this external agent"
            )

        await service.delete(agent_id)

        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete external agent: {str(e)}"
        )


@router.post(
    "/{agent_id}/invoke",
    response_model=InvokeExternalAgentResponse,
)
async def invoke_external_agent(
    agent_id: str,
    request: Request,
    data: InvokeExternalAgentRequest,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("external_agents:invoke")),
):
    """
    Invoke an external agent.

    Requires: invoke:external_agent permission
    """
    try:
        # Verify agent exists and user has access
        existing = await service.get(agent_id)
        if not existing:
            raise HTTPException(
                status_code=404, detail=f"External agent {agent_id} not found"
            )

        if existing.get("organization_id") != current_user["organization_id"]:
            raise HTTPException(
                status_code=403, detail="Access denied to this external agent"
            )

        # Check if agent is deleted
        if existing.get("status") == "deleted":
            raise HTTPException(
                status_code=400, detail=f"External agent {agent_id} is deleted"
            )

        # Prepare request data
        request_data = {
            "input": data.input,
            "context": data.context or {},
            "metadata": data.metadata or {},
        }

        # Get client IP and user agent
        client_host = request.client.host if request.client else ""
        user_agent = request.headers.get("user-agent", "")

        # Extract external headers from request state (set by LineageMiddleware)
        external_headers = getattr(request.state, "external_headers", None)

        # Get API key info (for lineage tracking)
        # In production, this would come from auth middleware
        api_key = {
            "id": current_user.get("api_key_id", "unknown"),
            "key_prefix": current_user.get("api_key_prefix", ""),
            "organization_id": current_user["organization_id"],
            "team_id": current_user.get("team_id"),
        }

        # Invoke agent
        result = await service.invoke(
            agent_id=agent_id,
            user_id=current_user["id"],
            organization_id=current_user["organization_id"],
            request_data=request_data,
            request_ip=client_host,
            request_user_agent=user_agent,
            external_headers=external_headers,
            api_key=api_key,
        )

        return result

    except HTTPException:
        raise
    except ValueError as e:
        # Rate limit or budget errors
        if "rate limit" in str(e).lower():
            raise HTTPException(status_code=429, detail=str(e))
        elif "budget" in str(e).lower():
            raise HTTPException(status_code=402, detail=str(e))  # 402 Payment Required
        else:
            raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to invoke external agent: {str(e)}"
        )


@router.get(
    "/{agent_id}/governance-status",
    response_model=GovernanceStatusResponse,
)
async def get_governance_status(
    agent_id: str,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("external_agents:read")),
):
    """
    Get comprehensive governance status for external agent.

    Returns budget usage, rate limit status, and policy evaluation results.

    Requires: read:external_agent permission
    """
    try:
        # Verify agent exists and user has access
        agent = await service.get(agent_id)
        if not agent:
            raise HTTPException(
                status_code=404, detail=f"External agent {agent_id} not found"
            )

        if agent.get("organization_id") != current_user["organization_id"]:
            raise HTTPException(
                status_code=403, detail="Access denied to this external agent"
            )

        # Get governance status from governance service
        status_data = await service.governance_service.get_governance_status(
            external_agent_id=agent_id,
            organization_id=current_user["organization_id"],
            user_id=current_user["id"],
        )

        return status_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get governance status: {str(e)}"
        )
