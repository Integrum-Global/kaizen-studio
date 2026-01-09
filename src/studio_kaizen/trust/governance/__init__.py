"""
Kaizen Governance Module

Production-ready governance components for external agent management:
- ExternalAgentBudgetEnforcer: Budget tracking and enforcement
- ExternalAgentRateLimiter: Rate limiting with Redis support
- ExternalAgentPolicyEngine: ABAC policy evaluation
- ExternalAgentApprovalManager: Human-in-the-loop approval workflows

This module provides the core governance infrastructure for the
EATP (Enterprise Agent Trust Protocol) implementation.

Examples:
    >>> from studio_kaizen.trust.governance import (
    ...     ExternalAgentBudgetEnforcer,
    ...     ExternalAgentBudget,
    ...     BudgetCheckResult,
    ... )
    >>>
    >>> enforcer = ExternalAgentBudgetEnforcer()
    >>> budget = ExternalAgentBudget(
    ...     external_agent_id="agent-001",
    ...     monthly_budget_usd=1000.0
    ... )
    >>> result = await enforcer.check_budget(budget, estimated_cost=0.05)
    >>> if result.allowed:
    ...     await execute_invocation()

    >>> # Approval workflows
    >>> from studio_kaizen.trust.governance import (
    ...     ExternalAgentApprovalManager,
    ...     ApprovalTriggerConfig,
    ...     ApprovalWorkflowConfig,
    ... )
    >>>
    >>> manager = ExternalAgentApprovalManager(
    ...     trigger_config=ApprovalTriggerConfig(cost_threshold=100.0),
    ...     workflow_config=ApprovalWorkflowConfig()
    ... )
"""

# Core types
from studio_kaizen.trust.governance.types import (
    # Budget types
    BudgetCheckResult,
    BudgetScope,
    BudgetStatus,
    BudgetUsageRecord,
    ExternalAgentBudget,
    # Rate limit types
    RateLimitCheckResult,
    RateLimitConfig,
    # Policy types
    ConflictResolutionStrategy,
    ExternalAgentPolicy,
    ExternalAgentPolicyContext,
    ExternalAgentPrincipal,
    PolicyCondition,
    PolicyEffect,
    PolicyEvaluationResult,
    # Approval types
    ApprovalCheckResult,
    ApprovalDecision,
    ApprovalRequest,
    ApprovalStatus,
)

# Configuration
from studio_kaizen.trust.governance.config import (
    BudgetAlertConfig,
    ExternalAgentBudgetConfig,
    ApprovalTriggerConfig,
    ApprovalWorkflowConfig,
)

# Storage
from studio_kaizen.trust.governance.store import (
    BudgetStore,
    DataFlowBudgetStore,
    InMemoryBudgetStore,
    ApprovalStore,
    InMemoryApprovalStore,
    DataFlowApprovalStore,
)

# Triggers
from studio_kaizen.trust.governance.triggers import (
    ApprovalTriggerEvaluator,
    TriggerContext,
    TriggerResult,
    InMemoryHistoryProvider,
)

# Enforcers and Managers
from studio_kaizen.trust.governance.budget_enforcer import ExternalAgentBudgetEnforcer
from studio_kaizen.trust.governance.rate_limiter import ExternalAgentRateLimiter
from studio_kaizen.trust.governance.policy_engine import ExternalAgentPolicyEngine
from studio_kaizen.trust.governance.approval_manager import (
    ExternalAgentApprovalManager,
    ApprovalNotFoundError,
    UnauthorizedApproverError,
    SelfApprovalNotAllowedError,
    ApprovalExpiredError,
    AlreadyDecidedError,
)

# Notifications
from studio_kaizen.trust.governance.notifications import (
    ApprovalNotificationService,
    ApproverInfo,
    EmailNotificationAdapter,
    SlackNotificationAdapter,
    TeamsNotificationAdapter,
    WebhookNotificationAdapter,
)

__all__ = [
    # Budget types
    "BudgetScope",
    "BudgetCheckResult",
    "BudgetStatus",
    "BudgetUsageRecord",
    "ExternalAgentBudget",
    # Rate limit types
    "RateLimitConfig",
    "RateLimitCheckResult",
    # Policy types
    "PolicyEffect",
    "ConflictResolutionStrategy",
    "PolicyCondition",
    "ExternalAgentPrincipal",
    "ExternalAgentPolicyContext",
    "ExternalAgentPolicy",
    "PolicyEvaluationResult",
    # Approval types
    "ApprovalStatus",
    "ApprovalDecision",
    "ApprovalRequest",
    "ApprovalCheckResult",
    # Configuration
    "ExternalAgentBudgetConfig",
    "BudgetAlertConfig",
    "ApprovalTriggerConfig",
    "ApprovalWorkflowConfig",
    # Storage - Budget
    "BudgetStore",
    "InMemoryBudgetStore",
    "DataFlowBudgetStore",
    # Storage - Approval
    "ApprovalStore",
    "InMemoryApprovalStore",
    "DataFlowApprovalStore",
    # Triggers
    "ApprovalTriggerEvaluator",
    "TriggerContext",
    "TriggerResult",
    "InMemoryHistoryProvider",
    # Enforcers and Managers
    "ExternalAgentBudgetEnforcer",
    "ExternalAgentRateLimiter",
    "ExternalAgentPolicyEngine",
    "ExternalAgentApprovalManager",
    # Approval Errors
    "ApprovalNotFoundError",
    "UnauthorizedApproverError",
    "SelfApprovalNotAllowedError",
    "ApprovalExpiredError",
    "AlreadyDecidedError",
    # Notifications
    "ApprovalNotificationService",
    "ApproverInfo",
    "EmailNotificationAdapter",
    "SlackNotificationAdapter",
    "TeamsNotificationAdapter",
    "WebhookNotificationAdapter",
]
