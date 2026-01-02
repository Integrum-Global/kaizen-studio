"""
Permission Configuration

Defines the default permission matrix for RBAC roles.
"""

# Default permission matrix for each role
PERMISSION_MATRIX = {
    "org_owner": [
        "organizations:*",
        "users:*",
        "teams:*",
        "workspaces:*",
        "agents:*",
        "external_agents:*",  # External agents (create, read, update, delete, invoke)
        "deployments:*",
        "billing:*",
        "policies:*",
        "connectors:*",
        "promotions:*",
        "pipelines:*",
        "panels:*",
        "metrics:*",
        "gateways:*",
        "api_keys:*",
        "webhooks:*",
        "scaling:*",
        "invitations:*",
        "sso:*",
        "audit:read",
        "lineage:*",  # Lineage tracking (read, export)
        "gdpr:*",  # GDPR compliance (redact)
    ],
    "org_admin": [
        "users:*",
        "teams:*",
        "workspaces:*",
        "agents:*",
        "external_agents:*",  # External agents (create, read, update, delete, invoke)
        "deployments:*",
        "policies:*",
        "connectors:*",
        "promotions:*",
        "pipelines:*",
        "panels:*",
        "metrics:*",
        "gateways:*",
        "api_keys:*",
        "webhooks:*",
        "scaling:*",
        "invitations:*",
        "sso:*",
        "audit:read",
        "lineage:*",  # Lineage tracking (read, export)
        "gdpr:redact",  # GDPR compliance (redact only - owners have full)
    ],
    "developer": [
        "agents:create",
        "agents:read",
        "agents:update",
        "agents:delete",
        "deployments:create",
        "deployments:read",
        "deployments:update",
        "workspaces:read",
        "teams:read",
        "policies:read",
        "connectors:read",
        "connectors:execute",
        "pipelines:read",
        "panels:read",
        "metrics:read",
        "gateways:read",
        "api_keys:read",
        "lineage:read",  # Lineage read access for debugging
    ],
    "viewer": [
        "agents:read",
        "deployments:read",
        "workspaces:read",
        "teams:read",
        "policies:read",
        "connectors:read",
        "pipelines:read",
        "panels:read",
        "metrics:read",
        "gateways:read",
    ],
}

