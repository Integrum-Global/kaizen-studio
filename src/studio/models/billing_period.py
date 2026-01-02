"""
Billing Period DataFlow Model

Represents a billing cycle for an organization.
"""

from studio.models import db


@db.model
class BillingPeriod:
    """
    Billing period model for tracking billing cycles.

    DataFlow generates these nodes automatically:
    - BillingPeriodCreateNode
    - BillingPeriodReadNode
    - BillingPeriodUpdateNode
    - BillingPeriodDeleteNode
    - BillingPeriodListNode
    - BillingPeriodCountNode
    - BillingPeriodUpsertNode
    - BillingPeriodBulkCreateNode
    - BillingPeriodBulkUpdateNode
    - BillingPeriodBulkDeleteNode
    - BillingPeriodBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization reference
    organization_id: str

    # Period dates (ISO 8601)
    start_date: str
    end_date: str

    # Status: active, closed, invoiced
    status: str

    # Aggregated usage for the period
    total_usage: float

    # Total cost for the period
    total_cost: float

    # Optional invoice reference
    invoice_id: str | None

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
