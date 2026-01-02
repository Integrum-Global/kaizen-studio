# SSO Tests - Quick Reference Guide

Fast lookup for running and understanding SSO integration tests.

## Quick Stats

- **Total Tests**: 73 (37 Tier 1 + 21 Tier 2 + 15 Tier 3)
- **Test Classes**: 13
- **Test Files**: 3
- **Expected Runtime**: 2-3 minutes (full suite)

## Quick Commands

### Run All SSO Tests
```bash
pytest tests/unit/test_sso_service.py tests/integration/test_sso_api.py tests/e2e/test_sso_flow.py -v
```

### Run by Tier
```bash
pytest -m unit              # 37 Tier 1 tests (~5 seconds)
pytest -m integration       # 21 Tier 2 tests (~30 seconds)
pytest -m e2e               # 15 Tier 3 tests (~60 seconds)
```

### Run Specific Test Class
```bash
pytest tests/unit/test_sso_service.py::TestSSOServiceEncryption -v
pytest tests/integration/test_sso_api.py::TestSSOConnectionCRUD -v
pytest tests/e2e/test_sso_flow.py::TestCompleteSSOFlow -v
```

### Run with Coverage
```bash
pytest tests/unit/test_sso_service.py tests/integration/test_sso_api.py tests/e2e/test_sso_flow.py \
  --cov=studio --cov-report=term-missing
```

### Run Single Test
```bash
pytest tests/unit/test_sso_service.py::TestSSOServiceEncryption::test_encrypt_secret -v
```

## Test File Layout

### Tier 1: Unit Tests
**File**: `tests/unit/test_sso_service.py` (37 tests)

| Class | Tests | Focus |
|-------|-------|-------|
| `TestSSOServiceEncryption` | 7 | Secret encryption/decryption |
| `TestSSOAuthorizationURL` | 9 | OAuth URL generation |
| `TestStateValidation` | 2 | CSRF state parameters |
| `TestDomainRestrictionValidation` | 7 | Email domain restrictions |
| `TestProviderURLConfiguration` | 8 | Provider URL resolution |
| `TestSSOServiceInitialization` | 2 | Service initialization |
| `TestUserInfoNormalization` | 5 | User info from providers |

### Tier 2: Integration Tests
**File**: `tests/integration/test_sso_api.py` (21 tests)

| Class | Tests | Focus |
|-------|-------|-------|
| `TestSSOConnectionCRUD` | 15 | Connection CRUD + auth |
| `TestSSOIdentityLinking` | 6 | Identity linking |

### Tier 3: E2E Tests
**File**: `tests/e2e/test_sso_flow.py` (15 tests)

| Class | Tests | Focus |
|-------|-------|-------|
| `TestCompleteSSOFlow` | 5 | Complete auth flows |
| `TestSSOMigrationScenarios` | 3 | Migration scenarios |
| `TestSSORoleAndPermissions` | 2 | RBAC enforcement |
| `TestSSORobustness` | 5 | Error handling |

## Test Coverage by Feature

### Encryption
- `TestSSOServiceEncryption` (7 tests)
  - Encrypt/decrypt secrets
  - Handle special characters and unicode
  - Error handling for invalid data

### OAuth URL Generation
- `TestSSOAuthorizationURL` (9 tests)
  - Azure, Google, Okta, Custom providers
  - Custom redirect URIs
  - OIDC nonce for Azure
  - Error handling

### Domain Restrictions
- `TestDomainRestrictionValidation` (7 tests)
  - Single/multiple domains
  - Case-insensitive validation
  - Whitespace handling

### Connection CRUD
- `TestSSOConnectionCRUD` (15 tests)
  - Create all provider types
  - List, get, update, delete
  - Default flag management
  - Authorization checks

### Complete Flows
- `TestCompleteSSOFlow` (5 tests)
  - New user provisioning
  - Existing user linking
  - Domain restrictions
  - Role assignment

### Error Handling
- `TestSSORobustness` (5 tests)
  - Invalid providers
  - Missing fields
  - Status validation
  - Large domain lists

## Test Markers

### By Tier
```bash
pytest -m unit           # Only Tier 1 tests
pytest -m integration    # Only Tier 2 tests
pytest -m e2e            # Only Tier 3 tests
```

### By Feature (Not used, but can add)
```bash
pytest -k "encryption"   # All encryption-related tests
pytest -k "provider"     # All provider-related tests
pytest -k "domain"       # All domain restriction tests
```

## Key Testing Patterns

### Unit Test Pattern (Tier 1)
```python
@pytest.mark.unit
class TestFeature:
    def test_something(self):
        # No database
        # Mocked external calls
        # Fast and isolated
        service = SSOService()
        result = service.encrypt_secret("test")
        assert result != "test"
```

### Integration Test Pattern (Tier 2)
```python
@pytest.mark.integration
async def test_something(authenticated_owner_client):
    # Real database
    # Real DataFlow models
    # NO MOCKING
    client, user, org = authenticated_owner_client
    response = await client.post("/api/v1/sso/connections", json={...})
    assert response.status_code == 200
```

### E2E Test Pattern (Tier 3)
```python
@pytest.mark.e2e
async def test_complete_flow(authenticated_owner_client):
    # Complete workflows
    # Real infrastructure
    # End-to-end scenarios
    # Step 1: Create connection
    # Step 2: Initiate auth
    # Step 3: Verify user created
```

## Fixtures Reference

