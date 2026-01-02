# Lineage API Reference

**Version**: v1.0.0
**Base URL**: `/api/lineage`
**Authentication**: Required (API Key or JWT)

---

## Overview

The Lineage API provides endpoints for querying external agent invocation lineage, generating lineage graphs, and exporting data for compliance.

All endpoints require appropriate permissions:
- `read:lineage` - Query lineage records
- `export:lineage` - Export lineage data
- `gdpr:redact` - Redact user data for GDPR compliance

---

## Endpoints

### List Lineages

Query invocation lineages with filtering and pagination.

**Endpoint**: `GET /api/lineage`

**Permission**: `read:lineage`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `external_user_id` | string | No | Filter by external user ID |
| `external_user_email` | string | No | Filter by external user email |
| `external_system` | string | No | Filter by external system (copilot, custom, etc.) |
| `external_agent_id` | string | No | Filter by external agent ID |
| `organization_id` | string | No | Filter by organization (auto-filtered to current user's org) |
| `status` | string | No | Filter by status (pending, success, failure, etc.) |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Page size (default: 100, max: 1000) |

**Response** (200 OK):
```json
{
  "lineages": [
    {
      "id": "inv-abc123",
      "external_user_id": "user@company.com",
      "external_user_email": "user@company.com",
      "external_user_name": "Jane Smith",
      "external_system": "copilot",
      "external_session_id": "copilot-session-xyz",
      "organization_id": "org-456",
      "external_agent_id": "agent-123",
      "external_agent_name": "Sales Analytics Bot",
      "status": "success",
      "duration_ms": 1234,
      "cost_usd": 0.0456,
      "request_timestamp": "2025-12-20T10:30:45.123Z",
      "response_timestamp": "2025-12-20T10:30:46.357Z",
      "created_at": "2025-12-20T10:30:45.123Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 100
}
```

**Example Request**:
```bash
curl -X GET "https://api.kaizen.studio/api/lineage?external_user_email=user@company.com&status=success&page=1&limit=10" \
  -H "Authorization: Bearer sk_live_..."
```

---

### Get Lineage Record

Retrieve a single lineage record by invocation ID.

**Endpoint**: `GET /api/lineage/{invocation_id}`

**Permission**: `read:lineage`

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `invocation_id` | string | Invocation ID (e.g., "inv-abc123") |

**Response** (200 OK):
```json
{
  "id": "inv-abc123",
  "external_user_id": "user@company.com",
  "external_user_email": "user@company.com",
  "external_user_name": "Jane Smith",
  "external_user_role": "Sales Manager",
  "external_system": "copilot",
  "external_session_id": "copilot-session-xyz",
  "external_trace_id": "trace-parent-abc",
  "external_context": "{\"role\": \"Sales Manager\", \"tenant\": \"acme-corp\"}",
  "api_key_id": "key-789",
  "api_key_prefix": "sk_live_a1b2c3d4",
  "organization_id": "org-456",
  "team_id": "team-012",
  "external_agent_id": "agent-123",
  "external_agent_name": "Sales Analytics Bot",
  "external_agent_endpoint": "https://copilot.microsoft.com/...",
  "external_agent_version": "v2.1.0",
  "trace_id": "otel-trace-ghi789",
  "span_id": "otel-span-jkl012",
  "parent_trace_id": "trace-parent-abc",
  "ip_address": "203.0.113.42",
  "user_agent": "Microsoft-Copilot/1.0",
  "request_timestamp": "2025-12-20T10:30:45.123Z",
  "request_headers": "{\"content-type\": \"application/json\"}",
  "request_body": "{\"input\": \"Analyze Q4 sales\"}",
  "status": "success",
  "response_timestamp": "2025-12-20T10:30:46.357Z",
  "duration_ms": 1234,
  "cost_usd": 0.0456,
  "input_tokens": 123,
  "output_tokens": 456,
  "api_calls_count": 2,
  "response_status_code": 200,
  "response_headers": "{\"content-type\": \"application/json\"}",
  "response_body": "{\"result\": \"Q4 sales increased 15% YoY\"}",
  "budget_checked": true,
  "budget_remaining_before": 100.0,
  "budget_remaining_after": 99.95,
  "approval_required": false,
  "created_at": "2025-12-20T10:30:45.123Z",
  "updated_at": "2025-12-20T10:30:46.500Z"
}
```

**Error Responses**:
- `404 Not Found` - Invocation ID not found
- `403 Forbidden` - Access denied (wrong organization)

---

### Get Lineage Graph

Retrieve lineage graph for workflow or external agent visualization.

**Endpoint**: `GET /api/lineage/graph`

**Permission**: `read:lineage`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workflow_id` | string | No* | Workflow ID to filter by |
| `external_agent_id` | string | No* | External agent ID to filter by |

*One of `workflow_id` or `external_agent_id` is required.

**Response** (200 OK):
```json
{
  "nodes": [
    {
      "id": "inv-abc123",
      "type": "external_agent",
      "label": "Sales Analytics Bot",
      "metadata": {
        "external_agent_id": "agent-123",
        "external_user_email": "user@company.com",
        "external_system": "copilot",
        "status": "success",
        "duration_ms": 1234,
        "cost_usd": 0.0456,
        "timestamp": "2025-12-20T10:30:45.123Z"
      }
    },
    {
      "id": "inv-def456",
      "type": "external_agent",
      "label": "Customer Support Bot",
      "metadata": {
        "external_agent_id": "agent-789",
        "external_user_email": "user@company.com",
        "external_system": "custom",
        "status": "success",
        "duration_ms": 567,
        "cost_usd": 0.0123,
        "timestamp": "2025-12-20T10:30:47.000Z"
      }
    }
  ],
  "edges": [
    {
      "source": "inv-abc123",
      "target": "inv-def456",
      "label": "invokes"
    }
  ]
}
```

**Example Request**:
```bash
curl -X GET "https://api.kaizen.studio/api/lineage/graph?external_agent_id=agent-123" \
  -H "Authorization: Bearer sk_live_..."
```

---

### Export Lineage

Export lineage records for compliance (GDPR, SOC2, HIPAA).

**Endpoint**: `GET /api/lineage/export`

**Permission**: `export:lineage`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | No | Export format: `json` or `csv` (default: json) |
| `external_user_id` | string | No | Filter by external user ID |
| `external_user_email` | string | No | Filter by external user email |
| `external_system` | string | No | Filter by external system |
| `external_agent_id` | string | No | Filter by external agent ID |
| `status` | string | No | Filter by status |

**Response** (200 OK):

**JSON Format**:
```
Content-Type: application/json
Content-Disposition: attachment; filename="lineage_export.json"

[
  {
    "id": "inv-abc123",
    "external_user_email": "user@company.com",
    ...
  }
]
```

**CSV Format**:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="lineage_export.csv"

id,external_user_email,external_system,status,...
inv-abc123,user@company.com,copilot,success,...
```

**Example Request**:
```bash
# Export to JSON
curl -X GET "https://api.kaizen.studio/api/lineage/export?format=json&external_user_email=user@company.com" \
  -H "Authorization: Bearer sk_live_..." \
  -o lineage_export.json

# Export to CSV
curl -X GET "https://api.kaizen.studio/api/lineage/export?format=csv&status=failure" \
  -H "Authorization: Bearer sk_live_..." \
  -o lineage_export.csv
```

---

### Redact User Data (GDPR)

Redact user data for GDPR Right to Erasure compliance.

**Endpoint**: `DELETE /api/lineage/user/{email}`

**Permission**: `gdpr:redact`

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | string | User email to redact |

**Response** (204 No Content):
No response body on success.

**Effect**:
- Replaces `external_user_email` with `[REDACTED]`
- Replaces `external_user_name` with `[REDACTED]`
- Replaces `external_user_id` with `[REDACTED-{random}]`
- Redacts `request_body` and `response_body`
- Preserves audit trail: `status`, `organization_id`, `created_at`, etc.

**Example Request**:
```bash
curl -X DELETE "https://api.kaizen.studio/api/lineage/user/user@company.com" \
  -H "Authorization: Bearer sk_live_..."
```

**Before Redaction**:
```json
{
  "id": "inv-abc123",
  "external_user_email": "user@company.com",
  "external_user_name": "Jane Smith",
  "status": "success",
  "organization_id": "org-456"
}
```

**After Redaction**:
```json
{
  "id": "inv-abc123",
  "external_user_email": "[REDACTED]",
  "external_user_name": "[REDACTED]",
  "external_user_id": "[REDACTED-a1b2c3d4]",
  "status": "success",
  "organization_id": "org-456"
}
```

---

## Error Responses

All endpoints may return these error responses:

**400 Bad Request**:
```json
{
  "detail": "Either workflow_id or external_agent_id must be provided"
}
```

**401 Unauthorized**:
```json
{
  "detail": "Invalid or missing authentication credentials"
}
```

**403 Forbidden**:
```json
{
  "detail": "Access denied to this lineage record"
}
```

**404 Not Found**:
```json
{
  "detail": "Lineage record inv-abc123 not found"
}
```

**500 Internal Server Error**:
```json
{
  "detail": "Failed to list lineages: {error_message}"
}
```

---

## Rate Limits

All lineage API endpoints are subject to rate limiting:
- **Standard**: 1000 requests/minute per API key
- **Export**: 100 requests/hour per API key (to prevent abuse)
- **GDPR Redact**: 10 requests/hour per API key (to prevent accidental mass deletion)

---

## Examples

### Query User's Invocation History

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.get(
        "https://api.kaizen.studio/api/lineage",
        headers={"Authorization": "Bearer sk_live_..."},
        params={
            "external_user_email": "user@company.com",
            "page": 1,
            "limit": 50,
        },
    )
    lineages = response.json()
    print(f"Total invocations: {lineages['total']}")
```

### Generate Lineage Graph

```python
async with httpx.AsyncClient() as client:
    response = await client.get(
        "https://api.kaizen.studio/api/lineage/graph",
        headers={"Authorization": "Bearer sk_live_..."},
        params={"external_agent_id": "agent-123"},
    )
    graph = response.json()
    print(f"Nodes: {len(graph['nodes'])}, Edges: {len(graph['edges'])}")
```

### Export for Compliance

```python
async with httpx.AsyncClient() as client:
    response = await client.get(
        "https://api.kaizen.studio/api/lineage/export",
        headers={"Authorization": "Bearer sk_live_..."},
        params={
            "format": "csv",
            "external_user_email": "user@company.com",
        },
    )
    csv_data = response.text
    with open("user_data_export.csv", "w") as f:
        f.write(csv_data)
```

### GDPR Data Erasure

```python
async with httpx.AsyncClient() as client:
    response = await client.delete(
        "https://api.kaizen.studio/api/lineage/user/user@company.com",
        headers={"Authorization": "Bearer sk_live_..."},
    )
    assert response.status_code == 204
    print("User data redacted successfully")
```

---

## Related Documentation

- [Authentication Lineage Integration](auth-lineage.md)
- [External Agent Wrapper](../06-gateways/external-agent-wrapper.md)
- [API Authentication](../02-authentication/api-keys.md)
