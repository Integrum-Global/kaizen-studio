# TODO-018: Phase 1 - Test Fixtures and Data Seeding

**Status**: ACTIVE
**Priority**: HIGH
**Owner**: Frontend Team
**Estimated Effort**: 1 day
**Created**: 2025-12-18

## Description

Create comprehensive test data seeding utilities and fixtures to enable E2E tests that currently fail due to missing backend data. This phase establishes the foundation for all subsequent test fixes by ensuring consistent test data across all test runs.

## Target Impact

- Enable 29 tests currently failing due to missing data
- Fix connector tests (5 failures)
- Fix team tests (4 failures)
- Fix deployment tests (3 failures)
- Fix webhook tests (6 failures)
- Fix gateway tests (11 failures)

## Acceptance Criteria

- [ ] Test data seeding utility created in `e2e/fixtures/seed.ts`
- [ ] Team fixtures with multiple teams and memberships
- [ ] Deployment fixtures with various statuses and configurations
- [ ] Webhook fixtures with different event types
- [ ] Gateway fixtures with scaling configurations
- [ ] Connector fixtures with database, API, and cloud types
- [ ] All fixtures can be seeded before test runs
- [ ] All fixtures can be cleaned up after test runs
- [ ] Fixtures are isolated per test user/organization
- [ ] 29 previously failing tests now passing

## Dependencies

- Existing auth fixtures in `e2e/fixtures/auth.ts`
- Backend API endpoints for creating test data
- Backend running on localhost:8000

## Subtasks

### 1. Create Test Data Seeding Infrastructure (Est: 2h)

**Files to create**:
- `apps/frontend/e2e/fixtures/seed.ts` - Main seeding utility
- `apps/frontend/e2e/fixtures/cleanup.ts` - Cleanup utility

**Implementation**:
```typescript
// apps/frontend/e2e/fixtures/seed.ts
import type { Page } from '@playwright/test';

export interface SeedData {
  teams: Team[];
  deployments: Deployment[];
  webhooks: Webhook[];
  gateways: Gateway[];
  connectors: Connector[];
}

export async function seedTestData(
  page: Page,
  accessToken: string
): Promise<SeedData> {
  // Implementation
}

export async function cleanupTestData(
  page: Page,
  accessToken: string,
  seedData: SeedData
): Promise<void> {
  // Implementation
}
```

**Verification**:
```bash
# Test that seeding and cleanup work
npm run test:e2e -- e2e/fixtures/seed.test.ts
```

**Success Criteria**:
- [ ] Seed utility creates test data via API
- [ ] Cleanup utility removes test data via API
- [ ] No test data pollution between test runs

### 2. Create Team Fixtures (Est: 1h)

**Files to create**:
- `apps/frontend/e2e/fixtures/teams.ts`

**Test Data Requirements**:
- 3 teams with different roles (owner, admin, member)
- Team invitations (pending, accepted, declined)
- Team permissions

**API Endpoints to use**:
- `POST /api/v1/teams` - Create team
- `POST /api/v1/teams/{id}/members` - Add member
- `POST /api/v1/invitations` - Create invitation

**Verification**:
```bash
npm run test:e2e -- e2e/teams.spec.ts
```

**Success Criteria**:
- [ ] Team list displays seeded teams
- [ ] Team detail pages load correctly
- [ ] Team member management works
- [ ] 4 team tests passing

### 3. Create Deployment Fixtures (Est: 1h)

**Files to create**:
- `apps/frontend/e2e/fixtures/deployments.ts`

**Test Data Requirements**:
- Deployments with statuses: pending, running, succeeded, failed
- Deployment logs
- Deployment environments: dev, staging, production

**API Endpoints to use**:
- `POST /api/v1/deployments` - Create deployment
- `POST /api/v1/deployments/{id}/logs` - Add logs

**Verification**:
```bash
npm run test:e2e -- e2e/deployments.spec.ts
```

**Success Criteria**:
- [ ] Deployment list shows all statuses
- [ ] Deployment detail pages load
- [ ] Deployment logs display correctly
- [ ] 3 deployment tests passing

### 4. Create Webhook Fixtures (Est: 1h)

**Files to create**:
- `apps/frontend/e2e/fixtures/webhooks.ts`

**Test Data Requirements**:
- Webhooks with different event types
- Webhook delivery logs (success, failure)
- Webhook headers and authentication

**API Endpoints to use**:
- `POST /api/v1/webhooks` - Create webhook
- `POST /api/v1/webhooks/{id}/deliveries` - Add delivery log

**Verification**:
```bash
npm run test:e2e -- e2e/webhooks.spec.ts
```

**Success Criteria**:
- [ ] Webhook list displays all webhooks
- [ ] Webhook detail page shows configuration
- [ ] Webhook delivery logs visible
- [ ] 6 webhook tests passing

### 5. Create Gateway Fixtures (Est: 2h)

