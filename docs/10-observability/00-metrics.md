# Metrics & Observability

## Overview

Kaizen Studio provides comprehensive metrics for monitoring agent performance, cost, and reliability.

## Execution Metric Model

```python
@db.model
class ExecutionMetric:
    id: str
    organization_id: str
    deployment_id: str
    agent_id: str
    execution_id: str
    status: str               # success, failure, timeout
    latency_ms: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost_usd: float
    error_type: Optional[str]
    error_message: Optional[str]
    created_at: str
```

## Recording Metrics

```python
from studio.services.metrics_service import MetricsService

metrics = MetricsService()

await metrics.record({
    "organization_id": org_id,
    "deployment_id": deployment_id,
    "agent_id": agent_id,
    "execution_id": "exec-123",
    "status": "success",
    "latency_ms": 450,
    "input_tokens": 150,
    "output_tokens": 200,
    "total_tokens": 350,
    "cost_usd": 0.0035
})
```

## API Endpoints

### Summary

```bash
GET /api/v1/metrics/summary?agent_id=agent-123&start_date=2024-01-01
```

Returns:
```json
{
  "total_executions": 1500,
  "success_rate": 0.98,
  "avg_latency_ms": 425,
  "total_tokens": 525000,
  "total_cost_usd": 5.25,
  "error_rate": 0.02
}
```

### Time Series

```bash
GET /api/v1/metrics/timeseries?metric=latency&interval=hour&start_date=2024-01-01
```

Returns:
```json
[
  {"timestamp": "2024-01-01T00:00:00Z", "value": 410},
  {"timestamp": "2024-01-01T01:00:00Z", "value": 425},
  ...
]
```

Available metrics: `latency`, `tokens`, `errors`, `cost`
Intervals: `hour`, `day`, `week`

### Dashboard

```bash
GET /api/v1/metrics/dashboard
```

Returns 24-hour snapshot:
```json
{
  "total_executions": 150,
  "avg_latency_ms": 420,
  "error_rate": 0.02,
  "total_cost_usd": 0.52,
  "top_agents": [
    {"agent_id": "agent-123", "executions": 75}
  ],
  "top_errors": [
    {"error_type": "timeout", "count": 3}
  ]
}
```

### Deployment Metrics

```bash
GET /api/v1/metrics/deployments/{id}
```

### Agent Metrics

```bash
GET /api/v1/metrics/agents/{id}
```

### Top Errors

```bash
GET /api/v1/metrics/errors?limit=10
```

### Raw Executions

```bash
GET /api/v1/metrics/executions?status=failure&limit=50
```

## Prometheus Integration

### Configuration

```python
# config.py
PROMETHEUS_ENABLED: bool = True
```

### Exposed Metrics

**Counters**:
- `api_requests_total{method, endpoint, status}`
- `executions_total{agent_id, status}`

**Histograms**:
- `request_latency_seconds{method, endpoint}`
- `execution_latency_seconds{agent_id}`

**Gauges**:
- `active_deployments{gateway_id}`
- `connected_gateways`

### Scrape Endpoint

```bash
GET /metrics
```

### Prometheus Configuration

```yaml
scrape_configs:
  - job_name: 'kaizen-studio'
    static_configs:
      - targets: ['localhost:8000']
```

## Service Operations

```python
from studio.services.metrics_service import MetricsService

metrics = MetricsService()

# Get summary
summary = await metrics.get_summary(
    organization_id=org_id,
    agent_id="agent-123",
    start_date="2024-01-01"
)

# Get time series
data = await metrics.get_timeseries(
    organization_id=org_id,
    metric="latency",
    interval="hour",
    start_date="2024-01-01",
    end_date="2024-01-02"
)

# Get top errors
errors = await metrics.get_top_errors(
    organization_id=org_id,
    limit=10
)

# List executions
executions = await metrics.list(
    organization_id=org_id,
    status="failure",
    limit=50
)
```

## Cost Calculation

Token costs based on model:

```python
MODEL_COSTS = {
    "gpt-4": {"input": 0.03/1000, "output": 0.06/1000},
    "gpt-3.5-turbo": {"input": 0.001/1000, "output": 0.002/1000},
    "claude-3-opus": {"input": 0.015/1000, "output": 0.075/1000},
}

def calculate_cost(model_id, input_tokens, output_tokens):
    costs = MODEL_COSTS.get(model_id, {"input": 0, "output": 0})
    return (input_tokens * costs["input"]) + (output_tokens * costs["output"])
```

## Best Practices

1. **Monitor latency P99** - Track worst-case performance
2. **Set cost alerts** - Budget monitoring
3. **Track error patterns** - Identify systemic issues
4. **Dashboard visibility** - Real-time monitoring
5. **Retention policy** - Archive old metrics
