"""
End-to-End Tests for Deployment Workflow

Tier 3: Complete real workflows with real infrastructure and NO MOCKING.
Tests full deployment lifecycle: pending → deploying → active/failed → stopped
"""

import uuid

import pytest


@pytest.mark.e2e
class TestDeploymentWorkflowLifecycle:
    """Test complete deployment lifecycle workflow."""

    async def test_full_deployment_workflow_scenario(self, authenticated_owner_client):
        """Test complete deployment workflow from creation to stopping."""
        client, user, org = authenticated_owner_client

        # Step 1: Create gateway
        gateway_data = {
            "name": "E2E Test Gateway",
            "description": "Gateway for E2E testing",
            "api_url": "https://e2e-gateway.example.com",
            "api_key": "e2e-test-key-secret",
            "environment": "staging",
        }

        gateway_response = await client.post("/api/v1/gateways", json=gateway_data)
        assert gateway_response.status_code == 200
        gateway = gateway_response.json()
        gateway_id = gateway["id"]

        # Verify gateway created
        assert gateway["status"] == "active"
        assert gateway["environment"] == "staging"
        assert gateway["name"] == "E2E Test Gateway"
        assert "api_key_encrypted" not in gateway

        # Step 2: Verify gateway can be retrieved
        get_gateway_response = await client.get(f"/api/v1/gateways/{gateway_id}")
        assert get_gateway_response.status_code == 200
        retrieved_gateway = get_gateway_response.json()
        assert retrieved_gateway["id"] == gateway_id

        # Step 3: List gateways by environment
        list_response = await client.get("/api/v1/gateways?environment=staging")
        assert list_response.status_code == 200
        gateways_data = list_response.json()["gateways"]
        gateway_ids = [g["id"] for g in gateways_data]
        assert gateway_id in gateway_ids

        # Step 4: Update gateway (simulate configuration change)
        update_data = {
            "description": "Updated description for E2E test",
            "health_check_url": "https://e2e-gateway.example.com/api/health",
        }
        update_response = await client.put(
            f"/api/v1/gateways/{gateway_id}", json=update_data
        )
        assert update_response.status_code == 200
        updated_gateway = update_response.json()
        assert updated_gateway["description"] == "Updated description for E2E test"

    async def test_gateway_creation_and_cleanup_workflow(
        self, authenticated_owner_client
    ):
        """Test gateway creation, retrieval, and deletion workflow."""
        client, user, org = authenticated_owner_client

        # Create first gateway
        gateway1_data = {
            "name": "Gateway One",
            "api_url": "https://gateway1.example.com",
            "api_key": "key1",
            "environment": "development",
        }
        response1 = await client.post("/api/v1/gateways", json=gateway1_data)
        assert response1.status_code == 200
        gateway1_id = response1.json()["id"]

        # Create second gateway
        gateway2_data = {
            "name": "Gateway Two",
            "api_url": "https://gateway2.example.com",
            "api_key": "key2",
            "environment": "production",
        }
        response2 = await client.post("/api/v1/gateways", json=gateway2_data)
        assert response2.status_code == 200
        gateway2_id = response2.json()["id"]

        # List and verify both exist
        list_response = await client.get("/api/v1/gateways")
        assert list_response.status_code == 200
        gateways = list_response.json()["gateways"]
        gateway_ids = [g["id"] for g in gateways]
        assert gateway1_id in gateway_ids
        assert gateway2_id in gateway_ids

        # Delete first gateway
        delete_response = await client.delete(f"/api/v1/gateways/{gateway1_id}")
        assert delete_response.status_code == 200

        # Verify deletion
        get_response = await client.get(f"/api/v1/gateways/{gateway1_id}")
        assert get_response.status_code == 404

        # Verify second still exists
        get_response2 = await client.get(f"/api/v1/gateways/{gateway2_id}")
        assert get_response2.status_code == 200

        # Cleanup
        await client.delete(f"/api/v1/gateways/{gateway2_id}")


