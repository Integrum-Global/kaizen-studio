"""
Audit API Routes

Endpoints for querying audit logs.
"""

import csv
import io
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel

from studio.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["Audit"])


class AuditLogResponse(BaseModel):
    """Response model for audit log entry."""

    id: str
    organization_id: str
    user_id: str
    action: str
    resource_type: str
    resource_id: str | None = None
    details: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    status: str
    error_message: str | None = None
    created_at: str


class AuditLogListResponse(BaseModel):
    """Response model for audit log list."""

    logs: list[AuditLogResponse]
    total: int


def get_audit_service() -> AuditService:
    """Dependency to get audit service instance."""
    return AuditService()


@router.get("/logs", response_model=AuditLogListResponse)
async def list_audit_logs(
    organization_id: str = Query(..., description="Organization ID"),
    user_id: str | None = Query(None, description="Filter by user ID"),
    action: str | None = Query(None, description="Filter by action type"),
    resource_type: str | None = Query(None, description="Filter by resource type"),
    resource_id: str | None = Query(None, description="Filter by resource ID"),
    start_date: str | None = Query(None, description="Start date (ISO 8601)"),
    end_date: str | None = Query(None, description="End date (ISO 8601)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    audit_service: AuditService = Depends(get_audit_service),
):
    """
    List audit logs with filters.

    Returns paginated list of audit log entries matching the filters.
    """
    logs = await audit_service.list(
        organization_id=organization_id,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )

    total = await audit_service.count(
        organization_id=organization_id,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
    )

    return AuditLogListResponse(logs=logs, total=total)


@router.get("/logs/{id}", response_model=AuditLogResponse)
async def get_audit_log(
    id: str,
    audit_service: AuditService = Depends(get_audit_service),
):
    """
    Get a specific audit log entry.

    Returns the audit log entry with the given ID.
    """
    log = await audit_service.get(id)

    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")

    return log


@router.get("/users/{user_id}", response_model=list[AuditLogResponse])
async def get_user_activity(
    user_id: str,
    limit: int = Query(50, ge=1, le=500, description="Maximum results"),
    audit_service: AuditService = Depends(get_audit_service),
):
    """
    Get activity history for a specific user.

    Returns list of audit log entries for the user.
    """
    logs = await audit_service.get_user_activity(user_id=user_id, limit=limit)
    return logs


@router.get(
    "/resources/{resource_type}/{resource_id}", response_model=list[AuditLogResponse]
)
async def get_resource_history(
    resource_type: str,
    resource_id: str,
    audit_service: AuditService = Depends(get_audit_service),
):
    """
    Get audit history for a specific resource.

    Returns list of audit log entries for the resource.
    """
    logs = await audit_service.get_resource_history(
        resource_type=resource_type,
        resource_id=resource_id,
    )
    return logs


@router.get("/export")
async def export_audit_logs(
    organization_id: str = Query(..., description="Organization ID"),
    format: str = Query("json", description="Export format (json or csv)"),
    user_id: str | None = Query(None, description="Filter by user ID"),
    action: str | None = Query(None, description="Filter by action type"),
    resource_type: str | None = Query(None, description="Filter by resource type"),
    start_date: str | None = Query(None, description="Start date (ISO 8601)"),
    end_date: str | None = Query(None, description="End date (ISO 8601)"),
    limit: int = Query(10000, ge=1, le=100000, description="Maximum results"),
    audit_service: AuditService = Depends(get_audit_service),
):
    """
    Export audit logs as JSON or CSV.

    Returns audit logs in the requested format for compliance reporting.
    """
    logs = await audit_service.list(
        organization_id=organization_id,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=0,
    )

    if format.lower() == "csv":
        # Generate CSV
        output = io.StringIO()
        if logs:
            fieldnames = [
                "id",
                "organization_id",
                "user_id",
                "action",
                "resource_type",
                "resource_id",
                "details",
                "ip_address",
                "user_agent",
                "status",
                "error_message",
                "created_at",
                "updated_at",
            ]
            writer = csv.DictWriter(
                output, fieldnames=fieldnames, extrasaction="ignore"
            )
            writer.writeheader()
            for log in logs:
                writer.writerow(log)

        filename = f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    else:
        # Return JSON
        filename = f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        return Response(
            content=json.dumps(logs, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
