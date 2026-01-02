"""
Tier 2 Integration Tests: External Agent Lineage

Tests lineage integration with real PostgreSQL database (NO MOCKING).
Verifies end-to-end lineage creation, multi-hop graphs, and API queries.
"""

import uuid
from datetime import UTC, datetime

import pytest
import pytest_asyncio
from studio.services.lineage_service import LineageService


@pytest_asyncio.fixture
async def lineage_service():
    """LineageService with real database."""
    return LineageService()


@pytest_asyncio.fixture
async def test_external_agent(authenticated_owner_client, workspace_factory):
    """Create a test external agent using API."""
    client, user, org = authenticated_owner_client

    # Create workspace
    from studio.services.workspace_service import WorkspaceService

    workspace_service = WorkspaceService()
    workspace = await workspace_service.create_workspace(
        organization_id=org["id"],
        name="Lineage Test Workspace",
        environment_type="development",
        description="",
    )

    # Create external agent
    response = await client.post(
        "/api/v1/external-agents",
        json={
            "name": "Test Sales Bot",
            "workspace_id": workspace["id"],
            "platform": "custom_http",
            "webhook_url": "https://example.com/webhook",
            "auth_type": "none",
        },
    )
    assert response.status_code == 201, f"Failed to create agent: {response.json()}"
    return response.json()


@pytest.fixture
def test_api_key(authenticated_owner_client):
    """Sample API key for testing."""
    client, user, org = authenticated_owner_client
    return {
        "id": f"key-test-{uuid.uuid4().hex[:8]}",
        "key_prefix": "sk_test_abc123",
        "organization_id": org["id"],
        "team_id": None,
    }


@pytest.fixture
def test_external_headers():
    """Sample external identity headers."""
    return {
        "X-External-User-ID": "testuser@example.com",
        "X-External-User-Email": "testuser@example.com",
        "X-External-User-Name": "Test User",
        "X-External-System": "copilot",
        "X-External-Session-ID": f"test-session-{uuid.uuid4().hex[:8]}",
        "X-External-Trace-ID": f"test-trace-{uuid.uuid4().hex[:8]}",
        "X-External-Context": '{"role": "Tester", "tenant": "test-corp"}',
    }


@pytest.mark.integration
class TestLineageCreation:
    """Test lineage creation with real PostgreSQL database."""

    @pytest.mark.asyncio
    async def test_creates_lineage_in_database(
        self,
        lineage_service,
        test_external_agent,
        test_api_key,
        test_external_headers,
    ):
        """
        Intent: Verify end-to-end lineage creation with real database persistence.

        Setup: Real PostgreSQL, existing ExternalAgent
        Assertions:
        - Database query confirms LineageHop record exists with external_agent_id
        - All identity layers are correctly stored
        """
        # Act - create lineage record
        lineage = await lineage_service.create_lineage_record(
            request_headers=test_external_headers,
            external_agent=test_external_agent,
            api_key=test_api_key,
            request_body={"input": "Test query"},
            ip_address="192.168.1.100",
            user_agent="TestAgent/1.0",
        )

        # Assert - verify record was created
        assert lineage is not None
        assert lineage["id"].startswith("inv-")

        # Verify we can retrieve it from database
        retrieved = await lineage_service.get_lineage_by_id(lineage["id"])
        assert retrieved is not None
        assert retrieved["id"] == lineage["id"]

        # Verify all identity layers are present
        # Layer 1: External User Identity
        assert retrieved["external_user_id"] == "testuser@example.com"
        assert retrieved["external_user_email"] == "testuser@example.com"
        assert retrieved["external_user_name"] == "Test User"

        # Layer 2: External System Identity
        assert retrieved["external_system"] == "copilot"
        assert retrieved["external_session_id"].startswith("test-session-")
        assert retrieved["external_trace_id"].startswith("test-trace-")
        assert retrieved["external_context"] is not None

        # Layer 3: Kaizen Authentication
        assert retrieved["api_key_id"] == test_api_key["id"]
        assert retrieved["api_key_prefix"] == test_api_key["key_prefix"]
        assert retrieved["organization_id"] == test_api_key["organization_id"]

        # Layer 4: External Agent
        assert retrieved["external_agent_id"] == test_external_agent["id"]
        assert retrieved["external_agent_name"] == test_external_agent["name"]

        # Layer 5: Invocation Metadata
        assert retrieved["trace_id"].startswith("otel-trace-")
        assert retrieved["span_id"].startswith("otel-span-")
        assert retrieved["status"] == "pending"

    @pytest.mark.asyncio
    async def test_updates_lineage_with_results(
        self,
        lineage_service,
        test_external_agent,
        test_api_key,
        test_external_headers,
    ):
        """
        Intent: Verify lineage update persists to database.

        Creates lineage, updates it with success results, verifies persistence.
        """
        # Arrange - create initial lineage
        lineage = await lineage_service.create_lineage_record(
            request_headers=test_external_headers,
            external_agent=test_external_agent,
            api_key=test_api_key,
            request_body={"input": "Test query"},
        )

        # Act - update with success results
        updated = await lineage_service.update_lineage_result(
            invocation_id=lineage["id"],
            status="success",
            response={
                "status_code": 200,
                "headers": {"content-type": "application/json"},
                "body": {"result": "Test result"},
            },
            cost={
                "cost_usd": 0.05,
                "input_tokens": 10,
                "output_tokens": 20,
                "api_calls_count": 1,
            },
            duration_ms=1500,
        )

        # Assert - verify update persisted
        retrieved = await lineage_service.get_lineage_by_id(lineage["id"])
        assert retrieved["status"] == "success"
        # Database may return numeric values as strings, so convert for comparison
        assert int(retrieved["duration_ms"]) == 1500
        assert float(retrieved["cost_usd"]) == 0.05
        assert int(retrieved["input_tokens"]) == 10
        assert int(retrieved["output_tokens"]) == 20
        assert int(retrieved["response_status_code"]) == 200


