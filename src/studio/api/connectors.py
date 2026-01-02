"""
Connector API Endpoints

Handles connector CRUD, testing, and agent attachment operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from studio.api.auth import require_permission
from studio.services.connector_service import CONNECTOR_TYPES, ConnectorService

router = APIRouter(prefix="/connectors", tags=["Connectors"])

# Initialize service
connector_service = ConnectorService()


# ===================
# Request/Response Models
# ===================


class CreateConnectorRequest(BaseModel):
    """Create connector request."""

    name: str = Field(..., min_length=1, max_length=100)
    connector_type: str = Field(..., pattern=r"^(database|api|storage|messaging)$")
    provider: str = Field(..., min_length=1, max_length=50)
    config: dict = Field(...)
    status: str | None = Field(default="active", pattern=r"^(active|inactive)$")


class UpdateConnectorRequest(BaseModel):
    """Update connector request."""

    name: str | None = Field(None, min_length=1, max_length=100)
    config: dict | None = None
    status: str | None = Field(None, pattern=r"^(active|inactive|error)$")


class AttachConnectorRequest(BaseModel):
    """Attach connector to agent request."""

    agent_id: str = Field(..., min_length=1)
    alias: str = Field(..., min_length=1, max_length=100)
    config_override: dict | None = None


class ExecuteQueryRequest(BaseModel):
    """Execute query request."""

    query: str = Field(..., min_length=1)
    params: dict | None = None


# Response models
class ConnectorResponse(BaseModel):
    """Connector response."""

    id: str
    organization_id: str
    name: str
    connector_type: str
    provider: str
    status: str
    last_tested_at: str | None = None
    last_test_result: str | None = None
    last_error: str | None = None
    created_by: str
    created_at: str
    updated_at: str


class ConnectorInstanceResponse(BaseModel):
    """Connector instance response."""

    id: str
    connector_id: str
    agent_id: str
    alias: str
    config_override: str | None = None
    created_at: str


class ConnectorInstanceWithDetailsResponse(BaseModel):
    """Connector instance with connector details."""

    id: str
    connector_id: str
    agent_id: str
    alias: str
    config_override: str | None = None
    created_at: str
    connector: ConnectorResponse | None = None


class ConnectorListResponse(BaseModel):
    """Connector list response."""

    records: list[ConnectorResponse]
    total: int


class TestResultResponse(BaseModel):
    """Connection test result response."""

    success: bool
    message: str


class QueryResultResponse(BaseModel):
    """Query execution result response."""

    success: bool
    message: str | None = None
    error: str | None = None
    query: str | None = None
    params: dict | None = None


class ConnectorTypesResponse(BaseModel):
    """Available connector types response."""

    types: dict


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


# ===================
# Connector Types Endpoint
# ===================


@router.get("/types", response_model=ConnectorTypesResponse)
async def get_connector_types(
    current_user: dict = Depends(require_permission("connectors:read")),
):
    """
    Get available connector types and providers.
    """
    return ConnectorTypesResponse(types=CONNECTOR_TYPES)


# ===================
# Connector CRUD Endpoints
# ===================


@router.get("", response_model=ConnectorListResponse)
async def list_connectors(
    connector_type: str | None = Query(
        None, pattern=r"^(database|api|storage|messaging)$"
    ),
    provider: str | None = Query(None, max_length=50),
    status: str | None = Query(None, pattern=r"^(active|inactive|error)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(require_permission("connectors:read")),
):
    """
    List connectors in the current user's organization.
    """
    result = await connector_service.list(
        organization_id=current_user["organization_id"],
        connector_type=connector_type,
        provider=provider,
        status=status,
        limit=limit,
        offset=offset,
    )

    return ConnectorListResponse(
        records=[ConnectorResponse(**r) for r in result["records"]],
        total=result["total"],
    )


@router.post("", response_model=ConnectorResponse, status_code=status.HTTP_201_CREATED)
async def create_connector(
    request: CreateConnectorRequest,
    current_user: dict = Depends(require_permission("connectors:create")),
):
    """
    Create a new connector.
    """
    # Validate provider for connector type
    if not connector_service.validate_connector_type(
        request.connector_type, request.provider
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider '{request.provider}' for connector type '{request.connector_type}'",
        )

    connector = await connector_service.create(
        organization_id=current_user["organization_id"],
        name=request.name,
        connector_type=request.connector_type,
        provider=request.provider,
        config=request.config,
        created_by=current_user["id"],
        status=request.status or "active",
    )

    return ConnectorResponse(**connector)


@router.get("/{connector_id}", response_model=ConnectorResponse)
async def get_connector(
    connector_id: str,
    current_user: dict = Depends(require_permission("connectors:read")),
):
    """
    Get a connector by ID.
    """
    connector = await connector_service.get(connector_id)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found",
        )

    # Check authorization
    if connector["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this connector",
        )

    return ConnectorResponse(**connector)


@router.put("/{connector_id}", response_model=ConnectorResponse)
async def update_connector(
    connector_id: str,
    request: UpdateConnectorRequest,
    current_user: dict = Depends(require_permission("connectors:update")),
):
    """
    Update a connector.
    """
    connector = await connector_service.get(connector_id)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found",
        )

    # Check authorization
    if connector["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this connector",
        )

    # Build update data
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    updated_connector = await connector_service.update(connector_id, update_data)
    return ConnectorResponse(**updated_connector)


@router.delete("/{connector_id}", response_model=MessageResponse)
async def delete_connector(
    connector_id: str,
    current_user: dict = Depends(require_permission("connectors:delete")),
):
    """
    Delete a connector.
    """
    connector = await connector_service.get(connector_id)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found",
        )

    # Check authorization
    if connector["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this connector",
        )

    await connector_service.delete(connector_id)
    return MessageResponse(message="Connector deleted successfully")


# ===================
# Connection Testing Endpoints
# ===================


@router.post("/{connector_id}/test", response_model=TestResultResponse)
async def test_connection(
    connector_id: str,
    current_user: dict = Depends(require_permission("connectors:update")),
):
    """
    Test a connector connection.
    """
    connector = await connector_service.get(connector_id)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found",
        )

    # Check authorization
    if connector["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to test this connector",
        )

    result = await connector_service.test_connection(connector_id)
    return TestResultResponse(**result)


# ===================
# Agent Instance Endpoints
# ===================


@router.post(
    "/{connector_id}/attach",
    response_model=ConnectorInstanceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def attach_to_agent(
    connector_id: str,
    request: AttachConnectorRequest,
    current_user: dict = Depends(require_permission("connectors:update")),
):
    """
    Attach a connector to an agent.
    """
    connector = await connector_service.get(connector_id)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found",
        )

    # Check authorization
    if connector["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to attach this connector",
        )

    instance = await connector_service.attach_to_agent(
        connector_id=connector_id,
        agent_id=request.agent_id,
        alias=request.alias,
        config_override=request.config_override,
    )

    return ConnectorInstanceResponse(**instance)


@router.delete("/instances/{instance_id}", response_model=MessageResponse)
async def detach_from_agent(
    instance_id: str,
    current_user: dict = Depends(require_permission("connectors:update")),
):
    """
    Detach a connector from an agent.
    """
    instance = await connector_service.get_instance(instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector instance not found",
        )

    # Check authorization via connector
    connector = await connector_service.get(instance["connector_id"])
    if not connector or connector["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to detach this connector",
        )

    await connector_service.detach_from_agent(instance_id)
    return MessageResponse(message="Connector detached successfully")


# ===================
# Query Execution Endpoint
# ===================


@router.post("/{connector_id}/query", response_model=QueryResultResponse)
async def execute_query(
    connector_id: str,
    request: ExecuteQueryRequest,
    current_user: dict = Depends(require_permission("connectors:execute")),
):
    """
    Execute a query on a connector.
    """
    connector = await connector_service.get(connector_id)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found",
        )

    # Check authorization
    if connector["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to execute on this connector",
        )

    result = await connector_service.execute_query(
        connector_id=connector_id,
        query=request.query,
        params=request.params,
    )

    return QueryResultResponse(**result)
