# TODO-037: EATP Ontology Redesign - Phase 2: Level 2 Experience

**Status**: COMPLETED
**Priority**: HIGH
**Created**: 2026-01-04
**Started**: 2026-01-04
**Completed**: 2026-01-04
**Owner**: Frontend Team

## Progress Summary

### Completed ✓
- MyProcessesPage implemented with 2-column layout (processes + team activity feed)
- ProcessCard component with flow preview, delegation info, stats, and actions
- ProcessFlowPreview component with trust status indicators and ellipsis
- TeamActivityFeed component with relative times and error actions
- Routes for /work/processes with lazy loading
- API integration (fetchProcesses, fetchTeamActivity)
- React Query hooks (useProcesses, useTeamActivity)
- **WorkspacesPage** - List view with type filtering (permanent/temporary/personal)
- **WorkspaceCard** - Card component with type badges, stats, and expiration display
- **WorkspaceDetailPage** - Detail view with members, work units, and trust info
- **Workspace API** - Full CRUD + member management + work unit delegation
- **Workspace Hooks** - useWorkspaceList, useWorkspaceDetail, mutation hooks
- Routes for /build/workspaces and /build/workspaces/:id
- **ConstraintsStep Enhancement** - Constraint tightening validation with delegator limits display
- **TrustChainPreview** - Visual preview of delegation chain with constraint summaries
- Unit tests: 537 work-units tests + 413 trust tests passing
- **Phase 2 Documentation** - `docs/plans/eatp-frontend/09-phase2-implementation.md`

### Deferred to Phase 3
- E2E tests for Phase 2 features (requires backend integration)

---

## Overview

Phase 2 implements the Level 2 (Process Owner) experience, enabling managers and team leads to view and manage composite work units, delegate tasks to team members, and organize work into purpose-driven workspaces.

This phase focuses on:
1. Building the MyProcessesPage with flow visualization
2. Enhancing the DelegationWizard with constraint tightening
3. Implementing Workspace management UI
4. Adding team activity feed functionality

---

## Planning Document References

- **UX Levels**: `docs/plans/eatp-ontology/03-user-experience-levels.md`
- **Workspaces**: `docs/plans/eatp-ontology/04-workspaces.md`
- **Level-Based Experience**: `docs/plans/eatp-frontend/05-level-based-experience.md`
- **Navigation Architecture**: `docs/plans/eatp-ontology/06-navigation-architecture.md`

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| TODO-036 (Phase 1 Foundation) | Prerequisite | COMPLETED |
| WorkUnitCard component | From Phase 1 | COMPLETED |
| AdaptiveSidebar | From Phase 1 | COMPLETED |
| UserContext with levels | From Phase 1 | COMPLETED |
| Existing DelegationWizard | Existing | Available in `apps/web/src/features/trust/` |
| React Flow | Existing | Available |

---

## Acceptance Criteria

### MyProcessesPage

- [x] **AC-1**: MyProcessesPage displays all composite work units the user can manage
- [x] **AC-2**: Process cards show inline flow visualization (step diagram)
- [x] **AC-3**: Process cards show delegation info (delegated by, team size)
- [x] **AC-4**: Process cards show activity stats (runs today, errors)
- [x] **AC-5**: Page includes team activity feed section

### DelegationWizard Enhancement

- [x] **AC-6**: Wizard enforces constraint tightening rule (cannot exceed own limits)
- [x] **AC-7**: Wizard shows visual preview of trust chain before delegation
- [x] **AC-8**: Wizard allows selecting capabilities to delegate (subset only)
- [x] **AC-9**: Wizard shows warning when exceeding constraints
- [x] **AC-10**: Wizard includes expiration date picker with validation

### Workspace Management

- [x] **AC-11**: WorkspaceList page shows all workspaces user has access to
- [x] **AC-12**: WorkspaceDetail page shows grouped work units by department/category
- [x] **AC-13**: Workspace members list shows access levels (Owner, Full, Run Only)
- [x] **AC-14**: Users can add/remove work units from workspaces they own
- [x] **AC-15**: Workspace expiration is displayed prominently

