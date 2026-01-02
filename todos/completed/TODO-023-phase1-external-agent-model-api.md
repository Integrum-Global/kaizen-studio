# TODO-023: Phase 1 - External Agent Model + API

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 3-4 days
**Dependencies**: None (foundational phase)

## Description
Implement the foundational data model and API layer for External Agents. This includes DataFlow models for ExternalAgent and ExternalAgentInvocation, service layer for business logic, and REST API endpoints for CRUD operations.

## Acceptance Criteria
- [ ] ExternalAgent DataFlow model with all required fields (id, org_id, name, description, provider, webhook_url, auth_type, auth_config, platform_config, status, rate_limit_config, budget_config, tags)
- [ ] ExternalAgentInvocation DataFlow model with invocation tracking fields (id, external_agent_id, lineage_hop_id, initiated_by, status, request_payload, response_payload, execution_time_ms, error_message, created_at, completed_at)
- [ ] ExternalAgentService with complete business logic (validate_auth_config, validate_platform_config, check_rate_limit, check_budget, invoke_agent, log_invocation)
- [ ] REST API endpoints for External Agent management (POST /api/external-agents, GET /api/external-agents, GET /api/external-agents/{id}, PATCH /api/external-agents/{id}, DELETE /api/external-agents/{id}, POST /api/external-agents/{id}/invoke)
- [ ] ABAC policy integration for permission checks (create:external_agent, read:external_agent, update:external_agent, delete:external_agent, invoke:external_agent)
- [ ] Database migrations for both models
- [ ] All API endpoints return proper status codes (200, 201, 400, 403, 404, 500)

## Dependencies
**External**:
- DataFlow framework for model generation
- ABACService for permission checks
- ObservabilityManager (stubs acceptable for Phase 1, full integration in Phase 2)

**Internal**:
- None (foundational phase)

## Risk Assessment
- **HIGH**: Database schema design must support all future governance features (budget, rate limiting, approvals) without breaking changes
- **MEDIUM**: Auth config validation must be extensible for future auth types beyond API Key and OAuth2
- **MEDIUM**: Platform config validation must support all target platforms (Teams, Discord, Slack, Telegram, Notion)
- **LOW**: API design must follow existing Kaizen Studio conventions

## Subtasks

### Day 1: DataFlow Models (Est: 6-8h)
- [ ] Create ExternalAgent model with @db.model decorator (2h)
  - Verification: Model registered in DataFlow, 9 nodes generated (Create, Read, Update, Delete, List, Count, Exists, Search, Bulk)
- [ ] Create ExternalAgentInvocation model with @db.model decorator (2h)
  - Verification: Model registered in DataFlow, 9 nodes generated
- [ ] Define JSON schema for auth_config field (OAuth2, API Key, Custom) (1h)
  - Verification: JSON schema validates all auth types, rejects invalid configs
- [ ] Define JSON schema for platform_config field (Teams, Discord, Slack, Telegram, Notion) (1h)
  - Verification: JSON schema validates all platform types, rejects invalid configs
- [ ] Define JSON schema for rate_limit_config field (requests_per_minute, requests_per_hour, requests_per_day) (1h)
  - Verification: JSON schema validates rate limit configs, rejects negative values
- [ ] Define JSON schema for budget_config field (max_cost_per_invocation, max_monthly_cost, currency) (1h)
  - Verification: JSON schema validates budget configs, rejects negative values
- [ ] Run DataFlow migrations to create tables (1h)
  - Verification: Tables exist in PostgreSQL with all columns and indexes

### Day 2: Service Layer - Core Logic (Est: 6-8h)
- [ ] Create ExternalAgentService class with DataFlow integration (1h)
  - Verification: Service instantiates, can access ExternalAgent nodes
- [ ] Implement validate_auth_config() method (2h)
  - Verification: Validates OAuth2 (client_id, client_secret, token_url), API Key (key, header_name), Custom (arbitrary JSON)
- [ ] Implement validate_platform_config() method (2h)
  - Verification: Validates Teams (tenant_id, channel_id), Discord (webhook_url, username), Slack (webhook_url, channel), Telegram (bot_token, chat_id), Notion (token, database_id)
- [ ] Implement check_rate_limit() method with stub (1h)
  - Verification: Returns True for Phase 1 (full implementation in Phase 3), logs call for future integration
- [ ] Implement check_budget() method with stub (1h)
  - Verification: Returns True for Phase 1 (full implementation in Phase 3), logs call for future integration
- [ ] Implement log_invocation() method with stub (1h)
  - Verification: Creates ExternalAgentInvocation record with basic fields, ObservabilityManager integration deferred to Phase 2

