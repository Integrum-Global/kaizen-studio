# User Roles

## Overview

Kaizen Studio uses role-based access control (RBAC) with four organization-level roles.

## Role Hierarchy

```
org_owner
    └── org_admin
            └── developer
                    └── viewer
```

## Role Definitions

### org_owner

Full control over the organization.

**Permissions**:
- All org_admin permissions
- Delete organization
- Transfer ownership
- Manage billing
- Upgrade/downgrade plan

### org_admin

Administrative control without billing.

**Permissions**:
- All developer permissions
- Manage users (invite, update roles, remove)
- Create/delete workspaces
- Manage teams
- View audit logs
- Configure SSO

### developer

Build and deploy agents.

**Permissions**:
- All viewer permissions
- Create/edit/delete agents
- Deploy agents to gateways
- Create/edit workflows
- Manage API keys
- View execution logs

### viewer

Read-only access.

**Permissions**:
- View agents and workflows
- View deployments
- View metrics and dashboards
- View team membership

## Role Assignment

### During Registration

First user becomes `org_owner`:

```python
@app.post("/api/v1/auth/register")
async def register(data: RegisterRequest):
    # First user in org becomes owner
    user = await user_service.create(
        email=data.email,
        password=data.password,
        name=data.name,
        organization_id=org.id,
        role="org_owner"
    )
```

### Via Invitation

Role specified when inviting:

```python
invitation = await invitation_service.create(
    organization_id=org.id,
    email="dev@example.com",
    role="developer",
    invited_by=current_user.id
)
```

### Role Update

Only org_owner and org_admin can update roles:

```python
@app.put("/api/v1/users/{id}")
async def update_user(
    id: str,
    data: UserUpdate,
    current_user: User = Depends(require_role(["org_owner", "org_admin"]))
):
    # Cannot elevate above own role
    if data.role and not can_assign_role(current_user.role, data.role):
        raise HTTPException(403, "Cannot assign this role")

    return await user_service.update(id, data.dict())
```

## Permission Checks

### Dependency Injection

```python
from fastapi import Depends, HTTPException

def require_role(allowed_roles: list[str]):
    async def checker(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(403, "Insufficient permissions")
        return user
    return checker

# Usage
@app.post("/api/v1/teams")
async def create_team(
    data: TeamCreate,
    user: User = Depends(require_role(["org_owner", "org_admin"]))
):
    ...
```

### Role Comparison

```python
ROLE_LEVELS = {
    "org_owner": 4,
    "org_admin": 3,
    "developer": 2,
    "viewer": 1
}

def can_assign_role(assigner_role: str, target_role: str) -> bool:
    return ROLE_LEVELS[assigner_role] > ROLE_LEVELS[target_role]

def has_permission(user_role: str, required_role: str) -> bool:
    return ROLE_LEVELS[user_role] >= ROLE_LEVELS[required_role]
```

## Team Roles

Teams have separate role hierarchy:

| Role | Permissions |
|------|-------------|
| `team_lead` | Manage team members, assign tasks |
| `member` | View team resources, collaborate |

Team roles are additive to organization roles.

## Best Practices

1. **Principle of least privilege** - assign minimum required role
2. **Regular audits** - review role assignments quarterly
3. **Role separation** - billing vs technical administration
4. **Emergency access** - maintain break-glass procedures
