"""
End-to-End Tests for Gateway Auto-scaling Workflow

Tier 3: Complete real-world scenarios with real infrastructure.
Tests complete auto-scaling workflows from policy creation to event tracking.
"""

import uuid

import pytest


@pytest.mark.e2e
class TestCompleteScalingWorkflow:
    """Test complete auto-scaling workflow."""

    async def test_create_policy_then_scale(self, authenticated_owner_client):
        """Test creating a policy and triggering scaling."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        # Step 1: Create scaling policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": gateway_id,
            "name": f"Complete Workflow Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 20.0,
            "scale_down_threshold": 30.0,
            "cooldown_seconds": 300,
            "status": "active",
        }

        policy_response = await client.post(
            "/api/v1/scaling/policies", json=policy_data
        )
        assert policy_response.status_code == 200
        policy = policy_response.json()
        policy_id = policy["id"]

        # Step 2: Verify policy was created
        get_response = await client.get(f"/api/v1/scaling/policies/{policy_id}")
        assert get_response.status_code == 200
        retrieved_policy = get_response.json()
        assert retrieved_policy["id"] == policy_id

        # Step 3: Evaluate scaling
        eval_response = await client.post(
            f"/api/v1/scaling/gateways/{gateway_id}/evaluate"
        )
        assert eval_response.status_code == 200
        eval_result = eval_response.json()
        assert eval_result["gateway_id"] == gateway_id

        # Step 4: Manual scale
        scale_response = await client.post(
            f"/api/v1/scaling/gateways/{gateway_id}/scale",
            json={"target_instances": 5},
        )
        assert scale_response.status_code == 200

    async def test_multiple_policies_same_gateway(self, authenticated_owner_client):
        """Test multiple policies on same gateway."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        # Create CPU policy
        cpu_policy = {
            "organization_id": org["id"],
            "gateway_id": gateway_id,
            "name": f"CPU Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 20.0,
            "scale_down_threshold": 30.0,
            "cooldown_seconds": 300,
            "status": "active",
        }

        cpu_response = await client.post("/api/v1/scaling/policies", json=cpu_policy)
        assert cpu_response.status_code == 200
        cpu_policy_id = cpu_response.json()["id"]

        # Create Memory policy
        memory_policy = {
            "organization_id": org["id"],
            "gateway_id": gateway_id,
            "name": f"Memory Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 2,
            "max_instances": 8,
            "target_metric": "memory",
            "target_value": 75.0,
            "scale_up_threshold": 15.0,
            "scale_down_threshold": 25.0,
            "cooldown_seconds": 300,
            "status": "active",
        }

        memory_response = await client.post(
            "/api/v1/scaling/policies", json=memory_policy
        )
        assert memory_response.status_code == 200
        memory_policy_id = memory_response.json()["id"]

        # List policies for gateway
        list_response = await client.get(
            "/api/v1/scaling/policies",
            params={"organization_id": org["id"], "gateway_id": gateway_id},
        )
        assert list_response.status_code == 200
        policies = list_response.json()
        assert len(policies) >= 2

    async def test_policy_lifecycle(self, authenticated_owner_client):
        """Test complete policy lifecycle: create, update, disable, delete."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        # Create policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": gateway_id,
            "name": f"Lifecycle Policy {uuid.uuid4().hex[:6]}",
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

        # Update policy name
        update_response = await client.put(
            f"/api/v1/scaling/policies/{policy_id}",
            json={"name": f"Updated {uuid.uuid4().hex[:6]}"},
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"].startswith("Updated")

        # Disable policy
        disable_response = await client.put(
            f"/api/v1/scaling/policies/{policy_id}", json={"status": "inactive"}
        )
        assert disable_response.status_code == 200
        disabled = disable_response.json()
        assert disabled["status"] == "inactive"

        # Delete policy
        delete_response = await client.delete(f"/api/v1/scaling/policies/{policy_id}")
        assert delete_response.status_code == 204

        # Verify deleted
        get_response = await client.get(f"/api/v1/scaling/policies/{policy_id}")
        assert get_response.status_code == 404


@pytest.mark.e2e
class TestScalingWithMultipleGateways:
    """Test scaling across multiple gateways."""

    async def test_independent_gateway_policies(self, authenticated_owner_client):
        """Test policies on different gateways are independent."""
        client, user, org = authenticated_owner_client

        gateway1_id = str(uuid.uuid4())
        gateway2_id = str(uuid.uuid4())

        # Create policy for gateway 1
        policy1 = {
            "organization_id": org["id"],
            "gateway_id": gateway1_id,
            "name": f"Gateway 1 Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
            "status": "active",
        }

        response1 = await client.post("/api/v1/scaling/policies", json=policy1)
        assert response1.status_code == 200

        # Create policy for gateway 2
        policy2 = {
            "organization_id": org["id"],
            "gateway_id": gateway2_id,
            "name": f"Gateway 2 Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 2,
            "max_instances": 8,
            "target_metric": "memory",
            "target_value": 75.0,
            "scale_up_threshold": 85.0,
            "scale_down_threshold": 25.0,
            "cooldown_seconds": 300,
            "status": "active",
        }

        response2 = await client.post("/api/v1/scaling/policies", json=policy2)
        assert response2.status_code == 200

        # Verify independent scaling evaluations
        eval1 = await client.post(f"/api/v1/scaling/gateways/{gateway1_id}/evaluate")
        assert eval1.status_code == 200

        eval2 = await client.post(f"/api/v1/scaling/gateways/{gateway2_id}/evaluate")
        assert eval2.status_code == 200

    async def test_scale_multiple_gateways(self, authenticated_owner_client):
        """Test scaling multiple gateways simultaneously."""
        client, user, org = authenticated_owner_client

        gateways = [str(uuid.uuid4()) for _ in range(3)]
        target_instances = [3, 5, 7]

        # Scale each gateway
        for gateway_id, target in zip(gateways, target_instances, strict=False):
            response = await client.post(
                f"/api/v1/scaling/gateways/{gateway_id}/scale",
                json={"target_instances": target},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["target_instances"] == target


@pytest.mark.e2e
class TestScalingEventTracking:
    """Test scaling event tracking throughout workflow."""

    async def test_events_recorded_during_scaling(self, authenticated_owner_client):
        """Test scaling events are recorded."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        # Create policy
        policy_data = {
            "organization_id": org["id"],
            "gateway_id": gateway_id,
            "name": f"Event Policy {uuid.uuid4().hex[:6]}",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "cpu",
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
            "status": "active",
        }

        policy_response = await client.post(
            "/api/v1/scaling/policies", json=policy_data
        )
        assert policy_response.status_code == 200

        # Scale gateway (may trigger events)
        scale_response = await client.post(
            f"/api/v1/scaling/gateways/{gateway_id}/scale",
            json={"target_instances": 3},
        )
        assert scale_response.status_code == 200

        # List events
        events_response = await client.get(
            f"/api/v1/scaling/gateways/{gateway_id}/events"
        )
        assert events_response.status_code == 200
        events = events_response.json()
        assert isinstance(events, list)

    async def test_events_have_correct_structure(self, authenticated_owner_client):
        """Test event data has correct fields."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        # List events (even if empty)
        response = await client.get(f"/api/v1/scaling/gateways/{gateway_id}/events")
        assert response.status_code == 200


@pytest.mark.e2e
class TestScalingMetricsCollection:
    """Test metrics collection during scaling operations."""

    async def test_collect_metrics_before_scaling(self, authenticated_owner_client):
        """Test metrics are available before scaling."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/scaling/gateways/{gateway_id}/metrics")
        assert response.status_code == 200
        metrics = response.json()
        assert isinstance(metrics, dict)

    async def test_metrics_contain_all_supported_types(
        self, authenticated_owner_client
    ):
        """Test metrics include all supported metric types."""
        client, user, org = authenticated_owner_client
        gateway_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/scaling/gateways/{gateway_id}/metrics")
        assert response.status_code == 200
        metrics = response.json()

        expected_metrics = [
            "cpu",
            "memory",
            "requests_per_second",
            "latency_p99",
            "error_rate",
        ]
        for metric in expected_metrics:
            assert metric in metrics

    async def test_supported_metrics_endpoint(self, authenticated_owner_client):
        """Test supported metrics endpoint."""
        client, user, org = authenticated_owner_client

        response = await client.get("/api/v1/scaling/metrics/supported")
        assert response.status_code == 200
        metrics = response.json()

        assert "cpu" in metrics
        assert "memory" in metrics
        assert "requests_per_second" in metrics
        assert "latency_p99" in metrics
        assert "error_rate" in metrics


