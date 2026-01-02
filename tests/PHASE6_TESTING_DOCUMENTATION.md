# Phase 6: Testing + Documentation

## Overview

This document explains the comprehensive testing strategy for the External Integrations feature (Phases 1-5). Phase 6 focuses on cross-phase integration, performance, security, and load testing to ensure production readiness.

## Test Organization

### Directory Structure

```
tests/
├── e2e/                                      # End-to-End Tests (Tier 3)
│   ├── test_external_agent_complete_lifecycle.py
│   ├── test_external_agent_governance_integration.py
│   └── test_external_agent_auth_lineage_integration.py
├── benchmarks/                               # Performance Benchmarks (Tier 2)
│   ├── test_rate_limiting_performance.py
│   └── test_lineage_performance.py
├── load/                                     # Load Tests (Tier 2)
│   └── test_external_agent_load.py
├── security/                                 # Security Tests (Tier 2)
│   ├── test_auth_encryption.py
│   └── test_credential_masking.py
├── integration/                              # Integration Tests (Tier 2)
│   ├── test_external_agents_api.py           # Phase 1
│   ├── test_external_agent_lineage.py        # Phase 2
│   └── test_external_agent_governance.py     # Phase 3
└── unit/                                     # Unit Tests (Tier 1)
    └── test_external_agent_service.py        # Phase 1
```

## 3-Tier Testing Strategy

### Tier 1: Unit Tests
- **Speed**: <1 second per test
- **Isolation**: No external dependencies
- **Mocking**: Allowed for external services
- **Focus**: Individual component functionality
- **Location**: `tests/unit/`

### Tier 2: Integration Tests
- **Speed**: <5 seconds per test
- **Infrastructure**: Real Docker services (PostgreSQL, Redis)
- **NO MOCKING**: Use real services (MANDATORY)
- **Focus**: Component interactions
- **Location**: `tests/integration/`, `tests/benchmarks/`, `tests/load/`, `tests/security/`

### Tier 3: End-to-End Tests
- **Speed**: <30 seconds per test (some may be longer for load/governance window tests)
- **Infrastructure**: Complete real infrastructure stack
- **NO MOCKING**: Complete scenarios with real services (only external webhook endpoints mocked)
- **Focus**: Complete user workflows
- **Location**: `tests/e2e/`

## NO MOCKING Policy (Tiers 2-3)

### Critical Rules

**❌ FORBIDDEN in Tiers 2-3:**
- Mocking databases (PostgreSQL, Redis)
- Mocking SDK components (DataFlow nodes, workflows)
- Mocking file operations (builtins.open)
- Stubbing internal service responses

**✅ ALLOWED in Tiers 2-3:**
- Mocking external webhook endpoints (Teams, Discord, Slack, etc.)
- Time freezing for deterministic tests (`freeze_time`)
- Random seed control (`random.seed()`)
- Environment variable testing (`patch.dict(os.environ)`)

### Why NO MOCKING?

1. **Real-world validation**: Tests prove the system works in production
2. **Integration verification**: Mocks hide integration failures
3. **Deployment confidence**: Real tests = real confidence
4. **Configuration validation**: Real services catch config errors

## Test Infrastructure Setup

### Starting Test Services

```bash
# Navigate to test utilities
cd tests/utils

# Start all test services (PostgreSQL, Redis, etc.)
./test-env up

# Verify services are ready
./test-env status

# Expected output:
# ✅ PostgreSQL: Ready (port 5433)
# ✅ Redis: Ready (port 6380)
```

### Running Tests

```bash
# Run all Phase 6 tests
pytest tests/e2e/test_external_agent_*.py tests/benchmarks/ tests/load/ tests/security/ -v

# Run specific test categories
pytest tests/e2e/ -v                  # E2E tests only
pytest tests/benchmarks/ -v           # Performance benchmarks
pytest tests/load/ -v                 # Load tests
pytest tests/security/ -v             # Security tests

# Run with coverage
pytest tests/ --cov=src/studio --cov-report=term-missing

# Run tests by marker
pytest -m e2e -v                      # Only E2E tests
pytest -m integration -v              # Only integration tests
```

