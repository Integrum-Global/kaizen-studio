# EATP Ontology: Navigation Architecture

## Document Control
- **Version**: 1.0
- **Date**: 2026-01-03
- **Status**: Proposed
- **Author**: Kaizen Studio Team

---

## Overview

This document defines the revised navigation architecture for Kaizen Studio, implementing the ontology concepts of Work Units, Workspaces, and three-level user experience.

---

## Current vs Proposed Navigation

### Current State

```
┌──────────────────────┐
│ Current Sidebar      │
├──────────────────────┤
│ BUILD                │
│ ├── Agents           │  ← Technical term
│ ├── Pipelines        │  ← Technical term
│ └── Connectors       │
│                      │
│ GOVERN               │
│ └── Trust            │  ← Isolated section
│                      │
│ OPERATE              │
│ ├── Runs             │
│ └── Activity         │
└──────────────────────┘

Issues:
• "Agents" and "Pipelines" are implementation terms
• Trust is isolated from Build section
• No user-level differentiation
• No concept of "what can I do?"
```

### Proposed State

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PROPOSED NAVIGATION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────────┐                                         │
│   │ Proposed Sidebar     │                                         │
│   ├──────────────────────┤                                         │
│   │                      │                                         │
│   │ WORK                 │  ← User-centric "what can I do?"        │
│   │ ├── My Tasks         │  ← Level 1: Run pre-assigned tasks      │
│   │ ├── My Processes     │  ← Level 2: Manage processes            │
│   │ └── Value Chains     │  ← Level 3: Enterprise orchestration    │
│   │                      │                                         │
│   │ BUILD                │  ← Creator-centric "what can I build?"  │
│   │ ├── Work Units       │  ← Unified agents/pipelines             │
│   │ ├── Workspaces       │  ← Purpose-driven collections           │
│   │ └── Connectors       │  ← ESAs and integrations                │
│   │                      │                                         │
│   │ GOVERN               │  ← Trust and compliance                 │
│   │ ├── Trust            │  ← Delegation management                │
│   │ ├── Compliance       │  ← Audit and constraints                │
│   │ └── Activity         │  ← Execution history                    │
│   │                      │                                         │
│   └──────────────────────┘                                         │
│                                                                     │
│   Key Changes:                                                      │
│   • New "WORK" section for task-centric view                       │
│   • "Agents" + "Pipelines" merged into "Work Units"                │
│   • "Workspaces" added for purpose-driven collections              │
│   • Navigation adapts based on user level                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Level-Based Navigation Adaptation

### Level 1: Task Performer

```
┌──────────────────────┐
│ Level 1 Sidebar      │
├──────────────────────┤
│                      │
│ WORK                 │
│ └── My Tasks     ●   │  ← Primary focus
│                      │
│ ─────────────────    │
│ No BUILD access      │
│ No GOVERN access     │
│ ─────────────────    │
│                      │
│ SETTINGS             │
│ └── Profile          │
│                      │
└──────────────────────┘

• Only "My Tasks" visible
• Focus on running tasks
• No creation capabilities
• Minimal navigation
```

### Level 2: Process Owner

```
┌──────────────────────┐
│ Level 2 Sidebar      │
├──────────────────────┤
│                      │
│ WORK                 │
│ ├── My Tasks         │
│ └── My Processes ●   │  ← Expanded focus
│                      │
│ BUILD                │
│ ├── Work Units       │  ← Can create/edit
│ └── Workspaces       │  ← Can manage
│                      │
│ GOVERN               │
│ └── My Delegations   │  ← Limited view
│                      │
│ SETTINGS             │
│ ├── Team             │
│ └── Profile          │
│                      │
└──────────────────────┘

• "My Processes" added
• BUILD section accessible
• Limited GOVERN (own delegations only)
• Team settings visible
```

### Level 3: Value Chain Owner

```
┌──────────────────────┐
│ Level 3 Sidebar      │
├──────────────────────┤
│                      │
│ WORK                 │
│ ├── My Tasks         │
│ ├── My Processes     │
│ └── Value Chains ●   │  ← Full view
│                      │
│ BUILD                │
│ ├── Work Units       │
│ ├── Workspaces       │
│ └── Connectors       │  ← ESA management
│                      │
│ GOVERN               │
│ ├── Trust            │  ← Full trust mgmt
│ ├── Compliance       │  ← Audit access
│ └── Activity         │  ← All activity
│                      │
│ ADMIN                │
│ ├── Organization     │
│ ├── Users            │
│ └── Policies         │
│                      │
└──────────────────────┘

• Full "Value Chains" access
• Full BUILD capabilities
• Full GOVERN access
• ADMIN section for org management
```