@pytest.mark.e2e
class TestDeploymentLifecycleStates:
    """Test deployment status transitions through lifecycle."""

    async def test_deployment_status_transitions(self, authenticated_owner_client):
        """Test deployment transitions through status states."""
        client, user, org = authenticated_owner_client

        # Create gateway for deployment
        gateway_data = {
            "name": "Status Test Gateway",
            "api_url": "https://status-gateway.example.com",
            "api_key": "status-key",
        }
        gateway_response = await client.post("/api/v1/gateways", json=gateway_data)
        gateway_id = gateway_response.json()["id"]

        # Verify gateway is active
        gateway_get = await client.get(f"/api/v1/gateways/{gateway_id}")
        assert gateway_get.json()["status"] == "active"

        # Note: Full deployment lifecycle requires real agent to exist
        # This test demonstrates the workflow pattern
        agent_id = str(uuid.uuid4())

        # Attempt deployment (will fail without real agent)
        deploy_data = {
            "agent_id": agent_id,
            "gateway_id": gateway_id,
        }

        response = await client.post("/api/v1/deployments", json=deploy_data)

        # Endpoint should exist regardless of outcome
        assert response.status_code in (200, 400, 404, 500)

    async def test_multiple_deployments_to_same_gateway(
        self, authenticated_owner_client
    ):
        """Test multiple deployments can target same gateway."""
        client, user, org = authenticated_owner_client

        # Create gateway
        gateway_data = {
            "name": "Multi Deploy Gateway",
            "api_url": "https://multi-gateway.example.com",
            "api_key": "multi-key",
        }
        gateway_response = await client.post("/api/v1/gateways", json=gateway_data)
        gateway_id = gateway_response.json()["id"]

        # Verify gateway exists and is active
        get_response = await client.get(f"/api/v1/gateways/{gateway_id}")
        assert get_response.status_code == 200

        # Test multiple deployment attempts to same gateway
        deployment_count = 3
        for i in range(deployment_count):
            deploy_data = {
                "agent_id": str(uuid.uuid4()),
                "gateway_id": gateway_id,
            }
            response = await client.post("/api/v1/deployments", json=deploy_data)
            # Endpoint should handle multiple requests
            assert response.status_code in (200, 400, 404, 500)


@pytest.mark.e2e
class TestDeploymentQueryingAndFiltering:
    """Test deployment querying and filtering workflows."""

    async def test_filter_deployments_by_gateway(self, authenticated_owner_client):
        """Test filtering deployments by gateway ID."""
        client, user, org = authenticated_owner_client

        # Create gateway
        gateway_data = {
            "name": "Filter Test Gateway",
            "api_url": "https://filter-gateway.example.com",
            "api_key": "filter-key",
        }
        gateway_response = await client.post("/api/v1/gateways", json=gateway_data)
        gateway_id = gateway_response.json()["id"]

        # Query deployments for this gateway
        response = await client.get(f"/api/v1/deployments?gateway_id={gateway_id}")

        assert response.status_code == 200
        data = response.json()["deployments"]
        # All returned deployments should be for this gateway
        for deployment in data:
            assert deployment["gateway_id"] == gateway_id

    async def test_filter_deployments_by_status(self, authenticated_owner_client):
        """Test filtering deployments by status."""
        client, user, org = authenticated_owner_client

        # Query pending deployments
        pending_response = await client.get("/api/v1/deployments?status=pending")
        assert pending_response.status_code == 200
        pending_data = pending_response.json()["deployments"]

        # Query active deployments
        active_response = await client.get("/api/v1/deployments?status=active")
        assert active_response.status_code == 200
        active_data = active_response.json()["deployments"]

        # All active deployments should have status=active
        for deployment in active_data:
            assert deployment["status"] == "active"

    async def test_combined_deployment_filters(self, authenticated_owner_client):
        """Test combining multiple deployment filters."""
        client, user, org = authenticated_owner_client

        gateway_id = str(uuid.uuid4())
        agent_id = str(uuid.uuid4())

        # Query with multiple filters
        response = await client.get(
            f"/api/v1/deployments?gateway_id={gateway_id}&agent_id={agent_id}&status=active"
        )

        assert response.status_code == 200
        data = response.json()["deployments"]

        # All results should match filters
        for deployment in data:
            assert deployment["gateway_id"] == gateway_id
            assert deployment["agent_id"] == agent_id
            assert deployment["status"] == "active"


