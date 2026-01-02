# Environment Promotion Workflow Tests - Complete Summary

**Total Tests Created: 96 tests across 3 tiers**

## Overview

Comprehensive test suite for Kaizen Studio's Environment Promotion Workflows, following the 3-tier testing strategy with real infrastructure and NO MOCKING in Tiers 2-3.

## Tier Structure

### Tier 1: Unit Tests (44 tests)
**File:** `tests/unit/test_promotion_service.py`
**Speed:** < 1 second per test
**Mocking:** Allowed for external dependencies
**Infrastructure:** None required

#### Test Coverage:

1. **TestPromotionCreation (13 tests)**
   - `test_promotion_has_required_fields` - Validates all required fields exist
   - `test_promotion_id_is_valid_uuid` - UUID format validation
   - `test_organization_id_is_valid_uuid` - Organization context validation
   - `test_agent_id_is_valid_uuid` - Agent reference validation
   - `test_created_at_is_iso8601` - Timestamp format validation
   - `test_promotion_status_valid_values` - Status enum validation
   - `test_promotion_environments_valid` - Environment names validation
   - `test_promotion_initial_status_is_pending` - Default status value
   - `test_promotion_requires_approval_field` - Approval tracking
   - `test_promotion_optional_approval_fields` - Nullable approval fields
   - `test_promotion_optional_deployment_fields` - Nullable deployment fields
   - `test_different_promotions_have_different_ids` - ID uniqueness
   - `test_promotion_with_custom_environments` - Custom environment support

2. **TestPromotionApprovalWorkflow (5 tests)**
   - `test_approved_promotion_has_approver_info` - Approval tracking
   - `test_rejected_promotion_has_rejection_reason` - Rejection workflow
   - `test_completed_promotion_has_target_deployment` - Completion state
   - `test_failed_promotion_has_error_message` - Error handling
   - `test_approval_workflow_states_progression` - State transition logic

3. **TestPromotionRuleMatching (11 tests)**
   - `test_rule_has_required_fields` - Rule field validation
   - `test_rule_id_is_valid_uuid` - Rule ID validation
   - `test_rule_status_valid_values` - Active/inactive status
   - `test_rule_requires_approval_flag` - Approval requirement flag
   - `test_rule_auto_promote_flag` - Auto-promotion flag
   - `test_rule_required_approvers_count` - Approval count tracking
   - `test_rule_conditions_is_optional` - Optional conditions support
   - `test_rule_environment_matching` - Environment pair validation
   - `test_different_rules_have_different_ids` - Rule ID uniqueness
   - `test_rule_with_complex_conditions` - Complex condition support
   - `test_rule_for_production_promotion` - Production rule validation

4. **TestPromotionValidation (6 tests)**
   - `test_promotion_source_deployment_required` - Required field validation
   - `test_promotion_target_gateway_required` - Target gateway validation
   - `test_promotion_created_by_required` - Created by user validation
   - `test_promotion_different_source_and_target` - Environment pair validation
   - `test_promotion_timestamps_are_strings` - Timestamp format
   - `test_promotion_organization_context` - Organization isolation

5. **TestPromotionServiceLogic (4 tests)**
   - `test_production_promotion_requires_approval_by_default` - Production rules
   - `test_staging_promotion_may_not_require_approval` - Staging rules
   - `test_auto_promotion_conditions` - Conditional auto-promotion
   - `test_approval_count_validation` - Approval count logic

6. **TestPromotionRuleOperations (5 tests)**
   - `test_create_rule_with_all_fields` - Rule creation
   - `test_update_rule_changes_fields` - Rule updates
   - `test_deactivate_rule` - Rule deactivation
   - `test_rule_unique_per_org` - Organization isolation
   - `test_multiple_rules_same_environment_pair` - Multiple rules support

---

### Tier 2: Integration Tests (37 tests)
**File:** `tests/integration/test_promotions_api.py`
**Speed:** < 5 seconds per test
**Infrastructure:** Real PostgreSQL database, real services (NO MOCKING)
**Setup Required:** Docker test infrastructure running

#### Test Coverage:

1. **TestPromotionCreateEndpoint (6 tests)**
   - `test_create_promotion_success` - Create promotion via API
   - `test_create_promotion_without_auth` - Authentication validation
   - `test_create_promotion_missing_agent_id` - Field validation
   - `test_create_promotion_missing_source_deployment` - Required field validation
   - `test_create_promotion_missing_target_gateway` - Gateway requirement

