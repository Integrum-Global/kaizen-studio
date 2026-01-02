"""
Tier 3: E2E Tests for Team Workflows

Tests complete team management workflows with real infrastructure.
NO MOCKING - uses real PostgreSQL, Redis, and API endpoints.
"""

import uuid

import pytest

# Mark all tests as E2E tests
pytestmark = pytest.mark.e2e


class TestTeamLifecycle:
    """E2E tests for complete team lifecycle."""

    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_complete_team_lifecycle(self, test_client, clean_redis):
        """
        Test complete team lifecycle:
        1. Register organization
        2. Create team
        3. Invite and add members
        4. Assign roles
        5. Update team info
        6. Remove members
        7. Delete team
        """
        unique_id = uuid.uuid4().hex[:8]

        # Step 1: Register organization
        admin_response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "email": f"admin_{unique_id}@example.com",
                "password": "adminpass123",
                "name": f"Admin {unique_id}",
                "organization_name": f"Company {unique_id}",
            },
        )
        assert admin_response.status_code == 201
        admin_token = admin_response.json()["tokens"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Step 2: Create team
        team_response = await test_client.post(
            "/api/v1/teams",
            json={
                "name": f"Engineering {unique_id}",
                "description": "The engineering team",
            },
            headers=admin_headers,
        )
        assert team_response.status_code == 201
        team_id = team_response.json()["id"]

        # Step 3: Invite and add members
        user_ids = []
        for i in range(3):
            email = f"member{i}_{unique_id}@example.com"

            # Invite user
            invite_response = await test_client.post(
                "/api/v1/invitations",
                json={"email": email, "role": "developer"},
                headers=admin_headers,
            )
            assert invite_response.status_code == 201
            invite_token = invite_response.json()["token"]

            # Accept invitation
            accept_response = await test_client.post(
                f"/api/v1/invitations/{invite_token}/accept",
                json={
                    "name": f"Member {i} {unique_id}",
                    "password": "memberpass123",
                },
            )
            assert (
                accept_response.status_code == 200
            ), f"Accept failed: {accept_response.json()}"

            # Get user ID
            login_response = await test_client.post(
                "/api/v1/auth/login",
                json={
                    "email": email,
                    "password": "memberpass123",
                },
            )
            assert (
                login_response.status_code == 200
            ), f"Login failed: {login_response.json()}"
            user_id = login_response.json()["user"]["id"]
            user_ids.append(user_id)

            # Add to team
            add_response = await test_client.post(
                f"/api/v1/teams/{team_id}/members",
                json={"user_id": user_id, "role": "member"},
                headers=admin_headers,
            )
            assert add_response.status_code == 201

        # Step 4: Assign roles (make first member team lead)
        # Get the team to check members
        team_get = await test_client.get(
            f"/api/v1/teams/{team_id}", headers=admin_headers
        )
        assert team_get.status_code == 200
        assert len(team_get.json()["members"]) == 3

        # Note: Update member role would need an endpoint

        # Step 5: Update team info
        update_response = await test_client.put(
            f"/api/v1/teams/{team_id}",
            json={
                "name": f"Core Engineering {unique_id}",
                "description": "Core engineering team",
            },
            headers=admin_headers,
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == f"Core Engineering {unique_id}"

        # Step 6: Remove a member
        remove_response = await test_client.delete(
            f"/api/v1/teams/{team_id}/members/{user_ids[2]}",
            headers=admin_headers,
        )
        assert remove_response.status_code == 200

        # Verify member removed
        team_after_remove = await test_client.get(
            f"/api/v1/teams/{team_id}", headers=admin_headers
        )
        assert len(team_after_remove.json()["members"]) == 2

        # Step 7: Delete team
        delete_response = await test_client.delete(
            f"/api/v1/teams/{team_id}", headers=admin_headers
        )
        assert delete_response.status_code == 200

        # Verify team deleted
        get_deleted = await test_client.get(
            f"/api/v1/teams/{team_id}", headers=admin_headers
        )
        assert get_deleted.status_code == 404


class TestTeamMemberManagement:
    """E2E tests for team member management workflows."""

    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_team_member_role_changes(self, test_client, clean_redis):
        """
        Test team member role changes:
        1. Create team
        2. Add members with different roles
        3. Verify role assignments
        """
        unique_id = uuid.uuid4().hex[:8]

        # Setup: Register admin
        admin_response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "email": f"admin_{unique_id}@example.com",
                "password": "adminpass123",
                "name": f"Admin {unique_id}",
                "organization_name": f"Org {unique_id}",
            },
        )
        admin_token = admin_response.json()["tokens"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Create team
        team_response = await test_client.post(
            "/api/v1/teams",
            json={"name": f"Team {unique_id}"},
            headers=admin_headers,
        )
        team_id = team_response.json()["id"]

        # Add team lead
        lead_email = f"lead_{unique_id}@example.com"
        lead_invite = await test_client.post(
            "/api/v1/invitations",
            json={"email": lead_email, "role": "developer"},
            headers=admin_headers,
        )
        await test_client.post(
            f"/api/v1/invitations/{lead_invite.json()['token']}/accept",
            json={"name": "Team Lead", "password": "leadpass123"},
        )

        lead_login = await test_client.post(
            "/api/v1/auth/login",
            json={
                "email": lead_email,
                "password": "leadpass123",
            },
        )
        lead_user_id = lead_login.json()["user"]["id"]

        add_lead = await test_client.post(
            f"/api/v1/teams/{team_id}/members",
            json={"user_id": lead_user_id, "role": "team_lead"},
            headers=admin_headers,
        )
        assert add_lead.status_code == 201
        assert add_lead.json()["role"] == "team_lead"

        # Add regular member
        member_email = f"member_{unique_id}@example.com"
        member_invite = await test_client.post(
            "/api/v1/invitations",
            json={"email": member_email, "role": "developer"},
            headers=admin_headers,
        )
        await test_client.post(
            f"/api/v1/invitations/{member_invite.json()['token']}/accept",
            json={"name": "Team Member", "password": "memberpass123"},
        )

        member_login = await test_client.post(
            "/api/v1/auth/login",
            json={
                "email": member_email,
                "password": "memberpass123",
            },
        )
        member_user_id = member_login.json()["user"]["id"]

        add_member = await test_client.post(
            f"/api/v1/teams/{team_id}/members",
            json={"user_id": member_user_id, "role": "member"},
            headers=admin_headers,
        )
        assert add_member.status_code == 201
        assert add_member.json()["role"] == "member"

        # Verify team composition
        team_detail = await test_client.get(
            f"/api/v1/teams/{team_id}", headers=admin_headers
        )
        members = team_detail.json()["members"]

        roles = {m["user_id"]: m["role"] for m in members}
        assert roles[lead_user_id] == "team_lead"
        assert roles[member_user_id] == "member"

    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_member_can_view_team(self, test_client, clean_redis):
        """
        Test that team members can view their team:
        1. Create team
        2. Add member
        3. Member views team details
        """
        unique_id = uuid.uuid4().hex[:8]

        # Setup
        admin_response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "email": f"admin_{unique_id}@example.com",
                "password": "adminpass123",
                "name": f"Admin {unique_id}",
                "organization_name": f"Org {unique_id}",
            },
        )
        admin_token = admin_response.json()["tokens"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Create team
        team_response = await test_client.post(
            "/api/v1/teams",
            json={"name": f"Viewable Team {unique_id}"},
            headers=admin_headers,
        )
        team_id = team_response.json()["id"]

        # Invite and add member
        member_email = f"viewer_{unique_id}@example.com"
        invite = await test_client.post(
            "/api/v1/invitations",
            json={"email": member_email, "role": "developer"},
            headers=admin_headers,
        )
        await test_client.post(
            f"/api/v1/invitations/{invite.json()['token']}/accept",
            json={"name": "Viewer", "password": "viewerpass123"},
        )

        member_login = await test_client.post(
            "/api/v1/auth/login",
            json={
                "email": member_email,
                "password": "viewerpass123",
            },
        )
        member_token = member_login.json()["access_token"]
        member_user_id = member_login.json()["user"]["id"]
        member_headers = {"Authorization": f"Bearer {member_token}"}

        # Add to team
        await test_client.post(
            f"/api/v1/teams/{team_id}/members",
            json={"user_id": member_user_id, "role": "member"},
            headers=admin_headers,
        )

        # Member views team
        team_view = await test_client.get(
            f"/api/v1/teams/{team_id}", headers=member_headers
        )
        assert team_view.status_code == 200
        assert team_view.json()["id"] == team_id


class TestMultiTeamScenarios:
    """E2E tests for multi-team scenarios."""

    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_user_in_multiple_teams(self, test_client, clean_redis):
        """
        Test user belonging to multiple teams:
        1. Create multiple teams
        2. Add user to all teams
        3. User can see all teams
        """
        unique_id = uuid.uuid4().hex[:8]

        # Setup
        admin_response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "email": f"admin_{unique_id}@example.com",
                "password": "adminpass123",
                "name": f"Admin {unique_id}",
                "organization_name": f"Org {unique_id}",
            },
        )
        admin_token = admin_response.json()["tokens"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Create multiple teams
        team_ids = []
        for i in range(3):
            team_response = await test_client.post(
                "/api/v1/teams",
                json={"name": f"Team {i} {unique_id}"},
                headers=admin_headers,
            )
            assert team_response.status_code == 201
            team_ids.append(team_response.json()["id"])

        # Invite user
        user_email = f"multiuser_{unique_id}@example.com"
        invite = await test_client.post(
            "/api/v1/invitations",
            json={"email": user_email, "role": "developer"},
            headers=admin_headers,
        )
        await test_client.post(
            f"/api/v1/invitations/{invite.json()['token']}/accept",
            json={"name": "Multi Team User", "password": "userpass123"},
        )

        user_login = await test_client.post(
            "/api/v1/auth/login",
            json={
                "email": user_email,
                "password": "userpass123",
            },
        )
        user_id = user_login.json()["user"]["id"]
        user_token = user_login.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # Add user to all teams
        for team_id in team_ids:
            add_response = await test_client.post(
                f"/api/v1/teams/{team_id}/members",
                json={"user_id": user_id, "role": "member"},
                headers=admin_headers,
            )
            assert add_response.status_code == 201

        # User can list all teams
        teams_list = await test_client.get("/api/v1/teams", headers=user_headers)
        assert teams_list.status_code == 200
        user_team_ids = [t["id"] for t in teams_list.json()["records"]]

        # User should see all teams in organization
        for team_id in team_ids:
            assert team_id in user_team_ids

    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_team_isolation_between_orgs(self, test_client, clean_redis):
        """
        Test team isolation between organizations:
        1. Create two organizations
        2. Each creates teams
        3. Verify isolation
        """
        unique_id = uuid.uuid4().hex[:8]

        # Create first organization
        org1_response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "email": f"org1_{unique_id}@example.com",
                "password": "org1pass123",
                "name": f"Org1 Admin {unique_id}",
                "organization_name": f"Organization 1 {unique_id}",
            },
        )
        org1_token = org1_response.json()["tokens"]["access_token"]
        org1_headers = {"Authorization": f"Bearer {org1_token}"}

        # Create second organization
        org2_response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "email": f"org2_{unique_id}@example.com",
                "password": "org2pass123",
                "name": f"Org2 Admin {unique_id}",
                "organization_name": f"Organization 2 {unique_id}",
            },
        )
        org2_token = org2_response.json()["tokens"]["access_token"]
        org2_headers = {"Authorization": f"Bearer {org2_token}"}

        # Create team in org1
        org1_team = await test_client.post(
            "/api/v1/teams",
            json={"name": f"Org1 Team {unique_id}"},
            headers=org1_headers,
        )
        org1_team_id = org1_team.json()["id"]

        # Create team in org2
        org2_team = await test_client.post(
            "/api/v1/teams",
            json={"name": f"Org2 Team {unique_id}"},
            headers=org2_headers,
        )
        org2_team_id = org2_team.json()["id"]

        # Org1 should not see org2's team
        org1_teams = await test_client.get("/api/v1/teams", headers=org1_headers)
        org1_team_ids = [t["id"] for t in org1_teams.json()["records"]]
        assert org1_team_id in org1_team_ids
        assert org2_team_id not in org1_team_ids

        # Org2 should not see org1's team
        org2_teams = await test_client.get("/api/v1/teams", headers=org2_headers)
        org2_team_ids = [t["id"] for t in org2_teams.json()["records"]]
        assert org2_team_id in org2_team_ids
        assert org1_team_id not in org2_team_ids

        # Org1 cannot access org2's team
        cross_access = await test_client.get(
            f"/api/v1/teams/{org2_team_id}", headers=org1_headers
        )
        assert cross_access.status_code in [403, 404]


