# Gateway Auto-scaling

## Overview

Auto-scaling automatically adjusts gateway instances based on load metrics to optimize cost and performance.

## Scaling Policy Model

```python
@db.model
class ScalingPolicy:
    id: str
    organization_id: str
    gateway_id: str
    name: str
    min_instances: int
    max_instances: int
    target_metric: str
    target_value: float
    scale_up_threshold: float
    scale_down_threshold: float
    cooldown_seconds: int
    status: str
    created_at: str
    updated_at: str
```

## Supported Metrics

| Metric | Description |
|--------|-------------|
| `cpu` | CPU utilization percentage |
| `memory` | Memory utilization percentage |
| `requests_per_second` | Requests per second |
| `latency_p99` | 99th percentile latency (ms) |
| `error_rate` | Error rate percentage |

## Creating Policies

```bash
POST /api/v1/scaling/policies
```

```json
{
  "gateway_id": "gw-123",
  "name": "Production Auto-scale",
  "min_instances": 2,
  "max_instances": 10,
  "target_metric": "cpu",
  "target_value": 70,
  "scale_up_threshold": 80,
  "scale_down_threshold": 30,
  "cooldown_seconds": 300
}
```

## Scaling Logic

### Scale Up

When metric exceeds `scale_up_threshold`:
```
current_value > target_value * (1 + scale_up_threshold/100)
```

Example: CPU at 70% target, 80% threshold → scale up when CPU > 126%

### Scale Down

When metric falls below `scale_down_threshold`:
```
current_value < target_value * (1 - scale_down_threshold/100)
```

Example: CPU at 70% target, 30% threshold → scale down when CPU < 49%

### Cooldown

Wait `cooldown_seconds` between scaling actions.

## Scaling Events

```python
@db.model
class ScalingEvent:
    id: str
    policy_id: str
    gateway_id: str
    event_type: str
    from_instances: int
    to_instances: int
    trigger_metric: str
    trigger_value: float
    status: str
    error_message: Optional[str]
    created_at: str
    completed_at: Optional[str]
```

## API Endpoints

### Policies

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/scaling/policies` | Create policy |
| GET | `/api/v1/scaling/policies` | List policies |
| GET | `/api/v1/scaling/policies/{id}` | Get policy |
| PUT | `/api/v1/scaling/policies/{id}` | Update policy |
| DELETE | `/api/v1/scaling/policies/{id}` | Delete policy |

### Scaling Actions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/scaling/gateways/{id}/scale` | Manual scale |
| POST | `/api/v1/scaling/gateways/{id}/evaluate` | Auto-scale |

### Events & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/scaling/gateways/{id}/events` | List events |
| GET | `/api/v1/scaling/events/{id}` | Get event |
| GET | `/api/v1/scaling/gateways/{id}/metrics` | Get metrics |

## Manual Scaling

```bash
POST /api/v1/scaling/gateways/{id}/scale
```

```json
{
  "target_instances": 5
}
```

## Evaluate and Auto-scale

```bash
POST /api/v1/scaling/gateways/{id}/evaluate
```

Returns:

```json
{
  "action": "scale_up",
  "current_instances": 3,
  "target_instances": 5,
  "trigger_metric": "cpu",
  "trigger_value": 85.5,
  "event_id": "evt-123"
}
```

## Service Operations

```python
from studio.services.scaling_service import ScalingService

service = ScalingService()

# Create policy
policy = await service.create_policy({
    "organization_id": org_id,
    "gateway_id": "gw-123",
    "name": "Auto-scale Policy",
    "min_instances": 2,
    "max_instances": 10,
    "target_metric": "cpu",
    "target_value": 70,
    "scale_up_threshold": 80,
    "scale_down_threshold": 30,
    "cooldown_seconds": 300,
})

# Evaluate scaling
result = await service.evaluate_scaling("gw-123")

# Manual scale
await service.scale_gateway("gw-123", target_instances=5)

# Get metrics
metrics = await service.get_gateway_metrics("gw-123")

# List events
events = await service.list_events("gw-123", limit=50)
```

## Best Practices

1. **Set appropriate min/max** - Never scale to zero in production
2. **Use cooldown periods** - Prevent thrashing (5+ minutes)
3. **Monitor events** - Review scaling decisions
4. **Test thresholds** - Validate in staging first
5. **Multiple metrics** - Consider using different metrics for up/down
6. **Cost awareness** - Set max instances based on budget
