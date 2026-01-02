"""
Tier 1: Test Service Unit Tests

Tests test service logic in isolation with mocked DataFlow operations.
Mocking is allowed in Tier 1 for external dependencies.
"""

import json
from unittest.mock import AsyncMock

import pytest


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAgentTestExecution:
    """Test agent test execution logic."""

    @pytest.mark.asyncio
    async def test_run_agent_test_success(self):
        """Should successfully execute agent test."""
        from studio.services.test_service import TestService

        test_service = TestService()

        # Mock agent service
        test_service.agent_service.get = AsyncMock(
            return_value={
                "id": "agent-1",
                "organization_id": "org-1",
                "name": "Test Agent",
                "agent_type": "chat",
                "model_id": "gpt-4",
            }
        )

        # Mock _execute_agent to avoid actual LLM calls
        test_service._execute_agent = AsyncMock(
            return_value={"response": "test response"}
        )

        # Mock runtime execution for creating execution record
        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"create": {"id": "exec-1"}}, "run-1")
        )

        # Mock get_execution
        test_service.get_execution = AsyncMock(
            return_value={
                "id": "exec-1",
                "agent_id": "agent-1",
                "organization_id": "org-1",
                "status": "completed",
                "input_data": {"message": "test"},
                "output_data": {"response": "test response"},
                "execution_time_ms": 150,
                "token_usage": {"input": 10, "output": 20, "total": 30},
                "error_message": "",
            }
        )

        result = await test_service.run_agent_test(
            agent_id="agent-1",
            input_data={"message": "test"},
            user_id="user-1",
        )

        assert result["id"] == "exec-1"
        assert result["status"] == "completed"
        assert result["agent_id"] == "agent-1"

    @pytest.mark.asyncio
    async def test_run_agent_test_agent_not_found(self):
        """Should raise error when agent not found."""
        from studio.services.test_service import TestService

        test_service = TestService()
        test_service.agent_service.get = AsyncMock(return_value=None)

        with pytest.raises(ValueError, match="Agent .* not found"):
            await test_service.run_agent_test(
                agent_id="invalid-id",
                input_data={"message": "test"},
                user_id="user-1",
            )

    @pytest.mark.asyncio
    async def test_execute_agent_returns_response(self):
        """Should generate agent response with token usage."""
        from studio.services.test_service import TestService

        test_service = TestService()

        agent = {
            "id": "agent-1",
            "name": "Test Agent",
            "organization_id": "org-1",
        }
        input_data = {"message": "hello"}
        options = {}

        result = await test_service._execute_agent(agent, input_data, options)

        assert "response" in result
        assert "_token_usage" in result
        assert "input" in result["_token_usage"]
        assert "output" in result["_token_usage"]
        assert "total" in result["_token_usage"]
        assert result["_token_usage"]["total"] > 0


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPipelineTestExecution:
    """Test pipeline test execution logic."""

    @pytest.mark.asyncio
    async def test_run_pipeline_test_success(self):
        """Should successfully execute pipeline test."""
        from studio.services.test_service import TestService

        test_service = TestService()

        # Mock pipeline service
        test_service.pipeline_service.get_with_graph = AsyncMock(
            return_value={
                "id": "pipe-1",
                "organization_id": "org-1",
                "name": "Test Pipeline",
                "nodes": [],
            }
        )
        test_service.pipeline_service.validate = AsyncMock(
            return_value={
                "valid": True,
                "errors": [],
            }
        )

        # Mock runtime
        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"create": {"id": "exec-1"}}, "run-1")
        )

        # Mock get_execution
        test_service.get_execution = AsyncMock(
            return_value={
                "id": "exec-1",
                "pipeline_id": "pipe-1",
                "organization_id": "org-1",
                "status": "completed",
                "input_data": {"data": "test"},
                "output_data": {"result": "success"},
                "execution_time_ms": 200,
                "token_usage": {"input": 20, "output": 30, "total": 50},
                "error_message": "",
            }
        )

        result = await test_service.run_pipeline_test(
            pipeline_id="pipe-1",
            input_data={"data": "test"},
            user_id="user-1",
        )

        assert result["id"] == "exec-1"
        assert result["status"] == "completed"
        assert result["pipeline_id"] == "pipe-1"

    @pytest.mark.asyncio
    async def test_run_pipeline_test_pipeline_not_found(self):
        """Should raise error when pipeline not found."""
        from studio.services.test_service import TestService

        test_service = TestService()
        test_service.pipeline_service.get_with_graph = AsyncMock(return_value=None)

        with pytest.raises(ValueError, match="Pipeline .* not found"):
            await test_service.run_pipeline_test(
                pipeline_id="invalid-id",
                input_data={"data": "test"},
                user_id="user-1",
            )

    @pytest.mark.asyncio
    async def test_run_pipeline_test_validation_failure(self):
        """Should raise error when pipeline validation fails."""
        from studio.services.test_service import TestService

        test_service = TestService()
        test_service.pipeline_service.get_with_graph = AsyncMock(
            return_value={
                "id": "pipe-1",
                "organization_id": "org-1",
            }
        )
        test_service.pipeline_service.validate = AsyncMock(
            return_value={
                "valid": False,
                "errors": ["Missing required connection"],
            }
        )

        with pytest.raises(ValueError, match="Invalid pipeline"):
            await test_service.run_pipeline_test(
                pipeline_id="pipe-1",
                input_data={"data": "test"},
                user_id="user-1",
            )

    @pytest.mark.asyncio
    async def test_execute_pipeline_returns_response(self):
        """Should generate pipeline response with token usage."""
        from studio.services.test_service import TestService

        test_service = TestService()

        pipeline = {
            "id": "pipe-1",
            "name": "Test Pipeline",
            "pattern": "sequential",
            "nodes": [
                {"id": "node-1", "node_type": "input", "label": "Input"},
                {"id": "node-2", "node_type": "output", "label": "Output"},
            ],
        }
        input_data = {"data": "test"}
        options = {}

        result = await test_service._execute_pipeline(pipeline, input_data, options)

        assert "response" in result or "output" in result
        assert "_token_usage" in result
        assert "nodes_executed" in result


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestNodeTestExecution:
    """Test node test execution logic."""

    @pytest.mark.asyncio
    async def test_run_node_test_success(self):
        """Should successfully execute node test."""
        from studio.services.test_service import TestService

        test_service = TestService()

        # Mock services
        test_service.pipeline_service.get = AsyncMock(
            return_value={
                "id": "pipe-1",
                "organization_id": "org-1",
            }
        )
        test_service.pipeline_service.get_node = AsyncMock(
            return_value={
                "id": "node-1",
                "pipeline_id": "pipe-1",
                "node_type": "ai",
                "label": "Test Node",
            }
        )

        # Mock runtime
        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"create": {"id": "exec-1"}}, "run-1")
        )

        # Mock get_execution
        test_service.get_execution = AsyncMock(
            return_value={
                "id": "exec-1",
                "pipeline_id": "pipe-1",
                "organization_id": "org-1",
                "status": "completed",
                "input_data": {"node_id": "node-1", "data": "test"},
                "output_data": {"result": "success"},
                "execution_time_ms": 100,
                "token_usage": {"input": 15, "output": 15, "total": 30},
                "error_message": "",
            }
        )

        result = await test_service.run_node_test(
            pipeline_id="pipe-1",
            node_id="node-1",
            input_data={"data": "test"},
            user_id="user-1",
        )

        assert result["id"] == "exec-1"
        assert result["status"] == "completed"

    @pytest.mark.asyncio
    async def test_run_node_test_pipeline_not_found(self):
        """Should raise error when pipeline not found."""
        from studio.services.test_service import TestService

        test_service = TestService()
        test_service.pipeline_service.get = AsyncMock(return_value=None)

        with pytest.raises(ValueError, match="Pipeline .* not found"):
            await test_service.run_node_test(
                pipeline_id="invalid-id",
                node_id="node-1",
                input_data={"data": "test"},
                user_id="user-1",
            )

    @pytest.mark.asyncio
    async def test_run_node_test_node_not_found(self):
        """Should raise error when node not found."""
        from studio.services.test_service import TestService

        test_service = TestService()
        test_service.pipeline_service.get = AsyncMock(
            return_value={
                "id": "pipe-1",
                "organization_id": "org-1",
            }
        )
        test_service.pipeline_service.get_node = AsyncMock(return_value=None)

        with pytest.raises(ValueError, match="Node .* not found"):
            await test_service.run_node_test(
                pipeline_id="pipe-1",
                node_id="invalid-id",
                input_data={"data": "test"},
                user_id="user-1",
            )

    @pytest.mark.asyncio
    async def test_run_node_test_node_not_in_pipeline(self):
        """Should raise error when node doesn't belong to pipeline."""
        from studio.services.test_service import TestService

        test_service = TestService()
        test_service.pipeline_service.get = AsyncMock(
            return_value={
                "id": "pipe-1",
                "organization_id": "org-1",
            }
        )
        test_service.pipeline_service.get_node = AsyncMock(
            return_value={
                "id": "node-1",
                "pipeline_id": "pipe-2",  # Different pipeline
                "node_type": "ai",
            }
        )

        with pytest.raises(ValueError, match="does not belong to pipeline"):
            await test_service.run_node_test(
                pipeline_id="pipe-1",
                node_id="node-1",
                input_data={"data": "test"},
                user_id="user-1",
            )

    @pytest.mark.asyncio
    async def test_execute_node_returns_response(self):
        """Should generate node response with token usage."""
        from studio.services.test_service import TestService

        test_service = TestService()

        node = {
            "id": "node-1",
            "node_type": "input",
            "label": "Test Node",
        }
        input_data = {"data": "test"}
        options = {}

        result = await test_service._execute_node(node, input_data, options)

        assert "response" in result or "output" in result
        assert "_token_usage" in result


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestExecutionHistory:
    """Test execution history listing."""

    @pytest.mark.asyncio
    async def test_list_executions_returns_records(self):
        """Should list test executions."""
        from studio.services.test_service import TestService

        test_service = TestService()

        # Mock runtime
        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=(
                {
                    "list": {
                        "records": [
                            {
                                "id": "exec-1",
                                "agent_id": "agent-1",
                                "pipeline_id": "",
                                "status": "completed",
                                "created_at": "2024-01-01T10:00:00Z",
                            },
                            {
                                "id": "exec-2",
                                "agent_id": "agent-1",
                                "pipeline_id": "",
                                "status": "completed",
                                "created_at": "2024-01-01T09:00:00Z",
                            },
                        ],
                        "count": 2,  # DataFlow returns 'count', not 'total'
                    }
                },
                "run-1",
            )
        )

        result = await test_service.list_executions(
            organization_id="org-1",
            agent_id="agent-1",
            limit=20,
            offset=0,
        )

        assert len(result["records"]) == 2
        assert result["total"] == 2
        assert result["records"][0]["id"] == "exec-1"

    @pytest.mark.asyncio
    async def test_list_executions_with_pipeline_filter(self):
        """Should list executions for specific pipeline."""
        from studio.services.test_service import TestService

        test_service = TestService()

        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=(
                {
                    "list": {
                        "records": [
                            {
                                "id": "exec-1",
                                "agent_id": "",
                                "pipeline_id": "pipe-1",
                                "status": "completed",
                                "created_at": "2024-01-01T10:00:00Z",
                            },
                        ],
                        "count": 1,  # DataFlow returns 'count', not 'total'
                    }
                },
                "run-1",
            )
        )

        result = await test_service.list_executions(
            organization_id="org-1",
            pipeline_id="pipe-1",
        )

        assert result["total"] == 1  # Service maps 'count' to 'total' in response
        assert result["records"][0]["pipeline_id"] == "pipe-1"

    @pytest.mark.asyncio
    async def test_list_executions_sorts_by_date_descending(self):
        """Should sort executions by date descending (most recent first)."""
        from studio.services.test_service import TestService

        test_service = TestService()

        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=(
                {
                    "list": {
                        "records": [
                            {
                                "id": "exec-1",
                                "agent_id": "agent-1",
                                "status": "completed",
                                "created_at": "2024-01-01T09:00:00Z",
                            },
                            {
                                "id": "exec-2",
                                "agent_id": "agent-1",
                                "status": "completed",
                                "created_at": "2024-01-01T10:00:00Z",
                            },
                        ],
                        "total": 2,
                    }
                },
                "run-1",
            )
        )

        result = await test_service.list_executions(
            organization_id="org-1",
            agent_id="agent-1",
        )

        # Should be sorted descending by created_at
        assert result["records"][0]["id"] == "exec-2"
        assert result["records"][1]["id"] == "exec-1"

    @pytest.mark.asyncio
    async def test_get_execution_success(self):
        """Should retrieve execution by ID."""
        from studio.services.test_service import TestService

        test_service = TestService()

        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=(
                {
                    "read": {
                        "id": "exec-1",
                        "agent_id": "agent-1",
                        "status": "completed",
                        "input_data": json.dumps({"message": "test"}),
                        "output_data": json.dumps({"response": "result"}),
                        "token_usage": json.dumps(
                            {"input": 10, "output": 20, "total": 30}
                        ),
                        "execution_time_ms": 150,
                    }
                },
                "run-1",
            )
        )

        result = await test_service.get_execution("exec-1")

        assert result["id"] == "exec-1"
        assert result["status"] == "completed"
        assert isinstance(result["input_data"], dict)
        assert result["input_data"]["message"] == "test"
        assert isinstance(result["output_data"], dict)
        assert isinstance(result["token_usage"], dict)
        assert result["token_usage"]["total"] == 30

    @pytest.mark.asyncio
    async def test_get_execution_parses_json_fields(self):
        """Should parse JSON fields in execution."""
        from studio.services.test_service import TestService

        test_service = TestService()

        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=(
                {
                    "read": {
                        "id": "exec-1",
                        "input_data": '{"key": "value"}',
                        "output_data": '{"result": "success"}',
                        "token_usage": '{"input": 5, "output": 10, "total": 15}',
                    }
                },
                "run-1",
            )
        )

        result = await test_service.get_execution("exec-1")

        assert result["input_data"]["key"] == "value"
        assert result["output_data"]["result"] == "success"
        assert result["token_usage"]["input"] == 5

    @pytest.mark.asyncio
    async def test_get_execution_handles_invalid_json(self):
        """Should handle invalid JSON in fields."""
        from studio.services.test_service import TestService

        test_service = TestService()

        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=(
                {
                    "read": {
                        "id": "exec-1",
                        "input_data": "invalid json",
                        "output_data": "also invalid",
                        "token_usage": "not json",
                    }
                },
                "run-1",
            )
        )

        result = await test_service.get_execution("exec-1")

        # Should return empty dicts for invalid JSON
        assert result["input_data"] == {}
        assert result["output_data"] == {}
        assert result["token_usage"] == {"input": 0, "output": 0, "total": 0}

    @pytest.mark.asyncio
    async def test_delete_execution_success(self):
        """Should delete execution."""
        from studio.services.test_service import TestService

        test_service = TestService()

        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"delete": True}, "run-1")
        )

        result = await test_service.delete_execution("exec-1")

        assert result is True


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestExecutionErrorHandling:
    """Test execution error handling and status updates."""

    @pytest.mark.asyncio
    async def test_agent_test_handles_execution_error(self):
        """Should handle errors during agent execution."""
        from studio.services.test_service import TestService

        test_service = TestService()

        # Mock agent service
        test_service.agent_service.get = AsyncMock(
            return_value={
                "id": "agent-1",
                "organization_id": "org-1",
                "name": "Test Agent",
            }
        )

        # Mock runtime for creation
        call_count = [0]

        async def mock_execute(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                # First call (create)
                return ({"create": {"id": "exec-1"}}, "run-1")
            else:
                # Second call (update)
                return ({}, "run-2")

        test_service.runtime.execute_workflow_async = mock_execute

        # Mock _execute_agent to raise error
        test_service._execute_agent = AsyncMock(side_effect=Exception("Test error"))

        # Mock get_execution
        test_service.get_execution = AsyncMock(
            return_value={
                "id": "exec-1",
                "status": "failed",
                "error_message": "Test error",
            }
        )

        result = await test_service.run_agent_test(
            agent_id="agent-1",
            input_data={"message": "test"},
            user_id="user-1",
        )

        assert result["status"] == "failed"
        assert result["error_message"] == "Test error"

    @pytest.mark.asyncio
    async def test_update_execution_partial_fields(self):
        """Should update only specified execution fields."""
        from studio.services.test_service import TestService

        test_service = TestService()

        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"update": {"id": "exec-1"}}, "run-1")
        )

        await test_service._update_execution(
            execution_id="exec-1",
            status="completed",
            execution_time_ms=150,
        )

        # Verify execute_workflow_async was called with correct fields
        call_args = test_service.runtime.execute_workflow_async.call_args
        workflow = call_args[0][0]
        # Workflow is already built (Workflow object, not WorkflowBuilder)
        assert workflow is not None
        # Verify it's a Workflow object
        assert hasattr(workflow, "nodes")

    @pytest.mark.asyncio
    async def test_update_execution_no_fields_does_nothing(self):
        """Should do nothing if no fields to update."""
        from studio.services.test_service import TestService

        test_service = TestService()

        test_service.runtime.execute_workflow_async = AsyncMock()

        await test_service._update_execution(execution_id="exec-1")

        # Should not call execute_workflow_async
        test_service.runtime.execute_workflow_async.assert_not_called()


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestExecutionOptionsHandling:
    """Test handling of execution options."""

    @pytest.mark.asyncio
    async def test_agent_test_with_options(self):
        """Should pass execution options to agent execution."""
        from studio.services.test_service import TestService

        test_service = TestService()

        test_service.agent_service.get = AsyncMock(
            return_value={
                "id": "agent-1",
                "organization_id": "org-1",
                "name": "Test Agent",
            }
        )

        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"create": {"id": "exec-1"}}, "run-1")
        )

        # Track _execute_agent calls
        executed_options = []

        async def mock_execute(agent, input_data, options):
            executed_options.append(options)
            return {
                "response": "test",
                "_token_usage": {"input": 0, "output": 0, "total": 0},
            }

        test_service._execute_agent = mock_execute
        test_service.get_execution = AsyncMock(
            return_value={
                "id": "exec-1",
                "status": "completed",
            }
        )

        options = {
            "timeout_ms": 60000,
            "stream": True,
        }

        await test_service.run_agent_test(
            agent_id="agent-1",
            input_data={"message": "test"},
            user_id="user-1",
            options=options,
        )

        assert len(executed_options) > 0
        assert executed_options[0]["timeout_ms"] == 60000
        assert executed_options[0]["stream"] is True

    @pytest.mark.asyncio
    async def test_agent_test_defaults_options_to_empty_dict(self):
        """Should default options to empty dict if not provided."""
        from studio.services.test_service import TestService

        test_service = TestService()

        test_service.agent_service.get = AsyncMock(
            return_value={
                "id": "agent-1",
                "organization_id": "org-1",
            }
        )

        test_service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"create": {"id": "exec-1"}}, "run-1")
        )

        # Track _execute_agent calls
        executed_options = []

        async def mock_execute(agent, input_data, options):
            executed_options.append(options)
            return {
                "response": "test",
                "_token_usage": {"input": 0, "output": 0, "total": 0},
            }

        test_service._execute_agent = mock_execute
        test_service.get_execution = AsyncMock(
            return_value={
                "id": "exec-1",
                "status": "completed",
            }
        )

        await test_service.run_agent_test(
            agent_id="agent-1",
            input_data={"message": "test"},
            user_id="user-1",
            options=None,
        )

        assert executed_options[0] == {}