---

## Route Structure

### URL Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                     URL ROUTE STRUCTURE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   WORK Section:                                                     │
│   ─────────────                                                     │
│   /work/tasks                    # My Tasks list                    │
│   /work/tasks/:id                # Task execution view              │
│   /work/tasks/:id/results/:runId # Task result view                 │
│                                                                     │
│   /work/processes                # My Processes list                │
│   /work/processes/:id            # Process detail/configuration     │
│   /work/processes/:id/runs       # Process run history              │
│   /work/processes/:id/delegates  # Process delegation management    │
│                                                                     │
│   /work/value-chains             # Value Chains list                │
│   /work/value-chains/:id         # Value chain overview             │
│   /work/value-chains/:id/trust   # Trust chain visualization        │
│   /work/value-chains/:id/audit   # Audit trail                      │
│                                                                     │
│   BUILD Section:                                                    │
│   ──────────────                                                    │
│   /build/work-units              # Work Units list                  │
│   /build/work-units/new          # Create work unit                 │
│   /build/work-units/:id          # Work unit detail                 │
│   /build/work-units/:id/edit     # Edit work unit                   │
│   /build/work-units/:id/trust    # Work unit trust settings         │
│                                                                     │
│   /build/workspaces              # Workspaces list                  │
│   /build/workspaces/new          # Create workspace                 │
│   /build/workspaces/:id          # Workspace detail                 │
│   /build/workspaces/:id/members  # Workspace members                │
│                                                                     │
│   /build/connectors              # Connectors (ESAs) list           │
│   /build/connectors/:id          # Connector detail                 │
│                                                                     │
│   GOVERN Section:                                                   │
│   ───────────────                                                   │
│   /govern/trust                  # Trust dashboard                  │
│   /govern/trust/chains           # All trust chains                 │
│   /govern/trust/chains/:id       # Trust chain detail               │
│   /govern/trust/delegations      # Delegation management            │
│   /govern/trust/delegations/new  # Create delegation                │
│                                                                     │
│   /govern/compliance             # Compliance dashboard             │
│   /govern/compliance/audit       # Audit trail viewer               │
│   /govern/compliance/reports     # Compliance reports               │
│                                                                     │
│   /govern/activity               # Activity feed                    │
│   /govern/activity/:runId        # Run detail                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Page Layouts

