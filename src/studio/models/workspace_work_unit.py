"""
WorkspaceWorkUnit DataFlow Model

Junction table linking work units to workspaces.
"""

from studio.models import db


@db.model
class WorkspaceWorkUnit:
    """
    Workspace work unit model for tracking which work units belong to workspaces.

    Supports both atomic (agents) and composite (pipelines) work units.
    Includes EATP trust delegation reference.

    DataFlow generates these nodes automatically:
    - WorkspaceWorkUnitCreateNode
    - WorkspaceWorkUnitReadNode
    - WorkspaceWorkUnitUpdateNode
    - WorkspaceWorkUnitDeleteNode
    - WorkspaceWorkUnitListNode
    - WorkspaceWorkUnitCountNode
    - WorkspaceWorkUnitUpsertNode
    - WorkspaceWorkUnitBulkCreateNode
    - WorkspaceWorkUnitBulkUpdateNode
    - WorkspaceWorkUnitBulkDeleteNode
    - WorkspaceWorkUnitBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Foreign keys
    workspace_id: str
    work_unit_id: str  # References either Agent.id or Pipeline.id

    # Work unit type: atomic (agent) or composite (pipeline)
    work_unit_type: str

    # EATP trust delegation reference
    delegation_id: str | None

    # Access constraints (JSON string)
    # Example: {"read_only": true, "max_concurrent_executions": 5}
    constraints: str | None

    # Audit fields
    added_by: str

    # Department for cross-org visibility
    department: str | None

    # Timestamps (ISO 8601 strings, auto-managed by DataFlow)
    created_at: str
    updated_at: str