### Team Activity Feed

- [x] **AC-16**: Activity feed shows recent executions by team members
- [x] **AC-17**: Activity feed shows delegation events
- [x] **AC-18**: Activity feed shows error events with "View Error" action
- [x] **AC-19**: Activity feed updates in real-time (polling or websocket)

### Routing & Navigation

- [x] **AC-20**: Route `/work/processes` renders MyProcessesPage (Level 2+)
- [x] **AC-21**: Route `/build/workspaces` renders WorkspaceList (Level 2+)
- [x] **AC-22**: Route `/build/workspaces/:id` renders WorkspaceDetail
- [x] **AC-23**: Level 2 sidebar shows "My Processes" under WORK

### Testing

- [x] **AC-24**: All components have unit tests with >80% coverage (131 tests for Phase 2 components)
- [ ] **AC-25**: E2E tests cover delegation flow end-to-end
- [ ] **AC-26**: E2E tests cover workspace management flow

---

## Implementation Tasks

### 1. MyProcessesPage (Est: 10 hours)

**File**: `apps/web/src/pages/work/MyProcessesPage.tsx`

**Subtasks**:
- [x] 1.1 Create page layout with header and "New Process" button
- [x] 1.2 Create ProcessCard component (extended WorkUnitCard)
- [x] 1.3 Implement inline flow visualization using React Flow mini view
- [x] 1.4 Add delegation info display (delegated by, team members count)
- [x] 1.5 Add activity stats (runs today, error count)
- [x] 1.6 Add process action buttons (Configure, Delegate, View Runs, Audit)
- [x] 1.7 Integrate with work-units API (filter: type=composite)
- [x] 1.8 Add empty state for no processes
- [x] 1.9 Write unit tests
- [ ] 1.10 Write E2E test

**Layout**:
```
+--------------------------------------------------+
|  My Processes                    [+ New Process] |
+--------------------------------------------------+
|  Active Processes                                |
|                                                  |
|  +----------------------------------------------+
|  |  Invoice Processing                 Active   |
|  |  ------------------------------------------- |
|  |  [Extract] -> [Validate] -> [Route] -> [Arch]|
|  |                                              |
|  |  Trust: Valid from CFO  |  Team: 5 members   |
|  |  Runs today: 47         |  Errors: 2         |
|  |                                              |
|  |  [Configure] [Delegate] [View Runs] [Audit]  |
|  +----------------------------------------------+
|                                                  |
+--------------------------------------------------+
|  Team Activity                                   |
|                                                  |
|  * Bob ran Invoice Processing - 2 min ago       |
|  * Alice completed Contract Review - 15 min ago |
|  * Carol failed Invoice Processing - 1 hour ago |
|      -> [View Error] [Retry]                    |
+--------------------------------------------------+
```

---

### 2. ProcessCard Component (Est: 6 hours)

**File**: `apps/web/src/features/work-units/components/ProcessCard.tsx`

```typescript
interface ProcessCardProps {
  process: CompositeWorkUnit;
  onConfigure: () => void;
  onDelegate: () => void;
  onViewRuns: () => void;
  onAudit: () => void;
}
```

**Subtasks**:
- [x] 2.1 Extend WorkUnitCard with process-specific features
- [x] 2.2 Create ProcessFlowPreview component for inline visualization
- [x] 2.3 Create DelegationInfoBadge showing "Valid from [Delegator]"
- [x] 2.4 Create TeamSizeBadge showing member count
- [x] 2.5 Create ActivityStatsBadge showing runs/errors
- [x] 2.6 Add process-specific action buttons
- [x] 2.7 Write unit tests (45 tests)

---

### 3. ProcessFlowPreview Component (Est: 4 hours)

**File**: `apps/web/src/features/work-units/components/ProcessFlowPreview.tsx`

```typescript
interface ProcessFlowPreviewProps {
  subUnits: WorkUnit[];
  connections: Connection[];
  compact?: boolean;
}
```

