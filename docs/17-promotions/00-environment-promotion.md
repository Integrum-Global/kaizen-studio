# Environment Promotion

## Overview

Promotion workflows move agent deployments through environments with approval controls.

## Promotion Model

```python
@db.model
class Promotion:
    id: str
    organization_id: str
    agent_id: str
    source_deployment_id: str
    target_gateway_id: str
    source_environment: str
    target_environment: str
    status: str
    requires_approval: bool
    approved_by: Optional[str]
    approved_at: Optional[str]
    rejection_reason: Optional[str]
    target_deployment_id: Optional[str]
    created_by: str
    created_at: str
    completed_at: Optional[str]
```

## Promotion Status

| Status | Description |
|--------|-------------|
| `pending` | Awaiting approval |
| `approved` | Approved, ready to execute |
| `rejected` | Rejected with reason |
| `completed` | Successfully promoted |
| `failed` | Execution failed |

## Creating Promotions

```bash
POST /api/v1/promotions
```

```json
{
  "agent_id": "agent-123",
  "source_deployment_id": "dep-456",
  "target_gateway_id": "gw-789",
  "target_environment": "production"
}
```

## Approval Workflow

### Environments

```
development → staging → production
```

### Default Rules

- **dev → staging**: May not require approval
- **staging → production**: Requires approval

### Approve

```bash
POST /api/v1/promotions/{id}/approve
```

### Reject

```bash
POST /api/v1/promotions/{id}/reject
```

```json
{
  "reason": "Tests not passing on staging"
}
```

### Execute

```bash
POST /api/v1/promotions/{id}/execute
```

Creates deployment on target gateway.

## Promotion Rules

### Rule Model

```python
@db.model
class PromotionRule:
    id: str
    organization_id: str
    name: str
    source_environment: str
    target_environment: str
    requires_approval: bool
    auto_promote: bool
    required_approvers: int
    conditions: Optional[str]
    status: str
    created_at: str
    updated_at: str
```

### Create Rule

```bash
POST /api/v1/promotions/rules
```

```json
{
  "name": "Auto-promote to Staging",
  "source_environment": "development",
  "target_environment": "staging",
  "requires_approval": false,
  "auto_promote": true,
  "conditions": {
    "all": [
      {"field": "tests.pass_rate", "op": "gte", "value": 100},
      {"field": "metrics.error_rate", "op": "lte", "value": 0.01}
    ]
  }
}
```

### Rule Conditions

Auto-promote when conditions are met:

```json
{
  "all": [
    {"field": "tests.pass_rate", "op": "eq", "value": 100},
    {"field": "deployment.duration_hours", "op": "gte", "value": 24}
  ]
}
```

## API Endpoints

### Promotions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/promotions` | Create promotion |
| GET | `/api/v1/promotions` | List promotions |
| GET | `/api/v1/promotions/{id}` | Get promotion |
| POST | `/api/v1/promotions/{id}/approve` | Approve |
| POST | `/api/v1/promotions/{id}/reject` | Reject |
| POST | `/api/v1/promotions/{id}/execute` | Execute |

### Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/promotions/rules` | Create rule |
| GET | `/api/v1/promotions/rules` | List rules |
| GET | `/api/v1/promotions/rules/{id}` | Get rule |
| PUT | `/api/v1/promotions/rules/{id}` | Update rule |
| DELETE | `/api/v1/promotions/rules/{id}` | Delete rule |

## Service Operations

```python
from studio.services.promotion_service import PromotionService

service = PromotionService()

# Create promotion
promotion = await service.create({
    "organization_id": org_id,
    "agent_id": "agent-123",
    "source_deployment_id": "dep-456",
    "target_gateway_id": "gw-789",
    "target_environment": "production",
    "created_by": user_id,
})

# Approve
promotion = await service.approve(promotion["id"], approver_id)

# Execute
deployment = await service.execute(promotion["id"])

# Check auto-promotion
should_promote = await service.check_auto_promotion("dep-456")
```

## Promotion Flow

```
1. Create Request
      ↓
2. Check Rules
      ↓
   ┌─────────────────┐
   │ Approval Needed?│
   └────────┬────────┘
            │
    Yes     │     No
     ↓      │      ↓
3. Wait for │  4. Execute
   Approval │     Immediately
     ↓      │
4. Execute ←┘
     ↓
5. Create Deployment
     ↓
6. Update Status
```

## Best Practices

1. **Test in lower environments** - Verify before promoting
2. **Use approval rules** - Require sign-off for production
3. **Set conditions** - Auto-promote only when safe
4. **Monitor after promotion** - Watch metrics
5. **Rollback plan** - Know how to revert
