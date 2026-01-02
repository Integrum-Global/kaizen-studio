# FastAPI Backend Architecture

## Why FastAPI for Kaizen Studio

FastAPI provides the enterprise features required for a multi-tenant SaaS platform.

### Authentication Requirements

Studio requires OAuth2/OIDC with multiple identity providers.

```python
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2AuthorizationCodeBearer
from authlib.integrations.starlette_client import OAuth

app = FastAPI()

# Configure multiple SSO providers
oauth = OAuth()
oauth.register(
    name='azure',
    client_id=settings.AZURE_CLIENT_ID,
    client_secret=settings.AZURE_CLIENT_SECRET,
    server_metadata_url=f'{settings.AZURE_TENANT}/.well-known/openid-configuration',
)
oauth.register(
    name='okta',
    client_id=settings.OKTA_CLIENT_ID,
    client_secret=settings.OKTA_CLIENT_SECRET,
    server_metadata_url=f'{settings.OKTA_DOMAIN}/.well-known/openid-configuration',
)

# JWT validation with RBAC
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["RS256"])
    user = await db.get(User, payload["sub"])
    return user

async def require_permission(permission: str):
    async def checker(user: User = Depends(get_current_user)):
        if not user.has_permission(permission):
            raise HTTPException(403, "Permission denied")
        return user
    return checker
```

### Authorization Model

RBAC with resource-level ABAC conditions.

```python
from fastapi import Depends, HTTPException

class Permission:
    def __init__(self, resource: str, action: str):
        self.resource = resource
        self.action = action

    async def __call__(
        self,
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> bool:
        # Load applicable policies
        policies = await db.execute(
            select(Policy)
            .where(Policy.organization_id == user.organization_id)
            .where(Policy.resource == self.resource)
        )

        for policy in policies:
            if await self.evaluate_policy(policy, user):
                return True

        raise HTTPException(403, "Access denied by policy")

    async def evaluate_policy(self, policy: Policy, user: User) -> bool:
        # Evaluate ABAC conditions
        for condition in policy.conditions:
            if not await self.evaluate_condition(condition, user):
                return False
        return True

# Usage
@app.post("/api/v1/agents/{agent_id}/deploy")
async def deploy_agent(
    agent_id: UUID,
    user: User = Depends(Permission("agent", "deploy")),
):
    ...
```

### Database Integration

SQLAlchemy async with Alembic migrations.

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import relationship

# Async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
)

# Models with relationships
class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    organization_id = Column(String, ForeignKey("organizations.id"))
    workspace_id = Column(String, ForeignKey("workspaces.id"))

    organization = relationship("Organization", back_populates="agents")
    workspace = relationship("Workspace", back_populates="agents")
    versions = relationship("AgentVersion", back_populates="agent")
    deployments = relationship("Deployment", back_populates="agent")

# Dependency injection
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
```

### Real-Time Collaboration

WebSocket support for the visual orchestration canvas.

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        self.active_connections[session_id].add(websocket)

    async def broadcast(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/canvas/{session_id}")
async def canvas_websocket(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast node/edge updates to collaborators
            await manager.broadcast(session_id, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
```

### Background Job Processing

ARQ for async background tasks.

```python
from arq import create_pool
from arq.connections import RedisSettings

# Job definitions
async def deploy_agent_job(ctx, agent_id: str, gateway_id: str):
    """Long-running deployment job."""
    db = ctx["db"]
    nexus_service = ctx["nexus_service"]

    agent = await db.get(Agent, agent_id)
    gateway = await db.get(Gateway, gateway_id)

    # Build and deploy workflow
    workflow = await build_agent_workflow(agent)
    registration = await nexus_service.deploy(workflow, gateway)

    # Update deployment record
    await db.execute(
        update(Deployment)
        .where(Deployment.agent_id == agent_id)
        .values(status="active", registration_id=registration.id)
    )

# Queue job from endpoint
@app.post("/api/v1/agents/{agent_id}/deploy")
async def queue_deployment(
    agent_id: str,
    deployment: DeploymentCreate,
    background_tasks: BackgroundTasks,
):
    job = await arq_pool.enqueue_job(
        "deploy_agent_job",
        agent_id,
        deployment.gateway_id,
    )
    return {"job_id": job.job_id, "status": "queued"}
```

### Middleware Stack

Enterprise middleware for observability and security.

```python
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET,
)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)

# Audit logging
@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    response = await call_next(request)

    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        await audit_log.record(
            method=request.method,
            path=request.url.path,
            user_id=request.state.user_id,
            status=response.status_code,
        )

    return response
```

## Project Structure

```
src/studio/
├── __init__.py
├── main.py                 # FastAPI application
├── config.py               # Settings and configuration
├── models/                 # DataFlow models
│   ├── __init__.py
│   ├── organization.py
│   ├── user.py
│   ├── agent.py
│   └── deployment.py
├── api/                    # API routes
│   ├── __init__.py
│   ├── auth.py
│   ├── agents.py
│   ├── deployments.py
│   └── gateways.py
├── services/               # Business logic
│   ├── __init__.py
│   ├── auth_service.py
│   ├── agent_service.py
│   ├── deployment_service.py
│   └── nexus_service.py
├── middleware/             # Custom middleware
│   ├── __init__.py
│   ├── auth.py
│   ├── audit.py
│   └── rbac.py
└── jobs/                   # Background jobs
    ├── __init__.py
    └── deployment_jobs.py
```

## Dependencies

```toml
[project.dependencies]
fastapi = ">=0.109.0"
uvicorn = {extras = ["standard"], version = ">=0.27.0"}
sqlalchemy = {extras = ["asyncio"], version = ">=2.0.0"}
asyncpg = ">=0.29.0"
pydantic = ">=2.0.0"
pydantic-settings = ">=2.0.0"
python-jose = {extras = ["cryptography"], version = ">=3.3.0"}
passlib = {extras = ["bcrypt"], version = ">=1.7.4"}
authlib = ">=1.3.0"
httpx = ">=0.26.0"
arq = ">=0.25.0"
prometheus-fastapi-instrumentator = ">=6.1.0"
```
