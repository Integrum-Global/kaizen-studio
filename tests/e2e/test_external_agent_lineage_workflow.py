"""
Tier 3 End-to-End Tests: External Agent Lineage Workflow

Tests complete lineage tracking with real infrastructure (NO MOCKING for database).
Verifies full workflow from external agent creation through invocation to lineage query.

Note: External HTTP calls are mocked using respx to avoid network dependencies.
"""

import json
import uuid

import pytest
import respx
from httpx import Response
from studio.services.external_agent_service import ExternalAgentService
from studio.services.lineage_service import LineageService

# Mark all tests as E2E tests and async
pytestmark = [pytest.mark.e2e, pytest.mark.asyncio]


@pytest.fixture
async def external_agent_service():
    """ExternalAgentService with real database."""
    return ExternalAgentService()


@pytest.fixture
async def lineage_service():
    """LineageService with real database."""
    return LineageService()


@pytest.fixture
def mock_external_webhook():
    """
    Mock external webhook endpoints using respx.

    This allows testing external agent invocations without making real network calls.
    """
    with respx.mock(assert_all_called=False) as respx_mock:
        # Mock httpbin.org POST endpoint (returns JSON echo)
        respx_mock.post("https://httpbin.org/post").mock(
            return_value=Response(
                200,
                json={
                    "json": {"response": "Mocked webhook response"},
                    "headers": {},
                    "data": "",
                },
            )
        )

        # Mock httpbin.org status/500 endpoint (returns error)
        respx_mock.post("https://httpbin.org/status/500").mock(
            return_value=Response(500, text="Internal Server Error")
        )

        yield respx_mock


