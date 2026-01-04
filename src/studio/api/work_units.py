"""
Work Units API Endpoints

Handles Work Unit CRUD operations following the EATP Ontology.
Work Units unify the former Agent and Pipeline concepts.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from studio.api.auth import require_permission
from studio.services.agent_service import AgentService
from studio.services.pipeline_service import PipelineService

router = APIRouter(prefix="/work-units", tags=["Work Units"])


# Singleton service instances
_agent_service: AgentService | None = None
_pipeline_service: PipelineService | None = None


def get_agent_service() -> AgentService:
    """Get AgentService singleton instance."""
    global _agent_service
    if _agent_service is None:
        _agent_service = AgentService()
    return _agent_service


def get_pipeline_service() -> PipelineService:
    """Get PipelineService singleton instance."""
    global _pipeline_service
    if _pipeline_service is None:
        _pipeline_service = PipelineService()
    return _pipeline_service


# ===================
# Request/Response Models
# ===================


class TrustInfoResponse(BaseModel):
    """Trust information response."""

    status: str = "valid"
    establishedAt: str | None = None
    expiresAt: str | None = None
    delegatedBy: dict | None = None
    trustChainId: str | None = None


class WorkspaceRefResponse(BaseModel):
    """Workspace reference response."""

    id: str
    name: str
    color: str | None = None


class WorkUnitResponse(BaseModel):
    """Work unit response."""

    id: str
    name: str
    description: str = ""
    type: str  # atomic or composite
    capabilities: list[str] = []
    trustInfo: TrustInfoResponse
    workspaceId: str | None = None
    workspace: WorkspaceRefResponse | None = None
    createdBy: str
    createdByName: str | None = None
    createdAt: str
    updatedAt: str
    lastRunAt: str | None = None
    tags: list[str] = []
    subUnits: list[dict] | None = None
    subUnitCount: int | None = None


class WorkUnitListResponse(BaseModel):
    """Work unit list response."""

    items: list[WorkUnitResponse]
    total: int
    page: int
    pageSize: int
    hasMore: bool


class CreateWorkUnitRequest(BaseModel):
    """Create work unit request."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=2000)
    type: str = Field(..., pattern=r"^(atomic|composite)$")
    capabilities: list[dict] = Field(default=[])
    workspaceId: str | None = None
    tags: list[str] = []
    subUnitIds: list[str] = []


