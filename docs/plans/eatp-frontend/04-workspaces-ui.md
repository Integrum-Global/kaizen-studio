# EATP Frontend: Workspaces UI

## Document Control
- **Version**: 1.0
- **Date**: 2026-01-03
- **Status**: Planning
- **Author**: Kaizen Studio Team

---

## Overview

This document defines the React component architecture for Workspaces - purpose-driven collections of work units that can span departments and teams. Workspaces act as "lenses" for organizing work, not containers. A work unit can appear in multiple workspaces.

See ontology reference: `docs/plans/eatp-ontology/04-workspaces.md`

---

## Design Principles

### 1. Purpose-Driven Organization
- Workspaces are created for specific goals (project, initiative, audit)
- They can have expiration dates
- Cross-department by design

### 2. Lenses, Not Containers
- Work units can belong to multiple workspaces
- Workspaces don't "own" work units
- Think of them as saved views or collections

### 3. Delegation Scope
- Workspaces define delegation boundaries
- Members receive access to all workspace work units
- Constraints can be workspace-scoped

---

## Component Architecture

### Component Hierarchy

```
WorkspacesPage
├── WorkspaceFilters
│   ├── SearchInput
│   ├── TypeFilter (All | Active | Archived)
│   └── DepartmentFilter
├── WorkspaceList
│   └── WorkspaceCard (repeated)
│       ├── WorkspaceIcon
│       ├── WorkspaceHeader
│       ├── WorkspaceStats
│       ├── MemberAvatars
│       └── WorkspaceActions
└── WorkspaceDetailPage (separate route)
    ├── WorkspaceHeader
    ├── WorkspaceDescription
    ├── WorkUnitSection
    │   ├── WorkUnitGrid
    │   └── AddWorkUnitButton
    ├── MembersSection
    │   ├── MemberList
    │   └── InviteMemberButton
    ├── ActivitySection
    │   └── ActivityFeed
    └── WorkspaceSettings (slide-over)
```

---

## Core Components

### 1. WorkspaceCard

Card representation for workspace list view.

```tsx
interface WorkspaceCardProps {
  workspace: Workspace;
  onClick?: () => void;
  onArchive?: () => void;
  showActions?: boolean;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  type: 'permanent' | 'temporary' | 'personal';
  workUnitCount: number;
  memberCount: number;
  departments: string[];
  expiresAt?: string;  // For temporary workspaces
  createdBy: string;
  createdAt: string;
  isArchived: boolean;
}
```

**Visual Design**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Q4 Audit Preparation                               ┌──────────┐  │
│   Cross-functional workspace for Q4 audit            │ Expires  │  │
│                                                      │ Dec 31   │  │
│   ┌────────────────────────────────────────────┐     └──────────┘  │
│   │ Finance • Legal • Compliance               │                   │
│   └────────────────────────────────────────────┘                   │
│                                                                     │
│   12 work units  •  5 members                                       │
│                                                                     │
│   ┌──┐ ┌──┐ ┌──┐ ┌──┐ +1                                           │
│   │👤│ │👤│ │👤│ │👤│                                               │
│   └──┘ └──┘ └──┘ └──┘                                               │
│                                                                     │
│   [Open Workspace]                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Type Indicators**:

| Type | Visual | Description |
|------|--------|-------------|
| Permanent | No badge | Ongoing workspace |
| Temporary | "Expires X" badge | Has end date |
| Personal | Lock icon | Private to creator |

---

### 2. WorkspaceIcon

Visual representation of workspace type and status.

```tsx
interface WorkspaceIconProps {
  type: 'permanent' | 'temporary' | 'personal';
  departments?: string[];  // For multi-department indicator
  size?: 'sm' | 'md' | 'lg';
}
```

---

### 3. DepartmentTags

Shows which departments are involved in a workspace.

```tsx
interface DepartmentTagsProps {
  departments: string[];
  maxVisible?: number;
  colorCoded?: boolean;
}
```

**Visual**:

```
┌────────────────────────────────────────────────┐
│ Finance • Legal • Compliance                   │
└────────────────────────────────────────────────┘
```

