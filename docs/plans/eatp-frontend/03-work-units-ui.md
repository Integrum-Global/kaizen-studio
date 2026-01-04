# EATP Frontend: Work Units UI

## Document Control
- **Version**: 1.0
- **Date**: 2026-01-03
- **Status**: Planning
- **Author**: Kaizen Studio Team

---

## Overview

This document defines the React component architecture for Work Units - the unified model that replaces separate "Agents" and "Pipelines" terminology. All components follow the ontology defined in `docs/plans/eatp-ontology/02-work-unit-model.md`.

---

## Design Principles

### 1. Unified Visual Language
- Atomic and Composite work units share the same base card design
- Subtle visual cues differentiate types (icon style, badges)
- Users shouldn't need to understand the technical difference

### 2. Trust-First Design
- Trust status is always visible on every work unit
- Trust issues are surfaced prominently (not hidden in details)
- Actions are gated by trust status

### 3. Progressive Disclosure
- Level 1 users see simplified views
- Level 2/3 users can access more details
- Technical details available but not prominent

---

## Component Architecture

### Component Hierarchy

```
WorkUnitsPage
├── WorkUnitFilters
│   ├── SearchInput
│   ├── TypeFilter (Atomic | Composite | All)
│   ├── TrustFilter (Valid | Expired | All)
│   └── WorkspaceFilter
├── WorkUnitGrid
│   └── WorkUnitCard (repeated)
│       ├── WorkUnitIcon
│       ├── WorkUnitHeader
│       ├── CapabilityTags
│       ├── TrustStatusBadge
│       ├── SubUnitCount (Composite only)
│       └── WorkUnitActions
└── WorkUnitDetailPanel (slide-over)
    ├── WorkUnitHeader
    ├── WorkUnitDescription
    ├── CapabilityList
    ├── TrustSection
    │   ├── TrustStatusBadge
    │   ├── TrustChainPreview
    │   └── ConstraintSummary
    ├── SubUnitList (Composite only)
    │   └── SubUnitCard (repeated)
    ├── RecentRunsList
    └── WorkUnitActionsPanel
```

---

## Core Components

### 1. WorkUnitCard

The primary representation of a work unit in lists and grids.

```tsx
interface WorkUnitCardProps {
  workUnit: WorkUnit;
  onRun?: () => void;
  onConfigure?: () => void;
  onDelegate?: () => void;
  onClick?: () => void;
  compact?: boolean;  // For embedding in other views
  showActions?: boolean;
  userLevel: 1 | 2 | 3;
}

interface WorkUnit {
  id: string;
  name: string;
  description: string;
  type: 'atomic' | 'composite';
  capabilities: string[];
  trustStatus: TrustStatus;
  subUnitCount?: number;  // Composite only
  workspaceId?: string;
  lastRunAt?: string;
  createdBy: string;
}

type TrustStatus = 'valid' | 'expired' | 'revoked' | 'pending';
```

**Visual Design**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ┌──────────┐   Invoice Processor                    ✓ Valid      │
│   │   ◉◉◉    │   Processes and validates invoices                  │
│   │ (icon)   │                                                      │
│   └──────────┘   ┌─────────────────────────────────────────────┐   │
│                  │ extract • validate • route • archive        │   │
│                  └─────────────────────────────────────────────┘   │
│                                                                     │
│   Uses 4 units                                                      │
│                                                                     │
│   ┌─────────┐  ┌─────────────┐  ┌────────────┐                     │
│   │   Run   │  │  Configure  │  │  Delegate  │   ← Level 2+ only   │
│   └─────────┘  └─────────────┘  └────────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Icon Variations**:

| Type | Icon | Description |
|------|------|-------------|
| Atomic | ◉ | Single solid circle |
| Composite | ◉◉◉ | Stacked circles (conveying multiple) |

**Trust Status Badge Colors**:

