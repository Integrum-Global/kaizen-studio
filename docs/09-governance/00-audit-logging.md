# Audit Logging

## Overview

Kaizen Studio maintains comprehensive audit logs for compliance, security, and operational visibility.

## Audit Log Model

```python
@db.model
class AuditLog:
    id: str
    organization_id: str
    user_id: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    status: str
    error_message: Optional[str]
    created_at: str
```

## Actions

| Action | Description |
|--------|-------------|
| `create` | Resource created |
| `read` | Resource accessed |
| `update` | Resource modified |
| `delete` | Resource deleted |
| `deploy` | Agent deployed |
| `login` | User authenticated |
| `logout` | User signed out |

## Resource Types

| Type | Description |
|------|-------------|
| `agent` | AI agent |
| `deployment` | Agent deployment |
| `pipeline` | Orchestration pipeline |
| `user` | User account |
| `organization` | Organization |
| `team` | Team |
| `gateway` | Nexus gateway |

## Automatic Logging

The audit middleware automatically logs:
- All POST requests (create)
- All PUT/PATCH requests (update)
- All DELETE requests (delete)

Configuration in `config.py`:

```python
AUDIT_ENABLED: bool = True
AUDIT_RETENTION_DAYS: int = 90
```

## Manual Logging

Use the decorator for custom events:

```python
from studio.decorators.audit import audit_action

@audit_action("deploy", "agent")
async def deploy_agent(request: Request, agent_id: str):
    # Deployment logic
    return deployment
```

Or use the service directly:

```python
from studio.services.audit_service import AuditService

audit = AuditService()

await audit.log(
    organization_id=org_id,
    user_id=user_id,
    action="deploy",
    resource_type="agent",
    resource_id=agent_id,
    details={"gateway_id": gateway_id},
    status="success"
)
```

## API Endpoints

### List Audit Logs

```bash
GET /api/v1/audit/logs?action=create&resource_type=agent&limit=50
```

Query parameters:
- `user_id` - Filter by user
- `action` - Filter by action
- `resource_type` - Filter by resource type
- `resource_id` - Filter by resource ID
- `start_date` - ISO 8601 start date
- `end_date` - ISO 8601 end date
- `limit` - Max results (default 100)
- `offset` - Pagination offset

### Get Log Entry

```bash
GET /api/v1/audit/logs/{id}
```

### Get User Activity

```bash
GET /api/v1/audit/users/{user_id}?limit=50
```

### Get Resource History

```bash
GET /api/v1/audit/resources/agent/agent-123
```

### Export Logs

```bash
GET /api/v1/audit/export?format=csv&start_date=2024-01-01
```

Supported formats: `csv`, `json`

## Service Operations

```python
from studio.services.audit_service import AuditService

audit = AuditService()

# Log event
await audit.log(
    organization_id=org_id,
    user_id=user_id,
    action="update",
    resource_type="agent",
    resource_id="agent-123",
    details={"temperature": {"old": 0.7, "new": 0.5}},
    ip_address="192.168.1.1",
    status="success"
)

# Query logs
logs = await audit.list(
    organization_id=org_id,
    action="create",
    start_date="2024-01-01",
    limit=100
)

# Get user activity
activity = await audit.get_user_activity(user_id, limit=50)

# Get resource history
history = await audit.get_resource_history("agent", "agent-123")

# Count logs
count = await audit.count(organization_id=org_id, action="deploy")
```

## Compliance Features

### Data Retention

Audit logs are retained based on configuration:

```python
AUDIT_RETENTION_DAYS = 90
```

### Immutability

Audit logs cannot be modified or deleted (except by retention policy).

### Export for Compliance

Export logs for external audit systems:

```python
# Export as CSV
response = await client.get(
    "/api/v1/audit/export",
    params={
        "format": "csv",
        "start_date": "2024-01-01",
        "end_date": "2024-03-31"
    }
)
```

## Best Practices

1. **Log all security events** - Login, logout, permission changes
2. **Include context** - IP address, user agent, request ID
3. **Use structured details** - JSON for searchability
4. **Monitor failed actions** - Alert on repeated failures
5. **Regular exports** - Backup to external systems
6. **Access control** - Only admins view audit logs
