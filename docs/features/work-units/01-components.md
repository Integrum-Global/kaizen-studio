# Work Unit Components

This document describes the UI components for the Work Units feature.

## WorkUnitCard

The primary display component for a work unit. Shows name, type, trust status, capabilities, and action buttons.

### Props

```tsx
interface WorkUnitCardProps {
  workUnit: WorkUnit;
  userLevel: UserLevel;
  onClick?: () => void;
  onRun?: () => void;
  onConfigure?: () => void;
  onDelegate?: () => void;
  onViewTrust?: () => void;
  isLoading?: boolean;
  loadingAction?: 'run' | 'configure' | 'delegate';
  className?: string;
}
```

### Usage

```tsx
<WorkUnitCard
  workUnit={workUnit}
  userLevel={2}
  onClick={() => setSelectedUnit(workUnit)}
  onRun={() => runWorkUnit(workUnit)}
  onConfigure={() => configureWorkUnit(workUnit)}
  onDelegate={() => delegateWorkUnit(workUnit)}
/>
```

### Behavior by User Level

| Feature | Level 1 | Level 2+ |
|---------|---------|----------|
| Run button | Yes | Yes |
| Configure button | No | Yes |
| Delegate button | No | Yes |
| View Trust | Click badge | Click badge |

---

## WorkUnitGrid

Displays work units in a responsive grid layout with loading states and pagination.

### Props

```tsx
interface WorkUnitGridProps {
  workUnits: WorkUnit[];
  userLevel: UserLevel;
  isLoading?: boolean;
  hasMore?: boolean;
  total?: number;
  onLoadMore?: () => void;
  onWorkUnitClick?: (workUnit: WorkUnit) => void;
  onRun?: (workUnit: WorkUnit) => void;
  onConfigure?: (workUnit: WorkUnit) => void;
  onDelegate?: (workUnit: WorkUnit) => void;
  onViewTrust?: (workUnit: WorkUnit) => void;
  loadingWorkUnitId?: string;
  loadingAction?: 'run' | 'configure' | 'delegate';
  className?: string;
}
```

### Usage

```tsx
<WorkUnitGrid
  workUnits={workUnits}
  userLevel={2}
  isLoading={isLoading}
  hasMore={hasNextPage}
  total={totalCount}
  onLoadMore={fetchNextPage}
  onWorkUnitClick={handleWorkUnitClick}
  onRun={handleRun}
/>
```

### Features

- **Responsive**: 1 column on mobile, 2 on tablet, 3-4 on desktop
- **Loading Skeletons**: Shows 6 skeleton cards during initial load
- **Empty State**: Shows helpful message when no work units
- **Pagination**: "Load More" button when more items available
- **Count Display**: Shows "Showing X of Y work units"

---

## WorkUnitFilters

Filter controls for searching and filtering work units.

### Props

```tsx
interface WorkUnitFiltersProps {
  filters: WorkUnitFilters;
  onFiltersChange: (filters: WorkUnitFilters) => void;
  workspaces?: WorkspaceRef[];
  showWorkspaceFilter?: boolean;
  className?: string;
}
```

### Usage

```tsx
<WorkUnitFilters
  filters={filters}
  onFiltersChange={setFilters}
  workspaces={workspaces}
  showWorkspaceFilter={true}
/>
```

### Filter Types

| Filter | Type | Description |
|--------|------|-------------|
| Search | Text input | Search by name/description |
| Type | Tabs | All / Atomic / Composite |
| Trust Status | Select | All / Valid / Expired / Revoked / Pending |
| Workspace | Select | Filter by workspace (optional) |

---

## WorkUnitDetailPanel

Slide-over panel showing full work unit details.

### Props

```tsx
interface WorkUnitDetailPanelProps {
  workUnit: WorkUnit | null;
  isOpen: boolean;
  onClose: () => void;
  userLevel: UserLevel;
  recentRuns?: RunResult[];
  onRun?: () => void;
  onConfigure?: () => void;
  onDelegate?: () => void;
  onViewTrustChain?: () => void;
  onViewRun?: (runId: string) => void;
  isLoading?: boolean;
}
```

### Usage

```tsx
<WorkUnitDetailPanel
  workUnit={selectedWorkUnit}
  isOpen={isPanelOpen}
  onClose={() => setSelectedWorkUnit(null)}
  userLevel={2}
  recentRuns={recentRuns}
  onRun={handleRun}
  onConfigure={handleConfigure}
  onDelegate={handleDelegate}
  onViewTrustChain={handleViewTrustChain}
/>
```

### Sections by User Level

| Section | Level 1 | Level 2+ |
|---------|---------|----------|
| Description | Yes | Yes |
| Capabilities | "What it can do" | Full capability tags |
| Trust Section | No | Yes (delegated by, expiry) |
| Sub-Units (composite) | No | Yes |
| Recent Runs/Results | "Recent Results" | "Recent Runs" |
| Actions | Run Now | Run, Configure, Delegate |

---

## TrustStatusBadge

Visual indicator for trust status.

### Props

```tsx
interface TrustStatusBadgeProps {
  status: TrustStatus;
  expiresAt?: string;
  showExpiry?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}
```

### Usage

```tsx
<TrustStatusBadge
  status="valid"
  expiresAt="2024-12-31T23:59:59Z"
  showExpiry
  onClick={handleViewTrustChain}
/>
```

### Status Colors

| Status | Color | Icon |
|--------|-------|------|
| Valid | Green | CheckCircle |
| Expired | Amber | AlertTriangle |
| Revoked | Red | XCircle |
| Pending | Gray | Clock |

---

## CapabilityTags

Displays work unit capabilities as tags.

### Props

```tsx
interface CapabilityTagsProps {
  capabilities: string[];
  maxVisible?: number;
  onClick?: (capability: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}
```

### Usage

```tsx
<CapabilityTags
  capabilities={['extract', 'validate', 'route', 'archive']}
  maxVisible={4}
/>
```

### Overflow

When more capabilities than `maxVisible`, shows "+N more" badge with tooltip listing all.

---

## WorkUnitIcon

Icon for work unit type.

### Props

```tsx
interface WorkUnitIconProps {
  type: 'atomic' | 'composite';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

### Usage

```tsx
<WorkUnitIcon type="composite" size="lg" />
```

### Icons

- **Atomic**: Single circle (simple task)
- **Composite**: Stacked circles (collection)

---

## SubUnitCount

Display count for composite work units.

### Props

```tsx
interface SubUnitCountProps {
  count: number;
  className?: string;
}
```

### Usage

```tsx
<SubUnitCount count={5} />
// Renders: "Uses 5 units"
```
