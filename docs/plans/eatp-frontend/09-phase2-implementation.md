# EATP Frontend: Phase 2 Implementation - Level 2 Experience

## Document Control
- **Version**: 1.0
- **Date**: 2026-01-04
- **Status**: Implemented
- **Author**: Kaizen Studio Team
- **Related TODO**: TODO-037

---

## Overview

Phase 2 implements the **Level 2 (Process Owner) experience**, enabling managers and team leads to:
1. View and manage composite work units (processes)
2. Organize work into purpose-driven workspaces
3. Monitor team activity and execution status
4. Delegate tasks to team members with trust constraints

This builds on Phase 1's foundation (TODO-036) which established the unified Work Unit model and Level 1 task performer experience.

---

## What Is Level 2?

Level 2 users are **Process Owners** - managers, team leads, and department heads who:
- Own and manage composite work units (multi-step processes)
- Coordinate work across team members
- Create and manage workspaces for cross-functional collaboration
- Delegate trust to team members with appropriate constraints

### Level 2 vs Level 1

| Aspect | Level 1 (Task Performer) | Level 2 (Process Owner) |
|--------|--------------------------|-------------------------|
| **Focus** | Individual task execution | Process orchestration |
| **View** | MyTasksPage - assigned atomic units | MyProcessesPage - owned processes |
| **Actions** | Run, View Results | Configure, Delegate, Audit |
| **Scope** | Single work unit | Multiple work units + team |
| **Trust** | Receives delegated trust | Delegates trust to others |

---

## Components Implemented

### 1. MyProcessesPage

**Location**: `apps/web/src/pages/work/MyProcessesPage.tsx`

**Purpose**: Central view for process owners to manage their composite work units and monitor team activity.

**Layout**:
```
+--------------------------------------------------+
|  My Processes                    [+ New Process] |
+--------------------------------------------------+
|                                                  |
|  +----------------------------------------------+
|  |  Invoice Processing                 Active   |
|  |  ------------------------------------------- |
|  |  [Extract] -> [Validate] -> [Route] -> [...]  |
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

**Key Features**:
- Two-column layout (processes on left, activity feed on right)
- Shows only composite work units the user owns/manages
- Inline flow preview showing process steps
- Delegation info (who delegated trust, team size)
- Activity stats (runs today, error count)

---

### 2. ProcessCard

**Location**: `apps/web/src/features/work-units/components/ProcessCard.tsx`

**Purpose**: Visual representation of a composite work unit with process-specific information.

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│   Invoice Processing                    ✓ Valid  Active  │
│   ────────────────────────────────────────────────────── │
│   [Extract] ─→ [Validate] ─→ [Route] ─→ [...]            │
│   ────────────────────────────────────────────────────── │
│   Delegated by CFO        │  5 team members              │
│   Runs today: 47          │  Errors: 2                   │
│   ────────────────────────────────────────────────────── │
│   [Configure]  [Delegate]  [View Runs]  [Audit]          │
└──────────────────────────────────────────────────────────┘
```

**Key Props**:
```typescript
interface ProcessCardProps {
  process: CompositeWorkUnit;
  onConfigure?: () => void;
  onDelegate?: () => void;
  onViewRuns?: () => void;
  onAudit?: () => void;
}
```

---

### 3. ProcessFlowPreview

**Location**: `apps/web/src/features/work-units/components/ProcessFlowPreview.tsx`

**Purpose**: Compact visualization of process steps showing the flow of work units.

**Features**:
- Horizontal step diagram (not full React Flow canvas)
- Trust status indicator per step (colored dots)
- Overflow handling with ellipsis (+N more)
- Compact mode for embedding in cards

**Visual**:
```
[Extract Data] → [Validate] → [Route] → [...]
   ●                ●            ●
 valid           valid        expired
```

---

### 4. TeamActivityFeed

**Location**: `apps/web/src/features/activity/components/TeamActivityFeed.tsx`

**Purpose**: Real-time feed showing team member activity across managed processes.

**Event Types**:
| Event | Icon | Color | Actions |
|-------|------|-------|---------|
| Completed | Check | Green | View Result |
| Failed | X | Red | View Error, Retry |
| Running | Spinner | Blue | View Status |
| Delegated | Arrow | Purple | View Chain |

**Features**:
- Relative time display ("2 min ago")
- User avatars and names
- Contextual actions per event type
- Polling for updates (30 second interval)

---

### 5. WorkspacesPage

**Location**: `apps/web/src/pages/build/WorkspacesPage.tsx`

**Purpose**: List and manage all workspaces the user has access to.

**Layout**:
```
+--------------------------------------------------+
|  Workspaces                     [+ New Workspace] |
+--------------------------------------------------+
|  [All] [Permanent] [Temporary] [Personal]        |
|  [Search...]                   [x] Show Archived |
|                                                  |
|  ┌────────────────────────────────────────────┐  |
|  │  🏢 Q4 Audit Prep              Temporary   │  |
|  │  Cross-functional audit workspace          │  |
|  │  12 work units  |  5 members               │  |
|  │  Expires in 23 days                        │  |
|  │  [Open]  [Edit]  [Archive]                 │  |
|  └────────────────────────────────────────────┘  |
+--------------------------------------------------+
```

