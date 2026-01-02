# External Integrations Implementation Roadmap

**Version**: 1.0
**Status**: Active
**Owner**: Platform Team
**Total Duration**: 18-20 days (2.5-3 weeks)
**Start Date**: TBD
**Target Completion**: TBD

---

## Executive Summary

This roadmap outlines the phased implementation of External Integrations for Kaizen Studio. The feature enables external AI agents (Claude Code, ChatGPT, Gemini, etc.) to invoke Kaizen agents with full governance, observability, and platform-specific webhook delivery.

**Key Principles**:
- **Incremental Value**: Each phase delivers independent, deployable functionality
- **Risk Mitigation**: Critical dependencies identified and managed
- **Quality First**: Dedicated testing and documentation phase
- **User-Centric**: High-value features prioritized (lineage, governance, UI)

---

## Phase Overview

| Phase | Focus Area | Duration | Dependencies | Deliverable |
|-------|-----------|----------|--------------|-------------|
| **Phase 1** | External Agent Model + Basic API | 3-4 days | None | Agent registration and CRUD |
| **Phase 2** | Auth Lineage Integration | 2-3 days | Phase 1 | Full invocation tracing |
| **Phase 3** | Governance Features | 2-3 days | Phase 1 | Budget and policy enforcement |
| **Phase 4** | Webhook Platform Adapters | 2-3 days | None (parallel) | Platform notifications |
| **Phase 5** | Frontend UI | 3-4 days | Phases 1-4 | Complete management interface |
| **Phase 6** | Testing + Documentation | 2-3 days | All phases | Production readiness |

---

## Gantt Timeline

```
Phase 1: External Agent Model + Basic API
├─────────────┤
Day 1    2    3    4

Phase 2: Auth Lineage Integration
              ├────────┤
         Day 5    6    7

Phase 3: Governance Features
              ├────────┤
         Day 8    9   10

Phase 4: Webhook Platform Adapters (Parallel with 2-3)
         ├────────────┤
    Day 5    6    7    8    9   10

Phase 5: Frontend UI
                        ├───────────────┤
                   Day 11  12  13  14  15

Phase 6: Testing + Documentation
                                    ├──────────┤
                               Day 16  17  18  19

MILESTONES:
Day 4:  ▲ Agent Registration Live
Day 7:  ▲ Lineage Tracing Active
Day 10: ▲ Governance Enforced
Day 10: ▲ Webhook Adapters Ready
Day 15: ▲ UI Complete
Day 19: ▲ Production Release
```

---

## Phase 1: Foundation - External Agent Model + Basic API

**Duration**: 3-4 days
**Dependencies**: None
**Goal**: Establish data model and CRUD operations for external agents

### Day 1: Model Design and DataFlow Setup

**Tasks**:
1. **Create ExternalAgent DataFlow Model** (4 hours)
   - Location: `src/studio/models/external_agent.py`
   - Fields:
     ```python
     @db.model
     class ExternalAgent:
         id: str = Field(primary_key=True)
         name: str
         platform: str  # "claude_code", "chatgpt", "gemini", etc.
         description: str | None
         api_key_id: str  # FK to APIKey
         organization_id: str  # FK to Organization
         config: dict  # Platform-specific config
         webhook_config: dict  # Webhook settings
         created_at: datetime
         created_by: str
         is_active: bool
     ```
   - Generate 11 DataFlow nodes automatically

2. **Create ExternalAgentInvocation Model** (2 hours)
   - Location: `src/studio/models/external_agent.py`
   - Fields for auth lineage tracking:
     ```python
     @db.model
     class ExternalAgentInvocation:
         id: str = Field(primary_key=True)
         external_agent_id: str
         kaizen_agent_id: str
         invocation_id: str  # From ObservabilityManager
         request_payload: dict
         response_payload: dict
         status: str  # "success", "error", "throttled"
         error_message: str | None
         latency_ms: int
         timestamp: datetime
     ```

3. **Database Migration** (1 hour)
   - Create migration: `migrations/external_agents_initial.py`
   - Test migration up/down

4. **Unit Tests for Models** (1 hour)
   - Test: `tests/unit/models/test_external_agent.py`
   - Validate field constraints, defaults, relationships

**Deliverable**: ExternalAgent and ExternalAgentInvocation models with auto-generated DataFlow nodes

---

### Day 2: Service Layer Implementation

**Tasks**:
1. **Create ExternalAgentService** (5 hours)
   - Location: `src/studio/services/external_agent_service.py`
   - Methods:
     ```python
     class ExternalAgentService:
         async def create_external_agent(agent_data: dict, user_id: str) -> ExternalAgent
         async def get_external_agent(agent_id: str, org_id: str) -> ExternalAgent
         async def list_external_agents(org_id: str, filters: dict) -> list[ExternalAgent]
         async def update_external_agent(agent_id: str, updates: dict, user_id: str) -> ExternalAgent
         async def delete_external_agent(agent_id: str, user_id: str) -> bool
         async def validate_api_key(agent_id: str, api_key: str) -> bool
     ```
   - Use DataFlow nodes for all operations
   - Integrate with APIKeyService for scoping

