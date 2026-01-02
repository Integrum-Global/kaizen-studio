"""
Integration Tests for Metrics API

Tests all metrics endpoints with real database - NO MOCKING.
- Tier 2: Real infrastructure (<5s), database operations, API routes
"""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


@pytest.mark.timeout(5)
class TestMetricsRecordingIntegration:
    """Test metrics recording through API."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_record_metric_endpoint(self, authenticated_owner_client):
        """Test POST /metrics/record endpoint."""
        client, user, org = authenticated_owner_client

        metric = {
            "organization_id": org["id"],
            "deployment_id": str(uuid.uuid4()),
            "agent_id": str(uuid.uuid4()),
            "status": "success",
            "latency_ms": 150,
            "input_tokens": 100,
            "output_tokens": 50,
            "total_tokens": 150,
            "cost_usd": 0.003,
        }

        response = await client.post("/api/v1/metrics/record", json=metric)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] is not None
        assert data["status"] == "success"
        assert data["latency_ms"] == 150

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_record_metric_with_error_info(self, authenticated_owner_client):
        """Test recording metric with error information."""
        client, user, org = authenticated_owner_client

        metric = {
            "organization_id": org["id"],
            "deployment_id": str(uuid.uuid4()),
            "agent_id": str(uuid.uuid4()),
            "status": "failure",
            "latency_ms": 30000,
            "error_type": "timeout",
            "error_message": "Request exceeded 30 second timeout",
            "input_tokens": 50,
            "output_tokens": 0,
            "total_tokens": 50,
            "cost_usd": 0.001,
        }

        response = await client.post("/api/v1/metrics/record", json=metric)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "failure"
        assert data["error_type"] == "timeout"
        assert data["error_message"] == "Request exceeded 30 second timeout"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_record_metric_missing_required_field(
        self, authenticated_owner_client
    ):
        """Test that recording fails with missing required fields."""
        client, user, org = authenticated_owner_client

        metric = {
            "organization_id": org["id"],
            "deployment_id": str(uuid.uuid4()),
            # Missing agent_id
            "status": "success",
        }

        response = await client.post("/api/v1/metrics/record", json=metric)

        assert response.status_code == 400
        data = response.json()
        # API returns {"error": {"message": "..."}} due to error_handler middleware
        if "detail" in data:
            assert "Missing required field" in data["detail"]
        else:
            assert "Missing required field" in data.get("error", {}).get("message", "")

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_record_metric_missing_status(self, authenticated_owner_client):
        """Test that recording fails with missing status."""
        client, user, org = authenticated_owner_client

        metric = {
            "organization_id": org["id"],
            "deployment_id": str(uuid.uuid4()),
            "agent_id": str(uuid.uuid4()),
            # Missing status
        }

        response = await client.post("/api/v1/metrics/record", json=metric)

        assert response.status_code == 400

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_record_multiple_metrics(self, authenticated_owner_client):
        """Test recording multiple metrics in sequence."""
        client, user, org = authenticated_owner_client
        deploy_id = str(uuid.uuid4())

        for i in range(5):
            metric = {
                "organization_id": org["id"],
                "deployment_id": deploy_id,
                "agent_id": str(uuid.uuid4()),
                "status": "success" if i % 2 == 0 else "failure",
                "latency_ms": 100 + (i * 50),
                "input_tokens": 100,
                "output_tokens": 50,
                "total_tokens": 150,
                "cost_usd": 0.003,
            }

            response = await client.post("/api/v1/metrics/record", json=metric)

            assert response.status_code == 200


@pytest.mark.timeout(5)
class TestMetricsSummaryEndpoint:
    """Test metrics summary endpoint."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_summary_endpoint(self, authenticated_owner_client):
        """Test GET /metrics/summary endpoint."""
        client, user, org = authenticated_owner_client
        deploy_id = str(uuid.uuid4())
        agent_id = str(uuid.uuid4())

        # Record some metrics first
        runtime = AsyncLocalRuntime()
        for i in range(3):
            metric = {
                "id": str(uuid.uuid4()),
                "organization_id": org["id"],
                "deployment_id": deploy_id,
                "agent_id": agent_id,
                "execution_id": str(uuid.uuid4()),
                "status": "success" if i < 2 else "failure",
                "latency_ms": 100 + (i * 50),
                "input_tokens": 100,
                "output_tokens": 50,
                "total_tokens": 150,
                "cost_usd": 0.003,
                "error_type": None if i < 2 else "test_error",
                "error_message": None if i < 2 else "Test error message",
                "created_at": datetime.now(UTC).isoformat(),
            }

            workflow = WorkflowBuilder()
            workflow.add_node("ExecutionMetricCreateNode", "create", metric)
            await runtime.execute_workflow_async(workflow.build(), inputs={})

        # Get summary
        response = await client.get("/api/v1/metrics/summary")

        assert response.status_code == 200
        data = response.json()
        assert "total_executions" in data
        assert "avg_latency_ms" in data
        assert "total_tokens" in data
        assert "error_rate" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_summary_with_filters(self, authenticated_owner_client):
        """Test summary endpoint with deployment and agent filters."""
        client, user, org = authenticated_owner_client

        response = await client.get(
            "/api/v1/metrics/summary",
            params={
                "deployment_id": str(uuid.uuid4()),
                "agent_id": str(uuid.uuid4()),
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_executions"] == 0  # No metrics recorded

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_summary_with_date_range(self, authenticated_owner_client):
        """Test summary endpoint with date range."""
        client, user, org = authenticated_owner_client
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).isoformat()
        end_date = now.isoformat()

        response = await client.get(
            "/api/v1/metrics/summary",
            params={
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "error_rate" in data


@pytest.mark.timeout(5)
class TestMetricsTimeseriesEndpoint:
    """Test metrics timeseries endpoint."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_timeseries_latency(self, authenticated_owner_client):
        """Test timeseries endpoint for latency."""
        client, user, org = authenticated_owner_client
        now = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = (now - timedelta(days=7)).isoformat()
        end_date = (now + timedelta(days=1)).isoformat()

        response = await client.get(
            "/api/v1/metrics/timeseries",
            params={
                "metric": "latency",
                "interval": "day",
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], list)

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_timeseries_tokens(self, authenticated_owner_client):
        """Test timeseries endpoint for tokens."""
        client, user, org = authenticated_owner_client
        now = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = (now - timedelta(days=7)).isoformat()
        end_date = (now + timedelta(days=1)).isoformat()

        response = await client.get(
            "/api/v1/metrics/timeseries",
            params={
                "metric": "tokens",
                "interval": "day",
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_timeseries_errors(self, authenticated_owner_client):
        """Test timeseries endpoint for errors."""
        client, user, org = authenticated_owner_client
        now = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = (now - timedelta(days=7)).isoformat()
        end_date = (now + timedelta(days=1)).isoformat()

        response = await client.get(
            "/api/v1/metrics/timeseries",
            params={
                "metric": "errors",
                "interval": "day",
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_timeseries_cost(self, authenticated_owner_client):
        """Test timeseries endpoint for cost."""
        client, user, org = authenticated_owner_client
        now = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = (now - timedelta(days=7)).isoformat()
        end_date = (now + timedelta(days=1)).isoformat()

        response = await client.get(
            "/api/v1/metrics/timeseries",
            params={
                "metric": "cost",
                "interval": "day",
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_timeseries_invalid_metric(self, authenticated_owner_client):
        """Test timeseries rejects invalid metric type."""
        client, user, org = authenticated_owner_client
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=1)).isoformat()
        end_date = now.isoformat()

        response = await client.get(
            "/api/v1/metrics/timeseries",
            params={
                "metric": "invalid_metric",
                "interval": "day",
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        assert response.status_code == 400

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_timeseries_invalid_interval(self, authenticated_owner_client):
        """Test timeseries rejects invalid interval."""
        client, user, org = authenticated_owner_client
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=1)).isoformat()
        end_date = now.isoformat()

        response = await client.get(
            "/api/v1/metrics/timeseries",
            params={
                "metric": "latency",
                "interval": "invalid_interval",
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        assert response.status_code == 400


@pytest.mark.timeout(5)
class TestMetricsExecutionsEndpoint:
    """Test metrics executions list endpoint."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_executions_endpoint(self, authenticated_owner_client):
        """Test GET /metrics/executions endpoint."""
        client, user, org = authenticated_owner_client

        response = await client.get("/api/v1/metrics/executions")

        assert response.status_code == 200
        data = response.json()
        assert "executions" in data
        assert "count" in data
        assert isinstance(data["executions"], list)

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_executions_with_filters(self, authenticated_owner_client):
        """Test executions endpoint with filters."""
        client, user, org = authenticated_owner_client

        response = await client.get(
            "/api/v1/metrics/executions",
            params={
                "deployment_id": str(uuid.uuid4()),
                "agent_id": str(uuid.uuid4()),
                "status": "success",
                "limit": 50,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "executions" in data
        assert "count" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_executions_limit(self, authenticated_owner_client):
        """Test executions endpoint respects limit."""
        client, user, org = authenticated_owner_client

        response = await client.get(
            "/api/v1/metrics/executions",
            params={"limit": 10},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] <= 10

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_executions_invalid_limit_too_high(
        self, authenticated_owner_client
    ):
        """Test executions rejects limit > 1000."""
        client, user, org = authenticated_owner_client

        response = await client.get(
            "/api/v1/metrics/executions",
            params={"limit": 2000},
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_executions_invalid_limit_too_low(
        self, authenticated_owner_client
    ):
        """Test executions rejects limit < 1."""
        client, user, org = authenticated_owner_client

        response = await client.get(
            "/api/v1/metrics/executions",
            params={"limit": 0},
        )

        assert response.status_code == 422


@pytest.mark.timeout(5)
class TestMetricsErrorsEndpoint:
    """Test metrics errors endpoint."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_top_errors_endpoint(self, authenticated_owner_client):
        """Test GET /metrics/errors endpoint."""
        client, user, org = authenticated_owner_client

        response = await client.get("/api/v1/metrics/errors")

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data
        assert isinstance(data["errors"], list)

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_top_errors_with_limit(self, authenticated_owner_client):
        """Test errors endpoint with custom limit."""
        client, user, org = authenticated_owner_client

        response = await client.get(
            "/api/v1/metrics/errors",
            params={"limit": 5},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["errors"]) <= 5

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_top_errors_respects_limit(self, authenticated_owner_client):
        """Test errors endpoint limits results."""
        client, user, org = authenticated_owner_client

        response = await client.get(
            "/api/v1/metrics/errors",
            params={"limit": 3},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["errors"]) <= 3

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_top_errors_invalid_limit(self, authenticated_owner_client):
        """Test errors endpoint rejects invalid limit."""
        client, user, org = authenticated_owner_client

        response = await client.get(
            "/api/v1/metrics/errors",
            params={"limit": 200},
        )

        assert response.status_code == 422


@pytest.mark.timeout(5)
class TestMetricsDashboardEndpoint:
    """Test metrics dashboard endpoint."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_dashboard_endpoint(self, authenticated_owner_client):
        """Test GET /metrics/dashboard endpoint."""
        client, user, org = authenticated_owner_client

        response = await client.get("/api/v1/metrics/dashboard")

        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "summary" in data
        assert "top_errors" in data
        assert "top_agents" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_dashboard_summary_structure(self, authenticated_owner_client):
        """Test dashboard summary has correct structure."""
        client, user, org = authenticated_owner_client

        response = await client.get("/api/v1/metrics/dashboard")

        assert response.status_code == 200
        data = response.json()
        summary = data["summary"]
        assert "total_executions" in summary
        assert "avg_latency_ms" in summary
        assert "total_tokens" in summary
        assert "total_cost_usd" in summary
        assert "error_rate" in summary


@pytest.mark.timeout(5)
class TestMetricsDeploymentEndpoint:
    """Test deployment-specific metrics endpoint."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_deployment_metrics_endpoint(self, authenticated_owner_client):
        """Test GET /metrics/deployments/{deployment_id} endpoint."""
        client, user, org = authenticated_owner_client
        deployment_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/metrics/deployments/{deployment_id}")

        # Test uses random UUID - deployment may not exist (404) or exist (200)
        assert response.status_code in (200, 404)
        if response.status_code == 200:
            data = response.json()
            assert "total_executions" in data
            assert "avg_latency_ms" in data


@pytest.mark.timeout(5)
class TestMetricsAgentEndpoint:
    """Test agent-specific metrics endpoint."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_agent_metrics_endpoint(self, authenticated_owner_client):
        """Test GET /metrics/agents/{agent_id} endpoint."""
        client, user, org = authenticated_owner_client
        agent_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/metrics/agents/{agent_id}")

        # Test uses random UUID - agent may not exist (404) or exist (200)
        assert response.status_code in (200, 404)
        if response.status_code == 200:
            data = response.json()
            assert "total_executions" in data
            assert "avg_latency_ms" in data


@pytest.mark.timeout(5)
class TestMetricsAuthorizationIntegration:
    """Test authorization for metrics endpoints."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_metrics_requires_authentication(self, test_client: AsyncClient):
        """Test that metrics endpoints require authentication."""
        response = await test_client.get("/api/v1/metrics/summary")

        # Without auth, should get 401
        assert response.status_code == 401

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_record_metric_requires_authentication(
        self, test_client: AsyncClient
    ):
        """Test that record endpoint requires authentication."""
        metric = {
            "organization_id": str(uuid.uuid4()),
            "deployment_id": str(uuid.uuid4()),
            "agent_id": str(uuid.uuid4()),
            "status": "success",
        }

        response = await test_client.post("/api/v1/metrics/record", json=metric)

        # Should require valid auth
        assert response.status_code == 401
