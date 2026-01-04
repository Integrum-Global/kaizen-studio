# EATP Ontology: Executive Summary

## Document Control
- **Version**: 1.0
- **Date**: 2026-01-03
- **Status**: Proposed
- **Author**: Kaizen Studio Team

---

## Purpose

This document series defines the conceptual ontology for the Kaizen Studio user interface, aligning user-facing terminology and navigation with the Enterprise Agent Trust Protocol (EATP) and the Agentic Enterprise Architecture whitepaper.

The goal is to replace technical implementation terms ("Agent" vs "Pipeline") with user-centric concepts that:
1. Hide recursive complexity behind simple abstractions
2. Map naturally to organizational hierarchy
3. Support role-based access patterns
4. Align with EATP trust delegation model

---

## The Problem

### Current State (Technical Terms)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CURRENT UI MODEL                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   "Agent" = Single executable unit                                  │
│   "Pipeline" = Composition of agents                                │
│                                                                     │
│   Problems:                                                         │
│   • Users don't think in terms of "pipelines"                      │
│   • Hides the fact that pipelines are RECURSIVE                    │
│   • No clear mapping to organizational hierarchy                   │
│   • Doesn't express trust delegation relationships                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Target State (User-Centric Terms)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   PROPOSED UI MODEL                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   "Work Unit" = Anything that accepts tasks and produces results    │
│   "Workspace" = Purpose-driven collection of work units             │
│                                                                     │
│   Benefits:                                                         │
│   • Users think in terms of "what can do work"                     │
│   • Recursive structure is an implementation detail                │
│   • Maps to organizational hierarchy (junior → senior)             │
│   • Trust delegation expressed as "what I can delegate"            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### 1. Work Unit (Unified Recursive Model)

A **Work Unit** is anything that can:
- Accept a task
- Produce a result
- Be delegated to

Work Units come in two flavors:
- **Atomic**: Single capability, no composition (current "Agent")
- **Composite**: Orchestrates other work units (current "Pipeline")

The key insight: Users don't need to distinguish between atomic and composite - they care whether it can do the job.

### 2. Three-Level User Experience

Users interact with work units based on their organizational role:

| Level | User Type | What They See | EATP Posture |
|-------|-----------|---------------|--------------|
| **1** | Task Performer | "My Tasks" - tools they can run | Supervised Autonomy |
| **2** | Process Owner | "My Processes" - workflows they orchestrate | Shared Planning |
| **3** | Value Chain Owner | "Value Chains" - cross-dept orchestration | Delegation-at-Scale |

### 3. Workspaces (Purpose-Driven Collections)

A **Workspace** is a lens, not a container:
- Groups related work units by PURPOSE, not by type
- Can cross department boundaries (with trust delegation)
- Can be temporary (project-based) or permanent (function-based)

Example: "Q4 Audit Prep" workspace contains Finance, Legal, and Compliance work units.

### 4. EATP Trust Integration

The ontology maps cleanly to EATP concepts:

| UI Concept | EATP Concept | Trust Operation |
|------------|--------------|-----------------|
| Work Unit | Agent (any type) | ESTABLISH creates Genesis Record |
| Atomic | Specialist Agent | Capabilities only, no DELEGATE |
| Composite | Manager Agent | Has DELEGATE authority |
| Workspace | Organizational boundary | Defines delegation scope |
| User Level | Trust Posture | Controls available operations |

---

## Document Index

| File | Contents |
|------|----------|
| `01-executive-summary.md` | This document - overview |
| `02-work-unit-model.md` | Unified recursive model definition |
| `03-user-experience-levels.md` | Three-level UX specification |
| `04-workspaces.md` | Purpose-driven collections |
| `05-eatp-mapping.md` | Mapping to EATP concepts |
| `06-navigation-architecture.md` | Revised sidebar and navigation |
| `07-terminology-glossary.md` | Clear terminology definitions |

---

## Key Principles

### From the Agentic Enterprise Whitepaper

> "The departmental structure is representational, not prescriptive. It is designed to be reconfigured whenever organizational structures evolve."

This means:
- Don't force rigid "Agent" vs "Pipeline" categories
- Allow flexible grouping by purpose
- Support organizational reconfiguration

### From EATP Fundamentals

> "Trust flows DOWN the hierarchy, never UP. Constraints can only TIGHTEN through delegation."

This means:
- UI should reflect delegation relationships
- Higher-level users see more, can delegate more
- Lower-level users have tighter constraints

### Human-Centric Design

> "Not all agents should be exposed directly. Manager Agents serve as gatekeepers."

This means:
- Level 1 users see simplified tools, not full architecture
- Complexity is progressively disclosed based on role
- Implementation details (atomic vs composite) are hidden

---

## Success Criteria

1. **Users never need to understand "Pipeline"** - they think in terms of work and processes
2. **Role-based access feels natural** - junior sees tools, senior sees value chains
3. **Trust delegation is implicit** - "what I can delegate" vs "EATP DELEGATE operation"
4. **Recursive structure is invisible** - a "Report Generator" is just that, whether it's 1 or 50 agents

---

## Next Steps

1. Review Work Unit model (02-work-unit-model.md)
2. Review three-level UX (03-user-experience-levels.md)
3. Finalize terminology (07-terminology-glossary.md)
4. Update frontend implementation plans (eatp-frontend/)