2. **API Key Scoping Enhancement** (2 hours)
   - Update `src/studio/services/api_key_service.py`
   - Add `scope` field to APIKey model: `{"type": "external_agent", "agent_id": "..."}`
   - Implement scope validation in auth middleware

3. **Unit Tests for Service** (1 hour)
   - Test: `tests/unit/test_external_agent_service.py`
   - Mock DataFlow nodes, test business logic

**Deliverable**: Complete service layer with API key scoping

---

### Day 3: API Endpoints

**Tasks**:
1. **Create External Agent Router** (4 hours)
   - Location: `src/studio/api/external_agents.py`
   - Endpoints:
     ```python
     POST   /api/v1/external-agents         # Create agent
     GET    /api/v1/external-agents         # List agents
     GET    /api/v1/external-agents/{id}    # Get agent
     PUT    /api/v1/external-agents/{id}    # Update agent
     DELETE /api/v1/external-agents/{id}    # Delete agent
     POST   /api/v1/external-agents/{id}/test  # Test webhook
     ```
   - RBAC: Require `external_agents:read`, `external_agents:write`
   - Validate organization_id scoping

2. **Request/Response Models** (2 hours)
   - Location: `src/studio/api/schemas/external_agent.py`
   - Pydantic models for validation:
     ```python
     class CreateExternalAgentRequest(BaseModel):
         name: str
         platform: str
         description: str | None
         webhook_config: WebhookConfig

     class ExternalAgentResponse(BaseModel):
         id: str
         name: str
         platform: str
         api_key: str  # Masked: "ea_***abc"
         webhook_config: WebhookConfig
         created_at: datetime
         is_active: bool
     ```

3. **Integration Tests** (2 hours)
   - Test: `tests/integration/test_external_agents_api.py`
   - Real database, test all endpoints
   - Verify RBAC enforcement

**Deliverable**: Complete REST API with RBAC

---

### Day 4: Documentation and Milestone 1

**Tasks**:
1. **API Documentation** (2 hours)
   - Update OpenAPI spec in `src/studio/main.py`
   - Add endpoint descriptions, examples
   - Document webhook config schema

2. **User Guide** (2 hours)
   - Create: `docs/guides/external-agents.md`
   - How to register external agents
   - How to generate scoped API keys
   - Platform-specific examples (Claude Code, ChatGPT)

3. **Integration Testing** (3 hours)
   - End-to-end flow: Register → Generate key → Test webhook
   - Verify database persistence
   - Test error handling (invalid platform, missing fields)

4. **Code Review and Cleanup** (1 hour)
   - Address linting issues
   - Ensure Gold Standards compliance
   - Update CHANGELOG.md

**Milestone 1 Deliverable**: External agents can be registered, listed, updated, and deleted via API with scoped API keys

---

## Phase 2: Auth Lineage Integration

**Duration**: 2-3 days
**Dependencies**: Phase 1 (ExternalAgent model)
**Goal**: Capture full invocation lineage for external agent requests

### Day 5: ObservabilityManager Integration

**Tasks**:
1. **Extend ObservabilityManager** (4 hours)
   - Location: `src/studio/services/observability_manager.py`
   - Add external agent context:
     ```python
     class ObservabilityManager:
         async def track_external_invocation(
             external_agent_id: str,
             kaizen_agent_id: str,
             request_payload: dict,
             user_id: str
         ) -> str:  # Returns invocation_id
             # Create invocation record
             # Link to existing audit trail
             # Capture request metadata
     ```

2. **Create Lineage Middleware** (3 hours)
   - Location: `src/studio/middleware/external_auth.py`
   - Intercept requests with `X-External-Agent-ID` header
   - Extract API key, validate against ExternalAgentService
   - Inject external_agent_id into request context
   - Call ObservabilityManager.track_external_invocation()

3. **Unit Tests** (1 hour)
   - Test: `tests/unit/test_external_auth_middleware.py`
   - Mock ObservabilityManager, verify tracking calls

**Deliverable**: External invocations captured in audit trail

---

### Day 6: Invocation Logging and Storage

**Tasks**:
1. **Implement Invocation Logger** (4 hours)
   - Location: `src/studio/services/external_agent_service.py`
   - Methods:
     ```python
     async def log_invocation(
         external_agent_id: str,
         kaizen_agent_id: str,
         invocation_id: str,
         request: dict,
         response: dict,
         status: str,
         latency_ms: int
     ) -> ExternalAgentInvocation
     ```
   - Use ExternalAgentInvocation DataFlow nodes
   - Async logging (non-blocking)

2. **Response Middleware** (3 hours)
   - Capture response payload and latency
   - Update invocation record with results
   - Handle errors gracefully (log even on failure)

3. **Integration Tests** (1 hour)
   - Test: `tests/integration/test_external_invocation_logging.py`
   - Simulate external agent request → Kaizen agent execution
   - Verify invocation record created with correct data

**Deliverable**: Complete request/response logging for external invocations

---

