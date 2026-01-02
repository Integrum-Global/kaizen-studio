# Quick Start: Phase 6 Tests

## TL;DR - Run All Phase 6 Tests

```bash
# 1. Start infrastructure
cd tests/utils && ./test-env up && ./test-env status && cd ../..

# 2. Run all Phase 6 tests
pytest tests/e2e/test_external_agent_complete_lifecycle.py \
       tests/e2e/test_external_agent_governance_integration.py \
       tests/e2e/test_external_agent_auth_lineage_integration.py \
       tests/benchmarks/test_rate_limiting_performance.py \
       tests/benchmarks/test_lineage_performance.py \
       tests/load/test_external_agent_load.py \
       tests/security/test_auth_encryption.py \
       tests/security/test_credential_masking.py \
       tests/security/test_abac_bypass.py \
       -v --tb=short

# 3. Cleanup
cd tests/utils && ./test-env down && cd ../..
```

**Expected**: 21 tests passing (3 E2E + 9 benchmarks + 2 load + 7 security)

---

## Individual Test Suites

### E2E Tests (Complete Workflows)

```bash
# Complete lifecycle (all 5 phases integrated)
pytest tests/e2e/test_external_agent_complete_lifecycle.py -v

# Governance enforcement (budget + rate limits)
pytest tests/e2e/test_external_agent_governance_integration.py -v

# Multi-hop lineage with external agents
pytest tests/e2e/test_external_agent_auth_lineage_integration.py -v
```

**Time**: ~3-5 minutes total (governance test waits 61 seconds)

---

### Performance Benchmarks

```bash
# Rate limiting performance (<10ms target)
pytest tests/benchmarks/test_rate_limiting_performance.py -v

# Lineage graph performance (<1s for 100 nodes)
pytest tests/benchmarks/test_lineage_performance.py -v
```

**Time**: ~2-3 minutes total

**Note**: 500-node lineage test may take 60+ seconds to create graph

---

### Load Tests

```bash
# Load testing (100 req/s target)
pytest tests/load/test_external_agent_load.py -v
```

**Time**: ~1-2 minutes

**Note**: Creates 20 agents for distributed load test

---

### Security Tests

```bash
# Credential encryption
pytest tests/security/test_auth_encryption.py -v

# Credential masking in audit logs
pytest tests/security/test_credential_masking.py -v

# ABAC policy bypass prevention
pytest tests/security/test_abac_bypass.py -v
```

**Time**: ~1-2 minutes total

---

## Test Infrastructure

### Start Services

```bash
cd tests/utils
./test-env up
./test-env status
```

**Expected Output**:
```
✅ PostgreSQL: Ready (port 5433)
✅ Redis: Ready (port 6380)
```

### Stop Services

```bash
cd tests/utils
./test-env down
```

---

## Test Markers

```bash
# Run by tier
pytest -m e2e -v                 # Tier 3: E2E tests
pytest -m integration -v         # Tier 2: Integration tests

# Run by category
pytest tests/e2e/ -v            # All E2E
pytest tests/benchmarks/ -v     # All benchmarks
pytest tests/load/ -v           # All load tests
pytest tests/security/ -v       # All security tests
```

---

## Performance Targets

| Test | Target | File |
|------|--------|------|
| Rate limiting p50 | <5ms | test_rate_limiting_performance.py |
| Rate limiting p95 | <10ms | test_rate_limiting_performance.py |
| Lineage 10 nodes | <100ms | test_lineage_performance.py |
| Lineage 100 nodes | <1000ms | test_lineage_performance.py |
| Load 100 concurrent | p95 <500ms | test_external_agent_load.py |

---

## Security Validation

| Test | Validation | File |
|------|------------|------|
| Encryption | Credentials encrypted in DB | test_auth_encryption.py |
| Masking | No plaintext in audit logs | test_credential_masking.py |
| ABAC | Cross-org access denied | test_abac_bypass.py |

---

## Troubleshooting

### "Event loop is closed" error
```bash
# Ensure event_loop fixture is session-scoped in conftest.py
# This is already configured - if you see this error, check for:
# - Multiple event loop fixtures
# - Function-scoped event_loop overrides
```

### Redis connection errors
```bash
# Check Redis is running on correct port
./tests/utils/test-env status

# Redis should be on port 6380 (NOT 6379)
# Test Redis URL: redis://localhost:6380/0
```

### PostgreSQL permission errors
```bash
# Ensure DATABASE_URL is set before imports
# conftest.py sets this automatically
# If error persists, check:
os.environ["DATABASE_URL"] = get_database_url(test=True)
```

### Performance tests failing targets
```bash
# Check system load
top

# Other processes using PostgreSQL/Redis can impact performance
# Run tests on clean system for accurate benchmarks

# May need to adjust targets for slower systems:
# - p95 <10ms → <15ms
# - Lineage 100 nodes <1s → <1.5s
```

---

## CI/CD Integration

```bash
# Full pipeline
#!/bin/bash
set -e

# Start infrastructure
cd tests/utils && ./test-env up && cd ../..

# Run all tests with coverage
pytest tests/ \
  --timeout=120 \
  --tb=short \
  --cov=src/studio \
  --cov-report=xml \
  --cov-report=term-missing

# Cleanup
cd tests/utils && ./test-env down && cd ../..
```

**Expected Coverage**: >80% for new code

---

## Documentation

- **Comprehensive Guide**: `tests/PHASE6_TESTING_DOCUMENTATION.md`
- **Implementation Summary**: `PHASE6_IMPLEMENTATION_SUMMARY.md`
- **This Quick Start**: `tests/QUICK_START_PHASE6_TESTS.md`

---

## Test Count

- **E2E Tests**: 3 files, ~10 test methods
- **Performance Benchmarks**: 2 files, ~9 test methods
- **Load Tests**: 1 file, ~2 test methods
- **Security Tests**: 3 files, ~7 test methods

**Total**: 9 files, ~28 test methods

---

## Key Test Files

1. `test_external_agent_complete_lifecycle.py` - **Most comprehensive E2E test**
2. `test_external_agent_governance_integration.py` - Governance enforcement
3. `test_rate_limiting_performance.py` - Performance validation
4. `test_auth_encryption.py` - Security validation

---

## Run Specific Test

```bash
# Run single test method
pytest tests/e2e/test_external_agent_complete_lifecycle.py::TestExternalAgentCompleteLifecycle::test_complete_lifecycle_registration_to_ui_visualization -vv -s

# Run single file
pytest tests/security/test_auth_encryption.py -v

# Run with debug output
pytest tests/e2e/ -v -s

# Run with pdb debugger on failure
pytest tests/e2e/ --pdb
```

---

## Success Criteria

✅ All 21 Phase 6 tests passing
✅ Performance targets met
✅ Security validation passed
✅ Load tests show 100% success rate
✅ NO MOCKING policy followed (Tiers 2-3)
