# TODO-025: Phase 3 - Governance Features

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 2-3 days
**Dependencies**: TODO-023 (Phase 1), TODO-024 (Phase 2)

## Description
Implement comprehensive governance features for External Agents including budget enforcement via BillingService, rate limiting with Redis-backed storage, and ABAC policy integration for granular permission control. This phase replaces all stubs from Phase 1 with production-ready governance logic.

## Acceptance Criteria
- [ ] Budget enforcement integrated with BillingService (check_budget() replaces stub)
- [ ] Rate limiting service with Redis-backed storage (check_rate_limit() replaces stub)
- [ ] ABAC policy engine supports external agent context attributes (org_id, external_agent_id, provider, tags)
- [ ] External Agent invocations blocked when budget exceeded (returns 402 Payment Required)
- [ ] External Agent invocations blocked when rate limit exceeded (returns 429 Too Many Requests)
- [ ] Budget usage tracked per external agent with monthly rollover
- [ ] Rate limiting supports per-minute, per-hour, and per-day windows
- [ ] Governance audit events logged to AuditService for all policy decisions
- [ ] Dashboard widgets display budget usage and rate limit status per external agent

## Dependencies
**External**:
- BillingService (existing)
- AuditService (existing)
- ABACService (existing)
- Redis (for rate limiting)

**Internal**:
- TODO-023: ExternalAgent model with budget_config and rate_limit_config fields
- TODO-024: Lineage integration for audit trail

## Risk Assessment
- **HIGH**: Budget enforcement must be accurate and prevent cost overruns (financial impact)
- **HIGH**: Rate limiting must be performant and not bottleneck external agent invocations (<10ms overhead)
- **MEDIUM**: Redis unavailability must not break external agent functionality (graceful degradation)
- **MEDIUM**: ABAC policy evaluation must be consistent with existing Kaizen Studio policies
- **LOW**: Audit logging must not impact performance

## Subtasks

### Day 1: Budget Enforcement (Est: 6-8h)
- [ ] Implement BudgetEnforcementService with BillingService integration (3h)
  - Verification: Service can query current month's usage from BillingService, compare against budget_config.max_monthly_cost
- [ ] Implement check_budget() in ExternalAgentService (replaces stub) (2h)
  - Verification: check_budget(external_agent_id) returns False if current month's cost >= max_monthly_cost, logs audit event "budget_check_failed"
- [ ] Implement record_invocation_cost() in BudgetEnforcementService (2h)
  - Verification: record_invocation_cost(external_agent_id, cost_usd) creates BillingUsage record, updates current month's total
- [ ] Update invoke_agent() to record invocation cost after completion (1h)
  - Verification: invoke_agent() calls record_invocation_cost() with execution_time_ms converted to cost (configurable rate per second)

### Day 2: Rate Limiting (Est: 6-8h)
- [ ] Implement RateLimitService with Redis-backed storage (3h)
  - Verification: Service uses Redis INCR with TTL for per-minute, per-hour, per-day counters (keys: rl:ea:{id}:minute, rl:ea:{id}:hour, rl:ea:{id}:day)
- [ ] Implement check_rate_limit() in ExternalAgentService (replaces stub) (2h)
  - Verification: check_rate_limit(external_agent_id) returns False if any window exceeds limit, logs audit event "rate_limit_exceeded"
- [ ] Implement sliding window rate limiting for minute and hour windows (2h)
  - Verification: Uses Redis sorted sets for sliding windows (ZREMRANGEBYSCORE + ZCARD), more accurate than fixed windows
- [ ] Add rate limit headers to API responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) (1h)
  - Verification: POST /api/external-agents/{id}/invoke response includes rate limit headers

### Day 3: ABAC Integration + Audit Logging (Est: 6-8h)
- [ ] Extend ABACService policy engine with external agent attributes (2h)
  - Verification: Policies can reference attributes.external_agent.provider, attributes.external_agent.tags, attributes.external_agent.org_id
- [ ] Create ABAC policies for external agent governance (2h)
  - Verification: Policy definitions created for "allow_expensive_external_agents" (cost threshold), "allow_high_rate_external_agents" (rate limit threshold), "restrict_external_agent_providers" (whitelist/blacklist)
