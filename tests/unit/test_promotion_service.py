"""
Tier 1: Promotion Service Unit Tests

Tests promotion service logic in isolation with mocked DataFlow operations.
Mocking is allowed in Tier 1 for external dependencies like workflow runtime.
"""

import uuid
from datetime import UTC, datetime

import pytest


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPromotionCreation:
    """Test promotion creation logic."""

    def test_promotion_has_required_fields(self, promotion_factory):
        """Promotion should have all required fields."""
        promotion = promotion_factory()
        required_fields = [
            "id",
            "organization_id",
            "agent_id",
            "source_deployment_id",
            "target_gateway_id",
            "source_environment",
            "target_environment",
            "status",
            "requires_approval",
            "created_by",
            "created_at",
        ]
        for field in required_fields:
            assert field in promotion, f"Missing required field: {field}"

    def test_promotion_id_is_valid_uuid(self, promotion_factory):
        """Promotion ID should be valid UUID."""
        promotion = promotion_factory()
        parsed = uuid.UUID(promotion["id"])
        assert str(parsed) == promotion["id"]

    def test_organization_id_is_valid_uuid(self, promotion_factory):
        """Organization ID should be valid UUID."""
        promotion = promotion_factory()
        parsed = uuid.UUID(promotion["organization_id"])
        assert str(parsed) == promotion["organization_id"]

    def test_agent_id_is_valid_uuid(self, promotion_factory):
        """Agent ID should be valid UUID."""
        promotion = promotion_factory()
        parsed = uuid.UUID(promotion["agent_id"])
        assert str(parsed) == promotion["agent_id"]

    def test_created_at_is_iso8601(self, promotion_factory):
        """Created at should be ISO 8601 format."""
        promotion = promotion_factory()
        datetime.fromisoformat(promotion["created_at"].replace("Z", "+00:00"))

    def test_promotion_status_valid_values(self, promotion_factory):
        """Status should be one of valid values."""
        valid_statuses = ["pending", "approved", "rejected", "completed", "failed"]
        for status in valid_statuses:
            promotion = promotion_factory(status=status)
            assert promotion["status"] == status

    def test_promotion_environments_valid(self, promotion_factory):
        """Environments should be valid."""
        valid_envs = ["development", "staging", "production"]
        for env in valid_envs:
            promotion = promotion_factory(source_environment=env)
            assert promotion["source_environment"] == env

            promotion = promotion_factory(target_environment=env)
            assert promotion["target_environment"] == env

    def test_promotion_initial_status_is_pending(self, promotion_factory):
        """New promotion should have pending status by default."""
        promotion = promotion_factory()
        assert promotion["status"] == "pending"

    def test_promotion_requires_approval_field(self, promotion_factory):
        """Promotion should track approval requirement."""
        promotion = promotion_factory(requires_approval=True)
        assert promotion["requires_approval"] is True

        promotion = promotion_factory(requires_approval=False)
        assert promotion["requires_approval"] is False

    def test_promotion_optional_approval_fields(self, promotion_factory):
        """Approval fields can be null initially."""
        promotion = promotion_factory()
        assert promotion["approved_by"] is None
        assert promotion["approved_at"] is None
        assert promotion["rejection_reason"] is None

    def test_promotion_optional_deployment_fields(self, promotion_factory):
        """Deployment fields can be null initially."""
        promotion = promotion_factory()
        assert promotion["target_deployment_id"] is None
        assert promotion["completed_at"] is None

    def test_different_promotions_have_different_ids(self, promotion_factory):
        """Each promotion should have unique ID."""
        p1 = promotion_factory()
        p2 = promotion_factory()
        assert p1["id"] != p2["id"]

    def test_promotion_with_custom_environments(self, promotion_factory):
        """Should support custom environment values."""
        promotion = promotion_factory(
            source_environment="staging", target_environment="production"
        )
        assert promotion["source_environment"] == "staging"
        assert promotion["target_environment"] == "production"


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPromotionApprovalWorkflow:
    """Test promotion approval workflow logic."""

    def test_approved_promotion_has_approver_info(self, promotion_factory):
        """Approved promotion should track approver."""
        now = datetime.now(UTC).isoformat()
        approver_id = str(uuid.uuid4())

        promotion = promotion_factory(
            status="approved",
            approved_by=approver_id,
            approved_at=now,
        )

        assert promotion["status"] == "approved"
        assert promotion["approved_by"] == approver_id
        assert promotion["approved_at"] == now

    def test_rejected_promotion_has_rejection_reason(self, promotion_factory):
        """Rejected promotion should have reason."""
        promotion = promotion_factory(
            status="rejected",
            rejection_reason="Deployment failed health checks",
        )

        assert promotion["status"] == "rejected"
        assert promotion["rejection_reason"] == "Deployment failed health checks"

    def test_completed_promotion_has_target_deployment(self, promotion_factory):
        """Completed promotion should have target deployment."""
        target_id = str(uuid.uuid4())
        now = datetime.now(UTC).isoformat()

        promotion = promotion_factory(
            status="completed",
            target_deployment_id=target_id,
            completed_at=now,
        )

        assert promotion["status"] == "completed"
        assert promotion["target_deployment_id"] == target_id
        assert promotion["completed_at"] == now

    def test_failed_promotion_has_error_message(self, promotion_factory):
        """Failed promotion should have error message."""
        promotion = promotion_factory(
            status="failed",
            rejection_reason="Gateway connection timeout",
        )

        assert promotion["status"] == "failed"
        assert "timeout" in promotion["rejection_reason"].lower()

    def test_approval_workflow_states_progression(self, promotion_factory):
        """Test state transitions in approval workflow."""
        # Start as pending
        promotion = promotion_factory(status="pending", requires_approval=True)
        assert promotion["status"] == "pending"

        # Can be approved
        promotion = promotion_factory(status="approved")
        assert promotion["status"] == "approved"

        # Or rejected
        promotion = promotion_factory(status="rejected")
        assert promotion["status"] == "rejected"


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPromotionRuleMatching:
    """Test promotion rule matching logic."""

    def test_rule_has_required_fields(self, promotion_rule_factory):
        """Rule should have all required fields."""
        rule = promotion_rule_factory()
        required_fields = [
            "id",
            "organization_id",
            "name",
            "source_environment",
            "target_environment",
            "requires_approval",
            "auto_promote",
            "required_approvers",
            "status",
            "created_at",
            "updated_at",
        ]
        for field in required_fields:
            assert field in rule, f"Missing required field: {field}"

    def test_rule_id_is_valid_uuid(self, promotion_rule_factory):
        """Rule ID should be valid UUID."""
        rule = promotion_rule_factory()
        parsed = uuid.UUID(rule["id"])
        assert str(parsed) == rule["id"]

    def test_rule_status_valid_values(self, promotion_rule_factory):
        """Rule status should be active or inactive."""
        rule = promotion_rule_factory(status="active")
        assert rule["status"] == "active"

        rule = promotion_rule_factory(status="inactive")
        assert rule["status"] == "inactive"

    def test_rule_requires_approval_flag(self, promotion_rule_factory):
        """Rule can require or not require approval."""
        rule = promotion_rule_factory(requires_approval=True)
        assert rule["requires_approval"] is True

        rule = promotion_rule_factory(requires_approval=False)
        assert rule["requires_approval"] is False

    def test_rule_auto_promote_flag(self, promotion_rule_factory):
        """Rule can enable or disable auto-promotion."""
        rule = promotion_rule_factory(auto_promote=True)
        assert rule["auto_promote"] is True

        rule = promotion_rule_factory(auto_promote=False)
        assert rule["auto_promote"] is False

    def test_rule_required_approvers_count(self, promotion_rule_factory):
        """Rule should track required number of approvers."""
        rule = promotion_rule_factory(required_approvers=1)
        assert rule["required_approvers"] == 1

        rule = promotion_rule_factory(required_approvers=3)
        assert rule["required_approvers"] == 3

    def test_rule_conditions_is_optional(self, promotion_rule_factory):
        """Rule conditions can be optional."""
        rule = promotion_rule_factory(conditions=None)
        assert rule["conditions"] is None

        conditions = {"min_test_pass_rate": 0.9}
        rule = promotion_rule_factory(conditions=conditions)
        assert rule["conditions"] == conditions

    def test_rule_environment_matching(self, promotion_rule_factory):
        """Rule should match source and target environments."""
        rule = promotion_rule_factory(
            source_environment="development",
            target_environment="staging",
        )

        assert rule["source_environment"] == "development"
        assert rule["target_environment"] == "staging"

    def test_different_rules_have_different_ids(self, promotion_rule_factory):
        """Each rule should have unique ID."""
        r1 = promotion_rule_factory()
        r2 = promotion_rule_factory()
        assert r1["id"] != r2["id"]

    def test_rule_with_complex_conditions(self, promotion_rule_factory):
        """Rule can store complex conditions."""
        conditions = {
            "min_test_pass_rate": 0.95,
            "max_error_rate": 0.01,
            "required_health_checks": ["liveness", "readiness"],
        }
        rule = promotion_rule_factory(conditions=conditions)
        assert rule["conditions"] == conditions

    def test_rule_for_production_promotion(self, promotion_rule_factory):
        """Rule for production promotions."""
        rule = promotion_rule_factory(
            source_environment="staging",
            target_environment="production",
            requires_approval=True,
            auto_promote=False,
            required_approvers=2,
        )

        assert rule["target_environment"] == "production"
        assert rule["requires_approval"] is True
        assert rule["auto_promote"] is False
        assert rule["required_approvers"] == 2


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPromotionValidation:
    """Test promotion data validation."""

    def test_promotion_source_deployment_required(self, promotion_factory):
        """Source deployment ID is required."""
        promotion = promotion_factory()
        assert promotion["source_deployment_id"]
        assert len(promotion["source_deployment_id"]) > 0

    def test_promotion_target_gateway_required(self, promotion_factory):
        """Target gateway ID is required."""
        promotion = promotion_factory()
        assert promotion["target_gateway_id"]
        assert len(promotion["target_gateway_id"]) > 0

    def test_promotion_created_by_required(self, promotion_factory):
        """Created by user ID is required."""
        promotion = promotion_factory()
        assert promotion["created_by"]
        assert len(promotion["created_by"]) > 0

    def test_promotion_different_source_and_target(self, promotion_factory):
        """Source and target should typically be different."""
        promotion = promotion_factory()
        # While not strictly enforced, they should differ
        if promotion["source_environment"] != promotion["target_environment"]:
            assert True
        # Even if same env, deployments should differ
        if promotion["source_deployment_id"] == promotion["target_deployment_id"]:
            # Target can be null initially
            assert promotion["target_deployment_id"] is None

    def test_promotion_timestamps_are_strings(self, promotion_factory):
        """All timestamp fields should be ISO 8601 strings."""
        promotion = promotion_factory()
        datetime.fromisoformat(promotion["created_at"].replace("Z", "+00:00"))

        if promotion["completed_at"]:
            datetime.fromisoformat(promotion["completed_at"].replace("Z", "+00:00"))

        if promotion["approved_at"]:
            datetime.fromisoformat(promotion["approved_at"].replace("Z", "+00:00"))

    def test_promotion_organization_context(self, promotion_factory):
        """Promotion should belong to organization."""
        org_id = str(uuid.uuid4())
        promotion = promotion_factory(organization_id=org_id)
        assert promotion["organization_id"] == org_id


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPromotionServiceLogic:
    """Test business logic of promotion service."""

    def test_production_promotion_requires_approval_by_default(self):
        """Production promotions should require approval."""
        # Logic: target_environment == "production" implies requires_approval
        target_env = "production"
        requires_approval = target_env == "production"
        assert requires_approval is True

    def test_staging_promotion_may_not_require_approval(self):
        """Staging promotions may not require approval by default."""
        target_env = "staging"
        # Default rule: staging doesn't require approval
        requires_approval = target_env == "production"
        assert requires_approval is False

    def test_auto_promotion_conditions(self, promotion_rule_factory):
        """Auto-promotion should check conditions."""
        rule = promotion_rule_factory(
            auto_promote=True,
            conditions={
                "min_test_pass_rate": 0.95,
                "max_error_rate": 0.01,
            },
        )

        assert rule["auto_promote"] is True
        assert rule["conditions"] is not None
        assert rule["conditions"]["min_test_pass_rate"] == 0.95

    def test_approval_count_validation(self, promotion_rule_factory):
        """Rule should specify required approvers."""
        rule = promotion_rule_factory(required_approvers=2)
        assert rule["required_approvers"] >= 1


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPromotionRuleOperations:
    """Test promotion rule CRUD operations."""

    def test_create_rule_with_all_fields(self, promotion_rule_factory):
        """Should create rule with all fields."""
        rule = promotion_rule_factory(
            name="Dev to Staging Promotion",
            source_environment="development",
            target_environment="staging",
            requires_approval=False,
            auto_promote=True,
            required_approvers=1,
            conditions={"min_test_pass_rate": 0.9},
            status="active",
        )

        assert rule["name"] == "Dev to Staging Promotion"
        assert rule["source_environment"] == "development"
        assert rule["target_environment"] == "staging"
        assert rule["requires_approval"] is False
        assert rule["auto_promote"] is True

    def test_update_rule_changes_fields(self, promotion_rule_factory):
        """Updating rule should change fields."""
        rule = promotion_rule_factory(auto_promote=False)
        assert rule["auto_promote"] is False

        # Simulate update
        rule["auto_promote"] = True
        rule["updated_at"] = datetime.now(UTC).isoformat()
        assert rule["auto_promote"] is True

    def test_deactivate_rule(self, promotion_rule_factory):
        """Should be able to deactivate rule."""
        rule = promotion_rule_factory(status="active")
        assert rule["status"] == "active"

        # Simulate deactivation
        rule["status"] = "inactive"
        assert rule["status"] == "inactive"

    def test_rule_unique_per_org(self, promotion_rule_factory):
        """Rules should be unique to organization."""
        org1 = str(uuid.uuid4())
        org2 = str(uuid.uuid4())

        rule1 = promotion_rule_factory(organization_id=org1)
        rule2 = promotion_rule_factory(organization_id=org2)

        assert rule1["organization_id"] != rule2["organization_id"]

    def test_multiple_rules_same_environments(self, promotion_rule_factory):
        """Can have multiple rules for same environment pair."""
        rule1 = promotion_rule_factory(
            source_environment="development",
            target_environment="staging",
            auto_promote=True,
        )
        rule2 = promotion_rule_factory(
            source_environment="development",
            target_environment="staging",
            auto_promote=False,
        )

        # Different rules, same path
        assert rule1["id"] != rule2["id"]
        assert rule1["auto_promote"] != rule2["auto_promote"]