@pytest.mark.integration
class TestMultiHopWorkflow:
    """Test multi-hop workflow creates linked lineage graph."""

    @pytest.mark.asyncio
    async def test_multi_hop_creates_linked_graph(
        self,
        lineage_service,
        test_external_agent,
        test_api_key,
    ):
        """
        Intent: Verify parent-child lineage relationships across multiple hops.

        Setup: Real PostgreSQL, existing ExternalAgent, mock internal agent workflow
        Steps:
        1. Create hop_1 (simulated internal agent A)
        2. Create hop_2 (external agent B) with parent_trace_id=hop_1
        3. Create hop_3 (simulated internal agent C) with parent_trace_id=hop_2
        Assertions:
        - Database confirms hop_2.parent_trace_id points to hop_1
        - hop_3.parent_trace_id points to hop_2
        - Complete lineage graph from A→B→C
        """
        # Step 1: Create hop_1 (internal agent A initiates workflow)
        hop_1_headers = {
            "X-External-User-ID": "user1@example.com",
            "X-External-User-Email": "user1@example.com",
            "X-External-System": "internal",
            "X-External-Session-ID": "session-1",
        }
        hop_1 = await lineage_service.create_lineage_record(
            request_headers=hop_1_headers,
            external_agent=test_external_agent,
            api_key=test_api_key,
            request_body={"input": "Start workflow"},
        )

        # Step 2: Create hop_2 (external agent B) linked to hop_1
        hop_2_headers = {
            "X-External-User-ID": "user1@example.com",
            "X-External-User-Email": "user1@example.com",
            "X-External-System": "copilot",
            "X-External-Session-ID": "session-2",
            "X-External-Trace-ID": hop_1["trace_id"],  # Link to parent
        }
        hop_2 = await lineage_service.create_lineage_record(
            request_headers=hop_2_headers,
            external_agent=test_external_agent,
            api_key=test_api_key,
            request_body={"input": "Process via external agent"},
        )

        # Step 3: Create hop_3 (internal agent C) linked to hop_2
        hop_3_headers = {
            "X-External-User-ID": "user1@example.com",
            "X-External-User-Email": "user1@example.com",
            "X-External-System": "internal",
            "X-External-Session-ID": "session-3",
            "X-External-Trace-ID": hop_2["trace_id"],  # Link to parent
        }
        hop_3 = await lineage_service.create_lineage_record(
            request_headers=hop_3_headers,
            external_agent=test_external_agent,
            api_key=test_api_key,
            request_body={"input": "Complete workflow"},
        )

        # Assert - verify lineage chain
        assert hop_2["parent_trace_id"] == hop_1["trace_id"]
        assert hop_3["parent_trace_id"] == hop_2["trace_id"]

        # Get lineage graph
        graph = await lineage_service.get_lineage_graph(
            external_agent_id=test_external_agent["id"]
        )

        # Verify graph structure
        assert len(graph["nodes"]) >= 3
        assert len(graph["edges"]) >= 2

        # Verify hop_2 has edge from hop_1
        hop_2_edges = [e for e in graph["edges"] if e["target"] == hop_2["id"]]
        assert len(hop_2_edges) == 1


