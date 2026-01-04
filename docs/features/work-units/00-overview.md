# Work Units Feature

The Work Units feature is the core UI for the EATP (Enterprise Agentic Trust Protocol) Ontology Redesign. It provides a unified way to view and manage work units with trust-first design.

## What is a Work Unit?

A Work Unit is the fundamental execution unit in Kaizen Studio. It represents a delegated piece of work that can be:

- **Atomic**: A single, indivisible task (e.g., "Extract Invoice Data")
- **Composite**: A collection of sub-units working together (e.g., "Process Month-End Reports")

Every work unit carries trust metadata, enabling users to understand authorization and provenance at a glance.

## User Levels

The UI adapts to three user levels:

| Level | Role | Capabilities |
|-------|------|--------------|
| **Level 1** | Task Performer | Execute tasks, view results |
| **Level 2** | Process Owner | Configure, delegate, manage workspaces |
| **Level 3** | Value Chain Owner | Enterprise view, compliance, trust establishment |

## Pages

### My Tasks (`/work/tasks`)
For Level 1+ users. Shows assigned work with simplified task-focused view.

### Work Units (`/build/work-units`)
For Level 2+ users. Full work unit management with:
- Grid display of all work units
- Search and filtering (type, trust status, workspace)
- Detail panel with full information
- Actions: Run, Configure, Delegate

## Key Components

| Component | Purpose |
|-----------|---------|
| `WorkUnitCard` | Card display with actions |
| `WorkUnitGrid` | Responsive grid layout |
| `WorkUnitFilters` | Search and filter controls |
| `WorkUnitDetailPanel` | Slide-over with full details |
| `TrustStatusBadge` | Visual trust indicator |
| `CapabilityTags` | Display capabilities |

## Trust-First Design

Trust status is always visible:
- **Valid** (green): Work unit can be executed
- **Expired** (amber): Trust has expired, needs renewal
- **Revoked** (red): Trust has been revoked
- **Pending** (gray): Awaiting trust establishment

Actions are gated by trust status - you cannot run a work unit with invalid trust.

## Getting Started

```tsx
import { WorkUnitCard } from '@/features/work-units/components';
import type { WorkUnit } from '@/features/work-units/types';

function MyComponent() {
  const workUnit: WorkUnit = {
    id: 'wu-1',
    name: 'Extract Invoice Data',
    type: 'atomic',
    capabilities: ['extract', 'validate'],
    trustInfo: { status: 'valid' },
    // ...
  };

  return (
    <WorkUnitCard
      workUnit={workUnit}
      userLevel={2}
      onRun={() => console.log('Run clicked')}
    />
  );
}
```

## Architecture

```
features/work-units/
├── components/           # UI components
│   ├── WorkUnitCard.tsx
│   ├── WorkUnitGrid.tsx
│   ├── WorkUnitFilters.tsx
│   ├── WorkUnitDetailPanel.tsx
│   ├── TrustStatusBadge.tsx
│   ├── CapabilityTags.tsx
│   ├── WorkUnitIcon.tsx
│   ├── WorkUnitActions.tsx
│   ├── SubUnitCount.tsx
│   └── __tests__/        # Unit tests
├── hooks/                # React hooks
│   └── useWorkUnits.ts
├── types/                # TypeScript types
│   └── index.ts
└── index.ts              # Public exports
```

## Related Documentation

- [01-components.md](./01-components.md) - Component API reference
- [02-types.md](./02-types.md) - Type definitions
- [03-testing.md](./03-testing.md) - Testing guide