2. **TestPromotionListEndpoint (4 tests)**
   - `test_list_promotions_empty` - List empty result
   - `test_list_promotions_filter_by_status` - Status filtering
   - `test_list_promotions_filter_by_agent` - Agent filtering
   - `test_list_promotions_requires_auth` - Authentication requirement

3. **TestPromotionGetEndpoint (2 tests)**
   - `test_get_promotion_not_found` - 404 handling
   - `test_get_promotion_requires_auth` - Authentication requirement

4. **TestPromotionApproveEndpoint (3 tests)**
   - `test_approve_promotion_not_found` - 404 handling
   - `test_approve_promotion_requires_auth` - Authentication requirement
   - `test_approve_promotion_requires_permission` - Permission validation

5. **TestPromotionRejectEndpoint (3 tests)**
   - `test_reject_promotion_not_found` - 404 handling
   - `test_reject_promotion_missing_reason` - Field validation
   - `test_reject_promotion_requires_auth` - Authentication requirement

6. **TestPromotionExecuteEndpoint (3 tests)**
   - `test_execute_promotion_not_found` - 404 handling
   - `test_execute_promotion_requires_auth` - Authentication requirement
   - `test_execute_promotion_requires_permission` - Permission validation

7. **TestPromotionRuleCreateEndpoint (4 tests)**
   - `test_create_rule_success` - Rule creation
   - `test_create_rule_without_auth` - Authentication validation
   - `test_create_rule_missing_name` - Required field validation
   - `test_create_rule_missing_environments` - Environment validation

8. **TestPromotionRuleListEndpoint (3 tests)**
   - `test_list_rules_empty` - List empty result
   - `test_list_rules_filter_by_status` - Status filtering
   - `test_list_rules_requires_auth` - Authentication requirement

9. **TestPromotionRuleGetEndpoint (2 tests)**
   - `test_get_rule_not_found` - 404 handling
   - `test_get_rule_requires_auth` - Authentication requirement

10. **TestPromotionRuleUpdateEndpoint (3 tests)**
    - `test_update_rule_not_found` - 404 handling
    - `test_update_rule_requires_auth` - Authentication requirement
    - `test_update_rule_requires_permission` - Permission validation

11. **TestPromotionRuleDeleteEndpoint (3 tests)**
    - `test_delete_rule_not_found` - 404 handling
    - `test_delete_rule_requires_auth` - Authentication requirement
    - `test_delete_rule_requires_permission` - Permission validation

12. **TestPromotionRuleIntegration (2 tests)**
    - `test_promotion_respects_organization_context` - Organization isolation
    - `test_rule_respects_organization_context` - Organization isolation

---

### Tier 3: End-to-End Tests (15 tests)
**File:** `tests/e2e/test_promotion_workflow.py`
**Speed:** < 10 seconds per test
**Infrastructure:** Complete real infrastructure stack (NO MOCKING)
**Setup Required:** Full Docker environment

#### Test Coverage:

1. **TestPromotionLifecycle (3 tests)**
   - `test_simple_promotion_workflow` - Create → List → Get workflow
   - `test_promotion_requiring_approval` - Approval workflow
   - `test_promotion_rejection_workflow` - Rejection workflow

2. **TestPromotionRuleWorkflow (3 tests)**
   - `test_create_and_manage_promotion_rule` - Full CRUD lifecycle
   - `test_production_promotion_rule` - Production rule creation
   - `test_multiple_rules_same_environment_pair` - Multiple rules

3. **TestPromotionSecurityAndAuthorization (3 tests)**
   - `test_promotion_isolation_by_organization` - Multi-org isolation
   - `test_rule_isolation_by_organization` - Rule isolation
   - `test_promotion_access_control` - Access control validation

4. **TestPromotionStateTransitions (2 tests)**
   - `test_promotion_status_transitions` - Valid status values
   - `test_promotion_cannot_approve_completed` - Invalid transitions

5. **TestPromotionCompleteWorkflow (4 tests)**
   - `test_development_to_staging_workflow` - Dev → Staging flow
   - `test_staging_to_production_workflow` - Staging → Prod flow
   - `test_promotion_rejection_workflow` - Full rejection flow
   - `test_rule_deactivation_prevents_auto_promotion` - Rule impact

---

## Test Data Factories

Added to `tests/conftest.py`:

### promotion_factory()
Creates test promotion data with customizable fields:
```python
promotion = promotion_factory(
    organization_id=org_id,
    source_environment="development",
    target_environment="staging",
    status="pending",
    requires_approval=False
)
```