@pytest.mark.integration
class TestLineageAPI:
    """Test lineage API endpoints with real database."""

    @pytest.mark.asyncio
    async def test_list_lineages_returns_records(
        self,
        lineage_service,
        test_external_agent,
        test_api_key,
        test_external_headers,
    ):
        """
        Intent: Verify lineage API returns correct records.

        Setup: Real PostgreSQL with lineage records
        Assertions: API response includes correct lineage data
        """
        # Arrange - create test lineage
        lineage = await lineage_service.create_lineage_record(
            request_headers=test_external_headers,
            external_agent=test_external_agent,
            api_key=test_api_key,
            request_body={"input": "Test query"},
        )

        # Act - list lineages
        result = await lineage_service.list_lineages(
            filters={"organization_id": test_api_key["organization_id"]},
            page=1,
            limit=100,
        )

        # Assert
        assert result["total"] >= 1
        assert len(result["lineages"]) >= 1

        # Verify our lineage is in the list
        found = any(item["id"] == lineage["id"] for item in result["lineages"])
        assert found, "Created lineage should be in list results"

    @pytest.mark.asyncio
    async def test_filters_by_external_agent_id(
        self,
        lineage_service,
        test_external_agent,
        test_api_key,
        test_external_headers,
    ):
        """
        Intent: Verify filtering logic with real database queries.

        Setup: Real PostgreSQL with lineages for multiple agents
        Assertions: Filter returns only lineages for specified agent
        """
        # Arrange - create lineages
        lineage = await lineage_service.create_lineage_record(
            request_headers=test_external_headers,
            external_agent=test_external_agent,
            api_key=test_api_key,
            request_body={"input": "Test query"},
        )

        # Act - filter by external_agent_id
        result = await lineage_service.list_lineages(
            filters={"external_agent_id": test_external_agent["id"]},
            page=1,
            limit=100,
        )

        # Assert - all results should be for our agent
        assert result["total"] >= 1
        for lineage_record in result["lineages"]:
            assert lineage_record["external_agent_id"] == test_external_agent["id"]

    @pytest.mark.asyncio
    async def test_export_lineage_csv(
        self,
        lineage_service,
        test_external_agent,
        test_api_key,
        test_external_headers,
    ):
        """
        Intent: Verify CSV export generates valid output.

        Creates lineage and exports to CSV format.
        """
        # Arrange - create test lineage
        lineage = await lineage_service.create_lineage_record(
            request_headers=test_external_headers,
            external_agent=test_external_agent,
            api_key=test_api_key,
            request_body={"input": "Test query"},
        )

        # Act - export to CSV
        csv_data = await lineage_service.export_lineage(
            filters={"organization_id": test_api_key["organization_id"]},
            format="csv",
        )

        # Assert
        assert csv_data is not None
        assert len(csv_data) > 0
        # CSV should have header row + at least one data row
        lines = csv_data.split("\n")
        assert len(lines) >= 2


@pytest.mark.integration
class TestGDPRCompliance:
    """Test GDPR Right to Erasure with real database."""

    @pytest.mark.asyncio
    async def test_redacts_user_data_in_database(
        self,
        lineage_service,
        test_external_agent,
        test_api_key,
    ):
        """
        Intent: Verify GDPR redaction actually modifies database records.

        Creates lineages for a user, redacts data, verifies PII is removed.
        """
        # Arrange - create lineages for a user
        user_email = f"gdpr-test-{datetime.now(UTC).timestamp()}@example.com"
        headers = {
            "X-External-User-ID": user_email,
            "X-External-User-Email": user_email,
            "X-External-User-Name": "GDPR Test User",
            "X-External-System": "copilot",
            "X-External-Session-ID": f"session-gdpr-{uuid.uuid4().hex[:8]}",
        }

        # Create 2 lineages
        lineage_1 = await lineage_service.create_lineage_record(
            request_headers=headers,
            external_agent=test_external_agent,
            api_key=test_api_key,
            request_body={"input": "Test 1"},
        )
        lineage_2 = await lineage_service.create_lineage_record(
            request_headers=headers,
            external_agent=test_external_agent,
            api_key=test_api_key,
            request_body={"input": "Test 2"},
        )

        # Act - redact user data
        redacted_count = await lineage_service.redact_user_data(user_email)

        # Assert - verify redaction
        assert redacted_count == 2

        # Verify PII was removed
        redacted_1 = await lineage_service.get_lineage_by_id(lineage_1["id"])
        assert redacted_1["external_user_email"] == "[REDACTED]"
        assert redacted_1["external_user_name"] == "[REDACTED]"
        assert redacted_1["external_user_id"].startswith("[REDACTED-")

        # Verify audit trail preserved
        assert redacted_1["organization_id"] == test_api_key["organization_id"]
        assert redacted_1["status"] == "pending"  # Status preserved
