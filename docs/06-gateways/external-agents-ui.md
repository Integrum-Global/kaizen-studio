# External Agents UI - Component Architecture

## Overview

The External Agents UI is a comprehensive React-based interface for managing external agent integrations with webhook platforms (Teams, Discord, Slack, Telegram, Notion). Built with React 19, TypeScript 5.3+, and shadcn/ui components, it provides a complete workflow for registering, viewing, and monitoring external agents.

## Architecture

### Feature Structure

```
features/external-agents/
├── api/                      # API client layer
│   ├── external-agents.ts   # RESTful API functions
│   └── index.ts             # Public exports
├── components/              # React components
│   ├── details/             # Detail view components
│   │   ├── InvocationsTab.tsx       # Invocation history table
│   │   ├── LineageViewer.tsx        # React Flow lineage visualization
│   │   └── GovernanceTab.tsx        # Governance metrics display
│   ├── widgets/             # Reusable widgets
│   │   ├── BudgetUsageWidget.tsx    # Recharts budget chart
│   │   └── RateLimitStatusWidget.tsx # Rate limit gauges
│   ├── wizard/              # Registration wizard steps
│   │   ├── ProviderSelectionStep.tsx
│   │   ├── BasicInformationStep.tsx
│   │   ├── AuthenticationConfigStep.tsx
│   │   ├── PlatformConfigStep.tsx
│   │   ├── GovernanceSettingsStep.tsx
│   │   └── ReviewAndSubmitStep.tsx
│   ├── ExternalAgentsPage.tsx          # Main list view
│   ├── ExternalAgentRegistrationWizard.tsx  # 6-step wizard
│   ├── ExternalAgentDetailsModal.tsx   # Details modal with tabs
│   └── index.ts             # Component exports
├── hooks/                   # React Query hooks
│   ├── useExternalAgents.ts # Server state management
│   └── index.ts             # Hook exports
├── types/                   # TypeScript types
│   ├── external-agent.ts    # Type definitions
│   └── index.ts             # Type exports
├── __tests__/               # Unit tests
│   ├── ExternalAgentRegistrationWizard.test.tsx
│   ├── ExternalAgentsPage.test.tsx
│   ├── BudgetUsageWidget.test.tsx
│   └── RateLimitStatusWidget.test.tsx
└── index.ts                 # Feature public exports
```

### Component Tree

```
ExternalAgentsPage
├── ExternalAgentRegistrationWizard (Dialog)
│   ├── ProgressStepper
│   ├── ProviderSelectionStep
│   ├── BasicInformationStep
│   ├── AuthenticationConfigStep
│   ├── PlatformConfigStep
│   ├── GovernanceSettingsStep
│   └── ReviewAndSubmitStep
├── ExternalAgentDetailsModal (Dialog)
│   ├── Overview Tab
│   ├── InvocationsTab
│   │   ├── InvocationStatusBadge
│   │   └── InvocationDetails (expandable rows)
│   ├── LineageViewer
│   │   ├── ExternalAgentNode (purple border)
│   │   ├── WorkflowNode
│   │   └── WebhookNode
│   └── GovernanceTab
│       ├── BudgetUsageWidget
│       │   └── RechartsBarChart
│       └── RateLimitStatusWidget
│           └── RateLimitGauge (x3)
└── Table with agent rows
```

## State Management

### Server State (React Query)

All API data is managed through React Query hooks with proper caching and invalidation:

```typescript
// List agents with auto-refresh
const { data: agents } = useExternalAgents(filters); // 30s stale time, 30s refetch

// Get single agent
const { data: agent } = useExternalAgent(id);

// Mutations with cache invalidation
const createAgent = useCreateExternalAgent();
const updateAgent = useUpdateExternalAgent();
const deleteAgent = useDeleteExternalAgent();
const invokeAgent = useInvokeExternalAgent();

// Related data with polling
const { data: invocations } = useExternalAgentInvocations(agentId); // 10s stale
const { data: governance } = useExternalAgentGovernance(agentId); // 10s stale, 30s refetch
const { data: lineage } = useExternalAgentLineage(agentId); // 60s stale
```

### Local State

Component-level state for UI interactions:

- `ExternalAgentsPage`: filters, search query, selected agent, modal states
- `ExternalAgentRegistrationWizard`: current step, form data (WizardFormData)
- `InvocationsTab`: expanded rows (Set<string>)

### Form State

Wizard form data persisted across steps:

```typescript
interface WizardFormData {
  provider?: ExternalAgentProvider;
  name: string;
  description: string;
  tags: string[];
  authConfig?: AuthConfig;
  platformConfig?: PlatformConfig;
  governanceConfig: GovernanceConfig;
}
```

