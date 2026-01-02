# DataFlow Models for Kaizen Studio

**Date**: 2025-11-22
**Purpose**: Persistence layer for visual layer state

---

## Overview

DataFlow provides zero-config database operations. Each `@db.model` automatically generates 11 CRUD nodes:

CREATE, READ, UPDATE, DELETE, LIST, COUNT, UPSERT, BULK_CREATE, BULK_UPDATE, BULK_DELETE, BULK_UPSERT

---

## Model Definitions

```python
from dataflow import DataFlow
from typing import Optional
from datetime import datetime

# Zero-config connection
db = DataFlow("postgresql://localhost:5432/kailash_studio")

# ==========================================
# Core Models
# ==========================================

@db.model
class Organization:
    """Multi-tenant organization."""
    id: str
    name: str
    slug: str
    plan_tier: str  # free, pro, enterprise
    status: str  # active, suspended

@db.model
class User:
    """User account."""
    id: str
    organization_id: str
    email: str
    name: str
    role: str  # owner, admin, member, viewer
    status: str  # active, inactive
    preferences: dict  # JSON field

@db.model
class APIProviderConfig:
    """LLM provider API key configuration."""
    id: str
    organization_id: str
    user_id: Optional[str]  # null = org-wide
    provider: str  # openai, anthropic, azure, etc.
    name: str
    api_key_encrypted: str
    api_base_url: Optional[str]  # For Azure, custom
    default_model: str
    budget_limit_usd: Optional[float]
    current_spend_usd: float
    is_default: bool
    is_active: bool

# ==========================================
# Agent Models
# ==========================================

@db.model
class Agent:
    """Agent definition (signature + config)."""
    id: str
    organization_id: str
    user_id: str
    name: str
    description: str
    config_yaml: str  # Full YAML configuration
    agent_type: str  # simple_qa, react, rag, etc.
    version: str
    status: str  # draft, active, deprecated
    is_public: bool  # Visible in marketplace

@db.model
class AgentVersion:
    """Agent version history."""
    id: str
    agent_id: str
    version: str
    config_yaml: str
    change_summary: str
    published_at: str

# ==========================================
# Orchestration Models
# ==========================================

@db.model
class Orchestration:
    """Multi-agent orchestration definition."""
    id: str
    organization_id: str
    user_id: str
    name: str
    description: str
    pattern: str  # supervisor_worker, router, ensemble, etc.
    config_yaml: str  # Full YAML configuration
    agent_ids: dict  # JSON list of agent IDs
    status: str  # draft, active, deprecated

@db.model
class Deployment:
    """Nexus deployment configuration."""
    id: str
    organization_id: str
    agent_id: Optional[str]
    orchestration_id: Optional[str]
    name: str  # Nexus registration name
    channels: dict  # {"api": true, "mcp": true, "cli": false}
    api_url: Optional[str]
    mcp_port: Optional[int]
    status: str  # running, stopped
    started_at: Optional[str]

# ==========================================
# Execution Tracking
# ==========================================

@db.model
class AgentExecution:
    """Agent execution record for usage/cost tracking."""
    id: str
    agent_id: str
    orchestration_id: Optional[str]
    deployment_id: Optional[str]
    organization_id: str
    user_id: str
    input_data: dict
    output_data: dict
    status: str  # running, completed, failed
    error_message: Optional[str]
    started_at: str
    completed_at: Optional[str]
    execution_time_ms: int
    input_tokens: int
    output_tokens: int
    cost_usd: float
    trace_id: Optional[str]

# ==========================================
# Templates
# ==========================================

@db.model
class AgentTemplate:
    """Pre-built agent template."""
    id: str
    name: str
    description: str
    category: str  # support, analysis, content, etc.
    config_yaml: str
    icon: str
    is_official: bool
    downloads: int

@db.model
class OrchestrationTemplate:
    """Pre-built orchestration template."""
    id: str
    name: str
    description: str
    pattern: str
    config_yaml: str
    agent_template_ids: dict
    is_official: bool
    downloads: int
```

---

## Usage Examples

### Create Agent
```python
from kailash.workflow.builder import WorkflowBuilder
from kailash.runtime import AsyncLocalRuntime

async def create_agent(data: dict) -> dict:
    workflow = WorkflowBuilder()
    workflow.add_node("AgentCreateNode", "create", {
        "id": data["id"],
        "organization_id": data["organization_id"],
        "user_id": data["user_id"],
        "name": data["name"],
        "description": data.get("description", ""),
        "config_yaml": data["config_yaml"],
        "agent_type": data["agent_type"],
        "version": "1.0.0",
        "status": "draft",
        "is_public": False
    })

    runtime = AsyncLocalRuntime()
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["create"]
```