**Workspace Types**:
| Type | Icon | Purpose | Expiration |
|------|------|---------|------------|
| Permanent | Building2 | Long-term departmental | Never |
| Temporary | FolderClock | Project-based | Has end date |
| Personal | Star | Individual favorites | Never |

---

### 6. WorkspaceCard

**Location**: `apps/web/src/features/work-units/components/WorkspaceCard.tsx`

**Purpose**: Visual representation of a workspace with stats and actions.

**Features**:
- Type-specific icons and colors
- Member and work unit counts
- Expiration warning styling
- Optional color bar for visual grouping
- Archived state handling

**Props**:
```typescript
interface WorkspaceCardProps {
  workspace: WorkspaceSummary;
  onOpen?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  disabled?: boolean;
}
```

---

### 7. WorkspaceDetailPage

**Location**: `apps/web/src/pages/build/WorkspaceDetailPage.tsx`

**Purpose**: Full view of a workspace showing members, work units, and trust delegation info.

**Layout**:
```
+--------------------------------------------------+
|  ← Back to Workspaces                            |
|  🏢 Q4 Audit Prep              [Edit] (Level 2+) |
|  Cross-functional audit workspace                |
|  Expires: December 31, 2026                      |
+--------------------------------------------------+
|  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ |
|  │ 12          │ │ 5           │ │ Alice Chen  │ |
|  │ Work Units  │ │ Members     │ │ Owner       │ |
|  └─────────────┘ └─────────────┘ └─────────────┘ |
+--------------------------------------------------+
|  Work Units               Members                |
|  ┌─────────────────────┐  ┌─────────────────────┐|
|  │ atomic Invoice Proc │  │ 👤 Alice  [Owner]   │|
|  │     ✓ Valid         │  │    Finance          │|
|  ├─────────────────────┤  ├─────────────────────┤|
|  │ composite Report Gen│  │ 👤 Bob    [Member]  │|
|  │     ✓ Valid         │  │    Legal            │|
|  └─────────────────────┘  └─────────────────────┘|
+--------------------------------------------------+
|  Trust Delegation                                |
|  Delegated by: Alice Chen                        |
|  Organization: Current Organization              |
|  Status: Active                                  |
+--------------------------------------------------+
```

---

## API Integration

### Workspace API

**Location**: `apps/web/src/features/work-units/api/workspaces.ts`

| Function | Description |
|----------|-------------|
| `fetchWorkspaces(filters?)` | List workspaces with optional filters |
| `fetchWorkspace(id)` | Get workspace details with members and work units |
| `createWorkspace(data)` | Create new workspace |
| `updateWorkspace(id, data)` | Update workspace metadata |
| `archiveWorkspace(id)` | Archive a workspace |
| `restoreWorkspace(id)` | Restore archived workspace |
| `addWorkspaceMember(id, data)` | Add member to workspace |
| `removeWorkspaceMember(id, userId)` | Remove member |
| `addWorkUnitToWorkspace(id, data)` | Add work unit to workspace |
| `removeWorkUnitFromWorkspace(id, wuId)` | Remove work unit |

### React Query Hooks

**Location**: `apps/web/src/features/work-units/hooks/useWorkspaces.ts`

```typescript
// Query key factory
export const workspaceKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceKeys.all, 'list'] as const,
  list: (filters?: WorkspaceFilters) => [...workspaceKeys.lists(), filters] as const,
  details: () => [...workspaceKeys.all, 'detail'] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
  members: (id: string) => [...workspaceKeys.all, 'members', id] as const,
  workUnits: (id: string) => [...workspaceKeys.all, 'work-units', id] as const,
};

// Hooks
export function useWorkspaceList(filters?: WorkspaceFilters);
export function useWorkspaceDetail(id?: string);
export function useCreateWorkspace();
export function useUpdateWorkspace();
export function useArchiveWorkspace();
// ... and more mutation hooks
```

---

## Routing

### New Routes

| Route | Page | Access |
|-------|------|--------|
| `/work/processes` | MyProcessesPage | Level 2+ |
| `/work/processes/:id` | MyProcessesPage (with detail) | Level 2+ |
| `/build/workspaces` | WorkspacesPage | Level 2+ |
| `/build/workspaces/:id` | WorkspaceDetailPage | Level 2+ |

### App.tsx Integration

```typescript
// Lazy-loaded pages
const MyProcessesPage = lazy(() =>
  import("./pages/work").then((m) => ({ default: m.MyProcessesPage }))
);
const WorkspacesPage = lazy(() =>
  import("./pages/build").then((m) => ({ default: m.WorkspacesPage }))
);
const WorkspaceDetailPage = lazy(() =>
  import("./pages/build").then((m) => ({ default: m.WorkspaceDetailPage }))
);

// Routes (inside ProtectedRoute with AppShell)
<Route path="/work/processes" element={<MyProcessesPage />} />
<Route path="/work/processes/:id" element={<MyProcessesPage />} />
<Route path="/build/workspaces" element={<WorkspacesPage />} />
<Route path="/build/workspaces/:id" element={<WorkspaceDetailPage />} />
```