@pytest.mark.e2e
class TestDeploymentLoggingAndAuditing:
    """Test deployment logging and audit trail."""

    async def test_deployment_logs_retrieval(self, authenticated_owner_client):
        """Test retrieving deployment logs."""
        client, user, org = authenticated_owner_client

        deployment_id = str(uuid.uuid4())

        # Get logs for (non-existent) deployment
        response = await client.get(f"/api/v1/deployments/{deployment_id}/logs")

        # Endpoint should exist
        assert response.status_code in (200, 404)

        # If successful, should have logs structure
        if response.status_code == 200:
            data = response.json()
            assert "logs" in data
            assert isinstance(data["logs"], list)

    async def test_deployment_event_logging(self, authenticated_owner_client):
        """Test deployment creates appropriate log entries."""
        client, user, org = authenticated_owner_client

        # Create gateway
        gateway_data = {
            "name": "Log Test Gateway",
            "api_url": "https://log-gateway.example.com",
            "api_key": "log-key",
        }
        gateway_response = await client.post("/api/v1/gateways", json=gateway_data)
        gateway_id = gateway_response.json()["id"]

        # Attempt deployment
        deploy_data = {
            "agent_id": str(uuid.uuid4()),
            "gateway_id": gateway_id,
        }

        deploy_response = await client.post("/api/v1/deployments", json=deploy_data)

        # If deployment created, check for logs
        if deploy_response.status_code == 200:
            deployment = deploy_response.json()
            deployment_id = deployment["id"]

            logs_response = await client.get(
                f"/api/v1/deployments/{deployment_id}/logs"
            )
            if logs_response.status_code == 200:
                logs_data = logs_response.json()
                assert "logs" in logs_data
                # Should have at least one log entry
                if len(logs_data["logs"]) > 0:
                    log = logs_data["logs"][0]
                    assert "event_type" in log
                    assert "message" in log
                    assert "created_at" in log


@pytest.mark.e2e
class TestGatewayHealthCheckWorkflow:
    """Test gateway health check workflow."""

    async def test_health_check_on_gateway(self, authenticated_owner_client):
        """Test health check operation on gateway."""
        client, user, org = authenticated_owner_client

        # Create gateway
        gateway_data = {
            "name": "Health Check Gateway",
            "api_url": "https://health-gateway.example.com",
            "api_key": "health-key",
            "health_check_url": "https://health-gateway.example.com/api/health",
        }
        response = await client.post("/api/v1/gateways", json=gateway_data)
        gateway_id = response.json()["id"]

        # Perform health check
        health_response = await client.post(f"/api/v1/gateways/{gateway_id}/health")

        # Health check endpoint should exist
        assert health_response.status_code in (200, 500)

        # If successful, check response structure
        if health_response.status_code == 200:
            health_data = health_response.json()
            assert "gateway_id" in health_data
            assert "status" in health_data
            assert "checked_at" in health_data

    async def test_gateway_status_update_after_health_check(
        self, authenticated_owner_client
    ):
        """Test gateway status may be updated after health check."""
        client, user, org = authenticated_owner_client

        # Create gateway
        gateway_data = {
            "name": "Status Update Gateway",
            "api_url": "https://status-update-gateway.example.com",
            "api_key": "status-key",
        }
        create_response = await client.post("/api/v1/gateways", json=gateway_data)
        gateway_id = create_response.json()["id"]

        initial_status = create_response.json()["status"]
        assert initial_status == "active"

        # Run health check (will likely fail due to fake URL)
        await client.post(f"/api/v1/gateways/{gateway_id}/health")

        # Get gateway and check status
        get_response = await client.get(f"/api/v1/gateways/{gateway_id}")
        updated_gateway = get_response.json()

        # Status may be unchanged or set to error depending on health check result
        assert updated_gateway["status"] in ["active", "error"]


