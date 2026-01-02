# External Agents API Reference

**Version**: 1.0.0
**Last Updated**: 2025-12-20
**Base URL**: `https://kaizen.studio/api` (or your deployment URL)

---

## Authentication

All API endpoints require authentication via API key or session token.

**API Key** (recommended for programmatic access):
```http
Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8
```

**Session Token** (for UI):
```http
Cookie: session=<session-token>
```

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/external-agents` | Register new external agent |
| GET | `/external-agents` | List all external agents |
| GET | `/external-agents/{id}` | Get external agent details |
| PATCH | `/external-agents/{id}` | Update external agent |
| DELETE | `/external-agents/{id}` | Delete external agent |
| POST | `/external-agents/{id}/invoke` | Invoke external agent |
| GET | `/external-agents/{id}/governance-status` | Get governance metrics |
| GET | `/external-agents/{id}/invocations` | List invocations |
| GET | `/lineage/graph` | Get lineage graph |

---

## 1. Register External Agent

**Endpoint**: `POST /api/external-agents`

**Description**: Create a new external agent with authentication, platform configuration, and governance settings.

### Request

```http
POST /api/external-agents HTTP/1.1
Host: kaizen.studio
Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8
Content-Type: application/json

{
  "name": "Teams HR Notifications",
  "description": "Sends workflow updates to HR Teams channel",
  "platform": "teams",
  "platform_config": {
    "webhook_url": "https://outlook.webhook.office.com/webhookb2/.../IncomingWebhook/...",
    "studio_base_url": "https://kaizen.studio",
    "icon_url": "https://kaizen.studio/icons/hr.png"
  },
  "auth_config": {
    "auth_type": "none",
    "credentials": {}
  },
  "max_monthly_cost": 100.0,
  "max_daily_cost": 10.0,
  "cost_per_execution": 0.05,
  "requests_per_minute": 10,
  "requests_per_hour": 100,
  "requests_per_day": 500
}
```

### Response

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "agent_abc123",
  "name": "Teams HR Notifications",
  "description": "Sends workflow updates to HR Teams channel",
  "platform": "teams",
  "platform_config": {
    "webhook_url": "https://outlook.webhook.office.com/webhookb2/.../IncomingWebhook/...",
    "studio_base_url": "https://kaizen.studio",
    "icon_url": "https://kaizen.studio/icons/hr.png"
  },
  "auth_config": {
    "auth_type": "none",
    "credentials": "***"
  },
  "max_monthly_cost": 100.0,
  "max_daily_cost": 10.0,
  "cost_per_execution": 0.05,
  "requests_per_minute": 10,
  "requests_per_hour": 100,
  "requests_per_day": 500,
  "organization_id": "org_xyz789",
  "created_by": "user_def456",
  "created_at": "2025-12-20T10:00:00Z",
  "updated_at": null
}
```

### cURL Example

```bash
curl -X POST "https://kaizen.studio/api/external-agents" \
  -H "Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teams HR Notifications",
    "platform": "teams",
    "platform_config": {
      "webhook_url": "https://outlook.webhook.office.com/webhookb2/.../IncomingWebhook/..."
    },
    "auth_config": {
      "auth_type": "none",
      "credentials": {}
    },
    "max_monthly_cost": 100.0
  }'
```

### Error Codes

- **400 Bad Request**: Invalid request body (missing required fields, invalid platform)
- **401 Unauthorized**: Missing or invalid API key
- **403 Forbidden**: Insufficient permissions (requires `create:external_agent`)
- **409 Conflict**: External agent with same name already exists in organization

---

## 2. List External Agents

**Endpoint**: `GET /api/external-agents`

**Description**: List all external agents for your organization.

### Request

```http
GET /api/external-agents?page=1&limit=20&platform=teams HTTP/1.1
Host: kaizen.studio
Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `platform` (optional): Filter by platform (teams, discord, slack, etc.)
- `search` (optional): Search by name or description

### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "items": [
    {
      "id": "agent_abc123",
      "name": "Teams HR Notifications",
      "platform": "teams",
      "max_monthly_cost": 100.0,
      "current_monthly_cost": 45.0,
      "usage_percentage": 0.45,
      "created_at": "2025-12-20T10:00:00Z"
    },
    {
      "id": "agent_def456",
      "name": "Discord Deploy Alerts",
      "platform": "discord",
      "max_monthly_cost": 50.0,
      "current_monthly_cost": 12.5,
      "usage_percentage": 0.25,
      "created_at": "2025-12-19T14:30:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 20,
  "has_more": false
}
```

### cURL Example

