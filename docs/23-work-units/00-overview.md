# Work Units UI - Phase 1 Overview

Work Units represent the unified model for all executable automation in Kaizen Studio, replacing the previous separate concepts of Agents and Pipelines. This documentation covers the Phase 1 implementation of the Work Units UI.

## Core Concepts

### Unified Work Unit Model

A Work Unit is any executable piece of automation that can be:
- **Atomic**: A single operation (previously called an Agent)
- **Composite**: A collection of work units (previously called a Pipeline)

### Three-Level UX Model

The UI adapts based on user level, providing progressive complexity:

| Level | Role | Capabilities |
|-------|------|--------------|
| Level 1 | Task Performer | Execute tasks, view results |
| Level 2 | Process Owner | Configure, delegate, manage processes |
| Level 3 | Value Chain Owner | Full administrative control, compliance |

### Trust-First Design

Every work unit displays its trust status prominently. Trust determines what actions are available:

- **Valid**: Can be run and delegated
- **Expired**: Requires renewal before execution
- **Revoked**: Cannot be used until reestablished
- **Pending**: Setup required before first use

## Phase 1 Scope

Phase 1 establishes the foundation:

1. **UserLevelContext** - Automatic level detection based on delegations and trust chain position
2. **WorkUnitCard Components** - Unified card design for all work units
3. **My Tasks Page** - Task execution interface for all users
4. **AdaptiveSidebar** - Level-aware navigation

## Architecture

```
src/
├── contexts/
│   └── UserLevelContext.tsx    # Level detection and permissions
├── features/work-units/
│   ├── types/
│   │   └── index.ts            # Core type definitions
│   └── components/
│       ├── WorkUnitCard.tsx    # Main card component
│       ├── WorkUnitIcon.tsx    # Atomic/composite icons
│       ├── TrustStatusBadge.tsx
│       ├── CapabilityTags.tsx
│       ├── SubUnitCount.tsx
│       └── WorkUnitActions.tsx
├── components/layout/
│   └── AdaptiveSidebar.tsx     # Level-aware navigation
└── pages/work/
    └── MyTasksPage.tsx         # Task execution page
```

## Key Design Decisions

1. **Progressive Disclosure** - UI complexity matches user level
2. **Trust Visibility** - Trust status is never hidden
3. **Unified Components** - Same card design for atomic and composite
4. **Type Safety** - Full TypeScript coverage with strict mode
5. **Accessibility** - WCAG 2.1 AA compliance built-in

## Next Phases

- **Phase 2**: WorkUnitDetailPanel, WorkUnitConfigForm, WorkUnitBuilder
- **Phase 3**: DelegationWizard, TrustEstablishmentFlow
- **Phase 4**: ValueChainViewer, ComplianceDashboard
