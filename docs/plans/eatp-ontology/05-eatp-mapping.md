# EATP Ontology: EATP Protocol Mapping

## Document Control
- **Version**: 1.0
- **Date**: 2026-01-03
- **Status**: Proposed
- **Author**: Kaizen Studio Team

---

## Overview

This document maps the Kaizen Studio ontology concepts to the Enterprise Agent Trust Protocol (EATP) and the Agentic Enterprise Architecture whitepaper. The goal is to ensure that user-facing terminology aligns with protocol-level operations while hiding technical complexity.

---

## Concept Mapping Table

| UI Concept | EATP Concept | Whitepaper Concept | Notes |
|------------|--------------|-------------------|-------|
| **Work Unit** | Agent | Agent | Unified term for any executable entity |
| **Atomic Work Unit** | Specialist Agent | Specialist Agent | Leaf node, no delegation capability |
| **Composite Work Unit** | Manager Agent | Manager Agent | Can delegate, orchestrates others |
| **Workspace** | Organizational boundary | Departmental cluster | Defines delegation scope |
| **User Level 1** | Supervised Autonomy | Working-level agent | Pre-delegated, tight constraints |
| **User Level 2** | Shared Planning | Manager Agent user | Can delegate within scope |
| **User Level 3** | Delegation-at-Scale | Authority/Governance | Can establish trust chains |
| **Run** | VERIFY + Execute + AUDIT | Action execution | Trust sandwich pattern |
| **Delegate** | DELEGATE operation | Delegation Record | Creates new delegation |
| **Trust Status** | Trust Lineage Chain | Trust Chain | Valid/Expired/Revoked |

---

## Work Unit ↔ EATP Agent

### Mapping

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WORK UNIT ↔ EATP AGENT                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ATOMIC WORK UNIT                   SPECIALIST AGENT               │
│   ────────────────                   ────────────────               │
│                                                                     │
│   • Single capability                • Has Capability Attestations  │
│   • Cannot delegate                  • No DELEGATE authority        │
│   • Direct execution                 • Leaf node in hierarchy       │
│   • UI: Simple task card             • A2A: agent_type = specialist │
│                                                                     │
│   Properties mapping:                                               │
│   ┌───────────────────────┬───────────────────────────────────────┐│
│   │ Work Unit Property    │ EATP Field                            ││
│   ├───────────────────────┼───────────────────────────────────────┤│
│   │ id                    │ agent_id                              ││
│   │ name                  │ agent_name                            ││
│   │ capabilities          │ CapabilityAttestation[]               ││
│   │ constraints           │ ConstraintEnvelope.activeConstraints  ││
│   │ trustStatus           │ TrustChain.status                     ││
│   │ createdBy             │ GenesisRecord.authority_id (human)    ││
│   └───────────────────────┴───────────────────────────────────────┘│
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   COMPOSITE WORK UNIT                MANAGER AGENT                  │
│   ───────────────────                ─────────────                  │
│                                                                     │
│   • Orchestrates sub-units           • Has DELEGATE authority       │
│   • Can delegate                     • Creates Delegation Records   │
│   • Contains flow logic              • Coordinates specialists      │
│   • UI: Process card with flow       • A2A: agent_type = manager    │
│                                                                     │
│   Additional properties:                                            │
│   ┌───────────────────────┬───────────────────────────────────────┐│
│   │ Work Unit Property    │ EATP Field                            ││
│   ├───────────────────────┼───────────────────────────────────────┤│
│   │ subUnits              │ Delegated agents via DelegationRecord ││
│   │ flow                  │ Workflow definition (Kailash)         ││
│   │ delegationRules       │ Per-subunit ConstraintEnvelopes       ││
│   └───────────────────────┴───────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## User Levels ↔ EATP Trust Postures

