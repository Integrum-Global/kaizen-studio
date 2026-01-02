"""
Pipeline API Routes

FastAPI routes for pipeline orchestration management.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from studio.middleware.rbac import get_current_user_from_request
from studio.services.pipeline_service import ORCHESTRATION_PATTERNS, PipelineService
from studio.services.rbac_service import RBACService

router = APIRouter(prefix="/pipelines", tags=["Pipelines"])


# ===================
# Request/Response Models
# ===================


class PipelineCreate(BaseModel):
    """Request model for creating a pipeline."""

    organization_id: str
    workspace_id: str
    name: str
    pattern: str = Field(
        ...,
        description="Orchestration pattern: sequential, parallel, router, supervisor, ensemble",
    )
    description: str = ""
    status: str = "draft"


class PipelineUpdate(BaseModel):
    """Request model for updating a pipeline."""

    name: str | None = None
    description: str | None = None
    pattern: str | None = None
    status: str | None = None


class NodeCreate(BaseModel):
    """Request model for creating a pipeline node."""

    id: str | None = None
    node_type: str = Field(
        ..., description="Node type: agent, input, output, condition, merge"
    )
    agent_id: str | None = ""
    label: str
    position_x: float = 0.0
    position_y: float = 0.0
    config: dict | None = None


class NodeUpdate(BaseModel):
    """Request model for updating a pipeline node."""

    node_type: str | None = None
    agent_id: str | None = None
    label: str | None = None
    position_x: float | None = None
    position_y: float | None = None
    config: dict | None = None


class ConnectionCreate(BaseModel):
    """Request model for creating a connection."""

    id: str | None = None
    source_node_id: str
    target_node_id: str
    source_handle: str = "output"
    target_handle: str = "input"
    condition: dict | None = None


class GraphSave(BaseModel):
    """Request model for saving complete graph."""

    nodes: list[NodeCreate]
    connections: list[ConnectionCreate]


# ===================
# Dependencies
# ===================


def get_pipeline_service() -> PipelineService:
    """Get pipeline service instance."""
    return PipelineService()


def get_rbac_service() -> RBACService:
    """Get RBAC service instance."""
    return RBACService()


async def check_permission(
    user: dict,
    permission: str,
    rbac_service: RBACService,
):
    """Check if user has required permission."""
    has_perm = await rbac_service.check_permission(
        user_id=user["id"],
        permission=permission,
    )
    if not has_perm:
        raise HTTPException(status_code=403, detail=f"Permission denied: {permission}")


# ===================
# Pipeline CRUD Routes
# ===================


@router.post("", response_model=dict)
async def create_pipeline(
    data: PipelineCreate,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Create a new pipeline.

    Requires: agents:create permission
    """
    await check_permission(user, "agents:create", rbac_service)

    try:
        pipeline = await service.create(
            organization_id=data.organization_id,
            workspace_id=data.workspace_id,
            name=data.name,
            pattern=data.pattern,
            created_by=user["id"],
            description=data.description,
            status=data.status,
        )
        return {"data": pipeline}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=dict)
