# API Endpoints for Visual Layer

**Date**: 2025-11-22
**Purpose**: FastAPI backend serving the React visual layer

---

## Overview

The visual layer backend is a thin API layer that:
1. Validates user input
2. Calls DataFlow for persistence
3. Generates Kaizen code from configurations
4. Triggers Nexus deployments

It does NOT reimplement Kaizen features - it orchestrates them.

---

## Architecture

```python
from fastapi import FastAPI, Depends
from kailash.runtime import AsyncLocalRuntime
from dataflow import DataFlow

app = FastAPI(title="Kaizen Studio API")
db = DataFlow("postgresql://localhost/studio")
runtime = AsyncLocalRuntime()
```

---

## Authentication Endpoints

```python
# POST /api/auth/login
@app.post("/api/auth/login")
async def login(email: str, password: str):
    """Authenticate user and return JWT."""
    pass

# POST /api/auth/register
@app.post("/api/auth/register")
async def register(org_name: str, email: str, password: str):
    """Create organization and first user."""
    pass

# GET /api/auth/me
@app.get("/api/auth/me")
async def get_current_user(user = Depends(get_user_from_token)):
    """Get current user profile."""
    pass
```

---

## Provider Endpoints

```python
# GET /api/providers
@app.get("/api/providers")
async def list_providers(user = Depends(get_current_user)):
    """List user's configured LLM providers."""
    workflow = WorkflowBuilder()
    workflow.add_node("APIProviderConfigListNode", "list", {
        "filter": {
            "organization_id": user.organization_id,
            "user_id": user.id
        }
    })
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["list"]

# POST /api/providers
@app.post("/api/providers")
async def create_provider(
    provider: str,
    name: str,
    api_key: str,
    budget_limit: float = None,
    user = Depends(get_current_user)
):
    """Add new LLM provider configuration."""
    # Validate key
    valid = await validate_api_key(provider, api_key)
    if not valid:
        raise HTTPException(400, "Invalid API key")

    # Encrypt and store
    encrypted_key = encrypt(api_key)
    workflow = WorkflowBuilder()
    workflow.add_node("APIProviderConfigCreateNode", "create", {
        "id": f"prov-{uuid4()}",
        "organization_id": user.organization_id,
        "user_id": user.id,
        "provider": provider,
        "name": name,
        "api_key_encrypted": encrypted_key,
        "budget_limit_usd": budget_limit,
        "current_spend_usd": 0.0,
        "is_default": False,
        "is_active": True
    })
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["create"]

# POST /api/providers/{id}/validate
@app.post("/api/providers/{id}/validate")
async def validate_provider(id: str):
    """Test provider API key validity."""
    pass

# DELETE /api/providers/{id}
@app.delete("/api/providers/{id}")
async def delete_provider(id: str):
    """Remove provider configuration."""
    pass

# GET /api/providers/{id}/usage
@app.get("/api/providers/{id}/usage")
async def get_provider_usage(id: str, period: str = "month"):
    """Get usage statistics for provider."""
    pass
```

---

## Agent Endpoints

