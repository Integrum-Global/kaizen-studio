"""
Workspace DataFlow Model

Represents a workspace within an organization in the Kaizen Studio platform.
"""

from studio.models import db


@db.model
class Workspace:
    """
    Workspace model for environment isolation.

    DataFlow generates these nodes automatically:
    - WorkspaceCreateNode
    - WorkspaceReadNode
    - WorkspaceUpdateNode
    - WorkspaceDeleteNode
    - WorkspaceListNode
    - WorkspaceCountNode
    - WorkspaceUpsertNode
    - WorkspaceBulkCreateNode
    - WorkspaceBulkUpdateNode
    - WorkspaceBulkDeleteNode
    - WorkspaceBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization reference
    organization_id: str

    # Workspace details
    name: str

    # Workspace type: permanent, temporary, personal
    workspace_type: str

    # Environment type: development, staging, production
    environment_type: str

    # Description (optional, empty string default)
    description: str

    # Archive status
    is_archived: bool
    archived_at: str | None

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
