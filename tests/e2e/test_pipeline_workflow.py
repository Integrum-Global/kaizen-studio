"""
Tier 3: Pipeline Workflow End-to-End Tests

Tests complete pipeline lifecycle with real infrastructure and workflows.
Validates all orchestration patterns (sequential, parallel, router, supervisor, ensemble).

Test Coverage:
- Complete pipeline creation and lifecycle
- Graph construction and modification
- Pattern-specific workflows (sequential, parallel, router, supervisor, ensemble)
- Validation and error scenarios
- Real database and service integration
"""

import uuid

import pytest


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestSequentialPipelineWorkflow:
    """Test sequential orchestration pattern workflow."""

    async def test_create_sequential_pipeline_with_three_agents(
        self, authenticated_client
    ):
        """Should create and execute sequential pipeline: agent1 -> agent2 -> agent3."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # Step 1: Create sequential pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
                "name": "Sequential Processing Pipeline",
                "pattern": "sequential",
                "description": "Processes data through three agents in sequence",
            },
        )
        assert pipeline_response.status_code == 200
        pipeline = pipeline_response.json()["data"]
        pipeline_id = pipeline["id"]
        assert pipeline["pattern"] == "sequential"
        assert pipeline["status"] == "draft"

        # Step 2: Create input node
        input_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "input",
                "label": "DataInput",
                "position_x": 0.0,
                "position_y": 0.0,
            },
        )
        assert input_response.status_code == 200
        input_node = input_response.json()["data"]
        input_id = input_node["id"]

        # Step 3: Create three agent nodes
        agent_ids = []
        for i in range(3):
            agent_response = await client.post(
                f"/api/v1/pipelines/{pipeline_id}/nodes",
                json={
                    "node_type": "agent",
                    "agent_id": str(uuid.uuid4()),
                    "label": f"Agent{i+1}",
                    "position_x": float((i + 1) * 100),
                    "position_y": 100.0,
                    "config": {"timeout": 30, "retries": 1},
                },
            )
            assert agent_response.status_code == 200
            agent_ids.append(agent_response.json()["data"]["id"])

        # Step 4: Create output node
        output_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "output",
                "label": "Result",
                "position_x": 400.0,
                "position_y": 100.0,
            },
        )
        assert output_response.status_code == 200
        output_id = output_response.json()["data"]["id"]

        # Step 5: Create connections in sequence
        connection_ids = []

        # Input -> Agent1
        conn1_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": input_id,
                "target_node_id": agent_ids[0],
                "source_handle": "output",
                "target_handle": "input",
            },
        )
        assert conn1_response.status_code == 200
        connection_ids.append(conn1_response.json()["data"]["id"])

        # Agent1 -> Agent2
        conn2_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": agent_ids[0],
                "target_node_id": agent_ids[1],
            },
        )
        assert conn2_response.status_code == 200
        connection_ids.append(conn2_response.json()["data"]["id"])

        # Agent2 -> Agent3
        conn3_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": agent_ids[1],
                "target_node_id": agent_ids[2],
            },
        )
        assert conn3_response.status_code == 200
        connection_ids.append(conn3_response.json()["data"]["id"])

        # Agent3 -> Output
        conn4_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": agent_ids[2],
                "target_node_id": output_id,
            },
        )
        assert conn4_response.status_code == 200
        connection_ids.append(conn4_response.json()["data"]["id"])

        # Step 6: Validate pipeline
        validate_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/validate",
        )
        assert validate_response.status_code == 200
        validation = validate_response.json()["data"]
        assert validation["valid"] is True

        # Step 7: Retrieve complete pipeline with graph
        get_response = await client.get(f"/api/v1/pipelines/{pipeline_id}")
        assert get_response.status_code == 200
        complete_pipeline = get_response.json()["data"]

        # Verify all nodes present
        assert len(complete_pipeline["nodes"]) == 5  # input + 3 agents + output
        assert len(complete_pipeline["connections"]) == 4

        # Step 8: Activate pipeline
        activate_response = await client.put(
            f"/api/v1/pipelines/{pipeline_id}", json={"status": "active"}
        )
        assert activate_response.status_code == 200
        activated = activate_response.json()["data"]
        assert activated["status"] == "active"

    async def test_modify_sequential_pipeline(self, authenticated_client):
        """Should allow modifying sequential pipeline by adding/removing nodes."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # Create pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
                "name": "Modifiable Pipeline",
                "pattern": "sequential",
            },
        )
        pipeline_id = pipeline_response.json()["data"]["id"]

        # Add initial nodes
        node1 = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={"node_type": "input", "label": "Input"},
        )
        node1_id = node1.json()["data"]["id"]

        node2 = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "agent",
                "agent_id": str(uuid.uuid4()),
                "label": "Agent1",
            },
        )
        node2_id = node2.json()["data"]["id"]

        # Verify nodes exist
        list_response = await client.get(f"/api/v1/pipelines/{pipeline_id}/nodes")
        assert len(list_response.json()["data"]) == 2

        # Add another agent between input and first agent
        node3 = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "agent",
                "agent_id": str(uuid.uuid4()),
                "label": "Agent1.5",
                "position_x": 50.0,
            },
        )
        assert node3.status_code == 200, f"Node3 creation failed: {node3.json()}"
        node3_data = node3.json()["data"]
        assert node3_data.get("id"), f"Node3 has no ID: {node3_data}"
        assert (
            node3_data.get("label") == "Agent1.5"
        ), f"Node3 has wrong label: {node3_data}"
        node3_id = node3_data["id"]

        # Update first agent's label
        update_response = await client.put(
            f"/api/v1/pipelines/{pipeline_id}/nodes/{node2_id}",
            json={"label": "Updated Agent1"},
        )
        assert update_response.status_code == 200
        updated = update_response.json()["data"]
        assert updated["label"] == "Updated Agent1"

        # Remove the middle agent
        delete_response = await client.delete(
            f"/api/v1/pipelines/{pipeline_id}/nodes/{node3_id}",
        )
        assert delete_response.status_code == 200
        # Deletion returns success - node is removed from pipeline


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestParallelPipelineWorkflow:
    """Test parallel orchestration pattern workflow."""

    async def test_create_parallel_pipeline_with_multiple_agents(
        self, authenticated_client
    ):
        """Should create parallel pipeline with multiple agents executing simultaneously."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # Create parallel pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
                "name": "Parallel Processing Pipeline",
                "pattern": "parallel",
                "description": "Multiple agents process data in parallel",
            },
        )
        pipeline_id = pipeline_response.json()["data"]["id"]

        # Create input node
        input_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "input",
                "label": "Input",
                "position_x": 0.0,
                "position_y": 0.0,
            },
        )
        input_id = input_response.json()["data"]["id"]

        # Create multiple parallel agents
        agent_ids = []
        for i in range(3):
            agent_response = await client.post(
                f"/api/v1/pipelines/{pipeline_id}/nodes",
                json={
                    "node_type": "agent",
                    "agent_id": str(uuid.uuid4()),
                    "label": f"ParallelAgent{i+1}",
                    "position_x": float(i * 100),
                    "position_y": 150.0,
                },
            )
            agent_ids.append(agent_response.json()["data"]["id"])

        # Create merge node
        merge_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "merge",
                "label": "MergeResults",
                "position_x": 150.0,
                "position_y": 300.0,
            },
        )
        merge_id = merge_response.json()["data"]["id"]

        # Create output node
        output_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "output",
                "label": "Output",
                "position_x": 150.0,
                "position_y": 450.0,
            },
        )
        output_id = output_response.json()["data"]["id"]

        # Connect input to all agents (parallel connections)
        for agent_id in agent_ids:
            await client.post(
                f"/api/v1/pipelines/{pipeline_id}/connections",
                json={
                    "source_node_id": input_id,
                    "target_node_id": agent_id,
                },
            )

        # Connect all agents to merge node
        for agent_id in agent_ids:
            await client.post(
                f"/api/v1/pipelines/{pipeline_id}/connections",
                json={
                    "source_node_id": agent_id,
                    "target_node_id": merge_id,
                },
            )

        # Connect merge to output
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": merge_id,
                "target_node_id": output_id,
            },
        )

        # Validate
        validate_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/validate",
        )
        assert validate_response.status_code == 200
        assert validate_response.json()["data"]["valid"] is True


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestRouterPipelineWorkflow:
    """Test router (conditional routing) orchestration pattern."""

    async def test_create_router_pipeline_with_conditional_paths(
        self, authenticated_client
    ):
        """Should create router pipeline with conditional routing."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # Create router pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
                "name": "Router Pipeline",
                "pattern": "router",
                "description": "Routes to different agents based on conditions",
            },
        )
        pipeline_id = pipeline_response.json()["data"]["id"]

        # Create input
        input_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "input",
                "label": "Input",
                "position_x": 0.0,
                "position_y": 0.0,
            },
        )
        input_id = input_response.json()["data"]["id"]

        # Create router/condition node
        router_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "condition",
                "label": "Router",
                "position_x": 100.0,
                "position_y": 0.0,
                "config": {
                    "conditions": [
                        {"field": "type", "operator": "equals", "value": "typeA"},
                        {"field": "type", "operator": "equals", "value": "typeB"},
                    ]
                },
            },
        )
        router_id = router_response.json()["data"]["id"]

        # Create agent for path A
        agentA_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "agent",
                "agent_id": str(uuid.uuid4()),
                "label": "AgentA",
                "position_x": 200.0,
                "position_y": -50.0,
            },
        )
        agentA_id = agentA_response.json()["data"]["id"]

        # Create agent for path B
        agentB_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "agent",
                "agent_id": str(uuid.uuid4()),
                "label": "AgentB",
                "position_x": 200.0,
                "position_y": 50.0,
            },
        )
        agentB_id = agentB_response.json()["data"]["id"]

        # Create merge node
        merge_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "merge",
                "label": "Merge",
                "position_x": 300.0,
                "position_y": 0.0,
            },
        )
        merge_id = merge_response.json()["data"]["id"]

        # Create output
        output_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "output",
                "label": "Output",
                "position_x": 400.0,
                "position_y": 0.0,
            },
        )
        output_id = output_response.json()["data"]["id"]

        # Create connections
        # Input -> Router
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": input_id,
                "target_node_id": router_id,
            },
        )

        # Router -> AgentA (condition: typeA)
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": router_id,
                "target_node_id": agentA_id,
                "condition": {"type": "equals", "value": "typeA"},
            },
        )

        # Router -> AgentB (condition: typeB)
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": router_id,
                "target_node_id": agentB_id,
                "condition": {"type": "equals", "value": "typeB"},
            },
        )

        # AgentA -> Merge
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": agentA_id,
                "target_node_id": merge_id,
            },
        )

        # AgentB -> Merge
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": agentB_id,
                "target_node_id": merge_id,
            },
        )

        # Merge -> Output
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": merge_id,
                "target_node_id": output_id,
            },
        )

        # Validate pipeline
        validate_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/validate",
        )
        assert validate_response.status_code == 200
        assert validate_response.json()["data"]["valid"] is True


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestSupervisorPipelineWorkflow:
    """Test supervisor orchestration pattern."""

    async def test_create_supervisor_pipeline(self, authenticated_client):
        """Should create supervisor pipeline with supervisor delegating to workers."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # Create supervisor pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
                "name": "Supervisor Pipeline",
                "pattern": "supervisor",
                "description": "Supervisor coordinates worker agents",
            },
        )
        pipeline_id = pipeline_response.json()["data"]["id"]

        # Create input
        input_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "input",
                "label": "Input",
            },
        )
        input_id = input_response.json()["data"]["id"]

        # Create supervisor agent
        supervisor_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "agent",
                "agent_id": str(uuid.uuid4()),
                "label": "Supervisor",
                "config": {"role": "supervisor"},
            },
        )
        supervisor_id = supervisor_response.json()["data"]["id"]

        # Create worker agents
        worker_ids = []
        for i in range(3):
            worker_response = await client.post(
                f"/api/v1/pipelines/{pipeline_id}/nodes",
                json={
                    "node_type": "agent",
                    "agent_id": str(uuid.uuid4()),
                    "label": f"Worker{i+1}",
                    "config": {"role": "worker"},
                },
            )
            worker_ids.append(worker_response.json()["data"]["id"])

        # Create output
        output_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "output",
                "label": "Output",
            },
        )
        output_id = output_response.json()["data"]["id"]

        # Create connections
        # Input -> Supervisor
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": input_id,
                "target_node_id": supervisor_id,
            },
        )

        # Supervisor -> Workers
        for worker_id in worker_ids:
            await client.post(
                f"/api/v1/pipelines/{pipeline_id}/connections",
                json={
                    "source_node_id": supervisor_id,
                    "target_node_id": worker_id,
                },
            )

        # Workers -> Output (supervisor aggregates)
        for worker_id in worker_ids:
            await client.post(
                f"/api/v1/pipelines/{pipeline_id}/connections",
                json={
                    "source_node_id": worker_id,
                    "target_node_id": output_id,
                },
            )

        # Validate
        validate_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/validate",
        )
        assert validate_response.status_code == 200
        assert validate_response.json()["data"]["valid"] is True


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestEnsemblePipelineWorkflow:
    """Test ensemble (voting) orchestration pattern."""

    async def test_create_ensemble_pipeline(self, authenticated_client):
        """Should create ensemble pipeline where multiple agents vote."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # Create ensemble pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
                "name": "Ensemble Pipeline",
                "pattern": "ensemble",
                "description": "Multiple agents vote on output",
            },
        )
        pipeline_id = pipeline_response.json()["data"]["id"]

        # Create input
        input_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "input",
                "label": "Input",
            },
        )
        input_id = input_response.json()["data"]["id"]

        # Create ensemble agents
        agent_ids = []
        for i in range(3):
            agent_response = await client.post(
                f"/api/v1/pipelines/{pipeline_id}/nodes",
                json={
                    "node_type": "agent",
                    "agent_id": str(uuid.uuid4()),
                    "label": f"EnsembleAgent{i+1}",
                },
            )
            agent_ids.append(agent_response.json()["data"]["id"])

        # Create aggregator node (for voting)
        aggregator_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "merge",
                "label": "VotingAggregator",
                "config": {"aggregation": "voting"},
            },
        )
        aggregator_id = aggregator_response.json()["data"]["id"]

        # Create output
        output_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "output",
                "label": "Output",
            },
        )
        output_id = output_response.json()["data"]["id"]

        # Create connections
        # Input -> All agents
        for agent_id in agent_ids:
            await client.post(
                f"/api/v1/pipelines/{pipeline_id}/connections",
                json={
                    "source_node_id": input_id,
                    "target_node_id": agent_id,
                },
            )

        # All agents -> Aggregator
        for agent_id in agent_ids:
            await client.post(
                f"/api/v1/pipelines/{pipeline_id}/connections",
                json={
                    "source_node_id": agent_id,
                    "target_node_id": aggregator_id,
                },
            )

        # Aggregator -> Output
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": aggregator_id,
                "target_node_id": output_id,
            },
        )

        # Validate
        validate_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/validate",
        )
        assert validate_response.status_code == 200
        assert validate_response.json()["data"]["valid"] is True


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestPipelineValidationErrors:
    """Test pipeline validation error detection."""

    async def test_validate_rejects_empty_pipeline(self, authenticated_client):
        """Should reject pipeline with no nodes."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # Create empty pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
                "name": "Empty Pipeline",
                "pattern": "sequential",
            },
        )
        pipeline_id = pipeline_response.json()["data"]["id"]

        # Validate empty pipeline
        validate_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/validate",
        )
        assert validate_response.status_code == 200
        result = validate_response.json()["data"]
        assert result["valid"] is False
        assert any("no nodes" in e.lower() for e in result["errors"])

    async def test_validate_rejects_agent_without_agent_id(self, authenticated_client):
        """Should reject agent node without agent_id."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # Create pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
                "name": "Invalid Pipeline",
                "pattern": "sequential",
            },
        )
        pipeline_id = pipeline_response.json()["data"]["id"]

        # Create agent without agent_id
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "agent",
                "agent_id": "",
                "label": "InvalidAgent",
            },
        )

        # Validate
        validate_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/validate",
        )
        assert validate_response.status_code == 200
        result = validate_response.json()["data"]
        assert result["valid"] is False
        assert any("agent" in e.lower() for e in result["errors"])

    async def test_validate_detects_invalid_connection_references(
        self, authenticated_client
    ):
        """Should detect connection referencing non-existent nodes."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # Create pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
                "name": "Invalid Connection Pipeline",
                "pattern": "sequential",
            },
        )
        pipeline_id = pipeline_response.json()["data"]["id"]

        # Create one node
        node_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "agent",
                "agent_id": str(uuid.uuid4()),
                "label": "Agent",
            },
        )
        node_id = node_response.json()["data"]["id"]

        # Create connection to non-existent node
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": node_id,
                "target_node_id": str(uuid.uuid4()),
            },
        )

        # Validate
        validate_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/validate",
        )
        assert validate_response.status_code == 200
        result = validate_response.json()["data"]
        assert result["valid"] is False

    async def test_validate_warns_missing_input_output(self, authenticated_client):
        """Should warn if pipeline missing input or output nodes."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # Create pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
                "name": "Missing IO Pipeline",
                "pattern": "sequential",
            },
        )
        pipeline_id = pipeline_response.json()["data"]["id"]

        # Create only agent (no input/output)
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "agent",
                "agent_id": str(uuid.uuid4()),
                "label": "OnlyAgent",
            },
        )

        # Validate
        validate_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/validate",
        )
        assert validate_response.status_code == 200
        result = validate_response.json()["data"]
        # Should be valid (no errors) but have warnings
        assert any(
            "input" in w.lower() or "output" in w.lower()
            for w in result.get("warnings", [])
        )


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestCompleteLifecycleWorkflow:
    """Test complete pipeline lifecycle from creation to archival."""

    async def test_full_pipeline_lifecycle(self, authenticated_client):
        """Should handle complete pipeline lifecycle: create -> add graph -> validate -> activate -> archive."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # 1. CREATE PIPELINE
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
                "name": "Lifecycle Test Pipeline",
                "pattern": "sequential",
                "description": "Test complete lifecycle",
            },
        )
        assert pipeline_response.status_code == 200
        pipeline = pipeline_response.json()["data"]
        pipeline_id = pipeline["id"]
        assert pipeline["status"] == "draft"

        # 2. BUILD GRAPH
        # Add input node
        input_node = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "input",
                "label": "Start",
                "position_x": 0.0,
                "position_y": 0.0,
            },
        )
        input_id = input_node.json()["data"]["id"]

        # Add agent node
        agent_node = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "agent",
                "agent_id": str(uuid.uuid4()),
                "label": "Processor",
                "position_x": 100.0,
                "position_y": 0.0,
            },
        )
        agent_id = agent_node.json()["data"]["id"]

        # Add output node
        output_node = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/nodes",
            json={
                "node_type": "output",
                "label": "End",
                "position_x": 200.0,
                "position_y": 0.0,
            },
        )
        output_id = output_node.json()["data"]["id"]

        # Connect nodes
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": input_id,
                "target_node_id": agent_id,
            },
        )
        await client.post(
            f"/api/v1/pipelines/{pipeline_id}/connections",
            json={
                "source_node_id": agent_id,
                "target_node_id": output_id,
            },
        )

        # 3. VERIFY GRAPH
        get_response = await client.get(f"/api/v1/pipelines/{pipeline_id}")
        pipeline_with_graph = get_response.json()["data"]
        assert len(pipeline_with_graph["nodes"]) == 3
        assert len(pipeline_with_graph["connections"]) == 2

        # 4. VALIDATE PIPELINE
        validate_response = await client.post(
            f"/api/v1/pipelines/{pipeline_id}/validate",
        )
        assert validate_response.status_code == 200
        validation = validate_response.json()["data"]
        assert validation["valid"] is True

        # 5. UPDATE PIPELINE DESCRIPTION
        update_response = await client.put(
            f"/api/v1/pipelines/{pipeline_id}",
            json={
                "description": "Updated description after validation",
            },
        )
        assert update_response.status_code == 200
        updated = update_response.json()["data"]
        assert "Updated description" in updated["description"]

        # 6. ACTIVATE PIPELINE
        activate_response = await client.put(
            f"/api/v1/pipelines/{pipeline_id}", json={"status": "active"}
        )
        assert activate_response.status_code == 200
        activated = activate_response.json()["data"]
        assert activated["status"] == "active"

        # 7. RETRIEVE ACTIVE PIPELINE
        get_active = await client.get(f"/api/v1/pipelines/{pipeline_id}")
        assert get_active.json()["data"]["status"] == "active"

        # 8. ARCHIVE PIPELINE
        archive_response = await client.delete(f"/api/v1/pipelines/{pipeline_id}")
        assert archive_response.status_code == 200

        # 9. VERIFY ARCHIVED
        get_archived = await client.get(f"/api/v1/pipelines/{pipeline_id}")
        assert get_archived.json()["data"]["status"] == "archived"

        # 10. VERIFY IT STILL APPEARS IN LIST (soft delete)
        list_response = await client.get(
            "/api/v1/pipelines",
            params={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
            },
        )
        # Soft deleted pipelines still appear
        pipeline_ids = [p["id"] for p in list_response.json()["data"]]
        assert pipeline_id in pipeline_ids

    async def test_multiple_pipelines_in_workspace(self, authenticated_client):
        """Should support multiple pipelines in same workspace."""
        client, user = authenticated_client
        ws_id = str(uuid.uuid4())

        # Create multiple pipelines
        pipeline_ids = []
        for i in range(5):
            response = await client.post(
                "/api/v1/pipelines",
                json={
                    "organization_id": user["organization_id"],
                    "workspace_id": ws_id,
                    "name": f"Pipeline {i}",
                    "pattern": "sequential",
                },
            )
            pipeline_ids.append(response.json()["data"]["id"])

        # Verify all pipelines exist
        list_response = await client.get(
            "/api/v1/pipelines",
            params={
                "organization_id": user["organization_id"],
                "workspace_id": ws_id,
            },
        )
        listed_ids = [p["id"] for p in list_response.json()["data"]]
        assert all(pid in listed_ids for pid in pipeline_ids)

        # Verify each pipeline is retrievable
        for pid in pipeline_ids:
            response = await client.get(f"/api/v1/pipelines/{pid}")
            assert response.status_code == 200
            assert response.json()["data"]["id"] == pid
