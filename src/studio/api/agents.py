"""
Agent API Endpoints

Handles agent CRUD, versions, contexts, and tools operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from studio.api.auth import require_permission
from studio.services.agent_service import AgentService
from studio.services.connector_service import ConnectorService

router = APIRouter(prefix="/agents", tags=["Agents"])


# Singleton service instances
_agent_service: AgentService | None = None
_connector_service: ConnectorService | None = None


def get_agent_service() -> AgentService:
    """Get AgentService singleton instance."""
    global _agent_service
    if _agent_service is None:
        _agent_service = AgentService()
    return _agent_service


def get_connector_service() -> ConnectorService:
    """Get ConnectorService singleton instance."""
    global _connector_service
    if _connector_service is None:
        _connector_service = ConnectorService()
    return _connector_service


# ===================
# Request/Response Models
# ===================


class CreateAgentRequest(BaseModel):
    """Create agent request."""

    workspace_id: str
    name: str = Field(..., min_length=1, max_length=100)
    agent_type: str = Field(..., pattern=r"^(chat|task|pipeline|custom)$")
    model_id: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=2000)
    system_prompt: str | None = Field(None, max_length=10000)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=0, ge=0)


class UpdateAgentRequest(BaseModel):
    """Update agent request."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=2000)
    system_prompt: str | None = Field(None, max_length=10000)
    model_id: str | None = Field(None, min_length=1, max_length=100)
    temperature: float | None = Field(None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(None, ge=0)
    status: str | None = Field(None, pattern=r"^(draft|active|archived)$")


class CreateVersionRequest(BaseModel):
    """Create version request."""

    changelog: str | None = Field(None, max_length=1000)


class RollbackRequest(BaseModel):
    """Rollback request."""

    pass


class AddContextRequest(BaseModel):
    """Add context request."""

    name: str = Field(..., min_length=1, max_length=100)
    content_type: str = Field(..., pattern=r"^(text|file|url)$")
    content: str = Field(..., min_length=1)
    is_active: bool = Field(default=True)


class UpdateContextRequest(BaseModel):
    """Update context request."""

    name: str | None = Field(None, min_length=1, max_length=100)
    content_type: str | None = Field(None, pattern=r"^(text|file|url)$")
    content: str | None = Field(None, min_length=1)
    is_active: bool | None = None


class AddToolRequest(BaseModel):
    """Add tool request."""

    tool_type: str = Field(..., pattern=r"^(function|mcp|api)$")
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    config: dict = Field(default_factory=dict)
    is_enabled: bool = Field(default=True)


class UpdateToolRequest(BaseModel):
    """Update tool request."""

    tool_type: str | None = Field(None, pattern=r"^(function|mcp|api)$")
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, min_length=1, max_length=500)
    config: dict | None = None
    is_enabled: bool | None = None


# Response models
class AgentResponse(BaseModel):
    """Agent response."""

    id: str
    organization_id: str
    workspace_id: str
    name: str
    description: str | None = None
    agent_type: str
    status: str
    system_prompt: str | None = None
    model_id: str
    temperature: float
    max_tokens: int
    created_by: str
    created_at: str
    updated_at: str


class AgentVersionResponse(BaseModel):
    """Agent version response."""

    id: str
    agent_id: str
    version_number: int
    config_snapshot: str
    changelog: str | None = None
    created_by: str
    created_at: str


class AgentContextResponse(BaseModel):
    """Agent context response."""

    id: str
    agent_id: str
    name: str
    content_type: str
    content: str
    is_active: bool
    created_at: str
    updated_at: str


class AgentToolResponse(BaseModel):
    """Agent tool response."""

    id: str
    agent_id: str
    tool_type: str
    name: str
    description: str
    config: str
    is_enabled: bool
    created_at: str


class AgentWithDetailsResponse(BaseModel):
    """Agent with contexts and tools response."""

    id: str
    organization_id: str
    workspace_id: str
    name: str
    description: str | None = None
    agent_type: str
    status: str
    system_prompt: str | None = None
    model_id: str
    temperature: float
    max_tokens: int
    created_by: str
    created_at: str
    updated_at: str
    contexts: list[AgentContextResponse]
    tools: list[AgentToolResponse]


class AgentListResponse(BaseModel):
    """Agent list response."""

    records: list[AgentResponse]
    total: int


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


