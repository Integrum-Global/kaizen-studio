"""
Promotion Rule Model

Defines rules for automatic promotion between environments.
"""

from studio.models import db


@db.model
class PromotionRule:
    """
    Promotion rule model for automatic promotion configuration.

    A promotion rule defines the requirements and behavior for
    promotions between specific environments, including approval
    requirements and auto-promotion conditions.

    DataFlow auto-generates 11 nodes:
    - PromotionRuleCreateNode, PromotionRuleReadNode, PromotionRuleUpdateNode, PromotionRuleDeleteNode
    - PromotionRuleListNode, PromotionRuleCountNode, PromotionRuleUpsertNode
    - PromotionRuleBulkCreateNode, PromotionRuleBulkUpdateNode, PromotionRuleBulkDeleteNode, PromotionRuleBulkUpsertNode
    """

    id: str
    organization_id: str
    name: str
    source_environment: str  # development, staging
    target_environment: str  # staging, production
    requires_approval: bool  # Whether approval is required
    auto_promote: bool  # Auto-promote on deployment success
    required_approvers: int  # Number of approvals needed
    conditions: str | None  # JSON conditions (e.g., test pass rate, health checks)
    status: str  # active, inactive
    created_at: str
    updated_at: str
