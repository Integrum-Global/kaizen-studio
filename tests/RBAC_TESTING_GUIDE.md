# RBAC Testing Guide

Complete guide for running, maintaining, and extending RBAC tests.

## Quick Start

### 1. Environment Setup

```bash
# Navigate to project
cd /Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio

# Ensure .env is configured
cat .env
# Verify: DATABASE_URL, REDIS_URL, ENVIRONMENT=testing

# Start test infrastructure (for Tier 2/3)
./tests/utils/test-env up
./tests/utils/test-env status
```

### 2. Run Tests

```bash
# All RBAC tests
pytest tests/unit/test_rbac_service.py \
        tests/integration/test_rbac_api.py \
        tests/e2e/test_rbac_flow.py \
        -v

# Or by tier
pytest tests/unit/test_rbac_service.py -v       # ~2 seconds
pytest tests/integration/test_rbac_api.py -v    # ~5 seconds
pytest tests/e2e/test_rbac_flow.py -v           # ~10 seconds
```

### 3. Check Results

```bash
# Expected output
============= 59 passed in 17.50s =============

# If failures occur, check:
1. Database is running: ./tests/utils/test-env status
2. Environment variables: echo $DATABASE_URL
3. Port conflicts: lsof -i :5432 (PostgreSQL)
```

---

## Test Organization

### File Structure

```
tests/
├── unit/
│   └── test_rbac_service.py              # Tier 1: 22 tests
├── integration/
│   └── test_rbac_api.py                  # Tier 2: 23 tests
├── e2e/
│   └── test_rbac_flow.py                 # Tier 3: 14 tests
├── conftest.py                           # Shared fixtures
├── RBAC_TEST_SUMMARY.md                  # Test overview
└── RBAC_TESTING_GUIDE.md                 # This file
```

### Test Naming Conventions

```python
# Test files
test_*.py

# Test classes
Test*

# Test methods
test_*_should_*      # What should happen
test_*_fails_*       # What should fail
test_*_returns_*     # What is returned

# Examples
test_check_permission_exact_match
test_permission_invalid_role_fails
test_list_permissions_returns_all
```

---

## Running Tests by Scenario

### Scenario 1: Development Loop (Fast Feedback)

```bash
# Run only Unit Tests (~2s)
pytest tests/unit/test_rbac_service.py -v

# Focus on a specific test class
pytest tests/unit/test_rbac_service.py::TestPermissionChecking -v

# Run a single test
pytest tests/unit/test_rbac_service.py::TestPermissionChecking::test_check_permission_exact_match -v
```

### Scenario 2: Full Test Validation

```bash
# Ensure test infrastructure is ready
./tests/utils/test-env up
./tests/utils/test-env status

# Run all three tiers
pytest tests/unit/test_rbac_service.py \
        tests/integration/test_rbac_api.py \
        tests/e2e/test_rbac_flow.py \
        -v --tb=short

# Expected: 59 passed in ~17s
```

### Scenario 3: Integration-Only Testing

```bash
# When you only modify API/service integration
pytest tests/integration/test_rbac_api.py -v --tb=short

# Or specific test class
pytest tests/integration/test_rbac_api.py::TestPermissionEndpoints -v
```

### Scenario 4: E2E Workflow Testing

```bash
# Test complete workflows
pytest tests/e2e/test_rbac_flow.py::TestCompleteRBACFlow -v

# Test real-world scenarios
pytest tests/e2e/test_rbac_flow.py::TestRealWorldScenarios -v
```

### Scenario 5: Debugging Failed Test

```bash
# Show full traceback
pytest tests/integration/test_rbac_api.py::TestPermissionEndpoints::test_list_permissions_endpoint \
        -v --tb=long

# Show print statements
pytest tests/unit/test_rbac_service.py::TestPermissionChecking::test_check_permission_exact_match \
        -v -s

# Stop on first failure
pytest tests/e2e/test_rbac_flow.py -v -x

# Run last failed tests
pytest tests/unit/test_rbac_service.py --lf -v
```

---

## Test Coverage Analysis

### Current Coverage

```bash
# Generate coverage report
pytest tests/unit/test_rbac_service.py \
        tests/integration/test_rbac_api.py \
        tests/e2e/test_rbac_flow.py \
        --cov=studio.services.rbac_service \
        --cov=studio.api.rbac \
        --cov=studio.middleware.rbac \
        --cov-report=html

# View report
open htmlcov/index.html
```

### Target Coverage Areas

| Module | Lines | Branches | Covered |
|--------|-------|----------|---------|
| `rbac_service.py` | 393 | 45 | Target: 95%+ |
| `rbac.py` | 177 | 15 | Target: 90%+ |
| `rbac.py` (middleware) | 254 | 20 | Target: 95%+ |
| `permissions.py` | 117 | 0 | Target: 100% |

### Coverage Gaps to Address

```python
# If coverage is below target, check:

# 1. Error paths in check_permission
def check_permission(self, user_id: str, permission: str) -> bool:
    # Covered: success, wildcard match, no match
    # Check: nonexistent user, user without role

# 2. DataFlow node failure cases
# All node failures should be tested

# 3. Permission matrix edge cases
# Empty roles, duplicate permissions, etc.
```

