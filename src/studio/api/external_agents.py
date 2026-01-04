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
    approval: dict
    timestamp: str


class BudgetStatusResponse(BaseModel):
    """Budget status response."""

    external_agent_id: str
    organization_id: str
    period: str
    period_start: str
    period_end: str
    cost_used: float
    cost_limit: float
    cost_remaining: float
    invocations: int
    invocations_limit: int
    invocations_remaining: int
    usage_percentage: float
    warning_triggered: bool
    limit_exceeded: bool


class UpdateBudgetConfigRequest(BaseModel):
    """Update budget configuration request."""

    monthly_budget_usd: float | None = Field(None, ge=0)
    daily_budget_usd: float | None = Field(None, ge=-1)  # -1 = unlimited
    monthly_execution_limit: int | None = Field(None, ge=-1)  # -1 = unlimited
    warning_threshold: float | None = Field(None, ge=0, le=1)
    degradation_threshold: float | None = Field(None, ge=0, le=1)
    enforcement_mode: str | None = Field(None, pattern=r"^(hard|soft)$")


# Approval models
class ApprovalRequestResponse(BaseModel):
    """Approval request response."""

    id: str
    external_agent_id: str
    organization_id: str
    requested_by_user_id: str
    requested_by_team_id: str | None = None
    trigger_reason: str
    payload_summary: str
    estimated_cost: float | None = None
    estimated_tokens: int | None = None
    status: str
    created_at: str
    expires_at: str | None = None
    required_approvals: int
    approval_count: int
    rejection_count: int


class ApprovalDecisionRequest(BaseModel):
    """Approval decision request."""

    reason: str | None = Field(None, max_length=1000)
    metadata: dict | None = Field(default_factory=dict)


class ApprovalDecisionResponse(BaseModel):
    """Approval decision response."""

    request_id: str
    status: str
    decision: str
    approved_by: str | None = None
    rejected_by: str | None = None
    reason: str | None = None


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


@router.get(
    "/{agent_id}/budget",
    response_model=BudgetStatusResponse,
)
async def get_budget_status(
    agent_id: str,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("external_agents:read")),
):
    """
    Get detailed budget status for external agent.

    Returns:
    - Period information (monthly/daily)
    - Cost usage and limits
    - Invocation counts and limits
    - Warning and limit status

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

        # Get budget status from enforcer
        from kaizen.trust.governance import BudgetScope

        scope = BudgetScope(
            organization_id=current_user["organization_id"],
            agent_id=agent_id,
        )

        budget_status = await service.governance_service.budget_enforcer.get_budget_status(
            agent_id=agent_id,
            scope=scope,
        )

        return {
            "external_agent_id": agent_id,
            "organization_id": current_user["organization_id"],
            "period": budget_status.period,
            "period_start": budget_status.period_start.isoformat(),
            "period_end": budget_status.period_end.isoformat(),
            "cost_used": budget_status.cost_used,
            "cost_limit": budget_status.cost_limit or 0.0,
            "cost_remaining": budget_status.cost_remaining or 0.0,
            "invocations": budget_status.invocations,
            "invocations_limit": budget_status.invocations_limit or 0,
            "invocations_remaining": budget_status.invocations_remaining or 0,
            "usage_percentage": budget_status.usage_percentage,
            "warning_triggered": budget_status.warning_triggered,
            "limit_exceeded": budget_status.limit_exceeded,
        }

    except HTTPException:
        raise
    except ImportError:
        # Governance module not available
        raise HTTPException(
            status_code=503,
            detail="Budget tracking not available (governance module not installed)"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get budget status: {str(e)}"
        )


@router.patch(
    "/{agent_id}/budget/config",
)
async def update_budget_config(
    agent_id: str,
    data: UpdateBudgetConfigRequest,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("external_agents:update")),
):
    """
    Update budget configuration for external agent.

    Allows updating:
    - Monthly and daily budget limits
    - Execution limits
    - Warning and degradation thresholds
    - Enforcement mode (hard/soft)

    Requires: update:external_agent permission
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

        # Build updates for external agent model
        updates = {}
        if data.monthly_budget_usd is not None:
            updates["budget_limit_monthly"] = data.monthly_budget_usd
        if data.daily_budget_usd is not None:
            updates["budget_limit_daily"] = data.daily_budget_usd

        # Update agent if there are changes
        if updates:
            await service.update(agent_id, updates)

        # Return updated budget status
        from kaizen.trust.governance import BudgetScope

        scope = BudgetScope(
            organization_id=current_user["organization_id"],
            agent_id=agent_id,
        )

        budget_status = await service.governance_service.budget_enforcer.get_budget_status(
            agent_id=agent_id,
            scope=scope,
        )

        return {
            "message": "Budget configuration updated",
            "external_agent_id": agent_id,
            "budget_limit_monthly": data.monthly_budget_usd or agent.get("budget_limit_monthly"),
            "budget_limit_daily": data.daily_budget_usd or agent.get("budget_limit_daily"),
            "current_usage": {
                "cost_used": budget_status.cost_used,
                "invocations": budget_status.invocations,
            },
        }

    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Budget configuration not available (governance module not installed)"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update budget config: {str(e)}"
        )