- [ ] Integrate AuditService logging for all governance decisions (2h)
  - Verification: Audit events logged for budget_check_passed, budget_check_failed, rate_limit_checked, rate_limit_exceeded, abac_policy_evaluated with external_agent_id, org_id, decision, metadata
- [ ] Implement graceful degradation for Redis unavailability (1h)
  - Verification: If Redis connection fails, check_rate_limit() logs warning and returns True (fail open), sends alert to monitoring
- [ ] Create dashboard API endpoint GET /api/external-agents/{id}/governance-status (1h)
  - Verification: Returns current budget usage (month-to-date cost, remaining budget), rate limit status (requests remaining in each window), ABAC policy evaluation results

## Testing Requirements

### Tier 1: Unit Tests (tests/unit/services/test_budget_enforcement_service.py, test_rate_limit_service.py)
**Intent**: Verify budget and rate limiting logic in isolation
- [ ] Test BudgetEnforcementService.check_budget() returns False when budget exceeded
  - Intent: Ensure budget enforcement blocks over-budget invocations
- [ ] Test BudgetEnforcementService.check_budget() returns True when budget available
  - Intent: Ensure budget enforcement allows within-budget invocations
- [ ] Test BudgetEnforcementService.record_invocation_cost() creates BillingUsage record
  - Intent: Verify cost tracking persistence
- [ ] Test RateLimitService.check_rate_limit() returns False when rate limit exceeded (minute window)
  - Intent: Ensure rate limiting blocks over-limit invocations in minute window
- [ ] Test RateLimitService.check_rate_limit() returns False when rate limit exceeded (hour window)
  - Intent: Ensure rate limiting blocks over-limit invocations in hour window
- [ ] Test RateLimitService.check_rate_limit() returns False when rate limit exceeded (day window)
  - Intent: Ensure rate limiting blocks over-limit invocations in day window
- [ ] Test RateLimitService.check_rate_limit() returns True when under rate limit
  - Intent: Ensure rate limiting allows under-limit invocations
- [ ] Test RateLimitService sliding window accuracy
  - Intent: Verify sliding window is more accurate than fixed window (no burst at window boundaries)
- [ ] Test RateLimitService graceful degradation when Redis unavailable
  - Intent: Ensure fail-open behavior when Redis connection fails

### Tier 2: Integration Tests (tests/integration/test_external_agent_governance.py)
**Intent**: Verify governance features with real Redis and PostgreSQL (NO MOCKING)
- [ ] Test budget enforcement blocks invocations when budget exceeded
  - Intent: Verify end-to-end budget blocking with real BillingService and PostgreSQL
  - Setup: Real PostgreSQL, real BillingService, ExternalAgent with max_monthly_cost=100, current month usage=95, invocation cost=10
  - Assertions: POST /api/external-agents/{id}/invoke returns 402 with error message "Budget exceeded", no invocation created, audit event "budget_check_failed" logged
- [ ] Test budget enforcement allows invocations when budget available
  - Intent: Verify budget checking does not block valid invocations
  - Setup: Real PostgreSQL, real BillingService, ExternalAgent with max_monthly_cost=100, current month usage=50, invocation cost=10
  - Assertions: POST /api/external-agents/{id}/invoke returns 200, invocation created, BillingUsage record created with cost=10
- [ ] Test rate limiting blocks invocations when minute limit exceeded
  - Intent: Verify end-to-end rate limiting with real Redis
  - Setup: Real Redis, ExternalAgent with requests_per_minute=5, make 5 successful invocations
  - Assertions: 6th invocation returns 429 with error message "Rate limit exceeded", X-RateLimit-Remaining=0 header, audit event "rate_limit_exceeded" logged
- [ ] Test rate limiting allows invocations after window expires
  - Intent: Verify rate limit window expiration and reset
  - Setup: Real Redis, ExternalAgent with requests_per_minute=5, make 5 invocations, wait 61 seconds
  - Assertions: 6th invocation (after 61s) returns 200, X-RateLimit-Remaining=4 header
- [ ] Test ABAC policy evaluation with external agent attributes
  - Intent: Verify ABAC policies can reference external agent context
  - Setup: Real PostgreSQL, real ABACService, policy "restrict_external_agent_providers" restricts provider='webhook', ExternalAgent with provider='webhook'
  - Assertions: POST /api/external-agents/{id}/invoke returns 403 with ABAC denial reason, audit event "abac_policy_evaluated" logged with decision='deny'
