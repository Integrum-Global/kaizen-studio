# Implementation Matrix: Kailash-Kaizen SDK vs Kaizen Studio

This document precisely defines what must be implemented in the SDK (core infrastructure) versus what can be implemented in Studio (reference UI).

---

## Decision Framework

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ALLOCATION DECISION FRAMEWORK                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Question                              Answer → Where                  │
│   ════════                              ═══════════════                 │
│                                                                         │
│   Is it security-critical?              Yes → SDK                       │
│   Is it protocol-level?                 Yes → SDK                       │
│   Must it be reusable across UIs?       Yes → SDK                       │
│   Is it data structure/storage?         Yes → SDK                       │
│   Is it cryptographic?                  Yes → SDK                       │
│                                                                         │
│   Is it visualization/presentation?     Yes → Studio                    │
│   Is it UI workflow/wizard?             Yes → Studio                    │
│   Is it client-specific customization?  Yes → Studio                    │
│   Is it dashboard/reporting?            Yes → Studio                    │
│                                                                         │
│   Can it be a Studio-only feature?      Yes → Studio (with SDK hooks)   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Implementation Matrix

### Category: Core Data Structures

| Component | SDK | Studio | Rationale |
|-----------|:---:|:------:|-----------|
| `HumanOrigin` dataclass | ✅ | - | Security-critical, protocol-level |
| `ExecutionContext` dataclass | ✅ | - | Protocol-level, passed through all operations |
| Enhanced `DelegationRecord` | ✅ | - | Storage schema, security-critical |
| Enhanced `AuditAnchor` | ✅ | - | Storage schema, immutable audit |
| Context variable propagation | ✅ | - | Infrastructure, async-safe |

### Category: PseudoAgent

| Component | SDK | Studio | Rationale |
|-----------|:---:|:------:|-----------|
| `PseudoAgent` class | ✅ | - | Security-critical bridge |
| `PseudoAgentFactory` | ✅ | - | Token validation, security |
| `AuthAdapter` interface | ✅ | - | Reusable across UIs |
| `OktaAdapter` implementation | ✅ | - | Reusable auth integration |
| `AzureADAdapter` implementation | ✅ | - | Reusable auth integration |
| Login UI | - | ✅ | Presentation layer |
| SSO redirect handling | - | ✅ | UI workflow |

### Category: Trust Operations

| Component | SDK | Studio | Rationale |
|-----------|:---:|:------:|-----------|
| `delegate()` with context | ✅ | - | Protocol-level, security |
| `audit()` with human_origin | ✅ | - | Immutable audit trail |
| `verify()` with SLA metrics | ✅ | - | Performance infrastructure |
| `revoke_cascade()` | ✅ | - | Security-critical |
| `revoke_by_human()` | ✅ | - | Security-critical |
| Constraint tightening validation | ✅ | - | Security enforcement |

### Category: Visualization

| Component | SDK | Studio | Rationale |
|-----------|:---:|:------:|-----------|
| Trust chain data API | ✅ | - | Data access |
| Trust chain visualization | - | ✅ | Presentation |
| Delegation tree view | - | ✅ | Presentation |
| Constraint diff view | - | ✅ | Presentation |
| Audit trail viewer | - | ✅ | Presentation |

### Category: Management UI

| Component | SDK | Studio | Rationale |
|-----------|:---:|:------:|-----------|
| Delegation CRUD API | ✅ | - | Data operations |
| Delegation wizard UI | - | ✅ | UI workflow |
| Agent marketplace UI | - | ✅ | Presentation |
| Active delegations dashboard | - | ✅ | Dashboard |
| Revocation confirmation UI | - | ✅ | UI workflow |

### Category: Compliance & Audit

| Component | SDK | Studio | Rationale |
|-----------|:---:|:------:|-----------|
| Audit anchor storage | ✅ | - | Infrastructure |
| Audit search API | ✅ | - | Data access |
| Audit search UI | - | ✅ | Presentation |
| Human origin trace view | - | ✅ | Presentation |
| Compliance report export | - | ✅ | Reporting |

### Category: Administration

| Component | SDK | Studio | Rationale |
|-----------|:---:|:------:|-----------|
| SLA metrics collection | ✅ | - | Infrastructure |
| SLA metrics API | ✅ | - | Data access |
| SLA dashboard | - | ✅ | Dashboard |
| User revocation API | ✅ | - | Security-critical |
| User revocation UI | - | ✅ | UI workflow |
| Webhook handlers | ✅ | - | Integration infrastructure |