**Color Coding**:

| Department | Color |
|------------|-------|
| Finance | Blue |
| Legal | Purple |
| Compliance | Orange |
| Engineering | Green |
| Marketing | Pink |
| Operations | Teal |

---

### 4. MemberAvatars

Compact display of workspace members.

```tsx
interface MemberAvatarsProps {
  members: WorkspaceMember[];
  maxVisible?: number;  // Default 4
  size?: 'sm' | 'md';
  onClick?: () => void;  // Expand to member list
}

interface WorkspaceMember {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'owner' | 'admin' | 'member';
  accessLevel: 'full' | 'run_only';
  department?: string;
}
```

**Visual**:

```
┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌────┐
│AC│ │BS│ │CJ│ │DK│ │ +3 │
└──┘ └──┘ └──┘ └──┘ └────┘
```

---

### 5. ExpiryBadge

Shows workspace expiration for temporary workspaces.

```tsx
interface ExpiryBadgeProps {
  expiresAt: string;
  warningDays?: number;  // Default 7 - show warning when close
}
```

**Visual States**:

| State | Visual | Condition |
|-------|--------|-----------|
| Normal | Gray "Expires Dec 31" | >7 days |
| Warning | Amber "Expires in 5 days" | ≤7 days |
| Urgent | Red "Expires tomorrow" | ≤1 day |
| Expired | Red "Expired" | Past date |

---

## Page Components

### 1. WorkspacesPage

Main listing page for all workspaces.

```tsx
interface WorkspacesPageProps {
  userLevel: 1 | 2 | 3;
}
```

**Layout**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Workspaces                                    [+ New Workspace]   │
│   Purpose-driven collections of work units                          │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 🔍 Search workspaces...                                      │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   [All] [Active] [Archived]              [Department: All ▾]       │
│                                                                     │
│   MY WORKSPACES                                                     │
│                                                                     │
│   ┌───────────────────────┐  ┌───────────────────────┐             │
│   │                       │  │                       │             │
│   │  Q4 Audit Prep        │  │  Invoice Automation   │             │
│   │  Finance • Legal      │  │  Finance              │             │
│   │                       │  │                       │             │
│   │  12 units • 5 members │  │  4 units • 3 members  │             │
│   │                       │  │                       │             │
│   └───────────────────────┘  └───────────────────────┘             │
│                                                                     │
│   SHARED WITH ME                                                    │
│                                                                     │
│   ┌───────────────────────┐  ┌───────────────────────┐             │
│   │                       │  │                       │             │
│   │  Legal Review         │  │  Compliance Reports   │             │
│   │  Legal                │  │  Compliance           │             │
│   │                       │  │                       │             │
│   │  8 units • 6 members  │  │  6 units • 4 members  │             │
│   │                       │  │                       │             │
│   └───────────────────────┘  └───────────────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 2. WorkspaceDetailPage

Full workspace view with work units and members.

**Layout**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ← Workspaces                                                      │
│                                                                     │
│   Q4 Audit Preparation                           [Edit] [Archive]   │
│   Cross-functional workspace for Q4 audit preparation               │
│                                                                     │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │ Expires: Dec 31, 2026  │  12 work units  │  5 members      │   │
│   └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ═══════════════════════════════════════════════════════════════  │
│                                                                     │
│   Work Units                                          [+ Add Unit]  │
│                                                                     │
│   FINANCE                                                           │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ◉◉◉ Financial Report Generator         ✓ Valid              │  │
│   │ ◉   Revenue Analyzer                   ✓ Valid              │  │
│   │ ◉   Cost Calculator                    ✓ Valid              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   LEGAL                                                             │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ◉   Contract Reviewer                  ✓ Valid              │  │
│   │ ◉   Compliance Checker                 ⏰ Expires in 5 days  │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   COMPLIANCE                                                        │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ◉   Audit Trail Analyzer               ✓ Valid              │  │
│   │ ◉◉◉ Compliance Report Generator        ✓ Valid              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ═══════════════════════════════════════════════════════════════  │
│                                                                     │
│   Members                                    [+ Invite Member]      │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 👤 Alice Chen          Owner      Finance     Full Access   │  │
│   │ 👤 Bob Smith           Admin      Legal       Full Access   │  │
│   │ 👤 Carol Johnson       Member     Compliance  Run Only      │  │
│   │ 👤 David Kim           Member     Finance     Run Only      │  │
│   │ 👤 Eve Martinez        Member     Legal       Run Only      │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ═══════════════════════════════════════════════════════════════  │
│                                                                     │
│   Recent Activity                                                   │
│                                                                     │
│   • Alice added "Audit Trail Analyzer" to workspace     2h ago     │
│   • Bob ran "Contract Reviewer"                         3h ago     │
│   • Carol joined workspace                              1d ago     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3. WorkspaceCreateModal