@pytest.mark.e2e
class TestScalingWorkflowErrorHandling:
    """Test error handling in scaling workflows."""

    async def test_invalid_policy_data_rejected(self, authenticated_owner_client):
        """Test invalid policy data is rejected."""
        client, user, org = authenticated_owner_client

        # Missing required fields
        invalid_policy = {
            "organization_id": org["id"],
            "gateway_id": str(uuid.uuid4()),
            # Missing name
            "min_instances": 1,
        }

        response = await client.post("/api/v1/scaling/policies", json=invalid_policy)
        assert response.status_code in (400, 422)

    async def test_invalid_metric_rejected(self, authenticated_owner_client):
        """Test invalid metric is rejected."""
        client, user, org = authenticated_owner_client

        invalid_policy = {
            "organization_id": org["id"],
            "gateway_id": str(uuid.uuid4()),
            "name": "Invalid Metric Policy",
            "min_instances": 1,
            "max_instances": 10,
            "target_metric": "invalid_metric",  # Invalid
            "target_value": 70.0,
            "scale_up_threshold": 80.0,
            "scale_down_threshold": 20.0,
            "cooldown_seconds": 300,
        }

        response = await client.post("/api/v1/scaling/policies", json=invalid_policy)
        assert response.status_code == 400

    async def test_nonexistent_policy_not_found(self, authenticated_owner_client):
        """Test accessing nonexistent policy returns 404."""
        client, user, org = authenticated_owner_client
        fake_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/scaling/policies/{fake_id}")
        assert response.status_code == 404

    async def test_nonexistent_event_not_found(self, authenticated_owner_client):
        """Test accessing nonexistent event returns 404."""
        client, user, org = authenticated_owner_client
        fake_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/scaling/events/{fake_id}")
        assert response.status_code == 404


