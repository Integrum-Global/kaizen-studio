# TODO-024: Phase 2 - Auth Lineage Integration

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 2-3 days
**Dependencies**: TODO-023 (Phase 1 - External Agent Model + API)

## Description
Integrate External Agent invocations with the Auth Lineage system using ObservabilityManager. This enables complete traceability of external agent calls within multi-hop agent workflows, showing authentication propagation and trust boundaries.

## Acceptance Criteria
- [ ] ObservabilityManager extended with external_agent_invocation event type
- [ ] LineageHop model updated with external_agent_id field (nullable FK to ExternalAgent)
- [ ] Lineage middleware captures External Agent invocations and creates LineageHop records
- [ ] ExternalAgentService.log_invocation() fully integrated with ObservabilityManager (replaces Phase 1 stub)
- [ ] Lineage graph API returns External Agent nodes with distinct visual representation
- [ ] External Agent invocations appear in Auth Lineage Viewer UI with platform icons and metadata
- [ ] Lineage queries support filtering by external_agent_id
- [ ] Webhook delivery events linked to External Agent invocations in lineage graph

## Dependencies
**External**:
- ObservabilityManager from Kaizen Framework (apps/kailash-kaizen)
- LineageHop DataFlow model (existing)
- Auth Lineage API (existing)

**Internal**:
- TODO-023: ExternalAgent and ExternalAgentInvocation models
- TODO-023: ExternalAgentService with invoke_agent() method

## Risk Assessment
- **HIGH**: LineageHop schema changes must be backward compatible with existing lineage data
- **MEDIUM**: ObservabilityManager integration must not impact performance of external agent invocations
- **MEDIUM**: Lineage graph queries must remain performant with external agent nodes added
- **LOW**: Frontend lineage viewer must handle new node types gracefully

## Subtasks

### Day 1: ObservabilityManager Extension (Est: 6-8h)
- [ ] Add external_agent_invocation event type to ObservabilityManager (2h)
  - Verification: ObservabilityManager.log_event() accepts event_type='external_agent_invocation' with metadata (external_agent_id, provider, webhook_url, request_payload, response_payload, execution_time_ms)
- [ ] Update LineageHop model to include external_agent_id field (2h)
  - Verification: DataFlow migration adds external_agent_id column (nullable FK to ExternalAgent), field appears in LineageHop model
- [ ] Update LineageHop model to include external_metadata JSON field (1h)
  - Verification: DataFlow migration adds external_metadata JSONB column, stores platform-specific metadata (Teams tenant_id, Discord username, Slack channel, etc.)
- [ ] Run DataFlow migrations for LineageHop schema changes (1h)
  - Verification: PostgreSQL schema updated, existing lineage_hop records unaffected (external_agent_id=NULL for old records)
- [ ] Create ObservabilityManager helper method create_external_agent_lineage_hop() (2h)
  - Verification: Method creates LineageHop with external_agent_id, external_metadata, event_type='external_agent_invocation', links to parent hop if provided

### Day 2: Service Layer Integration (Est: 6-8h)
- [ ] Replace ExternalAgentService.log_invocation() stub with full ObservabilityManager integration (3h)
  - Verification: log_invocation() calls ObservabilityManager.create_external_agent_lineage_hop(), creates both ExternalAgentInvocation and LineageHop records, links LineageHop to initiating agent's hop
- [ ] Add lineage_hop_id to ExternalAgentInvocation model (1h)
  - Verification: DataFlow migration adds lineage_hop_id column (nullable FK to LineageHop), field appears in ExternalAgentInvocation model
- [ ] Update invoke_agent() to accept parent_lineage_hop_id parameter (2h)
  - Verification: invoke_agent(external_agent_id, payload, parent_lineage_hop_id) creates child LineageHop linked to parent
- [ ] Create lineage middleware for External Agent API (2h)
  - Verification: Middleware extracts current lineage_hop_id from request context, passes to invoke_agent(), ensures lineage continuity across API boundaries

### Day 3: API + UI Integration (Est: 6-8h)
- [ ] Update GET /api/lineage/graph endpoint to include External Agent nodes (2h)
  - Verification: Lineage graph response includes nodes with type='external_agent', metadata includes external_agent_id, provider, platform_config
- [ ] Update GET /api/lineage/hops endpoint to support external_agent_id filter (1h)
  - Verification: /api/lineage/hops?external_agent_id=X returns all hops for specific external agent
