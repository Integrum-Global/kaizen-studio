"""
Promotion Model

Represents environment promotion requests for agent deployments.
"""

from studio.models import db


@db.model
class Promotion:
    """
    Promotion model for environment promotion requests.

    A promotion represents a request to promote an agent deployment
    from one environment to another (e.g., development to staging,
    staging to production).

    DataFlow auto-generates 11 nodes:
    - PromotionCreateNode, PromotionReadNode, PromotionUpdateNode, PromotionDeleteNode
    - PromotionListNode, PromotionCountNode, PromotionUpsertNode
    - PromotionBulkCreateNode, PromotionBulkUpdateNode, PromotionBulkDeleteNode, PromotionBulkUpsertNode
    """

    id: str
    organization_id: str
    agent_id: str
    source_deployment_id: str
    target_gateway_id: str
    source_environment: str  # development, staging
    target_environment: str  # staging, production
    status: str  # pending, approved, rejected, completed, failed
    requires_approval: bool
    approved_by: str | None  # User ID who approved
    approved_at: str | None  # ISO timestamp when approved
    rejection_reason: str | None  # Reason if rejected
    target_deployment_id: str | None  # ID of created deployment after execution
    created_by: str  # User ID who created the request
    created_at: str
    completed_at: str | None  # ISO timestamp when completed
