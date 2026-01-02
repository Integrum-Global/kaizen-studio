"""
Test Execution DataFlow Model

Represents test executions for agents and pipelines in the Kaizen Studio platform.
"""

from studio.models import db


@db.model
class TestExecution:
    """
    TestExecution model for tracking agent and pipeline test runs.

    DataFlow generates these nodes automatically:
    - TestExecutionCreateNode
    - TestExecutionReadNode
    - TestExecutionUpdateNode
    - TestExecutionDeleteNode
    - TestExecutionListNode
    - TestExecutionCountNode
    - TestExecutionUpsertNode
    - TestExecutionBulkCreateNode
    - TestExecutionBulkUpdateNode
    - TestExecutionBulkDeleteNode
    - TestExecutionBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization reference
    organization_id: str

    # Optional agent or pipeline reference
    agent_id: str  # Empty string if not provided
    pipeline_id: str  # Empty string if not provided

    # Input/Output data as JSON strings
    input_data: str
    output_data: str  # Empty string until completed

    # Execution status: pending, running, completed, failed
    status: str

    # Performance metrics
    execution_time_ms: int  # 0 until completed
    token_usage: str  # JSON with input/output/total tokens

    # Error information
    error_message: str  # Empty string if no error

    # Audit fields
    created_by: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
