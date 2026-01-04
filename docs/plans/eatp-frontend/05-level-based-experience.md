# EATP Frontend: Level-Based Experience

## Document Control
- **Version**: 1.0
- **Date**: 2026-01-03
- **Status**: Planning
- **Author**: Kaizen Studio Team

---

## Overview

This document defines the implementation of level-based adaptive UI in Kaizen Studio. Users don't see their "level" - they simply see an interface adapted to their role and capabilities. The system determines the appropriate experience based on their EATP trust posture.

See ontology reference: `docs/plans/eatp-ontology/03-user-experience-levels.md`

---

## Level Determination

### How Levels Are Assigned

Levels are determined by the user's **highest trust posture** from their delegation records:

```typescript
function determineUserLevel(delegations: DelegationRecord[]): 1 | 2 | 3 {
  const trustPostures = delegations.map(d => d.trustPosture);

  if (trustPostures.includes('delegation_at_scale') ||
      trustPostures.includes('continuous_insight')) {
    return 3;  // Value Chain Owner
  }

  if (trustPostures.includes('shared_planning')) {
    return 2;  // Process Owner
  }

  return 1;  // Task Performer
}
```

### Trust Posture Mapping

| EATP Trust Posture | User Level | UI Experience |
|-------------------|------------|---------------|
| Pseudo Agent | 1 | Task Performer |
| Supervised Autonomy | 1 | Task Performer |
| Shared Planning | 2 | Process Owner |
| Continuous Insight | 3 | Value Chain Owner |
| Delegation-at-Scale | 3 | Value Chain Owner |

---

## Level 1: Task Performer

### Target Users
- Individual contributors
- New employees
- External collaborators
- Specialists who run delegated tasks

### EATP Trust Posture
Supervised Autonomy - Can execute tasks but cannot delegate.

### UI Characteristics

**Visible**:
- My Tasks (assigned work units to run)
- Recent Results (execution history)
- Simple task execution modal
- Basic trust status (valid/invalid)

**Hidden**:
- BUILD section entirely
- Delegation UI
- Process orchestration
- Technical configurations
- Sub-unit details

### Primary View: My Tasks

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   My Tasks                                           [🔍 Search]   │
│                                                                     │
│   Available to Run                                                  │
│                                                                     │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│   │                 │  │                 │  │                 │   │
│   │  📝 Summarize   │  │  📊 Extract     │  │  🌐 Translate   │   │
│   │     Document    │  │     Data        │  │     Content     │   │
│   │                 │  │                 │  │                 │   │
│   │   [Run Now]     │  │   [Run Now]     │  │   [Run Now]     │   │
│   │                 │  │                 │  │                 │   │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                     │
│   ═══════════════════════════════════════════════════════════════  │
│                                                                     │
│   Recent Results                                    [View All →]   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │  ✓ Summarize Document                          2 min ago    │  │
│   │    "Q4 Financial Report Summary"              [View Result]  │  │
│   │                                                              │  │
│   │  ✓ Extract Data                                15 min ago   │  │
│   │    "Invoice data extracted"                   [View Result]  │  │
│   │                                                              │  │
│   │  ⏳ Translate Content                          Running...    │  │
│   │    "Marketing copy translation"               [View Status]  │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Run Task Modal (Simplified)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   📝 Summarize Document                                      [×]   │
│                                                                     │
│   Upload or paste the document you want summarized.                 │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   Document                                                          │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │            📄 Drop file here or click to upload             │  │
│   │                                                              │  │
│   │            Supported: PDF, DOCX, TXT (max 10MB)             │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Summary Length                                                    │
│   ○ Brief (1 paragraph)                                             │
│   ● Standard (3-5 paragraphs)                                       │
│   ○ Detailed (full summary)                                         │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                        Run Task                               │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Level 2: Process Owner

### Target Users
- Team leads
- Department managers
- Process designers
- Project coordinators

### EATP Trust Posture
Shared Planning - Can manage processes and delegate to team members.

### UI Characteristics

**Visible (in addition to Level 1)**:
- My Processes (composite work units they manage)
- BUILD section
- Work Units management
- Workspaces
- Delegation to team members
- Team activity feed
- Basic constraints configuration

