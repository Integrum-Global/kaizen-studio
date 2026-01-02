# Deployment Lifecycle

## Overview

Deployments push agents to Nexus gateways, making them available via API, CLI, or MCP.

## Deployment Model

```python
@db.model
class Deployment:
    id: str
    organization_id: str
    agent_id: str
    agent_version_id: Optional[str]
    gateway_id: str
    registration_id: Optional[str]
    status: str
    endpoint_url: Optional[str]
    error_message: Optional[str]
    deployed_by: str
    deployed_at: Optional[str]
    stopped_at: Optional[str]
    created_at: str
    updated_at: str
```

## Lifecycle States

```
pending → deploying → active
                   ↘ failed

active → stopped
```

| State | Description |
|-------|-------------|
| `pending` | Created, waiting to start |
| `deploying` | Building and registering |
| `active` | Running and accepting requests |
| `failed` | Error during deployment |
| `stopped` | Manually stopped |

## API Endpoints

### Create Deployment

```bash
POST /api/v1/deployments
```

```json
{
  "agent_id": "agent-123",
  "gateway_id": "gw-456"
}
```

### List Deployments

```bash
GET /api/v1/deployments?agent_id=agent-123
GET /api/v1/deployments?gateway_id=gw-456
GET /api/v1/deployments?status=active
```

### Get Deployment

```bash
GET /api/v1/deployments/{id}
```

### Stop Deployment

```bash
POST /api/v1/deployments/{id}/stop
```

### Redeploy

```bash
POST /api/v1/deployments/{id}/redeploy
```

### Get Logs

```bash
GET /api/v1/deployments/{id}/logs
```

## Service Operations

```python
from studio.services.deployment_service import DeploymentService

service = DeploymentService()

# Deploy agent to gateway
deployment = await service.deploy(
    agent_id="agent-123",
    gateway_id="gw-456",
    user_id="user-789"
)

# Check status
deployment = await service.get(deployment["id"])
print(deployment["status"])  # "active"
print(deployment["endpoint_url"])  # "https://nexus.../agent-123"

# Stop deployment
await service.stop(deployment["id"])

# Redeploy (new version)
deployment = await service.redeploy(deployment["id"])

# Get logs
logs = await service.get_logs(deployment["id"])
```

## Deployment Logs

```python
@db.model
class DeploymentLog:
    id: str
    deployment_id: str
    event_type: str
    message: str
    metadata: Optional[str]
    created_at: str
```

Event types:
- `started` - Deployment initiated
- `building` - Building workflow
- `registering` - Registering with gateway
- `registered` - Successfully registered
- `failed` - Error occurred
- `stopped` - Deployment stopped

## Deployment Flow

### 1. Create Deployment

```python
deployment = await service.deploy(agent_id, gateway_id, user_id)
# Status: pending
```

### 2. Build Workflow

```python
# Internal: Build Kaizen agent workflow
await service.add_log(deployment_id, "building", "Building agent workflow")
workflow = await build_agent_workflow(agent)
```

### 3. Register with Gateway

```python
# Internal: Register with Nexus gateway
await service.add_log(deployment_id, "registering", "Registering with gateway")
registration = await nexus_client.register(gateway, workflow)
```

### 4. Update Status

```python
# Internal: Update deployment record
await service.update_status(deployment_id, "active")
await service.update(deployment_id, {
    "registration_id": registration.id,
    "endpoint_url": registration.endpoint,
    "deployed_at": datetime.utcnow().isoformat()
})
```

### 5. Handle Errors

```python
try:
    # ... deployment steps
except Exception as e:
    await service.add_log(deployment_id, "failed", str(e))
    await service.update_status(deployment_id, "failed", error=str(e))
```

## Environment Promotion

Promote deployments through environments:

```python
async def promote(deployment_id: str, target_env: str):
    deployment = await service.get(deployment_id)

    # Get target gateway
    target_gateway = await gateway_service.get_by_environment(
        deployment["organization_id"],
        target_env
    )

    # Deploy to new environment
    return await service.deploy(
        deployment["agent_id"],
        target_gateway["id"],
        current_user.id
    )

# Usage
prod_deployment = await promote(staging_deployment_id, "production")
```

## Best Practices

1. **Test in development** - Always deploy to dev first
2. **Version before deploy** - Create agent version snapshot
3. **Monitor logs** - Check logs for errors
4. **Gradual rollout** - Use staging before production
5. **Health checks** - Verify gateway health before deploying
