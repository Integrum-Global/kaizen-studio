"""
Tier 1: Unit Tests for Service Functions

Tests service functions with mocked DataFlow operations.
Mocking is ALLOWED in Tier 1 only.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from studio.services.invitation_service import InvitationService
from studio.services.organization_service import OrganizationService
from studio.services.team_service import TeamService
from studio.services.user_service import UserService
from studio.services.workspace_service import WorkspaceService

# Mark all tests in this file as unit tests
pytestmark = pytest.mark.unit


class TestOrganizationService:
    """Unit tests for OrganizationService."""

    @pytest.fixture
    def org_service(self):
        """Create organization service instance."""
        return OrganizationService()

    @pytest.mark.asyncio
    async def test_create_organization_success(self, org_service):
        """Test creating an organization successfully."""
        with patch.object(
            org_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "create": {
                        "id": "test-org-id",
                        "name": "Test Organization",
                        "slug": "test-organization",
                        "status": "active",
                        "plan_tier": "pro",
                        "created_by": "user-123",
                        "created_at": datetime.now(UTC).isoformat(),
                        "updated_at": datetime.now(UTC).isoformat(),
                    }
                },
                "run-123",
            )

            result = await org_service.create_organization(
                name="Test Organization",
                slug="test-organization",
                plan_tier="pro",
                created_by="user-123",
            )

            assert result["id"] == "test-org-id"
            assert result["name"] == "Test Organization"
            assert result["slug"] == "test-organization"
            assert result["plan_tier"] == "pro"
            mock_execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_organization_found(self, org_service):
        """Test getting an organization by ID when found."""
        with patch.object(
            org_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "read": {
                        "id": "org-123",
                        "name": "My Org",
                        "slug": "my-org",
                        "status": "active",
                    }
                },
                "run-123",
            )

            result = await org_service.get_organization("org-123")

            assert result is not None
            assert result["id"] == "org-123"
            assert result["name"] == "My Org"

    @pytest.mark.asyncio
    async def test_get_organization_not_found(self, org_service):
        """Test getting an organization by ID when not found."""
        with patch.object(
            org_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({"read": None}, "run-123")

            result = await org_service.get_organization("nonexistent-id")

            assert result is None

    @pytest.mark.asyncio
    async def test_update_organization_success(self, org_service):
        """Test updating an organization successfully."""
        with patch.object(
            org_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            # First call updates, second call reads
            mock_execute.side_effect = [
                ({}, "run-1"),
                (
                    {
                        "read": {
                            "id": "org-123",
                            "name": "Updated Org",
                            "slug": "updated-org",
                            "status": "active",
                        }
                    },
                    "run-2",
                ),
            ]

            result = await org_service.update_organization(
                "org-123", {"name": "Updated Org", "slug": "updated-org"}
            )

            assert result["name"] == "Updated Org"
            assert mock_execute.call_count == 2

    @pytest.mark.asyncio
    async def test_delete_organization_soft_delete(self, org_service):
        """Test soft deleting an organization."""
        with patch.object(
            org_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({}, "run-123")

            result = await org_service.delete_organization("org-123")

            assert result is True
            mock_execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_list_organizations_with_filters(self, org_service):
        """Test listing organizations with filters."""
        with patch.object(
            org_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "list": {
                        "records": [
                            {"id": "org-1", "name": "Org 1", "status": "active"},
                            {"id": "org-2", "name": "Org 2", "status": "active"},
                        ],
                        "total": 2,
                    }
                },
                "run-123",
            )

            result = await org_service.list_organizations(
                filters={"status": "active"},
                limit=10,
                offset=0,
            )

            assert len(result["records"]) == 2
            assert result["total"] == 2

    @pytest.mark.asyncio
    async def test_list_organizations_empty(self, org_service):
        """Test listing organizations when none exist."""
        with patch.object(
            org_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {"list": {"records": [], "total": 0}},
                "run-123",
            )

            result = await org_service.list_organizations()

            assert len(result["records"]) == 0
            assert result["total"] == 0


class TestUserService:
    """Unit tests for UserService."""

    @pytest.fixture
    def user_service(self):
        """Create user service instance."""
        return UserService()

    @pytest.mark.asyncio
    async def test_create_user_success(self, user_service):
        """Test creating a user successfully."""
        with patch.object(
            user_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "create": {
                        "id": "user-123",
                        "organization_id": "org-123",
                        "email": "test@example.com",
                        "name": "Test User",
                        "role": "developer",
                        "status": "active",
                    }
                },
                "run-123",
            )

            result = await user_service.create_user(
                organization_id="org-123",
                email="test@example.com",
                name="Test User",
                password="password123",
                role="developer",
            )

            assert result["id"] == "user-123"
            assert result["email"] == "test@example.com"
            mock_execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_by_id(self, user_service):
        """Test getting a user by ID."""
        with patch.object(
            user_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "read": {
                        "id": "user-123",
                        "email": "test@example.com",
                        "name": "Test User",
                    }
                },
                "run-123",
            )

            result = await user_service.get_user("user-123")

            assert result["id"] == "user-123"
            assert result["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_get_user_by_email(self, user_service):
        """Test getting a user by email."""
        with patch.object(
            user_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "find": {
                        "records": [
                            {
                                "id": "user-123",
                                "email": "test@example.com",
                                "name": "Test User",
                            }
                        ],
                        "total": 1,
                    }
                },
                "run-123",
            )

            result = await user_service.get_user_by_email("test@example.com")

            assert result is not None
            assert result["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_get_user_by_email_not_found(self, user_service):
        """Test getting a user by email when not found."""
        with patch.object(
            user_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {"find": {"records": [], "total": 0}},
                "run-123",
            )

            result = await user_service.get_user_by_email("nonexistent@example.com")

            assert result is None

    @pytest.mark.asyncio
    async def test_update_user_success(self, user_service):
        """Test updating a user successfully."""
        with patch.object(
            user_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.side_effect = [
                ({}, "run-1"),
                (
                    {
                        "read": {
                            "id": "user-123",
                            "name": "Updated Name",
                            "email": "test@example.com",
                        }
                    },
                    "run-2",
                ),
            ]

            result = await user_service.update_user(
                "user-123", {"name": "Updated Name"}
            )

            assert result["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_delete_user(self, user_service):
        """Test deleting a user."""
        with patch.object(
            user_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({}, "run-123")

            result = await user_service.delete_user("user-123")

            assert result is True

    @pytest.mark.asyncio
    async def test_list_users_with_pagination(self, user_service):
        """Test listing users with pagination."""
        with patch.object(
            user_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "list": {
                        "records": [
                            {"id": "user-1", "name": "User 1"},
                            {"id": "user-2", "name": "User 2"},
                        ],
                        "total": 10,
                    }
                },
                "run-123",
            )

            result = await user_service.list_users(
                organization_id="org-123",
                limit=2,
                offset=0,
            )

            assert len(result["records"]) == 2
            assert result["total"] == 10


class TestWorkspaceService:
    """Unit tests for WorkspaceService."""

    @pytest.fixture
    def workspace_service(self):
        """Create workspace service instance."""
        return WorkspaceService()

    @pytest.mark.asyncio
    async def test_create_workspace_success(self, workspace_service):
        """Test creating a workspace successfully."""
        with patch.object(
            workspace_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "create": {
                        "id": "ws-123",
                        "organization_id": "org-123",
                        "name": "Development",
                        "environment_type": "development",
                        "description": "Dev workspace",
                    }
                },
                "run-123",
            )

            result = await workspace_service.create_workspace(
                organization_id="org-123",
                name="Development",
                environment_type="development",
                description="Dev workspace",
            )

            assert result["id"] == "ws-123"
            assert result["name"] == "Development"

    @pytest.mark.asyncio
    async def test_get_workspace(self, workspace_service):
        """Test getting a workspace by ID."""
        with patch.object(
            workspace_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "read": {
                        "id": "ws-123",
                        "name": "Production",
                    }
                },
                "run-123",
            )

            result = await workspace_service.get_workspace("ws-123")

            assert result["id"] == "ws-123"

    @pytest.mark.asyncio
    async def test_update_workspace(self, workspace_service):
        """Test updating a workspace."""
        with patch.object(
            workspace_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.side_effect = [
                ({}, "run-1"),
                ({"read": {"id": "ws-123", "name": "Updated"}}, "run-2"),
            ]

            result = await workspace_service.update_workspace(
                "ws-123", {"name": "Updated"}
            )

            assert result["name"] == "Updated"

    @pytest.mark.asyncio
    async def test_delete_workspace(self, workspace_service):
        """Test deleting a workspace."""
        with patch.object(
            workspace_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({}, "run-123")

            result = await workspace_service.delete_workspace("ws-123")

            assert result is True

    @pytest.mark.asyncio
    async def test_list_workspaces(self, workspace_service):
        """Test listing workspaces."""
        with patch.object(
            workspace_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "list": {
                        "records": [
                            {"id": "ws-1", "name": "Dev"},
                            {"id": "ws-2", "name": "Prod"},
                        ],
                        "total": 2,
                    }
                },
                "run-123",
            )

            result = await workspace_service.list_workspaces("org-123")

            assert len(result["records"]) == 2


class TestTeamService:
    """Unit tests for TeamService."""

    @pytest.fixture
    def team_service(self):
        """Create team service instance."""
        return TeamService()

    @pytest.mark.asyncio
    async def test_create_team_success(self, team_service):
        """Test creating a team successfully."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({}, "run-123")

            result = await team_service.create_team(
                name="Engineering",
                organization_id="org-123",
                description="Engineering team",
            )

            # Service generates its own UUID, so check it's a valid UUID format
            assert result["id"] is not None
            assert len(result["id"]) == 36  # UUID format
            assert result["name"] == "Engineering"
            assert result["organization_id"] == "org-123"
            mock_execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_team(self, team_service):
        """Test getting a team by ID."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "read": {
                        "id": "team-123",
                        "name": "Engineering",
                    }
                },
                "run-123",
            )

            result = await team_service.get_team("team-123")

            assert result["id"] == "team-123"

    @pytest.mark.asyncio
    async def test_get_team_with_members(self, team_service):
        """Test getting a team with its members."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.side_effect = [
                ({"read": {"id": "team-123", "name": "Engineering"}}, "run-1"),
                (
                    {
                        "members": {
                            "records": [
                                {"id": "m-1", "user_id": "u-1", "role": "team_lead"},
                                {"id": "m-2", "user_id": "u-2", "role": "member"},
                            ]
                        }
                    },
                    "run-2",
                ),
            ]

            result = await team_service.get_team_with_members("team-123")

            assert result["id"] == "team-123"
            assert len(result["members"]) == 2

    @pytest.mark.asyncio
    async def test_get_team_with_members_not_found(self, team_service):
        """Test getting a team that doesn't exist."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({"read": None}, "run-123")

            result = await team_service.get_team_with_members("nonexistent")

            assert result is None

    @pytest.mark.asyncio
    async def test_update_team(self, team_service):
        """Test updating a team."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.side_effect = [
                ({}, "run-1"),
                ({"read": {"id": "team-123", "name": "Updated Team"}}, "run-2"),
            ]

            result = await team_service.update_team(
                "team-123", {"name": "Updated Team"}
            )

            assert result["name"] == "Updated Team"

    @pytest.mark.asyncio
    async def test_delete_team_cascades_memberships(self, team_service):
        """Test deleting a team cascades to memberships."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.side_effect = [
                # Find members
                (
                    {
                        "find_members": {
                            "records": [
                                {"id": "m-1"},
                                {"id": "m-2"},
                            ]
                        }
                    },
                    "run-1",
                ),
                # Delete membership 1
                ({}, "run-2"),
                # Delete membership 2
                ({}, "run-3"),
                # Delete team
                ({}, "run-4"),
            ]

            result = await team_service.delete_team("team-123")

            assert result is True
            assert mock_execute.call_count == 4

    @pytest.mark.asyncio
    async def test_list_teams(self, team_service):
        """Test listing teams in an organization."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "list": {
                        "records": [
                            {"id": "team-1", "name": "Team 1"},
                            {"id": "team-2", "name": "Team 2"},
                        ],
                        "total": 2,
                    }
                },
                "run-123",
            )

            result = await team_service.list_teams("org-123")

            assert len(result["records"]) == 2
            assert result["total"] == 2

    @pytest.mark.asyncio
    async def test_add_member_success(self, team_service):
        """Test adding a member to a team."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "create": {
                        "id": "membership-123",
                        "team_id": "team-123",
                        "user_id": "user-123",
                        "role": "member",
                    }
                },
                "run-123",
            )

            result = await team_service.add_member(
                team_id="team-123",
                user_id="user-123",
                role="member",
            )

            assert result["team_id"] == "team-123"
            assert result["user_id"] == "user-123"
            assert result["role"] == "member"

    @pytest.mark.asyncio
    async def test_add_member_as_team_lead(self, team_service):
        """Test adding a member as team lead."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "create": {
                        "id": "membership-123",
                        "team_id": "team-123",
                        "user_id": "user-123",
                        "role": "team_lead",
                    }
                },
                "run-123",
            )

            result = await team_service.add_member(
                team_id="team-123",
                user_id="user-123",
                role="team_lead",
            )

            assert result["role"] == "team_lead"

    @pytest.mark.asyncio
    async def test_remove_member_success(self, team_service):
        """Test removing a member from a team."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.side_effect = [
                # Find membership
                ({"find": {"records": [{"id": "membership-123"}]}}, "run-1"),
                # Delete membership
                ({}, "run-2"),
            ]

            result = await team_service.remove_member("team-123", "user-123")

            assert result is True

    @pytest.mark.asyncio
    async def test_remove_member_not_found(self, team_service):
        """Test removing a member that's not in the team."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({"find": {"records": []}}, "run-123")

            result = await team_service.remove_member("team-123", "user-123")

            assert result is False

    @pytest.mark.asyncio
    async def test_update_member_role(self, team_service):
        """Test updating a member's role."""
        with patch.object(
            team_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.side_effect = [
                # Find membership
                ({"find": {"records": [{"id": "m-123"}]}}, "run-1"),
                # Update role
                ({}, "run-2"),
                # Read updated
                ({"read": {"id": "m-123", "role": "team_lead"}}, "run-3"),
            ]

            result = await team_service.update_member_role(
                "team-123", "user-123", "team_lead"
            )

            assert result["role"] == "team_lead"


class TestInvitationService:
    """Unit tests for InvitationService."""

    @pytest.fixture
    def invitation_service(self):
        """Create invitation service instance."""
        return InvitationService()

    @pytest.mark.asyncio
    async def test_create_invitation_success(self, invitation_service):
        """Test creating an invitation successfully."""
        with patch.object(
            invitation_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({}, "run-123")

            result = await invitation_service.create_invitation(
                organization_id="org-123",
                email="invite@example.com",
                role="developer",
                invited_by="user-123",
            )

            # Service generates its own UUID and token, so check valid format
            assert result["id"] is not None
            assert len(result["id"]) == 36  # UUID format
            assert result["email"] == "invite@example.com"
            assert result["status"] == "pending"
            assert result["token"] is not None
            mock_execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_invitation_by_token(self, invitation_service):
        """Test getting an invitation by token."""
        with patch.object(
            invitation_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "find": {
                        "records": [
                            {
                                "id": "inv-123",
                                "token": "test-token",
                                "email": "invite@example.com",
                            }
                        ],
                    }
                },
                "run-123",
            )

            result = await invitation_service.get_invitation_by_token("test-token")

            assert result is not None
            assert result["token"] == "test-token"

    @pytest.mark.asyncio
    async def test_get_invitation_by_token_not_found(self, invitation_service):
        """Test getting an invitation by token when not found."""
        with patch.object(
            invitation_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({"find": {"records": []}}, "run-123")

            result = await invitation_service.get_invitation_by_token("invalid-token")

            assert result is None

    @pytest.mark.asyncio
    async def test_accept_invitation_success(self, invitation_service):
        """Test accepting an invitation successfully."""
        future_time = (datetime.now(UTC) + timedelta(days=1)).isoformat()

        with patch.object(
            invitation_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.side_effect = [
                # Get invitation by token
                (
                    {
                        "find": {
                            "records": [
                                {
                                    "id": "inv-123",
                                    "organization_id": "org-123",
                                    "email": "invite@example.com",
                                    "role": "developer",
                                    "status": "pending",
                                    "expires_at": future_time,
                                }
                            ]
                        }
                    },
                    "run-1",
                ),
                # Update status
                ({}, "run-2"),
            ]

            result = await invitation_service.accept_invitation("test-token")

            assert result is not None
            assert result["status"] == "accepted"

    @pytest.mark.asyncio
    async def test_accept_invitation_expired(self, invitation_service):
        """Test accepting an expired invitation."""
        past_time = (datetime.now(UTC) - timedelta(days=1)).isoformat()

        with patch.object(
            invitation_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.side_effect = [
                # Get invitation by token
                (
                    {
                        "find": {
                            "records": [
                                {
                                    "id": "inv-123",
                                    "status": "pending",
                                    "expires_at": past_time,
                                }
                            ]
                        }
                    },
                    "run-1",
                ),
                # Update status to expired
                ({}, "run-2"),
            ]

            result = await invitation_service.accept_invitation("test-token")

            assert result is None

    @pytest.mark.asyncio
    async def test_accept_invitation_already_accepted(self, invitation_service):
        """Test accepting an already accepted invitation."""
        future_time = (datetime.now(UTC) + timedelta(days=1)).isoformat()

        with patch.object(
            invitation_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "find": {
                        "records": [
                            {
                                "id": "inv-123",
                                "status": "accepted",
                                "expires_at": future_time,
                            }
                        ]
                    }
                },
                "run-1",
            )

            result = await invitation_service.accept_invitation("test-token")

            assert result is None

    @pytest.mark.asyncio
    async def test_cancel_invitation(self, invitation_service):
        """Test cancelling an invitation."""
        with patch.object(
            invitation_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({}, "run-123")

            result = await invitation_service.cancel_invitation("inv-123")

            assert result is True

    @pytest.mark.asyncio
    async def test_list_invitations(self, invitation_service):
        """Test listing invitations."""
        with patch.object(
            invitation_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "list": {
                        "records": [
                            {"id": "inv-1", "email": "a@test.com", "status": "pending"},
                            {"id": "inv-2", "email": "b@test.com", "status": "pending"},
                        ],
                        "total": 2,
                    }
                },
                "run-123",
            )

            result = await invitation_service.list_invitations("org-123")

            assert len(result["records"]) == 2
            assert result["total"] == 2

    @pytest.mark.asyncio
    async def test_list_invitations_with_status_filter(self, invitation_service):
        """Test listing invitations with status filter."""
        with patch.object(
            invitation_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = (
                {
                    "list": {
                        "records": [
                            {
                                "id": "inv-1",
                                "email": "a@test.com",
                                "status": "accepted",
                            },
                        ],
                        "total": 1,
                    }
                },
                "run-123",
            )

            result = await invitation_service.list_invitations(
                organization_id="org-123",
                status="accepted",
            )

            assert len(result["records"]) == 1

    @pytest.mark.asyncio
    async def test_cleanup_expired_invitations(self, invitation_service):
        """Test cleaning up expired invitations."""
        past_time = (datetime.now(UTC) - timedelta(days=1)).isoformat()

        with patch.object(
            invitation_service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.side_effect = [
                # Find pending invitations
                (
                    {
                        "find_expired": {
                            "records": [
                                {"id": "inv-1", "expires_at": past_time},
                                {"id": "inv-2", "expires_at": past_time},
                            ]
                        }
                    },
                    "run-1",
                ),
                # Update inv-1
                ({}, "run-2"),
                # Update inv-2
                ({}, "run-3"),
            ]

            count = await invitation_service.cleanup_expired_invitations("org-123")

            assert count == 2
