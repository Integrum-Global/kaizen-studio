"""
Activity API Endpoints

Handles team activity and user run history for the EATP Ontology.
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from studio.api.auth import get_current_user
from studio.services.activity_service import ActivityService

router = APIRouter(prefix="/activity", tags=["Activity"])


# Singleton service instance
_activity_service: ActivityService | None = None


def get_activity_service() -> ActivityService:
    """Get ActivityService singleton instance."""
    global _activity_service
    if _activity_service is None:
        _activity_service = ActivityService()
    return _activity_service


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


class ActivitySummaryResponse(BaseModel):
    """Activity summary response."""

    periodHours: int
    totalRuns: int
    completed: int
    failed: int
    pending: int
    running: int
    successRate: float


@router.get(
    "/team",
    response_model=list[ActivityEventResponse],
    summary="Get team activity",
    description="Retrieve recent activity events for all team members in the organization.",
    responses={
        200: {
            "description": "List of activity events",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "evt-123",
                            "type": "completion",
                            "userId": "user-456",
                            "userName": "Jane Smith",
                            "workUnitId": "wu-789",
                            "workUnitName": "Data Pipeline",
                            "timestamp": "2026-01-05T10:30:00Z",
                            "details": {"duration_ms": 1500},
                        }
                    ]
                }
            },
        }
    },
)
async def get_team_activity(
    limit: int = Query(10, ge=1, le=100, description="Maximum number of events to return"),
    current_user: dict = Depends(get_current_user),
    activity_service: ActivityService = Depends(get_activity_service),
):
    """
    Get recent team activity events.

    Returns activity for all work units in the user's organization.
    Event types include: run, delegation, error, completion.
    """
    org_id = current_user["organization_id"]

    events = await activity_service.get_team_activity(
        organization_id=org_id,
        limit=limit,
    )

    return [
        ActivityEventResponse(
            id=event.get("id", ""),
            type=event.get("type", "run"),
            userId=event.get("userId", ""),
            userName=event.get("userName", "Unknown"),
            workUnitId=event.get("workUnitId", ""),
            workUnitName=event.get("workUnitName", "Unknown"),
            timestamp=event.get("timestamp", ""),
            details=event.get("details"),
        )
        for event in events
    ]


@router.get(
    "/my",
    response_model=list[ActivityEventResponse],
    summary="Get my activity",
    description="Retrieve the current user's recent activity events.",
)
async def get_my_activity(
    limit: int = Query(10, ge=1, le=100, description="Maximum number of events to return"),
    current_user: dict = Depends(get_current_user),
    activity_service: ActivityService = Depends(get_activity_service),
):
    """
    Get the current user's recent activity.

    Returns activity events filtered to only show the authenticated user's actions.
    Useful for personal activity dashboards.
    """
    org_id = current_user["organization_id"]
    user_id = current_user["id"]

    events = await activity_service.get_my_activity(
        organization_id=org_id,
        user_id=user_id,
        limit=limit,
    )

    return [
        ActivityEventResponse(
            id=event.get("id", ""),
            type=event.get("type", "run"),
            userId=event.get("userId", ""),
            userName=event.get("userName", "You"),
            workUnitId=event.get("workUnitId", ""),
            workUnitName=event.get("workUnitName", "Unknown"),
            timestamp=event.get("timestamp", ""),
            details=event.get("details"),
        )
        for event in events
    ]


@router.get(
    "/summary",
    response_model=ActivitySummaryResponse,
    summary="Get activity summary",
    description="Get aggregated activity statistics for the specified time period.",
    responses={
        200: {
            "description": "Activity summary statistics",
            "content": {
                "application/json": {
                    "example": {
                        "periodHours": 24,
                        "totalRuns": 150,
                        "completed": 140,
                        "failed": 5,
                        "pending": 3,
                        "running": 2,
                        "successRate": 0.93,
                    }
                }
            },
        }
    },
)
async def get_activity_summary(
    hours: int = Query(24, ge=1, le=168, description="Time period in hours (1-168)"),
    current_user: dict = Depends(get_current_user),
    activity_service: ActivityService = Depends(get_activity_service),
):
    """
    Get activity summary for the specified time period.

    Returns aggregated counts of runs by status and overall success rate.
    Useful for dashboard KPIs and monitoring.
    """
    org_id = current_user["organization_id"]

    summary = await activity_service.get_activity_summary(
        organization_id=org_id,
        hours=hours,
    )

    return ActivitySummaryResponse(
        periodHours=summary.get("period_hours", hours),
        totalRuns=summary.get("total_runs", 0),
        completed=summary.get("completed", 0),
        failed=summary.get("failed", 0),
        pending=summary.get("pending", 0),
        running=summary.get("running", 0),
        successRate=summary.get("success_rate", 0.0),
    )
