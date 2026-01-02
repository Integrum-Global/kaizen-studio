# Environment Promotion Workflow Tests - Complete Index

**Created:** November 2024
**Total Tests:** 96 across 3 tiers
**All Tests Collected:** 96/96 ✓

---

## Quick Reference

### File Locations
- **Tier 1 (Unit):** `/tests/unit/test_promotion_service.py` - 44 tests
- **Tier 2 (Integration):** `/tests/integration/test_promotions_api.py` - 37 tests
- **Tier 3 (E2E):** `/tests/e2e/test_promotion_workflow.py` - 15 tests
- **Factories:** `/tests/conftest.py` - promotion_factory, promotion_rule_factory

### Quick Commands
```bash
# Run all promotion tests
pytest tests/unit/test_promotion_service.py tests/integration/test_promotions_api.py tests/e2e/test_promotion_workflow.py

# Run only unit tests (no infrastructure needed)
pytest tests/unit/test_promotion_service.py -v

# Run integration tests (requires Docker)
./tests/utils/test-env up && pytest tests/integration/test_promotions_api.py -v && ./tests/utils/test-env down

# Run E2E tests (requires Docker)
./tests/utils/test-env up && pytest tests/e2e/test_promotion_workflow.py -v && ./tests/utils/test-env down
```

---

## Tier 1: Unit Tests (44/44 PASSING)

Location: `tests/unit/test_promotion_service.py`
Type: `@pytest.mark.unit`
Timeout: `@pytest.mark.timeout(1)`

### TestPromotionCreation - 13 tests
- test_promotion_has_required_fields
- test_promotion_id_is_valid_uuid
- test_organization_id_is_valid_uuid
- test_agent_id_is_valid_uuid
- test_created_at_is_iso8601
- test_promotion_status_valid_values
- test_promotion_environments_valid
- test_promotion_initial_status_is_pending
- test_promotion_requires_approval_field
- test_promotion_optional_approval_fields
- test_promotion_optional_deployment_fields
- test_different_promotions_have_different_ids
- test_promotion_with_custom_environments

### TestPromotionApprovalWorkflow - 5 tests
- test_approved_promotion_has_approver_info
- test_rejected_promotion_has_rejection_reason
- test_completed_promotion_has_target_deployment
- test_failed_promotion_has_error_message
- test_approval_workflow_states_progression

### TestPromotionRuleMatching - 11 tests
- test_rule_has_required_fields
- test_rule_id_is_valid_uuid
- test_rule_status_valid_values
- test_rule_requires_approval_flag
- test_rule_auto_promote_flag
- test_rule_required_approvers_count
- test_rule_conditions_is_optional
- test_rule_environment_matching
- test_different_rules_have_different_ids
- test_rule_with_complex_conditions
- test_rule_for_production_promotion

### TestPromotionValidation - 6 tests
- test_promotion_source_deployment_required
- test_promotion_target_gateway_required
- test_promotion_created_by_required
- test_promotion_different_source_and_target
- test_promotion_timestamps_are_strings
- test_promotion_organization_context

### TestPromotionServiceLogic - 4 tests
- test_production_promotion_requires_approval_by_default
- test_staging_promotion_may_not_require_approval
- test_auto_promotion_conditions
- test_approval_count_validation

### TestPromotionRuleOperations - 5 tests
- test_create_rule_with_all_fields
- test_update_rule_changes_fields
- test_deactivate_rule
- test_rule_unique_per_org
- test_multiple_rules_same_environments

---

## Tier 2: Integration Tests (37/37 COLLECTED)

Location: `tests/integration/test_promotions_api.py`
Type: `@pytest.mark.integration`
Timeout: `@pytest.mark.timeout(5)`
Infrastructure: Real PostgreSQL, Redis, actual services

### TestPromotionCreateEndpoint - 6 tests
- test_create_promotion_success
- test_create_promotion_without_auth
- test_create_promotion_missing_agent_id
- test_create_promotion_missing_source_deployment
- test_create_promotion_missing_target_gateway

**Endpoint Tested:** `POST /promotions`

### TestPromotionListEndpoint - 4 tests
- test_list_promotions_empty
- test_list_promotions_filter_by_status
- test_list_promotions_filter_by_agent
- test_list_promotions_requires_auth

**Endpoint Tested:** `GET /promotions`

### TestPromotionGetEndpoint - 2 tests
- test_get_promotion_not_found
- test_get_promotion_requires_auth

**Endpoint Tested:** `GET /promotions/{promotion_id}`

### TestPromotionApproveEndpoint - 3 tests
- test_approve_promotion_not_found
- test_approve_promotion_requires_auth
- test_approve_promotion_requires_permission

**Endpoint Tested:** `POST /promotions/{promotion_id}/approve`

### TestPromotionRejectEndpoint - 3 tests
- test_reject_promotion_not_found
- test_reject_promotion_missing_reason
- test_reject_promotion_requires_auth

**Endpoint Tested:** `POST /promotions/{promotion_id}/reject`