### Mapping

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER LEVELS ↔ TRUST POSTURES                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   LEVEL 1: TASK PERFORMER            SUPERVISED AUTONOMY            │
│   ───────────────────────            ───────────────────            │
│                                                                     │
│   User behavior:                     EATP configuration:            │
│   • Runs pre-assigned tasks          • requires_human_approval: F   │
│   • Cannot delegate                  • delegation_authority: none   │
│   • Tight constraints                • constraint_scope: narrow     │
│   • Task-focused view                • audit_level: standard        │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │ EATP Constraint Envelope:                                     ││
│   │ {                                                             ││
│   │   "cost_limit": "$100/day",                                   ││
│   │   "time_window": "business_hours",                            ││
│   │   "data_scope": "own_department",                             ││
│   │   "delegation_allowed": false,                                ││
│   │   "audit_required": true                                      ││
│   │ }                                                             ││
│   └───────────────────────────────────────────────────────────────┘│
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   LEVEL 2: PROCESS OWNER             SHARED PLANNING                │
│   ──────────────────────             ──────────────                 │
│                                                                     │
│   User behavior:                     EATP configuration:            │
│   • Manages team processes           • plan_generation: true        │
│   • Can delegate to team             • delegation_authority: team   │
│   • Moderate constraints             • constraint_scope: department │
│   • Process-focused view             • audit_level: enhanced        │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │ EATP Constraint Envelope:                                     ││
│   │ {                                                             ││
│   │   "cost_limit": "$5,000/day",                                 ││
│   │   "time_window": "extended_hours",                            ││
│   │   "data_scope": "department",                                 ││
│   │   "delegation_allowed": true,                                 ││
│   │   "delegation_scope": "team_members",                         ││
│   │   "audit_required": true                                      ││
│   │ }                                                             ││
│   └───────────────────────────────────────────────────────────────┘│
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   LEVEL 3: VALUE CHAIN OWNER         DELEGATION-AT-SCALE            │
│   ──────────────────────────         ───────────────────            │
│                                                                     │
│   User behavior:                     EATP configuration:            │
│   • ESTABLISH trust chains           • establish_authority: true    │
│   • Cross-department delegation      • delegation_authority: org    │
│   • Enterprise constraints           • constraint_scope: enterprise │
│   • Value chain view                 • audit_level: compliance      │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │ EATP Constraint Envelope:                                     ││
│   │ {                                                             ││
│   │   "cost_limit": "$100,000/day",                               ││
│   │   "time_window": "24/7",                                      ││
│   │   "data_scope": "enterprise",                                 ││
│   │   "delegation_allowed": true,                                 ││
│   │   "delegation_scope": "organization",                         ││
│   │   "establish_allowed": true,                                  ││
│   │   "revoke_allowed": true,                                     ││
│   │   "audit_required": true                                      ││
│   │ }                                                             ││
│   └───────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## UI Actions ↔ EATP Operations

### Run Action

