# Usage Tracking

## Overview

Kaizen Studio tracks resource usage for billing, quotas, and analytics.

## Resource Types

| Type | Unit | Price |
|------|------|-------|
| `agent_execution` | count | $0.01 |
| `token` | 1000 tokens | $0.002 |
| `storage` | GB | $0.10 |
| `api_call` | count | $0.001 |

## Usage Record Model

```python
@db.model
class UsageRecord:
    id: str
    organization_id: str
    resource_type: str
    quantity: float
    unit: str
    unit_cost: float
    total_cost: float
    metadata: Optional[str]
    recorded_at: str
    created_at: str
```

## Recording Usage

```python
from studio.services.billing_service import BillingService

billing = BillingService()

# Record agent execution
await billing.record_usage(
    org_id=org_id,
    resource_type="agent_execution",
    quantity=1,
    metadata={"agent_id": "agent-123"}
)

# Record token usage
await billing.record_usage(
    org_id=org_id,
    resource_type="token",
    quantity=500,
    metadata={"agent_id": "agent-123", "model": "gpt-4"}
)
```

## API Endpoints

### Get Usage Summary

```bash
GET /api/v1/billing/usage?start_date=2024-01-01&end_date=2024-01-31
```

Response:

```json
{
  "organization_id": "org-123",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "usage": {
    "agent_execution": {
      "quantity": 1500,
      "cost": 15.00
    },
    "token": {
      "quantity": 250000,
      "cost": 0.50
    }
  },
  "total_cost": 15.50
}
```

### Get Detailed Records

```bash
GET /api/v1/billing/usage/details?resource_type=agent_execution&limit=100
```

### Get Pricing

```bash
GET /api/v1/billing/pricing
```

## Quotas

### Quota Model

```python
@db.model
class UsageQuota:
    id: str
    organization_id: str
    resource_type: str
    limit_value: float
    current_usage: float
    reset_period: str
    last_reset_at: str
    created_at: str
    updated_at: str
```

### Plan Limits

| Resource | Free | Pro | Enterprise |
|----------|------|-----|------------|
| Executions | 1,000 | 10,000 | Unlimited |
| Tokens | 100,000 | 1,000,000 | Unlimited |
| Storage | 1 GB | 10 GB | Unlimited |
| API Calls | 10,000 | 100,000 | Unlimited |

### Check Quota

```python
# Returns False if would exceed limit
allowed = await billing.check_quota(
    org_id=org_id,
    resource_type="agent_execution",
    quantity=1
)

if not allowed:
    raise HTTPException(402, "Quota exceeded")
```

### Get Quotas

```bash
GET /api/v1/billing/quotas
```

```json
[
  {
    "resource_type": "agent_execution",
    "limit_value": 10000,
    "current_usage": 1500,
    "remaining": 8500,
    "reset_period": "monthly"
  }
]
```

### Update Quota

```bash
PUT /api/v1/billing/quotas/agent_execution
```

```json
{
  "limit_value": 20000
}
```

## Service Operations

```python
from studio.services.billing_service import BillingService

billing = BillingService()

# Get usage summary
summary = await billing.get_usage_summary(
    org_id=org_id,
    start_date="2024-01-01",
    end_date="2024-01-31"
)

# Check quota before operation
if await billing.check_quota(org_id, "token", 1000):
    # Proceed with operation
    await execute_agent(...)
    await billing.record_usage(org_id, "token", 1000)
else:
    raise QuotaExceededException()

# Get all quotas
quotas = await billing.get_quotas(org_id)

# Update quota limit (admin)
await billing.update_quota(org_id, "agent_execution", 50000)
```

## Best Practices

1. **Check quotas first** - Verify before operations
2. **Batch recording** - Record usage efficiently
3. **Monitor trends** - Track usage patterns
4. **Alert on thresholds** - Notify at 80%, 90%
5. **Plan upgrades** - Proactive capacity planning
