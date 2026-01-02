"""
Agent Version DataFlow Model

Represents a version snapshot of an agent configuration.
"""

from studio.models import db


@db.model
class AgentVersion:
    """
    Agent version model for tracking configuration history.

    DataFlow generates these nodes automatically:
    - AgentVersionCreateNode
    - AgentVersionReadNode
    - AgentVersionUpdateNode
    - AgentVersionDeleteNode
    - AgentVersionListNode
    - AgentVersionCountNode
    - AgentVersionUpsertNode
    - AgentVersionBulkCreateNode
    - AgentVersionBulkUpdateNode
    - AgentVersionBulkDeleteNode
    - AgentVersionBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Agent reference
    agent_id: str

    # Version number (auto-increment per agent)
    version_number: int

    # JSON blob of agent config at this version
    config_snapshot: str

    # Change description
    changelog: str  # Empty string if not provided

    # Audit fields
    created_by: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