## Data Flow

### Registration Flow

1. User opens wizard → `ExternalAgentRegistrationWizard` mounts
2. User selects provider → Updates `formData.provider`
3. User fills basic info → Updates `formData.name`, `formData.description`, `formData.tags`
4. User configures auth → Updates `formData.authConfig`
5. User configures platform → Updates `formData.platformConfig` (provider-specific)
6. User sets governance → Updates `formData.governanceConfig` (optional)
7. User reviews → Displays all `formData` for confirmation
8. User submits → `createAgent.mutateAsync(request)`
9. On success → Cache invalidated, agent appears in list, wizard closes

### Details Modal Flow

1. User clicks agent row → `ExternalAgentDetailsModal` opens with agent data
2. Overview tab → Displays cached `agent` data
3. Invocations tab → `useExternalAgentInvocations(agentId)` fetches invocations
4. Lineage tab → `useExternalAgentLineage(agentId)` fetches lineage graph
5. Governance tab → `useExternalAgentGovernance(agentId)` fetches metrics (polls every 30s)
6. User closes modal → React Query cache persists for 30s-60s (staleTime)

## API Integration

### Endpoints

| Method | Endpoint | Hook | Purpose |
|--------|----------|------|---------|
| GET | `/api/v1/external-agents` | `useExternalAgents` | List agents with filters |
| GET | `/api/v1/external-agents/:id` | `useExternalAgent` | Get agent details |
| POST | `/api/v1/external-agents` | `useCreateExternalAgent` | Create new agent |
| PATCH | `/api/v1/external-agents/:id` | `useUpdateExternalAgent` | Update agent |
| DELETE | `/api/v1/external-agents/:id` | `useDeleteExternalAgent` | Delete agent |
| POST | `/api/v1/external-agents/:id/invoke` | `useInvokeExternalAgent` | Invoke agent |
| GET | `/api/v1/external-agents/:id/invocations` | `useExternalAgentInvocations` | Get invocation history |
| GET | `/api/v1/external-agents/:id/governance-status` | `useExternalAgentGovernance` | Get governance metrics |
| GET | `/api/v1/lineage/graph?agent_id=:id` | `useExternalAgentLineage` | Get lineage graph |

### Cache Invalidation Strategy

```typescript
// On create: Invalidate lists, set detail cache
onSuccess: (newAgent) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.externalAgents.lists() });
  queryClient.setQueryData(queryKeys.externalAgents.detail(newAgent.id), newAgent);
}

// On update: Invalidate lists, update detail cache
onSuccess: (updatedAgent) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.externalAgents.lists() });
  queryClient.setQueryData(queryKeys.externalAgents.detail(updatedAgent.id), updatedAgent);
}

// On delete: Invalidate lists, remove detail cache
onSuccess: (_, id) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.externalAgents.lists() });
  queryClient.removeQueries({ queryKey: queryKeys.externalAgents.detail(id) });
}

// On invoke: Invalidate invocations, governance, and agent detail
onSuccess: (_, { id }) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.externalAgents.invocations(id) });
  queryClient.invalidateQueries({ queryKey: queryKeys.externalAgents.governance(id) });
  queryClient.invalidateQueries({ queryKey: queryKeys.externalAgents.detail(id) });
}
```

## Visualization Components

### LineageViewer (React Flow)

Uses React Flow 11.x for interactive lineage visualization:

```typescript
// Custom node types
const nodeTypes = {
  externalAgent: ExternalAgentNode,  // Purple border #8B5CF6
  workflow: WorkflowNode,             // Blue border
  webhook: WebhookNode,               // Gray border
};

// ExternalAgentNode features:
// - Purple border (border-2 border-purple-500)
// - Platform icon (Teams, Discord, Slack, Telegram, Notion)
// - Provider badge
// - Webhook URL tooltip
```

### BudgetUsageWidget (Recharts)

Bar chart with reference line:

```typescript
// Color coding based on percentage_used:
// - Red: > 90%
// - Yellow: 80-90%
// - Blue/Green: < 80%

// Components:
// - BarChart with current month cost
// - ReferenceLine for budget limit
// - Warning alert when > 90%
// - Notice alert when 80-90%
```

### RateLimitStatusWidget

Three Progress gauges (per-minute, per-hour, per-day):

```typescript
// Color coding based on percentage used:
// - Red: > 95% ("Rate limit exceeded")
// - Yellow: 80-95% ("Approaching rate limit")
// - Green: < 80%

// Each gauge shows:
// - Current / Limit
// - Remaining count
// - Percentage used (progress bar)
```

