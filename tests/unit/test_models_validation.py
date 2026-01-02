"""
Tier 1: Unit Tests for Model Validation

Tests Pydantic model validation for Team, TeamMembership, and Invitation models.
"""

from datetime import UTC, datetime

import pytest
from pydantic import ValidationError
from studio.api.invitations import CreateInvitationRequest, InvitationResponse
from studio.api.organizations import (
    CreateOrganizationRequest,
    OrganizationResponse,
    UpdateOrganizationRequest,
)
from studio.api.teams import (
    AddMemberRequest,
    CreateTeamRequest,
    TeamMemberResponse,
    TeamResponse,
    TeamWithMembersResponse,
    UpdateTeamRequest,
)

# Mark all tests in this file as unit tests
pytestmark = pytest.mark.unit


class TestTeamModelValidation:
    """Tests for Team-related model validation."""

    def test_create_team_request_valid(self):
        """Test valid CreateTeamRequest."""
        request = CreateTeamRequest(
            name="Engineering Team", description="The engineering team"
        )
        assert request.name == "Engineering Team"
        assert request.description == "The engineering team"

    def test_create_team_request_minimal(self):
        """Test CreateTeamRequest with only required fields."""
        request = CreateTeamRequest(name="Team A")
        assert request.name == "Team A"
        assert request.description is None

    def test_create_team_request_empty_name_fails(self):
        """Test CreateTeamRequest fails with empty name."""
        with pytest.raises(ValidationError) as exc_info:
            CreateTeamRequest(name="")
        assert (
            "min_length" in str(exc_info.value).lower()
            or "at least 1" in str(exc_info.value).lower()
        )

    def test_create_team_request_name_too_long(self):
        """Test CreateTeamRequest fails with name too long."""
        with pytest.raises(ValidationError):
            CreateTeamRequest(name="x" * 101)

    def test_create_team_request_description_too_long(self):
        """Test CreateTeamRequest fails with description too long."""
        with pytest.raises(ValidationError):
            CreateTeamRequest(name="Team", description="x" * 501)

    def test_update_team_request_valid(self):
        """Test valid UpdateTeamRequest."""
        request = UpdateTeamRequest(
            name="Updated Team", description="Updated description"
        )
        assert request.name == "Updated Team"
        assert request.description == "Updated description"

    def test_update_team_request_partial(self):
        """Test UpdateTeamRequest with partial update."""
        request = UpdateTeamRequest(name="Just Name")
        assert request.name == "Just Name"
        assert request.description is None

    def test_update_team_request_empty_allowed(self):
        """Test UpdateTeamRequest allows no fields."""
        request = UpdateTeamRequest()
        assert request.name is None
        assert request.description is None

    def test_team_response_valid(self):
        """Test valid TeamResponse."""
        now = datetime.now(UTC).isoformat()
        response = TeamResponse(
            id="team-123",
            organization_id="org-123",
            name="Test Team",
            description="A test team",
            created_at=now,
            updated_at=now,
        )
        assert response.id == "team-123"
        assert response.name == "Test Team"

    def test_team_response_without_description(self):
        """Test TeamResponse without optional description."""
        now = datetime.now(UTC).isoformat()
        response = TeamResponse(
            id="team-123",
            organization_id="org-123",
            name="Test Team",
            created_at=now,
            updated_at=now,
        )
        assert response.description is None


class TestTeamMembershipModelValidation:
    """Tests for TeamMembership-related model validation."""

    def test_add_member_request_valid_member(self):
        """Test valid AddMemberRequest with member role."""
        request = AddMemberRequest(user_id="user-123", role="member")
        assert request.user_id == "user-123"
        assert request.role == "member"

    def test_add_member_request_valid_team_lead(self):
        """Test valid AddMemberRequest with team_lead role."""
        request = AddMemberRequest(user_id="user-123", role="team_lead")
        assert request.role == "team_lead"

    def test_add_member_request_default_role(self):
        """Test AddMemberRequest uses default role."""
        request = AddMemberRequest(user_id="user-123")
        assert request.role == "member"

    def test_add_member_request_invalid_role(self):
        """Test AddMemberRequest fails with invalid role."""
        with pytest.raises(ValidationError):
            AddMemberRequest(user_id="user-123", role="admin")

    def test_team_member_response_valid(self):
        """Test valid TeamMemberResponse."""
        now = datetime.now(UTC).isoformat()
        response = TeamMemberResponse(
            id="membership-123",
            team_id="team-123",
            user_id="user-123",
            role="member",
            created_at=now,
        )
        assert response.id == "membership-123"
        assert response.role == "member"

    def test_team_with_members_response_valid(self):
        """Test valid TeamWithMembersResponse."""
        now = datetime.now(UTC).isoformat()
        response = TeamWithMembersResponse(
            id="team-123",
            organization_id="org-123",
            name="Test Team",
            created_at=now,
            updated_at=now,
            members=[
                TeamMemberResponse(
                    id="m-1",
                    team_id="team-123",
                    user_id="user-1",
                    role="team_lead",
                    created_at=now,
                ),
                TeamMemberResponse(
                    id="m-2",
                    team_id="team-123",
                    user_id="user-2",
                    role="member",
                    created_at=now,
                ),
            ],
        )
        assert len(response.members) == 2
        assert response.members[0].role == "team_lead"

    def test_team_with_members_response_empty_members(self):
        """Test TeamWithMembersResponse with no members."""
        now = datetime.now(UTC).isoformat()
        response = TeamWithMembersResponse(
            id="team-123",
            organization_id="org-123",
            name="Empty Team",
            created_at=now,
            updated_at=now,
            members=[],
        )
        assert len(response.members) == 0