**Files to create**:
- `apps/frontend/e2e/fixtures/gateways.ts`

**Test Data Requirements**:
- Gateways with different configurations
- Scaling policies (auto-scaling enabled/disabled)
- Gateway metrics (requests, errors, latency)
- Gateway health checks

**API Endpoints to use**:
- `POST /api/v1/gateways` - Create gateway
- `POST /api/v1/scaling` - Create scaling policy
- `POST /api/v1/metrics` - Add metrics data

**Verification**:
```bash
npm run test:e2e -- e2e/gateways.spec.ts
```

**Success Criteria**:
- [ ] Gateway list displays all gateways
- [ ] Gateway detail page shows configuration
- [ ] Scaling policies visible
- [ ] Gateway metrics display
- [ ] 11 gateway tests passing

### 6. Create Connector Fixtures (Est: 1h)

**Files to create**:
- `apps/frontend/e2e/fixtures/connectors.ts`

**Test Data Requirements**:
- Database connectors (PostgreSQL, MongoDB, Redis)
- API connectors (REST, GraphQL)
- Cloud connectors (AWS, GCP, Azure)
- Connection test results

**API Endpoints to use**:
- `POST /api/v1/connectors` - Create connector
- `POST /api/v1/connectors/{id}/test` - Test connection

**Verification**:
```bash
npm run test:e2e -- e2e/connectors.spec.ts
```

**Success Criteria**:
- [ ] Connector list shows all types
- [ ] Connector detail page displays configuration
- [ ] Connection test status visible
- [ ] 5 connector tests passing

### 7. Integrate Fixtures into Test Setup (Est: 1h)

**Files to modify**:
- `apps/frontend/e2e/conftest.py` (if exists) or `playwright.config.ts`
- All affected test spec files

**Implementation**:
- Add global setup to seed test data
- Add global teardown to cleanup test data
- Update individual test beforeEach hooks to use seeded data

**Verification**:
```bash
npm run test:e2e
```

**Success Criteria**:
- [ ] All tests use seeded data
- [ ] No test data pollution
- [ ] Tests can run in parallel
- [ ] 29 additional tests passing

## Testing Requirements

### Unit Tests
- [ ] Test seed utility creates correct data structures
- [ ] Test cleanup utility removes all created data
- [ ] Test fixture factories generate valid data

### Integration Tests
- [ ] Test fixtures work with real backend API
- [ ] Test fixtures can be seeded and cleaned up
- [ ] Test fixtures don't conflict with existing data

### E2E Tests
- [ ] Run all affected test specs
- [ ] Verify 29 tests now passing
- [ ] Verify no new test failures introduced

## Risk Assessment

**HIGH**:
- Test data conflicts with existing backend data
- Cleanup failures leaving orphaned test data

**MEDIUM**:
- API rate limits during seeding
- Timing issues with async seeding

**LOW**:
- Fixture data not matching test expectations

## Mitigation Strategies

1. **Test Isolation**:
   - Use unique prefixes for test data (e.g., `e2e-test-`)
   - Create separate test organization per run
   - Clean up in finally blocks

2. **Idempotency**:
   - Check if test data exists before creating
   - Use upsert patterns where possible
   - Handle duplicate key errors gracefully

3. **Monitoring**:
   - Log all seeding operations
   - Track cleanup success/failure
   - Alert on orphaned test data

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Test data seeding utility created and tested
- [ ] All 6 fixture types created (teams, deployments, webhooks, gateways, connectors, alerts)
- [ ] Fixtures integrated into test setup
- [ ] 29 previously failing tests now passing
- [ ] No test data pollution verified
- [ ] Documentation updated in `apps/frontend/e2e/README.md`
- [ ] Code review completed
- [ ] No policy violations

## Related Files

**Existing**:
- `apps/frontend/e2e/fixtures/auth.ts` - Auth setup
- `apps/frontend/e2e/teams.spec.ts` - Team tests
- `apps/frontend/e2e/deployments.spec.ts` - Deployment tests
- `apps/frontend/e2e/webhooks.spec.ts` - Webhook tests
- `apps/frontend/e2e/gateways.spec.ts` - Gateway tests
- `apps/frontend/e2e/connectors.spec.ts` - Connector tests

**To Create**:
- `apps/frontend/e2e/fixtures/seed.ts`
- `apps/frontend/e2e/fixtures/cleanup.ts`
- `apps/frontend/e2e/fixtures/teams.ts`
- `apps/frontend/e2e/fixtures/deployments.ts`
- `apps/frontend/e2e/fixtures/webhooks.ts`
- `apps/frontend/e2e/fixtures/gateways.ts`
- `apps/frontend/e2e/fixtures/connectors.ts`

## Progress Tracking

- [ ] Task breakdown complete
- [ ] Implementation started
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing (29 new passes)
- [ ] Documentation complete
- [ ] Code review approved
