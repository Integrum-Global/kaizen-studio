"""
Deployment Log Model

Tracks deployment lifecycle events.
"""

from studio.models import db


@db.model
class DeploymentLog:
    """
    Deployment log model for tracking deployment events.

    Provides an audit trail of deployment lifecycle events
    including status changes, errors, and metadata.

    DataFlow auto-generates 11 nodes:
    - DeploymentLogCreateNode, DeploymentLogReadNode, DeploymentLogUpdateNode, DeploymentLogDeleteNode
    - DeploymentLogListNode, DeploymentLogCountNode, DeploymentLogUpsertNode
    - DeploymentLogBulkCreateNode, DeploymentLogBulkUpdateNode, DeploymentLogBulkDeleteNode, DeploymentLogBulkUpsertNode
    """

    id: str
    deployment_id: str
    event_type: str  # started, building, registered, failed, stopped
    message: str
    metadata: str | None  # JSON string for additional data
    created_at: str
