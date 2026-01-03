# Data Flows: Technical Sequence Diagrams

This document provides detailed technical data flows for each EATP operation.

---

## Data Flow 1: Human Login → PseudoAgent Creation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SEQUENCE: HUMAN AUTHENTICATION                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Browser          Studio           SDK                 Auth Provider  │
│      │              │                │                       │         │
│      │   GET /login │                │                       │         │
│      │─────────────►│                │                       │         │
│      │              │                │                       │         │
│      │   302 Redirect to SSO         │                       │         │
│      │◄─────────────│                │                       │         │
│      │              │                │                       │         │
│      │   GET /oauth/authorize        │                       │         │
│      │─────────────────────────────────────────────────────►│         │
│      │              │                │                       │         │
│      │   User authenticates          │                       │         │
│      │◄─────────────────────────────────────────────────────│         │
│      │              │                │                       │         │
│      │   GET /callback?code=xxx      │                       │         │
│      │─────────────►│                │                       │         │
│      │              │                │                       │         │
│      │              │   Exchange code for token              │         │
│      │              │───────────────────────────────────────►│         │
│      │              │                │                       │         │
│      │              │   JWT token returned                   │         │
│      │              │◄───────────────────────────────────────│         │
│      │              │                │                       │         │
│      │              │  PseudoAgentFactory.from_jwt(token)    │         │
│      │              │───────────────►│                       │         │
│      │              │                │                       │         │
│      │              │                │ ┌─────────────────────────────┐ │
│      │              │                │ │ 1. Decode JWT               │ │
│      │              │                │ │ 2. Validate signature       │ │
│      │              │                │ │ 3. Extract claims:          │ │
│      │              │                │ │    - sub: "alice@corp.com"  │ │
│      │              │                │ │    - name: "Alice Chen"     │ │
│      │              │                │ │    - iss: "okta.com"        │ │
│      │              │                │ │ 4. Create HumanOrigin       │ │
│      │              │                │ │ 5. Create PseudoAgent       │ │
│      │              │                │ └─────────────────────────────┘ │
│      │              │                │                       │         │
│      │              │  PseudoAgent returned                  │         │
│      │              │◄───────────────│                       │         │
│      │              │                │                       │         │
│      │              │ ┌──────────────────────────────────────┐         │
│      │              │ │ Store in session:                    │         │
│      │              │ │ - pseudo_agent_id                    │         │
│      │              │ │ - human_origin                       │         │
│      │              │ │ - session_expires_at                 │         │
│      │              │ └──────────────────────────────────────┘         │
│      │              │                │                       │         │
│      │   200 OK + Session Cookie     │                       │         │
│      │◄─────────────│                │                       │         │
│      │              │                │                       │         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Structures Created

```python
# HumanOrigin (immutable, stored in session)
{
    "human_id": "alice@corp.com",
    "display_name": "Alice Chen",
    "auth_provider": "okta",
    "session_id": "sess-abc123",
    "authenticated_at": "2025-01-02T09:00:00Z"
}

# PseudoAgent (in-memory, created from HumanOrigin)
{
    "pseudo_agent_id": "pseudo:alice@corp.com",
    "human_origin": <HumanOrigin above>,
    "trust_operations": <TrustOperations instance>
}
```

---

## Data Flow 2: Initial Delegation (Human → Agent)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SEQUENCE: INITIAL DELEGATION                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Browser     Studio API      PseudoAgent    TrustOps     TrustStore  │
│      │            │               │             │              │        │
│      │ POST /delegations          │             │              │        │
│      │ {                          │             │              │        │
│      │   agent_id: "inv-proc",   │             │              │        │
│      │   task_id: "nov-inv",     │             │              │        │
│      │   capabilities: [...],    │             │              │        │
│      │   constraints: {...}      │             │              │        │
│      │ }                          │             │              │        │
│      │────────────►│              │             │              │        │
│      │             │              │             │              │        │
│      │             │ Get PseudoAgent from session              │        │
│      │             │──────────────►│             │              │        │
│      │             │              │             │              │        │
│      │             │              │ delegate_to(           │        │
│      │             │              │   agent_id,            │        │
│      │             │              │   task_id,             │        │
│      │             │              │   capabilities,        │        │
│      │             │              │   constraints          │        │
│      │             │              │ )                      │        │
│      │             │              │─────────────►│              │        │
│      │             │              │             │              │        │
│      │             │              │             │ ┌────────────────────┐│
│      │             │              │             │ │ 1. Create          ││
│      │             │              │             │ │    ExecutionContext││
│      │             │              │             │ │    with human_origin│
│      │             │              │             │ │                    ││
│      │             │              │             │ │ 2. Validate        ││
│      │             │              │             │ │    constraint      ││
│      │             │              │             │ │    tightening      ││
│      │             │              │             │ │                    ││
│      │             │              │             │ │ 3. Create          ││
│      │             │              │             │ │    DelegationRecord││
│      │             │              │             │ │    with:           ││
│      │             │              │             │ │    - human_origin  ││
│      │             │              │             │ │    - chain: [pseudo]│
│      │             │              │             │ │    - depth: 0      ││
│      │             │              │             │ └────────────────────┘│
│      │             │              │             │              │        │
│      │             │              │             │ save_delegation()    │
│      │             │              │             │─────────────►│        │
│      │             │              │             │              │        │
│      │             │              │             │   stored     │        │
│      │             │              │             │◄─────────────│        │
│      │             │              │             │              │        │
│      │             │              │  DelegationRecord          │        │
│      │             │              │◄─────────────│              │        │
│      │             │              │             │              │        │
│      │             │  (DelegationRecord, ExecutionContext)     │        │
│      │             │◄──────────────│             │              │        │
│      │             │              │             │              │        │
│      │ 201 Created               │             │              │        │
│      │ { delegation_id, chain_preview }        │              │        │
│      │◄────────────│              │             │              │        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Structures Created

