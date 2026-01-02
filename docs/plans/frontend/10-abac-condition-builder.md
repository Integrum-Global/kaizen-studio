# ABAC Condition Builder - Dynamic Resource-Aware Policy Conditions

## Overview

This plan addresses the fundamental UX problem in the ABAC policy conditions interface: users must know technical field names and operators without guidance. The solution implements a **guided condition builder** with **real-time dynamic resource selection**.

## Problem Statement

### Current State
- Conditions require typing field names like `resource.agent_id`, `user.team_id`
- No discovery mechanism for available fields or valid values
- Dynamic resources (agents, gateways, deployments) cannot be selected from live data
- Users must reference documentation to create policies

### Root Cause
The current implementation treats conditions as static text fields rather than structured, typed data with references to live resources.

### Target State
- Template-based quick-start for common patterns
- Guided dropdowns for all condition components (category → attribute → operator → value)
- Real-time resource selection for dynamic entities
- Plain English preview of policy meaning
- Inline validation with actionable feedback

## Architecture

### Core Concept: ResourceReference

Instead of storing raw IDs, conditions store **ResourceReferences** that track:
- Resource type and ID
- Display name snapshot (for UI)
- Validation status (valid/orphaned/changed)
- Last validation timestamp

```typescript
interface ResourceReference {
  $ref: "resource";
  type: ResourceType;
  selector: {
    id?: string;           // For single resource
    ids?: string[];        // For multiple resources
    filter?: FilterSpec;   // For dynamic sets
  };
  display?: {
    name: string;          // Snapshot at selection time
    status: "valid" | "orphaned" | "changed";
    validatedAt: string;
  };
}
```

### Resource Taxonomy

| Resource Type | Selectable Attributes | Dynamic | Common Use |
|--------------|----------------------|---------|------------|
| **Agent** | id, name, type, status, workspace_id | Yes | "Only Team X can use Agent Y" |
| **Deployment** | id, status, agent_id, gateway_id, environment | Yes | "Who can manage this deployment" |
| **Gateway** | id, name, environment, status | Yes | "Deploy only to Gateway Z" |
| **Pipeline** | id, name, status, workspace_id | Yes | "Execute Pipeline X" |
| **External Agent** | id, name, provider, platform | Yes | "Access Copilot integration" |
| **User** | id, email, role, status | Yes | "Specific user access" |
| **Team** | id, name | Yes | "Team-based access" |
| **Workspace** | id, name, environment_type | Yes | "Workspace scoping" |
| **Environment** | production, staging, development | Static | "Environment gates" |

### Condition Categories

```
┌─────────────────────────────────────────────────────────────────┐
│  Category Selection                                             │
├─────────────────────────────────────────────────────────────────┤
│  👤 WHO (Principal)     │ User email, team, role                │
│  📦 WHAT (Resource)     │ Agent, gateway, deployment, workspace │
│  🕐 WHEN (Time)         │ Hours, days, date ranges              │
│  🌐 WHERE (Context)     │ IP address, location                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. ConditionsSection (Container)

```
┌─────────────────────────────────────────────────────────────────┐
│  Conditions                                         [? Help]    │
├─────────────────────────────────────────────────────────────────┤
│  Quick Templates                              [See all →]       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 👥 Team  │ │ 🕐 Hours │ │ 🛡️ IP    │ │ 📦 Agent │          │
│  │ Access   │ │ Only     │ │ Restrict │ │ Specific │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├─────────────────────────────────────────────────────────────────┤
│  Active Conditions                                              │
│                                                                 │
│  [Condition rows here]                                          │
│                                                                 │
│  [+ Add condition]                                              │
│                                                                 │
│  When multiple: (●) ALL must match  ( ) ANY can match          │
├─────────────────────────────────────────────────────────────────┤
│  📋 What this means:                                            │
│  "Only users in the HR team can access the HR Assistant agent, │
│   during business hours (9 AM - 5 PM, Mon-Fri)"                │
└─────────────────────────────────────────────────────────────────┘
```

### 2. ConditionRow (Single Condition)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Category ▼] [Attribute ▼] [Operator ▼] [Value Input]    [×]  │
│                                                                 │
│  ✓ "User must be in the HR team"                               │
└─────────────────────────────────────────────────────────────────┘
```

