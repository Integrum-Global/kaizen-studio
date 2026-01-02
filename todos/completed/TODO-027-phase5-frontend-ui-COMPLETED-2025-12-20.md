# TODO-027: Phase 5 - Frontend UI

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 3-4 days
**Dependencies**: TODO-023 (Phase 1), TODO-024 (Phase 2), TODO-025 (Phase 3), TODO-026 (Phase 4)

## Description
Implement comprehensive frontend UI for External Agents management including agent registration wizard (6-step flow), agent management page, agent details modal, enhanced webhooks configuration, invocation lineage viewer, and governance dashboard widgets. Built with React 19, TypeScript 5.3+, Tailwind CSS, shadcn/ui components, Zustand for state management, and React Query for server state.

## Acceptance Criteria
- [ ] External Agents page at /settings/external-agents with agent list, search, filtering
- [ ] Agent Registration Wizard (6 steps: Provider Selection, Basic Info, Authentication, Platform Config, Governance, Review)
- [ ] Agent Details Modal with tabs (Overview, Invocations, Lineage, Governance, Settings)
- [ ] Enhanced Webhooks configuration with platform-specific form fields
- [ ] Invocation Lineage Viewer with interactive graph visualization
- [ ] Governance Dashboard widgets (Budget Usage, Rate Limit Status, Policy Violations)
- [ ] WCAG 2.1 AA accessibility compliance (keyboard navigation, ARIA labels, screen reader support)
- [ ] Responsive design (Mobile 375px+, Tablet 768px+, Desktop 1024px+)
- [ ] Dark mode support for all components
- [ ] Real-time updates via React Query polling (30s interval for governance metrics)

## Dependencies
**External**:
- React 19, TypeScript 5.3+, Tailwind CSS 3.4+, shadcn/ui, Zustand 4.x, @tanstack/react-query 5.x
- Recharts 2.x for governance charts
- React Flow 11.x for lineage graph visualization

**Internal**:
- TODO-023: External Agents API endpoints
- TODO-024: Lineage API with external agent nodes
- TODO-025: Governance API endpoints
- TODO-026: Webhook platform adapters (for platform icon mapping)

## Risk Assessment
- **MEDIUM**: Wizard flow complexity may confuse users (usability testing required)
- **MEDIUM**: Lineage graph performance with large workflows (>100 nodes)
- **LOW**: React Query cache invalidation must be correct for governance metrics
- **LOW**: Responsive design must work on all device sizes

## Subtasks

### Day 1: External Agents Page + Agent Registration Wizard (Steps 1-3) (Est: 6-8h)
- [ ] Create ExternalAgentsPage component with shadcn Table (2h)
  - Verification: Page renders at /settings/external-agents, displays agent list with columns (Name, Provider, Status, Last Invocation, Actions), search input filters by name, status filter dropdown (Active, Inactive, Deleted)
- [ ] Implement useExternalAgents React Query hook (1h)
  - Verification: Hook fetches GET /api/external-agents with pagination, caching, refetchInterval=30s
- [ ] Create ExternalAgentRegistrationWizard component with 6-step flow (1h)
  - Verification: Wizard renders with stepper UI (Step 1/6 → Step 6/6), navigation buttons (Back, Next, Submit), form state persisted across steps
- [ ] Implement Step 1: Provider Selection (1h)
  - Verification: Radio buttons for Teams, Discord, Slack, Telegram, Notion with platform icons, provider selection updates wizard state
- [ ] Implement Step 2: Basic Information (1h)
  - Verification: Form fields (Name, Description, Tags), validation (name required, min 3 chars), error messages display below fields
- [ ] Implement Step 3: Authentication Configuration (2h)
  - Verification: Auth type selector (API Key, OAuth2, Custom), conditional form fields based on auth type (API Key: key + header_name, OAuth2: client_id + client_secret + token_url, Custom: JSON editor), JSON schema validation

### Day 2: Agent Registration Wizard (Steps 4-6) + Agent Details Modal (Est: 6-8h)
- [ ] Implement Step 4: Platform Configuration (2h)
  - Verification: Conditional form fields based on provider (Teams: tenant_id + channel_id, Discord: webhook_url + username, Slack: webhook_url + channel, Telegram: bot_token + chat_id, Notion: token + database_id), platform-specific validation (webhook URL format, UUID format for IDs)
- [ ] Implement Step 5: Governance Settings (2h)
  - Verification: Budget config form (max_cost_per_invocation, max_monthly_cost, currency dropdown), rate limit config form (requests_per_minute, requests_per_hour, requests_per_day), validation (all values >= 0)
- [ ] Implement Step 6: Review and Submit (1h)
  - Verification: Summary table shows all configured values (provider, name, auth type, platform config, governance limits), "Edit Step X" buttons navigate back to specific steps, Submit button calls POST /api/external-agents, loading state during submission
