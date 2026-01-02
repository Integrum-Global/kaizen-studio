"""
Pipeline Service

CRUD and graph operations for orchestration pipelines using DataFlow nodes.
"""

import json
import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

# Orchestration patterns configuration
ORCHESTRATION_PATTERNS = {
    "sequential": "Agents execute in sequence, output passes to next",
    "parallel": "Agents execute in parallel, results merged",
    "router": "Route to agent based on condition",
    "supervisor": "Supervisor delegates to worker agents",
    "ensemble": "Multiple agents vote, aggregate results",
}


class PipelineService:
    """
    Pipeline service for managing orchestration pipelines, nodes, and connections.

    Uses DataFlow nodes for all database operations.
    """

    def __init__(self):
        """Initialize the pipeline service."""
        self.runtime = AsyncLocalRuntime()

    # ===================
    # Pipeline CRUD
    # ===================

    async def create(
        self,
        organization_id: str,
        workspace_id: str,
        name: str,
        pattern: str,
        created_by: str,
        description: str = "",
        status: str = "draft",
    ) -> dict:
        """
        Create a new pipeline.

        Args:
            organization_id: Organization ID
            workspace_id: Workspace ID
            name: Pipeline name
            pattern: Orchestration pattern (sequential, parallel, router, supervisor, ensemble)
            created_by: User ID who created the pipeline
            description: Optional description
            status: Status (draft, active, archived)

        Returns:
            Created pipeline data
        """
        if pattern not in ORCHESTRATION_PATTERNS:
            raise ValueError(
                f"Invalid pattern: {pattern}. Must be one of {list(ORCHESTRATION_PATTERNS.keys())}"
            )

        now = datetime.now(UTC).isoformat()
        pipeline_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineCreateNode",
            "create",
            {
                "id": pipeline_id,
                "organization_id": organization_id,
                "workspace_id": workspace_id,
                "name": name,
                "description": description,
                "pattern": pattern,
                "status": status,
                "created_by": created_by,
                "created_at": now,
                "updated_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # DataFlow Create nodes return the created record directly
        return results.get("create", {})

    async def get(self, pipeline_id: str) -> dict | None:
        """
        Get a pipeline by ID.

        Args:
            pipeline_id: Pipeline ID

        Returns:
            Pipeline data if found, None otherwise
        """
        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "PipelineReadNode",
                "read",
                {
                    "id": pipeline_id,
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            return results.get("read")
        except Exception:
            # ReadNode throws when record not found
            return None

    async def update(self, pipeline_id: str, data: dict) -> dict | None:
        """
        Update a pipeline.

        Args:
            pipeline_id: Pipeline ID
            data: Fields to update

        Returns:
            Updated pipeline data
        """
        # Validate pattern if provided
        if "pattern" in data and data["pattern"] not in ORCHESTRATION_PATTERNS:
            raise ValueError(f"Invalid pattern: {data['pattern']}")

        # Note: Don't include updated_at - DataFlow manages it automatically

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineUpdateNode",
            "update",
            {
                "filter": {"id": pipeline_id},
                "fields": data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return await self.get(pipeline_id)

    async def delete(self, pipeline_id: str) -> bool:
        """
        Soft delete a pipeline (set status to archived).

        Args:
            pipeline_id: Pipeline ID

        Returns:
            True if archived successfully
        """
        await self.update(pipeline_id, {"status": "archived"})
        return True

    async def hard_delete(self, pipeline_id: str) -> bool:
        """
        Permanently delete a pipeline and all its nodes/connections.

        Args:
            pipeline_id: Pipeline ID

        Returns:
            True if deleted successfully
        """
        # Delete all connections first
        connections = await self.list_connections(pipeline_id)
        for conn in connections:
            await self.remove_connection(conn["id"])

        # Delete all nodes
        nodes = await self.list_nodes(pipeline_id)
        for node in nodes:
            await self.remove_node(node["id"])

        # Delete pipeline
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineDeleteNode",
            "delete",
            {
                "id": pipeline_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return True

    async def list(
        self,
        organization_id: str,
        workspace_id: str | None = None,
        filters: dict | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        List pipelines with optional filters.

        Args:
            organization_id: Organization ID
            workspace_id: Optional workspace ID filter
            filters: Optional additional filter conditions
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        workflow = WorkflowBuilder()

        # Build filter
        combined_filters = {"organization_id": organization_id}
        if workspace_id:
            combined_filters["workspace_id"] = workspace_id
        if filters:
            combined_filters.update(filters)

        workflow.add_node(
            "PipelineListNode",
            "list",
            {
                "filter": combined_filters,
                "limit": limit,
                "offset": offset,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        return {
            "records": list_result.get("records", []),
            "total": list_result.get("count", list_result.get("total", 0)),
        }

    # ===================
    # Graph Operations
    # ===================

    async def get_with_graph(self, pipeline_id: str) -> dict | None:
        """
        Get a pipeline with all its nodes and connections.

        Args:
            pipeline_id: Pipeline ID

        Returns:
            Pipeline data with nodes and connections
        """
        pipeline = await self.get(pipeline_id)
        if not pipeline:
            return None

        nodes = await self.list_nodes(pipeline_id)
        connections = await self.list_connections(pipeline_id)

        pipeline["nodes"] = nodes
        pipeline["connections"] = connections

        return pipeline

    async def save_graph(
        self,
        pipeline_id: str,
        nodes: list,
        connections: list,
    ) -> dict:
        """
        Save complete graph (replaces existing nodes and connections).

        Args:
            pipeline_id: Pipeline ID
            nodes: List of node data
            connections: List of connection data

        Returns:
            Updated pipeline with graph
        """
        # Delete existing connections and nodes
        existing_connections = await self.list_connections(pipeline_id)
        for conn in existing_connections:
            await self.remove_connection(conn["id"])

        existing_nodes = await self.list_nodes(pipeline_id)
        for node in existing_nodes:
            await self.remove_node(node["id"])

        # Create new nodes
        for node_data in nodes:
            await self.add_node(pipeline_id, node_data)

        # Create new connections
        for conn_data in connections:
            await self.add_connection(pipeline_id, conn_data)

        # Update pipeline timestamp
        await self.update(pipeline_id, {})

        return await self.get_with_graph(pipeline_id)

    # ===================
    # Node Operations
    # ===================

    async def add_node(self, pipeline_id: str, node: dict) -> dict:
        """
        Add a node to a pipeline.

        Args:
            pipeline_id: Pipeline ID
            node: Node data

        Returns:
            Created node data
        """
        now = datetime.now(UTC).isoformat()
        node_id = node.get("id") or str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineNodeCreateNode",
            "create",
            {
                "id": node_id,
                "pipeline_id": pipeline_id,
                "node_type": node.get("node_type", "agent"),
                "agent_id": node.get("agent_id", ""),
                "label": node.get("label", ""),
                "position_x": node.get("position_x", 0.0),
                "position_y": node.get("position_y", 0.0),
                "config": (
                    json.dumps(node.get("config", {}))
                    if isinstance(node.get("config"), dict)
                    else node.get("config", "")
                ),
                "created_at": now,
                "updated_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # DataFlow Create nodes return the created record directly
        return results.get("create", {})

    async def update_node(self, node_id: str, data: dict) -> dict | None:
        """
        Update a pipeline node.

        Args:
            node_id: Node ID
            data: Fields to update

        Returns:
            Updated node data
        """
        # Note: Don't include updated_at - DataFlow manages it automatically

        # Convert config dict to JSON string if present
        if "config" in data and isinstance(data["config"], dict):
            data["config"] = json.dumps(data["config"])

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineNodeUpdateNode",
            "update",
            {
                "filter": {"id": node_id},
                "fields": data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Get updated node
        workflow2 = WorkflowBuilder()
        workflow2.add_node(
            "PipelineNodeReadNode",
            "read",
            {
                "id": node_id,
            },
        )
        results2, _ = await self.runtime.execute_workflow_async(
            workflow2.build(), inputs={}
        )
        return results2.get("read")

    async def remove_node(self, node_id: str) -> bool:
        """
        Remove a node from a pipeline.

        Args:
            node_id: Node ID

        Returns:
            True if deleted
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineNodeDeleteNode",
            "delete",
            {
                "id": node_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return True

    async def list_nodes(self, pipeline_id: str) -> list:
        """
        List all nodes in a pipeline.

        Args:
            pipeline_id: Pipeline ID

        Returns:
            List of node records
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineNodeListNode",
            "list",
            {
                "filter": {"pipeline_id": pipeline_id},
                "limit": 1000,
                "offset": 0,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        return list_result.get("records", [])

    async def get_node(self, node_id: str) -> dict | None:
        """
        Get a node by ID.

        Args:
            node_id: Node ID

        Returns:
            Node data if found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineNodeReadNode",
            "read",
            {
                "id": node_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("read")

    # ===================
    # Connection Operations
    # ===================

    async def add_connection(self, pipeline_id: str, connection: dict) -> dict:
        """
        Add a connection between nodes.

        Args:
            pipeline_id: Pipeline ID
            connection: Connection data

        Returns:
            Created connection data
        """
        now = datetime.now(UTC).isoformat()
        connection_id = connection.get("id") or str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineConnectionCreateNode",
            "create",
            {
                "id": connection_id,
                "pipeline_id": pipeline_id,
                "source_node_id": connection["source_node_id"],
                "target_node_id": connection["target_node_id"],
                "source_handle": connection.get("source_handle", "output"),
                "target_handle": connection.get("target_handle", "input"),
                "condition": (
                    json.dumps(connection.get("condition", {}))
                    if isinstance(connection.get("condition"), dict)
                    else connection.get("condition", "")
                ),
                "created_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # DataFlow Create nodes return the created record directly
        return results.get("create", {})

    async def remove_connection(self, connection_id: str) -> bool:
        """
        Remove a connection.

        Args:
            connection_id: Connection ID

        Returns:
            True if deleted
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineConnectionDeleteNode",
            "delete",
            {
                "id": connection_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return True

    async def list_connections(self, pipeline_id: str) -> list:
        """
        List all connections in a pipeline.

        Args:
            pipeline_id: Pipeline ID

        Returns:
            List of connection records
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineConnectionListNode",
            "list",
            {
                "filter": {"pipeline_id": pipeline_id},
                "limit": 10000,
                "offset": 0,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        return list_result.get("records", [])

    async def get_connection(self, connection_id: str) -> dict | None:
        """
        Get a connection by ID.

        Args:
            connection_id: Connection ID

        Returns:
            Connection data if found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineConnectionReadNode",
            "read",
            {
                "id": connection_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("read")

    # ===================
    # Validation & Workflow
    # ===================

    async def validate(self, pipeline_id: str) -> dict:
        """
        Validate pipeline graph structure.

        Args:
            pipeline_id: Pipeline ID

        Returns:
            Validation result with errors if any
        """
        pipeline = await self.get_with_graph(pipeline_id)
        if not pipeline:
            return {"valid": False, "errors": ["Pipeline not found"]}

        errors = []
        warnings = []
        nodes = pipeline.get("nodes", [])
        connections = pipeline.get("connections", [])

        # Check for empty pipeline
        if not nodes:
            errors.append("Pipeline has no nodes")
            return {"valid": False, "errors": errors, "warnings": warnings}

        # Build node ID set
        node_ids = {node["id"] for node in nodes}

        # Check connections reference valid nodes
        for conn in connections:
            if conn["source_node_id"] not in node_ids:
                errors.append(
                    f"Connection references invalid source node: {conn['source_node_id']}"
                )
            if conn["target_node_id"] not in node_ids:
                errors.append(
                    f"Connection references invalid target node: {conn['target_node_id']}"
                )

        # Check for input/output nodes
        has_input = any(n["node_type"] == "input" for n in nodes)
        has_output = any(n["node_type"] == "output" for n in nodes)

        if not has_input:
            warnings.append("Pipeline has no input node")
        if not has_output:
            warnings.append("Pipeline has no output node")

        # Check agent nodes have agent_id
        for node in nodes:
            if node["node_type"] == "agent" and not node.get("agent_id"):
                errors.append(f"Agent node '{node['label']}' has no agent assigned")

        # Check for cycles (simple detection)
        # Build adjacency list
        adjacency = {node["id"]: [] for node in nodes}
        for conn in connections:
            if conn["source_node_id"] in adjacency:
                adjacency[conn["source_node_id"]].append(conn["target_node_id"])

        # DFS for cycle detection
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

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }

    async def build_workflow(self, pipeline_id: str) -> WorkflowBuilder:
        """
        Convert pipeline to a Kailash workflow.

        Args:
            pipeline_id: Pipeline ID

        Returns:
            WorkflowBuilder instance

        Note:
            This is a basic implementation. Full workflow generation
            would require agent execution nodes from Kaizen framework.
        """
        pipeline = await self.get_with_graph(pipeline_id)
        if not pipeline:
            raise ValueError(f"Pipeline {pipeline_id} not found")

        # Validate first
        validation = await self.validate(pipeline_id)
        if not validation["valid"]:
            raise ValueError(f"Invalid pipeline: {validation['errors']}")

        workflow = WorkflowBuilder()
        nodes = pipeline.get("nodes", [])
        connections = pipeline.get("connections", [])

        # Create workflow nodes
        # Note: This is a placeholder - actual agent execution would use
        # Kaizen AgentNode or similar constructs
        for node in nodes:
            node_id = node["id"]
            node_type = node["node_type"]

            if node_type == "input":
                # Input node passes through
                workflow.add_node(
                    "PassThroughNode",
                    node_id,
                    {
                        "data": "${input}",
                    },
                )
            elif node_type == "output":
                # Output node collects results
                workflow.add_node(
                    "PassThroughNode",
                    node_id,
                    {
                        "data": "${input}",
                    },
                )
            elif node_type == "agent":
                # Agent node would execute agent
                # Placeholder for agent execution
                config = (
                    json.loads(node.get("config", "{}")) if node.get("config") else {}
                )
                workflow.add_node(
                    "PassThroughNode",
                    node_id,
                    {
                        "data": "${input}",
                        "agent_id": node.get("agent_id", ""),
                        **config,
                    },
                )
            elif node_type == "condition":
                # Condition node for routing
                config = (
                    json.loads(node.get("config", "{}")) if node.get("config") else {}
                )
                workflow.add_node("SwitchNode", node_id, config)
            elif node_type == "merge":
                # Merge node for combining results
                workflow.add_node("MergeNode", node_id, {})

        # Create workflow connections
        for conn in connections:
            workflow.add_connection(
                conn["source_node_id"],
                conn.get("source_handle", "output"),
                conn["target_node_id"],
                conn.get("target_handle", "input"),
            )

        return workflow

    # ===================
    # Pattern Info
    # ===================

    def get_patterns(self) -> dict:
        """
        Get available orchestration patterns.

        Returns:
            Dict of pattern names to descriptions
        """
        return ORCHESTRATION_PATTERNS.copy()
