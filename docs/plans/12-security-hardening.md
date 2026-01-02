# Security Hardening Plan

**Document**: plans/12-security-hardening.md
**Created**: 2025-12-29
**Status**: ACTIVE
**Priority**: CRITICAL

---

## Executive Summary

This plan addresses critical security issues identified in the comprehensive stub audit:

1. **Fail-Open Security Patterns**: ABAC and rate limiting failing open on errors (FIXED)
2. **Unencrypted Credentials**: Webhook credentials stored without encryption (FIXED)
3. **Mock Fallback in Production**: Agent.execute() silently returns fake data (FIXED)
4. **Governance Stub Patterns**: Proper fail-closed behavior verified

---

## Phase 1: kaizen-studio Security Fixes (COMPLETED)

### 1.1 ABAC Middleware Fail-Closed (COMPLETED)

**Problem**: ABAC middleware was failing open on errors, allowing all requests.

**Files Modified**:
- `src/studio/middleware/abac.py:197-198` - ABACDependency exception handler
- `src/studio/middleware/abac.py:260-261` - evaluate_abac_policy exception handler

**Fix Applied**:
```python
# Before: return True (fail-open)
# After: HTTP 500 or return False (fail-closed)
except Exception as e:
    logger.error(f"ABAC evaluation error (denying access): {e}")
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Access control evaluation failed. Please try again later.",
    )
```

### 1.2 Rate Limit Service Fail-Closed (COMPLETED)

**Problem**: Rate limiting was allowing all requests when Redis unavailable.

**Files Modified**:
- `src/studio/services/rate_limit_service.py:72-75`

**Fix Applied**:
```python
# Before: return True, limit (fail-open)
# After: return False, 0 (fail-closed)
except redis.RedisError as e:
    logger.warning(
        f"Redis unavailable for rate limiting (denying request): {e}. "
        "Rate limiting is required for security - please check Redis connection."
    )
    return False, 0
```

### 1.3 Webhook Credential Encryption (COMPLETED)

**Problem**: Credentials stored as plaintext with TODO comment.

**Files Modified**:
- `src/studio/services/webhook_delivery_service.py`

**Fix Applied**:
- Added Fernet encryption using `CREDENTIAL_ENCRYPTION_KEY` env var
- Added `encrypt_credentials()` method for storing
- Updated `_decrypt_credentials()` with proper Fernet decryption
- Added backward compatibility for legacy unencrypted data
- Added production warnings when encryption not configured

---

## Phase 2: kailash-kaizen Security Fixes (COMPLETED)

### 2.1 Agent Mock Fallback Prevention (COMPLETED)

**Problem**: Agent.execute() silently returned fake data when BaseAgent not configured.

**Files Modified**:
- `src/kaizen/agent.py:319-335`

**Fix Applied**:
```python
# Before: result = self._mock_execution(prompt, **kwargs)
# After: Require explicit KAIZEN_ALLOW_MOCK=true for mock mode
if os.environ.get("KAIZEN_ALLOW_MOCK", "").lower() == "true":
    self.logger.warning("BaseAgent not configured - using mock execution.")
    result = self._mock_execution(prompt, **kwargs)
else:
    raise RuntimeError(
        "BaseAgent not configured. Cannot execute without a configured "
        "AI provider. Set KAIZEN_ALLOW_MOCK=true for development/testing."
    )
```

---

## Phase 3: Governance Patterns Verified (COMPLETED)

### 3.1 governance_service.py Stub Analysis

**Verified Patterns** (already correctly implemented):
- Line 151-159: `ExternalAgentPolicyEngine.evaluate_policies()` returns DENY in production
- Lines 344-361: `check_budget()` fails closed in production
- Lines 540-557: `check_rate_limit()` fails closed in production

**Assessment**: Stubs are properly designed with fail-closed behavior in production.

### 3.2 connector_service.py Placeholder Analysis

**Verified Patterns** (properly handled):
- Lines 505-513: MySQL connector returns `success: False` with clear message
- Lines 602-609: SQLite connector returns `success: False` with clear message

**Assessment**: Placeholders provide informative error messages.

---

## Remaining Issues (Lower Priority)

### kailash-kaizen Development-Stage Issues

These are in the Kaizen AI framework (development-stage features):

1. **Document Providers**: OpenAI Vision, Ollama Vision, Landing AI return mock data
   - Impact: Development feature not production-ready
   - Mitigation: Clear "Mock" prefix in returned text

2. **Token Counting**: Claude Code agent uses cycle count heuristic
   - Impact: May cause context overflow in very long sessions
   - Mitigation: Conservative estimates with early warnings

3. **Framework Mixins**: BaseAgent mixins are placeholders
   - Impact: Features not enabled even when configured
   - Mitigation: NotImplementedError when features explicitly requested

4. **Bare Except Clauses**: Multiple files have `except:` or `except Exception: pass`
   - Impact: Silent failures make debugging difficult
   - Mitigation: Add logging before continuing

---

## Test Evidence

### kaizen-studio Tests
- **E2E Tests**: 93 passed (governance.spec.ts)
- **Linting**: All checks passed (ruff)
- **Imports**: All modified files import correctly

### kailash-kaizen Tests
- **Imports**: `kaizen.agent` imports correctly
- **Linting**: All checks passed (ruff)

---

## Security Patterns Now Enforced

| Component | Before | After |
|-----------|--------|-------|
| ABAC Middleware | Fail-open (allow all) | Fail-closed (HTTP 500) |
| Rate Limiting | Fail-open (allow all) | Fail-closed (deny) |
| Credential Storage | Plaintext | Fernet AES-128-CBC |
| Agent Mock Mode | Silent fallback | Explicit env var required |
| Governance Stubs | Verified fail-closed | N/A (already correct) |

---

## Related TODOs

- TODO-035: kaizen-studio Security Hardening (Phase 1)
- TODO-036: kailash-kaizen Security Hardening (Phase 2)
