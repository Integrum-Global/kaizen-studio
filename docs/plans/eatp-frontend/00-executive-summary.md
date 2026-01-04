# EATP Frontend Implementation Plan: Executive Summary

## Document Control
- **Version**: 2.0
- **Date**: 2026-01-03
- **Status**: Planning (Updated)
- **Author**: Kaizen Studio Team

---

## Purpose

This document series outlines the frontend implementation plan for integrating the Enterprise Agent Trust Protocol (EATP) into Kaizen Studio using the **new ontology framework**.

The implementation is guided by:
- **EATP Ontology** (`docs/plans/eatp-ontology/`) - Conceptual framework
- **Agentic Enterprise Whitepaper** - Client requirements and architecture
- **EATP Fundamentals** (`docs/plans/eatp-integration/`) - Protocol specifications

---

## Key Changes from v1.0

### Ontology-Driven Redesign

| Previous Approach | New Approach |
|------------------|--------------|
| Separate "Agents" and "Pipelines" pages | Unified "Work Units" page |
| Trust as isolated GOVERN section | Trust integrated into all views |
| Same UI for all users | Level-based adaptive UI |
| Folder-based organization | Workspace-based collections |
| Technical terminology | User-friendly terminology |

### New Conceptual Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                     NEW FRONTEND MODEL                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   WORK UNIT (Unified Concept)                                       │
│   ─────────────────────────                                         │
│   • Replaces "Agent" and "Pipeline" terminology                     │
│   • Two types: Atomic (single) and Composite (orchestration)        │
│   • Same card design, subtle type indicators                        │
│   • Trust integrated at the card level                              │
│                                                                     │
│   THREE-LEVEL USER EXPERIENCE                                       │
│   ───────────────────────────                                       │
│   • Level 1 (Task Performer): Simplified task view                  │
│   • Level 2 (Process Owner): Process management + delegation        │
│   • Level 3 (Value Chain Owner): Enterprise + compliance            │
│                                                                     │
│   WORKSPACES                                                        │
│   ──────────                                                        │
│   • Purpose-driven collections (not folders)                        │
│   • Cross-department capable                                        │
│   • Define delegation scope                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Overview

The EATP frontend provides:

1. **Work Unit Management**: Create, configure, and manage work units (replacing agents/pipelines)
2. **Level-Based Experience**: Adaptive UI based on user trust posture
3. **Trust-Aware Components**: Trust status visible throughout the UI
4. **Workspace Management**: Purpose-driven collections with delegation
5. **Delegation Flows**: Visual, intuitive trust delegation
6. **Audit Dashboard**: Compliance and activity tracking

---

## Navigation Architecture

### Revised Sidebar Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   WORK                           ← User-centric section              │
│   ├── My Tasks                   ← Level 1+: Run tasks               │
│   ├── My Processes               ← Level 2+: Manage processes        │
│   └── Value Chains               ← Level 3: Enterprise view          │
│                                                                      │
│   BUILD                          ← Creator-centric section           │
│   ├── Work Units                 ← Unified agents + pipelines        │
│   ├── Workspaces                 ← Purpose-driven collections        │
│   └── Connectors                 ← ESAs and integrations             │
│                                                                      │
│   GOVERN                         ← Trust and compliance              │
│   ├── Trust                      ← Delegation management             │
│   ├── Compliance                 ← Audit and constraints             │
│   └── Activity                   ← Execution history                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Level-Based Adaptation

| Section | Level 1 | Level 2 | Level 3 |
|---------|---------|---------|---------|
| WORK > My Tasks | ✓ | ✓ | ✓ |
| WORK > My Processes | - | ✓ | ✓ |
| WORK > Value Chains | - | - | ✓ |
| BUILD | - | ✓ | ✓ |
| GOVERN > My Delegations | - | ✓ | - |
| GOVERN (full) | - | - | ✓ |
| ADMIN | - | - | ✓ |

---

## Key UI Components

