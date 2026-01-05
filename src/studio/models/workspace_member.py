"""
WorkspaceMember DataFlow Model

Junction table for workspace membership with roles.
"""

from studio.models import db


@db.model
class WorkspaceMember:
    """
    Workspace member model for tracking user membership in workspaces.

    Enables purpose-driven workspace teams that can cross departmental
    boundaries (EATP Ontology requirement).

    DataFlow generates these nodes automatically:
    - WorkspaceMemberCreateNode
    - WorkspaceMemberReadNode
    - WorkspaceMemberUpdateNode
    - WorkspaceMemberDeleteNode
    - WorkspaceMemberListNode
    - WorkspaceMemberCountNode
    - WorkspaceMemberUpsertNode
    - WorkspaceMemberBulkCreateNode
    - WorkspaceMemberBulkUpdateNode
    - WorkspaceMemberBulkDeleteNode
    - WorkspaceMemberBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Foreign keys
    workspace_id: str
    user_id: str

    # Role: owner, admin, member, viewer
    role: str

    # EATP constraints (JSON string)
    # Example: {"max_executions_per_day": 100, "allowed_work_units": ["wu-1", "wu-2"]}
    constraints: str | None

    # Invitation tracking
    invited_by: str | None

    # Department for cross-org visibility
    department: str | None

    # Timestamps (ISO 8601 strings, auto-managed by DataFlow)
    created_at: str
    updated_at: str
