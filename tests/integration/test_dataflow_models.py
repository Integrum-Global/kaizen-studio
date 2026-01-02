"""
Tier 2: DataFlow Models Integration Tests

Tests CRUD operations with real PostgreSQL database.
NO MOCKING - uses actual DataFlow infrastructure.
"""

import pytest
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestOrganizationCRUD:
    """Test Organization model CRUD operations."""

    @pytest.mark.asyncio
    async def test_create_organization(self, test_db, organization_factory):
        """Should create organization in database."""
        org_data = organization_factory()
        runtime = AsyncLocalRuntime()

        workflow = WorkflowBuilder()
        workflow.add_node("OrganizationCreateNode", "create", org_data)

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})

        # Verify creation
        assert results["create"]["id"] == org_data["id"]
        assert results["create"]["name"] == org_data["name"]

    @pytest.mark.asyncio
    async def test_read_organization(self, test_db, organization_factory):
        """Should read organization from database."""
        org_data = organization_factory()
        runtime = AsyncLocalRuntime()

        # Create first
        create_workflow = WorkflowBuilder()
        create_workflow.add_node("OrganizationCreateNode", "create", org_data)
        await runtime.execute_workflow_async(create_workflow.build(), inputs={})

        # Read
        read_workflow = WorkflowBuilder()
        read_workflow.add_node("OrganizationReadNode", "read", {"id": org_data["id"]})

        results, _ = await runtime.execute_workflow_async(
            read_workflow.build(), inputs={}
        )

        assert results["read"]["id"] == org_data["id"]
        assert results["read"]["name"] == org_data["name"]
        assert results["read"]["slug"] == org_data["slug"]

    @pytest.mark.asyncio
    async def test_update_organization(self, test_db, organization_factory):
        """Should update organization in database."""
        org_data = organization_factory()
        runtime = AsyncLocalRuntime()

        # Create
        create_workflow = WorkflowBuilder()
        create_workflow.add_node("OrganizationCreateNode", "create", org_data)
        await runtime.execute_workflow_async(create_workflow.build(), inputs={})

        # Update
        new_name = "Updated Organization"
        update_workflow = WorkflowBuilder()
        update_workflow.add_node(
            "OrganizationUpdateNode",
            "update",
            {"filter": {"id": org_data["id"]}, "fields": {"name": new_name}},
        )

        await runtime.execute_workflow_async(update_workflow.build(), inputs={})

        # Verify update
        read_workflow = WorkflowBuilder()
        read_workflow.add_node("OrganizationReadNode", "read", {"id": org_data["id"]})

        results, _ = await runtime.execute_workflow_async(
            read_workflow.build(), inputs={}
        )
        assert results["read"]["name"] == new_name

    @pytest.mark.asyncio
    async def test_delete_organization(self, test_db, organization_factory):
        """Should delete organization from database."""
        org_data = organization_factory()
        runtime = AsyncLocalRuntime()

        # Create
        create_workflow = WorkflowBuilder()
        create_workflow.add_node("OrganizationCreateNode", "create", org_data)
        await runtime.execute_workflow_async(create_workflow.build(), inputs={})

        # Delete
        delete_workflow = WorkflowBuilder()
        delete_workflow.add_node(
            "OrganizationDeleteNode", "delete", {"filter": {"id": org_data["id"]}}
        )

        await runtime.execute_workflow_async(delete_workflow.build(), inputs={})

        # Verify deletion - DataFlow raises exception when record not found
        read_workflow = WorkflowBuilder()
        read_workflow.add_node("OrganizationReadNode", "read", {"id": org_data["id"]})

        try:
            results, _ = await runtime.execute_workflow_async(
                read_workflow.build(), inputs={}
            )
            # If no exception, should be None or empty
            assert results["read"] is None or results["read"] == {}
        except Exception as e:
            # DataFlow raises exception for deleted records - this is expected
            assert "not found" in str(e).lower()

    @pytest.mark.asyncio
    async def test_list_organizations(self, test_db, organization_factory):
        """Should list organizations with filters."""
        runtime = AsyncLocalRuntime()

        # Create multiple orgs
        orgs = [organization_factory(status="active") for _ in range(3)]
        for org in orgs:
            workflow = WorkflowBuilder()
            workflow.add_node("OrganizationCreateNode", "create", org)
            await runtime.execute_workflow_async(workflow.build(), inputs={})

        # List all
        list_workflow = WorkflowBuilder()
        list_workflow.add_node(
            "OrganizationListNode",
            "list",
            {"filter": {"status": "active"}, "limit": 10},
        )

        results, _ = await runtime.execute_workflow_async(
            list_workflow.build(), inputs={}
        )
        records = results["list"]["records"]

        assert len(records) >= 3


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestUserCRUD:
    """Test User model CRUD operations."""

    @pytest.mark.asyncio
    async def test_create_user(self, test_db, user_factory, organization_factory):
        """Should create user in database."""
        runtime = AsyncLocalRuntime()

        # Create org first
        org_data = organization_factory()
        org_workflow = WorkflowBuilder()
        org_workflow.add_node("OrganizationCreateNode", "create", org_data)
        await runtime.execute_workflow_async(org_workflow.build(), inputs={})

        # Create user
        user_data = user_factory(organization_id=org_data["id"])
        user_data["password_hash"] = user_data.pop("password")  # Rename for DB

        workflow = WorkflowBuilder()
        workflow.add_node("UserCreateNode", "create", user_data)

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})

        assert results["create"]["id"] == user_data["id"]
        assert results["create"]["email"] == user_data["email"]

    @pytest.mark.asyncio
    async def test_read_user(self, test_db, user_factory, organization_factory):
        """Should read user from database."""
        runtime = AsyncLocalRuntime()

        # Create org
        org_data = organization_factory()
        org_workflow = WorkflowBuilder()
        org_workflow.add_node("OrganizationCreateNode", "create", org_data)
        await runtime.execute_workflow_async(org_workflow.build(), inputs={})

        # Create user
        user_data = user_factory(organization_id=org_data["id"])
        user_data["password_hash"] = user_data.pop("password")

        create_workflow = WorkflowBuilder()
        create_workflow.add_node("UserCreateNode", "create", user_data)
        await runtime.execute_workflow_async(create_workflow.build(), inputs={})

        # Read
        read_workflow = WorkflowBuilder()
        read_workflow.add_node("UserReadNode", "read", {"id": user_data["id"]})

        results, _ = await runtime.execute_workflow_async(
            read_workflow.build(), inputs={}
        )

        assert results["read"]["id"] == user_data["id"]
        assert results["read"]["email"] == user_data["email"]
        assert results["read"]["organization_id"] == org_data["id"]

    @pytest.mark.asyncio
    async def test_update_user(self, test_db, user_factory, organization_factory):
        """Should update user in database."""
        runtime = AsyncLocalRuntime()

        # Create org
        org_data = organization_factory()
        org_workflow = WorkflowBuilder()
        org_workflow.add_node("OrganizationCreateNode", "create", org_data)
        await runtime.execute_workflow_async(org_workflow.build(), inputs={})

        # Create user
        user_data = user_factory(organization_id=org_data["id"])
        user_data["password_hash"] = user_data.pop("password")

        create_workflow = WorkflowBuilder()
        create_workflow.add_node("UserCreateNode", "create", user_data)
        await runtime.execute_workflow_async(create_workflow.build(), inputs={})

        # Update
        new_name = "Updated User Name"
        update_workflow = WorkflowBuilder()
        update_workflow.add_node(
            "UserUpdateNode",
            "update",
            {"filter": {"id": user_data["id"]}, "fields": {"name": new_name}},
        )

        await runtime.execute_workflow_async(update_workflow.build(), inputs={})

        # Verify
        read_workflow = WorkflowBuilder()
        read_workflow.add_node("UserReadNode", "read", {"id": user_data["id"]})

        results, _ = await runtime.execute_workflow_async(
            read_workflow.build(), inputs={}
        )
        assert results["read"]["name"] == new_name

    @pytest.mark.asyncio
    async def test_delete_user(self, test_db, user_factory, organization_factory):
        """Should delete user from database."""
        runtime = AsyncLocalRuntime()

        # Create org
        org_data = organization_factory()
        org_workflow = WorkflowBuilder()
        org_workflow.add_node("OrganizationCreateNode", "create", org_data)
        await runtime.execute_workflow_async(org_workflow.build(), inputs={})

        # Create user
        user_data = user_factory(organization_id=org_data["id"])
        user_data["password_hash"] = user_data.pop("password")

        create_workflow = WorkflowBuilder()
        create_workflow.add_node("UserCreateNode", "create", user_data)
        await runtime.execute_workflow_async(create_workflow.build(), inputs={})

        # Delete
        delete_workflow = WorkflowBuilder()
        delete_workflow.add_node(
            "UserDeleteNode", "delete", {"filter": {"id": user_data["id"]}}
        )

        await runtime.execute_workflow_async(delete_workflow.build(), inputs={})

        # Verify deletion - DataFlow raises exception when record not found
        read_workflow = WorkflowBuilder()
        read_workflow.add_node("UserReadNode", "read", {"id": user_data["id"]})

        try:
            results, _ = await runtime.execute_workflow_async(
                read_workflow.build(), inputs={}
            )
            # If no exception, should be None or empty
            assert results["read"] is None or results["read"] == {}
        except Exception as e:
            # DataFlow raises exception for deleted records - this is expected
            assert "not found" in str(e).lower()

    @pytest.mark.asyncio
    async def test_list_users_by_organization(
        self, test_db, user_factory, organization_factory
    ):
        """Should list users filtered by organization."""
        runtime = AsyncLocalRuntime()

        # Create two orgs
        org1 = organization_factory()
        org2 = organization_factory()

        for org in [org1, org2]:
            workflow = WorkflowBuilder()
            workflow.add_node("OrganizationCreateNode", "create", org)
            await runtime.execute_workflow_async(workflow.build(), inputs={})

        # Create users in org1
        for _ in range(2):
            user = user_factory(organization_id=org1["id"])
            user["password_hash"] = user.pop("password")
            workflow = WorkflowBuilder()
            workflow.add_node("UserCreateNode", "create", user)
            await runtime.execute_workflow_async(workflow.build(), inputs={})

        # Create user in org2
        user = user_factory(organization_id=org2["id"])
        user["password_hash"] = user.pop("password")
        workflow = WorkflowBuilder()
        workflow.add_node("UserCreateNode", "create", user)
        await runtime.execute_workflow_async(workflow.build(), inputs={})

        # List users in org1
        list_workflow = WorkflowBuilder()
        list_workflow.add_node(
            "UserListNode", "list", {"filter": {"organization_id": org1["id"]}}
        )

        results, _ = await runtime.execute_workflow_async(
            list_workflow.build(), inputs={}
        )
        records = results["list"]["records"]

        assert len(records) == 2
        for user in records:
            assert user["organization_id"] == org1["id"]


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestWorkspaceCRUD:
    """Test Workspace model CRUD operations."""

    @pytest.mark.asyncio
    async def test_create_workspace(
        self, test_db, workspace_factory, organization_factory
    ):
        """Should create workspace in database."""
        runtime = AsyncLocalRuntime()

        # Create org
        org_data = organization_factory()
        org_workflow = WorkflowBuilder()
        org_workflow.add_node("OrganizationCreateNode", "create", org_data)
        await runtime.execute_workflow_async(org_workflow.build(), inputs={})

        # Create workspace
        workspace_data = workspace_factory(organization_id=org_data["id"])

        workflow = WorkflowBuilder()
        workflow.add_node("WorkspaceCreateNode", "create", workspace_data)

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})

        assert results["create"]["id"] == workspace_data["id"]
        assert results["create"]["name"] == workspace_data["name"]

    @pytest.mark.asyncio
    async def test_read_workspace(
        self, test_db, workspace_factory, organization_factory
    ):
        """Should read workspace from database."""
        runtime = AsyncLocalRuntime()

        # Create org
        org_data = organization_factory()
        org_workflow = WorkflowBuilder()
        org_workflow.add_node("OrganizationCreateNode", "create", org_data)
        await runtime.execute_workflow_async(org_workflow.build(), inputs={})

        # Create workspace
        workspace_data = workspace_factory(organization_id=org_data["id"])

        create_workflow = WorkflowBuilder()
        create_workflow.add_node("WorkspaceCreateNode", "create", workspace_data)
        await runtime.execute_workflow_async(create_workflow.build(), inputs={})

        # Read
        read_workflow = WorkflowBuilder()
        read_workflow.add_node(
            "WorkspaceReadNode", "read", {"id": workspace_data["id"]}
        )

        results, _ = await runtime.execute_workflow_async(
            read_workflow.build(), inputs={}
        )

        assert results["read"]["id"] == workspace_data["id"]
        assert results["read"]["environment_type"] == workspace_data["environment_type"]

    @pytest.mark.asyncio
    async def test_update_workspace(
        self, test_db, workspace_factory, organization_factory
    ):
        """Should update workspace in database."""
        runtime = AsyncLocalRuntime()

        # Create org
        org_data = organization_factory()
        org_workflow = WorkflowBuilder()
        org_workflow.add_node("OrganizationCreateNode", "create", org_data)
        await runtime.execute_workflow_async(org_workflow.build(), inputs={})

        # Create workspace
        workspace_data = workspace_factory(organization_id=org_data["id"])

        create_workflow = WorkflowBuilder()
        create_workflow.add_node("WorkspaceCreateNode", "create", workspace_data)
        await runtime.execute_workflow_async(create_workflow.build(), inputs={})

        # Update
        update_workflow = WorkflowBuilder()
        update_workflow.add_node(
            "WorkspaceUpdateNode",
            "update",
            {
                "filter": {"id": workspace_data["id"]},
                "fields": {"environment_type": "production"},
            },
        )

        await runtime.execute_workflow_async(update_workflow.build(), inputs={})

        # Verify
        read_workflow = WorkflowBuilder()
        read_workflow.add_node(
            "WorkspaceReadNode", "read", {"id": workspace_data["id"]}
        )

        results, _ = await runtime.execute_workflow_async(
            read_workflow.build(), inputs={}
        )
        assert results["read"]["environment_type"] == "production"

    @pytest.mark.asyncio
    async def test_delete_workspace(
        self, test_db, workspace_factory, organization_factory
    ):
        """Should delete workspace from database."""
        runtime = AsyncLocalRuntime()

        # Create org
        org_data = organization_factory()
        org_workflow = WorkflowBuilder()
        org_workflow.add_node("OrganizationCreateNode", "create", org_data)
        await runtime.execute_workflow_async(org_workflow.build(), inputs={})

        # Create workspace
        workspace_data = workspace_factory(organization_id=org_data["id"])

        create_workflow = WorkflowBuilder()
        create_workflow.add_node("WorkspaceCreateNode", "create", workspace_data)
        await runtime.execute_workflow_async(create_workflow.build(), inputs={})

        # Delete
        delete_workflow = WorkflowBuilder()
        delete_workflow.add_node(
            "WorkspaceDeleteNode", "delete", {"filter": {"id": workspace_data["id"]}}
        )

        await runtime.execute_workflow_async(delete_workflow.build(), inputs={})

        # Verify deletion - DataFlow raises exception when record not found
        read_workflow = WorkflowBuilder()
        read_workflow.add_node(
            "WorkspaceReadNode", "read", {"id": workspace_data["id"]}
        )

        try:
            results, _ = await runtime.execute_workflow_async(
                read_workflow.build(), inputs={}
            )
            # If no exception, should be None or empty
            assert results["read"] is None or results["read"] == {}
        except Exception as e:
            # DataFlow raises exception for deleted records - this is expected
            assert "not found" in str(e).lower()


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestMultiTenantIsolation:
    """Test multi-tenant data isolation."""

    @pytest.mark.asyncio
    async def test_users_isolated_by_organization(
        self, test_db, user_factory, organization_factory
    ):
        """Users should only be visible within their organization."""
        runtime = AsyncLocalRuntime()

        # Create two orgs
        org1 = organization_factory()
        org2 = organization_factory()

        for org in [org1, org2]:
            workflow = WorkflowBuilder()
            workflow.add_node("OrganizationCreateNode", "create", org)
            await runtime.execute_workflow_async(workflow.build(), inputs={})

        # Create user in each org
        user1 = user_factory(organization_id=org1["id"], email="user1@org1.com")
        user1["password_hash"] = user1.pop("password")

        user2 = user_factory(organization_id=org2["id"], email="user2@org2.com")
        user2["password_hash"] = user2.pop("password")

        for user in [user1, user2]:
            workflow = WorkflowBuilder()
            workflow.add_node("UserCreateNode", "create", user)
            await runtime.execute_workflow_async(workflow.build(), inputs={})

        # Query org1 users - should only see user1
        list_workflow = WorkflowBuilder()
        list_workflow.add_node(
            "UserListNode", "list", {"filter": {"organization_id": org1["id"]}}
        )

        results, _ = await runtime.execute_workflow_async(
            list_workflow.build(), inputs={}
        )
        records = results["list"]["records"]

        assert len(records) == 1
        assert records[0]["email"] == "user1@org1.com"

    @pytest.mark.asyncio
    async def test_workspaces_isolated_by_organization(
        self, test_db, workspace_factory, organization_factory
    ):
        """Workspaces should only be visible within their organization."""
        runtime = AsyncLocalRuntime()

        # Create two orgs
        org1 = organization_factory()
        org2 = organization_factory()

        for org in [org1, org2]:
            workflow = WorkflowBuilder()
            workflow.add_node("OrganizationCreateNode", "create", org)
            await runtime.execute_workflow_async(workflow.build(), inputs={})

        # Create workspace in each org
        ws1 = workspace_factory(organization_id=org1["id"], name="Org1 Workspace")
        ws2 = workspace_factory(organization_id=org2["id"], name="Org2 Workspace")

        for ws in [ws1, ws2]:
            workflow = WorkflowBuilder()
            workflow.add_node("WorkspaceCreateNode", "create", ws)
            await runtime.execute_workflow_async(workflow.build(), inputs={})

        # Query org1 workspaces
        list_workflow = WorkflowBuilder()
        list_workflow.add_node(
            "WorkspaceListNode", "list", {"filter": {"organization_id": org1["id"]}}
        )

        results, _ = await runtime.execute_workflow_async(
            list_workflow.build(), inputs={}
        )
        records = results["list"]["records"]

        assert len(records) == 1
        assert records[0]["name"] == "Org1 Workspace"