## Day 1: Cross-Phase Integration Tests

### 1. Complete Lifecycle E2E Test

**File**: `tests/e2e/test_external_agent_complete_lifecycle.py`

**Intent**: Verify end-to-end flow from registration through UI visualization

**Flow**:
1. Register External Agent (Phase 1)
2. Execute workflow with external agent invocation (Phase 2)
3. Verify governance checks (Phase 3)
4. Verify webhook delivery (Phase 4)
5. Verify lineage graph API (Phase 5)

**Key Assertions**:
- Agent created with encrypted credentials
- Invocation successful with lineage tracking
- Governance limits enforced
- Webhook delivered to Teams (mocked)
- Lineage graph includes external agent node with purple border

**Timeout**: 30 seconds

### 2. Governance Integration E2E Test

**File**: `tests/e2e/test_external_agent_governance_integration.py`

**Intent**: Verify governance enforcement across budget and rate limits

**Flow**:
1. Create agent with max_monthly_cost=$20, requests_per_minute=3
2. Make 3 invocations ($5 each = $15) → All succeed
3. Attempt 4th invocation → Rate limit exceeded (429)
4. Wait 61 seconds → Rate limit window expires
5. Make 5th invocation ($20 total) → Succeeds
6. Attempt 6th invocation → Budget exceeded (402)

**Key Assertions**:
- Invocations 1-3: 200 OK
- Invocation 4: 429 (rate limit)
- Invocation 5: 200 OK (after window)
- Invocation 6: 402 (budget exceeded)
- BillingUsage records accurate ($20 total)
- AuditService logs all governance decisions

**Timeout**: 90 seconds (includes 61-second wait)

### 3. Auth Lineage Integration E2E Test

**File**: `tests/e2e/test_external_agent_auth_lineage_integration.py`

**Intent**: Verify lineage tracking for multi-hop workflows with external agents

**Flow**:
1. Create internal Agent A (chat)
2. Create external Agent B (Discord bot)
3. Create internal Agent C (completion)
4. Create pipeline: A → B → C
5. Execute pipeline
6. Query lineage graph API

**Key Assertions**:
- 3 nodes in lineage graph (A, B, C)
- 2 edges (A→B, B→C)
- Node B has external_agent_id and platform="discord"
- UI metadata includes Discord icon, purple border, "External" badge
- Discord webhook received with correct embed format

**Timeout**: 30 seconds

## Day 2: Performance + Security Testing

### Performance Benchmarks

#### 4. Rate Limiting Performance

**File**: `tests/benchmarks/test_rate_limiting_performance.py`

**Intent**: Verify rate limiting overhead <10ms per invocation

**Test Cases**:
- Single invocation (baseline): Target p50 <5ms
- 100 concurrent invocations: Target p95 <10ms, p99 <15ms
- Window rollover: Consistent latency across window transitions
- Connection pool: No degradation over 500 checks

**Technologies**: pytest-benchmark, real Redis

#### 5. Lineage Graph Performance

**File**: `tests/benchmarks/test_lineage_performance.py`

**Intent**: Verify lineage graph rendering meets performance targets

**Test Cases**:
- 10 nodes: <100ms
- 50 nodes: <300ms
- 100 nodes: <1000ms (1 second)
- 500 nodes: <5000ms (5 seconds, may require pagination)
- Complex DAG (50 nodes, branching): <500ms

**Technologies**: real PostgreSQL, time.perf_counter()

### Load Tests

#### 6. External Agent Load

**File**: `tests/load/test_external_agent_load.py`

**Intent**: Verify system handles 100 req/s with no failures

**Test Cases**:
- Uniform load: 100 concurrent invocations to same agent
- Distributed load: 20 agents, 5 invocations each (100 total)