class TestInvitationModelValidation:
    """Tests for Invitation-related model validation."""

    def test_create_invitation_request_valid(self):
        """Test valid CreateInvitationRequest."""
        request = CreateInvitationRequest(email="invite@example.com", role="developer")
        assert request.email == "invite@example.com"
        assert request.role == "developer"

    def test_create_invitation_request_org_admin_role(self):
        """Test CreateInvitationRequest with org_admin role."""
        request = CreateInvitationRequest(email="admin@example.com", role="org_admin")
        assert request.role == "org_admin"

    def test_create_invitation_request_viewer_role(self):
        """Test CreateInvitationRequest with viewer role."""
        request = CreateInvitationRequest(email="viewer@example.com", role="viewer")
        assert request.role == "viewer"

    def test_create_invitation_request_invalid_role(self):
        """Test CreateInvitationRequest fails with invalid role."""
        with pytest.raises(ValidationError):
            CreateInvitationRequest(email="test@example.com", role="superadmin")

    def test_create_invitation_request_invalid_email(self):
        """Test CreateInvitationRequest fails with invalid email."""
        with pytest.raises(ValidationError):
            CreateInvitationRequest(email="not-an-email", role="developer")

    def test_invitation_response_valid(self):
        """Test valid InvitationResponse."""
        now = datetime.now(UTC).isoformat()
        response = InvitationResponse(
            id="inv-123",
            organization_id="org-123",
            email="invite@example.com",
            role="developer",
            status="pending",
            invited_by="user-123",
            expires_at=now,
            created_at=now,
        )
        assert response.id == "inv-123"
        assert response.status == "pending"


class TestOrganizationModelValidation:
    """Tests for Organization-related model validation."""

    def test_create_organization_request_valid(self):
        """Test valid CreateOrganizationRequest."""
        request = CreateOrganizationRequest(
            name="My Organization", slug="my-organization", plan_tier="pro"
        )
        assert request.name == "My Organization"
        assert request.slug == "my-organization"
        assert request.plan_tier == "pro"

    def test_create_organization_request_default_plan(self):
        """Test CreateOrganizationRequest uses default plan."""
        request = CreateOrganizationRequest(name="Free Org", slug="free-org")
        assert request.plan_tier == "free"

    def test_create_organization_request_invalid_slug(self):
        """Test CreateOrganizationRequest fails with invalid slug."""
        with pytest.raises(ValidationError):
            CreateOrganizationRequest(
                name="Test Org", slug="Invalid Slug!"  # Contains invalid characters
            )

    def test_create_organization_request_invalid_plan(self):
        """Test CreateOrganizationRequest fails with invalid plan."""
        with pytest.raises(ValidationError):
            CreateOrganizationRequest(
                name="Test Org",
                slug="test-org",
                plan_tier="premium",  # Not a valid plan tier
            )

    def test_update_organization_request_valid(self):
        """Test valid UpdateOrganizationRequest."""
        request = UpdateOrganizationRequest(name="Updated Org", status="suspended")
        assert request.name == "Updated Org"
        assert request.status == "suspended"

    def test_update_organization_request_invalid_status(self):
        """Test UpdateOrganizationRequest fails with invalid status."""
        with pytest.raises(ValidationError):
            UpdateOrganizationRequest(status="deleted")  # Not allowed via update

    def test_organization_response_valid(self):
        """Test valid OrganizationResponse."""
        now = datetime.now(UTC).isoformat()
        response = OrganizationResponse(
            id="org-123",
            name="Test Org",
            slug="test-org",
            status="active",
            plan_tier="enterprise",
            created_by="user-123",
            created_at=now,
            updated_at=now,
        )
        assert response.id == "org-123"
        assert response.plan_tier == "enterprise"


class TestFieldConstraints:
    """Tests for specific field constraints across models."""

    def test_name_min_length_constraint(self):
        """Test name fields require minimum length."""
        with pytest.raises(ValidationError):
            CreateTeamRequest(name="")

        with pytest.raises(ValidationError):
            CreateOrganizationRequest(name="", slug="valid-slug")

    def test_name_max_length_constraint(self):
        """Test name fields have maximum length."""
        long_name = "x" * 101

        with pytest.raises(ValidationError):
            CreateTeamRequest(name=long_name)

        with pytest.raises(ValidationError):
            CreateOrganizationRequest(name=long_name, slug="valid-slug")

    def test_slug_pattern_constraint(self):
        """Test slug fields follow pattern."""
        # Valid slugs
        valid_slugs = ["my-org", "test123", "a-b-c", "org1"]
        for slug in valid_slugs:
            request = CreateOrganizationRequest(name="Test", slug=slug)
            assert request.slug == slug

        # Invalid slugs
        invalid_slugs = ["My Org", "test_org", "ORG", "org@123"]
        for slug in invalid_slugs:
            with pytest.raises(ValidationError):
                CreateOrganizationRequest(name="Test", slug=slug)

    def test_role_enum_constraints(self):
        """Test role fields accept only valid values."""
        # Team roles
        valid_team_roles = ["team_lead", "member"]
        for role in valid_team_roles:
            request = AddMemberRequest(user_id="u-1", role=role)
            assert request.role == role

        # Invalid team role
        with pytest.raises(ValidationError):
            AddMemberRequest(user_id="u-1", role="owner")

    def test_plan_tier_enum_constraints(self):
        """Test plan_tier accepts only valid values."""
        valid_tiers = ["free", "pro", "enterprise"]
        for tier in valid_tiers:
            request = CreateOrganizationRequest(
                name="Test", slug="test", plan_tier=tier
            )
            assert request.plan_tier == tier

        with pytest.raises(ValidationError):
            CreateOrganizationRequest(name="Test", slug="test", plan_tier="basic")
