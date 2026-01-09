"""
Tier 2: Reference Management API Integration Tests

Tests policy condition validation and reference checking endpoints
with real database and DataFlow operations.

NO MOCKING - uses real PostgreSQL and async DataFlow workflows.

Test Coverage:
- POST /api/v1/policies/validate-conditions endpoint
- GET /api/v1/policies/{id}/references endpoint
- Reference validation with real resources
- Error handling and edge cases
"""

import json
import uuid

import pytest
from httpx import AsyncClient


async def create_test_agent(client, user):
    """Helper to create a test agent with proper API format.

    Creates a workspace first, then creates an agent in that workspace.
    """
    # Create a workspace first
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={
            "name": f"Test Workspace {uuid.uuid4().hex[:8]}",
            "workspace_type": "permanent",
            "description": "Workspace for reference validation test",
        },
    )
    if workspace_response.status_code != 201:
        raise AssertionError(f"Failed to create workspace: {workspace_response.json()}")
    workspace = workspace_response.json()

    # Create an agent in the workspace
    agent_response = await client.post(
        "/api/v1/agents",
        json={
            "workspace_id": workspace["id"],
            "name": f"Test Agent {uuid.uuid4().hex[:8]}",
            "agent_type": "chat",
            "model_id": "gpt-4",
            "description": "Agent for reference validation test",
        },
    )
    if agent_response.status_code != 201:
        raise AssertionError(f"Failed to create agent: {agent_response.json()}")

    return agent_response.json()


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestValidateConditionsEndpoint:
    """Test POST /api/v1/policies/validate-conditions endpoint."""

    async def test_validate_empty_conditions(self, authenticated_client):
        """Test validating empty conditions."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/policies/validate-conditions",
            json={"conditions": []},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert data["errors"] == []
        assert data["warnings"] == []
        assert data["references"] == []

    async def test_validate_simple_conditions(self, authenticated_client):
        """Test validating simple conditions without references."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/policies/validate-conditions",
            json={
                "conditions": [
                    {"attribute": "resource.status", "operator": "equals", "value": "active"},
                    {"attribute": "user.role", "operator": "in", "value": ["admin", "editor"]},
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert data["references"] == []

    async def test_validate_conditions_with_valid_agent_reference(self, authenticated_client):
        """Test validating conditions with reference to existing agent."""
        client, user = authenticated_client

        # First create an agent (using helper that creates workspace + agent)
        agent = await create_test_agent(client, user)

        # Now validate conditions referencing this agent
        response = await client.post(
            "/api/v1/policies/validate-conditions",
            json={
                "conditions": [
                    {
                        "attribute": "resource.agent_id",
                        "operator": "equals",
                        "value": {
                            "$ref": "resource",
                            "type": "agent",
                            "selector": {"id": agent["id"]},
                            "display": {"name": agent["name"]},
                        },
                    }
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert len(data["references"]) == 1
        assert data["references"][0]["status"] == "valid"
        assert data["references"][0]["type"] == "agent"

    async def test_validate_conditions_with_orphaned_reference(self, authenticated_client):
        """Test validating conditions with reference to deleted resource."""
        client, user = authenticated_client

        # Use a random ID that doesn't exist
        fake_agent_id = str(uuid.uuid4())

        response = await client.post(
            "/api/v1/policies/validate-conditions",
            json={
                "conditions": [
                    {
                        "attribute": "resource.agent_id",
                        "operator": "equals",
                        "value": {
                            "$ref": "resource",
                            "type": "agent",
                            "selector": {"id": fake_agent_id},
                            "display": {"name": "Deleted Agent"},
                        },
                    }
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True  # Still valid, but with warnings
        assert len(data["warnings"]) >= 1
        assert len(data["references"]) == 1
        assert data["references"][0]["status"] == "orphaned"

    async def test_validate_conditions_with_multiple_references(self, authenticated_client):
        """Test validating conditions with multiple resource references."""
        client, user = authenticated_client

        # Create two agents using helper
        agents = []
        for i in range(2):
            agent = await create_test_agent(client, user)
            agents.append(agent)

        # Validate conditions with both references
        response = await client.post(
            "/api/v1/policies/validate-conditions",
            json={
                "conditions": [
                    {
                        "attribute": "resource.agent_id",
                        "operator": "in",
                        "value": [
                            {
                                "$ref": "resource",
                                "type": "agent",
                                "selector": {"id": agents[0]["id"]},
                                "display": {"name": agents[0]["name"]},
                            },
                            {
                                "$ref": "resource",
                                "type": "agent",
                                "selector": {"id": agents[1]["id"]},
                                "display": {"name": agents[1]["name"]},
                            },
                        ],
                    }
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert len(data["references"]) == 2
        assert all(ref["status"] == "valid" for ref in data["references"])

    async def test_validate_conditions_with_team_reference(self, authenticated_client, test_team):
        """Test validating conditions with team reference."""
        client, user = authenticated_client

        response = await client.post(
            "/api/v1/policies/validate-conditions",
            json={
                "conditions": [
                    {
                        "attribute": "resource.team_id",
                        "operator": "equals",
                        "value": {
                            "$ref": "resource",
                            "type": "team",
                            "selector": {"id": test_team["id"]},
                            "display": {"name": test_team["name"]},
                        },
                    }
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert len(data["references"]) == 1
        assert data["references"][0]["type"] == "team"
        assert data["references"][0]["status"] == "valid"

    async def test_validate_conditions_mixed_valid_and_orphaned(self, authenticated_client):
        """Test validating conditions with mix of valid and orphaned references."""
        client, user = authenticated_client

        # Create one agent using helper
        valid_agent = await create_test_agent(client, user)

        fake_agent_id = str(uuid.uuid4())

        response = await client.post(
            "/api/v1/policies/validate-conditions",
            json={
                "conditions": [
                    {
                        "attribute": "resource.agent_id",
                        "operator": "in",
                        "value": [
                            {
                                "$ref": "resource",
                                "type": "agent",
                                "selector": {"id": valid_agent["id"]},
                                "display": {"name": valid_agent["name"]},
                            },
                            {
                                "$ref": "resource",
                                "type": "agent",
                                "selector": {"id": fake_agent_id},
                                "display": {"name": "Orphaned Agent"},
                            },
                        ],
                    }
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["references"]) == 2
        valid_refs = [r for r in data["references"] if r["status"] == "valid"]
        orphaned_refs = [r for r in data["references"] if r["status"] == "orphaned"]
        assert len(valid_refs) == 1
        assert len(orphaned_refs) == 1

    async def test_validate_conditions_requires_authentication(self, test_client: AsyncClient):
        """Test that validation requires authentication."""
        response = await test_client.post(
            "/api/v1/policies/validate-conditions",
            json={"conditions": []},
        )

        assert response.status_code in [401, 403]


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestGetPolicyReferencesEndpoint:
    """Test GET /api/v1/policies/{id}/references endpoint."""

    async def test_get_references_for_policy_without_references(self, authenticated_client):
        """Test getting references for policy with no resource references."""
        client, user = authenticated_client

        # Create policy with simple conditions (no refs)
        policy_response = await client.post(
            "/api/v1/policies",
            json={
                "name": f"No Refs Policy {uuid.uuid4().hex[:8]}",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
                "conditions": {
                    "all": [{"field": "resource.status", "op": "eq", "value": "active"}]
                },
            },
        )
        assert policy_response.status_code == 201
        policy = policy_response.json()

        # Get references
        response = await client.get(f"/api/v1/policies/{policy['id']}/references")

        assert response.status_code == 200
        data = response.json()
        assert data["policy_id"] == policy["id"]
        assert data["references"] == []
        assert "validated_at" in data

    async def test_get_references_for_policy_with_references(self, authenticated_client):
        """Test getting references for policy with resource references."""
        client, user = authenticated_client

        # Create an agent using helper
        agent = await create_test_agent(client, user)

        # Create policy referencing the agent
        policy_response = await client.post(
            "/api/v1/policies",
            json={
                "name": f"With Refs Policy {uuid.uuid4().hex[:8]}",
                "resource_type": "agent",
                "action": "update",
                "effect": "allow",
                "conditions": {
                    "all": [
                        {
                            "field": "resource.id",
                            "op": "eq",
                            "value": {
                                "$ref": "resource",
                                "type": "agent",
                                "selector": {"id": agent["id"]},
                                "display": {"name": agent["name"]},
                            },
                        }
                    ]
                },
            },
        )
        assert policy_response.status_code == 201
        policy = policy_response.json()

        # Get references
        response = await client.get(f"/api/v1/policies/{policy['id']}/references")

        assert response.status_code == 200
        data = response.json()
        assert data["policy_id"] == policy["id"]
        assert len(data["references"]) == 1
        assert data["references"][0]["type"] == "agent"
        assert data["references"][0]["id"] == agent["id"]
        assert data["references"][0]["status"] == "valid"

    async def test_get_references_for_policy_with_orphaned_reference(self, authenticated_client):
        """Test getting references after referenced resource is deleted.

        Note: Soft-delete (archive) still keeps the agent in DB, so it shows as 'valid'.
        True orphaned references are detected using a non-existent ID.
        """
        client, user = authenticated_client

        # Use a fake agent ID that doesn't exist to test orphaned detection
        fake_agent_id = str(uuid.uuid4())

        # Create policy referencing the non-existent agent
        policy_response = await client.post(
            "/api/v1/policies",
            json={
                "name": f"Orphan Ref Policy {uuid.uuid4().hex[:8]}",
                "resource_type": "agent",
                "action": "update",
                "effect": "allow",
                "conditions": {
                    "all": [
                        {
                            "field": "resource.id",
                            "op": "eq",
                            "value": {
                                "$ref": "resource",
                                "type": "agent",
                                "selector": {"id": fake_agent_id},
                                "display": {"name": "Deleted Agent"},
                            },
                        }
                    ]
                },
            },
        )
        assert policy_response.status_code == 201
        policy = policy_response.json()

        # Get references - should show orphaned since agent doesn't exist
        response = await client.get(f"/api/v1/policies/{policy['id']}/references")

        assert response.status_code == 200
        data = response.json()
        assert len(data["references"]) == 1
        assert data["references"][0]["status"] == "orphaned"

    async def test_get_references_nonexistent_policy(self, authenticated_client):
        """Test getting references for non-existent policy."""
        client, user = authenticated_client

        fake_policy_id = str(uuid.uuid4())
        response = await client.get(f"/api/v1/policies/{fake_policy_id}/references")

        assert response.status_code == 404

    async def test_get_references_requires_authentication(self, test_client: AsyncClient):
        """Test that getting references requires authentication."""
        fake_policy_id = str(uuid.uuid4())
        response = await test_client.get(f"/api/v1/policies/{fake_policy_id}/references")

        assert response.status_code in [401, 403]

    async def test_get_references_response_structure(self, authenticated_client):
        """Test that references response has correct structure."""
        client, user = authenticated_client

        # Create policy
        policy_response = await client.post(
            "/api/v1/policies",
            json={
                "name": f"Structure Test Policy {uuid.uuid4().hex[:8]}",
                "resource_type": "agent",
                "action": "read",
                "effect": "allow",
            },
        )
        assert policy_response.status_code == 201
        policy = policy_response.json()

        # Get references
        response = await client.get(f"/api/v1/policies/{policy['id']}/references")

        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "policy_id" in data
        assert "references" in data
        assert "validated_at" in data
        assert isinstance(data["references"], list)


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestReferenceValidationWithDifferentResourceTypes:
    """Test reference validation with different resource types."""

    async def test_validate_deployment_reference(self, authenticated_client):
        """Test validating reference to a deployment."""
        client, user = authenticated_client

        # Create an agent using helper (required for deployment)
        agent = await create_test_agent(client, user)

        # Create a gateway (required for deployment)
        gateway_response = await client.post(
            "/api/v1/gateways",
            json={
                "name": f"Deployment Test Gateway {uuid.uuid4().hex[:8]}",
                "api_url": "https://api.test.com",
                "api_key": "test-key-12345",
                "environment": "staging",
            },
        )
        assert gateway_response.status_code in [200, 201]
        gateway = gateway_response.json()

        # Create a deployment
        deployment_response = await client.post(
            "/api/v1/deployments",
            json={
                "agent_id": agent["id"],
                "gateway_id": gateway["id"],
            },
        )
        assert deployment_response.status_code in [200, 201]
        deployment = deployment_response.json()

        # Validate condition with deployment reference
        response = await client.post(
            "/api/v1/policies/validate-conditions",
            json={
                "conditions": [
                    {
                        "attribute": "resource.deployment_id",
                        "operator": "equals",
                        "value": {
                            "$ref": "resource",
                            "type": "deployment",
                            "selector": {"id": deployment["id"]},
                            "display": {"name": f"Deployment {deployment['id'][:8]}"},
                        },
                    }
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["references"]) == 1
        assert data["references"][0]["type"] == "deployment"
        assert data["references"][0]["status"] == "valid"

    async def test_validate_pipeline_reference(self, authenticated_client):
        """Test validating reference to a pipeline."""
        client, user = authenticated_client

        # Create a workspace first
        workspace_response = await client.post(
            "/api/v1/workspaces",
            json={
                "name": f"Pipeline Test Workspace {uuid.uuid4().hex[:8]}",
                "workspace_type": "permanent",
            },
        )
        assert workspace_response.status_code in [200, 201]
        workspace = workspace_response.json()

        # Create a pipeline
        pipeline_response = await client.post(
            "/api/v1/pipelines",
            json={
                "organization_id": user["organization_id"],
                "workspace_id": workspace["id"],
                "name": f"Reference Test Pipeline {uuid.uuid4().hex[:8]}",
                "pattern": "sequential",
                "description": "Pipeline for reference test",
            },
        )
        assert pipeline_response.status_code in [200, 201]
        pipeline_data = pipeline_response.json()
        # Pipeline API returns {"data": pipeline}
        pipeline = pipeline_data.get("data", pipeline_data)

        # Validate condition with pipeline reference
        response = await client.post(
            "/api/v1/policies/validate-conditions",
            json={
                "conditions": [
                    {
                        "attribute": "resource.pipeline_id",
                        "operator": "equals",
                        "value": {
                            "$ref": "resource",
                            "type": "pipeline",
                            "selector": {"id": pipeline["id"]},
                            "display": {"name": pipeline["name"]},
                        },
                    }
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["references"]) == 1
        assert data["references"][0]["type"] == "pipeline"
        assert data["references"][0]["status"] == "valid"

    async def test_validate_gateway_reference(self, authenticated_client):
        """Test validating reference to a gateway."""
        client, user = authenticated_client

        # Create a gateway
        gateway_response = await client.post(
            "/api/v1/gateways",
            json={
                "name": f"Reference Test Gateway {uuid.uuid4().hex[:8]}",
                "description": "Gateway for reference test",
                "api_url": "https://gateway.test.com/api",
                "api_key": "test-gateway-key-12345",
            },
        )
        assert gateway_response.status_code in [200, 201]
        gateway = gateway_response.json()

        # Validate condition with gateway reference
        response = await client.post(
            "/api/v1/policies/validate-conditions",
            json={
                "conditions": [
                    {
                        "attribute": "resource.gateway_id",
                        "operator": "equals",
                        "value": {
                            "$ref": "resource",
                            "type": "gateway",
                            "selector": {"id": gateway["id"]},
                            "display": {"name": gateway["name"]},
                        },
                    }
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["references"]) == 1
        assert data["references"][0]["type"] == "gateway"
        assert data["references"][0]["status"] == "valid"

    async def test_validate_user_reference(self, authenticated_client):
        """Test validating reference to a user."""
        client, user = authenticated_client

        # Validate condition with user reference (use authenticated user)
        response = await client.post(
            "/api/v1/policies/validate-conditions",
            json={
                "conditions": [
                    {
                        "attribute": "resource.owner_id",
                        "operator": "equals",
                        "value": {
                            "$ref": "resource",
                            "type": "user",
                            "selector": {"id": user["id"]},
                            "display": {"name": user.get("name", "Test User")},
                        },
                    }
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["references"]) == 1
        assert data["references"][0]["type"] == "user"
        assert data["references"][0]["status"] == "valid"
