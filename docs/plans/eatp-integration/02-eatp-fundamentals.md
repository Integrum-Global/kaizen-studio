# EATP Fundamentals: Core Concepts and First Principles

## Table of Contents

1. [The Three First Principles](#the-three-first-principles)
2. [EATP vs Existing Protocols](#eatp-vs-existing-protocols)
3. [The Trust Lineage Chain](#the-trust-lineage-chain)
4. [The Four Core Operations](#the-four-core-operations)
5. [Agent Taxonomy](#agent-taxonomy)
6. [The PKI Analogy](#the-pki-analogy)

---

## The Three First Principles

### FP1: Trust is the Barrier to Enterprise Adoption

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FIRST PRINCIPLE #1                              │
│                    "Trust is the Barrier"                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   The Question Every Enterprise Asks:                                   │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │     "If this AI agent makes a decision that costs us           │  │
│   │      $10 million, WHO IS ACCOUNTABLE?"                         │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   Without a clear answer, enterprises will NOT deploy autonomous AI.   │
│                                                                         │
│   EATP's Answer:                                                        │
│   ───────────────                                                       │
│   Every agent action traces to a human decision-maker through an       │
│   immutable, cryptographically-signed chain of delegations.            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### FP2: Legacy Systems Have Embedded Trust

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FIRST PRINCIPLE #2                              │
│                "Legacy Has Embedded Trust"                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Enterprises have spent DECADES building trust infrastructure:        │
│                                                                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│   │    LDAP     │  │    SAML     │  │   OAuth2    │  │   Kerberos  │   │
│   │   Active    │  │    SSO      │  │   OIDC      │  │   Tickets   │   │
│   │  Directory  │  │             │  │             │  │             │   │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│          │               │               │               │              │
│          └───────────────┴───────────────┴───────────────┘              │
│                                  │                                      │
│                                  ▼                                      │
│                    ┌─────────────────────────┐                         │
│                    │    EATP PseudoAgent     │                         │
│                    │   (Bridge Layer)        │                         │
│                    └─────────────────────────┘                         │
│                                                                         │
│   EATP doesn't replace these - it BRIDGES them to the agentic world.  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### FP3: Value Drives Adoption

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FIRST PRINCIPLE #3                              │
│                   "Value Drives Adoption"                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Security alone doesn't sell. ROI does.                               │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   WITHOUT EATP:                    WITH EATP:                   │  │
│   │   ──────────────                   ──────────────               │  │
│   │                                                                 │  │
│   │   • Manual approval queues         • Automated with audit       │  │
│   │   • Human in every loop            • Human oversight, not       │  │
│   │   • Slow, expensive                  bottleneck                 │  │
│   │   • Compliance = friction          • 10x faster processing      │  │
│   │                                    • Compliance built-in        │  │
│   │                                                                 │  │
│   │   Example: Invoice Processing                                   │  │
│   │   ─────────────────────────                                     │  │
│   │   Before: 3 days, 5 humans         After: 3 minutes, 0 humans  │  │
│   │   (but CFO can revoke anytime and see full audit trail)        │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## EATP vs Existing Protocols

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROTOCOL COMPARISON                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    ┌───────────────────────────────────────┐           │
│                    │           ENTERPRISE STACK            │           │
│                    └───────────────────────────────────────┘           │
│                                     │                                   │
│                    ┌────────────────┼────────────────┐                 │
│                    │                │                │                  │
│                    ▼                ▼                ▼                  │
│              ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│              │   MCP    │    │   A2A    │    │   EATP   │              │
│              │ (Tools)  │    │ (Comms)  │    │ (Trust)  │              │
│              └──────────┘    └──────────┘    └──────────┘              │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   MCP (Model Context Protocol)                                         │
│   ════════════════════════════                                         │
│   Question: "What tools can this agent use?"                           │
│   Scope:    Tool discovery and invocation                              │
│   Focus:    Capability exposure                                        │
│                                                                         │
│   A2A (Agent-to-Agent Protocol)                                        │
│   ═════════════════════════════                                        │
│   Question: "How do agents communicate?"                               │
│   Scope:    Inter-agent messaging                                      │
│   Focus:    Message format, discovery, routing                         │
│                                                                         │
│   EATP (Enterprise Agent Trust Protocol)                               │
│   ══════════════════════════════════════                               │
│   Question: "WHY should I trust this agent?"                           │
│   Scope:    Trust establishment, delegation, accountability            │
│   Focus:    Human-anchored authorization chains                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   KEY INSIGHT: EATP doesn't compete with MCP or A2A.                   │
│                EATP COMPLEMENTS them with the trust layer.             │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   Agent A ──[A2A message]──► Agent B ──[MCP tool call]──► DB   │  │
│   │              │                    │                             │  │
│   │              │    EATP wraps both layers with:                  │  │
│   │              │    • Who authorized this communication?          │  │
│   │              │    • Who authorized this tool access?            │  │
│   │              │    • What are the constraints?                   │  │
│   │              │    • Complete audit trail                        │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Trust Lineage Chain

The Trust Lineage Chain (TLC) is EATP's core data structure - the "certificate" that proves an agent's authorization.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     TRUST LINEAGE CHAIN (TLC)                           │
│               The "Chain of Custody" for Agent Actions                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   ELEMENT 1: GENESIS RECORD                                     │  │
│   │   ═════════════════════════                                     │  │
│   │                                                                 │  │
│   │   ┌─────────────────────────────────────────────────────────┐  │  │
│   │   │  authority_id: "org-integrum-global"                    │  │  │
│   │   │  authority_type: ORGANIZATION                           │  │  │
│   │   │  created_at: "2025-01-02T10:00:00Z"                     │  │  │
│   │   │  signature: "sha256:abc123..."                          │  │  │
│   │   └─────────────────────────────────────────────────────────┘  │  │
│   │                                                                 │  │
│   │   Answer: "WHO granted this agent the right to exist?"          │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   ELEMENT 2: CAPABILITY ATTESTATIONS                            │  │
│   │   ══════════════════════════════════                            │  │
│   │                                                                 │  │
│   │   ┌─────────────────────────────────────────────────────────┐  │  │
│   │   │  capabilities:                                          │  │  │
│   │   │    - capability: "read_financial_data"                  │  │  │
│   │   │      granted_by: "cfo@company.com"                      │  │  │
│   │   │      expires: "2025-12-31"                              │  │  │
│   │   │    - capability: "generate_reports"                     │  │  │
│   │   │      granted_by: "cfo@company.com"                      │  │  │
│   │   │      expires: "2025-12-31"                              │  │  │
│   │   └─────────────────────────────────────────────────────────┘  │  │
│   │                                                                 │  │
│   │   Answer: "WHAT is this agent allowed to do?"                   │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   ELEMENT 3: DELEGATION RECORDS                                 │  │
│   │   ═════════════════════════════                                 │  │
│   │                                                                 │  │
│   │   ┌─────────────────────────────────────────────────────────┐  │  │
│   │   │  delegations:                                           │  │  │
│   │   │    - from: "manager-agent-001"                          │  │  │
│   │   │      to: "worker-agent-042"                             │  │  │
│   │   │      task: "process-invoice-batch-7"                    │  │  │
│   │   │      delegated_capabilities: ["read_financial_data"]    │  │  │
│   │   │      root_source: "alice@company.com"  ◄── CRITICAL     │  │  │
│   │   └─────────────────────────────────────────────────────────┘  │  │
│   │                                                                 │  │
│   │   Answer: "WHO passed this authority and from WHERE?"           │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   ELEMENT 4: CONSTRAINT ENVELOPE                                │  │
│   │   ══════════════════════════════                                │  │
│   │                                                                 │  │
│   │   ┌─────────────────────────────────────────────────────────┐  │  │
│   │   │  constraints:                                           │  │  │
│   │   │    cost_limit: $1000                                    │  │  │
│   │   │    time_window: "09:00-17:00 EST"                       │  │  │
│   │   │    resource_scope: ["invoices/*", "reports/*"]          │  │  │
│   │   │    rate_limit: 100 requests/hour                        │  │  │
│   │   │    geographic_restriction: ["US", "CA"]                 │  │  │
│   │   └─────────────────────────────────────────────────────────┘  │  │
│   │                                                                 │  │
│   │   Answer: "WHAT limits apply to this agent?"                    │  │
│   │   Rule: Constraints can only TIGHTEN through delegation.        │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   ELEMENT 5: AUDIT ANCHORS                                      │  │
│   │   ════════════════════════                                      │  │
│   │                                                                 │  │
│   │   ┌─────────────────────────────────────────────────────────┐  │  │
│   │   │  audit_trail:                                           │  │  │
│   │   │    - action: "read_invoice_001"                         │  │  │
│   │   │      timestamp: "2025-01-02T10:30:00Z"                  │  │  │
│   │   │      result: SUCCESS                                    │  │  │
│   │   │      root_source: "alice@company.com"                   │  │  │
│   │   │      parent_anchor_id: "audit-prev-123"                 │  │  │
│   │   └─────────────────────────────────────────────────────────┘  │  │
│   │                                                                 │  │
│   │   Answer: "WHAT has this agent actually done?"                  │  │
│   │   Property: Immutable, append-only, linked chain.               │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Four Core Operations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      THE FOUR EATP OPERATIONS                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   1. ESTABLISH                                                  │  │
│   │   ════════════                                                  │  │
│   │                                                                 │  │
│   │   Purpose: Create initial trust for an agent                    │  │
│   │   When:    Agent first enters the system                        │  │
│   │   Who:     Authority (organization, department, human)          │  │
│   │                                                                 │  │
│   │   ┌─────────┐         ┌─────────┐                              │  │
│   │   │Authority│ ─────►  │  Agent  │                              │  │
│   │   │ (CFO)   │  trust  │ Invoice │                              │  │
│   │   └─────────┘         │Processor│                              │  │
│   │                       └─────────┘                              │  │
│   │                                                                 │  │
│   │   Output: Genesis Record + Initial Capability Attestations      │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   2. DELEGATE                                                   │  │
│   │   ═══════════                                                   │  │
│   │                                                                 │  │
│   │   Purpose: Transfer trust from one agent to another             │  │
│   │   When:    Manager assigns task to worker                       │  │
│   │   Rule:    Can only TIGHTEN constraints, never loosen           │  │
│   │                                                                 │  │
│   │   ┌─────────┐         ┌─────────┐         ┌─────────┐          │  │
│   │   │ Manager │ ─────►  │ Delegtn │ ─────►  │ Worker  │          │  │
│   │   │  Agent  │delegate │ Record  │         │  Agent  │          │  │
│   │   │ $10000  │         │         │         │ $1000   │          │  │
│   │   └─────────┘         └─────────┘         └─────────┘          │  │
│   │                           │                                     │  │
│   │                   root_source preserved!                        │  │
│   │                                                                 │  │
│   │   Output: Delegation Record with tightened constraints          │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   3. VERIFY                                                     │  │
│   │   ═════════                                                     │  │
│   │                                                                 │  │
│   │   Purpose: Check if agent can perform action                    │  │
│   │   When:    Before ANY agent action                              │  │
│   │   Levels:  QUICK (<1ms), STANDARD (<5ms), FULL (<50ms)          │  │
│   │                                                                 │  │
│   │   ┌─────────┐  "Can I read    ┌─────────┐                      │  │
│   │   │  Agent  │  invoice 001?"  │ VERIFY  │  ──► ✅ or ❌         │  │
│   │   │         │ ──────────────► │         │                      │  │
│   │   └─────────┘                 └─────────┘                      │  │
│   │                                                                 │  │
│   │   Checks: Capability, Constraints, Expiration, Revocation       │  │
│   │                                                                 │  │
│   │   Output: VerificationResult (valid/invalid + reason)           │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   4. AUDIT                                                      │  │
│   │   ════════                                                      │  │
│   │                                                                 │  │
│   │   Purpose: Record immutable trail of actions                    │  │
│   │   When:    After EVERY agent action                             │  │
│   │   Property: Append-only, linked, includes root_source           │  │
│   │                                                                 │  │
│   │   ┌─────────┐  "I just read   ┌─────────┐                      │  │
│   │   │  Agent  │  invoice 001"   │  AUDIT  │                      │  │
│   │   │         │ ──────────────► │         │                      │  │
│   │   └─────────┘                 └─────────┘                      │  │
│   │                                   │                             │  │
│   │                                   ▼                             │  │
│   │                            ┌───────────┐                        │  │
│   │                            │  Anchor   │                        │  │
│   │                            │  Chain    │                        │  │
│   │                            └───────────┘                        │  │
│   │                                                                 │  │
│   │   Output: AuditAnchor linked to previous anchors                │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   THE TRUST SANDWICH PATTERN                                           │
│   ══════════════════════════                                           │
│                                                                         │
│   Every agent action follows this pattern:                             │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                                                              │     │
│   │      ┌─────────┐                                             │     │
│   │      │ VERIFY  │  ◄── First: Can I do this?                  │     │
│   │      └────┬────┘                                             │     │
│   │           │                                                  │     │
│   │           ▼                                                  │     │
│   │      ┌─────────┐                                             │     │
│   │      │ EXECUTE │  ◄── Then: Do it                            │     │
│   │      └────┬────┘                                             │     │
│   │           │                                                  │     │
│   │           ▼                                                  │     │
│   │      ┌─────────┐                                             │     │
│   │      │  AUDIT  │  ◄── Finally: Record what happened          │     │
│   │      └─────────┘                                             │     │
│   │                                                              │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Taxonomy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EATP AGENT TAXONOMY                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                          ┌─────────────────┐                           │
│                          │  PSEUDO AGENT   │                           │
│                          │  (Human Facade) │                           │
│                          └────────┬────────┘                           │
│                                   │                                     │
│           ┌───────────────────────┼───────────────────────┐            │
│           │                       │                       │             │
│           ▼                       ▼                       ▼             │
│   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐    │
│   │ MANAGER AGENT │       │ MANAGER AGENT │       │ MANAGER AGENT │    │
│   │  (Orchestrate)│       │  (Orchestrate)│       │  (Orchestrate)│    │
│   └───────┬───────┘       └───────┬───────┘       └───────────────┘    │
│           │                       │                                     │
│     ┌─────┴─────┐           ┌─────┴─────┐                              │
│     │           │           │           │                               │
│     ▼           ▼           ▼           ▼                               │
│ ┌────────┐ ┌────────┐  ┌────────┐ ┌────────┐                           │
│ │SPECIAL-│ │SPECIAL-│  │SPECIAL-│ │SPECIAL-│                           │
│ │IST     │ │IST     │  │IST     │ │IST     │                           │
│ │(Execute│ │(Execute│  │(Execute│ │(Execute│                           │
│ └───┬────┘ └────────┘  └───┬────┘ └────────┘                           │
│     │                      │                                            │
│     ▼                      ▼                                            │
│ ┌────────┐            ┌────────┐                                       │
│ │  ESA   │            │  ESA   │                                       │
│ │(System │            │(System │                                       │
│ │ Bridge)│            │ Bridge)│                                       │
│ └────────┘            └────────┘                                       │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   PSEUDO AGENT                                                          │
│   ════════════                                                          │
│   • Represents a HUMAN in the agentic system                           │
│   • Always the root_source for all delegation chains                   │
│   • Bridges legacy auth (LDAP, SSO) to EATP                            │
│   • Cannot be delegated TO - only delegates FROM                       │
│                                                                         │
│   MANAGER AGENT                                                         │
│   ═════════════                                                         │
│   • Orchestrates other agents                                          │
│   • Can delegate to Specialists with tightened constraints             │
│   • Maintains aggregate responsibility for delegated work              │
│                                                                         │
│   SPECIALIST AGENT                                                      │
│   ════════════════                                                      │
│   • Executes specific domain tasks                                     │
│   • Cannot delegate (leaf node in hierarchy)                           │
│   • Interacts with systems via ESAs                                    │
│                                                                         │
│   ESA (Enterprise System Adapter)                                       │
│   ═══════════════════════════════                                       │
│   • Trusted wrapper around legacy systems                              │
│   • Enforces EATP constraints on system calls                          │
│   • Examples: DatabaseESA, APIESA, FileSystemESA                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The PKI Analogy

EATP is to enterprise agent governance what PKI is to internet trust.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THE PKI ANALOGY                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   PKI (Public Key Infrastructure)        EATP                          │
│   ═══════════════════════════════        ════                          │
│                                                                         │
│   ┌─────────────────────┐               ┌─────────────────────┐        │
│   │   Certificate       │               │   Trust Lineage     │        │
│   │   Authority (CA)    │      ═══►     │   Chain (TLC)       │        │
│   └─────────────────────┘               └─────────────────────┘        │
│   Issues certificates                    Issues trust chains           │
│                                                                         │
│   ┌─────────────────────┐               ┌─────────────────────┐        │
│   │   Root CA           │               │   Organization/     │        │
│   │                     │      ═══►     │   PseudoAgent       │        │
│   └─────────────────────┘               └─────────────────────┘        │
│   Ultimate trust anchor                  Ultimate trust anchor         │
│                                                                         │
│   ┌─────────────────────┐               ┌─────────────────────┐        │
│   │   Certificate       │               │   Genesis Record +  │        │
│   │   Chain             │      ═══►     │   Delegation Chain  │        │
│   └─────────────────────┘               └─────────────────────┘        │
│   Proves identity                        Proves authorization          │
│                                                                         │
│   ┌─────────────────────┐               ┌─────────────────────┐        │
│   │   Certificate       │               │   Trust Chain       │        │
│   │   Revocation List   │      ═══►     │   Revocation +      │        │
│   │   (CRL)             │               │   Cascade           │        │
│   └─────────────────────┘               └─────────────────────┘        │
│   Invalidates certificates               Invalidates all delegations   │
│                                                                         │
│   ┌─────────────────────┐               ┌─────────────────────┐        │
│   │   TLS Handshake     │               │   VERIFY Operation  │        │
│   │                     │      ═══►     │                     │        │
│   └─────────────────────┘               └─────────────────────┘        │
│   Validates before connect               Validates before action       │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   KEY INSIGHT:                                                          │
│   ────────────                                                          │
│   Just as PKI made e-commerce possible by establishing trust          │
│   between strangers on the internet, EATP makes enterprise AI          │
│   possible by establishing trust between humans and agents.            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Summary: The EATP Mental Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE EATP MENTAL MODEL                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   1. EVERY agent action traces to a HUMAN (root_source)                │
│                                                                         │
│   2. Trust flows DOWN the hierarchy, never UP                          │
│                                                                         │
│   3. Constraints can only TIGHTEN through delegation                   │
│                                                                         │
│   4. Every action is VERIFIED before and AUDITED after                 │
│                                                                         │
│   5. Revocation CASCADES through all delegations                       │
│                                                                         │
│   6. Legacy systems are wrapped with ESAs that enforce EATP            │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   "If you can't trace an agent's action to a human,             │  │
│   │    that action should not happen."                              │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