**Hidden**:
- Value Chains
- Cross-department governance
- Compliance dashboard
- Advanced audit features
- Enterprise-level settings

### Primary View: My Processes

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   My Processes                              [+ New Process]        │
│                                                                     │
│   Active Processes                                                  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   📊 Invoice Processing                         ● Active    │  │
│   │   ────────────────────────────────────────────────────────  │  │
│   │                                                              │  │
│   │   ┌────────┐ → ┌────────┐ → ┌────────┐ → ┌────────┐        │  │
│   │   │Extract │   │Validate│   │ Route  │   │Archive │        │  │
│   │   └────────┘   └────────┘   └────────┘   └────────┘        │  │
│   │                                                              │  │
│   │   Trust: ✓ Valid from CFO     │   Team: 5 members           │  │
│   │   Runs today: 47              │   Errors: 2                  │  │
│   │                                                              │  │
│   │   [Configure]  [Delegate]  [View Runs]  [Audit]             │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   📄 Contract Review                            ● Active    │  │
│   │   ────────────────────────────────────────────────────────  │  │
│   │                                                              │  │
│   │   ┌────────┐ → ┌────────┐ → ┌────────┐                      │  │
│   │   │ Parse  │   │Analyze │   │ Flag   │                      │  │
│   │   └────────┘   └────────┘   └────────┘                      │  │
│   │                                                              │  │
│   │   Trust: ✓ Valid from CLO     │   Team: 3 members           │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ═══════════════════════════════════════════════════════════════  │
│                                                                     │
│   Team Activity                                                     │
│                                                                     │
│   • Bob ran Invoice Processing                         2 min ago   │
│   • Alice completed Contract Review                    15 min ago  │
│   • Carol failed Invoice Processing (validation)       1 hour ago  │
│   •   → [View Error] [Retry]                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Delegation Modal (Level 2)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Delegate Invoice Processing                                [×]   │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   Select Team Member                                                │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 🔍 Search team members...                                    │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ● 👤 Alice Chen         Finance Analyst                     │  │
│   │ ○ 👤 Bob Smith          Accounts Payable                    │  │
│   │ ○ 👤 Carol Johnson      Junior Analyst                      │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   Capabilities to Delegate                                          │
│   ☑ Run task                                                        │
│   ☐ Configure parameters ← You can restrict                        │
│   ☐ View audit logs                                                 │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   Constraints (can only tighten)                                    │
│                                                                     │
│   Your limit: $500/day                                              │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ Their limit: $250/day                               [▾]     │  │
│   └─────────────────────────────────────────────────────────────┘  │
│   ⚠️ Cannot exceed your limit of $500/day                          │
│                                                                     │
│   Duration                                                          │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 30 days                                             [▾]     │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   Preview Trust Chain                                               │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ CFO → You → Alice                                            │  │
│   │ $500/day → $500/day → $250/day                               │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│                                         [Cancel]  [Delegate]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Level 3: Value Chain Owner

### Target Users
- Executives
- Department heads
- Compliance officers
- Enterprise architects

### EATP Trust Posture
Delegation-at-Scale - Can establish trust, manage cross-department chains, and access compliance.

### UI Characteristics

**Visible (in addition to Levels 1-2)**:
- Value Chains (cross-department processes)
- Full GOVERN section
- Compliance dashboard
- Enterprise audit trail
- Cross-department trust visualization
- Advanced constraint management
- System settings

