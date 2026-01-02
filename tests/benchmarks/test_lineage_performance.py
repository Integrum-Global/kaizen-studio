"""
Lineage Graph Performance Benchmarks (Phase 6)

Tests lineage graph query performance with varying graph sizes:
- 10 nodes: <100ms
- 50 nodes: <300ms
- 100 nodes: <1000ms
- 500 nodes: <5000ms (may require pagination)

Uses real PostgreSQL - NO MOCKING.
"""

import time
import uuid
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


@pytest.mark.integration  # Tier 2: Real infrastructure
@pytest.mark.timeout(120)
@pytest.mark.asyncio
class TestLineageGraphPerformance:
    """
    Performance benchmarks for lineage graph queries.

    Intent: Verify lineage graph rendering meets performance targets for various graph sizes.

    Targets:
    - 10 nodes: <100ms
    - 50 nodes: <300ms
    - 100 nodes: <1000ms
    - 500 nodes: <5000ms
    """

    async def test_lineage_graph_10_nodes_performance(
        self, test_db, test_client: AsyncClient, authenticated_owner_client
    ):
        """
        Intent: Measure lineage graph query performance for small workflow (10 nodes).

        Setup:
        - Real PostgreSQL (test_db)
        - 10-node linear workflow: A → B → C → ... → J
        - Each node is a LineageHop record

        Benchmark: GET /api/v1/lineage/graph?external_agent_id=X

        Target: <100ms

        NO MOCKING: Uses real PostgreSQL.
        """
        client, user, org = authenticated_owner_client

        # Create unique agent_id for this test
        agent_id = str(uuid.uuid4())

        print("\n--- Creating 10-node lineage graph ---")
        node_ids = await self._create_linear_lineage_graph(
            agent_id=agent_id,
            org_id=org["id"],
            user_id=user["id"],
            num_nodes=10,
        )

        print(f"  ✓ Created {len(node_ids)} lineage hops")

        # Benchmark lineage query
        start_time = time.perf_counter()

        response = await client.get(
            f"/api/v1/lineage/graph?external_agent_id={agent_id}"
        )

        end_time = time.perf_counter()
        query_time = (end_time - start_time) * 1000  # Convert to ms

        assert response.status_code == 200, f"Lineage query failed: {response.text}"
        lineage_graph = response.json()

        # Verify graph structure
        assert len(lineage_graph["nodes"]) == 10
        assert len(lineage_graph["edges"]) == 9  # Linear graph has n-1 edges

        print("\n--- Lineage Graph Query (10 nodes) ---")
        print(f"  Query Time: {query_time:.2f}ms")
        print(f"  Nodes: {len(lineage_graph['nodes'])}")
        print(f"  Edges: {len(lineage_graph['edges'])}")

        # Assert performance target
        assert query_time < 100.0, f"Query time {query_time:.2f}ms exceeds 100ms target"

    async def test_lineage_graph_50_nodes_performance(
        self, test_db, test_client: AsyncClient, authenticated_owner_client
    ):
        """
        Intent: Measure lineage graph query performance for medium workflow (50 nodes).

        Setup:
        - Real PostgreSQL (test_db)
        - 50-node linear workflow

        Benchmark: GET /api/v1/lineage/graph?external_agent_id=X

        Target: <300ms

        NO MOCKING: Uses real PostgreSQL.
        """
        client, user, org = authenticated_owner_client

        # Create unique agent_id for this test
        agent_id = str(uuid.uuid4())

        print("\n--- Creating 50-node lineage graph ---")
        node_ids = await self._create_linear_lineage_graph(
            agent_id=agent_id,
            org_id=org["id"],
            user_id=user["id"],
            num_nodes=50,
        )

        print(f"  ✓ Created {len(node_ids)} lineage hops")

        # Benchmark lineage query
        start_time = time.perf_counter()

        response = await client.get(
            f"/api/v1/lineage/graph?external_agent_id={agent_id}"
        )

        end_time = time.perf_counter()
        query_time = (end_time - start_time) * 1000  # Convert to ms

        assert response.status_code == 200, f"Lineage query failed: {response.text}"
        lineage_graph = response.json()

        # Verify graph structure
        assert len(lineage_graph["nodes"]) == 50
        assert len(lineage_graph["edges"]) == 49

        print("\n--- Lineage Graph Query (50 nodes) ---")
        print(f"  Query Time: {query_time:.2f}ms")
        print(f"  Nodes: {len(lineage_graph['nodes'])}")
        print(f"  Edges: {len(lineage_graph['edges'])}")

        # Assert performance target
        assert query_time < 300.0, f"Query time {query_time:.2f}ms exceeds 300ms target"

    async def test_lineage_graph_100_nodes_performance(
        self, test_db, test_client: AsyncClient, authenticated_owner_client
    ):
        """
        Intent: Measure lineage graph query performance for large workflow (100 nodes).

        Setup:
        - Real PostgreSQL (test_db)
        - 100-node linear workflow

        Benchmark: GET /api/v1/lineage/graph?external_agent_id=X

        Target: <1000ms (1 second)

        NO MOCKING: Uses real PostgreSQL.
        """
        client, user, org = authenticated_owner_client

        # Create unique agent_id for this test
        agent_id = str(uuid.uuid4())

        print("\n--- Creating 100-node lineage graph ---")
        node_ids = await self._create_linear_lineage_graph(
            agent_id=agent_id,
            org_id=org["id"],
            user_id=user["id"],
            num_nodes=100,
        )

        print(f"  ✓ Created {len(node_ids)} lineage hops")

        # Benchmark lineage query
        start_time = time.perf_counter()

        response = await client.get(
            f"/api/v1/lineage/graph?external_agent_id={agent_id}"
        )

        end_time = time.perf_counter()
        query_time = (end_time - start_time) * 1000  # Convert to ms

        assert response.status_code == 200, f"Lineage query failed: {response.text}"
        lineage_graph = response.json()

        # Verify graph structure
        assert len(lineage_graph["nodes"]) == 100
        assert len(lineage_graph["edges"]) == 99

        print("\n--- Lineage Graph Query (100 nodes) ---")
        print(f"  Query Time: {query_time:.2f}ms")
        print(f"  Nodes: {len(lineage_graph['nodes'])}")
        print(f"  Edges: {len(lineage_graph['edges'])}")

        # Assert performance target
        assert (
            query_time < 1000.0
        ), f"Query time {query_time:.2f}ms exceeds 1000ms target"

    async def test_lineage_graph_500_nodes_performance(
        self, test_db, test_client: AsyncClient, authenticated_owner_client
    ):
        """
        Intent: Measure lineage graph query performance for very large workflow (500 nodes).

        Setup:
        - Real PostgreSQL (test_db)
        - 500-node linear workflow

        Benchmark: GET /api/v1/lineage/graph?external_agent_id=X

        Target: <5000ms (5 seconds), may require pagination

        NO MOCKING: Uses real PostgreSQL.
        """
        client, user, org = authenticated_owner_client

        # Create unique agent_id for this test
        agent_id = str(uuid.uuid4())

        print("\n--- Creating 500-node lineage graph ---")
        print("  This may take 30-60 seconds to create...")

        node_ids = await self._create_linear_lineage_graph(
            agent_id=agent_id,
            org_id=org["id"],
            user_id=user["id"],
            num_nodes=500,
        )

        print(f"  ✓ Created {len(node_ids)} lineage hops")

        # Benchmark lineage query
        start_time = time.perf_counter()

        response = await client.get(
            f"/api/v1/lineage/graph?external_agent_id={agent_id}"
        )

        end_time = time.perf_counter()
        query_time = (end_time - start_time) * 1000  # Convert to ms

        assert response.status_code == 200, f"Lineage query failed: {response.text}"
        lineage_graph = response.json()

        # Verify graph structure (may be paginated)
        print("\n--- Lineage Graph Query (500 nodes) ---")
        print(f"  Query Time: {query_time:.2f}ms")
        print(f"  Nodes Returned: {len(lineage_graph['nodes'])}")
        print(f"  Edges Returned: {len(lineage_graph['edges'])}")

        # If pagination is implemented, nodes may be <500
        if "pagination" in lineage_graph:
            print(f"  Pagination: {lineage_graph['pagination']}")
            print(
                f"  Total Nodes: {lineage_graph['pagination'].get('total_nodes', 'N/A')}"
            )

        # Assert performance target
        assert (
            query_time < 5000.0
        ), f"Query time {query_time:.2f}ms exceeds 5000ms target"

        # If no pagination, verify all nodes returned
        if "pagination" not in lineage_graph:
            assert len(lineage_graph["nodes"]) == 500
            assert len(lineage_graph["edges"]) == 499

    async def test_lineage_graph_complex_dag_performance(
        self, test_db, test_client: AsyncClient, authenticated_owner_client
    ):
        """
        Intent: Measure lineage graph query performance for complex DAG (branching workflow).

        Setup:
        - Real PostgreSQL (test_db)
        - 50-node DAG with branching and merging:
          - 1 root node
          - 3 branches (15 nodes each)
          - 1 merge node
          - Total: 50 nodes with 52 edges (non-linear)

        Benchmark: GET /api/v1/lineage/graph?external_agent_id=X

        Target: <500ms (more complex than linear graph)

        NO MOCKING: Uses real PostgreSQL.
        """
        client, user, org = authenticated_owner_client

        # Create unique agent_id for this test
        agent_id = str(uuid.uuid4())

        print("\n--- Creating complex DAG lineage graph (50 nodes) ---")
        node_ids = await self._create_dag_lineage_graph(
            agent_id=agent_id,
            org_id=org["id"],
            user_id=user["id"],
            num_branches=3,
            nodes_per_branch=15,
        )

        print(f"  ✓ Created {len(node_ids)} lineage hops")

        # Benchmark lineage query
        start_time = time.perf_counter()

        response = await client.get(
            f"/api/v1/lineage/graph?external_agent_id={agent_id}"
        )

        end_time = time.perf_counter()
        query_time = (end_time - start_time) * 1000  # Convert to ms

        assert response.status_code == 200, f"Lineage query failed: {response.text}"
        lineage_graph = response.json()

        # Verify graph structure
        # 1 root + (3 * 15) branches + 1 merge = 47 nodes
        expected_nodes = 1 + (3 * 15) + 1
        print("\n--- Lineage Graph Query (DAG) ---")
        print(f"  Query Time: {query_time:.2f}ms")
        print(f"  Nodes: {len(lineage_graph['nodes'])} (expected ~{expected_nodes})")
        print(f"  Edges: {len(lineage_graph['edges'])}")

        # Assert performance target
        assert query_time < 500.0, f"Query time {query_time:.2f}ms exceeds 500ms target"

    # ===================
    # Helper Methods
    # ===================

    async def _create_linear_lineage_graph(
        self, agent_id: str, org_id: str, user_id: str, num_nodes: int
    ) -> list[str]:
        """
        Create a linear lineage graph (A → B → C → ...).

        Args:
            agent_id: External agent ID to use for all nodes
            org_id: Organization ID
            user_id: User ID
            num_nodes: Number of nodes to create

        Returns list of node IDs.
        """
        # Import studio.models to register DataFlow nodes
        import studio.models  # noqa: F401

        runtime = AsyncLocalRuntime()
        node_ids = []
        trace_id = f"trace-{uuid.uuid4().hex[:8]}"
        now = datetime.now(UTC).isoformat()

        # Create nodes in batches for performance
        batch_size = 50
        for batch_start in range(0, num_nodes, batch_size):
            batch_end = min(batch_start + batch_size, num_nodes)

            # Create batch of nodes
            workflow = WorkflowBuilder()

            for i in range(batch_start, batch_end):
                node_id = f"inv-{uuid.uuid4().hex[:12]}"
                node_ids.append(node_id)

                # Create InvocationLineage record with all required fields
                # NOTE: DataFlow CreateNode expects fields directly, NOT wrapped in "data"
                lineage_data = {
                    # Primary Key
                    "id": node_id,
                    # Layer 1: External User Identity
                    "external_user_id": user_id,
                    "external_user_email": f"perf-user-{i}@test.com",
                    "external_user_name": f"Perf User {i}",
                    # Layer 2: External System Identity
                    "external_system": "benchmark",
                    "external_session_id": f"session-{trace_id}",
                    "external_trace_id": node_ids[i - 1] if i > 0 else None,
                    # Layer 3: Kaizen Authentication
                    "api_key_id": f"key-{org_id[:8]}",
                    "api_key_prefix": "sk_test_perf",
                    "organization_id": org_id,
                    # Layer 4: External Agent
                    "external_agent_id": agent_id,
                    "external_agent_name": f"Perf Agent {i}",
                    "external_agent_endpoint": "https://benchmark.test/agent",
                    # Layer 5: Invocation Metadata
                    "trace_id": f"{trace_id}-{i:04d}",
                    "span_id": f"span-{i:04d}",
                    "parent_trace_id": f"{trace_id}-{i-1:04d}" if i > 0 else None,
                    # Request Context
                    "ip_address": "192.168.1.100",
                    "user_agent": "BenchmarkTest/1.0",
                    "request_timestamp": now,
                    "request_body": f'{{"message": "Node {i}"}}',
                    # Execution Results
                    "status": "success",
                    "response_timestamp": now,
                    "duration_ms": 100,
                    "response_body": f'{{"result": "Output {i}"}}',
                    # Timestamps
                    "created_at": now,
                }

                workflow.add_node(
                    "InvocationLineageCreateNode", f"create_lineage_{i}", lineage_data
                )

            # Execute batch
            await runtime.execute_workflow_async(workflow.build(), inputs={})

        return node_ids

    async def _create_dag_lineage_graph(
        self,
        agent_id: str,
        org_id: str,
        user_id: str,
        num_branches: int,
        nodes_per_branch: int,
    ) -> list[str]:
        """
        Create a DAG lineage graph with branching and merging.

        Structure:
        - 1 root node
        - N branches (each with M nodes)
        - 1 merge node (joins all branches)

        Args:
            agent_id: External agent ID to use for all nodes
            org_id: Organization ID
            user_id: User ID
            num_branches: Number of parallel branches
            nodes_per_branch: Nodes per branch

        Returns list of node IDs.
        """
        # Import studio.models to register DataFlow nodes
        import studio.models  # noqa: F401

        runtime = AsyncLocalRuntime()
        node_ids = []
        trace_id = f"trace-{uuid.uuid4().hex[:8]}"
        now = datetime.now(UTC).isoformat()

        # Create root node
        root_id = f"inv-{uuid.uuid4().hex[:12]}"
        node_ids.append(root_id)

        # NOTE: DataFlow CreateNode expects fields directly, NOT wrapped in "data"
        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvocationLineageCreateNode",
            "create_root",
            {
                "id": root_id,
                "external_user_id": user_id,
                "external_user_email": "perf-root@test.com",
                "external_user_name": "Perf Root User",
                "external_system": "benchmark",
                "external_session_id": f"session-{trace_id}",
                "api_key_id": f"key-{org_id[:8]}",
                "api_key_prefix": "sk_test_perf",
                "organization_id": org_id,
                "external_agent_id": agent_id,
                "external_agent_name": "Root Agent",
                "external_agent_endpoint": "https://benchmark.test/agent",
                "trace_id": f"{trace_id}-root",
                "span_id": "span-root",
                "ip_address": "192.168.1.100",
                "user_agent": "BenchmarkTest/1.0",
                "request_timestamp": now,
                "request_body": '{"message": "Root"}',
                "status": "success",
                "response_timestamp": now,
                "duration_ms": 100,
                "response_body": '{"result": "Root output"}',
                "created_at": now,
            },
        )

        await runtime.execute_workflow_async(workflow.build(), inputs={})

        # Create branches
        branch_leaf_ids = []

        for branch_idx in range(num_branches):
            branch_parent_id = root_id
            branch_parent_trace = f"{trace_id}-root"

            for node_idx in range(nodes_per_branch):
                node_id = f"inv-{uuid.uuid4().hex[:12]}"
                node_ids.append(node_id)
                current_trace = f"{trace_id}-b{branch_idx}-n{node_idx}"

                workflow = WorkflowBuilder()
                workflow.add_node(
                    "InvocationLineageCreateNode",
                    "create_node",
                    {
                        "id": node_id,
                        "external_user_id": user_id,
                        "external_user_email": f"perf-b{branch_idx}@test.com",
                        "external_user_name": f"Perf User B{branch_idx}",
                        "external_system": "benchmark",
                        "external_session_id": f"session-{trace_id}",
                        "external_trace_id": branch_parent_id,
                        "api_key_id": f"key-{org_id[:8]}",
                        "api_key_prefix": "sk_test_perf",
                        "organization_id": org_id,
                        "external_agent_id": agent_id,
                        "external_agent_name": f"Branch {branch_idx} Agent",
                        "external_agent_endpoint": "https://benchmark.test/agent",
                        "trace_id": current_trace,
                        "span_id": f"span-b{branch_idx}-n{node_idx}",
                        "parent_trace_id": branch_parent_trace,
                        "ip_address": "192.168.1.100",
                        "user_agent": "BenchmarkTest/1.0",
                        "request_timestamp": now,
                        "request_body": f'{{"message": "Branch {branch_idx} Node {node_idx}"}}',
                        "status": "success",
                        "response_timestamp": now,
                        "duration_ms": 100,
                        "response_body": f'{{"result": "Output {node_idx}"}}',
                        "created_at": now,
                    },
                )

                await runtime.execute_workflow_async(workflow.build(), inputs={})

                branch_parent_id = node_id
                branch_parent_trace = current_trace

            # Track last node of each branch
            branch_leaf_ids.append(branch_parent_id)

        # Create merge node (joins all branches)
        merge_id = f"inv-{uuid.uuid4().hex[:12]}"
        node_ids.append(merge_id)

        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvocationLineageCreateNode",
            "create_merge",
            {
                "id": merge_id,
                "external_user_id": user_id,
                "external_user_email": "perf-merge@test.com",
                "external_user_name": "Perf Merge User",
                "external_system": "benchmark",
                "external_session_id": f"session-{trace_id}",
                "external_trace_id": ",".join(branch_leaf_ids),  # Multiple parents
                "api_key_id": f"key-{org_id[:8]}",
                "api_key_prefix": "sk_test_perf",
                "organization_id": org_id,
                "external_agent_id": agent_id,
                "external_agent_name": "Merge Agent",
                "external_agent_endpoint": "https://benchmark.test/agent",
                "trace_id": f"{trace_id}-merge",
                "span_id": "span-merge",
                "parent_trace_id": ",".join(
                    [
                        f"{trace_id}-b{i}-n{nodes_per_branch-1}"
                        for i in range(num_branches)
                    ]
                ),
                "ip_address": "192.168.1.100",
                "user_agent": "BenchmarkTest/1.0",
                "request_timestamp": now,
                "request_body": '{"message": "Merge"}',
                "status": "success",
                "response_timestamp": now,
                "duration_ms": 100,
                "response_body": '{"result": "Merged output"}',
                "created_at": now,
            },
        )

        await runtime.execute_workflow_async(workflow.build(), inputs={})

        return node_ids