| Status | Color | Icon |
|--------|-------|------|
| Valid | Green (#22C55E) | ✓ checkmark |
| Expired | Amber (#F59E0B) | ⏰ clock |
| Revoked | Red (#EF4444) | ✕ cross |
| Pending | Gray (#6B7280) | ⋯ dots |

---

### 2. WorkUnitIcon

Visually distinguishes atomic from composite work units.

```tsx
interface WorkUnitIconProps {
  type: 'atomic' | 'composite';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Implementation**:

```tsx
function WorkUnitIcon({ type, size = 'md', className }: WorkUnitIconProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={cn(
      'flex items-center justify-center rounded-lg bg-muted',
      sizeClasses[size],
      className
    )}>
      {type === 'atomic' ? (
        <CircleDot className="text-primary" />
      ) : (
        <div className="relative">
          <Circle className="absolute text-primary/30" style={{ top: -2, left: -2 }} />
          <Circle className="absolute text-primary/60" style={{ top: 0, left: 0 }} />
          <Circle className="text-primary" />
        </div>
      )}
    </div>
  );
}
```

---

### 3. TrustStatusBadge

Displays trust status with appropriate visual treatment.

```tsx
interface TrustStatusBadgeProps {
  status: TrustStatus;
  expiresAt?: string;  // ISO date
  showExpiry?: boolean;
  size?: 'sm' | 'md';
  onClick?: () => void;  // For viewing trust details
}
```

**Implementation**:

```tsx
function TrustStatusBadge({ status, expiresAt, showExpiry, size = 'md', onClick }: TrustStatusBadgeProps) {
  const config = {
    valid: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      label: 'Trust Valid'
    },
    expired: {
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Clock,
      label: 'Trust Expired'
    },
    revoked: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
      label: 'Trust Revoked'
    },
    pending: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: MoreHorizontal,
      label: 'Setup Pending'
    },
  };

  const { color, icon: Icon, label } = config[status];

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        size === 'sm' ? 'text-xs' : 'text-sm',
        color,
        onClick && 'cursor-pointer hover:opacity-80'
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{label}</span>
      {showExpiry && expiresAt && status === 'valid' && (
        <span className="text-green-600">
          ({formatRelativeTime(expiresAt)})
        </span>
      )}
    </button>
  );
}
```

---

### 4. CapabilityTags

Displays work unit capabilities as compact tags.

```tsx
interface CapabilityTagsProps {
  capabilities: string[];
  maxVisible?: number;  // Default 4, show "+N more"
  onClick?: (capability: string) => void;
}
```

**Visual**:

```
┌──────────────────────────────────────────────────────────────┐
│  extract  •  validate  •  route  •  archive  +2 more        │
└──────────────────────────────────────────────────────────────┘
```

---

### 5. SubUnitCount

Badge showing how many work units a composite uses.

```tsx
interface SubUnitCountProps {
  count: number;
  onClick?: () => void;  // Expand to show sub-units
}
```

**Visual**:

```
┌─────────────────┐
│ Uses 4 units    │
└─────────────────┘
```

---

### 6. WorkUnitActions

Action buttons with trust-aware disabling.

```tsx
interface WorkUnitActionsProps {
  workUnit: WorkUnit;
  userLevel: 1 | 2 | 3;
  onRun: () => void;
  onConfigure: () => void;
  onDelegate: () => void;
  onViewDetails: () => void;
}
```

**Action Availability by Level**:

| Action | Level 1 | Level 2 | Level 3 | Trust Required |
|--------|---------|---------|---------|----------------|
| Run | ✓ | ✓ | ✓ | Valid |
| Configure | - | ✓ | ✓ | Any |
| Delegate | - | ✓ | ✓ | Valid |
| View Details | ✓ | ✓ | ✓ | - |
| Delete | - | - | ✓ | - |

---

### 7. WorkUnitDetailPanel

Slide-over panel showing full work unit details.

```tsx
interface WorkUnitDetailPanelProps {
  workUnit: WorkUnit;
  isOpen: boolean;
  onClose: () => void;
  userLevel: 1 | 2 | 3;
}
```

**Layout (Level 2/3 View)**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                              [×]    │
│   ┌──────────┐                                                      │
│   │   ◉◉◉    │   Invoice Processor                                 │
│   └──────────┘   Composite Work Unit                                │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   DESCRIPTION                                                       │
│   Processes incoming invoices through extraction, validation,       │
│   routing, and archival steps.                                      │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   CAPABILITIES                                                      │
│   • extract_data - Extract structured data from documents           │
│   • validate_invoice - Validate against business rules              │
│   • route_approval - Route to appropriate approver                  │
│   • archive_document - Store in document management system          │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   TRUST                                                             │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ Status: ✓ Valid          Expires: Dec 31, 2026              │  │
│   │                                                              │  │
│   │ Delegated by: Sarah Chen (CFO)                               │  │
│   │ Established: Oct 15, 2026                                    │  │
│   │                                                              │  │
│   │ [View Trust Chain]                                           │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   CONSTRAINTS                                                       │
│   • Cost limit: $500/day                                            │
│   • Time window: Business hours (9am-6pm)                           │
│   • Data scope: Finance department only                             │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   SUB-UNITS (4)                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ◉ Data Extractor          ✓ Valid                           │  │
│   │ ◉ Invoice Validator       ✓ Valid                           │  │
│   │ ◉ Approval Router         ✓ Valid                           │  │
│   │ ◉ Document Archiver       ✓ Valid                           │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   RECENT RUNS                                                       │
│   • 2 min ago     ✓ Completed    INV-2024-0847                     │
│   • 15 min ago    ✓ Completed    INV-2024-0846                     │
│   • 1 hour ago    ✕ Failed       INV-2024-0845    [View Error]     │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   ┌─────────┐  ┌─────────────┐  ┌────────────┐                     │
│   │   Run   │  │  Configure  │  │  Delegate  │                     │
│   └─────────┘  └─────────────┘  └────────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Layout (Level 1 View - Simplified)**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                              [×]    │
│   ┌──────────┐                                                      │
│   │   ◉◉◉    │   Invoice Processor                    ✓ Valid      │
│   └──────────┘                                                      │
│                                                                     │
│   Processes incoming invoices through extraction, validation,       │
│   routing, and archival steps.                                      │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   WHAT IT CAN DO                                                    │
│   • Extract data from invoices                                      │
│   • Validate invoice details                                        │
│   • Route for approval                                              │
│   • Archive completed invoices                                      │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   RECENT RESULTS                                                    │
│   • 2 min ago     ✓ Completed    [View Result]                     │
│   • 15 min ago    ✓ Completed    [View Result]                     │
│   • 1 hour ago    ✕ Failed       [View Error]                      │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                         Run Now                               │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Page Components

### 1. WorkUnitsPage

Main page for browsing and managing work units.

```tsx
interface WorkUnitsPageProps {
  userLevel: 1 | 2 | 3;
}
```

**Layout**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Work Units                                    [+ New Work Unit]   │
│   Create and manage your work units                                 │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 🔍 Search work units...                                      │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   [All] [Atomic] [Composite]        [Trust: All ▾] [Workspace ▾]   │
│                                                                     │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│   │                 │  │                 │  │                 │   │
│   │  Invoice        │  │  Data           │  │  Report         │   │
│   │  Processor      │  │  Extractor      │  │  Generator      │   │
│   │  ◉◉◉            │  │  ◉              │  │  ◉              │   │
│   │                 │  │                 │  │                 │   │
│   │  ✓ Valid        │  │  ✓ Valid        │  │  ⏰ Expired     │   │
│   │                 │  │                 │  │                 │   │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                     │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│   │                 │  │                 │  │                 │   │
│   │  Contract       │  │  Email          │  │  Approval       │   │
│   │  Analyzer       │  │  Classifier     │  │  Workflow       │   │
│   │  ◉              │  │  ◉              │  │  ◉◉◉            │   │
│   │                 │  │                 │  │                 │   │
│   │  ✓ Valid        │  │  ✓ Valid        │  │  ✓ Valid        │   │
│   │                 │  │                 │  │                 │   │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                     │
│   Showing 6 of 24 work units                    [Load More]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 2. WorkUnitCreateWizard

Step-by-step wizard for creating new work units.

**Steps**:

1. **Choose Type** - Atomic or Composite
2. **Basic Info** - Name, description
3. **Capabilities** - Define what it can do
4. **Configuration** - Parameters and settings
5. **Trust Setup** - Initial trust establishment (Level 3) or request delegation (Level 2)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Create Work Unit                                                  │
│                                                                     │
│   ○─────────○─────────○─────────○─────────○                        │
│   Type      Info      Caps      Config    Trust                     │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   What type of work unit?                                           │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   ◉  Atomic Work Unit                                       │  │
│   │      A single capability that executes directly              │  │
│   │      Examples: Data extraction, document analysis            │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   ◉◉◉  Composite Work Unit                                   │  │
│   │        Orchestrates other work units for complex tasks       │  │
│   │        Examples: Invoice processing, report generation       │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│                                           [Cancel]  [Next →]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## State Management

### Work Unit Store (Zustand)

```typescript
interface WorkUnitStore {
  // State
  workUnits: WorkUnit[];
  selectedWorkUnit: WorkUnit | null;
  filters: WorkUnitFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkUnits: (filters?: WorkUnitFilters) => Promise<void>;
  selectWorkUnit: (id: string | null) => void;
  createWorkUnit: (data: CreateWorkUnitInput) => Promise<WorkUnit>;
  updateWorkUnit: (id: string, data: UpdateWorkUnitInput) => Promise<void>;
  deleteWorkUnit: (id: string) => Promise<void>;
  runWorkUnit: (id: string, inputs: Record<string, unknown>) => Promise<RunResult>;

