# Connector Management

## Overview

Connectors enable agents to integrate with external systems like databases, APIs, storage, and messaging services.

## Connector Model

```python
@db.model
class Connector:
    id: str
    organization_id: str
    name: str
    connector_type: str
    provider: str
    config_encrypted: str
    status: str
    last_tested_at: Optional[str]
    last_test_result: Optional[str]
    last_error: Optional[str]
    created_by: str
    created_at: str
    updated_at: str
```

## Connector Types

| Type | Providers |
|------|-----------|
| `database` | postgresql, mysql, mongodb, redis, sqlite |
| `api` | rest, graphql, soap |
| `storage` | s3, gcs, azure_blob, minio |
| `messaging` | kafka, rabbitmq, sqs, redis_pubsub |

## Creating Connectors

```bash
POST /api/v1/connectors
```

```json
{
  "name": "Production Database",
  "connector_type": "database",
  "provider": "postgresql",
  "config": {
    "host": "db.example.com",
    "port": 5432,
    "database": "production",
    "username": "app_user",
    "password": "secret123",
    "ssl": true
  }
}
```

Config is automatically encrypted before storage.

## API Endpoints

### List Types

```bash
GET /api/v1/connectors/types
```

### Create Connector

```bash
POST /api/v1/connectors
```

### List Connectors

```bash
GET /api/v1/connectors?connector_type=database
```

### Get Connector

```bash
GET /api/v1/connectors/{id}
```

### Update Connector

```bash
PUT /api/v1/connectors/{id}
```

```json
{
  "name": "Updated Name",
  "config": {
    "password": "new_password"
  }
}
```

### Delete Connector

```bash
DELETE /api/v1/connectors/{id}
```

### Test Connection

```bash
POST /api/v1/connectors/{id}/test
```

Returns:

```json
{
  "success": true,
  "message": "Connection successful",
  "latency_ms": 45
}
```

## Attaching to Agents

### Attach

```bash
POST /api/v1/connectors/{id}/attach
```

```json
{
  "agent_id": "agent-123",
  "alias": "main_db",
  "config_override": {
    "database": "agent_specific_db"
  }
}
```

### List Agent Connectors

```bash
GET /api/v1/agents/{id}/connectors
```

### Detach

```bash
DELETE /api/v1/connectors/instances/{instance_id}
```

## Connector Instance Model

```python
@db.model
class ConnectorInstance:
    id: str
    connector_id: str
    agent_id: str
    alias: str
    config_override: Optional[str]
    created_at: str
```

## Service Operations

```python
from studio.services.connector_service import ConnectorService

service = ConnectorService()

# Create connector
connector = await service.create({
    "organization_id": org_id,
    "name": "My Database",
    "connector_type": "database",
    "provider": "postgresql",
    "config": {"host": "localhost", ...},
    "created_by": user_id,
})

# Test connection
result = await service.test_connection(connector["id"])

# Attach to agent
instance = await service.attach_to_agent(
    connector_id=connector["id"],
    agent_id="agent-123",
    alias="db"
)

# List agent connectors
connectors = await service.list_agent_connectors("agent-123")

# Execute query (when agent runs)
result = await service.execute_query(
    connector_id=connector["id"],
    query="SELECT * FROM users WHERE id = :id",
    params={"id": 123}
)
```

## Security

### Config Encryption

All connector configurations are encrypted with Fernet:

- Passwords
- API keys
- Connection strings
- Certificates

### Access Control

- Only organization members can access connectors
- Admin role required to create/delete
- Developer role can attach to agents

## Best Practices

1. **Test before use** - Verify connections work
2. **Use aliases** - Meaningful names in agent context
3. **Rotate credentials** - Update passwords regularly
4. **Monitor status** - Alert on connection failures
5. **Minimal permissions** - Use read-only where possible
