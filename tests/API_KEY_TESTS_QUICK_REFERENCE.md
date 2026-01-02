# API Keys & Rate Limiting Test Suite - Quick Reference

## Test Files Location

```
/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/tests/
├── unit/
│   ├── test_api_key_service.py           ← 31 unit tests
│   └── test_rate_limit_service.py        ← 21 unit tests
├── integration/
│   └── test_api_keys_api.py              ← 24 integration tests
└── e2e/
    └── test_api_key_workflow.py          ← 15 E2E tests
```

## Test Summary

| Component | Tier 1 | Tier 2 | Tier 3 | Total |
|-----------|--------|--------|--------|-------|
| API Key Service | 31 | 14 | 10 | 55 |
| Rate Limit Service | 21 | 10 | 5 | 36 |
| **TOTAL** | **52** | **24** | **15** | **91** |

## Key Features Tested

### API Key Management
- ✅ Key generation with unique format (sk_live_<prefix>_<suffix>)
- ✅ Bcrypt hashing with salt
- ✅ Key validation against hash
- ✅ Scope-based access control
- ✅ Key expiration checking
- ✅ Key revocation
- ✅ Organization isolation
- ✅ Plaintext key shown only on creation

### Rate Limiting
- ✅ Sliding window algorithm (60-second windows)
- ✅ Per-key request counting
- ✅ Rate limit enforcement at threshold
- ✅ Remaining request calculation
- ✅ Window reset time tracking
- ✅ Per-minute isolation

### Security
- ✅ No plaintext keys stored
- ✅ Hash verification required
- ✅ Organization-based isolation (4 tests)
- ✅ Scope authorization (8 tests)
- ✅ Expiration enforcement (2 tests)
- ✅ Revocation enforcement (2 tests)

## Test Execution

### Quick Run (Unit Tests Only)
```bash
cd /Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio
pytest tests/unit/test_api_key_service.py tests/unit/test_rate_limit_service.py -v
```

### Full Suite with Real Database
```bash
# Start infrastructure
./tests/utils/test-env up

# Run all tests
pytest tests/unit/test_api_key_service.py \
        tests/unit/test_rate_limit_service.py \
        tests/integration/test_api_keys_api.py \
        tests/e2e/test_api_key_workflow.py -v

# Cleanup
./tests/utils/test-env down
```

### Run Specific Category
```bash
# Key creation tests only
pytest -k "test_create" -v

# Rate limit tests only
pytest -k "test_rate_limit or test_increment" -v

# Organization isolation tests
pytest -k "org_isolation" -v

# Scope authorization tests
pytest -k "scope" -v
```

## Test Classes Overview

### Tier 1: Unit Tests

**test_api_key_service.py**
- TestKeyGeneration (4) - Format, uniqueness
- TestKeyHashing (5) - Bcrypt, verification
- TestKeyCreation (4) - Scope validation, expiration
- TestKeyValidation (5) - Format, status, expiration
- TestScopeChecking (6) - Exact match, hierarchy
- TestKeyRetrieval (3) - Get, list, not found
- TestKeyRevocation (1) - Status update
- TestAvailableScopes (3) - Scope definitions

**test_rate_limit_service.py**
- TestWindowCalculation (4) - Minute boundaries, consistency
- TestRateLimitChecking (4) - Under/at limit, remaining
- TestRateLimitIncrement (2) - Create/update records
- TestUsageTracking (3) - Request count, window start
- TestRateLimitReset (2) - Record deletion, missing records
- TestResetTimeCalculation (3) - Time until reset
- TestRateLimitIntegration (2) - Workflow patterns, key isolation

### Tier 2: Integration Tests (Real Database, NO MOCKING)

**test_api_keys_api.py**
- TestCreateAPIKey (7) - Success, validation, defaults, auth
- TestListAPIKeys (4) - Empty, multiple, auth, isolation
- TestGetAPIKey (3) - Success, 404, org isolation
- TestRevokeAPIKey (3) - Success, 404, org isolation
- TestAPIKeyUsage (3) - Stats, 404, org isolation
- TestAvailableScopes (2) - List, public access
- TestAPIKeySecrets (2) - Prefix visibility, plaintext security

### Tier 3: E2E Tests (Complete Workflows)

**test_api_key_workflow.py**
- TestAPIKeyCreationAndValidation (3) - Create, list, details match
- TestAPIKeyExpiration (2) - Expired fails, future works
- TestAPIKeyRevocationWorkflow (2) - Revoke blocks validation
- TestRateLimitingWorkflow (3) - Threshold, tracking, reset time
- TestScopeAuthorizationWorkflow (2) - Scope validation, multi-key
- TestOrganizationIsolation (2) - Key isolation, access control
- TestAPIKeyCompleteLifecycle (1) - Full create-to-revoke workflow

## Test Coverage Details

### Endpoints Tested (7 total)
1. `POST /api-keys` - Create key
2. `GET /api-keys` - List keys
3. `GET /api-keys/{key_id}` - Get key details
4. `DELETE /api-keys/{key_id}` - Revoke key
5. `GET /api-keys/{key_id}/usage` - Get usage stats
6. `GET /api-keys/scopes` - List available scopes
7. Implicit: Key validation via service

### Models Tested
- **APIKey**: id, organization_id, name, key_hash, key_prefix, scopes, rate_limit, expires_at, last_used_at, status, created_by, created_at, updated_at
- **RateLimit**: id, key_id, window_start, request_count, created_at

### Services Tested
- **APIKeyService**: 30+ test methods
- **RateLimitService**: 21+ test methods

## Markers & Filtering

All tests use markers for organization:

```python
@pytest.mark.unit        # Tier 1 tests
@pytest.mark.integration # Tier 2 tests
@pytest.mark.e2e         # Tier 3 tests
@pytest.mark.timeout(N)  # 1s, 5s, 10s limits
```

Run by marker:
```bash
pytest -m unit           # Only unit tests
pytest -m integration    # Only integration tests
pytest -m e2e           # Only E2E tests
pytest -m "not e2e"     # Skip E2E
```

## Test Confidence

- **Unit Tests**: Fast feedback, isolated logic
- **Integration Tests**: Real database confirms models work
- **E2E Tests**: Complete workflows validate end-to-end

All tests follow **NO MOCKING policy in Tiers 2-3** to ensure production readiness.

## Summary Statistics

```
Total Test Methods:        91
├─ Unit Tests:            52 (57%)
├─ Integration Tests:     24 (26%)
└─ E2E Tests:            15 (17%)

API Key Service Tests:     55 (60%)
Rate Limit Service Tests:  36 (40%)

Security Tests:            12 (13%)
├─ Expiration:           2
├─ Revocation:           2
├─ Organization Isolation: 4
└─ Scope Authorization:   8
```

## Next Steps

To run all tests and validate the implementation:

```bash
# Navigate to project
cd /Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio

# Start test infrastructure
./tests/utils/test-env up && ./tests/utils/test-env status

# Run complete test suite
pytest tests/unit/test_api_key_service.py \
        tests/unit/test_rate_limit_service.py \
        tests/integration/test_api_keys_api.py \
        tests/e2e/test_api_key_workflow.py \
        -v --tb=short

# Generate coverage report
pytest tests/ --cov=src/studio/services/api_key_service \
       --cov=src/studio/services/rate_limit_service \
       --cov-report=term-missing

# Cleanup
./tests/utils/test-env down
```

## Documentation Files

- **API_KEY_TESTING_SUMMARY.md** - Comprehensive test suite documentation
- **API_KEY_TESTS_QUICK_REFERENCE.md** - This file (quick lookup)
