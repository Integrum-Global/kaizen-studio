# Authentication Lineage Integration

**Date**: 2025-12-20
**Status**: Planning
**Priority**: P0 (Critical for External Agent Governance)
**Effort**: 2-3 days

---

## Executive Summary

This document defines the **Authentication Lineage** system for Kaizen Studio's External Agent feature. Authentication Lineage provides end-to-end traceability of external agent invocations, capturing WHO invoked WHAT, WHEN, WHERE, and WHY throughout the entire call chain.

The system extends Kaizen Studio's existing observability infrastructure (ObservabilityManager, AuditService) to create immutable audit trails that satisfy enterprise compliance requirements (SOC2, GDPR, HIPAA) while enabling operational visibility and cost attribution.

---

## Problem Statement

### Current State

Kaizen Studio tracks Kaizen-native agent executions through:
- **AuditLog**: Action-based audit trail (create, deploy, execute)
- **ExecutionMetric**: Performance metrics (latency, tokens, costs)
- **ObservabilityManager**: Distributed tracing via OpenTelemetry

### Gap

When **external agents** (built in Microsoft Copilot, custom platforms, third-party tools) invoke Kaizen-wrapped agents, we lose critical context:

```
External User (user@company.com in Copilot)
       │
       ▼
Microsoft Copilot (external system)
       │
       ▼
Kaizen API (authenticated with API key "sk_live_a1b2c3d4...")
       │
       ▼
External Agent Wrapper (agent-123)
       │
       ▼
External Agent Execution (Copilot agent invocation)
       │
       ▼
Response
```

