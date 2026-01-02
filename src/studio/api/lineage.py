"""
Lineage API Endpoints

Handles invocation lineage query and export operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from kailash.runtime import AsyncLocalRuntime
from pydantic import BaseModel

from studio.api.auth import require_permission
from studio.services.lineage_service import LineageService

router = APIRouter(prefix="/lineage", tags=["Lineage"])


# Dependency factory functions
def get_runtime() -> AsyncLocalRuntime:
    """Get AsyncLocalRuntime for dependency injection."""
    return AsyncLocalRuntime()


def get_lineage_service(
    runtime: AsyncLocalRuntime = Depends(get_runtime),
) -> LineageService:
    """Get LineageService with injected runtime."""
    return LineageService(runtime=runtime)


# ===================
# Response Models
# ===================


class LineageRecordResponse(BaseModel):
    """Single lineage record response."""

    id: str
    external_user_id: str
    external_user_email: str
    external_user_name: str | None = None
    external_user_role: str | None = None
    external_system: str
    external_session_id: str
    external_trace_id: str | None = None
    external_context: str | None = None
    api_key_id: str
    api_key_prefix: str
    organization_id: str
    team_id: str | None = None
    external_agent_id: str
    external_agent_name: str
    external_agent_endpoint: str
    external_agent_version: str | None = None
    trace_id: str
    span_id: str
    parent_trace_id: str | None = None
    ip_address: str
    user_agent: str
    request_timestamp: str
    request_headers: str | None = None
    request_body: str | None = None
    status: str
    response_timestamp: str | None = None
    duration_ms: int | None = None
    cost_usd: float | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    api_calls_count: int | None = None
    error_type: str | None = None
    error_message: str | None = None
    error_stacktrace: str | None = None
    response_status_code: int | None = None
    response_headers: str | None = None
    response_body: str | None = None
    budget_checked: bool = False
    budget_remaining_before: float | None = None
    budget_remaining_after: float | None = None
    approval_required: bool = False
    approval_status: str | None = None
    approval_id: str | None = None
    created_at: str
    updated_at: str | None = None


class LineageListResponse(BaseModel):
    """Lineage list response."""

    lineages: list[dict]
    total: int
    page: int
    limit: int


class LineageGraphResponse(BaseModel):
    """Lineage graph response."""

    nodes: list[dict]
    edges: list[dict]


# ===================
# Endpoints
# ===================


@router.get(
    "",
    response_model=LineageListResponse,
)
async def list_lineages(
    external_user_id: str | None = Query(None),
    external_user_email: str | None = Query(None),
    external_system: str | None = Query(None),
    external_agent_id: str | None = Query(None),
    organization_id: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=1000),
    service: LineageService = Depends(get_lineage_service),
    current_user: dict = Depends(require_permission("lineage:read")),
):
    """
    List invocation lineages with filters.

    Requires: lineage:read permission
    """
    try:
        # Build filters
        filters = {}

        # Force organization filter to current user's org for security
        filters["organization_id"] = current_user["organization_id"]

        # Apply optional filters
        if external_user_id:
            filters["external_user_id"] = external_user_id
        if external_user_email:
            filters["external_user_email"] = external_user_email
        if external_system:
            filters["external_system"] = external_system
        if external_agent_id:
            filters["external_agent_id"] = external_agent_id
        if status:
            filters["status"] = status

        result = await service.list_lineages(
            filters=filters,
            page=page,
            limit=limit,
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to list lineages: {str(e)}"
        )


# NOTE: Specific routes (/graph, /export) must come BEFORE parameterized routes (/{invocation_id})
# to avoid FastAPI matching "graph" as an invocation_id


@router.get(
    "/graph",
    response_model=LineageGraphResponse,
)
async def get_lineage_graph(
    workflow_id: str | None = Query(None),
    external_agent_id: str | None = Query(None),
    service: LineageService = Depends(get_lineage_service),
    current_user: dict = Depends(require_permission("lineage:read")),
):
    """
    Get lineage graph for workflow or external agent.

    Returns a graph structure with nodes and edges representing
    the chain of invocations.

    Requires: lineage:read permission
    """
    try:
        if not workflow_id and not external_agent_id:
            raise HTTPException(
                status_code=400,
                detail="Either workflow_id or external_agent_id must be provided",
            )

        graph = await service.get_lineage_graph(
            workflow_id=workflow_id,
            external_agent_id=external_agent_id,
        )

        return graph

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get lineage graph: {str(e)}"
        )


@router.get(
    "/{invocation_id}",
    response_model=LineageRecordResponse,
)
async def get_lineage(
    invocation_id: str,
    service: LineageService = Depends(get_lineage_service),
    current_user: dict = Depends(require_permission("lineage:read")),
):
    """
    Get a single lineage record by ID.

    Requires: lineage:read permission
    """
    try:
        lineage = await service.get_lineage_by_id(invocation_id)

        if not lineage:
            raise HTTPException(
                status_code=404, detail=f"Lineage record {invocation_id} not found"
            )

        # Verify organization access
        if lineage.get("organization_id") != current_user["organization_id"]:
            raise HTTPException(
                status_code=403, detail="Access denied to this lineage record"
            )

        return lineage

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get lineage: {str(e)}")


@router.get(
    "/export",
)
async def export_lineage(
    format: str = Query("json", pattern="^(json|csv)$"),
    external_user_id: str | None = Query(None),
    external_user_email: str | None = Query(None),
    external_system: str | None = Query(None),
    external_agent_id: str | None = Query(None),
    status: str | None = Query(None),
    service: LineageService = Depends(get_lineage_service),
    current_user: dict = Depends(require_permission("lineage:export")),
):
    """
    Export lineage records for compliance (GDPR, SOC2, HIPAA).

    Returns data in JSON or CSV format.

    Requires: lineage:export permission
    """
    try:
        # Build filters
        filters = {}

        # Force organization filter to current user's org for security
        filters["organization_id"] = current_user["organization_id"]

        # Apply optional filters
        if external_user_id:
            filters["external_user_id"] = external_user_id
        if external_user_email:
            filters["external_user_email"] = external_user_email
        if external_system:
            filters["external_system"] = external_system
        if external_agent_id:
            filters["external_agent_id"] = external_agent_id
        if status:
            filters["status"] = status

        # Export data
        export_data = await service.export_lineage(
            filters=filters,
            format=format,
        )

        # Set appropriate content type and filename
        if format == "json":
            media_type = "application/json"
            filename = "lineage_export.json"
        else:  # csv
            media_type = "text/csv"
            filename = "lineage_export.csv"

        return Response(
            content=export_data,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to export lineage: {str(e)}"
        )


@router.delete(
    "/user/{email}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def redact_user_data(
    email: str,
    service: LineageService = Depends(get_lineage_service),
    current_user: dict = Depends(require_permission("gdpr:redact")),
):
    """
    Redact user data for GDPR compliance (Right to Erasure).

    Removes PII while preserving audit trail for compliance.

    Requires: gdpr:redact permission (org_owner or org_admin only)
    """
    try:
        # Redact user data
        await service.redact_user_data(email)

        return None

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to redact user data: {str(e)}"
        )