### Day 7: Lineage Query API and Milestone 2

**Tasks**:
1. **Lineage Query Endpoints** (4 hours)
   - Location: `src/studio/api/external_agents.py`
   - Endpoints:
     ```python
     GET /api/v1/external-agents/{id}/invocations
         # List invocations for external agent
         # Filters: date_range, status, kaizen_agent_id

     GET /api/v1/invocations/{id}/lineage
         # Get full lineage for specific invocation
         # Returns: external_agent → kaizen_agent → sub-agents
     ```

2. **Lineage Visualization Data** (2 hours)
   - Format lineage as graph structure:
     ```python
     {
         "nodes": [
             {"id": "ext_agent_1", "type": "external", "name": "Claude Code"},
             {"id": "kaizen_agent_1", "type": "kaizen", "name": "DataAnalyzer"},
             {"id": "kaizen_agent_2", "type": "kaizen", "name": "ReportGenerator"}
         ],
         "edges": [
             {"from": "ext_agent_1", "to": "kaizen_agent_1"},
             {"from": "kaizen_agent_1", "to": "kaizen_agent_2"}
         ]
     }
     ```

3. **Integration Tests** (1 hour)
   - Test: `tests/integration/test_lineage_api.py`
   - Create invocation chain, query lineage
   - Verify graph structure correct

4. **Documentation** (1 hour)
   - Update `docs/guides/external-agents.md`
   - Add lineage query examples
   - Document response format

**Milestone 2 Deliverable**: Full invocation lineage captured and queryable via API

---

## Phase 3: Governance Features

**Duration**: 2-3 days
**Dependencies**: Phase 1 (ExternalAgent model)
**Goal**: Enforce budgets, rate limits, and ABAC policies for external agents

### Day 8: Budget Enforcement

**Tasks**:
1. **Integrate with BillingService** (4 hours)
   - Location: `src/studio/services/billing_service.py`
   - Add external agent budget tracking:
     ```python
     class BillingService:
         async def check_external_agent_budget(
             external_agent_id: str,
             estimated_cost: float
         ) -> bool:
             # Check remaining budget
             # Return True if within limits

         async def record_external_agent_cost(
             external_agent_id: str,
             invocation_id: str,
             actual_cost: float
         ):
             # Deduct from budget
             # Create usage record
     ```

2. **Budget Middleware** (3 hours)
   - Location: `src/studio/middleware/external_auth.py`
   - Check budget before allowing invocation
   - Return 429 if budget exceeded
   - Include remaining budget in response headers

3. **Unit Tests** (1 hour)
   - Test: `tests/unit/test_external_agent_budget.py`
   - Mock BillingService, verify budget checks

**Deliverable**: Budget enforcement for external agents

---

### Day 9: Rate Limiting and ABAC

**Tasks**:
1. **Per-Agent Rate Limiting** (4 hours)
   - Location: `src/studio/middleware/rate_limit.py`
   - Extend existing rate limiter:
     ```python
     class RateLimiter:
         async def check_external_agent_limit(
             external_agent_id: str,
             window: str = "minute"  # minute, hour, day
         ) -> bool:
             # Check Redis for rate limit
             # Key: f"rate_limit:external_agent:{agent_id}:{window}"
     ```
   - Configuration per external agent: `{"rate_limits": {"minute": 60, "hour": 1000}}`

2. **ABAC Policy Integration** (3 hours)
   - Location: `src/studio/services/abac_service.py`
   - Add external agent context to policy evaluation:
     ```python
     policy_context = {
         "subject": {"type": "external_agent", "id": external_agent_id},
         "resource": {"type": "kaizen_agent", "id": kaizen_agent_id},
         "action": "invoke",
         "environment": {"time": now, "organization_id": org_id}
     }
     ```
   - Evaluate policies before invocation

3. **Integration Tests** (1 hour)
   - Test: `tests/integration/test_external_agent_governance.py`
   - Test rate limit enforcement
   - Test ABAC policy denial

**Deliverable**: Rate limiting and ABAC policy enforcement

---

### Day 10: Governance API and Milestone 3

**Tasks**:
1. **Governance Configuration Endpoints** (3 hours)
   - Location: `src/studio/api/external_agents.py`
   - Endpoints:
     ```python
     PUT /api/v1/external-agents/{id}/budget
         # Set budget limits

     PUT /api/v1/external-agents/{id}/rate-limits
         # Configure rate limits

     GET /api/v1/external-agents/{id}/usage
         # Get usage stats (budget, rate limit hits)
     ```

2. **Usage Dashboard Data** (2 hours)
   - Aggregate invocation metrics:
     - Total invocations
     - Budget consumed
     - Rate limit violations
     - Average latency
   - Group by time period (hour, day, week)

3. **Integration Tests** (2 hours)
   - Test: `tests/integration/test_governance_api.py`
   - Configure limits, trigger violations
   - Verify enforcement and metrics

4. **Documentation** (1 hour)
   - Update `docs/guides/external-agents.md`
   - Document governance configuration
   - Add budget and rate limit examples