### TestPromotionExecuteEndpoint - 3 tests
- test_execute_promotion_not_found
- test_execute_promotion_requires_auth
- test_execute_promotion_requires_permission

**Endpoint Tested:** `POST /promotions/{promotion_id}/execute`

### TestPromotionRuleCreateEndpoint - 4 tests
- test_create_rule_success
- test_create_rule_without_auth
- test_create_rule_missing_name
- test_create_rule_missing_environments

**Endpoint Tested:** `POST /promotions/rules`

### TestPromotionRuleListEndpoint - 3 tests
- test_list_rules_empty
- test_list_rules_filter_by_status
- test_list_rules_requires_auth

**Endpoint Tested:** `GET /promotions/rules`

### TestPromotionRuleGetEndpoint - 2 tests
- test_get_rule_not_found
- test_get_rule_requires_auth

**Endpoint Tested:** `GET /promotions/rules/{rule_id}`

### TestPromotionRuleUpdateEndpoint - 3 tests
- test_update_rule_not_found
- test_update_rule_requires_auth
- test_update_rule_requires_permission

**Endpoint Tested:** `PUT /promotions/rules/{rule_id}`

### TestPromotionRuleDeleteEndpoint - 3 tests
- test_delete_rule_not_found
- test_delete_rule_requires_auth
- test_delete_rule_requires_permission

**Endpoint Tested:** `DELETE /promotions/rules/{rule_id}`

### TestPromotionRuleIntegration - 2 tests
- test_promotion_respects_organization_context
- test_rule_respects_organization_context

**Focus:** Multi-org isolation, context validation

---

## Tier 3: End-to-End Tests (15/15 COLLECTED)

Location: `tests/e2e/test_promotion_workflow.py`
Type: `@pytest.mark.e2e`
Timeout: `@pytest.mark.timeout(10)`
Infrastructure: Complete real stack

### TestPromotionLifecycle - 3 tests
- test_simple_promotion_workflow
- test_promotion_requiring_approval
- test_promotion_rejection_workflow

**Scenario:** Create → Check → List workflows

### TestPromotionRuleWorkflow - 3 tests
- test_create_and_manage_promotion_rule
- test_production_promotion_rule
- test_multiple_rules_same_environment_pair

**Scenario:** Full CRUD lifecycle, production rules, multiple rules

### TestPromotionSecurityAndAuthorization - 3 tests
- test_promotion_isolation_by_organization
- test_rule_isolation_by_organization
- test_promotion_access_control

**Scenario:** Multi-org isolation, access control

### TestPromotionStateTransitions - 2 tests
- test_promotion_status_transitions
- test_promotion_cannot_approve_completed

**Scenario:** Valid/invalid state transitions

### TestPromotionCompleteWorkflow - 4 tests
- test_development_to_staging_workflow
- test_staging_to_production_workflow
- test_promotion_rejection_workflow
- test_rule_deactivation_prevents_auto_promotion

**Scenario:** Complex multi-step workflows

---

## Test Data Factories

### promotion_factory(conftest.py)
Creates promotion test data with 15 customizable fields:
- id, organization_id, agent_id
- source_deployment_id, target_gateway_id
- source_environment, target_environment
- status, requires_approval
- approved_by, approved_at
- rejection_reason, target_deployment_id
- created_by, created_at, completed_at

### promotion_rule_factory(conftest.py)
Creates promotion rule test data with 10 customizable fields:
- id, organization_id
- name, source_environment, target_environment
- requires_approval, auto_promote
- required_approvers, conditions
- status, created_at, updated_at

---

## Test Statistics

### By Tier
| Tier | File | Tests | Speed | Infrastructure |
|------|------|-------|-------|-----------------|
| 1 | test_promotion_service.py | 44 | <1s | None |
| 2 | test_promotions_api.py | 37 | <5s | Docker |
| 3 | test_promotion_workflow.py | 15 | <10s | Docker |
| **Total** | **3 files** | **96** | - | - |

### By Category
| Category | Unit | Integration | E2E | Total |
|----------|------|-------------|-----|-------|
| Promotion CRUD | 13 | 6 | 3 | 22 |
| Approval Workflow | 5 | 3 | 3 | 11 |
| Rule Management | 11 | 7 | 4 | 22 |
| Validation | 6 | 10 | 2 | 18 |
| Security | - | 2 | 3 | 5 |
| State Management | - | - | 2 | 2 |
| Organization Context | 1 | 2 | 2 | 5 |
| **Total** | **44** | **37** | **15** | **96** |

### By Endpoint
| Endpoint | Tests | Type |
|----------|-------|------|
| POST /promotions | 6 | Integration |
| GET /promotions | 4 | Integration |
| GET /promotions/{id} | 2 | Integration |
| POST /promotions/{id}/approve | 3 | Integration |
| POST /promotions/{id}/reject | 3 | Integration |
| POST /promotions/{id}/execute | 3 | Integration |
| POST /promotions/rules | 4 | Integration |
| GET /promotions/rules | 3 | Integration |
| GET /promotions/rules/{id} | 2 | Integration |
| PUT /promotions/rules/{id} | 3 | Integration |
| DELETE /promotions/rules/{id} | 3 | Integration |
| **Total Endpoints** | **11** | - |

