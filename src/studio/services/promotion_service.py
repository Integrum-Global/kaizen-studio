"""
Promotion Service

Manages environment promotion workflows for agent deployments.
"""

import json
import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.config import get_settings
from studio.services.deployment_service import DeploymentService


class PromotionService:
    """
    Promotion service for managing environment promotions.

    Features:
    - Promotion request CRUD operations
    - Approval workflow management
    - Promotion execution
    - Auto-promotion rule checking
    """

    def __init__(self, runtime=None):
        """Initialize the promotion service."""
        self.settings = get_settings()
        self.runtime = runtime or AsyncLocalRuntime()
        self.deployment_service = DeploymentService(runtime=self.runtime)

    async def create(self, data: dict) -> dict:
        """
        Create a new promotion request.

        Args:
            data: Promotion request data

        Returns:
            Created promotion data
        """
        now = datetime.now(UTC).isoformat()
        promotion_id = str(uuid.uuid4())

        # Check if approval is required based on rules
        requires_approval = await self._check_requires_approval(
            data["organization_id"],
            data["source_environment"],
            data["target_environment"],
        )

        promotion_data = {
            "id": promotion_id,
            "organization_id": data["organization_id"],
            "agent_id": data["agent_id"],
            "source_deployment_id": data["source_deployment_id"],
            "target_gateway_id": data["target_gateway_id"],
            "source_environment": data["source_environment"],
            "target_environment": data["target_environment"],
            "status": "pending",
            "requires_approval": requires_approval,
            "approved_by": "",  # Kailash requires string, not None
            "approved_at": "",  # Will be set when approved
            "rejection_reason": "",  # Will be set if rejected
            "target_deployment_id": "",  # Will be set when executed
            "created_by": data["created_by"],
            # created_at is auto-managed by database DEFAULT
            "completed_at": "",  # Will be set when completed
        }

        workflow = WorkflowBuilder()
        workflow.add_node("PromotionCreateNode", "create_promotion", promotion_data)

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Auto-execute if no approval required
        if not requires_approval:
            return await self.execute(promotion_id)

        return promotion_data

    async def get(self, promotion_id: str) -> dict | None:
        """
        Get a promotion by ID.

        Args:
            promotion_id: Promotion ID

        Returns:
            Promotion data if found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PromotionReadNode",
            "read_promotion",
            {
                "id": promotion_id,
            },
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            return results.get("read_promotion")
        except Exception:
            # Record not found - DataFlow throws an exception
            return None

    async def list(
        self,
        organization_id: str,
        status: str | None = None,
        agent_id: str | None = None,
    ) -> list:
        """
        List promotions with optional filters.

        Args:
            organization_id: Organization ID
            status: Optional status filter
            agent_id: Optional agent filter

        Returns:
            List of promotions
        """
        filter_data = {"organization_id": organization_id}
        if status:
            filter_data["status"] = status
        if agent_id:
            filter_data["agent_id"] = agent_id

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PromotionListNode",
            "list_promotions",
            {
                "filter": filter_data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        return results.get("list_promotions", {}).get("records", [])

    async def approve(self, promotion_id: str, user_id: str) -> dict:
        """
        Approve a promotion request.

        Args:
            promotion_id: Promotion ID
            user_id: User ID approving

        Returns:
            Updated promotion data
        """
        promotion = await self.get(promotion_id)
        if not promotion:
            raise ValueError(f"Promotion not found: {promotion_id}")

        if promotion["status"] != "pending":
            raise ValueError(
                f"Cannot approve promotion in status: {promotion['status']}"
            )

        now = datetime.now(UTC).isoformat()

        update_workflow = WorkflowBuilder()
        update_workflow.add_node(
            "PromotionUpdateNode",
            "update_promotion",
            {
                "filter": {"id": promotion_id},
                "fields": {
                    "status": "approved",
                    "approved_by": user_id,
                    "approved_at": now,
                },
            },
        )

        await self.runtime.execute_workflow_async(update_workflow.build(), inputs={})

        promotion["status"] = "approved"
        promotion["approved_by"] = user_id
        promotion["approved_at"] = now

        # Auto-execute after approval
        return await self.execute(promotion_id)

    async def reject(self, promotion_id: str, user_id: str, reason: str) -> dict:
        """
        Reject a promotion request.

        Args:
            promotion_id: Promotion ID
            user_id: User ID rejecting
            reason: Rejection reason

        Returns:
            Updated promotion data
        """
        promotion = await self.get(promotion_id)
        if not promotion:
            raise ValueError(f"Promotion not found: {promotion_id}")

        if promotion["status"] != "pending":
            raise ValueError(
                f"Cannot reject promotion in status: {promotion['status']}"
            )

        now = datetime.now(UTC).isoformat()

        update_workflow = WorkflowBuilder()
        update_workflow.add_node(
            "PromotionUpdateNode",
            "update_promotion",
            {
                "filter": {"id": promotion_id},
                "fields": {
                    "status": "rejected",
                    "rejection_reason": reason,
                    "completed_at": now,
                },
            },
        )

        await self.runtime.execute_workflow_async(update_workflow.build(), inputs={})

        promotion["status"] = "rejected"
        promotion["rejection_reason"] = reason
        promotion["completed_at"] = now

        return promotion

    async def execute(self, promotion_id: str) -> dict:
        """
        Execute a promotion by deploying to target environment.

        Args:
            promotion_id: Promotion ID

        Returns:
            Updated promotion with target deployment
        """
        promotion = await self.get(promotion_id)
        if not promotion:
            raise ValueError(f"Promotion not found: {promotion_id}")

        if promotion["status"] not in ("pending", "approved"):
            raise ValueError(
                f"Cannot execute promotion in status: {promotion['status']}"
            )

        # Get source deployment
        source_deployment = await self.deployment_service.get(
            promotion["source_deployment_id"]
        )
        if not source_deployment:
            raise ValueError(
                f"Source deployment not found: {promotion['source_deployment_id']}"
            )

        if source_deployment["status"] != "active":
            raise ValueError(
                f"Source deployment is not active: {source_deployment['status']}"
            )

        try:
            # Create new deployment to target gateway
            target_deployment = await self.deployment_service.deploy(
                agent_id=promotion["agent_id"],
                gateway_id=promotion["target_gateway_id"],
                user_id=promotion["created_by"],
                agent_version_id=source_deployment.get("agent_version_id"),
            )

            now = datetime.now(UTC).isoformat()

            # Update promotion with success
            update_workflow = WorkflowBuilder()
            update_workflow.add_node(
                "PromotionUpdateNode",
                "update_promotion",
                {
                    "filter": {"id": promotion_id},
                    "fields": {
                        "status": "completed",
                        "target_deployment_id": target_deployment["id"],
                        "completed_at": now,
                    },
                },
            )

            await self.runtime.execute_workflow_async(
                update_workflow.build(), inputs={}
            )

            promotion["status"] = "completed"
            promotion["target_deployment_id"] = target_deployment["id"]
            promotion["completed_at"] = now

            return promotion

        except Exception as e:
            # Update promotion with failure
            now = datetime.now(UTC).isoformat()

            update_workflow = WorkflowBuilder()
            update_workflow.add_node(
                "PromotionUpdateNode",
                "update_promotion",
                {
                    "filter": {"id": promotion_id},
                    "fields": {
                        "status": "failed",
                        "rejection_reason": str(e),
                        "completed_at": now,
                    },
                },
            )

            await self.runtime.execute_workflow_async(
                update_workflow.build(), inputs={}
            )

            promotion["status"] = "failed"
            promotion["rejection_reason"] = str(e)
            promotion["completed_at"] = now

            return promotion

    async def check_auto_promotion(self, deployment_id: str) -> bool:
        """
        Check if a deployment should be auto-promoted based on rules.

        Args:
            deployment_id: Deployment ID to check

        Returns:
            True if auto-promotion was triggered
        """
        deployment = await self.deployment_service.get(deployment_id)
        if not deployment or deployment["status"] != "active":
            return False

        # Get gateway to determine environment
        gateway_workflow = WorkflowBuilder()
        gateway_workflow.add_node(
            "GatewayReadNode", "read_gateway", {"id": deployment["gateway_id"]}
        )
        gateway_results, _ = await self.runtime.execute_workflow_async(
            gateway_workflow.build(), inputs={}
        )
        gateway = gateway_results.get("read_gateway")

        if not gateway:
            return False

        source_environment = gateway.get("environment", "development")

        # Find matching auto-promotion rule
        rules = await self.list_rules(
            organization_id=deployment["organization_id"],
            status="active",
        )

        for rule in rules:
            if (
                rule["source_environment"] == source_environment
                and rule["auto_promote"]
            ):
                # Check conditions if any
                if rule.get("conditions"):
                    if not await self._check_conditions(
                        deployment_id, json.loads(rule["conditions"])
                    ):
                        continue

                # Find target gateway
                target_gateway = await self._find_target_gateway(
                    deployment["organization_id"],
                    rule["target_environment"],
                )

                if target_gateway:
                    # Create promotion request
                    await self.create(
                        {
                            "organization_id": deployment["organization_id"],
                            "agent_id": deployment["agent_id"],
                            "source_deployment_id": deployment_id,
                            "target_gateway_id": target_gateway["id"],
                            "source_environment": source_environment,
                            "target_environment": rule["target_environment"],
                            "created_by": deployment["deployed_by"],
                        }
                    )
                    return True

        return False

    async def _check_requires_approval(
        self, organization_id: str, source_env: str, target_env: str
    ) -> bool:
        """Check if approval is required based on rules."""
        # Production always requires approval by default
        if target_env == "production":
            return True

        # Check organization rules
        rules = await self.list_rules(organization_id=organization_id, status="active")

        for rule in rules:
            if (
                rule["source_environment"] == source_env
                and rule["target_environment"] == target_env
            ):
                return rule["requires_approval"]

        # Default: staging doesn't require approval
        return False

    async def _check_conditions(self, deployment_id: str, conditions: dict) -> bool:
        """Check if deployment meets promotion conditions."""
        # Check test pass rate
        if "min_test_pass_rate" in conditions:
            # Get test executions for this deployment
            test_workflow = WorkflowBuilder()
            test_workflow.add_node(
                "TestExecutionListNode",
                "list_tests",
                {
                    "filter": {"deployment_id": deployment_id},
                },
            )
            test_results, _ = await self.runtime.execute_workflow_async(
                test_workflow.build(), inputs={}
            )
            tests = test_results.get("list_tests", {}).get("records", [])

            if tests:
                passed = sum(1 for t in tests if t.get("status") == "passed")
                pass_rate = passed / len(tests)
                if pass_rate < conditions["min_test_pass_rate"]:
                    return False

        return True

    async def _find_target_gateway(
        self, organization_id: str, target_environment: str
    ) -> dict | None:
        """Find a gateway for the target environment."""
        gateway_workflow = WorkflowBuilder()
        gateway_workflow.add_node(
            "GatewayListNode",
            "list_gateways",
            {
                "filter": {
                    "organization_id": organization_id,
                    "environment": target_environment,
                    "status": "active",
                },
            },
        )
        gateway_results, _ = await self.runtime.execute_workflow_async(
            gateway_workflow.build(), inputs={}
        )
        gateways = gateway_results.get("list_gateways", {}).get("records", [])

        return gateways[0] if gateways else None

    # Promotion Rules CRUD

    async def create_rule(self, data: dict) -> dict:
        """
        Create a new promotion rule.

        Args:
            data: Rule data

        Returns:
            Created rule data
        """
        now = datetime.now(UTC).isoformat()
        rule_id = str(uuid.uuid4())

        rule_data = {
            "id": rule_id,
            "organization_id": data["organization_id"],
            "name": data["name"],
            "source_environment": data["source_environment"],
            "target_environment": data["target_environment"],
            "requires_approval": data.get("requires_approval", True),
            "auto_promote": data.get("auto_promote", False),
            "required_approvers": data.get("required_approvers", 1),
            "conditions": (
                json.dumps(data["conditions"]) if data.get("conditions") else None
            ),
            "status": data.get("status", "active"),
            "created_at": now,
            "updated_at": now,
        }

        workflow = WorkflowBuilder()
        workflow.add_node("PromotionRuleCreateNode", "create_rule", rule_data)

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return rule_data

    async def get_rule(self, rule_id: str) -> dict | None:
        """
        Get a promotion rule by ID.

        Args:
            rule_id: Rule ID

        Returns:
            Rule data if found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PromotionRuleReadNode",
            "read_rule",
            {
                "id": rule_id,
            },
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            rule = results.get("read_rule")

            if rule and rule.get("conditions"):
                try:
                    rule["conditions"] = json.loads(rule["conditions"])
                except json.JSONDecodeError:
                    pass

            return rule
        except Exception:
            # Record not found - DataFlow throws an exception
            return None

    async def list_rules(
        self,
        organization_id: str,
        status: str | None = None,
    ) -> list:
        """
        List promotion rules with optional filters.

        Args:
            organization_id: Organization ID
            status: Optional status filter

        Returns:
            List of rules
        """
        filter_data = {"organization_id": organization_id}
        if status:
            filter_data["status"] = status

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PromotionRuleListNode",
            "list_rules",
            {
                "filter": filter_data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        rules = results.get("list_rules", {}).get("records", [])

        # Parse conditions JSON
        for rule in rules:
            if rule.get("conditions"):
                try:
                    rule["conditions"] = json.loads(rule["conditions"])
                except json.JSONDecodeError:
                    pass

        return rules

    async def update_rule(self, rule_id: str, data: dict) -> dict:
        """
        Update a promotion rule.

        Args:
            rule_id: Rule ID
            data: Fields to update

        Returns:
            Updated rule data
        """
        rule = await self.get_rule(rule_id)
        if not rule:
            raise ValueError(f"Promotion rule not found: {rule_id}")

        # Don't set updated_at manually - DataFlow handles it automatically
        fields = {}

        if "name" in data:
            fields["name"] = data["name"]
        if "requires_approval" in data:
            fields["requires_approval"] = data["requires_approval"]
        if "auto_promote" in data:
            fields["auto_promote"] = data["auto_promote"]
        if "required_approvers" in data:
            fields["required_approvers"] = data["required_approvers"]
        if "conditions" in data:
            fields["conditions"] = (
                json.dumps(data["conditions"]) if data["conditions"] else None
            )
        if "status" in data:
            fields["status"] = data["status"]

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PromotionRuleUpdateNode",
            "update_rule",
            {
                "filter": {"id": rule_id},
                "fields": fields,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        rule.update(fields)
        if rule.get("conditions") and isinstance(rule["conditions"], str):
            try:
                rule["conditions"] = json.loads(rule["conditions"])
            except json.JSONDecodeError:
                pass

        return rule

    async def delete_rule(self, rule_id: str) -> bool:
        """
        Delete a promotion rule.

        Args:
            rule_id: Rule ID

        Returns:
            True if deleted
        """
        rule = await self.get_rule(rule_id)
        if not rule:
            raise ValueError(f"Promotion rule not found: {rule_id}")

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PromotionRuleDeleteNode",
            "delete_rule",
            {
                "id": rule_id,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return True
