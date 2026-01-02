# Organization Model

## Overview

Organizations are the top-level tenant in Kaizen Studio's multi-tenancy hierarchy. All resources (users, workspaces, agents, deployments) belong to an organization.

## Model Definition

```python
@db.model
class Organization:
    id: str                 # UUID primary key
    name: str               # Display name
    slug: str               # URL-safe identifier (unique)
    status: str             # active, suspended, deleted
    plan_tier: str          # free, pro, enterprise
    created_by: str         # user_id of creator
    created_at: str         # ISO 8601 timestamp
    updated_at: str         # ISO 8601 timestamp
```

## Status Values

| Status | Description |
|--------|-------------|
| `active` | Normal operation |
| `suspended` | Billing issue or policy violation |
| `deleted` | Soft-deleted, retained for audit |

## Plan Tiers

| Tier | Features |
|------|----------|
| `free` | 1 workspace, 3 users, 5 agents |
| `pro` | 5 workspaces, 25 users, 50 agents |
| `enterprise` | Unlimited, SSO, audit logs |

## API Endpoints

### Create Organization

```bash
POST /api/v1/organizations
```

```json
{
  "name": "Acme Corp",
  "slug": "acme-corp",
  "plan_tier": "pro"
}
```

### Get Organization

```bash
GET /api/v1/organizations/{id}
```

### Update Organization

```bash
PUT /api/v1/organizations/{id}
```

```json
{
  "name": "Acme Corporation",
  "plan_tier": "enterprise"
}
```

### Delete Organization

```bash
DELETE /api/v1/organizations/{id}
```

Soft deletes by setting `status: "deleted"`.

### List Organizations

```bash
GET /api/v1/organizations?status=active&plan_tier=pro
```

## Service Operations

```python
from studio.services.organization_service import OrganizationService

service = OrganizationService()

# Create
org = await service.create(
    name="Acme Corp",
    slug="acme-corp",
    plan_tier="pro",
    created_by="user-123"
)

# Get
org = await service.get("org-456")

# Update
org = await service.update("org-456", {
    "name": "Acme Corporation"
})

# Delete (soft)
await service.delete("org-456")

# List
orgs = await service.list(
    filters={"status": "active"},
    limit=10,
    offset=0
)
```

## Slug Generation

Slugs must be unique and URL-safe:

```python
import re

def generate_slug(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug
```

## Multi-Tenancy Enforcement

All queries filter by `organization_id`:

```python
workflow.add_node("ListAgentNode", "list", {
    "filter": {
        "organization_id": current_user.organization_id
    }
})
```

## Best Practices

1. **Validate slug uniqueness** before creation
2. **Never hard delete** - always soft delete for audit trail
3. **Check plan limits** before creating resources
4. **Propagate status changes** to child resources when suspended