@router.get("", response_model=AgentListResponse)
async def list_agents(
    workspace_id: str | None = Query(None),
    status: str | None = Query(None, pattern=r"^(draft|active|archived)$"),
    agent_type: str | None = Query(None, pattern=r"^(chat|task|pipeline|custom)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(require_permission("agents:read")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    List agents in the current user's organization.
    """
    filters = {}
    if status:
        filters["status"] = status
    if agent_type:
        filters["agent_type"] = agent_type

    result = await agent_service.list(
        organization_id=current_user["organization_id"],
        workspace_id=workspace_id,
        filters=filters if filters else None,
        limit=limit,
        offset=offset,
    )

    return AgentListResponse(
        records=[AgentResponse(**r) for r in result["records"]],
        total=result["total"],
    )


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    request: CreateAgentRequest,
    current_user: dict = Depends(require_permission("agents:create")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Create a new agent.
    """
    agent = await agent_service.create(
        organization_id=current_user["organization_id"],
        workspace_id=request.workspace_id,
        name=request.name,
        agent_type=request.agent_type,
        model_id=request.model_id,
        created_by=current_user["id"],
        description=request.description or "",
        system_prompt=request.system_prompt or "",
        temperature=request.temperature,
        max_tokens=request.max_tokens or 0,
    )
    return AgentResponse(**agent)


@router.get("/{agent_id}", response_model=AgentWithDetailsResponse)
async def get_agent(
    agent_id: str,
    current_user: dict = Depends(require_permission("agents:read")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Get an agent by ID with contexts and tools.
    """
    agent = await agent_service.get_with_details(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this agent",
        )

    # Convert is_active from int to bool for contexts
    contexts = []
    for ctx in agent.get("contexts", []):
        ctx_copy = dict(ctx)
        ctx_copy["is_active"] = bool(ctx_copy.get("is_active", 0))
        contexts.append(AgentContextResponse(**ctx_copy))

    # Convert is_enabled from int to bool for tools
    tools = []
    for tool in agent.get("tools", []):
        tool_copy = dict(tool)
        tool_copy["is_enabled"] = bool(tool_copy.get("is_enabled", 0))
        tools.append(AgentToolResponse(**tool_copy))

    return AgentWithDetailsResponse(
        id=agent["id"],
        organization_id=agent["organization_id"],
        workspace_id=agent["workspace_id"],
        name=agent["name"],
        description=agent.get("description"),
        agent_type=agent["agent_type"],
        status=agent["status"],
        system_prompt=agent.get("system_prompt"),
        model_id=agent["model_id"],
        temperature=agent["temperature"],
        max_tokens=agent.get("max_tokens", 0),
        created_by=agent["created_by"],
        created_at=agent["created_at"],
        updated_at=agent["updated_at"],
        contexts=contexts,
        tools=tools,
    )


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    request: UpdateAgentRequest,
    current_user: dict = Depends(require_permission("agents:update")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Update an agent.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this agent",
        )

    # Build update data
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    updated_agent = await agent_service.update(agent_id, update_data)
    return AgentResponse(**updated_agent)


@router.delete("/{agent_id}", response_model=MessageResponse)
async def delete_agent(
    agent_id: str,
    current_user: dict = Depends(require_permission("agents:delete")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Archive an agent (soft delete).
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this agent",
        )

    await agent_service.delete(agent_id)
    return MessageResponse(message="Agent archived successfully")


# ===================
@router.get("/{agent_id}/versions", response_model=list[AgentVersionResponse])
async def list_versions(
    agent_id: str,
    current_user: dict = Depends(require_permission("agents:read")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    List all versions of an agent.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this agent",
        )

    versions = await agent_service.get_versions(agent_id)
    return [AgentVersionResponse(**v) for v in versions]


@router.post(
    "/{agent_id}/versions",
    response_model=AgentVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_version(
    agent_id: str,
    request: CreateVersionRequest,
    current_user: dict = Depends(require_permission("agents:update")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Create a version snapshot of an agent.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this agent",
        )

    version = await agent_service.create_version(
        agent_id=agent_id,
        created_by=current_user["id"],
        changelog=request.changelog or "",
    )
    return AgentVersionResponse(**version)


@router.post("/{agent_id}/versions/{version_id}/rollback", response_model=AgentResponse)
async def rollback_to_version(
    agent_id: str,
    version_id: str,
    current_user: dict = Depends(require_permission("agents:update")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Rollback an agent to a specific version.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this agent",
        )

    try:
        updated_agent = await agent_service.rollback_to_version(agent_id, version_id)
        return AgentResponse(**updated_agent)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ===================
@router.get("/{agent_id}/contexts", response_model=list[AgentContextResponse])
async def list_contexts(
    agent_id: str,
    current_user: dict = Depends(require_permission("agents:read")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    List all contexts for an agent.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this agent",
        )

    contexts = await agent_service.list_contexts(agent_id)
    # Convert is_active from int to bool
    result = []
    for ctx in contexts:
        ctx_copy = dict(ctx)
        ctx_copy["is_active"] = bool(ctx_copy.get("is_active", 0))
        result.append(AgentContextResponse(**ctx_copy))
    return result


@router.post(
    "/{agent_id}/contexts",
    response_model=AgentContextResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_context(
    agent_id: str,
    request: AddContextRequest,
    current_user: dict = Depends(require_permission("agents:update")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Add context to an agent.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this agent",
        )

    context = await agent_service.add_context(
        agent_id=agent_id,
        name=request.name,
        content_type=request.content_type,
        content=request.content,
        is_active=request.is_active,
    )

    # Convert is_active from int to bool
    ctx_copy = dict(context)
    ctx_copy["is_active"] = bool(ctx_copy.get("is_active", 0))
    return AgentContextResponse(**ctx_copy)


@router.put("/{agent_id}/contexts/{context_id}", response_model=AgentContextResponse)
async def update_context(
    agent_id: str,
    context_id: str,
    request: UpdateContextRequest,
    current_user: dict = Depends(require_permission("agents:update")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Update a context.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this agent",
        )

    # Verify context belongs to agent
    context = await agent_service.get_context(context_id)
    if not context or context["agent_id"] != agent_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Context not found",
        )

    # Build update data
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    updated_context = await agent_service.update_context(context_id, update_data)
    # Convert is_active from int to bool
    ctx_copy = dict(updated_context)
    ctx_copy["is_active"] = bool(ctx_copy.get("is_active", 0))
    return AgentContextResponse(**ctx_copy)


@router.delete("/{agent_id}/contexts/{context_id}", response_model=MessageResponse)
async def remove_context(
    agent_id: str,
    context_id: str,
    current_user: dict = Depends(require_permission("agents:update")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Remove a context.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this agent",
        )

    # Verify context belongs to agent
    context = await agent_service.get_context(context_id)
    if not context or context["agent_id"] != agent_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Context not found",
        )

    await agent_service.remove_context(context_id)
    return MessageResponse(message="Context removed successfully")


# ===================
@router.get("/{agent_id}/tools", response_model=list[AgentToolResponse])
async def list_tools(
    agent_id: str,
    current_user: dict = Depends(require_permission("agents:read")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    List all tools for an agent.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this agent",
        )

    tools = await agent_service.list_tools(agent_id)
    # Convert is_enabled from int to bool
    result = []
    for tool in tools:
        tool_copy = dict(tool)
        tool_copy["is_enabled"] = bool(tool_copy.get("is_enabled", 0))
        result.append(AgentToolResponse(**tool_copy))
    return result


@router.post(
    "/{agent_id}/tools",
    response_model=AgentToolResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_tool(
    agent_id: str,
    request: AddToolRequest,
    current_user: dict = Depends(require_permission("agents:update")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Add a tool to an agent.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this agent",
        )

    tool = await agent_service.add_tool(
        agent_id=agent_id,
        tool_type=request.tool_type,
        name=request.name,
        description=request.description,
        config=request.config,
        is_enabled=request.is_enabled,
    )

    # Convert is_enabled from int to bool
    tool_copy = dict(tool)
    tool_copy["is_enabled"] = bool(tool_copy.get("is_enabled", 0))
    return AgentToolResponse(**tool_copy)


@router.put("/{agent_id}/tools/{tool_id}", response_model=AgentToolResponse)
async def update_tool(
    agent_id: str,
    tool_id: str,
    request: UpdateToolRequest,
    current_user: dict = Depends(require_permission("agents:update")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Update a tool.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this agent",
        )

    # Verify tool belongs to agent
    tool = await agent_service.get_tool(tool_id)
    if not tool or tool["agent_id"] != agent_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found",
        )

    # Build update data
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    updated_tool = await agent_service.update_tool(tool_id, update_data)
    # Convert is_enabled from int to bool
    tool_copy = dict(updated_tool)
    tool_copy["is_enabled"] = bool(tool_copy.get("is_enabled", 0))
    return AgentToolResponse(**tool_copy)


@router.delete("/{agent_id}/tools/{tool_id}", response_model=MessageResponse)
async def remove_tool(
    agent_id: str,
    tool_id: str,
    current_user: dict = Depends(require_permission("agents:update")),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Remove a tool.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this agent",
        )

    # Verify tool belongs to agent
    tool = await agent_service.get_tool(tool_id)
    if not tool or tool["agent_id"] != agent_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found",
        )

    await agent_service.remove_tool(tool_id)
    return MessageResponse(message="Tool removed successfully")


# ===================
@router.get("/{agent_id}/connectors")
async def list_agent_connectors(
    agent_id: str,
    current_user: dict = Depends(require_permission("agents:read")),
    agent_service: AgentService = Depends(get_agent_service),
    connector_service: ConnectorService = Depends(get_connector_service),
):
    """
    List all connectors attached to an agent.
    """
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Check authorization
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this agent",
        )

    # Import here to avoid circular import

    connectors = await connector_service.list_agent_connectors(agent_id)
    return connectors
