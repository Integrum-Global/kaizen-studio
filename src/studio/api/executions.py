"""
Executions API Endpoints

Handles pipeline execution operations.
This module provides the /executions endpoints expected by the frontend.
It wraps the test service which handles the actual execution logic.
"""

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from studio.middleware.rbac import get_current_user_from_request, require_permission
from studio.services.pipeline_service import PipelineService
from studio.services.test_service import TestService

router = APIRouter(prefix="/executions", tags=["Executions"])


# =============================================================================
# Request/Response Models
# =============================================================================


class StartExecutionRequest(BaseModel):
    """Start execution request."""

    pipeline_id: str = Field(..., alias="pipelineId")
    inputs: dict[str, Any] = Field(default_factory=dict)

    class Config:
        populate_by_name = True


class StartExecutionResponse(BaseModel):
    """Start execution response."""

    execution_id: str = Field(..., alias="executionId")

    class Config:
        populate_by_name = True


class NodeExecution(BaseModel):
    """Node execution status."""

    node_id: str = Field(..., alias="nodeId")
    status: str
    start_time: str | None = Field(None, alias="startTime")
    end_time: str | None = Field(None, alias="endTime")
    error: str | None = None
    output: Any | None = None

    class Config:
        populate_by_name = True


class ExecutionLog(BaseModel):
    """Execution log entry."""

    id: str
    timestamp: str
    level: str
    message: str
    node_id: str | None = Field(None, alias="nodeId")
    data: dict | None = None

    class Config:
        populate_by_name = True


class ExecutionStatusResponse(BaseModel):
    """Execution status response."""

    id: str
    pipeline_id: str = Field(..., alias="pipelineId")
    status: str
    inputs: dict[str, Any]
    outputs: dict[str, Any]
    logs: list[ExecutionLog] = Field(default_factory=list)
    node_executions: list[NodeExecution] = Field(
        default_factory=list, alias="nodeExecutions"
    )
    start_time: str = Field(..., alias="startTime")
    end_time: str | None = Field(None, alias="endTime")
    error: str | None = None

    class Config:
        populate_by_name = True


class ExecutionHistoryItem(BaseModel):
    """Execution history item."""

    id: str
    pipeline_id: str = Field(..., alias="pipelineId")
    status: str
    inputs: dict[str, Any]
    outputs: dict[str, Any]
    logs: list[ExecutionLog] = Field(default_factory=list)
    node_executions: list[NodeExecution] = Field(
        default_factory=list, alias="nodeExecutions"
    )
    start_time: str = Field(..., alias="startTime")
    end_time: str | None = Field(None, alias="endTime")
    error: str | None = None

    class Config:
        populate_by_name = True


class ExecutionHistoryResponse(BaseModel):
    """Execution history response."""

    executions: list[ExecutionHistoryItem]
    total: int
    page: int
    page_size: int

    class Config:
        populate_by_name = True


# =============================================================================
# Service Dependencies
# =============================================================================


def get_test_service() -> TestService:
    """Get test service instance."""
    return TestService()


def get_pipeline_service() -> PipelineService:
    """Get pipeline service instance."""
    return PipelineService()


# =============================================================================
# API Endpoints
# =============================================================================