### 1. Work Unit Card (Unified Design)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WORK UNIT CARD                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   ┌──────────┐   Invoice Processor                          │  │
│   │   │   ◉◉◉    │   Processes and validates invoices           │  │
│   │   │ (type)   │                                               │  │
│   │   └──────────┘                                               │  │
│   │                                                              │  │
│   │   ┌─────────────────────────────────────────────────────┐   │  │
│   │   │ Capabilities: extract, validate, route, archive     │   │  │
│   │   └─────────────────────────────────────────────────────┘   │  │
│   │                                                              │  │
│   │   ┌────────────────┐  ┌────────────────┐                    │  │
│   │   │ ✓ Trust Valid  │  │ Uses: 4 units  │ ← Composite only   │  │
│   │   └────────────────┘  └────────────────┘                    │  │
│   │                                                              │  │
│   │   [Run]  [Configure]  [Delegate]                             │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Visual Differentiation:                                           │
│   • Atomic: Single icon (◉), no "Uses" badge                       │
│   • Composite: Stacked icon (◉◉◉), shows sub-unit count            │
│   • Trust status always visible                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. My Tasks View (Level 1 Primary)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MY TASKS                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Available Tasks                                 [Search...]       │
│                                                                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│   │ 📝 Summarize│  │ 📊 Extract  │  │ 🌐 Translate│               │
│   │   Document  │  │    Data     │  │   Content   │               │
│   │             │  │             │  │             │               │
│   │ [Run Now]   │  │ [Run Now]   │  │ [Run Now]   │               │
│   └─────────────┘  └─────────────┘  └─────────────┘               │
│                                                                     │
│   Recent Results                                                    │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ✓ Summarize Document • 2 min ago           [View Result]    │  │
│   │ ✓ Extract Data • 15 min ago                [View Result]    │  │
│   │ ⏳ Translate Content • Running...           [View Status]    │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Focus: Simple, action-oriented, results-focused                   │
│   Hidden: Orchestration details, sub-units, technical config        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. My Processes View (Level 2 Primary)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MY PROCESSES                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Team Processes                     [+ New Process] [Search...]    │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   📊 Invoice Processing                                      │  │
│   │   ────────────────────                                       │  │
│   │                                                              │  │
│   │   ┌────────┐ → ┌────────┐ → ┌────────┐ → ┌────────┐         │  │
│   │   │Extract │   │Validate│   │ Route  │   │Archive │         │  │
│   │   └────────┘   └────────┘   └────────┘   └────────┘         │  │
│   │                                                              │  │
│   │   Trust: ✓ Valid from CFO    │  Team: 5 members              │  │
│   │   Runs today: 47             │  Status: ● Active             │  │
│   │                                                              │  │
│   │   [Configure]  [Delegate]  [View Runs]  [Audit]              │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Focus: Process orchestration, team delegation, activity           │
│   Visible: Flow diagram, delegation info, team activity             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Workspace Detail

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WORKSPACE: Q4 AUDIT PREP                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Q4 Audit Prep                                   [Edit] [Archive]  │
│   Cross-functional workspace for Q4 audit preparation               │
│   Expires: December 31, 2026  │  12 work units  │  5 members       │
│                                                                     │
│   Work Units                                          [+ Add Unit]  │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ Finance                                                      │  │
│   │ ├── 📊 Financial Report Generator                           │  │
│   │ └── 📈 Revenue Analyzer                                     │  │
│   │                                                              │  │
│   │ Legal                                                        │  │
│   │ └── 📝 Contract Reviewer                                    │  │
│   │                                                              │  │
│   │ Compliance                                                   │  │
│   │ └── 🔍 Audit Trail Analyzer                                 │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Members                                       [+ Invite Member]   │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 👤 Alice Chen (Owner)      Finance      Full Access         │  │
│   │ 👤 Bob Smith               Legal        Run Only            │  │
│   │ 👤 Carol Johnson          Compliance    Run Only            │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Feature Mapping

