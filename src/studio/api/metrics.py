"""
Metrics API Endpoints

REST API for metrics and observability.
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from studio.middleware.rbac import get_current_user_from_request
from studio.services.metrics_service import MetricsService

router = APIRouter(prefix="/metrics", tags=["Metrics"])


def get_metrics_service() -> MetricsService:
    """Get metrics service instance."""
    return MetricsService()


@router.get("/summary")
async def get_metrics_summary(
    deployment_id: str | None = Query(None, description="Filter by deployment"),
    agent_id: str | None = Query(None, description="Filter by agent"),
    start_date: str | None = Query(None, description="Start date (ISO format)"),
    end_date: str | None = Query(None, description="End date (ISO format)"),
    current_user: dict = Depends(get_current_user_from_request),
    service: MetricsService = Depends(get_metrics_service),
):
    """
    Get aggregated metrics summary.

    Returns average latency, total tokens, error rate, and cost.
    """
    organization_id = current_user.get("organization_id")
    if not organization_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    summary = await service.get_summary(
        organization_id=organization_id,
        deployment_id=deployment_id,
        agent_id=agent_id,
        start_date=start_date,
        end_date=end_date,
    )

    return summary


@router.get("/timeseries")
async def get_metrics_timeseries(
    metric: str = Query(..., description="Metric type: latency, tokens, errors, cost"),
    interval: str = Query("day", description="Time interval: hour, day, week"),
    start_date: str = Query(..., description="Start date (ISO format)"),
    end_date: str = Query(..., description="End date (ISO format)"),
    current_user: dict = Depends(get_current_user_from_request),
    service: MetricsService = Depends(get_metrics_service),
):
    """
    Get time-bucketed metrics data.

    Returns data points for charting.
    """
    organization_id = current_user.get("organization_id")
    if not organization_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    if metric not in ("latency", "tokens", "errors", "cost"):
        raise HTTPException(status_code=400, detail="Invalid metric type")

    if interval not in ("hour", "day", "week"):
        raise HTTPException(status_code=400, detail="Invalid interval")

    data = await service.get_timeseries(
        organization_id=organization_id,
        metric=metric,
        interval=interval,
        start_date=start_date,
        end_date=end_date,
    )

    return {"data": data}


@router.get("/executions")
async def list_executions(
    deployment_id: str | None = Query(None, description="Filter by deployment"),
    agent_id: str | None = Query(None, description="Filter by agent"),
    status: str | None = Query(None, description="Filter by status"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum results"),
    current_user: dict = Depends(get_current_user_from_request),
    service: MetricsService = Depends(get_metrics_service),
):
    """
    List raw execution metrics.

    Returns detailed execution data.
    """
    organization_id = current_user.get("organization_id")
    if not organization_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    executions = await service.list(
        organization_id=organization_id,
        deployment_id=deployment_id,
        agent_id=agent_id,
        status=status,
        limit=limit,
    )

    return {"executions": executions, "count": len(executions)}


@router.get("/errors")
async def get_top_errors(
    limit: int = Query(10, ge=1, le=100, description="Maximum results"),
    current_user: dict = Depends(get_current_user_from_request),
    service: MetricsService = Depends(get_metrics_service),
):
    """
    Get top errors by frequency.

    Returns error types with counts.
    """
    organization_id = current_user.get("organization_id")
    if not organization_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    errors = await service.get_top_errors(organization_id=organization_id, limit=limit)

    return {"errors": errors}


@router.get("/dashboard")
async def get_dashboard(
    current_user: dict = Depends(get_current_user_from_request),
    service: MetricsService = Depends(get_metrics_service),
):
    """
    Get dashboard metrics for the last 24 hours.

    Returns key metrics, top agents, and top errors.
    """
    organization_id = current_user.get("organization_id")
    if not organization_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    dashboard = await service.get_dashboard(organization_id=organization_id)

    return dashboard


@router.get("/deployments/{deployment_id}")
async def get_deployment_metrics(
    deployment_id: str,
    current_user: dict = Depends(get_current_user_from_request),
    service: MetricsService = Depends(get_metrics_service),
):
    """
    Get metrics for a specific deployment.

    Returns aggregated metrics for the deployment.
    """
    organization_id = current_user.get("organization_id")
    if not organization_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    metrics = await service.get_deployment_metrics(
        deployment_id=deployment_id, organization_id=organization_id
    )

    return metrics


@router.get("/agents/{agent_id}")
async def get_agent_metrics(
    agent_id: str,
    current_user: dict = Depends(get_current_user_from_request),
    service: MetricsService = Depends(get_metrics_service),
):
    """
    Get metrics for a specific agent.

    Returns aggregated metrics for the agent.
    """
    organization_id = current_user.get("organization_id")
    if not organization_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    metrics = await service.get_agent_metrics(
        agent_id=agent_id, organization_id=organization_id
    )

    return metrics


@router.post("/record")
async def record_metric(
    metric: dict,
    current_user: dict = Depends(get_current_user_from_request),
    service: MetricsService = Depends(get_metrics_service),
):
    """
    Record an execution metric.

    Used by gateways to report execution metrics.
    """
    organization_id = current_user.get("organization_id")
    if not organization_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    # Validate required fields
    required_fields = ["deployment_id", "agent_id", "status"]
    for field in required_fields:
        if field not in metric:
            raise HTTPException(
                status_code=400, detail=f"Missing required field: {field}"
            )

    # Add organization ID
    metric["organization_id"] = organization_id

    result = await service.record(metric)

    return result
