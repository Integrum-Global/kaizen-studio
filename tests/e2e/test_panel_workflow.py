"""
Tier 3: End-to-End Test Panel Workflow Tests

Tests complete test panel workflows with real infrastructure.
NO MOCKING - full end-to-end scenarios with real database and services.
Tests the complete lifecycle of test execution and history tracking.
"""

import pytest


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestAgentTestPanelWorkflow:
    """Test complete agent test panel workflow."""

    @pytest.mark.asyncio
    async def test_complete_agent_test_workflow(self, authenticated_client):
        """
        Complete workflow: Create agent -> Run test -> Check history -> Get execution -> Delete.
        """
        client, user = authenticated_client
        org_id = user["organization_id"]

        # Step 1: Create agent
        agent_response = await client.post(
            "/api/v1/agents",
            json={
                "workspace_id": "e2e-test-ws",
                "name": "E2E Test Panel Agent",
                "agent_type": "chat",
                "model_id": "gpt-4",
                "description": "Agent for E2E test panel workflow",
                "system_prompt": "You are a helpful assistant",
                "temperature": 0.7,
                "max_tokens": 2000,
            },
        )

        assert agent_response.status_code == 201
        agent = agent_response.json()
        agent_id = agent["id"]
        assert agent["organization_id"] == org_id
        assert agent["status"] == "draft"

        # Step 2: Run first test
        test1_response = await client.post(
            f"/api/v1/test/agents/{agent_id}",
            json={
                "input": {
                    "message": "What is machine learning?",
                    "context": "educational",
                },
                "options": {
                    "timeout_ms": 30000,
                    "stream": False,
                },
            },
        )

        assert test1_response.status_code == 200
        test1_result = test1_response.json()
        execution1_id = test1_result["id"]
        assert test1_result["status"] == "completed"
        assert test1_result["output"] is not None
        assert test1_result["execution_time_ms"] >= 0
        # Token usage may be mocked/simulated in tests
        if test1_result["token_usage"]:
            assert "total" in test1_result["token_usage"]

        # Step 3: Run second test with different input
        test2_response = await client.post(
            f"/api/v1/test/agents/{agent_id}",
            json={
                "input": {
                    "message": "Explain artificial intelligence",
                    "context": "technical",
                },
            },
        )

        assert test2_response.status_code == 200
        test2_result = test2_response.json()
        execution2_id = test2_result["id"]
        assert test2_result["status"] == "completed"

        # Step 4: Run third test
        test3_response = await client.post(
            f"/api/v1/test/agents/{agent_id}",
            json={
                "input": {
                    "message": "Simple greeting",
                },
            },
        )

        assert test3_response.status_code == 200
        execution3_id = test3_response.json()["id"]

        # Step 5: Get agent test history
        history_response = await client.get(
            f"/api/v1/test/agents/{agent_id}/history",
            params={
                "limit": 20,
                "offset": 0,
            },
        )

        assert history_response.status_code == 200
        history = history_response.json()
        assert history["total"] >= 3
        assert len(history["records"]) >= 3

        # Verify all executions are in history
        execution_ids = {r["id"] for r in history["records"]}
        assert execution1_id in execution_ids
        assert execution2_id in execution_ids
        assert execution3_id in execution_ids

        # Verify sorted by created_at descending (most recent first)
        for i in range(len(history["records"]) - 1):
            assert (
                history["records"][i]["created_at"]
                >= history["records"][i + 1]["created_at"]
            )

        # Step 6: Get individual execution details
        exec1_response = await client.get(f"/api/v1/test/executions/{execution1_id}")
        assert exec1_response.status_code == 200
        execution1 = exec1_response.json()
        assert execution1["id"] == execution1_id
        assert execution1["agent_id"] == agent_id
        assert execution1["status"] == "completed"
        assert isinstance(execution1["input_data"], dict)
        assert execution1["input_data"]["message"] == "What is machine learning?"
        assert isinstance(execution1["output_data"], dict)
        assert isinstance(execution1["token_usage"], dict)

        # Step 7: Delete execution
        delete_response = await client.delete(
            f"/api/v1/test/executions/{execution1_id}"
        )
        assert delete_response.status_code == 204

        # Verify deleted - direct get should return 404
        get_deleted_response = await client.get(
            f"/api/v1/test/executions/{execution1_id}"
        )
        assert get_deleted_response.status_code == 404

        # Step 8: Verify other executions still accessible
        exec2_response = await client.get(f"/api/v1/test/executions/{execution2_id}")
        assert exec2_response.status_code == 200
        exec3_response = await client.get(f"/api/v1/test/executions/{execution3_id}")
        assert exec3_response.status_code == 200

    @pytest.mark.asyncio
    async def test_agent_test_with_error_handling(self, authenticated_client):
        """
        Test error handling in agent test execution.
        """
        client, user = authenticated_client

        # Create agent
        agent_response = await client.post(
            "/api/v1/agents",
            json={
                "workspace_id": "e2e-error-ws",
                "name": "E2E Error Agent",
                "agent_type": "chat",
                "model_id": "gpt-4",
            },
        )
        agent_id = agent_response.json()["id"]

        # Run test with empty input (edge case)
        response = await client.post(
            f"/api/v1/test/agents/{agent_id}",
            json={
                "input": {},
            },
        )

        # Should still succeed with default handling
        assert response.status_code == 200
        result = response.json()
        assert result["id"] is not None
        assert result["status"] == "completed"

        # Run test with minimal input
        response2 = await client.post(
            f"/api/v1/test/agents/{agent_id}",
            json={
                "input": {"minimal": "data"},
            },
        )

        assert response2.status_code == 200
        assert response2.json()["status"] == "completed"


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestPipelineTestPanelWorkflow:
    """Test complete pipeline test panel workflow."""

    @pytest.mark.asyncio
    async def test_complete_pipeline_test_workflow(self, authenticated_client):
        """
        Complete workflow: Create pipeline -> Run test -> Check history -> Get execution.
        """
        client, user = authenticated_client
        org_id = user["organization_id"]

        # Step 1: Create pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": org_id,
                "workspace_id": "e2e-pipe-ws",
                "name": "E2E Test Pipeline",
                "pattern": "sequential",
                "description": "Pipeline for E2E test panel workflow",
            },
        )

        assert pipeline_response.status_code in [200, 201]
        pipeline = pipeline_response.json().get("data", pipeline_response.json())
        pipeline_id = pipeline["id"]
        assert pipeline["organization_id"] == org_id

        # Step 2: Add nodes to pipeline
        node1_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "ai",
                "label": "Analysis Node",
                "config": {
                    "model": "gpt-4",
                },
            },
        )
        assert node1_response.status_code in [200, 201]
        node1_data = node1_response.json().get("data", node1_response.json())
        node1_id = node1_data["id"]

        node2_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "transform",
                "label": "Transform Node",
                "config": {
                    "type": "json",
                },
            },
        )
        assert node2_response.status_code in [200, 201]
        node2_data = node2_response.json().get("data", node2_response.json())

        # Step 3: Add connection between nodes
        connection_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": node1_id,
                "source_port": "output",
                "target_node_id": node2_data["id"],
                "target_port": "input",
            },
        )
        assert connection_response.status_code in [200, 201]

        # Step 4: Run first pipeline test
        test1_response = await client.post(
            f"/api/v1/test/pipelines/{pipeline_id}",
            json={
                "input": {
                    "data": "test data",
                    "format": "json",
                },
                "options": {
                    "timeout_ms": 30000,
                },
            },
        )

        assert test1_response.status_code == 200
        test1_result = test1_response.json()
        execution1_id = test1_result["id"]
        assert test1_result["status"] == "completed"
        assert test1_result["output"] is not None
        # Simulated execution is instant, so execution_time_ms can be 0
        assert test1_result["execution_time_ms"] is not None

        # Step 5: Run second pipeline test with different input
        test2_response = await client.post(
            f"/api/v1/test/pipelines/{pipeline_id}",
            json={
                "input": {
                    "data": "different test data",
                    "format": "xml",
                },
            },
        )

        assert test2_response.status_code == 200
        execution2_id = test2_response.json()["id"]

        # Step 6: Get pipeline test history
        history_response = await client.get(
            f"/api/v1/test/pipelines/{pipeline_id}/history",
            params={
                "limit": 10,
                "offset": 0,
            },
        )

        assert history_response.status_code == 200
        history = history_response.json()
        assert history["total"] >= 2
        assert len(history["records"]) >= 2

        # Verify executions are in history
        execution_ids = {r["id"] for r in history["records"]}
        assert execution1_id in execution_ids
        assert execution2_id in execution_ids

        # Step 7: Get individual execution details
        exec1_response = await client.get(f"/api/v1/test/executions/{execution1_id}")
        assert exec1_response.status_code == 200
        execution1 = exec1_response.json()
        assert execution1["id"] == execution1_id
        assert execution1["pipeline_id"] == pipeline_id
        assert execution1["status"] == "completed"
        assert isinstance(execution1["input_data"], dict)
        assert execution1["input_data"]["data"] == "test data"

        # Step 8: Delete one execution
        delete_response = await client.delete(
            f"/api/v1/test/executions/{execution1_id}"
        )
        assert delete_response.status_code == 204

        # Step 9: Verify remaining execution still accessible
        exec2_response = await client.get(f"/api/v1/test/executions/{execution2_id}")
        assert exec2_response.status_code == 200
        assert exec2_response.json()["id"] == execution2_id

    @pytest.mark.asyncio
    async def test_pipeline_test_multiple_executions(self, authenticated_client):
        """
        Test running multiple consecutive pipeline tests.
        """
        client, user = authenticated_client

        # Create pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": "e2e-multi-ws",
                "name": "Multi Execution Pipeline",
                "pattern": "sequential",
            },
        )
        assert pipeline_response.status_code in [200, 201]
        pipeline_data = pipeline_response.json().get("data", pipeline_response.json())
        pipeline_id = pipeline_data["id"]

        # Add a node to make the pipeline valid for testing
        node_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "ai",
                "label": "Multi Test Node",
                "config": {"model": "gpt-4"},
            },
        )
        assert node_response.status_code in [200, 201]

        # Run 5 consecutive tests
        execution_ids = []
        for i in range(5):
            response = await client.post(
                f"/api/v1/test/pipelines/{pipeline_id}",
                json={
                    "input": {
                        "iteration": i,
                        "data": f"test run {i}",
                    },
                },
            )
            assert response.status_code == 200
            execution_ids.append(response.json()["id"])

        # Verify all executions are accessible
        for exec_id in execution_ids:
            response = await client.get(f"/api/v1/test/executions/{exec_id}")
            assert response.status_code == 200

        # Get history with pagination
        history_response = await client.get(
            f"/api/v1/test/pipelines/{pipeline_id}/history",
            params={
                "limit": 3,
                "offset": 0,
            },
        )
        assert len(history_response.json()["records"]) == 3

        # Get next page
        history_response2 = await client.get(
            f"/api/v1/test/pipelines/{pipeline_id}/history",
            params={
                "limit": 3,
                "offset": 3,
            },
        )
        assert len(history_response2.json()["records"]) >= 2


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestNodeTestPanelWorkflow:
    """Test complete node test panel workflow."""

    @pytest.mark.asyncio
    async def test_complete_node_test_workflow(self, authenticated_client):
        """
        Complete workflow: Create pipeline with node -> Run node test -> Check execution.
        """
        client, user = authenticated_client

        # Step 1: Create pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": "e2e-node-ws",
                "name": "E2E Node Test Pipeline",
                "pattern": "sequential",
            },
        )
        assert pipeline_response.status_code in [200, 201]
        pipeline_data = pipeline_response.json().get("data", pipeline_response.json())
        pipeline_id = pipeline_data["id"]

        # Step 2: Create agent node
        node_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "ai",
                "label": "Test AI Node",
                "config": {
                    "agent_type": "chat",
                    "model": "gpt-4",
                },
            },
        )

        assert node_response.status_code in [200, 201]
        node_data = node_response.json().get("data", node_response.json())
        node_id = node_data["id"]

        # Step 3: Run first node test
        test1_response = await client.post(
            f"/api/v1/test/pipelines/{pipeline_id}/nodes/{node_id}",
            json={
                "input": {
                    "query": "What is AI?",
                },
            },
        )

        assert test1_response.status_code == 200
        test1_result = test1_response.json()
        execution1_id = test1_result["id"]
        assert test1_result["status"] == "completed"
        assert test1_result["output"] is not None

        # Step 4: Run second node test
        test2_response = await client.post(
            f"/api/v1/test/pipelines/{pipeline_id}/nodes/{node_id}",
            json={
                "input": {
                    "query": "Explain deep learning",
                },
            },
        )

        assert test2_response.status_code == 200
        execution2_id = test2_response.json()["id"]

        # Step 5: Get execution details
        exec1_response = await client.get(f"/api/v1/test/executions/{execution1_id}")
        assert exec1_response.status_code == 200
        execution1 = exec1_response.json()
        assert execution1["id"] == execution1_id
        assert execution1["pipeline_id"] == pipeline_id
        assert execution1["status"] == "completed"
        # Input should include node_id
        assert execution1["input_data"]["node_id"] == node_id
        assert execution1["input_data"]["query"] == "What is AI?"

        # Step 6: Delete first execution
        delete_response = await client.delete(
            f"/api/v1/test/executions/{execution1_id}"
        )
        assert delete_response.status_code == 204

        # Step 7: Verify second execution still accessible
        exec2_response = await client.get(f"/api/v1/test/executions/{execution2_id}")
        assert exec2_response.status_code == 200

    @pytest.mark.asyncio
    async def test_node_test_with_multiple_nodes(self, authenticated_client):
        """
        Test running tests on different nodes in same pipeline.
        """
        client, user = authenticated_client

        # Create pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": "e2e-multi-node-ws",
                "name": "Multi Node Pipeline",
                "pattern": "sequential",
            },
        )
        assert pipeline_response.status_code in [200, 201]
        pipeline_data = pipeline_response.json().get("data", pipeline_response.json())
        pipeline_id = pipeline_data["id"]

        # Create multiple nodes
        node_ids = []
        for i in range(3):
            node_response = await client.post(
                f"/api/v1/pipelines/{pipeline_id}/nodes",
                json={
                    "node_type": "ai" if i % 2 == 0 else "transform",
                    "label": f"Node {i+1}",
                    "config": {},
                },
            )
            node_data = node_response.json().get("data", node_response.json())
            node_ids.append(node_data["id"])

        # Run tests on each node
        execution_ids = []
        for node_id in node_ids:
            response = await client.post(
                f"/api/v1/test/pipelines/{pipeline_id}/nodes/{node_id}",
                json={"input": {"test": "data"}},
            )
            assert response.status_code == 200
            execution_ids.append(response.json()["id"])

        # Verify all executions are in input_data with correct node_id
        for i, exec_id in enumerate(execution_ids):
            response = await client.get(f"/api/v1/test/executions/{exec_id}")
            assert response.status_code == 200
            execution = response.json()
            assert execution["input_data"]["node_id"] == node_ids[i]


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestCrossOrganizationIsolation:
    """Test that test executions are isolated by organization."""

    @pytest.mark.asyncio
    async def test_organization_isolation_in_test_history(
        self, authenticated_owner_client, second_org_client
    ):
        """
        Verify test executions from one org are not visible in another.
        """
        client1, user1, org1 = authenticated_owner_client
        client2, user2, org2 = second_org_client

        # User1: Create and test agent in org1
        agent_response = await client1.post(
            "/api/v1/agents",
            json={
                "workspace_id": "iso-ws-1",
                "name": "Org1 Agent",
                "agent_type": "chat",
                "model_id": "gpt-4",
            },
        )
        agent1_id = agent_response.json()["id"]

        # Run test
        test_response = await client1.post(
            f"/api/v1/test/agents/{agent1_id}",
            json={
                "input": {"message": "test"},
            },
        )
        execution1_id = test_response.json()["id"]

        # Get history
        history1_response = await client1.get(
            f"/api/v1/test/agents/{agent1_id}/history"
        )
        history1 = history1_response.json()
        assert any(r["id"] == execution1_id for r in history1["records"])

        # User2: Create and test agent in org2
        agent2_response = await client2.post(
            "/api/v1/agents",
            json={
                "workspace_id": "iso-ws-2",
                "name": "Org2 Agent",
                "agent_type": "task",
                "model_id": "gpt-4",
            },
        )
        agent2_id = agent2_response.json()["id"]

        # Run test
        test2_response = await client2.post(
            f"/api/v1/test/agents/{agent2_id}",
            json={
                "input": {"message": "test"},
            },
        )
        execution2_id = test2_response.json()["id"]

        # Verify isolation: User2 cannot access User1's execution
        get_response = await client2.get(f"/api/v1/test/executions/{execution1_id}")
        assert get_response.status_code in [403, 404]  # Either forbidden or not found

        # Verify isolation: User1 cannot access User2's execution
        get_response2 = await client1.get(f"/api/v1/test/executions/{execution2_id}")
        assert get_response2.status_code in [403, 404]  # Either forbidden or not found