- [ ] Create ExternalAgentDetailsModal component with tabs (1h)
  - Verification: Modal opens on agent row click, tabs (Overview, Invocations, Lineage, Governance, Settings), tab navigation works, modal closes on X button or Escape key

### Day 3: Agent Details Modal Tabs + Lineage Viewer (Est: 6-8h)
- [ ] Implement Overview tab in ExternalAgentDetailsModal (1h)
  - Verification: Displays agent metadata (provider, status, created_at, last_invocation_at), auth config (masked credentials), platform config, tags
- [ ] Implement Invocations tab with pagination (2h)
  - Verification: Table displays invocations (Timestamp, Status, Execution Time, Response Code), pagination controls, click row opens invocation detail panel with request/response payloads, error messages for failed invocations
- [ ] Implement Lineage tab with LineageViewer component (2h)
  - Verification: Interactive lineage graph using React Flow, external agent nodes have purple border (#8B5CF6), platform icon overlay, tooltip on hover shows provider and webhook URL, click node opens hop detail panel
- [ ] Implement Governance tab with metrics (1h)
  - Verification: Budget usage chart (month-to-date cost vs limit), rate limit gauges (per-minute, per-hour, per-day remaining), policy evaluation results table (policy name, decision, timestamp)

### Day 4: Enhanced Webhooks + Governance Widgets + Polish (Est: 6-8h)
- [ ] Create EnhancedWebhooksConfig component (2h)
  - Verification: Webhook delivery status indicator (pending, delivered, failed), retry configuration UI (max retries, backoff strategy), webhook test button sends test payload and displays result, delivery logs table shows recent deliveries with timestamps and status
- [ ] Create Budget Usage Widget for dashboard (1h)
  - Verification: Recharts bar chart showing daily cost for current month, budget limit line, color changes to red when >90% of budget, click opens detailed budget breakdown
- [ ] Create Rate Limit Status Widget for dashboard (1h)
  - Verification: Three gauges (per-minute, per-hour, per-day) with remaining/limit values, color changes to yellow when >80% used, red when >95% used
- [ ] Implement accessibility features (1h)
  - Verification: All interactive elements keyboard navigable (Tab, Enter, Escape), ARIA labels on all form fields and buttons, screen reader announces wizard step changes, focus management on modal open/close
- [ ] Implement responsive design (1h)
  - Verification: Mobile (<768px): Wizard steps stacked vertically, table scrolls horizontally. Tablet (768-1024px): Wizard steps 2-column layout, table shows 4 columns. Desktop (>1024px): Wizard steps side-by-side, table shows all columns

## Testing Requirements

### Tier 1: Unit Tests (src/features/external-agents/__tests__/components/)
**Intent**: Verify component rendering and state management in isolation (React Testing Library)
- [ ] Test ExternalAgentRegistrationWizard navigation (forward/backward)
  - Intent: Ensure wizard step navigation updates state correctly
- [ ] Test ExternalAgentRegistrationWizard form validation
  - Intent: Verify validation errors prevent progression to next step
- [ ] Test ExternalAgentRegistrationWizard provider selection updates form fields
  - Intent: Ensure platform-specific fields appear based on provider choice
- [ ] Test ExternalAgentDetailsModal tab switching
  - Intent: Verify tab state management and content rendering
- [ ] Test LineageViewer renders external agent nodes with correct styles
  - Intent: Ensure external agent nodes have purple border and platform icon
- [ ] Test Budget Usage Widget renders chart with correct data
  - Intent: Verify Recharts integration and data transformation
- [ ] Test Rate Limit Status Widget color changes based on usage percentage
  - Intent: Ensure visual indicators (yellow >80%, red >95%) work correctly

### Tier 2: Integration Tests (e2e/ using Playwright)
**Intent**: Verify UI workflows with real backend API (NO MOCKING of API)
- [ ] Test complete External Agent registration workflow
  - Intent: Verify end-to-end wizard flow from provider selection to submission
  - Setup: Real backend API, authenticated test user, clean database
  - Steps:
    1. Navigate to /settings/external-agents
    2. Click "Register External Agent" button
    3. Select Teams provider
    4. Fill basic info (name="Test Agent", description="Test")
    5. Configure API Key auth (key="test-key", header="X-API-Key")
    6. Configure Teams platform (tenant_id="test-tenant", channel_id="test-channel")
    7. Set governance (max_monthly_cost=100, requests_per_minute=10)
    8. Review and submit
  - Assertions: Agent appears in agent list, database record created, success toast displayed
- [ ] Test External Agent details modal navigation
  - Intent: Verify modal tabs load correct data from API
  - Setup: Real backend API, existing ExternalAgent with invocations and lineage
  - Steps:
    1. Navigate to /settings/external-agents
    2. Click agent row
    3. Click "Invocations" tab
    4. Click "Lineage" tab
    5. Click "Governance" tab
  - Assertions: Invocations table displays data from GET /api/external-agents/{id}/invocations, lineage graph displays data from GET /api/lineage/graph, governance metrics display data from GET /api/external-agents/{id}/governance-status
- [ ] Test governance dashboard widgets update in real-time
  - Intent: Verify React Query polling updates governance metrics
  - Setup: Real backend API, existing ExternalAgent, simulate invocation that changes budget usage
  - Steps:
    1. Navigate to /dashboard
    2. Observe initial budget widget value
    3. Trigger external agent invocation via API (not UI)
    4. Wait 30 seconds (polling interval)
  - Assertions: Budget widget updates to show increased usage, no full page reload

### Tier 3: End-to-End Tests (e2e/ using Playwright with real infrastructure)
**Intent**: Verify complete user workflows with real infrastructure (NO MOCKING)
- [ ] Test complete External Agent lifecycle with lineage visualization
  - Intent: Verify end-to-end flow from registration through invocation to lineage viewing
  - Setup: Real PostgreSQL, real Redis, real backend API, mock webhook server
  - Steps:
    1. Register External Agent via wizard (Teams provider)
    2. Navigate to /pipelines and create workflow with external agent invocation
    3. Execute workflow
    4. Navigate to /settings/external-agents and click agent
    5. View lineage graph in Lineage tab
  - Assertions: Lineage graph shows workflow A → External Agent B → (webhook callback), external agent node has purple border and Teams icon
- [ ] Test governance enforcement in UI
  - Intent: Verify governance limits prevent invocations and display errors
  - Setup: Real PostgreSQL, real Redis, ExternalAgent with max_monthly_cost=10 and current usage=9
  - Steps:
    1. Navigate to /settings/external-agents and click agent
    2. Click Governance tab and observe budget widget showing $9/$10
    3. Attempt invocation that costs $2
  - Assertions: Invocation fails with 402 error, error toast displays "Budget exceeded", budget widget updates to show $9/$10 (no change), invocation does not appear in Invocations tab
- [ ] Test accessibility with keyboard navigation
  - Intent: Verify all features accessible without mouse
  - Setup: Real backend API, authenticated test user
  - Steps:
    1. Navigate to /settings/external-agents using Tab key
    2. Open wizard using Enter key
    3. Navigate wizard steps using Tab/Shift+Tab/Enter
    4. Submit form using Enter key
    5. Open agent details modal using Enter key
    6. Navigate tabs using Arrow keys
    7. Close modal using Escape key
  - Assertions: All actions complete successfully, focus indicators visible, no keyboard traps

## Documentation Requirements
- [ ] Update docs/06-gateways/external-agents-ui.md with UI component architecture
  - Component tree, state management patterns, React Query hooks, Zustand store schema
- [ ] Create External Agents user guide in docs/06-gateways/external-agents-user-guide.md
  - Step-by-step wizard instructions, screenshots for each step, troubleshooting common errors
- [ ] Add accessibility documentation in docs/06-gateways/external-agents-accessibility.md
  - Keyboard shortcuts, screen reader support, WCAG 2.1 AA compliance checklist
- [ ] Create lineage visualization guide in docs/06-gateways/lineage-visualization.md
  - Graph interaction instructions, node type legend, filtering and zooming features

## Definition of Done
- [ ] All acceptance criteria met
- [ ] All Tier 1 unit tests passing (7+ component tests)
- [ ] All Tier 2 integration tests passing (3+ Playwright tests with real API)
- [ ] All Tier 3 E2E tests passing (3+ Playwright tests with real infrastructure)
- [ ] Code review completed
- [ ] No TypeScript errors, no ESLint warnings
- [ ] WCAG 2.1 AA accessibility audit completed (using axe DevTools)
- [ ] Responsive design tested on mobile (iPhone 13), tablet (iPad Air), desktop (1920x1080)
- [ ] Dark mode tested on all pages and components
- [ ] All documentation files created and reviewed
- [ ] Screenshots added to user guide
- [ ] Phase 5 deliverables ready for Phase 6 final testing

## Notes
- Wizard UX should be tested with 2-3 real users to validate flow
- Lineage graph performance should be tested with workflows containing 50+ nodes
- React Query cache invalidation is critical for governance metrics - ensure refetchInterval is appropriate
- Platform icons should be SVG for crisp rendering at all sizes
- Error messages should be user-friendly and actionable (not just API error codes)
- Loading states should be implemented for all async operations (skeleton screens preferred)