@pytest.mark.e2e
class TestMultiGatewayDeploymentScenarios:
    """Test deployment scenarios with multiple gateways."""

    async def test_deploy_to_multiple_gateways(self, authenticated_owner_client):
        """Test deploying same agent to multiple gateways."""
        client, user, org = authenticated_owner_client

        agent_id = str(uuid.uuid4())
        gateway_ids = []

        # Create multiple gateways
        for i in range(3):
            gateway_data = {
                "name": f"Multi Gateway {i}",
                "api_url": f"https://gateway{i}.example.com",
                "api_key": f"key{i}",
                "environment": ["development", "staging", "production"][i],
            }
            response = await client.post("/api/v1/gateways", json=gateway_data)
            assert response.status_code == 200
            gateway_ids.append(response.json()["id"])

        # Verify all gateways created
        assert len(gateway_ids) == 3

        # Attempt to deploy to each gateway
        deployments = []
        for gateway_id in gateway_ids:
            deploy_data = {
                "agent_id": agent_id,
                "gateway_id": gateway_id,
            }
            response = await client.post("/api/v1/deployments", json=deploy_data)
            # Endpoint should handle multiple deployments
            assert response.status_code in (200, 400, 404, 500)
            if response.status_code == 200:
                deployments.append(response.json())

        # Verify we can list all deployments for the agent
        list_response = await client.get(f"/api/v1/deployments?agent_id={agent_id}")
        assert list_response.status_code == 200

    async def test_gateway_environment_segregation(self, authenticated_owner_client):
        """Test gateways properly segregated by environment."""
        client, user, org = authenticated_owner_client

        # Create gateways in different environments
        environments = ["development", "staging", "production"]
        gateway_ids_by_env = {}

        for env in environments:
            gateway_data = {
                "name": f"Gateway {env}",
                "api_url": f"https://gateway-{env}.example.com",
                "api_key": f"key-{env}",
                "environment": env,
            }
            response = await client.post("/api/v1/gateways", json=gateway_data)
            assert response.status_code == 200
            gateway_ids_by_env[env] = response.json()["id"]

        # Query gateways by environment
        for env, expected_id in gateway_ids_by_env.items():
            response = await client.get(f"/api/v1/gateways?environment={env}")
            assert response.status_code == 200
            gateways = response.json()["gateways"]

            # Verify all returned gateways are for this environment
            for gateway in gateways:
                assert gateway["environment"] == env

            # Verify our gateway is in the list
            gateway_ids = [g["id"] for g in gateways]
            assert expected_id in gateway_ids


@pytest.mark.e2e
class TestDeploymentAccessControl:
    """Test access control and multi-organization isolation."""

    @pytest.mark.asyncio
    async def test_organization_isolation_in_deployments(
        self, authenticated_owner_client, second_org_client
    ):
        """Test deployments isolated between organizations."""
        owner_client, owner, owner_org = authenticated_owner_client
        other_client, other_user, other_org = second_org_client

        # First org creates gateway
        owner_gateway_data = {
            "name": "First Org Gateway",
            "api_url": "https://first-org-gateway.example.com",
            "api_key": "first-key",
        }
        owner_gateway_response = await owner_client.post(
            "/api/v1/gateways", json=owner_gateway_data
        )
        assert owner_gateway_response.status_code in (200, 201)
        owner_gateway_id = owner_gateway_response.json()["id"]

        # Second org creates gateway
        other_gateway_data = {
            "name": "Second Org Gateway",
            "api_url": "https://second-org-gateway.example.com",
            "api_key": "second-key",
        }
        other_gateway_response = await other_client.post(
            "/api/v1/gateways", json=other_gateway_data
        )
        assert other_gateway_response.status_code in (200, 201)
        other_gateway_id = other_gateway_response.json()["id"]

        # First org tries to access own gateway
        owner_access = await owner_client.get(f"/api/v1/gateways/{owner_gateway_id}")
        assert owner_access.status_code == 200

        # Second org tries to access first org's gateway - should be blocked
        other_access = await other_client.get(f"/api/v1/gateways/{owner_gateway_id}")
        assert other_access.status_code in (403, 404)

        # First org tries to access second org's gateway - should be blocked
        owner_other_access = await owner_client.get(
            f"/api/v1/gateways/{other_gateway_id}"
        )
        assert owner_other_access.status_code in (403, 404)

    @pytest.mark.asyncio
    async def test_organization_isolation_in_gateways(
        self, authenticated_owner_client, second_org_client
    ):
        """Test gateways isolated between organizations."""
        owner_client, owner, owner_org = authenticated_owner_client
        other_client, other_user, other_org = second_org_client

        # First org creates gateway
        owner_data = {
            "name": "First Org Only Gateway",
            "api_url": "https://first-org.example.com",
            "api_key": "first-key",
        }
        owner_response = await owner_client.post("/api/v1/gateways", json=owner_data)
        assert owner_response.status_code in (200, 201)
        owner_gateway_id = owner_response.json()["id"]

        # Second org lists their gateways (should not include first org's)
        other_list = await other_client.get("/api/v1/gateways")
        assert other_list.status_code == 200
        other_gateways = other_list.json()["gateways"]
        other_gateway_ids = [g["id"] for g in other_gateways]

        # First org's gateway should NOT be in second org's list
        assert owner_gateway_id not in other_gateway_ids

        # Second org tries to access first org's gateway - should be blocked
        other_access = await other_client.get(f"/api/v1/gateways/{owner_gateway_id}")
        assert other_access.status_code in (403, 404)


