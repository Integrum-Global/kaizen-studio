"""
Gateway Model

Represents Nexus gateways where agents are deployed.
"""

from studio.models import db


@db.model
class Gateway:
    """
    Gateway model for Nexus deployment targets.

    A gateway represents a Nexus instance that can receive
    agent deployments. Each organization can have multiple
    gateways for different environments (dev, staging, prod).

    DataFlow auto-generates 11 nodes:
    - GatewayCreateNode, GatewayReadNode, GatewayUpdateNode, GatewayDeleteNode
    - GatewayListNode, GatewayCountNode, GatewayUpsertNode
    - GatewayBulkCreateNode, GatewayBulkUpdateNode, GatewayBulkDeleteNode, GatewayBulkUpsertNode
    """

    id: str
    organization_id: str
    name: str
    description: str | None
    api_url: str  # Nexus gateway URL (e.g., https://gateway.example.com)
    api_key_encrypted: str  # Encrypted API key for authentication
    environment: str  # development, staging, production
    status: str  # active, inactive, error
    health_check_url: str | None  # Custom health check endpoint
    last_health_check: str | None  # ISO timestamp
    last_health_status: str | None  # healthy, unhealthy, unknown
    created_at: str
    updated_at: str