**Subtasks**:
- [x] 3.1 Create compact React Flow viewer (no interactions)
- [x] 3.2 Render sub-unit nodes as small boxes with names
- [x] 3.3 Draw connections between nodes (arrows)
- [x] 3.4 Show trust status indicator on each node
- [x] 3.5 Handle overflow for long chains (ellipsis with +N)
- [x] 3.6 Write unit tests (34 tests)

---

### 4. DelegationWizard Enhancement (Est: 8 hours) ✓

**File**: `apps/web/src/features/trust/components/DelegationWizard.tsx` (enhance existing)

**Subtasks**:
- [x] 4.1 Add Step 1: Select Team Member (with search) - SourceAgentStep
- [x] 4.2 Add Step 2: Select Capabilities (checkbox list, subset of own) - CapabilitySelectionStep
- [x] 4.3 Add Step 3: Configure Constraints with tightening validation - ConstraintsStep enhanced
- [x] 4.4 Add Step 4: Set Duration (expiration date picker) - ReviewStep
- [x] 4.5 Add Step 5: Review with trust chain preview - ReviewStep + TrustChainPreview
- [x] 4.6 Implement constraint validation (cannot exceed own limits) - ConstraintsStep
- [x] 4.7 Add warning messages when approaching limits - ConstraintsStep violations UI
- [x] 4.8 Create TrustChainPreview component showing delegation flow
- [x] 4.9 Write unit tests (26 ConstraintsStep + 23 TrustChainPreview tests)
- [ ] 4.10 Write E2E test for full delegation flow (deferred to Phase 3)

**Constraint Tightening UI**:
```
+--------------------------------------------------+
|  Constraints (can only tighten)                  |
|                                                  |
|  Your limit: $500/day                            |
|  +----------------------------------------------+
|  | Their limit: [$250/day           v]          |
|  +----------------------------------------------+
|  Warning: Cannot exceed your limit of $500/day  |
|                                                  |
|  Duration                                        |
|  +----------------------------------------------+
|  | 30 days                            [v]       |
|  +----------------------------------------------+
+--------------------------------------------------+
```

---

### 5. TrustChainPreview Component (Est: 3 hours) ✓

**File**: `apps/web/src/features/trust/components/TrustManagement/TrustChainPreview/index.tsx`

```typescript
interface TrustChainPreviewProps {
  chain: TrustChainLink[];
  highlightNew?: boolean;
  compact?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

interface TrustChainLink {
  fromId: string;
  fromName: string;
  fromType: 'human' | 'agent';
  toId: string;
  toName: string;
  toType: 'human' | 'agent';
  constraintSummary?: string;
  constraints?: string[];
  isNew?: boolean;
  hasViolation?: boolean;
  violationMessage?: string;
}
```

**Subtasks**:
- [x] 5.1 Create horizontal chain visualization (+ vertical orientation option)
- [x] 5.2 Show user icons/names at each node
- [x] 5.3 Show constraint summary under each arrow
- [x] 5.4 Highlight the new delegation being created
- [x] 5.5 Write unit tests (23 tests)

**Visual**:
```
CFO -> You -> Alice
$500/day -> $500/day -> $250/day
```

---

### 6. WorkspaceList Page (Est: 6 hours) ✓

**File**: `apps/web/src/pages/build/WorkspacesPage.tsx`

**Subtasks**:
- [x] 6.1 Create page layout with header and "New Workspace" button
- [x] 6.2 Create WorkspaceCard component (45 tests)
- [x] 6.3 Display workspace name, description, and purpose
- [x] 6.4 Show work unit count and member count
- [x] 6.5 Show expiration date with warning styling if soon
- [x] 6.6 Add filter by type (permanent/temporary/personal)
- [x] 6.7 Integrate with workspaces API and hooks (13 tests)
- [x] 6.8 Write unit tests
- [ ] 6.9 Write E2E test

