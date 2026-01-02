"""
Deployment Model

Represents agent deployments to Nexus gateways.
"""

from studio.models import db


@db.model
class Deployment:
    """
    Deployment model for agent deployments.

    A deployment represents an agent deployed to a specific
    gateway. Tracks deployment lifecycle and endpoint information.

    DataFlow auto-generates 11 nodes:
    - DeploymentCreateNode, DeploymentReadNode, DeploymentUpdateNode, DeploymentDeleteNode
    - DeploymentListNode, DeploymentCountNode, DeploymentUpsertNode
    - DeploymentBulkCreateNode, DeploymentBulkUpdateNode, DeploymentBulkDeleteNode, DeploymentBulkUpsertNode
    """

    id: str
    organization_id: str
    agent_id: str
    agent_version_id: str | None  # Specific version deployed
    gateway_id: str
    registration_id: str | None  # ID returned from Nexus
    status: str  # pending, deploying, active, failed, stopped
    endpoint_url: str | None  # Generated endpoint URL
    error_message: str | None  # Error details if failed
    deployed_by: str  # User ID who initiated deployment
    deployed_at: str | None  # ISO timestamp when deployed
    stopped_at: str | None  # ISO timestamp when stopped
    created_at: str
    updated_at: str