Modal for creating new workspaces.

```tsx
interface WorkspaceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}
```

**Layout**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Create Workspace                                           [×]    │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   Name *                                                            │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ Q4 Audit Preparation                                        │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Description                                                       │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ Cross-functional workspace for Q4 audit preparation         │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Type                                                              │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ○ Permanent - Ongoing workspace                              │  │
│   │ ● Temporary - Has end date                                   │  │
│   │ ○ Personal  - Private to you                                 │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Expires (for temporary)                                           │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ December 31, 2026                                  [📅]     │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Departments                                                       │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ [Finance ×] [Legal ×] [+ Add department]                    │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│                                      [Cancel]  [Create Workspace]   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4. AddWorkUnitModal

Modal for adding work units to a workspace.

```tsx
interface AddWorkUnitModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded: (workUnitIds: string[]) => void;
}
```

**Layout**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Add Work Units to Q4 Audit Prep                            [×]    │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 🔍 Search available work units...                           │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   [All Departments ▾]                                               │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   ☑ Financial Report Generator              Finance     ✓ Valid    │
│   ☐ Revenue Analyzer                        Finance     ✓ Valid    │
│   ☑ Contract Reviewer                       Legal       ✓ Valid    │
│   ☐ Compliance Checker                      Compliance  ✓ Valid    │
│   ☑ Audit Trail Analyzer                    Compliance  ✓ Valid    │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   3 selected                        [Cancel]  [Add to Workspace]    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 5. InviteMemberModal

Modal for inviting members to a workspace.

```tsx
interface InviteMemberModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onInvited: (member: WorkspaceMember) => void;
}
```

**Layout**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Invite Member                                              [×]    │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   Search People                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 🔍 Search by name or email...                               │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 👤 Carol Johnson • Compliance Analyst                        │  │
│   │    carol.johnson@company.com                                 │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Access Level                                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ● Full Access - Can run and configure work units             │  │
│   │ ○ Run Only   - Can only run work units                       │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Role                                                              │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ○ Admin  - Can manage workspace                              │  │
│   │ ● Member - Standard access                                   │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   This will delegate access to all work units in this workspace.   │
│   Constraints will be inherited from the workspace scope.           │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│                                          [Cancel]  [Send Invite]    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## State Management

### Workspace Store (Zustand)

```typescript
interface WorkspaceStore {
  // State
  workspaces: Workspace[];
  myWorkspaces: Workspace[];
  sharedWithMe: Workspace[];
  selectedWorkspace: Workspace | null;
  filters: WorkspaceFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkspaces: (filters?: WorkspaceFilters) => Promise<void>;
  selectWorkspace: (id: string | null) => void;
  createWorkspace: (data: CreateWorkspaceInput) => Promise<Workspace>;
  updateWorkspace: (id: string, data: UpdateWorkspaceInput) => Promise<void>;
  archiveWorkspace: (id: string) => Promise<void>;

  // Work unit management
  addWorkUnits: (workspaceId: string, workUnitIds: string[]) => Promise<void>;
  removeWorkUnit: (workspaceId: string, workUnitId: string) => Promise<void>;

  // Member management
  inviteMember: (workspaceId: string, data: InviteMemberInput) => Promise<void>;
  updateMember: (workspaceId: string, memberId: string, data: UpdateMemberInput) => Promise<void>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;
}

interface WorkspaceFilters {
  search?: string;
  type?: 'active' | 'archived' | 'all';
  department?: string;
}
```