### Day 3: Service Layer - Invocation Logic + API Endpoints (Est: 6-8h)
- [ ] Implement invoke_agent() method (3h)
  - Verification: Sends HTTP POST to webhook_url with auth headers, handles timeouts (30s), retries (3 attempts with exponential backoff), logs request/response
- [ ] Create /api/external-agents.py router file (1h)
  - Verification: FastAPI router instantiates, imports ABACService
- [ ] Implement POST /api/external-agents endpoint (1h)
  - Verification: Creates ExternalAgent, validates auth/platform configs, requires create:external_agent permission, returns 201 with created agent
- [ ] Implement GET /api/external-agents endpoint with pagination (1h)
  - Verification: Lists ExternalAgents for org_id, supports ?page=X&limit=Y, requires read:external_agent permission, returns 200 with paginated results
- [ ] Implement GET /api/external-agents/{id} endpoint (1h)
  - Verification: Retrieves single ExternalAgent, requires read:external_agent permission, returns 404 if not found, returns 200 with agent details
- [ ] Implement PATCH /api/external-agents/{id} endpoint (1h)
  - Verification: Updates ExternalAgent fields (name, description, webhook_url, auth_config, platform_config, status), validates configs on update, requires update:external_agent permission, returns 200 with updated agent

### Day 4: API Completion + Integration (Est: 6-8h)
- [ ] Implement DELETE /api/external-agents/{id} endpoint (1h)
  - Verification: Soft deletes ExternalAgent (status='deleted'), requires delete:external_agent permission, returns 204
- [ ] Implement POST /api/external-agents/{id}/invoke endpoint (2h)
  - Verification: Checks rate limit (stub), checks budget (stub), invokes agent, logs invocation, requires invoke:external_agent permission, returns 200 with invocation result or 429 if rate limited
