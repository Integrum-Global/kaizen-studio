# TODO-036: EATP Ontology Redesign - Phase 1: Foundation

**Status**: COMPLETED
**Priority**: HIGH
**Created**: 2026-01-04
**Completed**: 2026-01-04
**Owner**: Frontend Team

---

## Overview

Phase 1 establishes the foundation components for the EATP Ontology redesign, implementing the core Work Unit model that unifies the current Agent and Pipeline concepts into a single, coherent UI paradigm.

This phase focuses on:
1. Building the unified WorkUnitCard component family
2. Implementing the Level 1 (Task Performer) primary view
3. Setting up the adaptive sidebar infrastructure
4. Establishing routing and navigation patterns

---

## Planning Document References

- **Ontology Model**: `docs/plans/eatp-ontology/02-work-unit-model.md`
- **UX Levels**: `docs/plans/eatp-ontology/03-user-experience-levels.md`
- **Work Units UI**: `docs/plans/eatp-frontend/03-work-units-ui.md`
- **Level-Based Experience**: `docs/plans/eatp-frontend/05-level-based-experience.md`

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| TODO-018 (EATP Frontend) | Prerequisite | COMPLETED |
| TrustDashboard components | Existing | Available in `apps/web/src/features/trust/` |
| Shadcn/ui component library | Existing | Available |
| React Flow | Existing | Available |

---

## Acceptance Criteria

### Component Implementation

- [ ] **AC-1**: WorkUnitCard displays both atomic and composite work units with unified design
- [ ] **AC-2**: WorkUnitIcon visually differentiates atomic (single circle) vs composite (stacked circles)
- [ ] **AC-3**: TrustStatusBadge shows 4 states: valid (green), expired (amber), revoked (red), pending (gray)
- [ ] **AC-4**: CapabilityTags displays up to 4 capabilities with "+N more" overflow
- [ ] **AC-5**: SubUnitCount badge only appears on composite work units
- [ ] **AC-6**: WorkUnitActions disables Run button when trust is not valid
- [ ] **AC-7**: WorkUnitDetailPanel shows simplified view for Level 1 users, full view for Level 2+

### Page Implementation

- [ ] **AC-8**: MyTasksPage displays available tasks in card grid layout
- [ ] **AC-9**: MyTasksPage shows "Recent Results" section with execution history
- [ ] **AC-10**: AdaptiveSidebar renders different items based on user level (1, 2, or 3)
- [ ] **AC-11**: Level 1 users only see "WORK > My Tasks" in sidebar

### Routing & Navigation

- [ ] **AC-12**: Route `/work/tasks` renders MyTasksPage
- [ ] **AC-13**: Route `/work/tasks/:id` opens WorkUnitDetailPanel as slide-over
- [ ] **AC-14**: UserContext provides `level`, `permissions`, and `trustPosture`

### Testing

- [ ] **AC-15**: All components have unit tests with >80% coverage
- [ ] **AC-16**: Accessibility: All components pass axe-core checks
- [ ] **AC-17**: Keyboard navigation works for all interactive elements

---

## Implementation Tasks

### 1. WorkUnitCard Component (Est: 4 hours)

**File**: `apps/web/src/features/work-units/components/WorkUnitCard.tsx`

```typescript
interface WorkUnitCardProps {
  workUnit: WorkUnit;
  onRun?: () => void;
  onConfigure?: () => void;
  onDelegate?: () => void;
  onClick?: () => void;
  compact?: boolean;
  showActions?: boolean;
  userLevel: 1 | 2 | 3;
}
```

**Subtasks**:
- [ ] 1.1 Create WorkUnitCard base structure with Shadcn Card
- [ ] 1.2 Integrate WorkUnitIcon based on `type` prop
- [ ] 1.3 Add TrustStatusBadge in top-right corner
- [ ] 1.4 Add CapabilityTags component
- [ ] 1.5 Conditionally render SubUnitCount for composite types
- [ ] 1.6 Add WorkUnitActions footer with level-based visibility
- [ ] 1.7 Write unit tests