class UpdateWorkUnitRequest(BaseModel):
    """Update work unit request."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=2000)
    capabilities: list[dict] | None = None
    workspaceId: str | None = None
    tags: list[str] | None = None


class RunWorkUnitRequest(BaseModel):
    """Run work unit request."""

    inputs: dict = Field(default={})


class RunResultResponse(BaseModel):
    """Run result response."""

    id: str
    status: str  # running, completed, failed, cancelled
    startedAt: str
    completedAt: str | None = None
    input: dict | None = None
    output: dict | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


def _agent_to_work_unit(agent: dict) -> WorkUnitResponse:
    """Convert an agent to a work unit response."""
    trust_info = TrustInfoResponse(
        status="valid",
        establishedAt=agent.get("created_at"),
    )

    workspace = None
    if agent.get("workspace_id"):
        workspace = WorkspaceRefResponse(
            id=agent["workspace_id"],
            name=agent.get("workspace_name", "Unknown"),
            color=None,
        )

    return WorkUnitResponse(
        id=agent["id"],
        name=agent["name"],
        description=agent.get("description", ""),
        type="atomic",  # Agents are atomic work units
        capabilities=[agent.get("agent_type", "task")],
        trustInfo=trust_info,
        workspaceId=agent.get("workspace_id"),
        workspace=workspace,
        createdBy=agent["created_by"],
        createdByName=agent.get("created_by_name"),
        createdAt=agent["created_at"],
        updatedAt=agent["updated_at"],
        lastRunAt=agent.get("last_run_at"),
        tags=agent.get("tags", []),
    )


def _pipeline_to_work_unit(pipeline: dict) -> WorkUnitResponse:
    """Convert a pipeline to a work unit response."""
    trust_info = TrustInfoResponse(
        status="valid",
        establishedAt=pipeline.get("created_at"),
    )

    workspace = None
    if pipeline.get("workspace_id"):
        workspace = WorkspaceRefResponse(
            id=pipeline["workspace_id"],
            name=pipeline.get("workspace_name", "Unknown"),
            color=None,
        )

    # Count sub-units (pipeline stages)
    stages = pipeline.get("stages", [])
    sub_unit_count = len(stages) if isinstance(stages, list) else 0

    return WorkUnitResponse(
        id=pipeline["id"],
        name=pipeline["name"],
        description=pipeline.get("description", ""),
        type="composite",  # Pipelines are composite work units
        capabilities=["orchestration"],
        trustInfo=trust_info,
        workspaceId=pipeline.get("workspace_id"),
        workspace=workspace,
        createdBy=pipeline["created_by"],
        createdByName=pipeline.get("created_by_name"),
        createdAt=pipeline["created_at"],
        updatedAt=pipeline["updated_at"],
        lastRunAt=pipeline.get("last_run_at"),
        tags=pipeline.get("tags", []),
        subUnitCount=sub_unit_count,
    )


@router.get("", response_model=WorkUnitListResponse)
async def list_work_units(
    search: str | None = Query(None),
    type: str | None = Query(None, pattern=r"^(atomic|composite|all)$"),
    trustStatus: str | None = Query(None),
    workspaceId: str | None = Query(None),
    tags: str | None = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_permission("agents:read")),
    agent_service: AgentService = Depends(get_agent_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    List work units in the current user's organization.
    Combines agents (atomic) and pipelines (composite) into unified work units.
    """
    org_id = current_user["organization_id"]
    offset = (page - 1) * pageSize

    items: list[WorkUnitResponse] = []
    total = 0

    # Fetch atomic work units (agents)
    if type in (None, "all", "atomic"):
        agent_filters = {}
        if workspaceId:
            agent_filters["workspace_id"] = workspaceId

        agents_result = await agent_service.list(
            organization_id=org_id,
            workspace_id=workspaceId,
            filters=agent_filters if agent_filters else None,
            limit=pageSize,
            offset=offset,
        )

        for agent in agents_result.get("records", []):
            # Apply search filter if provided
            if search and search.lower() not in agent.get("name", "").lower():
                continue
            items.append(_agent_to_work_unit(agent))
        total += agents_result.get("total", 0)

    # Fetch composite work units (pipelines)
    if type in (None, "all", "composite"):
        pipeline_filters = {}
        if workspaceId:
            pipeline_filters["workspace_id"] = workspaceId

        pipelines_result = await pipeline_service.list(
            organization_id=org_id,
            workspace_id=workspaceId,
            filters=pipeline_filters if pipeline_filters else None,
            limit=pageSize,
            offset=offset,
        )

        for pipeline in pipelines_result.get("records", []):
            # Apply search filter if provided
            if search and search.lower() not in pipeline.get("name", "").lower():
                continue
            items.append(_pipeline_to_work_unit(pipeline))
        total += pipelines_result.get("total", 0)

    return WorkUnitListResponse(
        items=items[:pageSize],  # Limit to pageSize
        total=total,
        page=page,
        pageSize=pageSize,
        hasMore=len(items) > pageSize or (page * pageSize) < total,
    )


