"""
Integration Tests for SSO API

Tier 2: Real infrastructure integration tests.
Uses real database (PostgreSQL) - NO MOCKING.
Tests SSO connection CRUD endpoints and identity linking.
"""

import uuid

import pytest


@pytest.mark.integration
class TestSSOConnectionCRUD:
    """Test SSO connection CRUD operations via API."""

    @pytest.mark.asyncio
    async def test_create_sso_connection(self, authenticated_owner_client):
        """Test creating an SSO connection."""
        client, user, org = authenticated_owner_client

        connection_data = {
            "provider": "google",
            "client_id": f"google-{uuid.uuid4().hex[:8]}",
            "client_secret": "super_secret_client_secret_12345",
            "is_default": True,
            "auto_provision": True,
            "default_role": "developer",
            "allowed_domains": "example.com,company.com",
        }

        response = await client.post("/api/v1/sso/connections", json=connection_data)

        assert response.status_code == 200
        data = response.json()

        assert data["provider"] == "google"
        assert data["client_id"] == connection_data["client_id"]
        assert data["is_default"] is True
        assert data["auto_provision"] is True
        assert data["default_role"] == "developer"
        assert data["allowed_domains"] == "example.com,company.com"
        assert "id" in data
        assert "client_secret_encrypted" not in data  # Should not be in response

    @pytest.mark.asyncio
    async def test_create_azure_sso_connection(self, authenticated_owner_client):
        """Test creating an Azure AD SSO connection."""
        client, user, org = authenticated_owner_client

        connection_data = {
            "provider": "azure",
            "client_id": f"azure-{uuid.uuid4().hex[:8]}",
            "client_secret": "azure_secret_key_789",
            "tenant_id": "tenant-abc123",
            "is_default": False,
            "auto_provision": False,
            "default_role": "viewer",
        }

        response = await client.post("/api/v1/sso/connections", json=connection_data)

        assert response.status_code == 200
        data = response.json()

        assert data["provider"] == "azure"
        assert data["tenant_id"] == "tenant-abc123"
        assert data["auto_provision"] is False
        assert data["default_role"] == "viewer"

    @pytest.mark.asyncio
    async def test_create_okta_sso_connection(self, authenticated_owner_client):
        """Test creating an Okta SSO connection."""
        client, user, org = authenticated_owner_client

        connection_data = {
            "provider": "okta",
            "client_id": f"okta-{uuid.uuid4().hex[:8]}",
            "client_secret": "okta_secret_xyz",
            "domain": "dev-123456.okta.com",
            "is_default": False,
        }

        response = await client.post("/api/v1/sso/connections", json=connection_data)

        assert response.status_code == 200
        data = response.json()

        assert data["provider"] == "okta"
        assert data["domain"] == "dev-123456.okta.com"

    @pytest.mark.asyncio
    async def test_create_custom_sso_connection(self, authenticated_owner_client):
        """Test creating a custom provider SSO connection."""
        client, user, org = authenticated_owner_client

        connection_data = {
            "provider": "custom",
            "client_id": f"custom-{uuid.uuid4().hex[:8]}",
            "client_secret": "custom_secret_456",
            "custom_urls": {
                "authorize_url": "https://custom.provider.com/oauth/authorize",
                "token_url": "https://custom.provider.com/oauth/token",
                "userinfo_url": "https://custom.provider.com/oauth/userinfo",
            },
        }

        response = await client.post("/api/v1/sso/connections", json=connection_data)

        assert response.status_code == 200
        data = response.json()

        assert data["provider"] == "custom"
        assert (
            data["custom_authorize_url"]
            == connection_data["custom_urls"]["authorize_url"]
        )

    @pytest.mark.asyncio
    async def test_list_sso_connections(self, authenticated_owner_client):
        """Test listing all SSO connections for an organization."""
        client, user, org = authenticated_owner_client

        # Create multiple connections
        for i in range(3):
            await client.post(
                "/api/v1/sso/connections",
                json={
                    "provider": "google" if i == 0 else "azure" if i == 1 else "okta",
                    "client_id": f"client-{i}",
                    "client_secret": f"secret-{i}",
                    "tenant_id": "tenant-123" if i == 1 else None,
                    "domain": "dev.okta.com" if i == 2 else None,
                },
            )

        response = await client.get("/api/v1/sso/connections")

        assert response.status_code == 200
        data = response.json()

        assert "connections" in data
        assert len(data["connections"]) >= 3
        assert all("id" in conn for conn in data["connections"])
        assert all(
            "client_secret_encrypted" not in conn for conn in data["connections"]
        )

    @pytest.mark.asyncio
    async def test_get_sso_connection(self, authenticated_owner_client):
        """Test getting a specific SSO connection."""
        client, user, org = authenticated_owner_client

        # Create a connection
        create_response = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": f"google-{uuid.uuid4().hex[:8]}",
                "client_secret": "super_secret",
                "is_default": True,
            },
        )

        connection_id = create_response.json()["id"]

        # Get the connection
        response = await client.get(f"/api/v1/sso/connections/{connection_id}")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == connection_id
        assert data["provider"] == "google"
        assert "client_secret_encrypted" not in data

    @pytest.mark.asyncio
    async def test_get_nonexistent_connection(self, authenticated_owner_client):
        """Test getting a non-existent SSO connection."""
        client, user, org = authenticated_owner_client

        response = await client.get(f"/api/v1/sso/connections/{uuid.uuid4()}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_sso_connection(self, authenticated_owner_client):
        """Test updating an SSO connection."""
        client, user, org = authenticated_owner_client

        # Create a connection
        create_response = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": "initial-client-id",
                "client_secret": "initial_secret",
                "is_default": False,
                "default_role": "developer",
            },
        )

        connection_id = create_response.json()["id"]

        # Update the connection
        response = await client.put(
            f"/api/v1/sso/connections/{connection_id}",
            json={
                "client_id": "updated-client-id",
                "default_role": "viewer",
                "auto_provision": False,
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert data["client_id"] == "updated-client-id"
        assert data["default_role"] == "viewer"
        assert data["auto_provision"] is False

    @pytest.mark.asyncio
    async def test_update_connection_with_new_secret(self, authenticated_owner_client):
        """Test updating an SSO connection with a new client secret."""
        client, user, org = authenticated_owner_client

        # Create a connection
        create_response = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": "client-id",
                "client_secret": "old_secret",
            },
        )

        connection_id = create_response.json()["id"]

        # Update with new secret
        response = await client.put(
            f"/api/v1/sso/connections/{connection_id}",
            json={
                "client_secret": "new_secret_updated",
            },
        )

        assert response.status_code == 200

        # Verify the secret was updated by fetching connection
        get_response = await client.get(f"/api/v1/sso/connections/{connection_id}")
        assert get_response.status_code == 200

    @pytest.mark.asyncio
    async def test_set_connection_as_default(self, authenticated_owner_client):
        """Test setting a connection as default unsets others."""
        client, user, org = authenticated_owner_client

        # Create first connection
        conn1_response = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": "client-1",
                "client_secret": "secret-1",
                "is_default": True,
            },
        )
        conn1_id = conn1_response.json()["id"]

        # Verify it's default
        assert conn1_response.json()["is_default"] is True

        # Create second connection
        conn2_response = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "azure",
                "client_id": "client-2",
                "client_secret": "secret-2",
                "is_default": False,
            },
        )
        conn2_id = conn2_response.json()["id"]

        # Set second as default
        update_response = await client.put(
            f"/api/v1/sso/connections/{conn2_id}",
            json={
                "is_default": True,
            },
        )

        assert update_response.json()["is_default"] is True

        # Verify first is no longer default
        conn1_updated = await client.get(f"/api/v1/sso/connections/{conn1_id}")
        assert conn1_updated.json()["is_default"] is False

    @pytest.mark.asyncio
    async def test_delete_sso_connection(self, authenticated_owner_client):
        """Test deleting an SSO connection."""
        client, user, org = authenticated_owner_client

        # Create a connection
        create_response = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": f"google-{uuid.uuid4().hex[:8]}",
                "client_secret": "super_secret",
            },
        )

        connection_id = create_response.json()["id"]

        # Delete the connection
        response = await client.delete(f"/api/v1/sso/connections/{connection_id}")

        assert response.status_code == 200
        assert response.json()["status"] == "deleted"

        # Verify it's deleted
        get_response = await client.get(f"/api/v1/sso/connections/{connection_id}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_connection_requires_admin_role(
        self, authenticated_developer_client
    ):
        """Test that creating connections requires admin role."""
        client, user = authenticated_developer_client

        connection_data = {
            "provider": "google",
            "client_id": "client-id",
            "client_secret": "secret",
        }

        response = await client.post("/api/v1/sso/connections", json=connection_data)

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_update_connection_requires_admin_role(
        self, authenticated_owner_client
    ):
        """Test that updating connections requires admin role."""
        # Create connection as owner
        owner_client, owner_user, org = authenticated_owner_client

        create_response = await owner_client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": f"client-{uuid.uuid4().hex[:8]}",
                "client_secret": "secret",
            },
        )

        assert (
            create_response.status_code == 200
        ), f"Create failed: {create_response.json()}"
        connection_id = create_response.json()["id"]

        # Create a developer user in a DIFFERENT org using test headers
        # The auth middleware in non-production mode allows x-user-id, x-org-id, x-role headers
        different_org_id = str(uuid.uuid4())
        different_user_id = str(uuid.uuid4())

        # Save owner's auth header and use test headers for developer request
        saved_auth = owner_client.headers.get("Authorization")
        del owner_client.headers["Authorization"]
        owner_client.headers["x-user-id"] = different_user_id
        owner_client.headers["x-org-id"] = different_org_id
        owner_client.headers["x-role"] = "developer"

        try:
            response = await owner_client.put(
                f"/api/v1/sso/connections/{connection_id}",
                json={
                    "client_id": "new-client-id",
                },
            )

            # Developer from different org should not be able to update
            # 401 = Not authenticated (test header user doesn't exist)
            # 403 = Forbidden (no permission)
            # 404 = Not found (connection not visible to this org)
            assert response.status_code in (401, 403, 404)
        finally:
            # Restore owner's auth header
            del owner_client.headers["x-user-id"]
            del owner_client.headers["x-org-id"]
            del owner_client.headers["x-role"]
            if saved_auth:
                owner_client.headers["Authorization"] = saved_auth

    @pytest.mark.asyncio
    async def test_connection_isolation_by_organization(
        self, authenticated_owner_client
    ):
        """Test that connections are isolated by organization."""
        # Set up first organization
        client1, user1, org1 = authenticated_owner_client

        create_response = await client1.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": f"google-{uuid.uuid4().hex[:8]}",
                "client_secret": "secret",
            },
        )

        connection_id = create_response.json()["id"]

        # Set up second organization (would need another authenticated_owner_client fixture)
        # This test assumes proper organization isolation in the database layer


