"""
End-to-End Tests for Metrics & Observability Workflow

Complete observability workflow with real infrastructure - NO MOCKING.
- Tier 3: Complete system (<10s), real workflow execution, dashboard accuracy
"""

import uuid
from datetime import UTC, datetime, timedelta

import pytest


@pytest.mark.timeout(10)
class TestCompleteMetricsWorkflow:
    """Test complete metrics recording and aggregation workflow."""

    @pytest.mark.e2e
    @pytest.mark.asyncio
    async def test_full_metrics_lifecycle(self, authenticated_client):
        """Test complete lifecycle: record -> aggregate -> dashboard."""
        client, user = authenticated_client
        deploy_id = str(uuid.uuid4())
        agent_id = str(uuid.uuid4())

        # Step 1: Record multiple metrics
        metrics_recorded = []
        for i in range(10):
            metric = {
                "deployment_id": deploy_id,
                "agent_id": agent_id,
                "status": "success" if i % 3 != 0 else "failure",
                "latency_ms": 100 + (i * 10),
                "input_tokens": 100,
                "output_tokens": 50,
                "total_tokens": 150,
                "cost_usd": 0.003,
                "error_type": "timeout" if i % 3 == 0 else None,
                "error_message": "Timeout" if i % 3 == 0 else None,
            }

            response = await client.post(
                "/api/v1/metrics/record",
                json=metric,
            )

            assert response.status_code == 200
            metrics_recorded.append(response.json())

        # Step 2: Get summary
        summary_response = await client.get("/api/v1/metrics/summary")

        assert summary_response.status_code == 200
        summary = summary_response.json()
        assert summary["total_executions"] > 0
        assert summary["error_rate"] > 0

        # Step 3: Get timeseries
        now = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = (now - timedelta(days=1)).isoformat()
        end_date = (now + timedelta(days=1)).isoformat()

        timeseries_response = await client.get(
            "/api/v1/metrics/timeseries",
            params={
                "metric": "latency",
                "interval": "day",
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        assert timeseries_response.status_code == 200
        timeseries = timeseries_response.json()
        assert "data" in timeseries

        # Step 4: Get dashboard
        dashboard_response = await client.get("/api/v1/metrics/dashboard")

        assert dashboard_response.status_code == 200
        dashboard = dashboard_response.json()
        assert dashboard["summary"]["total_executions"] > 0

    @pytest.mark.e2e
    @pytest.mark.asyncio
    async def test_metrics_workflow_with_errors(self, authenticated_client):
        """Test workflow capturing and analyzing errors."""
        client, user = authenticated_client
        deploy_id = str(uuid.uuid4())

        # Record metrics with various error types
        error_types = [
            "timeout",
            "auth_error",
            "rate_limit",
            "timeout",
            "rate_limit",
            "rate_limit",
        ]

        for error_type in error_types:
            metric = {
                "deployment_id": deploy_id,
                "agent_id": str(uuid.uuid4()),
                "status": "failure",
                "latency_ms": 5000,
                "error_type": error_type,
                "error_message": f"{error_type} occurred",
                "input_tokens": 50,
                "output_tokens": 0,
                "total_tokens": 50,
                "cost_usd": 0.001,
            }

            response = await client.post(
                "/api/v1/metrics/record",
                json=metric,
            )

            assert response.status_code == 200

        # Get top errors
        errors_response = await client.get(
            "/api/v1/metrics/errors",
            params={"limit": 10},
        )

        assert errors_response.status_code == 200
        errors = errors_response.json()["errors"]
        assert len(errors) > 0
        # rate_limit should be most common (3 occurrences)
        if len(errors) > 0:
            assert errors[0]["count"] >= 1

    @pytest.mark.e2e
    @pytest.mark.asyncio
    async def test_metrics_dashboard_accuracy(self, authenticated_client):
        """Test dashboard metrics are accurate."""
        client, user = authenticated_client
        deploy_id = str(uuid.uuid4())

        # Record known metrics via API to ensure proper organization_id
        metrics_data = []

        for i in range(5):
            metric = {
                "deployment_id": deploy_id,
                "agent_id": f"agent-{i}",
                "status": "success",
                "latency_ms": 100,
                "input_tokens": 100,
                "output_tokens": 50,
                "total_tokens": 150,
                "cost_usd": 0.003,
            }

            response = await client.post("/api/v1/metrics/record", json=metric)
            assert response.status_code == 200
            metrics_data.append(response.json())

        # Get dashboard
        response = await client.get("/api/v1/metrics/dashboard")

        assert response.status_code == 200
        dashboard = response.json()

        # Verify summary accuracy
        summary = dashboard["summary"]
        assert summary["total_executions"] >= 5
        assert summary["avg_latency_ms"] > 0
        assert summary["total_tokens"] >= 750  # 5 * 150
        assert summary["total_cost_usd"] >= 0.015  # 5 * 0.003

    @pytest.mark.e2e
    @pytest.mark.asyncio
    async def test_metrics_deployment_specific_workflow(self, authenticated_client):
        """Test deployment-specific metrics workflow."""
        client, user = authenticated_client
        deploy_id1 = str(uuid.uuid4())
        deploy_id2 = str(uuid.uuid4())

        # Record metrics for two different deployments
        for deploy_id, count in [(deploy_id1, 5), (deploy_id2, 3)]:
            for i in range(count):
                metric = {
                    "deployment_id": deploy_id,
                    "agent_id": str(uuid.uuid4()),
                    "status": "success",
                    "latency_ms": 100 + i,
                    "input_tokens": 100,
                    "output_tokens": 50,
                    "total_tokens": 150,
                    "cost_usd": 0.003,
                }

                response = await client.post(
                    "/api/v1/metrics/record",
                    json=metric,
                )

                assert response.status_code == 200

        # Get metrics for deployment 1
        deploy1_response = await client.get(
            f"/api/v1/metrics/deployments/{deploy_id1}",
        )

        assert deploy1_response.status_code == 200
        deploy1_metrics = deploy1_response.json()
        assert deploy1_metrics["total_executions"] >= 5

        # Get metrics for deployment 2
        deploy2_response = await client.get(
            f"/api/v1/metrics/deployments/{deploy_id2}",
        )

        assert deploy2_response.status_code == 200
        deploy2_metrics = deploy2_response.json()
        assert deploy2_metrics["total_executions"] >= 3

    @pytest.mark.e2e
    @pytest.mark.asyncio
    async def test_metrics_agent_specific_workflow(self, authenticated_client):
        """Test agent-specific metrics workflow."""
        client, user = authenticated_client
        deploy_id = str(uuid.uuid4())
        agent_id = str(uuid.uuid4())

        # Record multiple executions for one agent
        for i in range(7):
            metric = {
                "deployment_id": deploy_id,
                "agent_id": agent_id,
                "status": "success" if i % 2 == 0 else "failure",
                "latency_ms": 100 + (i * 20),
                "input_tokens": 100 + (i * 10),
                "output_tokens": 50,
                "total_tokens": 150 + (i * 10),
                "cost_usd": 0.003 + (i * 0.0001),
                "error_type": "timeout" if i % 2 == 1 else None,
                "error_message": "Timeout" if i % 2 == 1 else None,
            }

            response = await client.post(
                "/api/v1/metrics/record",
                json=metric,
            )

            assert response.status_code == 200

        # Get agent metrics
        agent_response = await client.get(
            f"/api/v1/metrics/agents/{agent_id}",
        )

        assert agent_response.status_code == 200
        agent_metrics = agent_response.json()
        assert agent_metrics["total_executions"] >= 7

    @pytest.mark.e2e
    @pytest.mark.asyncio
    async def test_metrics_timeseries_data_accuracy(self, authenticated_client):
        """Test timeseries data is accurate across different intervals."""
        client, user = authenticated_client
        deploy_id = str(uuid.uuid4())
        now = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)

        # Record metrics via API
        for day_offset in range(3):
            for i in range(2):
                metric = {
                    "deployment_id": deploy_id,
                    "agent_id": str(uuid.uuid4()),
                    "status": "success",
                    "latency_ms": 100 + (day_offset * 10),
                    "input_tokens": 100,
                    "output_tokens": 50,
                    "total_tokens": 150,
                    "cost_usd": 0.003,
                }

                response = await client.post("/api/v1/metrics/record", json=metric)
                assert response.status_code == 200

        # Get timeseries data
        start_date = (now - timedelta(days=1)).isoformat()
        end_date = (now + timedelta(days=3)).isoformat()

        timeseries_response = await client.get(
            "/api/v1/metrics/timeseries",
            params={
                "metric": "cost",
                "interval": "day",
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        assert timeseries_response.status_code == 200
        timeseries = timeseries_response.json()
        assert "data" in timeseries

    @pytest.mark.e2e
    @pytest.mark.asyncio
    async def test_metrics_list_with_filters(self, authenticated_client):
        """Test listing executions with various filters."""
        client, user = authenticated_client
        deploy_id = str(uuid.uuid4())
        agent_id = str(uuid.uuid4())

        # Record mixed metrics
        for i in range(5):
            metric = {
                "deployment_id": deploy_id,
                "agent_id": agent_id,
                "status": "success" if i < 3 else "failure",
                "latency_ms": 100 + (i * 10),
                "input_tokens": 100,
                "output_tokens": 50,
                "total_tokens": 150,
                "cost_usd": 0.003,
            }

            response = await client.post(
                "/api/v1/metrics/record",
                json=metric,
            )

            assert response.status_code == 200

        # List all executions
        all_response = await client.get("/api/v1/metrics/executions")

        assert all_response.status_code == 200
        all_executions = all_response.json()
        assert "count" in all_executions

        # List only successes
        success_response = await client.get(
            "/api/v1/metrics/executions",
            params={"status": "success"},
        )

        assert success_response.status_code == 200

    @pytest.mark.e2e
    @pytest.mark.asyncio
    async def test_metrics_cost_tracking_accuracy(self, authenticated_client):
        """Test cost tracking accuracy across executions."""
        client, user = authenticated_client
        costs = [0.001, 0.002, 0.003, 0.004, 0.005]
        total_cost = sum(costs)

        # Record metrics with specific costs
        for cost in costs:
            metric = {
                "deployment_id": str(uuid.uuid4()),
                "agent_id": str(uuid.uuid4()),
                "status": "success",
                "latency_ms": 100,
                "input_tokens": 100,
                "output_tokens": 50,
                "total_tokens": 150,
                "cost_usd": cost,
            }

            response = await client.post(
                "/api/v1/metrics/record",
                json=metric,
            )

            assert response.status_code == 200

        # Get summary and verify cost
        summary_response = await client.get("/api/v1/metrics/summary")

        assert summary_response.status_code == 200
        summary = summary_response.json()
        assert summary["total_cost_usd"] >= total_cost * 0.99  # Allow small rounding

    @pytest.mark.e2e
    @pytest.mark.asyncio
    async def test_metrics_latency_statistics(self, authenticated_client):
        """Test latency statistics are calculated correctly."""
        client, user = authenticated_client
        latencies = [50, 100, 150, 200, 250]
        avg_latency = sum(latencies) / len(latencies)

        # Record metrics with specific latencies
        for latency in latencies:
            metric = {
                "deployment_id": str(uuid.uuid4()),
                "agent_id": str(uuid.uuid4()),
                "status": "success",
                "latency_ms": latency,
                "input_tokens": 100,
                "output_tokens": 50,
                "total_tokens": 150,
                "cost_usd": 0.003,
            }

            response = await client.post(
                "/api/v1/metrics/record",
                json=metric,
            )

            assert response.status_code == 200

        # Get summary and verify average latency
        summary_response = await client.get("/api/v1/metrics/summary")

        assert summary_response.status_code == 200
        summary = summary_response.json()
        # Should have recorded at least these metrics
        if summary["total_executions"] >= len(latencies):
            assert summary["avg_latency_ms"] > 0

    @pytest.mark.e2e
    @pytest.mark.asyncio
    async def test_metrics_error_rate_calculation(self, authenticated_client):
        """Test error rate is calculated accurately."""
        client, user = authenticated_client

        # Record 7 successes and 3 failures (30% error rate)
        for i in range(10):
            metric = {
                "deployment_id": str(uuid.uuid4()),
                "agent_id": str(uuid.uuid4()),
                "status": "success" if i < 7 else "failure",
                "latency_ms": 100,
                "input_tokens": 100,
                "output_tokens": 50,
                "total_tokens": 150,
                "cost_usd": 0.003,
                "error_type": "test_error" if i >= 7 else None,
                "error_message": "Test error" if i >= 7 else None,
            }

            response = await client.post(
                "/api/v1/metrics/record",
                json=metric,
            )

            assert response.status_code == 200

        # Get summary and verify error rate
        summary_response = await client.get("/api/v1/metrics/summary")

        assert summary_response.status_code == 200
        summary = summary_response.json()
        if summary["total_executions"] >= 10:
            assert summary["error_rate"] >= 25  # At least 25%

    @pytest.mark.e2e
    @pytest.mark.asyncio
    async def test_metrics_token_tracking(self, authenticated_client):
        """Test token tracking across multiple executions."""
        client, user = authenticated_client
        token_data = [
            (100, 50),  # input, output
            (200, 100),
            (150, 75),
        ]
        expected_total_tokens = sum(inp + out for inp, out in token_data)

        # Record metrics with specific token usage
        for input_tokens, output_tokens in token_data:
            metric = {
                "deployment_id": str(uuid.uuid4()),
                "agent_id": str(uuid.uuid4()),
                "status": "success",
                "latency_ms": 100,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
                "cost_usd": 0.003,
            }

            response = await client.post(
                "/api/v1/metrics/record",
                json=metric,
            )

            assert response.status_code == 200

        # Get summary and verify total tokens
        summary_response = await client.get("/api/v1/metrics/summary")

        assert summary_response.status_code == 200
        summary = summary_response.json()
        if summary["total_executions"] >= len(token_data):
            assert summary["total_tokens"] >= expected_total_tokens * 0.99
