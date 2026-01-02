# TODO-029: ABAC Condition Builder

**Status**: ACTIVE
**Priority**: HIGH
**Estimated Effort**: 10-12 days (5 phases)
**Phase**: 10 - Frontend Enhancement
**Pillar**: GOVERN

---

## Objective

Implement a guided ABAC Condition Builder that transforms the current text-based condition input into a structured, resource-aware interface with template-based quick-start, cascading dropdowns (Category -> Attribute -> Operator -> Value), real-time resource selection, and plain English preview.

**Problem Being Solved**: Users currently must know technical field names (e.g., `resource.agent_id`, `user.team_id`) without guidance. This feature provides discoverability, validation, and live resource selection.

---

## Acceptance Criteria

### Phase 1: Core Components
- [ ] ConditionsSection container with logic toggle (ALL/ANY)
- [ ] CategorySelect (WHO/WHAT/WHEN/WHERE)
- [ ] AttributeSelect (dynamic based on category)
- [ ] OperatorSelect (dynamic based on attribute type)
- [ ] Basic text ValueInput
- [ ] ConditionRow with add/remove functionality
- [ ] Unit tests for all components

### Phase 2: Resource Picker
- [ ] ResourcePicker component with search/autocomplete
- [ ] useResourceSearch hook with debounce (300ms)
- [ ] Backend `/api/v1/resources/search` endpoint
- [ ] Integration with Agent, Gateway, Team, Workspace resources
- [ ] Pagination with cursor-based loading
- [ ] Integration tests with real API

### Phase 3: Templates & Preview
- [ ] ConditionTemplates bar (4 quick templates)
- [ ] ConditionTemplatesModal (full template browser)
- [ ] Plain English translation system
- [ ] OverallPreview component
- [ ] useConditionTranslation hook
- [ ] Template selection workflow tests

### Phase 4: Advanced Inputs
- [ ] TeamPicker (multi-select with search)
- [ ] TimePicker with day/hour selection
- [ ] IpRangeInput with CIDR validation
- [ ] Type-specific validation messages
- [ ] Input validation hook
- [ ] E2E tests for each input type

### Phase 5: Reference Management
- [ ] ResourceReference type implementation
- [ ] Orphan detection on save
- [ ] Changed resource warnings
- [ ] Backend `/api/v1/policies/validate-conditions` endpoint
- [ ] Backend `/api/v1/policies/{id}/references` endpoint
- [ ] Reference validation integration tests

---

## Technical Approach

### File Structure
```
src/features/governance/components/conditions/
  ConditionsSection.tsx          # Main container
  ConditionTemplates.tsx         # Quick templates bar
  ConditionTemplatesModal.tsx    # Full template browser
  ConditionRow.tsx               # Single condition builder
  ConditionPreview.tsx           # Plain English for single condition
  OverallPreview.tsx             # Combined policy preview
  selects/
    CategorySelect.tsx           # WHO/WHAT/WHEN/WHERE
    AttributeSelect.tsx          # Dynamic based on category
    OperatorSelect.tsx           # Dynamic based on attribute
    index.ts
  inputs/
    ValueInput.tsx               # Router for value inputs
    ResourcePicker.tsx           # Searchable resource selector
    TeamPicker.tsx               # Multi-select team picker
    TimePicker.tsx               # Business hours picker
    IpRangeInput.tsx             # CIDR input with validation
    index.ts
  hooks/
    useConditionBuilder.ts       # State management
    useResourceSearch.ts         # Resource search with debounce
    useConditionTranslation.ts   # Plain English conversion
    useConditionValidation.ts    # Real-time validation
  data/
    categories.ts                # Category definitions
    attributes.ts                # Attribute schemas by category
    operators.ts                 # Operator definitions by type
    templates.ts                 # Pre-built templates
    translations.ts              # English translation templates
  types/
    condition.ts                 # Condition types
    resource-reference.ts        # ResourceReference types
    index.ts
  index.ts                       # Public exports
```