```python
# GET /api/agents
@app.get("/api/agents")
async def list_agents(
    page: int = 1,
    limit: int = 20,
    status: str = None,
    user = Depends(get_current_user)
):
    """List agents for organization."""
    filter = {"organization_id": user.organization_id}
    if status:
        filter["status"] = status

    workflow = WorkflowBuilder()
    workflow.add_node("AgentListNode", "list", {
        "filter": filter,
        "limit": limit,
        "offset": (page - 1) * limit
    })
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["list"]

# POST /api/agents
@app.post("/api/agents")
async def create_agent(
    name: str,
    config_yaml: str,
    agent_type: str,
    description: str = "",
    user = Depends(get_current_user)
):
    """Create new agent from YAML configuration."""
    # Validate YAML
    try:
        config = yaml.safe_load(config_yaml)
        validate_agent_config(config)
    except Exception as e:
        raise HTTPException(400, f"Invalid configuration: {e}")

    workflow = WorkflowBuilder()
    workflow.add_node("AgentCreateNode", "create", {
        "id": f"agent-{uuid4()}",
        "organization_id": user.organization_id,
        "user_id": user.id,
        "name": name,
        "description": description,
        "config_yaml": config_yaml,
        "agent_type": agent_type,
        "version": "1.0.0",
        "status": "draft",
        "is_public": False
    })
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["create"]

# GET /api/agents/{id}
@app.get("/api/agents/{id}")
async def get_agent(id: str):
    """Get agent details."""
    workflow = WorkflowBuilder()
    workflow.add_node("AgentReadNode", "read", {"id": id})
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["read"]

# PATCH /api/agents/{id}
@app.patch("/api/agents/{id}")
async def update_agent(id: str, updates: dict):
    """Update agent configuration."""
    workflow = WorkflowBuilder()
    workflow.add_node("AgentUpdateNode", "update", {
        "filter": {"id": id},
        "fields": updates
    })
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["update"]

# DELETE /api/agents/{id}
@app.delete("/api/agents/{id}")
async def delete_agent(id: str):
    """Delete agent."""
    pass

# POST /api/agents/{id}/test
@app.post("/api/agents/{id}/test")
async def test_agent(id: str, input_data: dict):
    """Execute agent with test input."""
    # Load agent
    agent_record = await get_agent(id)
    config = yaml.safe_load(agent_record["config_yaml"])

    # Build and run agent
    agent = build_agent_from_config(config)
    result = await agent.run_async(**input_data)

    return {
        "output": result,
        "tokens": agent.last_token_usage,
        "cost": agent.last_cost
    }
```

---

## Orchestration Endpoints

```python
# GET /api/orchestrations
@app.get("/api/orchestrations")
async def list_orchestrations(user = Depends(get_current_user)):
    """List orchestrations for organization."""
    workflow = WorkflowBuilder()
    workflow.add_node("OrchestrationListNode", "list", {
        "filter": {"organization_id": user.organization_id}
    })
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["list"]

# POST /api/orchestrations
@app.post("/api/orchestrations")
async def create_orchestration(
    name: str,
    pattern: str,
    config_yaml: str,
    agent_ids: list,
    user = Depends(get_current_user)
):
    """Create multi-agent orchestration."""
    workflow = WorkflowBuilder()
    workflow.add_node("OrchestrationCreateNode", "create", {
        "id": f"orch-{uuid4()}",
        "organization_id": user.organization_id,
        "user_id": user.id,
        "name": name,
        "pattern": pattern,
        "config_yaml": config_yaml,
        "agent_ids": {"ids": agent_ids},
        "status": "draft"
    })
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["create"]

# POST /api/orchestrations/{id}/execute
@app.post("/api/orchestrations/{id}/execute")
async def execute_orchestration(id: str, input_data: dict):
    """Execute orchestration."""
    # Load orchestration
    orch_record = await get_orchestration(id)
    config = yaml.safe_load(orch_record["config_yaml"])

    # Build pipeline
    from kaizen.orchestration.pipeline import Pipeline
    from kaizen.orchestration.runtime import OrchestrationRuntime

    agents = [await load_agent(aid) for aid in orch_record["agent_ids"]["ids"]]
    pipeline = build_pipeline_from_config(config["pattern"], agents, config)

    # Execute
    runtime = OrchestrationRuntime()
    result = await runtime.execute(pipeline, input_data)

    return {
        "output": result.outputs,
        "trace_id": result.trace_id,
        "agents_executed": result.agents_executed,
        "total_cost": result.total_cost
    }

# WebSocket for streaming execution
@app.websocket("/api/orchestrations/{id}/stream")
async def stream_orchestration(websocket: WebSocket, id: str):
    """Stream orchestration execution events."""
    await websocket.accept()

    # Load and build
    orch_record = await get_orchestration(id)
    config = yaml.safe_load(orch_record["config_yaml"])
    pipeline = build_pipeline_from_config(...)

    runtime = OrchestrationRuntime()

    # Stream events
    async for event in runtime.execute_stream(pipeline, input_data):
        await websocket.send_json({
            "type": event.type,
            "agent_id": event.agent_id,
            "data": event.data,
            "timestamp": event.timestamp.isoformat()
        })

    await websocket.close()
```

