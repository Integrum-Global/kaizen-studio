# Billing Periods

## Overview

Billing periods aggregate usage for invoicing and reporting.

## Billing Period Model

```python
@db.model
class BillingPeriod:
    id: str
    organization_id: str
    start_date: str
    end_date: str
    status: str
    total_usage: float
    total_cost: float
    invoice_id: Optional[str]
    created_at: str
```

## Period Status

| Status | Description |
|--------|-------------|
| `active` | Current billing period |
| `closed` | Period ended, ready for invoicing |
| `invoiced` | Invoice generated |

## API Endpoints

### List Periods

```bash
GET /api/v1/billing/periods
```

```json
[
  {
    "id": "period-123",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "status": "invoiced",
    "total_cost": 125.50
  },
  {
    "id": "period-456",
    "start_date": "2024-02-01",
    "end_date": "2024-02-29",
    "status": "active",
    "total_cost": 45.25
  }
]
```

### Get Current Period

```bash
GET /api/v1/billing/periods/current
```

```json
{
  "id": "period-456",
  "organization_id": "org-123",
  "start_date": "2024-02-01",
  "end_date": "2024-02-29",
  "status": "active",
  "total_usage": 4525,
  "total_cost": 45.25,
  "days_remaining": 15,
  "usage_breakdown": {
    "agent_execution": {"quantity": 4000, "cost": 40.00},
    "token": {"quantity": 262500, "cost": 5.25}
  }
}
```

### Get Period Details

```bash
GET /api/v1/billing/periods/{id}
```

### Close Period

```bash
POST /api/v1/billing/periods/{id}/close
```

Closes the period and calculates final totals.

## Service Operations

```python
from studio.services.billing_service import BillingService

billing = BillingService()

# Get current period
period = await billing.get_current_period(org_id)

# List all periods
periods = await billing.list_periods(org_id)

# Close period (end of month)
closed = await billing.close_period(period_id)
```

## Cost Estimation

### Estimate Endpoint

```bash
POST /api/v1/billing/estimate
```

```json
{
  "usage": {
    "agent_execution": 5000,
    "token": 500000,
    "storage": 5,
    "api_call": 50000
  }
}
```

Response:

```json
{
  "breakdown": {
    "agent_execution": {
      "quantity": 5000,
      "unit_cost": 0.01,
      "total": 50.00
    },
    "token": {
      "quantity": 500000,
      "unit_cost": 0.002,
      "total": 1.00
    },
    "storage": {
      "quantity": 5,
      "unit_cost": 0.10,
      "total": 0.50
    },
    "api_call": {
      "quantity": 50000,
      "unit_cost": 0.001,
      "total": 50.00
    }
  },
  "total_estimated_cost": 101.50
}
```

## Period Lifecycle

```
New Month → active
    ↓
End of Month → close_period()
    ↓
closed → Generate Invoice
    ↓
invoiced → Archive
```

## Automatic Period Creation

New periods created automatically at month start:

```python
async def create_new_period(org_id: str):
    today = datetime.utcnow()
    start = today.replace(day=1)
    end = (start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

    return await billing.create_period(
        org_id=org_id,
        start_date=start.isoformat(),
        end_date=end.isoformat()
    )
```

## Best Practices

1. **Close on schedule** - Close periods at month end
2. **Review before invoice** - Verify usage accuracy
3. **Archive old periods** - Retain for compliance
4. **Monitor mid-period** - Track spending trends
5. **Budget alerts** - Notify on projected overages
