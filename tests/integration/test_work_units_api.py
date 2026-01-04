"""
Tier 2: Work Units API Integration Tests

Tests all work unit endpoints with real database operations.
NO MOCKING - uses real PostgreSQL and DataFlow infrastructure.
Tests the unified Work Unit model (agents + pipelines).
"""

import pytest


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestWorkUnitsCRUD:
    """Test work unit CRUD endpoints with real database."""

    @pytest.mark.asyncio
    async def test_list_work_units_empty(self, authenticated_client):
        """Should return empty list when no work units exist."""
        client, user = authenticated_client

        response = await client.get("/api/v1/work-units")

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "pageSize" in data
        assert "hasMore" in data

    @pytest.mark.asyncio
    async def test_create_atomic_work_unit(self, authenticated_client):
        """Should create an atomic work unit (creates agent)."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/work-units",
            json={
                "name": "Test Atomic Work Unit",
                "description": "A test atomic work unit",
                "type": "atomic",
                "tags": ["test", "atomic"],
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Atomic Work Unit"
        assert data["type"] == "atomic"
        assert data["description"] == "A test atomic work unit"
        assert "id" in data
        assert "trustInfo" in data
        assert data["trustInfo"]["status"] == "valid"

    @pytest.mark.asyncio
    async def test_create_composite_work_unit(self, authenticated_client):
        """Should create a composite work unit (creates pipeline)."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/work-units",
            json={
                "name": "Test Composite Work Unit",
                "description": "A test composite work unit",
                "type": "composite",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Composite Work Unit"
        assert data["type"] == "composite"

    @pytest.mark.asyncio
    async def test_get_work_unit(self, authenticated_client):
        """Should get a work unit by ID."""
        client, user = authenticated_client

        # Create work unit
        create_response = await client.post(
            "/api/v1/work-units",
            json={
                "name": "Work Unit to Get",
                "description": "Test description",
                "type": "atomic",
            },
        )

        work_unit_id = create_response.json()["id"]

        # Get work unit
        response = await client.get(f"/api/v1/work-units/{work_unit_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == work_unit_id
        assert data["name"] == "Work Unit to Get"

    @pytest.mark.asyncio
    async def test_update_work_unit(self, authenticated_client):
        """Should update a work unit."""
        client, user = authenticated_client

        # Create work unit
        create_response = await client.post(
            "/api/v1/work-units",
            json={
                "name": "Original Name",
                "description": "Original description",
                "type": "atomic",
            },
        )

        work_unit_id = create_response.json()["id"]

        # Update work unit
        response = await client.put(
            f"/api/v1/work-units/{work_unit_id}",
            json={
                "name": "Updated Name",
                "description": "Updated description",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_delete_work_unit(self, authenticated_client):
        """Should archive a work unit."""
        client, user = authenticated_client

        # Create work unit
        create_response = await client.post(
            "/api/v1/work-units",
            json={
                "name": "Work Unit to Delete",
                "type": "atomic",
            },
        )

        work_unit_id = create_response.json()["id"]

        # Delete work unit
        response = await client.delete(f"/api/v1/work-units/{work_unit_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Work unit archived successfully"

    @pytest.mark.asyncio
    async def test_work_unit_not_found(self, authenticated_client):
        """Should return 404 for non-existent work unit."""
        client, user = authenticated_client

        response = await client.get("/api/v1/work-units/non-existent-id")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_requires_fields(self, authenticated_client):
        """Should reject update with no fields."""
        client, user = authenticated_client

        # Create work unit
        create_response = await client.post(
            "/api/v1/work-units",
            json={
                "name": "Test Work Unit",
                "type": "atomic",
            },
        )

        work_unit_id = create_response.json()["id"]

        # Try to update with empty body
        response = await client.put(
            f"/api/v1/work-units/{work_unit_id}",
            json={},
        )

        assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestWorkUnitsFiltering:
    """Test work unit filtering and pagination."""

    @pytest.mark.asyncio
    async def test_filter_by_type(self, authenticated_client):
        """Should filter work units by type."""
        client, user = authenticated_client

        # Create both types
        await client.post(
            "/api/v1/work-units",
            json={"name": "Atomic 1", "type": "atomic"},
        )
        await client.post(
            "/api/v1/work-units",
            json={"name": "Composite 1", "type": "composite"},
        )

        # Filter by atomic
        response = await client.get("/api/v1/work-units?type=atomic")

        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            assert item["type"] == "atomic"

    @pytest.mark.asyncio
    async def test_pagination(self, authenticated_client):
        """Should paginate work units."""
        client, user = authenticated_client

        # Create multiple work units
        for i in range(5):
            await client.post(
                "/api/v1/work-units",
                json={"name": f"Work Unit {i}", "type": "atomic"},
            )

        # Get first page
        response = await client.get("/api/v1/work-units?page=1&pageSize=2")

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 2
        assert data["page"] == 1
        assert data["pageSize"] == 2


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestWorkUnitsExecution:
    """Test work unit execution endpoints."""

    @pytest.mark.asyncio
    async def test_run_work_unit(self, authenticated_client):
        """Should run a work unit."""
        client, user = authenticated_client

        # Create work unit
        create_response = await client.post(
            "/api/v1/work-units",
            json={
                "name": "Runnable Work Unit",
                "type": "atomic",
            },
        )

        work_unit_id = create_response.json()["id"]

        # Run work unit
        response = await client.post(
            f"/api/v1/work-units/{work_unit_id}/run",
            json={"inputs": {"key": "value"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["status"] == "running"
        assert "startedAt" in data

    @pytest.mark.asyncio
    async def test_list_work_unit_runs(self, authenticated_client):
        """Should list runs for a work unit."""
        client, user = authenticated_client

        # Create work unit
        create_response = await client.post(
            "/api/v1/work-units",
            json={
                "name": "Work Unit With Runs",
                "type": "atomic",
            },
        )

        work_unit_id = create_response.json()["id"]

        # List runs (should be empty for now)
        response = await client.get(f"/api/v1/work-units/{work_unit_id}/runs")

        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestWorkUnitsAvailable:
    """Test available work units endpoint (Level 1 view)."""

    @pytest.mark.asyncio
    async def test_list_available_work_units(self, authenticated_client):
        """Should list available work units for user."""
        client, user = authenticated_client

        response = await client.get("/api/v1/work-units/available")

        assert response.status_code == 200
        assert isinstance(response.json(), list)
