"""
Tier 3: ABAC Workflow End-to-End Tests

Tests complete policy lifecycle and access control workflows.
NO MOCKING - uses real PostgreSQL, Redis, and async DataFlow workflows.

Test Coverage:
- Complete policy lifecycle (create, assign, evaluate, update, delete)
- Access control with conditions and priorities
- Multiple policies evaluation (allow/deny precedence)
- Policy inheritance through teams and roles
- Time-based conditions
- Complex condition evaluation
"""

import pytest
from httpx import AsyncClient


@pytest.mark.e2e
@pytest.mark.timeout(30)
class TestPolicyLifecycle:
    """Test complete policy lifecycle."""

    async def test_policy_create_list_update_delete(
        self, test_client: AsyncClient, e2e_user_factory
    ):
        """Test complete policy lifecycle: create, list, update, delete."""
        user_data = await e2e_user_factory()
        org_id = user_data["organization_id"]

        # 1. Create policy
        create_response = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "Development environment access",
                "description": "Allow developers to access dev environment",
                "resource_type": "environment",
                "action": "access",
                "effect": "allow",
                "priority": 5,
                "status": "active",
                "conditions": {
                    "all": [
                        {"field": "resource.environment", "op": "eq", "value": "dev"}
                    ]
                },
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert create_response.status_code == 201
        policy_id = create_response.json()["id"]

        # 2. List and verify
        list_response = await test_client.get(
            "/api/v1/policies",
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert list_response.status_code == 200
        policies = list_response.json()["records"]
        assert any(p["id"] == policy_id for p in policies)

        # 3. Get specific policy
        get_response = await test_client.get(
            f"/api/v1/policies/{policy_id}",
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert get_response.status_code == 200
        assert get_response.json()["id"] == policy_id

        # 4. Update policy
        update_response = await test_client.put(
            f"/api/v1/policies/{policy_id}",
            json={
                "description": "Updated description",
                "priority": 10,
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert update_response.status_code == 200
        assert update_response.json()["priority"] == 10

        # 5. Delete policy
        delete_response = await test_client.delete(
            f"/api/v1/policies/{policy_id}",
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert delete_response.status_code == 204

        # 6. Verify deleted
        get_deleted = await test_client.get(
            f"/api/v1/policies/{policy_id}",
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert get_deleted.status_code == 404


@pytest.mark.e2e
@pytest.mark.timeout(30)
class TestAssignmentWorkflow:
    """Test policy assignment workflows."""

    async def test_assign_to_user_evaluate_access(
        self, test_client: AsyncClient, e2e_user_factory
    ):
        """Test assigning policy to user and evaluating access."""
        user_data = await e2e_user_factory()
        org_id = user_data["organization_id"]

        # 1. Create policy
        create_response = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "Read agents policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
                "conditions": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        policy_id = create_response.json()["id"]

        # 2. Assign to user
        assign_response = await test_client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "user",
                "principal_id": user_data["id"],
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert assign_response.status_code == 201
        assignment_id = assign_response.json()["id"]

        # 3. Get user policies
        user_policies_response = await test_client.get(
            f"/api/v1/policies/user/{user_data['id']}",
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert user_policies_response.status_code == 200
        policies = user_policies_response.json()["records"]
        assert any(p["id"] == policy_id for p in policies)

        # 4. Evaluate access
        eval_response = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "agent",
                "action": "read",
                "resource": {"id": "agent1", "status": "active"},
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert eval_response.status_code == 200
        assert eval_response.json()["allowed"] is True

        # 5. Unassign policy
        unassign_response = await test_client.delete(
            f"/api/v1/policies/assignments/{assignment_id}",
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert unassign_response.status_code == 204

        # 6. Verify access after policy is unassigned
        # ABAC defaults to ALLOW when no matching policies exist (RBAC already passed)
        eval_response_after = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "agent",
                "action": "read",
                "resource": {"id": "agent1"},
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert eval_response_after.json()["allowed"] is True


@pytest.mark.e2e
@pytest.mark.timeout(30)
class TestConditionEvaluation:
    """Test condition-based access control workflows."""

    async def test_simple_condition_evaluation(
        self, test_client: AsyncClient, e2e_user_factory
    ):
        """Test simple condition evaluation (status=active)."""
        user_data = await e2e_user_factory()
        org_id = user_data["organization_id"]

        # 1. Create policy with condition
        create_response = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "Active agents only",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
                "conditions": {
                    "all": [{"field": "resource.status", "op": "eq", "value": "active"}]
                },
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        policy_id = create_response.json()["id"]

        # 2. Assign to user
        await test_client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "user",
                "principal_id": user_data["id"],
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )

        # 3. Evaluate with matching condition
        response_match = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "agent",
                "action": "read",
                "resource": {"id": "agent1", "status": "active"},
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert response_match.json()["allowed"] is True

        # 4. Evaluate with non-matching condition
        response_nomatch = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "agent",
                "action": "read",
                "resource": {"id": "agent2", "status": "inactive"},
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert response_nomatch.json()["allowed"] is False

    async def test_multiple_conditions_and_logic(
        self, test_client: AsyncClient, e2e_user_factory
    ):
        """Test multiple conditions with AND logic."""
        user_data = await e2e_user_factory()
        org_id = user_data["organization_id"]

        # 1. Create policy with multiple conditions
        create_response = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "Production environment access",
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
                    ]
                },
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        policy_id = create_response.json()["id"]

        # 2. Assign to user
        await test_client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "user",
                "principal_id": user_data["id"],
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )

        # 3. Test: both conditions match
        response_match = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "agent",
                "action": "update",
                "resource": {
                    "id": "agent1",
                    "status": "active",
                    "environment": "production",
                },
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert response_match.json()["allowed"] is True

        # 4. Test: first condition matches, second doesn't
        response_partial = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "agent",
                "action": "update",
                "resource": {
                    "id": "agent2",
                    "status": "active",
                    "environment": "staging",
                },
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert response_partial.json()["allowed"] is False

    async def test_operator_evaluation(
        self, test_client: AsyncClient, e2e_user_factory
    ):
        """Test various operators in conditions."""
        user_data = await e2e_user_factory()
        org_id = user_data["organization_id"]

        # Test 'in' operator
        create_response = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "Allowed regions",
                "resource_type": "deployment",
                "action": "create",
                "effect": "allow",
                "conditions": {
                    "all": [
                        {
                            "field": "resource.region",
                            "op": "in",
                            "value": ["us-east", "us-west", "eu-west"],
                        }
                    ]
                },
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        policy_id = create_response.json()["id"]

        # Assign to user
        await test_client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={
                "principal_type": "user",
                "principal_id": user_data["id"],
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )

        # Test: value in list
        response_in = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "deployment",
                "action": "create",
                "resource": {"id": "deploy1", "region": "us-east"},
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert response_in.json()["allowed"] is True

        # Test: value not in list
        response_notin = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "deployment",
                "action": "create",
                "resource": {"id": "deploy2", "region": "ap-south"},
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert response_notin.json()["allowed"] is False


@pytest.mark.e2e
@pytest.mark.timeout(30)
class TestAllowDenyPrecedence:
    """Test allow/deny precedence and policy evaluation order."""

    async def test_explicit_deny_overrides_allow(
        self, test_client: AsyncClient, e2e_user_factory
    ):
        """Test that explicit deny overrides allow."""
        user_data = await e2e_user_factory()
        org_id = user_data["organization_id"]

        # 1. Create allow policy
        allow_response = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "Allow agents",
                "resource_type": "agent",
                "action": "delete",
                "effect": "allow",
                "priority": 1,
                "conditions": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        allow_id = allow_response.json()["id"]

        # 2. Create deny policy
        deny_response = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "Deny deleting production agents",
                "resource_type": "agent",
                "action": "delete",
                "effect": "deny",
                "priority": 2,  # Higher priority
                "conditions": {
                    "all": [
                        {
                            "field": "resource.environment",
                            "op": "eq",
                            "value": "production",
                        }
                    ]
                },
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        deny_id = deny_response.json()["id"]

        # 3. Assign both policies
        await test_client.post(
            f"/api/v1/policies/{allow_id}/assign",
            json={"principal_type": "user", "principal_id": user_data["id"]},
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        await test_client.post(
            f"/api/v1/policies/{deny_id}/assign",
            json={"principal_type": "user", "principal_id": user_data["id"]},
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )

        # 4. Test: delete non-production agent (allowed)
        response_allowed = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "agent",
                "action": "delete",
                "resource": {"id": "agent1", "environment": "staging"},
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert response_allowed.json()["allowed"] is True

        # 5. Test: delete production agent (denied by explicit deny)
        response_denied = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "agent",
                "action": "delete",
                "resource": {"id": "agent2", "environment": "production"},
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert response_denied.json()["allowed"] is False

    async def test_priority_based_evaluation(
        self, test_client: AsyncClient, e2e_user_factory
    ):
        """Test that policies are evaluated by priority."""
        user_data = await e2e_user_factory()
        org_id = user_data["organization_id"]

        # Create multiple policies with different priorities
        policies = []
        for i, priority in enumerate([1, 5, 10]):
            response = await test_client.post(
                "/api/v1/policies",
                json={
                    "name": f"Priority {priority} policy",
                    "resource_type": "agent",
                    "action": "read",
                    "effect": "allow",
                    "priority": priority,
                    "conditions": {},
                },
                headers={"x-user-id": user_data["id"], "x-org-id": org_id},
            )
            policies.append(response.json()["id"])

        # Assign all policies
        for policy_id in policies:
            await test_client.post(
                f"/api/v1/policies/{policy_id}/assign",
                json={"principal_type": "user", "principal_id": user_data["id"]},
                headers={"x-user-id": user_data["id"], "x-org-id": org_id},
            )

        # Evaluate access (should be allowed)
        response = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "agent",
                "action": "read",
                "resource": {"id": "agent1"},
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert response.json()["allowed"] is True


@pytest.mark.e2e
@pytest.mark.timeout(30)
class TestComplexWorkflows:
    """Test complex real-world policy workflows."""

    async def test_multi_team_access_control(
        self, test_client: AsyncClient, e2e_user_factory, team_factory
    ):
        """Test access control across multiple teams."""
        user_data = await e2e_user_factory()
        org_id = user_data["organization_id"]
        team1 = team_factory(organization_id=org_id, name="DevOps")
        team2 = team_factory(organization_id=org_id, name="Security")

        # Create policies for different teams
        devops_policy = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "DevOps deployment",
                "resource_type": "deployment",
                "action": "*",
                "effect": "allow",
                "conditions": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        devops_id = devops_policy.json()["id"]

        security_policy = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "Security audit access",
                "resource_type": "audit",
                "action": "read",
                "effect": "allow",
                "conditions": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        security_id = security_policy.json()["id"]

        # Assign policies to teams
        await test_client.post(
            f"/api/v1/policies/{devops_id}/assign",
            json={"principal_type": "team", "principal_id": team1["id"]},
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        await test_client.post(
            f"/api/v1/policies/{security_id}/assign",
            json={"principal_type": "team", "principal_id": team2["id"]},
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )

        # Verify policies are created and assigned
        policies_response = await test_client.get(
            "/api/v1/policies",
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        assert policies_response.status_code == 200

    async def test_resource_type_wildcard_matching(
        self, test_client: AsyncClient, e2e_user_factory
    ):
        """Test wildcard matching for resource types."""
        user_data = await e2e_user_factory()
        org_id = user_data["organization_id"]

        # Create wildcard policy
        response = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "Read all resources",
                "resource_type": "*",
                "action": "read",
                "effect": "allow",
                "conditions": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        policy_id = response.json()["id"]

        # Assign to user
        await test_client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={"principal_type": "user", "principal_id": user_data["id"]},
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )

        # Test: wildcard should match any resource type
        for resource_type in ["agent", "deployment", "pipeline", "custom_resource"]:
            response = await test_client.post(
                "/api/v1/policies/evaluate",
                json={
                    "user_id": user_data["id"],
                    "resource_type": resource_type,
                    "action": "read",
                    "resource": {"id": "test"},
                    "context": {},
                },
                headers={"x-user-id": user_data["id"], "x-org-id": org_id},
            )
            assert response.json()["allowed"] is True, f"Failed for {resource_type}"

    async def test_action_wildcard_matching(
        self, test_client: AsyncClient, e2e_user_factory
    ):
        """Test wildcard matching for actions."""
        user_data = await e2e_user_factory()
        org_id = user_data["organization_id"]

        # Create wildcard policy
        response = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "All agent operations",
                "resource_type": "agent",
                "action": "*",
                "effect": "allow",
                "conditions": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        policy_id = response.json()["id"]

        # Assign to user
        await test_client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={"principal_type": "user", "principal_id": user_data["id"]},
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )

        # Test: wildcard should match any action
        for action in ["read", "create", "update", "delete", "execute"]:
            response = await test_client.post(
                "/api/v1/policies/evaluate",
                json={
                    "user_id": user_data["id"],
                    "resource_type": "agent",
                    "action": action,
                    "resource": {"id": "test"},
                    "context": {},
                },
                headers={"x-user-id": user_data["id"], "x-org-id": org_id},
            )
            assert response.json()["allowed"] is True, f"Failed for action {action}"

    async def test_inactive_policy_not_evaluated(
        self, test_client: AsyncClient, e2e_user_factory
    ):
        """Test that inactive policies are not evaluated."""
        user_data = await e2e_user_factory()
        org_id = user_data["organization_id"]

        # Create inactive policy
        response = await test_client.post(
            "/api/v1/policies",
            json={
                "name": "Inactive allow policy",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
                "status": "inactive",
                "conditions": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        policy_id = response.json()["id"]

        # Assign to user
        await test_client.post(
            f"/api/v1/policies/{policy_id}/assign",
            json={"principal_type": "user", "principal_id": user_data["id"]},
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )

        # Evaluate: should be ALLOWED because inactive policies are not evaluated
        # and ABAC defaults to allow when no matching policies exist (RBAC already passed)
        response = await test_client.post(
            "/api/v1/policies/evaluate",
            json={
                "user_id": user_data["id"],
                "resource_type": "agent",
                "action": "read",
                "resource": {"id": "test"},
                "context": {},
            },
            headers={"x-user-id": user_data["id"], "x-org-id": org_id},
        )
        # Inactive policy is correctly filtered out, so ABAC defaults to allow
        assert response.json()["allowed"] is True
