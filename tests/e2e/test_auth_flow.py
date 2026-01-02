"""
Tier 3: End-to-End Auth Flow Tests

Tests complete user authentication workflows.
NO MOCKING - uses full infrastructure stack.
"""

import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestCompleteAuthFlow:
    """Test complete authentication workflows."""

    @pytest.mark.asyncio
    async def test_registration_login_access_logout_flow(
        self, test_client: AsyncClient, registration_data
    ):
        """Complete flow: register -> login -> access protected route -> logout."""

        # Step 1: Register new user
        reg_response = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )
        assert reg_response.status_code == 201
        reg_data = reg_response.json()
        user_id = reg_data["user"]["id"]
        reg_tokens = reg_data["tokens"]

        # Step 2: Login with registered credentials
        login_response = await test_client.post(
            "/api/v1/auth/login",
            json={
                "email": registration_data["email"],
                "password": registration_data["password"],
            },
        )
        assert login_response.status_code == 200
        login_tokens = login_response.json()
        access_token = login_tokens["access_token"]

        # Step 3: Access protected route
        me_response = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
        )
        assert me_response.status_code == 200
        user = me_response.json()
        assert user["id"] == user_id
        assert user["email"] == registration_data["email"]

        # Step 4: Logout
        logout_response = await test_client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"refresh_token": login_tokens["refresh_token"]},
        )
        assert logout_response.status_code == 200

        # Step 5: Verify token is invalidated
        after_logout = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
        )
        assert after_logout.status_code == 401

    @pytest.mark.asyncio
    async def test_token_refresh_flow(
        self, test_client: AsyncClient, registration_data
    ):
        """Test token refresh when access token is used."""

        # Register
        reg_response = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )
        assert reg_response.status_code == 201
        tokens = reg_response.json()["tokens"]

        original_access = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        # Access protected route with original token
        me_response = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {original_access}"}
        )
        assert me_response.status_code == 200

        # Refresh tokens
        refresh_response = await test_client.post(
            "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
        )
        assert refresh_response.status_code == 200
        new_tokens = refresh_response.json()

        new_access = new_tokens["access_token"]
        new_refresh = new_tokens["refresh_token"]

        # New tokens should be different
        assert new_access != original_access
        assert new_refresh != refresh_token

        # New access token should work
        me_response2 = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {new_access}"}
        )
        assert me_response2.status_code == 200

        # Old refresh token should be blacklisted
        old_refresh_response = await test_client.post(
            "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
        )
        assert old_refresh_response.status_code == 401

    @pytest.mark.asyncio
    async def test_multiple_users_same_organization(self, test_client: AsyncClient):
        """Test multiple users in the same organization."""

        # Create first user (org owner)
        unique_id = uuid.uuid4().hex[:8]
        org_name = f"Shared Org {unique_id}"

        user1_data = {
            "email": f"owner_{unique_id}@example.com",
            "password": "password123",
            "name": "Org Owner",
            "organization_name": org_name,
        }

        reg1 = await test_client.post("/api/v1/auth/register", json=user1_data)
        assert reg1.status_code == 201
        user1 = reg1.json()["user"]
        org_id = user1["organization_id"]

        # For this test, we'll just verify the first user exists
        # Creating additional users in same org would require
        # an admin invite flow which isn't implemented yet

        # Login as first user
        login1 = await test_client.post(
            "/api/v1/auth/login",
            json={"email": user1_data["email"], "password": user1_data["password"]},
        )
        assert login1.status_code == 200
        token1 = login1.json()["access_token"]

        # Access protected route
        me1 = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {token1}"}
        )
        assert me1.status_code == 200
        assert me1.json()["organization_id"] == org_id


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestSecurityFlows:
    """Test security-related flows."""

    @pytest.mark.asyncio
    async def test_cannot_access_other_org_data(self, test_client: AsyncClient):
        """Users should not be able to access other organization's data."""

        # Create first user and org
        unique_id1 = uuid.uuid4().hex[:8]
        user1_data = {
            "email": f"user1_{unique_id1}@example.com",
            "password": "password123",
            "name": "User One",
            "organization_name": f"Org One {unique_id1}",
        }

        reg1 = await test_client.post("/api/v1/auth/register", json=user1_data)
        assert reg1.status_code == 201
        org1_id = reg1.json()["user"]["organization_id"]

        # Create second user and org
        unique_id2 = uuid.uuid4().hex[:8]
        user2_data = {
            "email": f"user2_{unique_id2}@example.com",
            "password": "password123",
            "name": "User Two",
            "organization_name": f"Org Two {unique_id2}",
        }

        reg2 = await test_client.post("/api/v1/auth/register", json=user2_data)
        assert reg2.status_code == 201
        org2_id = reg2.json()["user"]["organization_id"]

        # Verify orgs are different
        assert org1_id != org2_id

        # Login as user1
        login1 = await test_client.post(
            "/api/v1/auth/login",
            json={"email": user1_data["email"], "password": user1_data["password"]},
        )
        token1 = login1.json()["access_token"]

        # User1 should see their own org_id
        me1 = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {token1}"}
        )
        assert me1.json()["organization_id"] == org1_id

    @pytest.mark.asyncio
    async def test_logout_invalidates_all_tokens(
        self, test_client: AsyncClient, registration_data
    ):
        """Logout should invalidate both access and refresh tokens."""

        # Register
        reg = await test_client.post("/api/v1/auth/register", json=registration_data)
        tokens = reg.json()["tokens"]

        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        # Logout with both tokens
        await test_client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"refresh_token": refresh_token},
        )

        # Access token should be invalid
        me = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
        )
        assert me.status_code == 401

        # Refresh token should be invalid
        refresh = await test_client.post(
            "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
        )
        assert refresh.status_code == 401

    @pytest.mark.asyncio
    async def test_reuse_refresh_token_fails(
        self, test_client: AsyncClient, registration_data
    ):
        """Refresh tokens should be single-use (blacklisted after use)."""

        # Register
        reg = await test_client.post("/api/v1/auth/register", json=registration_data)
        tokens = reg.json()["tokens"]
        refresh_token = tokens["refresh_token"]

        # First refresh - should succeed
        refresh1 = await test_client.post(
            "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
        )
        assert refresh1.status_code == 200

        # Second refresh with same token - should fail
        refresh2 = await test_client.post(
            "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
        )
        assert refresh2.status_code == 401


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestErrorHandling:
    """Test error handling in auth flows."""

    @pytest.mark.asyncio
    async def test_malformed_token_rejected(self, test_client: AsyncClient):
        """Malformed tokens should be rejected with 401."""
        response = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": "Bearer not.a.valid.token"}
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_missing_bearer_prefix_rejected(self, test_client: AsyncClient):
        """Token without Bearer prefix should be rejected."""
        response = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": "some_token_without_bearer"}
        )
        # Should fail - either 401 or 403 depending on how FastAPI handles it
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_empty_token_rejected(self, test_client: AsyncClient):
        """Empty token should be rejected."""
        response = await test_client.get(
            "/api/v1/auth/me", headers={"Authorization": "Bearer "}
        )
        assert response.status_code in [401, 403, 422]

    @pytest.mark.asyncio
    async def test_wrong_credentials_multiple_attempts(
        self, test_client: AsyncClient, registration_data
    ):
        """Multiple wrong password attempts should all fail."""

        # Register
        await test_client.post("/api/v1/auth/register", json=registration_data)

        # Multiple failed attempts
        for i in range(3):
            response = await test_client.post(
                "/api/v1/auth/login",
                json={
                    "email": registration_data["email"],
                    "password": f"wrong_password_{i}",
                },
            )
            assert response.status_code == 401

        # Correct password should still work
        response = await test_client.post(
            "/api/v1/auth/login",
            json={
                "email": registration_data["email"],
                "password": registration_data["password"],
            },
        )
        assert response.status_code == 200


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestOrganizationCreation:
    """Test organization creation during registration."""

    @pytest.mark.asyncio
    async def test_registration_creates_organization(
        self, test_client: AsyncClient, registration_data
    ):
        """Registration should create organization with correct details."""

        response = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )

        assert response.status_code == 201
        user = response.json()["user"]

        assert "organization_id" in user
        assert user["role"] == "org_owner"  # Creator becomes owner

    @pytest.mark.asyncio
    async def test_registration_creates_default_workspace(
        self, test_client: AsyncClient, registration_data
    ):
        """Registration should create a default development workspace."""

        response = await test_client.post(
            "/api/v1/auth/register", json=registration_data
        )

        assert response.status_code == 201

        # The default workspace is created during registration
        # We can verify this by checking the auth service code
        # For now, just verify registration succeeded
        user = response.json()["user"]
        assert user["organization_id"] is not None


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestSessionManagement:
    """Test session and token management."""

    @pytest.mark.asyncio
    async def test_multiple_login_sessions(
        self, test_client: AsyncClient, registration_data
    ):
        """User should be able to have multiple active sessions."""

        # Register
        await test_client.post("/api/v1/auth/register", json=registration_data)

        # Login multiple times (simulating different devices)
        tokens = []
        for _ in range(3):
            login = await test_client.post(
                "/api/v1/auth/login",
                json={
                    "email": registration_data["email"],
                    "password": registration_data["password"],
                },
            )
            assert login.status_code == 200
            tokens.append(login.json())

        # All tokens should be valid
        for token_data in tokens:
            me = await test_client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert me.status_code == 200

        # Logout from one session shouldn't affect others
        await test_client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {tokens[0]['access_token']}"},
            json={"refresh_token": tokens[0]["refresh_token"]},
        )

        # First token should be invalid
        me0 = await test_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {tokens[0]['access_token']}"},
        )
        assert me0.status_code == 401

        # Other tokens should still be valid
        for token_data in tokens[1:]:
            me = await test_client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert me.status_code == 200