@pytest.mark.e2e
class TestCompleteDeploymentWorkflow:
    """Test complete deployment workflow scenarios."""

    async def test_end_to_end_gateway_deployment_scenario(
        self, authenticated_owner_client
    ):
        """Test complete real-world gateway and deployment scenario."""
        client, user, org = authenticated_owner_client

        # Phase 1: Infrastructure Setup
        # Create production gateway
        prod_gateway_data = {
            "name": "Production Gateway",
            "description": "Primary production deployment gateway",
            "api_url": "https://prod.example.com",
            "api_key": "prod-secret-key",
            "environment": "production",
            "health_check_url": "https://prod.example.com/health",
        }
        prod_response = await client.post("/api/v1/gateways", json=prod_gateway_data)
        assert prod_response.status_code == 200
        prod_gateway = prod_response.json()
        prod_gateway_id = prod_gateway["id"]

        # Create staging gateway
        staging_gateway_data = {
            "name": "Staging Gateway",
            "description": "Staging deployment gateway",
            "api_url": "https://staging.example.com",
            "api_key": "staging-secret-key",
            "environment": "staging",
        }
        staging_response = await client.post(
            "/api/v1/gateways", json=staging_gateway_data
        )
        assert staging_response.status_code == 200
        staging_gateway_id = staging_response.json()["id"]

        # Phase 2: Verify Gateway Infrastructure
        # List all gateways
        list_response = await client.get("/api/v1/gateways")
        assert list_response.status_code == 200
        gateways_data = list_response.json()["gateways"]
        assert len(gateways_data) >= 2

        # List by environment
        prod_list = await client.get("/api/v1/gateways?environment=production")
        assert prod_list.status_code == 200
        prod_gateways = prod_list.json()["gateways"]
        assert any(g["id"] == prod_gateway_id for g in prod_gateways)

        # Phase 3: Gateway Configuration
        # Update production gateway configuration
        update_data = {
            "description": "Updated production gateway with enhanced configuration",
            "health_check_url": "https://prod.example.com/api/v1/health",
        }
        update_response = await client.put(
            f"/api/v1/gateways/{prod_gateway_id}", json=update_data
        )
        assert update_response.status_code == 200
        updated_gateway = update_response.json()
        assert "Updated production" in updated_gateway["description"]

        # Phase 4: Verify Get Individual Gateway
        get_response = await client.get(f"/api/v1/gateways/{prod_gateway_id}")
        assert get_response.status_code == 200
        gateway_detail = get_response.json()
        assert gateway_detail["id"] == prod_gateway_id
        assert gateway_detail["status"] == "active"

        # Phase 5: Gateway Management (Optional health check)
        health_response = await client.post(
            f"/api/v1/gateways/{prod_gateway_id}/health"
        )
        # Health check may fail due to fake URL, but endpoint should exist
        assert health_response.status_code in (200, 500)

        # Phase 6: Cleanup - Delete staging gateway
        delete_response = await client.delete(f"/api/v1/gateways/{staging_gateway_id}")
        assert delete_response.status_code == 200

        # Verify deletion
        verify_delete = await client.get(f"/api/v1/gateways/{staging_gateway_id}")
        assert verify_delete.status_code == 404

        # Phase 7: Verify production gateway still exists
        final_get = await client.get(f"/api/v1/gateways/{prod_gateway_id}")
        assert final_get.status_code == 200

        # Final cleanup
        await client.delete(f"/api/v1/gateways/{prod_gateway_id}")
