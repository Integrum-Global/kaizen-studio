"""
Tier 1: Model Unit Tests

Tests model field validation and data structure.
Mocking is allowed in Tier 1.
"""

import uuid
from datetime import datetime

import pytest


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestOrganizationModel:
    """Test Organization model field validation."""

    def test_organization_required_fields(self, organization_factory):
        """Organization should have all required fields."""
        org = organization_factory()

        required_fields = [
            "id",
            "name",
            "slug",
            "status",
            "plan_tier",
            "created_by",
            "created_at",
            "updated_at",
        ]

        for field in required_fields:
            assert field in org, f"Missing required field: {field}"

    def test_organization_id_is_valid_uuid(self, organization_factory):
        """Organization ID should be valid UUID string."""
        org = organization_factory()

        # Should not raise ValueError
        parsed = uuid.UUID(org["id"])
        assert str(parsed) == org["id"]

    def test_organization_status_values(self, organization_factory):
        """Organization status should be valid."""
        valid_statuses = ["active", "suspended", "deleted"]

        for status in valid_statuses:
            org = organization_factory(status=status)
            assert org["status"] == status

    def test_organization_plan_tiers(self, organization_factory):
        """Organization plan tier should be valid."""
        valid_tiers = ["free", "pro", "enterprise"]

        for tier in valid_tiers:
            org = organization_factory(plan_tier=tier)
            assert org["plan_tier"] == tier

    def test_organization_slug_format(self, organization_factory):
        """Organization slug should be lowercase with hyphens."""
        org = organization_factory(name="Test Organization Name")

        # Slug should be lowercase
        assert org["slug"] == org["slug"].lower()
        # No spaces
        assert " " not in org["slug"]

    def test_organization_timestamps_iso8601(self, organization_factory):
        """Organization timestamps should be ISO 8601 format."""
        org = organization_factory()

        # Should parse without error
        created = datetime.fromisoformat(org["created_at"].replace("Z", "+00:00"))
        updated = datetime.fromisoformat(org["updated_at"].replace("Z", "+00:00"))

        assert created is not None
        assert updated is not None


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestUserModel:
    """Test User model field validation."""

    def test_user_required_fields(self, user_factory):
        """User should have all required fields."""
        user = user_factory()

        required_fields = [
            "id",
            "organization_id",
            "email",
            "name",
            "password",
            "status",
            "role",
            "mfa_enabled",
            "created_at",
            "updated_at",
        ]

        for field in required_fields:
            assert field in user, f"Missing required field: {field}"

    def test_user_id_is_valid_uuid(self, user_factory):
        """User ID should be valid UUID string."""
        user = user_factory()

        parsed = uuid.UUID(user["id"])
        assert str(parsed) == user["id"]

    def test_user_organization_id_is_valid_uuid(self, user_factory):
        """User organization_id should be valid UUID string."""
        user = user_factory()

        parsed = uuid.UUID(user["organization_id"])
        assert str(parsed) == user["organization_id"]

    def test_user_email_format(self, user_factory):
        """User email should be valid email format."""
        user = user_factory(email="test@example.com")

        assert "@" in user["email"]
        assert "." in user["email"].split("@")[1]

    def test_user_status_values(self, user_factory):
        """User status should be valid."""
        valid_statuses = ["active", "invited", "suspended"]

        for status in valid_statuses:
            user = user_factory(status=status)
            assert user["status"] == status

    def test_user_role_values(self, user_factory):
        """User role should be valid."""
        valid_roles = ["org_owner", "org_admin", "developer", "viewer"]

        for role in valid_roles:
            user = user_factory(role=role)
            assert user["role"] == role

    def test_user_mfa_enabled_boolean(self, user_factory):
        """User mfa_enabled should be boolean."""
        user = user_factory()

        assert isinstance(user["mfa_enabled"], bool)

    def test_user_timestamps_iso8601(self, user_factory):
        """User timestamps should be ISO 8601 format."""
        user = user_factory()

        created = datetime.fromisoformat(user["created_at"].replace("Z", "+00:00"))
        updated = datetime.fromisoformat(user["updated_at"].replace("Z", "+00:00"))

        assert created is not None
        assert updated is not None


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestWorkspaceModel:
    """Test Workspace model field validation."""

    def test_workspace_required_fields(self, workspace_factory):
        """Workspace should have all required fields."""
        workspace = workspace_factory()

        required_fields = [
            "id",
            "organization_id",
            "name",
            "environment_type",
            "description",
            "created_at",
            "updated_at",
        ]

        for field in required_fields:
            assert field in workspace, f"Missing required field: {field}"

    def test_workspace_id_is_valid_uuid(self, workspace_factory):
        """Workspace ID should be valid UUID string."""
        workspace = workspace_factory()

        parsed = uuid.UUID(workspace["id"])
        assert str(parsed) == workspace["id"]

    def test_workspace_organization_id_is_valid_uuid(self, workspace_factory):
        """Workspace organization_id should be valid UUID string."""
        workspace = workspace_factory()

        parsed = uuid.UUID(workspace["organization_id"])
        assert str(parsed) == workspace["organization_id"]

    def test_workspace_environment_types(self, workspace_factory):
        """Workspace environment_type should be valid."""
        valid_types = ["development", "staging", "production"]

        for env_type in valid_types:
            workspace = workspace_factory(environment_type=env_type)
            assert workspace["environment_type"] == env_type

    def test_workspace_name_not_empty(self, workspace_factory):
        """Workspace name should not be empty."""
        workspace = workspace_factory(name="My Workspace")

        assert len(workspace["name"]) > 0

    def test_workspace_timestamps_iso8601(self, workspace_factory):
        """Workspace timestamps should be ISO 8601 format."""
        workspace = workspace_factory()

        created = datetime.fromisoformat(workspace["created_at"].replace("Z", "+00:00"))
        updated = datetime.fromisoformat(workspace["updated_at"].replace("Z", "+00:00"))

        assert created is not None
        assert updated is not None


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestFactoryFunctions:
    """Test that factory functions produce valid data."""

    def test_user_factory_generates_unique_emails(self, user_factory):
        """Each user factory call should generate unique email."""
        users = [user_factory() for _ in range(5)]
        emails = [u["email"] for u in users]

        assert len(emails) == len(set(emails)), "Emails should be unique"

    def test_user_factory_generates_unique_ids(self, user_factory):
        """Each user factory call should generate unique ID."""
        users = [user_factory() for _ in range(5)]
        ids = [u["id"] for u in users]

        assert len(ids) == len(set(ids)), "IDs should be unique"

    def test_organization_factory_generates_unique_names(self, organization_factory):
        """Each org factory call should generate unique name."""
        orgs = [organization_factory() for _ in range(5)]
        names = [o["name"] for o in orgs]

        assert len(names) == len(set(names)), "Names should be unique"

    def test_workspace_factory_defaults(self, workspace_factory):
        """Workspace factory should have sensible defaults."""
        workspace = workspace_factory()

        assert workspace["name"] == "Test Workspace"
        assert workspace["environment_type"] == "development"
        assert len(workspace["description"]) > 0

    def test_user_factory_custom_values(self, user_factory):
        """User factory should accept custom values."""
        custom_id = str(uuid.uuid4())
        custom_email = "custom@example.com"

        user = user_factory(id=custom_id, email=custom_email)

        assert user["id"] == custom_id
        assert user["email"] == custom_email