**Visual Specification**:
```
+--------------------------------------------------+
|  [Icon]  Work Unit Name               [Trust]    |
|          Short description                       |
|                                                  |
|  [capability] [capability] [capability] +N more  |
|                                                  |
|  Uses 4 units (composite only)                   |
|                                                  |
|  [Run]  [Configure]  [Delegate]                  |
+--------------------------------------------------+
```

---

### 2. WorkUnitIcon Component (Est: 2 hours)

**File**: `apps/web/src/features/work-units/components/WorkUnitIcon.tsx`

```typescript
interface WorkUnitIconProps {
  type: 'atomic' | 'composite';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Subtasks**:
- [ ] 2.1 Create icon component with size variants (sm: 32px, md: 48px, lg: 64px)
- [ ] 2.2 Implement single circle design for atomic type
- [ ] 2.3 Implement stacked circles design for composite type
- [ ] 2.4 Add subtle background color differentiation
- [ ] 2.5 Write unit tests

**Icon Design**:
- Atomic: Single solid circle icon (CircleDot from lucide-react)
- Composite: Three overlapping circles with decreasing opacity (back: 30%, mid: 60%, front: 100%)

---

### 3. TrustStatusBadge Component (Est: 3 hours)

**File**: `apps/web/src/features/work-units/components/TrustStatusBadge.tsx`

```typescript
interface TrustStatusBadgeProps {
  status: 'valid' | 'expired' | 'revoked' | 'pending';
  expiresAt?: string;
  showExpiry?: boolean;
  size?: 'sm' | 'md';
  onClick?: () => void;
}
```

**Subtasks**:
- [ ] 3.1 Create badge with 4 status variants and colors
- [ ] 3.2 Add appropriate icon for each status (check, clock, x, dots)
- [ ] 3.3 Implement optional expiry countdown display
- [ ] 3.4 Add click handler for viewing trust details
- [ ] 3.5 Write unit tests

**Status Colors**:
| Status | Background | Text | Border |
|--------|------------|------|--------|
| valid | green-100 | green-800 | green-200 |
| expired | amber-100 | amber-800 | amber-200 |
| revoked | red-100 | red-800 | red-200 |
| pending | gray-100 | gray-800 | gray-200 |

---

### 4. CapabilityTags Component (Est: 2 hours)

**File**: `apps/web/src/features/work-units/components/CapabilityTags.tsx`

```typescript
interface CapabilityTagsProps {
  capabilities: string[];
  maxVisible?: number; // Default: 4
  onClick?: (capability: string) => void;
}
```

**Subtasks**:
- [ ] 4.1 Create tag container with flex-wrap
- [ ] 4.2 Render up to maxVisible tags
- [ ] 4.3 Show "+N more" badge when exceeding limit
- [ ] 4.4 Add hover tooltip showing all capabilities
- [ ] 4.5 Write unit tests

---

### 5. SubUnitCount Component (Est: 1 hour)

**File**: `apps/web/src/features/work-units/components/SubUnitCount.tsx`

```typescript
interface SubUnitCountProps {
  count: number;
  onClick?: () => void;
}
```

**Subtasks**:
- [ ] 5.1 Create badge with "Uses N units" text
- [ ] 5.2 Add click handler to expand sub-unit list
- [ ] 5.3 Write unit tests

---

### 6. WorkUnitActions Component (Est: 3 hours)

**File**: `apps/web/src/features/work-units/components/WorkUnitActions.tsx`

```typescript
interface WorkUnitActionsProps {
  workUnit: WorkUnit;
  userLevel: 1 | 2 | 3;
  onRun: () => void;
  onConfigure: () => void;
  onDelegate: () => void;
  onViewDetails: () => void;
}
```

**Subtasks**:
- [ ] 6.1 Create action button group
- [ ] 6.2 Implement trust-aware disabling (Run disabled if trust invalid)
- [ ] 6.3 Implement level-aware visibility (Configure/Delegate only Level 2+)
- [ ] 6.4 Add loading states for async actions
- [ ] 6.5 Write unit tests

**Action Visibility Matrix**:
| Action | Level 1 | Level 2 | Level 3 | Trust Required |
|--------|---------|---------|---------|----------------|
| Run | Yes | Yes | Yes | valid |
| Configure | No | Yes | Yes | any |
| Delegate | No | Yes | Yes | valid |
| Delete | No | No | Yes | any |

---

### 7. WorkUnitDetailPanel Component (Est: 6 hours)

**File**: `apps/web/src/features/work-units/components/WorkUnitDetailPanel.tsx`

```typescript
interface WorkUnitDetailPanelProps {
  workUnit: WorkUnit;
  isOpen: boolean;
  onClose: () => void;
  userLevel: 1 | 2 | 3;
}
```

**Subtasks**:
- [ ] 7.1 Create slide-over panel using Shadcn Sheet
- [ ] 7.2 Implement Level 1 simplified view (name, description, capabilities, recent results)
- [ ] 7.3 Implement Level 2/3 full view (add trust section, constraints, sub-units)
- [ ] 7.4 Add TrustSection with chain preview
- [ ] 7.5 Add SubUnitList for composite work units
- [ ] 7.6 Add RecentRunsList with status indicators
- [ ] 7.7 Add action buttons in footer
- [ ] 7.8 Write unit tests

---

### 8. MyTasksPage (Est: 8 hours)

**File**: `apps/web/src/pages/work/MyTasksPage.tsx`

**Subtasks**:
- [ ] 8.1 Create page layout with header and search
- [ ] 8.2 Implement "Available Tasks" grid section
- [ ] 8.3 Implement "Recent Results" list section
- [ ] 8.4 Add WorkUnitCard grid with responsive columns (1/2/3/4)
- [ ] 8.5 Add search and filter functionality
- [ ] 8.6 Integrate with work-units API
- [ ] 8.7 Add empty states for no tasks/results
- [ ] 8.8 Add loading skeletons
- [ ] 8.9 Write unit tests
- [ ] 8.10 Write E2E test

**Layout**:
```
+--------------------------------------------------+
|  My Tasks                           [Search...]  |
+--------------------------------------------------+
|  Available to Run                                |
|                                                  |
|  [Card] [Card] [Card] [Card]                     |
|  [Card] [Card] ...                               |
|                                                  |
+--------------------------------------------------+
|  Recent Results                    [View All ->] |
|                                                  |
|  [Status] Task Name • Time ago    [View Result]  |
|  [Status] Task Name • Time ago    [View Result]  |
|  [Status] Task Name • Running...  [View Status]  |
+--------------------------------------------------+
```

---

### 9. AdaptiveSidebar Component (Est: 6 hours)

**File**: `apps/web/src/components/layout/AdaptiveSidebar.tsx`

**Subtasks**:
- [ ] 9.1 Create UserContext with level determination logic
- [ ] 9.2 Implement `determineUserLevel()` based on delegations
- [ ] 9.3 Create sidebar configuration object with level requirements
- [ ] 9.4 Implement sidebar item filtering based on user level
- [ ] 9.5 Update existing sidebar to use AdaptiveSidebar
- [ ] 9.6 Add transition animations when level changes
- [ ] 9.7 Write unit tests

**Sidebar Configuration by Level**:
```typescript
const sidebarConfig = {
  WORK: {
    'My Tasks': { minLevel: 1 },
    'My Processes': { minLevel: 2 },
    'Value Chains': { minLevel: 3 },
  },
  BUILD: {
    'Work Units': { minLevel: 2 },
    'Workspaces': { minLevel: 2 },
    'Connectors': { minLevel: 2 },
  },
  GOVERN: {
    'Trust': { minLevel: 2 },
    'Compliance': { minLevel: 3 },
    'Activity': { minLevel: 3 },
  },
};
```

---

### 10. Routing Updates (Est: 3 hours)

**File**: `apps/web/src/routes/index.tsx`

**Subtasks**:
- [ ] 10.1 Add `/work/tasks` route for MyTasksPage
- [ ] 10.2 Add `/work/tasks/:id` route with detail panel state
- [ ] 10.3 Add route guards based on user level
- [ ] 10.4 Update navigation links
- [ ] 10.5 Write E2E navigation tests

**Route Structure**:
```
/work
  /tasks          -> MyTasksPage (Level 1+)
  /tasks/:id      -> MyTasksPage + WorkUnitDetailPanel
  /processes      -> MyProcessesPage (Level 2+) [Phase 2]
  /value-chains   -> ValueChainsPage (Level 3) [Phase 3]