### Key Types
```typescript
interface ResourceReference {
  $ref: "resource";
  type: ResourceType;
  selector: {
    id?: string;
    ids?: string[];
    filter?: FilterSpec;
  };
  display?: {
    name: string;
    status: "valid" | "orphaned" | "changed";
    validatedAt: string;
  };
}

type ConditionCategory = "who" | "what" | "when" | "where";

interface ConditionAttribute {
  key: string;
  label: string;
  category: ConditionCategory;
  valueType: "text" | "resource" | "team" | "time" | "ip" | "select";
  resourceType?: ResourceType;
  operators: ConditionOperator[];
}
```

### API Endpoints (Backend)
```
GET /api/v1/resources/search?type={type}&query={term}&limit={n}&cursor={c}
POST /api/v1/policies/validate-conditions
GET /api/v1/policies/{id}/references
```

---

## Dependencies

- TODO-011: Advanced RBAC/ABAC (foundation - COMPLETED)
- TODO-017: Frontend Implementation (base components - COMPLETED)
- Existing governance types and API client
- Shadcn UI components (Select, Input, Dialog, Card, Badge)
- TanStack Query for data fetching

---

## Risk Assessment

- **HIGH**: Large resource lists causing performance issues
  - Mitigation: Server-side search, virtual scrolling, cursor pagination
- **HIGH**: Orphaned references when resources are deleted
  - Mitigation: Visual warnings, validation on save, reference tracking
- **MEDIUM**: Complex translation logic for nested conditions
  - Mitigation: Start with flat conditions, add nesting later
- **MEDIUM**: Backend API changes
  - Mitigation: Version resource search endpoint
- **LOW**: Template updates after initial release
  - Mitigation: External template configuration

---

## Subtasks

### Phase 1: Core Components (Days 1-3)

#### Day 1: Foundation
- [ ] Create `conditions/types/condition.ts` with enhanced types (Est: 1h)
- [ ] Create `conditions/data/categories.ts` with WHO/WHAT/WHEN/WHERE (Est: 1h)
- [ ] Create `conditions/data/attributes.ts` with attribute schemas (Est: 2h)
- [ ] Create `conditions/data/operators.ts` with operator definitions (Est: 1h)
- [ ] Create `conditions/hooks/useConditionBuilder.ts` state hook (Est: 2h)

#### Day 2: Select Components
- [ ] Implement `selects/CategorySelect.tsx` (Est: 1.5h)
- [ ] Implement `selects/AttributeSelect.tsx` with category filtering (Est: 2h)
- [ ] Implement `selects/OperatorSelect.tsx` with attribute filtering (Est: 1.5h)
- [ ] Create `inputs/ValueInput.tsx` router component (Est: 2h)

#### Day 3: Container & Row
- [ ] Implement `ConditionRow.tsx` with all select/input integration (Est: 3h)
- [ ] Implement `ConditionsSection.tsx` with logic toggle (Est: 2h)
- [ ] Write unit tests for all Phase 1 components (Est: 3h)
- [ ] Integrate with existing PolicyEditor.tsx (Est: 1h)

### Phase 2: Resource Picker (Days 4-5)

#### Day 4: Backend & Hook
- [ ] Implement backend `/api/v1/resources/search` endpoint (Est: 3h)
- [ ] Add search support to existing resource endpoints (Est: 2h)
- [ ] Create `hooks/useResourceSearch.ts` with debounce (Est: 2h)

#### Day 5: ResourcePicker Component
- [ ] Implement `inputs/ResourcePicker.tsx` with search UI (Est: 3h)
- [ ] Add virtual scrolling for large lists (Est: 2h)
- [ ] Write integration tests with real API (Est: 2h)
- [ ] Update ValueInput to route to ResourcePicker (Est: 1h)

### Phase 3: Templates & Preview (Days 6-7)

#### Day 6: Templates
- [ ] Create `data/templates.ts` with 12+ templates (Est: 2h)
- [ ] Implement `ConditionTemplates.tsx` quick bar (Est: 2h)
- [ ] Implement `ConditionTemplatesModal.tsx` full browser (Est: 2h)
- [ ] Add template selection logic to ConditionsSection (Est: 2h)

#### Day 7: Preview System
- [ ] Create `data/translations.ts` with translation patterns (Est: 2h)
- [ ] Implement `hooks/useConditionTranslation.ts` (Est: 2h)
- [ ] Implement `ConditionPreview.tsx` single condition (Est: 1.5h)
- [ ] Implement `OverallPreview.tsx` combined policy (Est: 1.5h)
- [ ] Write tests for translation accuracy (Est: 1h)