class TestCompleteWorkflow:
    """Test complete multi-hop workflow with lineage visualization."""

    @pytest.mark.asyncio
    async def test_end_to_end_lineage_tracking(
        self,
        authenticated_owner_client,
        external_agent_service,
        lineage_service,
        mock_external_webhook,
    ):
        """
        Intent: Verify end-to-end lineage tracking from internal agent through external agent.

        Setup: Real PostgreSQL, real Redis, mock webhook server, mock internal agent runtime
        Steps:
        1. Create external agent
        2. Invoke external agent via service (with external headers)
        3. Verify lineage was created
        4. Query lineage via API
        5. Verify all identity layers captured
        Assertions:
        - Lineage record exists with correct data
        - All 5 identity layers present
        - Lineage queryable via API
        """
        client, user, org = authenticated_owner_client
        org_id = org["id"]
        workspace_id = f"e2e-workspace-{uuid.uuid4().hex[:8]}"
        user_id = user["id"]

        # Step 1: Create external agent
        agent = await external_agent_service.create(
            organization_id=org_id,
            workspace_id=workspace_id,
            name="E2E Test Agent",
            platform="teams",
            webhook_url="https://httpbin.org/post",  # Mocked endpoint
            auth_type="bearer_token",
            created_by=user_id,
            auth_config={"token": "test-token"},
            platform_config={"tenant_id": "e2e-tenant", "channel_id": "e2e-channel"},
        )

        # Step 2: Prepare external headers and API key
        api_key_id = f"e2e-key-{uuid.uuid4().hex[:8]}"
        external_headers = {
            "X-External-User-ID": "e2euser@example.com",
            "X-External-User-Email": "e2euser@example.com",
            "X-External-User-Name": "E2E Test User",
            "X-External-System": "copilot",
            "X-External-Session-ID": f"e2e-session-{uuid.uuid4().hex[:8]}",
            "X-External-Trace-ID": f"e2e-trace-{uuid.uuid4().hex[:8]}",
            "X-External-Context": '{"role": "E2E Tester"}',
        }

        api_key = {
            "id": api_key_id,
            "key_prefix": "sk_e2e_test",
            "organization_id": org_id,
            "team_id": None,
        }

        request_data = {
            "input": "E2E test query",
            "context": {"test": True},
        }

        # Step 3: Invoke external agent (mocked HTTP call)
        try:
            result = await external_agent_service.invoke(
                agent_id=agent["id"],
                user_id=user_id,
                organization_id=org_id,
                request_data=request_data,
                request_ip="192.168.1.200",
                request_user_agent="E2ETest/1.0",
                external_headers=external_headers,
                api_key=api_key,
            )

            # Step 4: Verify invocation succeeded
            assert result is not None
            assert "invocation_id" in result
            assert result["status"] == "success"
            invocation_id = result["invocation_id"]

            # Step 5: Query lineage
            lineage = await lineage_service.get_lineage_by_id(invocation_id)

            # Assertions: Verify all 5 identity layers
            assert lineage is not None

            # Layer 1: External User Identity
            assert lineage["external_user_id"] == "e2euser@example.com"
            assert lineage["external_user_email"] == "e2euser@example.com"
            assert lineage["external_user_name"] == "E2E Test User"

            # Layer 2: External System Identity
            assert lineage["external_system"] == "copilot"

            # Layer 3: Kaizen Authentication
            assert lineage["api_key_id"] == api_key_id
            assert lineage["organization_id"] == org_id

            # Layer 4: External Agent
            assert lineage["external_agent_id"] == agent["id"]
            assert lineage["external_agent_name"] == agent["name"]

            # Layer 5: Invocation Metadata
            assert lineage["trace_id"] is not None
            assert lineage["status"] == "success"
            assert lineage["duration_ms"] is not None
            # response_status_code may be stored as string or int
            assert int(lineage["response_status_code"]) == 200  # mocked response

        finally:
            # Cleanup
            await external_agent_service.delete(agent["id"])

    @pytest.mark.asyncio
    async def test_lineage_with_failed_invocation(
        self,
        authenticated_owner_client,
        external_agent_service,
        lineage_service,
        mock_external_webhook,
    ):
        """
        Intent: Verify lineage captures failures and error metadata.

        Setup: Real PostgreSQL, mock webhook server (returns 500)
        Steps:
        1. Create external agent with invalid webhook
        2. Invoke agent (will fail)
        3. Query lineage
        Assertions:
        - LineageHop created with status='failure'
        - error_message populated
        """
        client, user, org = authenticated_owner_client
        org_id = org["id"]
        user_id = user["id"]
        workspace_id = f"e2e-workspace-fail-{uuid.uuid4().hex[:8]}"

        # Step 1: Create external agent with invalid webhook (mocked to return 500)
        agent = await external_agent_service.create(
            organization_id=org_id,
            workspace_id=workspace_id,
            name="E2E Fail Test Agent",
            platform="custom_http",
            webhook_url="https://httpbin.org/status/500",  # Mocked to return 500 error
            auth_type="none",
            created_by=user_id,
            auth_config={},
            platform_config={},
        )

        # Step 2: Prepare headers and invoke
        fail_email = f"failuser-{uuid.uuid4().hex[:8]}@example.com"
        external_headers = {
            "X-External-User-ID": fail_email,
            "X-External-User-Email": fail_email,
            "X-External-System": "test",
            "X-External-Session-ID": f"fail-session-{uuid.uuid4().hex[:8]}",
        }

        api_key = {
            "id": f"fail-key-{uuid.uuid4().hex[:8]}",
            "key_prefix": "sk_fail_test",
            "organization_id": org_id,
            "team_id": None,
        }

        # Step 3: Invoke (should fail due to mocked 500 response)
        try:
            result = await external_agent_service.invoke(
                agent_id=agent["id"],
                user_id=user_id,
                organization_id=org_id,
                request_data={"input": "This will fail"},
                external_headers=external_headers,
                api_key=api_key,
            )
            # If we get here, the invocation didn't fail as expected
            # mocked 500 response should cause failure
            pytest.fail("Expected invocation to fail")
        except (ValueError, Exception) as e:
            # Expected failure
            assert (
                "failed" in str(e).lower()
                or "500" in str(e)
                or "error" in str(e).lower()
            )

        # Step 4: Query lineage to verify failure was recorded
        # We need to find the lineage by filtering
        lineages = await lineage_service.list_lineages(
            filters={
                "organization_id": org_id,
                "external_user_email": fail_email,
            },
            page=1,
            limit=10,
        )

        # Assert - should have at least one failed lineage
        assert lineages["total"] >= 1
        failed_lineage = lineages["lineages"][0]
        assert failed_lineage["status"] == "failure"
        assert failed_lineage["error_message"] is not None

        # Cleanup
        await external_agent_service.delete(agent["id"])