```
┌─────────────────────────────────────────────────────────────────────┐
│                     "RUN" ↔ TRUST SANDWICH                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   User clicks [Run Now]:                                            │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │                                                               ││
│   │   1. VERIFY (before execution)                                ││
│   │   ────────                                                    ││
│   │   • Validate user's trust chain                               ││
│   │   • Check capability for requested action                     ││
│   │   • Verify constraint envelope allows operation               ││
│   │   • Check expiration and revocation status                    ││
│   │                                                               ││
│   │   EATP API: POST /api/v1/trust/verify                         ││
│   │   {                                                           ││
│   │     "agentId": "work-unit-id",                                ││
│   │     "action": "run",                                          ││
│   │     "userId": "current-user-id",                              ││
│   │     "level": "STANDARD"                                       ││
│   │   }                                                           ││
│   │                                                               ││
│   │   If verification fails → Show error, do not proceed          ││
│   │                                                               ││
│   └───────────────────────────────────────────────────────────────┘│
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │                                                               ││
│   │   2. EXECUTE (perform work)                                   ││
│   │   ──────────                                                  ││
│   │   • Execute the work unit (Kailash workflow)                  ││
│   │   • Pass user context (root_source preserved)                 ││
│   │   • Enforce constraints during execution                      ││
│   │                                                               ││
│   │   Kailash API: POST /api/v1/workflows/{id}/run                ││
│   │   {                                                           ││
│   │     "inputs": { ... },                                        ││
│   │     "trustContext": {                                         ││
│   │       "rootSource": "user@company.com",                       ││
│   │       "trustChainHash": "abc123...",                          ││
│   │       "constraints": { ... }                                  ││
│   │     }                                                         ││
│   │   }                                                           ││
│   │                                                               ││
│   └───────────────────────────────────────────────────────────────┘│
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │                                                               ││
│   │   3. AUDIT (after execution)                                  ││
│   │   ─────────                                                   ││
│   │   • Record action in audit trail                              ││
│   │   • Link to trust chain                                       ││
│   │   • Include root_source (human origin)                        ││
│   │   • Append to immutable audit anchor chain                    ││
│   │                                                               ││
│   │   EATP API: POST /api/v1/trust/audit                          ││
│   │   {                                                           ││
│   │     "agentId": "work-unit-id",                                ││
│   │     "action": "run",                                          ││
│   │     "result": "SUCCESS",                                      ││
│   │     "rootSource": "user@company.com",                         ││
│   │     "trustChainHash": "abc123...",                            ││
│   │     "parentAnchorId": "prev-anchor-id"                        ││
│   │   }                                                           ││
│   │                                                               ││
│   └───────────────────────────────────────────────────────────────┘│
│                                                                     │
│   UI shows: Success message + link to result                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Delegate Action

```
┌─────────────────────────────────────────────────────────────────────┐
│                     "DELEGATE" ↔ DELEGATE OPERATION                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   User clicks [Delegate]:                                           │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │                                                               ││
│   │   1. CHECK AUTHORITY                                          ││
│   │   ──────────────────                                          ││
│   │   • Verify user has DELEGATE capability                       ││
│   │   • Check delegation scope includes target user               ││
│   │   • Verify constraints allow requested delegation             ││
│   │                                                               ││
│   │   If user cannot delegate → Hide/disable delegate button      ││
│   │                                                               ││
│   └───────────────────────────────────────────────────────────────┘│
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │                                                               ││
│   │   2. COLLECT DELEGATION PARAMETERS                            ││
│   │   ────────────────────────────────                            ││
│   │   • Select delegatee (target user)                            ││
│   │   • Choose capabilities to delegate                           ││
│   │   • Tighten constraints (cannot loosen)                       ││
│   │   • Set expiration (optional)                                 ││
│   │                                                               ││
│   │   UI: Delegation wizard (see 03-user-experience-levels.md)    ││
│   │                                                               ││
│   └───────────────────────────────────────────────────────────────┘│
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │                                                               ││
│   │   3. CREATE DELEGATION RECORD                                 ││
│   │   ───────────────────────────                                 ││
│   │                                                               ││
│   │   EATP API: POST /api/v1/trust/delegate                       ││
│   │   {                                                           ││
│   │     "delegatorId": "current-user-pseudo-agent-id",            ││
│   │     "delegateeId": "target-user-pseudo-agent-id",             ││
│   │     "workUnitId": "work-unit-id",                             ││
│   │     "capabilities": ["run", "view_results"],                  ││
│   │     "constraintSubset": {                                     ││
│   │       "cost_limit": "$500/day",  // Tightened                 ││
│   │       "time_window": "business_hours",                        ││
│   │       "data_scope": "q4_only"                                 ││
│   │     },                                                        ││
│   │     "expiresAt": "2026-12-31T23:59:59Z"                       ││
│   │   }                                                           ││
│   │                                                               ││
│   │   Response creates DelegationRecord in EATP                   ││
│   │                                                               ││
│   └───────────────────────────────────────────────────────────────┘│
│                              │                                      │
│                              ▼                                      │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │                                                               ││
│   │   4. AUDIT THE DELEGATION                                     ││
│   │   ───────────────────────                                     ││
│   │   • Record delegation action                                  ││
│   │   • Link to delegation record                                 ││
│   │   • Preserve root_source chain                                ││
│   │                                                               ││
│   │   Automatic via EATP backend                                  ││
│   │                                                               ││
│   └───────────────────────────────────────────────────────────────┘│
│                                                                     │
│   UI shows: Success message + delegatee now has access             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Workspace ↔ EATP Organizational Boundary

### Mapping

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WORKSPACE ↔ EATP BOUNDARY                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Workspace in UI:                                                  │
│   ────────────────                                                  │
│   • Collection of work units grouped by purpose                     │
│   • Has members with varying access levels                          │
│   • Defines constraints for contained work units                    │
│                                                                     │
│   EATP Implementation:                                              │
│   ────────────────────                                              │
│   • Workspace = Organizational authority scope                      │
│   • Members = Agents with delegated access                          │
│   • Adding work unit = Creating delegation to workspace             │
│   • Member access = Further delegation within workspace scope       │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │                                                               ││
│   │   Workspace "Q4 Audit Prep" in EATP terms:                    ││
│   │                                                               ││
│   │   1. Authority Scope:                                         ││
│   │      {                                                        ││
│   │        "scope_id": "workspace-q4-audit",                      ││
│   │        "scope_type": "workspace",                             ││
│   │        "owner": "alice@company.com",                          ││
│   │        "constraints": {                                       ││
│   │          "purpose": "q4_audit_preparation",                   ││
│   │          "expires_at": "2026-12-31"                           ││
│   │        }                                                      ││
│   │      }                                                        ││
│   │                                                               ││
│   │   2. Work Unit Delegations (per-unit):                        ││
│   │      {                                                        ││
│   │        "delegator": "cfo@company.com",                        ││
│   │        "delegatee": "workspace-q4-audit",  // Scope, not user ││
│   │        "work_unit": "financial-report-gen",                   ││
│   │        "constraints": { ... }                                 ││
│   │      }                                                        ││
│   │                                                               ││
│   │   3. Member Access (per-member):                              ││
│   │      {                                                        ││
│   │        "delegator": "workspace-q4-audit",                     ││
│   │        "delegatee": "bob@company.com",                        ││
│   │        "capabilities": ["run", "view"],                       ││
│   │        "constraints": { ... }  // Further tightened           ││
│   │      }                                                        ││
│   │                                                               ││
│   └───────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Trust Status Display