- [ ] Register router in main.py (1h)
  - Verification: All endpoints accessible at /api/external-agents/*
- [ ] Add ABAC policy definitions to config/permissions.py (1h)
  - Verification: Policies defined for create:external_agent, read:external_agent, update:external_agent, delete:external_agent, invoke:external_agent with org_id context
- [ ] Create OpenAPI documentation for all endpoints (1h)
  - Verification: /docs shows all external-agents endpoints with request/response schemas
- [ ] Integration smoke test: Create agent, invoke agent, verify invocation logged (2h)
  - Verification: End-to-end flow works, ExternalAgent and ExternalAgentInvocation records created

## Testing Requirements

### Tier 1: Unit Tests (tests/unit/services/test_external_agent_service.py)
**Intent**: Verify ExternalAgentService business logic in isolation
- [ ] Test validate_auth_config() with valid OAuth2 config
  - Intent: Ensure OAuth2 validation accepts valid client_id, client_secret, token_url
- [ ] Test validate_auth_config() with invalid OAuth2 config (missing client_id)
  - Intent: Ensure validation rejects incomplete OAuth2 configs
- [ ] Test validate_auth_config() with valid API Key config
  - Intent: Ensure API Key validation accepts valid key and header_name
- [ ] Test validate_auth_config() with invalid API Key config (missing key)
  - Intent: Ensure validation rejects incomplete API Key configs
- [ ] Test validate_platform_config() with valid Teams config
  - Intent: Ensure Teams validation accepts valid tenant_id and channel_id
- [ ] Test validate_platform_config() with invalid Teams config (missing tenant_id)
  - Intent: Ensure validation rejects incomplete Teams configs
- [ ] Test validate_platform_config() with valid Discord config
  - Intent: Ensure Discord validation accepts valid webhook_url and username
- [ ] Test validate_platform_config() with valid Slack config
  - Intent: Ensure Slack validation accepts valid webhook_url and channel
- [ ] Test validate_platform_config() with valid Telegram config
  - Intent: Ensure Telegram validation accepts valid bot_token and chat_id
- [ ] Test validate_platform_config() with valid Notion config
  - Intent: Ensure Notion validation accepts valid token and database_id
- [ ] Test check_rate_limit() returns True (stub behavior)
  - Intent: Verify stub implementation for Phase 1
- [ ] Test check_budget() returns True (stub behavior)
  - Intent: Verify stub implementation for Phase 1

### Tier 2: Integration Tests (tests/integration/test_external_agents_api.py)
**Intent**: Verify API endpoints with real PostgreSQL database (NO MOCKING)
- [ ] Test POST /api/external-agents creates ExternalAgent in database
  - Intent: Verify end-to-end creation flow with real database persistence
  - Setup: Real PostgreSQL database, authenticated test user with create:external_agent permission
  - Assertions: Database query confirms ExternalAgent record exists with correct fields
- [ ] Test POST /api/external-agents rejects invalid auth_config
  - Intent: Verify validation errors propagate to API response
  - Setup: Real PostgreSQL database, authenticated test user
  - Assertions: Returns 400 with validation error message
- [ ] Test GET /api/external-agents returns paginated results
  - Intent: Verify pagination logic with real database queries
  - Setup: Real PostgreSQL with 25 ExternalAgent records, authenticated test user with read:external_agent permission
  - Assertions: ?page=1&limit=10 returns 10 records, ?page=3&limit=10 returns 5 records
- [ ] Test GET /api/external-agents/{id} returns 404 for non-existent agent
  - Intent: Verify error handling for missing records
  - Setup: Real PostgreSQL database, authenticated test user
  - Assertions: Returns 404 with error message
- [ ] Test PATCH /api/external-agents/{id} updates database record
  - Intent: Verify update logic with real database persistence
  - Setup: Real PostgreSQL with existing ExternalAgent, authenticated test user with update:external_agent permission
  - Assertions: Database query confirms updated fields
- [ ] Test DELETE /api/external-agents/{id} soft deletes record
  - Intent: Verify soft delete sets status='deleted' without removing record
  - Setup: Real PostgreSQL with existing ExternalAgent, authenticated test user with delete:external_agent permission
  - Assertions: Database query confirms status='deleted', record still exists
- [ ] Test POST /api/external-agents/{id}/invoke creates invocation record
  - Intent: Verify invocation logging with real database persistence
  - Setup: Real PostgreSQL with existing ExternalAgent, mock webhook server, authenticated test user with invoke:external_agent permission
  - Assertions: Database query confirms ExternalAgentInvocation record exists with request/response payloads
- [ ] Test ABAC permission checks reject unauthorized users
  - Intent: Verify permission enforcement with real ABACService
  - Setup: Real PostgreSQL, authenticated test user WITHOUT create:external_agent permission
  - Assertions: POST /api/external-agents returns 403

### Tier 3: End-to-End Tests (tests/e2e/test_external_agent_workflow.py)
**Intent**: Verify complete External Agent lifecycle with real infrastructure (NO MOCKING)
- [ ] Test complete External Agent registration and invocation workflow
  - Intent: Verify end-to-end user workflow from agent creation to invocation
  - Setup: Real PostgreSQL, real Redis, mock webhook server (external service), authenticated test user with all permissions
  - Steps:
    1. POST /api/external-agents with Teams config
    2. GET /api/external-agents to verify creation
    3. POST /api/external-agents/{id}/invoke with test payload
    4. GET /api/external-agents/{id}/invocations to verify invocation logged
  - Assertions: All API calls succeed, database records created, webhook server received request with correct auth headers
- [ ] Test External Agent deletion prevents further invocations
  - Intent: Verify deleted agents cannot be invoked
  - Setup: Real PostgreSQL, existing ExternalAgent, authenticated test user
  - Steps:
    1. DELETE /api/external-agents/{id}
    2. POST /api/external-agents/{id}/invoke (should fail)
  - Assertions: DELETE returns 204, invoke returns 404 or 400 with "agent deleted" message

## Documentation Requirements
- [ ] API documentation in docs/05-infrastructure/external-agents-api.md
  - Endpoint descriptions, request/response schemas, authentication requirements
- [ ] Data model documentation in docs/05-infrastructure/external-agents-models.md
  - ExternalAgent and ExternalAgentInvocation field definitions, JSON schema examples
- [ ] Service layer documentation in src/studio/services/external_agent_service.py docstrings
  - Method descriptions, parameter types, return values, exceptions
- [ ] Migration guide for existing Kaizen Studio installations in docs/05-infrastructure/external-agents-migration.md
  - Database migration commands, data migration considerations

## Definition of Done
- [ ] All acceptance criteria met
- [ ] All Tier 1 unit tests passing (12+ tests)
- [ ] All Tier 2 integration tests passing (8+ tests with real PostgreSQL)
- [ ] All Tier 3 E2E tests passing (2+ tests with real infrastructure)
- [ ] Code review completed
- [ ] No linting errors (ruff, mypy)
- [ ] OpenAPI documentation generated and accessible at /docs
- [ ] All documentation files created and reviewed
- [ ] Database migrations tested on clean database
- [ ] Phase 1 deliverables ready for Phase 2 integration (stubs documented for ObservabilityManager, rate limiting, budget enforcement)

## Notes
- Rate limiting and budget enforcement are STUBBED in Phase 1, full implementation in Phase 3
- ObservabilityManager integration is STUBBED in Phase 1, full implementation in Phase 2
- Focus on solid data model and API foundation to support all future governance features
- All JSON schemas must be documented with examples in API documentation
