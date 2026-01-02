# Authentication Lineage Integration

**Status**: Implemented (Phase 2 - TODO-024)
**Version**: v1.0.0
**Date**: 2025-12-20

---

## Overview

Authentication Lineage provides **end-to-end traceability** of external agent invocations, capturing the complete chain: **external user → external system → Kaizen → external agent**.

This system satisfies enterprise compliance requirements (SOC2, GDPR, HIPAA) while providing operational visibility and cost attribution for external agent governance.

---

## Architecture

### Identity Layers

The lineage system captures **5 identity layers** for every external agent invocation:

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: External User Identity                                 │
│  - external_user_id: "user@company.com"                         │
│  - external_user_email: "user@company.com"                      │
│  - external_user_name: "Jane Smith" (optional)                  │
│  - external_user_role: "Sales Manager" (from external system)   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: External System Identity                               │
│  - external_system: "copilot" (enum)                            │
│  - external_session_id: "copilot-session-xyz789"                │
│  - external_trace_id: "trace-abc123" (optional parent)          │
│  - external_context: {"role": "Sales Manager", ...} (JSON)      │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: Kaizen Authentication                                  │
│  - api_key_id: "key-789"                                        │
│  - api_key_prefix: "sk_live_a1b2c3d4"                           │
│  - organization_id: "org-456"                                   │
│  - team_id: "team-012" (if scoped)                              │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: External Agent                                         │
│  - external_agent_id: "agent-123"                               │
│  - external_agent_name: "Sales Analytics Bot"                   │
│  - external_agent_endpoint: "https://copilot.microsoft.com/..." │
│  - external_agent_version: "v2.1.0" (optional)                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 5: Invocation Identity (Generated)                        │
│  - invocation_id: "inv-def456" (UUID)                           │
│  - trace_id: "otel-trace-ghi789" (OpenTelemetry)                │
│  - span_id: "otel-span-jkl012" (OpenTelemetry)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### InvocationLineage

The `InvocationLineage` model captures complete audit trail for external agent invocations.

**DataFlow Model** (`studio/models/invocation_lineage.py`):

```python
@db.model
class InvocationLineage:
    """Invocation lineage for external agent governance."""

    # Primary Key
    id: str  # invocation_id (e.g., "inv-def456")

    # Layer 1: External User Identity
    external_user_id: str
    external_user_email: str
    external_user_name: Optional[str]
    external_user_role: Optional[str]

    # Layer 2: External System Identity
    external_system: str  # Enum: copilot, custom, zapier, etc.
    external_session_id: str
    external_trace_id: Optional[str]
    external_context: Optional[str]  # JSON

    # Layer 3: Kaizen Authentication
    api_key_id: str
    api_key_prefix: str
    organization_id: str
    team_id: Optional[str]

    # Layer 4: External Agent
    external_agent_id: str
    external_agent_name: str
    external_agent_endpoint: str
    external_agent_version: Optional[str]

    # Layer 5: Invocation Metadata
    trace_id: str  # OpenTelemetry
    span_id: str
    parent_trace_id: Optional[str]

    # Request Context
    ip_address: str
    user_agent: str
    request_timestamp: str  # ISO 8601
    request_headers: Optional[str]  # JSON (sanitized)
    request_body: Optional[str]  # JSON (sanitized)

    # Execution Results
    status: str  # pending, success, failure, timeout, etc.
    response_timestamp: Optional[str]
    duration_ms: Optional[int]

    # Cost Attribution
    cost_usd: Optional[float]
    input_tokens: Optional[int]
    output_tokens: Optional[int]
    api_calls_count: Optional[int]

    # Error Handling
    error_type: Optional[str]
    error_message: Optional[str]
    error_stacktrace: Optional[str]

    # Response Data
    response_status_code: Optional[int]
    response_headers: Optional[str]  # JSON
    response_body: Optional[str]  # JSON (sanitized)

    # Governance Decisions
    budget_checked: bool
    budget_remaining_before: Optional[float]
    budget_remaining_after: Optional[float]
    approval_required: bool
    approval_status: Optional[str]
    approval_id: Optional[str]

    # Timestamps
    created_at: str
    updated_at: Optional[str]
```

**DataFlow Auto-Generated Nodes**:
- `InvocationLineageCreateNode`
- `InvocationLineageReadNode`
- `InvocationLineageUpdateNode`
- `InvocationLineageListNode`
- ... (11 nodes total)

---

## API Integration

### Required Headers

External agent invocations **must** include these headers for lineage tracking:

```http
POST /api/external-agents/{agent_id}/invoke
Authorization: Bearer {api_key}
X-External-User-ID: user@company.com
X-External-User-Email: user@company.com
X-External-System: copilot
X-External-Session-ID: copilot-session-xyz789

# Optional Headers
X-External-User-Name: Jane Smith
X-External-Trace-ID: parent-trace-abc123
X-External-Context: {"role": "Sales Manager", "tenant": "acme-corp"}
```

### Middleware Flow

