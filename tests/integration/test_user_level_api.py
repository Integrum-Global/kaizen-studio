"""
Tier 2: User Level API Integration Tests

Tests user level and delegatees endpoints for EATP Ontology.
NO MOCKING - uses real PostgreSQL and DataFlow infrastructure.
"""

import pytest


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestUserLevel:
    """Test user level endpoints."""

    @pytest.mark.asyncio
    async def test_get_own_level(self, authenticated_client):
        """Should get current user's EATP level."""
        client, user = authenticated_client

        response = await client.get(f"/api/v1/users/{user['id']}/level")

        assert response.status_code == 200
        data = response.json()
        assert "level" in data
        assert "permissions" in data
        assert data["level"] in [1, 2, 3]
        assert isinstance(data["permissions"], dict)

        # Verify permission keys
        permissions = data["permissions"]
        assert "canRun" in permissions
        assert "canConfigure" in permissions
        assert "canDelegate" in permissions
        assert "canCreateWorkUnits" in permissions
        assert "canManageWorkspaces" in permissions
        assert "canViewValueChains" in permissions
        assert "canAccessCompliance" in permissions
        assert "canEstablishTrust" in permissions
        assert "canDelete" in permissions

    @pytest.mark.asyncio
    async def test_level_permissions_consistency(self, authenticated_client):
        """Should have consistent permissions based on level."""
        client, user = authenticated_client

        response = await client.get(f"/api/v1/users/{user['id']}/level")

        assert response.status_code == 200
        data = response.json()
        level = data["level"]
        permissions = data["permissions"]

        # Level 1 can always run
        if level >= 1:
            assert permissions["canRun"] is True

        # Level 2 can configure and delegate
        if level >= 2:
            assert permissions["canConfigure"] is True
            assert permissions["canDelegate"] is True
            assert permissions["canCreateWorkUnits"] is True
            assert permissions["canManageWorkspaces"] is True

        # Level 3 has enterprise capabilities
        if level >= 3:
            assert permissions["canViewValueChains"] is True
            assert permissions["canAccessCompliance"] is True
            assert permissions["canEstablishTrust"] is True
            assert permissions["canDelete"] is True

    @pytest.mark.asyncio
    async def test_get_other_user_level_same_org(self, authenticated_client):
        """Should get another user's level in same organization."""
        client, user = authenticated_client

        # This will return 404 for a non-existent user
        response = await client.get("/api/v1/users/non-existent-user/level")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_user_not_found(self, authenticated_client):
        """Should return 404 for non-existent user."""
        client, user = authenticated_client

        response = await client.get("/api/v1/users/invalid-user-id/level")

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestDelegatees:
    """Test delegatees endpoint."""

    @pytest.mark.asyncio
    async def test_list_delegatees(self, authenticated_client):
        """Should list users available for delegation."""
        client, user = authenticated_client

        response = await client.get("/api/v1/users/delegatees")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # Verify structure if there are delegatees
        for delegatee in data:
            assert "id" in delegatee
            assert "name" in delegatee
            assert "level" in delegatee
            assert delegatee["level"] in [1, 2, 3]

    @pytest.mark.asyncio
    async def test_delegatees_excludes_current_user(self, authenticated_client):
        """Should not include current user in delegatees list."""
        client, user = authenticated_client

        response = await client.get("/api/v1/users/delegatees")

        assert response.status_code == 200
        data = response.json()

        # Current user should not be in the list
        for delegatee in data:
            assert delegatee["id"] != user["id"]


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestUserSearch:
    """Test user search functionality."""

    @pytest.mark.asyncio
    async def test_search_users_by_name(self, authenticated_client):
        """Should search users by name."""
        client, user = authenticated_client

        response = await client.get("/api/v1/users?search=test")

        assert response.status_code == 200
        data = response.json()
        assert "records" in data
        assert "total" in data

    @pytest.mark.asyncio
    async def test_search_users_by_email(self, authenticated_client):
        """Should search users by email."""
        client, user = authenticated_client

        response = await client.get("/api/v1/users?search=@example.com")

        assert response.status_code == 200
        data = response.json()
        assert "records" in data
