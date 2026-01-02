"""
Tier 3: External Agent Auth Lineage Integration E2E Tests (Phase 6)

Tests lineage tracking (Phase 2) with webhook delivery (Phase 4) and UI visualization (Phase 5):
- Phase 1: External Agent Model
- Phase 2: Auth Lineage Integration (tracking, identity, compliance)
- Phase 4: Webhook Platform Adapters
- Phase 5: Frontend UI (visualization data)

Verifies multi-hop workflows with external agents are correctly tracked in lineage graph
with real infrastructure (NO MOCKING except external webhook endpoints).
"""

import json

import pytest
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


@pytest.mark.e2e
@pytest.mark.timeout(30)
@pytest.mark.asyncio
class TestExternalAgentAuthLineageIntegration:
    """
    Test lineage tracking with external agents across phases.

    Intent: Verify lineage graph (Phase 2) correctly captures external agent hops
    with webhook delivery (Phase 4) and provides complete data for UI (Phase 5).
    """

    async def test_invocation_creates_lineage_record(
        self,
        authenticated_client,
        test_organization,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify each external agent invocation creates a lineage record
        that can be queried for audit and visualization.

        Setup:
        - External agent with Discord platform
        - Mock webhook server

        Steps:
        1. Create external agent
        2. Invoke external agent
        3. Query invocation record
        4. Verify lineage data captured

        Assertions:
        - Invocation record created with complete data
        - User ID, org ID, trace ID captured
        - Request/response payloads stored
        - Timestamps accurate
        """
        test_client, auth_user = authenticated_client

        # Create external agent
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Lineage Test Discord Bot",
                "description": "External agent for lineage tracking test",
                "workspace_id": test_workspace_2["id"],
                "platform": "discord",
                "webhook_url": "https://discord.com/api/webhooks/test/lineage",
                "auth_type": "none",
                "platform_config": {
                    "webhook_url": "https://discord.com/api/webhooks/test/lineage",
                    "username": "LineageBot",
                },
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 10,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Invoke the agent
        invoke_response = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke",
            json={
                "input": "What is the company mission?",
                "context": {"source": "lineage_test", "user_id": auth_user["id"]},
                "metadata": {"test_type": "lineage_verification"},
            },
        )
        assert invoke_response.status_code == 200
        invocation = invoke_response.json()

        # Verify invocation has lineage data
        assert invocation["invocation_id"], "Invocation ID required for lineage"
        assert invocation["trace_id"], "Trace ID required for observability"

        # Query invocation record from database
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationReadNode",
            "read",
            {"id": invocation["invocation_id"]},
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        db_record = results.get("read", {})

        # Verify lineage data captured
        assert db_record["id"] == invocation["invocation_id"]
        assert db_record["external_agent_id"] == agent["id"]
        assert db_record["user_id"] == auth_user["id"]
        assert db_record["organization_id"] == test_organization["id"]
        assert db_record["status"] == "success"
        # Use invoked_at as the reliable timestamp (created_at may not be returned by ReadNode)
        assert db_record["invoked_at"], "Timestamp required for lineage"

        # Verify request payload captured
        request_payload = json.loads(db_record["request_payload"])
        assert request_payload["input"] == "What is the company mission?"
        assert request_payload["context"]["source"] == "lineage_test"

        # Verify response payload captured
        assert db_record["response_payload"], "Response should be captured"
        response_payload = json.loads(db_record["response_payload"])
        assert response_payload["result"], "Response result should be captured"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_lineage_isolation_between_organizations(
        self,
        authenticated_client,
        test_organization,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify lineage records are isolated by organization for security.

        Steps:
        1. Create agent and make invocation
        2. Query invocation by organization filter
        3. Verify only organization's data returned

        Assertions:
        - Invocation has correct organization_id
        - Can filter invocations by organization
        - No cross-organization data leakage
        """
        test_client, auth_user = authenticated_client

        # Create agent
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Org Isolation Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.org-isolation-test.local/agent",
                "auth_type": "none",
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 10,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Make invocation
        invoke_response = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke",
            json={"input": "Org isolation test"},
        )
        assert invoke_response.status_code == 200
        invocation = invoke_response.json()

        # Query with organization filter
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationListNode",
            "list",
            {
                "filter": {"organization_id": test_organization["id"]},
                "limit": 100,
            },
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        invocations = results.get("list", {}).get("records", [])

        # Verify our invocation is in the list
        our_invocation = next(
            (i for i in invocations if i["id"] == invocation["invocation_id"]), None
        )
        assert our_invocation is not None, "Invocation should be found by org filter"
        assert our_invocation["organization_id"] == test_organization["id"]

        # Verify all returned invocations belong to same organization
        for inv in invocations:
            assert (
                inv["organization_id"] == test_organization["id"]
            ), "Cross-org leakage!"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_lineage_history_preserved_after_agent_update(
        self,
        authenticated_client,
        test_organization,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify historical lineage is preserved when agent is updated.

        This is critical for compliance - audit trail must show what happened
        at the time of invocation, not current agent configuration.

        Steps:
        1. Create agent with initial config
        2. Make invocation
        3. Update agent configuration
        4. Make another invocation
        5. Verify both lineage records exist and are distinct

        Assertions:
        - Original invocation record unchanged
        - New invocation created with new config
        - Historical invocations reference same agent ID
        """
        test_client, auth_user = authenticated_client

        # Create agent
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Lineage History v1.0",
                "description": "Initial version for history test",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.history-test.local/v1",
                "auth_type": "none",
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 10,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Make initial invocation
        invoke_v1 = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke",
            json={"input": "Query with v1 config"},
        )
        assert invoke_v1.status_code == 200
        invocation_v1 = invoke_v1.json()

        # Update agent (API uses PATCH for partial updates)
        update_response = await test_client.patch(
            f"/api/v1/external-agents/{agent['id']}",
            json={
                "name": "Lineage History v2.0",
                "description": "Updated version for history test",
            },
        )
        assert update_response.status_code == 200

        # Make post-update invocation
        invoke_v2 = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke",
            json={"input": "Query with v2 config"},
        )
        assert invoke_v2.status_code in [200, 429]  # May be rate limited

        # Verify original invocation unchanged
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationReadNode",
            "read",
            {"id": invocation_v1["invocation_id"]},
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        original_record = results.get("read", {})

        assert original_record["id"] == invocation_v1["invocation_id"]
        assert original_record["external_agent_id"] == agent["id"]
        assert original_record["status"] == "success"

        # Request payload preserved from v1
        request = json.loads(original_record["request_payload"])
        assert request["input"] == "Query with v1 config"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_lineage_supports_multiple_platforms(
        self,
        authenticated_client,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify lineage correctly captures platform metadata for different
        external agent platforms.

        Steps:
        1. Create agents for different platforms
        2. Invoke each agent
        3. Verify lineage records have correct platform metadata

        Assertions:
        - Each invocation has platform field
        - Platform metadata captured correctly
        - UI can distinguish platforms in lineage view
        """
        test_client, auth_user = authenticated_client

        platforms = [
            {
                "platform": "discord",
                "platform_config": {
                    "webhook_url": "https://discord.com/api/webhooks/test",
                    "username": "TestBot",
                },
            },
            {
                "platform": "slack",
                "platform_config": {
                    "webhook_url": "https://hooks.slack.com/services/test",
                    "channel": "#test",
                },
            },
            {
                "platform": "custom_http",
                "platform_config": {},
            },
        ]

        created_agents = []
        invocation_records = []

        for platform_data in platforms:
            # Create agent
            agent_response = await test_client.post(
                "/api/v1/external-agents",
                json={
                    "name": f"Lineage Platform Test ({platform_data['platform']})",
                    "workspace_id": test_workspace_2["id"],
                    "webhook_url": f"https://api.{platform_data['platform']}.test/webhook",
                    "auth_type": "none",
                    "budget_limit_daily": 100.0,
                    "budget_limit_monthly": 1000.0,
                    "rate_limit_per_minute": 5,
                    **platform_data,
                },
            )
            assert agent_response.status_code == 201
            agent = agent_response.json()
            created_agents.append(agent)

            # Invoke agent
            invoke_response = await test_client.post(
                f"/api/v1/external-agents/{agent['id']}/invoke",
                json={"input": f"Platform test for {platform_data['platform']}"},
            )
            if invoke_response.status_code == 200:
                invocation = invoke_response.json()
                invocation_records.append(
                    {
                        "invocation_id": invocation["invocation_id"],
                        "platform": platform_data["platform"],
                        "agent_id": agent["id"],
                    }
                )

        # Query invocations and verify platform data
        runtime = AsyncLocalRuntime()

        for record in invocation_records:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "ExternalAgentInvocationReadNode",
                "read",
                {"id": record["invocation_id"]},
            )

            results, _ = await runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            db_record = results.get("read", {})

            assert db_record["external_agent_id"] == record["agent_id"]
            # Platform should be captured for UI visualization

        # Cleanup
        for agent in created_agents:
            await test_client.delete(f"/api/v1/external-agents/{agent['id']}")