---

## Maintaining Tests

### Adding New Test

```python
# Step 1: Identify tier
# - Tier 1: Unit logic tests (no DB)
# - Tier 2: API integration (real DB)
# - Tier 3: Complete workflows (real stack)

# Step 2: Create test class
@pytest.mark.integration
@pytest.mark.timeout(5)
class TestNewFeature:
    """Test description."""

    @pytest.mark.asyncio
    async def test_new_scenario_works(self, test_client: AsyncClient):
        """What the test does."""
        # Setup
        headers = await get_auth_headers(test_client, "users:read")

        # Execute
        response = await test_client.get("/endpoint", headers=headers)

        # Assert
        assert response.status_code == 200

# Step 3: Add to appropriate file
# tests/unit/test_rbac_service.py    (Tier 1)
# tests/integration/test_rbac_api.py (Tier 2)
# tests/e2e/test_rbac_flow.py        (Tier 3)

# Step 4: Run new test
pytest tests/integration/test_rbac_api.py::TestNewFeature::test_new_scenario_works -v

# Step 5: Update this guide if needed
```

### Updating Existing Test

```python
# Before changing a test:
# 1. Understand why it exists
# 2. Check if requirement changed
# 3. Update both test AND docstring
# 4. Run full test suite to confirm

# Wrong approach:
# - Changing test to match code
# - Removing test because it's "too strict"

# Right approach:
# - Understand test intention
# - Fix code to match test
# - Or update requirement documentation
```

### Debugging Test Failures

```bash
# 1. Check specific error
pytest tests/integration/test_rbac_api.py::TestPermissionEndpoints -v -s

# 2. Verify infrastructure
./tests/utils/test-env status
docker ps | grep postgres
redis-cli ping

# 3. Check environment variables
env | grep DATABASE_URL
env | grep REDIS_URL

# 4. Run with debug output
pytest tests/unit/test_rbac_service.py -v --tb=long --capture=no

# 5. Check recent commits
git log --oneline -n 10

# 6. Isolate the issue
# Run just the failing test class
pytest tests/integration/test_rbac_api.py::TestPermissionEndpoints -v

# Then individual test
pytest tests/integration/test_rbac_api.py::TestPermissionEndpoints::test_list_permissions_endpoint -v
```

---

## Test Dependencies and Fixtures

### Tier 1 (Unit Tests)

**No external dependencies - all mocked**

```python
# Mocks used
unittest.mock.patch('studio.services.rbac_service.AsyncLocalRuntime')
unittest.mock.AsyncMock()  # Mocks async functions
unittest.mock.MagicMock()  # Mocks sync functions
```

### Tier 2 (Integration Tests)

**Requires real database**

```python
Fixtures from conftest.py:
- test_client: AsyncClient with real app
- test_db: DataFlow with PostgreSQL
- clean_redis: Flushed Redis database

Environment:
- DATABASE_URL: postgresql://test:test@localhost:5432/test_db
- REDIS_URL: redis://localhost:6379
```

### Tier 3 (E2E Tests)

**Requires complete real infrastructure**

```python
Same as Tier 2 plus:
- Real FastAPI app startup
- Real DataFlow model generation
- Real permission seeding

All operations use actual database:
- UserCreateNode, UserReadNode
- OrganizationCreateNode
- PermissionCreateNode, PermissionListNode
- RolePermissionCreateNode, RolePermissionListNode
```

---

## Performance Benchmarks

### Expected Test Execution Times

```
Tier 1 (Unit Tests)
- Test count: 22
- Average per test: 0.09s
- Total: ~2 seconds
- Parallelizable: Yes

Tier 2 (Integration Tests)
- Test count: 23
- Average per test: 0.2s
- Total: ~5 seconds
- Parallelizable: No (shared test_client)

Tier 3 (E2E Tests)
- Test count: 14
- Average per test: 0.7s
- Total: ~10 seconds
- Parallelizable: No (shared infrastructure)

Total Suite: ~17 seconds
```

### Optimization Tips

```bash
# Run only modified tier
# Don't need to run all tiers during development
pytest tests/unit/test_rbac_service.py -v  # 2s

# Use markers to skip slow tests
pytest tests/unit/test_rbac_service.py -v -m "not slow"

# Parallelize Tier 1 only
pytest tests/unit/test_rbac_service.py -v -n auto

# Focus on failure
pytest tests/ --lf -v  # Last failed
pytest tests/ -x -v    # Stop on first failure
```

---

## CI/CD Integration

### GitHub Actions Configuration

```yaml
name: RBAC Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test

      redis:
        image: redis:7

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov

      - name: Run RBAC tests
        run: |
          pytest tests/unit/test_rbac_service.py \
                  tests/integration/test_rbac_api.py \
                  tests/e2e/test_rbac_flow.py \
                  -v --cov=studio --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "Permission denied: PostgreSQL"

```bash
# Solution: Check database is running
./tests/utils/test-env status