**Milestone 3 Deliverable**: Budget and rate limit enforcement with ABAC policy support

---

## Phase 4: Webhook Platform Adapters

**Duration**: 2-3 days
**Dependencies**: None (can run in parallel with Phases 2-3)
**Goal**: Implement platform-specific webhook adapters for notifications

### Day 5-6: Core Adapter Framework

**Tasks**:
1. **Create BaseWebhookAdapter** (3 hours)
   - Location: `src/studio/services/webhooks/base_adapter.py`
   - Abstract base class:
     ```python
     class BaseWebhookAdapter(ABC):
         @abstractmethod
         async def send_invocation_result(
             webhook_config: dict,
             invocation: ExternalAgentInvocation,
             result: dict
         ):
             """Send formatted result to platform"""

         @abstractmethod
         def validate_config(self, config: dict) -> bool:
             """Validate platform-specific config"""

         @abstractmethod
         def format_message(
             self,
             invocation: ExternalAgentInvocation,
             result: dict
         ) -> dict:
             """Format message for platform"""
     ```

2. **Adapter Registry** (2 hours)
   - Location: `src/studio/services/webhooks/registry.py`
   - Register adapters by platform:
     ```python
     class WebhookAdapterRegistry:
         _adapters = {}

         @classmethod
         def register(cls, platform: str, adapter: type[BaseWebhookAdapter]):
             cls._adapters[platform] = adapter

         @classmethod
         def get_adapter(cls, platform: str) -> BaseWebhookAdapter:
             return cls._adapters[platform]()
     ```

3. **Unit Tests** (1 hour)
   - Test: `tests/unit/webhooks/test_base_adapter.py`
   - Test adapter registration and retrieval

**Deliverable**: Webhook adapter framework

---

### Day 7-8: Platform Adapters

**Tasks**:
1. **Microsoft Teams Adapter** (3 hours)
   - Location: `src/studio/services/webhooks/teams_adapter.py`
   - Implement Adaptive Card format:
     ```python
     class TeamsAdapter(BaseWebhookAdapter):
         async def send_invocation_result(self, webhook_config, invocation, result):
             card = {
                 "type": "AdaptiveCard",
                 "body": [
                     {"type": "TextBlock", "text": f"Agent: {invocation.kaizen_agent_id}"},
                     {"type": "TextBlock", "text": f"Status: {invocation.status}"},
                     {"type": "TextBlock", "text": f"Latency: {invocation.latency_ms}ms"}
                 ]
             }
             await self._post_to_teams(webhook_config["webhook_url"], card)
     ```

2. **Discord Adapter** (2 hours)
   - Location: `src/studio/services/webhooks/discord_adapter.py`
   - Implement Discord embed format:
     ```python
     class DiscordAdapter(BaseWebhookAdapter):
         async def send_invocation_result(self, webhook_config, invocation, result):
             embed = {
                 "title": f"Agent Invocation: {invocation.kaizen_agent_id}",
                 "color": 0x00ff00 if invocation.status == "success" else 0xff0000,
                 "fields": [
                     {"name": "Status", "value": invocation.status},
                     {"name": "Latency", "value": f"{invocation.latency_ms}ms"}
                 ]
             }
             await self._post_to_discord(webhook_config["webhook_url"], embed)
     ```

3. **Slack Adapter** (2 hours)
   - Location: `src/studio/services/webhooks/slack_adapter.py`
   - Implement Block Kit format:
     ```python
     class SlackAdapter(BaseWebhookAdapter):
         async def send_invocation_result(self, webhook_config, invocation, result):
             blocks = [
                 {"type": "header", "text": {"type": "plain_text", "text": "Agent Result"}},
                 {"type": "section", "fields": [
                     {"type": "mrkdwn", "text": f"*Status:* {invocation.status}"},
                     {"type": "mrkdwn", "text": f"*Latency:* {invocation.latency_ms}ms"}
                 ]}
             ]
             await self._post_to_slack(webhook_config["webhook_url"], blocks)
     ```

4. **Telegram Adapter** (2 hours)
   - Location: `src/studio/services/webhooks/telegram_adapter.py`
   - Implement Telegram bot message format

5. **Integration Tests** (2 hours)
   - Test: `tests/integration/test_webhook_adapters.py`
   - Mock platform APIs, verify message format
   - Test error handling (invalid webhook URL, timeout)

**Deliverable**: Teams, Discord, Slack, and Telegram webhook adapters

---

### Day 9-10: Webhook Delivery Service

**Tasks**:
1. **Create WebhookDeliveryService** (4 hours)
   - Location: `src/studio/services/webhook_delivery_service.py`
   - Methods:
     ```python
     class WebhookDeliveryService:
         async def deliver_invocation_result(
             external_agent_id: str,
             invocation: ExternalAgentInvocation,
             result: dict
         ):
             # Get external agent config
             # Get appropriate adapter
             # Format and send message
             # Log delivery status
     ```
   - Async delivery (non-blocking)
   - Retry logic with exponential backoff