class TestTeamCleanup:
    """E2E tests for team cleanup scenarios."""

    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_delete_team_with_members(self, test_client, clean_redis):
        """
        Test deleting team with members:
        1. Create team
        2. Add multiple members
        3. Delete team
        4. Verify cleanup
        """
        unique_id = uuid.uuid4().hex[:8]

        # Setup
        admin_response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "email": f"admin_{unique_id}@example.com",
                "password": "adminpass123",
                "name": f"Admin {unique_id}",
                "organization_name": f"Org {unique_id}",
            },
        )
        admin_token = admin_response.json()["tokens"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Create team
        team_response = await test_client.post(
            "/api/v1/teams",
            json={"name": f"To Delete {unique_id}"},
            headers=admin_headers,
        )
        team_id = team_response.json()["id"]

        # Add members - use user_id from invitation accept response
        for i in range(2):
            email = f"deletemember{i}_{unique_id}@example.com"
            invite = await test_client.post(
                "/api/v1/invitations",
                json={"email": email, "role": "developer"},
                headers=admin_headers,
            )
            assert invite.status_code == 201, f"Invite failed: {invite.json()}"
            accept_response = await test_client.post(
                f"/api/v1/invitations/{invite.json()['token']}/accept",
                json={"name": f"Member {i}", "password": "password123"},
            )
            # Get user_id from the accept response (async context isolation workaround)
            assert (
                accept_response.status_code == 200
            ), f"Accept failed: {accept_response.json()}"
            user_id = accept_response.json()["user_id"]

            add_member_response = await test_client.post(
                f"/api/v1/teams/{team_id}/members",
                json={"user_id": user_id, "role": "member"},
                headers=admin_headers,
            )
            assert (
                add_member_response.status_code == 201
            ), f"Add member failed: {add_member_response.json()}"

        # Verify members added
        team_before = await test_client.get(
            f"/api/v1/teams/{team_id}", headers=admin_headers
        )
        assert len(team_before.json()["members"]) == 2

        # Delete team
        delete_response = await test_client.delete(
            f"/api/v1/teams/{team_id}", headers=admin_headers
        )
        assert delete_response.status_code == 200

        # Verify team deleted
        team_after = await test_client.get(
            f"/api/v1/teams/{team_id}", headers=admin_headers
        )
        assert team_after.status_code == 404
