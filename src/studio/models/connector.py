"""
Connector DataFlow Model

Represents external system connectors for agent integration.
"""

from studio.models import db


@db.model
class Connector:
    """
    Connector model for external system integrations.

    DataFlow generates these nodes automatically:
    - ConnectorCreateNode
    - ConnectorReadNode
    - ConnectorUpdateNode
    - ConnectorDeleteNode
    - ConnectorListNode
    - ConnectorCountNode
    - ConnectorUpsertNode
    - ConnectorBulkCreateNode
    - ConnectorBulkUpdateNode
    - ConnectorBulkDeleteNode
    - ConnectorBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization reference
    organization_id: str

    # Connector details
    name: str

    # Type: database, api, storage, messaging
    connector_type: str

    # Provider: postgresql, mysql, mongodb, redis, rest, graphql, s3, kafka, etc.
    provider: str

    # Encrypted connection configuration (JSON string)
    config_encrypted: str

    # Status: active, inactive, error
    status: str

    # Last connection test timestamp (ISO 8601 or empty string)
    last_tested_at: str

    # Last test result: success, failed, unknown
    last_test_result: str

    # Error message from last test (empty string if none)
    last_error: str

    # Audit fields
    created_by: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
