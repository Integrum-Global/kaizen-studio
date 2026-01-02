"""
Usage Record DataFlow Model

Tracks resource usage for billing purposes.
"""

from studio.models import db


@db.model
class UsageRecord:
    """
    Usage record model for tracking resource consumption.

    DataFlow generates these nodes automatically:
    - UsageRecordCreateNode
    - UsageRecordReadNode
    - UsageRecordUpdateNode
    - UsageRecordDeleteNode
    - UsageRecordListNode
    - UsageRecordCountNode
    - UsageRecordUpsertNode
    - UsageRecordBulkCreateNode
    - UsageRecordBulkUpdateNode
    - UsageRecordBulkDeleteNode
    - UsageRecordBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization reference
    organization_id: str

    # Resource type: agent_execution, token, storage, api_call
    resource_type: str

    # Usage quantity
    quantity: float

    # Unit: count, tokens, bytes, requests
    unit: str

    # Cost per unit
    unit_cost: float

    # Total cost (quantity * unit_cost)
    total_cost: float

    # Optional JSON metadata with details
    metadata: str | None

    # When the usage was recorded (ISO 8601)
    recorded_at: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