---

## Detailed SDK Implementation Plan

### File-by-File Changes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SDK CHANGES BY FILE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   NEW FILES:                                                            │
│   ══════════                                                            │
│                                                                         │
│   src/kaizen/trust/execution_context.py (~80 lines)                    │
│   ├── HumanOrigin dataclass                                            │
│   ├── ExecutionContext dataclass                                       │
│   ├── get_current_context() function                                   │
│   ├── set_current_context() function                                   │
│   └── execution_context context manager                                │
│                                                                         │
│   src/kaizen/trust/pseudo_agent.py (~200 lines)                        │
│   ├── PseudoAgent class                                                │
│   ├── PseudoAgentFactory class                                         │
│   ├── AuthAdapter abstract base                                        │
│   └── Standard adapters (Okta, AzureAD)                                │
│                                                                         │
│   src/kaizen/trust/constraint_validator.py (~150 lines)                │
│   ├── ConstraintValidator class                                        │
│   ├── ConstraintViolation enum                                         │
│   └── ValidationResult dataclass                                       │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────    │
│                                                                         │
│   MODIFIED FILES:                                                       │
│   ════════════════                                                      │
│                                                                         │
│   src/kaizen/trust/chain.py (+50 lines)                                │
│   ├── Add human_origin field to DelegationRecord                       │
│   ├── Add delegation_chain field to DelegationRecord                   │
│   ├── Add delegation_depth field to DelegationRecord                   │
│   ├── Add human_origin field to AuditAnchor                            │
│   └── Update to_dict/from_dict methods                                 │
│                                                                         │
│   src/kaizen/trust/operations.py (+150 lines)                          │
│   ├── Update delegate() to accept/propagate context                    │
│   ├── Update audit() to include human_origin                           │
│   ├── Add revoke_cascade() method                                      │
│   ├── Add revoke_by_human() method                                     │
│   ├── Add SLA metrics collection                                       │
│   └── Integrate ConstraintValidator                                    │
│                                                                         │
│   src/kaizen/trust/trusted_agent.py (+30 lines)                        │
│   ├── Update execute_async() to accept context                         │
│   └── Update delegate_to_worker() to propagate context                 │
│                                                                         │
│   src/kaizen/trust/__init__.py (+10 lines)                             │
│   └── Export new classes                                               │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────    │
│                                                                         │
│   SUMMARY:                                                              │
│   ════════                                                              │
│   New files:      3 (~430 lines)                                       │
│   Modified files: 4 (~240 lines)                                       │
│   Total:          ~670 lines of changes                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Studio Implementation Plan