@router.get("/available", response_model=list[WorkUnitResponse])
async def list_available_work_units(
    current_user: dict = Depends(require_permission("agents:read")),
    agent_service: AgentService = Depends(get_agent_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    List work units available to the current user (Level 1 view).
    Returns work units the user has been delegated access to run.
    """
    org_id = current_user["organization_id"]

    items: list[WorkUnitResponse] = []

    # Fetch active agents
    agents_result = await agent_service.list(
        organization_id=org_id,
        filters={"status": "active"},
        limit=50,
        offset=0,
    )
    for agent in agents_result.get("records", []):
        items.append(_agent_to_work_unit(agent))

    # Fetch active pipelines
    pipelines_result = await pipeline_service.list(
        organization_id=org_id,
        filters={"status": "active"},
        limit=50,
        offset=0,
    )
    for pipeline in pipelines_result.get("records", []):
        items.append(_pipeline_to_work_unit(pipeline))

    return items


@router.post("", response_model=WorkUnitResponse, status_code=status.HTTP_201_CREATED)
async def create_work_unit(
    request: CreateWorkUnitRequest,
    current_user: dict = Depends(require_permission("agents:create")),
    agent_service: AgentService = Depends(get_agent_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    Create a new work unit.
    Creates either an agent (atomic) or pipeline (composite) based on type.
    """
    org_id = current_user["organization_id"]

    if request.type == "atomic":
        # Create as an agent
        agent = await agent_service.create(
            organization_id=org_id,
            workspace_id=request.workspaceId or "",
            name=request.name,
            agent_type="task",  # Default type
            model_id="claude-3-5-sonnet",  # Default model
            created_by=current_user["id"],
            description=request.description,
            system_prompt="",
            temperature=0.7,
            max_tokens=0,
        )
        return _agent_to_work_unit(agent)
    else:
        # Create as a pipeline
        pipeline = await pipeline_service.create(
            organization_id=org_id,
            workspace_id=request.workspaceId or "",
            name=request.name,
            pattern="sequential",  # Default pattern for composite work units
            created_by=current_user["id"],
            description=request.description,
        )
        return _pipeline_to_work_unit(pipeline)


@router.get("/{work_unit_id}", response_model=WorkUnitResponse)
async def get_work_unit(
    work_unit_id: str,
    current_user: dict = Depends(require_permission("agents:read")),
    agent_service: AgentService = Depends(get_agent_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    Get a work unit by ID.
    Checks both agents and pipelines.
    """
    # Try to find as agent first
    agent = await agent_service.get(work_unit_id)
    if agent:
        if agent["organization_id"] != current_user["organization_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this work unit",
            )
        return _agent_to_work_unit(agent)

    # Try to find as pipeline
    pipeline = await pipeline_service.get(work_unit_id)
    if pipeline:
        if pipeline["organization_id"] != current_user["organization_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this work unit",
            )
        return _pipeline_to_work_unit(pipeline)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Work unit not found",
    )


@router.put("/{work_unit_id}", response_model=WorkUnitResponse)
async def update_work_unit(
    work_unit_id: str,
    request: UpdateWorkUnitRequest,
    current_user: dict = Depends(require_permission("agents:update")),
    agent_service: AgentService = Depends(get_agent_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    Update a work unit.
    """
    # Build update data
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    # Try to find as agent first
    agent = await agent_service.get(work_unit_id)
    if agent:
        if agent["organization_id"] != current_user["organization_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this work unit",
            )
        updated = await agent_service.update(work_unit_id, update_data)
        return _agent_to_work_unit(updated)

    # Try to find as pipeline
    pipeline = await pipeline_service.get(work_unit_id)
    if pipeline:
        if pipeline["organization_id"] != current_user["organization_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this work unit",
            )
        updated = await pipeline_service.update(work_unit_id, update_data)
        return _pipeline_to_work_unit(updated)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Work unit not found",
    )


@router.delete("/{work_unit_id}", response_model=MessageResponse)
async def delete_work_unit(
    work_unit_id: str,
    current_user: dict = Depends(require_permission("agents:delete")),
    agent_service: AgentService = Depends(get_agent_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    Archive a work unit (soft delete).
    """
    # Try to find as agent first
    agent = await agent_service.get(work_unit_id)
    if agent:
        if agent["organization_id"] != current_user["organization_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this work unit",
            )
        await agent_service.delete(work_unit_id)
        return MessageResponse(message="Work unit archived successfully")

    # Try to find as pipeline
    pipeline = await pipeline_service.get(work_unit_id)
    if pipeline:
        if pipeline["organization_id"] != current_user["organization_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this work unit",
            )
        await pipeline_service.delete(work_unit_id)
        return MessageResponse(message="Work unit archived successfully")

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Work unit not found",
    )


@router.post("/{work_unit_id}/run", response_model=RunResultResponse)
async def run_work_unit(
    work_unit_id: str,
    request: RunWorkUnitRequest,
    current_user: dict = Depends(require_permission("agents:execute")),
    agent_service: AgentService = Depends(get_agent_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    Execute a work unit.
    """
    from datetime import UTC, datetime
    import uuid

    # Try to find as agent first
    agent = await agent_service.get(work_unit_id)
    if agent:
        if agent["organization_id"] != current_user["organization_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to run this work unit",
            )
        # Return mock run result (actual execution would be handled separately)
        return RunResultResponse(
            id=str(uuid.uuid4()),
            status="running",
            startedAt=datetime.now(UTC).isoformat(),
            input=request.inputs,
        )

    # Try to find as pipeline
    pipeline = await pipeline_service.get(work_unit_id)
    if pipeline:
        if pipeline["organization_id"] != current_user["organization_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to run this work unit",
            )
        return RunResultResponse(
            id=str(uuid.uuid4()),
            status="running",
            startedAt=datetime.now(UTC).isoformat(),
            input=request.inputs,
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Work unit not found",
    )


@router.get("/{work_unit_id}/runs", response_model=list[RunResultResponse])
async def list_work_unit_runs(
    work_unit_id: str,
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(require_permission("agents:read")),
    agent_service: AgentService = Depends(get_agent_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    List recent runs for a work unit.
    """
    # Verify access
    agent = await agent_service.get(work_unit_id)
    if agent and agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view runs for this work unit",
        )

    pipeline = await pipeline_service.get(work_unit_id)
    if pipeline and pipeline["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view runs for this work unit",
        )

    if not agent and not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work unit not found",
        )

    # Return empty list for now - actual runs would come from execution service
    return []