---

## Types

### Core Types

**Location**: `apps/web/src/features/work-units/types/index.ts`

```typescript
// Workspace types
export type WorkspaceType = 'permanent' | 'temporary' | 'personal';
export type WorkspaceMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

// Member structure
export interface WorkspaceMember {
  userId: string;
  userName: string;
  role: WorkspaceMemberRole;
  department?: string;
  joinedAt: string;
}

// Work unit reference within workspace
export interface WorkspaceWorkUnit {
  workUnitId: string;
  workUnitName: string;
  workUnitType: 'atomic' | 'composite';
  trustStatus: 'valid' | 'expired' | 'revoked' | 'pending';
  addedAt: string;
  addedBy: string;
}

// Full workspace
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  workspaceType: WorkspaceType;
  color?: string;
  ownerId: string;
  ownerName: string;
  organizationId: string;
  members: WorkspaceMember[];
  workUnits: WorkspaceWorkUnit[];
  memberCount: number;
  workUnitCount: number;
  expiresAt?: string;
  archivedAt?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## Test Coverage

### Component Tests

| Component | Tests | Status |
|-----------|-------|--------|
| ProcessCard | 45 | Passing |
| ProcessFlowPreview | 34 | Passing |
| TeamActivityFeed | 39 | Passing |
| WorkspaceCard | 45 | Passing |
| Total work-units tests | 537 | Passing |

### Hook Tests

| Hook | Tests | Status |
|------|-------|--------|
| useWorkspaceList | 5 | Passing |
| useWorkspaceDetail | 3 | Passing |
| useCreateWorkspace | 2 | Passing |
| useArchiveWorkspace | 2 | Passing |
| Total hook tests | 13 | Passing |

---

## Design Decisions

### 1. Two-Column Layout for MyProcessesPage

**Decision**: Split view with processes on left and activity feed on right.

**Rationale**: Process owners need both a bird's-eye view of their processes AND real-time awareness of team activity. A split view provides this without context switching.

### 2. Inline Flow Preview (Not Full Canvas)

**Decision**: Use compact step diagram instead of embedded React Flow canvas.

**Rationale**: Full canvas is overkill for preview purposes and has performance implications when rendering multiple cards. A simple step diagram conveys the same information faster.

### 3. Workspace Type Filtering with Tabs

**Decision**: Use Tabs component for workspace type filtering instead of dropdown.

**Rationale**: Only 4 types (all, permanent, temporary, personal) makes tabs more discoverable than hidden dropdown. Users can quickly switch between views.

### 4. Trust Status on Every Work Unit in Workspace

**Decision**: Always show trust status badge on work unit rows within workspace detail.

**Rationale**: Trust is central to EATP. Hiding it in detail views risks users missing expired or revoked trust states.

---

## Remaining Work (Not in Phase 2)

The following features are planned for future phases:

### DelegationWizard Enhancement (Phase 3)
- Constraint tightening validation
- Trust chain preview before delegation
- Expiration date picker

### TrustChainPreview Component (Phase 3)
- Horizontal chain visualization
- User icons at each node
- Constraint summary under arrows

### E2E Tests
- Level 2 navigation flow
- Delegation wizard flow
- Workspace management flow

---

## How to Use

### For Level 2 Users

1. **Access My Processes**: Navigate to `/work/processes` to see composite work units you own
2. **Monitor Team Activity**: Activity feed on the right shows real-time team executions
3. **Manage Workspaces**: Navigate to `/build/workspaces` to create/manage collaborative spaces
4. **View Workspace Details**: Click on a workspace to see members and work units

### For Developers

1. **Add New Process Actions**: Extend ProcessCard with new action buttons
2. **Add New Activity Types**: Extend TeamActivityFeed event type handling
3. **Add Workspace Features**: Use workspace API hooks for new functionality
4. **Gate by Level**: Use `ForLevel` component to restrict UI to specific user levels

```typescript
import { ForLevel } from '@/contexts/UserLevelContext';

// Only show for Level 2 and above
<ForLevel min={2}>
  <Button onClick={handleDelegate}>Delegate</Button>
</ForLevel>
```

---

## Related Documentation

- **Phase 1 (Level 1)**: `TODO-036` - Task performer experience
- **Work Unit Model**: `docs/plans/eatp-ontology/02-work-unit-model.md`
- **Workspace Design**: `docs/plans/eatp-ontology/04-workspaces.md`
- **User Levels**: `docs/plans/eatp-ontology/03-user-experience-levels.md`
- **Navigation**: `docs/plans/eatp-ontology/06-navigation-architecture.md`
