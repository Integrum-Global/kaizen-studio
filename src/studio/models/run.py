"""
Run DataFlow Model

Execution run record for work units.
"""

from studio.models import db


@db.model
class Run:
    """
    Run model for tracking work unit executions.

    Distinct from ExecutionMetric which focuses on performance metrics.
    Run model captures the full execution context including inputs/outputs.

    DataFlow generates these nodes automatically:
    - RunCreateNode
    - RunReadNode
    - RunUpdateNode
    - RunDeleteNode
    - RunListNode
    - RunCountNode
    - RunUpsertNode
    - RunBulkCreateNode
    - RunBulkUpdateNode
    - RunBulkDeleteNode
    - RunBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization context
    organization_id: str

    # Work unit reference
    work_unit_id: str
    work_unit_type: str  # atomic, composite
    work_unit_name: str

    # User who initiated the run
    user_id: str
    user_name: str | None

    # Execution status: pending, running, completed, failed, cancelled
    status: str

    # Input/output data (JSON strings)
    input_data: str | None
    output_data: str | None

    # Error information
    error: str | None
    error_type: str | None

    # Timing
    started_at: str
    completed_at: str | None

    # Metrics reference (optional link to ExecutionMetric)
    execution_metric_id: str | None

    # Timestamps (ISO 8601 strings, auto-managed by DataFlow)
    created_at: str
    updated_at: str