- [ ] Test GET /api/external-agents/{id}/governance-status returns accurate data
  - Intent: Verify governance status endpoint with real data sources
  - Setup: Real PostgreSQL, real Redis, real BillingService, ExternalAgent with usage data
  - Assertions: Response includes month_to_date_cost, remaining_budget, rate_limit_remaining (minute/hour/day windows)

### Tier 3: End-to-End Tests (tests/e2e/test_external_agent_governance_workflow.py)
**Intent**: Verify complete governance workflow with real infrastructure (NO MOCKING)
- [ ] Test budget enforcement prevents cost overruns in multi-invocation workflow
  - Intent: Verify budget tracking across multiple invocations prevents exceeding monthly limit
  - Setup: Real PostgreSQL, real Redis, real BillingService, mock webhook server, ExternalAgent with max_monthly_cost=50
  - Steps:
    1. Make 10 invocations at $5 each (total $50)
    2. Attempt 11th invocation
    3. Query GET /api/external-agents/{id}/governance-status
  - Assertions: First 10 invocations succeed, 11th returns 402, governance-status shows remaining_budget=0
- [ ] Test rate limiting enforces limits across distributed requests
  - Intent: Verify rate limiting works with concurrent requests
  - Setup: Real PostgreSQL, real Redis, ExternalAgent with requests_per_minute=10
  - Steps:
    1. Send 15 concurrent invocation requests (asyncio.gather)
    2. Query GET /api/external-agents/{id}/governance-status
  - Assertions: Exactly 10 invocations succeed (200), 5 invocations fail (429), rate limit headers correct on all responses
- [ ] Test ABAC policy blocks unauthorized external agent usage
  - Intent: Verify ABAC policies enforce organizational governance rules
  - Setup: Real PostgreSQL, real ABACService, policy "allow_expensive_external_agents" requires approval for cost>$10/invocation, ExternalAgent with cost=$15/invocation, user without approval permission
  - Steps:
    1. POST /api/external-agents/{id}/invoke as unauthorized user
    2. POST /api/external-agents/{id}/approve as admin user
    3. POST /api/external-agents/{id}/invoke as unauthorized user (after approval)
  - Assertions: First invocation returns 403, approval succeeds, second invocation (after approval) returns 200

## Documentation Requirements
- [ ] Update docs/05-infrastructure/external-agents-governance.md with governance features
  - Budget enforcement configuration, rate limiting configuration, ABAC policy examples
- [ ] Add governance API documentation to docs/05-infrastructure/external-agents-api.md
  - GET /api/external-agents/{id}/governance-status endpoint, 402/429 error response schemas
- [ ] Create governance best practices guide in docs/05-infrastructure/external-agents-governance-best-practices.md
  - Recommended budget limits by provider, rate limit configurations for different use cases, ABAC policy templates
- [ ] Add governance monitoring guide to docs/05-infrastructure/external-agents-monitoring.md
  - Dashboard widgets for budget tracking, rate limit alerts, governance audit log queries

## Definition of Done
- [ ] All acceptance criteria met
- [ ] All Tier 1 unit tests passing (9+ tests)
- [ ] All Tier 2 integration tests passing (6+ tests with real Redis and PostgreSQL)
- [ ] All Tier 3 E2E tests passing (3+ tests with real infrastructure)
- [ ] Code review completed
- [ ] No linting errors (ruff, mypy)
- [ ] All documentation files created and reviewed
- [ ] Budget enforcement tested with real BillingService (cost tracking accurate)
- [ ] Rate limiting performance tested (<10ms overhead per invocation)
- [ ] Redis failover tested (graceful degradation verified)
- [ ] Dashboard widgets implemented and displaying governance data
- [ ] Phase 3 deliverables ready for Phase 4 webhook adapter integration

## Notes
- Budget enforcement is financially critical - thorough testing required to prevent cost overruns
- Rate limiting must be performant - consider Redis connection pooling for high-throughput scenarios
- ABAC policies should be configurable per organization - no hardcoded policy logic
- Graceful degradation for Redis unavailability prevents external agent outages during infrastructure issues
- Dashboard widgets require coordination with frontend team (TODO-027)