# Or check credentials in .env
grep DATABASE_URL .env

# Or start database
./tests/utils/test-env up
```

#### Issue 2: "Test timeout"

```bash
# Cause: Test infrastructure slow
# Solution:
./tests/utils/test-env status
docker logs postgres  # Check for errors

# Or increase timeout (not recommended)
@pytest.mark.timeout(10)  # Instead of 5
```

#### Issue 3: "Async event loop already running"

```bash
# Cause: Event loop conflict
# Solution: Check pytest-asyncio configuration
# In conftest.py:
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
```

#### Issue 4: "DataFlow node not found"

```bash
# Cause: Model not registered
# Solution: Import models in conftest:
from studio.models.permission import Permission
from studio.models.role_permission import RolePermission

# Or check permissions.py configuration
cat src/studio/config/permissions.py
```

#### Issue 5: "Auth token invalid"

```bash
# Cause: Test user registration failed
# Solution: Check auth service
pytest tests/integration/test_auth_api.py -v

# Or check Redis connection
redis-cli ping
# Should return: PONG
```

---

## Best Practices

### Writing Good Tests

```python
# ✓ GOOD: Clear intent
@pytest.mark.asyncio
async def test_wildcard_permission_matches_all_actions(self):
    """Wildcard should match all actions for a resource."""
    service = RBACService()
    with patch.object(service, 'get_user_permissions', return_value=["agents:*"]):
        assert await service.check_permission("user-1", "agents:create")
        assert await service.check_permission("user-1", "agents:delete")

# ✗ BAD: Unclear intent
@pytest.mark.asyncio
async def test_wildcard(self):
    """Test wildcard."""
    result = service.check_permission("user-1", "agents:create")
    assert result
```

### Test Independence

```python
# ✓ GOOD: Each test is independent
@pytest.mark.asyncio
async def test_grant_permission_to_role(self, test_client):
    # Creates fresh org and user
    org = await create_organization(test_client)
    user = await create_user_with_role(test_client, org["id"], "developer")
    # No dependency on other tests

# ✗ BAD: Tests depend on each other
@pytest.mark.asyncio
async def test_grant_permission_to_role(self, test_client):
    # Assumes permission from previous test still exists
    # Assumes user from previous test is available
```

### Assertion Clarity

```python
# ✓ GOOD: Clear what's expected
assert response.status_code == 200
assert data["role"] == "developer"
assert len(data["permissions"]) > 0

# ✗ BAD: Unclear assertions
assert response
assert data
assert len(data["permissions"])
```

---

## Extending Tests

### Adding Permission Type

When adding new permission (e.g., "workflows:*"):

```python
# 1. Update permissions.py
PERMISSION_MATRIX = {
    "org_owner": [
        # ... existing
        "workflows:*",  # NEW
    ],
}

PERMISSION_DESCRIPTIONS = {
    # ... existing
    "workflows:*": "Full workflow management",  # NEW
}

# 2. Add unit test
def test_workflow_permission_in_owner_role(self):
    """New permission should be in owner matrix."""
    assert "workflows:*" in PERMISSION_MATRIX["org_owner"]

# 3. Add integration test
async def test_workflow_permission_endpoint(self, test_client):
    """Should include workflow in permissions list."""
    headers = await get_auth_headers(test_client, "users:read")
    perms = await get_all_permissions(test_client, headers)
    assert any("workflow" in p["name"] for p in perms)

# 4. Add E2E test
async def test_workflow_access_control(self, test_client):
    """Should enforce workflow permissions."""
    # Create different roles and verify access
    dev = await create_user_with_role(org_id, "developer")
    # Developer should/shouldn't have workflow access
```

### Adding New RBAC Feature

Example: Permission Groups

```python
# tests/unit/test_rbac_groups.py
class TestPermissionGroups:
    def test_permission_group_includes_all_members(self):
        """Group should include all member permissions."""
        group = PermissionGroup("admin", permissions=[...])
        assert all(p in group.permissions for p in expected_perms)

# tests/integration/test_rbac_groups_api.py
class TestPermissionGroupsEndpoint:
    async def test_list_permission_groups(self, test_client):
        """Should list all permission groups."""
        response = await test_client.get("/api/v1/rbac/groups")
        assert response.status_code == 200

# tests/e2e/test_rbac_groups_flow.py
class TestPermissionGroupWorkflow:
    async def test_assign_group_to_role(self, test_client):
        """Should assign group to role."""
        # Complete workflow test
```

---

## References

- Test Framework: [pytest](https://docs.pytest.org/)
- Async Testing: [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- HTTP Testing: [httpx](https://www.python-httpx.org/)
- DataFlow: [DataFlow Documentation](/sdk-users/apps/dataflow/)
- RBAC Design: `studio/config/permissions.py`
- RBAC Service: `studio/services/rbac_service.py`
- RBAC API: `studio/api/rbac.py`

---

## Questions?

For issues or questions:
1. Check this guide's troubleshooting section
2. Review test implementation in respective file
3. Check RBAC_TEST_SUMMARY.md for overview
4. Check individual test docstrings for intent