### Primary View: Value Chains

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Value Chains                             [+ New Value Chain]     │
│   Enterprise-wide processes spanning multiple departments           │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   🔄 Procure-to-Pay                            ● Active     │  │
│   │   ────────────────────────────────────────────────────────  │  │
│   │                                                              │  │
│   │   ┌──────────────────────────────────────────────────────┐  │  │
│   │   │                                                       │  │  │
│   │   │  Procurement  →  Finance  →  Legal  →  Operations    │  │  │
│   │   │  (Request)       (Approve)   (Contract) (Receive)    │  │  │
│   │   │                                                       │  │  │
│   │   └──────────────────────────────────────────────────────┘  │  │
│   │                                                              │  │
│   │   Departments: 4  │  Work Units: 12  │  Active Users: 47   │  │
│   │                                                              │  │
│   │   Trust Status                                               │  │
│   │   ✓ All chains valid                    Last audit: 2h ago  │  │
│   │                                                              │  │
│   │   [View Chain]  [Trust Map]  [Compliance]  [Audit Trail]    │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   🔄 Hire-to-Retire                            ⚠️ Warning   │  │
│   │   ────────────────────────────────────────────────────────  │  │
│   │                                                              │  │
│   │   HR  →  IT  →  Finance  →  Legal                            │  │
│   │                                                              │  │
│   │   ⚠️ 2 work units have expiring trust (5 days)              │  │
│   │   [View Issues]                                              │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ═══════════════════════════════════════════════════════════════  │
│                                                                     │
│   Enterprise Trust Overview                                         │
│                                                                     │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐      │
│   │  Active Trust  │  │  Expiring Soon │  │  Issues        │      │
│   │     247        │  │      12        │  │       3        │      │
│   │     ✓          │  │      ⚠️        │  │      ❌        │      │
│   └────────────────┘  └────────────────┘  └────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Compliance Dashboard (Level 3 Only)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Compliance Dashboard                              [Export Report] │
│                                                                     │
│   ═══════════════════════════════════════════════════════════════  │
│                                                                     │
│   Trust Health                                                      │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  ████████████████████████████████░░░░░  87%                 │  │
│   │                                                              │  │
│   │  Valid: 247  │  Expiring: 12  │  Expired: 3  │  Revoked: 1  │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   Constraint Violations (Last 30 Days)                              │
│                                                                     │
│   │                                                                 │
│   │  12 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                   │
│   │      ██                                                        │
│   │  8  ─██─ ─ ─ ─ ─ ─██─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                   │
│   │      ██           ██                                           │
│   │  4  ─██───██──────██──────██──────██────────                   │
│   │      ██   ██      ██      ██      ██                           │
│   │  0  ─██───██──────██──────██──────██──────── →                 │
│   │      W1   W2      W3      W4      W5                           │
│   │                                                                 │
│   │  [View Details]                                                 │
│   │                                                                 │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   Recent Audit Events                                               │
│                                                                     │
│   │ 2h ago │ CFO delegated Invoice Processing to Finance Team     │
│   │ 3h ago │ Cost limit exceeded: Marketing ($550 of $500)        │
│   │ 1d ago │ Trust chain renewed: Contract Review (90 days)       │
│   │ 1d ago │ New value chain created: Procure-to-Pay              │
│   │                                                                 │
│   [View Full Audit Trail →]                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Level Detection Implementation

### User Context Provider

```tsx
interface UserContextType {
  user: User;
  level: 1 | 2 | 3;
  trustPosture: TrustPosture;
  permissions: UserPermissions;
}

const UserContext = createContext<UserContextType | null>(null);

function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userApi.getCurrentUser(),
  });

  const { data: delegations } = useQuery({
    queryKey: ['userDelegations'],
    queryFn: () => delegationApi.getMyDelegations(),
    enabled: !!user,
  });

  const level = useMemo(() => {
    if (!delegations) return 1;
    return determineUserLevel(delegations);
  }, [delegations]);

  const permissions = useMemo(() => ({
    canRun: level >= 1,
    canConfigure: level >= 2,
    canDelegate: level >= 2,
    canCreateWorkUnits: level >= 2,
    canManageWorkspaces: level >= 2,
    canViewValueChains: level >= 3,
    canAccessCompliance: level >= 3,
    canEstablishTrust: level >= 3,
  }), [level]);

  return (
    <UserContext.Provider value={{ user, level, trustPosture, permissions }}>
      {children}
    </UserContext.Provider>
  );
}

function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
```

### Level-Aware Components

