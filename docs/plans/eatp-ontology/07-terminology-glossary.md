# EATP Ontology: Terminology Glossary

## Document Control
- **Version**: 1.0
- **Date**: 2026-01-03
- **Status**: Proposed
- **Author**: Kaizen Studio Team

---

## Overview

This glossary defines the official terminology for Kaizen Studio's user interface. The goal is to use consistent, user-friendly language that hides technical complexity while remaining aligned with EATP and the Agentic Enterprise Architecture whitepaper.

---

## Primary Terms (User-Facing)

### Work Unit

**Definition**: Anything that can accept a task, produce a result, and be delegated to.

**Usage in UI**:
- "Create a new work unit"
- "This work unit processes invoices"
- "12 work units in this workspace"

**Technical equivalent**: Agent (EATP), Workflow (Kailash)

**NOT to be called**: Agent, Pipeline, Bot, AI Assistant

---

### Atomic Work Unit

**Definition**: A work unit with a single capability that executes directly without orchestrating other units.

**Usage in UI**:
- Icon: Single solid circle (◉)
- Shown as simple task card
- No "sub-units" indicator

**Technical equivalent**: Specialist Agent (EATP), Single-node workflow (Kailash)

**When to use this term**: In filters, documentation, and technical contexts. In general UI, just say "work unit."

---

### Composite Work Unit

**Definition**: A work unit that orchestrates other work units to accomplish complex tasks.

**Usage in UI**:
- Icon: Stacked circles (◉◉)
- Shows "Uses X units" badge
- Can view internal flow

**Technical equivalent**: Manager Agent (EATP), Multi-node workflow (Kailash)

**Preferred alternative in UI**: "Process" (more user-friendly)

---

### Process

**Definition**: User-friendly term for a composite work unit. A sequence of steps that accomplishes a business goal.

**Usage in UI**:
- "My Processes" (sidebar)
- "Invoice Processing" (process name)
- "Configure this process"

**Technical equivalent**: Composite Work Unit, Manager Agent (EATP), Pipeline (legacy)

**This replaces**: "Pipeline" in all user-facing contexts

---

### Value Chain

**Definition**: A cross-departmental process that delivers end-to-end business value.

**Usage in UI**:
- "Value Chains" (sidebar, Level 3)
- "Procure-to-Pay value chain"
- "This value chain spans 3 departments"

**Technical equivalent**: Enterprise workflow, Cross-domain orchestration (whitepaper)

**When visible**: Only to Level 3 users

---

### Workspace

**Definition**: A purpose-driven collection of work units that can span departments and be shared with team members.

**Usage in UI**:
- "Create a new workspace"
- "Q4 Audit Prep workspace"
- "Add work units to this workspace"

**Technical equivalent**: Organizational boundary (EATP), Departmental cluster (whitepaper)

**NOT to be called**: Folder, Project, Collection

---

### Task

**Definition**: A single execution of a work unit with specific inputs and outputs.

**Usage in UI**:
- "My Tasks" (sidebar)
- "Run this task"
- "Task completed successfully"

**Technical equivalent**: Workflow run, Execution (Kailash)

**When to use**: When referring to running something. "Work unit" is the thing; "task" is running it.

---

## Trust Terms (User-Facing)

### Trust Status

**Definition**: Whether a work unit has valid authorization to operate.

**Usage in UI**:
- "Trust: ✓ Valid" (green badge)
- "Trust: Expired" (amber badge)
- "Trust: Revoked" (red badge)

**Values**:
| Status | Meaning | User Action |
|--------|---------|-------------|
| Valid | Can be used | None needed |
| Expired | Authorization timed out | Request renewal |
| Revoked | Authorization removed | Contact admin |
| Pending | Setup not complete | Complete setup |

---

### Delegate / Delegation

**Definition**: Granting someone else the ability to use a work unit with specific constraints.

**Usage in UI**:
- "Delegate to team"
- "You delegated this to Alice"
- "Delegation expires in 7 days"

**Technical equivalent**: DELEGATE operation (EATP), DelegationRecord

**NOT to be called**: Share, Grant access, Assign

---

### Capability

**Definition**: A specific action a work unit can perform.

**Usage in UI**:
- "Capabilities: analyze, summarize, extract"
- "This work unit has 3 capabilities"

**Technical equivalent**: CapabilityAttestation (EATP)

**Examples**: `read_data`, `write_report`, `send_notification`

---

### Constraint

**Definition**: A limit on what a work unit can do.

**Usage in UI**:
- "Constraints: $100/day limit, business hours only"
- "Add constraint"
- "Cannot exceed inherited constraints"

**Technical equivalent**: ConstraintEnvelope (EATP)

**Examples**: `cost_limit`, `time_window`, `data_scope`

---

## User Level Terms

### Task Performer (Level 1)

**Definition**: User who can run pre-assigned tasks but cannot delegate or create.

**Internal reference**: Level 1

**Technical equivalent**: Supervised Autonomy trust posture (EATP)