@router.post("/start", response_model=StartExecutionResponse)
async def start_execution(
    request: StartExecutionRequest,
    current_user: dict = Depends(get_current_user_from_request),
    _: dict = require_permission("agents:read"),
    test_service: TestService = Depends(get_test_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    Start a new pipeline execution.

    Requires agents:read permission.
    """
    pipeline_id = request.pipeline_id

    # Verify pipeline exists and user has access
    pipeline = await pipeline_service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found",
        )

    if pipeline["organization_id"] != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to pipeline",
        )

    try:
        result = await test_service.run_pipeline_test(
            pipeline_id=pipeline_id,
            input_data=request.inputs,
            user_id=current_user["id"],
            options={},
        )

        return StartExecutionResponse(executionId=result["id"])

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/{execution_id}", response_model=ExecutionStatusResponse)
async def get_execution_status(
    execution_id: str,
    current_user: dict = Depends(get_current_user_from_request),
    _: dict = require_permission("agents:read"),
    test_service: TestService = Depends(get_test_service),
):
    """
    Get execution status by ID.

    Requires agents:read permission.
    """
    execution = await test_service.get_execution(execution_id)
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    # Verify organization access
    if execution["organization_id"] != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to execution",
        )

    return _format_execution_response(execution)


@router.post("/{execution_id}/stop", status_code=status.HTTP_204_NO_CONTENT)
async def stop_execution(
    execution_id: str,
    current_user: dict = Depends(get_current_user_from_request),
    _: dict = require_permission("agents:read"),
    test_service: TestService = Depends(get_test_service),
):
    """
    Stop a running execution.

    Requires agents:read permission.
    """
    execution = await test_service.get_execution(execution_id)
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    # Verify organization access
    if execution["organization_id"] != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to execution",
        )

    # Check if execution is actually running
    if execution.get("status") not in ["running", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Execution is not running (status: {execution.get('status')})",
        )

    # Stop the execution
    await test_service.stop_execution(execution_id)


@router.get("/history/{pipeline_id}", response_model=ExecutionHistoryResponse)
async def get_execution_history(
    pipeline_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user_from_request),
    _: dict = require_permission("agents:read"),
    test_service: TestService = Depends(get_test_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    Get execution history for a pipeline.

    Requires agents:read permission.
    """
    # Verify pipeline exists and user has access
    pipeline = await pipeline_service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found",
        )

    if pipeline["organization_id"] != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to pipeline",
        )

    offset = (page - 1) * page_size
    result = await test_service.list_executions(
        organization_id=current_user["organization_id"],
        pipeline_id=pipeline_id,
        limit=page_size,
        offset=offset,
    )

    executions = [_format_execution_history_item(e) for e in result.get("records", [])]

    return ExecutionHistoryResponse(
        executions=executions,
        total=result.get("total", 0),
        page=page,
        page_size=page_size,
    )


# =============================================================================
# Helpers
# =============================================================================


def _format_execution_response(execution: dict) -> ExecutionStatusResponse:
    """Format execution data as ExecutionStatusResponse."""
    now = datetime.now(UTC).isoformat()

    # Extract node executions if available
    node_executions = []
    node_data = execution.get("node_executions", [])
    if isinstance(node_data, list):
        for node in node_data:
            node_executions.append(
                NodeExecution(
                    nodeId=node.get("node_id", ""),
                    status=node.get("status", "pending"),
                    startTime=node.get("start_time"),
                    endTime=node.get("end_time"),
                    error=node.get("error"),
                    output=node.get("output"),
                )
            )

    # Extract logs if available
    logs = []
    log_data = execution.get("logs", [])
    if isinstance(log_data, list):
        for log in log_data:
            logs.append(
                ExecutionLog(
                    id=log.get("id", ""),
                    timestamp=log.get("timestamp", now),
                    level=log.get("level", "info"),
                    message=log.get("message", ""),
                    nodeId=log.get("node_id"),
                    data=log.get("data"),
                )
            )

    return ExecutionStatusResponse(
        id=execution["id"],
        pipelineId=execution.get("pipeline_id", ""),
        status=execution.get("status", "idle"),
        inputs=execution.get("input_data", {}),
        outputs=execution.get("output_data", {}),
        logs=logs,
        nodeExecutions=node_executions,
        startTime=execution.get("started_at", now),
        endTime=execution.get("completed_at"),
        error=execution.get("error_message"),
    )


def _format_execution_history_item(execution: dict) -> ExecutionHistoryItem:
    """Format execution data as ExecutionHistoryItem."""
    now = datetime.now(UTC).isoformat()

    # Extract node executions if available
    node_executions = []
    node_data = execution.get("node_executions", [])
    if isinstance(node_data, list):
        for node in node_data:
            node_executions.append(
                NodeExecution(
                    nodeId=node.get("node_id", ""),
                    status=node.get("status", "pending"),
                    startTime=node.get("start_time"),
                    endTime=node.get("end_time"),
                    error=node.get("error"),
                    output=node.get("output"),
                )
            )

    # Extract logs if available
    logs = []
    log_data = execution.get("logs", [])
    if isinstance(log_data, list):
        for log in log_data:
            logs.append(
                ExecutionLog(
                    id=log.get("id", ""),
                    timestamp=log.get("timestamp", now),
                    level=log.get("level", "info"),
                    message=log.get("message", ""),
                    nodeId=log.get("node_id"),
                    data=log.get("data"),
                )
            )

    return ExecutionHistoryItem(
        id=execution["id"],
        pipelineId=execution.get("pipeline_id", ""),
        status=execution.get("status", "idle"),
        inputs=execution.get("input_data", {}),
        outputs=execution.get("output_data", {}),
        logs=logs,
        nodeExecutions=node_executions,
        startTime=execution.get("started_at", now),
        endTime=execution.get("completed_at"),
        error=execution.get("error_message"),
    )