```bash
curl "https://kaizen.studio/api/external-agents?platform=teams&limit=10" \
  -H "Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8"
```

---

## 3. Get External Agent

**Endpoint**: `GET /api/external-agents/{id}`

**Description**: Get detailed information about a specific external agent.

### Request

```http
GET /api/external-agents/agent_abc123 HTTP/1.1
Host: kaizen.studio
Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8
```

### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "agent_abc123",
  "name": "Teams HR Notifications",
  "description": "Sends workflow updates to HR Teams channel",
  "platform": "teams",
  "platform_config": {
    "webhook_url": "https://outlook.webhook.office.com/webhookb2/.../IncomingWebhook/...",
    "studio_base_url": "https://kaizen.studio"
  },
  "auth_config": {
    "auth_type": "none",
    "credentials": "***"
  },
  "max_monthly_cost": 100.0,
  "max_daily_cost": 10.0,
  "cost_per_execution": 0.05,
  "requests_per_minute": 10,
  "requests_per_hour": 100,
  "requests_per_day": 500,
  "organization_id": "org_xyz789",
  "created_by": "user_def456",
  "created_at": "2025-12-20T10:00:00Z",
  "updated_at": null,
  "governance": {
    "monthly_spent": 45.0,
    "daily_spent": 5.0,
    "usage_percentage": 0.45,
    "invocations_today": 100,
    "invocations_this_month": 900
  }
}
```

### cURL Example

```bash
curl "https://kaizen.studio/api/external-agents/agent_abc123" \
  -H "Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8"
```

### Error Codes

- **404 Not Found**: External agent does not exist or you don't have access

---

## 4. Update External Agent

**Endpoint**: `PATCH /api/external-agents/{id}`

**Description**: Update external agent configuration, credentials, or governance settings.

### Request

```http
PATCH /api/external-agents/agent_abc123 HTTP/1.1
Host: kaizen.studio
Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8
Content-Type: application/json

{
  "max_monthly_cost": 200.0,
  "requests_per_minute": 20,
  "auth_config": {
    "auth_type": "api_key",
    "credentials": {
      "api_key": "new-api-key-rotated"
    }
  }
}
```

### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "agent_abc123",
  "name": "Teams HR Notifications",
  "max_monthly_cost": 200.0,
  "requests_per_minute": 20,
  "auth_config": {
    "auth_type": "api_key",
    "credentials": "***"
  },
  "updated_at": "2025-12-20T11:00:00Z"
}
```

### cURL Example

```bash
curl -X PATCH "https://kaizen.studio/api/external-agents/agent_abc123" \
  -H "Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8" \
  -H "Content-Type: application/json" \
  -d '{
    "max_monthly_cost": 200.0,
    "requests_per_minute": 20
  }'
```

### Error Codes

- **400 Bad Request**: Invalid update fields
- **403 Forbidden**: Insufficient permissions (requires `update:external_agent`)
- **404 Not Found**: External agent does not exist

---

## 5. Delete External Agent

**Endpoint**: `DELETE /api/external-agents/{id}`

**Description**: Delete an external agent. This is irreversible but preserves historical invocation lineage for compliance.

### Request

```http
DELETE /api/external-agents/agent_abc123 HTTP/1.1
Host: kaizen.studio
Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8
```

### Response

```http
HTTP/1.1 204 No Content
```

### cURL Example

```bash
curl -X DELETE "https://kaizen.studio/api/external-agents/agent_abc123" \
  -H "Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8"
```

### Error Codes

- **403 Forbidden**: Insufficient permissions (requires `delete:external_agent`)
- **404 Not Found**: External agent does not exist
- **409 Conflict**: External agent is currently in use by active workflows

---

## 6. Invoke External Agent

**Endpoint**: `POST /api/external-agents/{id}/invoke`

**Description**: Invoke an external agent with governance checks (budget, rate limit, policy).

### Request Headers

**Required**:
- `Authorization`: Bearer token or session cookie
- `X-External-User-ID`: External user identifier (for lineage tracking)
- `X-External-User-Email`: External user email (for lineage tracking)
- `X-External-System`: External system identifier (copilot, custom, etc.)
- `X-External-Session-ID`: External session ID (for lineage tracking)

**Optional**:
- `X-External-User-Name`: External user display name
- `X-External-Trace-ID`: Parent trace ID (for distributed tracing)
- `X-External-Context`: Additional context JSON (role, tenant, etc.)

### Request

