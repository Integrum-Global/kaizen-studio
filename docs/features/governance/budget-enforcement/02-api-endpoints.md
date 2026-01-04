# Budget API Endpoints

## Get Budget Status

Returns detailed budget status for an external agent.

```
GET /api/v1/external-agents/{agent_id}/budget
```

**Response:**
```json
{
  "external_agent_id": "agent-001",
  "organization_id": "org-001",
  "period": "monthly",
  "period_start": "2026-01-01T00:00:00Z",
  "period_end": "2026-02-01T00:00:00Z",
  "cost_used": 250.50,
  "cost_limit": 1000.0,
  "cost_remaining": 749.50,
  "invocations": 5000,
  "invocations_limit": 10000,
  "invocations_remaining": 5000,
  "usage_percentage": 0.2505,
  "warning_triggered": false,
  "limit_exceeded": false
}
```

## Update Budget Configuration

Update budget limits for an external agent.

```
PATCH /api/v1/external-agents/{agent_id}/budget/config
```

**Request:**
```json
{
  "monthly_budget_usd": 2000.0,
  "daily_budget_usd": 100.0,
  "monthly_execution_limit": 20000,
  "warning_threshold": 0.80,
  "degradation_threshold": 0.95,
  "enforcement_mode": "hard"
}
```

**Response:**
```json
{
  "message": "Budget configuration updated",
  "external_agent_id": "agent-001",
  "budget_limit_monthly": 2000.0,
  "budget_limit_daily": 100.0,
  "current_usage": {
    "cost_used": 250.50,
    "invocations": 5000
  }
}
```

## Get Governance Status

Returns comprehensive governance status including budget, rate limits, and policies.

```
GET /api/v1/external-agents/{agent_id}/governance-status
```

**Response:**
```json
{
  "external_agent_id": "agent-001",
  "organization_id": "org-001",
  "budget": {
    "monthly_budget_usd": 1000.0,
    "monthly_spent_usd": 250.50,
    "remaining_monthly_usd": 749.50,
    "daily_budget_usd": 50.0,
    "daily_spent_usd": 10.25,
    "remaining_daily_usd": 39.75,
    "monthly_execution_limit": 10000,
    "monthly_execution_count": 5000,
    "remaining_executions": 5000,
    "usage_percentage": 0.2505,
    "warning_triggered": false,
    "degraded_mode": false
  },
  "rate_limit": {
    "allowed": true,
    "limit_exceeded": null,
    "remaining": 50,
    "current_usage": {
      "minute": 10,
      "hour": 500,
      "day": 2000
    },
    "retry_after_seconds": null
  },
  "policy": {
    "total_policies": 3,
    "enabled_policies": 2
  },
  "timestamp": "2026-01-04T12:00:00Z"
}
```

## Invoke External Agent

Budget is automatically checked before invocation.

```
POST /api/v1/external-agents/{agent_id}/invoke
```

**Request:**
```json
{
  "input": "Process this document",
  "context": {
    "document_id": "doc-123"
  },
  "metadata": {
    "priority": "high"
  }
}
```

**Success Response (200):**
```json
{
  "invocation_id": "inv-001",
  "trace_id": "trace-abc-123",
  "status": "success",
  "output": "Document processed successfully",
  "metadata": {
    "tokens_used": 1500,
    "duration_ms": 2340
  }
}
```

**Budget Exceeded Response (402):**
```json
{
  "detail": "Budget limit exceeded: Monthly budget exceeded. Remaining: $0.00, Requested: $10.00"
}
```

**Rate Limited Response (429):**
```json
{
  "detail": "Rate limit exceeded - retry after 60 seconds"
}
```

## Error Responses

### Budget Exceeded (402 Payment Required)

```json
{
  "detail": "Budget limit exceeded: Monthly budget exceeded. Remaining: $0.00, Requested: $10.00"
}
```

### Service Unavailable (503)

When governance module is not available:

```json
{
  "detail": "Budget tracking not available (governance module not installed)"
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request (invalid parameters) |
| 402 | Payment required (budget exceeded) |
| 403 | Forbidden (access denied by policy) |
| 404 | Agent not found |
| 429 | Rate limit exceeded |
| 500 | Server error |
| 503 | Service unavailable (governance not configured) |
