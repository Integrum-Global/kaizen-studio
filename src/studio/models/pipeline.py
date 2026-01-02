"""
Pipeline DataFlow Model

Represents an agent orchestration pipeline in the Kaizen Studio platform.
"""

from studio.models import db


@db.model
class Pipeline:
    """
    Pipeline model for agent orchestration definitions.

    DataFlow generates these nodes automatically:
    - PipelineCreateNode
    - PipelineReadNode
    - PipelineUpdateNode
    - PipelineDeleteNode
    - PipelineListNode
    - PipelineCountNode
    - PipelineUpsertNode
    - PipelineBulkCreateNode
    - PipelineBulkUpdateNode
    - PipelineBulkDeleteNode
    - PipelineBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization and workspace reference
    organization_id: str
    workspace_id: str

    # Pipeline details
    name: str
    description: str  # Empty string if not provided

    # Orchestration pattern: sequential, parallel, router, supervisor, ensemble
    pattern: str

    # Status: draft, active, archived
    status: str

    # Audit fields
    created_by: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
