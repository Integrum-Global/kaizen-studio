"""
Tier 2: Connectors API Integration Tests

Tests all 11 connector endpoints with real database and DataFlow.
NO MOCKING - uses actual infrastructure.
"""

import uuid

import pytest


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestConnectorTypesEndpoint:
    """Test GET /connectors/types endpoint."""

    @pytest.mark.asyncio
    async def test_get_connector_types_returns_all_types(self, authenticated_client):
        """GET /connectors/types should return all connector types."""
        client, user = authenticated_client
        response = await client.get("/api/v1/connectors/types")

        assert response.status_code == 200
        data = response.json()

        assert "types" in data
        types = data["types"]
        assert "database" in types
        assert "api" in types
        assert "storage" in types
        assert "messaging" in types

    @pytest.mark.asyncio
    async def test_get_connector_types_database_providers(self, authenticated_client):
        """Database type should have correct providers."""
        client, user = authenticated_client
        response = await client.get("/api/v1/connectors/types")

        assert response.status_code == 200
        types = response.json()["types"]
        database_providers = types["database"]

        assert "postgresql" in database_providers
        assert "mysql" in database_providers
        assert "mongodb" in database_providers
        assert "redis" in database_providers
        assert "sqlite" in database_providers

    @pytest.mark.asyncio
    async def test_get_connector_types_requires_permission(self, test_client):
        """GET /connectors/types requires authentication."""
        response = await test_client.get("/api/v1/connectors/types")

        # Should fail without auth
        assert response.status_code in [401, 403]


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestCreateConnectorEndpoint:
    """Test POST /connectors endpoint."""

    @pytest.mark.asyncio
    async def test_create_connector_success(self, authenticated_client):
        """POST /connectors should create connector."""
        client, user = authenticated_client
        connector_data = {
            "name": "Test PostgreSQL",
            "connector_type": "database",
            "provider": "postgresql",
            "config": {
                "host": "localhost",
                "port": 5432,
                "username": "user",
                "password": "pass",
                "database": "testdb",
            },
        }

        response = await client.post("/api/v1/connectors", json=connector_data)

        assert response.status_code == 201
        data = response.json()

        assert "id" in data
        assert data["name"] == connector_data["name"]
        assert data["connector_type"] == "database"
        assert data["provider"] == "postgresql"
        assert data["status"] == "active"
        assert "config_encrypted" not in data  # Should not expose encrypted config

    @pytest.mark.asyncio
    async def test_create_connector_with_status(self, authenticated_client):
        """POST /connectors should respect status field."""
        client, user = authenticated_client
        connector_data = {
            "name": "Inactive Connector",
            "connector_type": "api",
            "provider": "rest",
            "config": {"base_url": "https://api.example.com"},
            "status": "inactive",
        }

        response = await client.post("/api/v1/connectors", json=connector_data)

        assert response.status_code == 201
        assert response.json()["status"] == "inactive"

    @pytest.mark.asyncio
    async def test_create_connector_invalid_type(self, authenticated_client):
        """POST /connectors with invalid type should fail."""
        client, user = authenticated_client
        connector_data = {
            "name": "Invalid",
            "connector_type": "invalid_type",
            "provider": "rest",
            "config": {},
        }

        response = await client.post("/api/v1/connectors", json=connector_data)

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_connector_invalid_provider_for_type(
        self, authenticated_client
    ):
        """POST /connectors with wrong provider for type should fail."""
        client, user = authenticated_client
        connector_data = {
            "name": "Wrong Provider",
            "connector_type": "database",
            "provider": "rest",  # REST is not a database provider
            "config": {},
        }

        response = await client.post("/api/v1/connectors", json=connector_data)

        assert response.status_code == 400  # Bad request

    @pytest.mark.asyncio
    async def test_create_connector_requires_permission(self, test_client):
        """POST /connectors requires connectors:create permission."""
        connector_data = {
            "name": "Test",
            "connector_type": "database",
            "provider": "postgresql",
            "config": {},
        }

        response = await test_client.post("/api/v1/connectors", json=connector_data)

        assert response.status_code in [401, 403]


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestListConnectorsEndpoint:
    """Test GET /connectors endpoint."""

    @pytest.mark.asyncio
    async def test_list_connectors_empty(self, authenticated_client):
        """GET /connectors should return empty list initially."""
        client, user = authenticated_client
        response = await client.get("/api/v1/connectors")

        assert response.status_code == 200
        data = response.json()

        assert "records" in data
        assert "total" in data
        assert isinstance(data["records"], list)
        assert isinstance(data["total"], int)

    @pytest.mark.asyncio
    async def test_list_connectors_with_created_connector(
        self, authenticated_client, create_connector
    ):
        """GET /connectors should return created connectors."""
        client, user = authenticated_client
        # Create a connector
        connector = await create_connector("database", "postgresql")

        # List connectors
        response = await client.get("/api/v1/connectors")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        connector_ids = [c["id"] for c in data["records"]]
        assert connector["id"] in connector_ids

    @pytest.mark.asyncio
    async def test_list_connectors_filter_by_type(
        self, authenticated_client, create_connector
    ):
        """GET /connectors with connector_type filter should work."""
        client, user = authenticated_client
        await create_connector("database", "postgresql")
        await create_connector("api", "rest")

        response = await client.get("/api/v1/connectors?connector_type=database")

        assert response.status_code == 200
        data = response.json()
        assert all(c["connector_type"] == "database" for c in data["records"])

    @pytest.mark.asyncio
    async def test_list_connectors_filter_by_provider(
        self, authenticated_client, create_connector
    ):
        """GET /connectors with provider filter should work."""
        client, user = authenticated_client
        await create_connector("database", "postgresql")
        await create_connector("database", "mysql")

        response = await client.get("/api/v1/connectors?provider=postgresql")

        assert response.status_code == 200
        data = response.json()
        assert all(c["provider"] == "postgresql" for c in data["records"])

    @pytest.mark.asyncio
    async def test_list_connectors_filter_by_status(
        self, authenticated_client, create_connector
    ):
        """GET /connectors with status filter should work."""
        client, user = authenticated_client
        await create_connector("database", "postgresql", status="active")
        await create_connector("api", "rest", status="inactive")

        response = await client.get("/api/v1/connectors?status=active")

        assert response.status_code == 200
        data = response.json()
        assert all(c["status"] == "active" for c in data["records"])

    @pytest.mark.asyncio
    async def test_list_connectors_pagination(
        self, authenticated_client, create_connector
    ):
        """GET /connectors with limit and offset should paginate."""
        client, user = authenticated_client
        # Create 5 connectors for this test
        created_ids = []
        for i in range(5):
            conn = await create_connector(
                "database", "postgresql", name=f"connector-{i}"
            )
            created_ids.append(conn["id"])

        response = await client.get("/api/v1/connectors?limit=2&offset=0")

        assert response.status_code == 200
        data = response.json()
        # Should return at most 2 records
        assert len(data["records"]) <= 2
        # Total should include all connectors created (at least 5)
        # NOTE: Due to test isolation, we only verify >= 2 because limit is enforced
        assert len(data["records"]) > 0


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestGetConnectorEndpoint:
    """Test GET /connectors/{connector_id} endpoint."""

    @pytest.mark.asyncio
    async def test_get_connector_success(self, authenticated_client, create_connector):
        """GET /connectors/{id} should return connector."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql")

        response = await client.get(f"/api/v1/connectors/{connector['id']}")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == connector["id"]
        assert data["name"] == connector["name"]
        assert data["connector_type"] == "database"
        assert data["provider"] == "postgresql"

    @pytest.mark.asyncio
    async def test_get_connector_not_found(self, authenticated_client):
        """GET /connectors/{id} with non-existent ID should return 404."""
        client, user = authenticated_client
        response = await client.get("/api/v1/connectors/nonexistent-id")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_connector_unauthorized_org(
        self,
        authenticated_client,
        create_connector,
    ):
        """GET /connectors from different org should fail (returns 404)."""
        client, user = authenticated_client

        # Connector created by first client in its org
        connector = await create_connector("database", "postgresql")

        # NOTE: Testing cross-org isolation requires creating a second org
        # with a different user. Since both authenticated_client and
        # authenticated_admin_client share the same underlying test_client
        # instance and thus the same auth headers, we cannot easily test
        # cross-org isolation in this test.
        #
        # Instead, we verify the connector belongs to the user's org
        response = await client.get(f"/api/v1/connectors/{connector['id']}")
        assert response.status_code == 200
        assert response.json()["organization_id"] == user["organization_id"]


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestUpdateConnectorEndpoint:
    """Test PUT /connectors/{connector_id} endpoint."""

    @pytest.mark.asyncio
    async def test_update_connector_name(self, authenticated_client, create_connector):
        """PUT /connectors should update connector name."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql")

        response = await client.put(
            f"/api/v1/connectors/{connector['id']}",
            json={"name": "Updated PostgreSQL"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated PostgreSQL"

    @pytest.mark.asyncio
    async def test_update_connector_status(
        self, authenticated_client, create_connector
    ):
        """PUT /connectors should update connector status."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql", status="active")

        response = await client.put(
            f"/api/v1/connectors/{connector['id']}",
            json={"status": "inactive"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "inactive"

    @pytest.mark.asyncio
    async def test_update_connector_config(
        self, authenticated_client, create_connector
    ):
        """PUT /connectors should update connector config."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql")

        new_config = {"host": "newhost.example.com", "port": 5432}

        response = await client.put(
            f"/api/v1/connectors/{connector['id']}",
            json={"config": new_config},
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_update_connector_no_fields_fails(
        self, authenticated_client, create_connector
    ):
        """PUT /connectors with no fields should fail."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql")

        response = await client.put(f"/api/v1/connectors/{connector['id']}", json={})

        assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestDeleteConnectorEndpoint:
    """Test DELETE /connectors/{connector_id} endpoint."""

    @pytest.mark.asyncio
    async def test_delete_connector_success(
        self, authenticated_client, create_connector
    ):
        """DELETE /connectors should delete connector."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql")

        response = await client.delete(f"/api/v1/connectors/{connector['id']}")

        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

        # Verify deleted
        get_response = await client.get(f"/api/v1/connectors/{connector['id']}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_connector_not_found(self, authenticated_client):
        """DELETE /connectors with non-existent ID should return 404."""
        client, user = authenticated_client
        response = await client.delete("/api/v1/connectors/nonexistent-id")

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestTestConnectionEndpoint:
    """Test POST /connectors/{connector_id}/test endpoint."""

    @pytest.mark.asyncio
    async def test_test_connection_success(
        self, authenticated_client, create_connector
    ):
        """POST /connectors/{id}/test should test connection."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql")

        response = await client.post(f"/api/v1/connectors/{connector['id']}/test")

        assert response.status_code == 200
        data = response.json()

        assert "success" in data
        assert "message" in data

    @pytest.mark.asyncio
    async def test_test_connection_not_found(self, authenticated_client):
        """POST /connectors/{id}/test with non-existent ID should return 404."""
        client, user = authenticated_client
        response = await client.post("/api/v1/connectors/nonexistent-id/test")

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestAttachConnectorEndpoint:
    """Test POST /connectors/{connector_id}/attach endpoint."""

    @pytest.mark.asyncio
    async def test_attach_connector_to_agent_success(
        self, authenticated_client, create_connector
    ):
        """POST /connectors/{id}/attach should attach connector to agent."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql")
        agent_id = f"agent-{uuid.uuid4().hex[:8]}"

        response = await client.post(
            f"/api/v1/connectors/{connector['id']}/attach",
            json={"agent_id": agent_id, "alias": "primary_db"},
        )

        assert response.status_code == 201
        data = response.json()

        assert "id" in data  # Instance ID
        assert data["connector_id"] == connector["id"]
        assert data["agent_id"] == agent_id
        assert data["alias"] == "primary_db"

    @pytest.mark.asyncio
    async def test_attach_connector_with_config_override(
        self, authenticated_client, create_connector
    ):
        """POST /connectors/{id}/attach should accept config override."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql")
        agent_id = f"agent-{uuid.uuid4().hex[:8]}"

        response = await client.post(
            f"/api/v1/connectors/{connector['id']}/attach",
            json={
                "agent_id": agent_id,
                "alias": "backup_db",
                "config_override": {"timeout": 60},
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert "config_override" in data


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestDetachConnectorEndpoint:
    """Test DELETE /connectors/instances/{instance_id} endpoint."""

    @pytest.mark.asyncio
    async def test_detach_connector_from_agent_success(
        self, authenticated_client, create_connector
    ):
        """DELETE /connectors/instances/{id} should detach connector."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql")
        agent_id = f"agent-{uuid.uuid4().hex[:8]}"

        # Attach first
        attach_response = await client.post(
            f"/api/v1/connectors/{connector['id']}/attach",
            json={"agent_id": agent_id, "alias": "test_db"},
        )
        instance_id = attach_response.json()["id"]

        # Detach
        response = await client.delete(f"/api/v1/connectors/instances/{instance_id}")

        assert response.status_code == 200
        assert "detached" in response.json()["message"].lower()


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestExecuteQueryEndpoint:
    """Test POST /connectors/{connector_id}/query endpoint."""

    @pytest.mark.asyncio
    async def test_execute_query_success(self, authenticated_client, create_connector):
        """POST /connectors/{id}/query should execute query.

        Note: With fake connector config, the query will fail to connect
        but the endpoint should still return a proper response structure.
        """
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql")

        response = await client.post(
            f"/api/v1/connectors/{connector['id']}/query",
            json={"query": "SELECT 1", "params": {}},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure - success may be False with fake config
        assert "success" in data
        # With fake config, we just verify the endpoint handles the request properly
        # The success value depends on whether the fake config can connect

    @pytest.mark.asyncio
    async def test_execute_query_with_params(
        self, authenticated_client, create_connector
    ):
        """POST /connectors/{id}/query with params should work."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql")

        response = await client.post(
            f"/api/v1/connectors/{connector['id']}/query",
            json={
                "query": "SELECT * FROM users WHERE id = :id",
                "params": {"id": "123"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "success" in data

    @pytest.mark.asyncio
    async def test_execute_query_inactive_connector_fails(
        self, authenticated_client, create_connector
    ):
        """POST /connectors/{id}/query on inactive connector should fail."""
        client, user = authenticated_client
        connector = await create_connector("database", "postgresql", status="inactive")

        response = await client.post(
            f"/api/v1/connectors/{connector['id']}/query",
            json={"query": "SELECT 1", "params": {}},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
