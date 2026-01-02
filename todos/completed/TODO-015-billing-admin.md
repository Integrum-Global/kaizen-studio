# TODO-015: Billing & Admin

**Status**: PENDING
**Priority**: MEDIUM
**Estimated Effort**: 5 days (Week 15)
**Phase**: 4 - SaaS Operations

---

## Objective

Implement usage tracking, Stripe billing integration, subscription management, invoice generation, and platform admin console.

---

## Acceptance Criteria

### Backend
- [ ] Usage tracking per organization
- [ ] Stripe integration (subscriptions, payments)
- [ ] Subscription management endpoints
- [ ] Invoice generation
- [ ] Platform admin APIs

### Frontend
- [ ] Billing dashboard with usage
- [ ] Subscription management page
- [ ] Usage graphs and trends
- [ ] Invoice history
- [ ] Platform admin console

---

## Technical Approach

### DataFlow Models
```python
@db.model
class Subscription:
    id: str
    organization_id: str
    plan_id: str
    status: str  # active, cancelled, past_due
    billing_cycle: str  # monthly, annual
    current_period_start: str
    current_period_end: str
    stripe_subscription_id: Optional[str]
    stripe_customer_id: Optional[str]

    # Limits
    max_users: int
    max_agents: int
    max_executions_per_month: int
    max_storage_gb: int
    max_gateways: int

@db.model
class UsageRecord:
    id: str
    organization_id: str
    period_start: str
    period_end: str
    users_count: int
    agents_count: int
    executions_count: int
    storage_gb: float
    gateways_count: int
    cost_usd: float

@db.model
class Invoice:
    id: str
    organization_id: str
    stripe_invoice_id: str
    period_start: str
    period_end: str
    amount_usd: float
    status: str  # draft, open, paid, void
    pdf_url: Optional[str]
    due_date: str
    paid_at: Optional[str]
```

### Stripe Integration
```python
class BillingService:
    async def create_subscription(
        self,
        org_id: str,
        plan_id: str,
        payment_method_id: str
    ) -> Subscription:
        # Create Stripe customer
        # Create Stripe subscription
        # Store locally

    async def handle_webhook(self, event: dict):
        match event["type"]:
            case "invoice.paid":
                await self.mark_invoice_paid(event)
            case "customer.subscription.updated":
                await self.update_subscription(event)
            case "invoice.payment_failed":
                await self.handle_payment_failed(event)
```

### Pricing Tiers
- **Free**: 3 users, 10 agents, 10K executions
- **Pro**: Unlimited users, 100 agents, 100K executions ($49/user)
- **Enterprise**: Custom

---

## Dependencies

- TODO-001: Platform Infrastructure (basic org model)

---

## Risk Assessment

- **MEDIUM**: Stripe webhook reliability - Mitigation: Idempotency, retry logic
- **MEDIUM**: Usage tracking accuracy - Mitigation: Atomic counters, reconciliation
- **LOW**: Invoice disputes - Mitigation: Clear usage breakdown, audit trail

---

## Subtasks

### Day 1: Usage Tracking
- [ ] Implement UsageRecord model (Est: 2h)
- [ ] Create usage tracking service (Est: 3h)
- [ ] Add usage increment for executions (Est: 2h)
- [ ] Implement daily usage aggregation (Est: 1h)

### Day 2: Stripe Integration
- [ ] Set up Stripe SDK (Est: 1h)
- [ ] Implement customer creation (Est: 2h)
- [ ] Implement subscription creation (Est: 3h)
- [ ] Add payment method handling (Est: 2h)

### Day 3: Webhooks & Invoices
- [ ] Implement Stripe webhook handler (Est: 3h)
- [ ] Create Invoice model and tracking (Est: 2h)
- [ ] Add subscription status updates (Est: 2h)
- [ ] Implement payment failure handling (Est: 1h)

### Day 4: Admin APIs
- [ ] Create platform admin endpoints (Est: 3h)
- [ ] Implement organization management (Est: 2h)
- [ ] Add system health endpoints (Est: 2h)
- [ ] Create feature flag management (Est: 1h)

### Day 5: Frontend
- [ ] Build billing dashboard (Est: 2h)
- [ ] Create subscription management page (Est: 2h)
- [ ] Add usage graphs (Est: 2h)
- [ ] Build platform admin console (Est: 2h)

---

## Testing Requirements

### Tier 1: Unit Tests
- [ ] Usage calculation logic
- [ ] Tier limit checking
- [ ] Invoice amount calculation
- [ ] Webhook event parsing

### Tier 2: Integration Tests
- [ ] Stripe API calls (test mode)
- [ ] Webhook processing
- [ ] Usage tracking accuracy
- [ ] Subscription lifecycle

### Tier 3: E2E Tests
- [ ] Complete subscription flow
- [ ] Usage updates in dashboard
- [ ] Invoice viewing and download
- [ ] Plan upgrade/downgrade

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (3-tier strategy)
- [ ] Stripe integration working (test mode)
- [ ] Usage tracking accurate
- [ ] Admin console functional
- [ ] Code review completed

---

## Related Documentation

- [06-enterprise-saas-product.md](../../docs/implement/06-enterprise-saas-product.md) - Pricing tiers
- [07-enterprise-dataflow-models.md](../../docs/implement/07-enterprise-dataflow-models.md) - Subscription models
- [08-implementation-roadmap.md](../../docs/implement/08-implementation-roadmap.md) - Week 15 tasks