### My Tasks Page (Level 1 Primary)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MY TASKS PAGE                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   My Tasks                              [Search...] [Filter] │  │
│   │                                                              │  │
│   │   ┌────────────────────────────────────────────────────────┐│  │
│   │   │                                                        ││  │
│   │   │   AVAILABLE TASKS                                      ││  │
│   │   │                                                        ││  │
│   │   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   ││  │
│   │   │   │ 📝 Summarize│  │ 📊 Extract  │  │ 🌐 Translate│   ││  │
│   │   │   │   Document  │  │    Data     │  │   Content   │   ││  │
│   │   │   │             │  │             │  │             │   ││  │
│   │   │   │ Get a quick │  │ Pull struct │  │ Convert to  │   ││  │
│   │   │   │ summary     │  │ data out    │  │ any language│   ││  │
│   │   │   │             │  │             │  │             │   ││  │
│   │   │   │ [Run Now]   │  │ [Run Now]   │  │ [Run Now]   │   ││  │
│   │   │   └─────────────┘  └─────────────┘  └─────────────┘   ││  │
│   │   │                                                        ││  │
│   │   └────────────────────────────────────────────────────────┘│  │
│   │                                                              │  │
│   │   ┌────────────────────────────────────────────────────────┐│  │
│   │   │                                                        ││  │
│   │   │   RECENT RESULTS                           [View All]  ││  │
│   │   │                                                        ││  │
│   │   │   ✓ Summarize Document     2 min ago    [View Result]  ││  │
│   │   │   ✓ Extract Data          15 min ago    [View Result]  ││  │
│   │   │   ⏳ Translate Content      Running...   [View Status]  ││  │
│   │   │   ✓ Draft Email           1 hour ago    [View Result]  ││  │
│   │   │                                                        ││  │
│   │   └────────────────────────────────────────────────────────┘│  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### My Processes Page (Level 2 Primary)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MY PROCESSES PAGE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   My Processes                [+ New Process] [Search] [Ftr]│  │
│   │                                                              │  │
│   │   ┌────────────────────────────────────────────────────────┐│  │
│   │   │                                                        ││  │
│   │   │   📊 INVOICE PROCESSING                                ││  │
│   │   │   ─────────────────────                                ││  │
│   │   │                                                        ││  │
│   │   │   ┌────────┐ → ┌────────┐ → ┌────────┐ → ┌────────┐   ││  │
│   │   │   │Extract │   │Validate│   │ Route  │   │Archive │   ││  │
│   │   │   └────────┘   └────────┘   └────────┘   └────────┘   ││  │
│   │   │                                                        ││  │
│   │   │   Trust: ✓ Valid from CFO    Status: ● Active          ││  │
│   │   │   Team: 5 members            Runs today: 47            ││  │
│   │   │                                                        ││  │
│   │   │   [Configure]  [Delegate]  [View Runs]  [Audit Trail]  ││  │
│   │   │                                                        ││  │
│   │   └────────────────────────────────────────────────────────┘│  │
│   │                                                              │  │
│   │   ┌────────────────────────────────────────────────────────┐│  │
│   │   │                                                        ││  │
│   │   │   📧 CUSTOMER ONBOARDING                               ││  │
│   │   │   ──────────────────────                               ││  │
│   │   │                                                        ││  │
│   │   │   ┌────────┐ → ┌────────┐ → ┌────────┐                ││  │
│   │   │   │Welcome │   │ Setup  │   │Training│                ││  │
│   │   │   └────────┘   └────────┘   └────────┘                ││  │
│   │   │                                                        ││  │
│   │   │   Trust: ✓ Valid from Sales Dir   Status: ● Active     ││  │
│   │   │                                                        ││  │
│   │   │   [Configure]  [Delegate]  [View Runs]  [Audit Trail]  ││  │
│   │   │                                                        ││  │
│   │   └────────────────────────────────────────────────────────┘│  │
│   │                                                              │  │
│   │   ┌────────────────────────────────────────────────────────┐│  │
│   │   │                                                        ││  │
│   │   │   TEAM ACTIVITY                               [See All]││  │
│   │   │                                                        ││  │
│   │   │   Alice ran Invoice Processing (12 inv) • 5 min ago    ││  │
│   │   │   Bob ran Onboarding (3 customers) • 1 hour ago        ││  │
│   │   │   Carol ran Invoice Processing (8 inv) • 2 hours ago   ││  │
│   │   │                                                        ││  │
│   │   └────────────────────────────────────────────────────────┘│  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Work Units Page (BUILD Section)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WORK UNITS PAGE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   Work Units                    [+ New Work Unit] [Search]   │  │
│   │                                                              │  │
│   │   ┌───────────────────────────────────────────────────────┐ │  │
│   │   │ Type: [All ▼]  Status: [All ▼]  Sort: [Recent ▼]     │ │  │
│   │   └───────────────────────────────────────────────────────┘ │  │
│   │                                                              │  │
│   │   ATOMIC (12)                                                │  │
│   │   ───────────                                                │  │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│   │   │ ◉ Document  │  │ ◉ Data      │  │ ◉ Translator│        │  │
│   │   │   Summarizer│  │   Extractor │  │             │        │  │
│   │   │             │  │             │  │             │        │  │
│   │   │ ✓ Trusted   │  │ ✓ Trusted   │  │ ◐ Pending   │        │  │
│   │   └─────────────┘  └─────────────┘  └─────────────┘        │  │
│   │                                                              │  │
│   │   COMPOSITE (8)                                              │  │
│   │   ─────────────                                              │  │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│   │   │ ◉◉ Invoice  │  │ ◉◉ Customer │  │ ◉◉ Report   │        │  │
│   │   │   Processor │  │   Onboarding│  │   Generator │        │  │
│   │   │ (4 units)   │  │ (3 units)   │  │ (5 units)   │        │  │
│   │   │ ✓ Trusted   │  │ ✓ Trusted   │  │ ✓ Trusted   │        │  │
│   │   └─────────────┘  └─────────────┘  └─────────────┘        │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Legend: ◉ = Atomic (single)  ◉◉ = Composite (orchestration)      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Sidebar Component