```python
# ExecutionContext (passed to agent)
{
    "human_origin": {
        "human_id": "alice@corp.com",
        "display_name": "Alice Chen",
        ...
    },
    "delegation_chain": ["pseudo:alice@corp.com"],
    "delegation_depth": 0,
    "constraints": {
        "cost_limit": 1000,
        "time_window": "09:00-17:00",
        "resources": ["invoices/nov-2025/*"]
    },
    "trace_id": "trace-xyz789"
}

# DelegationRecord (persisted)
{
    "delegation_id": "del-abc123",
    "delegator_id": "pseudo:alice@corp.com",
    "delegatee_id": "inv-proc-001",
    "task_id": "nov-invoices",
    "delegated_capabilities": ["read_invoices", "process_invoices"],
    "delegated_at": "2025-01-02T09:15:00Z",
    "expires_at": "2025-12-01T00:00:00Z",
    "constraints": {
        "cost_limit": 1000,
        "time_window": "09:00-17:00",
        "resources": ["invoices/nov-2025/*"]
    },
    "human_origin": {
        "human_id": "alice@corp.com",
        ...
    },
    "delegation_chain": ["pseudo:alice@corp.com", "inv-proc-001"],
    "delegation_depth": 1
}
```

---

## Data Flow 3: Trust Sandwich (Agent Execution)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SEQUENCE: TRUST SANDWICH EXECUTION                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TrustedAgent    TrustOps    BaseAgent      ESA          Database     │
│      │              │           │            │              │           │
│      │ execute_async(inputs, action, resource, context)     │           │
│      │              │           │            │              │           │
│      │ ┌────────────────────────────────────────────────────┐           │
│      │ │ STEP 1: VERIFY                                     │           │
│      │ └────────────────────────────────────────────────────┘           │
│      │              │           │            │              │           │
│      │ verify(agent_id, action, resource, context)          │           │
│      │─────────────►│           │            │              │           │
│      │              │           │            │              │           │
│      │              │ ┌─────────────────────────────────────┐           │
│      │              │ │ Check:                              │           │
│      │              │ │ 1. context.human_origin exists      │           │
│      │              │ │ 2. Delegation not revoked           │           │
│      │              │ │ 3. Delegation not expired           │           │
│      │              │ │ 4. Has required capability          │           │
│      │              │ │ 5. Resource within scope            │           │
│      │              │ │ 6. Within time window               │           │
│      │              │ │ 7. Within cost limit                │           │
│      │              │ └─────────────────────────────────────┘           │
│      │              │           │            │              │           │
│      │ VerificationResult(valid=True)        │              │           │
│      │◄─────────────│           │            │              │           │
│      │              │           │            │              │           │
│      │ ┌────────────────────────────────────────────────────┐           │
│      │ │ STEP 2: EXECUTE                                    │           │
│      │ └────────────────────────────────────────────────────┘           │
│      │              │           │            │              │           │
│      │ execute_async(inputs)    │            │              │           │
│      │─────────────────────────►│            │              │           │
│      │              │           │            │              │           │
│      │              │           │ ESA.query(sql, params)    │           │
│      │              │           │───────────►│              │           │
│      │              │           │            │              │           │
│      │              │           │            │ execute(sql) │           │
│      │              │           │            │─────────────►│           │
│      │              │           │            │              │           │
│      │              │           │            │    result    │           │
│      │              │           │            │◄─────────────│           │
│      │              │           │            │              │           │
│      │              │           │   result   │              │           │
│      │              │           │◄───────────│              │           │
│      │              │           │            │              │           │
│      │     result   │           │            │              │           │
│      │◄─────────────────────────│            │              │           │
│      │              │           │            │              │           │
│      │ ┌────────────────────────────────────────────────────┐           │
│      │ │ STEP 3: AUDIT                                      │           │
│      │ └────────────────────────────────────────────────────┘           │
│      │              │           │            │              │           │
│      │ audit(agent_id, action, resource, SUCCESS, context)  │           │
│      │─────────────►│           │            │              │           │
│      │              │           │            │              │           │
│      │              │ ┌─────────────────────────────────────┐           │
│      │              │ │ Create AuditAnchor:                 │           │
│      │              │ │ - anchor_id: generated              │           │
│      │              │ │ - agent_id: from param              │           │
│      │              │ │ - action: from param                │           │
│      │              │ │ - result: SUCCESS                   │           │
│      │              │ │ - human_origin: from context ◄──────│           │
│      │              │ │ - parent_anchor_id: previous        │           │
│      │              │ │                                     │           │
│      │              │ │ Store in AuditStore                 │           │
│      │              │ └─────────────────────────────────────┘           │
│      │              │           │            │              │           │
│      │ AuditAnchor  │           │            │              │           │
│      │◄─────────────│           │            │              │           │
│      │              │           │            │              │           │
│      │ return result│           │            │              │           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Structures Created

