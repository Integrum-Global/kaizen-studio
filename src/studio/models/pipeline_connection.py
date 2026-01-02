"""
Pipeline Connection DataFlow Model

Represents a connection between nodes in an agent orchestration pipeline.
"""

from studio.models import db


@db.model
class PipelineConnection:
    """
    Pipeline connection model for edges in orchestration pipelines.

    DataFlow generates these nodes automatically:
    - PipelineConnectionCreateNode
    - PipelineConnectionReadNode
    - PipelineConnectionUpdateNode
    - PipelineConnectionDeleteNode
    - PipelineConnectionListNode
    - PipelineConnectionCountNode
    - PipelineConnectionUpsertNode
    - PipelineConnectionBulkCreateNode
    - PipelineConnectionBulkUpdateNode
    - PipelineConnectionBulkDeleteNode
    - PipelineConnectionBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Pipeline reference
    pipeline_id: str

    # Source and target nodes
    source_node_id: str
    target_node_id: str

    # Handle names for connections
    source_handle: str
    target_handle: str

    # Condition for conditional routing (JSON or empty string)
    condition: str  # Empty string if not conditional

    # Timestamp (ISO 8601 string for DataFlow)
    created_at: str