### Phase 4: Advanced Inputs (Days 8-9)

#### Day 8: Team & Time Pickers
- [ ] Implement `inputs/TeamPicker.tsx` multi-select (Est: 2.5h)
- [ ] Implement `inputs/TimePicker.tsx` with day checkboxes (Est: 2.5h)
- [ ] Update ValueInput routing for team/time attributes (Est: 1h)
- [ ] Write unit tests for pickers (Est: 2h)

#### Day 9: IP Input & Validation
- [ ] Implement `inputs/IpRangeInput.tsx` with CIDR validation (Est: 2h)
- [ ] Create `hooks/useConditionValidation.ts` (Est: 2h)
- [ ] Add real-time validation to all inputs (Est: 2h)
- [ ] Write E2E tests for input types (Est: 2h)

### Phase 5: Reference Management (Days 10-12)

#### Day 10: Backend Endpoints
- [ ] Implement `/api/v1/policies/validate-conditions` endpoint (Est: 3h)
- [ ] Implement `/api/v1/policies/{id}/references` endpoint (Est: 2h)
- [ ] Add resource_refs column to Policy model (Est: 1h)
- [ ] Write backend integration tests (Est: 2h)

#### Day 11: Frontend Integration
- [ ] Create `types/resource-reference.ts` (Est: 1h)
- [ ] Implement reference validation on save (Est: 2h)
- [ ] Add orphan detection warnings (Est: 2h)
- [ ] Add changed resource warnings (Est: 2h)
- [ ] Write integration tests (Est: 1h)

#### Day 12: Polish & Documentation
- [ ] Add loading states and error handling (Est: 2h)
- [ ] Add accessibility (aria labels, keyboard nav) (Est: 2h)
- [ ] Write E2E tests for complete workflows (Est: 2h)
- [ ] Update component documentation (Est: 1h)
- [ ] Final QA and bug fixes (Est: 1h)

---

## Testing Requirements

### Tier 1: Unit Tests
- [ ] CategorySelect renders all categories
- [ ] AttributeSelect filters by category
- [ ] OperatorSelect filters by attribute type
- [ ] ValueInput routes to correct component
- [ ] ResourcePicker displays search results
- [ ] TeamPicker handles multi-selection
- [ ] TimePicker generates correct time ranges
- [ ] IpRangeInput validates CIDR notation
- [ ] useConditionBuilder manages state correctly
- [ ] useConditionTranslation generates accurate English
- [ ] Template selection populates condition correctly

### Tier 2: Integration Tests
- [ ] Resource search returns correct results
- [ ] Condition builder integrates with PolicyEditor
- [ ] Reference validation detects orphans
- [ ] Template workflows complete successfully
- [ ] Condition persistence works end-to-end

### Tier 3: E2E Tests
- [ ] Create policy with team condition
- [ ] Create policy with specific agent selection
- [ ] Create policy with time restriction
- [ ] Create policy with IP range
- [ ] Handle orphaned resource warning
- [ ] Template selection workflow
- [ ] Edit existing policy conditions
- [ ] Complex multi-condition policy

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (3-tier strategy)
- [ ] PolicyEditor updated to use new ConditionsSection
- [ ] Templates cover common use cases
- [ ] Plain English preview accurate for all condition types
- [ ] Resource picker performant with 1000+ resources
- [ ] Reference validation prevents orphaned conditions
- [ ] Accessibility compliant (keyboard nav, screen readers)
- [ ] Mobile responsive (stacked layout on small screens)
- [ ] Code review completed
- [ ] No TypeScript errors

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to create simple policy | < 60 seconds |
| Time to create cross-resource policy | < 2 minutes |
| Documentation reference rate | < 10% of sessions |
| Condition validation errors | < 5% at save time |
| Template usage rate | > 50% of new policies |

---

## Related Documentation

- [10-abac-condition-builder.md](../../plans/frontend/10-abac-condition-builder.md) - Full plan document
- [06-enterprise-saas-product.md](../../docs/implement/06-enterprise-saas-product.md) - ABAC specification
- [TODO-011-advanced-rbac-abac.md](../completed/TODO-011-advanced-rbac-abac.md) - Foundation implementation
