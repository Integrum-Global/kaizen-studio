"""
Execution Metric Model

Represents execution metrics for agent deployments.
"""

from studio.models import db


@db.model
class ExecutionMetric:
    """
    Execution metric model for tracking agent execution performance.

    Stores detailed metrics for each agent execution including
    latency, token usage, costs, and error information.

    DataFlow auto-generates 11 nodes:
    - ExecutionMetricCreateNode, ExecutionMetricReadNode, ExecutionMetricUpdateNode, ExecutionMetricDeleteNode
    - ExecutionMetricListNode, ExecutionMetricCountNode, ExecutionMetricUpsertNode
    - ExecutionMetricBulkCreateNode, ExecutionMetricBulkUpdateNode, ExecutionMetricBulkDeleteNode, ExecutionMetricBulkUpsertNode
    """

    id: str
    organization_id: str
    deployment_id: str
    agent_id: str
    execution_id: str  # Unique per execution
    status: str  # success, failure, timeout
    latency_ms: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost_usd: float
    error_type: str | None
    error_message: str | None
    created_at: str
