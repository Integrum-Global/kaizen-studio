# DataFlow Integration in E2E Tests

Patterns for using DataFlow nodes in E2E tests.

## Service Layer Architecture

Services use WorkflowBuilder with DataFlow nodes for database operations:

```python
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

class APIKeyService:
    def __init__(self, runtime=None):
        self.runtime = runtime or AsyncLocalRuntime()

    async def create(self, org_id, name, scopes, rate_limit, user_id):
        workflow = WorkflowBuilder()
        workflow.add_node(
            "APIKeyCreateNode",
            "create_key",
            {
                "id": str(uuid.uuid4()),
                "organization_id": org_id,
                "name": name,
                # ... other fields
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        return results.get("create_key")
```

## Auto-Managed Fields

DataFlow automatically manages these fields:

- `created_at` - Set on record creation
- `updated_at` - Updated on every modification

Do not include these fields in create or update operations:

```python
# Correct: Let DataFlow manage timestamps
workflow.add_node(
    "UserCreateNode",
    "create_user",
    {
        "id": user_id,
        "name": name,
        "email": email,
        "status": "active",
    },
)
```

## List Node Parameters

DataFlow ListNodes accept these parameters:

```python
workflow.add_node(
    "AuditLogListNode",
    "list",
    {
        "filter": {"organization_id": org_id},
        "limit": 100,
        "offset": 0,
    },
)

results, _ = await runtime.execute_workflow_async(
    workflow.build(), inputs={}
)
records = results.get("list", {}).get("records", [])
```

## Filter Syntax

Simple equality filters:

```python
"filter": {
    "organization_id": org_id,
    "status": "active",
}
```

## Update Node Parameters

Updates require filter and fields:

```python
workflow.add_node(
    "APIKeyUpdateNode",
    "update_key",
    {
        "filter": {"id": key_id},
        "fields": {
            "status": "revoked",
        },
    },
)
```

## Read Node Parameters

Read by ID:

```python
workflow.add_node(
    "APIKeyReadNode",
    "read_key",
    {
        "id": key_id,
    },
)
```

Note: ReadNode throws an exception if record not found. Handle in API:

```python
try:
    key = await service.get(key_id)
except Exception:
    raise HTTPException(status_code=404, detail="Not found")
```

## Delete Node Parameters

Delete by ID:

```python
workflow.add_node(
    "APIKeyDeleteNode",
    "delete_key",
    {
        "id": key_id,
    },
)
```

## Count Node Parameters

Count with filters:

```python
workflow.add_node(
    "AuditLogCountNode",
    "count",
    {
        "filter": {"organization_id": org_id},
    },
)

results, _ = await runtime.execute_workflow_async(
    workflow.build(), inputs={}
)
count = results.get("count", {}).get("count", 0)
```

## String Field Requirements

DataFlow string fields require actual strings, not None:

```python
# Problem
"expires_at": None  # Error

# Solution
"expires_at": expires_at or ""
```

## JSON Fields

Serialize dicts as JSON strings:

```python
import json

"scopes": json.dumps(["read", "write"])
"details": json.dumps({"key": "value"}) if details else None
```

## Testing with DataFlow

Create test data directly via DataFlow for fixture setup:

```python
async def create_test_organization() -> dict:
    runtime = AsyncLocalRuntime()
    workflow = WorkflowBuilder()
    org_id = str(uuid.uuid4())

    workflow.add_node(
        "OrganizationCreateNode",
        "create_org",
        {
            "id": org_id,
            "name": f"Test Org {org_id[:8]}",
            "slug": f"test-org-{org_id[:8]}",
            "status": "active",
        },
    )

    results, _ = await runtime.execute_workflow_async(
        workflow.build(), inputs={}
    )
    return results.get("create_org", {"id": org_id})
```