---

## API Integration

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/workspaces` | GET | List workspaces |
| `/api/workspaces/:id` | GET | Get workspace details |
| `/api/workspaces` | POST | Create workspace |
| `/api/workspaces/:id` | PUT | Update workspace |
| `/api/workspaces/:id/archive` | POST | Archive workspace |
| `/api/workspaces/:id/work-units` | GET | List workspace work units |
| `/api/workspaces/:id/work-units` | POST | Add work units |
| `/api/workspaces/:id/work-units/:workUnitId` | DELETE | Remove work unit |
| `/api/workspaces/:id/members` | GET | List members |
| `/api/workspaces/:id/members` | POST | Invite member |
| `/api/workspaces/:id/members/:memberId` | PUT | Update member |
| `/api/workspaces/:id/members/:memberId` | DELETE | Remove member |
| `/api/workspaces/:id/activity` | GET | Get activity feed |

### React Query Hooks

```typescript
// Fetch workspaces
const { data: workspaces } = useQuery({
  queryKey: ['workspaces', filters],
  queryFn: () => workspaceApi.list(filters),
});

// Get workspace details
const { data: workspace } = useQuery({
  queryKey: ['workspace', id],
  queryFn: () => workspaceApi.get(id),
});

// Get workspace work units
const { data: workUnits } = useQuery({
  queryKey: ['workspace', id, 'workUnits'],
  queryFn: () => workspaceApi.getWorkUnits(id),
});

// Add work units mutation
const addWorkUnitsMutation = useMutation({
  mutationFn: ({ workspaceId, workUnitIds }) =>
    workspaceApi.addWorkUnits(workspaceId, workUnitIds),
  onSuccess: () => {
    queryClient.invalidateQueries(['workspace', workspaceId]);
    toast.success('Work units added');
  },
});

// Invite member mutation
const inviteMutation = useMutation({
  mutationFn: ({ workspaceId, data }) =>
    workspaceApi.inviteMember(workspaceId, data),
  onSuccess: () => {
    queryClient.invalidateQueries(['workspace', workspaceId, 'members']);
    toast.success('Invitation sent');
  },
});
```

---

## Delegation Flow

When inviting a member to a workspace, a delegation is automatically created:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WORKSPACE DELEGATION FLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. Owner invites Carol to workspace                               │
│                                                                     │
│   2. System creates DelegationRecord:                               │
│      • delegator: Alice (owner)                                     │
│      • delegatee: Carol                                             │
│      • scope: workspace-q4-audit                                    │
│      • capabilities: [all workspace work units]                     │
│      • constraints: {accessLevel: "run_only"}                       │
│                                                                     │
│   3. Carol can now:                                                 │
│      • See workspace in "Shared With Me"                            │
│      • Run any work unit in the workspace                           │
│      • View (but not configure) work units                          │
│                                                                     │
│   4. If workspace expires or Carol is removed:                      │
│      • DelegationRecord is revoked                                  │
│      • Trust chain broken                                           │
│      • Carol loses access immediately                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Responsive Design

### Mobile Adaptations

- Workspace cards stack vertically
- Detail page uses full width
- Member list becomes collapsible accordion
- Work unit groupings become tabs
- Add/invite modals become full-screen sheets

### Tablet Adaptations

- 2-column grid for workspace cards
- Detail page uses 2/3 width for content
- Side panel for quick actions

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate between workspaces |
| Enter | Open selected workspace |
| N | Create new workspace |
| / | Focus search |
| Escape | Close modals |

### Screen Reader Announcements

- Workspace count and filter status
- Expiration warnings
- Member role and access level
- Activity feed updates

---

## References

- **Ontology**: `docs/plans/eatp-ontology/04-workspaces.md`
- **Work Units UI**: `docs/plans/eatp-frontend/03-work-units-ui.md`
- **Trust Visualization**: `docs/plans/eatp-frontend/02-trust-visualization.md`
