# E2E Test Structure Patterns

This guide covers patterns for writing robust E2E tests that work with async context isolation and DataFlow.

## Test Class Structure

```python
import pytest
from httpx import AsyncClient


@pytest.mark.e2e
@pytest.mark.timeout(60)  # Set appropriate timeout for external calls
class TestFeatureWorkflow:
    """Test complete feature lifecycle."""

    async def test_create_and_verify(self, authenticated_client):
        """Test creation returns expected data.

        Uses response data verification (async context isolation workaround).
        """
        client, user = authenticated_client

        # Create
        data = {"name": "Test Item", "description": "Test description"}
        response = await client.post("/api/v1/items", json=data)

        # Verify from response
        assert response.status_code == 200
        item = response.json()
        assert item["name"] == "Test Item"
        assert "id" in item
```

## Helper Functions Pattern

Create test data using DataFlow directly to avoid async context isolation:
```python
from datetime import datetime, timezone
import uuid

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


async def create_test_organization() -> dict:
    """Create test organization via DataFlow."""
    runtime = AsyncLocalRuntime()
    workflow = WorkflowBuilder()
    org_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    workflow.add_node(
        "OrganizationCreateNode",
        "create_org",
        {
            "id": org_id,
            "name": f"Test Org {org_id[:8]}",
            "slug": f"test-org-{org_id[:8]}",
            "status": "active",
            "plan_tier": "free",
            "created_by": "system",
            "created_at": now,
            "updated_at": now,
        },
    )

    results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
    return results.get("create_org", {"id": org_id})


async def create_test_user(org_id: str, role: str = "developer") -> dict:
    """Create test user with specific role."""
    runtime = AsyncLocalRuntime()
    workflow = WorkflowBuilder()
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    workflow.add_node(
        "UserCreateNode",
        "create_user",
        {
            "id": user_id,
            "email": f"user-{user_id[:8]}@example.com",
            "name": f"Test User {user_id[:8]}",
            "organization_id": org_id,
            "role": role,
            "password_hash": "hashed_password",
            "status": "active",
            "mfa_enabled": False,
            "created_at": now,
            "updated_at": now,
        },
    )

    results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
    return results.get("create_user", {"id": user_id, "role": role})
```

## Permission Testing Pattern

Test permissions against the source of truth (PERMISSION_MATRIX):
```python
from studio.config.permissions import PERMISSION_MATRIX


class TestRBACPermissions:
    """Test RBAC permission enforcement."""

    async def test_role_permission_enforcement(self, test_client):
        """Verify PERMISSION_MATRIX defines correct permissions."""
        owner_perms = PERMISSION_MATRIX.get("org_owner", [])
        admin_perms = PERMISSION_MATRIX.get("org_admin", [])
        dev_perms = PERMISSION_MATRIX.get("developer", [])
        viewer_perms = PERMISSION_MATRIX.get("viewer", [])

        # Owner has wildcard
        assert any("*" in p for p in owner_perms)

        # Developer has specific permissions
        assert "agents:create" in dev_perms

        # Viewer is read-only
        for perm in viewer_perms:
            assert not perm.endswith(":create")
            assert not perm.endswith(":delete")
```

## Update Testing Pattern

Test updates using the update response:
```python
async def test_update_item(self, authenticated_client):
    """Test updating returns updated data."""
    client, user = authenticated_client

    # Create
    create_response = await client.post(
        "/api/v1/items", json={"name": "Original"}
    )
    item_id = create_response.json()["id"]

    # Update and verify from response
    update_response = await client.put(
        f"/api/v1/items/{item_id}",
        json={"name": "Updated"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Updated"
```

## Delete Testing Pattern

Test deletion using the delete response, not subsequent GET:
```python
async def test_delete_item(self, authenticated_client):
    """Test deletion returns success."""
    client, user = authenticated_client

    # Create
    create_response = await client.post(
        "/api/v1/items", json={"name": "To Delete"}
    )
    item_id = create_response.json()["id"]

    # Delete and verify response
    delete_response = await client.delete(f"/api/v1/items/{item_id}")
    assert delete_response.status_code == 200

    # Don't try to GET - it may fail due to async context isolation
```

## Multiple Items Testing Pattern

When testing with multiple items, collect data from responses:
```python
async def test_multiple_items_independent(self, authenticated_client):
    """Test managing multiple items independently."""
    client, user = authenticated_client

    created_items = []

    # Create multiple items
    for i in range(3):
        response = await client.post(
            "/api/v1/items",
            json={"name": f"Item {i+1}"}
        )
        assert response.status_code == 200
        created_items.append(response.json())

    # Verify from creation responses
    for i, item in enumerate(created_items):
        assert item["name"] == f"Item {i+1}"

    # Update first item
    update_response = await client.put(
        f"/api/v1/items/{created_items[0]['id']}",
        json={"status": "inactive"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "inactive"
```

## Timeout Configuration

Set appropriate timeouts based on test complexity:
```python
@pytest.mark.timeout(10)   # Fast API tests
class TestQuickOperations:
    pass


@pytest.mark.timeout(60)   # Tests with external HTTP calls
class TestExternalIntegration:
    pass


@pytest.mark.timeout(120)  # Tests with retries or multiple operations
class TestComplexWorkflow:
    pass
```