- [ ] Add External Agent node rendering to LineageViewer component (2h)
  - Verification: External Agent nodes display with platform icons (Teams, Discord, Slack, Telegram, Notion), distinct border color (#8B5CF6), tooltip shows provider and webhook_url
- [ ] Add External Agent hop details to LineageHop detail panel (1h)
  - Verification: Clicking External Agent node shows external_metadata, request/response payloads, execution_time_ms
- [ ] Integration test: Create multi-hop workflow with external agent invocation (2h)
  - Verification: Internal Agent A → External Agent B → Internal Agent C creates complete lineage graph with all 3 nodes

## Testing Requirements

### Tier 1: Unit Tests (tests/unit/services/test_observability_external_agent.py)
**Intent**: Verify ObservabilityManager extension logic in isolation
- [ ] Test create_external_agent_lineage_hop() creates LineageHop with external_agent_id
  - Intent: Ensure External Agent hops are created with correct fields
- [ ] Test create_external_agent_lineage_hop() links to parent hop
  - Intent: Verify parent-child lineage relationship preservation
- [ ] Test create_external_agent_lineage_hop() stores external_metadata
  - Intent: Ensure platform-specific metadata is persisted
- [ ] Test log_invocation() creates both ExternalAgentInvocation and LineageHop
  - Intent: Verify dual record creation for invocation tracking
- [ ] Test log_invocation() handles missing parent_lineage_hop_id gracefully
  - Intent: Ensure orphan hops are created when parent is unavailable

### Tier 2: Integration Tests (tests/integration/test_external_agent_lineage.py)
**Intent**: Verify lineage integration with real PostgreSQL database (NO MOCKING)
- [ ] Test External Agent invocation creates LineageHop in database
  - Intent: Verify end-to-end lineage creation with real database persistence
  - Setup: Real PostgreSQL, existing ExternalAgent, mock webhook server
  - Assertions: Database query confirms LineageHop record exists with external_agent_id, ExternalAgentInvocation.lineage_hop_id points to created LineageHop
- [ ] Test multi-hop workflow creates linked lineage graph
  - Intent: Verify parent-child lineage relationships across multiple hops
  - Setup: Real PostgreSQL, existing ExternalAgent, mock internal agent workflow
  - Steps:
    1. Internal Agent A creates LineageHop (hop_1)
    2. Internal Agent A invokes External Agent B with parent_lineage_hop_id=hop_1 (creates hop_2)
    3. External Agent B triggers Internal Agent C (creates hop_3 linked to hop_2)
  - Assertions: Database query confirms hop_2.parent_hop_id=hop_1, hop_3.parent_hop_id=hop_2, complete lineage graph from A→B→C
- [ ] Test GET /api/lineage/graph includes External Agent nodes
  - Intent: Verify lineage API returns External Agent nodes with correct metadata
  - Setup: Real PostgreSQL with multi-hop lineage including external agent
  - Assertions: API response includes node with type='external_agent', external_agent_id field populated
- [ ] Test GET /api/lineage/hops filters by external_agent_id
  - Intent: Verify filtering logic with real database queries
  - Setup: Real PostgreSQL with 10 LineageHops (5 for external_agent_id=1, 5 for external_agent_id=2)
  - Assertions: /api/lineage/hops?external_agent_id=1 returns exactly 5 hops

### Tier 3: End-to-End Tests (tests/e2e/test_external_agent_lineage_workflow.py)
**Intent**: Verify complete lineage tracking with real infrastructure (NO MOCKING)
- [ ] Test complete multi-hop workflow with lineage visualization
  - Intent: Verify end-to-end lineage tracking from internal agent through external agent back to internal agent
  - Setup: Real PostgreSQL, real Redis, mock webhook server, mock internal agent runtime
  - Steps:
    1. Internal Agent A (Kaizen agent) starts workflow, creates initial LineageHop
    2. Agent A invokes External Agent B (Teams webhook) via POST /api/external-agents/{id}/invoke
    3. External Agent B processes request, calls back to Internal Agent C via webhook
    4. Agent C completes workflow
    5. Query GET /api/lineage/graph for workflow_id
    6. Render lineage in frontend (screenshot test)
  - Assertions: Lineage graph shows A→B→C with correct node types, external_metadata includes Teams tenant_id, frontend displays platform icon for Teams
- [ ] Test lineage tracking with failed external agent invocation
  - Intent: Verify lineage captures failures and error metadata
  - Setup: Real PostgreSQL, mock webhook server (returns 500)
  - Steps:
    1. Internal Agent A invokes External Agent B
    2. Webhook server returns 500 error
    3. Query lineage for workflow_id
  - Assertions: LineageHop created with status='failed', error_message populated, frontend shows red error indicator on External Agent node

## Documentation Requirements
- [ ] Update docs/05-infrastructure/auth-lineage.md with External Agent integration
  - Section on External Agent nodes in lineage graph, external_metadata schema examples
- [ ] Add ObservabilityManager extension documentation to docs/05-infrastructure/observability.md
  - create_external_agent_lineage_hop() method signature, event_type='external_agent_invocation' schema
- [ ] Update API documentation in docs/05-infrastructure/lineage-api.md
  - GET /api/lineage/graph External Agent node schema, GET /api/lineage/hops external_agent_id filter
- [ ] Create lineage visualization guide in docs/06-gateways/external-agent-lineage-visualization.md
  - Screenshots of lineage viewer with External Agent nodes, platform icon legend

## Definition of Done
- [ ] All acceptance criteria met
- [ ] All Tier 1 unit tests passing (5+ tests)
- [ ] All Tier 2 integration tests passing (4+ tests with real PostgreSQL)
- [ ] All Tier 3 E2E tests passing (2+ tests with real infrastructure)
- [ ] Code review completed
- [ ] No linting errors (ruff, mypy)
- [ ] All documentation files updated and reviewed
- [ ] Database migrations tested on database with existing lineage data (backward compatibility verified)
- [ ] Frontend lineage viewer displays External Agent nodes correctly (visual QA completed)
- [ ] Phase 2 deliverables ready for Phase 3 governance integration

## Notes
- Backward compatibility is CRITICAL - existing lineage data must not be affected by schema changes
- Performance impact must be minimal - lineage creation should add <50ms to external agent invocations
- Frontend changes require coordination with TODO-027 (Phase 5 - Frontend UI)
- External Agent lineage nodes should be visually distinct from internal agent nodes (different color, icon)
