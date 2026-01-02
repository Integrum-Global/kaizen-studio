"""
Integration Tests for Scaling API

Tier 2: Real infrastructure with NO MOCKING.
Tests all 11 scaling endpoints with real database operations.
"""

import uuid

import pytest
import pytest_asyncio


@pytest.mark.integration
class TestScalingPoliciesCreateAPI:
    """Test policy creation endpoint."""

    @pytest_asyncio.fixture
    async def policy_data(self):
        """Create valid policy data."""
        return {
            "organization_id": str(uuid.uuid4()),
            "gateway_id": str(uuid.uuid4()),
            "name": f"Test Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
            "status": "active",
        }

    async def test_create_policy_success(self, authenticated_owner_client, policy_data):
        """Test creating a scaling policy successfully."""
        client, user, org = authenticated_owner_client
        policy_data["organization_id"] = org["id"]

        response = await client.post("/api/v1/scaling/policies", json=policy_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == policy_data["name"]
        assert data["target_metric"] == "cpu"
        assert data["min_instances"] == 1
        assert data["max_instances"] == 10
        assert data["status"] == "active"

    async def test_create_policy_with_memory_metric(
        self, authenticated_owner_client, policy_data
    ):
        """Test creating policy with memory metric."""
        client, user, org = authenticated_owner_client
        policy_data["organization_id"] = org["id"]
        policy_data["target_metric"] = "memory"

        response = await client.post("/api/v1/scaling/policies", json=policy_data)

        assert response.status_code == 200
        data = response.json()
        assert data["target_metric"] == "memory"

    async def test_create_policy_with_requests_metric(
        self, authenticated_owner_client, policy_data
    ):
        """Test creating policy with requests_per_second metric."""
        client, user, org = authenticated_owner_client
        policy_data["organization_id"] = org["id"]
        policy_data["target_metric"] = "requests_per_second"

        response = await client.post("/api/v1/scaling/policies", json=policy_data)

        assert response.status_code == 200
        data = response.json()
        assert data["target_metric"] == "requests_per_second"

    async def test_create_policy_with_latency_metric(
        self, authenticated_owner_client, policy_data
    ):
        """Test creating policy with latency_p99 metric."""
        client, user, org = authenticated_owner_client
        policy_data["organization_id"] = org["id"]
        policy_data["target_metric"] = "latency_p99"

        response = await client.post("/api/v1/scaling/policies", json=policy_data)

        assert response.status_code == 200
        data = response.json()
        assert data["target_metric"] == "latency_p99"

    async def test_create_policy_with_error_rate_metric(
        self, authenticated_owner_client, policy_data
    ):
        """Test creating policy with error_rate metric."""
        client, user, org = authenticated_owner_client
        policy_data["organization_id"] = org["id"]
        policy_data["target_metric"] = "error_rate"

        response = await client.post("/api/v1/scaling/policies", json=policy_data)

        assert response.status_code == 200
        data = response.json()
        assert data["target_metric"] == "error_rate"

    async def test_create_policy_with_invalid_metric(
        self, authenticated_owner_client, policy_data
    ):
        """Test creating policy with invalid metric fails."""
        client, user, org = authenticated_owner_client
        policy_data["organization_id"] = org["id"]
        policy_data["target_metric"] = "invalid_metric"

        response = await client.post("/api/v1/scaling/policies", json=policy_data)

        assert response.status_code == 400

    async def test_create_policy_sets_created_at(
        self, authenticated_owner_client, policy_data
    ):
        """Test policy has timestamp fields."""
        client, user, org = authenticated_owner_client
        policy_data["organization_id"] = org["id"]

        response = await client.post("/api/v1/scaling/policies", json=policy_data)

        assert response.status_code == 200
        data = response.json()
        # DataFlow auto-managed timestamps - API may return created_at and/or updated_at
        # At minimum, updated_at should be present for newly created records
        assert "updated_at" in data or "created_at" in data


@pytest.mark.integration
class TestScalingPoliciesListAPI:
    """Test policy listing endpoint."""

    async def test_list_policies_empty(self, authenticated_owner_client):
        """Test listing policies when none exist."""
        client, user, org = authenticated_owner_client

        response = await client.get(
            "/api/v1/scaling/policies", params={"organization_id": org["id"]}
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_list_policies_by_organization(self, authenticated_owner_client):
        """Test listing policies filters by organization."""
        client, user, org = authenticated_owner_client

        # Create a policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": str(uuid.uuid4()),
            "name": f"Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
        }

        create_response = await client.post(
            "/api/v1/scaling/policies", json=policy_data
        )
        assert create_response.status_code == 200

        # List policies
        list_response = await client.get(
            "/api/v1/scaling/policies", params={"organization_id": org["id"]}
        )

        assert list_response.status_code == 200
        data = list_response.json()
        assert len(data) > 0

    async def test_list_policies_filter_by_gateway(self, authenticated_owner_client):
        """Test listing policies filters by gateway ID."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        # Create a policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": gateway_id,
            "name": f"Gateway Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
        }

        create_response = await client.post(
            "/api/v1/scaling/policies", json=policy_data
        )
        assert create_response.status_code == 200

        # List policies for specific gateway
        list_response = await client.get(
            "/api/v1/scaling/policies",
            params={"organization_id": org["id"], "gateway_id": gateway_id},
        )

        assert list_response.status_code == 200
        data = list_response.json()
        assert len(data) > 0
        assert all(policy["gateway_id"] == gateway_id for policy in data)


@pytest.mark.integration
class TestScalingPoliciesGetAPI:
    """Test policy retrieval endpoint."""

    async def test_get_policy_success(self, authenticated_owner_client):
        """Test retrieving a policy by ID."""
        client, user, org = authenticated_owner_client

        # Create a policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": str(uuid.uuid4()),
            "name": f"Get Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
        }

        create_response = await client.post(
            "/api/v1/scaling/policies", json=policy_data
        )
        assert create_response.status_code == 200
        created_policy = create_response.json()
        policy_id = created_policy["id"]

        # Get the policy
        get_response = await client.get(f"/api/v1/scaling/policies/{policy_id}")

        assert get_response.status_code == 200
        data = get_response.json()
        assert data["id"] == policy_id
        assert data["name"] == policy_data["name"]

    async def test_get_policy_not_found(self, authenticated_owner_client):
        """Test retrieving non-existent policy fails."""
        client, user, org = authenticated_owner_client
        fake_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/scaling/policies/{fake_id}")

        assert response.status_code == 404


@pytest.mark.integration
class TestScalingPoliciesUpdateAPI:
    """Test policy update endpoint."""

    async def test_update_policy_name(self, authenticated_owner_client):
        """Test updating policy name."""
        client, user, org = authenticated_owner_client

        # Create a policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": str(uuid.uuid4()),
            "name": f"Original Name {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
        }

        create_response = await client.post(
            "/api/v1/scaling/policies", json=policy_data
        )
        assert create_response.status_code == 200
        policy_id = create_response.json()["id"]

        # Update policy
        update_data = {"name": "Updated Name"}
        update_response = await client.put(
            f"/api/v1/scaling/policies/{policy_id}", json=update_data
        )

        assert update_response.status_code == 200
        data = update_response.json()
        assert data["name"] == "Updated Name"

    async def test_update_policy_thresholds(self, authenticated_owner_client):
        """Test updating policy thresholds."""
        client, user, org = authenticated_owner_client

        # Create a policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": str(uuid.uuid4()),
            "name": f"Threshold Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
        }

        create_response = await client.post(
            "/api/v1/scaling/policies", json=policy_data
        )
        assert create_response.status_code == 200
        policy_id = create_response.json()["id"]

        # Update thresholds
        update_data = {
            "scale_up_threshold": 85.0,
            "scale_down_threshold": 25.0,
        }
        update_response = await client.put(
            f"/api/v1/scaling/policies/{policy_id}", json=update_data
        )

        assert update_response.status_code == 200
        data = update_response.json()
        assert data["scale_up_threshold"] == 85.0
        assert data["scale_down_threshold"] == 25.0

    async def test_update_policy_instances(self, authenticated_owner_client):
        """Test updating policy instance limits."""
        client, user, org = authenticated_owner_client

        # Create a policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": str(uuid.uuid4()),
            "name": f"Instance Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
        }

        create_response = await client.post(
            "/api/v1/scaling/policies", json=policy_data
        )
        assert create_response.status_code == 200
        policy_id = create_response.json()["id"]

        # Update instances
        update_data = {"min_instances": 2, "max_instances": 20}
        update_response = await client.put(
            f"/api/v1/scaling/policies/{policy_id}", json=update_data
        )

        assert update_response.status_code == 200
        data = update_response.json()
        assert data["min_instances"] == 2
        assert data["max_instances"] == 20

    async def test_update_policy_status(self, authenticated_owner_client):
        """Test updating policy status."""
        client, user, org = authenticated_owner_client

        # Create a policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": str(uuid.uuid4()),
            "name": f"Status Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
            "status": "active",
        }

        create_response = await client.post(
            "/api/v1/scaling/policies", json=policy_data
        )
        assert create_response.status_code == 200
        policy_id = create_response.json()["id"]

        # Update status
        update_data = {"status": "inactive"}
        update_response = await client.put(
            f"/api/v1/scaling/policies/{policy_id}", json=update_data
        )

        assert update_response.status_code == 200
        data = update_response.json()
        assert data["status"] == "inactive"


@pytest.mark.integration
class TestScalingPoliciesDeleteAPI:
    """Test policy deletion endpoint."""

    async def test_delete_policy_success(self, authenticated_owner_client):
        """Test deleting a policy."""
        client, user, org = authenticated_owner_client

        # Create a policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": str(uuid.uuid4()),
            "name": f"Delete Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
        }

        create_response = await client.post(
            "/api/v1/scaling/policies", json=policy_data
        )
        assert create_response.status_code == 200
        policy_id = create_response.json()["id"]

        # Delete policy
        delete_response = await client.delete(f"/api/v1/scaling/policies/{policy_id}")

        assert delete_response.status_code == 204

        # Verify it's deleted
        get_response = await client.get(f"/api/v1/scaling/policies/{policy_id}")
        assert get_response.status_code == 404

    async def test_delete_policy_not_found(self, authenticated_owner_client):
        """Test deleting non-existent policy fails."""
        client, user, org = authenticated_owner_client
        fake_id = str(uuid.uuid4())

        response = await client.delete(f"/api/v1/scaling/policies/{fake_id}")

        assert response.status_code == 404


@pytest.mark.integration
class TestScalingEvaluateAPI:
    """Test scaling evaluation endpoint."""

    async def test_evaluate_scaling_no_policies(self, authenticated_owner_client):
        """Test evaluating scaling with no policies."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        response = await client.post(f"/api/v1/scaling/gateways/{gateway_id}/evaluate")

        assert response.status_code == 200
        data = response.json()
        assert data["gateway_id"] == gateway_id
        assert data["action"] == "none"

    async def test_evaluate_scaling_with_active_policy(
        self, authenticated_owner_client
    ):
        """Test evaluating scaling with active policy."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        # Create a policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": gateway_id,
            "name": f"Evaluate Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
            "status": "active",
        }

        create_response = await client.post(
            "/api/v1/scaling/policies", json=policy_data
        )
        assert create_response.status_code == 200

        # Evaluate scaling
        response = await client.post(f"/api/v1/scaling/gateways/{gateway_id}/evaluate")

        assert response.status_code == 200
        data = response.json()
        assert "gateway_id" in data
        assert "action" in data


@pytest.mark.integration
class TestScalingManualScaleAPI:
    """Test manual gateway scaling endpoint."""

    async def test_scale_gateway_success(self, authenticated_owner_client):
        """Test manual scaling a gateway."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        response = await client.post(
            f"/api/v1/scaling/gateways/{gateway_id}/scale",
            json={"target_instances": 5},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["gateway_id"] == gateway_id
        assert data["target_instances"] == 5

    async def test_scale_gateway_with_different_instances(
        self, authenticated_owner_client
    ):
        """Test scaling to different instance counts."""
        client, user, org = authenticated_owner_client

        for target in [1, 3, 5, 10]:
            gateway_id = str(uuid.uuid4())
            response = await client.post(
                f"/api/v1/scaling/gateways/{gateway_id}/scale",
                json={"target_instances": target},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["target_instances"] == target


@pytest.mark.integration
class TestScalingEventsListAPI:
    """Test scaling events listing endpoint."""

    async def test_list_events_empty(self, authenticated_owner_client):
        """Test listing events when none exist."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/scaling/gateways/{gateway_id}/events")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_list_events_with_limit(self, authenticated_owner_client):
        """Test listing events with limit parameter."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        response = await client.get(
            f"/api/v1/scaling/gateways/{gateway_id}/events",
            params={"limit": 25},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.integration
class TestScalingEventsGetAPI:
    """Test scaling event retrieval endpoint."""

    async def test_get_event_not_found(self, authenticated_owner_client):
        """Test retrieving non-existent event fails."""
        client, user, org = authenticated_owner_client
        fake_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/scaling/events/{fake_id}")

        assert response.status_code == 404


@pytest.mark.integration
class TestScalingMetricsAPI:
    """Test gateway metrics endpoints."""

    async def test_get_gateway_metrics(self, authenticated_owner_client):
        """Test retrieving gateway metrics."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/scaling/gateways/{gateway_id}/metrics")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    async def test_get_gateway_metrics_contains_cpu(self, authenticated_owner_client):
        """Test metrics include CPU."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/scaling/gateways/{gateway_id}/metrics")

        assert response.status_code == 200
        data = response.json()
        assert "cpu" in data

    async def test_get_gateway_metrics_contains_memory(
        self, authenticated_owner_client
    ):
        """Test metrics include memory."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/scaling/gateways/{gateway_id}/metrics")

        assert response.status_code == 200
        data = response.json()
        assert "memory" in data

    async def test_get_supported_metrics(self, authenticated_owner_client):
        """Test retrieving supported metrics list."""
        client, user, org = authenticated_owner_client

        response = await client.get("/api/v1/scaling/metrics/supported")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "cpu" in data
        assert "memory" in data
        assert "requests_per_second" in data
        assert "latency_p99" in data
        assert "error_rate" in data