```http
POST /api/external-agents/agent_abc123/invoke HTTP/1.1
Host: kaizen.studio
Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8
X-External-User-ID: user@company.com
X-External-User-Email: user@company.com
X-External-System: copilot
X-External-Session-ID: copilot-session-xyz789
Content-Type: application/json

{
  "input": "Analyze Q4 sales data for EMEA region"
}
```

### Response

```http
HTTP/1.1 200 OK
X-Kaizen-Invocation-ID: inv_def456
X-Kaizen-Trace-ID: otel_trace_ghi789
X-Kaizen-Cost-USD: 0.0456
X-Kaizen-Duration-MS: 1234
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 2025-12-20T10:15:00Z
Content-Type: application/json

{
  "invocation_id": "inv_def456",
  "trace_id": "otel_trace_ghi789",
  "status": "success",
  "output": {
    "analysis": "Q4 EMEA sales increased 15% YoY...",
    "summary": "Strong performance in Germany and UK markets"
  },
  "metadata": {
    "duration_ms": 1234,
    "cost_usd": 0.0456,
    "webhook_delivered": true
  }
}
```

### cURL Example

```bash
curl -X POST "https://kaizen.studio/api/external-agents/agent_abc123/invoke" \
  -H "Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8" \
  -H "X-External-User-ID: user@company.com" \
  -H "X-External-User-Email: user@company.com" \
  -H "X-External-System: copilot" \
  -H "X-External-Session-ID: copilot-xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Analyze Q4 sales data for EMEA region"
  }'
```

### Error Codes

- **400 Bad Request**: Missing required headers or invalid input
- **402 Payment Required**: Budget exceeded
  ```json
  {
    "status_code": 402,
    "detail": "Budget limit exceeded: Monthly budget would be exceeded: $105.00 > $100.00",
    "budget_remaining": -5.0,
    "budget_limit": 100.0
  }
  ```
- **403 Forbidden**: ABAC policy denied invocation
  ```json
  {
    "status_code": 403,
    "detail": "Policy denied: Business hours only (Mon-Fri 9am-5pm EST)",
    "policy_id": "business_hours",
    "matched_policies": ["business_hours", "prod_only"]
  }
  ```
- **429 Too Many Requests**: Rate limit exceeded
  ```json
  {
    "status_code": 429,
    "detail": "Rate limit exceeded: 10 requests per minute",
    "retry_after_seconds": 30,
    "limit": 10,
    "remaining": 0,
    "reset_time": "2025-12-20T10:15:00Z"
  }
  ```

---

## 7. Get Governance Status

**Endpoint**: `GET /api/external-agents/{id}/governance-status`

**Description**: Get current governance metrics (budget usage, rate limit status, policy summary).

### Request

```http
GET /api/external-agents/agent_abc123/governance-status HTTP/1.1
Host: kaizen.studio
Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8
```

### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "external_agent_id": "agent_abc123",
  "organization_id": "org_xyz789",
  "budget": {
    "monthly_budget_usd": 100.0,
    "monthly_spent_usd": 45.0,
    "remaining_monthly_usd": 55.0,
    "daily_budget_usd": 10.0,
    "daily_spent_usd": 5.0,
    "remaining_daily_usd": 5.0,
    "monthly_execution_limit": 1000,
    "monthly_execution_count": 900,
    "remaining_executions": 100,
    "usage_percentage": 0.45,
    "warning_triggered": false,
    "degraded_mode": false
  },
  "rate_limit": {
    "allowed": true,
    "limit_exceeded": null,
    "remaining": 7,
    "current_usage": {
      "minute": 3,
      "hour": 45,
      "day": 200
    },
    "retry_after_seconds": null,
    "reset_time": "2025-12-20T10:15:00Z"
  },
  "policy": {
    "total_policies": 3,
    "enabled_policies": 3,
    "active_policies": [
      {
        "policy_id": "business_hours",
        "name": "Business Hours Only",
        "effect": "deny",
        "priority": 1
      },
      {
        "policy_id": "prod_only",
        "name": "Production Only",
        "effect": "allow",
        "priority": 2
      }
    ]
  },
  "timestamp": "2025-12-20T10:00:00Z"
}
```

### cURL Example

```bash
curl "https://kaizen.studio/api/external-agents/agent_abc123/governance-status" \
  -H "Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8"
```

---

## 8. List Invocations

**Endpoint**: `GET /api/external-agents/{id}/invocations`

**Description**: List recent invocations for an external agent.

### Request

```http
GET /api/external-agents/agent_abc123/invocations?page=1&limit=20&status=success HTTP/1.1
Host: kaizen.studio
Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (success, failure, timeout)
- `start_date` (optional): Filter by start date (ISO 8601)
- `end_date` (optional): Filter by end date (ISO 8601)

### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "items": [
    {
      "invocation_id": "inv_def456",
      "external_agent_id": "agent_abc123",
      "external_user_email": "user@company.com",
      "status": "success",
      "duration_ms": 1234,
      "cost_usd": 0.0456,
      "webhook_delivery_status": "delivered",
      "created_at": "2025-12-20T10:00:00Z"
    },
    {
      "invocation_id": "inv_ghi789",
      "external_agent_id": "agent_abc123",
      "external_user_email": "user2@company.com",
      "status": "success",
      "duration_ms": 987,
      "cost_usd": 0.0412,
      "webhook_delivery_status": "delivered",
      "created_at": "2025-12-20T09:45:00Z"
    }
  ],
  "total": 900,
  "page": 1,
  "limit": 20,
  "has_more": true
}
```

### cURL Example

```bash
curl "https://kaizen.studio/api/external-agents/agent_abc123/invocations?status=success&limit=10" \
  -H "Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8"
```

---

## 9. Get Lineage Graph

**Endpoint**: `GET /api/lineage/graph`

**Description**: Get lineage graph for workflow execution including external agents.

### Request

```http
GET /api/lineage/graph?workflow_id=wf_abc123 HTTP/1.1
Host: kaizen.studio
Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8
```

**Query Parameters**:
- `workflow_id` (optional): Filter by workflow ID
- `execution_id` (optional): Filter by execution ID
- `depth` (optional): Graph depth (default: 5)

### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "nodes": [
    {
      "id": "agent_a",
      "type": "internal",
      "name": "Chat Agent",
      "agent_id": "agent_a123"
    },
    {
      "id": "agent_b",
      "type": "external",
      "name": "Discord Bot",
      "agent_id": "agent_abc123",
      "external_agent_id": "agent_abc123",
      "platform": "discord",
      "ui_metadata": {
        "icon": "discord",
        "color": "#5865F2",
        "border_color": "#9b59b6",
        "badge": "External"
      }
    },
    {
      "id": "agent_c",
      "type": "internal",
      "name": "Completion Agent",
      "agent_id": "agent_c456"
    }
  ],
  "edges": [
    {
      "source": "agent_a",
      "target": "agent_b",
      "invocation_id": "inv_def456",
      "cost_usd": 0.0456
    },
    {
      "source": "agent_b",
      "target": "agent_c",
      "invocation_id": "inv_ghi789",
      "cost_usd": 0.0234
    }
  ],
  "metadata": {
    "total_nodes": 3,
    "external_nodes": 1,
    "total_cost_usd": 0.069
  }
}
```

### cURL Example

```bash
curl "https://kaizen.studio/api/lineage/graph?workflow_id=wf_abc123" \
  -H "Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8"
```

---

## Rate Limit Headers

All API responses include rate limit headers:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 2025-12-20T10:15:00Z
```

When rate limited:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-12-20T10:15:00Z
```

---

## Error Response Format

All errors follow this format:

```json
{
  "status_code": 400,
  "detail": "Validation error: 'name' is required",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2025-12-20T10:00:00Z",
  "request_id": "req_abc123"
}
```

### Common Error Codes

| HTTP Status | Error Code | Meaning |
|-------------|------------|---------|
| 400 | VALIDATION_ERROR | Invalid request body or parameters |
| 401 | UNAUTHORIZED | Missing or invalid API key |
| 402 | BUDGET_EXCEEDED | Budget limit exceeded |
| 403 | FORBIDDEN | Insufficient permissions or policy denied |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists or in use |
| 429 | RATE_LIMIT_EXCEEDED | Rate limit exceeded |
| 500 | INTERNAL_ERROR | Server error |

---

## Pagination

List endpoints support pagination:

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "has_more": true
}
```

**Navigation**:
- First page: `?page=1&limit=20`
- Next page: `?page=2&limit=20`
- Last page: `?page=8&limit=20` (when total=150, limit=20)

---

## Webhooks

External agents can send webhooks back to Kaizen Studio when external events occur (not yet implemented).

**Future Feature**: Register webhook endpoints to receive events like:
- `external_agent.invocation.completed`
- `external_agent.budget.warning`
- `external_agent.rate_limit.exceeded`

---

## Related Documentation

- [User Guide](./02-user-guide.md) - End-user registration and usage
- [Admin Guide](./03-admin-guide.md) - Installation and configuration
- [Developer Guide](./05-developer-guide.md) - Architecture and extension guide

---

## Support

**Questions?** Contact your Kaizen Studio administrator.

**API Issues?** File an issue in the project repository.