# ===================
# Approval Endpoints
# ===================


# Create approval router with a different prefix
approval_router = APIRouter(prefix="/approvals", tags=["Approvals"])


def _format_approval_request(request) -> dict:
    """Format ApprovalRequest for API response."""
    return {
        "id": request.id,
        "external_agent_id": request.external_agent_id,
        "organization_id": request.organization_id,
        "requested_by_user_id": request.requested_by_user_id,
        "requested_by_team_id": request.requested_by_team_id,
        "trigger_reason": request.trigger_reason,
        "payload_summary": request.payload_summary,
        "estimated_cost": request.estimated_cost,
        "estimated_tokens": request.estimated_tokens,
        "status": request.status.value if hasattr(request.status, "value") else request.status,
        "created_at": request.created_at.isoformat() if request.created_at else None,
        "expires_at": request.expires_at.isoformat() if request.expires_at else None,
        "required_approvals": request.required_approvals,
        "approval_count": len(request.approvals),
        "rejection_count": len(request.rejections),
    }


@approval_router.get(
    "/pending",
    response_model=list[ApprovalRequestResponse],
)
async def get_pending_approvals(
    organization_id: str | None = Query(None),
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("approvals:read")),
):
    """
    Get pending approval requests for the current user.

    Returns approval requests that the current user can approve/reject.

    Requires: read:approvals permission
    """
    try:
        approval_manager = service.governance_service.approval_manager
        if not approval_manager:
            raise HTTPException(
                status_code=503,
                detail="Approval workflows not available"
            )

        org_id = organization_id or current_user["organization_id"]
        pending = await approval_manager.get_pending_requests(
            approver_id=current_user["id"],
            organization_id=org_id,
        )

        return [_format_approval_request(req) for req in pending]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get pending approvals: {str(e)}"
        )


@approval_router.get(
    "/{request_id}",
    response_model=ApprovalRequestResponse,
)
async def get_approval_request(
    request_id: str,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("approvals:read")),
):
    """
    Get an approval request by ID.

    Requires: read:approvals permission
    """
    try:
        approval_manager = service.governance_service.approval_manager
        if not approval_manager:
            raise HTTPException(
                status_code=503,
                detail="Approval workflows not available"
            )

        request = await approval_manager.get_request(request_id)
        if not request:
            raise HTTPException(
                status_code=404, detail=f"Approval request {request_id} not found"
            )

        # Verify organization access
        if request.organization_id != current_user["organization_id"]:
            raise HTTPException(
                status_code=403, detail="Access denied to this approval request"
            )

        return _format_approval_request(request)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get approval request: {str(e)}"
        )