**Targets**:
- 100% success rate (no failures)
- p95 latency <500ms
- No connection pool exhaustion
- No database deadlocks

**Technologies**: asyncio.gather, real PostgreSQL + Redis

### Security Tests

#### 7. Auth Config Encryption

**File**: `tests/security/test_auth_encryption.py`

**Intent**: Verify credentials encrypted at rest in PostgreSQL

**Test Cases**:
- Direct database query shows encrypted data (not plaintext)
- API returns decrypted credentials to authorized users
- API returns masked credentials to unauthorized users

**Key Verifications**:
- `encrypted_credentials` field is NOT valid JSON
- Known secret NOT found in encrypted value
- Known secret NOT found anywhere in database record
- Decrypted credentials match original values for authorized users

**Technologies**: real PostgreSQL, direct SQL queries via DataFlow

#### 8. Credential Masking

**File**: `tests/security/test_credential_masking.py`

**Intent**: Verify credentials never appear in plaintext in audit logs

**Test Cases**:
- API key masking in audit logs
- OAuth2 client_secret masking in audit logs

**Key Verifications**:
- Search all audit logs for known credentials
- Assert NO plaintext credentials found
- Assert masked values ("***") present in logs

**Technologies**: real PostgreSQL, AuditService queries

## Test Fixtures

### Common Fixtures (conftest.py)

```python
@pytest.fixture(scope="session")
def test_database_url() -> str:
    """Get test database URL."""
    return get_database_url(test=True)

@pytest.fixture(scope="session")
def test_redis_url() -> str:
    """Get test Redis URL."""
    return get_redis_url(test=True)

@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[DataFlow, None]:
    """Reuse global DataFlow instance with per-test cleanup."""
    yield _global_db
    # Cleanup after each test

@pytest.fixture(scope="function")
def clean_redis(redis_client):
    """Clean Redis before each test."""
    redis_client.flushdb()
    yield redis_client
    redis_client.flushdb()

@pytest_asyncio.fixture(scope="function")
async def authenticated_owner_client(test_db, test_client, ...):
    """Create authenticated test client with org_owner role."""
    # Returns (client, user, org)
```

### Mock Webhook Fixtures

```python
@pytest.fixture
def mock_teams_webhook_server(monkeypatch):
    """Mock Teams webhook server for E2E testing."""
    # Only mocks external Teams endpoint
    # Tracks requests for verification
    # Returns server_state dict

@pytest.fixture
def mock_discord_webhook(monkeypatch):
    """Mock Discord webhook server for lineage testing."""
    # Returns Discord embed response
    # Tracks request_received flag

@pytest.fixture
def mock_custom_http_webhook(monkeypatch):
    """Mock custom HTTP webhook with configurable cost."""
    # Allows setting cost_per_invocation for governance tests
    # Returns server_state dict
```

## Performance Targets Summary

| Test Type | Metric | Target | Actual |
|-----------|--------|--------|--------|
| Rate Limiting | p50 latency | <5ms | Measured in benchmarks |
| Rate Limiting | p95 latency | <10ms | Measured in benchmarks |
| Rate Limiting | p99 latency | <15ms | Measured in benchmarks |
| Lineage Graph (10 nodes) | Query time | <100ms | Measured in benchmarks |
| Lineage Graph (50 nodes) | Query time | <300ms | Measured in benchmarks |
| Lineage Graph (100 nodes) | Query time | <1000ms | Measured in benchmarks |
| Lineage Graph (500 nodes) | Query time | <5000ms | Measured in benchmarks |
| Load (100 concurrent) | Success rate | 100% | Measured in load tests |
| Load (100 concurrent) | p95 latency | <500ms | Measured in load tests |

## Security Checklist

- [x] Credentials encrypted at rest (Fernet encryption)
- [x] Credentials masked in API responses to unauthorized users
- [x] Credentials masked in audit logs
- [x] No plaintext secrets in database
- [x] No plaintext secrets in API responses
- [x] No plaintext secrets in audit logs
- [x] ABAC policies enforced (tested in integration tests)
- [x] Direct SQL injection prevention (DataFlow ORM)

