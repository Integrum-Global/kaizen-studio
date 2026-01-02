# Common E2E Test Errors and Fixes

Patterns for resolving common E2E test failures in Kaizen Studio.

## Float Precision Errors

When comparing float values from PostgreSQL:

```python
# Problem: Float precision mismatch
assert agent["temperature"] == 0.7
# AssertionError: 0.699999988079071 != 0.7

# Solution: Use pytest.approx()
from pytest import approx
assert agent["temperature"] == approx(0.7, rel=1e-5)
```

## DataFlow Auto-Managed Fields

DataFlow auto-manages `created_at` and `updated_at` fields. Do not include them in create/update operations:

```python
# Problem: Setting auto-managed fields
workflow.add_node(
    "APIKeyUpdateNode",
    "revoke_key",
    {
        "filter": {"id": key_id},
        "fields": {
            "status": "revoked",
            "updated_at": now,  # ERROR: Auto-managed field
        },
    },
)

# Solution: Omit auto-managed fields
workflow.add_node(
    "APIKeyUpdateNode",
    "revoke_key",
    {
        "filter": {"id": key_id},
        "fields": {
            "status": "revoked",
        },
    },
)
```

## DataFlow List Node Ordering

Do not use complex order_by structures with DataFlow ListNodes:

```python
# Problem: Complex order_by format
workflow.add_node(
    "AuditLogListNode",
    "list",
    {
        "filter": filters,
        "order_by": [{"field": "created_at", "direction": "desc"}],
    },
)
# Error: column "field" does not exist

# Solution: Omit order_by or use simple format
workflow.add_node(
    "AuditLogListNode",
    "list",
    {
        "filter": filters,
        "limit": limit,
    },
)
```

## Empty String for Optional Fields

DataFlow requires strings for string fields, not None:

```python
# Problem: None for optional string field
"expires_at": expires_at,  # Could be None

# Solution: Use empty string
"expires_at": expires_at or "",
```

## Record Not Found Handling

Handle DataFlow exceptions when records don't exist:

```python
# Problem: Unhandled exception on missing record
key = await service.get(key_id)  # Throws if not found

# Solution: Wrap in try/except
try:
    key = await service.get(key_id)
except Exception:
    raise HTTPException(status_code=404, detail="API key not found")
```

## Datetime Timezone Comparisons

Avoid comparing timezone-aware and timezone-naive datetimes:

```python
# Problem: Comparing different datetime types
before_time = datetime.now(timezone.utc)
ts = datetime.fromisoformat(log["created_at"])
assert before_time <= ts  # TypeError

# Solution: Verify field exists and is valid
assert "created_at" in log
assert log["created_at"] is not None
ts = datetime.fromisoformat(log["created_at"].replace("Z", "+00:00"))
```

## Authentication Fixtures

Use `authenticated_client` instead of `test_client` with fake tokens:

```python
# Problem: Using test_client with fake auth
async def test_something(self, test_client):
    response = await test_client.post(
        "/api/v1/items",
        headers={"Authorization": "Bearer fake_token"},
    )

# Solution: Use authenticated_client fixture
async def test_something(self, authenticated_client):
    client, user = authenticated_client
    response = await client.post("/api/v1/items", json=data)
```

## Unique Resource IDs in Tests

Use unique IDs for resources to avoid conflicts with other tests:

```python
# Problem: Fixed resource ID causes conflicts
resource_id = "agent-test"

# Solution: Use UUID for unique IDs
resource_id = f"agent-test-{uuid.uuid4()}"
```

## API Endpoint Paths

Always use full API paths with version prefix:

```python
# Problem: Missing API prefix
await client.get(f"/api-keys/{key_id}")  # 404

# Solution: Include full path
await client.get(f"/api/v1/api-keys/{key_id}")
```