## Accessibility Features

### Keyboard Navigation

- All interactive elements accessible via Tab key
- Enter/Space to activate buttons, radio buttons, checkboxes
- Escape to close dialogs
- Arrow keys for tab navigation within modals

### ARIA Attributes

```typescript
// Dialogs
<Dialog aria-labelledby="wizard-title" aria-describedby="wizard-description">

// Form fields
<Label htmlFor="name" className="required">Name</Label>
<Input id="name" aria-required="true" aria-describedby="name-error" />
<p id="name-error">Name must be at least 3 characters</p>

// Tables
<TableRow
  role="button"
  tabIndex={0}
  aria-label={`View details for ${agent.name}`}
/>

// Progress stepper
<div aria-current={step === currentStep ? "step" : undefined}>
```

### Focus Management

- Focus trapped within open dialogs
- Focus returns to trigger element on modal close
- Visible focus indicators on all interactive elements
- No keyboard traps (Escape always works)

## Responsive Design

### Breakpoints (Tailwind CSS)

- **Mobile** (<768px): sm breakpoint
  - Stacked layouts
  - Full-width components
  - Horizontal scroll for tables
- **Tablet** (768-1024px): md breakpoint
  - 2-column layouts
  - Grid layouts for wizard steps
- **Desktop** (>1024px): lg breakpoint
  - Full layouts
  - All columns visible in tables

### Responsive Patterns

```typescript
// Flex layouts
<div className="flex flex-col sm:flex-row gap-4">

// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Conditional rendering
<Show above="md">
  <DesktopNav />
</Show>
<Hide above="md">
  <MobileNav />
</Hide>
```

## Dark Mode Support

All components support dark mode via Tailwind dark: prefix:

```typescript
// Color classes
className="bg-white dark:bg-gray-950"
className="text-gray-900 dark:text-gray-100"
className="border-gray-200 dark:border-gray-800"

// Badge colors
className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
```

## Performance Optimizations

1. **React Query Caching**: 30s-60s stale time reduces API calls
2. **Auto-Refetch**: 30s interval only for governance metrics (real-time updates)
3. **Skeleton Loading**: No spinners, skeleton screens for better UX
4. **Lazy Rendering**: Modals/tabs render only when opened
5. **Optimistic Updates**: UI updates immediately, syncs with server
6. **Debounced Search**: Search input debounced to reduce API calls

## Testing Strategy

### Tier 1: Unit Tests (React Testing Library)

- Component rendering and state management
- User interactions (clicks, form fills)
- Validation logic
- Conditional rendering

### Tier 2: Integration Tests (Playwright + Real API)

- Complete workflows (registration, details viewing)
- API integration (NO MOCKING)
- Form submissions and data persistence
- Real-time updates (polling)

### Tier 3: E2E Tests (Playwright + Real Infrastructure)

- Full user journeys (register → invoke → view lineage)
- Governance enforcement (budget limits, rate limits)
- Accessibility (keyboard navigation)
- Cross-browser testing

## Architectural Decisions

### Why React Query?

- Automatic caching and invalidation
- Built-in loading and error states
- Polling support for real-time updates
- Optimistic updates
- No need for additional state management library

### Why shadcn/ui?

- Headless components (full control over styling)
- Accessible by default (WCAG 2.1 AA)
- Tailwind CSS integration
- Dark mode support
- No runtime overhead (components copied into project)

### Why React Flow?

- Interactive graph visualization
- Custom node types (purple borders for external agents)
- Built-in zoom, pan, minimap
- Performant rendering for large graphs
- TypeScript support

### Why Recharts?

- Simple, declarative API
- Responsive charts
- Customizable styling
- TypeScript support
- No canvas rendering (SVG for accessibility)

## File Statistics

- **Total Files**: 27
- **Total Lines**: ~3,500
- **Components**: 15
- **Hooks**: 9
- **Tests**: 7 test files (30+ test cases)
- **Documentation**: 4 files

## Future Enhancements

1. **Pagination**: Add infinite scroll or pagination for agent list
2. **Bulk Operations**: Select multiple agents for bulk delete/update
3. **Export**: Export agent configurations as JSON
4. **Import**: Import agents from JSON
5. **Webhook Testing**: Test webhook endpoints before registration
6. **Advanced Filters**: Filter by provider, tags, date ranges
7. **Agent Templates**: Save and reuse agent configurations
8. **Notifications**: Real-time notifications for invocation failures
