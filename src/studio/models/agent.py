"""
Agent DataFlow Model

Represents an AI agent in the Kaizen Studio platform.
"""

from studio.models import db


@db.model
class Agent:
    """
    Agent model for AI agent definitions.

    DataFlow generates these nodes automatically:
    - AgentCreateNode
    - AgentReadNode
    - AgentUpdateNode
    - AgentDeleteNode
    - AgentListNode
    - AgentCountNode
    - AgentUpsertNode
    - AgentBulkCreateNode
    - AgentBulkUpdateNode
    - AgentBulkDeleteNode
    - AgentBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization and workspace reference
    organization_id: str
    workspace_id: str

    # Agent details
    name: str
    description: str  # Empty string if not provided

    # Agent type: chat, task, pipeline, custom
    agent_type: str

    # Status: draft, active, archived
    status: str

    # Configuration
    system_prompt: str  # Empty string if not provided
    model_id: str  # e.g., "gpt-4", "claude-3-opus"
    temperature: float  # 0.0 - 2.0
    max_tokens: int  # 0 means no limit

    # Audit fields
    created_by: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
