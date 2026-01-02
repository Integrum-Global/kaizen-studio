"""
Scaling Service

Manages auto-scaling policies and events for gateway instances.
"""

import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.config import get_settings

# Supported scaling metrics
SCALING_METRICS = {
    "cpu": "CPU utilization percentage",
    "memory": "Memory utilization percentage",
    "requests_per_second": "Requests per second",
    "latency_p99": "99th percentile latency in ms",
    "error_rate": "Error rate percentage",
}


class ScalingService:
    """
    Scaling service for gateway auto-scaling management.

    Features:
    - Scaling policy CRUD operations
    - Scaling evaluation and execution
    - Event tracking
    - Metrics collection
    """

    def __init__(self):
        """Initialize the scaling service."""
        self.settings = get_settings()
        self.runtime = AsyncLocalRuntime()

    # ========================
    # Policy CRUD Operations
    # ========================

    async def create_policy(self, data: dict) -> dict:
        """
        Create a new scaling policy.

        Args:
            data: Policy data including:
                - organization_id: str
                - gateway_id: str
                - name: str
                - min_instances: int
                - max_instances: int
                - target_metric: str
                - target_value: float
                - scale_up_threshold: float
                - scale_down_threshold: float
                - cooldown_seconds: int

        Returns:
            Created policy data
        """
        policy_id = str(uuid.uuid4())

        # Validate metric
        target_metric = data.get("target_metric", "cpu")
        if target_metric not in SCALING_METRICS:
            raise ValueError(
                f"Invalid metric: {target_metric}. Must be one of: {list(SCALING_METRICS.keys())}"
            )

        # NOTE: Do NOT set created_at or updated_at - DataFlow manages them automatically
        policy_data = {
            "id": policy_id,
            "organization_id": data["organization_id"],
            "gateway_id": data["gateway_id"],
            "name": data["name"],
            "min_instances": data.get("min_instances", 1),
            "max_instances": data.get("max_instances", 10),
            "target_metric": target_metric,
            "target_value": data.get("target_value", 70.0),
            "scale_up_threshold": data.get("scale_up_threshold", 80.0),
            "scale_down_threshold": data.get("scale_down_threshold", 20.0),
            "cooldown_seconds": data.get("cooldown_seconds", 300),
            "status": data.get("status", "active"),
            # created_at and updated_at are auto-managed by DataFlow
        }

        workflow = WorkflowBuilder()
        # DataFlow CreateNode expects flat fields, not wrapped in "data"
        workflow.add_node("ScalingPolicyCreateNode", "create_policy", policy_data)

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Return result from DataFlow which includes auto-managed timestamps
        result = results.get("create_policy", {})
        if isinstance(result, dict) and "result" in result:
            return result["result"]
        if result:
            return result
        # Fallback to input data if create didn't return result
        return policy_data

    async def get_policy(self, policy_id: str) -> dict | None:
        """
        Get a scaling policy by ID.

        Args:
            policy_id: Policy ID

        Returns:
            Policy data if found, None if not found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ScalingPolicyReadNode",
            "read_policy",
            {"id": policy_id},
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            return results.get("read_policy")
        except Exception as e:
            # ReadNode throws exception when record not found
            if "not found" in str(e).lower():
                return None
            raise

    async def update_policy(self, policy_id: str, data: dict) -> dict:
        """
        Update a scaling policy.

        Args:
            policy_id: Policy ID
            data: Fields to update

        Returns:
            Updated policy data
        """
        # Validate metric if provided
        if "target_metric" in data and data["target_metric"] not in SCALING_METRICS:
            raise ValueError(
                f"Invalid metric: {data['target_metric']}. Must be one of: {list(SCALING_METRICS.keys())}"
            )

        # NOTE: Do NOT set updated_at - DataFlow manages it automatically
        # Removing: data["updated_at"] = datetime.now(UTC).isoformat()

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ScalingPolicyUpdateNode",
            "update_policy",
            {
                "filter": {"id": policy_id},
                "fields": data,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return await self.get_policy(policy_id)

    async def delete_policy(self, policy_id: str):
        """
        Delete a scaling policy.

        Args:
            policy_id: Policy ID
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ScalingPolicyDeleteNode",
            "delete_policy",
            {"filter": {"id": policy_id}},
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    async def list_policies(
        self, organization_id: str, gateway_id: str | None = None
    ) -> list:
        """
        List scaling policies for an organization.

        Args:
            organization_id: Organization ID
            gateway_id: Optional gateway filter

        Returns:
            List of policies
        """
        filter_data = {"organization_id": organization_id}
        if gateway_id:
            filter_data["gateway_id"] = gateway_id

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ScalingPolicyListNode",
            "list_policies",
            {"filter": filter_data},
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        return results.get("list_policies", {}).get("records", [])

    # ========================
    # Scaling Actions
    # ========================

    async def evaluate_scaling(self, gateway_id: str) -> dict:
        """
        Evaluate scaling policies for a gateway and take action if needed.

        Args:
            gateway_id: Gateway ID

        Returns:
            Evaluation result with any scaling action taken
        """
        # Get active policies for gateway
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ScalingPolicyListNode",
            "list_policies",
            {
                "filter": {
                    "gateway_id": gateway_id,
                    "status": "active",
                },
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        policies = results.get("list_policies", {}).get("records", [])

        if not policies:
            return {
                "gateway_id": gateway_id,
                "action": "none",
                "reason": "No active scaling policies",
            }

        # Get current metrics
        metrics = await self.get_gateway_metrics(gateway_id)
        current_instances = await self.get_current_instances(gateway_id)

        # Evaluate each policy
        for policy in policies:
            metric_value = metrics.get(policy["target_metric"], 0)
            target = policy["target_value"]

            # Calculate percentage deviation from target
            if target > 0:
                deviation = ((metric_value - target) / target) * 100
            else:
                deviation = 0

            # Check if scaling is needed
            if deviation >= policy["scale_up_threshold"]:
                # Scale up
                if current_instances < policy["max_instances"]:
                    new_instances = min(current_instances + 1, policy["max_instances"])
                    result = await self.scale_gateway(gateway_id, new_instances)

                    # Record event
                    await self._create_scaling_event(
                        policy_id=policy["id"],
                        gateway_id=gateway_id,
                        event_type="scale_up",
                        from_instances=current_instances,
                        to_instances=new_instances,
                        trigger_metric=policy["target_metric"],
                        trigger_value=metric_value,
                    )

                    return {
                        "gateway_id": gateway_id,
                        "action": "scale_up",
                        "from_instances": current_instances,
                        "to_instances": new_instances,
                        "trigger_metric": policy["target_metric"],
                        "trigger_value": metric_value,
                        "policy_id": policy["id"],
                    }

            elif -deviation >= policy["scale_down_threshold"]:
                # Scale down
                if current_instances > policy["min_instances"]:
                    new_instances = max(current_instances - 1, policy["min_instances"])
                    result = await self.scale_gateway(gateway_id, new_instances)

                    # Record event
                    await self._create_scaling_event(
                        policy_id=policy["id"],
                        gateway_id=gateway_id,
                        event_type="scale_down",
                        from_instances=current_instances,
                        to_instances=new_instances,
                        trigger_metric=policy["target_metric"],
                        trigger_value=metric_value,
                    )

                    return {
                        "gateway_id": gateway_id,
                        "action": "scale_down",
                        "from_instances": current_instances,
                        "to_instances": new_instances,
                        "trigger_metric": policy["target_metric"],
                        "trigger_value": metric_value,
                        "policy_id": policy["id"],
                    }

        return {
            "gateway_id": gateway_id,
            "action": "none",
            "reason": "Metrics within thresholds",
            "current_instances": current_instances,
            "metrics": metrics,
        }

    async def scale_gateway(self, gateway_id: str, target_instances: int) -> dict:
        """
        Scale a gateway to target number of instances.

        Args:
            gateway_id: Gateway ID
            target_instances: Target number of instances

        Returns:
            Scaling result
        """
        # In production, this would call Kubernetes/cloud APIs
        # For now, we simulate the scaling action
        return {
            "gateway_id": gateway_id,
            "target_instances": target_instances,
            "status": "completed",
            "message": f"Gateway scaled to {target_instances} instances",
        }

    async def get_current_instances(self, gateway_id: str) -> int:
        """
        Get current number of instances for a gateway.

        Args:
            gateway_id: Gateway ID

        Returns:
            Current instance count
        """
        # In production, this would query Kubernetes/cloud APIs
        # For now, return a default value
        return 2

    # ========================
    # Events
    # ========================

    async def list_events(self, gateway_id: str, limit: int = 50) -> list:
        """
        List scaling events for a gateway.

        Args:
            gateway_id: Gateway ID
            limit: Maximum events to return

        Returns:
            List of scaling events
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ScalingEventListNode",
            "list_events",
            {
                "filter": {"gateway_id": gateway_id},
                "limit": limit,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        return results.get("list_events", {}).get("records", [])

    async def get_event(self, event_id: str) -> dict | None:
        """
        Get a scaling event by ID.

        Args:
            event_id: Event ID

        Returns:
            Event data if found, None if not found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ScalingEventReadNode",
            "read_event",
            {"id": event_id},
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            return results.get("read_event")
        except Exception as e:
            # ReadNode throws exception when record not found
            if "not found" in str(e).lower():
                return None
            raise

    async def _create_scaling_event(
        self,
        policy_id: str,
        gateway_id: str,
        event_type: str,
        from_instances: int,
        to_instances: int,
        trigger_metric: str,
        trigger_value: float,
        status: str = "completed",
        error_message: str | None = None,
    ) -> dict:
        """
        Create a scaling event record.

        Args:
            policy_id: Policy ID
            gateway_id: Gateway ID
            event_type: scale_up or scale_down
            from_instances: Previous instance count
            to_instances: New instance count
            trigger_metric: Metric that triggered scaling
            trigger_value: Value of trigger metric
            status: Event status
            error_message: Error message if failed

        Returns:
            Created event data
        """
        event_id = str(uuid.uuid4())

        # NOTE: created_at is auto-managed by DataFlow, but completed_at is a custom field
        event_data = {
            "id": event_id,
            "policy_id": policy_id,
            "gateway_id": gateway_id,
            "event_type": event_type,
            "from_instances": from_instances,
            "to_instances": to_instances,
            "trigger_metric": trigger_metric,
            "trigger_value": trigger_value,
            "status": status,
            "error_message": error_message,
            # created_at is auto-managed by DataFlow
            "completed_at": (
                datetime.now(UTC).isoformat() if status == "completed" else None
            ),
        }

        workflow = WorkflowBuilder()
        workflow.add_node("ScalingEventCreateNode", "create_event", event_data)

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return event_data

    # ========================
    # Metrics
    # ========================

    async def get_gateway_metrics(self, gateway_id: str) -> dict:
        """
        Get current metrics for a gateway.

        Args:
            gateway_id: Gateway ID

        Returns:
            Dictionary of metric values
        """
        # In production, this would query Prometheus/CloudWatch/etc.
        # For now, return simulated metrics
        return {
            "cpu": 45.0,
            "memory": 62.0,
            "requests_per_second": 150.0,
            "latency_p99": 85.0,
            "error_rate": 0.5,
        }

    def get_supported_metrics(self) -> dict:
        """
        Get list of supported scaling metrics.

        Returns:
            Dictionary of metric names and descriptions
        """
        return SCALING_METRICS.copy()
