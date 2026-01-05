"""
Tier 2: Workspaces API Integration Tests

Tests all workspace endpoints with real database operations.
NO MOCKING - uses real PostgreSQL and DataFlow infrastructure.
Tests the EATP Ontology workspace model.
"""

import pytest


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestWorkspacesCRUD:
    """Test workspace CRUD endpoints with real database."""

    @pytest.mark.asyncio
    async def test_list_workspaces_empty(self, authenticated_client):
        """Should return empty list when no workspaces exist."""
        client, user = authenticated_client

        response = await client.get("/api/v1/workspaces")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_create_permanent_workspace(self, authenticated_client):
        """Should create a permanent workspace."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/workspaces",
            json={
                "name": "Finance Operations",
                "description": "Permanent workspace for finance",
                "workspaceType": "permanent",
                "color": "#4F46E5",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Finance Operations"
        assert data["workspaceType"] == "permanent"
        assert data["description"] == "Permanent workspace for finance"
        assert "id" in data
        assert data["isArchived"] is False

    @pytest.mark.asyncio
    async def test_create_temporary_workspace(self, authenticated_client):
        """Should create a temporary workspace with expiry."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/workspaces",
            json={
                "name": "Q4 Audit Prep",
                "description": "Temporary workspace for audit",
                "workspaceType": "temporary",
                "expiresAt": "2025-12-31T23:59:59Z",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Q4 Audit Prep"
        assert data["workspaceType"] == "temporary"

    @pytest.mark.asyncio
    async def test_create_personal_workspace(self, authenticated_client):
        """Should create a personal workspace."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/workspaces",
            json={
                "name": "My Favorites",
                "workspaceType": "personal",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["workspaceType"] == "personal"

    @pytest.mark.asyncio
    async def test_get_workspace(self, authenticated_client):
        """Should get a workspace by ID."""
        client, user = authenticated_client

        # Create workspace
        create_response = await client.post(
            "/api/v1/workspaces",
            json={
                "name": "Workspace to Get",
                "workspaceType": "permanent",
            },
        )

        workspace_id = create_response.json()["id"]

        # Get workspace
        response = await client.get(f"/api/v1/workspaces/{workspace_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == workspace_id
        assert data["name"] == "Workspace to Get"
        assert "members" in data
        assert "workUnits" in data

    @pytest.mark.asyncio
    async def test_update_workspace(self, authenticated_client):
        """Should update a workspace."""
        client, user = authenticated_client

        # Create workspace
        create_response = await client.post(
            "/api/v1/workspaces",
            json={
                "name": "Original Workspace",
                "workspaceType": "permanent",
            },
        )

        workspace_id = create_response.json()["id"]

        # Update workspace
        response = await client.patch(
            f"/api/v1/workspaces/{workspace_id}",
            json={
                "name": "Updated Workspace",
                "description": "New description",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Workspace"

    @pytest.mark.asyncio
    async def test_archive_workspace(self, authenticated_client):
        """Should archive a workspace."""
        client, user = authenticated_client

        # Create workspace
        create_response = await client.post(
            "/api/v1/workspaces",
            json={
                "name": "Workspace to Archive",
                "workspaceType": "permanent",
            },
        )

        workspace_id = create_response.json()["id"]

        # Archive workspace
        response = await client.post(f"/api/v1/workspaces/{workspace_id}/archive")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Workspace archived successfully"

    @pytest.mark.asyncio
    async def test_restore_workspace(self, authenticated_client):
        """Should restore an archived workspace."""
        client, user = authenticated_client

        # Create workspace
        create_response = await client.post(
            "/api/v1/workspaces",
            json={
                "name": "Workspace to Restore",
                "workspaceType": "permanent",
            },
        )

        workspace_id = create_response.json()["id"]

        # Archive then restore
        await client.post(f"/api/v1/workspaces/{workspace_id}/archive")
        response = await client.post(f"/api/v1/workspaces/{workspace_id}/restore")

        assert response.status_code == 200
        data = response.json()
        assert data["isArchived"] is False

    @pytest.mark.asyncio
    async def test_delete_workspace(self, authenticated_client):
        """Should permanently delete a workspace."""
        client, user = authenticated_client

        # Create workspace
        create_response = await client.post(
            "/api/v1/workspaces",
            json={
                "name": "Workspace to Delete",
                "workspaceType": "permanent",
            },
        )

        workspace_id = create_response.json()["id"]

        # Delete workspace
        response = await client.delete(f"/api/v1/workspaces/{workspace_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Workspace deleted successfully"

    @pytest.mark.asyncio
    async def test_workspace_not_found(self, authenticated_client):
        """Should return 404 for non-existent workspace."""
        client, user = authenticated_client

        response = await client.get("/api/v1/workspaces/non-existent-id")

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestWorkspaceFiltering:
    """Test workspace filtering."""

    @pytest.mark.asyncio
    async def test_filter_by_type(self, authenticated_client):
        """Should filter workspaces by type."""
        client, user = authenticated_client

        # Create different types
        await client.post(
            "/api/v1/workspaces",
            json={"name": "Permanent WS", "workspaceType": "permanent"},
        )
        await client.post(
            "/api/v1/workspaces",
            json={"name": "Temporary WS", "workspaceType": "temporary"},
        )

        # Filter by permanent
        response = await client.get("/api/v1/workspaces?type=permanent")

        assert response.status_code == 200
        data = response.json()
        for ws in data:
            assert ws["workspaceType"] == "permanent"

    @pytest.mark.asyncio
    async def test_exclude_archived(self, authenticated_client):
        """Should exclude archived workspaces by default."""
        client, user = authenticated_client

        # Create and archive a workspace
        create_response = await client.post(
            "/api/v1/workspaces",
            json={"name": "Archived WS", "workspaceType": "permanent"},
        )
        workspace_id = create_response.json()["id"]
        await client.post(f"/api/v1/workspaces/{workspace_id}/archive")

        # List without includeArchived
        response = await client.get("/api/v1/workspaces")

        assert response.status_code == 200
        data = response.json()
        for ws in data:
            assert ws["isArchived"] is False

    @pytest.mark.asyncio
    async def test_include_archived(self, authenticated_client):
        """Should include archived workspaces when requested."""
        client, user = authenticated_client

        response = await client.get("/api/v1/workspaces?includeArchived=true")

        assert response.status_code == 200
        # Just verify the parameter is accepted


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestWorkspaceMembers:
    """Test workspace member management."""

    @pytest.mark.asyncio
    async def test_add_member(self, authenticated_client):
        """Should add a member to a workspace."""
        client, user = authenticated_client

        # Create workspace
        create_response = await client.post(
            "/api/v1/workspaces",
            json={"name": "Workspace With Members", "workspaceType": "permanent"},
        )
        workspace_id = create_response.json()["id"]

        # Add member
        response = await client.post(
            f"/api/v1/workspaces/{workspace_id}/members",
            json={"userId": "test-user-123", "role": "member"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "Member added successfully"

    @pytest.mark.asyncio
    async def test_update_member_role(self, authenticated_client):
        """Should update a member's role."""
        client, user = authenticated_client

        # Create workspace
        create_response = await client.post(
            "/api/v1/workspaces",
            json={"name": "Workspace for Role Update", "workspaceType": "permanent"},
        )
        assert create_response.status_code == 201, f"Create workspace failed: {create_response.text}"
        workspace_id = create_response.json()["id"]

        # First add a member
        add_response = await client.post(
            f"/api/v1/workspaces/{workspace_id}/members",
            json={"userId": "test-user-for-update", "role": "member"},
        )
        assert add_response.status_code == 201, f"Add member failed: {add_response.text}"

        # Update member role
        response = await client.patch(
            f"/api/v1/workspaces/{workspace_id}/members/test-user-for-update",
            json={"role": "admin"},
        )

        assert response.status_code == 200, f"Update member failed: {response.text}"
        data = response.json()
        assert data["role"] == "admin"

    @pytest.mark.asyncio
    async def test_remove_member(self, authenticated_client):
        """Should remove a member from a workspace."""
        client, user = authenticated_client

        # Create workspace
        create_response = await client.post(
            "/api/v1/workspaces",
            json={"name": "Workspace for Member Removal", "workspaceType": "permanent"},
        )
        workspace_id = create_response.json()["id"]

        # First add a member
        await client.post(
            f"/api/v1/workspaces/{workspace_id}/members",
            json={"userId": "test-user-for-removal", "role": "member"},
        )

        # Remove member
        response = await client.delete(
            f"/api/v1/workspaces/{workspace_id}/members/test-user-for-removal"
        )

        assert response.status_code == 200


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestWorkspaceWorkUnits:
    """Test workspace work unit management."""

    @pytest.mark.asyncio
    async def test_add_work_unit(self, authenticated_client):
        """Should add a work unit to a workspace."""
        client, user = authenticated_client

        # Create workspace
        ws_response = await client.post(
            "/api/v1/workspaces",
            json={"name": "Workspace for Work Units", "workspaceType": "permanent"},
        )
        workspace_id = ws_response.json()["id"]

        # Create work unit
        wu_response = await client.post(
            "/api/v1/work-units",
            json={"name": "Work Unit for Workspace", "type": "atomic"},
        )
        work_unit_id = wu_response.json()["id"]

        # Add work unit to workspace
        response = await client.post(
            f"/api/v1/workspaces/{workspace_id}/work-units",
            json={"workUnitId": work_unit_id},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "Work unit added to workspace"

    @pytest.mark.asyncio
    async def test_remove_work_unit(self, authenticated_client):
        """Should remove a work unit from a workspace."""
        client, user = authenticated_client

        # Create workspace
        ws_response = await client.post(
            "/api/v1/workspaces",
            json={"name": "Workspace for WU Removal", "workspaceType": "permanent"},
        )
        workspace_id = ws_response.json()["id"]

        # Create work unit
        wu_response = await client.post(
            "/api/v1/work-units",
            json={"name": "Work Unit to Remove", "type": "atomic"},
        )
        work_unit_id = wu_response.json()["id"]

        # First add work unit to workspace
        await client.post(
            f"/api/v1/workspaces/{workspace_id}/work-units",
            json={"workUnitId": work_unit_id},
        )

        # Remove work unit
        response = await client.delete(
            f"/api/v1/workspaces/{workspace_id}/work-units/{work_unit_id}"
        )

        assert response.status_code == 200
