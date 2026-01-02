"""
Unit Tests for Metrics Service

Tests metric recording, aggregations, and calculations in isolation.
- Tier 1: Fast (<1s), mocked dependencies, focused functionality
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest
from studio.services.metrics_service import MetricsService


@pytest.mark.timeout(1)
class TestMetricsRecording:
    """Test metric recording functionality."""

    @pytest.mark.asyncio
    async def test_record_metric_basic(self):
        """Test basic metric recording."""
        service = MetricsService()
        service.runtime = AsyncMock()
        service.runtime.execute_workflow_async.return_value = ({}, "run-123")

        metric_data = {
            "organization_id": "org-123",
            "deployment_id": "deploy-456",
            "agent_id": "agent-789",
            "status": "success",
            "latency_ms": 150,
            "input_tokens": 100,
            "output_tokens": 50,
            "total_tokens": 150,
            "cost_usd": 0.003,
        }

        result = await service.record(metric_data)

        assert result["id"] is not None
        assert result["organization_id"] == "org-123"
        assert result["deployment_id"] == "deploy-456"
        assert result["agent_id"] == "agent-789"
        assert result["status"] == "success"
        assert result["latency_ms"] == 150
        assert result["total_tokens"] == 150
        assert result["cost_usd"] == 0.003
        assert result["created_at"] is not None

    @pytest.mark.asyncio
    async def test_record_metric_with_error(self):
        """Test metric recording with error information."""
        service = MetricsService()
        service.runtime = AsyncMock()
        service.runtime.execute_workflow_async.return_value = ({}, "run-123")

        metric_data = {
            "organization_id": "org-123",
            "deployment_id": "deploy-456",
            "agent_id": "agent-789",
            "status": "failure",
            "error_type": "timeout",
            "error_message": "Request timed out after 30s",
            "latency_ms": 30000,
        }

        result = await service.record(metric_data)

        assert result["status"] == "failure"
        assert result["error_type"] == "timeout"
        assert result["error_message"] == "Request timed out after 30s"
        assert result["latency_ms"] == 30000

    @pytest.mark.asyncio
    async def test_record_metric_generates_execution_id(self):
        """Test that recording generates execution ID if not provided."""
        service = MetricsService()
        service.runtime = AsyncMock()
        service.runtime.execute_workflow_async.return_value = ({}, "run-123")

        metric_data = {
            "organization_id": "org-123",
            "deployment_id": "deploy-456",
            "agent_id": "agent-789",
            "status": "success",
        }

        result = await service.record(metric_data)

        assert result["execution_id"] is not None
        assert len(result["execution_id"]) > 0

    @pytest.mark.asyncio
    async def test_record_metric_uses_provided_execution_id(self):
        """Test that recording uses provided execution ID."""
        service = MetricsService()
        service.runtime = AsyncMock()
        service.runtime.execute_workflow_async.return_value = ({}, "run-123")

        execution_id = "exec-specific-123"
        metric_data = {
            "organization_id": "org-123",
            "deployment_id": "deploy-456",
            "agent_id": "agent-789",
            "status": "success",
            "execution_id": execution_id,
        }

        result = await service.record(metric_data)

        assert result["execution_id"] == execution_id

    @pytest.mark.asyncio
    async def test_record_metric_default_values(self):
        """Test that recording applies default values for optional fields."""
        service = MetricsService()
        service.runtime = AsyncMock()
        service.runtime.execute_workflow_async.return_value = ({}, "run-123")

        metric_data = {
            "organization_id": "org-123",
            "deployment_id": "deploy-456",
            "agent_id": "agent-789",
            "status": "success",
        }

        result = await service.record(metric_data)

        assert result["latency_ms"] == 0
        assert result["input_tokens"] == 0
        assert result["output_tokens"] == 0
        assert result["total_tokens"] == 0
        assert result["cost_usd"] == 0.0
        assert result["error_type"] is None
        assert result["error_message"] is None

    @pytest.mark.asyncio
    async def test_record_metric_calls_workflow(self):
        """Test that recording triggers the workflow execution."""
        service = MetricsService()
        service.runtime = AsyncMock()
        service.runtime.execute_workflow_async.return_value = ({}, "run-123")

        metric_data = {
            "organization_id": "org-123",
            "deployment_id": "deploy-456",
            "agent_id": "agent-789",
            "status": "success",
        }

        await service.record(metric_data)

        service.runtime.execute_workflow_async.assert_called_once()


@pytest.mark.timeout(1)
class TestMetricsSummary:
    """Test metrics summary aggregation."""

    @pytest.mark.asyncio
    async def test_get_summary_no_metrics(self):
        """Test summary calculation with no metrics."""
        service = MetricsService()
        service.list = AsyncMock(return_value=[])

        result = await service.get_summary(organization_id="org-123")

        assert result["total_executions"] == 0
        assert result["avg_latency_ms"] == 0
        assert result["total_tokens"] == 0
        assert result["total_cost_usd"] == 0.0
        assert result["error_rate"] == 0.0
        assert result["success_count"] == 0
        assert result["failure_count"] == 0

    @pytest.mark.asyncio
    async def test_get_summary_single_metric(self):
        """Test summary with single metric."""
        service = MetricsService()
        metrics = [
            {
                "organization_id": "org-123",
                "status": "success",
                "latency_ms": 100,
                "total_tokens": 200,
                "cost_usd": 0.004,
                "created_at": datetime.now(UTC).isoformat(),
            }
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_summary(organization_id="org-123")

        assert result["total_executions"] == 1
        assert result["avg_latency_ms"] == 100
        assert result["total_tokens"] == 200
        assert result["total_cost_usd"] == 0.004
        assert result["error_rate"] == 0.0
        assert result["success_count"] == 1
        assert result["failure_count"] == 0

    @pytest.mark.asyncio
    async def test_get_summary_multiple_metrics(self):
        """Test summary calculation with multiple metrics."""
        service = MetricsService()
        now = datetime.now(UTC)
        metrics = [
            {
                "organization_id": "org-123",
                "status": "success",
                "latency_ms": 100,
                "total_tokens": 200,
                "cost_usd": 0.004,
                "created_at": now.isoformat(),
            },
            {
                "organization_id": "org-123",
                "status": "success",
                "latency_ms": 200,
                "total_tokens": 300,
                "cost_usd": 0.006,
                "created_at": now.isoformat(),
            },
            {
                "organization_id": "org-123",
                "status": "failure",
                "latency_ms": 300,
                "total_tokens": 100,
                "cost_usd": 0.002,
                "created_at": now.isoformat(),
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_summary(organization_id="org-123")

        assert result["total_executions"] == 3
        assert result["avg_latency_ms"] == 200  # (100 + 200 + 300) / 3
        assert result["total_tokens"] == 600  # 200 + 300 + 100
        assert result["total_cost_usd"] == 0.012  # 0.004 + 0.006 + 0.002
        assert result["success_count"] == 2
        assert result["failure_count"] == 1
        assert result["error_rate"] == pytest.approx(33.33, abs=0.01)

    @pytest.mark.asyncio
    async def test_get_summary_error_rate_calculation(self):
        """Test correct error rate calculation."""
        service = MetricsService()
        now = datetime.now(UTC)
        metrics = [
            {
                "status": "success",
                "latency_ms": 100,
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": now.isoformat(),
            },
            {
                "status": "failure",
                "latency_ms": 100,
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": now.isoformat(),
            },
            {
                "status": "failure",
                "latency_ms": 100,
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": now.isoformat(),
            },
            {
                "status": "failure",
                "latency_ms": 100,
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": now.isoformat(),
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_summary(organization_id="org-123")

        assert result["error_rate"] == 75.0

    @pytest.mark.asyncio
    async def test_get_summary_with_deployment_filter(self):
        """Test summary with deployment filter."""
        service = MetricsService()
        service.list = AsyncMock(return_value=[])

        await service.get_summary(organization_id="org-123", deployment_id="deploy-456")

        service.list.assert_called_once()
        call_args = service.list.call_args
        assert call_args[1]["organization_id"] == "org-123"
        assert call_args[1]["deployment_id"] == "deploy-456"

    @pytest.mark.asyncio
    async def test_get_summary_with_agent_filter(self):
        """Test summary with agent filter."""
        service = MetricsService()
        service.list = AsyncMock(return_value=[])

        await service.get_summary(organization_id="org-123", agent_id="agent-789")

        service.list.assert_called_once()
        call_args = service.list.call_args
        assert call_args[1]["agent_id"] == "agent-789"

    @pytest.mark.asyncio
    async def test_get_summary_with_date_range_filter(self):
        """Test summary filters by date range."""
        service = MetricsService()
        now = datetime.now(UTC)
        metrics = [
            {
                "status": "success",
                "latency_ms": 100,
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": (now - timedelta(days=1)).isoformat(),
            },
            {
                "status": "success",
                "latency_ms": 100,
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": now.isoformat(),
            },
            {
                "status": "success",
                "latency_ms": 100,
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": (now + timedelta(days=1)).isoformat(),
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        start_date = (now - timedelta(hours=1)).isoformat()
        end_date = (now + timedelta(hours=1)).isoformat()

        result = await service.get_summary(
            organization_id="org-123", start_date=start_date, end_date=end_date
        )

        # Only the middle metric should be included
        assert result["total_executions"] == 1


@pytest.mark.timeout(1)
class TestMetricsTimeseries:
    """Test time-series metrics aggregation."""

    @pytest.mark.asyncio
    async def test_get_timeseries_latency_metric(self):
        """Test timeseries for latency metric."""
        service = MetricsService()
        now = datetime.now(UTC)
        start = (now - timedelta(days=2)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end = (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        metrics = [
            {
                "latency_ms": 100,
                "status": "success",
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": start.isoformat(),
            },
            {
                "latency_ms": 200,
                "status": "success",
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": (start + timedelta(days=1)).isoformat(),
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_timeseries(
            organization_id="org-123",
            metric="latency",
            interval="day",
            start_date=start.isoformat(),
            end_date=end.isoformat(),
        )

        assert len(result) > 0
        assert all("timestamp" in item for item in result)
        assert all("value" in item for item in result)
        assert all("count" in item for item in result)

    @pytest.mark.asyncio
    async def test_get_timeseries_tokens_metric(self):
        """Test timeseries for tokens metric."""
        service = MetricsService()
        now = datetime.now(UTC)
        start = (now - timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end = (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        metrics = [
            {
                "total_tokens": 100,
                "status": "success",
                "latency_ms": 0,
                "cost_usd": 0,
                "created_at": start.isoformat(),
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_timeseries(
            organization_id="org-123",
            metric="tokens",
            interval="day",
            start_date=start.isoformat(),
            end_date=end.isoformat(),
        )

        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_get_timeseries_errors_metric(self):
        """Test timeseries for errors metric."""
        service = MetricsService()
        now = datetime.now(UTC)
        start = (now - timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end = (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        metrics = [
            {
                "status": "success",
                "latency_ms": 0,
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": start.isoformat(),
            },
            {
                "status": "failure",
                "latency_ms": 0,
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": start.isoformat(),
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_timeseries(
            organization_id="org-123",
            metric="errors",
            interval="day",
            start_date=start.isoformat(),
            end_date=end.isoformat(),
        )

        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_get_timeseries_cost_metric(self):
        """Test timeseries for cost metric."""
        service = MetricsService()
        now = datetime.now(UTC)
        start = (now - timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end = (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        metrics = [
            {
                "cost_usd": 0.005,
                "status": "success",
                "latency_ms": 0,
                "total_tokens": 0,
                "created_at": start.isoformat(),
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_timeseries(
            organization_id="org-123",
            metric="cost",
            interval="day",
            start_date=start.isoformat(),
            end_date=end.isoformat(),
        )

        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_get_timeseries_hour_interval(self):
        """Test timeseries with hour interval."""
        service = MetricsService()
        now = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
        start = (now - timedelta(hours=1)).isoformat()
        end = (now + timedelta(hours=1)).isoformat()

        metrics = [
            {
                "latency_ms": 100,
                "status": "success",
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": now.isoformat(),
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_timeseries(
            organization_id="org-123",
            metric="latency",
            interval="hour",
            start_date=start,
            end_date=end,
        )

        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_get_timeseries_week_interval(self):
        """Test timeseries with week interval."""
        service = MetricsService()
        now = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        start = (now - timedelta(weeks=1)).isoformat()
        end = (now + timedelta(weeks=1)).isoformat()

        metrics = [
            {
                "latency_ms": 100,
                "status": "success",
                "total_tokens": 0,
                "cost_usd": 0,
                "created_at": now.isoformat(),
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_timeseries(
            organization_id="org-123",
            metric="latency",
            interval="week",
            start_date=start,
            end_date=end,
        )

        assert len(result) > 0


@pytest.mark.timeout(1)
class TestMetricsErrors:
    """Test top errors calculation."""

    @pytest.mark.asyncio
    async def test_get_top_errors_no_errors(self):
        """Test top errors with no failures."""
        service = MetricsService()
        service.list = AsyncMock(return_value=[])

        result = await service.get_top_errors(organization_id="org-123")

        assert result == []

    @pytest.mark.asyncio
    async def test_get_top_errors_single_error(self):
        """Test top errors with single error type."""
        service = MetricsService()
        now = datetime.now(UTC).isoformat()
        metrics = [
            {
                "status": "failure",
                "error_type": "timeout",
                "error_message": "Request timed out",
                "created_at": now,
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_top_errors(organization_id="org-123")

        assert len(result) == 1
        assert result[0]["error_type"] == "timeout"
        assert result[0]["count"] == 1
        assert result[0]["last_message"] == "Request timed out"

    @pytest.mark.asyncio
    async def test_get_top_errors_multiple_types(self):
        """Test top errors with multiple error types."""
        service = MetricsService()
        now = datetime.now(UTC).isoformat()
        metrics = [
            {
                "status": "failure",
                "error_type": "timeout",
                "error_message": "Timeout 1",
                "created_at": now,
            },
            {
                "status": "failure",
                "error_type": "timeout",
                "error_message": "Timeout 2",
                "created_at": now,
            },
            {
                "status": "failure",
                "error_type": "auth_error",
                "error_message": "Auth failed",
                "created_at": now,
            },
            {
                "status": "failure",
                "error_type": "rate_limit",
                "error_message": "Rate limited",
                "created_at": now,
            },
            {
                "status": "failure",
                "error_type": "rate_limit",
                "error_message": "Rate limited 2",
                "created_at": now,
            },
            {
                "status": "failure",
                "error_type": "rate_limit",
                "error_message": "Rate limited 3",
                "created_at": now,
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_top_errors(organization_id="org-123")

        assert len(result) == 3
        assert result[0]["error_type"] == "rate_limit"
        assert result[0]["count"] == 3
        assert result[1]["error_type"] == "timeout"
        assert result[1]["count"] == 2
        assert result[2]["error_type"] == "auth_error"
        assert result[2]["count"] == 1

    @pytest.mark.asyncio
    async def test_get_top_errors_respects_limit(self):
        """Test that top errors respects limit parameter."""
        service = MetricsService()
        now = datetime.now(UTC).isoformat()
        metrics = [
            {
                "status": "failure",
                "error_type": f"error_{i}",
                "error_message": f"Error {i}",
                "created_at": now,
            }
            for i in range(20)
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_top_errors(organization_id="org-123", limit=5)

        assert len(result) == 5

    @pytest.mark.asyncio
    async def test_get_top_errors_unknown_type(self):
        """Test that errors with no type are labeled as Unknown."""
        service = MetricsService()
        now = datetime.now(UTC).isoformat()
        metrics = [
            {
                "status": "failure",
                "error_type": None,
                "error_message": "No type",
                "created_at": now,
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_top_errors(organization_id="org-123")

        assert len(result) == 1
        assert result[0]["error_type"] == "Unknown"

    @pytest.mark.asyncio
    async def test_get_top_errors_filters_by_status(self):
        """Test that top errors only includes failures."""
        service = MetricsService()
        service.list = AsyncMock(return_value=[])

        await service.get_top_errors(organization_id="org-123")

        service.list.assert_called_once()
        call_args = service.list.call_args
        assert call_args[1]["status"] == "failure"


@pytest.mark.timeout(1)
class TestMetricsList:
    """Test metrics listing."""

    @pytest.mark.asyncio
    async def test_list_metrics_calls_workflow(self):
        """Test that list metrics calls the workflow."""
        service = MetricsService()
        service.runtime = AsyncMock()
        service.runtime.execute_workflow_async.return_value = (
            {"list_metrics": {"records": []}},
            "run-123",
        )

        await service.list(organization_id="org-123")

        service.runtime.execute_workflow_async.assert_called_once()

    @pytest.mark.asyncio
    async def test_list_metrics_with_filters(self):
        """Test list metrics with all filters."""
        service = MetricsService()
        service.runtime = AsyncMock()
        service.runtime.execute_workflow_async.return_value = (
            {"list_metrics": {"records": []}},
            "run-123",
        )

        await service.list(
            organization_id="org-123",
            deployment_id="deploy-456",
            agent_id="agent-789",
            status="success",
            limit=50,
        )

        service.runtime.execute_workflow_async.assert_called_once()

    @pytest.mark.asyncio
    async def test_list_metrics_extracts_records(self):
        """Test that list metrics returns records from workflow result."""
        service = MetricsService()
        service.runtime = AsyncMock()
        records = [
            {"id": "metric-1", "status": "success"},
            {"id": "metric-2", "status": "success"},
        ]
        service.runtime.execute_workflow_async.return_value = (
            {"list_metrics": {"records": records}},
            "run-123",
        )

        result = await service.list(organization_id="org-123")

        assert result == records


@pytest.mark.timeout(1)
class TestMetricsDashboard:
    """Test dashboard metrics compilation."""

    @pytest.mark.asyncio
    async def test_get_dashboard_returns_structure(self):
        """Test dashboard returns correct structure."""
        service = MetricsService()
        service.get_summary = AsyncMock(
            return_value={
                "total_executions": 10,
                "avg_latency_ms": 100,
                "total_tokens": 1000,
                "total_cost_usd": 0.02,
                "error_rate": 10.0,
            }
        )
        service.get_top_errors = AsyncMock(return_value=[])
        service.list = AsyncMock(return_value=[])

        result = await service.get_dashboard(organization_id="org-123")

        assert "period" in result
        assert "summary" in result
        assert "top_errors" in result
        assert "top_agents" in result

    @pytest.mark.asyncio
    async def test_get_dashboard_filters_24h_metrics(self):
        """Test dashboard limits to 24 hour window."""
        service = MetricsService()
        service.get_summary = AsyncMock(return_value={})
        service.get_top_errors = AsyncMock(return_value=[])
        service.list = AsyncMock(return_value=[])

        await service.get_dashboard(organization_id="org-123")

        # Verify get_summary was called with date range
        service.get_summary.assert_called_once()
        call_args = service.get_summary.call_args
        assert call_args[1]["start_date"] is not None
        assert call_args[1]["end_date"] is not None

    @pytest.mark.asyncio
    async def test_get_dashboard_top_agents(self):
        """Test dashboard includes top agents by execution count."""
        service = MetricsService()
        service.get_summary = AsyncMock(return_value={})
        service.get_top_errors = AsyncMock(return_value=[])
        now = datetime.now(UTC)
        metrics = [
            {
                "agent_id": "agent-1",
                "total_tokens": 100,
                "cost_usd": 0.001,
                "created_at": now.isoformat(),
            },
            {
                "agent_id": "agent-1",
                "total_tokens": 100,
                "cost_usd": 0.001,
                "created_at": now.isoformat(),
            },
            {
                "agent_id": "agent-2",
                "total_tokens": 50,
                "cost_usd": 0.0005,
                "created_at": now.isoformat(),
            },
        ]
        service.list = AsyncMock(return_value=metrics)

        result = await service.get_dashboard(organization_id="org-123")

        assert len(result["top_agents"]) > 0
        assert result["top_agents"][0]["agent_id"] == "agent-1"


@pytest.mark.timeout(1)
class TestDeploymentAndAgentMetrics:
    """Test deployment and agent specific metrics."""

    @pytest.mark.asyncio
    async def test_get_deployment_metrics(self):
        """Test getting metrics for specific deployment."""
        service = MetricsService()
        service.get_summary = AsyncMock(return_value={"total_executions": 5})

        result = await service.get_deployment_metrics(
            deployment_id="deploy-456", organization_id="org-123"
        )

        service.get_summary.assert_called_once_with(
            organization_id="org-123", deployment_id="deploy-456"
        )

    @pytest.mark.asyncio
    async def test_get_agent_metrics(self):
        """Test getting metrics for specific agent."""
        service = MetricsService()
        service.get_summary = AsyncMock(return_value={"total_executions": 5})

        result = await service.get_agent_metrics(
            agent_id="agent-789", organization_id="org-123"
        )

        service.get_summary.assert_called_once_with(
            organization_id="org-123", agent_id="agent-789"
        )
