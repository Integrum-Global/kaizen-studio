"""
Tier 2: Auth API Integration Tests

Tests API endpoints with real database and Redis.
NO MOCKING - uses actual infrastructure.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestRegisterEndpoint:
    """Test POST /api/v1/auth/register endpoint."""

    @pytest.mark.asyncio
    async def test_register_creates_user_in_database(
        self, test_client: AsyncClient, registration_data
    ):
        """Registration should create user in database."""
        response = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )

        assert response.status_code == 201
        data = response.json()

        # Verify response structure
        assert "user" in data
        assert "tokens" in data

        # Verify user data
        user = data["user"]
        assert user["email"] == registration_data["email"]
        assert user["name"] == registration_data["name"]
        assert user["role"] == "org_owner"
        assert "id" in user
        assert "organization_id" in user

    @pytest.mark.asyncio
    async def test_register_returns_valid_tokens(
        self, test_client: AsyncClient, registration_data
    ):
        """Registration should return valid tokens."""
        response = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )

        assert response.status_code == 201
        tokens = response.json()["tokens"]

        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["token_type"] == "bearer"
        assert "expires_in" in tokens
        assert isinstance(tokens["expires_in"], int)

    @pytest.mark.asyncio
    async def test_register_duplicate_email_fails(
        self, test_client: AsyncClient, registration_data
    ):
        """Registration with duplicate email should fail."""
        # First registration
        response1 = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )
        assert response1.status_code == 201

        # Duplicate registration
        response2 = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )
        assert response2.status_code == 409

    @pytest.mark.asyncio
    async def test_register_invalid_email_fails(self, test_client: AsyncClient):
        """Registration with invalid email should fail."""
        response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "password123",
                "name": "Test User",
                "organization_name": "Test Org",
            },
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_short_password_fails(self, test_client: AsyncClient):
        """Registration with password < 8 chars should fail."""
        response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "short",
                "name": "Test User",
                "organization_name": "Test Org",
            },
        )

        assert response.status_code == 422


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestLoginEndpoint:
    """Test POST /api/v1/auth/login endpoint."""

    @pytest.mark.asyncio
    async def test_login_returns_valid_tokens(
        self, test_client: AsyncClient, registration_data
    ):
        """Login should return valid tokens."""
        # Register first
        await test_client.post("/api/v1/auth/register", json=registration_data)

        # Login
        response = await test_client.post(
            "/api/v1/auth/login",
            json={
                "email": registration_data["email"],
                "password": registration_data["password"],
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password_fails(
        self, test_client: AsyncClient, registration_data
    ):
        """Login with wrong password should fail."""
        # Register first
        await test_client.post("/api/v1/auth/register", json=registration_data)

        # Login with wrong password
        response = await test_client.post(
            "/api/v1/auth/login",
            json={"email": registration_data["email"], "password": "wrongpassword"},
        )

        assert response.status_code == 401
        data = response.json()
        # API can return either {"detail": "..."} or {"error": {"message": "..."}}
        if "detail" in data:
            assert "Invalid email or password" in data["detail"]
        else:
            assert "Invalid email or password" in data["error"]["message"]

    @pytest.mark.asyncio
    async def test_login_nonexistent_user_fails(self, test_client: AsyncClient):
        """Login with nonexistent user should fail."""
        response = await test_client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@example.com", "password": "password123"},
        )

        assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestRefreshEndpoint:
    """Test POST /api/v1/auth/refresh endpoint."""

    @pytest.mark.asyncio
    async def test_refresh_returns_new_tokens(
        self, test_client: AsyncClient, registration_data
    ):
        """Refresh should return new access token."""
        # Register and get tokens
        reg_response = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )
        tokens = reg_response.json()["tokens"]

        # Refresh
        response = await test_client.post(
            "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
        )

        assert response.status_code == 200
        new_tokens = response.json()

        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
        # New tokens should be different
        assert new_tokens["access_token"] != tokens["access_token"]

    @pytest.mark.asyncio
    async def test_refresh_invalid_token_fails(self, test_client: AsyncClient):
        """Refresh with invalid token should fail."""
        response = await test_client.post(
            "/api/v1/auth/refresh", json={"refresh_token": "invalid.token.here"}
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_access_token_fails(
        self, test_client: AsyncClient, registration_data
    ):
        """Refresh with access token (not refresh) should fail."""
        # Register and get tokens
        reg_response = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )
        tokens = reg_response.json()["tokens"]

        # Try to refresh with access token
        response = await test_client.post(
            "/api/v1/auth/refresh", json={"refresh_token": tokens["access_token"]}
        )

        assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestMeEndpoint:
    """Test GET /api/v1/auth/me endpoint."""

    @pytest.mark.asyncio
    async def test_me_returns_current_user(
        self, test_client: AsyncClient, registration_data
    ):
        """Me endpoint should return current user data."""
        # Register and get token
        reg_response = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )
        access_token = reg_response.json()["tokens"]["access_token"]

        # Get current user
        response = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        user = response.json()

        assert user["email"] == registration_data["email"]
        assert user["name"] == registration_data["name"]
        assert "id" in user
        assert "organization_id" in user
        assert user["role"] == "org_owner"

    @pytest.mark.asyncio
    async def test_me_without_token_fails(self, test_client: AsyncClient):
        """Me endpoint without token should fail."""
        response = await test_client.get("/api/v1/auth/me")

        # FastAPI's HTTPBearer returns 403 when no Authorization header, 401 when invalid token
        # Both are acceptable for "not authenticated"
        assert response.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_me_invalid_token_fails(self, test_client: AsyncClient):
        """Me endpoint with invalid token should fail."""
        response = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": "Bearer invalid.token.here"}
        )

        assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestLogoutEndpoint:
    """Test POST /api/v1/auth/logout endpoint."""

    @pytest.mark.asyncio
    async def test_logout_invalidates_token(
        self, test_client: AsyncClient, registration_data
    ):
        """Logout should invalidate access token."""
        # Register and get token
        reg_response = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )
        tokens = reg_response.json()["tokens"]
        access_token = tokens["access_token"]

        # Logout
        response = await test_client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"refresh_token": tokens["refresh_token"]},
        )

        assert response.status_code == 200
        assert "Successfully logged out" in response.json()["message"]

        # Token should now be invalid
        me_response = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert me_response.status_code == 401

    @pytest.mark.asyncio
    async def test_logout_without_refresh_token(
        self, test_client: AsyncClient, registration_data
    ):
        """Logout should work without refresh token."""
        # Register and get token
        reg_response = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )
        access_token = reg_response.json()["tokens"]["access_token"]

        # Logout without refresh token
        response = await test_client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"},
            json={},
        )

        assert response.status_code == 200
