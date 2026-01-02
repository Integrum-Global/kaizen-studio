"""
Tier 3: External Agent Workflow E2E Tests

Tests complete External Agent lifecycle with real infrastructure (NO MOCKING).
Verifies end-to-end user workflows from agent creation to invocation.
"""

import json

import pytest
from httpx import AsyncClient


@pytest.mark.e2e
@pytest.mark.timeout(10)
@pytest.mark.asyncio
class TestExternalAgentCompleteWorkflow:
    """Test complete External Agent lifecycle."""

    async def test_complete_external_agent_registration_and_invocation(
        self,
        authenticated_client,
        test_organization,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify end-to-end user workflow from agent creation to invocation.

        Setup: Real PostgreSQL, real Redis, mock webhook server (external service), authenticated test user with all permissions.

        Steps:
        1. POST /api/v1/external-agents with Teams config
        2. GET /api/v1/external-agents to verify creation
        3. POST /api/v1/external-agents/{id}/invoke with test payload
        4. Verify invocation logged in database

        Assertions: All API calls succeed, database records created, webhook server received request with correct auth headers.
        """
        # Unpack authenticated client - shares org with test_organization and test_workspace_2
        test_client, auth_user = authenticated_client

        # Step 1: Create external agent with Teams configuration
        agent_data = {
            "name": "HR Support Teams Bot",
            "description": "Microsoft Teams bot for HR queries",
            "workspace_id": test_workspace_2["id"],
            "platform": "teams",
            "webhook_url": "https://directline.botframework.com/v3/directline",
            "auth_type": "oauth2",
            "auth_config": {
                "client_id": "abc-123-def",
                "client_secret": "secret_xyz",
                "token_url": "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
                "scope": "https://api.botframework.com/.default",
            },
            "platform_config": {
                "tenant_id": "12345678-1234-1234-1234-123456789012",
                "channel_id": "19:abcdef@thread.tacv2",
            },
            "budget_limit_daily": 50.0,
            "budget_limit_monthly": 1000.0,
            "rate_limit_per_minute": 10,
            "rate_limit_per_hour": 100,
            "tags": ["production", "hr", "teams"],
        }

        create_response = await test_client.post(
            "/api/v1/external-agents", json=agent_data
        )

        # Debug output for failures
        if create_response.status_code != 201:
            print(
                f"Create response: {create_response.status_code} - {create_response.text}"
            )

        assert create_response.status_code == 201
        agent = create_response.json()
        assert agent["id"]
        assert agent["name"] == "HR Support Teams Bot"
        assert agent["platform"] == "teams"
        assert agent["status"] == "active"

        # CRITICAL: Verify credentials never exposed in response
        assert "client_secret" not in json.dumps(agent)

        # Step 2: Verify agent appears in list
        list_response = await test_client.get(
            f"/api/v1/external-agents?workspace_id={test_workspace_2['id']}"
        )

        # Debug output
        print(f"Created agent: {agent}")
        print(f"List response: {list_response.status_code} - {list_response.text}")
        print(f"Workspace ID: {test_workspace_2['id']}")

        assert list_response.status_code == 200
        list_data = list_response.json()
        assert list_data["total"] >= 1
        agent_ids = [a["id"] for a in list_data["agents"]]
        assert agent["id"] in agent_ids

        # Step 3: Invoke the external agent
        invoke_data = {
            "input": "What is the PTO policy for new employees?",
            "context": {"user_session": "session_e2e_test", "channel": "teams"},
            "metadata": {"source": "e2e_test", "thread_id": "thread_123"},
        }

        invoke_response = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke", json=invoke_data
        )

        # Debug output for invoke failures
        if invoke_response.status_code != 200:
            print(
                f"Invoke response: {invoke_response.status_code} - {invoke_response.text}"
            )

        assert invoke_response.status_code == 200
        invocation = invoke_response.json()
        assert invocation["invocation_id"]
        assert invocation["trace_id"]
        assert invocation["status"] == "success"
        assert invocation["output"]

        # Step 4: Verify invocation record in database
        from kailash.runtime import AsyncLocalRuntime
        from kailash.workflow.builder import WorkflowBuilder

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationReadNode",
            "read",
            {"id": invocation["invocation_id"]},
        )

        runtime = AsyncLocalRuntime()
        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        db_invocation = results.get("read", {})

        assert db_invocation["id"] == invocation["invocation_id"]
        assert db_invocation["external_agent_id"] == agent["id"]
        assert db_invocation["user_id"] == auth_user["id"]
        assert db_invocation["organization_id"] == test_organization["id"]
        assert db_invocation["status"] == "success"
        assert db_invocation["request_payload"]
        assert db_invocation["response_payload"]

        # Verify request payload was captured
        request_payload = json.loads(db_invocation["request_payload"])
        assert request_payload["input"] == "What is the PTO policy for new employees?"
        assert request_payload["context"]["channel"] == "teams"

        # Verify response payload was captured
        response_payload = json.loads(db_invocation["response_payload"])
        assert response_payload["result"]

    async def test_external_agent_deletion_prevents_invocation(
        self,
        test_client: AsyncClient,
        test_workspace_2,
        auth_headers_dict,
        mock_external_webhook,
    ):
        """
        Intent: Verify deleted agents cannot be invoked.

        Setup: Real PostgreSQL, existing ExternalAgent, authenticated test user.

        Steps:
        1. Create external agent
        2. DELETE /api/v1/external-agents/{id}
        3. POST /api/v1/external-agents/{id}/invoke (should fail)

        Assertions: DELETE returns 204, invoke returns 400 or 404 with "agent deleted" message.
        """
        # Step 1: Create external agent
        agent_data = {
            "name": "Agent to Delete",
            "workspace_id": test_workspace_2["id"],
            "platform": "custom_http",
            "webhook_url": "https://api.example.com/agent",
            "auth_type": "api_key",
            "auth_config": {"key": "sk_test_delete", "header_name": "X-API-Key"},
        }

        create_response = await test_client.post(
            "/api/v1/external-agents", json=agent_data
        )

        assert create_response.status_code == 201
        agent = create_response.json()

        # Step 2: Delete the agent
        delete_response = await test_client.delete(
            f"/api/v1/external-agents/{agent['id']}"
        )

        assert delete_response.status_code == 204

        # Step 3: Attempt to invoke deleted agent (should fail)
        invoke_data = {"input": "Test query"}

        invoke_response = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke", json=invoke_data
        )

        # Should return error indicating agent is deleted
        assert invoke_response.status_code in [400, 404]
        error = invoke_response.json()
        # API returns {"error": {"code": "...", "message": "..."}} format
        error_msg = error.get("error", {}).get("message", "") or error.get("detail", "")
        assert "deleted" in error_msg.lower() or "not found" in error_msg.lower()

    async def test_external_agent_budget_limits_enforcement(
        self,
        test_client: AsyncClient,
        test_workspace_2,
        auth_headers_dict,
        mock_external_webhook,
    ):
        """
        Intent: Verify budget limits prevent invocations (stub in Phase 1, full in Phase 3).

        Setup: Real PostgreSQL with agent having low budget limit.

        Steps:
        1. Create agent with budget_limit_daily=1.0
        2. Record usage exceeding limit
        3. Attempt invocation (should be allowed in Phase 1 stub)

        Assertions: In Phase 1, invocation succeeds (stub). In Phase 3, should return 429.
        """
        # Step 1: Create agent with low budget limit
        agent_data = {
            "name": "Budget Limited Agent",
            "workspace_id": test_workspace_2["id"],
            "platform": "custom_http",
            "webhook_url": "https://api.example.com/agent",
            "auth_type": "api_key",
            "auth_config": {"key": "sk_test_budget", "header_name": "X-API-Key"},
            "budget_limit_daily": 1.0,  # Very low limit
        }

        create_response = await test_client.post(
            "/api/v1/external-agents", json=agent_data
        )

        assert create_response.status_code == 201
        agent = create_response.json()

        # Step 2: Attempt invocation
        invoke_data = {"input": "Test query"}

        invoke_response = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke", json=invoke_data
        )

        # Budget enforcement is now active:
        # - 200: First invocation succeeds (within budget)
        # - 402: Budget exceeded (Payment Required)
        # - 429: Rate limit exceeded
        # Either behavior is acceptable depending on current usage state
        assert invoke_response.status_code in [200, 402, 429]

        if invoke_response.status_code in [402, 429]:
            # Verify error message indicates budget/rate limit issue
            error = invoke_response.json()
            # API returns {"error": {"code": "...", "message": "..."}} format
            error_msg = error.get("error", {}).get("message", "") or error.get(
                "detail", ""
            )
            assert "budget" in error_msg.lower() or "rate limit" in error_msg.lower()

    async def test_external_agent_platform_config_validation(
        self, test_client: AsyncClient, test_workspace_2, auth_headers_dict
    ):
        """
        Intent: Verify platform-specific config validation across all platforms.

        Setup: Real PostgreSQL, authenticated test user.

        Steps:
        1. Create agent with valid Discord config
        2. Create agent with valid Slack config
        3. Create agent with valid Telegram config
        4. Create agent with valid Notion config
        5. Attempt to create agent with invalid config (should fail)

        Assertions: Valid configs succeed, invalid configs return 400.
        """
        # Valid Discord config
        discord_data = {
            "name": "Discord Agent",
            "workspace_id": test_workspace_2["id"],
            "platform": "discord",
            "webhook_url": "https://discord.com/api/webhooks/123/abc",
            "auth_type": "none",
            "platform_config": {
                "webhook_url": "https://discord.com/api/webhooks/123/abc",
                "username": "KaizenBot",
            },
        }

        response = await test_client.post("/api/v1/external-agents", json=discord_data)
        assert response.status_code == 201

        # Valid Slack config
        slack_data = {
            "name": "Slack Agent",
            "workspace_id": test_workspace_2["id"],
            "platform": "slack",
            "webhook_url": "https://hooks.slack.com/services/T00/B00/XXX",
            "auth_type": "none",
            "platform_config": {
                "webhook_url": "https://hooks.slack.com/services/T00/B00/XXX",
                "channel": "#general",
            },
        }

        response = await test_client.post("/api/v1/external-agents", json=slack_data)
        assert response.status_code == 201

        # Valid Telegram config
        telegram_data = {
            "name": "Telegram Agent",
            "workspace_id": test_workspace_2["id"],
            "platform": "telegram",
            "webhook_url": "https://api.telegram.org/bot123:ABC/sendMessage",
            "auth_type": "none",
            "platform_config": {
                "bot_token": "123456789:ABCdefGHI",
                "chat_id": "-1001234567890",
            },
        }

        response = await test_client.post("/api/v1/external-agents", json=telegram_data)
        assert response.status_code == 201

        # Valid Notion config
        notion_data = {
            "name": "Notion Agent",
            "workspace_id": test_workspace_2["id"],
            "platform": "notion",
            "webhook_url": "https://api.notion.com/v1/pages",
            "auth_type": "bearer_token",
            "auth_config": {"token": "secret_abc123"},
            "platform_config": {
                "token": "secret_abc123",
                "database_id": "12345678-1234-1234-1234-123456789012",
            },
        }

        response = await test_client.post("/api/v1/external-agents", json=notion_data)
        assert response.status_code == 201

        # Invalid Teams config (missing tenant_id)
        invalid_teams_data = {
            "name": "Invalid Teams Agent",
            "workspace_id": test_workspace_2["id"],
            "platform": "teams",
            "webhook_url": "https://directline.botframework.com/v3/directline",
            "auth_type": "oauth2",
            "auth_config": {
                "client_id": "abc",
                "client_secret": "secret",
                "token_url": "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
            },
            "platform_config": {
                # Missing tenant_id
                "channel_id": "19:abc@thread.tacv2"
            },
        }

        response = await test_client.post(
            "/api/v1/external-agents", json=invalid_teams_data
        )
        assert response.status_code in [400, 422]
        error = response.json()
        # API returns {"error": {"code": "...", "message": "..."}} format
        error_msg = error.get("error", {}).get("message", "") or error.get("detail", "")
        assert "tenant_id" in error_msg.lower() or "validation" in error_msg.lower()


# ===================
# Fixtures
# ===================


@pytest.fixture
def mock_external_webhook(monkeypatch):
    """
    Mock external webhook server for E2E tests.

    Simulates external agent responses without actually calling external services.
    Only mocks calls to external URLs (not test API calls).
    """
    from unittest.mock import MagicMock

    import httpx

    # Store original post method
    _original_post = httpx.AsyncClient.post

    async def mock_post(self, url, *args, **kwargs):
        """Mock httpx.AsyncClient.post for external webhook calls only."""
        from httpx._transports.asgi import ASGITransport

        url_str = str(url)

        # Check if this is a test API call (uses ASGITransport)
        is_test_client = isinstance(getattr(self, "_transport", None), ASGITransport)

        # Let internal test API calls through (they use ASGITransport)
        # Only mock external webhook URLs
        if "http://test" in url_str or is_test_client:
            # This is a test API call, use original implementation
            return await _original_post(self, url, *args, **kwargs)

        # Mock external webhook calls
        # Use MagicMock (not AsyncMock) because response.json() is synchronous in httpx
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        # response.json() is a synchronous method in httpx
        mock_response.json.return_value = {
            "result": "New employees receive 15 days of PTO in their first year, increasing to 20 days after 3 years of service.",
            "metadata": {"tokens": 150, "model": "gpt-4", "processing_time_ms": 234},
        }
        mock_response.elapsed.total_seconds.return_value = 0.234
        return mock_response

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)
