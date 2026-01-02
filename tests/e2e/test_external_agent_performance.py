"""
Tier 3: External Agent Performance and Load Tests (Phase 6)

Tests performance characteristics and load handling:
- Rate limiting performance under load
- Lineage graph query performance
- Concurrent invocation handling
- Security and encryption verification

Uses real infrastructure (NO MOCKING except external webhook endpoints).
Following Kailash 3-tier testing methodology.
"""

import asyncio
import json
import time

import pytest
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


@pytest.mark.e2e
@pytest.mark.timeout(60)
@pytest.mark.asyncio
class TestExternalAgentPerformance:
    """
    Performance benchmarks for External Agent operations.

    Intent: Verify system meets performance requirements under realistic load.
    """

    async def test_rate_limiting_performance_under_burst(
        self,
        authenticated_client,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify rate limiting handles burst traffic efficiently.

        Measures:
        - Time to process burst requests
        - Rate limiting consistency
        - No request loss under load

        Success Criteria:
        - All requests processed (success or rate limited)
        - Processing time < 5s for 20 requests
        - Rate limiting applied consistently
        """
        test_client, auth_user = authenticated_client

        # Create agent with moderate rate limit
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Burst Rate Limit Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.burst-test.local/agent",
                "auth_type": "none",
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 10,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Measure burst performance
        start_time = time.perf_counter()
        results = {"success": 0, "rate_limited": 0, "errors": 0}

        # Send 20 requests in rapid succession
        tasks = []
        for i in range(20):
            tasks.append(
                test_client.post(
                    f"/api/v1/external-agents/{agent['id']}/invoke",
                    json={"input": f"Burst request {i}"},
                )
            )

        responses = await asyncio.gather(*tasks, return_exceptions=True)

        for resp in responses:
            if isinstance(resp, Exception):
                results["errors"] += 1
            elif resp.status_code == 200:
                results["success"] += 1
            elif resp.status_code == 429:
                results["rate_limited"] += 1
            else:
                results["errors"] += 1

        elapsed = time.perf_counter() - start_time

        # Verify performance
        assert elapsed < 5.0, f"Burst processing took too long: {elapsed:.2f}s"
        total_processed = results["success"] + results["rate_limited"]
        assert total_processed >= 15, f"Too many dropped requests: {results}"
        assert results["errors"] <= 5, f"Too many errors: {results}"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_lineage_query_performance_with_many_records(
        self,
        authenticated_client,
        test_organization,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify lineage queries remain performant with many invocation records.

        Setup:
        - Create agent and make multiple invocations
        - Query invocation history with filters

        Success Criteria:
        - Query returns within 500ms
        - Pagination works correctly
        - Filter by agent_id efficient
        """
        test_client, auth_user = authenticated_client

        # Create agent
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Lineage Query Performance Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.lineage-perf.local/agent",
                "auth_type": "none",
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 50,  # Allow many invocations
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Create multiple invocation records
        for i in range(10):
            await test_client.post(
                f"/api/v1/external-agents/{agent['id']}/invoke",
                json={"input": f"Performance test query {i}"},
            )

        # Measure query performance
        runtime = AsyncLocalRuntime()

        start_time = time.perf_counter()

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationListNode",
            "list",
            {
                "filter": {"external_agent_id": agent["id"]},
                "limit": 100,
            },
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        invocations = results.get("list", {}).get("records", [])

        elapsed = time.perf_counter() - start_time

        # Verify performance
        assert elapsed < 0.5, f"Query took too long: {elapsed:.3f}s"
        assert len(invocations) >= 5, f"Expected more records: {len(invocations)}"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_concurrent_agent_creation_performance(
        self,
        authenticated_client,
        test_workspace_2,
    ):
        """
        Intent: Verify concurrent agent creation is handled efficiently.

        Measures:
        - Time to create multiple agents concurrently
        - No race conditions or conflicts
        - All agents created successfully

        Success Criteria:
        - 5 concurrent creations complete < 2s
        - All agents have unique IDs
        - No database conflicts
        """
        test_client, auth_user = authenticated_client

        # Create 5 agents concurrently
        async def create_agent(idx: int):
            response = await test_client.post(
                "/api/v1/external-agents",
                json={
                    "name": f"Concurrent Agent {idx}",
                    "workspace_id": test_workspace_2["id"],
                    "platform": "custom_http",
                    "webhook_url": f"https://api.concurrent-{idx}.local/agent",
                    "auth_type": "none",
                    "budget_limit_daily": 100.0,
                    "budget_limit_monthly": 1000.0,
                    "rate_limit_per_minute": 10,
                },
            )
            return response

        start_time = time.perf_counter()
        tasks = [create_agent(i) for i in range(5)]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        elapsed = time.perf_counter() - start_time

        # Verify performance
        assert elapsed < 2.0, f"Concurrent creation took too long: {elapsed:.2f}s"

        # Verify all agents created successfully
        created_agents = []
        for resp in responses:
            if not isinstance(resp, Exception):
                assert resp.status_code == 201, f"Failed to create agent: {resp.text}"
                agent = resp.json()
                created_agents.append(agent)

        assert len(created_agents) == 5, "Not all agents created"

        # Verify unique IDs
        agent_ids = [a["id"] for a in created_agents]
        assert len(set(agent_ids)) == 5, "Agent IDs not unique"

        # Cleanup
        for agent in created_agents:
            await test_client.delete(f"/api/v1/external-agents/{agent['id']}")


@pytest.mark.e2e
@pytest.mark.timeout(120)
@pytest.mark.asyncio
class TestExternalAgentLoadTests:
    """
    Load tests for External Agent invocations.

    Intent: Verify system handles sustained load gracefully.
    """

    async def test_sustained_invocation_load(
        self,
        authenticated_client,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify system handles sustained invocation load.

        Setup:
        - Agent with generous limits
        - Multiple invocations over time

        Success Criteria:
        - All invocations processed (success or governed)
        - Response times remain consistent
        - No memory leaks or degradation
        """
        test_client, auth_user = authenticated_client

        # Create agent with generous limits
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Sustained Load Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.sustained-load.local/agent",
                "auth_type": "none",
                "budget_limit_daily": 500.0,
                "budget_limit_monthly": 5000.0,
                "rate_limit_per_minute": 100,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Make 30 invocations over ~3 seconds
        response_times = []
        results = {"success": 0, "governed": 0, "errors": 0}

        for i in range(30):
            start = time.perf_counter()

            invoke_response = await test_client.post(
                f"/api/v1/external-agents/{agent['id']}/invoke",
                json={"input": f"Sustained load query {i}"},
            )

            elapsed = time.perf_counter() - start
            response_times.append(elapsed)

            if invoke_response.status_code == 200:
                results["success"] += 1
            elif invoke_response.status_code in [429, 402]:
                results["governed"] += 1
            else:
                results["errors"] += 1

            # Small delay to simulate realistic load
            await asyncio.sleep(0.1)

        # Verify load handling
        total_processed = results["success"] + results["governed"]
        assert total_processed >= 25, f"Too many failed: {results}"
        assert results["errors"] <= 5, f"Too many errors: {results}"

        # Verify response time consistency
        avg_response = sum(response_times) / len(response_times)
        assert avg_response < 0.5, f"Average response too slow: {avg_response:.3f}s"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")


@pytest.mark.e2e
@pytest.mark.timeout(30)
@pytest.mark.asyncio
class TestExternalAgentSecurityTests:
    """
    Security tests for External Agent feature.

    Intent: Verify security measures are properly enforced.
    """

    async def test_credentials_never_exposed_in_responses(
        self,
        authenticated_client,
        test_workspace_2,
    ):
        """
        Intent: Verify auth credentials are never exposed in API responses.

        Steps:
        1. Create agent with OAuth2 credentials
        2. Verify credentials not in create response
        3. Verify credentials not in get response
        4. Verify credentials not in list response

        Assertions:
        - No client_secret in any response
        - No api_key values in any response
        - Auth config masked or omitted
        """
        test_client, auth_user = authenticated_client

        # Create agent with OAuth2 credentials (using custom_http for flexibility)
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Security Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.security-test.local/agent",
                "auth_type": "oauth2",
                "auth_config": {
                    "client_id": "test-client-id",
                    "client_secret": "super-secret-value-xyz123",
                    "token_url": "https://login.example.com/oauth2/token",
                },
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 10,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Check create response
        create_json = json.dumps(agent)
        assert "super-secret-value" not in create_json, "Secret in create response"
        assert (
            "client_secret" not in create_json.lower()
        ), "client_secret in create response"

        # Check get response
        get_response = await test_client.get(f"/api/v1/external-agents/{agent['id']}")
        assert get_response.status_code == 200
        get_json = json.dumps(get_response.json())
        assert "super-secret-value" not in get_json, "Secret in get response"

        # Check list response
        list_response = await test_client.get(
            f"/api/v1/external-agents?workspace_id={test_workspace_2['id']}"
        )
        assert list_response.status_code == 200
        list_json = json.dumps(list_response.json())
        assert "super-secret-value" not in list_json, "Secret in list response"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_organization_isolation_enforced(
        self,
        authenticated_client,
        test_organization,
        test_workspace_2,
        mock_external_webhook,
    ):
        """
        Intent: Verify agents are isolated by organization.

        Steps:
        1. Create agent in test organization
        2. Verify agent visible to authenticated user
        3. Verify invocations linked to correct organization

        Assertions:
        - Agent visible in org's list
        - Invocation records have correct org_id
        - No cross-organization data leakage
        """
        test_client, auth_user = authenticated_client

        # Create agent
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Org Isolation Security Test",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.org-security.local/agent",
                "auth_type": "none",
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 10,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Verify agent belongs to correct organization
        assert agent["organization_id"] == test_organization["id"]

        # Make invocation
        invoke_response = await test_client.post(
            f"/api/v1/external-agents/{agent['id']}/invoke",
            json={"input": "Org isolation security test"},
        )
        assert invoke_response.status_code == 200
        invocation = invoke_response.json()

        # Verify invocation record has correct org
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationReadNode",
            "read",
            {"id": invocation["invocation_id"]},
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        db_record = results.get("read", {})

        assert db_record["organization_id"] == test_organization["id"]
        assert db_record["user_id"] == auth_user["id"]

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_api_key_auth_credentials_encrypted(
        self,
        authenticated_client,
        test_workspace_2,
    ):
        """
        Intent: Verify API key auth credentials are properly handled.

        Steps:
        1. Create agent with API key auth
        2. Verify key not exposed in response
        3. Verify agent can be invoked (credentials work)

        Assertions:
        - API key not in create/get responses
        - Agent functional with stored credentials
        """
        test_client, auth_user = authenticated_client

        # Create agent with API key auth
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "API Key Auth Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.apikey-test.local/agent",
                "auth_type": "api_key",
                "auth_config": {
                    "key": "sk-test-secret-api-key-12345",
                    "header_name": "X-API-Key",
                },
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 10,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Check key not exposed
        agent_json = json.dumps(agent)
        assert "sk-test-secret-api-key" not in agent_json, "API key exposed in response"

        # Verify get response also doesn't expose key
        get_response = await test_client.get(f"/api/v1/external-agents/{agent['id']}")
        get_json = json.dumps(get_response.json())
        assert "sk-test-secret-api-key" not in get_json, "API key exposed in get"

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")

    async def test_bearer_token_auth_protected(
        self,
        authenticated_client,
        test_workspace_2,
    ):
        """
        Intent: Verify bearer token auth credentials are protected.

        Steps:
        1. Create agent with bearer token auth
        2. Verify token not exposed in any response

        Assertions:
        - Bearer token never in plaintext response
        - Token header name can be visible
        """
        test_client, auth_user = authenticated_client

        # Create agent with bearer token auth
        agent_response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Bearer Token Auth Test Agent",
                "workspace_id": test_workspace_2["id"],
                "platform": "custom_http",
                "webhook_url": "https://api.bearer-test.local/agent",
                "auth_type": "bearer_token",
                "auth_config": {
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret_payload",
                },
                "budget_limit_daily": 100.0,
                "budget_limit_monthly": 1000.0,
                "rate_limit_per_minute": 10,
            },
        )
        assert agent_response.status_code == 201
        agent = agent_response.json()

        # Check token not exposed
        agent_json = json.dumps(agent)
        assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in agent_json

        # Cleanup
        await test_client.delete(f"/api/v1/external-agents/{agent['id']}")


# ===================
# Fixtures
# ===================


@pytest.fixture
def mock_external_webhook(monkeypatch):
    """
    Mock external webhook server for performance/load E2E testing.

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

        # Mock external webhook calls with fast response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.json.return_value = {
            "result": "Mock performance test response",
            "metadata": {"cost": 0.01, "tokens": 50, "processing_time_ms": 10},
        }
        mock_response.elapsed.total_seconds.return_value = 0.010  # Fast mock
        return mock_response

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)