### Component-by-Component

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STUDIO COMPONENTS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   PAGES:                                                                │
│   ══════                                                                │
│                                                                         │
│   /login                                                                │
│   └── SSO login redirect                                               │
│                                                                         │
│   /dashboard                                                            │
│   └── Overview of active delegations, recent activity                  │
│                                                                         │
│   /delegations                                                          │
│   ├── List view of my delegations                                      │
│   ├── Create delegation wizard                                         │
│   ├── Delegation detail view                                           │
│   └── Revocation confirmation modal                                    │
│                                                                         │
│   /agents                                                               │
│   ├── Agent marketplace/catalog                                        │
│   └── Agent detail view with capabilities                              │
│                                                                         │
│   /audit                                                                │
│   ├── Audit trail search                                               │
│   ├── Audit anchor detail                                              │
│   └── Trust chain visualization                                        │
│                                                                         │
│   /admin (admin only)                                                   │
│   ├── User revocation                                                  │
│   ├── SLA metrics dashboard                                            │
│   └── System health                                                    │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────    │
│                                                                         │
│   COMPONENTS:                                                           │
│   ═══════════                                                           │
│                                                                         │
│   TrustChainVisualization                                              │
│   ├── Visual tree of delegation chain                                  │
│   ├── Human origin badge                                               │
│   └── Constraint display at each level                                 │
│                                                                         │
│   DelegationWizard                                                      │
│   ├── Step 1: Select agent                                             │
│   ├── Step 2: Choose capabilities                                      │
│   ├── Step 3: Set constraints                                          │
│   └── Step 4: Confirm and create                                       │
│                                                                         │
│   ConstraintEditor                                                      │
│   ├── Cost limit input                                                 │
│   ├── Time window picker                                               │
│   ├── Resource scope input                                             │
│   └── Expiration date picker                                           │
│                                                                         │
│   AuditTrailSearch                                                      │
│   ├── Search by resource, agent, date                                  │
│   ├── Results table                                                    │
│   └── Drill-down to chain view                                         │
│                                                                         │
│   HumanOriginBadge                                                      │
│   ├── Shows human who authorized                                       │
│   ├── Auth provider icon                                               │
│   └── Link to full chain                                               │
│                                                                         │
│   CascadeRevocationModal                                                │
│   ├── Impact preview (agents to be revoked)                            │
│   ├── Confirmation checkbox                                            │
│   └── Progress indicator                                               │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────    │
│                                                                         │
│   API ROUTES:                                                           │
│   ═══════════                                                           │
│                                                                         │
│   /api/auth/*           → Authentication endpoints                     │
│   /api/delegations/*    → Delegation CRUD                              │
│   /api/agents/*         → Agent catalog                                │
│   /api/audit/*          → Audit search                                 │
│   /api/admin/*          → Admin operations                             │
│   /api/webhooks/*       → External integrations                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Priorities

### Priority 0 (Critical Path)

These must be done first - they are prerequisites for everything else.

| Component | Location | Depends On | Blocks |
|-----------|----------|------------|--------|
| `HumanOrigin` | SDK | Nothing | Everything |
| `ExecutionContext` | SDK | HumanOrigin | All operations |
| `PseudoAgent` | SDK | HumanOrigin, ExecutionContext | Authentication |
| Enhanced `DelegationRecord` | SDK | HumanOrigin | All delegations |
| Enhanced `delegate()` | SDK | All above | All delegation flows |

### Priority 1 (High Value)

| Component | Location | Depends On | Blocks |
|-----------|----------|------------|--------|
| Enhanced `AuditAnchor` | SDK | HumanOrigin | Audit trail |
| Enhanced `audit()` | SDK | AuditAnchor | Audit trail |
| `revoke_cascade()` | SDK | DelegationRecord | Security |
| `revoke_by_human()` | SDK | revoke_cascade | HR integration |
| Login flow | Studio | PseudoAgent | All UI |
| Delegation wizard | Studio | delegate() | Business users |

### Priority 2 (Medium Value)

| Component | Location | Depends On | Blocks |
|-----------|----------|------------|--------|
| `ConstraintValidator` | SDK | Nothing | Enhanced safety |
| SLA metrics | SDK | verify() | Ops visibility |
| Trust chain visualization | Studio | DelegationRecord | Compliance |
| Audit trail viewer | Studio | AuditAnchor | Compliance |
| Active delegations dashboard | Studio | Delegation API | Users |

### Priority 3 (Enhancements)

| Component | Location | Depends On | Blocks |
|-----------|----------|------------|--------|
| Agent marketplace | Studio | Agent registry | Discovery |
| Compliance reports | Studio | Audit API | Reporting |
| SLA dashboard | Studio | SLA metrics | Ops |
| Webhook handlers | Studio | revoke_by_human | Automation |

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION DEPENDENCY GRAPH                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                          ┌─────────────────┐                           │
│                          │   HumanOrigin   │                           │
│                          │   (SDK)         │                           │
│                          └────────┬────────┘                           │
│                                   │                                     │
│                    ┌──────────────┼──────────────┐                     │
│                    │              │              │                      │
│                    ▼              ▼              ▼                      │
│           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│           │ Execution    │ │ Delegation   │ │ Audit        │           │
│           │ Context      │ │ Record       │ │ Anchor       │           │
│           │ (SDK)        │ │ (SDK)        │ │ (SDK)        │           │
│           └──────┬───────┘ └──────┬───────┘ └──────┬───────┘           │
│                  │                │                │                    │
│                  ▼                │                ▼                    │
│           ┌──────────────┐        │         ┌──────────────┐           │
│           │ PseudoAgent  │        │         │ audit()      │           │
│           │ (SDK)        │        │         │ (SDK)        │           │
│           └──────┬───────┘        │         └──────┬───────┘           │
│                  │                │                │                    │
│           ┌──────┴───────┐        ▼                ▼                    │
│           │              │ ┌──────────────┐ ┌──────────────┐           │
│           ▼              │ │ delegate()   │ │ Audit Trail  │           │
│    ┌──────────────┐      │ │ (SDK)        │ │ Viewer       │           │
│    │ Login Flow   │      │ └──────┬───────┘ │ (Studio)     │           │
│    │ (Studio)     │      │        │         └──────────────┘           │
│    └──────┬───────┘      │        │                                    │
│           │              │        ▼                                     │
│           │              │ ┌──────────────┐                            │
│           │              │ │ revoke_      │                            │
│           │              │ │ cascade()   │                            │
│           │              │ │ (SDK)        │                            │
│           │              │ └──────┬───────┘                            │
│           │              │        │                                     │
│           ▼              ▼        ▼                                     │
│    ┌─────────────────────────────────────────────────────────┐         │
│    │                    STUDIO UI                            │         │
│    │  ┌────────────┐ ┌────────────┐ ┌────────────┐          │         │
│    │  │ Delegation │ │ Trust Chain│ │ Revocation │          │         │
│    │  │ Wizard     │ │ Viewer     │ │ Dashboard  │          │         │
│    │  └────────────┘ └────────────┘ └────────────┘          │         │
│    └─────────────────────────────────────────────────────────┘         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Strategy

### SDK Tests (Required)

```python
# Unit tests for HumanOrigin
def test_human_origin_immutable():
    """HumanOrigin should be frozen dataclass."""

def test_human_origin_serialization():
    """HumanOrigin should round-trip to/from dict."""

# Unit tests for ExecutionContext
def test_context_with_delegation_preserves_origin():
    """Delegation should not modify human_origin."""

def test_context_with_delegation_extends_chain():
    """Delegation should extend delegation_chain."""

# Integration tests for delegate()
async def test_delegate_requires_context():
    """delegate() should fail without ExecutionContext."""

async def test_delegate_propagates_human_origin():
    """DelegationRecord should have human_origin from context."""

# Integration tests for cascade revocation
async def test_revoke_cascade_revokes_all():
    """All downstream agents should be revoked."""

async def test_revoke_by_human_revokes_all_delegations():
    """All delegations from human should be revoked."""

# Integration tests for constraint validation
def test_constraint_validator_detects_loosening():
    """Loosened constraints should fail validation."""

def test_constraint_validator_allows_tightening():
    """Tightened constraints should pass validation."""
```

### Studio Tests (Required)

```javascript
// E2E tests for login flow
test('login creates pseudo agent', async () => {
  // Verify SSO redirect, callback, session creation
});

// E2E tests for delegation
test('delegation wizard creates valid delegation', async () => {
  // Walk through wizard, verify delegation created
});

test('revocation shows cascade impact', async () => {
  // Verify impact preview before confirm
});

// Component tests
test('TrustChainVisualization shows human origin', () => {
  // Verify human badge is displayed
});

test('HumanOriginBadge displays auth provider', () => {
  // Verify correct icon and info
});
```

---

## Migration Plan

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MIGRATION PLAN                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   PHASE 1: SDK Changes (No Breaking Changes)                           │
│   ══════════════════════════════════════════                            │
│   • Add new optional fields to DelegationRecord                        │
│   • Add new optional fields to AuditAnchor                             │
│   • Add new methods (revoke_cascade, revoke_by_human)                  │
│   • Add new files (execution_context, pseudo_agent, validator)         │
│   • Update existing methods to accept optional context                 │
│                                                                         │
│   Result: Existing code continues to work, new features available.     │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────    │
│                                                                         │
│   PHASE 2: Studio Integration                                           │
│   ═══════════════════════════                                           │
│   • Implement login flow with PseudoAgentFactory                       │
│   • Update delegation API to create ExecutionContext                   │
│   • Implement new UI components                                        │
│   • Add new pages                                                      │
│                                                                         │
│   Result: Studio uses new EATP features. Old data still accessible.   │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────    │
│                                                                         │
│   PHASE 3: Gradual Migration                                            │
│   ══════════════════════════                                            │
│   • New delegations always have human_origin                           │
│   • Old delegations shown with "Legacy" badge                          │
│   • Optional: Backfill script to add human_origin to old records      │
│                                                                         │
│   Result: Full EATP compliance for new operations.                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