# All available permissions with descriptions
PERMISSION_DESCRIPTIONS = {
    # Organizations
    "organizations:create": "Create new organizations",
    "organizations:read": "View organization details",
    "organizations:update": "Update organization settings",
    "organizations:delete": "Delete organizations",
    "organizations:*": "Full organization management",
    # Users
    "users:create": "Invite new users",
    "users:read": "View user profiles",
    "users:update": "Update user settings",
    "users:delete": "Remove users",
    "users:*": "Full user management",
    # Teams
    "teams:create": "Create teams",
    "teams:read": "View teams",
    "teams:update": "Update team settings",
    "teams:delete": "Delete teams",
    "teams:*": "Full team management",
    # Workspaces
    "workspaces:create": "Create workspaces",
    "workspaces:read": "View workspaces",
    "workspaces:update": "Update workspace settings",
    "workspaces:delete": "Delete workspaces",
    "workspaces:*": "Full workspace management",
    # Agents
    "agents:create": "Create AI agents",
    "agents:read": "View AI agents",
    "agents:update": "Update AI agent configurations",
    "agents:delete": "Delete AI agents",
    "agents:deploy": "Deploy AI agents",
    "agents:*": "Full agent management",
    # External Agents
    "external_agents:create": "Register external agents",
    "external_agents:read": "View external agents",
    "external_agents:update": "Update external agent configurations",
    "external_agents:delete": "Remove external agents",
    "external_agents:invoke": "Invoke external agents",
    "external_agents:*": "Full external agent management",
    # Deployments
    "deployments:create": "Create deployments",
    "deployments:read": "View deployments",
    "deployments:update": "Update deployment configurations",
    "deployments:delete": "Delete deployments",
    "deployments:*": "Full deployment management",
    # Billing
    "billing:read": "View billing information",
    "billing:update": "Update billing settings",
    "billing:*": "Full billing management",
    # Policies
    "policies:create": "Create ABAC policies",
    "policies:read": "View ABAC policies",
    "policies:update": "Update ABAC policies",
    "policies:delete": "Delete ABAC policies",
    "policies:assign": "Assign policies to users/teams/roles",
    "policies:evaluate": "Evaluate policy access decisions",
    "policies:*": "Full policy management",
    # Audit
    "audit:read": "View audit logs",
    # Connectors
    "connectors:create": "Create external connectors",
    "connectors:read": "View external connectors",
    "connectors:update": "Update connector configurations",
    "connectors:delete": "Delete connectors",
    "connectors:execute": "Execute connector operations",
    "connectors:*": "Full connector management",
    # Promotions
    "promotions:create": "Create deployment promotions",
    "promotions:read": "View deployment promotions",
    "promotions:update": "Update promotion settings",
    "promotions:delete": "Delete promotions",
    "promotions:*": "Full promotion management",
    # Pipelines
    "pipelines:create": "Create AI pipelines",
    "pipelines:read": "View AI pipelines",
    "pipelines:update": "Update pipeline configurations",
    "pipelines:delete": "Delete pipelines",
    "pipelines:*": "Full pipeline management",
    # Panels
    "panels:create": "Create dashboard panels",
    "panels:read": "View dashboard panels",
    "panels:update": "Update panel configurations",
    "panels:delete": "Delete panels",
    "panels:*": "Full panel management",
    # Metrics
    "metrics:create": "Create metrics configurations",
    "metrics:read": "View metrics and analytics",
    "metrics:update": "Update metrics settings",
    "metrics:delete": "Delete metrics configurations",
    "metrics:*": "Full metrics management",
    # Gateways
    "gateways:create": "Create API gateways",
    "gateways:read": "View API gateways",
    "gateways:update": "Update gateway configurations",
    "gateways:delete": "Delete gateways",
    "gateways:*": "Full gateway management",
    # API Keys
    "api_keys:create": "Create API keys",
    "api_keys:read": "View API keys",
    "api_keys:update": "Update API key settings",
    "api_keys:delete": "Delete API keys",
    "api_keys:*": "Full API key management",
    # Webhooks
    "webhooks:create": "Create webhooks",
    "webhooks:read": "View webhooks",
    "webhooks:update": "Update webhook configurations",
    "webhooks:delete": "Delete webhooks",
    "webhooks:*": "Full webhook management",
    # Scaling
    "scaling:create": "Create scaling policies",
    "scaling:read": "View scaling settings",
    "scaling:update": "Update scaling configurations",
    "scaling:delete": "Delete scaling policies",
    "scaling:*": "Full scaling management",
    # Invitations
    "invitations:create": "Send team invitations",
    "invitations:read": "View pending invitations",
    "invitations:update": "Update invitation settings",
    "invitations:delete": "Cancel invitations",
    "invitations:*": "Full invitation management",
    # SSO
    "sso:create": "Configure SSO providers",
    "sso:read": "View SSO configurations",
    "sso:update": "Update SSO settings",
    "sso:delete": "Remove SSO configurations",
    "sso:*": "Full SSO management",
    # Lineage
    "lineage:read": "View invocation lineage records",
    "lineage:export": "Export lineage for compliance",
    "lineage:*": "Full lineage management",
    # GDPR
    "gdpr:redact": "Redact user data for GDPR compliance",
    "gdpr:*": "Full GDPR compliance management",
}

# Valid roles
VALID_ROLES = ["org_owner", "org_admin", "developer", "viewer"]

# Admin roles that can manage users, teams, and settings
ADMIN_ROLES = ["org_owner", "org_admin"]

# Roles that can create resources (agents, deployments, etc.)
CREATOR_ROLES = ["org_owner", "org_admin", "developer"]

# Valid actions
VALID_ACTIONS = ["create", "read", "update", "delete", "deploy", "*"]

# Valid resources
VALID_RESOURCES = [
    "organizations",
    "users",
    "teams",
    "workspaces",
    "agents",
    "external_agents",
    "deployments",
    "billing",
    "policies",
    "audit",
    "connectors",
    "promotions",
    "pipelines",
    "panels",
    "metrics",
    "gateways",
    "api_keys",
    "webhooks",
    "scaling",
    "invitations",
    "sso",
    "lineage",
    "gdpr",
]
