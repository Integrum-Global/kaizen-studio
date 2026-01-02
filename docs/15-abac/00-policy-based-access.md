# Policy-Based Access Control (ABAC)

## Overview

ABAC extends RBAC with fine-grained, attribute-based policies for enterprise access control.

## Policy Model

```python
@db.model
class Policy:
    id: str
    organization_id: str
    name: str
    description: Optional[str]
    resource_type: str        # agent, deployment, pipeline, *
    action: str               # create, read, update, delete, *
    effect: str               # allow, deny
    conditions: str           # JSON conditions
    priority: int             # Higher = evaluated first
    status: str               # active, inactive
    created_by: str
    created_at: str
    updated_at: str
```

## Creating Policies

```bash
POST /api/v1/policies
```

```json
{
  "name": "Business Hours Only",
  "description": "Allow deployments only during business hours",
  "resource_type": "deployment",
  "action": "create",
  "effect": "allow",
  "conditions": {
    "all": [
      {"field": "context.time.hour", "op": "gte", "value": 9},
      {"field": "context.time.hour", "op": "lte", "value": 17},
      {"field": "context.time.weekday", "op": "in", "value": [0, 1, 2, 3, 4]}
    ]
  },
  "priority": 100
}
```

## Condition Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal | `{"field": "status", "op": "eq", "value": "active"}` |
| `ne` | Not equal | `{"field": "status", "op": "ne", "value": "deleted"}` |
| `gt` | Greater than | `{"field": "priority", "op": "gt", "value": 5}` |
| `gte` | Greater or equal | `{"field": "hour", "op": "gte", "value": 9}` |
| `lt` | Less than | `{"field": "cost", "op": "lt", "value": 100}` |
| `lte` | Less or equal | `{"field": "hour", "op": "lte", "value": 17}` |
| `in` | In list | `{"field": "env", "op": "in", "value": ["dev", "staging"]}` |
| `not_in` | Not in list | `{"field": "env", "op": "not_in", "value": ["prod"]}` |
| `contains` | Contains substring | `{"field": "name", "op": "contains", "value": "test"}` |
| `starts_with` | Starts with | `{"field": "id", "op": "starts_with", "value": "agent-"}` |
| `exists` | Field exists | `{"field": "metadata.approved", "op": "exists", "value": true}` |

## Condition Logic

### All (AND)

```json
{
  "all": [
    {"field": "resource.workspace_id", "op": "eq", "value": "ws-123"},
    {"field": "resource.status", "op": "eq", "value": "draft"}
  ]
}
```

### Any (OR)

```json
{
  "any": [
    {"field": "user.role", "op": "eq", "value": "org_owner"},
    {"field": "resource.created_by", "op": "eq", "value": "context.user_id"}
  ]
}
```

## Field References

### Resource Fields

```json
{"field": "resource.workspace_id", "op": "eq", "value": "ws-123"}
{"field": "resource.status", "op": "in", "value": ["active"]}
{"field": "resource.created_by", "op": "eq", "value": "context.user_id"}
```

### Context Fields

```json
{"field": "context.user_id", "op": "eq", "value": "user-123"}
{"field": "context.time.hour", "op": "gte", "value": 9}
{"field": "context.ip", "op": "starts_with", "value": "192.168."}
```

## Policy Assignment

### Assign to User

```bash
POST /api/v1/policies/{id}/assign
```

```json
{
  "principal_type": "user",
  "principal_id": "user-123"
}
```

### Assign to Team

```json
{
  "principal_type": "team",
  "principal_id": "team-456"
}
```

### Assign to Role

```json
{
  "principal_type": "role",
  "principal_id": "developer"
}
```

## Evaluation Flow

1. RBAC check (role-based permission)
2. Get user's policies (direct + team + role)
3. Filter by resource_type and action
4. Sort by priority (highest first)
5. Evaluate conditions
6. First matching policy determines access
7. Deny wins if no explicit allow

## API Endpoints

### Policy Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/policies` | Create policy |
| GET | `/api/v1/policies` | List policies |
| GET | `/api/v1/policies/{id}` | Get policy |
| PUT | `/api/v1/policies/{id}` | Update policy |
| DELETE | `/api/v1/policies/{id}` | Delete policy |

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/policies/{id}/assign` | Assign to principal |
| DELETE | `/api/v1/policies/assignments/{id}` | Remove assignment |
| GET | `/api/v1/policies/user/{user_id}` | Get user policies |

### Evaluation

```bash
POST /api/v1/policies/evaluate
```

```json
{
  "user_id": "user-123",
  "resource_type": "deployment",
  "action": "create",
  "resource": {
    "workspace_id": "ws-456",
    "gateway_id": "gw-789"
  }
}
```

## Service Operations

```python
from studio.services.abac_service import ABACService

abac = ABACService()

# Create policy
policy = await abac.create_policy({
    "organization_id": org_id,
    "name": "Workspace Restriction",
    "resource_type": "agent",
    "action": "*",
    "effect": "allow",
    "conditions": {
        "all": [
            {"field": "resource.workspace_id", "op": "eq", "value": "ws-123"}
        ]
    },
    "priority": 100,
    "created_by": user_id,
})

# Assign to team
await abac.assign_policy(
    policy_id=policy["id"],
    principal_type="team",
    principal_id="team-456"
)

# Evaluate access
allowed = await abac.evaluate(
    user_id="user-789",
    resource_type="agent",
    action="update",
    resource={"workspace_id": "ws-123", "id": "agent-abc"},
    context={"ip": "192.168.1.1"}
)
```

## Best Practices

1. **Start with RBAC** - Use ABAC for fine-tuning
2. **Explicit deny** - Deny policies for sensitive resources
3. **Priority ordering** - Higher priority for specific policies
4. **Test policies** - Use evaluate endpoint before deployment
5. **Audit assignments** - Review policy assignments regularly
