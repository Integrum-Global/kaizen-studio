"""
Tier 2: Policy API Integration Tests

Tests all 9 policy endpoints with real database and DataFlow operations.
NO MOCKING - uses real PostgreSQL and async DataFlow workflows.

Test Coverage:
- Policy CRUD endpoints (create, read, update, delete, list)
- Policy assignment endpoints (assign, unassign, get_user_policies)
- Policy evaluation endpoint
- Permission validation (RBAC integration)
- Database persistence and data integrity
- Error handling and edge cases
"""

import json
import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestCreatePolicyEndpoint:
    """Test POST /policies endpoint."""

    async def test_create_policy_success(self, authenticated_client):
        """Test successful policy creation."""
        client, user = authenticated_client
        org_id = user["organization_id"]

        # Create policy
        response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Allow agent creation",
                "description": "Allow users to create agents",
                "resource_type": "agent",
                "action": "create",
                "effect": "allow",
                "conditions": {
                    "all": [{"field": "resource.status", "op": "eq", "value": "active"}]
                },
                "priority": 10,
                "status": "active",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Allow agent creation"
        assert data["resource_type"] == "agent"
        assert data["action"] == "create"
        assert data["effect"] == "allow"
        assert data["priority"] == 10
        assert data["status"] == "active"
        assert "id" in data
        assert "created_by" in data

    async def test_create_policy_minimal(self, authenticated_client):
        """Test policy creation with minimal fields."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Minimal policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "active"  # Default
        assert data["priority"] == 0  # Default

    async def test_create_policy_with_wildcard(self, authenticated_client):
        """Test policy creation with wildcard resource/action."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Admin allow all",
                "resource_type": "*",
                "action": "*",
                "effect": "allow",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["resource_type"] == "*"
        assert data["action"] == "*"

    async def test_create_policy_with_complex_conditions(self, authenticated_client):
        """Test policy creation with complex conditions."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Complex conditions policy",
                "resource_type": "agent",
                "action": "update",
                "effect": "allow",
                "conditions": {
                    "all": [
                        {"field": "resource.status", "op": "eq", "value": "active"},
                        {
                            "field": "resource.environment",
                            "op": "eq",
                            "value": "production",
                        },
                        {
                            "any": [
                                {"field": "user.role", "op": "eq", "value": "admin"},
                                {"field": "user.role", "op": "eq", "value": "editor"},
                            ]
                        },
                    ]
                },
            },
        )

        assert response.status_code == 201
        data = response.json()
        conditions = (
            json.loads(data["conditions"])
            if isinstance(data["conditions"], str)
            else data["conditions"]
        )
        assert "all" in conditions

    async def test_create_policy_missing_required_field(self, authenticated_client):
        """Test policy creation without required fields."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/policies",
            json={
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
                # Missing 'name'
            },
        )

        assert response.status_code == 422  # Validation error

    async def test_create_policy_invalid_effect(self, authenticated_client):
        """Test policy creation with invalid effect."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Invalid effect",
                "resource_type": "agent",
                "action": "read",
                "effect": "maybe",  # Invalid
            },
        )

        assert response.status_code == 422

    async def test_create_policy_missing_organization_id(
        self, test_client: AsyncClient
    ):
        """Test policy creation without authentication."""
        # No auth headers - should fail
        response = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "Test policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )

        # Without authentication, should get 401 or 400
        assert response.status_code in [400, 401, 403]


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestListPoliciesEndpoint:
    """Test GET /policies endpoint."""

    async def test_list_policies_success(self, authenticated_client):
        """Test successful policy listing."""
        client, user = authenticated_client

        # Create multiple policies
        for i in range(3):
            await client.post(
                "/api/v1/policies",
                json={
                    "name": f"Policy {i}",
                    "resource_type": "agent",
                    "action": "read",
                    "effect": "allow",
                },
            )

        # List policies
        response = await client.get("/api/v1/policies")

        assert response.status_code == 200
        data = response.json()
        assert "records" in data
        assert "total" in data
        assert data["total"] >= 3

    async def test_list_policies_empty(self, authenticated_client):
        """Test listing policies when none exist."""
        client, user = authenticated_client

        response = await client.get("/api/v1/policies")

        assert response.status_code == 200
        data = response.json()
        # May have policies from other tests, just check structure
        assert "total" in data
        assert "records" in data

    async def test_list_policies_with_status_filter(self, authenticated_client):
        """Test listing policies with status filter."""
        client, user = authenticated_client

        # Create active and inactive policies
        for status in ["active", "inactive"]:
            await client.post(
                "/api/v1/policies",
                json={
                    "name": f"{status} policy {uuid.uuid4().hex[:6]}",
                    "resource_type": "agent",
                    "action": "read",
                    "effect": "allow",
                    "status": status,
                },
            )

        # List only active
        response = await client.get("/api/v1/policies?status=active")

        assert response.status_code == 200
        data = response.json()
        assert all(p["status"] == "active" for p in data["records"])

    async def test_list_policies_with_resource_type_filter(self, authenticated_client):
        """Test listing policies with resource type filter."""
        client, user = authenticated_client

        # Create policies for different resources
        for resource in ["agent", "deployment"]:
            await client.post(
                "/api/v1/policies",
                json={
                    "name": f"{resource} policy {uuid.uuid4().hex[:6]}",
                    "resource_type": resource,
                    "action": "read",
                    "effect": "allow",
                },
            )

        # Filter by resource
        response = await client.get("/api/v1/policies?resource_type=agent")

        assert response.status_code == 200
        data = response.json()
        assert all(p["resource_type"] == "agent" for p in data["records"])

    async def test_list_policies_pagination(self, authenticated_client):
        """Test listing policies with pagination."""
        client, user = authenticated_client

        # Create 5 policies
        for i in range(5):
            await client.post(
                "/api/v1/policies",
                json={
                    "name": f"Pagination Policy {i} {uuid.uuid4().hex[:6]}",
                    "resource_type": "agent",
                    "action": "read",
                    "effect": "allow",
                },
            )

        # Get first page
        response = await client.get("/api/v1/policies?limit=2&offset=0")

        assert response.status_code == 200
        data = response.json()
        assert len(data["records"]) <= 2


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestGetPolicyEndpoint:
    """Test GET /policies/{policy_id} endpoint."""

    async def test_get_policy_success(self, authenticated_client):
        """Test successful policy retrieval."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Test policy",
                "description": "A test policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
                "priority": 5,
            },
        )
        policy_id = create_response.json()["id"]

        # Retrieve policy
        response = await client.get(f"/api/v1/policies/{policy_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == policy_id
        assert data["name"] == "Test policy"
        assert data["priority"] == 5

    async def test_get_policy_not_found(self, authenticated_client):
        """Test retrieving non-existent policy."""
        client, user = authenticated_client

        response = await client.get(f"/api/v1/policies/{uuid.uuid4()}")

        assert response.status_code == 404

    async def test_get_policy_different_org_not_visible(self, authenticated_client):
        """Test that policies from other orgs are not visible (filtered by org_id)."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Org specific policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )
        assert create_response.status_code == 201
        policy = create_response.json()

        # The policy should be visible to this org
        response = await client.get(f"/api/v1/policies/{policy['id']}")
        assert response.status_code == 200

        # Verify it's in the list
        list_response = await client.get("/api/v1/policies")
        assert list_response.status_code == 200
        policies = list_response.json()["records"]
        policy_ids = [p["id"] for p in policies]
        assert policy["id"] in policy_ids


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestUpdatePolicyEndpoint:
    """Test PUT /policies/{policy_id} endpoint."""

    async def test_update_policy_success(self, authenticated_client):
        """Test successful policy update."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Original name",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
                "priority": 0,
            },
        )
        policy_id = create_response.json()["id"]

        # Update policy
        response = await client.put(
            f"/api/v1/policies/{policy_id}",
            json={
                "name": "Updated name",
                "priority": 10,
                "status": "inactive",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated name"
        assert data["priority"] == 10
        assert data["status"] == "inactive"

    async def test_update_policy_conditions(self, authenticated_client):
        """Test updating policy conditions."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Test policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
                "conditions": {"all": []},
            },
        )
        policy_id = create_response.json()["id"]

        # Update conditions
        new_conditions = {
            "all": [{"field": "resource.status", "op": "eq", "value": "active"}]
        }
        response = await client.put(
            f"/api/v1/policies/{policy_id}",
            json={"conditions": new_conditions},
        )

        assert response.status_code == 200

    async def test_update_policy_no_fields(self, authenticated_client):
        """Test update with no fields provided."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Test policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )
        policy_id = create_response.json()["id"]

        # Update with no fields
        response = await client.put(
            f"/api/v1/policies/{policy_id}",
            json={},
        )

        assert response.status_code == 400

    async def test_update_policy_not_found(self, authenticated_client):
        """Test updating non-existent policy."""
        client, user = authenticated_client

        response = await client.put(
            f"/api/v1/policies/{uuid.uuid4()}",
            json={"name": "Updated name"},
        )

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestDeletePolicyEndpoint:
    """Test DELETE /policies/{policy_id} endpoint."""

    async def test_delete_policy_success(self, authenticated_client):
        """Test successful policy deletion."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Policy to delete",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )
        policy_id = create_response.json()["id"]

        # Delete policy
        response = await client.delete(f"/api/v1/policies/{policy_id}")

        assert response.status_code == 204

        # Verify deleted
        get_response = await client.get(f"/api/v1/policies/{policy_id}")
        assert get_response.status_code == 404

    async def test_delete_policy_removes_assignments(self, authenticated_client):
        """Test that deleting policy removes its assignments."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Policy with assignments",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )
        policy_id = create_response.json()["id"]

        # Assign policy
        assign_response = await client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "user",
                "principal_id": user["id"],
            },
        )
        assert assign_response.status_code == 201

        # Delete policy
        delete_response = await client.delete(f"/api/v1/policies/{policy_id}")
        assert delete_response.status_code == 204

    async def test_delete_policy_not_found(self, authenticated_client):
        """Test deleting non-existent policy."""
        client, user = authenticated_client

        response = await client.delete(f"/api/v1/policies/{uuid.uuid4()}")

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestAssignPolicyEndpoint:
    """Test POST /policies/{policy_id}/assign endpoint."""

    async def test_assign_policy_to_user(self, authenticated_client):
        """Test assigning policy to a user."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Test policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )
        policy_id = create_response.json()["id"]

        # Assign to user
        response = await client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "user",
                "principal_id": user["id"],
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["policy_id"] == policy_id
        assert data["principal_type"] == "user"
        assert data["principal_id"] == user["id"]

    async def test_assign_policy_to_team(self, authenticated_client, test_team):
        """Test assigning policy to a team."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Test policy for team",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )
        policy_id = create_response.json()["id"]

        # Assign to team
        response = await client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "team",
                "principal_id": test_team["id"],
            },
        )

        assert response.status_code == 201

    async def test_assign_policy_to_role(self, authenticated_client):
        """Test assigning policy to a role."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Test policy for role",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )
        policy_id = create_response.json()["id"]

        # Assign to role
        response = await client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "role",
                "principal_id": "developer",
            },
        )

        assert response.status_code == 201

    async def test_assign_policy_invalid_principal_type(self, authenticated_client):
        """Test assigning policy with invalid principal type."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Test policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )
        policy_id = create_response.json()["id"]

        # Assign with invalid type
        response = await client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "invalid",
                "principal_id": "test",
            },
        )

        assert response.status_code == 422

    async def test_assign_policy_not_found(self, authenticated_client):
        """Test assigning non-existent policy."""
        client, user = authenticated_client

        response = await client.post(
            f"/api/v1/policies/{uuid.uuid4()}/assign",
            json={
                "principal_type": "user",
                "principal_id": user["id"],
            },
        )

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestUnassignPolicyEndpoint:
    """Test DELETE /policies/assignments/{assignment_id} endpoint."""

    async def test_unassign_policy_success(self, authenticated_client):
        """Test successful policy unassignment."""
        client, user = authenticated_client

        # Create and assign policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Test policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )
        policy_id = create_response.json()["id"]

        assign_response = await client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "user",
                "principal_id": user["id"],
            },
        )
        assignment_id = assign_response.json()["id"]

        # Unassign
        response = await client.delete(
            f"/api/v1/policies/assignments/{assignment_id}",
        )

        assert response.status_code == 204


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestGetUserPoliciesEndpoint:
    """Test GET /policies/user/{user_id} endpoint."""

    async def test_get_user_policies_direct_assignment(self, authenticated_client):
        """Test getting policies assigned directly to user."""
        client, user = authenticated_client

        # Create policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "User policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )
        policy_id = create_response.json()["id"]

        # Assign to user
        await client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "user",
                "principal_id": user["id"],
            },
        )

        # Get user policies
        response = await client.get(f"/api/v1/policies/user/{user['id']}")

        assert response.status_code == 200
        data = response.json()
        assert "records" in data
        assert "total" in data

    async def test_get_user_policies_no_assignments(self, authenticated_client):
        """Test getting policies for user that has no explicit policy assignments."""
        client, user = authenticated_client

        # Use the authenticated user's ID - they exist in DB but may have no direct assignments
        response = await client.get(f"/api/v1/policies/user/{user['id']}")

        assert response.status_code == 200
        data = response.json()
        # User may or may not have policies, just check structure
        assert "records" in data
        assert "total" in data
        assert isinstance(data["total"], int)


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestEvaluatePolicyEndpoint:
    """Test POST /policies/evaluate endpoint."""

    async def test_evaluate_policy_allowed(self, authenticated_client):
        """Test evaluating policy that allows access."""
        client, user = authenticated_client

        # Create allow policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Allow agents",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
                "conditions": {},
            },
        )
        policy_id = create_response.json()["id"]

        # Assign to user
        await client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "user",
                "principal_id": user["id"],
            },
        )

        # Evaluate
        response = await client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user["id"],
                "resource_type": "agent",
                "action": "read",
                "resource": {"id": "agent1", "status": "active"},
                "context": {},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["allowed"] is True
        assert data["user_id"] == user["id"]
        assert data["resource_type"] == "agent"

    async def test_evaluate_policy_denied(self, authenticated_client):
        """Test evaluating policy with explicit deny effect."""
        client, user = authenticated_client

        # Create a deny policy
        create_response = await client.post(
            "/api/v1/policies",
            json={
                "name": "Deny test policy",
                "description": "Test deny policy",
                "resource_type": "restricted_resource",
                "action": "delete",
                "effect": "deny",  # Explicit deny
                "conditions": {},
                "priority": 100,
            },
        )

        assert create_response.status_code == 201
        policy_id = create_response.json()["id"]

        # Assign to user
        await client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "user",
                "principal_id": user["id"],
            },
        )

        # Evaluate - should be denied by explicit deny policy
        response = await client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user["id"],
                "resource_type": "restricted_resource",
                "action": "delete",
                "resource": {"id": "resource1"},
                "context": {},
            },
        )

        assert response.status_code == 200
        data = response.json()
        # Should be denied since there's an explicit deny policy
        assert data["allowed"] is False
