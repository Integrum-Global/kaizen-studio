"""
Agent Tool DataFlow Model

Represents a tool attached to an agent.
"""

from studio.models import db


@db.model
class AgentTool:
    """
    Agent tool model for agent capabilities.

    DataFlow generates these nodes automatically:
    - AgentToolCreateNode
    - AgentToolReadNode
    - AgentToolUpdateNode
    - AgentToolDeleteNode
    - AgentToolListNode
    - AgentToolCountNode
    - AgentToolUpsertNode
    - AgentToolBulkCreateNode
    - AgentToolBulkUpdateNode
    - AgentToolBulkDeleteNode
    - AgentToolBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Agent reference
    agent_id: str

    # Tool type: function, mcp, api
    tool_type: str

    # Tool details
    name: str
    description: str

    # JSON configuration
    config: str

    # Whether tool is enabled
    is_enabled: int  # 1 = enabled, 0 = disabled (DataFlow uses int for bool)

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