  // Trust actions
  refreshTrustStatus: (id: string) => Promise<void>;
  requestDelegation: (id: string, delegateeId: string) => Promise<void>;
}

interface WorkUnitFilters {
  search?: string;
  type?: 'atomic' | 'composite' | 'all';
  trustStatus?: TrustStatus | 'all';
  workspaceId?: string;
}
```

---

## API Integration

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/work-units` | GET | List work units with filters |
| `/api/work-units/:id` | GET | Get work unit details |
| `/api/work-units` | POST | Create new work unit |
| `/api/work-units/:id` | PUT | Update work unit |
| `/api/work-units/:id` | DELETE | Delete work unit |
| `/api/work-units/:id/run` | POST | Execute work unit |
| `/api/work-units/:id/trust` | GET | Get trust status |
| `/api/work-units/:id/delegate` | POST | Create delegation |

### React Query Hooks

```typescript
// Fetch work units
const { data: workUnits, isLoading } = useQuery({
  queryKey: ['workUnits', filters],
  queryFn: () => workUnitApi.list(filters),
});

// Get single work unit
const { data: workUnit } = useQuery({
  queryKey: ['workUnit', id],
  queryFn: () => workUnitApi.get(id),
});

// Run work unit
const runMutation = useMutation({
  mutationFn: ({ id, inputs }) => workUnitApi.run(id, inputs),
  onSuccess: () => {
    queryClient.invalidateQueries(['workUnits']);
    toast.success('Task started successfully');
  },
});

// Create work unit
const createMutation = useMutation({
  mutationFn: (data) => workUnitApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['workUnits']);
    toast.success('Work unit created');
  },
});
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate between cards |
| Enter | Open selected card details |
| Escape | Close detail panel |
| R | Run selected work unit |
| D | Open delegate modal |

### ARIA Labels

```tsx
<div
  role="article"
  aria-label={`${workUnit.name}, ${workUnit.type} work unit, trust status ${workUnit.trustStatus}`}
>
  {/* Card content */}
</div>
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Grid Columns | Card Size |
|------------|--------------|-----------|
| Mobile (<640px) | 1 | Full width |
| Tablet (640-1024px) | 2 | Medium |
| Desktop (>1024px) | 3-4 | Standard |

### Mobile Adaptations

- Cards stack vertically
- Detail panel becomes full-screen modal
- Actions move to bottom sheet
- Filters collapse to dropdown

---

## References

- **Ontology**: `docs/plans/eatp-ontology/02-work-unit-model.md`
- **Trust Visualization**: `docs/plans/eatp-frontend/02-trust-visualization.md`
- **Level-Based Experience**: `docs/plans/eatp-frontend/05-level-based-experience.md`