```tsx
// src/components/layout/Sidebar.tsx

interface SidebarProps {
  userLevel: 1 | 2 | 3;
}

export function Sidebar({ userLevel }: SidebarProps) {
  return (
    <nav className="sidebar">
      {/* WORK Section - Always visible */}
      <SidebarSection title="WORK">
        <SidebarItem href="/work/tasks" icon={Play}>My Tasks</SidebarItem>
        {userLevel >= 2 && (
          <SidebarItem href="/work/processes" icon={Workflow}>My Processes</SidebarItem>
        )}
        {userLevel >= 3 && (
          <SidebarItem href="/work/value-chains" icon={Network}>Value Chains</SidebarItem>
        )}
      </SidebarSection>

      {/* BUILD Section - Level 2+ */}
      {userLevel >= 2 && (
        <SidebarSection title="BUILD">
          <SidebarItem href="/build/work-units" icon={Bot}>Work Units</SidebarItem>
          <SidebarItem href="/build/workspaces" icon={Folder}>Workspaces</SidebarItem>
          {userLevel >= 3 && (
            <SidebarItem href="/build/connectors" icon={Plug}>Connectors</SidebarItem>
          )}
        </SidebarSection>
      )}

      {/* GOVERN Section - Level 2+ with variations */}
      {userLevel >= 2 && (
        <SidebarSection title="GOVERN">
          {userLevel === 2 ? (
            <SidebarItem href="/govern/delegations" icon={Users}>My Delegations</SidebarItem>
          ) : (
            <>
              <SidebarItem href="/govern/trust" icon={Shield}>Trust</SidebarItem>
              <SidebarItem href="/govern/compliance" icon={ClipboardCheck}>Compliance</SidebarItem>
              <SidebarItem href="/govern/activity" icon={Activity}>Activity</SidebarItem>
            </>
          )}
        </SidebarSection>
      )}

      {/* ADMIN Section - Level 3 only */}
      {userLevel >= 3 && (
        <SidebarSection title="ADMIN">
          <SidebarItem href="/admin/organization" icon={Building}>Organization</SidebarItem>
          <SidebarItem href="/admin/users" icon={Users}>Users</SidebarItem>
          <SidebarItem href="/admin/policies" icon={FileText}>Policies</SidebarItem>
        </SidebarSection>
      )}
    </nav>
  );
}
```

---

## Navigation Transitions

### Level Upgrade Flow

When a user's level increases (via delegation):

1. **Toast notification**: "You now have access to Process management"
2. **Sidebar updates**: New items appear with subtle animation
3. **Optional onboarding**: Brief tour of new capabilities

### Level Downgrade Flow

When delegation is revoked:

1. **Toast notification**: "Your Process management access has been revoked"
2. **Sidebar updates**: Items disappear (user redirected if on removed page)
3. **Graceful degradation**: Existing work is preserved, just not accessible

---

## Implementation Notes

### Route Guards

```tsx
// src/lib/guards/levelGuard.tsx

export function withLevelGuard(requiredLevel: 1 | 2 | 3) {
  return function LevelGuard({ children }: { children: React.ReactNode }) {
    const { userLevel } = useUserLevel();

    if (userLevel < requiredLevel) {
      return <AccessDenied requiredLevel={requiredLevel} />;
    }

    return <>{children}</>;
  };
}

// Usage in routes
<Route
  path="/work/processes"
  element={
    <withLevelGuard requiredLevel={2}>
      <ProcessesPage />
    </withLevelGuard>
  }
/>
```

### Dynamic Navigation Hook

```tsx
// src/hooks/useNavigation.ts

export function useNavigation() {
  const { userLevel } = useUserLevel();
  const { capabilities } = useCapabilities();

  return useMemo(() => {
    const nav: NavigationItem[] = [];

    // WORK section
    nav.push({
      section: 'WORK',
      items: [
        { label: 'My Tasks', href: '/work/tasks', icon: Play },
        userLevel >= 2 && { label: 'My Processes', href: '/work/processes', icon: Workflow },
        userLevel >= 3 && { label: 'Value Chains', href: '/work/value-chains', icon: Network },
      ].filter(Boolean),
    });

    // BUILD section (Level 2+)
    if (userLevel >= 2) {
      nav.push({
        section: 'BUILD',
        items: [
          { label: 'Work Units', href: '/build/work-units', icon: Bot },
          { label: 'Workspaces', href: '/build/workspaces', icon: Folder },
          userLevel >= 3 && { label: 'Connectors', href: '/build/connectors', icon: Plug },
        ].filter(Boolean),
      });
    }

    // ... GOVERN and ADMIN sections

    return nav;
  }, [userLevel, capabilities]);
}
```

---

## Next Steps

1. Define terminology glossary (07-terminology-glossary.md)
2. Update frontend implementation plans
3. Implement route guards and navigation hooks
