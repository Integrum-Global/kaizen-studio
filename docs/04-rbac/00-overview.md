# Role-Based Access Control

## Overview

Kaizen Studio implements RBAC with resource-action permissions and wildcard support.

## Permission Format

```
{resource}:{action}
```

Examples:
- `agents:create` - Create agents
- `deployments:*` - All deployment actions
- `users:read` - Read user data

## Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| org_owner | 4 | Full control including billing |
| org_admin | 3 | Administrative without billing |
| developer | 2 | Build and deploy |
| viewer | 1 | Read-only access |

## Permission Matrix

### org_owner
```python
[
    "organizations:*",
    "users:*",
    "teams:*",
    "workspaces:*",
    "agents:*",
    "deployments:*",
    "billing:*",
    "audit:read",
]
```

### org_admin
```python
[
    "users:*",
    "teams:*",
    "workspaces:*",
    "agents:*",
    "deployments:*",
    "audit:read",
]
```

### developer
```python
[
    "agents:create",
    "agents:read",
    "agents:update",
    "agents:delete",
    "deployments:create",
    "deployments:read",
    "deployments:update",
    "workspaces:read",
    "teams:read",
]
```

### viewer
```python
[
    "agents:read",
    "deployments:read",
    "workspaces:read",
    "teams:read",
]
```

## Usage

### Endpoint Protection

```python
from studio.middleware.rbac import require_permission

@router.post("/agents")
async def create_agent(
    data: AgentCreate,
    user: User = require_permission("agents:create")
):
    ...
```

### Multiple Permissions

```python
from studio.middleware.rbac import require_any_permission, require_all_permissions

# User needs at least one
@router.get("/agents/{id}")
async def get_agent(
    id: str,
    user: User = require_any_permission("agents:read", "agents:*")
):
    ...

# User needs all
@router.delete("/critical-resource")
async def delete_critical(
    user: User = require_all_permissions("critical:delete", "critical:confirm")
):
    ...
```

### Service-Level Checks

```python
from studio.services.rbac_service import RBACService

rbac = RBACService()

# Check permission
if await rbac.check_permission(user_id, "agents:deploy"):
    # Allow action
    pass
else:
    raise PermissionError("Cannot deploy agents")

# Get all permissions
permissions = await rbac.get_user_permissions(user_id)
```

## Wildcard Matching

The `*` wildcard matches any action:

```python
# agents:* matches:
# - agents:create
# - agents:read
# - agents:update
# - agents:delete
# - agents:deploy
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/rbac/permissions` | List all permissions |
| GET | `/api/v1/rbac/roles/{role}` | Get role permissions |
| POST | `/api/v1/rbac/roles/{role}` | Add permission |
| DELETE | `/api/v1/rbac/roles/{role}/{id}` | Remove permission |
| GET | `/api/v1/rbac/users/{id}` | Get user permissions |

## Seeding Permissions

Initialize default permissions:

```bash
python -m studio.scripts.seed_permissions
```

Or via API (org_owner only):

```bash
curl -X POST /api/v1/rbac/seed \
  -H "Authorization: Bearer $TOKEN"
```

## Custom Permissions

Add custom permissions to roles:

```python
# Grant via API
curl -X POST /api/v1/rbac/roles/developer \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"permission_id": "perm-custom-123"}'
```

## Best Practices

1. **Principle of least privilege** - grant minimum required
2. **Use wildcards sparingly** - prefer explicit permissions
3. **Audit permission grants** - log all changes
4. **Regular reviews** - quarterly permission audits
5. **Test access** - verify permissions in staging
