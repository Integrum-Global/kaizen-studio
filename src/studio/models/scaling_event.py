"""
Scaling Event Model

Records auto-scaling events for audit and monitoring.
"""

from studio.models import db


@db.model
class ScalingEvent:
    """
    Scaling event model for recording auto-scaling actions.

    Each scaling event tracks when a gateway was scaled up or down,
    including the trigger metric and final outcome.

    DataFlow auto-generates 11 nodes:
    - ScalingEventCreateNode, ScalingEventReadNode, ScalingEventUpdateNode, ScalingEventDeleteNode
    - ScalingEventListNode, ScalingEventCountNode, ScalingEventUpsertNode
    - ScalingEventBulkCreateNode, ScalingEventBulkUpdateNode, ScalingEventBulkDeleteNode, ScalingEventBulkUpsertNode
    """

    id: str
    policy_id: str
    gateway_id: str
    event_type: str  # scale_up, scale_down
    from_instances: int
    to_instances: int
    trigger_metric: str
    trigger_value: float
    status: str  # pending, completed, failed
    error_message: str | None
    created_at: str
    completed_at: str | None
