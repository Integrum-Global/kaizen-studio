"""
Kaizen Studio DataFlow Models

This module contains all DataFlow model definitions for the platform.
DataFlow automatically generates 11 node types per model for CRUD operations.
"""

import os

from dataflow import DataFlow

from studio.config import get_database_url, get_settings

# Get database URL from environment or settings
# Use test database URL when ENVIRONMENT=testing
if os.getenv("ENVIRONMENT") == "testing":
    DATABASE_URL = get_database_url(test=True)
else:
    DATABASE_URL = os.getenv("DATABASE_URL", get_settings().database_url)

# Disable caching in test environment to avoid stale cache issues
# DataFlow's async cache invalidation doesn't work properly in mixed sync/async contexts
IS_TESTING = os.getenv("ENVIRONMENT") == "testing"

# Initialize DataFlow instance
db = DataFlow(
    database_url=DATABASE_URL,
    auto_migrate=True,
    enable_caching=False,  # Disable caching globally - invalidation issues in async contexts
    enable_metrics=True,
)

from studio.models.agent import Agent
from studio.models.agent_context import AgentContext
from studio.models.agent_tool import AgentTool
from studio.models.agent_version import AgentVersion
from studio.models.api_key import APIKey
from studio.models.audit_log import AuditLog
from studio.models.billing_period import BillingPeriod
from studio.models.connector import Connector
from studio.models.connector_instance import ConnectorInstance
from studio.models.deployment import Deployment
from studio.models.deployment_log import DeploymentLog
from studio.models.execution_metric import ExecutionMetric
from studio.models.external_agent import ExternalAgent
from studio.models.external_agent_invocation import ExternalAgentInvocation
from studio.models.gateway import Gateway
from studio.models.invitation import Invitation
from studio.models.invocation_lineage import InvocationLineage

# Import models to register them with DataFlow
from studio.models.organization import Organization
from studio.models.organization_domain import OrganizationDomain
from studio.models.permission import Permission
from studio.models.pipeline import Pipeline
from studio.models.pipeline_connection import PipelineConnection
from studio.models.pipeline_node import PipelineNode
from studio.models.policy import Policy
from studio.models.policy_assignment import PolicyAssignment
from studio.models.promotion import Promotion
from studio.models.promotion_rule import PromotionRule
from studio.models.role_permission import RolePermission
from studio.models.scaling_event import ScalingEvent
from studio.models.scaling_policy import ScalingPolicy
from studio.models.sso_connection import SSOConnection
from studio.models.team import Team
from studio.models.team_membership import TeamMembership
from studio.models.test_execution import TestExecution
from studio.models.usage_quota import UsageQuota
from studio.models.usage_record import UsageRecord
from studio.models.user import User
from studio.models.user_identity import UserIdentity
from studio.models.user_organization import UserOrganization
from studio.models.webhook import Webhook
from studio.models.webhook_delivery import WebhookDelivery
from studio.models.workspace import Workspace

__all__ = [
    "db",
    "Organization",
    "OrganizationDomain",
    "User",
    "UserOrganization",
    "Workspace",
    "Team",
    "TeamMembership",
    "Invitation",
    "SSOConnection",
    "UserIdentity",
    "Permission",
    "RolePermission",
    "Agent",
    "AgentVersion",
    "AgentContext",
    "AgentTool",
    "Gateway",
    "Deployment",
    "DeploymentLog",
    "Pipeline",
    "PipelineNode",
    "PipelineConnection",
    "AuditLog",
    "ExecutionMetric",
    "TestExecution",
    "APIKey",
    "ScalingEvent",
    "ScalingPolicy",
    "Webhook",
    "WebhookDelivery",
    "UsageRecord",
    "BillingPeriod",
    "UsageQuota",
    "Connector",
    "ConnectorInstance",
    "Promotion",
    "PromotionRule",
    "ExternalAgent",
    "ExternalAgentInvocation",
    "InvocationLineage",
    "Policy",
    "PolicyAssignment",
]
