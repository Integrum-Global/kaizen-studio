# Trust Management Feature

Enterprise Agent Trust Protocol (EATP) frontend implementation for Kaizen Studio.

## Purpose

The Trust feature provides UI components for managing cryptographic trust chains between AI agents. It enables:

- Viewing trust status and verification results
- Establishing new trust relationships
- Delegating capabilities to other agents
- Revoking trust when needed
- Auditing trust-related actions

## Architecture

```
src/features/trust/
├── api/           # API client functions
├── components/    # React components
├── hooks/         # React Query hooks
├── store/         # Zustand state management
├── types/         # TypeScript types
├── __tests__/     # Unit tests
└── docs/          # Feature documentation
```

## Key Concepts

### Trust Chain
A cryptographic chain of records that proves an agent's authority and capabilities. Contains:
- Genesis record (origin of trust)
- Capability attestations (what the agent can do)
- Delegation records (trust passed from other agents)
- Constraint envelopes (limits on capabilities)
- Audit anchors (action history)

### Trust Status
- **VALID** - Trust is verified and active
- **EXPIRED** - Trust has passed its expiration date
- **REVOKED** - Trust has been explicitly revoked
- **PENDING** - Trust verification in progress
- **INVALID** - Trust verification failed

### Authority Types
- **ROOT** - Highest privilege level, system-wide authority
- **ORGANIZATIONAL** - Organization-scoped authority
- **DELEGATED** - Authority inherited from another agent

### Capabilities
URI-formatted permissions like:
- `access:read:*` - Read access to resources
- `action:execute:*` - Execute agent actions
- `admin:manage:*` - Administrative operations

### Constraints
Limits on capability usage:
- Resource limits (tokens, requests)
- Time windows (operating hours)
- Audit requirements
- Network restrictions

## Components

### Phase 1: Core Trust UI
- **TrustDashboard** - Overview with stats and recent activity
- **TrustStatusBadge** - Color-coded status indicators
- **TrustChainViewer** - Detailed trust chain display

### Phase 2: Management Interfaces
- **EstablishTrustForm** - Create new trust relationships
- **CapabilityEditor** - Configure capabilities with templates
- **ConstraintEditor** - Set constraints and limits
- **DelegationWizard** - 5-step trust delegation workflow
- **RevokeTrustDialog** - Confirmation dialog for revocation

### Phase 3: Audit & Visualization
- **AuditTrailViewer** - Browse and search audit events
- **AuditEventCard** - Expandable audit event details
- **AuditFilters** - Search, filter, and time range controls
- **AuditExport** - Export to CSV or JSON
- **DelegationTimeline** - Chronological event timeline
- **TrustChainGraph** - Interactive React Flow visualization
- **AuthorityNode** - Custom graph node for authorities
- **AgentNode** - Custom graph node for agents
- **DelegationEdge** - Custom graph edge for delegations

### Phase 4: Advanced Features
- **ESAConfigPanel** - Enterprise Security Authority configuration
- **ESAStatusIndicator** - ESA health and status display
- **TrustMetricsDashboard** - Analytics and metrics dashboard
- **MetricCard** - Individual metric with trend indicator
- **TrustActivityChart** - Activity over time visualization
- **AuthorityList** - Filterable authority list
- **AuthorityCard** - Individual authority display
- **CreateAuthorityDialog** - Authority creation form
- **AgentCardPreview** - A2A agent card integration
- **CapabilityBadge** - Capability badge with popover
- **TrustOverlay** - Pipeline canvas trust overlay
- **TrustValidationPanel** - Pipeline validation results
- **NodeTrustIndicator** - Node-level trust status

## Usage

### Import Components
```tsx
import {
  // Phase 1
  TrustDashboard,
  TrustStatusBadge,
  TrustChainViewer,
  // Phase 2
  EstablishTrustForm,
  DelegationWizard,
  RevokeTrustDialog,
  // Phase 3
  AuditTrailViewer,
  AuditFilters,
  AuditExport,
  DelegationTimeline,
  TrustChainGraph,
  // Phase 4
  ESAConfigPanel,
  ESAStatusIndicator,
  TrustMetricsDashboard,
  MetricCard,
  TrustActivityChart,
  AuthorityList,
  AuthorityCard,
  CreateAuthorityDialog,
  AgentCardPreview,
  TrustOverlay,
  TrustValidationPanel,
  NodeTrustIndicator,
} from '@/features/trust';
```

### Import Hooks
```tsx
import {
  // Core hooks
  useTrustChain,
  useTrustChains,
  useEstablishTrust,
  useDelegateTrust,
  useRevokeTrust,
  // Phase 4 hooks
  useESAConfig,
  useUpdateESAConfig,
  useTestESAConnection,
  useTrustMetrics,
  useExportMetrics,
  useAuthorities,
  useAuthorityById,
  useCreateAuthority,
  useDeactivateAuthority,
  useAgentCard,
  useDiscoverAgents,
  usePipelineTrustValidation,
} from '@/features/trust';
```

### Import Types
```tsx
import type {
  TrustChain,
  TrustStatus,
  CapabilityType,
  AuthorityType,
  // Phase 4 types
  ESAConfig,
  EnforcementMode,
  ESAHealthStatus,
  TrustMetrics,
  TrustMetricsSummary,
  AgentCard,
  AgentCapability,
  PipelineTrustValidation,
  NodeValidation,
} from '@/features/trust';
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/trust` | TrustDashboardPage | Main trust dashboard |
| `/trust/:agentId` | TrustChainDetailPage | Agent trust chain detail |

## Testing

### Unit Tests
325 tests across 15 test files covering:
- Store state management
- React Query hooks
- Component rendering and interactions
- Form validation
- Error handling
- Audit trail components
- Trust chain graph visualization
- ESA configuration
- Trust metrics dashboard
- Authority management
- Agent card integration
- Pipeline trust validation

### E2E Tests
100+ tests in `e2e/trust.spec.ts` covering:
- Dashboard functionality
- Trust establishment flow
- Delegation wizard navigation
- Revocation confirmation
- Audit trail exploration
- Trust chain visualization
- Delegation timeline
- ESA configuration panel
- Trust metrics dashboard
- Authority management
- A2A agent cards
- Pipeline trust integration
- Responsive design
- Accessibility

## Documentation

- [Phase 1 Complete](../../src/features/trust/docs/PHASE1_COMPLETE.md) - Core UI implementation
- [Phase 2 Complete](../../src/features/trust/docs/PHASE2_COMPLETE.md) - Management interfaces
- [Phase 3 Complete](../../src/features/trust/docs/PHASE3_COMPLETE.md) - Audit & Visualization
- [Phase 4 Complete](../../src/features/trust/docs/PHASE4_COMPLETE.md) - Advanced Features
