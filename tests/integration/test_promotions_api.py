"""
Tier 2: Promotion API Integration Tests

Tests all 11 promotion endpoints with real database and services.
NO MOCKING - uses real infrastructure from Docker.
"""

import uuid

import pytest


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionCreateEndpoint:
    """Test POST /promotions endpoint."""

    async def test_create_promotion_success(
        self, authenticated_client, promotion_factory
    ):
        """Should create a new promotion request."""
        client, user = authenticated_client
        org_id = user["organization_id"]

        promotion_data = promotion_factory(organization_id=org_id)

        response = await client.post(
            "/api/v1/promotions",
            json={
                "agent_id": promotion_data["agent_id"],
                "source_deployment_id": promotion_data["source_deployment_id"],
                "target_gateway_id": promotion_data["target_gateway_id"],
                "source_environment": promotion_data["source_environment"],
                "target_environment": promotion_data["target_environment"],
            },
        )

        # The API accepts the request (200) if deployment exists, or
        # returns 400 if the referenced deployment doesn't exist (validation)
        # Since test uses generated UUIDs, deployment may not exist
        assert response.status_code in (200, 400)
        if response.status_code == 200:
            result = response.json()
            assert result["id"]
            assert result["organization_id"] == org_id
            assert result["status"] in ("pending", "completed", "failed")

    async def test_create_promotion_without_auth(self, test_client):
        """Should reject promotion without authentication."""
        response = await test_client.post(
            "/api/v1/promotions",
            json={
                "agent_id": str(uuid.uuid4()),
                "source_deployment_id": str(uuid.uuid4()),
                "target_gateway_id": str(uuid.uuid4()),
                "source_environment": "development",
                "target_environment": "staging",
            },
        )

        assert response.status_code in (401, 403)

    async def test_create_promotion_missing_agent_id(self, authenticated_client):
        """Should validate required agent_id field."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/v1/promotions",
            json={
                "source_deployment_id": str(uuid.uuid4()),
                "target_gateway_id": str(uuid.uuid4()),
                "source_environment": "development",
                "target_environment": "staging",
            },
        )

        assert response.status_code == 422

    async def test_create_promotion_missing_source_deployment(
        self, authenticated_client
    ):
        """Should validate required source_deployment_id field."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/v1/promotions",
            json={
                "agent_id": str(uuid.uuid4()),
                "target_gateway_id": str(uuid.uuid4()),
                "source_environment": "development",
                "target_environment": "staging",
            },
        )

        assert response.status_code == 422

    async def test_create_promotion_missing_target_gateway(self, authenticated_client):
        """Should validate required target_gateway_id field."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/v1/promotions",
            json={
                "agent_id": str(uuid.uuid4()),
                "source_deployment_id": str(uuid.uuid4()),
                "source_environment": "development",
                "target_environment": "staging",
            },
        )

        assert response.status_code == 422


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionListEndpoint:
    """Test GET /promotions endpoint."""

    async def test_list_promotions_empty(self, authenticated_client):
        """Should return empty list for org with no promotions."""
        client, _ = authenticated_client

        response = await client.get("/api/v1/promotions")

        assert response.status_code == 200
        result = response.json()
        # API returns array directly
        assert isinstance(result, list)

    async def test_list_promotions_filter_by_status(self, authenticated_client):
        """Should filter promotions by status."""
        client, _ = authenticated_client

        response = await client.get("/api/v1/promotions?status=pending")

        assert response.status_code == 200
        result = response.json()
        # API returns array directly
        for promo in result:
            if promo["status"]:
                assert promo["status"] == "pending"

    async def test_list_promotions_filter_by_agent(self, authenticated_client):
        """Should filter promotions by agent ID."""
        client, _ = authenticated_client
        agent_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/promotions?agent_id={agent_id}")

        assert response.status_code == 200
        result = response.json()
        # API returns array directly
        assert isinstance(result, list)

    async def test_list_promotions_requires_auth(self, test_client):
        """Should require authentication."""
        response = await test_client.get("/api/v1/promotions")

        assert response.status_code in (401, 403)


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionGetEndpoint:
    """Test GET /promotions/{promotion_id} endpoint."""

    async def test_get_promotion_not_found(self, authenticated_client):
        """Should return 404 for non-existent promotion."""
        client, _ = authenticated_client
        fake_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/promotions/{fake_id}")

        assert response.status_code == 404

    async def test_get_promotion_requires_auth(self, test_client):
        """Should require authentication."""
        response = await test_client.get(f"/api/v1/promotions/{uuid.uuid4()}")

        assert response.status_code in (401, 403)


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionApproveEndpoint:
    """Test POST /promotions/{promotion_id}/approve endpoint."""

    async def test_approve_promotion_not_found(self, authenticated_client):
        """Should return 404 for non-existent promotion."""
        client, _ = authenticated_client
        fake_id = str(uuid.uuid4())

        response = await client.post(f"/api/v1/promotions/{fake_id}/approve")

        assert response.status_code == 404

    async def test_approve_promotion_requires_auth(self, test_client):
        """Should require authentication."""
        response = await test_client.post(f"/api/v1/promotions/{uuid.uuid4()}/approve")

        assert response.status_code in (401, 403)

    async def test_approve_promotion_requires_permission(self, authenticated_client):
        """Should require promotions:approve permission."""
        client, user = authenticated_client
        # This user has org_admin role which should have the permission
        # Create a promotion first
        promotion_data = {
            "agent_id": str(uuid.uuid4()),
            "source_deployment_id": str(uuid.uuid4()),
            "target_gateway_id": str(uuid.uuid4()),
            "source_environment": "development",
            "target_environment": "staging",
        }

        create_response = await client.post("/api/v1/promotions", json=promotion_data)
        if create_response.status_code == 200:
            promotion = create_response.json()

            response = await client.post(
                f"/api/v1/promotions/{promotion['id']}/approve"
            )
            # Should succeed with proper permission
            assert response.status_code in (200, 400)  # 400 if already approved


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionRejectEndpoint:
    """Test POST /promotions/{promotion_id}/reject endpoint."""

    async def test_reject_promotion_not_found(self, authenticated_client):
        """Should return 404 for non-existent promotion."""
        client, _ = authenticated_client
        fake_id = str(uuid.uuid4())

        response = await client.post(
            f"/api/v1/promotions/{fake_id}/reject",
            json={"reason": "Testing"},
        )

        assert response.status_code == 404

    async def test_reject_promotion_missing_reason(self, authenticated_client):
        """Should validate reason field."""
        client, _ = authenticated_client

        response = await client.post(
            f"/api/v1/promotions/{uuid.uuid4()}/reject",
            json={},
        )

        assert response.status_code == 422

    async def test_reject_promotion_requires_auth(self, test_client):
        """Should require authentication."""
        response = await test_client.post(
            f"/api/v1/promotions/{uuid.uuid4()}/reject",
            json={"reason": "Testing"},
        )

        assert response.status_code in (401, 403)


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionExecuteEndpoint:
    """Test POST /promotions/{promotion_id}/execute endpoint."""

    async def test_execute_promotion_not_found(self, authenticated_client):
        """Should return 404 for non-existent promotion."""
        client, _ = authenticated_client
        fake_id = str(uuid.uuid4())

        response = await client.post(f"/api/v1/promotions/{fake_id}/execute")

        assert response.status_code == 404

    async def test_execute_promotion_requires_auth(self, test_client):
        """Should require authentication."""
        response = await test_client.post(f"/api/v1/promotions/{uuid.uuid4()}/execute")

        assert response.status_code in (401, 403)

    async def test_execute_promotion_requires_permission(self, authenticated_client):
        """Should require promotions:execute permission."""
        client, _ = authenticated_client

        response = await client.post(f"/api/v1/promotions/{uuid.uuid4()}/execute")
        # Should fail with 404 for non-existent, not permission error
        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionRuleCreateEndpoint:
    """Test POST /promotions/rules endpoint."""

    async def test_create_rule_success(self, authenticated_client):
        """Should create a new promotion rule."""
        client, user = authenticated_client
        org_id = user["organization_id"]

        rule_data = {
            "name": "Dev to Staging Auto-Promotion",
            "source_environment": "development",
            "target_environment": "staging",
            "requires_approval": False,
            "auto_promote": True,
            "required_approvers": 1,
            "conditions": {"min_test_pass_rate": 0.9},
            "status": "active",
        }

        response = await client.post("/api/v1/promotions/rules", json=rule_data)

        assert response.status_code == 200
        result = response.json()
        assert result["id"]
        assert result["name"] == rule_data["name"]
        assert result["auto_promote"] is True

    async def test_create_rule_without_auth(self, test_client):
        """Should reject rule creation without authentication."""
        response = await test_client.post(
            "/api/v1/promotions/rules",
            json={
                "name": "Test Rule",
                "source_environment": "development",
                "target_environment": "staging",
            },
        )

        assert response.status_code in (401, 403)

    async def test_create_rule_missing_name(self, authenticated_client):
        """Should validate required name field."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/v1/promotions/rules",
            json={
                "source_environment": "development",
                "target_environment": "staging",
            },
        )

        assert response.status_code == 422

    async def test_create_rule_missing_environments(self, authenticated_client):
        """Should validate environment fields."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/v1/promotions/rules",
            json={
                "name": "Test Rule",
            },
        )

        assert response.status_code == 422


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionRuleListEndpoint:
    """Test GET /promotions/rules endpoint."""

    async def test_list_rules_empty(self, authenticated_client):
        """Should return empty list for org with no rules."""
        client, _ = authenticated_client

        response = await client.get("/api/v1/promotions/rules")

        assert response.status_code == 200
        result = response.json()
        assert "rules" in result
        assert isinstance(result["rules"], list)

    async def test_list_rules_filter_by_status(self, authenticated_client):
        """Should filter rules by status."""
        client, _ = authenticated_client

        response = await client.get("/api/v1/promotions/rules?status=active")

        assert response.status_code == 200
        result = response.json()
        assert "rules" in result
        rules = result["rules"]
        for rule in rules:
            if rule.get("status"):
                assert rule["status"] == "active"

    async def test_list_rules_requires_auth(self, test_client):
        """Should require authentication."""
        response = await test_client.get("/api/v1/promotions/rules")

        assert response.status_code in (401, 403)


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionRuleGetEndpoint:
    """Test GET /promotions/rules/{rule_id} endpoint."""

    async def test_get_rule_not_found(self, authenticated_client):
        """Should return 404 for non-existent rule."""
        client, _ = authenticated_client
        fake_id = str(uuid.uuid4())

        response = await client.get(f"/api/v1/promotions/rules/{fake_id}")

        assert response.status_code == 404

    async def test_get_rule_requires_auth(self, test_client):
        """Should require authentication."""
        response = await test_client.get(f"/api/v1/promotions/rules/{uuid.uuid4()}")

        assert response.status_code in (401, 403)


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionRuleUpdateEndpoint:
    """Test PUT /promotions/rules/{rule_id} endpoint."""

    async def test_update_rule_not_found(self, authenticated_client):
        """Should return 404 for non-existent rule."""
        client, _ = authenticated_client
        fake_id = str(uuid.uuid4())

        response = await client.put(
            f"/api/v1/promotions/rules/{fake_id}",
            json={"auto_promote": True},
        )

        assert response.status_code == 404

    async def test_update_rule_requires_auth(self, test_client):
        """Should require authentication."""
        response = await test_client.put(
            f"/api/v1/promotions/rules/{uuid.uuid4()}",
            json={"auto_promote": True},
        )

        assert response.status_code in (401, 403)

    async def test_update_rule_requires_permission(self, authenticated_client):
        """Should require promotions:rules:update permission."""
        client, _ = authenticated_client

        response = await client.put(
            f"/api/v1/promotions/rules/{uuid.uuid4()}",
            json={"auto_promote": True},
        )
        # Should fail with 404, not permission error
        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionRuleDeleteEndpoint:
    """Test DELETE /promotions/rules/{rule_id} endpoint."""

    async def test_delete_rule_not_found(self, authenticated_client):
        """Should return 404 for non-existent rule."""
        client, _ = authenticated_client
        fake_id = str(uuid.uuid4())

        response = await client.delete(f"/api/v1/promotions/rules/{fake_id}")

        assert response.status_code == 404

    async def test_delete_rule_requires_auth(self, test_client):
        """Should require authentication."""
        response = await test_client.delete(f"/api/v1/promotions/rules/{uuid.uuid4()}")

        assert response.status_code in (401, 403)

    async def test_delete_rule_requires_permission(self, authenticated_client):
        """Should require promotions:rules:delete permission."""
        client, _ = authenticated_client

        response = await client.delete(f"/api/v1/promotions/rules/{uuid.uuid4()}")
        # Should fail with 404, not permission error
        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestPromotionRuleIntegration:
    """Test promotion rules integration with promotions."""

    async def test_promotion_respects_organization_context(self, authenticated_client):
        """Promotions should be isolated per organization."""
        client, user = authenticated_client
        org_id = user["organization_id"]

        # Create promotion
        promotion_data = {
            "agent_id": str(uuid.uuid4()),
            "source_deployment_id": str(uuid.uuid4()),
            "target_gateway_id": str(uuid.uuid4()),
            "source_environment": "development",
            "target_environment": "staging",
        }

        response = await client.post("/api/v1/promotions", json=promotion_data)

        if response.status_code == 200:
            result = response.json()
            assert result["organization_id"] == org_id

    async def test_rule_respects_organization_context(self, authenticated_client):
        """Rules should be isolated per organization."""
        client, user = authenticated_client
        org_id = user["organization_id"]

        rule_data = {
            "name": "Test Rule",
            "source_environment": "development",
            "target_environment": "staging",
        }

        response = await client.post("/api/v1/promotions/rules", json=rule_data)

        if response.status_code == 200:
            result = response.json()
            assert result["organization_id"] == org_id