async def list_pipelines(
    organization_id: str = Query(..., description="Organization ID"),
    workspace_id: str | None = Query(None, description="Workspace ID filter"),
    status: str | None = Query(None, description="Status filter"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    List pipelines with optional filters.

    Requires: agents:read permission
    """
    await check_permission(user, "agents:read", rbac_service)

    filters = {}
    if status:
        filters["status"] = status

    result = await service.list(
        organization_id=organization_id,
        workspace_id=workspace_id,
        filters=filters if filters else None,
        limit=limit,
        offset=offset,
    )
    return {"data": result["records"], "total": result["total"]}


@router.get("/patterns", response_model=dict)
async def get_orchestration_patterns():
    """
    Get available orchestration patterns.

    No authentication required.
    """
    return {"data": ORCHESTRATION_PATTERNS}


@router.get("/{pipeline_id}", response_model=dict)
async def get_pipeline(
    pipeline_id: str,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Get a pipeline with its graph (nodes and connections).

    Requires: agents:read permission
    """
    await check_permission(user, "agents:read", rbac_service)

    pipeline = await service.get_with_graph(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    return {"data": pipeline}


@router.put("/{pipeline_id}", response_model=dict)
async def update_pipeline(
    pipeline_id: str,
    data: PipelineUpdate,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Update a pipeline.

    Requires: agents:update permission
    """
    await check_permission(user, "agents:update", rbac_service)

    # Build update dict from non-None fields
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        pipeline = await service.update(pipeline_id, update_data)
        if not pipeline:
            raise HTTPException(status_code=404, detail="Pipeline not found")
        return {"data": pipeline}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{pipeline_id}", response_model=dict)
async def delete_pipeline(
    pipeline_id: str,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Archive a pipeline (soft delete).

    Requires: agents:delete permission
    """
    await check_permission(user, "agents:delete", rbac_service)

    pipeline = await service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    await service.delete(pipeline_id)
    return {"message": "Pipeline archived"}


# ===================
# Graph Operations
# ===================


@router.put("/{pipeline_id}/graph", response_model=dict)
async def save_graph(
    pipeline_id: str,
    data: GraphSave,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Save complete pipeline graph (replaces existing nodes and connections).

    Requires: agents:update permission
    """
    await check_permission(user, "agents:update", rbac_service)

    pipeline = await service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    # Convert Pydantic models to dicts
    nodes = [node.model_dump() for node in data.nodes]
    connections = [conn.model_dump() for conn in data.connections]

    result = await service.save_graph(pipeline_id, nodes, connections)
    return {"data": result}


@router.post("/{pipeline_id}/validate", response_model=dict)
async def validate_pipeline(
    pipeline_id: str,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Validate pipeline graph structure.

    Requires: agents:read permission
    """
    await check_permission(user, "agents:read", rbac_service)

    pipeline = await service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    result = await service.validate(pipeline_id)
    return {"data": result}


# ===================
# Node Operations
# ===================


@router.get("/{pipeline_id}/nodes", response_model=dict)
async def list_nodes(
    pipeline_id: str,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    List all nodes in a pipeline.

    Requires: agents:read permission
    """
    await check_permission(user, "agents:read", rbac_service)

    pipeline = await service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    nodes = await service.list_nodes(pipeline_id)
    return {"data": nodes}


@router.post("/{pipeline_id}/nodes", response_model=dict)
async def add_node(
    pipeline_id: str,
    data: NodeCreate,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Add a node to a pipeline.

    Requires: agents:update permission
    """
    await check_permission(user, "agents:update", rbac_service)

    pipeline = await service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    node = await service.add_node(pipeline_id, data.model_dump())
    return {"data": node}


@router.put("/{pipeline_id}/nodes/{node_id}", response_model=dict)
async def update_node(
    pipeline_id: str,
    node_id: str,
    data: NodeUpdate,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Update a pipeline node.

    Requires: agents:update permission
    """
    await check_permission(user, "agents:update", rbac_service)

    # Verify pipeline exists
    pipeline = await service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    # Build update dict from non-None fields
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    node = await service.update_node(node_id, update_data)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    return {"data": node}


@router.delete("/{pipeline_id}/nodes/{node_id}", response_model=dict)
async def remove_node(
    pipeline_id: str,
    node_id: str,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Remove a node from a pipeline.

    Requires: agents:update permission
    """
    await check_permission(user, "agents:update", rbac_service)

    # Verify pipeline exists
    pipeline = await service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    # Verify node exists
    node = await service.get_node(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    await service.remove_node(node_id)
    return {"message": "Node removed"}


# ===================
# Connection Operations
# ===================


@router.get("/{pipeline_id}/connections", response_model=dict)
async def list_connections(
    pipeline_id: str,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    List all connections in a pipeline.

    Requires: agents:read permission
    """
    await check_permission(user, "agents:read", rbac_service)

    pipeline = await service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    connections = await service.list_connections(pipeline_id)
    return {"data": connections}


@router.post("/{pipeline_id}/connections", response_model=dict)
async def add_connection(
    pipeline_id: str,
    data: ConnectionCreate,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Add a connection between nodes.

    Requires: agents:update permission
    """
    await check_permission(user, "agents:update", rbac_service)

    pipeline = await service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    connection = await service.add_connection(pipeline_id, data.model_dump())
    return {"data": connection}


@router.delete("/{pipeline_id}/connections/{connection_id}", response_model=dict)
async def remove_connection(
    pipeline_id: str,
    connection_id: str,
    user: dict = Depends(get_current_user_from_request),
    service: PipelineService = Depends(get_pipeline_service),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Remove a connection.

    Requires: agents:update permission
    """
    await check_permission(user, "agents:update", rbac_service)

    # Verify pipeline exists
    pipeline = await service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    # Verify connection exists
    connection = await service.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    await service.remove_connection(connection_id)
    return {"message": "Connection removed"}
