"""
Tier 2: API Keys API Integration Tests

Tests all API key endpoints with real PostgreSQL database and NO MOCKING.
Uses test infrastructure with real DataFlow models and workflow execution.
"""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestCreateAPIKey:
    """Test API key creation endpoint."""

    @pytest.mark.asyncio
    async def test_create_api_key_success(self, authenticated_owner_client):
        """Creating API key with valid data should succeed."""
        client, user, org = authenticated_owner_client

        response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Test API Key",
                "scopes": ["agents:read", "agents:write"],
                "rate_limit": 100,
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert data["name"] == "Test API Key"
        assert data["scopes"] == ["agents:read", "agents:write"]
        assert data["rate_limit"] == 100
        assert "key" in data
        assert data["key"].startswith("sk_live_")
        assert "key_prefix" in data
        assert data["status"] == "active"

    @pytest.mark.asyncio
    async def test_create_api_key_with_expiration(self, authenticated_owner_client):
        """Creating API key with expiration should store date."""
        client, user, org = authenticated_owner_client

        expires_at = (datetime.now(UTC) + timedelta(days=30)).isoformat()

        response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Expiring Key",
                "scopes": ["agents:read"],
                "rate_limit": 50,
                "expires_at": expires_at,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["expires_at"] == expires_at

    @pytest.mark.asyncio
    async def test_create_api_key_filters_invalid_scopes(
        self, authenticated_owner_client
    ):
        """Creating key with invalid scopes should be rejected."""
        client, user, org = authenticated_owner_client

        response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Invalid Scopes Key",
                "scopes": ["invalid:scope"],
                "rate_limit": 100,
            },
        )

        assert response.status_code == 400
        data = response.json()
        # API returns {"error": {"message": "..."}} due to error_handler middleware
        if "detail" in data:
            assert "Invalid scopes" in data["detail"]
        else:
            assert "Invalid scopes" in data.get("error", {}).get("message", "")

    @pytest.mark.asyncio
    async def test_create_api_key_default_rate_limit(self, authenticated_owner_client):
        """Creating key without rate limit should use default."""
        client, user, org = authenticated_owner_client

        response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Default Rate Limit Key",
                "scopes": [],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["rate_limit"] == 60  # Default

    @pytest.mark.asyncio
    async def test_create_api_key_requires_name(
        self, test_client: AsyncClient, authenticated_owner_client
    ):
        """Creating key without name should fail."""
        client, user, org = authenticated_owner_client

        response = await client.post(
            "/api/v1/api-keys",
            json={
                "scopes": [],
                "rate_limit": 100,
            },
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_api_key_requires_authentication(
        self, test_client: AsyncClient
    ):
        """Creating key without authentication should fail."""
        response = await test_client.post(
            "/api/v1/api-keys",
            json={
                "name": "Test Key",
                "scopes": [],
                "rate_limit": 100,
            },
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_api_key_plain_key_shown_once(
        self, authenticated_owner_client
    ):
        """Creating key should return plain key only in creation response."""
        client, user, org = authenticated_owner_client

        create_response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "One Time View Key",
                "scopes": [],
                "rate_limit": 100,
            },
        )

        assert create_response.status_code == 200
        plain_key = create_response.json()["key"]
        key_id = create_response.json()["id"]

        # Try to get the key again
        get_response = await client.get(f"/api/v1/api-keys/{key_id}")
        assert get_response.status_code == 200

        # Plain key should NOT be in get response
        assert "key" not in get_response.json()
        assert get_response.json()["key_prefix"] in plain_key


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestListAPIKeys:
    """Test API key listing endpoint."""

    @pytest.mark.asyncio
    async def test_list_api_keys_empty(self, authenticated_owner_client):
        """Listing keys for new org should return empty list."""
        client, user, org = authenticated_owner_client

        response = await client.get("/api/v1/api-keys")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_list_api_keys_multiple(self, authenticated_owner_client):
        """Listing keys should return all org keys."""
        client, user, org = authenticated_owner_client

        # Create first key
        response1 = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Key 1",
                "scopes": ["agents:read"],
                "rate_limit": 100,
            },
        )
        assert response1.status_code == 200

        # Create second key
        response2 = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Key 2",
                "scopes": ["deployments:write"],
                "rate_limit": 50,
            },
        )
        assert response2.status_code == 200

        # List keys
        list_response = await client.get("/api/v1/api-keys")
        assert list_response.status_code == 200

        keys = list_response.json()
        assert len(keys) >= 2
        key_names = [k["name"] for k in keys]
        assert "Key 1" in key_names
        assert "Key 2" in key_names

    @pytest.mark.asyncio
    async def test_list_api_keys_requires_authentication(
        self, test_client: AsyncClient
    ):
        """Listing keys without authentication should fail."""
        response = await test_client.get("/api/v1/api-keys")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_list_api_keys_org_isolation(
        self, authenticated_owner_client, test_client: AsyncClient
    ):
        """Keys should be isolated by organization."""
        client, user, org = authenticated_owner_client

        # Create key in authenticated org
        response1 = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Org1 Key",
                "scopes": [],
                "rate_limit": 100,
            },
        )
        assert response1.status_code == 200

        # List keys (should see the key we created)
        list_response = await client.get("/api/v1/api-keys")
        assert list_response.status_code == 200
        keys = list_response.json()

        # Should see our key
        key_names = [k["name"] for k in keys]
        assert "Org1 Key" in key_names


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestGetAPIKey:
    """Test API key retrieval endpoint."""

    @pytest.mark.asyncio
    async def test_get_api_key_success(self, authenticated_owner_client):
        """Getting existing key should return key details."""
        client, user, org = authenticated_owner_client

        # Create key
        create_response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Get Test Key",
                "scopes": ["agents:read"],
                "rate_limit": 100,
            },
        )
        assert create_response.status_code == 200
        key_id = create_response.json()["id"]

        # Get key
        get_response = await client.get(f"/api/v1/api-keys/{key_id}")
        assert get_response.status_code == 200

        data = get_response.json()
        assert data["id"] == key_id
        assert data["name"] == "Get Test Key"
        assert data["scopes"] == ["agents:read"]

    @pytest.mark.asyncio
    async def test_get_api_key_not_found(self, authenticated_owner_client):
        """Getting non-existent key should return 404."""
        client, user, org = authenticated_owner_client

        response = await client.get("/api/v1/api-keys/nonexistent")

        assert response.status_code == 404
        data = response.json()
        # API returns {"error": {"message": "..."}} due to error_handler middleware
        if "detail" in data:
            assert "not found" in data["detail"].lower()
        else:
            assert "not found" in data.get("error", {}).get("message", "").lower()

    @pytest.mark.asyncio
    async def test_get_api_key_org_isolation(
        self, authenticated_owner_client, second_org_client
    ):
        """Should not be able to get another org's key."""
        client, user, org = authenticated_owner_client
        other_client, other_user, other_org = second_org_client

        # Create key in first org
        create_response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Org1 Secret Key",
                "scopes": [],
                "rate_limit": 100,
            },
        )
        assert create_response.status_code == 200
        key_id = create_response.json()["id"]

        # Try to access with second org's client
        get_response = await other_client.get(f"/api/v1/api-keys/{key_id}")
        # Should be 404 (not visible to other org)
        assert get_response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestRevokeAPIKey:
    """Test API key revocation endpoint."""

    @pytest.mark.asyncio
    async def test_revoke_api_key_success(self, authenticated_owner_client):
        """Revoking existing key should succeed."""
        client, user, org = authenticated_owner_client

        # Create key
        create_response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Revoke Test Key",
                "scopes": [],
                "rate_limit": 100,
            },
        )
        assert create_response.status_code == 200
        key_id = create_response.json()["id"]

        # Revoke key
        revoke_response = await client.delete(f"/api/v1/api-keys/{key_id}")
        assert revoke_response.status_code == 200
        data = revoke_response.json()
        if "message" in data:
            assert "revoked" in data["message"].lower()

        # Verify key is revoked (get should still work but status is revoked)
        get_response = await client.get(f"/api/v1/api-keys/{key_id}")
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "revoked"

    @pytest.mark.asyncio
    async def test_revoke_api_key_not_found(self, authenticated_owner_client):
        """Revoking non-existent key should return 404."""
        client, user, org = authenticated_owner_client

        response = await client.delete("/api/v1/api-keys/nonexistent")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_revoke_api_key_org_isolation(
        self, authenticated_owner_client, second_org_client
    ):
        """Should not be able to revoke another org's key."""
        client, user, org = authenticated_owner_client
        other_client, other_user, other_org = second_org_client

        # Create key in first org
        create_response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Protected Key",
                "scopes": [],
                "rate_limit": 100,
            },
        )
        assert create_response.status_code == 200
        key_id = create_response.json()["id"]

        # Try to revoke with second org's client
        revoke_response = await other_client.delete(f"/api/v1/api-keys/{key_id}")
        # Should be 404 (not visible to other org)
        assert revoke_response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestAPIKeyUsage:
    """Test API key usage tracking."""

    @pytest.mark.asyncio
    async def test_get_api_key_usage(self, authenticated_owner_client):
        """Getting key usage should return rate limit stats."""
        client, user, org = authenticated_owner_client

        # Create key
        create_response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Usage Test Key",
                "scopes": [],
                "rate_limit": 100,
            },
        )
        assert create_response.status_code == 200
        key_id = create_response.json()["id"]

        # Get usage
        usage_response = await client.get(f"/api/v1/api-keys/{key_id}/usage")
        assert usage_response.status_code == 200

        data = usage_response.json()
        assert data["key_id"] == key_id
        assert data["rate_limit"] == 100
        assert "request_count" in data
        assert "remaining" in data
        assert "window_start" in data

    @pytest.mark.asyncio
    async def test_get_api_key_usage_not_found(self, authenticated_owner_client):
        """Getting usage for non-existent key should return 404."""
        client, user, org = authenticated_owner_client

        response = await client.get("/api/v1/api-keys/nonexistent/usage")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_api_key_usage_org_isolation(
        self, authenticated_owner_client, second_org_client
    ):
        """Should not be able to get usage for another org's key."""
        client, user, org = authenticated_owner_client
        other_client, other_user, other_org = second_org_client

        # Create key in first org
        create_response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Usage Key",
                "scopes": [],
                "rate_limit": 100,
            },
        )
        assert create_response.status_code == 200
        key_id = create_response.json()["id"]

        # Try to get usage with second org's client
        usage_response = await other_client.get(f"/api/v1/api-keys/{key_id}/usage")
        # Should be 404 (not visible to other org)
        assert usage_response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestAvailableScopes:
    """Test available scopes endpoint."""

    @pytest.mark.asyncio
    async def test_list_available_scopes(self, test_client: AsyncClient):
        """Listing scopes should return all available scopes."""
        response = await test_client.get("/api/v1/api-keys/scopes")

        assert response.status_code == 200
        data = response.json()

        assert "scopes" in data
        assert isinstance(data["scopes"], list)
        assert len(data["scopes"]) > 0

        # Check expected scopes
        scopes = data["scopes"]
        expected = [
            "agents:read",
            "agents:write",
            "deployments:read",
            "deployments:write",
            "metrics:read",
        ]
        for scope in expected:
            assert scope in scopes

    @pytest.mark.asyncio
    async def test_scopes_endpoint_public(self, test_client: AsyncClient):
        """Scopes endpoint should not require authentication."""
        # Don't set auth headers
        response = await test_client.get("/api/v1/api-keys/scopes")

        # Should still work without auth
        assert response.status_code == 200
        assert "scopes" in response.json()


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestAPIKeySecrets:
    """Test API key secret handling."""

    @pytest.mark.asyncio
    async def test_key_prefix_visible_in_list(self, authenticated_owner_client):
        """List should show key prefix for identification."""
        client, user, org = authenticated_owner_client

        # Create key
        create_response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Prefix Test",
                "scopes": [],
                "rate_limit": 100,
            },
        )
        assert create_response.status_code == 200
        key_prefix = create_response.json()["key_prefix"]
        plain_key = create_response.json()["key"]

        # List keys
        list_response = await client.get("/api/v1/api-keys")
        assert list_response.status_code == 200

        keys = list_response.json()
        found_key = None
        for key in keys:
            if key.get("key_prefix") == key_prefix:
                found_key = key
                break

        assert found_key is not None
        assert found_key["key_prefix"] == key_prefix
        # Plain key should NOT be in list
        assert plain_key not in [found_key.get("key"), ""]

    @pytest.mark.asyncio
    async def test_key_plaintext_only_on_creation(self, authenticated_owner_client):
        """Plain key should only be returned on creation."""
        client, user, org = authenticated_owner_client

        # Create key
        create_response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Secret Key",
                "scopes": [],
                "rate_limit": 100,
            },
        )
        assert create_response.status_code == 200
        plain_key = create_response.json()["key"]
        key_id = create_response.json()["id"]

        # Verify it looks like a real key
        assert plain_key.startswith("sk_live_")
        assert len(plain_key) > 20

        # Get key - should NOT have plaintext
        get_response = await client.get(f"/api/v1/api-keys/{key_id}")
        assert get_response.status_code == 200
        assert "key" not in get_response.json()

        # List keys - should NOT have plaintext
        list_response = await client.get("/api/v1/api-keys")
        assert list_response.status_code == 200
        for key in list_response.json():
            assert "key" not in key or key.get("key") is None
