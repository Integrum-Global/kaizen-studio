# Enterprise DataFlow Models

**Date**: 2025-11-22
**Purpose**: Complete data model for SaaS platform

---

## Model Hierarchy

```
Platform
├── Organization
│   ├── Subscription
│   ├── SSOConfiguration
│   ├── Workspace (Environment)
│   ├── Team
│   ├── User
│   ├── Policy
│   ├── Gateway
│   ├── Connector
│   ├── Agent
│   ├── Orchestration
│   ├── Deployment
│   └── AuditLog
```

---

## Core Platform Models

```python
from dataflow import DataFlow
from typing import Optional
from datetime import datetime

db = DataFlow("postgresql://localhost:5432/kailash_studio")

# ==========================================
# Organization & Subscription
# ==========================================

@db.model
class Organization:
    """Top-level tenant."""
    id: str
    name: str
    slug: str  # URL-safe identifier
    logo_url: Optional[str]
    status: str  # active, suspended, deleted
    plan_tier: str  # free, pro, enterprise
    created_by: str  # user_id of creator

@db.model
class Subscription:
    """Billing subscription."""
    id: str
    organization_id: str
    plan_id: str
    status: str  # active, cancelled, past_due
    billing_cycle: str  # monthly, annual
    current_period_start: str
    current_period_end: str
    stripe_subscription_id: Optional[str]

    # Limits
    max_users: int
    max_agents: int
    max_executions_per_month: int
    max_storage_gb: int
    max_gateways: int

@db.model
class UsageRecord:
    """Monthly usage tracking."""
    id: str
    organization_id: str
    period_start: str
    period_end: str
    users_count: int
    agents_count: int
    executions_count: int
    storage_gb: float
    gateways_count: int
    cost_usd: float

# ==========================================
# Identity & Access
# ==========================================

@db.model
class User:
    """Platform user."""
    id: str
    organization_id: str
    email: str
    name: str
    avatar_url: Optional[str]
    status: str  # active, invited, suspended
    role: str  # org_owner, org_admin, developer, operator, viewer
    last_login_at: Optional[str]
    mfa_enabled: bool
    sso_provider_id: Optional[str]  # If SSO user

@db.model
class Team:
    """Team within organization."""
    id: str
    organization_id: str
    name: str
    description: str
    budget_limit_usd: Optional[float]
    current_spend_usd: float

@db.model
class TeamMembership:
    """User-Team relationship."""
    id: str
    team_id: str
    user_id: str
    role: str  # lead, member

@db.model
class SSOConfiguration:
    """SSO provider configuration."""
    id: str
    organization_id: str
    provider_type: str  # azure_ad, okta, google, saml, oidc
    name: str
    is_enabled: bool

    # Provider-specific config (encrypted)
    config_encrypted: str  # JSON blob

    # JIT provisioning
    jit_enabled: bool
    default_role: str
    role_mappings: dict  # {"Azure-Admins": "admin"}

    # Restrictions
    allowed_domains: dict  # ["acme.com"]

@db.model
class APIKey:
    """Organization or user API key."""
    id: str
    organization_id: str
    user_id: Optional[str]  # null = org-level
    name: str
    key_hash: str  # Hashed key
    key_prefix: str  # First 8 chars for display
    scopes: dict  # ["agent:read", "agent:execute"]
    expires_at: Optional[str]
    last_used_at: Optional[str]
    is_active: bool

# ==========================================
# RBAC/ABAC
# ==========================================

@db.model
class Policy:
    """Access control policy."""
    id: str
    organization_id: str
    name: str
    description: str
    policy_type: str  # rbac, abac, budget
    rules_yaml: str  # YAML policy definition
    is_system: bool  # Built-in vs custom
    is_enabled: bool
    priority: int  # Higher = evaluated first

@db.model
class PolicyAssignment:
    """Policy assigned to team/user."""
    id: str
    policy_id: str
    assignee_type: str  # team, user
    assignee_id: str

@db.model
class ApprovalRequest:
    """Pending approval for action."""
    id: str
    organization_id: str
    policy_id: str
    rule_name: str
    requester_id: str
    resource_type: str
    resource_id: str
    action: str
    context: dict  # Additional context
    status: str  # pending, approved, rejected, expired
    approver_id: Optional[str]
    approved_at: Optional[str]
    expires_at: str
    reason: Optional[str]

# ==========================================
# Environments & Workspaces
# ==========================================

@db.model
class Workspace:
    """Environment (dev/staging/prod)."""
    id: str
    organization_id: str
    name: str
    environment_type: str  # development, staging, production, sandbox
    description: str

    # Assigned gateway
    gateway_id: Optional[str]

    # Limits
    max_agents: int
    max_concurrent_executions: int

    # Promotion config
    promotion_from: Optional[str]  # workspace_id
    requires_approval: bool
    required_approvers: dict  # ["tech_lead"]

    # Data policies
    pii_allowed: bool
    encryption_required: bool
    retention_days: int

# ==========================================
# Gateways
# ==========================================

@db.model
class Gateway:
    """Nexus gateway instance."""
    id: str
    organization_id: str
    name: str
    gateway_type: str  # shared, dedicated, private
    status: str  # running, stopped, provisioning, error

    # Endpoints
    api_url: str
    api_port: int
    mcp_url: Optional[str]
    mcp_port: Optional[int]

    # SSL
    ssl_enabled: bool
    ssl_cert_id: Optional[str]

    # Scaling
    min_instances: int
    max_instances: int
    current_instances: int

    # Rate limits
    global_rate_limit: int
    per_agent_rate_limit: int
    per_user_rate_limit: int

    # Auth
    auth_methods: dict  # ["api_key", "jwt"]
    jwt_issuer: Optional[str]

    # Health
    last_health_check: Optional[str]
    health_status: str  # healthy, degraded, unhealthy

@db.model
class GatewayDeployment:
    """Agent deployed to gateway."""
    id: str
    gateway_id: str
    agent_id: str
    agent_version: str
    workspace_id: str

    # Traffic
    weight: int  # For weighted routing
    is_active: bool

    # Status
    deployed_at: str
    deployed_by: str
    status: str  # active, draining, inactive

# ==========================================
# Connectors
# ==========================================

@db.model
class Connector:
    """Data source connector."""
    id: str
    organization_id: str
    name: str
    connector_type: str  # postgresql, salesforce, s3, etc.
    status: str  # connected, error, disabled

    # Connection (encrypted)
    connection_config_encrypted: str

    # Access control
    allowed_operations: dict  # ["read", "write"]
    allowed_objects: dict  # ["Account", "Contact"]

    # Security
    mask_pii: bool
    audit_queries: bool

    # Caching
    cache_enabled: bool
    cache_ttl_seconds: int

    # Limits
    queries_per_minute: int

    # Health
    last_test_at: Optional[str]
    last_test_status: str

@db.model
class ConnectorPermission:
    """Agent permission to use connector."""
    id: str
    connector_id: str
    agent_id: str
    operations: dict  # ["read"]

# ==========================================
# Agents & Orchestrations
# ==========================================

@db.model
class Agent:
    """Agent definition."""
    id: str
    organization_id: str
    workspace_id: str
    team_id: Optional[str]
    created_by: str

    name: str
    description: str
    agent_type: str
    config_yaml: str

    # Versioning
    current_version: str

    # Risk assessment
    risk_level: str  # low, medium, high, critical

    # Marketplace
    is_public: bool
    marketplace_listing_id: Optional[str]

    # Status
    status: str  # draft, active, deprecated

@db.model
class AgentVersion:
    """Agent version history."""
    id: str
    agent_id: str
    version: str
    config_yaml: str
    change_summary: str
    created_by: str
    is_current: bool

    # Security scan
    security_scan_status: str  # pending, passed, failed
    security_scan_results: dict

@db.model
class Orchestration:
    """Multi-agent orchestration."""
    id: str
    organization_id: str
    workspace_id: str
    team_id: Optional[str]
    created_by: str

    name: str
    description: str
    pattern: str
    config_yaml: str
    agent_ids: dict

    current_version: str
    status: str

# ==========================================
# Executions & Monitoring
# ==========================================

@db.model
class Execution:
    """Agent/orchestration execution."""
    id: str
    organization_id: str
    workspace_id: str
    gateway_id: str

    # What was executed
    execution_type: str  # agent, orchestration
    agent_id: Optional[str]
    orchestration_id: Optional[str]
    version: str

    # Who/what triggered
    triggered_by: str  # user_id or "api_key:{id}"
    trigger_type: str  # api, cli, mcp, scheduled

    # Input/output
    input_data: dict
    output_data: dict

    # Status
    status: str  # queued, running, completed, failed
    error_message: Optional[str]
    error_code: Optional[str]

    # Timing
    queued_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    execution_time_ms: int

    # Resources
    input_tokens: int
    output_tokens: int
    cost_usd: float

    # Tracing
    trace_id: str
    parent_execution_id: Optional[str]  # For orchestrations

@db.model
class ExecutionStep:
    """Step within orchestration execution."""
    id: str
    execution_id: str
    agent_id: str
    step_number: int

    input_data: dict
    output_data: dict

    status: str
    started_at: str
    completed_at: Optional[str]
    execution_time_ms: int
    tokens_used: int
    cost_usd: float

# ==========================================
# Audit & Compliance
# ==========================================

@db.model
class AuditLog:
    """Immutable audit trail."""
    id: str
    organization_id: str
    timestamp: str

    # Actor
    actor_type: str  # user, api_key, system
    actor_id: str
    actor_email: Optional[str]
    actor_ip: Optional[str]

    # Action
    event_type: str
    resource_type: str
    resource_id: str
    action: str

    # Details
    changes: dict  # Before/after for updates
    context: dict  # Additional metadata

    # Result
    result: str  # success, failure
    error_message: Optional[str]

@db.model
class ComplianceReport:
    """Generated compliance report."""
    id: str
    organization_id: str
    report_type: str  # soc2, gdpr, hipaa
    period_start: str
    period_end: str
    generated_at: str
    generated_by: str
    status: str  # generating, completed, failed
    report_url: Optional[str]
    findings: dict

# ==========================================
# Notifications & Webhooks
# ==========================================

@db.model
class WebhookEndpoint:
    """Webhook configuration."""
    id: str
    organization_id: str
    name: str
    url: str
    secret: str  # For signature verification
    events: dict  # ["agent.deployed", "execution.failed"]
    is_active: bool
    last_triggered_at: Optional[str]
    failure_count: int

@db.model
class Notification:
    """User notification."""
    id: str
    user_id: str
    notification_type: str  # approval_request, budget_warning, etc.
    title: str
    message: str
    link: Optional[str]
    is_read: bool
    created_at: str
```

---

## Indexes & Performance

```python
# High-frequency queries need indexes
# DataFlow handles this automatically, but we can hint:

# Execution queries by org + time
# CREATE INDEX idx_execution_org_time ON execution(organization_id, started_at DESC);

# Agent queries by workspace
# CREATE INDEX idx_agent_workspace ON agent(workspace_id, status);

# Audit queries by org + time + type
# CREATE INDEX idx_audit_org_time ON audit_log(organization_id, timestamp DESC, event_type);
```

---

## Multi-Tenancy Enforcement

```python
# All queries automatically filtered by organization_id
# through DataFlow's multi-tenancy feature

from dataflow.core.multi_tenancy import TenantContext

async def list_agents(org_id: str, workspace_id: str):
    with TenantContext.set_current(org_id):
        workflow = WorkflowBuilder()
        workflow.add_node("AgentListNode", "list", {
            "filter": {"workspace_id": workspace_id}
            # organization_id automatically added by TenantContext
        })
        results, _ = await runtime.execute_workflow_async(workflow.build())
        return results["list"]
```
