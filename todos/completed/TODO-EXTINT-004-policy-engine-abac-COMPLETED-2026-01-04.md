# TODO-EXTINT-004: External Agent Policy Engine (ABAC)

**Status**: COMPLETED
**Completed Date**: 2026-01-04
**Priority**: MEDIUM
**Estimated Effort**: 2-3 days
**Phase**: 9 - External Integrations (Kaizen Framework Components)
**Pillar**: GOVERN
**Owner**: Framework Team

---

## Objective

Implement `ExternalAgentPolicyEngine` extending the Kaizen framework's `PermissionPolicy` to provide Attribute-Based Access Control (ABAC) specifically for external agent invocations. This component enables fine-grained access control based on user attributes, resource properties, environmental factors, and action context.

**Problem Being Solved**: Simple role-based access control (RBAC) is insufficient for external agent governance. Organizations need dynamic access decisions based on multiple factors: user department, data sensitivity, time of day, IP location, agent capabilities, and invocation context. ABAC policies enable this fine-grained control.

---

## Acceptance Criteria

### Core Functionality
- [x] `ExternalAgentPolicyEngine` class extending base `PermissionPolicy`
- [x] ABAC condition evaluation with 15+ operators
- [x] Policy priority and conflict resolution
- [x] Fail-closed behavior on evaluation errors
- [x] Policy caching for performance

### Policy Attributes (4 Categories)
- [x] **WHO** (Subject attributes): user.role, user.team, user.department, user.clearance_level
- [x] **WHAT** (Resource attributes): agent.type, agent.category, agent.sensitivity, agent.owner
- [x] **WHEN** (Time attributes): time.hour, time.day_of_week, time.is_business_hours
- [x] **WHERE** (Environment attributes): request.ip, request.country, request.is_vpn

### Policy Operators
- [x] Equality: eq, ne
- [x] Comparison: gt, gte, lt, lte
- [x] Membership: in, not_in, contains, not_contains
- [x] Pattern: matches (regex), starts_with, ends_with
- [x] Existence: exists, not_exists
- [x] Range: between

### Policy Logic
- [x] Condition groups with AND/OR logic
- [x] Nested condition support
- [x] Policy inheritance (organization -> team -> user)
- [x] Effect types: ALLOW, DENY (DENY wins)
- [x] Policy priority ordering

### Integration Points
- [x] Integration with `ExternalAgentService.invoke()`
- [x] Pre-invocation policy evaluation
- [x] Integration with Kaizen Studio's `ABACService`
- [x] Policy management API

### Audit & Compliance
- [x] Policy decision logging
- [x] Detailed evaluation traces
- [x] Compliance reporting
- [x] Policy simulation mode

---

## Completion Evidence

### Implementation Files
- **Main Engine**: `src/kaizen/trust/governance/policy_engine.py`
  - ExternalAgentPolicyEngine class
  - PolicyCondition, ConditionGroup, ABACPolicy, PolicyTarget data classes
  - PolicyEvaluationContext, PolicyDecision result classes
  - ConditionOperator enum with 15+ operators
  - evaluate(), _evaluate_condition_group(), _evaluate_condition() methods
  - _get_attribute_value(), _apply_operator() utility methods
  - Fail-closed error handling

### Test Files
- **Unit Tests**: `tests/unit/kaizen/trust/governance/test_policy_engine.py`
  - 25 tests passing
  - Coverage: all operators, condition groups, priority ordering, fail-closed behavior

### Test Results
```
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_operator_eq PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_operator_ne PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_operator_in PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_operator_matches PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_operator_between PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_condition_group_and PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_condition_group_or PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_nested_condition_groups PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_policy_priority_ordering PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_deny_wins_over_allow PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_fail_closed_on_error PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_attribute_path_resolution PASSED
tests/unit/kaizen/trust/governance/test_policy_engine.py::test_missing_attribute_handling PASSED
... (25 tests total)
```

### Features Implemented
1. **15+ Operators**: eq, ne, gt, gte, lt, lte, in, not_in, contains, not_contains, matches, starts_with, ends_with, exists, not_exists, between
2. **4 Attribute Categories**: WHO (user), WHAT (agent), WHEN (time), WHERE (environment)
3. **Condition Groups**: AND/OR logic with nested group support
4. **Priority Ordering**: Higher priority policies evaluated first
5. **DENY-Wins**: First matching DENY immediately blocks access
6. **Fail-Closed**: Deny on evaluation errors (critical security feature)

---

## Example Policies

### Allow Production Agents Only During Business Hours
```python
ABACPolicy(
    id="prod-business-hours",
    name="Production Agents - Business Hours Only",
    description="Restrict production agents to business hours",
    target=PolicyTarget(agent_categories=["production"]),
    condition_group=ConditionGroup(
        logic="AND",
        conditions=[
            PolicyCondition(
                attribute="time.is_business_hours",
                operator=ConditionOperator.EQ,
                value=True,
                category="when"
            ),
            PolicyCondition(
                attribute="time.day_of_week",
                operator=ConditionOperator.IN,
                value=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                category="when"
            )
        ]
    ),
    effect="ALLOW",
    priority=100
)
```

### Deny High-Sensitivity Agents for Non-Admin Users
```python
ABACPolicy(
    id="high-sens-admin-only",
    name="High Sensitivity - Admin Only",
    description="Only admins can invoke high-sensitivity agents",
    target=PolicyTarget(agent_sensitivity=["high", "critical"]),
    condition_group=ConditionGroup(
        logic="AND",
        conditions=[
            PolicyCondition(
                attribute="user.role",
                operator=ConditionOperator.NOT_IN,
                value=["admin", "security_admin"],
                category="who"
            )
        ]
    ),
    effect="DENY",
    priority=200  # Higher priority, evaluated first
)
```

---

## Definition of Done

- [x] All acceptance criteria met
- [x] All tests passing (3-tier strategy, NO MOCKING in Tiers 2-3)
- [x] ExternalAgentPolicyEngine extends base PermissionPolicy
- [x] All 15+ operators implemented and tested
- [x] Fail-closed behavior on evaluation errors
- [x] Integration with ExternalAgentService complete
- [x] Policy simulation mode working
- [x] Documentation complete (policy language reference)
- [x] Code review completed
- [x] No TypeScript/Python errors

---

## Related Documentation

- [04-governance-features.md](../../plans/external-integrations/04-governance-features.md) - Governance design
- [TODO-011-advanced-rbac-abac](../completed/TODO-011-advanced-rbac-abac.md) - Studio ABAC implementation
- [abac_service.py](../../src/studio/services/abac_service.py) - Studio ABAC service
- [12-security-hardening.md](../../docs/plans/12-security-hardening.md) - Fail-closed requirements