1. **LineageMiddleware** extracts `X-External-*` headers from request
2. **ExternalAgentService.invoke()** creates lineage record before invocation
3. HTTP request to external agent endpoint
4. **LineageService.update_lineage_result()** updates record with results

### Example Request/Response

**Request**:
```http
POST /api/external-agents/agent-123/invoke
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

**Response**:
```http
HTTP/1.1 200 OK
X-Kaizen-Invocation-ID: inv-def456
X-Kaizen-Trace-ID: otel-trace-ghi789
X-Kaizen-Cost-USD: 0.0456
X-Kaizen-Duration-MS: 1234

{
  "invocation_id": "inv-def456",
  "trace_id": "otel-trace-ghi789",
  "status": "success",
  "output": {
    "analysis": "Q4 EMEA sales increased 15% YoY..."
  },
  "metadata": {
    "duration_ms": 1234,
    "cost_usd": 0.0456
  }
}
```

---

## Query Capabilities

### Operational Queries

```python
# 1. Show all invocations by external user
lineages = await lineage_service.list_lineages(
    filters={
        "external_user_id": "user@company.com",
    },
    page=1,
    limit=100,
)

# 2. Show invocations for specific agent
lineages = await lineage_service.list_lineages(
    filters={
        "external_agent_id": "agent-123",
        "status": "success",
    },
    page=1,
    limit=100,
)

# 3. Calculate cost by user (requires custom aggregation)
# This would be implemented as a custom query method
```

### Compliance Queries

```python
# GDPR Data Subject Access Request
lineages = await lineage_service.list_lineages(
    filters={"external_user_email": "user@company.com"},
    page=1,
    limit=10000,
)

# Export to CSV for compliance officer
csv_data = await lineage_service.export_lineage(
    filters={"external_user_email": "user@company.com"},
    format="csv",
)

# GDPR Right to Erasure
redacted_count = await lineage_service.redact_user_data("user@company.com")
# Replaces PII with [REDACTED] while preserving audit trail
```

---

## Compliance Support

### GDPR Compliance

**Article 15 - Right of Access**:
```python
# Export all user data
lineages = await lineage_service.list_lineages(
    filters={"external_user_email": "user@company.com"}
)
```

**Article 17 - Right to Erasure**:
```python
# Redact PII while preserving audit trail
redacted = await lineage_service.redact_user_data("user@company.com")
# Result: email/name/id → [REDACTED], but status/timestamps preserved
```

### SOC2 Compliance

**CC6.1 - Logical and Physical Access Controls**:
- Complete audit trail of who accessed what, when, from where
- IP address, user agent, timestamps captured

**CC7.2 - System Monitoring**:
- Real-time lineage tracking
- Performance metrics (duration, cost)
- Error tracking and alerting

### HIPAA Compliance

**164.312(b) - Audit Controls**:
- Comprehensive logging of PHI access
- User identity, timestamp, access context

**164.308(a)(4) - Information Access Management**:
- Minimum necessary access principle
- Role-based access captured in `external_user_role`

---

## Performance Considerations

### Lineage Creation Overhead

**Target**: < 50ms per invocation

**Optimization Strategies**:
1. **Async Creation**: Lineage record created asynchronously
2. **Batch Writes**: DataFlow uses batch operations where possible
3. **Index Optimization**: Database indexes on key query fields:
   - `organization_id`
   - `external_user_email`
   - `external_agent_id`
   - `status`
   - `request_timestamp`

### Storage Considerations

**Retention Policy**: 90 days (configurable)

**Archival Strategy**:
- Cold storage after 30 days
- Compression for archived data
- GDPR-compliant deletion after retention period

---

## Security

### PII Protection

**Sanitization at Ingestion**:
```python
# Authorization and X-API-Key headers are removed
sanitized_headers = {
    k: v for k, v in request_headers.items()
    if k.lower() not in ["authorization", "x-api-key"]
}
```

**Encryption at Rest**:
- Database column encryption for `request_body` and `response_body`
- Transparent data encryption (TDE) at database level

**GDPR Erasure**:
```python
# Redacts PII but preserves audit trail
{
    "external_user_email": "[REDACTED]",
    "external_user_name": "[REDACTED]",
    "external_user_id": "[REDACTED-a1b2c3d4]",
    "request_body": "[REDACTED]",
    "response_body": "[REDACTED]",
    # Preserved for compliance:
    "status": "success",
    "organization_id": "org-456",
    "created_at": "2025-12-20T10:30:45.123Z",
}
```

---

## API Reference

See [Lineage API Documentation](lineage-api.md) for complete API reference.

---

## Related Documentation

- [External Agent Wrapper](../06-gateways/external-agent-wrapper.md)
- [Governance Features](../06-gateways/external-agent-governance.md)
- [Lineage API Reference](lineage-api.md)
- [ObservabilityManager](/Users/esperie/repos/dev/kailash_kaizen/apps/kailash-kaizen/src/kaizen/core/autonomy/observability/manager.py)