2. **Integrate with Invocation Flow** (2 hours)
   - Call WebhookDeliveryService after invocation completes
   - Handle delivery failures gracefully (log, don't block response)

3. **Delivery Status Tracking** (2 hours)
   - Add fields to ExternalAgentInvocation:
     - `webhook_delivery_status: str`  # "pending", "delivered", "failed"
     - `webhook_delivery_attempts: int`
     - `webhook_delivery_error: str | None`

4. **Integration Tests** (2 hours)
   - Test: `tests/integration/test_webhook_delivery.py`
   - Test successful delivery
   - Test retry logic
   - Test failure handling

**Milestone 4 Deliverable**: Platform-specific webhook delivery with retry and status tracking

---

## Phase 5: Frontend UI

**Duration**: 3-4 days
**Dependencies**: Phases 1-4 (all backend features)
**Goal**: Complete management interface for external agents

### Day 11-12: External Agent Management Pages

**Tasks**:
1. **External Agents List Page** (4 hours)
   - Location: `apps/frontend/src/pages/external-agents/ExternalAgentsList.tsx`
   - Features:
     - DataTable with columns: Name, Platform, Status, Created, Actions
     - Filters: Platform, Status, Date range
     - Search by name
     - Create button → Modal
   - Use existing DataTable component from design system

2. **Create/Edit External Agent Modal** (4 hours)
   - Location: `apps/frontend/src/pages/external-agents/ExternalAgentForm.tsx`
   - Form fields:
     - Name (text input)
     - Platform (select: Claude Code, ChatGPT, Gemini, Custom)
     - Description (textarea)
     - Webhook platform (select: Teams, Discord, Slack, Telegram)
     - Webhook URL (text input)
     - Budget limit (number input)
     - Rate limits (nested inputs: minute, hour, day)
   - Validation using Zod schema
   - API key generation on submit → Show in modal with copy button

3. **External Agent Detail Page** (4 hours)
   - Location: `apps/frontend/src/pages/external-agents/ExternalAgentDetail.tsx`
   - Tabs:
     - **Overview**: Details, API key (masked), edit button
     - **Invocations**: List of recent invocations
     - **Usage**: Charts (invocations over time, budget consumed)
     - **Settings**: Budget, rate limits, webhook config

4. **State Management** (2 hours)
   - Location: `apps/frontend/src/store/externalAgents.ts`
   - Zustand store:
     ```typescript
     interface ExternalAgentsStore {
         agents: ExternalAgent[]
         selectedAgent: ExternalAgent | null
         fetchAgents: () => Promise<void>
         createAgent: (data: CreateExternalAgentRequest) => Promise<ExternalAgent>
         updateAgent: (id: string, data: Partial<ExternalAgent>) => Promise<void>
         deleteAgent: (id: string) => Promise<void>
     }
     ```

5. **Component Tests** (2 hours)
   - Test: `apps/frontend/src/pages/external-agents/__tests__/`
   - Unit tests for form validation
   - Integration tests with mock API

**Deliverable**: External agent management UI

---

### Day 13-14: Invocation Lineage Viewer

**Tasks**:
1. **Lineage Visualization Component** (6 hours)
   - Location: `apps/frontend/src/features/lineage/LineageGraph.tsx`
   - Use React Flow for graph rendering
   - Node types:
     - External agent (blue, icon: external link)
     - Kaizen agent (green, icon: robot)
     - Sub-agent (purple, icon: component)
   - Edge styling: Animated flow on hover
   - Click node → Show details panel

2. **Invocations List with Lineage** (4 hours)
   - Location: `apps/frontend/src/pages/external-agents/InvocationsList.tsx`
   - Table columns:
     - Timestamp, Kaizen Agent, Status, Latency, Actions
   - Row click → Open lineage viewer modal
   - Filters: Status, Date range, Kaizen agent

3. **Lineage Detail Modal** (3 hours)
   - Location: `apps/frontend/src/features/lineage/LineageDetailModal.tsx`
   - Two panels:
     - Left: Lineage graph
     - Right: Selected node details (request, response, metadata)
   - Export lineage as JSON/PNG

4. **Integration Tests** (1 hour)
   - Test: `apps/frontend/e2e/external-agents.spec.ts`
   - E2E flow: Create agent → View invocations → Open lineage

**Deliverable**: Lineage visualization UI

---

### Day 15: Webhook Configuration and Testing

**Tasks**:
1. **Webhook Configuration Form** (3 hours)
   - Location: `apps/frontend/src/features/external-agents/WebhookConfig.tsx`
   - Platform-specific fields:
     - Teams: Webhook URL
     - Discord: Webhook URL, Username (optional)
     - Slack: Webhook URL, Channel (optional)
     - Telegram: Bot token, Chat ID
   - Validation based on platform

2. **Test Webhook Button** (2 hours)
   - Call `POST /api/v1/external-agents/{id}/test`
   - Show success/failure toast
   - Display sample message preview

3. **Usage Dashboard** (3 hours)
   - Location: `apps/frontend/src/pages/external-agents/UsageDashboard.tsx`
   - Charts using Recharts:
     - Invocations over time (line chart)
     - Budget consumed (progress bar + trend)
     - Rate limit hits (bar chart)
     - Success vs. Error rate (pie chart)
   - Date range selector (last 7 days, 30 days, custom)

4. **Accessibility Improvements** (1 hour)
   - ARIA labels for all interactive elements
   - Keyboard navigation for lineage graph
   - Screen reader announcements for status changes

**Milestone 5 Deliverable**: Complete UI for external agent management, lineage viewing, and webhook configuration

---

## Phase 6: Testing + Documentation

**Duration**: 2-3 days
**Dependencies**: All previous phases
**Goal**: Production readiness with comprehensive testing and documentation

### Day 16-17: Comprehensive Testing

**Tasks**:
1. **Unit Test Coverage** (4 hours)
   - Target: >90% coverage for new code
   - Focus areas:
     - ExternalAgentService
     - WebhookAdapterRegistry
     - Budget enforcement logic
     - Rate limiting logic
   - Tools: pytest, pytest-cov

2. **Integration Testing** (4 hours)
   - Test: `tests/integration/test_external_agents_end_to_end.py`
   - Full flow:
     1. Create external agent
     2. Generate API key
     3. Make invocation with API key
     4. Verify lineage captured
     5. Verify webhook delivered
     6. Query usage metrics
   - Real database, real Redis, mock external webhook endpoints

3. **E2E Testing** (4 hours)
   - Test: `tests/e2e/test_external_agents_workflow.py`
   - User workflows:
     - Admin creates external agent
     - External agent invokes Kaizen agent
     - Admin views lineage
     - Admin adjusts budget
     - External agent hits rate limit
   - Playwright for frontend flows

4. **Performance Testing** (2 hours)
   - Test: `tests/performance/test_external_agent_throughput.py`
   - Scenarios:
     - 100 concurrent invocations from different external agents
     - Lineage query performance with 10k+ invocations
     - Webhook delivery latency
   - Target: <200ms p95 latency for invocations

5. **Security Testing** (2 hours)
   - Test: `tests/security/test_external_agent_security.py`
   - Scenarios:
     - Invalid API key rejection
     - Organization isolation (Agent A can't invoke Agent B's resources)
     - ABAC policy enforcement
     - SQL injection attempts in filters
   - Use OWASP ZAP for automated scanning

**Deliverable**: >90% test coverage with performance and security validation

---

### Day 18-19: Documentation and Release Prep

**Tasks**:
1. **User Documentation** (4 hours)
   - Update: `docs/guides/external-agents.md`
   - Sections:
     - Overview and use cases
     - Getting started (register agent, generate key)
     - Platform-specific guides (Claude Code, ChatGPT, etc.)
     - Webhook configuration
     - Governance (budgets, rate limits, policies)
     - Lineage and observability
     - Troubleshooting
   - Include screenshots from frontend

2. **API Reference** (2 hours)
   - Update: `docs/api/external-agents.md`
   - Document all endpoints with:
     - Request/response schemas
     - RBAC requirements
     - Example curl commands
     - Error codes and handling

3. **Developer Guide** (2 hours)
   - Create: `docs/development/external-agents-architecture.md`
   - Sections:
     - Architecture overview
     - DataFlow models
     - Service layer design
     - Webhook adapter development
     - Testing strategy

4. **Migration Guide** (1 hour)
   - Create: `docs/migration/external-agents-migration.md`
   - Steps for existing deployments:
     - Run database migration
     - Update environment variables
     - Restart services
     - Verify health checks

5. **CHANGELOG Update** (1 hour)
   - Add entry for External Integrations feature:
     ```markdown
     ## [2.1.0] - YYYY-MM-DD

     ### Added
     - External agent registration and management
     - Full invocation lineage tracking
     - Budget and rate limit enforcement
     - Webhook platform adapters (Teams, Discord, Slack, Telegram)
     - Lineage visualization UI
     - Comprehensive governance controls
     ```

6. **Release Notes** (1 hour)
   - Create: `docs/release-notes/v2.1.0.md`
   - Highlight features, breaking changes, upgrade path

7. **Final Code Review** (2 hours)
   - Review all code changes
   - Ensure Gold Standards compliance:
     - Absolute imports
     - NO MOCKING in Tiers 2-3
     - Parameter passing via dictionaries
     - Error handling with try/except
     - DataFlow for all database operations

8. **Deployment Verification** (2 hours)
   - Deploy to staging environment
   - Run smoke tests
   - Verify all features working
   - Test rollback procedure

**Milestone 6 Deliverable**: Production-ready release with complete documentation

---

## Risk Mitigation Strategy

### Risk 1: External Platform API Compatibility

**Risk**: Platform APIs (Teams, Discord, Slack) may change, breaking webhooks
**Probability**: Medium
**Impact**: Medium

**Mitigation**:
- Version webhook adapter implementations
- Add integration tests with real platform endpoints (run weekly)
- Monitor platform API changelogs
- Implement adapter health checks in production

**Contingency**:
- Fallback to generic webhook format if adapter fails
- Alert admin when adapter errors exceed threshold

---

### Risk 2: Performance Under Load

**Risk**: High invocation volume may overwhelm lineage tracking
**Probability**: Medium
**Impact**: High

**Mitigation**:
- Async logging (non-blocking)
- Database indexing on invocation queries
- Rate limiting per external agent
- Load testing before release

**Contingency**:
- Implement invocation sampling (log 10% of requests) if volume exceeds threshold
- Archive old invocations to cold storage after 90 days

---

### Risk 3: Security Vulnerabilities

**Risk**: API key leakage or unauthorized access
**Probability**: Low
**Impact**: Critical

**Mitigation**:
- Scoped API keys (external agents can't access admin endpoints)
- HTTPS-only for all communication
- API key rotation mechanism
- ABAC policy enforcement
- Security testing with OWASP ZAP

**Contingency**:
- API key revocation endpoint
- Audit trail for all key operations
- Alert on suspicious invocation patterns

---

### Risk 4: Dependency on Phase 1

**Risk**: Delays in Phase 1 block Phases 2-3
**Probability**: Low
**Impact**: High

**Mitigation**:
- Phase 4 (webhooks) can proceed in parallel
- Buffer time in estimates (3-4 days instead of 3)
- Daily standup to identify blockers early

**Contingency**:
- Parallelize Phase 2-3 work if Phase 1 complete early
- Reduce scope of lineage queries if time constrained

---

### Risk 5: Frontend Complexity

**Risk**: Lineage graph rendering may be complex and buggy
**Probability**: Medium
**Impact**: Medium

**Mitigation**:
- Use proven library (React Flow) instead of custom implementation
- Start with simple graph, iterate on features
- User testing with real data

**Contingency**:
- Ship basic table view first, add graph visualization in follow-up release
- Provide JSON export as alternative to graph

---

## Success Criteria

### Phase 1 Success Criteria
- [ ] ExternalAgent and ExternalAgentInvocation models deployed
- [ ] CRUD API endpoints functional
- [ ] Scoped API keys generated and validated
- [ ] Integration tests pass (>90% coverage)
- [ ] API documentation complete

### Phase 2 Success Criteria
- [ ] External invocations captured in ObservabilityManager
- [ ] Lineage query API returns correct graph structure
- [ ] Integration tests verify end-to-end lineage tracking
- [ ] <100ms overhead for lineage tracking

### Phase 3 Success Criteria
- [ ] Budget enforcement prevents over-budget invocations
- [ ] Rate limiting returns 429 when exceeded
- [ ] ABAC policies evaluated correctly
- [ ] Usage metrics API returns accurate data

### Phase 4 Success Criteria
- [ ] All 4 platform adapters (Teams, Discord, Slack, Telegram) functional
- [ ] Webhook delivery succeeds with <3s latency
- [ ] Retry logic handles transient failures
- [ ] Delivery status tracked in database

### Phase 5 Success Criteria
- [ ] External agent management UI functional
- [ ] Lineage graph renders correctly with real data
- [ ] Webhook configuration form validates platform-specific fields
- [ ] E2E tests pass for all user workflows
- [ ] WCAG 2.1 AA accessibility compliance

### Phase 6 Success Criteria
- [ ] >90% test coverage for new code
- [ ] Performance tests pass (p95 latency <200ms)
- [ ] Security scan shows no critical vulnerabilities
- [ ] Documentation complete and reviewed
- [ ] Staging deployment successful

---

## Dependencies and Blockers

### Internal Dependencies
- **Existing Services**: BillingService, ABACService, ObservabilityManager must be functional
- **DataFlow Framework**: All database operations use DataFlow nodes
- **Frontend Design System**: UI components use existing shadcn/ui library

### External Dependencies
- **Platform APIs**: Teams, Discord, Slack, Telegram webhook endpoints
- **Database**: PostgreSQL for production (migrations must be backward compatible)
- **Redis**: For rate limiting (must be deployed in production)

### Potential Blockers
1. **Database Migration Issues**: Test migrations on production copy before release
2. **RBAC Permissions**: Ensure `external_agents:*` permissions added to all relevant roles
3. **API Key Scoping**: Requires changes to auth middleware (coordinate with auth team)
4. **Frontend State Management**: Zustand store may conflict with existing stores (review architecture)

---

## Post-Release Activities

### Week 1 Post-Release
- [ ] Monitor error rates in production (target: <0.1% error rate)
- [ ] Collect user feedback via support tickets and surveys
- [ ] Review webhook delivery success rates (target: >99%)
- [ ] Analyze performance metrics (latency, throughput)

### Week 2 Post-Release
- [ ] Address critical bugs (P0 issues)
- [ ] Optimize slow queries identified in production
- [ ] Update documentation based on user feedback

### Month 1 Post-Release
- [ ] Retrospective with team (what went well, what to improve)
- [ ] Plan Phase 2 features:
  - Custom webhook templates
  - Advanced lineage analytics
  - Multi-region support
  - Webhook delivery SLA monitoring

---

## Appendix: Task Checklists

### Phase 1 Checklist
- [ ] Create ExternalAgent DataFlow model
- [ ] Create ExternalAgentInvocation DataFlow model
- [ ] Database migration created and tested
- [ ] ExternalAgentService implemented
- [ ] API key scoping added
- [ ] External agent router created
- [ ] Request/response schemas defined
- [ ] Integration tests written (>90% coverage)
- [ ] API documentation updated
- [ ] User guide created

### Phase 2 Checklist
- [ ] ObservabilityManager extended for external agents
- [ ] Lineage middleware created
- [ ] Invocation logger implemented
- [ ] Response middleware captures results
- [ ] Lineage query endpoints created
- [ ] Graph structure formatter implemented
- [ ] Integration tests for lineage
- [ ] Documentation updated

### Phase 3 Checklist
- [ ] BillingService integration complete
- [ ] Budget middleware implemented
- [ ] Rate limiting for external agents
- [ ] ABAC policy integration
- [ ] Governance configuration endpoints
- [ ] Usage dashboard data API
- [ ] Integration tests for governance
- [ ] Documentation updated

### Phase 4 Checklist
- [ ] BaseWebhookAdapter created
- [ ] Adapter registry implemented
- [ ] Teams adapter complete
- [ ] Discord adapter complete
- [ ] Slack adapter complete
- [ ] Telegram adapter complete
- [ ] WebhookDeliveryService implemented
- [ ] Retry logic with exponential backoff
- [ ] Delivery status tracking
- [ ] Integration tests for adapters

### Phase 5 Checklist
- [ ] External agents list page
- [ ] Create/edit external agent modal
- [ ] External agent detail page
- [ ] State management (Zustand)
- [ ] Lineage visualization component
- [ ] Invocations list with lineage
- [ ] Lineage detail modal
- [ ] Webhook configuration form
- [ ] Test webhook button
- [ ] Usage dashboard
- [ ] Accessibility improvements
- [ ] Component tests
- [ ] E2E tests

### Phase 6 Checklist
- [ ] Unit test coverage >90%
- [ ] Integration tests complete
- [ ] E2E tests complete
- [ ] Performance tests pass
- [ ] Security testing complete
- [ ] User documentation updated
- [ ] API reference updated
- [ ] Developer guide created
- [ ] Migration guide created
- [ ] CHANGELOG updated
- [ ] Release notes created
- [ ] Code review complete
- [ ] Staging deployment verified

---

## Team Roles and Responsibilities

### Backend Team
- **Lead**: Responsible for Phases 1-4
- **Developers**: 2-3 engineers
- **Focus**: DataFlow models, service layer, webhook adapters

### Frontend Team
- **Lead**: Responsible for Phase 5
- **Developers**: 2 engineers
- **Focus**: React components, state management, lineage visualization

### QA Team
- **Lead**: Responsible for Phase 6 testing
- **Engineers**: 1-2 QA engineers
- **Focus**: Integration testing, E2E testing, performance testing

### DevOps Team
- **Lead**: Responsible for deployment and infrastructure
- **Engineers**: 1 engineer
- **Focus**: Database migrations, Redis setup, staging/production deployment

### Documentation Team
- **Lead**: Responsible for Phase 6 documentation
- **Writers**: 1-2 technical writers
- **Focus**: User guides, API reference, migration guide

---

## Communication Plan

### Daily Standups
- **Time**: 9:00 AM
- **Duration**: 15 minutes
- **Participants**: All team members
- **Format**: What I did yesterday, what I'm doing today, blockers

### Weekly Progress Reviews
- **Time**: Friday 3:00 PM
- **Duration**: 1 hour
- **Participants**: Team leads + stakeholders
- **Format**: Demo completed features, review metrics, adjust timeline

### Phase Milestones
- **Format**: Full team demo + retrospective
- **Duration**: 2 hours
- **Deliverable**: Sign-off from stakeholders before next phase

### Ad-Hoc Communication
- **Slack Channel**: #external-integrations
- **For**: Quick questions, sharing findings, celebrating wins
- **Response SLA**: <2 hours during business hours

---

## Approval and Sign-Off

### Phase 1 Sign-Off
- [ ] Backend Lead
- [ ] QA Lead
- [ ] Product Manager

### Phase 2 Sign-Off
- [ ] Backend Lead
- [ ] QA Lead
- [ ] Product Manager

### Phase 3 Sign-Off
- [ ] Backend Lead
- [ ] QA Lead
- [ ] Product Manager

### Phase 4 Sign-Off
- [ ] Backend Lead
- [ ] QA Lead
- [ ] Product Manager

### Phase 5 Sign-Off
- [ ] Frontend Lead
- [ ] QA Lead
- [ ] UX Designer
- [ ] Product Manager

### Phase 6 Sign-Off (Final Release)
- [ ] Backend Lead
- [ ] Frontend Lead
- [ ] QA Lead
- [ ] DevOps Lead
- [ ] Documentation Lead
- [ ] Product Manager
- [ ] Engineering Director

---

**Document Version**: 1.0
**Last Updated**: 2025-12-20
**Next Review**: After Phase 3 completion