| Feature | Component | Priority | Ontology Reference |
|---------|-----------|----------|-------------------|
| Work Unit listing | WorkUnitList | P0 | 02-work-unit-model.md |
| Work Unit card | WorkUnitCard | P0 | 02-work-unit-model.md |
| Trust status badge | TrustStatusBadge | P0 | 05-eatp-mapping.md |
| My Tasks view | MyTasksPage | P0 | 03-user-experience-levels.md |
| My Processes view | MyProcessesPage | P0 | 03-user-experience-levels.md |
| Value Chains view | ValueChainsPage | P1 | 03-user-experience-levels.md |
| Workspace list | WorkspaceList | P1 | 04-workspaces.md |
| Workspace detail | WorkspaceDetail | P1 | 04-workspaces.md |
| Delegation wizard | DelegationWizard | P0 | 05-eatp-mapping.md |
| Level-based sidebar | AdaptiveSidebar | P0 | 06-navigation-architecture.md |
| Audit trail viewer | AuditTrailViewer | P1 | (existing) |
| Trust chain graph | TrustChainGraph | P2 | (existing) |

---

## Document Index

| File | Contents |
|------|----------|
| `00-executive-summary.md` | This document - overview and key changes |
| `01-component-architecture.md` | React component structure |
| `02-trust-visualization.md` | Trust chain and graph components |
| `03-work-units-ui.md` | **NEW**: Unified work unit components |
| `04-workspaces-ui.md` | **NEW**: Workspace management UI |
| `05-level-based-experience.md` | **NEW**: Adaptive UI implementation |
| `06-navigation-implementation.md` | **NEW**: Sidebar and routing |
| `07-api-integration.md` | Backend API integration |
| `08-migration-guide.md` | **NEW**: From agents/pipelines to work units |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Implement WorkUnitCard component (unified design)
- [ ] Implement TrustStatusBadge with new states
- [ ] Create MyTasksPage (Level 1 view)
- [ ] Implement AdaptiveSidebar with level detection
- [ ] Update routing structure

### Phase 2: Level 2 Experience (Week 3-4)
- [ ] Create MyProcessesPage with flow visualization
- [ ] Implement DelegationWizard with constraint tightening
- [ ] Build WorkspaceList and WorkspaceDetail
- [ ] Add team activity feed

### Phase 3: Level 3 Experience (Week 5-6)
- [ ] Create ValueChainsPage
- [ ] Implement cross-department trust visualization
- [ ] Build ComplianceDashboard
- [ ] Add enterprise audit trail features

### Phase 4: Polish & Migration (Week 7-8)
- [ ] Complete migration from agents/pipelines terminology
- [ ] Update all user-facing strings
- [ ] Add progressive disclosure animations
- [ ] Comprehensive testing across all levels

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | React 18+ |
| State Management | Zustand |
| UI Components | Shadcn/ui |
| Graphs/Flows | React Flow |
| Forms | React Hook Form + Zod |
| Data Fetching | @tanstack/react-query |
| Styling | Tailwind CSS v4 |
| Testing | Vitest + Testing Library + Playwright |

---

## Success Criteria

1. **Level 1 users** can find and run tasks without confusion
2. **Level 2 users** can manage processes and delegate to team
3. **Level 3 users** can view enterprise value chains and compliance
4. **No user** sees "Agent" or "Pipeline" terminology
5. **Trust status** is visible on every work unit interaction
6. **Delegation** UI enforces constraint tightening rule

---

## References

### Ontology Documents
- `docs/plans/eatp-ontology/01-executive-summary.md`
- `docs/plans/eatp-ontology/02-work-unit-model.md`
- `docs/plans/eatp-ontology/03-user-experience-levels.md`
- `docs/plans/eatp-ontology/04-workspaces.md`
- `docs/plans/eatp-ontology/05-eatp-mapping.md`
- `docs/plans/eatp-ontology/06-navigation-architecture.md`
- `docs/plans/eatp-ontology/07-terminology-glossary.md`

### EATP Integration Documents
- `docs/plans/eatp-integration/02-eatp-fundamentals.md`
- `docs/plans/eatp-integration/05-architecture-design.md`

### Whitepapers
- Agentic Enterprise Architecture Whitepaper (external)
- EATP Framework v3 (external)

---

## Next Steps

1. Review ontology documents for alignment
2. Begin Phase 1 implementation
3. Set up component storybook for Work Unit designs
4. Create API contracts with backend team
