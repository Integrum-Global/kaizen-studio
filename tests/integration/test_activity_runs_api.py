"""
Tier 2: Activity and Runs API Integration Tests

Tests activity and run history endpoints for EATP Ontology.
NO MOCKING - uses real PostgreSQL and DataFlow infrastructure.
"""

import pytest


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestActivity:
    """Test activity endpoints."""

    @pytest.mark.asyncio
    async def test_get_team_activity(self, authenticated_client):
        """Should get team activity events."""
        client, user = authenticated_client

        response = await client.get("/api/v1/activity/team")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # Verify structure if there are events
        for event in data:
            assert "id" in event
            assert "type" in event
            assert "userId" in event
            assert "userName" in event
            assert "workUnitId" in event
            assert "workUnitName" in event
            assert "timestamp" in event

    @pytest.mark.asyncio
    async def test_get_team_activity_with_limit(self, authenticated_client):
        """Should respect limit parameter."""
        client, user = authenticated_client

        response = await client.get("/api/v1/activity/team?limit=5")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5

    @pytest.mark.asyncio
    async def test_get_my_activity(self, authenticated_client):
        """Should get current user's activity."""
        client, user = authenticated_client

        response = await client.get("/api/v1/activity/my")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestRuns:
    """Test run history endpoints."""

    @pytest.mark.asyncio
    async def test_get_recent_runs(self, authenticated_client):
        """Should get user's recent runs."""
        client, user = authenticated_client

        response = await client.get("/api/v1/runs/recent")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # Verify structure if there are runs
        for run in data:
            assert "id" in run
            assert "status" in run
            assert "startedAt" in run

    @pytest.mark.asyncio
    async def test_get_recent_runs_with_limit(self, authenticated_client):
        """Should respect limit parameter."""
        client, user = authenticated_client

        response = await client.get("/api/v1/runs/recent?limit=5")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5

    @pytest.mark.asyncio
    async def test_get_run_not_found(self, authenticated_client):
        """Should return 404 for non-existent run."""
        client, user = authenticated_client

        response = await client.get("/api/v1/runs/non-existent-run-id")

        assert response.status_code == 404
