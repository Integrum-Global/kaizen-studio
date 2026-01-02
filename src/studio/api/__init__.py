"""
Kaizen Studio API Routes

FastAPI routers for all API endpoints.
"""

from studio.api.agent_execute import router as agent_execute_router
from studio.api.agents import router as agents_router
from studio.api.api_keys import router as api_keys_router
from studio.api.audit import router as audit_router
from studio.api.auth import router as auth_router
from studio.api.billing import router as billing_router
from studio.api.connectors import router as connectors_router
from studio.api.deployments import router as deployments_router
from studio.api.executions import router as executions_router
from studio.api.external_agents import router as external_agents_router
from studio.api.gateways import router as gateways_router
from studio.api.invitations import router as invitations_router
from studio.api.lineage import router as lineage_router
from studio.api.metrics import router as metrics_router
from studio.api.organizations import router as organizations_router
from studio.api.pipelines import router as pipelines_router
from studio.api.policies import router as policies_router
from studio.api.promotions import router as promotions_router
from studio.api.rbac import router as rbac_router
from studio.api.scaling import router as scaling_router
from studio.api.settings import router as settings_router
from studio.api.sso import router as sso_router
from studio.api.teams import router as teams_router
from studio.api.test import router as test_router
from studio.api.trust import router as trust_router
from studio.api.users import router as users_router
from studio.api.webhooks import router as webhooks_router

__all__ = [
    "agent_execute_router",
    "auth_router",
    "organizations_router",
    "users_router",
    "teams_router",
    "invitations_router",
    "sso_router",
    "rbac_router",
    "agents_router",
    "gateways_router",
    "deployments_router",
    "pipelines_router",
    "policies_router",
    "promotions_router",
    "audit_router",
    "metrics_router",
    "test_router",
    "api_keys_router",
    "webhooks_router",
    "billing_router",
    "connectors_router",
    "scaling_router",
    "settings_router",
    "executions_router",
    "external_agents_router",
    "lineage_router",
    "trust_router",
]
