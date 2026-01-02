# FastAPI vs Nexus Architecture Decision

## Core Principle

Kaizen Studio uses FastAPI for the Management Plane and Nexus for the Data Plane because they solve different problems.

## What Each Tool Does

### Nexus

Zero-config workflow deployment:

```python
from nexus import Nexus

app = Nexus()
app.register(my_workflow)  # Instantly available via API + CLI + MCP
app.run()
```

**Purpose**: Expose Kailash workflows as services without boilerplate.

### FastAPI

Full-featured web application framework:

```python
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2AuthorizationCodeBearer

app = FastAPI()

@app.get("/agents")
async def list_agents(token: str = Depends(oauth2_scheme)):
    ...
```

**Purpose**: Build complex applications with auth, databases, real-time features.

## Why Studio Needs FastAPI

### 1. Authentication Complexity

Studio requires OAuth2/OIDC with multiple identity providers:

```python
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="https://idp.example.com/authorize",
    tokenUrl="https://idp.example.com/token",
    scopes={"read": "Read access", "write": "Write access"}
)
```

Nexus provides basic auth only.

### 2. Authorization Patterns

Studio needs RBAC + ABAC with dependency injection:

```python
async def check_agent_access(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    agent = await db.get(Agent, agent_id)
    if agent.organization_id != user.organization_id:
        raise HTTPException(403, "Access denied")
    return agent
```

Nexus registers workflows 1:1 with endpoints without middleware evaluation.

### 3. Database ORM

Studio needs complex relational operations:

```python
async with db.begin():
    agent = Agent(name=data.name, org_id=user.org_id)
    db.add(agent)
    await db.flush()

    audit = AuditLog(action="created", resource_id=agent.id)
    db.add(audit)
```

| Capability | Nexus | FastAPI + SQLAlchemy |
|------------|-------|---------------------|
| Complex joins | Limited | Full SQL |
| Migrations | No | Alembic |
| Transactions | Workflow-scoped | Fine-grained |

### 4. Background Jobs

Studio needs async processing:

```python
await redis.enqueue_job("deploy_to_gateway", deployment.id)
```

Nexus has no background job support.

### 5. WebSockets

Studio needs real-time updates:

```python
@app.websocket("/ws/agents/{id}/logs")
async def agent_logs(websocket: WebSocket, agent_id: str):
    await websocket.accept()
    async for log in stream_logs(agent_id):
        await websocket.send_json(log)
```

Nexus has no WebSocket support.

### 6. Middleware

Studio needs CORS, rate limiting, compression:

```python
app.add_middleware(CORSMiddleware, allow_origins=origins)
app.add_middleware(RateLimitMiddleware, calls=100, period=60)
```

## Architecture

```
┌─────────────────────────────────────┐
│       MANAGEMENT PLANE              │
│       (Kaizen Studio)               │
│                                     │
│   Auth │ CRUD │ Policy │ Audit      │
│                                     │
│         FastAPI Backend             │
└─────────────┬───────────────────────┘
              │
              │ Deploy, collect metrics
              │
┌─────────────▼───────────────────────┐
│         DATA PLANE                  │
│       (Gateway Fleet)               │
│                                     │
│  Gateway 1  │  Gateway 2  │  ...    │
│   (Nexus)   │   (Nexus)   │         │
│                                     │
│      Workflow Execution             │
└─────────────────────────────────────┘
```

### Management Plane (FastAPI)

- User authentication and authorization
- Agent/workflow CRUD
- Deployment orchestration
- Policy management
- Audit logging

### Data Plane (Nexus)

- Execute agent workflows
- Handle inference requests
- Report metrics
- Scale horizontally

## How They Connect

### Deployment

```python
# Studio pushes to gateway
await client.post(f"{gateway_url}/workflows/register", json=config)
```

### Metrics

```python
# Gateway reports to Studio
@app.post("/internal/metrics")
async def receive_metrics(metrics: GatewayMetrics):
    await store_metrics(metrics)
```

## Comparison

| Requirement | Nexus | FastAPI |
|-------------|-------|---------|
| Workflow execution | ✅ | ❌ |
| OAuth2/OIDC | ❌ | ✅ |
| Complex auth | ❌ | ✅ |
| Database ORM | ⚠️ | ✅ |
| Background jobs | ❌ | ✅ |
| WebSockets | ❌ | ✅ |
| Middleware | ⚠️ | ✅ |

## Conclusion

Use Nexus for workflow execution at scale. Use FastAPI for building the management application. This is using each tool for its intended purpose.