**NOT shown in UI**: Users don't see their "level" - they just see what they can do.

---

### Process Owner (Level 2)

**Definition**: User who can manage processes and delegate to their team.

**Internal reference**: Level 2

**Technical equivalent**: Shared Planning trust posture (EATP), Manager Agent user

---

### Value Chain Owner (Level 3)

**Definition**: User who can establish trust, manage cross-department value chains, and access compliance features.

**Internal reference**: Level 3

**Technical equivalent**: Delegation-at-Scale trust posture (EATP), Authority

---

## Technical Terms (Internal/Advanced)

These terms may appear in technical documentation or advanced settings but should be minimized in general UI.

### EATP (Enterprise Agent Trust Protocol)

**Definition**: The underlying protocol for trust management.

**When to show**: In compliance reports, audit logs, technical documentation.

**NOT to show**: In general task/process UI.

---

### Trust Lineage Chain

**Definition**: The cryptographic chain proving authorization from human to work unit.

**When to show**: In audit/compliance views for Level 3 users.

**User-friendly alternative**: "Trust chain" or just "trust status"

---

### Genesis Record

**Definition**: The record of initial trust establishment.

**When to show**: In detailed trust views, audit logs.

**User-friendly alternative**: "Created by [authority]" or "Trust established by [person]"

---

### Constraint Envelope

**Definition**: The computed set of active constraints for a work unit.

**When to show**: In technical/constraint configuration views.

**User-friendly alternative**: "Current constraints" or "Operating limits"

---

### Audit Anchor

**Definition**: An immutable record of an action taken.

**When to show**: In audit trail views.

**User-friendly alternative**: "Audit entry" or "Activity record"

---

## Deprecated Terms

These terms should be phased out of the UI:

| Deprecated Term | Replacement | Reason |
|-----------------|-------------|--------|
| Agent | Work Unit | Too technical |
| Pipeline | Process | Too technical |
| Bot | Work Unit | Too casual |
| AI Assistant | Work Unit | Too vague |
| Hub | Workspace | Not in ontology |
| Folder | Workspace | Misleading (not a container) |
| Share | Delegate | Imprecise (implies copying) |
| Permission | Capability | EATP terminology |

---

## Usage Guidelines

### Do's

- Use "work unit" consistently
- Say "run a task" not "execute an agent"
- Say "delegate to" not "share with"
- Show trust status prominently
- Use icons to reinforce meaning

### Don'ts

- Don't expose EATP terminology to Level 1/2 users
- Don't use "agent" or "pipeline" in UI
- Don't show technical IDs to users
- Don't mix terminology (be consistent)

### Example Transformations

| Technical | User-Friendly |
|-----------|---------------|
| "Create agent" | "Create work unit" |
| "Execute pipeline" | "Run process" |
| "Agent has CapabilityAttestation" | "Work unit can analyze data" |
| "DelegationRecord created" | "Delegated to Alice" |
| "ConstraintEnvelope updated" | "Limits updated" |
| "EATP VERIFY failed" | "Trust verification failed" |

---

## UI Text Templates

### Common Messages

```
Task completed successfully
→ "Summarize Document completed - View result"

Trust verification failed
→ "Unable to run: Trust has expired. Request renewal."

Delegation created
→ "Delegated Invoice Processing to Alice with $500/day limit"

Constraint violation
→ "Cannot run: Daily cost limit reached ($100 of $100)"

Workspace access granted
→ "You now have access to Q4 Audit Prep workspace"
```

### Error Messages

```
Insufficient capability
→ "You don't have access to run this. Contact your manager to request delegation."

Expired delegation
→ "Your access to [work unit] expired on [date]. Request renewal from [delegator]."

Constraint exceeded
→ "This would exceed your [constraint_type] limit. Current: [current], Limit: [limit]."
```

---

## Localization Notes

When translating:

1. **Work Unit**: Translate as "work item" or equivalent concept
2. **Process**: Can use local business terminology
3. **Trust**: Maintain security/authorization connotation
4. **Delegate**: Use formal authorization language, not casual "share"
5. **Capability**: Use action-oriented language ("can do X")
6. **Constraint**: Use limit/boundary language

---

## Summary Table

| Concept | User Term | Technical Term | EATP Term |
|---------|-----------|----------------|-----------|
| Executable entity | Work Unit | Workflow | Agent |
| Single task | Work Unit (atomic) | Single-node workflow | Specialist Agent |
| Multi-step process | Process | Multi-node workflow | Manager Agent |
| Cross-dept workflow | Value Chain | Enterprise workflow | Cross-domain orchestration |
| Collection | Workspace | Organizational scope | Authority boundary |
| Authorization | Trust Status | Trust chain | TrustLineageChain |
| Granting access | Delegate | Create delegation | DELEGATE operation |
| What it can do | Capability | Capability | CapabilityAttestation |
| Limits | Constraint | Constraint | ConstraintEnvelope |
| Running something | Task | Execution/Run | Action |