**Missing Data**:
- External user identity (user@company.com) not captured
- External system context (Copilot session, role) not linked
- Cost attribution unclear (which user incurred the cost?)
- Compliance audit trail incomplete (can't prove access controls)

### Requirements

1. **Full Lineage Chain**: Trace from external user → external system → Kaizen → external agent → response
2. **Identity Propagation**: Preserve ALL identities throughout the chain
3. **Context Capture**: Record external system context, Kaizen context, request metadata
4. **Compliance**: Meet SOC2, GDPR, HIPAA audit requirements
5. **Query Capabilities**: Support operational and compliance queries
6. **Cost Attribution**: Link costs to external users and organizations

---

## Architecture

### Lineage Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SYSTEM LAYER                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  External User: user@company.com                                          │
│  External System: Microsoft Copilot                                       │
│  External Session: copilot-session-xyz789                                 │
│  External Role: Sales Manager                                             │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │  Copilot Agent Invocation                                        │     │
│  │  - Intent: "Analyze Q4 sales data"                               │     │
│  │  - Context: customer_segment=enterprise, region=EMEA             │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                                 │                                         │
│                                 ▼                                         │
│         HTTP POST /v1/external-agents/agent-123/invoke                    │
│         Headers:                                                          │
│           Authorization: Bearer sk_live_a1b2c3d4...                       │
│           X-External-User-ID: user@company.com                            │
│           X-External-User-Email: user@company.com                         │
│           X-External-System: copilot                                      │
│           X-External-Session-ID: copilot-session-xyz789                   │
│           X-External-Trace-ID: trace-abc123 (optional)                    │
│           X-External-Context: {"role": "Sales Manager", ...}              │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        KAIZEN GOVERNANCE LAYER                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  1. Authentication & Identity Resolution                           │  │
│  │     - Validate API key: sk_live_a1b2c3d4                           │  │
│  │     - Resolve org_id: org-456                                      │  │
│  │     - Extract external user: user@company.com                      │  │
│  │     - Extract external system: copilot                             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                 │                                         │
│                                 ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  2. Lineage Record Creation                                        │  │
│  │     - Generate invocation_id: inv-def456                           │  │
│  │     - Create InvocationLineage record                              │  │
│  │     - Link to parent trace_id (if provided)                        │  │
│  │     - Capture request metadata (IP, user-agent, timestamp)         │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                 │                                         │
│                                 ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  3. Budget & Approval Checks                                       │  │
│  │     - Check budget remaining for org/agent                         │  │
│  │     - Validate approval status (if required)                       │  │
│  │     - Enforce rate limits                                          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                 │                                         │
│                                 ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  4. External Agent Invocation                                      │  │
│  │     - Forward to external agent endpoint                           │  │
│  │     - Inject lineage headers (invocation_id, trace_id)             │  │
│  │     - Start observability span (OpenTelemetry)                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                 │                                         │
│                                 ▼                                         │
│                      External Agent Execution                             │
│                      (happens in external platform)                       │
│                                 │                                         │
│                                 ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  5. Response Processing & Lineage Completion                       │  │
│  │     - Capture response (success/failure, outputs)                  │  │
│  │     - Calculate costs (API calls, tokens, duration)                │  │
│  │     - Update InvocationLineage (status, duration, cost)            │  │
│  │     - Create AuditLog entry (external_agent_invoke action)         │  │
│  │     - End observability span                                       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    Return Response to External System
                    (with invocation_id for reference)
```

### Identity Propagation Chain

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          IDENTITY CHAIN                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Layer 1: External User Identity                                        │
│  ─────────────────────────────────────────────────────────────────────  │
│    external_user_id: "user@company.com"                                 │
│    external_user_email: "user@company.com"                              │
│    external_user_name: "Jane Smith" (optional)                          │
│    external_user_role: "Sales Manager" (from external system)           │
│                                                                          │
│  Layer 2: External System Identity                                      │
│  ─────────────────────────────────────────────────────────────────────  │
│    external_system: "copilot" (enum: copilot, custom, zapier, ...)     │
│    external_session_id: "copilot-session-xyz789"                        │
│    external_trace_id: "trace-abc123" (optional, for parent linking)    │
│    external_context: {"tenant": "acme-corp", ...} (JSON)                │
│                                                                          │
│  Layer 3: Kaizen Authentication Identity                                │
│  ─────────────────────────────────────────────────────────────────────  │
│    api_key_id: "key-789"                                                │
│    api_key_prefix: "sk_live_a1b2c3d4"                                   │
│    organization_id: "org-456"                                           │
│    team_id: "team-012" (if scoped to team)                              │
│                                                                          │
│  Layer 4: External Agent Identity                                       │
│  ─────────────────────────────────────────────────────────────────────  │
│    external_agent_id: "agent-123"                                       │
│    external_agent_name: "Sales Analytics Bot"                           │
│    external_agent_endpoint: "https://copilot.microsoft.com/..."         │
│    external_agent_version: "v2.1.0" (optional)                          │
│                                                                          │
│  Layer 5: Invocation Identity (Generated)                               │
│  ─────────────────────────────────────────────────────────────────────  │
│    invocation_id: "inv-def456" (UUID)                                   │
│    trace_id: "otel-trace-ghi789" (OpenTelemetry)                        │
│    span_id: "otel-span-jkl012" (OpenTelemetry)                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

COMBINED AUDIT RECORD:
{
  "invocation_id": "inv-def456",
  "timestamp": "2025-12-20T10:30:45.123Z",

  "external_user": {
    "id": "user@company.com",
    "email": "user@company.com",
    "name": "Jane Smith",
    "role": "Sales Manager"
  },

  "external_system": {
    "name": "copilot",
    "session_id": "copilot-session-xyz789",
    "trace_id": "trace-abc123",
    "context": {"tenant": "acme-corp"}
  },

  "kaizen_auth": {
    "api_key_id": "key-789",
    "api_key_prefix": "sk_live_a1b2c3d4",
    "organization_id": "org-456",
    "team_id": "team-012"
  },

  "external_agent": {
    "id": "agent-123",
    "name": "Sales Analytics Bot",
    "endpoint": "https://copilot.microsoft.com/...",
    "version": "v2.1.0"
  },

  "invocation": {
    "trace_id": "otel-trace-ghi789",
    "span_id": "otel-span-jkl012",
    "ip_address": "203.0.113.42",
    "user_agent": "Microsoft-Copilot/1.0",
    "status": "success",
    "duration_ms": 1234,
    "cost_usd": 0.0456
  }
}
```

---

## Data Model

### InvocationLineage DataFlow Model

```python
"""
InvocationLineage DataFlow Model

Represents a complete lineage record for an external agent invocation.
Captures the full chain: external user → external system → Kaizen → external agent.
"""

from typing import Optional
from studio.models import db

@db.model
class InvocationLineage:
    """
    Invocation lineage model for external agent governance.

    Captures the complete audit trail of an external agent invocation,
    including all identity layers, context, and execution results.

    DataFlow auto-generates 11 nodes:
    - InvocationLineageCreateNode, InvocationLineageReadNode, etc.
    """

    # ===== Primary Key =====
    id: str  # invocation_id (e.g., "inv-def456")

    # ===== External User Identity (Layer 1) =====
    external_user_id: str  # From X-External-User-ID header
    external_user_email: str  # From X-External-User-Email header
    external_user_name: Optional[str] = None  # Optional display name
    external_user_role: Optional[str] = None  # Role in external system

    # ===== External System Identity (Layer 2) =====
    external_system: str  # Enum: "copilot", "custom", "zapier", etc.
    external_session_id: str  # External system session ID
    external_trace_id: Optional[str] = None  # Parent trace ID (if provided)
    external_context: Optional[str] = None  # JSON context from external system

    # ===== Kaizen Authentication (Layer 3) =====
    api_key_id: str  # API key used for authentication
    api_key_prefix: str  # For display (e.g., "sk_live_a1b2c3d4")
    organization_id: str  # Organization context
    team_id: Optional[str] = None  # Team context (if scoped)

    # ===== External Agent (Layer 4) =====
    external_agent_id: str  # External agent being invoked
    external_agent_name: str  # Display name
    external_agent_endpoint: str  # Actual endpoint URL
    external_agent_version: Optional[str] = None  # Version (if tracked)

    # ===== Invocation Metadata (Layer 5) =====
    trace_id: str  # OpenTelemetry trace ID
    span_id: str  # OpenTelemetry span ID
    parent_trace_id: Optional[str] = None  # Link to external_trace_id if provided

    # ===== Request Context =====
    ip_address: str  # Client IP address
    user_agent: str  # Client user agent
    request_timestamp: str  # ISO 8601 timestamp when request started
    request_headers: Optional[str] = None  # JSON of relevant headers
    request_body: Optional[str] = None  # JSON of request body (sanitized)

    # ===== Execution Results =====
    status: str  # Enum: "pending", "success", "failure", "timeout", "budget_exceeded", "approval_required"
    response_timestamp: Optional[str] = None  # ISO 8601 timestamp when response completed
    duration_ms: Optional[int] = None  # Total execution time in milliseconds

    # ===== Cost Attribution =====
    cost_usd: Optional[float] = None  # Total cost incurred (calculated)
    input_tokens: Optional[int] = None  # If applicable
    output_tokens: Optional[int] = None  # If applicable
    api_calls_count: Optional[int] = None  # Number of API calls made

    # ===== Error Handling =====
    error_type: Optional[str] = None  # Error classification
    error_message: Optional[str] = None  # Error details
    error_stacktrace: Optional[str] = None  # Full stacktrace (for debugging)

    # ===== Response Data =====
    response_status_code: Optional[int] = None  # HTTP status code
    response_headers: Optional[str] = None  # JSON of response headers
    response_body: Optional[str] = None  # JSON of response body (sanitized)

    # ===== Governance Decisions =====
    budget_checked: bool = False  # Was budget check performed?
    budget_remaining_before: Optional[float] = None  # Budget before invocation
    budget_remaining_after: Optional[float] = None  # Budget after invocation
    approval_required: bool = False  # Was approval required?
    approval_status: Optional[str] = None  # "pending", "approved", "rejected"
    approval_id: Optional[str] = None  # Link to approval record

    # ===== Timestamps =====
    created_at: str  # Record creation timestamp (ISO 8601)
    updated_at: Optional[str] = None  # Last update timestamp (ISO 8601)
```

### Extended AuditLog Action Type

Add new action type for external agent invocations:

```python
# In AuditService.log()
action: str  # Existing: "create", "read", "update", "delete", "deploy", "login", "logout"
             # NEW: "external_agent_invoke"

# When logging external agent invocations:
await audit_service.log(
    organization_id=lineage.organization_id,
    user_id=lineage.external_user_id,  # External user (not Kaizen user)
    action="external_agent_invoke",
    resource_type="external_agent",
    resource_id=lineage.external_agent_id,
    details={
        "invocation_id": lineage.id,
        "external_system": lineage.external_system,
        "status": lineage.status,
        "duration_ms": lineage.duration_ms,
        "cost_usd": lineage.cost_usd,
    },
    ip_address=lineage.ip_address,
    user_agent=lineage.user_agent,
    status=lineage.status,
    error_message=lineage.error_message,
)
```

---

## Integration with Existing Systems

### 1. ObservabilityManager Integration

Extend ObservabilityManager to support external agent spans:

```python
# In kaizen/core/autonomy/observability/manager.py

class ObservabilityManager:
    """Extended to support external agent tracing."""

    async def create_external_agent_span(
        self,
        invocation_id: str,
        external_agent_id: str,
        external_user_id: str,
        external_system: str,
        parent_trace_id: Optional[str] = None,
    ) -> Span:
        """
        Create OpenTelemetry span for external agent invocation.

        Args:
            invocation_id: Unique invocation ID
            external_agent_id: External agent being invoked
            external_user_id: External user identity
            external_system: External system name
            parent_trace_id: Optional parent trace ID for linking

        Returns:
            OpenTelemetry Span with external agent context
        """
        if not self.tracing:
            return None

        # Create span with external agent context
        span_name = f"external_agent.{external_agent_id}"

        attributes = {
            "invocation_id": invocation_id,
            "external_agent_id": external_agent_id,
            "external_user_id": external_user_id,
            "external_system": external_system,
            "span_type": "external_agent_invocation",
        }

        # Link to parent trace if provided
        if parent_trace_id:
            attributes["parent_trace_id"] = parent_trace_id

        return self.tracing.tracer.start_span(
            span_name,
            attributes=attributes,
        )
```

### 2. AuditService Extension

Add helper method for external agent audit logging:

```python
# In studio/services/audit_service.py

class AuditService:
    """Extended to support external agent invocations."""

    async def log_external_agent_invocation(
        self,
        lineage: InvocationLineage,
    ) -> dict:
        """
        Create audit log for external agent invocation.

        Convenience method that extracts data from InvocationLineage
        and creates standardized audit log entry.

        Args:
            lineage: Complete invocation lineage record

        Returns:
            Created audit log entry
        """
        return await self.log(
            organization_id=lineage.organization_id,
            user_id=lineage.external_user_id,  # External user
            action="external_agent_invoke",
            resource_type="external_agent",
            resource_id=lineage.external_agent_id,
            details={
                "invocation_id": lineage.id,
                "external_system": lineage.external_system,
                "external_session_id": lineage.external_session_id,
                "agent_name": lineage.external_agent_name,
                "status": lineage.status,
                "duration_ms": lineage.duration_ms,
                "cost_usd": lineage.cost_usd,
                "input_tokens": lineage.input_tokens,
                "output_tokens": lineage.output_tokens,
                "budget_checked": lineage.budget_checked,
                "approval_required": lineage.approval_required,
            },
            ip_address=lineage.ip_address,
            user_agent=lineage.user_agent,
            status="success" if lineage.status == "success" else "failure",
            error_message=lineage.error_message,
        )
```

### 3. Tracing Context Propagation

Integrate with OpenTelemetry for distributed tracing:

```python
# In external agent invocation handler

from opentelemetry import trace
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

async def invoke_external_agent(
    external_agent: ExternalAgent,
    lineage: InvocationLineage,
    request_data: dict,
) -> dict:
    """
    Invoke external agent with full tracing context propagation.
    """
    # Create span for invocation
    span = await observability_manager.create_external_agent_span(
        invocation_id=lineage.id,
        external_agent_id=lineage.external_agent_id,
        external_user_id=lineage.external_user_id,
        external_system=lineage.external_system,
        parent_trace_id=lineage.external_trace_id,
    )

    try:
        # Prepare headers with tracing context
        headers = {}

        # Inject OpenTelemetry trace context
        propagator = TraceContextTextMapPropagator()
        propagator.inject(headers, context=trace.set_span_in_context(span))

        # Add Kaizen lineage headers
        headers.update({
            "X-Kaizen-Invocation-ID": lineage.id,
            "X-Kaizen-Trace-ID": lineage.trace_id,
            "X-Kaizen-Organization-ID": lineage.organization_id,
        })

        # Forward to external agent
        response = await http_client.post(
            external_agent.endpoint,
            json=request_data,
            headers=headers,
            timeout=external_agent.timeout_seconds,
        )

        # Update lineage with results
        lineage.status = "success"
        lineage.response_status_code = response.status_code
        lineage.response_body = json.dumps(response.json())
        lineage.duration_ms = calculate_duration(lineage.request_timestamp)

        span.set_status(Status(StatusCode.OK))

        return response.json()

    except Exception as e:
        # Record error in lineage
        lineage.status = "failure"
        lineage.error_type = type(e).__name__
        lineage.error_message = str(e)
        lineage.error_stacktrace = traceback.format_exc()

        span.set_status(Status(StatusCode.ERROR, str(e)))
        span.record_exception(e)

        raise

    finally:
        span.end()

        # Update lineage record
        await update_lineage(lineage)

        # Create audit log entry
        await audit_service.log_external_agent_invocation(lineage)
```

---

## Query Capabilities

### Operational Queries

```python
# 1. Show all invocations by external user
invocations = await list_invocations(
    filter={
        "external_user_id": "user@company.com",
        "request_timestamp": {"$gte": "2025-12-01T00:00:00Z"},
    },
    limit=100,
)

# 2. Show all invocations of specific agent
invocations = await list_invocations(
    filter={
        "external_agent_id": "agent-123",
        "status": "success",
    },
    limit=100,
)

# 3. Show invocations that exceeded budget
invocations = await list_invocations(
    filter={
        "status": "budget_exceeded",
        "organization_id": "org-456",
    },
    limit=100,
)

# 4. Calculate total cost by external user
cost_by_user = await aggregate_invocations(
    pipeline=[
        {"$match": {"organization_id": "org-456"}},
        {
            "$group": {
                "_id": "$external_user_id",
                "total_cost": {"$sum": "$cost_usd"},
                "invocation_count": {"$count": {}},
            }
        },
        {"$sort": {"total_cost": -1}},
    ]
)

# 5. Show slow invocations (P95 latency)
slow_invocations = await list_invocations(
    filter={
        "duration_ms": {"$gte": 5000},  # > 5 seconds
        "status": "success",
    },
    sort={"duration_ms": -1},
    limit=50,
)
```

### Compliance Queries

```python
# 1. Export all invocations for specific user (GDPR Data Subject Access)
user_invocations = await list_invocations(
    filter={"external_user_id": "user@company.com"},
    limit=10000,  # All records
)

# Export to CSV for compliance officer
await export_lineage_to_csv(user_invocations, "user_data_export.csv")

# 2. Audit trail for specific resource (SOC2)
agent_history = await list_invocations(
    filter={
        "external_agent_id": "agent-123",
        "request_timestamp": {
            "$gte": "2025-01-01T00:00:00Z",
            "$lte": "2025-12-31T23:59:59Z",
        },
    },
    limit=10000,
)

# 3. Access log for security incident investigation
incident_logs = await list_invocations(
    filter={
        "ip_address": "203.0.113.42",  # Suspicious IP
        "request_timestamp": {
            "$gte": "2025-12-20T09:00:00Z",
            "$lte": "2025-12-20T11:00:00Z",
        },
    },
)

# 4. Right to erasure (GDPR)
# Mark user data for deletion (soft delete)
await bulk_update_invocations(
    filter={"external_user_id": "user@company.com"},
    update={
        "external_user_email": "[REDACTED]",
        "external_user_name": "[REDACTED]",
        "request_body": "[REDACTED]",
        "response_body": "[REDACTED]",
        "updated_at": datetime.utcnow().isoformat(),
    },
)
```

### Analytics Queries

```python
# 1. Invocation trends over time
trends = await aggregate_invocations(
    pipeline=[
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": {"$toDate": "$request_timestamp"},
                    }
                },
                "total_invocations": {"$count": {}},
                "total_cost": {"$sum": "$cost_usd"},
                "avg_duration_ms": {"$avg": "$duration_ms"},
            }
        },
        {"$sort": {"_id": 1}},
    ]
)

# 2. Top external agents by usage
top_agents = await aggregate_invocations(
    pipeline=[
        {
            "$group": {
                "_id": "$external_agent_id",
                "agent_name": {"$first": "$external_agent_name"},
                "invocation_count": {"$count": {}},
                "total_cost": {"$sum": "$cost_usd"},
            }
        },
        {"$sort": {"invocation_count": -1}},
        {"$limit": 10},
    ]
)

# 3. Error rate by external system
error_rates = await aggregate_invocations(
    pipeline=[
        {
            "$group": {
                "_id": "$external_system",
                "total": {"$count": {}},
                "failures": {
                    "$sum": {"$cond": [{"$eq": ["$status", "failure"]}, 1, 0]}
                },
            }
        },
        {
            "$project": {
                "external_system": "$_id",
                "error_rate": {"$divide": ["$failures", "$total"]},
            }
        },
    ]
)
```

---

## Compliance Implementation

### SOC2 Requirements

**CC6.1 - Logical and Physical Access Controls**

```python
# Access logging with full context
await audit_service.log_external_agent_invocation(lineage)

# Query: "Show all access to production agents"
production_access = await list_invocations(
    filter={
        "external_agent_id": {"$in": production_agent_ids},
        "request_timestamp": {"$gte": audit_period_start},
    }
)
```

**CC7.2 - System Monitoring**

```python
# Continuous monitoring of external agent invocations
alerts = await check_anomalies(
    metric="invocation_count",
    threshold=1000,
    window_minutes=5,
)

# Alert if external agent invocations spike
if alerts:
    await send_alert(
        "External agent invocations exceeded threshold",
        details=alerts,
    )
```

### GDPR Requirements

**Article 15 - Right of Access**

```python
# Data subject access request
async def handle_data_subject_access_request(user_email: str) -> dict:
    """
    Export all data for a specific external user.
    """
    invocations = await list_invocations(
        filter={"external_user_email": user_email},
        limit=10000,
    )

    return {
        "user_email": user_email,
        "invocation_count": len(invocations),
        "total_cost_usd": sum(inv.cost_usd for inv in invocations),
        "invocations": [
            {
                "timestamp": inv.request_timestamp,
                "agent": inv.external_agent_name,
                "status": inv.status,
                "duration_ms": inv.duration_ms,
            }
            for inv in invocations
        ],
    }
```

**Article 17 - Right to Erasure**

```python
# Redact user data while preserving audit trail
async def handle_right_to_erasure(user_email: str):
    """
    Redact personal data for external user.
    Preserves audit trail for compliance but removes PII.
    """
    redacted_count = await bulk_update_invocations(
        filter={"external_user_email": user_email},
        update={
            "external_user_email": "[REDACTED]",
            "external_user_name": "[REDACTED]",
            "external_user_id": f"[REDACTED-{uuid.uuid4().hex[:8]}]",
            "request_body": "[REDACTED]",
            "response_body": "[REDACTED]",
            "updated_at": datetime.utcnow().isoformat(),
        },
    )

    # Log erasure action
    await audit_service.log(
        organization_id="system",
        user_id="gdpr-processor",
        action="data_erasure",
        resource_type="invocation_lineage",
        details={"user_email": user_email, "records_redacted": redacted_count},
    )
```

### HIPAA Requirements

**164.312(b) - Audit Controls**

```python
# Comprehensive audit logging for PHI access
async def log_phi_access(lineage: InvocationLineage):
    """
    Log access to agents that process PHI.
    HIPAA requires: who accessed, what was accessed, when, and from where.
    """
    await audit_service.log(
        organization_id=lineage.organization_id,
        user_id=lineage.external_user_id,
        action="phi_access",
        resource_type="external_agent",
        resource_id=lineage.external_agent_id,
        details={
            "invocation_id": lineage.id,
            "external_system": lineage.external_system,
            "access_timestamp": lineage.request_timestamp,
            "access_ip": lineage.ip_address,
            "data_accessed": "PHI",  # Flag for HIPAA audits
        },
        ip_address=lineage.ip_address,
        user_agent=lineage.user_agent,
    )
```

**164.308(a)(4) - Information Access Management**

```python
# Minimum necessary access principle
async def validate_phi_access(lineage: InvocationLineage) -> bool:
    """
    Validate that user has legitimate access to PHI.
    HIPAA requires "minimum necessary" principle.
    """
    # Check if user role permits PHI access
    user_permissions = await get_user_permissions(
        lineage.external_user_id,
        lineage.organization_id,
    )

    if "phi_access" not in user_permissions:
        lineage.status = "authorization_failed"
        lineage.error_message = "User not authorized for PHI access"
        await audit_service.log_external_agent_invocation(lineage)
        return False

    return True
```

---

## API Design

### Headers Contract

**Required Headers** (for all external agent invocations):

```
Authorization: Bearer {api_key}
X-External-User-ID: {external_user_id}
X-External-User-Email: {external_user_email}
X-External-System: {external_system}
X-External-Session-ID: {external_session_id}
```

**Optional Headers**:

```
X-External-User-Name: {external_user_name}
X-External-Trace-ID: {parent_trace_id}
X-External-Context: {json_context}
```

### Request/Response Examples

**Request**:

```http
POST /v1/external-agents/agent-123/invoke
Host: api.kaizen.studio
Authorization: Bearer sk_live_a1b2c3d4e5f6g7h8
X-External-User-ID: user@company.com
X-External-User-Email: user@company.com
X-External-System: copilot
X-External-Session-ID: copilot-session-xyz789
X-External-Context: {"role": "Sales Manager", "tenant": "acme-corp"}
Content-Type: application/json

{
  "input": "Analyze Q4 sales data for EMEA region",
  "parameters": {
    "customer_segment": "enterprise",
    "region": "EMEA"
  }
}
```

**Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Kaizen-Invocation-ID: inv-def456
X-Kaizen-Trace-ID: otel-trace-ghi789
X-Kaizen-Cost-USD: 0.0456
X-Kaizen-Duration-MS: 1234

{
  "invocation_id": "inv-def456",
  "status": "success",
  "output": {
    "analysis": "Q4 EMEA sales increased 15% YoY...",
    "charts": [...]
  },
  "metadata": {
    "duration_ms": 1234,
    "cost_usd": 0.0456,
    "tokens_used": 456
  }
}
```

---

## Implementation Checklist

### Phase 1: Data Model (Day 1)

- [ ] Create `InvocationLineage` DataFlow model
- [ ] Add database migration for new table
- [ ] Add `external_agent_invoke` action to AuditLog enum
- [ ] Write unit tests for model validation

### Phase 2: Core Service (Day 1-2)

- [ ] Create `LineageService` for CRUD operations
- [ ] Implement lineage record creation from request headers
- [ ] Add helper methods for common queries
- [ ] Write integration tests with real database

### Phase 3: Observability Integration (Day 2)

- [ ] Extend `ObservabilityManager` with `create_external_agent_span()`
- [ ] Implement OpenTelemetry context propagation
- [ ] Add lineage headers to external agent requests
- [ ] Write tests for tracing integration

### Phase 4: Audit Integration (Day 2-3)

- [ ] Add `log_external_agent_invocation()` to `AuditService`
- [ ] Implement dual-write pattern (lineage + audit)
- [ ] Add query helpers for compliance reports
- [ ] Write tests for audit trail completeness

### Phase 5: API Endpoints (Day 3)

- [ ] Add lineage query endpoints (`GET /v1/lineage`)
- [ ] Add export endpoints for compliance (`GET /v1/lineage/export`)
- [ ] Add GDPR erasure endpoint (`DELETE /v1/lineage/user/{email}`)
- [ ] Write E2E tests for API

### Phase 6: Documentation & Testing (Day 3)

- [ ] Write API documentation (OpenAPI spec)
- [ ] Create compliance query cookbook
- [ ] Add monitoring dashboards (Grafana)
- [ ] Performance testing (10K invocations/min)

---

## Success Criteria

- [ ] **100% lineage capture**: Every external agent invocation creates lineage record
- [ ] **Complete identity chain**: All 5 layers captured and queryable
- [ ] **Compliance ready**: SOC2, GDPR, HIPAA query examples working
- [ ] **Performance**: < 10ms overhead per invocation for lineage creation
- [ ] **Query performance**: < 100ms for typical operational queries
- [ ] **Export performance**: < 5 seconds for 10K record exports
- [ ] **Data retention**: 90-day retention policy configurable
- [ ] **Tracing integration**: OpenTelemetry spans visible in Jaeger

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Performance overhead** | High | Medium | Async lineage creation, batch writes, index optimization |
| **Storage costs** | Medium | High | Data retention policies, archival to cold storage |
| **PII leakage** | High | Low | Sanitization at ingestion, encryption at rest, GDPR erasure |
| **Query performance degradation** | Medium | Medium | Database indexes on key fields, query result caching |
| **External system integration breakage** | High | Low | Robust header extraction, graceful degradation if headers missing |

---

## Future Enhancements

1. **Real-time lineage streaming**: Stream lineage to Kafka for real-time analytics
2. **Lineage visualization**: Build UI for visual lineage exploration
3. **Anomaly detection**: ML-based anomaly detection on lineage patterns
4. **Cross-system correlation**: Link Kaizen lineage with external system logs
5. **Blockchain anchoring**: Anchor audit hashes to blockchain for immutability proof

---

## References

- [External Agent Wrapper](01-external-agent-wrapper.md)
- [Governance Features](04-governance-features.md)
- [Kaizen ObservabilityManager](/Users/esperie/repos/dev/kailash_kaizen/apps/kailash-kaizen/src/kaizen/core/autonomy/observability/manager.py)
- [Studio AuditService](/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/src/studio/services/audit_service.py)
- [OpenTelemetry Context Propagation](https://opentelemetry.io/docs/instrumentation/python/manual/#context-propagation)
- [SOC2 Trust Principles](https://www.aicpa.org/soc2)
- [GDPR Articles 15 & 17](https://gdpr-info.eu/)
- [HIPAA 164.312 Audit Controls](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