### Mapping Trust Chain Status to UI

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TRUST STATUS MAPPING                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   EATP Trust Chain Status    UI Display                             │
│   ───────────────────────    ──────────                             │
│                                                                     │
│   status: "VALID"            ● Trusted (green badge)                │
│   └─ Chain is complete       "This work unit has valid trust"       │
│   └─ Not expired                                                    │
│   └─ Not revoked                                                    │
│                                                                     │
│   status: "EXPIRED"          ◐ Expired (amber badge)                │
│   └─ expiresAt < now         "Trust has expired - renewal required" │
│                              [Renew Trust] action available         │
│                                                                     │
│   status: "REVOKED"          ○ Revoked (red badge)                  │
│   └─ Explicitly revoked      "Trust has been revoked"               │
│                              [Contact Admin] message                │
│                                                                     │
│   status: "PENDING"          ◌ Pending (gray badge)                 │
│   └─ ESTABLISH not complete  "Trust establishment pending"          │
│                              [Complete Setup] action available      │
│                                                                     │
│   ────────────────────────────────────────────────────────────────  │
│                                                                     │
│   Additional Status Indicators:                                     │
│                                                                     │
│   Expiring Soon (within 7 days):                                    │
│   └─ Warning icon + "Expires in X days"                             │
│   └─ [Renew] action prominent                                       │
│                                                                     │
│   Constraint Violation Risk:                                        │
│   └─ Alert icon + "Near constraint limit"                           │
│   └─ Shows which constraint (e.g., "80% of daily cost limit")       │
│                                                                     │
│   Delegation Chain Depth:                                           │
│   └─ "Delegated 3 levels from [original authority]"                 │
│   └─ Link to view full chain                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Translation Layer

### Frontend ↔ Backend Mapping

```typescript
// Frontend model (UI-friendly)
interface WorkUnit {
  id: string;
  name: string;
  description: string;
  compositionType: 'atomic' | 'composite';
  capabilities: string[];
  constraints: Constraint[];
  trustStatus: 'valid' | 'expired' | 'revoked' | 'pending';
  createdBy: string;
  createdAt: string;
}

// Backend model (EATP-aligned)
interface EATPAgent {
  agent_id: string;
  agent_name: string;
  agent_type: 'specialist' | 'manager' | 'pseudo';
  trust_chain: TrustLineageChain;
  capability_attestations: CapabilityAttestation[];
  constraint_envelope: ConstraintEnvelope;
  genesis_record: GenesisRecord;
}

// Translation function
function workUnitFromEATP(agent: EATPAgent): WorkUnit {
  return {
    id: agent.agent_id,
    name: agent.agent_name,
    description: agent.trust_chain.metadata?.description || '',
    compositionType: agent.agent_type === 'manager' ? 'composite' : 'atomic',
    capabilities: agent.capability_attestations.map(ca => ca.capability),
    constraints: agent.constraint_envelope.active_constraints.map(toUIConstraint),
    trustStatus: mapTrustStatus(agent.trust_chain.status),
    createdBy: agent.genesis_record.authority_id,
    createdAt: agent.genesis_record.created_at,
  };
}

function mapTrustStatus(eatpStatus: string): WorkUnit['trustStatus'] {
  const mapping = {
    'VALID': 'valid',
    'EXPIRED': 'expired',
    'REVOKED': 'revoked',
    'PENDING': 'pending',
  };
  return mapping[eatpStatus] || 'pending';
}
```

---

## Whitepaper Alignment

### Key Whitepaper Principles Implemented

| Whitepaper Principle | Ontology Implementation |
|---------------------|------------------------|
| "Structure is representational, not prescriptive" | Workspaces are lenses, not containers |
| "Manager Agents serve as gatekeepers" | Level 2/3 users control access via delegation |
| "Trust flows DOWN the hierarchy, never UP" | Constraints only tighten through delegation |
| "Not all agents should be exposed directly" | Level 1 sees simplified task view |
| "root_source must always map to human" | All work unit actions trace to human user |
| "Constraints can only TIGHTEN" | UI enforces constraint tightening in delegation |

---

## Next Steps

1. Design navigation architecture (06-navigation-architecture.md)
2. Define terminology glossary (07-terminology-glossary.md)
3. Update frontend implementation plans
