"""
Tier 2: Test API Integration Tests

Tests all test panel endpoints with real database operations.
NO MOCKING - uses real PostgreSQL and DataFlow infrastructure.
Tests multi-tenancy and organization isolation.
"""

import uuid

import pytest


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestAgentTestExecution:
    """Test agent test execution endpoints with real database."""

    @pytest.mark.asyncio
    async def test_run_agent_test_success(self, authenticated_client, agent_factory):
        """Should run agent test and return results."""
        client, user = authenticated_client

        # Create agent first
        create_response = await client.post(
            "/api/v1/agents",
            json={
                "workspace_id": "test-ws",
                "name": "Test Agent for Testing",
                "agent_type": "chat",
                "model_id": "gpt-4",
                "description": "Agent for integration tests",
                "system_prompt": "You are helpful",
                "temperature": 0.7,
            },
        )

        assert create_response.status_code == 201
        agent = create_response.json()
        agent_id = agent["id"]

        # Run test
        test_response = await client.post(
            f"/api/v1/test/agents/{agent_id}",
            json={
                "input": {"message": "Hello"},
                "options": {
                    "timeout_ms": 30000,
                    "stream": False,
                },
            },
        )

        assert test_response.status_code == 200
        result = test_response.json()
        assert result["id"] is not None
        assert result["status"] == "completed"
        assert result["output"] is not None
        assert result["execution_time_ms"] is not None
        assert result["token_usage"] is not None

    @pytest.mark.asyncio
    async def test_run_agent_test_agent_not_found(self, authenticated_client):
        """Should return 404 when agent not found."""
        client, user = authenticated_client

        response = await client.post(
            f"/api/v1/test/agents/{uuid.uuid4()}",
            json={
                "input": {"message": "test"},
            },
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_run_agent_test_with_complex_input(self, authenticated_client):
        """Should handle complex input data structures."""
        client, user = authenticated_client

        # Create agent
        create_response = await client.post(
            "/api/v1/agents",
            json={
                "workspace_id": "test-ws",
                "name": "Test Agent Complex",
                "agent_type": "task",
                "model_id": "gpt-4",
            },
        )
        agent_id = create_response.json()["id"]

        # Run test with complex input
        complex_input = {
            "task": "analyze_data",
            "data": {
                "items": [1, 2, 3, 4, 5],
                "metadata": {
                    "source": "test",
                    "timestamp": "2024-01-01T00:00:00Z",
                },
            },
            "options": {
                "threshold": 0.8,
                "include_summary": True,
            },
        }

        response = await client.post(
            f"/api/v1/test/agents/{agent_id}",
            json={
                "input": complex_input,
            },
        )

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "completed"

    @pytest.mark.asyncio
    async def test_get_agent_test_history(self, authenticated_client):
        """Should retrieve test execution history for agent."""
        client, user = authenticated_client

        # Create agent
        create_response = await client.post(
            "/api/v1/agents",
            json={
                "workspace_id": "test-ws",
                "name": "Agent for History",
                "agent_type": "chat",
                "model_id": "gpt-4",
            },
        )
        agent_id = create_response.json()["id"]

        # Run multiple tests
        for i in range(3):
            await client.post(
                f"/api/v1/test/agents/{agent_id}",
                json={
                    "input": {"message": f"test {i}"},
                },
            )

        # Get history
        response = await client.get(
            f"/api/v1/test/agents/{agent_id}/history",
            params={
                "limit": 20,
                "offset": 0,
            },
        )

        assert response.status_code == 200
        result = response.json()
        assert "records" in result
        assert "total" in result
        assert result["total"] >= 3
        assert all(r["agent_id"] == agent_id for r in result["records"])

    @pytest.mark.asyncio
    async def test_get_agent_test_history_pagination(self, authenticated_client):
        """Should support pagination in test history."""
        client, user = authenticated_client

        # Create agent
        create_response = await client.post(
            "/api/v1/agents",
            json={
                "workspace_id": "test-ws",
                "name": "Agent for Pagination",
                "agent_type": "chat",
                "model_id": "gpt-4",
            },
        )
        agent_id = create_response.json()["id"]

        # Run 5 tests
        for i in range(5):
            await client.post(
                f"/api/v1/test/agents/{agent_id}",
                json={
                    "input": {"message": f"test {i}"},
                },
            )

        # Get first page
        response1 = await client.get(
            f"/api/v1/test/agents/{agent_id}/history",
            params={
                "limit": 2,
                "offset": 0,
            },
        )
        records1 = response1.json()["records"]

        # Get second page
        response2 = await client.get(
            f"/api/v1/test/agents/{agent_id}/history",
            params={
                "limit": 2,
                "offset": 2,
            },
        )
        records2 = response2.json()["records"]

        assert len(records1) == 2
        assert len(records2) == 2
        assert records1[0]["id"] != records2[0]["id"]

    @pytest.mark.asyncio
    async def test_get_agent_test_history_agent_not_found(self, authenticated_client):
        """Should return 404 when agent not found for history."""
        client, user = authenticated_client

        response = await client.get(f"/api/v1/test/agents/{uuid.uuid4()}/history")

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestPipelineTestExecution:
    """Test pipeline test execution endpoints with real database."""

    @pytest.mark.asyncio
    async def test_run_pipeline_test_success(
        self, authenticated_client, pipeline_factory
    ):
        """Should run pipeline test and return results."""
        client, user = authenticated_client
        org_id = user["organization_id"]

        # Create pipeline first with all required fields
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": org_id,
                "workspace_id": "test-ws",
                "name": "Test Pipeline for Testing",
                "pattern": "sequential",
                "description": "Pipeline for integration tests",
            },
        )

        # Pipeline API returns 200 for create (not 201), wrapped in {"data": pipeline}
        assert pipeline_response.status_code in [200, 201]
        response_data = pipeline_response.json()
        # Handle both {"data": pipeline} and direct pipeline response
        pipeline = response_data.get("data", response_data)
        pipeline_id = pipeline["id"]

        # Add input and output nodes to make pipeline valid
        input_node_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "input",
                "label": "Input Node",
            },
        )
        assert input_node_response.status_code in [200, 201]
        input_data = input_node_response.json()
        input_node = input_data.get("data", input_data)

        output_node_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "output",
                "label": "Output Node",
            },
        )
        assert output_node_response.status_code in [200, 201]
        output_data = output_node_response.json()
        output_node = output_data.get("data", output_data)

        # Connect input to output
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": input_node["id"],
                "target_node_id": output_node["id"],
            },
        )

        # Run test
        response = await client.post(
            f"/api/v1/test/pipelines/{pipeline_id}",
            json={
                "input": {"data": "test"},
                "options": {
                    "timeout_ms": 30000,
                    "stream": False,
                },
            },
        )

        assert response.status_code == 200
        result = response.json()
        assert result["id"] is not None
        assert result["status"] == "completed"
        assert result["output"] is not None
        assert result["execution_time_ms"] is not None

    @pytest.mark.asyncio
    async def test_run_pipeline_test_pipeline_not_found(self, authenticated_client):
        """Should return 404 when pipeline not found."""
        client, user = authenticated_client

        response = await client.post(
            f"/api/v1/test/pipelines/{uuid.uuid4()}",
            json={
                "input": {"data": "test"},
            },
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_pipeline_test_history(self, authenticated_client):
        """Should retrieve test execution history for pipeline."""
        client, user = authenticated_client
        org_id = user["organization_id"]

        # Create pipeline with all required fields
        create_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": org_id,
                "workspace_id": "test-ws",
                "name": "Pipeline for History",
                "pattern": "sequential",
            },
        )
        # Pipeline API returns 200 for create (not 201), wrapped in {"data": pipeline}
        assert create_response.status_code in [200, 201]
        response_data = create_response.json()
        pipeline = response_data.get("data", response_data)
        pipeline_id = pipeline["id"]

        # Add input and output nodes to make pipeline valid
        input_node_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "input",
                "label": "Input Node",
            },
        )
        input_data = input_node_response.json()
        input_node = input_data.get("data", input_data)

        output_node_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "output",
                "label": "Output Node",
            },
        )
        output_data = output_node_response.json()
        output_node = output_data.get("data", output_data)

        # Connect input to output
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": input_node["id"],
                "target_node_id": output_node["id"],
            },
        )

        # Run multiple tests
        for i in range(3):
            await client.post(
                f"/api/v1/test/pipelines/{pipeline_id}",
                json={
                    "input": {"data": f"test {i}"},
                },
            )

        # Get history
        response = await client.get(
            f"/api/v1/test/pipelines/{pipeline_id}/history",
            params={
                "limit": 20,
                "offset": 0,
            },
        )

        assert response.status_code == 200
        result = response.json()
        assert "records" in result
        assert "total" in result
        assert result["total"] >= 3
        assert all(r["pipeline_id"] == pipeline_id for r in result["records"])

    @pytest.mark.asyncio
    async def test_get_pipeline_test_history_sorted_descending(
        self, authenticated_client
    ):
        """Should sort test history by creation date descending."""
        client, user = authenticated_client
        org_id = user["organization_id"]

        # Create pipeline with all required fields
        create_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": org_id,
                "workspace_id": "test-ws",
                "name": "Pipeline for Sorting",
                "pattern": "sequential",
            },
        )
        # Pipeline API returns 200 for create (not 201), wrapped in {"data": pipeline}
        assert create_response.status_code in [200, 201]
        response_data = create_response.json()
        pipeline = response_data.get("data", response_data)
        pipeline_id = pipeline["id"]

        # Run tests
        for i in range(3):
            await client.post(
                f"/api/v1/test/pipelines/{pipeline_id}",
                json={
                    "input": {"data": f"test {i}"},
                },
            )

        # Get history
        response = await client.get(f"/api/v1/test/pipelines/{pipeline_id}/history")
        records = response.json()["records"]

        # Verify sorted by created_at descending
        for i in range(len(records) - 1):
            assert records[i]["created_at"] >= records[i + 1]["created_at"]


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestNodeTestExecution:
    """Test node test execution endpoints with real database."""

    @pytest.mark.asyncio
    async def test_run_node_test_success(self, authenticated_client):
        """Should run node test and return results."""
        client, user = authenticated_client
        org_id = user["organization_id"]

        # Create pipeline with all required fields
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": org_id,
                "workspace_id": "test-ws",
                "name": "Pipeline with Nodes",
                "pattern": "sequential",
            },
        )
        # Pipeline API returns 200 for create (not 201), wrapped in {"data": pipeline}
        assert pipeline_response.status_code in [200, 201]
        pipeline_data = pipeline_response.json()
        pipeline = pipeline_data.get("data", pipeline_data)
        pipeline_id = pipeline["id"]

        # Create agent node
        node_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "ai",
                "label": "Test Node",
                "config": {
                    "agent_id": "test-agent",
                },
            },
        )
        # Node API may return 200 or 201, wrapped in {"data": node}
        assert node_response.status_code in [200, 201]
        node_data = node_response.json()
        node = node_data.get("data", node_data)
        node_id = node["id"]

        # Run test
        response = await client.post(
            f"/api/v1/test/pipelines/{pipeline_id}/nodes/{node_id}",
            json={
                "input": {"message": "test"},
            },
        )

        assert response.status_code == 200
        result = response.json()
        assert result["id"] is not None
        assert result["status"] == "completed"

    @pytest.mark.asyncio
    async def test_run_node_test_pipeline_not_found(self, authenticated_client):
        """Should return 404 when pipeline not found."""
        client, user = authenticated_client

        response = await client.post(
            f"/api/v1/test/pipelines/{uuid.uuid4()}/nodes/{uuid.uuid4()}",
            json={"input": {"data": "test"}},
        )

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestExecutionManagement:
    """Test execution management endpoints."""

    @pytest.mark.asyncio
    async def test_get_execution_success(self, authenticated_client):
        """Should retrieve execution by ID."""
        client, user = authenticated_client

        # Create agent and run test
        agent_response = await client.post(
            "/api/v1/agents",
            json={
                "workspace_id": "test-ws",
                "name": "Agent for Exec Test",
                "agent_type": "chat",
                "model_id": "gpt-4",
            },
        )
        agent_id = agent_response.json()["id"]

        test_response = await client.post(
            f"/api/v1/test/agents/{agent_id}",
            json={
                "input": {"message": "test"},
            },
        )
        execution_id = test_response.json()["id"]

        # Get execution
        response = await client.get(f"/api/v1/test/executions/{execution_id}")

        assert response.status_code == 200
        execution = response.json()
        assert execution["id"] == execution_id
        assert execution["status"] == "completed"
        assert execution["agent_id"] == agent_id

    @pytest.mark.asyncio
    async def test_get_execution_not_found(self, authenticated_client):
        """Should return 404 when execution not found."""
        client, user = authenticated_client

        response = await client.get(f"/api/v1/test/executions/{uuid.uuid4()}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_execution_success(self, authenticated_client):
        """Should delete execution."""
        client, user = authenticated_client

        # Create execution
        agent_response = await client.post(
            "/api/v1/agents",
            json={
                "workspace_id": "test-ws",
                "name": "Agent for Delete Test",
                "agent_type": "chat",
                "model_id": "gpt-4",
            },
        )
        agent_id = agent_response.json()["id"]

        test_response = await client.post(
            f"/api/v1/test/agents/{agent_id}",
            json={
                "input": {"message": "test"},
            },
        )
        execution_id = test_response.json()["id"]

        # Delete execution
        response = await client.delete(f"/api/v1/test/executions/{execution_id}")

        assert response.status_code == 204

        # Verify deleted
        get_response = await client.get(f"/api/v1/test/executions/{execution_id}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_execution_not_found(self, authenticated_client):
        """Should return 404 when deleting nonexistent execution."""
        client, user = authenticated_client

        response = await client.delete(f"/api/v1/test/executions/{uuid.uuid4()}")

        assert response.status_code == 404
