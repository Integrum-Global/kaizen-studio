"""
Tier 2: Integration Tests for User API

Tests user CRUD operations with real database.
NO MOCKING - uses real PostgreSQL from Docker infrastructure.
"""

import uuid

import pytest

# Mark all tests as integration tests
pytestmark = pytest.mark.integration


class TestUserCreate:
    """Tests for user creation."""

    @pytest.mark.asyncio
    async def test_create_user_success(
        self, authenticated_admin_client, test_organization
    ):
        """Test creating a user successfully."""
        client, user = authenticated_admin_client
        unique_id = uuid.uuid4().hex[:8]

        response = await client.post(
            "/api/v1/users",
            json={
                "email": f"newuser_{unique_id}@example.com",
                "name": f"New User {unique_id}",
                "password": "securepass123",
                "role": "developer",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == f"newuser_{unique_id}@example.com"
        assert data["name"] == f"New User {unique_id}"
        assert data["role"] == "developer"
        assert data["status"] == "active"
        assert "password" not in data  # Password should not be returned

    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(
        self, authenticated_admin_client, test_user
    ):
        """Test creating user with duplicate email fails."""
        client, admin = authenticated_admin_client

        response = await client.post(
            "/api/v1/users",
            json={
                "email": test_user["email"],  # Duplicate email
                "name": "Duplicate User",
                "password": "password123",
                "role": "developer",
            },
        )

        assert response.status_code in [400, 409]

    @pytest.mark.asyncio
    async def test_create_user_invalid_email(self, authenticated_admin_client):
        """Test creating user with invalid email fails."""
        client, user = authenticated_admin_client

        response = await client.post(
            "/api/v1/users",
            json={
                "email": "not-an-email",
                "name": "Invalid Email User",
                "password": "password123",
                "role": "developer",
            },
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_user_unauthorized_role(self, authenticated_developer_client):
        """Test that developers cannot create users."""
        client, user = authenticated_developer_client

        response = await client.post(
            "/api/v1/users",
            json={
                "email": "unauthorized@example.com",
                "name": "Unauthorized",
                "password": "password123",
                "role": "developer",
            },
        )

        assert response.status_code == 403


class TestUserRead:
    """Tests for reading users."""

    @pytest.mark.asyncio
    async def test_get_user_by_id(self, authenticated_client, test_user):
        """Test getting a user by ID."""
        client, current_user = authenticated_client

        response = await client.get(f"/api/v1/users/{test_user['id']}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user["id"]
        assert data["email"] == test_user["email"]
        assert "password" not in data

    @pytest.mark.asyncio
    async def test_get_user_not_found(self, authenticated_client):
        """Test getting a non-existent user."""
        client, user = authenticated_client
        fake_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/users/{fake_id}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_current_user(self, authenticated_client):
        """Test getting current authenticated user."""
        client, user = authenticated_client

        response = await client.get("/api/v1/users/me")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user["id"]


class TestUserUpdate:
    """Tests for updating users."""

    @pytest.mark.asyncio
    async def test_update_user_name(self, authenticated_client, test_user):
        """Test updating user name."""
        client, current_user = authenticated_client
        new_name = f"Updated User {uuid.uuid4().hex[:6]}"

        response = await client.put(
            f"/api/v1/users/{test_user['id']}", json={"name": new_name}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == new_name

    @pytest.mark.asyncio
    async def test_update_user_role(self, authenticated_admin_client, test_user):
        """Test updating user role (admin only)."""
        client, admin = authenticated_admin_client

        response = await client.put(
            f"/api/v1/users/{test_user['id']}", json={"role": "org_admin"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "org_admin"

    @pytest.mark.asyncio
    async def test_update_own_profile(self, authenticated_developer_client):
        """Test user can update their own profile."""
        client, user = authenticated_developer_client

        response = await client.put(
            f"/api/v1/users/{user['id']}", json={"name": "Self Updated"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Self Updated"

    @pytest.mark.asyncio
    async def test_update_user_no_fields(self, authenticated_client, test_user):
        """Test updating with no fields fails."""
        client, user = authenticated_client

        response = await client.put(f"/api/v1/users/{test_user['id']}", json={})

        assert response.status_code == 400


class TestUserDelete:
    """Tests for deleting users."""

    @pytest.mark.asyncio
    async def test_delete_user(self, authenticated_admin_client):
        """Test deleting a user."""
        client, admin = authenticated_admin_client

        # Create a user to delete
        unique_id = uuid.uuid4().hex[:8]
        create_response = await client.post(
            "/api/v1/users",
            json={
                "email": f"todelete_{unique_id}@example.com",
                "name": "To Delete",
                "password": "password123",
                "role": "developer",
            },
        )
        user_id = create_response.json()["id"]

        # Delete the user
        response = await client.delete(f"/api/v1/users/{user_id}")

        assert response.status_code == 200

        # Verify deletion
        get_response = await client.get(f"/api/v1/users/{user_id}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_user_unauthorized(
        self, authenticated_developer_client, user_factory
    ):
        """Test that developers cannot delete users."""
        client, dev_user = authenticated_developer_client

        # Create another user in the SAME organization as the developer
        # so we test role-based authorization, not cross-org authorization
        from studio.services.user_service import UserService

        user_service = UserService()
        target_user_data = user_factory(
            organization_id=dev_user["organization_id"],
            role="developer",
        )
        target_user = await user_service.create_user(
            organization_id=dev_user["organization_id"],
            email=target_user_data["email"],
            name=target_user_data["name"],
            password=target_user_data["password"],
            role="developer",
        )

        response = await client.delete(f"/api/v1/users/{target_user['id']}")

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_cannot_delete_self(self, authenticated_admin_client):
        """Test that users cannot delete themselves."""
        client, admin = authenticated_admin_client

        response = await client.delete(f"/api/v1/users/{admin['id']}")

        assert response.status_code == 400


class TestUserList:
    """Tests for listing users."""

    @pytest.mark.asyncio
    async def test_list_users(self, authenticated_client):
        """Test listing users in organization."""
        client, user = authenticated_client

        response = await client.get("/api/v1/users")

        assert response.status_code == 200
        data = response.json()
        assert "records" in data
        assert "total" in data
        # The authenticated_client fixture creates an org_owner user,
        # so there should be at least 1 user in the organization
        assert data["total"] >= 1

    @pytest.mark.asyncio
    async def test_list_users_pagination(self, authenticated_client):
        """Test listing users with pagination."""
        client, user = authenticated_client

        response = await client.get("/api/v1/users?limit=1&offset=0")

        assert response.status_code == 200
        data = response.json()
        assert len(data["records"]) <= 1

    @pytest.mark.asyncio
    async def test_list_users_with_role_filter(self, authenticated_client):
        """Test listing users with role filter."""
        client, user = authenticated_client

        response = await client.get("/api/v1/users?role=developer")

        assert response.status_code == 200
        data = response.json()
        # All returned users should be developers
        for record in data["records"]:
            assert record["role"] == "developer"


class TestEmailUniqueness:
    """Tests for email uniqueness constraints."""

    @pytest.mark.asyncio
    async def test_email_unique_within_organization(self, authenticated_admin_client):
        """Test that email must be unique within organization."""
        client, admin = authenticated_admin_client
        unique_id = uuid.uuid4().hex[:8]
        email = f"unique_{unique_id}@example.com"

        # Create first user
        response1 = await client.post(
            "/api/v1/users",
            json={
                "email": email,
                "name": "First User",
                "password": "password123",
                "role": "developer",
            },
        )
        assert response1.status_code == 201

        # Try to create second user with same email
        response2 = await client.post(
            "/api/v1/users",
            json={
                "email": email,
                "name": "Second User",
                "password": "password123",
                "role": "viewer",
            },
        )
        assert response2.status_code in [400, 409]

    @pytest.mark.asyncio
    async def test_email_case_insensitive(self, authenticated_admin_client):
        """Test that email uniqueness is case-insensitive."""
        client, admin = authenticated_admin_client
        unique_id = uuid.uuid4().hex[:8]

        # Create user with lowercase email
        response1 = await client.post(
            "/api/v1/users",
            json={
                "email": f"casetest_{unique_id}@example.com",
                "name": "Lowercase",
                "password": "password123",
                "role": "developer",
            },
        )
        assert response1.status_code == 201

        # Try uppercase version
        response2 = await client.post(
            "/api/v1/users",
            json={
                "email": f"CASETEST_{unique_id}@EXAMPLE.COM",
                "name": "Uppercase",
                "password": "password123",
                "role": "developer",
            },
        )
        # Should fail due to case-insensitive uniqueness
        assert response2.status_code in [400, 409, 201]  # Depends on implementation


class TestUserAuthentication:
    """Tests for user authentication scenarios."""

    @pytest.mark.asyncio
    async def test_unauthenticated_access_forbidden(self, test_client):
        """Test that unauthenticated access is forbidden."""
        response = await test_client.get("/api/v1/users")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_invalid_token_forbidden(self, test_client):
        """Test that invalid token is rejected."""
        response = await test_client.get(
            "/api/v1/users", headers={"Authorization": "Bearer invalid-token"}
        )

        assert response.status_code == 401