### List Agents (Multi-Tenant)
```python
async def list_agents(org_id: str, page: int = 1, limit: int = 20) -> list:
    workflow = WorkflowBuilder()
    workflow.add_node("AgentListNode", "list", {
        "filter": {"organization_id": org_id, "status": "active"},
        "limit": limit,
        "offset": (page - 1) * limit,
        "order_by": ["-created_at"]  # Newest first
    })

    runtime = AsyncLocalRuntime()
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["list"]
```

### Track Execution with Cost
```python
async def track_execution(execution: dict) -> dict:
    workflow = WorkflowBuilder()
    workflow.add_node("AgentExecutionCreateNode", "create", {
        "id": execution["id"],
        "agent_id": execution["agent_id"],
        "organization_id": execution["organization_id"],
        "user_id": execution["user_id"],
        "input_data": execution["input"],
        "output_data": execution["output"],
        "status": "completed",
        "started_at": execution["started_at"],
        "completed_at": datetime.now().isoformat(),
        "execution_time_ms": execution["duration_ms"],
        "input_tokens": execution["input_tokens"],
        "output_tokens": execution["output_tokens"],
        "cost_usd": calculate_cost(execution),
        "trace_id": execution.get("trace_id")
    })

    runtime = AsyncLocalRuntime()
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["create"]
```

### Get Usage Statistics
```python
async def get_usage_stats(org_id: str, period: str = "month") -> dict:
    workflow = WorkflowBuilder()

    # Count executions
    workflow.add_node("AgentExecutionCountNode", "count", {
        "filter": {"organization_id": org_id}
    })

    # List for aggregation
    workflow.add_node("AgentExecutionListNode", "list", {
        "filter": {"organization_id": org_id},
        "limit": 10000
    })

    runtime = AsyncLocalRuntime()
    results, _ = await runtime.execute_workflow_async(workflow.build())

    executions = results.get("list", [])
    return {
        "total_executions": results["count"]["count"],
        "total_cost_usd": sum(e.get("cost_usd", 0) for e in executions),
        "total_tokens": sum(e.get("input_tokens", 0) + e.get("output_tokens", 0) for e in executions),
        "by_agent": aggregate_by_agent(executions)
    }
```

### Update Provider Spend
```python
async def update_provider_spend(provider_id: str, cost: float):
    workflow = WorkflowBuilder()

    # Read current spend
    workflow.add_node("APIProviderConfigReadNode", "read", {
        "id": provider_id
    })

    # Would use connection in real implementation
    # For now, update with new total
    workflow.add_node("APIProviderConfigUpdateNode", "update", {
        "filter": {"id": provider_id},
        "fields": {"current_spend_usd": "{{read.current_spend_usd + cost}}"}
    })

    runtime = AsyncLocalRuntime()
    await runtime.execute_workflow_async(workflow.build())
```

---

## Multi-Tenancy Configuration

```python
from dataflow.core.multi_tenancy import TenantConfig, TenantContext

# Configure tenant
config = TenantConfig(
    tenant_id="org-123",
    name="Acme Corp",
    isolation_strategy="row_level",  # or "schema", "hybrid", "database"
)

# Use tenant context in API handlers
async def api_handler(request):
    org_id = get_org_from_token(request)

    with TenantContext.set_current(org_id):
        # All DataFlow operations are now tenant-isolated
        agents = await list_agents(org_id)
        return agents
```

---

## Audit Trail

```python
from dataflow.core.audit_trail_manager import AuditTrailManager

audit = AuditTrailManager(retention_days=90)

# Record operation
audit.record_operation(
    operation_type="create",
    model_name="Agent",
    record_id="agent-123",
    changes={"name": "New Agent", "status": "draft"},
    user_id="user-456",
    metadata={"source": "visual_layer", "ip": "192.168.1.1"}
)

# Query audit trail
trail = audit.get_audit_trail(
    model_name="Agent",
    operation_type="update",
    start_date=datetime(2025, 1, 1),
    limit=100
)
```

---

## Critical Rules

1. **Primary key must be `id: str`** - Not `agent_id`, `user_id`, etc.
2. **CreateNode uses flat fields** - UpdateNode uses `{"filter": {...}, "fields": {...}}`
3. **Never include timestamps** - `created_at`/`updated_at` are auto-managed
4. **Node naming**: `ModelOperationNode` (e.g., `AgentCreateNode`)
5. **Multi-tenancy**: Always filter by `organization_id`

---

## Migration

DataFlow auto-generates migrations when models change:

```python
db = DataFlow(
    database_url=DATABASE_URL,
    auto_migrate=True  # Auto-apply migrations
)
```

For manual control:
```bash
dataflow migrate create "add_agent_version"
dataflow migrate apply
dataflow migrate rollback
```
