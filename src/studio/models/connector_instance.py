"""
Connector Instance DataFlow Model

Represents connector instances attached to agents.
"""

from studio.models import db


@db.model
class ConnectorInstance:
    """
    Connector instance model for agent-connector relationships.

    DataFlow generates these nodes automatically:
    - ConnectorInstanceCreateNode
    - ConnectorInstanceReadNode
    - ConnectorInstanceUpdateNode
    - ConnectorInstanceDeleteNode
    - ConnectorInstanceListNode
    - ConnectorInstanceCountNode
    - ConnectorInstanceUpsertNode
    - ConnectorInstanceBulkCreateNode
    - ConnectorInstanceBulkUpdateNode
    - ConnectorInstanceBulkDeleteNode
    - ConnectorInstanceBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Parent connector reference
    connector_id: str

    # Agent using this connector
    agent_id: str

    # Alias name within agent context
    alias: str

    # Configuration override (JSON string, empty if none)
    config_override: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