---

## Deployment Endpoints

```python
# POST /api/deploy
@app.post("/api/deploy")
async def deploy(
    agent_id: str = None,
    orchestration_id: str = None,
    channels: list = ["api", "mcp"],
    user = Depends(get_current_user)
):
    """Deploy agent or orchestration to Nexus."""
    from nexus import Nexus

    # Load configuration
    if agent_id:
        record = await get_agent(agent_id)
        workflow = build_agent_workflow(record)
        name = record["name"]
    else:
        record = await get_orchestration(orchestration_id)
        workflow = build_orchestration_workflow(record)
        name = record["name"]

    # Create Nexus deployment
    # Note: In production, this would manage a separate Nexus process
    app = Nexus(
        api_port=8001,
        mcp_port=3001
    )
    app.register(name, workflow.build())

    # Store deployment record
    deployment_id = f"deploy-{uuid4()}"
    workflow = WorkflowBuilder()
    workflow.add_node("DeploymentCreateNode", "create", {
        "id": deployment_id,
        "organization_id": user.organization_id,
        "agent_id": agent_id,
        "orchestration_id": orchestration_id,
        "name": name,
        "channels": {"api": "api" in channels, "mcp": "mcp" in channels},
        "api_url": f"http://localhost:8001/workflows/{name}/execute",
        "mcp_port": 3001 if "mcp" in channels else None,
        "status": "running",
        "started_at": datetime.now().isoformat()
    })
    await runtime.execute_workflow_async(workflow.build())

    return {
        "deployment_id": deployment_id,
        "name": name,
        "api_url": f"http://localhost:8001/workflows/{name}/execute",
        "mcp_command": f"claude --mcp-server localhost:3001",
        "cli_command": f"nexus execute {name}"
    }

# GET /api/deployments
@app.get("/api/deployments")
async def list_deployments(user = Depends(get_current_user)):
    """List active deployments."""
    pass

# DELETE /api/deployments/{id}
@app.delete("/api/deployments/{id}")
async def stop_deployment(id: str):
    """Stop deployment."""
    pass
```

---

## Runtime Monitoring Endpoints

```python
# GET /api/runtime/status
@app.get("/api/runtime/status")
async def get_runtime_status():
    """Get OrchestrationRuntime status."""
    from kaizen.orchestration.runtime import OrchestrationRuntime

    # Would connect to running runtime
    return {
        "active_agents": 10,
        "pending_tasks": 3,
        "healthy_count": 8,
        "total_agents": 10
    }

# GET /api/runtime/agents
@app.get("/api/runtime/agents")
async def get_runtime_agents():
    """Get registered agents with health status."""
    from kaizen.orchestration.registry import AgentRegistry

    registry = AgentRegistry.get_instance()
    agents = registry.list_agents()

    return [
        {
            "id": a.id,
            "name": a.name,
            "status": a.status,
            "last_heartbeat": a.last_heartbeat,
            "circuit_breaker_state": a.circuit_breaker_state,
            "budget_used": a.budget_used,
            "budget_limit": a.budget_limit
        }
        for a in agents
    ]

# GET /api/runtime/metrics
@app.get("/api/runtime/metrics")
async def get_runtime_metrics():
    """Get Prometheus-style metrics."""
    pass
```

---

## Template Endpoints

```python
# GET /api/templates/agents
@app.get("/api/templates/agents")
async def list_agent_templates(category: str = None):
    """List available agent templates."""
    workflow = WorkflowBuilder()
    filter = {"is_official": True}
    if category:
        filter["category"] = category

    workflow.add_node("AgentTemplateListNode", "list", {"filter": filter})
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["list"]

# GET /api/templates/agents/{id}
@app.get("/api/templates/agents/{id}")
async def get_agent_template(id: str):
    """Get agent template details."""
    pass

# POST /api/templates/agents/{id}/use
@app.post("/api/templates/agents/{id}/use")
async def use_agent_template(id: str, name: str, user = Depends(get_current_user)):
    """Create agent from template."""
    # Get template
    template = await get_agent_template(id)

    # Create agent
    return await create_agent(
        name=name,
        config_yaml=template["config_yaml"],
        agent_type=template["agent_type"],
        user=user
    )

# GET /api/templates/orchestrations
@app.get("/api/templates/orchestrations")
async def list_orchestration_templates():
    """List orchestration templates."""
    pass
```

