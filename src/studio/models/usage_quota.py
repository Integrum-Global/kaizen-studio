"""
Usage Quota DataFlow Model

Defines usage limits per organization and resource type.
"""

from studio.models import db


@db.model
class UsageQuota:
    """
    Usage quota model for enforcing resource limits.

    DataFlow generates these nodes automatically:
    - UsageQuotaCreateNode
    - UsageQuotaReadNode
    - UsageQuotaUpdateNode
    - UsageQuotaDeleteNode
    - UsageQuotaListNode
    - UsageQuotaCountNode
    - UsageQuotaUpsertNode
    - UsageQuotaBulkCreateNode
    - UsageQuotaBulkUpdateNode
    - UsageQuotaBulkDeleteNode
    - UsageQuotaBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization reference
    organization_id: str

    # Resource type: agent_execution, token, storage, api_call
    resource_type: str

    # Quota limit (-1 for unlimited)
    limit_value: float

    # Current usage within period
    current_usage: float

    # Reset period: monthly, daily
    reset_period: str

    # Last reset timestamp (ISO 8601)
    last_reset_at: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
