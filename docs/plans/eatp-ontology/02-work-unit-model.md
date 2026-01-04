# EATP Ontology: Work Unit Model

## Document Control
- **Version**: 1.0
- **Date**: 2026-01-03
- **Status**: Proposed
- **Author**: Kaizen Studio Team

---

## Overview

The **Work Unit** is the foundational concept of the Kaizen Studio ontology. It replaces the current "Agent" vs "Pipeline" distinction with a unified recursive model that abstracts away implementation complexity.

---

## Definition

```
┌─────────────────────────────────────────────────────────────────────┐
│                       WORK UNIT (Definition)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   A Work Unit is anything that can:                                 │
│                                                                     │
│   1. ACCEPT a task (input parameters, context)                      │
│   2. PRODUCE a result (output data, status)                         │
│   3. BE DELEGATED TO (receive trust from another entity)            │
│                                                                     │
│   The term "work" emphasizes PURPOSE over IMPLEMENTATION.           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Work Unit Types

### By Composition (Internal Structure)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMPOSITION TYPES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │                                                               ││
│   │   ATOMIC Work Unit                                            ││
│   │   ─────────────────                                           ││
│   │                                                               ││
│   │   • Single capability                                         ││
│   │   • No sub-units                                              ││
│   │   • Direct execution                                          ││
│   │   • Cannot delegate (leaf node)                               ││
│   │                                                               ││
│   │   Current equivalent: "Agent"                                 ││
│   │   EATP equivalent: Specialist Agent                           ││
│   │                                                               ││
│   │   Example: "Document Summarizer", "Data Extractor"            ││
│   │                                                               ││
│   └───────────────────────────────────────────────────────────────┘│
│                                                                     │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │                                                               ││
│   │   COMPOSITE Work Unit                                         ││
│   │   ────────────────────                                        ││
│   │                                                               ││
│   │   • Orchestrates other work units                             ││
│   │   • Contains sub-units (atomic OR composite)                  ││
│   │   • RECURSIVE: can contain other composites                   ││
│   │   • Can delegate to sub-units                                 ││
│   │                                                               ││
│   │   Current equivalent: "Pipeline"                              ││
│   │   EATP equivalent: Manager Agent                              ││
│   │                                                               ││
│   │   Example: "Invoice Processor", "Onboarding Workflow"         ││
│   │                                                               ││
│   └───────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Recursive Structure

The key insight is that composition is **recursive**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RECURSIVE COMPOSITION                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Value Chain (Composite)                                           │
│   │                                                                 │
│   ├── Department Process (Composite)                                │
│   │   │                                                             │
│   │   ├── Team Workflow (Composite)                                 │
│   │   │   │                                                         │
│   │   │   ├── Task Agent (Atomic)                                   │
│   │   │   ├── Task Agent (Atomic)                                   │
│   │   │   └── Sub-Workflow (Composite)                              │
│   │   │       ├── Task Agent (Atomic)                               │
│   │   │       └── Task Agent (Atomic)                               │
│   │   │                                                             │
│   │   └── Task Agent (Atomic)                                       │
│   │                                                                 │
│   └── Another Process (Composite)                                   │
│       └── ...                                                       │
│                                                                     │
│   Key: Users don't need to see this structure.                      │
│   Each level presents as a simple "Work Unit" interface.            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## UI Representation

### Unified Card Design

Both atomic and composite work units share the same card design, with subtle differences:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WORK UNIT CARD                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  ┌──────────┐                                               │  │
│   │  │   Icon   │   Name of Work Unit                           │  │
│   │  │  (Type)  │   Brief description of what it does           │  │
│   │  └──────────┘                                               │  │
│   │                                                              │  │
│   │  ┌─────────────────────────────────────────────────────────┐│  │
│   │  │ Capabilities: analyze, summarize, extract               ││  │
│   │  └─────────────────────────────────────────────────────────┘│  │
│   │                                                              │  │
│   │  ┌────────────────┐  ┌────────────────┐                    │  │
│   │  │ Trust: ✓ Valid │  │ Uses: 5 units  │  ← Only for        │  │
│   │  └────────────────┘  └────────────────┘    Composite       │  │
│   │                                                              │  │
│   │  [Run]  [Configure]  [Delegate]                             │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   Visual Differences:                                               │
│   • Atomic: Single-layer icon, no "Uses: X units" badge            │
│   • Composite: Stacked icon, shows sub-unit count                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Icon Differentiation

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ICON DESIGN                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Atomic Work Unit:                                                 │
│   ┌─────┐                                                          │
│   │  ◉  │  Single solid icon                                       │
│   └─────┘  (Bot, Brain, FileText based on capability)              │
│                                                                     │
│   Composite Work Unit:                                              │
│   ┌─────┐                                                          │
│   │ ◉◉◉ │  Stacked/grouped icon                                    │
│   └─────┘  (Network, GitBranch, Workflow based on structure)       │
│                                                                     │
│   Note: These are SUBTLE hints, not prominent labels.              │
│   The user should focus on WHAT it does, not HOW.                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Work Unit Properties

### Common Properties (All Work Units)

| Property | Description | Example |
|----------|-------------|---------|
| `id` | Unique identifier | `wu-invoice-processor-001` |
| `name` | Human-readable name | "Invoice Processor" |
| `description` | What it does | "Processes and validates invoices" |
| `capabilities` | What it can do | `["read_invoice", "validate", "route"]` |
| `constraints` | Operating limits | `["cost_limit:$1000", "time:business_hours"]` |
| `trustStatus` | Current trust state | `VALID`, `EXPIRED`, `PENDING` |
| `createdBy` | Human owner | `alice@company.com` |
| `createdAt` | Creation timestamp | `2026-01-03T10:00:00Z` |

### Atomic-Specific Properties

| Property | Description | Example |
|----------|-------------|---------|
| `model` | LLM model used | `claude-3-opus` |
| `tools` | Available tools | `["search", "calculate"]` |
| `systemPrompt` | Core instructions | "You are a financial analyst..." |

### Composite-Specific Properties

| Property | Description | Example |
|----------|-------------|---------|
| `subUnits` | Contained work units | `["wu-extract", "wu-validate", "wu-route"]` |
| `flow` | Orchestration logic | DAG definition |
| `delegationRules` | How trust is passed | Per-subunit constraints |

---

## Trust Integration

### EATP Mapping

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EATP TRUST MAPPING                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Work Unit                        EATP Concept                     │
│   ─────────                        ────────────                     │
│                                                                     │
│   Atomic Work Unit        →        Specialist Agent                 │
│   • Has capabilities               • Has Capability Attestations    │
│   • Cannot delegate                • No DELEGATE authority          │
│   • Executes tasks                 • Leaf node in hierarchy         │
│                                                                     │
│   Composite Work Unit     →        Manager Agent                    │
│   • Has capabilities               • Has Capability Attestations    │
│   • CAN delegate                   • Has DELEGATE authority         │
│   • Orchestrates sub-units         • Creates Delegation Records     │
│                                                                     │
│   Creation Event          →        ESTABLISH Operation              │
│   • Creates work unit              • Creates Genesis Record         │
│   • Assigns capabilities           • Creates Capability Attestations│
│   • Sets constraints               • Creates Constraint Envelope    │
│                                                                     │
│   Run Event               →        VERIFY + Action + AUDIT          │
│   • Executes task                  • Validates trust chain          │
│   • Produces result                • Executes and records           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Delegation Flow

When a composite work unit runs, delegation happens automatically:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AUTOMATIC DELEGATION                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   User runs "Invoice Processor" (Composite)                         │
│                              │                                      │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │ Invoice Processor checks its own trust                       │ │
│   │ (VERIFY: "Can I process invoices?")                          │ │
│   └────────────────────────┬─────────────────────────────────────┘ │
│                            │                                        │
│                            ▼                                        │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │ Invoice Processor DELEGATES to sub-units:                    │ │
│   │ • Extractor gets: read_invoice (tightened: read_only)        │ │
│   │ • Validator gets: validate (tightened: no_write)             │ │
│   │ • Router gets: route (tightened: q4_invoices_only)           │ │
│   └────────────────────────┬─────────────────────────────────────┘ │
│                            │                                        │
│                            ▼                                        │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │ Each sub-unit executes with delegated trust                  │ │
│   │ (Constraints only TIGHTEN, never loosen)                     │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│   Key: User never sees this - just "Invoice Processor ran"         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Considerations

### Database Schema

```sql
-- Work Units table (unified)
CREATE TABLE work_units (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    composition_type VARCHAR(20) NOT NULL, -- 'atomic' or 'composite'
    capabilities JSONB,
    constraints JSONB,
    trust_status VARCHAR(20),
    created_by VARCHAR(255),
    created_at TIMESTAMP,
    organization_id UUID REFERENCES organizations(id)
);