**Layout**:
```
+--------------------------------------------------+
|  Workspaces                      [+ New Workspace]|
+--------------------------------------------------+
|  [My Workspaces] [Shared with Me]                |
|                                                  |
|  +----------------------------------------------+
|  |  Q4 Audit Prep                               |
|  |  Cross-functional workspace for Q4 audit     |
|  |                                              |
|  |  12 work units  |  5 members  |  Exp: Dec 31 |
|  +----------------------------------------------+
|                                                  |
|  +----------------------------------------------+
|  |  Invoice Team                                |
|  |  Finance department invoice processing       |
|  |                                              |
|  |  4 work units  |  8 members  |  No expiration|
|  +----------------------------------------------+
+--------------------------------------------------+
```

---

### 7. WorkspaceDetail Page (Est: 8 hours) ✓

**File**: `apps/web/src/pages/build/WorkspaceDetailPage.tsx`

**Subtasks**:
- [x] 7.1 Create page layout with workspace header
- [x] 7.2 Display expiration and member count prominently
- [x] 7.3 Create WorkUnitsSection grouped by category/department
- [x] 7.4 Add "Add Unit" functionality (navigation to add page)
- [x] 7.5 Add "Remove Unit" functionality (for owners only)
- [x] 7.6 Create MembersSection with access levels
- [x] 7.7 Add "Invite Member" functionality (navigation to invite page)
- [x] 7.8 Add "Edit Workspace" button for owners
- [x] 7.9 Integrate with workspace and members APIs
- [ ] 7.10 Write unit tests (page-level tests pending)
- [ ] 7.11 Write E2E test

**Layout**:
```
+--------------------------------------------------+
|  Q4 Audit Prep                      [Edit] [Arch]|
|  Cross-functional workspace for Q4 audit prep   |
|  Expires: December 31, 2026 | 12 units | 5 memb |
+--------------------------------------------------+
|  Work Units                          [+ Add Unit]|
|                                                  |
|  Finance                                         |
|  +-- Financial Report Generator                  |
|  +-- Revenue Analyzer                            |
|                                                  |
|  Legal                                           |
|  +-- Contract Reviewer                           |
|                                                  |
|  Compliance                                      |
|  +-- Audit Trail Analyzer                        |
+--------------------------------------------------+
|  Members                       [+ Invite Member] |
|                                                  |
|  Alice Chen (Owner)      Finance      Full Access|
|  Bob Smith               Legal        Run Only   |
|  Carol Johnson          Compliance    Run Only   |
+--------------------------------------------------+
```

---

### 8. TeamActivityFeed Component (Est: 5 hours)

**File**: `apps/web/src/features/activity/components/TeamActivityFeed.tsx`

```typescript
interface TeamActivityFeedProps {
  teamId?: string;
  processId?: string;
  limit?: number;
  showViewAll?: boolean;
}
```

**Subtasks**:
- [x] 8.1 Create ActivityItem component for different event types
- [x] 8.2 Implement execution events (completed, failed, running)
- [x] 8.3 Implement delegation events
- [x] 8.4 Add "View Error" and "Retry" actions for failures
- [x] 8.5 Add relative time display (2 min ago, 1 hour ago)
- [x] 8.6 Implement polling for updates (every 30 seconds)
- [x] 8.7 Add "View All" link to full activity page
- [x] 8.8 Write unit tests (39 tests)

**Event Types**:
| Event | Icon | Color | Actions |
|-------|------|-------|---------|
| Completed | Check | Green | View Result |
| Failed | X | Red | View Error, Retry |
| Running | Spinner | Blue | View Status |
| Delegated | Arrow | Purple | View Chain |

---

### 9. Routing Updates (Est: 2 hours)

**File**: `apps/web/src/routes/index.tsx`

**Subtasks**:
- [x] 9.1 Add `/work/processes` route with Level 2+ guard
- [ ] 9.2 Add `/build/workspaces` route with Level 2+ guard
- [ ] 9.3 Add `/build/workspaces/:id` route for workspace detail
- [x] 9.4 Update sidebar configuration with new routes
- [ ] 9.5 Write E2E navigation tests

---

### 10. API Integration (Est: 4 hours)

**Files**:
- `apps/web/src/api/workspaces.ts`
- `apps/web/src/api/activity.ts`