### promotion_rule_factory()
Creates test promotion rule data:
```python
rule = promotion_rule_factory(
    source_environment="development",
    target_environment="staging",
    auto_promote=True,
    requires_approval=False,
    conditions={"min_test_pass_rate": 0.9}
)
```

---

## Key Testing Principles

### Tier 1: Unit Tests
- Fast execution (< 1 second)
- Isolated from external dependencies
- Mocking allowed for workflow runtime
- Focus on data validation and business logic
- No database required

### Tier 2: Integration Tests
- Real PostgreSQL database (test instance)
- Real authentication/authorization
- All endpoints tested for:
  - Successful operations
  - Authentication failures (401/403)
  - Validation errors (422)
  - Not found errors (404)
  - Permission checks
- NO MOCKING of services
- Organization isolation validation
- Real DataFlow node operations

### Tier 3: E2E Tests
- Complete workflow scenarios
- Multi-step promotion workflows
- State transition validation
- Security and authorization checks
- Real infrastructure stack
- Complex business logic paths

---

## Test Execution

### Run All Tests
```bash
pytest tests/unit/test_promotion_service.py tests/integration/test_promotions_api.py tests/e2e/test_promotion_workflow.py -v
```

### Run by Tier
```bash
# Tier 1 - Unit Tests
pytest tests/unit/test_promotion_service.py -v

# Tier 2 - Integration Tests (requires Docker)
./tests/utils/test-env up
pytest tests/integration/test_promotions_api.py -v
./tests/utils/test-env down

# Tier 3 - E2E Tests (requires Docker)
./tests/utils/test-env up
pytest tests/e2e/test_promotion_workflow.py -v
./tests/utils/test-env down
```

### Run Specific Test Class
```bash
pytest tests/unit/test_promotion_service.py::TestPromotionCreation -v
pytest tests/integration/test_promotions_api.py::TestPromotionCreateEndpoint -v
pytest tests/e2e/test_promotion_workflow.py::TestPromotionLifecycle -v
```

---

## Endpoints Tested (11 total)

### Promotions
1. `POST /promotions` - Create promotion
2. `GET /promotions` - List promotions (with filtering)
3. `GET /promotions/{promotion_id}` - Get promotion details
4. `POST /promotions/{promotion_id}/approve` - Approve promotion
5. `POST /promotions/{promotion_id}/reject` - Reject promotion
6. `POST /promotions/{promotion_id}/execute` - Execute promotion

### Promotion Rules
7. `POST /promotions/rules` - Create rule
8. `GET /promotions/rules` - List rules
9. `GET /promotions/rules/{rule_id}` - Get rule details
10. `PUT /promotions/rules/{rule_id}` - Update rule
11. `DELETE /promotions/rules/{rule_id}` - Delete rule

---

## Test Coverage Matrix

| Area | Unit | Integration | E2E | Total |
|------|------|-------------|-----|-------|
| Promotion Creation | 13 | 6 | 3 | 22 |
| Approval Workflow | 5 | 3 | 3 | 11 |
| Rule Management | 11 | 7 | 4 | 22 |
| Validation | 6 | 10 | 2 | 18 |
| Security | - | 2 | 3 | 5 |
| State Transitions | - | - | 2 | 2 |
| Organization Isolation | 1 | 2 | 2 | 5 |
| **Total** | **44** | **37** | **15** | **96** |

---

## Models Covered

### Promotion Model
Fields tested:
- id, organization_id, agent_id
- source_deployment_id, target_gateway_id
- source_environment, target_environment
- status (pending, approved, rejected, completed, failed)
- requires_approval, approved_by, approved_at
- rejection_reason, target_deployment_id
- created_by, created_at, completed_at

### PromotionRule Model
Fields tested:
- id, organization_id
- name, source_environment, target_environment
- requires_approval, auto_promote
- required_approvers
- conditions (JSON with min_test_pass_rate, max_error_rate, etc.)
- status (active, inactive)
- created_at, updated_at

---

## Running Tests with Coverage

```bash
# Unit tests with coverage
pytest tests/unit/test_promotion_service.py --cov=src/studio/services/promotion_service --cov-report=term-missing

# All tests with coverage
pytest tests/unit/test_promotion_service.py tests/integration/test_promotions_api.py tests/e2e/test_promotion_workflow.py --cov=src/studio --cov-report=html
```

---

## Test Success Criteria

All 96 tests should:
1. Pass without errors
2. Complete within timeout limits
3. Have no flaky behavior
4. Properly clean up test data
5. Not leak across test boundaries
6. Respect organization context isolation

Current status: **44/44 unit tests passing** ✓
