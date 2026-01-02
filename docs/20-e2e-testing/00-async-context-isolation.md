# Async Context Isolation in E2E Tests

When using httpx AsyncClient with ASGI transport for E2E tests, each request executes in a separate async context. This creates isolation between database connection pools, meaning data created in one request may not be immediately visible in subsequent requests.

## The Pattern

Instead of:
```python
# Anti-pattern: GET after POST may not see the created data
create_response = await client.post("/api/v1/items", json=data)
item_id = create_response.json()["id"]

# This GET may fail to find the item due to async context isolation
get_response = await client.get(f"/api/v1/items/{item_id}")
assert get_response.status_code == 200
```

Use this:
```python
# Pattern: Use the response data directly
create_response = await client.post("/api/v1/items", json=data)
assert create_response.status_code == 200

item = create_response.json()
assert "id" in item
assert item["name"] == "expected_name"
# Verify all expected fields from the create response
```

## When Subsequent GET is Required

If you must verify data persistence, use one of these approaches:

### Option 1: Verify from update response
```python
create_response = await client.post("/api/v1/items", json=data)
item_id = create_response.json()["id"]

# Update returns the current state
update_response = await client.put(
    f"/api/v1/items/{item_id}",
    json={"name": "updated"}
)
assert update_response.json()["name"] == "updated"
```

### Option 2: Use list endpoint (may have same isolation)
```python
create_response = await client.post("/api/v1/items", json=data)
item_id = create_response.json()["id"]

# List endpoint - verify the API structure works
list_response = await client.get("/api/v1/items")
assert list_response.status_code == 200
assert isinstance(list_response.json(), list)
```

## Testing Delete Operations

For delete verification, test the API behavior rather than querying for the deleted record:
```python
# Create and delete
create_response = await client.post("/api/v1/items", json=data)
item_id = create_response.json()["id"]

delete_response = await client.delete(f"/api/v1/items/{item_id}")
assert delete_response.status_code == 200

# Don't try to GET the deleted item - use the delete response
```

## DataFlow Direct Access Pattern

For tests that need to verify database state, use DataFlow directly instead of API calls:
```python
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

async def create_test_item():
    runtime = AsyncLocalRuntime()
    workflow = WorkflowBuilder()

    workflow.add_node(
        "ItemCreateNode",
        "create",
        {
            "id": str(uuid.uuid4()),
            "name": "Test Item",
            # All required fields...
        },
    )

    results, _ = await runtime.execute_workflow_async(
        workflow.build(), inputs={}
    )
    return results.get("create")
```

This bypasses the ASGI transport isolation and works with the same database connection.
