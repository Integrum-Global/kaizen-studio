# TODO-009: Environments & Workspaces

**Status**: PENDING
**Priority**: MEDIUM
**Estimated Effort**: 5 days (Week 9)
**Phase**: 3 - Enterprise Governance
**Pillar**: DEPLOY, GOVERN

---

## Objective

Implement environment management (dev/staging/prod) with workspace isolation, promotion workflows, and approval processes.

---

## Acceptance Criteria

### Backend
- [ ] Workspace model enhanced for environments
- [ ] Environment-specific configuration
- [ ] Promotion workflow engine
- [ ] Promotion approval process
- [ ] Environment isolation validation

### Frontend
- [ ] Workspace selector (environment switcher)
- [ ] Workspace settings page
- [ ] Promotion wizard
- [ ] Approval queue for pending promotions

---

## Technical Approach

### Enhanced Workspace Model
```python
@db.model
class Workspace:
    id: str
    organization_id: str
    name: str
    environment_type: str  # development, staging, production, sandbox
    description: str
    gateway_id: Optional[str]

    # Limits
    max_agents: int
    max_concurrent_executions: int

    # Promotion config
    promotion_from: Optional[str]  # workspace_id
    requires_approval: bool
    required_approvers: dict  # ["tech_lead", "admin"]

    # Data policies
    pii_allowed: bool
    encryption_required: bool
    retention_days: int

@db.model
class PromotionRequest:
    id: str
    organization_id: str
    source_workspace_id: str
    target_workspace_id: str
    agent_id: Optional[str]
    orchestration_id: Optional[str]
    version: str
    requested_by: str
    requested_at: str
    status: str  # pending, approved, rejected, completed
    approvals: dict  # {"user-1": "approved", "user-2": "pending"}
    completed_at: Optional[str]
    completed_by: Optional[str]
```

### Promotion Flow
```
Development -> Staging -> Production

Checks at each stage:
1. All tests pass
2. Security scan passed
3. Performance benchmarks met
4. Required approvals obtained
5. Audit trail created
```

---

## Dependencies

- TODO-008: Deployment (deployment infrastructure)

---

## Risk Assessment

- **MEDIUM**: Promotion rollback complexity - Mitigation: Keep version history, quick rollback button
- **MEDIUM**: Approval workflow delays - Mitigation: Email notifications, deadline reminders
- **LOW**: Environment drift - Mitigation: Strict promotion-only policy

---

## Subtasks

### Day 1: Workspace Enhancement
- [ ] Enhance Workspace model with environment fields (Est: 2h)
- [ ] Create workspace CRUD with environment types (Est: 3h)
- [ ] Implement environment isolation validation (Est: 3h)

### Day 2: Promotion Model
- [ ] Implement PromotionRequest model (Est: 2h)
- [ ] Create promotion request endpoints (Est: 3h)
- [ ] Add approval tracking logic (Est: 3h)

### Day 3: Promotion Engine
- [ ] Implement promotion workflow engine (Est: 4h)
- [ ] Add pre-promotion checks (tests, security) (Est: 2h)
- [ ] Implement promotion execution (Est: 2h)

### Day 4: Approval Process
- [ ] Create approval endpoints (Est: 2h)
- [ ] Implement multi-approver logic (Est: 2h)
- [ ] Add email notifications (Est: 2h)
- [ ] Implement approval timeout (Est: 2h)

### Day 5: Frontend
- [ ] Build workspace selector component (Est: 2h)
- [ ] Create workspace settings page (Est: 2h)
- [ ] Build promotion wizard (Est: 3h)
- [ ] Create approval queue UI (Est: 1h)

---

## Testing Requirements

### Tier 1: Unit Tests
- [ ] Workspace validation logic
- [ ] Promotion eligibility checks
- [ ] Approval counting logic
- [ ] Environment isolation rules

### Tier 2: Integration Tests
- [ ] Workspace CRUD with real database
- [ ] Promotion request lifecycle
- [ ] Approval workflow with multiple approvers
- [ ] Email notification delivery

### Tier 3: E2E Tests
- [ ] Complete promotion flow dev -> staging -> prod
- [ ] Approval request and approve/reject
- [ ] Environment switching in UI
- [ ] Promotion with all checks passing

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (3-tier strategy)
- [ ] Promotion workflow complete
- [ ] Approval process working
- [ ] Environment isolation verified
- [ ] Code review completed

---

## Related Documentation

- [06-enterprise-saas-product.md](../../docs/implement/06-enterprise-saas-product.md) - Environment specification
- [07-enterprise-dataflow-models.md](../../docs/implement/07-enterprise-dataflow-models.md) - Workspace model
- [08-implementation-roadmap.md](../../docs/implement/08-implementation-roadmap.md) - Week 9 tasks
