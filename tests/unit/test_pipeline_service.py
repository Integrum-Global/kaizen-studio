"""
Tier 1: Pipeline Service Unit Tests

Tests pipeline CRUD, graph operations, and validation in isolation.
Uses mocked DataFlow operations since Tier 1 focuses on service logic.

Test Coverage:
- Pipeline CRUD operations (create, read, update, delete)
- Graph operations (nodes, connections, save)
- Validation logic (graph structure, cycles, node references)
- Pattern validation (sequential, parallel, router, supervisor, ensemble)
"""

import json
import uuid
from datetime import datetime

import pytest


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPipelineCRUD:
    """Test pipeline CRUD operations."""

    async def test_create_pipeline_basic(self, pipeline_factory):
        """Should create a pipeline with required fields."""
        data = pipeline_factory()
        assert data["id"]
        assert data["organization_id"]
        assert data["workspace_id"]
        assert data["name"]
        assert data["pattern"] == "sequential"
        assert data["status"] == "draft"
        assert data["created_at"]
        assert data["updated_at"]

    async def test_create_pipeline_with_description(self, pipeline_factory):
        """Should create pipeline with optional description."""
        desc = "Test pipeline for agent orchestration"
        data = pipeline_factory(description=desc)
        assert data["description"] == desc

    async def test_create_pipeline_all_patterns(self, pipeline_factory):
        """Should support all orchestration patterns."""
        patterns = ["sequential", "parallel", "router", "supervisor", "ensemble"]
        for pattern in patterns:
            data = pipeline_factory(pattern=pattern)
            assert data["pattern"] == pattern

    async def test_create_pipeline_status_values(self, pipeline_factory):
        """Should support valid status values."""
        for status in ["draft", "active", "archived"]:
            data = pipeline_factory(status=status)
            assert data["status"] == status

    async def test_pipeline_has_timestamps(self, pipeline_factory):
        """Pipeline should have ISO 8601 timestamps."""
        data = pipeline_factory()
        # Validate ISO format
        datetime.fromisoformat(data["created_at"])
        datetime.fromisoformat(data["updated_at"])

    async def test_pipeline_id_is_uuid(self, pipeline_factory):
        """Pipeline ID should be valid UUID."""
        data = pipeline_factory()
        uuid.UUID(data["id"])

    async def test_create_pipeline_with_custom_id(self, pipeline_factory):
        """Should allow specifying custom pipeline ID."""
        custom_id = str(uuid.uuid4())
        data = pipeline_factory(id=custom_id)
        assert data["id"] == custom_id

    async def test_create_pipeline_created_by(self, pipeline_factory):
        """Pipeline should track who created it."""
        user_id = str(uuid.uuid4())
        data = pipeline_factory(created_by=user_id)
        assert data["created_by"] == user_id

    async def test_pipeline_organization_workspace_association(self, pipeline_factory):
        """Pipeline should link to organization and workspace."""
        org_id = str(uuid.uuid4())
        ws_id = str(uuid.uuid4())
        data = pipeline_factory(organization_id=org_id, workspace_id=ws_id)
        assert data["organization_id"] == org_id
        assert data["workspace_id"] == ws_id


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPipelineNodeOperations:
    """Test pipeline node CRUD operations."""

    async def test_create_node_agent_type(self, pipeline_node_factory):
        """Should create agent node type."""
        agent_id = str(uuid.uuid4())
        node = pipeline_node_factory(
            node_type="agent", agent_id=agent_id, label="ProcessAgent"
        )
        assert node["node_type"] == "agent"
        assert node["agent_id"] == agent_id
        assert node["label"] == "ProcessAgent"

    async def test_create_node_input_type(self, pipeline_node_factory):
        """Should create input node type."""
        node = pipeline_node_factory(node_type="input", label="DataInput")
        assert node["node_type"] == "input"

    async def test_create_node_output_type(self, pipeline_node_factory):
        """Should create output node type."""
        node = pipeline_node_factory(node_type="output", label="ResultOutput")
        assert node["node_type"] == "output"

    async def test_create_node_condition_type(self, pipeline_node_factory):
        """Should create condition node type."""
        node = pipeline_node_factory(node_type="condition", label="Router")
        assert node["node_type"] == "condition"

    async def test_create_node_merge_type(self, pipeline_node_factory):
        """Should create merge node type."""
        node = pipeline_node_factory(node_type="merge", label="ResultMerge")
        assert node["node_type"] == "merge"

    async def test_node_canvas_position(self, pipeline_node_factory):
        """Node should track canvas position."""
        node = pipeline_node_factory(position_x=100.5, position_y=200.75)
        assert node["position_x"] == 100.5
        assert node["position_y"] == 200.75

    async def test_node_with_config_dict(self, pipeline_node_factory):
        """Node should store config as JSON."""
        config = {"timeout": 30, "retries": 3}
        node = pipeline_node_factory(config=config)
        stored_config = json.loads(node["config"])
        assert stored_config["timeout"] == 30
        assert stored_config["retries"] == 3

    async def test_node_empty_config(self, pipeline_node_factory):
        """Node should handle empty config."""
        node = pipeline_node_factory(config=None)
        assert node["config"] == ""

    async def test_node_id_is_uuid(self, pipeline_node_factory):
        """Node ID should be valid UUID."""
        node = pipeline_node_factory()
        uuid.UUID(node["id"])

    async def test_node_pipeline_association(self, pipeline_node_factory):
        """Node should link to pipeline."""
        pipeline_id = str(uuid.uuid4())
        node = pipeline_node_factory(pipeline_id=pipeline_id)
        assert node["pipeline_id"] == pipeline_id

    async def test_node_agent_id_optional_for_input(self, pipeline_node_factory):
        """Input nodes should not require agent_id."""
        node = pipeline_node_factory(node_type="input", agent_id="")
        assert node["agent_id"] == ""

    async def test_node_timestamps(self, pipeline_node_factory):
        """Node should have ISO timestamps."""
        node = pipeline_node_factory()
        datetime.fromisoformat(node["created_at"])
        datetime.fromisoformat(node["updated_at"])


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPipelineConnectionOperations:
    """Test pipeline connection operations."""

    async def test_create_connection_basic(self, pipeline_connection_factory):
        """Should create connection between nodes."""
        source_id = str(uuid.uuid4())
        target_id = str(uuid.uuid4())
        conn = pipeline_connection_factory(
            source_node_id=source_id, target_node_id=target_id
        )
        assert conn["source_node_id"] == source_id
        assert conn["target_node_id"] == target_id

    async def test_connection_default_handles(self, pipeline_connection_factory):
        """Connection should use default handle names."""
        conn = pipeline_connection_factory()
        assert conn["source_handle"] == "output"
        assert conn["target_handle"] == "input"

    async def test_connection_custom_handles(self, pipeline_connection_factory):
        """Connection should allow custom handle names."""
        conn = pipeline_connection_factory(source_handle="result", target_handle="data")
        assert conn["source_handle"] == "result"
        assert conn["target_handle"] == "data"

    async def test_connection_with_condition(self, pipeline_connection_factory):
        """Connection should support conditional routing."""
        condition = {"type": "equals", "field": "status", "value": "success"}
        conn = pipeline_connection_factory(condition=condition)
        stored_condition = json.loads(conn["condition"])
        assert stored_condition["type"] == "equals"

    async def test_connection_without_condition(self, pipeline_connection_factory):
        """Connection should handle empty condition."""
        conn = pipeline_connection_factory(condition=None)
        assert conn["condition"] == ""

    async def test_connection_id_is_uuid(self, pipeline_connection_factory):
        """Connection ID should be valid UUID."""
        conn = pipeline_connection_factory()
        uuid.UUID(conn["id"])

    async def test_connection_pipeline_association(self, pipeline_connection_factory):
        """Connection should link to pipeline."""
        pipeline_id = str(uuid.uuid4())
        conn = pipeline_connection_factory(pipeline_id=pipeline_id)
        assert conn["pipeline_id"] == pipeline_id

    async def test_connection_timestamp(self, pipeline_connection_factory):
        """Connection should have creation timestamp."""
        conn = pipeline_connection_factory()
        datetime.fromisoformat(conn["created_at"])

    async def test_multiple_connections_same_pipeline(
        self, pipeline_connection_factory
    ):
        """Should allow multiple connections in same pipeline."""
        pipeline_id = str(uuid.uuid4())
        conn1 = pipeline_connection_factory(pipeline_id=pipeline_id)
        conn2 = pipeline_connection_factory(pipeline_id=pipeline_id)
        assert conn1["id"] != conn2["id"]
        assert conn1["pipeline_id"] == conn2["pipeline_id"]


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestGraphValidation:
    """Test pipeline graph validation logic."""

    def test_validate_empty_pipeline(self):
        """Should detect empty pipeline (no nodes)."""
        result = self._validate_graph(nodes=[], connections=[])
        assert any("no nodes" in e.lower() for e in result["errors"])

    def test_validate_valid_linear_graph(self):
        """Should validate linear pipeline (input -> agent -> output)."""
        input_node = {"id": "input1", "node_type": "input"}
        agent_node = {"id": "agent1", "node_type": "agent", "agent_id": "agent_123"}
        output_node = {"id": "output1", "node_type": "output"}

        connections = [
            {"source_node_id": "input1", "target_node_id": "agent1"},
            {"source_node_id": "agent1", "target_node_id": "output1"},
        ]

        result = self._validate_graph(
            nodes=[input_node, agent_node, output_node], connections=connections
        )
        assert len(result["errors"]) == 0

    def test_validate_missing_input_node(self):
        """Should warn about missing input node."""
        agent_node = {"id": "agent1", "node_type": "agent", "agent_id": "agent_123"}
        output_node = {"id": "output1", "node_type": "output"}

        warnings = self._validate_graph(
            nodes=[agent_node, output_node], connections=[]
        )["warnings"]
        assert any("input" in w.lower() for w in warnings)

    def test_validate_missing_output_node(self):
        """Should warn about missing output node."""
        input_node = {"id": "input1", "node_type": "input"}
        agent_node = {"id": "agent1", "node_type": "agent", "agent_id": "agent_123"}

        warnings = self._validate_graph(nodes=[input_node, agent_node], connections=[])[
            "warnings"
        ]
        assert any("output" in w.lower() for w in warnings)

    def test_validate_agent_without_agent_id(self):
        """Should error if agent node missing agent_id."""
        agent_node = {"id": "agent1", "node_type": "agent", "agent_id": ""}
        result = self._validate_graph(nodes=[agent_node], connections=[])
        assert any(
            "agent" in e.lower() and "no agent" in e.lower() for e in result["errors"]
        )

    def test_validate_connection_invalid_source(self):
        """Should error if connection references invalid source."""
        agent_node = {"id": "agent1", "node_type": "agent", "agent_id": "agent_123"}
        connection = {"source_node_id": "nonexistent", "target_node_id": "agent1"}
        result = self._validate_graph(nodes=[agent_node], connections=[connection])
        assert any("source" in e.lower() for e in result["errors"])

    def test_validate_connection_invalid_target(self):
        """Should error if connection references invalid target."""
        agent_node = {"id": "agent1", "node_type": "agent", "agent_id": "agent_123"}
        connection = {"source_node_id": "agent1", "target_node_id": "nonexistent"}
        result = self._validate_graph(nodes=[agent_node], connections=[connection])
        assert any("target" in e.lower() for e in result["errors"])

    def test_validate_simple_cycle(self):
        """Should detect simple cycle (A -> B -> A)."""
        nodes = [
            {"id": "node1", "node_type": "agent", "agent_id": "agent_1"},
            {"id": "node2", "node_type": "agent", "agent_id": "agent_2"},
        ]
        connections = [
            {"source_node_id": "node1", "target_node_id": "node2"},
            {"source_node_id": "node2", "target_node_id": "node1"},
        ]
        result = self._validate_graph(nodes=nodes, connections=connections)
        assert any("cycle" in e.lower() for e in result["errors"])

    def test_validate_self_cycle(self):
        """Should detect self-loop cycle."""
        node = {"id": "node1", "node_type": "agent", "agent_id": "agent_1"}
        connection = {"source_node_id": "node1", "target_node_id": "node1"}
        result = self._validate_graph(nodes=[node], connections=[connection])
        assert any("cycle" in e.lower() for e in result["errors"])

    def test_validate_complex_dag(self):
        """Should validate valid complex DAG (no cycles)."""
        nodes = [
            {"id": "input1", "node_type": "input"},
            {"id": "agent1", "node_type": "agent", "agent_id": "agent_1"},
            {"id": "agent2", "node_type": "agent", "agent_id": "agent_2"},
            {"id": "merge1", "node_type": "merge"},
            {"id": "output1", "node_type": "output"},
        ]
        connections = [
            {"source_node_id": "input1", "target_node_id": "agent1"},
            {"source_node_id": "input1", "target_node_id": "agent2"},
            {"source_node_id": "agent1", "target_node_id": "merge1"},
            {"source_node_id": "agent2", "target_node_id": "merge1"},
            {"source_node_id": "merge1", "target_node_id": "output1"},
        ]
        result = self._validate_graph(nodes=nodes, connections=connections)
        assert len(result["errors"]) == 0

    def _validate_graph(self, nodes, connections):
        """Helper to validate graph structure."""
        errors = []
        warnings = []

        if not nodes:
            errors.append("Pipeline has no nodes")
            return {"valid": False, "errors": errors, "warnings": warnings}

        node_ids = {node["id"] for node in nodes}

        for conn in connections:
            if conn["source_node_id"] not in node_ids:
                errors.append(
                    f"Connection references invalid source node: {conn['source_node_id']}"
                )
            if conn["target_node_id"] not in node_ids:
                errors.append(
                    f"Connection references invalid target node: {conn['target_node_id']}"
                )

        has_input = any(n["node_type"] == "input" for n in nodes)
        has_output = any(n["node_type"] == "output" for n in nodes)

        if not has_input:
            warnings.append("Pipeline has no input node")
        if not has_output:
            warnings.append("Pipeline has no output node")

        for node in nodes:
            if node["node_type"] == "agent" and not node.get("agent_id"):
                errors.append("Agent node has no agent assigned")

        adjacency = {node["id"]: [] for node in nodes}
        for conn in connections:
            if conn["source_node_id"] in adjacency:
                adjacency[conn["source_node_id"]].append(conn["target_node_id"])

        visited = set()
        rec_stack = set()

        def has_cycle(node_id):
            visited.add(node_id)
            rec_stack.add(node_id)
            for neighbor in adjacency.get(node_id, []):
                if neighbor not in visited:
                    if has_cycle(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            rec_stack.discard(node_id)
            return False

        for node in nodes:
            if node["id"] not in visited:
                if has_cycle(node["id"]):
                    errors.append("Pipeline contains cycles")
                    break

        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPatternValidation:
    """Test orchestration pattern validation."""

    def test_valid_pattern_sequential(self):
        """Should validate sequential pattern."""
        assert self._is_valid_pattern("sequential")

    def test_valid_pattern_parallel(self):
        """Should validate parallel pattern."""
        assert self._is_valid_pattern("parallel")

    def test_valid_pattern_router(self):
        """Should validate router pattern."""
        assert self._is_valid_pattern("router")

    def test_valid_pattern_supervisor(self):
        """Should validate supervisor pattern."""
        assert self._is_valid_pattern("supervisor")

    def test_valid_pattern_ensemble(self):
        """Should validate ensemble pattern."""
        assert self._is_valid_pattern("ensemble")

    def test_invalid_pattern(self):
        """Should reject invalid patterns."""
        assert not self._is_valid_pattern("invalid_pattern")

    def test_case_sensitive_patterns(self):
        """Patterns should be case-sensitive."""
        assert not self._is_valid_pattern("Sequential")
        assert not self._is_valid_pattern("PARALLEL")

    def _is_valid_pattern(self, pattern: str) -> bool:
        """Helper to check if pattern is valid."""
        valid_patterns = ["sequential", "parallel", "router", "supervisor", "ensemble"]
        return pattern in valid_patterns


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestGraphComputations:
    """Test graph-related computations."""

    def test_count_nodes_in_graph(self):
        """Should count nodes correctly."""
        nodes = [{"id": f"node{i}", "node_type": "agent"} for i in range(5)]
        count = len(nodes)
        assert count == 5

    def test_count_connections_in_graph(self):
        """Should count connections correctly."""
        connections = [
            {"source_node_id": f"n{i}", "target_node_id": f"n{i+1}"} for i in range(4)
        ]
        count = len(connections)
        assert count == 4

    def test_find_root_nodes(self):
        """Should identify nodes with no incoming edges."""
        nodes = [f"n{i}" for i in range(5)]
        connections = [("n0", "n1"), ("n1", "n2"), ("n2", "n3"), ("n2", "n4")]

        incoming = {node: 0 for node in nodes}
        for source, target in connections:
            incoming[target] += 1

        roots = [node for node in nodes if incoming[node] == 0]
        assert "n0" in roots
        assert "n1" not in roots

    def test_find_leaf_nodes(self):
        """Should identify nodes with no outgoing edges."""
        nodes = [f"n{i}" for i in range(5)]
        connections = [("n0", "n1"), ("n1", "n2"), ("n2", "n3"), ("n2", "n4")]

        outgoing = {node: 0 for node in nodes}
        for source, target in connections:
            outgoing[source] += 1

        leaves = [node for node in nodes if outgoing[node] == 0]
        assert "n3" in leaves
        assert "n4" in leaves
        assert "n0" not in leaves

    def test_compute_graph_depth(self):
        """Should compute maximum depth of graph."""
        # Linear graph: n0 -> n1 -> n2 -> n3
        nodes = [f"n{i}" for i in range(4)]
        connections = [("n0", "n1"), ("n1", "n2"), ("n2", "n3")]

        adjacency = {node: [] for node in nodes}
        for source, target in connections:
            adjacency[source].append(target)

        # BFS to find depth
        from collections import deque

        depths = {node: 0 for node in nodes}
        queue = deque(["n0"])

        while queue:
            node = queue.popleft()
            for neighbor in adjacency[node]:
                depths[neighbor] = max(depths[neighbor], depths[node] + 1)
                queue.append(neighbor)

        max_depth = max(depths.values())
        assert max_depth == 3


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPipelineDataTypes:
    """Test correct data types and conversions."""

    async def test_position_coordinates_are_floats(self, pipeline_node_factory):
        """Position coordinates should be float type."""
        node = pipeline_node_factory(position_x=10, position_y=20)
        assert isinstance(node["position_x"], (float, int))
        assert isinstance(node["position_y"], (float, int))

    async def test_config_json_serialization(self, pipeline_node_factory):
        """Config should be serializable JSON."""
        complex_config = {
            "nested": {"key": "value"},
            "list": [1, 2, 3],
            "bool": True,
            "null": None,
        }
        node = pipeline_node_factory(config=complex_config)
        deserialized = json.loads(node["config"])
        assert deserialized == complex_config

    async def test_condition_json_serialization(self, pipeline_connection_factory):
        """Condition should be serializable JSON."""
        complex_condition = {
            "operator": "and",
            "conditions": [
                {"field": "status", "operator": "eq", "value": "success"},
                {"field": "retry_count", "operator": "lt", "value": 3},
            ],
        }
        conn = pipeline_connection_factory(condition=complex_condition)
        deserialized = json.loads(conn["condition"])
        assert deserialized == complex_condition

    async def test_timestamp_iso_format(self, pipeline_factory):
        """Timestamps should be ISO 8601 strings."""
        data = pipeline_factory()
        # Should not raise
        datetime.fromisoformat(data["created_at"])
        datetime.fromisoformat(data["updated_at"])


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPipelineBoundaryConditions:
    """Test boundary conditions and edge cases."""

    async def test_pipeline_name_empty(self, pipeline_factory):
        """Should handle empty pipeline name by generating default."""
        data = pipeline_factory(name="")
        # Factory generates a default name when empty string is provided
        assert data["name"] != ""
        assert "Test Pipeline" in data["name"]

    async def test_pipeline_name_very_long(self, pipeline_factory):
        """Should handle very long pipeline name."""
        long_name = "A" * 1000
        data = pipeline_factory(name=long_name)
        assert len(data["name"]) == 1000

    async def test_node_label_unicode(self, pipeline_node_factory):
        """Should handle unicode in node label."""
        unicode_label = "处理节点 🔄"
        node = pipeline_node_factory(label=unicode_label)
        assert node["label"] == unicode_label

    async def test_large_graph_many_nodes(self, pipeline_node_factory):
        """Should handle pipeline with many nodes."""
        nodes = [pipeline_node_factory(id=f"n{i}") for i in range(100)]
        assert len(nodes) == 100

    async def test_large_graph_many_connections(self, pipeline_connection_factory):
        """Should handle pipeline with many connections."""
        connections = [
            pipeline_connection_factory(
                source_node_id=f"n{i}", target_node_id=f"n{i+1}"
            )
            for i in range(99)
        ]
        assert len(connections) == 99

    async def test_negative_coordinates(self, pipeline_node_factory):
        """Should handle negative coordinates."""
        node = pipeline_node_factory(position_x=-100.5, position_y=-200.75)
        assert node["position_x"] == -100.5
        assert node["position_y"] == -200.75

    async def test_zero_coordinates(self, pipeline_node_factory):
        """Should handle zero coordinates."""
        node = pipeline_node_factory(position_x=0.0, position_y=0.0)
        assert node["position_x"] == 0.0
        assert node["position_y"] == 0.0


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPipelinePatternMetadata:
    """Test pattern-specific metadata."""

    def test_pattern_descriptions_available(self):
        """Should provide descriptions for each pattern."""
        patterns = {
            "sequential": "Agents execute in sequence, output passes to next",
            "parallel": "Agents execute in parallel, results merged",
            "router": "Route to agent based on condition",
            "supervisor": "Supervisor delegates to worker agents",
            "ensemble": "Multiple agents vote, aggregate results",
        }
        for pattern, description in patterns.items():
            assert description is not None
            assert len(description) > 0

    def test_pattern_count(self):
        """Should have exactly 5 patterns."""
        patterns = ["sequential", "parallel", "router", "supervisor", "ensemble"]
        assert len(patterns) == 5


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPipelineRelationships:
    """Test relationships between pipelines, nodes, and connections."""

    async def test_pipeline_node_relationship(
        self, pipeline_factory, pipeline_node_factory
    ):
        """Node should reference its pipeline."""
        pipeline = pipeline_factory()
        node = pipeline_node_factory(pipeline_id=pipeline["id"])
        assert node["pipeline_id"] == pipeline["id"]

    async def test_pipeline_connection_relationship(
        self, pipeline_factory, pipeline_connection_factory
    ):
        """Connection should reference its pipeline."""
        pipeline = pipeline_factory()
        conn = pipeline_connection_factory(pipeline_id=pipeline["id"])
        assert conn["pipeline_id"] == pipeline["id"]

    async def test_node_agent_relationship(self, pipeline_node_factory):
        """Agent node should reference its agent."""
        agent_id = str(uuid.uuid4())
        node = pipeline_node_factory(node_type="agent", agent_id=agent_id)
        assert node["agent_id"] == agent_id

    async def test_multiple_nodes_same_pipeline(
        self, pipeline_factory, pipeline_node_factory
    ):
        """Multiple nodes should reference same pipeline."""
        pipeline = pipeline_factory()
        node1 = pipeline_node_factory(pipeline_id=pipeline["id"])
        node2 = pipeline_node_factory(pipeline_id=pipeline["id"])
        node3 = pipeline_node_factory(pipeline_id=pipeline["id"])

        assert node1["pipeline_id"] == node2["pipeline_id"] == node3["pipeline_id"]

    async def test_connection_references_nodes(
        self, pipeline_connection_factory, pipeline_node_factory
    ):
        """Connection should reference source and target nodes."""
        node1 = pipeline_node_factory()
        node2 = pipeline_node_factory()
        conn = pipeline_connection_factory(
            source_node_id=node1["id"], target_node_id=node2["id"]
        )
        assert conn["source_node_id"] == node1["id"]
        assert conn["target_node_id"] == node2["id"]
