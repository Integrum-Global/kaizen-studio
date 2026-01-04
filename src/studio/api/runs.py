"""
Runs API Endpoints

Handles execution run history for the EATP Ontology.
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from studio.api.auth import get_current_user

router = APIRouter(prefix="/runs", tags=["Runs"])


# ===================
# Response Models
# ===================


class RunResultResponse(BaseModel):
    """Run result response."""

    id: str
    status: str  # running, completed, failed, cancelled
    startedAt: str
    completedAt: str | None = None
    workUnitId: str | None = None
    workUnitName: str | None = None
    input: dict | None = None
    output: dict | None = None
    error: str | None = None


@router.get("/recent", response_model=list[RunResultResponse])
async def get_recent_runs(
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    Get the current user's recent run results.
    Returns runs across all work units the user has executed.
    """
    # For now, return empty list - actual implementation would query execution history
    # This endpoint is primarily for Level 1 users viewing their task results
    return []


@router.get("/{run_id}", response_model=RunResultResponse)
async def get_run(
    run_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get a specific run result by ID.
    """
    from fastapi import HTTPException, status

    # For now, return 404 - actual implementation would query execution history
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Run not found",
    )