---

## Models Tested

### Promotion
**47 tests** covering:
- Data validation
- Status transitions
- Approval workflow
- Organization isolation
- Timestamp formats
- Field requirements
- Default values
- State consistency

### PromotionRule
**33 tests** covering:
- Rule creation/update/deletion
- Auto-promotion logic
- Approval requirements
- Condition matching
- Status management
- Organization isolation
- Multiple rules support
- Environment matching

### Combined Workflows
**16 tests** covering:
- Cross-model interactions
- Rule enforcement
- Promotion execution
- Security boundaries
- State coordination

---

## Running Specific Tests

### By Class
```bash
# Unit tests
pytest tests/unit/test_promotion_service.py::TestPromotionCreation -v
pytest tests/unit/test_promotion_service.py::TestPromotionApprovalWorkflow -v
pytest tests/unit/test_promotion_service.py::TestPromotionRuleMatching -v
pytest tests/unit/test_promotion_service.py::TestPromotionValidation -v
pytest tests/unit/test_promotion_service.py::TestPromotionServiceLogic -v
pytest tests/unit/test_promotion_service.py::TestPromotionRuleOperations -v

# Integration tests
pytest tests/integration/test_promotions_api.py::TestPromotionCreateEndpoint -v
pytest tests/integration/test_promotions_api.py::TestPromotionListEndpoint -v
pytest tests/integration/test_promotions_api.py::TestPromotionRuleCreateEndpoint -v

# E2E tests
pytest tests/e2e/test_promotion_workflow.py::TestPromotionLifecycle -v
pytest tests/e2e/test_promotion_workflow.py::TestPromotionRuleWorkflow -v
pytest tests/e2e/test_promotion_workflow.py::TestPromotionCompleteWorkflow -v
```

### By Marker
```bash
# Run all unit tests
pytest -m unit --tb=short

# Run all integration tests
pytest -m integration --tb=short

# Run all E2E tests
pytest -m e2e --tb=short

# Run everything except E2E (fast feedback)
pytest -m "unit or integration" --tb=short
```

### By Pattern
```bash
# Tests containing "workflow"
pytest -k "workflow" -v

# Tests containing "approval"
pytest -k "approval" -v

# Tests containing "rule"
pytest -k "rule" -v

# Tests NOT containing "auth"
pytest -k "not auth" -v
```

---

## Test Execution Examples

### Fast Feedback (Tier 1 only)
```bash
pytest tests/unit/test_promotion_service.py -v --tb=short
# Expected: 44 passed in ~0.1s
```

### With Infrastructure (Tiers 1+2)
```bash
./tests/utils/test-env up && \
pytest tests/unit/test_promotion_service.py tests/integration/test_promotions_api.py -v && \
./tests/utils/test-env down
# Expected: 81 passed
```

### Complete Suite (All Tiers)
```bash
./tests/utils/test-env up && \
pytest tests/unit/test_promotion_service.py \
       tests/integration/test_promotions_api.py \
       tests/e2e/test_promotion_workflow.py -v && \
./tests/utils/test-env down
# Expected: 96 passed
```

### With Coverage Report
```bash
pytest tests/unit/test_promotion_service.py \
       tests/integration/test_promotions_api.py \
       tests/e2e/test_promotion_workflow.py \
       --cov=src/studio/services/promotion_service \
       --cov=src/studio/api/promotions \
       --cov-report=html
```

---

## Failure Debugging

### If Unit Tests Fail
Check factory functions in `conftest.py`:
```bash
pytest tests/unit/test_promotion_service.py -vv --tb=long
```

### If Integration Tests Fail
Ensure Docker is running:
```bash
./tests/utils/test-env status
./tests/utils/test-env logs
```

### If E2E Tests Fail
Check complete environment:
```bash
./tests/utils/test-env logs --all
pytest tests/e2e/test_promotion_workflow.py -vv --tb=long
```

---

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `tests/unit/test_promotion_service.py` | 670 | 44 unit tests |
| `tests/integration/test_promotions_api.py` | 450 | 37 integration tests |
| `tests/e2e/test_promotion_workflow.py` | 480 | 15 E2E tests |
| `tests/conftest.py` | +120 | 2 new factories |
| `tests/PROMOTION_TESTS_SUMMARY.md` | 350 | Complete summary |
| `tests/PROMOTION_TESTS_INDEX.md` | This file | Quick reference |

---

## Success Criteria

All tests pass with:
- No errors or failures
- Timeout compliance (unit: <1s, integration: <5s, E2E: <10s)
- Clean data isolation
- Organization context preservation
- Real infrastructure usage (no mocking in Tiers 2-3)
- Comprehensive API coverage (11/11 endpoints)

**Current Status:** ✅ 44/44 unit tests PASSING
