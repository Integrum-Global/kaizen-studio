"""
Test Service

Test execution operations for agents and pipelines using DataFlow nodes.
"""

import json
import time
import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.services.agent_service import AgentService
from studio.services.pipeline_service import PipelineService


class TestService:
    """
    Test service for executing agent and pipeline tests.

    Uses DataFlow nodes for all database operations.
    """

    def __init__(self):
        """Initialize the test service."""
        self.runtime = AsyncLocalRuntime()
        self.agent_service = AgentService()
        self.pipeline_service = PipelineService()

    # ===================
    # Agent Testing
    # ===================

    async def run_agent_test(
        self,
        agent_id: str,
        input_data: dict,
        user_id: str,
        options: dict | None = None,
    ) -> dict:
        """
        Run a test execution for an agent.

        Args:
            agent_id: Agent ID
            input_data: Test input data
            user_id: User ID running the test
            options: Optional execution options (timeout_ms, stream)

        Returns:
            Test execution result
        """
        # Get agent
        agent = await self.agent_service.get(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")

        options = options or {}
        now = datetime.now(UTC).isoformat()
        execution_id = str(uuid.uuid4())

        # Create pending execution record
        workflow = WorkflowBuilder()
        workflow.add_node(
            "TestExecutionCreateNode",
            "create",
            {
                "id": execution_id,
                "organization_id": agent["organization_id"],
                "agent_id": agent_id,
                "pipeline_id": "",
                "input_data": json.dumps(input_data),
                "output_data": "",
                "status": "running",
                "execution_time_ms": 0,
                "token_usage": json.dumps({"input": 0, "output": 0, "total": 0}),
                "error_message": "",
                "created_by": user_id,
                "created_at": now,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Execute agent test
        start_time = time.time()
        try:
            # Here we would execute the actual agent
            # For now, simulate execution with agent config
            output_data = await self._execute_agent(agent, input_data, options)
            execution_time_ms = int((time.time() - start_time) * 1000)

            # Update execution with results
            await self._update_execution(
                execution_id,
                status="completed",
                output_data=json.dumps(output_data),
                execution_time_ms=execution_time_ms,
                token_usage=json.dumps(
                    output_data.get(
                        "_token_usage", {"input": 0, "output": 0, "total": 0}
                    )
                ),
            )

            return await self.get_execution(execution_id)

        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)

            # Update execution with error
            await self._update_execution(
                execution_id,
                status="failed",
                execution_time_ms=execution_time_ms,
                error_message=str(e),
            )

            return await self.get_execution(execution_id)

    async def _execute_agent(
        self,
        agent: dict,
        input_data: dict,
        options: dict,
    ) -> dict:
        """
        Execute an agent with input data using Kaizen BaseAgent.

        Args:
            agent: Agent configuration
            input_data: Input data
            options: Execution options (timeout_ms, stream)

        Returns:
            Agent output with token usage
        """
        from dataclasses import dataclass

        from kaizen.core.base_agent import BaseAgent
        from kaizen.signatures import InputField, OutputField, Signature

        # Create dynamic signature based on input_data keys
        # This allows flexible input/output without predefined schemas
        class DynamicSignature(Signature):
            """Dynamic signature for flexible agent execution."""

            # Primary input field - message or query
            input: str = InputField(desc="The input data for the agent")

            # Output field
            output: str = OutputField(desc="The agent's response")

        # Create agent config from stored configuration
        @dataclass
        class AgentConfig:
            """Configuration extracted from stored agent."""

            llm_provider: str = "openai"
            model: str = "gpt-4"
            temperature: float = 0.7
            max_tokens: int = 1000

        # Parse agent configuration
        config = AgentConfig(
            llm_provider="openai",  # Default for now
            model=agent.get("model_id", "gpt-4"),
            temperature=float(agent.get("temperature", 0.7)),
            max_tokens=int(agent.get("max_tokens", 1000) or 1000),
        )

        # Create BaseAgent instance
        kaizen_agent = BaseAgent(
            config=config,
            signature=DynamicSignature(),
        )

        # Prepare input - convert dict to a formatted string
        if isinstance(input_data, dict):
            # Extract primary message or convert to JSON string
            agent_input = (
                input_data.get("message")
                or input_data.get("query")
                or json.dumps(input_data)
            )
        else:
            agent_input = str(input_data)

        # Execute agent with system prompt if provided
        try:
            result = kaizen_agent.run(
                input=agent_input,
            )

            # Extract output and token usage
            output = result.get("output", "")

            # Calculate token usage (rough estimate)
            input_tokens = len(json.dumps(input_data))
            output_tokens = len(output)

            return {
                "response": output,
                "output": output,  # Include both for compatibility
                "_token_usage": {
                    "input": input_tokens,
                    "output": output_tokens,
                    "total": input_tokens + output_tokens,
                },
            }

        except Exception as e:
            # Return error details
            raise RuntimeError(f"Agent execution failed: {str(e)}") from e

    # ===================
    # Pipeline Testing
    # ===================

    async def run_pipeline_test(
        self,
        pipeline_id: str,
        input_data: dict,
        user_id: str,
        options: dict | None = None,
    ) -> dict:
        """
        Run a test execution for a pipeline.

        Args:
            pipeline_id: Pipeline ID
            input_data: Test input data
            user_id: User ID running the test
            options: Optional execution options

        Returns:
            Test execution result
        """
        # Get pipeline with graph
        pipeline = await self.pipeline_service.get_with_graph(pipeline_id)
        if not pipeline:
            raise ValueError(f"Pipeline {pipeline_id} not found")

        # Validate pipeline
        validation = await self.pipeline_service.validate(pipeline_id)
        if not validation["valid"]:
            raise ValueError(f"Invalid pipeline: {validation['errors']}")

        options = options or {}
        now = datetime.now(UTC).isoformat()
        execution_id = str(uuid.uuid4())

        # Create pending execution record
        workflow = WorkflowBuilder()
        workflow.add_node(
            "TestExecutionCreateNode",
            "create",
            {
                "id": execution_id,
                "organization_id": pipeline["organization_id"],
                "agent_id": "",
                "pipeline_id": pipeline_id,
                "input_data": json.dumps(input_data),
                "output_data": "",
                "status": "running",
                "execution_time_ms": 0,
                "token_usage": json.dumps({"input": 0, "output": 0, "total": 0}),
                "error_message": "",
                "created_by": user_id,
                "created_at": now,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Execute pipeline test
        start_time = time.time()
        try:
            output_data = await self._execute_pipeline(pipeline, input_data, options)
            execution_time_ms = int((time.time() - start_time) * 1000)

            # Update execution with results
            await self._update_execution(
                execution_id,
                status="completed",
                output_data=json.dumps(output_data),
                execution_time_ms=execution_time_ms,
                token_usage=json.dumps(
                    output_data.get(
                        "_token_usage", {"input": 0, "output": 0, "total": 0}
                    )
                ),
            )

            return await self.get_execution(execution_id)

        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)

            # Update execution with error
            await self._update_execution(
                execution_id,
                status="failed",
                execution_time_ms=execution_time_ms,
                error_message=str(e),
            )

            return await self.get_execution(execution_id)

    async def _execute_pipeline(
        self,
        pipeline: dict,
        input_data: dict,
        options: dict,
    ) -> dict:
        """
        Execute a pipeline by building and executing a Kailash workflow.

        Args:
            pipeline: Pipeline with graph (nodes and connections)
            input_data: Input data
            options: Execution options

        Returns:
            Pipeline output with token usage
        """
        from dataclasses import dataclass

        from kaizen.signatures import InputField, OutputField, Signature

        # Get nodes and connections
        nodes = pipeline.get("nodes", [])
        connections = pipeline.get("connections", [])

        if not nodes:
            return {
                "response": "Pipeline has no nodes to execute",
                "_token_usage": {"input": 0, "output": 0, "total": 0},
            }

        # Build workflow from pipeline graph
        workflow = WorkflowBuilder()

        # Create signature for agent nodes
        class DynamicSignature(Signature):
            """Dynamic signature for pipeline agents."""

            input: str = InputField(desc="The input data")
            output: str = OutputField(desc="The output data")

        @dataclass
        class AgentConfig:
            """Configuration for pipeline agents."""

            llm_provider: str = "openai"
            model: str = "gpt-4"
            temperature: float = 0.7
            max_tokens: int = 1000

        # Process each node and add to workflow
        node_outputs = {}

        # Find input nodes (nodes with no incoming connections)
        incoming_map = {}
        for conn in connections:
            target = conn["target_node_id"]
            if target not in incoming_map:
                incoming_map[target] = []
            incoming_map[target].append(conn["source_node_id"])

        # Get input nodes (nodes with node_type='input' or no incoming connections)
        input_nodes = [
            n for n in nodes if n["node_type"] == "input" or n["id"] not in incoming_map
        ]

        # Get output nodes (nodes with node_type='output' or no outgoing connections)
        outgoing_map = {}
        for conn in connections:
            source = conn["source_node_id"]
            if source not in outgoing_map:
                outgoing_map[source] = []
            outgoing_map[source].append(conn["target_node_id"])

        output_nodes = [
            n
            for n in nodes
            if n["node_type"] == "output" or n["id"] not in outgoing_map
        ]

        # Execute nodes in topological order
        # For simplicity, we'll execute sequentially based on connections
        # In a real implementation, you'd want proper topological sorting

        executed_nodes = set()
        total_input_tokens = len(json.dumps(input_data))
        total_output_tokens = 0

        async def execute_node(node: dict, node_input: dict) -> dict:
            """Execute a single pipeline node."""
            nonlocal total_output_tokens

            node_type = node["node_type"]
            node_id = node["id"]

            if node_type == "input":
                # Input node just passes data through
                return node_input

            elif node_type == "output":
                # Output node returns the final result
                return node_input

            elif node_type == "agent":
                # Execute the associated agent using shared _execute_agent method
                agent_id = node.get("agent_id")
                if not agent_id:
                    return {"output": "No agent configured for this node"}

                # Get agent configuration
                agent = await self.agent_service.get(agent_id)
                if not agent:
                    return {"output": f"Agent {agent_id} not found"}

                # Use shared execution method for consistency and testability
                result = await self._execute_agent(agent, node_input, options)
                output = result.get("output", "")
                total_output_tokens += result.get("_token_usage", {}).get(
                    "output", len(output)
                )

                return {"output": output}

            elif node_type == "condition":
                # Conditional node evaluates and passes data
                return node_input

            elif node_type == "merge":
                # Merge node combines multiple inputs
                return node_input

            else:
                # Unknown node type
                return {"output": f"Unknown node type: {node_type}"}

        # Execute pipeline based on pattern
        pattern = pipeline.get("pattern", "sequential")

        if pattern == "sequential":
            # Execute nodes in sequence
            current_data = input_data

            for node in nodes:
                if node["node_type"] != "input":
                    result = await execute_node(node, current_data)
                    current_data = result
                    executed_nodes.add(node["id"])

            final_output = current_data.get("output", json.dumps(current_data))

        elif pattern == "parallel":
            # Execute all agent nodes in parallel
            agent_nodes = [n for n in nodes if n["node_type"] == "agent"]

            results = []
            for node in agent_nodes:
                result = await execute_node(node, input_data)
                results.append(result.get("output", ""))
                executed_nodes.add(node["id"])

            # Combine results
            final_output = "\n\n".join(results)

        else:
            # For other patterns, execute sequentially as fallback
            current_data = input_data

            for node in nodes:
                if node["node_type"] not in ["input", "output"]:
                    result = await execute_node(node, current_data)
                    current_data = result
                    executed_nodes.add(node["id"])

            final_output = current_data.get("output", json.dumps(current_data))

        return {
            "response": final_output,
            "output": final_output,
            "nodes_executed": len(executed_nodes),
            "_token_usage": {
                "input": total_input_tokens,
                "output": total_output_tokens,
                "total": total_input_tokens + total_output_tokens,
            },
        }

    # ===================
    # Node Testing
    # ===================

    async def run_node_test(
        self,
        pipeline_id: str,
        node_id: str,
        input_data: dict,
        user_id: str,
        options: dict | None = None,
    ) -> dict:
        """
        Run a test execution for a single node in a pipeline.

        Args:
            pipeline_id: Pipeline ID
            node_id: Node ID to test
            input_data: Test input data
            user_id: User ID running the test
            options: Optional execution options

        Returns:
            Test execution result
        """
        # Get pipeline
        pipeline = await self.pipeline_service.get(pipeline_id)
        if not pipeline:
            raise ValueError(f"Pipeline {pipeline_id} not found")

        # Get node
        node = await self.pipeline_service.get_node(node_id)
        if not node:
            raise ValueError(f"Node {node_id} not found")

        if node["pipeline_id"] != pipeline_id:
            raise ValueError(
                f"Node {node_id} does not belong to pipeline {pipeline_id}"
            )

        options = options or {}
        now = datetime.now(UTC).isoformat()
        execution_id = str(uuid.uuid4())

        # Create pending execution record
        workflow = WorkflowBuilder()
        workflow.add_node(
            "TestExecutionCreateNode",
            "create",
            {
                "id": execution_id,
                "organization_id": pipeline["organization_id"],
                "agent_id": node.get("agent_id", ""),
                "pipeline_id": pipeline_id,
                "input_data": json.dumps({"node_id": node_id, **input_data}),
                "output_data": "",
                "status": "running",
                "execution_time_ms": 0,
                "token_usage": json.dumps({"input": 0, "output": 0, "total": 0}),
                "error_message": "",
                "created_by": user_id,
                "created_at": now,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Execute node test
        start_time = time.time()
        try:
            output_data = await self._execute_node(node, input_data, options)
            execution_time_ms = int((time.time() - start_time) * 1000)

            # Update execution with results
            await self._update_execution(
                execution_id,
                status="completed",
                output_data=json.dumps(output_data),
                execution_time_ms=execution_time_ms,
                token_usage=json.dumps(
                    output_data.get(
                        "_token_usage", {"input": 0, "output": 0, "total": 0}
                    )
                ),
            )

            return await self.get_execution(execution_id)

        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)

            # Update execution with error
            await self._update_execution(
                execution_id,
                status="failed",
                execution_time_ms=execution_time_ms,
                error_message=str(e),
            )

            return await self.get_execution(execution_id)

    async def _execute_node(
        self,
        node: dict,
        input_data: dict,
        options: dict,
    ) -> dict:
        """
        Execute a single node with input data.

        Args:
            node: Node configuration
            input_data: Input data
            options: Execution options

        Returns:
            Node output with token usage
        """

        node_type = node["node_type"]

        if node_type == "input":
            # Input node just returns the input data
            return {
                "response": json.dumps(input_data),
                "output": json.dumps(input_data),
                "_token_usage": {"input": 0, "output": 0, "total": 0},
            }

        elif node_type == "output":
            # Output node returns formatted output
            return {
                "response": json.dumps(input_data),
                "output": json.dumps(input_data),
                "_token_usage": {"input": 0, "output": 0, "total": 0},
            }

        elif node_type == "agent":
            # Execute the associated agent
            agent_id = node.get("agent_id")
            if not agent_id:
                raise ValueError(
                    f"Agent node '{node['id']}' has no agent_id configured"
                )

            # Get agent configuration
            agent = await self.agent_service.get(agent_id)
            if not agent:
                raise ValueError(f"Agent {agent_id} not found")

            # Use the _execute_agent method
            return await self._execute_agent(agent, input_data, options)

        elif node_type == "condition":
            # Conditional node evaluates and returns data
            # For now, just pass through
            return {
                "response": json.dumps(input_data),
                "output": json.dumps(input_data),
                "condition_met": True,  # Placeholder
                "_token_usage": {"input": 0, "output": 0, "total": 0},
            }

        elif node_type == "merge":
            # Merge node combines data
            # For now, just pass through
            return {
                "response": json.dumps(input_data),
                "output": json.dumps(input_data),
                "_token_usage": {"input": 0, "output": 0, "total": 0},
            }

        else:
            # Unknown node type - return placeholder response for backward compatibility
            return {
                "response": f"Node type '{node_type}' processed (node: {node.get('label', node['id'])})",
                "output": json.dumps(input_data),
                "_token_usage": {"input": 10, "output": 10, "total": 20},
            }

    # ===================
    # Execution History
    # ===================

    async def list_executions(
        self,
        organization_id: str,
        agent_id: str | None = None,
        pipeline_id: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict:
        """
        List test executions with optional filters.

        Args:
            organization_id: Organization ID
            agent_id: Optional agent ID filter
            pipeline_id: Optional pipeline ID filter
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        workflow = WorkflowBuilder()

        # Build filter
        filters = {"organization_id": organization_id}
        if agent_id:
            filters["agent_id"] = agent_id
        if pipeline_id:
            filters["pipeline_id"] = pipeline_id

        workflow.add_node(
            "TestExecutionListNode",
            "list",
            {
                "filter": filters,
                "limit": limit,
                "offset": offset,
                "skip_cache": True,  # Ensure fresh data after deletions
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        records = list_result.get("records", [])

        # Sort by created_at descending (most recent first)
        records = sorted(records, key=lambda x: x.get("created_at", ""), reverse=True)

        return {
            "records": records,
            "total": list_result.get(
                "count", 0
            ),  # DataFlow returns 'count', not 'total'
        }

    async def get_execution(self, execution_id: str) -> dict | None:
        """
        Get a test execution by ID.

        Args:
            execution_id: Execution ID

        Returns:
            Execution data if found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "TestExecutionReadNode",
            "read",
            {
                "id": execution_id,
            },
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
        except Exception:
            # Record not found or other error
            return None

        execution = results.get("read")
        if execution:
            # Parse JSON fields for response
            try:
                execution["input_data"] = json.loads(execution.get("input_data", "{}"))
            except (json.JSONDecodeError, TypeError):
                execution["input_data"] = {}

            try:
                execution["output_data"] = (
                    json.loads(execution.get("output_data", "{}"))
                    if execution.get("output_data")
                    else {}
                )
            except (json.JSONDecodeError, TypeError):
                execution["output_data"] = {}

            try:
                execution["token_usage"] = json.loads(
                    execution.get("token_usage", "{}")
                )
            except (json.JSONDecodeError, TypeError):
                execution["token_usage"] = {"input": 0, "output": 0, "total": 0}

        return execution

    async def delete_execution(self, execution_id: str) -> bool:
        """
        Delete a test execution.

        Args:
            execution_id: Execution ID

        Returns:
            True if deleted
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "TestExecutionDeleteNode",
            "delete",
            {
                "id": execution_id,
                "hard": True,  # Permanently delete the record
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return True

    async def stop_execution(self, execution_id: str) -> bool:
        """
        Stop a running test execution.

        Args:
            execution_id: Execution ID

        Returns:
            True if stopped
        """
        # Update status to stopped
        await self._update_execution(
            execution_id,
            status="stopped",
            error_message="Execution stopped by user",
        )

        return True

    # ===================
    # Internal Helpers
    # ===================

    async def _update_execution(
        self,
        execution_id: str,
        status: str | None = None,
        output_data: str | None = None,
        execution_time_ms: int | None = None,
        token_usage: str | None = None,
        error_message: str | None = None,
    ) -> None:
        """
        Update a test execution record.

        Args:
            execution_id: Execution ID
            status: New status
            output_data: Output data JSON
            execution_time_ms: Execution time
            token_usage: Token usage JSON
            error_message: Error message
        """
        fields = {}
        if status is not None:
            fields["status"] = status
        if output_data is not None:
            fields["output_data"] = output_data
        if execution_time_ms is not None:
            fields["execution_time_ms"] = execution_time_ms
        if token_usage is not None:
            fields["token_usage"] = token_usage
        if error_message is not None:
            fields["error_message"] = error_message

        if not fields:
            return

        workflow = WorkflowBuilder()
        workflow.add_node(
            "TestExecutionUpdateNode",
            "update",
            {
                "filter": {"id": execution_id},
                "fields": fields,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})