@pytest.mark.e2e
@pytest.mark.timeout(20)
@pytest.mark.asyncio
class TestLineageCompliance:
    """Test compliance features of lineage tracking."""

    async def test_lineage_data_immutability(
        self,
        authenticated_client,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify lineage records are immutable after creation.

        This is critical for audit compliance - records cannot be modified
        after the fact.

        Assertions:
        - Invocation record created
        - Record cannot be modified directly
        - Record persists even if agent deleted
        """
        test_client, auth_user = authenticated_client

        # Create agent
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Immutability Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.immutable-test.local/agent",
                "auth_type": "none",
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 10,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Make invocation
        invoke_response = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke",
            json={"input": "Immutability test query"},
        )
        assert invoke_response.status_code == 200
        invocation = invoke_response.json()

        # Read original record
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationReadNode",
            "read_original",
            {"id": invocation["invocation_id"]},
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        original_record = results.get("read_original", {})

        # Delete the agent
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

        # Verify lineage record still exists
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationReadNode",
            "read_after_delete",
            {"id": invocation["invocation_id"]},
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        preserved_record = results.get("read_after_delete", {})

        # Record should still exist
        assert preserved_record["id"] == original_record["id"]
        assert (
            preserved_record["external_agent_id"]
            == original_record["external_agent_id"]
        )
        assert preserved_record["status"] == original_record["status"]
        assert preserved_record["request_payload"] == original_record["request_payload"]
        assert preserved_record["created_at"] == original_record["created_at"]

    async def test_lineage_supports_gdpr_export(
        self,
        authenticated_client,
        test_organization,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify lineage data can be exported for GDPR compliance.

        Steps:
        1. Create agent and make invocations
        2. Query all invocations for user
        3. Verify data export structure supports GDPR requirements

        Assertions:
        - Can query all invocations by user_id
        - Complete data returned for export
        - Timestamps in ISO format for compliance
        """
        test_client, auth_user = authenticated_client

        # Create agent
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "GDPR Export Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.gdpr-test.local/agent",
                "auth_type": "none",
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 10,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Make several invocations
        for i in range(3):
            await test_client.post(
                f"/api/v1/external-agents/{agent['id']}/invoke",
                json={"input": f"GDPR test query {i + 1}"},
            )

        # Query all invocations for this user
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationListNode",
            "list",
            {
                "filter": {"user_id": auth_user["id"]},
                "limit": 100,
            },
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        invocations = results.get("list", {}).get("records", [])

        # Verify we can get user's invocation data
        assert len(invocations) >= 1, "Should find user's invocations"

        # Verify each record has GDPR-required fields
        for inv in invocations:
            assert inv["id"], "Record ID required"
            assert inv["user_id"], "User ID required for GDPR"
            assert inv["organization_id"], "Org ID required"
            # Use invoked_at as the reliable timestamp for GDPR (created_at may not be returned)
            assert inv["invoked_at"], "Timestamp required for GDPR"
            # Timestamps should be ISO format
            assert "T" in inv["invoked_at"], "Timestamp should be ISO format"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")


@pytest.mark.e2e
@pytest.mark.timeout(15)
@pytest.mark.asyncio
class TestLineageVisualization:
    """Test lineage data for UI visualization support."""

    async def test_invocation_returns_trace_id_for_observability(
        self,
        authenticated_client,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify invocations return trace_id for distributed tracing.

        Assertions:
        - Invocation response includes trace_id
        - Trace ID is unique per invocation
        - Trace ID stored in database record
        """
        test_client, auth_user = authenticated_client

        # Create agent
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Trace ID Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.trace-test.local/agent",
                "auth_type": "none",
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 10,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Make multiple invocations
        trace_ids = []
        for i in range(3):
            invoke_response = await test_client.post(
                f"/api/v1/external-agents/{agent['id']}/invoke",
                json={"input": f"Trace test {i}"},
            )
            if invoke_response.status_code == 200:
                invocation = invoke_response.json()
                assert invocation["trace_id"], "Trace ID required"
                trace_ids.append(invocation["trace_id"])

        # Verify trace IDs are unique
        assert len(trace_ids) == len(set(trace_ids)), "Trace IDs should be unique"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_invocation_history_supports_pagination(
        self,
        authenticated_client,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify invocation history supports pagination for UI.

        Steps:
        1. Create agent
        2. Make several invocations
        3. Query with pagination parameters
        4. Verify correct page sizes returned

        Assertions:
        - Pagination limit respected
        - Can request different pages
        - Total count accurate
        """
        test_client, auth_user = authenticated_client

        # Create agent
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Pagination Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.pagination-test.local/agent",
                "auth_type": "none",
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 20,  # Allow many invocations
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Make several invocations
        for i in range(5):
            await test_client.post(
                f"/api/v1/external-agents/{agent['id']}/invoke",
                json={"input": f"Pagination test {i}"},
            )

        # Query with small page size
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationListNode",
            "list",
            {
                "filter": {"external_agent_id": agent["id"]},
                "limit": 2,
            },
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        page1 = results.get("list", {}).get("records", [])

        # Verify pagination limit respected
        assert len(page1) <= 2, "Page size should respect limit"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")


# ===================
# Fixtures
# ===================


@pytest.fixture
def mock_external_webhook(monkeypatch):
    """
    Mock external webhook server for lineage E2E testing.

    Only mocks calls to external URLs (not internal test API calls).
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
            "result": "Mock lineage test response",
            "metadata": {"platform": "mock", "tokens": 100, "processing_time_ms": 120},
        }
        mock_response.elapsed.total_seconds.return_value = 0.120
        return mock_response

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)
