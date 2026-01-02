"""
Test API Routes

FastAPI routes for test execution operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from studio.middleware.rbac import get_current_user_from_request, require_permission
from studio.services.agent_service import AgentService
from studio.services.pipeline_service import PipelineService
from studio.services.test_service import TestService

router = APIRouter(prefix="/test", tags=["Test"])


# ===================
# Request/Response Models
# ===================


class TestOptions(BaseModel):
    """Test execution options."""

    timeout_ms: int = Field(
        default=30000, description="Execution timeout in milliseconds"
    )
    stream: bool = Field(default=False, description="Whether to stream response")


class TestInput(BaseModel):
    """Test execution input."""

    input: dict = Field(..., description="Input data for the test")
    options: TestOptions | None = Field(default=None, description="Execution options")


class TokenUsage(BaseModel):
    """Token usage metrics."""

    input: int
    output: int
    total: int


class TestResult(BaseModel):
    """Test execution result."""

    id: str
    status: str
    output: dict | None = None
    execution_time_ms: int | None = None
    token_usage: TokenUsage | None = None
    error_message: str | None = None


class ExecutionListResponse(BaseModel):
    """List of test executions response."""

    records: list
    total: int


# ===================
# Service Dependencies
# ===================


def get_test_service() -> TestService:
    """Get test service instance."""
    return TestService()


def get_agent_service() -> AgentService:
    """Get agent service instance."""
    return AgentService()


def get_pipeline_service() -> PipelineService:
    """Get pipeline service instance."""
    return PipelineService()


# ===================
# Agent Testing
# ===================


@router.post("/agents/{agent_id}", response_model=TestResult)
async def run_agent_test(
    agent_id: str,
    body: TestInput,
    current_user: dict = Depends(get_current_user_from_request),
    _: dict = require_permission("agents:read"),
    test_service: TestService = Depends(get_test_service),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Run a test execution for an agent.

    Requires agents:read permission.
    """
    # Verify agent exists and user has access
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found"
        )

    # Verify organization access
    if agent["organization_id"] != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to agent"
        )

    try:
        options = body.options.model_dump() if body.options else {}
        result = await test_service.run_agent_test(
            agent_id=agent_id,
            input_data=body.input,
            user_id=current_user["id"],
            options=options,
        )

        return _format_test_result(result)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/agents/{agent_id}/history", response_model=ExecutionListResponse)
async def get_agent_test_history(
    agent_id: str,
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user_from_request),
    _: dict = require_permission("agents:read"),
    test_service: TestService = Depends(get_test_service),
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Get test execution history for an agent.

    Requires agents:read permission.
    """
    # Verify agent exists and user has access
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found"
        )

    if agent["organization_id"] != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to agent"
        )

    result = await test_service.list_executions(
        organization_id=current_user["organization_id"],
        agent_id=agent_id,
        limit=limit,
        offset=offset,
    )

    return result


# ===================
# Pipeline Testing
# ===================


@router.post("/pipelines/{pipeline_id}", response_model=TestResult)
async def run_pipeline_test(
    pipeline_id: str,
    body: TestInput,
    current_user: dict = Depends(get_current_user_from_request),
    _: dict = require_permission("agents:read"),
    test_service: TestService = Depends(get_test_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    Run a test execution for a pipeline.

    Requires agents:read permission (same as viewing).
    """
    # Verify pipeline exists and user has access
    pipeline = await pipeline_service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pipeline not found"
        )

    if pipeline["organization_id"] != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to pipeline"
        )

    try:
        options = body.options.model_dump() if body.options else {}
        result = await test_service.run_pipeline_test(
            pipeline_id=pipeline_id,
            input_data=body.input,
            user_id=current_user["id"],
            options=options,
        )

        return _format_test_result(result)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/pipelines/{pipeline_id}/history", response_model=ExecutionListResponse)
async def get_pipeline_test_history(
    pipeline_id: str,
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user_from_request),
    _: dict = require_permission("agents:read"),
    test_service: TestService = Depends(get_test_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    Get test execution history for a pipeline.

    Requires agents:read permission.
    """
    # Verify pipeline exists and user has access
    pipeline = await pipeline_service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pipeline not found"
        )

    if pipeline["organization_id"] != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to pipeline"
        )

    result = await test_service.list_executions(
        organization_id=current_user["organization_id"],
        pipeline_id=pipeline_id,
        limit=limit,
        offset=offset,
    )

    return result


# ===================
# Node Testing
# ===================


@router.post("/pipelines/{pipeline_id}/nodes/{node_id}", response_model=TestResult)
async def run_node_test(
    pipeline_id: str,
    node_id: str,
    body: TestInput,
    current_user: dict = Depends(get_current_user_from_request),
    _: dict = require_permission("agents:read"),
    test_service: TestService = Depends(get_test_service),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
):
    """
    Run a test execution for a single node in a pipeline.

    Requires agents:read permission.
    """
    # Verify pipeline exists and user has access
    pipeline = await pipeline_service.get(pipeline_id)
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pipeline not found"
        )

    if pipeline["organization_id"] != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to pipeline"
        )

    try:
        options = body.options.model_dump() if body.options else {}
        result = await test_service.run_node_test(
            pipeline_id=pipeline_id,
            node_id=node_id,
            input_data=body.input,
            user_id=current_user["id"],
            options=options,
        )

        return _format_test_result(result)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ===================
# Execution Management
# ===================


@router.get("/executions/{execution_id}")
async def get_execution(
    execution_id: str,
    current_user: dict = Depends(get_current_user_from_request),
    _: dict = require_permission("agents:read"),
    test_service: TestService = Depends(get_test_service),
):
    """
    Get a test execution by ID.

    Requires agents:read permission.
    """
    execution = await test_service.get_execution(execution_id)
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found"
        )

    # Verify organization access
    if execution["organization_id"] != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to execution"
        )

    return execution


@router.delete("/executions/{execution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_execution(
    execution_id: str,
    current_user: dict = Depends(get_current_user_from_request),
    _: dict = require_permission("agents:read"),
    test_service: TestService = Depends(get_test_service),
):
    """
    Delete a test execution.

    Requires agents:read permission.
    """
    execution = await test_service.get_execution(execution_id)
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found"
        )

    # Verify organization access
    if execution["organization_id"] != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to execution"
        )

    await test_service.delete_execution(execution_id)


# ===================
# Helpers
# ===================


def _format_test_result(execution: dict) -> TestResult:
    """Format execution data as TestResult response."""
    # Extract output without internal fields
    output = execution.get("output_data", {})
    if isinstance(output, dict):
        output = {k: v for k, v in output.items() if not k.startswith("_")}

    token_usage = execution.get("token_usage", {})
    if isinstance(token_usage, dict):
        token_usage = TokenUsage(
            input=token_usage.get("input", 0),
            output=token_usage.get("output", 0),
            total=token_usage.get("total", 0),
        )

    return TestResult(
        id=execution["id"],
        status=execution["status"],
        output=output if output else None,
        execution_time_ms=execution.get("execution_time_ms"),
        token_usage=token_usage if execution.get("status") == "completed" else None,
        error_message=(
            execution.get("error_message") if execution.get("error_message") else None
        ),
    )