```

---

### 11. UserContext Provider (Est: 4 hours)

**File**: `apps/web/src/contexts/UserContext.tsx`

```typescript
interface UserContextType {
  user: User;
  level: 1 | 2 | 3;
  trustPosture: TrustPosture;
  permissions: UserPermissions;
}
```

**Subtasks**:
- [ ] 11.1 Create UserContext with React Context API
- [ ] 11.2 Implement `determineUserLevel()` function
- [ ] 11.3 Implement permissions derivation from level
- [ ] 11.4 Add React Query integration for user/delegations data
- [ ] 11.5 Create `useUser()` hook
- [ ] 11.6 Create `<ForLevel>` wrapper component
- [ ] 11.7 Write unit tests

**Permissions Matrix**:
```typescript
const permissions = {
  canRun: level >= 1,
  canConfigure: level >= 2,
  canDelegate: level >= 2,
  canCreateWorkUnits: level >= 2,
  canManageWorkspaces: level >= 2,
  canViewValueChains: level >= 3,
  canAccessCompliance: level >= 3,
  canEstablishTrust: level >= 3,
};
```

---

## Test Requirements

### Unit Tests

| Component | File | Min Coverage |
|-----------|------|--------------|
| WorkUnitCard | `WorkUnitCard.test.tsx` | 90% |
| WorkUnitIcon | `WorkUnitIcon.test.tsx` | 95% |
| TrustStatusBadge | `TrustStatusBadge.test.tsx` | 95% |
| CapabilityTags | `CapabilityTags.test.tsx` | 90% |
| SubUnitCount | `SubUnitCount.test.tsx` | 95% |
| WorkUnitActions | `WorkUnitActions.test.tsx` | 90% |
| WorkUnitDetailPanel | `WorkUnitDetailPanel.test.tsx` | 85% |
| MyTasksPage | `MyTasksPage.test.tsx` | 85% |
| AdaptiveSidebar | `AdaptiveSidebar.test.tsx` | 90% |
| UserContext | `UserContext.test.tsx` | 95% |

### E2E Tests

| Test | File | Scenarios |
|------|------|-----------|
| Level 1 Navigation | `level1-navigation.spec.ts` | Sidebar items, route access |
| Task Execution | `task-execution.spec.ts` | Run task, view results |
| Trust Status Display | `trust-status.spec.ts` | Badge states, disabled actions |

---

## Risk Assessment

### HIGH Risk
- **Integration with existing trust components**: The existing TrustDashboard in `apps/web/src/features/trust/` uses different component patterns. Need to ensure consistency.
  - *Mitigation*: Extract shared types and utilities, create adapter layer if needed.

### MEDIUM Risk
- **Performance with large work unit lists**: Rendering many WorkUnitCards could impact performance.
  - *Mitigation*: Implement virtualization with `react-window` if needed.

- **User level determination accuracy**: Incorrect level calculation could expose/hide features incorrectly.
  - *Mitigation*: Extensive unit tests for `determineUserLevel()`, add dev-mode level override.

### LOW Risk
- **Responsive design edge cases**: Complex card layouts on small screens.
  - *Mitigation*: Use mobile-first approach, test on various screen sizes.

---

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] All components have unit tests with specified coverage
- [ ] All E2E tests passing
- [ ] Accessibility audit passed (axe-core)
- [ ] Keyboard navigation verified
- [ ] Code review completed
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Documentation updated (component storybook entries)
- [ ] Performance benchmarks acceptable (<100ms render time)

---

## Estimated Total Effort

| Task | Hours |
|------|-------|
| WorkUnitCard | 4 |
| WorkUnitIcon | 2 |
| TrustStatusBadge | 3 |
| CapabilityTags | 2 |
| SubUnitCount | 1 |
| WorkUnitActions | 3 |
| WorkUnitDetailPanel | 6 |
| MyTasksPage | 8 |
| AdaptiveSidebar | 6 |
| Routing Updates | 3 |
| UserContext Provider | 4 |
| **Total** | **42 hours (~5-6 days)** |

---

## Notes

- This phase establishes patterns used in all subsequent phases
- Component APIs should be designed with extensibility for Level 2/3 features
- Existing trust visualization components should be reused where possible
- All new components should follow the existing design system patterns