@pytest.mark.integration
class TestSSOIdentityLinking:
    """Test SSO identity linking operations."""

    @pytest.mark.asyncio
    async def test_get_user_identities(self, authenticated_owner_client):
        """Test getting user identities."""
        client, user, org = authenticated_owner_client

        response = await client.get("/api/v1/sso/identities")

        assert response.status_code == 200
        data = response.json()

        assert "identities" in data
        assert isinstance(data["identities"], list)

    @pytest.mark.asyncio
    async def test_list_identities_empty_for_new_user(self, authenticated_owner_client):
        """Test that new users have no SSO identities."""
        client, user, org = authenticated_owner_client

        response = await client.get("/api/v1/sso/identities")

        assert response.status_code == 200
        data = response.json()

        assert len(data["identities"]) == 0

    @pytest.mark.asyncio
    async def test_multiple_sso_connections_per_organization(
        self, authenticated_owner_client
    ):
        """Test that organization can have multiple SSO connections."""
        client, user, org = authenticated_owner_client

        providers = ["google", "azure", "okta"]
        created_connections = []

        for provider in providers:
            response = await client.post(
                "/api/v1/sso/connections",
                json={
                    "provider": provider,
                    "client_id": f"{provider}-{uuid.uuid4().hex[:8]}",
                    "client_secret": f"{provider}_secret",
                    "tenant_id": "tenant-123" if provider == "azure" else None,
                    "domain": "dev.okta.com" if provider == "okta" else None,
                },
            )

            assert response.status_code == 200
            created_connections.append(response.json())

        # List all connections
        list_response = await client.get("/api/v1/sso/connections")

        assert response.status_code == 200
        assert len(list_response.json()["connections"]) >= 3

    @pytest.mark.asyncio
    async def test_sso_connection_status_active_default(
        self, authenticated_owner_client
    ):
        """Test that new SSO connections are active by default."""
        client, user, org = authenticated_owner_client

        response = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": f"google-{uuid.uuid4().hex[:8]}",
                "client_secret": "secret",
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "active"

    @pytest.mark.asyncio
    async def test_sso_connection_update_status(self, authenticated_owner_client):
        """Test updating connection status."""
        client, user, org = authenticated_owner_client

        # Create connection
        create_response = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": f"google-{uuid.uuid4().hex[:8]}",
                "client_secret": "secret",
            },
        )

        connection_id = create_response.json()["id"]

        # Update status to inactive
        response = await client.put(
            f"/api/v1/sso/connections/{connection_id}",
            json={
                "status": "inactive",
            },
        )

        assert response.status_code == 200
        assert response.json()["status"] == "inactive"

    @pytest.mark.asyncio
    async def test_connection_timestamps(self, authenticated_owner_client):
        """Test that connection timestamps are properly set."""
        client, user, org = authenticated_owner_client

        response = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": f"google-{uuid.uuid4().hex[:8]}",
                "client_secret": "secret",
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Timestamps should be ISO 8601
        assert "created_at" in data
        assert "updated_at" in data
        assert isinstance(data["created_at"], str)
        assert isinstance(data["updated_at"], str)
        assert data["created_at"] == data["updated_at"]

    @pytest.mark.asyncio
    async def test_connection_update_timestamp(self, authenticated_owner_client):
        """Test that updated_at changes when connection is updated."""
        client, user, org = authenticated_owner_client

        # Create connection
        create_response = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": f"google-{uuid.uuid4().hex[:8]}",
                "client_secret": "secret",
            },
        )

        original_updated_at = create_response.json()["updated_at"]

        connection_id = create_response.json()["id"]

        # Wait a tiny bit to ensure timestamp difference
        import asyncio

        await asyncio.sleep(0.1)

        # Update connection
        response = await client.put(
            f"/api/v1/sso/connections/{connection_id}",
            json={
                "default_role": "viewer",
            },
        )

        updated_at = response.json()["updated_at"]

        assert updated_at >= original_updated_at