### 3. ResourcePicker (Dynamic Selection)

For resource-type values, renders a searchable picker:

```
┌─────────────────────────────────────────────────────────────────┐
│  Select Agent                                              [×]  │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Search agents...                                           │
├─────────────────────────────────────────────────────────────────┤
│  ☑ HR Assistant          agent-123    Active                   │
│  ☐ Sales Bot             agent-456    Active                   │
│  ☐ Support Agent         agent-789    Draft                    │
│  ☐ Finance Analyzer      agent-abc    Active                   │
│                                                                 │
│  Showing 4 of 12 agents  [Load more]                           │
└─────────────────────────────────────────────────────────────────┘
```

### 4. ValueInput (Type-Aware)

Different input types based on attribute:

| Attribute Type | Input Component |
|---------------|-----------------|
| Resource ID | ResourcePicker (searchable) |
| Team | TeamPicker (multi-select) |
| Role | RoleSelect (dropdown) |
| Email | TextInput with validation |
| Email Domain | TextInput with @ prefix |
| Time | TimePicker with day checkboxes |
| IP Range | CIDR input with validation |
| Environment | EnvironmentSelect (fixed options) |
| Status | StatusSelect (fixed options) |

## API Requirements

### New Endpoints

```
GET /api/v1/resources/search
  ?type={resourceType}
  &query={searchTerm}
  &limit={number}
  &cursor={string}
  &filter[status]={value}

Response: {
  items: Resource[],
  cursor: string | null,
  total: number
}
```

```
POST /api/v1/policies/validate-conditions
  Body: { conditions: PolicyCondition[] }

Response: {
  valid: boolean,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  resolvedReferences: ResourceReference[]
}
```

```
GET /api/v1/policies/{id}/references
Response: {
  references: ResourceReference[],
  orphaned: ResourceReference[],
  changed: ResourceReference[]
}
```

### Enhanced Existing Endpoints

All resource list endpoints (`/agents`, `/gateways`, `/deployments`, `/teams`) must support:
- `search` query parameter for full-text search
- `limit` and `cursor` for pagination
- Consistent response format: `{ items, cursor, total }`

## Data Model Changes

### PolicyCondition (Enhanced)

```typescript
interface PolicyCondition {
  id: string;
  attribute: string;
  operator: ConditionOperator;
  value: ConditionValue;
}

type ConditionValue =
  | string
  | number
  | boolean
  | string[]
  | ResourceReference;
```

### Policy Model (Backend Enhancement)

```python
@db.model
class Policy:
    # ... existing fields ...

    # NEW: Track resource references for orphan detection
    resource_refs: str  # JSON array: ["agent:id1", "gateway:id2"]
    refs_validated_at: str | None
    refs_valid: bool  # Default True
```

## File Structure

```
src/features/governance/components/conditions/
├── ConditionsSection.tsx          # Main container
├── ConditionTemplates.tsx         # Quick templates bar
├── ConditionTemplatesModal.tsx    # Full template browser
├── ConditionRow.tsx               # Single condition builder
├── ConditionPreview.tsx           # Plain English for single condition
├── OverallPreview.tsx             # Combined policy preview
├── selects/
│   ├── CategorySelect.tsx         # WHO/WHAT/WHEN/WHERE
│   ├── AttributeSelect.tsx        # Dynamic based on category
│   ├── OperatorSelect.tsx         # Dynamic based on attribute
│   └── index.ts
├── inputs/
│   ├── ValueInput.tsx             # Router for value inputs
│   ├── ResourcePicker.tsx         # Searchable resource selector
│   ├── TeamPicker.tsx             # Multi-select team picker
│   ├── TimePicker.tsx             # Business hours picker
│   ├── IpRangeInput.tsx           # CIDR input with validation
│   └── index.ts
├── hooks/
│   ├── useConditionBuilder.ts     # State management
│   ├── useResourceSearch.ts       # Resource search with debounce
│   ├── useConditionTranslation.ts # Plain English conversion
│   └── useConditionValidation.ts  # Real-time validation
├── data/
│   ├── categories.ts              # Category definitions
│   ├── attributes.ts              # Attribute schemas by category
│   ├── operators.ts               # Operator definitions by type
│   ├── templates.ts               # Pre-built templates
│   └── translations.ts            # English translation templates
├── types/
│   ├── condition.ts               # Condition types
│   ├── resource-reference.ts      # ResourceReference types
│   └── index.ts
└── index.ts                       # Public exports
```

