"""
Runs API Endpoints

Handles execution run history for the EATP Ontology.
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from studio.api.auth import get_current_user
from studio.services.run_service import RunService

router = APIRouter(prefix="/runs", tags=["Runs"])


# Singleton service instance
_run_service: RunService | None = None


def get_run_service() -> RunService:
    """Get RunService singleton instance."""
    global _run_service
    if _run_service is None:
        _run_service = RunService()
    return _run_service


# ===================
# Response Models
# ===================


class RunResultResponse(BaseModel):
    """Run result response."""

    id: str
    status: str  # pending, running, completed, failed, cancelled
    startedAt: str
    completedAt: str | None = None
    workUnitId: str | None = None
    workUnitName: str | None = None
    workUnitType: str | None = None
    userId: str | None = None
    userName: str | None = None
    input: dict | None = None
    output: dict | None = None
    error: str | None = None
    errorType: str | None = None


def _run_to_response(run: dict) -> RunResultResponse:
    """Convert a run record to response model."""
    input_data = None
    output_data = None

    if run.get("input_data"):
        try:
            input_data = json.loads(run["input_data"])
        except (json.JSONDecodeError, TypeError):
            input_data = None

    if run.get("output_data"):
        try:
            output_data = json.loads(run["output_data"])
        except (json.JSONDecodeError, TypeError):
            output_data = None

    return RunResultResponse(
        id=run["id"],
        status=run.get("status", "pending"),
        startedAt=run.get("started_at", run.get("created_at", "")),
        completedAt=run.get("completed_at"),
        workUnitId=run.get("work_unit_id"),
        workUnitName=run.get("work_unit_name"),
        workUnitType=run.get("work_unit_type"),
        userId=run.get("user_id"),
        userName=run.get("user_name"),
        input=input_data,
        output=output_data,
        error=run.get("error"),
        errorType=run.get("error_type"),
    )


@router.get(
    "/recent",
    response_model=list[RunResultResponse],
    summary="Get recent runs",
    description="Retrieve the current user's recent execution runs across all work units.",
    responses={
        200: {
            "description": "List of recent runs",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "run-123",
                            "status": "completed",
                            "startedAt": "2026-01-05T10:30:00Z",
                            "completedAt": "2026-01-05T10:30:05Z",
                            "workUnitId": "wu-456",
                            "workUnitName": "Data Processor",
                            "workUnitType": "atomic",
                            "userId": "user-789",
                            "userName": "John Doe",
                            "input": {"data": "sample"},
                            "output": {"result": "processed"},
                        }
                    ]
                }
            },
        }
    },
)
async def get_recent_runs(
    limit: int = Query(10, ge=1, le=100, description="Maximum number of runs to return"),
    current_user: dict = Depends(get_current_user),
    run_service: RunService = Depends(get_run_service),
):
    """
    Get the current user's recent run results.

    Returns runs across all work units the user has executed, ordered by most recent first.
    Useful for displaying a user's execution history dashboard.
    """
    org_id = current_user["organization_id"]
    user_id = current_user["id"]

    runs = await run_service.get_recent_runs(
        organization_id=org_id,
        user_id=user_id,
        limit=limit,
    )

    return [_run_to_response(run) for run in runs]


@router.get(
    "/{run_id}",
    response_model=RunResultResponse,
    summary="Get run by ID",
    description="Retrieve detailed information about a specific execution run.",
    responses={
        200: {"description": "Run details"},
        404: {"description": "Run not found"},
        403: {"description": "Not authorized to access this run"},
    },
)
async def get_run(
    run_id: str,
    current_user: dict = Depends(get_current_user),
    run_service: RunService = Depends(get_run_service),
):
    """
    Get a specific run result by ID.

    Returns complete run details including input/output data, timing, and error information.
    Access is restricted to runs within the user's organization.
    """
    run = await run_service.get_run(run_id)

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found",
        )

    # Verify organization access
    if run.get("organization_id") != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this run",
        )

    return _run_to_response(run)


@router.get(
    "",
    response_model=list[RunResultResponse],
    summary="List runs",
    description="List execution runs for the organization with optional filtering.",
    responses={
        200: {"description": "List of runs matching the filters"},
    },
)
async def list_runs(
    workUnitId: str | None = Query(None, description="Filter by work unit ID"),
    status_filter: str | None = Query(
        None, alias="status", description="Filter by status (pending, running, completed, failed)"
    ),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of runs to return"),
    offset: int = Query(0, ge=0, description="Number of runs to skip for pagination"),
    current_user: dict = Depends(get_current_user),
    run_service: RunService = Depends(get_run_service),
):
    """
    List runs for the organization with optional filters.

    Supports filtering by work unit and status, with pagination.
    Results are ordered by creation time, most recent first.
    """
    org_id = current_user["organization_id"]

    result = await run_service.list_runs(
        organization_id=org_id,
        work_unit_id=workUnitId,
        status=status_filter,
        limit=limit,
        offset=offset,
    )

    return [_run_to_response(run) for run in result.get("records", [])]