```python
# VerificationResult (transient)
{
    "valid": True,
    "level": "STANDARD",
    "checked_at": "2025-01-02T10:30:00Z",
    "checks_passed": [
        "human_origin_present",
        "delegation_active",
        "capability_present",
        "constraints_satisfied"
    ],
    "verification_time_ms": 2.3
}

# AuditAnchor (persisted)
{
    "anchor_id": "audit-def456",
    "agent_id": "inv-proc-001",
    "action": "read_invoice",
    "resource": "invoices/INV-2025-1234",
    "result": "SUCCESS",
    "timestamp": "2025-01-02T10:30:00Z",
    "context": {
        "inputs": {"invoice_id": "INV-2025-1234"},
        "trace_id": "trace-xyz789"
    },
    "parent_anchor_id": "audit-abc123",
    "human_origin": {
        "human_id": "alice@corp.com",
        "display_name": "Alice Chen",
        ...
    }
}
```

---

## Data Flow 4: Agent-to-Agent Delegation (Constraint Tightening)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SEQUENCE: AGENT DELEGATION                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ManagerAgent   TrustOps    ConstraintValidator    WorkerAgent        │
│      │             │               │                    │               │
│      │ delegate_to_worker(worker, task, capabilities, constraints)     │
│      │             │               │                    │               │
│      │ Get current ExecutionContext (from context var)  │               │
│      │ ┌─────────────────────────────────────────────┐  │               │
│      │ │ context = get_current_context()             │  │               │
│      │ │ - human_origin: alice@corp.com              │  │               │
│      │ │ - constraints: {cost: $10000, ...}          │  │               │
│      │ │ - delegation_chain: [pseudo:alice, mgr]     │  │               │
│      │ │ - depth: 1                                  │  │               │
│      │ └─────────────────────────────────────────────┘  │               │
│      │             │               │                    │               │
│      │ delegate(manager_id, worker_id, task_id,        │               │
│      │          capabilities, new_constraints, context) │               │
│      │────────────►│               │                    │               │
│      │             │               │                    │               │
│      │             │ validate_tightening(               │               │
│      │             │   parent_constraints,              │               │
│      │             │   new_constraints                  │               │
│      │             │ )                                  │               │
│      │             │──────────────►│                    │               │
│      │             │               │                    │               │
│      │             │               │ ┌──────────────────────────────┐  │
│      │             │               │ │ Check each constraint:       │  │
│      │             │               │ │                              │  │
│      │             │               │ │ cost_limit:                  │  │
│      │             │               │ │   parent: $10,000            │  │
│      │             │               │ │   child:  $1,000  ✅ TIGHTER │  │
│      │             │               │ │                              │  │
│      │             │               │ │ time_window:                 │  │
│      │             │               │ │   parent: 09:00-17:00        │  │
│      │             │               │ │   child:  10:00-16:00 ✅     │  │
│      │             │               │ │                              │  │
│      │             │               │ │ resources:                   │  │
│      │             │               │ │   parent: invoices/*         │  │
│      │             │               │ │   child:  invoices/small/*   │  │
│      │             │               │ │           ✅ SUBSET          │  │
│      │             │               │ └──────────────────────────────┘  │
│      │             │               │                    │               │
│      │             │ ValidationResult(valid=True)       │               │
│      │             │◄──────────────│                    │               │
│      │             │               │                    │               │
│      │             │ ┌──────────────────────────────────────────────┐  │
│      │             │ │ Create DelegationRecord:                     │  │
│      │             │ │ - human_origin: alice (PRESERVED from ctx)   │  │
│      │             │ │ - delegation_chain: [..., mgr, worker]       │  │
│      │             │ │ - depth: 2 (incremented)                     │  │
│      │             │ │ - constraints: merged & tightened            │  │
│      │             │ └──────────────────────────────────────────────┘  │
│      │             │               │                    │               │
│      │ DelegationRecord           │                    │               │
│      │◄────────────│               │                    │               │
│      │             │               │                    │               │
│      │ Create worker ExecutionContext                   │               │
│      │ ┌─────────────────────────────────────────────┐  │               │
│      │ │ worker_ctx = context.with_delegation(       │  │               │
│      │ │   worker_id,                                │  │               │
│      │ │   new_constraints                           │  │               │
│      │ │ )                                           │  │               │
│      │ │                                             │  │               │
│      │ │ Result:                                     │  │               │
│      │ │ - human_origin: alice (STILL SAME!)        │  │               │
│      │ │ - chain: [pseudo:alice, mgr, worker]       │  │               │
│      │ │ - depth: 2                                  │  │               │
│      │ │ - constraints: tightened                    │  │               │
│      │ └─────────────────────────────────────────────┘  │               │
│      │             │               │                    │               │
│      │ worker.execute_async(task, context=worker_ctx)  │               │
│      │─────────────────────────────────────────────────►│               │
│      │             │               │                    │               │
│      │             │               │                    │ (executes     │
│      │             │               │                    │  with context)│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow 5: Cascade Revocation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SEQUENCE: CASCADE REVOCATION                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│    HRSystem      StudioAPI      TrustOps       TrustStore             │
│        │             │             │               │                    │
│        │ POST /webhooks/employee-termination       │                    │
│        │ { employee: "bob@corp.com" }              │                    │
│        │────────────►│             │               │                    │
│        │             │             │               │                    │
│        │             │ revoke_by_human("bob@corp.com", reason)         │
│        │             │────────────►│               │                    │
│        │             │             │               │                    │
│        │             │             │ find_delegations_by_human_origin( │
│        │             │             │   "bob@corp.com"                  │
│        │             │             │ )                                  │
│        │             │             │──────────────►│                    │
│        │             │             │               │                    │
│        │             │             │ [del-1, del-2, del-3]             │
│        │             │             │◄──────────────│                    │
│        │             │             │               │                    │
│        │             │             │ ┌─────────────────────────────┐   │
│        │             │             │ │ For each delegation:        │   │
│        │             │             │ │   revoke_cascade(agent_id)  │   │
│        │             │             │ └─────────────────────────────┘   │
│        │             │             │               │                    │
│        │             │             │ ┌─────────────────────────────────┐│
│        │             │             │ │ PARALLEL CASCADE:               ││
│        │             │             │ │                                 ││
│        │             │             │ │ Level 0: bob (revoke)          ││
│        │             │             │ │     │                           ││
│        │             │             │ │     ├── agent-a (revoke)       ││
│        │             │             │ │     │      └── agent-d (revoke)││
│        │             │             │ │     ├── agent-b (revoke)       ││
│        │             │             │ │     └── agent-c (revoke)       ││
│        │             │             │ │                                 ││
│        │             │             │ │ asyncio.gather(*all_revokes)   ││
│        │             │             │ └─────────────────────────────────┘│
│        │             │             │               │                    │
│        │             │             │ For each agent:                   │
│        │             │             │   mark_revoked(agent_id, reason)  │
│        │             │             │──────────────►│                    │
│        │             │             │               │                    │
│        │             │             │   done        │                    │
│        │             │             │◄──────────────│                    │
│        │             │             │               │                    │
│        │             │ RevocationResult {                              │
│        │             │   root: "bob@corp.com",                        │
│        │             │   revoked: ["agent-a", "agent-b", ...]         │
│        │             │   time: 0.7s                                   │
│        │             │ }                                               │
│        │             │◄────────────│               │                    │
│        │             │             │               │                    │
│        │ 200 OK      │             │               │                    │
│        │ { revoked_count: 4 }      │               │                    │
│        │◄────────────│             │               │                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Storage Schema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA ADDITIONS                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   TABLE: delegations                                                    │
│   ══════════════════                                                    │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  EXISTING COLUMNS:                                              │  │
│   │  ─────────────────                                              │  │
│   │  delegation_id       VARCHAR(64)   PRIMARY KEY                  │  │
│   │  delegator_id        VARCHAR(128)  NOT NULL                     │  │
│   │  delegatee_id        VARCHAR(128)  NOT NULL                     │  │
│   │  task_id             VARCHAR(128)  NOT NULL                     │  │
│   │  capabilities        JSONB         NOT NULL                     │  │
│   │  constraints         JSONB         NOT NULL                     │  │
│   │  delegated_at        TIMESTAMPTZ   NOT NULL                     │  │
│   │  expires_at          TIMESTAMPTZ                                │  │
│   │  revoked_at          TIMESTAMPTZ                                │  │
│   │  revoked_reason      TEXT                                       │  │
│   │                                                                 │  │
│   │  NEW COLUMNS:                                                   │  │
│   │  ────────────                                                   │  │
│   │  human_origin        JSONB         ◄── NEW: Stored HumanOrigin  │  │
│   │  delegation_chain    TEXT[]        ◄── NEW: Array of agent IDs  │  │
│   │  delegation_depth    INTEGER       ◄── NEW: Depth from human    │  │
│   │                                                                 │  │
│   │  NEW INDEX:                                                     │  │
│   │  ──────────                                                     │  │
│   │  CREATE INDEX idx_delegations_human_origin                      │  │
│   │    ON delegations ((human_origin->>'human_id'));                │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   TABLE: audit_anchors                                                  │
│   ════════════════════                                                  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  EXISTING COLUMNS:                                              │  │
│   │  ─────────────────                                              │  │
│   │  anchor_id           VARCHAR(64)   PRIMARY KEY                  │  │
│   │  agent_id            VARCHAR(128)  NOT NULL                     │  │
│   │  action              VARCHAR(256)  NOT NULL                     │  │
│   │  resource            VARCHAR(512)                               │  │
│   │  result              VARCHAR(32)   NOT NULL                     │  │
│   │  timestamp           TIMESTAMPTZ   NOT NULL                     │  │
│   │  context             JSONB         NOT NULL                     │  │
│   │  parent_anchor_id    VARCHAR(64)   REFERENCES audit_anchors     │  │
│   │                                                                 │  │
│   │  NEW COLUMN:                                                    │  │
│   │  ───────────                                                    │  │
│   │  human_origin        JSONB         ◄── NEW: Stored HumanOrigin  │  │
│   │                                                                 │  │
│   │  NEW INDEX:                                                     │  │
│   │  ──────────                                                     │  │
│   │  CREATE INDEX idx_audit_human_origin                            │  │
│   │    ON audit_anchors ((human_origin->>'human_id'));              │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints (Studio → SDK)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STUDIO API ENDPOINTS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   AUTHENTICATION                                                        │
│   ══════════════                                                        │
│   GET  /auth/login          → Redirect to SSO                          │
│   GET  /auth/callback       → Handle SSO callback, create PseudoAgent  │
│   POST /auth/logout         → Revoke session, clear PseudoAgent        │
│                                                                         │
│   DELEGATIONS                                                           │
│   ═══════════                                                           │
│   GET  /delegations         → List my active delegations               │
│   POST /delegations         → Create new delegation                    │
│   GET  /delegations/:id     → Get delegation details + chain           │
│   DELETE /delegations/:id   → Revoke delegation (cascade)              │
│                                                                         │
│   AUDIT                                                                 │
│   ═════                                                                 │
│   GET  /audit               → Search audit trail                       │
│   GET  /audit/:anchor_id    → Get audit anchor + human_origin          │
│   GET  /audit/chain/:id     → Get full trust chain for action          │
│                                                                         │
│   AGENTS                                                                │
│   ══════                                                                │
│   GET  /agents              → List available agents                    │
│   GET  /agents/:id          → Get agent details                        │
│   GET  /agents/:id/activity → Get agent's recent actions               │
│                                                                         │
│   ADMIN (Requires admin role)                                          │
│   ═════════════════════════                                            │
│   POST /admin/revoke-user   → Revoke all delegations for user          │
│   GET  /admin/metrics       → Get verification SLA metrics             │
│                                                                         │
│   WEBHOOKS (For external systems)                                      │
│   ═══════════════════════════════                                       │
│   POST /webhooks/employee-termination → Trigger cascade revocation     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