### Authentication Fixtures
```python
authenticated_owner_client          # (client, user, org) - org_owner role
authenticated_admin_client          # (client, user, org) - org_admin role
authenticated_developer_client      # (client, user) - developer role
```

### Database Fixtures
```python
test_db                             # Real PostgreSQL DataFlow instance
test_client                         # FastAPI test client
test_database_url                   # PostgreSQL connection string
test_redis_url                      # Redis connection string
```

### Factory Fixtures
```python
user_factory()                      # Create test user data
organization_factory()              # Create test org data
workspace_factory()                 # Create test workspace data
```

## Common Test Patterns

### Test Authorization
```python
@pytest.mark.asyncio
async def test_permission_denied(authenticated_developer_client):
    client, user = authenticated_developer_client
    response = await client.post("/api/v1/sso/connections", json={...})
    assert response.status_code == 403
```

### Test CRUD Operations
```python
# Create
response = await client.post("/api/v1/sso/connections", json={...})
assert response.status_code == 200
connection_id = response.json()["id"]

# Read
response = await client.get(f"/api/v1/sso/connections/{connection_id}")
assert response.status_code == 200

# Update
response = await client.put(f"/api/v1/sso/connections/{connection_id}", json={...})
assert response.status_code == 200

# Delete
response = await client.delete(f"/api/v1/sso/connections/{connection_id}")
assert response.status_code == 200
```

### Test with Database
```python
# Uses real PostgreSQL automatically
# No mocking needed
# Tests real persistence
response = await client.post("/api/v1/sso/connections", json={...})

# Verify in database
list_response = await client.get("/api/v1/sso/connections")
assert connection["id"] in [c["id"] for c in list_response.json()["connections"]]
```

## Troubleshooting

### Tests Fail with Import Error
```
ModuleNotFoundError: No module named 'studio'
```
**Solution**: Install package in dev mode
```bash
pip install -e .
```

### Tests Fail with Database Connection Error
```
Connection failed: Multiple exceptions: [Errno 61] Connect call failed
```
**Solution**: One of two ways:
1. Start PostgreSQL: `docker run -d -p 5432:5432 postgres`
2. Use SQLite: Configure `DATABASE_URL=sqlite:///:memory:` in `.env.test`

### Test Hangs or Times Out
```
timeout: 10.0s
```
**Solution**: Check conftest.py for proper async setup and fixtures

### Tests Pass Locally but Fail in CI
**Common Causes**:
- Database not initialized in CI
- Different environment variables
- Missing dependencies

**Solution**: Check CI workflow and ensure:
- Database is running
- `.env.test` is properly configured
- All dependencies are installed

## Performance Tips

### Speed Up Test Execution
```bash
# Run only fast tests (Tier 1)
pytest tests/unit/ --durations=10

# Run in parallel (if available)
pytest -n auto

# Skip slow E2E tests during development
pytest -m "not e2e"
```

### Skip Slow Tests
```bash
# Skip E2E tests
pytest -m "not e2e" -v

# Skip integration tests
pytest -m "unit" -v
```

### Profile Test Performance
```bash
pytest tests/ --durations=10  # Show 10 slowest tests
```

## Adding New Tests

### Add Unit Test
1. Edit `tests/unit/test_sso_service.py`
2. Add test method to appropriate class or create new class
3. Use mocks for external dependencies
4. Mark with `@pytest.mark.unit`

### Add Integration Test
1. Edit `tests/integration/test_sso_api.py`
2. Use `authenticated_owner_client` or `authenticated_admin_client` fixture
3. NO MOCKING - use real API and database
4. Mark with `@pytest.mark.integration`

### Add E2E Test
1. Edit `tests/e2e/test_sso_flow.py`
2. Test complete user workflows
3. NO MOCKING - complete scenarios
4. Mark with `@pytest.mark.e2e`

## Code Coverage

### Generate Coverage Report
```bash
pytest tests/ --cov=studio --cov-report=html
# Open htmlcov/index.html in browser
```

### Coverage by Component
```bash
pytest tests/ --cov=studio.services.sso_service --cov-report=term-missing
pytest tests/ --cov=studio.models.sso_connection --cov-report=term-missing
pytest tests/ --cov=studio.api.sso --cov-report=term-missing
```

### Current Coverage Targets
- `studio.services.sso_service`: 95%+
- `studio.models.sso_connection`: 95%+
- `studio.models.user_identity`: 95%+
- `studio.api.sso`: 95%+

## Documentation

**Comprehensive Guide**: See `SSO_TEST_SUMMARY.md` for detailed documentation

**Components Tested**:
- `studio.services.sso_service` - SSO service logic
- `studio.models.sso_connection` - Connection model
- `studio.models.user_identity` - Identity linkage
- `studio.api.sso` - API endpoints
- `studio.config.sso` - Provider configuration

## Best Practices

1. **Unit Tests First**: Write Tier 1 tests for individual functions
2. **Real Infrastructure in Tier 2+**: Never mock databases or services
3. **Complete Workflows in E2E**: Test real user scenarios
4. **Clear Test Names**: Use `test_<feature>_<scenario>` naming
5. **Assertion Messages**: Add clarity to assert failures
6. **No Test Dependencies**: Tests should be independent
7. **Clean Up**: Use fixtures for automatic cleanup

## Resources

- Test Summary: `tests/SSO_TEST_SUMMARY.md`
- Project Docs: `README.md`
- Code Examples: Individual test files
- API Docs: `src/studio/api/sso.py`