## Templates

### Quick Templates (Always Visible)

| Template | Category | Pre-filled Condition |
|----------|----------|---------------------|
| **Team Access** | WHO | `user.team_id` in [select teams] |
| **Business Hours** | WHEN | `time.hour` between 9-17, Mon-Fri |
| **IP Restriction** | WHERE | `context.ip` in range [enter CIDR] |
| **Specific Agent** | WHAT | `resource.id` equals [select agent] |

### Extended Templates (Modal)

**Access Control:**
- Admin Only (`user.role` equals `org_admin` or `org_owner`)
- Company Email (`user.email` ends with `@company.com`)
- Specific Users (`user.id` in [select users])

**Resource Scoping:**
- Workspace Access (`resource.workspace_id` equals [select workspace])
- Production Only (`resource.environment` equals `production`)
- Active Resources (`resource.status` equals `active`)

**Time Restrictions:**
- Weekdays Only (`time.day_of_week` in [0,1,2,3,4])
- After Hours (`time.hour` not between 9-17)
- Date Range (`time.date` between [start]-[end])

**Security:**
- VPN Required (`context.ip` in [VPN ranges])
- Geo Restriction (`context.country` in [allowed countries])

## Validation Rules

### Real-Time Validation

| Rule | Trigger | Message |
|------|---------|---------|
| Required value | Empty value field | "Please select a value" |
| Invalid email | Email attribute | "Enter a valid email address" |
| Invalid CIDR | IP range attribute | "Enter valid CIDR notation (e.g., 192.168.1.0/24)" |
| Invalid time range | End < Start | "End time must be after start time" |
| Orphaned reference | Resource deleted | "⚠️ Referenced resource no longer exists" |

### Save-Time Validation

| Rule | Check | Response |
|------|-------|----------|
| All references valid | Query resource APIs | Block save if orphaned |
| No conflicting policies | Query existing policies | Warning if potential conflict |
| Proper logic | Validate all/any structure | Error if malformed |

## Implementation Phases

### Phase 1: Core Components
- ConditionsSection container
- CategorySelect, AttributeSelect, OperatorSelect
- Basic text ValueInput
- ConditionRow with add/remove
- Logic toggle (ALL/ANY)

### Phase 2: Resource Picker
- ResourcePicker component with search
- useResourceSearch hook with debounce
- Backend `/api/v1/resources/search` endpoint
- Integration with Agent, Gateway, Team resources

### Phase 3: Templates & Preview
- ConditionTemplates bar
- ConditionTemplatesModal
- Plain English translation system
- OverallPreview component

### Phase 4: Advanced Inputs
- TeamPicker (multi-select)
- TimePicker with day selection
- IpRangeInput with CIDR validation
- Type-specific validation

### Phase 5: Reference Management
- ResourceReference tracking in backend
- Orphan detection
- Changed resource warnings
- Reference validation endpoint

## Testing Strategy

### Unit Tests
- Condition parsing and serialization
- Operator evaluation
- Translation to plain English
- Validation rules

### Integration Tests
- Resource search API
- Policy validation endpoint
- Condition builder state management
- ResourcePicker data fetching

### E2E Tests
- Create policy with team condition
- Create policy with specific agent
- Create policy with time restriction
- Handle orphaned resource warning
- Template selection workflow

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to create simple policy | < 60 seconds |
| Time to create cross-resource policy | < 2 minutes |
| Documentation reference rate | < 10% of sessions |
| Condition validation errors | < 5% at save time |
| Template usage rate | > 50% of new policies |

## Dependencies

- Shadcn UI components (Select, Input, Card, Alert, Badge, Dialog)
- TanStack Query for data fetching
- Existing governance API client
- Backend DataFlow models for resources

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large resource lists | Performance | Server-side search, virtual scrolling |
| Orphaned references | UX confusion | Visual warnings, validation on save |
| Complex nested conditions | UX complexity | Start with flat conditions, add nesting later |
| Backend API changes | Breaking changes | Version resource search endpoint |