@approval_router.post(
    "/{request_id}/approve",
    response_model=ApprovalDecisionResponse,
)
async def approve_request(
    request_id: str,
    data: ApprovalDecisionRequest,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("approvals:approve")),
):
    """
    Approve an approval request.

    Requires: approve:approvals permission
    """
    try:
        approval_manager = service.governance_service.approval_manager
        if not approval_manager:
            raise HTTPException(
                status_code=503,
                detail="Approval workflows not available"
            )

        from kaizen.trust.governance import (
            ApprovalNotFoundError,
            ApprovalExpiredError,
            AlreadyDecidedError,
            SelfApprovalNotAllowedError,
            UnauthorizedApproverError,
        )

        try:
            result = await approval_manager.approve(
                request_id=request_id,
                approver_id=current_user["id"],
                reason=data.reason,
                metadata=data.metadata,
            )

            return {
                "request_id": result.id,
                "status": result.status.value if hasattr(result.status, "value") else result.status,
                "decision": "approved",
                "approved_by": current_user["id"],
                "reason": data.reason,
            }

        except ApprovalNotFoundError:
            raise HTTPException(
                status_code=404, detail=f"Approval request {request_id} not found"
            )
        except ApprovalExpiredError:
            raise HTTPException(
                status_code=410, detail=f"Approval request {request_id} has expired"
            )
        except AlreadyDecidedError as e:
            raise HTTPException(
                status_code=409, detail=f"Request already {e.status.value}"
            )
        except SelfApprovalNotAllowedError:
            raise HTTPException(
                status_code=403, detail="Self-approval is not allowed"
            )
        except UnauthorizedApproverError:
            raise HTTPException(
                status_code=403, detail="You are not authorized to approve this request"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to approve request: {str(e)}"
        )


@approval_router.post(
    "/{request_id}/reject",
    response_model=ApprovalDecisionResponse,
)
async def reject_request(
    request_id: str,
    data: ApprovalDecisionRequest,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("approvals:approve")),
):
    """
    Reject an approval request.

    A reason is required for rejection.

    Requires: approve:approvals permission
    """
    try:
        if not data.reason:
            raise HTTPException(
                status_code=400, detail="Reason is required for rejection"
            )

        approval_manager = service.governance_service.approval_manager
        if not approval_manager:
            raise HTTPException(
                status_code=503,
                detail="Approval workflows not available"
            )

        from kaizen.trust.governance import (
            ApprovalNotFoundError,
            AlreadyDecidedError,
            UnauthorizedApproverError,
        )

        try:
            result = await approval_manager.reject(
                request_id=request_id,
                approver_id=current_user["id"],
                reason=data.reason,
                metadata=data.metadata,
            )

            return {
                "request_id": result.id,
                "status": result.status.value if hasattr(result.status, "value") else result.status,
                "decision": "rejected",
                "rejected_by": current_user["id"],
                "reason": data.reason,
            }

        except ApprovalNotFoundError:
            raise HTTPException(
                status_code=404, detail=f"Approval request {request_id} not found"
            )
        except AlreadyDecidedError as e:
            raise HTTPException(
                status_code=409, detail=f"Request already {e.status.value}"
            )
        except UnauthorizedApproverError:
            raise HTTPException(
                status_code=403, detail="You are not authorized to reject this request"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to reject request: {str(e)}"
        )


@router.get(
    "/{agent_id}/approvals/pending",
    response_model=list[ApprovalRequestResponse],
)
async def get_agent_pending_approvals(
    agent_id: str,
    service: ExternalAgentService = Depends(get_external_agent_service),
    current_user: dict = Depends(require_permission("approvals:read")),
):
    """
    Get pending approval requests for a specific external agent.

    Requires: read:approvals permission
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

        approval_manager = service.governance_service.approval_manager
        if not approval_manager:
            raise HTTPException(
                status_code=503,
                detail="Approval workflows not available"
            )

        pending = await approval_manager.store.get_pending_for_agent(
            agent_id=agent_id,
            organization_id=current_user["organization_id"],
        )

        return [_format_approval_request(req) for req in pending]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get pending approvals: {str(e)}"
        )