-- Composite structure (for composite work units)
CREATE TABLE work_unit_composition (
    parent_id UUID REFERENCES work_units(id),
    child_id UUID REFERENCES work_units(id),
    position INTEGER,
    delegation_rules JSONB,
    PRIMARY KEY (parent_id, child_id)
);
```

### API Design

```yaml
# Work Units API (unified)
GET    /api/v1/work-units
GET    /api/v1/work-units/{id}
POST   /api/v1/work-units
PUT    /api/v1/work-units/{id}
DELETE /api/v1/work-units/{id}

# Filtered by type (optional)
GET    /api/v1/work-units?type=atomic
GET    /api/v1/work-units?type=composite

# Composition management (composite only)
GET    /api/v1/work-units/{id}/sub-units
POST   /api/v1/work-units/{id}/sub-units
DELETE /api/v1/work-units/{id}/sub-units/{subId}

# Execution
POST   /api/v1/work-units/{id}/run
GET    /api/v1/work-units/{id}/runs
GET    /api/v1/work-units/{id}/runs/{runId}
```

---

## Migration Path

### From Current "Agent" + "Pipeline" Model

1. **Rename "Agent" to "Work Unit"** (or keep both terms during transition)
2. **Rename "Pipeline" to "Process"** (user-friendly) or "Composite Work Unit" (technical)
3. **Unify the UI cards** with shared design language
4. **Add composition indicators** (subtle, not prominent)
5. **Update navigation** to use new terminology

### Backward Compatibility

- API endpoints can support both `/agents` and `/work-units` initially
- Type field distinguishes: `{ type: "agent" }` → `{ compositionType: "atomic" }`
- Existing pipelines become composite work units with no user action required

---

## Next Steps

1. Review three-level UX (03-user-experience-levels.md)
2. Define workspace model (04-workspaces.md)
3. Complete EATP mapping (05-eatp-mapping.md)