---

## Observability Endpoints

```python
# GET /api/traces
@app.get("/api/traces")
async def list_traces(
    agent_id: str = None,
    start_date: str = None,
    end_date: str = None,
    limit: int = 100
):
    """List execution traces."""
    pass

# GET /api/traces/{id}
@app.get("/api/traces/{id}")
async def get_trace(id: str):
    """Get trace details with spans."""
    pass

# GET /api/metrics
@app.get("/api/metrics")
async def get_metrics(metric_name: str, period: str = "1h"):
    """Get metric timeseries data."""
    pass

# GET /api/audit
@app.get("/api/audit")
async def get_audit_logs(
    model_name: str = None,
    operation_type: str = None,
    user_id: str = None,
    limit: int = 100
):
    """Get audit trail."""
    from dataflow.core.audit_trail_manager import AuditTrailManager

    audit = AuditTrailManager()
    return audit.get_audit_trail(
        model_name=model_name,
        operation_type=operation_type,
        user_id=user_id,
        limit=limit
    )
```

---

## Usage Statistics Endpoints

```python
# GET /api/usage
@app.get("/api/usage")
async def get_usage_stats(
    period: str = "month",
    user = Depends(get_current_user)
):
    """Get organization usage statistics."""
    workflow = WorkflowBuilder()
    workflow.add_node("AgentExecutionListNode", "list", {
        "filter": {"organization_id": user.organization_id},
        "limit": 10000
    })
    results, _ = await runtime.execute_workflow_async(workflow.build())

    executions = results["list"]
    return {
        "total_executions": len(executions),
        "total_cost_usd": sum(e["cost_usd"] for e in executions),
        "total_tokens": sum(e["input_tokens"] + e["output_tokens"] for e in executions),
        "by_agent": aggregate_by_agent(executions),
        "by_day": aggregate_by_day(executions)
    }

# GET /api/usage/agents/{id}
@app.get("/api/usage/agents/{id}")
async def get_agent_usage(id: str, period: str = "month"):
    """Get usage stats for specific agent."""
    pass
```

---

## Helper Functions

```python
def build_agent_from_config(config: dict):
    """Build Kaizen agent from YAML configuration."""
    from kaizen.core.base_agent import BaseAgent
    from kaizen.signatures import Signature, InputField, OutputField

    # Generate signature class
    SignatureClass = generate_signature_class(config["signature"])

    # Create agent
    agent_config = BaseAgentConfig(
        llm_provider=config["provider"]["provider"],
        model=config["provider"].get("model", "gpt-4o-mini"),
        temperature=config["config"].get("temperature", 0.7),
        strategy_type=config["config"].get("strategy", "single_shot"),
        budget_limit_usd=config["config"].get("budget_limit_usd")
    )

    return BaseAgent(config=agent_config, signature=SignatureClass())


def build_pipeline_from_config(pattern: str, agents: list, config: dict):
    """Build Kaizen Pipeline from configuration."""
    from kaizen.orchestration.pipeline import Pipeline

    if pattern == "supervisor_worker":
        return Pipeline.supervisor_worker(
            supervisor=agents[0],
            workers=agents[1:],
            routing_mode=config.get("routing", {}).get("mode", "semantic")
        )
    elif pattern == "router":
        return Pipeline.router(
            router=agents[0],
            specialists=agents[1:]
        )
    elif pattern == "ensemble":
        return Pipeline.ensemble(
            agents=agents[:-1],
            synthesizer=agents[-1]
        )
    # ... more patterns
```
