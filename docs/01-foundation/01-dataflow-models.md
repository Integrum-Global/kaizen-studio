# DataFlow Models

## Overview

Kaizen Studio uses DataFlow for database operations. DataFlow automatically generates 9 CRUD nodes per model.

## Model Definition Pattern

```python
from dataflow import DataFlow
from typing import Optional

db = DataFlow("postgresql://...")

@db.model
class MyModel:
    id: str                    # Primary key (required)
    required_field: str        # Required field
    optional_field: Optional[str]  # Optional field
    created_at: str            # Timestamp as ISO string
    updated_at: str            # Timestamp as ISO string
```

## Core Models

### Organization

Top-level tenant in the multi-tenancy hierarchy.

```python
@db.model
class Organization:
    id: str
    name: str
    slug: str                  # URL-safe identifier
    status: str                # active, suspended, deleted
    plan_tier: str             # free, pro, enterprise
    created_by: str            # user_id of creator
    created_at: str
    updated_at: str
```

**Auto-Generated Nodes**: CreateOrganizationNode, ReadOrganizationNode, UpdateOrganizationNode, DeleteOrganizationNode, ListOrganizationNode, BulkCreateOrganizationNode, BulkUpdateOrganizationNode, BulkDeleteOrganizationNode, CountOrganizationNode

### User

Platform user belonging to an organization.

```python
@db.model
class User:
    id: str
    organization_id: str
    email: str
    name: str
    password_hash: str
    status: str                # active, invited, suspended
    role: str                  # org_owner, org_admin, developer, viewer
    last_login_at: Optional[str]
    mfa_enabled: bool
    created_at: str
    updated_at: str
```

### Workspace

Environment within an organization (dev/staging/prod).

```python
@db.model
class Workspace:
    id: str
    organization_id: str
    name: str
    environment_type: str      # development, staging, production
    description: str
    created_at: str
    updated_at: str
```

## Using DataFlow Operations

### Create

```python
from kailash.workflow.builder import WorkflowBuilder
from kailash.runtime import AsyncLocalRuntime

workflow = WorkflowBuilder()
workflow.add_node("CreateUserNode", "create", {
    "data": {
        "id": "user-123",
        "organization_id": "org-456",
        "email": "user@example.com",
        "name": "John Doe",
        "password_hash": hashed_password,
        "status": "active",
        "role": "developer",
        "mfa_enabled": False,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
})

runtime = AsyncLocalRuntime()
results, _ = await runtime.execute_workflow_async(workflow.build())
user = results["create"]
```

### Read

```python
workflow = WorkflowBuilder()
workflow.add_node("ReadUserNode", "read", {
    "id": "user-123"
})

results, _ = await runtime.execute_workflow_async(workflow.build())
user = results["read"]
```

### List with Filters

```python
workflow = WorkflowBuilder()
workflow.add_node("ListUserNode", "list", {
    "filter": {
        "organization_id": "org-456",
        "status": "active"
    },
    "order_by": ["-created_at"],
    "limit": 10
})

results, _ = await runtime.execute_workflow_async(workflow.build())
users = results["list"]
```

### Update

```python
workflow = WorkflowBuilder()
workflow.add_node("UpdateUserNode", "update", {
    "id": "user-123",
    "data": {
        "last_login_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
})

results, _ = await runtime.execute_workflow_async(workflow.build())
```

### Delete

```python
workflow = WorkflowBuilder()
workflow.add_node("DeleteUserNode", "delete", {
    "id": "user-123"
})

results, _ = await runtime.execute_workflow_async(workflow.build())
```

## Multi-Tenancy

All queries should filter by `organization_id` to ensure tenant isolation:

```python
workflow.add_node("ListAgentNode", "list", {
    "filter": {
        "organization_id": current_user.organization_id,  # Always include
        "status": "active"
    }
})
```

## Best Practices

### ID Generation

Use UUID or ULID for IDs:

```python
import uuid

def generate_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex}"
```

### Timestamps

Always use ISO 8601 format:

```python
from datetime import datetime

created_at = datetime.utcnow().isoformat()
```

### Validation

Validate data before creating:

```python
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    organization_id: str
```

### Error Handling

```python
try:
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["read"]
except Exception as e:
    if "not found" in str(e).lower():
        raise HTTPException(404, "User not found")
    raise
```
