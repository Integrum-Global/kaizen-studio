"""
Scaling Policy Model

Defines auto-scaling policies for gateway instances.
"""

from studio.models import db


@db.model
class ScalingPolicy:
    """
    Scaling policy model for gateway auto-scaling configuration.

    A scaling policy defines the rules for automatically scaling
    gateway instances based on metrics like CPU, memory, or request rate.

    DataFlow auto-generates 11 nodes:
    - ScalingPolicyCreateNode, ScalingPolicyReadNode, ScalingPolicyUpdateNode, ScalingPolicyDeleteNode
    - ScalingPolicyListNode, ScalingPolicyCountNode, ScalingPolicyUpsertNode
    - ScalingPolicyBulkCreateNode, ScalingPolicyBulkUpdateNode, ScalingPolicyBulkDeleteNode, ScalingPolicyBulkUpsertNode
    """

    id: str
    organization_id: str
    gateway_id: str
    name: str
    min_instances: int
    max_instances: int
    target_metric: str  # cpu, memory, requests_per_second, latency_p99, error_rate
    target_value: float  # Target value for metric
    scale_up_threshold: float  # Percent above target to scale up (e.g., 80)
    scale_down_threshold: float  # Percent below target to scale down (e.g., 20)
    cooldown_seconds: int  # Wait between scaling actions
    status: str  # active, inactive
    created_at: str
    updated_at: str
