"""
Pipeline Node DataFlow Model

Represents a node in an agent orchestration pipeline.
"""

from studio.models import db


@db.model
class PipelineNode:
    """
    Pipeline node model for graph nodes in orchestration pipelines.

    DataFlow generates these nodes automatically:
    - PipelineNodeCreateNode
    - PipelineNodeReadNode
    - PipelineNodeUpdateNode
    - PipelineNodeDeleteNode
    - PipelineNodeListNode
    - PipelineNodeCountNode
    - PipelineNodeUpsertNode
    - PipelineNodeBulkCreateNode
    - PipelineNodeBulkUpdateNode
    - PipelineNodeBulkDeleteNode
    - PipelineNodeBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Pipeline reference
    pipeline_id: str

    # Node type: agent, supervisor, router, synthesizer, connector, input, output
    node_type: str

    # Agent reference (for agent nodes)
    agent_id: str  # Empty string if not an agent node

    # Display label
    label: str

    # Canvas position
    position_x: float
    position_y: float

    # JSON configuration for node
    config: str  # Empty string or JSON if not provided

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