**Subtasks**:
- [ ] 10.1 Create workspaces API client
- [x] 10.2 Create activity API client (fetchTeamActivity in work-units/api)
- [x] 10.3 Add React Query hooks for data fetching (useProcesses, useTeamActivity)
- [ ] 10.4 Add mutation hooks for workspace management
- [ ] 10.5 Add mutation hooks for delegation
- [x] 10.6 Write integration tests (13 hook tests)

**API Endpoints**:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/workspaces` | GET | List workspaces |
| `/api/workspaces/:id` | GET | Get workspace detail |
| `/api/workspaces` | POST | Create workspace |
| `/api/workspaces/:id` | PUT | Update workspace |
| `/api/workspaces/:id/work-units` | POST | Add work unit |
| `/api/workspaces/:id/work-units/:wuId` | DELETE | Remove work unit |
| `/api/workspaces/:id/members` | POST | Invite member |
| `/api/activity/team` | GET | Get team activity |
| `/api/activity/process/:id` | GET | Get process activity |

---

## Test Requirements

### Unit Tests

| Component | File | Min Coverage |
|-----------|------|--------------|
| MyProcessesPage | `MyProcessesPage.test.tsx` | 85% |
| ProcessCard | `ProcessCard.test.tsx` | 90% |
| ProcessFlowPreview | `ProcessFlowPreview.test.tsx` | 90% |
| DelegationWizard | `DelegationWizard.test.tsx` | 90% |
| TrustChainPreview | `TrustChainPreview.test.tsx` | 95% |
| WorkspaceList | `WorkspaceList.test.tsx` | 85% |
| WorkspaceDetail | `WorkspaceDetail.test.tsx` | 85% |
| TeamActivityFeed | `TeamActivityFeed.test.tsx` | 90% |

### E2E Tests

| Test | File | Scenarios |
|------|------|-----------|
| Level 2 Navigation | `level2-navigation.spec.ts` | Sidebar items, route access |
| Delegation Flow | `delegation-flow.spec.ts` | Full wizard flow with constraint validation |
| Workspace Management | `workspace-management.spec.ts` | Create, edit, add units, invite members |
| Process Execution | `process-execution.spec.ts` | Run process, view activity |

---

## Risk Assessment

### HIGH Risk
- **Constraint tightening validation**: Complex business logic that must be 100% correct to prevent trust escalation.
  - *Mitigation*: Extensive unit tests, dual validation on client and server.

### MEDIUM Risk
- **React Flow performance**: Inline flow previews in many cards could be slow.
  - *Mitigation*: Use React Flow mini-map mode, lazy render off-screen cards.

- **Real-time activity feed**: Polling overhead or websocket complexity.
  - *Mitigation*: Start with polling (30s), optimize later if needed.

### LOW Risk
- **Workspace permissions edge cases**: Complex permission combinations.
  - *Mitigation*: Clear permission model with tests.

---

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] All components have unit tests with specified coverage
- [ ] All E2E tests passing
- [ ] Delegation constraint validation verified on both client and server
- [ ] Accessibility audit passed (axe-core)
- [ ] Keyboard navigation verified
- [ ] Code review completed
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Documentation updated (component storybook entries)
- [ ] Performance benchmarks acceptable

---

## Estimated Total Effort

| Task | Hours |
|------|-------|
| MyProcessesPage | 10 |
| ProcessCard | 6 |
| ProcessFlowPreview | 4 |
| DelegationWizard Enhancement | 8 |
| TrustChainPreview | 3 |
| WorkspaceList Page | 6 |
| WorkspaceDetail Page | 8 |
| TeamActivityFeed | 5 |
| Routing Updates | 2 |
| API Integration | 4 |
| **Total** | **56 hours (~7 days)** |

---

## Notes

- Delegation wizard enhancements build on existing TODO-018 DelegationWizard
- Workspace model follows ontology spec in `docs/plans/eatp-ontology/04-workspaces.md`
- Team activity feed should be reusable across different contexts
- Constraint tightening is a CRITICAL security feature - must be thoroughly tested