## Test Execution Summary

### Prerequisites

1. Start test infrastructure:
   ```bash
   ./tests/utils/test-env up
   ./tests/utils/test-env status
   ```

2. Install test dependencies:
   ```bash
   pip install pytest pytest-asyncio pytest-benchmark pytest-timeout
   ```

### Full Test Suite

```bash
# Run all Phase 6 tests
pytest tests/e2e/test_external_agent_*.py \
       tests/benchmarks/ \
       tests/load/ \
       tests/security/ \
       -v --tb=short

# Expected results:
# - 3 E2E tests (lifecycle, governance, lineage)
# - 9 performance benchmark tests (rate limiting + lineage)
# - 2 load tests (uniform + distributed)
# - 5 security tests (encryption + masking)
# Total: ~19 tests, all passing
```

### Continuous Integration

```bash
# CI/CD pipeline command
./tests/utils/test-env up
pytest tests/ --timeout=120 --tb=short --cov=src/studio --cov-report=xml
./tests/utils/test-env down
```

## Troubleshooting

### Common Issues

1. **"Event loop is closed" error**
   - Ensure `event_loop` fixture is session-scoped in conftest.py
   - DataFlow pools are tied to the event loop that created them

2. **Redis connection errors**
   - Verify Redis is running: `./tests/utils/test-env status`
   - Check Redis port (6380 for tests, not 6379)

3. **PostgreSQL permission errors**
   - Ensure `DATABASE_URL` is set before imports
   - Use `test_db` fixture, not manual DataFlow instances

4. **Mock webhook not working**
   - Ensure monkeypatch is applied before HTTP calls
   - Check URL matching in mock_post function
   - Verify `__wrapped__` pattern is used correctly

5. **Performance tests failing**
   - Check system load (CPU, memory)
   - Ensure no other processes using PostgreSQL/Redis
   - Review timeout settings (may need adjustment for slower systems)

### Debug Mode

```bash
# Run with verbose output
pytest tests/e2e/ -v -s

# Run single test with full traceback
pytest tests/e2e/test_external_agent_complete_lifecycle.py::TestExternalAgentCompleteLifecycle::test_complete_lifecycle_registration_to_ui_visualization -vv -s

# Run with pdb debugger
pytest tests/e2e/ --pdb
```

## Test Coverage

### Current Coverage (Phase 6)

- **Phase 1 (External Agent Model)**: 22 tests
- **Phase 2 (Auth Lineage)**: 20 tests
- **Phase 3 (Governance)**: 22 tests
- **Phase 4 (Webhook Adapters)**: 18 tests
- **Phase 5 (Frontend UI)**: 30+ tests
- **Phase 6 (Integration/Performance/Security)**: 19 tests

**Total**: 131+ tests across all tiers

### Coverage Targets

- **Line Coverage**: >80% for all new code
- **Branch Coverage**: >70% for critical paths
- **Integration Coverage**: 100% of external agent workflows

## Next Steps

After Phase 6 completion:

1. **Production Deployment**
   - Review load test results
   - Adjust infrastructure sizing based on benchmarks
   - Deploy to staging environment

2. **Monitoring Setup**
   - Set up performance monitoring (rate limiting latency)
   - Set up security monitoring (credential access patterns)
   - Set up governance monitoring (budget/rate limit violations)

3. **Documentation**
   - User guide (how to register external agents)
   - Admin guide (governance configuration)
   - Troubleshooting guide (common issues)

## References

- **TODO-028**: Phase 6 task specification
- **Testing Strategy**: `sdk-users/3-development/testing/regression-testing-strategy.md`
- **NO MOCKING Policy**: `sdk-users/7-gold-standards/mock-directives-for-testing.md`
- **DataFlow Testing**: `apps/kailash-dataflow/tests/`
- **Nexus Testing**: `apps/kailash-nexus/tests/`
