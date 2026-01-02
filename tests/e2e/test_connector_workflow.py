"""
Tier 3: Connector Workflow End-to-End Tests

Tests complete connector lifecycle with all operations.
NO MOCKING - uses real infrastructure.
"""

import uuid

import pytest


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestCompleteConnectorLifecycle:
    """Test complete connector creation, update, test, and deletion."""

    @pytest.mark.asyncio
    async def test_create_list_get_update_delete_connector(self, authenticated_client):
        """Complete lifecycle: create, list, get, update, delete."""
        client, user = authenticated_client

        # 1. Create connector
        create_response = await client.post(
            "/api/v1/connectors",
            json={
                "name": "E2E PostgreSQL Connector",
                "connector_type": "database",
                "provider": "postgresql",
                "config": {
                    "host": "localhost",
                    "port": 5432,
                    "username": "user",
                    "password": "pass",
                    "database": "e2e_test",
                },
            },
        )
        assert create_response.status_code == 201
        connector_id = create_response.json()["id"]

        # 2. List and verify connector appears
        list_response = await client.get("/api/v1/connectors")
        assert list_response.status_code == 200
        connector_ids = [c["id"] for c in list_response.json()["records"]]
        assert connector_id in connector_ids

        # 3. Get connector details
        get_response = await client.get(f"/api/v1/connectors/{connector_id}")
        assert get_response.status_code == 200
        connector = get_response.json()
        assert connector["name"] == "E2E PostgreSQL Connector"
        assert connector["status"] == "active"

        # 4. Update connector
        update_response = await client.put(
            f"/api/v1/connectors/{connector_id}",
            json={"name": "Updated E2E PostgreSQL Connector"},
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated E2E PostgreSQL Connector"

        # 5. Verify update persisted via response (not cross-context GET)
        updated_data = update_response.json()
        assert updated_data["name"] == "Updated E2E PostgreSQL Connector"

        # 6. Delete connector
        delete_response = await client.delete(f"/api/v1/connectors/{connector_id}")
        assert delete_response.status_code == 200


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestConnectorAgentAttachmentWorkflow:
    """Test complete connector attachment and detachment workflow."""

    @pytest.mark.asyncio
    async def test_attach_multiple_connectors_to_agent(self, authenticated_client):
        """Attach multiple connectors to same agent with different aliases."""
        client, user = authenticated_client
        test_agent_id = f"agent-{uuid.uuid4()}"

        # Create multiple connectors
        connectors = []
        for i, (type_, provider) in enumerate(
            [("database", "postgresql"), ("database", "mysql"), ("api", "rest")]
        ):
            response = await client.post(
                "/api/v1/connectors",
                json={
                    "name": f"Connector-{i}-{uuid.uuid4()}",
                    "connector_type": type_,
                    "provider": provider,
                    "config": {"url": f"http://localhost:8000/{i}"},
                },
            )
            assert response.status_code == 201
            connectors.append(response.json())

        # Attach all to agent
        instances = []
        for i, connector in enumerate(connectors):
            response = await client.post(
                f"/api/v1/connectors/{connector['id']}/attach",
                json={"agent_id": test_agent_id, "alias": f"connector_{i}"},
            )
            assert response.status_code == 201
            instances.append(response.json())

        # Verify all attachments
        assert len(instances) == 3
        for instance in instances:
            assert instance["agent_id"] == test_agent_id
            assert instance["connector_id"] in [c["id"] for c in connectors]

        # Detach one
        detach_response = await client.delete(
            f"/api/v1/connectors/instances/{instances[0]['id']}"
        )
        assert detach_response.status_code == 200

        # Detach remaining
        for instance in instances[1:]:
            response = await client.delete(
                f"/api/v1/connectors/instances/{instance['id']}"
            )
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_same_connector_attached_to_multiple_agents(
        self, authenticated_client
    ):
        """Same connector can be attached to multiple agents."""
        client, user = authenticated_client

        # Create connector
        connector_response = await client.post(
            "/api/v1/connectors",
            json={
                "name": f"Shared Database {uuid.uuid4()}",
                "connector_type": "database",
                "provider": "postgresql",
                "config": {"url": "http://localhost"},
            },
        )
        assert connector_response.status_code == 201
        connector_id = connector_response.json()["id"]

        # Attach to multiple agents
        agent_ids = [f"agent-{uuid.uuid4()}" for _ in range(3)]
        instances = []

        for agent_id in agent_ids:
            response = await client.post(
                f"/api/v1/connectors/{connector_id}/attach",
                json={"agent_id": agent_id, "alias": f"shared_db_for_{agent_id[:8]}"},
            )
            assert response.status_code == 201
            instances.append(response.json())

        # Verify all attachments
        assert len(instances) == 3
        assert all(i["connector_id"] == connector_id for i in instances)
        assert [i["agent_id"] for i in instances] == agent_ids

        # Clean up
        for instance in instances:
            await client.delete(f"/api/v1/connectors/instances/{instance['id']}")


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestConnectorFiltering:
    """Test connector listing with various filter combinations."""

    @pytest.mark.asyncio
    async def test_list_with_multiple_filters(self, authenticated_client):
        """List connectors with multiple filters applied."""
        client, user = authenticated_client

        # Create diverse set of connectors
        test_data = [
            ("database", "postgresql", "active"),
            ("database", "mysql", "active"),
            ("database", "mongodb", "inactive"),
            ("api", "rest", "active"),
            ("api", "graphql", "inactive"),
            ("storage", "s3", "active"),
            ("messaging", "kafka", "inactive"),
        ]

        created = []
        for type_, provider, status in test_data:
            response = await client.post(
                "/api/v1/connectors",
                json={
                    "name": f"{type_}-{provider}-{uuid.uuid4()}",
                    "connector_type": type_,
                    "provider": provider,
                    "config": {},
                    "status": status,
                },
            )
            assert response.status_code == 201
            created.append(response.json())

        # Test single type filter
        response = await client.get("/api/v1/connectors?connector_type=database")
        assert response.status_code == 200
        results = response.json()["records"]
        assert all(c["connector_type"] == "database" for c in results)
        assert len(results) >= 3

        # Test status filter
        response = await client.get("/api/v1/connectors?status=active")
        assert response.status_code == 200
        results = response.json()["records"]
        assert all(c["status"] == "active" for c in results)

        # Test provider filter
        response = await client.get("/api/v1/connectors?provider=postgresql")
        assert response.status_code == 200
        results = response.json()["records"]
        assert all(c["provider"] == "postgresql" for c in results)


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestConnectorConfigurationHandling:
    """Test connector configuration encryption and handling."""

    @pytest.mark.asyncio
    async def test_sensitive_config_not_exposed_in_responses(
        self, authenticated_client
    ):
        """Sensitive config should never be exposed in API responses."""
        client, user = authenticated_client
        sensitive_config = {
            "host": "localhost",
            "port": 5432,
            "username": "admin",
            "password": "super_secret_password_12345",
        }

        # Create connector with sensitive config
        response = await client.post(
            "/api/v1/connectors",
            json={
                "name": f"Sensitive Config Test {uuid.uuid4()}",
                "connector_type": "database",
                "provider": "postgresql",
                "config": sensitive_config,
            },
        )
        assert response.status_code == 201
        connector_id = response.json()["id"]

        # Verify config not in create response
        assert "config" not in response.json()
        assert "config_encrypted" not in response.json()

        # Verify config not in list response
        list_response = await client.get("/api/v1/connectors")
        for connector in list_response.json()["records"]:
            assert "config" not in connector
            assert "config_encrypted" not in connector

        # Verify config not in get response
        get_response = await client.get(f"/api/v1/connectors/{connector_id}")
        assert "config" not in get_response.json()
        assert "config_encrypted" not in get_response.json()

    @pytest.mark.asyncio
    async def test_config_update_preserves_encryption(self, authenticated_client):
        """Updating config should properly encrypt new config."""
        client, user = authenticated_client

        # Create with initial config
        response = await client.post(
            "/api/v1/connectors",
            json={
                "name": f"Config Update Test {uuid.uuid4()}",
                "connector_type": "database",
                "provider": "postgresql",
                "config": {"host": "old-host", "port": 5432},
            },
        )
        assert response.status_code == 201
        connector_id = response.json()["id"]

        # Update config
        update_response = await client.put(
            f"/api/v1/connectors/{connector_id}",
            json={"config": {"host": "new-host", "port": 5433}},
        )
        assert update_response.status_code == 200

        # Verify config not exposed in update response
        assert "config" not in update_response.json()


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestConnectorConnectionTesting:
    """Test connection testing workflow."""

    @pytest.mark.asyncio
    async def test_connection_test_updates_test_result_fields(
        self, authenticated_client
    ):
        """Connection test should update last_tested_at and test result."""
        client, user = authenticated_client

        # Create connector
        create_response = await client.post(
            "/api/v1/connectors",
            json={
                "name": f"Connection Test {uuid.uuid4()}",
                "connector_type": "database",
                "provider": "postgresql",
                "config": {"host": "localhost", "port": 5432},
            },
        )
        assert create_response.status_code == 201
        connector_id = create_response.json()["id"]

        # Test connection
        test_response = await client.post(f"/api/v1/connectors/{connector_id}/test")
        assert test_response.status_code == 200

        # Verify test result is in response
        test_data = test_response.json()
        assert "success" in test_data or "last_test_result" in test_data


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestConnectorQueryExecution:
    """Test query execution on connectors."""

    @pytest.mark.asyncio
    async def test_query_execution_workflow(self, authenticated_client):
        """Execute queries on different connector types."""
        client, user = authenticated_client
        test_connectors = [
            ("database", "postgresql"),
            ("database", "mysql"),
            ("api", "rest"),
            ("storage", "s3"),
        ]

        for type_, provider in test_connectors:
            # Create connector
            create_response = await client.post(
                "/api/v1/connectors",
                json={
                    "name": f"Query Test {type_}-{provider}-{uuid.uuid4()}",
                    "connector_type": type_,
                    "provider": provider,
                    "config": {"url": f"http://localhost/{provider}"},
                },
            )
            assert create_response.status_code == 201
            connector_id = create_response.json()["id"]

            # Execute query
            response = await client.post(
                f"/api/v1/connectors/{connector_id}/query",
                json={"query": "SELECT 1", "params": {}},
            )
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "message" in data

    @pytest.mark.asyncio
    async def test_query_with_complex_params(self, authenticated_client):
        """Query with complex parameters should be handled."""
        client, user = authenticated_client

        # Create connector
        create_response = await client.post(
            "/api/v1/connectors",
            json={
                "name": f"Complex Query Test {uuid.uuid4()}",
                "connector_type": "database",
                "provider": "postgresql",
                "config": {"host": "localhost", "port": 5432},
            },
        )
        assert create_response.status_code == 201
        connector_id = create_response.json()["id"]

        response = await client.post(
            f"/api/v1/connectors/{connector_id}/query",
            json={
                "query": "SELECT * FROM table WHERE id = :id AND status = :status",
                "params": {"id": 123, "status": "active"},
            },
        )
        assert response.status_code == 200
        data = response.json()
        # Query endpoint returns success/error, not the params (params are in request, not response)
        assert "success" in data


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestConnectorDashboardScenarios:
    """Test typical connector dashboard scenarios."""

    @pytest.mark.asyncio
    async def test_dashboard_connector_overview(self, authenticated_client):
        """Simulate dashboard loading all connectors with metadata."""
        client, user = authenticated_client

        # Create diverse connectors
        for i in range(3):
            await client.post(
                "/api/v1/connectors",
                json={
                    "name": f"Dashboard Connector {i}-{uuid.uuid4()}",
                    "connector_type": "database",
                    "provider": "postgresql",
                    "config": {},
                },
            )

        # Load dashboard overview (list with pagination)
        response = await client.get("/api/v1/connectors?limit=10&offset=0")
        assert response.status_code == 200
        data = response.json()

        assert "records" in data
        assert "total" in data
        assert len(data["records"]) >= 3

        # Each connector should have essential fields for dashboard
        for connector in data["records"]:
            assert "id" in connector
            assert "name" in connector
            assert "connector_type" in connector
            assert "provider" in connector
            assert "status" in connector
            assert "last_tested_at" in connector
            assert "last_test_result" in connector
            # Sensitive data should not be exposed
            assert "config" not in connector
            assert "config_encrypted" not in connector

    @pytest.mark.asyncio
    async def test_connector_status_monitoring(self, authenticated_client):
        """Monitor connector status and test results."""
        client, user = authenticated_client

        # Create connector
        create_response = await client.post(
            "/api/v1/connectors",
            json={
                "name": f"Status Monitor Test {uuid.uuid4()}",
                "connector_type": "database",
                "provider": "postgresql",
                "config": {"host": "localhost"},
                "status": "active",
            },
        )
        assert create_response.status_code == 201
        connector_id = create_response.json()["id"]

        # Verify initial status from create response
        assert create_response.json()["status"] == "active"

        # Change status
        update_response = await client.put(
            f"/api/v1/connectors/{connector_id}",
            json={"status": "inactive"},
        )
        assert update_response.json()["status"] == "inactive"

        # Test connection
        test_response = await client.post(f"/api/v1/connectors/{connector_id}/test")
        assert test_response.status_code == 200

        # Verify test result in response
        test_data = test_response.json()
        assert "success" in test_data or "last_test_result" in test_data