class TestLineageGraphVisualization:
    """Test lineage graph generation for multi-hop workflows."""

    @pytest.mark.asyncio
    async def test_generates_lineage_graph(
        self,
        authenticated_owner_client,
        external_agent_service,
        lineage_service,
        mock_external_webhook,
    ):
        """
        Intent: Verify lineage graph generation for visualization.

        Creates multi-hop workflow and generates graph structure.
        """
        client, user, org = authenticated_owner_client
        org_id = org["id"]
        user_id = user["id"]
        workspace_id = f"graph-workspace-{uuid.uuid4().hex[:8]}"

        # Create external agent
        agent = await external_agent_service.create(
            organization_id=org_id,
            workspace_id=workspace_id,
            name="Graph Test Agent",
            platform="custom_http",
            webhook_url="https://httpbin.org/post",
            auth_type="none",
            created_by=user_id,
            auth_config={},
            platform_config={},
        )

        # Create lineages with parent-child relationships
        graph_email = f"graphuser-{uuid.uuid4().hex[:8]}@example.com"
        headers_1 = {
            "X-External-User-ID": graph_email,
            "X-External-User-Email": graph_email,
            "X-External-System": "internal",
            "X-External-Session-ID": f"graph-session-{uuid.uuid4().hex[:8]}",
        }

        api_key = {
            "id": f"graph-key-{uuid.uuid4().hex[:8]}",
            "key_prefix": "sk_graph_test",
            "organization_id": org_id,
            "team_id": None,
        }

        # Create lineage 1
        lineage_1 = await lineage_service.create_lineage_record(
            request_headers=headers_1,
            external_agent=agent,
            api_key=api_key,
            request_body={"input": "Hop 1"},
        )

        # Create lineage 2 with parent link
        headers_2 = {
            **headers_1,
            "X-External-Trace-ID": lineage_1["trace_id"],
        }
        lineage_2 = await lineage_service.create_lineage_record(
            request_headers=headers_2,
            external_agent=agent,
            api_key=api_key,
            request_body={"input": "Hop 2"},
        )

        # Get lineage graph
        graph = await lineage_service.get_lineage_graph(external_agent_id=agent["id"])

        # Assertions
        assert graph is not None
        assert "nodes" in graph
        assert "edges" in graph
        assert len(graph["nodes"]) >= 2
        assert len(graph["edges"]) >= 1

        # Verify nodes have correct structure
        node_1 = next((n for n in graph["nodes"] if n["id"] == lineage_1["id"]), None)
        assert node_1 is not None
        assert node_1["type"] == "external_agent"
        assert node_1["label"] == agent["name"]

        # Verify edge connects lineage_1 -> lineage_2
        edge = next((e for e in graph["edges"] if e["target"] == lineage_2["id"]), None)
        assert edge is not None

        # Cleanup
        await external_agent_service.delete(agent["id"])


class TestComplianceExport:
    """Test compliance export functionality."""

    @pytest.mark.asyncio
    async def test_exports_lineage_for_compliance(
        self,
        authenticated_owner_client,
        external_agent_service,
        lineage_service,
        mock_external_webhook,
    ):
        """
        Intent: Verify lineage export for compliance reporting.

        Creates lineages and exports to CSV/JSON formats.
        """
        client, user, org = authenticated_owner_client
        org_id = org["id"]
        user_id = user["id"]
        workspace_id = f"export-workspace-{uuid.uuid4().hex[:8]}"

        # Create external agent
        agent = await external_agent_service.create(
            organization_id=org_id,
            workspace_id=workspace_id,
            name="Export Test Agent",
            platform="custom_http",
            webhook_url="https://httpbin.org/post",
            auth_type="none",
            created_by=user_id,
            auth_config={},
            platform_config={},
        )

        # Create test lineages
        export_email = f"exportuser-{uuid.uuid4().hex[:8]}@example.com"
        headers = {
            "X-External-User-ID": export_email,
            "X-External-User-Email": export_email,
            "X-External-System": "test",
            "X-External-Session-ID": f"export-session-{uuid.uuid4().hex[:8]}",
        }

        api_key = {
            "id": f"export-key-{uuid.uuid4().hex[:8]}",
            "key_prefix": "sk_export_test",
            "organization_id": org_id,
            "team_id": None,
        }

        lineage = await lineage_service.create_lineage_record(
            request_headers=headers,
            external_agent=agent,
            api_key=api_key,
            request_body={"input": "Export test"},
        )

        # Export to JSON
        json_export = await lineage_service.export_lineage(
            filters={"organization_id": org_id},
            format="json",
        )
        assert json_export is not None
        assert len(json_export) > 0
        # Verify valid JSON
        data = json.loads(json_export)
        assert isinstance(data, list)
        assert len(data) >= 1

        # Export to CSV
        csv_export = await lineage_service.export_lineage(
            filters={"organization_id": org_id},
            format="csv",
        )
        assert csv_export is not None
        assert len(csv_export) > 0
        lines = csv_export.split("\n")
        assert len(lines) >= 2  # Header + data

        # Cleanup
        await external_agent_service.delete(agent["id"])