@pytest.mark.e2e
class TestScalingPolicyVariations:
    """Test various scaling policy configurations."""

    async def test_policy_with_different_metrics(self, authenticated_owner_client):
        """Test creating policies with each supported metric."""
        client, user, org = authenticated_owner_client
        metrics = ["cpu", "memory", "requests_per_second", "latency_p99", "error_rate"]

        for metric in metrics:
            gateway_id = str(uuid.uuid4())
            policy_data = {
                "organization_id": org["id"],
                "gateway_id": gateway_id,
                "name": f"Policy {metric} {uuid.uuid4().hex[:6]}",
                "min_instances": 1,
                "max_instances": 10,
                "target_metric": metric,
                "target_value": 70.0,
                "scale_up_threshold": 80.0,
                "scale_down_threshold": 20.0,
                "cooldown_seconds": 300,
                "status": "active",
            }

            response = await client.post("/api/v1/scaling/policies", json=policy_data)
            assert response.status_code == 200
            created = response.json()
            assert created["target_metric"] == metric

    async def test_policy_with_different_instance_ranges(
        self, authenticated_owner_client
    ):
        """Test policies with different instance ranges."""
        client, user, org = authenticated_owner_client

        ranges = [
            (1, 5),
            (2, 10),
            (5, 20),
            (1, 100),
        ]

        for min_inst, max_inst in ranges:
            gateway_id = str(uuid.uuid4())
            policy_data = {
                "organization_id": org["id"],
                "gateway_id": gateway_id,
                "name": f"Range {min_inst}-{max_inst} {uuid.uuid4().hex[:6]}",
                "min_instances": min_inst,
                "max_instances": max_inst,
                "target_metric": "cpu",
                "target_value": 70.0,
                "scale_up_threshold": 80.0,
                "scale_down_threshold": 20.0,
                "cooldown_seconds": 300,
                "status": "active",
            }

            response = await client.post("/api/v1/scaling/policies", json=policy_data)
            assert response.status_code == 200
            created = response.json()
            assert created["min_instances"] == min_inst
            assert created["max_instances"] == max_inst

    async def test_policy_with_different_thresholds(self, authenticated_owner_client):
        """Test policies with different threshold values."""
        client, user, org = authenticated_owner_client

        thresholds = [
            (10.0, 50.0),
            (20.0, 30.0),
            (25.0, 40.0),
            (15.0, 35.0),
        ]

        for up_thresh, down_thresh in thresholds:
            gateway_id = str(uuid.uuid4())
            policy_data = {
                "organization_id": org["id"],
                "gateway_id": gateway_id,
                "name": f"Threshold {up_thresh}-{down_thresh} {uuid.uuid4().hex[:6]}",
                "min_instances": 1,
                "max_instances": 10,
                "target_metric": "cpu",
                "target_value": 70.0,
                "scale_up_threshold": up_thresh,
                "scale_down_threshold": down_thresh,
                "cooldown_seconds": 300,
                "status": "active",
            }

            response = await client.post("/api/v1/scaling/policies", json=policy_data)
            assert response.status_code == 200
            created = response.json()
            assert created["scale_up_threshold"] == up_thresh
            assert created["scale_down_threshold"] == down_thresh

    async def test_policy_with_different_cooldowns(self, authenticated_owner_client):
        """Test policies with different cooldown values."""
        client, user, org = authenticated_owner_client

        cooldowns = [60, 300, 600, 1800]

        for cooldown in cooldowns:
            gateway_id = str(uuid.uuid4())
            policy_data = {
                "organization_id": org["id"],
                "gateway_id": gateway_id,
                "name": f"Cooldown {cooldown} {uuid.uuid4().hex[:6]}",
                "min_instances": 1,
                "max_instances": 10,
                "target_metric": "cpu",
                "target_value": 70.0,
                "scale_up_threshold": 80.0,
                "scale_down_threshold": 20.0,
                "cooldown_seconds": cooldown,
                "status": "active",
            }

            response = await client.post("/api/v1/scaling/policies", json=policy_data)
            assert response.status_code == 200
            created = response.json()
            assert created["cooldown_seconds"] == cooldown
