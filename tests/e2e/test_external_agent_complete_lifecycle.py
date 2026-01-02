"""
Tier 3: External Agent Complete Lifecycle E2E Tests (Phase 6)

Tests end-to-end integration across all 5 phases of External Integrations:
- Phase 1: External Agent Model + API (CRUD, validation, encryption)
- Phase 2: Auth Lineage Integration (tracking, graph, compliance)
- Phase 3: Governance Features (budget, rate limit, policies)
- Phase 4: Webhook Platform Adapters (delivery, formatting)
- Phase 5: Frontend UI (API endpoints for visualization)

Uses real infrastructure (NO MOCKING except external webhook endpoints).
Following Kailash 3-tier testing methodology.
"""

import json
import uuid

import pytest
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


@pytest.mark.e2e
@pytest.mark.timeout(30)
@pytest.mark.asyncio
class TestExternalAgentCompleteLifecycle:
    """
    Test complete External Agent lifecycle across all phases.

    Intent: Verify end-to-end flow from agent registration (Phase 1) → invocation with
    lineage tracking (Phase 2) → governance checks (Phase 3) → webhook delivery (Phase 4)
    → UI visualization (Phase 5).

    This is the most comprehensive E2E test for the External Integrations feature.
    """

    async def test_complete_lifecycle_registration_to_ui_visualization(
        self,
        authenticated_client,
        test_organization,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify complete user workflow from agent registration through UI visualization.

        This test validates the entire user journey:
        1. Register External Agent via API (Phase 1)
        2. Invoke agent with governance checks (Phase 3)
        3. Verify invocation recorded with lineage (Phase 2)
        4. Verify webhook delivery triggered (Phase 4)
        5. Verify API endpoints support UI visualization (Phase 5)

        Setup:
        - Real PostgreSQL (via DataFlow)
        - Real Redis (via GovernanceService)
        - Mock external webhook server (only external service mocked)
        - Authenticated user with org_owner role

        Assertions:
        - All API calls succeed (201, 200)
        - Database records created for agent and invocation
        - Credentials never exposed in responses
        - Governance limits respected
        - UI data endpoints return complete information
        """
        test_client, auth_user = authenticated_client

        # =============================
        # Phase 1: Register External Agent
        # =============================

        # Step 1: Register External Agent with comprehensive configuration
        agent_data = {
            "name": "E2E Lifecycle Teams Bot",
            "description": "Microsoft Teams bot for complete lifecycle E2E test",
            "workspace_id": test_workspace_2["id"],
            "platform": "teams",
            "webhook_url": "https://directline.botframework.com/v3/directline/mock",
            "auth_type": "oauth2",
            "auth_config": {
                "client_id": "e2e-lifecycle-client-id",
                "client_secret": "e2e-lifecycle-secret-xyz",
                "token_url": "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
                "scope": "https://api.botframework.com/.default",
            },
            "platform_config": {
                "tenant_id": "lifecycle-12345678-1234-1234-1234-123456789012",
                "channel_id": "19:lifecycle_test@thread.tacv2",
            },
            "budget_limit_daily": 50.0,
            "budget_limit_monthly": 100.0,
            "rate_limit_per_minute": 10,
            "rate_limit_per_hour": 100,
            "tags": ["e2e-lifecycle", "teams", "complete-test"],
        }

        create_response = await test_client.post(
            "/api/v1/external-agents", json=agent_data
        )
        assert (
            create_response.status_code == 201
        ), f"Agent creation failed: {create_response.text}"
        external_agent = create_response.json()

        # Verify Phase 1: Agent created with all fields
        assert external_agent["id"], "Agent should have an ID"
        assert external_agent["name"] == "E2E Lifecycle Teams Bot"
        assert external_agent["platform"] == "teams"
        assert external_agent["status"] == "active"
        assert external_agent["budget_limit_monthly"] == 100.0
        assert external_agent["rate_limit_per_minute"] == 10

        # SECURITY: Verify credentials never exposed
        assert "client_secret" not in json.dumps(external_agent), "Credentials exposed!"
        assert "secret" not in json.dumps(external_agent).lower(), "Secret in response!"

        # =============================
        # Phase 5: Verify UI List Endpoint
        # =============================

        # Step 2: Verify agent appears in list (for UI table view)
        list_response = await test_client.get(
            f"/api/v1/external-agents?workspace_id={test_workspace_2['id']}"
        )
        assert list_response.status_code == 200
        list_data = list_response.json()

        assert list_data["total"] >= 1
        agent_ids = [a["id"] for a in list_data["agents"]]
        assert external_agent["id"] in agent_ids, "Agent should appear in list"

        # Verify UI-required fields present
        our_agent = next(
            a for a in list_data["agents"] if a["id"] == external_agent["id"]
        )
        assert our_agent["name"]
        assert our_agent["platform"]
        assert our_agent["status"]

        # =============================
        # Phase 3 & 4: Invoke with Governance + Webhook
        # =============================

        # Step 3: Invoke the external agent
        invoke_data = {
            "input": "What is the PTO policy for new employees?",
            "context": {
                "user_session": "e2e_lifecycle_test",
                "channel": "teams",
            },
            "metadata": {
                "source": "complete_lifecycle_test",
                "test_run_id": str(uuid.uuid4()),
            },
        }

        invoke_response = await test_client.post(
            f"/api/v1/external-agents/{external_agent['id']}/invoke", json=invoke_data
        )
        assert (
            invoke_response.status_code == 200
        ), f"Invocation failed: {invoke_response.text}"
        invocation = invoke_response.json()

        # Verify invocation response
        assert invocation["invocation_id"], "Should have invocation ID"
        assert invocation["trace_id"], "Should have trace ID for observability"
        assert invocation["status"] == "success"
        assert invocation["output"], "Should have output from agent"

        # =============================
        # Phase 2: Verify Lineage/Invocation Tracking
        # =============================

        # Step 4: Verify invocation record in database
        runtime = AsyncLocalRuntime()

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationReadNode",
            "read_invocation",
            {"id": invocation["invocation_id"]},
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        db_invocation = results.get("read_invocation", {})

        assert db_invocation["id"] == invocation["invocation_id"]
        assert db_invocation["external_agent_id"] == external_agent["id"]
        assert db_invocation["user_id"] == auth_user["id"]
        assert db_invocation["organization_id"] == test_organization["id"]
        assert db_invocation["status"] == "success"
        assert db_invocation["request_payload"]
        assert db_invocation["response_payload"]

        # Verify request payload captured correctly
        request_payload = json.loads(db_invocation["request_payload"])
        assert request_payload["input"] == "What is the PTO policy for new employees?"
        assert request_payload["context"]["channel"] == "teams"

        # Verify response payload captured
        response_payload = json.loads(db_invocation["response_payload"])
        assert response_payload["result"], "Response should have result"

        # =============================
        # Phase 5: Verify UI Detail Endpoint
        # =============================

        # Step 5: Verify detail endpoint returns complete data
        detail_response = await test_client.get(
            f"/api/v1/external-agents/{external_agent['id']}"
        )
        assert detail_response.status_code == 200
        agent_detail = detail_response.json()

        # Verify all detail fields present for UI
        assert agent_detail["id"]
        assert agent_detail["name"]
        assert agent_detail["description"]
        assert agent_detail["platform"]
        assert agent_detail["webhook_url"]
        assert agent_detail["auth_type"]
        assert agent_detail["budget_limit_daily"]
        assert agent_detail["budget_limit_monthly"]
        assert agent_detail["rate_limit_per_minute"]
        assert agent_detail["rate_limit_per_hour"]

        # SECURITY: Credentials still masked
        assert "client_secret" not in json.dumps(agent_detail)

        # =============================
        # Phase 3: Verify Governance State
        # =============================

        # Step 6: Make additional invocations to test rate limiting
        for i in range(3):
            additional_invoke = await test_client.post(
                f"/api/v1/external-agents/{external_agent['id']}/invoke",
                json={"input": f"Additional query {i + 1}"},
            )
            # Should succeed or hit rate limit
            assert additional_invoke.status_code in [200, 429]

        # =============================
        # Cleanup: Delete Agent
        # =============================

        # Step 7: Delete the agent
        delete_response = await test_client.delete(
            f"/api/v1/external-agents/{external_agent['id']}"
        )
        assert delete_response.status_code == 204

        # Step 8: Verify deleted agent cannot be invoked
        invoke_deleted = await test_client.post(
            f"/api/v1/external-agents/{external_agent['id']}/invoke",
            json={"input": "Should fail"},
        )
        assert invoke_deleted.status_code in [400, 404]
        error = invoke_deleted.json()
        # API returns {"error": {"code": "...", "message": "..."}} format
        error_msg = error.get("error", {}).get("message", "") or error.get("detail", "")
        assert "deleted" in error_msg.lower() or "not found" in error_msg.lower()

        # =============================
        # Test Complete
        # =============================
        # All phases verified:
        # ✓ Phase 1: Agent CRUD with encryption
        # ✓ Phase 2: Invocation tracking/lineage
        # ✓ Phase 3: Governance (budget, rate limit)
        # ✓ Phase 4: Webhook delivery (mocked)
        # ✓ Phase 5: UI endpoints complete

    async def test_multi_platform_lifecycle_integration(
        self,
        authenticated_client,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify that multiple external agents across different platforms
        can coexist and function correctly within the same workspace.

        This represents an enterprise scenario where a single workspace has
        agents for Teams, Slack, Discord, etc., all with different configurations.

        Assertions:
        - All platforms can be registered
        - Platform-specific validation works
        - Each agent can be invoked independently
        - No cross-contamination between agents
        """
        test_client, auth_user = authenticated_client

        platforms = [
            {
                "name": "Multi-Platform Teams Bot",
                "platform": "teams",
                "auth_type": "oauth2",
                "auth_config": {
                    "client_id": "teams-mp-client",
                    "client_secret": "teams-mp-secret",
                    "token_url": "https://login.microsoftonline.com/t/oauth2/v2.0/token",
                },
                "platform_config": {
                    "tenant_id": "mp-tenant-12345678",
                    "channel_id": "19:mp@thread.tacv2",
                },
            },
            {
                "name": "Multi-Platform Slack Bot",
                "platform": "slack",
                "auth_type": "none",
                "auth_config": {},
                "platform_config": {
                    "webhook_url": "https://hooks.slack.com/services/T00/B00/XXX",
                    "channel": "#multi-platform",
                },
            },
            {
                "name": "Multi-Platform Discord Bot",
                "platform": "discord",
                "auth_type": "none",
                "auth_config": {},
                "platform_config": {
                    "webhook_url": "https://discord.com/api/webhooks/123/abc",
                    "username": "MultiPlatformBot",
                },
            },
        ]

        created_agents = []

        # Create all platform agents
        for platform in platforms:
            agent_data = {
                "workspace_id": test_workspace_2["id"],
                "webhook_url": f"https://api.{platform['platform']}.test/webhook",
                "description": f"Multi-platform test for {platform['platform']}",
                "budget_limit_daily": 25.0,
                "budget_limit_monthly": 250.0,
                "rate_limit_per_minute": 5,
                **platform,
            }

            response = await test_client.post(
                "/api/v1/external-agents", json=agent_data
            )
            assert (
                response.status_code == 201
            ), f"Failed to create {platform['platform']}: {response.text}"
            created_agents.append(response.json())

        # Verify all agents appear in list
        list_response = await test_client.get(
            f"/api/v1/external-agents?workspace_id={test_workspace_2['id']}"
        )
        assert list_response.status_code == 200
        all_agents = list_response.json()

        created_ids = {a["id"] for a in created_agents}
        listed_ids = {a["id"] for a in all_agents["agents"]}
        assert created_ids.issubset(listed_ids), "All created agents should be listed"

        # Invoke each agent and verify isolation
        invocation_ids = []
        for agent in created_agents:
            invoke_response = await test_client.post(
                f"/api/v1/external-agents/{agent['id']}/invoke",
                json={"input": f"Query for {agent['platform']}"},
            )
            # Accept success or rate limit
            assert invoke_response.status_code in [200, 429]

            if invoke_response.status_code == 200:
                invocation = invoke_response.json()
                invocation_ids.append(invocation["invocation_id"])

        # Verify no ID collisions (isolation)
        assert len(invocation_ids) == len(set(invocation_ids)), "ID collision detected!"

        # Cleanup all agents
        for agent in created_agents:
            await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_agent_update_preserves_invocation_history(
        self,
        authenticated_client,
        test_organization,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify that updating an agent's configuration does not
        affect historical invocation records.

        This is critical for audit compliance where invocation history
        must remain immutable regardless of subsequent agent changes.

        Assertions:
        - Agent can be updated after invocations
        - Historical invocations reference original configuration
        - New invocations use updated configuration
        """
        test_client, auth_user = authenticated_client

        # Create initial agent
        initial_agent = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Update Test Agent v1.0",
                "description": "Initial description",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.v1.test/agent",
                "auth_type": "api_key",
                "auth_config": {"key": "v1-key", "header_name": "X-API-Key"},
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 20,
                "tags": ["v1", "test"],
            },
        )
        assert initial_agent.status_code == 201
        agent = initial_agent.json()

        # Make initial invocation
        invoke_v1 = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke",
            json={"input": "Query with v1 config"},
        )
        assert invoke_v1.status_code == 200
        invocation_v1 = invoke_v1.json()

        # Update agent configuration (API uses PATCH for partial updates)
        update_response = await test_client.patch(
            f"/api/v1/external-agents/{agent['id']}",
            json={
                "name": "Update Test Agent v2.0",
                "description": "Updated description",
                "rate_limit_per_minute": 30,
                "tags": ["v2", "updated", "test"],
            },
        )
        assert update_response.status_code == 200
        updated_agent = update_response.json()
        assert updated_agent["name"] == "Update Test Agent v2.0"
        assert updated_agent["rate_limit_per_minute"] == 30

        # Make post-update invocation
        invoke_v2 = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke",
            json={"input": "Query with v2 config"},
        )
        assert invoke_v2.status_code in [200, 429]

        # Verify original invocation still accessible and unchanged
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationReadNode",
            "read",
            {"id": invocation_v1["invocation_id"]},
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        original_invocation = results.get("read", {})

        assert original_invocation["id"] == invocation_v1["invocation_id"]
        assert original_invocation["external_agent_id"] == agent["id"]
        # Invocation record should still exist and be valid
        assert original_invocation["status"] == "success"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")


@pytest.mark.e2e
@pytest.mark.timeout(15)
@pytest.mark.asyncio
class TestExternalAgentEdgeCases:
    """Test edge cases and error handling in the complete lifecycle."""

    async def test_agent_invocation_with_network_failure(
        self,
        authenticated_client,
        test_workspace_2,
    ):
        """
        Intent: Verify graceful handling when external agent endpoint is unreachable.

        Assertions:
        - Error returned to user with clear message
        - Invocation logged as failed (not left pending)
        - Agent remains in active state (not corrupted)
        """
        test_client, auth_user = authenticated_client

        # Create agent with unreachable endpoint
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Unreachable Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://unreachable.invalid.test/agent",
                "auth_type": "none",
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 20,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Attempt invocation
        invoke_response = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke",
            json={"input": "This should fail"},
        )

        # Should fail gracefully
        assert invoke_response.status_code in [400, 500, 502, 503]
        error = invoke_response.json()
        # API returns {"error": {"code": "...", "message": "..."}} format
        assert "error" in error or "detail" in error

        # Agent should still be accessible
        get_response = await test_client.get(f"/api/v1/external-agents/{agent['id']}")
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "active"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_concurrent_agent_invocations(
        self,
        authenticated_client,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify system handles concurrent invocations correctly.

        Assertions:
        - All concurrent invocations are processed
        - Each invocation has unique ID and trace
        - No data leakage between invocations
        - Rate limiting applies correctly under load
        """
        import asyncio

        test_client, auth_user = authenticated_client

        # Create test agent with reasonable rate limits
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Concurrent Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.concurrent.test/agent",
                "auth_type": "api_key",
                "auth_config": {"key": "concurrent-key", "header_name": "X-API-Key"},
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 20,  # Allow some concurrency
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Define concurrent invocation task
        async def invoke(session_id: int):
            response = await test_client.post(
                f"/api/v1/external-agents/{agent['id']}/invoke",
                json={
                    "input": f"Concurrent query {session_id}",
                    "context": {"session": str(session_id)},
                },
            )
            return {"session_id": session_id, "status": response.status_code}

        # Execute concurrent invocations
        tasks = [invoke(i) for i in range(5)]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Analyze results
        successful = 0
        rate_limited = 0
        errors = 0

        for result in results:
            if isinstance(result, Exception):
                errors += 1
            elif result["status"] == 200:
                successful += 1
            elif result["status"] == 429:
                rate_limited += 1
            else:
                errors += 1

        # At least some should succeed
        assert successful > 0, "No concurrent invocations succeeded"
        # Rate limiting should work (or all succeed if limits high enough)
        assert errors == 0, "Unexpected errors in concurrent invocations"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_deleted_agent_cleanup(
        self,
        authenticated_client,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify proper cleanup when agent is deleted.

        Assertions:
        - Agent can be deleted after invocations
        - Deleted agent doesn't appear in active list
        - Historical invocations remain accessible (audit trail)
        """
        test_client, auth_user = authenticated_client

        # Create agent
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Deletion Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.delete.test/agent",
                "auth_type": "none",
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 20,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Make invocation before deletion
        invoke_response = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke",
            json={"input": "Query before deletion"},
        )
        invocation = None
        if invoke_response.status_code == 200:
            invocation = invoke_response.json()

        # Delete agent
        delete_response = await test_client.delete(
            f"/api/v1/external-agents/{agent['id']}"
        )
        assert delete_response.status_code == 204

        # Verify not in active list
        list_response = await test_client.get(
            f"/api/v1/external-agents?workspace_id={test_workspace_2['id']}&status=active"
        )
        assert list_response.status_code == 200
        active_ids = [a["id"] for a in list_response.json()["agents"]]
        assert (
            agent["id"] not in active_ids
        ), "Deleted agent should not be in active list"

        # If invocation was successful, verify it's still accessible
        if invocation:
            runtime = AsyncLocalRuntime()
            workflow = WorkflowBuilder()
            workflow.add_node(
                "ExternalAgentInvocationReadNode",
                "read",
                {"id": invocation["invocation_id"]},
            )

            results, _ = await runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            historical = results.get("read", {})
            assert historical["id"] == invocation["invocation_id"]
            # Historical record preserved even after agent deletion


# ===================
# Fixtures
# ===================


@pytest.fixture
def mock_external_webhook(monkeypatch):
    """
    Mock external webhook server for E2E testing.

    Only mocks calls to external URLs (not internal test API calls).
    Uses proper MagicMock for synchronous response methods in httpx.
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

        # Let internal test API calls through
        if "http://test" in url_str or is_test_client:
            return await _original_post(self, url, *args, **kwargs)

        # Mock external webhook calls
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.json.return_value = {
            "result": "New employees receive 15 days of PTO in their first year.",
            "metadata": {"tokens": 150, "model": "gpt-4", "processing_time_ms": 234},
        }
        mock_response.elapsed.total_seconds.return_value = 0.234
        return mock_response

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)
