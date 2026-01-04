"""
Activity API Endpoints

Handles team activity and user run history for the EATP Ontology.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from studio.api.auth import get_current_user

router = APIRouter(prefix="/activity", tags=["Activity"])


# ===================
# Response Models
# ===================


class ActivityEventResponse(BaseModel):
    """Activity event response."""

    id: str
    type: str  # run, delegation, error, completion
    userId: str
    userName: str
    workUnitId: str
    workUnitName: str
    timestamp: str
    details: dict | None = None


@router.get("/team", response_model=list[ActivityEventResponse])
async def get_team_activity(
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    Get recent team activity events.
    Returns activity for work units in the user's organization.
    """
    # For now, return empty list - actual implementation would query execution logs
    # This endpoint is primarily for Level 2+ users monitoring team activity
    return []


@router.get("/my", response_model=list[ActivityEventResponse])
async def get_my_activity(
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    Get the current user's recent activity.
    """
    return []
