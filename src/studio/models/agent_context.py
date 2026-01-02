"""
Agent Context DataFlow Model

Represents context data attached to an agent.
"""

from studio.models import db


@db.model
class AgentContext:
    """
    Agent context model for attached knowledge/data.

    DataFlow generates these nodes automatically:
    - AgentContextCreateNode
    - AgentContextReadNode
    - AgentContextUpdateNode
    - AgentContextDeleteNode
    - AgentContextListNode
    - AgentContextCountNode
    - AgentContextUpsertNode
    - AgentContextBulkCreateNode
    - AgentContextBulkUpdateNode
    - AgentContextBulkDeleteNode
    - AgentContextBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Agent reference
    agent_id: str

    # Context details
    name: str

    # Content type: text, file, url
    content_type: str

    # Actual content or file path
    content: str

    # Whether context is active
    is_active: int  # 1 = active, 0 = inactive (DataFlow uses int for bool)

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