```tsx
// Component that renders differently based on level
function WorkUnitActions({ workUnit }: { workUnit: WorkUnit }) {
  const { level, permissions } = useUser();

  return (
    <div className="flex gap-2">
      {permissions.canRun && (
        <Button onClick={() => runWorkUnit(workUnit.id)}>
          Run
        </Button>
      )}

      {permissions.canConfigure && (
        <Button variant="outline" onClick={() => configureWorkUnit(workUnit.id)}>
          Configure
        </Button>
      )}

      {permissions.canDelegate && (
        <Button variant="outline" onClick={() => openDelegationModal(workUnit.id)}>
          Delegate
        </Button>
      )}
    </div>
  );
}

// Component that only renders for certain levels
function ForLevel({
  min,
  max,
  children
}: {
  min?: 1 | 2 | 3;
  max?: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  const { level } = useUser();

  if (min && level < min) return null;
  if (max && level > max) return null;

  return <>{children}</>;
}

// Usage
<ForLevel min={2}>
  <DelegateButton workUnit={workUnit} />
</ForLevel>

<ForLevel min={3}>
  <ComplianceDashboard />
</ForLevel>
```

---

## Progressive Disclosure Pattern

### Information Architecture by Level

| Information Type | Level 1 | Level 2 | Level 3 |
|-----------------|---------|---------|---------|
| Task name/description | ✓ | ✓ | ✓ |
| Capabilities list | Simple | Full | Full |
| Trust status | Valid/Invalid | Detailed | Chain view |
| Sub-unit visibility | Hidden | Visible | Detailed |
| Constraints | Hidden | Own limits | All limits |
| Delegation chain | Hidden | One level | Full chain |
| Audit events | Hidden | Team events | All events |
| Compliance metrics | Hidden | Hidden | Full |

### Detail Expansion Pattern

```
Level 1:  [Summary] ──────────────────────────────────────
Level 2:  [Summary] ──────── [Expand] ──────────────────────
Level 3:  [Summary] ──────── [Expand] ──────── [Full Detail]
```

---

## Responsive Behavior

### Mobile Adaptations by Level

**Level 1 (Task Performer)**:
- App-like interface with large touch targets
- Swipe to run common tasks
- Bottom sheet for task execution
- Minimal navigation

**Level 2 (Process Owner)**:
- Tabbed interface for tasks/processes
- Collapsible process flow diagrams
- Quick delegation via share sheet
- Team activity as notification feed

**Level 3 (Value Chain Owner)**:
- Dashboard-first with drill-down
- Horizontal scroll for value chain visualization
- Compliance alerts as push notifications
- Export to PDF for offline review

---

## Transition Between Levels

When a user's trust posture changes (e.g., promoted to manager), the UI should gracefully transition:

```tsx
function useLevelTransition() {
  const { level } = useUser();
  const previousLevel = usePrevious(level);

  useEffect(() => {
    if (previousLevel && level !== previousLevel) {
      if (level > previousLevel) {
        toast.success(
          `You now have ${levelNames[level]} access. Explore your new capabilities!`,
          { action: { label: 'Learn More', onClick: showOnboarding } }
        );
      } else {
        toast.info(
          `Your access has changed. Some features may no longer be available.`
        );
      }
    }
  }, [level, previousLevel]);
}
```

---

## Testing Considerations

### Level Simulation

For development and testing, allow level override:

```tsx
// Dev-only level override
const DEV_LEVEL_OVERRIDE = process.env.NODE_ENV === 'development'
  ? localStorage.getItem('devLevelOverride')
  : null;

function determineUserLevel(delegations: DelegationRecord[]): 1 | 2 | 3 {
  if (DEV_LEVEL_OVERRIDE) {
    return parseInt(DEV_LEVEL_OVERRIDE) as 1 | 2 | 3;
  }
  // Normal logic...
}
```

### E2E Test Fixtures

```typescript
// test/fixtures/users.ts
export const users = {
  level1: {
    id: 'task-performer',
    delegations: [{ trustPosture: 'supervised_autonomy' }],
  },
  level2: {
    id: 'process-owner',
    delegations: [{ trustPosture: 'shared_planning' }],
  },
  level3: {
    id: 'value-chain-owner',
    delegations: [{ trustPosture: 'delegation_at_scale' }],
  },
};
```

---

## References

- **Ontology**: `docs/plans/eatp-ontology/03-user-experience-levels.md`
- **Navigation**: `docs/plans/eatp-frontend/06-navigation-implementation.md`
- **Trust Visualization**: `docs/plans/eatp-frontend/02-trust-visualization.md`
