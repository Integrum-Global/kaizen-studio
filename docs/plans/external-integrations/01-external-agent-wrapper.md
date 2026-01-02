# External Agent Wrapper: Technical Design Document

**Date**: 2025-12-20
**Status**: Design Phase
**Owner**: Platform Team
**Pillar**: GOVERN

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Architecture](#solution-architecture)
3. [Data Models](#data-models)
4. [Proxy Flow](#proxy-flow)
5. [External Agent Types](#external-agent-types)
6. [Governance Features](#governance-features)
7. [Security Considerations](#security-considerations)
8. [API Design](#api-design)
9. [Implementation Phases](#implementation-phases)
10. [Testing Strategy](#testing-strategy)
11. [Decision Records](#decision-records)

---

## Problem Statement

### Business Context

Enterprises today operate in a **multi-platform AI landscape**:

- **Existing Investments**: Teams have already built agents in Microsoft Copilot Studio, Azure OpenAI Service, custom platforms, or third-party tools
- **Compliance Requirements**: SOC2, GDPR, HIPAA mandates require full audit trails, access controls, and budget enforcement
- **Governance Gap**: External agents operate in silos without centralized visibility, budget controls, or approval workflows
- **Migration Friction**: Moving existing agents to new platforms is expensive and risky

### Technical Challenge

How can enterprises enforce governance policies (authentication, authorization, budgets, approvals, audit trails) on agents they don't control?

**Without this feature**:
```
User → MS Copilot Agent (direct invocation)
  ❌ No authentication lineage
  ❌ No budget enforcement
  ❌ No approval workflows
  ❌ No audit trail
  ❌ No rate limiting
```

**With External Agent Wrapper**:
```
User → Kaizen Governance Layer → MS Copilot Agent
  ✅ Full authentication lineage
  ✅ Budget enforcement before execution
  ✅ Approval workflows for sensitive ops
  ✅ Complete audit trail
  ✅ Rate limiting and cost controls
```

### Success Criteria

| Metric | Target |
|--------|--------|
| Latency overhead | <100ms (p95) |
| Governance coverage | 100% of external invocations |
| Budget violation prevention | 95%+ caught before execution |
| Audit trail completeness | 100% compliance-ready |
| Supported platforms | 5+ (Copilot, Azure, custom, etc.) |

---

## Solution Architecture

### High-Level Design

The External Agent Wrapper acts as a **transparent proxy** that intercepts all invocations to external agents and applies Kaizen's governance layer.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KAIZEN STUDIO                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  External Agent Registry                                        │    │
│  │  - Register external agents (Copilot, custom, etc.)            │    │
│  │  - Store endpoint URLs, auth configs, policies                 │    │
│  │  - Assign budgets, rate limits, approval requirements          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Governance Proxy Layer                                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │    │
│  │  │   Auth   │  │  Budget  │  │ Approval │  │  Audit   │       │    │
│  │  │ Enforcer │  │ Enforcer │  │ Workflow │  │ Logger   │       │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │    │
│  │                                                                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │    │
│  │  │   Rate   │  │  Policy  │  │  Metric  │                     │    │
│  │  │  Limit   │  │  Engine  │  │Collector │                     │    │
│  │  └──────────┘  └──────────┘  └──────────┘                     │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  External Agent Proxy Service                                   │    │
│  │  - Forward requests to external endpoints                       │    │
│  │  - Attach governance context (lineage, trace IDs)              │    │
│  │  - Handle auth token injection (OAuth, API keys)               │    │
│  │  - Transform request/response formats                          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
         ┌─────────────────────────────────────────┐
         │    EXTERNAL AGENT PLATFORMS              │
         ├─────────────────────────────────────────┤
         │  - Microsoft Copilot Studio             │
         │  - Azure OpenAI Service                 │
         │  - Custom HTTP/REST agents              │
         │  - Third-party platforms                │
         └─────────────────────────────────────────┘
```

### Design Principles

1. **Transparency**: External agents don't know they're wrapped (zero code changes required)
2. **Fail-Safe**: Governance violations prevent execution (deny-by-default)
3. **Full Lineage**: Every invocation captures WHO, WHAT, WHEN, WHERE, WHY, RESULT
4. **Leverage Existing**: Use Kaizen's existing PolicyEngine, BudgetEnforcer, AuditService
5. **Extensible**: Support new external platforms via adapter pattern

---

## Data Models

### ExternalAgentRegistration Model

Represents an external agent registered in Kaizen Studio for governance.

```python
"""
External Agent Registration Model

Represents external agents (MS Copilot, custom, etc.) registered for governance.
"""

from typing import Optional
from studio.models import db


@db.model
class ExternalAgentRegistration:
    """
    External agent registration for governance wrapping.

    DataFlow generates these nodes automatically:
    - ExternalAgentRegistrationCreateNode
    - ExternalAgentRegistrationReadNode
    - ExternalAgentRegistrationUpdateNode
    - ExternalAgentRegistrationDeleteNode
    - ExternalAgentRegistrationListNode
    - ExternalAgentRegistrationCountNode
    - ExternalAgentRegistrationUpsertNode
    - ExternalAgentRegistrationBulkCreateNode
    - ExternalAgentRegistrationBulkUpdateNode
    - ExternalAgentRegistrationBulkDeleteNode
    - ExternalAgentRegistrationBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization and workspace reference
    organization_id: str
    workspace_id: str

    # Agent identification
    name: str
    description: Optional[str]

    # External platform type
    # Enum: "copilot_studio", "azure_openai", "custom_http", "langchain_agent", "other"
    platform_type: str

    # External endpoint configuration
    endpoint_url: str  # Base URL for the external agent
    endpoint_method: str  # HTTP method (POST, GET, etc.)
    endpoint_headers: Optional[str]  # JSON string of custom headers

    # Authentication configuration
    # JSON string with auth details (encrypted at rest)
    # Format depends on auth_type:
    # - "api_key": {"header": "X-API-Key", "key": "encrypted_value"}
    # - "oauth2": {"token_url": "...", "client_id": "...", "client_secret": "encrypted"}
    # - "bearer_token": {"token": "encrypted_value"}
    # - "basic": {"username": "...", "password": "encrypted"}
    auth_type: str  # Enum: "api_key", "oauth2", "bearer_token", "basic", "none"
    auth_config: Optional[str]  # JSON string (encrypted fields)

    # Request/response transformation
    # JSON strings defining how to transform request/response
    request_template: Optional[str]  # Jinja2 template for request body
    response_mapping: Optional[str]  # JSONPath mapping for response extraction

    # Governance configuration
    budget_limit_daily: Optional[float]  # Daily budget limit in USD (-1 = unlimited)
    budget_limit_monthly: Optional[float]  # Monthly budget limit in USD
    rate_limit_per_minute: Optional[int]  # Max invocations per minute
    rate_limit_per_hour: Optional[int]  # Max invocations per hour

    # Approval requirements
    requires_approval: bool  # If true, invocations require pre-approval
    approval_policy_id: Optional[str]  # Reference to Policy model

    # Allowed callers (for access control)
    # JSON array of {"type": "user|team|role", "id": "..."}
    allowed_callers: Optional[str]

    # Status and metadata
    status: str  # Enum: "active", "inactive", "suspended"
    tags: Optional[str]  # JSON array of tags for categorization

    # Audit fields
    created_by: str
    updated_by: Optional[str]

    # Timestamps
    created_at: str
    updated_at: str
```

**Key Design Decisions**:

- **Encrypted Auth Config**: Sensitive credentials (API keys, OAuth secrets) are encrypted at rest using Kaizen's credential encryption service
- **Budget Limits**: Stored as float to support fractional currency units
- **Rate Limits**: Dual limits (per-minute and per-hour) for granular control
- **Platform Type**: Enum for common platforms, with "custom_http" for flexibility
- **Request/Response Templates**: Jinja2 for request transformation, JSONPath for response mapping

### ExternalAgentInvocation Model

Tracks each invocation of an external agent through the governance layer.

```python
"""
External Agent Invocation Model

Records each invocation of an external agent for audit and analytics.
"""

from typing import Optional
from studio.models import db


@db.model
class ExternalAgentInvocation:
    """
    External agent invocation tracking.

    Captures full lineage for compliance and debugging.

    DataFlow generates 11 nodes automatically.
    """

    # Primary key
    id: str

    # References
    organization_id: str
    external_agent_id: str  # FK to ExternalAgentRegistration
    user_id: str  # Who invoked the agent
    api_key_id: Optional[str]  # If invoked via API key

    # Request context
    request_method: str  # HTTP method used
    request_headers: Optional[str]  # JSON string of request headers (sanitized)
    request_body: Optional[str]  # JSON string of request payload
    request_ip: Optional[str]  # Client IP address
    request_user_agent: Optional[str]  # Client user agent

    # Response context
    response_status_code: Optional[int]  # HTTP status code from external agent
    response_headers: Optional[str]  # JSON string of response headers
    response_body: Optional[str]  # JSON string of response payload
    response_time_ms: Optional[int]  # Response time in milliseconds

    # Governance decisions
    auth_passed: bool  # Authentication check result
    budget_passed: bool  # Budget check result
    rate_limit_passed: bool  # Rate limit check result
    policy_passed: bool  # Policy evaluation result
    approval_required: bool  # If approval was required
    approval_granted: Optional[bool]  # If approval was granted (null if not required)
    approval_id: Optional[str]  # Reference to approval record

    # Execution metadata
    execution_status: str  # Enum: "pending", "approved", "executing", "success", "failed", "rejected"
    error_message: Optional[str]  # Error details if failed
    trace_id: str  # Unique trace ID for distributed tracing
    parent_trace_id: Optional[str]  # Parent trace if part of larger workflow

    # Cost tracking
    estimated_cost: Optional[float]  # Estimated cost in USD (if computable)
    actual_cost: Optional[float]  # Actual cost from external platform (if available)

    # Timestamps
    invoked_at: str  # When invocation was initiated
    completed_at: Optional[str]  # When invocation completed
    created_at: str
```

**Key Design Decisions**:

- **Full Request/Response Capture**: Store sanitized request/response for compliance audits (PII redaction applied)
- **Governance Checkpoints**: Boolean flags for each governance gate (auth, budget, rate limit, policy)
- **Trace IDs**: Support distributed tracing for debugging multi-agent workflows
- **Cost Tracking**: Estimated cost (from budgets) vs. actual cost (from external platform billing APIs)
- **Execution Status**: State machine for tracking invocation lifecycle

### Reuse Existing Models

The External Agent Wrapper **reuses existing Kaizen models** for governance:

| Model | Purpose | Usage |
|-------|---------|-------|
| **APIKey** | Authentication | External callers use API keys with scopes: `external_agent:invoke` |
| **Policy** | Authorization | ABAC policies for `resource_type: "external_agent"`, `action: "invoke"` |
| **AuditLog** | Audit Trail | Log all governance decisions and invocations |
| **UsageQuota** | Budget Tracking | Track spend per org with `resource_type: "external_agent_invocation"` |
| **UsageRecord** | Cost Recording | Record actual costs from external platforms |
| **RateLimit** | Rate Limiting | Per-agent rate limits (reuse existing service) |

**Decision Rationale**: Avoid creating parallel systems. Extend existing infrastructure with new resource types and scopes.

---

## Proxy Flow

### Step-by-Step Invocation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: EXTERNAL CALLER → KAIZEN PROXY                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  POST /api/v1/external-agents/{agent_id}/invoke                         │
│  Authorization: Bearer sk_live_abc123...                                │
│  Content-Type: application/json                                         │
│  X-Trace-ID: trace_xyz789                                               │
│                                                                          │
│  {                                                                       │
│    "input": "What is the weather in San Francisco?",                    │
│    "context": {"user_session": "session_456"},                          │
│    "metadata": {"source": "slack_bot"}                                  │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: AUTHENTICATION (API Key Service)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Extract API key from Authorization header                           │
│  2. Validate key via APIKeyService.validate(key)                        │
│  3. Check scopes: must include "external_agent:invoke"                  │
│  4. Extract org_id, user_id from API key metadata                       │
│  5. Create invocation record (status: "pending")                        │
│                                                                          │
│  ✅ PASS → Continue to authorization                                    │
│  ❌ FAIL → Return 401 Unauthorized                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: AUTHORIZATION (ABAC Policy Engine)                             │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Load ExternalAgentRegistration by agent_id                          │
│  2. Verify caller is in allowed_callers list                            │
│  3. Evaluate ABAC policies:                                             │
│     - resource_type: "external_agent"                                   │
│     - action: "invoke"                                                  │
│     - resource: {id, platform_type, tags}                               │
│     - context: {user_id, org_id, time, ip}                              │
│  4. Update invocation: auth_passed, policy_passed                       │
│                                                                          │
│  ✅ PASS → Continue to budget check                                     │
│  ❌ FAIL → Return 403 Forbidden, log to AuditLog                        │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: BUDGET ENFORCEMENT (Billing Service)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Get budget limits from ExternalAgentRegistration                    │
│  2. Query UsageRecord for daily/monthly spend                           │
│  3. Estimate invocation cost (if estimator available)                   │
│  4. Check: current_spend + estimated_cost <= limit                      │
│  5. Update invocation: budget_passed, estimated_cost                    │
│                                                                          │
│  ✅ PASS → Continue to rate limiting                                    │
│  ❌ FAIL → Return 429 Budget Exceeded, log to AuditLog                  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5: RATE LIMITING (Rate Limit Service)                             │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Get rate limits from ExternalAgentRegistration                      │
│  2. Check invocations in last minute/hour (from cache/DB)               │
│  3. Verify: count < limit for both windows                              │
│  4. Update invocation: rate_limit_passed                                │
│                                                                          │
│  ✅ PASS → Continue to approval check                                   │
│  ❌ FAIL → Return 429 Rate Limit Exceeded, log to AuditLog              │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6: APPROVAL WORKFLOW (if required)                                │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Check: ExternalAgentRegistration.requires_approval                  │
│  2. If true:                                                            │
│     a. Create approval request (via ApprovalService)                    │
│     b. Notify approvers (via WebhookService)                            │
│     c. Update invocation: approval_required=true, status="awaiting"     │
│     d. Return 202 Accepted with approval_id                             │
│     e. Wait for approval (async webhook callback)                       │
│  3. If false or approved:                                               │
│     - Update invocation: approval_granted=true/null                     │
│     - Continue to execution                                             │
│                                                                          │
│  ✅ APPROVED → Continue to external execution                           │
│  ❌ REJECTED → Return 403 Approval Denied, log to AuditLog              │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 7: EXTERNAL AGENT EXECUTION (Proxy Service)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Load auth_config from ExternalAgentRegistration (decrypt)           │
│  2. Transform request using request_template (Jinja2)                   │
│  3. Inject auth headers (API key, OAuth token, etc.)                    │
│  4. Add governance context headers:                                     │
│     - X-Kaizen-Trace-ID: {trace_id}                                     │
│     - X-Kaizen-Org-ID: {org_id}                                         │
│     - X-Kaizen-User-ID: {user_id}                                       │
│  5. Send HTTP request to external agent endpoint                        │
│  6. Capture response (status, headers, body, time)                      │
│  7. Update invocation: status="executing" → "success"/"failed"          │
│                                                                          │
│  ✅ SUCCESS → Continue to response processing                           │
│  ❌ FAILURE → Log error, return 502 Bad Gateway                         │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 8: RESPONSE PROCESSING & AUDIT                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Transform response using response_mapping (JSONPath)                │
│  2. Extract actual cost (if available in response headers)              │
│  3. Record usage:                                                       │
│     - BillingService.record_usage(org_id, "external_agent", cost)       │
│  4. Update invocation record:                                           │
│     - response_status_code, response_body, response_time_ms             │
│     - actual_cost, completed_at                                         │
│  5. Log to AuditLog:                                                    │
│     - action: "invoke"                                                  │
│     - resource_type: "external_agent"                                   │
│     - resource_id: agent_id                                             │
│     - status: "success"/"failure"                                       │
│     - details: {trace_id, cost, response_time}                          │
│  6. Emit metrics (ExecutionMetricService)                               │
│                                                                          │
│  Return transformed response to caller with headers:                    │
│  - X-Kaizen-Trace-ID: {trace_id}                                        │
│  - X-Kaizen-Cost: {actual_cost}                                         │
│  - X-Kaizen-Invocation-ID: {invocation_id}                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Error Handling

| Error Type | HTTP Code | Response | Audit Action |
|------------|-----------|----------|--------------|
| Invalid API key | 401 | `{"error": "Invalid API key"}` | Log failed auth attempt |
| Missing scope | 403 | `{"error": "Missing scope: external_agent:invoke"}` | Log authorization failure |
| Policy denied | 403 | `{"error": "Policy denied", "policy_id": "..."}` | Log policy evaluation |
| Budget exceeded | 429 | `{"error": "Budget exceeded", "limit": 100, "used": 95}` | Log budget violation |
| Rate limit exceeded | 429 | `{"error": "Rate limit exceeded", "retry_after": 60}` | Log rate limit hit |
| Approval pending | 202 | `{"status": "awaiting_approval", "approval_id": "..."}` | Log approval request |
| Approval denied | 403 | `{"error": "Approval denied", "approval_id": "..."}` | Log approval rejection |
| External agent error | 502 | `{"error": "External agent error", "details": "..."}` | Log external failure |
| Timeout | 504 | `{"error": "External agent timeout"}` | Log timeout |

---

## External Agent Types

### Supported Platforms

#### 1. Microsoft Copilot Studio

**Platform Type**: `copilot_studio`

**Authentication**: OAuth 2.0 (Azure AD)

**Endpoint Format**:
```
POST https://powerva.microsoft.com/api/botmanagement/v1/directline/directlinetoken
POST https://directline.botframework.com/v3/directline/conversations
POST https://directline.botframework.com/v3/directline/conversations/{conversationId}/activities
```

**Request Template**:
```json
{
  "type": "message",
  "from": {
    "id": "{{ user_id }}",
    "name": "{{ user_name }}"
  },
  "text": "{{ input }}",
  "channelData": {
    "kaizen_trace_id": "{{ trace_id }}",
    "kaizen_org_id": "{{ org_id }}"
  }
}
```

**Response Mapping**:
```json
{
  "output": "$.activities[0].text",
  "metadata": "$.activities[0].channelData"
}
```

**Configuration Example**:
```json
{
  "name": "HR Support Copilot",
  "platform_type": "copilot_studio",
  "endpoint_url": "https://directline.botframework.com/v3/directline",
  "auth_type": "oauth2",
  "auth_config": {
    "token_url": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    "client_id": "abc-123-def",
    "client_secret": "encrypted:xyz789",
    "scope": "https://api.botframework.com/.default"
  },
  "budget_limit_daily": 50.0,
  "rate_limit_per_minute": 10
}
```

#### 2. Azure OpenAI Service

**Platform Type**: `azure_openai`

**Authentication**: API Key

**Endpoint Format**:
```
POST https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2024-02-15-preview
```

**Request Template**:
```json
{
  "messages": [
    {"role": "system", "content": "{{ system_prompt }}"},
    {"role": "user", "content": "{{ input }}"}
  ],
  "temperature": 0.7,
  "max_tokens": 800,
  "user": "{{ user_id }}"
}
```

**Response Mapping**:
```json
{
  "output": "$.choices[0].message.content",
  "tokens_used": "$.usage.total_tokens",
  "finish_reason": "$.choices[0].finish_reason"
}
```

**Configuration Example**:
```json
{
  "name": "Azure GPT-4 Deployment",
  "platform_type": "azure_openai",
  "endpoint_url": "https://my-resource.openai.azure.com/openai/deployments/gpt-4/chat/completions",
  "auth_type": "api_key",
  "auth_config": {
    "header": "api-key",
    "key": "encrypted:abc123xyz"
  },
  "budget_limit_monthly": 1000.0,
  "rate_limit_per_hour": 100
}
```

#### 3. Custom HTTP Agents

**Platform Type**: `custom_http`

**Authentication**: Flexible (API key, Bearer token, Basic auth)

**Endpoint Format**: User-defined

**Request Template**: Fully customizable (Jinja2)

**Response Mapping**: Fully customizable (JSONPath)

**Configuration Example**:
```json
{
  "name": "Custom RAG Agent",
  "platform_type": "custom_http",
  "endpoint_url": "https://internal.company.com/api/rag/query",
  "endpoint_method": "POST",
  "endpoint_headers": {
    "Content-Type": "application/json",
    "X-Internal-Source": "kaizen"
  },
  "auth_type": "bearer_token",
  "auth_config": {
    "token": "encrypted:internal_token_xyz"
  },
  "request_template": {
    "query": "{{ input }}",
    "context": "{{ context | tojson }}",
    "user_id": "{{ user_id }}"
  },
  "response_mapping": {
    "output": "$.result.answer",
    "sources": "$.result.sources"
  },
  "budget_limit_daily": 10.0,
  "requires_approval": true
}
```

#### 4. LangChain Agents (via API)

**Platform Type**: `langchain_agent`

**Authentication**: API Key or Bearer token

**Endpoint Format**: LangServe or custom deployment

**Request Template**:
```json
{
  "input": "{{ input }}",
  "config": {
    "metadata": {
      "user_id": "{{ user_id }}",
      "trace_id": "{{ trace_id }}"
    }
  }
}
```

**Response Mapping**:
```json
{
  "output": "$.output",
  "intermediate_steps": "$.intermediate_steps"
}
```

#### 5. Third-Party Platforms

Other supported platforms (via `custom_http` adapter):

- **Anthropic Claude API**: Direct API calls with governance
- **OpenAI API**: Direct API calls (non-Azure)
- **Hugging Face Inference API**: Hosted models
- **Cohere API**: Command/Embed models
- **Custom FastAPI agents**: Internal deployments

---

## Governance Features

### 1. Authentication Lineage

**Goal**: Full traceability of WHO invoked the agent.

**Implementation**:

```python
async def authenticate_invocation(
    api_key: str,
    agent_id: str,
    request_ip: str,
    user_agent: str
) -> dict:
    """
    Authenticate external agent invocation.

    Returns:
        {
            "user_id": "user_123",
            "org_id": "org_456",
            "api_key_id": "key_789",
            "scopes": ["external_agent:invoke"],
            "trace_id": "trace_abc"
        }
    """
    # Validate API key
    api_key_data = await api_key_service.validate(api_key)
    if not api_key_data:
        raise AuthenticationError("Invalid API key")

    # Check scopes
    scopes = json.loads(api_key_data.get("scopes", "[]"))
    if "external_agent:invoke" not in scopes:
        raise AuthorizationError("Missing scope: external_agent:invoke")

    # Generate trace ID
    trace_id = f"trace_{uuid.uuid4().hex[:16]}"

    # Log authentication
    await audit_service.log(
        organization_id=api_key_data["organization_id"],
        user_id=api_key_data.get("created_by", "system"),
        action="authenticate",
        resource_type="external_agent",
        resource_id=agent_id,
        details={
            "api_key_id": api_key_data["id"],
            "trace_id": trace_id,
            "ip_address": request_ip,
            "user_agent": user_agent
        },
        ip_address=request_ip,
        user_agent=user_agent,
        status="success"
    )

    return {
        "user_id": api_key_data.get("created_by", "system"),
        "org_id": api_key_data["organization_id"],
        "api_key_id": api_key_data["id"],
        "scopes": scopes,
        "trace_id": trace_id
    }
```

### 2. Authorization (ABAC)

**Goal**: Enforce fine-grained access control policies.

**Policy Example**:
```json
{
  "name": "Allow only data-team to invoke production RAG agent",
  "resource_type": "external_agent",
  "action": "invoke",
  "effect": "allow",
  "conditions": {
    "all": [
      {"field": "resource.tags", "op": "contains", "value": "production"},
      {"field": "resource.platform_type", "op": "eq", "value": "custom_http"},
      {"field": "user.team_id", "op": "eq", "value": "team_data"}
    ]
  },
  "priority": 100
}
```

**Implementation**:
```python
async def authorize_invocation(
    user_id: str,
    org_id: str,
    agent: dict,
    context: dict
) -> bool:
    """
    Authorize external agent invocation using ABAC.

    Returns:
        True if authorized, raises AuthorizationError otherwise
    """
    # Build resource context
    resource = {
        "id": agent["id"],
        "platform_type": agent["platform_type"],
        "tags": json.loads(agent.get("tags", "[]")),
        "workspace_id": agent["workspace_id"]
    }

    # Check allowed_callers list (first line of defense)
    allowed_callers = json.loads(agent.get("allowed_callers", "[]"))
    if allowed_callers:
        caller_allowed = any(
            (c["type"] == "user" and c["id"] == user_id)
            for c in allowed_callers
        )
        if not caller_allowed:
            raise AuthorizationError("User not in allowed_callers list")

    # Evaluate ABAC policies
    is_authorized = await abac_service.evaluate(
        user_id=user_id,
        resource_type="external_agent",
        action="invoke",
        resource=resource,
        context=context
    )

    if not is_authorized:
        # Log policy denial
        await audit_service.log(
            organization_id=org_id,
            user_id=user_id,
            action="invoke",
            resource_type="external_agent",
            resource_id=agent["id"],
            status="failure",
            error_message="Policy evaluation denied"
        )
        raise AuthorizationError("Policy denied access")

    return True
```

### 3. Budget Enforcement

**Goal**: Prevent runaway costs.

**Implementation**:
```python
async def check_budget(
    org_id: str,
    agent: dict,
    estimated_cost: float
) -> dict:
    """
    Check budget limits before invocation.

    Returns:
        {
            "allowed": bool,
            "daily_remaining": float,
            "monthly_remaining": float,
            "estimated_cost": float
        }
    """
    daily_limit = agent.get("budget_limit_daily", -1)
    monthly_limit = agent.get("budget_limit_monthly", -1)

    # -1 means unlimited
    if daily_limit == -1 and monthly_limit == -1:
        return {"allowed": True, "estimated_cost": estimated_cost}

    # Get current usage
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Query daily usage
    daily_usage = await billing_service.get_usage(
        org_id=org_id,
        resource_type="external_agent_invocation",
        start_date=today_start.isoformat(),
        end_date=now.isoformat(),
        filters={"external_agent_id": agent["id"]}
    )
    daily_spent = sum(r["total_cost"] for r in daily_usage)

    # Query monthly usage
    monthly_usage = await billing_service.get_usage(
        org_id=org_id,
        resource_type="external_agent_invocation",
        start_date=month_start.isoformat(),
        end_date=now.isoformat(),
        filters={"external_agent_id": agent["id"]}
    )
    monthly_spent = sum(r["total_cost"] for r in monthly_usage)

    # Check limits
    if daily_limit > 0 and (daily_spent + estimated_cost) > daily_limit:
        raise BudgetExceededError(
            f"Daily budget exceeded: {daily_spent:.2f}/{daily_limit:.2f} USD"
        )

    if monthly_limit > 0 and (monthly_spent + estimated_cost) > monthly_limit:
        raise BudgetExceededError(
            f"Monthly budget exceeded: {monthly_spent:.2f}/{monthly_limit:.2f} USD"
        )

    return {
        "allowed": True,
        "daily_remaining": daily_limit - daily_spent if daily_limit > 0 else -1,
        "monthly_remaining": monthly_limit - monthly_spent if monthly_limit > 0 else -1,
        "estimated_cost": estimated_cost
    }
```

### 4. Approval Workflows

**Goal**: Human-in-the-loop for sensitive operations.

**Implementation**:
```python
async def check_approval(
    agent: dict,
    user_id: str,
    org_id: str,
    invocation_id: str,
    request_data: dict
) -> dict:
    """
    Check if approval is required and handle workflow.

    Returns:
        {
            "required": bool,
            "granted": bool | None,
            "approval_id": str | None
        }
    """
    if not agent.get("requires_approval", False):
        return {"required": False, "granted": None, "approval_id": None}

    # Create approval request
    approval = await approval_service.create_request(
        organization_id=org_id,
        requested_by=user_id,
        resource_type="external_agent_invocation",
        resource_id=invocation_id,
        action="invoke",
        context={
            "agent_id": agent["id"],
            "agent_name": agent["name"],
            "platform_type": agent["platform_type"],
            "request_summary": request_data.get("input", "")[:200]
        },
        policy_id=agent.get("approval_policy_id")
    )

    # Notify approvers
    approvers = await approval_service.get_approvers(
        policy_id=agent.get("approval_policy_id"),
        org_id=org_id
    )

    for approver in approvers:
        await webhook_service.send_notification(
            user_id=approver["user_id"],
            event_type="approval_required",
            data={
                "approval_id": approval["id"],
                "agent_name": agent["name"],
                "requested_by": user_id,
                "request_summary": request_data.get("input", "")[:200],
                "approve_url": f"/approvals/{approval['id']}/approve",
                "reject_url": f"/approvals/{approval['id']}/reject"
            }
        )

    # Return approval pending
    return {
        "required": True,
        "granted": False,
        "approval_id": approval["id"]
    }
```

### 5. Rate Limiting

**Goal**: Protect against abuse and runaway costs.

**Implementation**:
```python
async def check_rate_limit(
    agent: dict,
    org_id: str,
    user_id: str
) -> dict:
    """
    Check rate limits for external agent invocations.

    Returns:
        {
            "allowed": bool,
            "per_minute_remaining": int,
            "per_hour_remaining": int,
            "retry_after": int | None
        }
    """
    per_minute = agent.get("rate_limit_per_minute", -1)
    per_hour = agent.get("rate_limit_per_hour", -1)

    # -1 means unlimited
    if per_minute == -1 and per_hour == -1:
        return {"allowed": True}

    now = datetime.now(UTC)

    # Check per-minute limit
    if per_minute > 0:
        minute_start = now - timedelta(minutes=1)
        minute_count = await count_invocations(
            agent_id=agent["id"],
            start_time=minute_start,
            end_time=now
        )

        if minute_count >= per_minute:
            raise RateLimitExceededError(
                f"Rate limit exceeded: {minute_count}/{per_minute} per minute",
                retry_after=60
            )

    # Check per-hour limit
    if per_hour > 0:
        hour_start = now - timedelta(hours=1)
        hour_count = await count_invocations(
            agent_id=agent["id"],
            start_time=hour_start,
            end_time=now
        )

        if hour_count >= per_hour:
            raise RateLimitExceededError(
                f"Rate limit exceeded: {hour_count}/{per_hour} per hour",
                retry_after=3600
            )

    return {
        "allowed": True,
        "per_minute_remaining": per_minute - minute_count if per_minute > 0 else -1,
        "per_hour_remaining": per_hour - hour_count if per_hour > 0 else -1
    }
```

### 6. Audit Trail

**Goal**: Complete compliance-ready audit trail.

**Audit Data Captured**:

```python
# Every invocation creates multiple audit log entries:

# 1. Authentication attempt
await audit_service.log(
    action="authenticate",
    resource_type="external_agent",
    status="success" | "failure"
)

# 2. Authorization check
await audit_service.log(
    action="authorize",
    resource_type="external_agent",
    details={"policy_results": [...]}
)

# 3. Budget check
await audit_service.log(
    action="budget_check",
    resource_type="external_agent",
    details={"limit": 100, "spent": 50, "estimated": 5}
)

# 4. Rate limit check
await audit_service.log(
    action="rate_limit_check",
    resource_type="external_agent",
    details={"limit": 10, "count": 3}
)

# 5. Invocation execution
await audit_service.log(
    action="invoke",
    resource_type="external_agent",
    details={
        "trace_id": trace_id,
        "response_time_ms": 234,
        "status_code": 200,
        "cost": 0.05
    },
    status="success" | "failure"
)
```

---

## Security Considerations

### 1. Credential Storage

**Threat**: Plaintext credentials in database.

**Mitigation**:

```python
# Use Kaizen's encryption service (Fernet-based)
from studio.security.encryption import EncryptionService

encryption_service = EncryptionService()

# Encrypt credentials before storage
auth_config = {
    "client_secret": "very_secret_value",
    "api_key": "sk_live_abc123"
}

encrypted_config = encryption_service.encrypt_dict(auth_config)

# Store encrypted
workflow.add_node(
    "ExternalAgentRegistrationCreateNode",
    "create",
    {
        "auth_config": encrypted_config,  # Stored as encrypted JSON
        ...
    }
)

# Decrypt on use
agent = await get_agent(agent_id)
auth_config = encryption_service.decrypt_dict(agent["auth_config"])
```

**Implementation**:
- Encryption key stored in environment variable (not in database)
- Rotate encryption keys quarterly
- Audit all decryption operations

### 2. mTLS for External Calls

**Threat**: Man-in-the-middle attacks on external agent communication.

**Mitigation**:

```python
import ssl
import httpx

# Create SSL context with client certificates
ssl_context = ssl.create_default_context()
ssl_context.load_cert_chain(
    certfile="/path/to/client-cert.pem",
    keyfile="/path/to/client-key.pem"
)

# Make request with mTLS
async with httpx.AsyncClient(verify=ssl_context) as client:
    response = await client.post(
        agent["endpoint_url"],
        json=request_data,
        headers=auth_headers,
        timeout=30.0
    )
```

**Configuration**:
- Store client certificates in secure secret manager
- Support per-agent mTLS configuration
- Validate server certificates (no self-signed by default)

### 3. Token Rotation

**Threat**: Long-lived OAuth tokens compromised.

**Mitigation**:

```python
async def refresh_oauth_token(agent: dict) -> str:
    """
    Refresh OAuth token for external agent.

    Returns:
        Fresh access token
    """
    auth_config = encryption_service.decrypt_dict(agent["auth_config"])

    # Request new token
    response = await httpx.post(
        auth_config["token_url"],
        data={
            "grant_type": "client_credentials",
            "client_id": auth_config["client_id"],
            "client_secret": auth_config["client_secret"],
            "scope": auth_config.get("scope", "")
        }
    )

    token_data = response.json()

    # Cache token with expiry
    await cache_service.set(
        f"oauth_token:{agent['id']}",
        token_data["access_token"],
        ttl=token_data.get("expires_in", 3600) - 60  # Refresh 1min early
    )

    return token_data["access_token"]
```

**Strategy**:
- Rotate OAuth tokens before expiry
- Use refresh tokens where available
- Invalidate cached tokens on agent update

### 4. IP Allowlisting

**Threat**: Unauthorized access from unknown sources.

**Mitigation**:

```python
# Add ip_whitelist to ExternalAgentRegistration model
ip_whitelist: Optional[str]  # JSON array of allowed CIDR ranges

async def check_ip_whitelist(agent: dict, client_ip: str) -> bool:
    """
    Check if client IP is allowed.

    Returns:
        True if allowed, raises error otherwise
    """
    whitelist = json.loads(agent.get("ip_whitelist", "[]"))

    if not whitelist:
        return True  # No whitelist = allow all

    from ipaddress import ip_address, ip_network

    client_ip_obj = ip_address(client_ip)

    for cidr in whitelist:
        if client_ip_obj in ip_network(cidr):
            return True

    raise AuthorizationError(f"IP {client_ip} not in whitelist")
```

### 5. PII Redaction

**Threat**: Sensitive data logged in audit trails.

**Mitigation**:

```python
import re

def redact_pii(text: str) -> str:
    """
    Redact PII from text before logging.

    Redacts:
    - Email addresses
    - Phone numbers
    - Credit card numbers
    - SSN
    """
    # Email
    text = re.sub(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        '[EMAIL_REDACTED]',
        text
    )

    # Phone (US format)
    text = re.sub(
        r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
        '[PHONE_REDACTED]',
        text
    )

    # Credit card
    text = re.sub(
        r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b',
        '[CC_REDACTED]',
        text
    )

    # SSN
    text = re.sub(
        r'\b\d{3}-\d{2}-\d{4}\b',
        '[SSN_REDACTED]',
        text
    )

    return text

# Use in invocation logging
request_body_sanitized = redact_pii(json.dumps(request_body))
```

### 6. Secret Scanning

**Threat**: Accidental exposure of API keys in logs.

**Mitigation**:

- Pre-commit hooks with `detect-secrets`
- Scan logs for patterns: `sk_live_`, `Bearer `, `api_key=`
- Alert on secret detection in audit logs
- Automatic key rotation on exposure

---

## API Design

### Endpoints

#### 1. Register External Agent

```
POST /api/v1/external-agents
```

**Request**:
```json
{
  "name": "HR Support Copilot",
  "description": "Microsoft Copilot for HR queries",
  "workspace_id": "workspace_123",
  "platform_type": "copilot_studio",
  "endpoint_url": "https://directline.botframework.com/v3/directline",
  "endpoint_method": "POST",
  "auth_type": "oauth2",
  "auth_config": {
    "token_url": "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
    "client_id": "abc-123",
    "client_secret": "secret_xyz",
    "scope": "https://api.botframework.com/.default"
  },
  "budget_limit_daily": 50.0,
  "budget_limit_monthly": 1000.0,
  "rate_limit_per_minute": 10,
  "rate_limit_per_hour": 100,
  "requires_approval": false,
  "allowed_callers": [
    {"type": "team", "id": "team_hr"}
  ],
  "tags": ["production", "hr"]
}
```

**Response**:
```json
{
  "id": "ext_agent_abc123",
  "name": "HR Support Copilot",
  "status": "active",
  "created_at": "2025-12-20T10:00:00Z",
  "invoke_url": "/api/v1/external-agents/ext_agent_abc123/invoke"
}
```

#### 2. Invoke External Agent

```
POST /api/v1/external-agents/{agent_id}/invoke
```

**Request**:
```json
{
  "input": "What is the PTO policy for new employees?",
  "context": {
    "user_session": "session_456",
    "channel": "slack"
  },
  "metadata": {
    "source": "slack_bot",
    "thread_id": "thread_789"
  }
}
```

**Response (Success)**:
```json
{
  "invocation_id": "inv_xyz789",
  "trace_id": "trace_abc123",
  "status": "success",
  "output": "New employees receive 15 days of PTO in their first year...",
  "metadata": {
    "response_time_ms": 234,
    "cost": 0.05,
    "tokens_used": 150
  }
}
```

**Response (Approval Required)**:
```json
{
  "invocation_id": "inv_xyz789",
  "status": "awaiting_approval",
  "approval_id": "approval_123",
  "message": "This invocation requires approval",
  "approval_url": "/api/v1/approvals/approval_123"
}
```

#### 3. List External Agents

```
GET /api/v1/external-agents?workspace_id={id}&platform_type={type}&status={status}
```

**Response**:
```json
{
  "agents": [
    {
      "id": "ext_agent_abc123",
      "name": "HR Support Copilot",
      "platform_type": "copilot_studio",
      "status": "active",
      "budget_remaining_daily": 35.50,
      "invocations_today": 23,
      "created_at": "2025-12-20T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

#### 4. Get Invocation History

```
GET /api/v1/external-agents/{agent_id}/invocations?limit={n}&offset={n}
```

**Response**:
```json
{
  "invocations": [
    {
      "id": "inv_xyz789",
      "trace_id": "trace_abc123",
      "user_id": "user_456",
      "status": "success",
      "request_summary": "What is the PTO policy...",
      "response_time_ms": 234,
      "cost": 0.05,
      "invoked_at": "2025-12-20T14:30:00Z",
      "completed_at": "2025-12-20T14:30:00.234Z"
    }
  ],
  "total": 145,
  "limit": 100,
  "offset": 0
}
```

#### 5. Update External Agent

```
PATCH /api/v1/external-agents/{agent_id}
```

**Request**:
```json
{
  "budget_limit_daily": 100.0,
  "rate_limit_per_hour": 200,
  "status": "active"
}
```

#### 6. Delete External Agent

```
DELETE /api/v1/external-agents/{agent_id}
```

**Response**:
```json
{
  "id": "ext_agent_abc123",
  "status": "deleted",
  "deleted_at": "2025-12-20T15:00:00Z"
}
```

---

## Implementation Phases

### Phase 1: Core Models & API (3-4 days)

**Deliverables**:
- ✅ ExternalAgentRegistration model
- ✅ ExternalAgentInvocation model
- ✅ CRUD API endpoints
- ✅ Database migrations
- ✅ Unit tests (Tier 1)

**Files**:
```
src/studio/models/external_agent_registration.py
src/studio/models/external_agent_invocation.py
src/studio/services/external_agent_service.py
src/studio/api/external_agents.py
tests/unit/models/test_external_agent_models.py
tests/unit/services/test_external_agent_service.py
```

### Phase 2: Auth & Authorization (2-3 days)

**Deliverables**:
- ✅ API key scope: `external_agent:invoke`
- ✅ ABAC policies for `resource_type: "external_agent"`
- ✅ Auth middleware integration
- ✅ Integration tests (Tier 2)

**Files**:
```
src/studio/middleware/external_agent_auth.py
src/studio/services/external_agent_auth_service.py
tests/integration/test_external_agent_auth.py
```

### Phase 3: Governance Integration (2-3 days)

**Deliverables**:
- ✅ Budget enforcement integration
- ✅ Rate limiting integration
- ✅ Approval workflow integration
- ✅ Audit logging integration
- ✅ Integration tests (Tier 2)

**Files**:
```
src/studio/services/external_agent_governance.py
tests/integration/test_external_agent_governance.py
```

### Phase 4: Proxy Service (3-4 days)

**Deliverables**:
- ✅ HTTP proxy with auth injection
- ✅ Request/response transformation (Jinja2, JSONPath)
- ✅ Platform adapters (Copilot, Azure OpenAI, custom)
- ✅ Error handling and retries
- ✅ E2E tests (Tier 3 with mock external agents)

**Files**:
```
src/studio/services/external_agent_proxy.py
src/studio/adapters/copilot_studio_adapter.py
src/studio/adapters/azure_openai_adapter.py
tests/e2e/test_external_agent_invocation.py
```

### Phase 5: Security Hardening (2 days)

**Deliverables**:
- ✅ Credential encryption
- ✅ PII redaction
- ✅ IP allowlisting
- ✅ Token rotation
- ✅ Security tests

**Files**:
```
src/studio/security/credential_encryption.py
src/studio/security/pii_redaction.py
tests/integration/test_external_agent_security.py
```

### Phase 6: Documentation & Examples (2 days)

**Deliverables**:
- ✅ API documentation (OpenAPI)
- ✅ Platform integration guides
- ✅ Example configurations (Copilot, Azure, custom)
- ✅ Postman collection

**Files**:
```
docs/external-agents/01-overview.md
docs/external-agents/02-copilot-studio.md
docs/external-agents/03-azure-openai.md
docs/external-agents/04-custom-agents.md
examples/external_agent_configs/
```

**Total Effort**: 14-18 days (2.5-3.5 weeks)

---

## Testing Strategy

### Tier 1: Unit Tests (No External Dependencies)

**Focus**: Business logic in isolation.

```python
# tests/unit/services/test_external_agent_service.py

import pytest
from studio.services.external_agent_service import ExternalAgentService


@pytest.mark.asyncio
async def test_create_external_agent(mock_runtime):
    """Test creating external agent registration."""
    service = ExternalAgentService(runtime=mock_runtime)

    agent = await service.create_agent(
        org_id="org_123",
        workspace_id="workspace_456",
        name="Test Agent",
        platform_type="custom_http",
        endpoint_url="https://test.example.com/api",
        auth_type="api_key",
        auth_config={"key": "test_key"},
        created_by="user_789"
    )

    assert agent["id"].startswith("ext_agent_")
    assert agent["name"] == "Test Agent"
    assert agent["status"] == "active"


@pytest.mark.asyncio
async def test_check_budget_within_limit(mock_runtime):
    """Test budget check passes when within limit."""
    service = ExternalAgentService(runtime=mock_runtime)

    agent = {
        "id": "ext_agent_123",
        "budget_limit_daily": 100.0
    }

    # Mock current spend at 50
    result = await service.check_budget(
        org_id="org_123",
        agent=agent,
        estimated_cost=10.0,
        current_daily_spend=50.0
    )

    assert result["allowed"] is True
    assert result["daily_remaining"] == 40.0


@pytest.mark.asyncio
async def test_check_budget_exceeds_limit(mock_runtime):
    """Test budget check fails when exceeding limit."""
    service = ExternalAgentService(runtime=mock_runtime)

    agent = {
        "id": "ext_agent_123",
        "budget_limit_daily": 100.0
    }

    with pytest.raises(BudgetExceededError):
        await service.check_budget(
            org_id="org_123",
            agent=agent,
            estimated_cost=60.0,
            current_daily_spend=50.0
        )
```

### Tier 2: Integration Tests (Real Database, No External Agents)

**Focus**: Integration with Kaizen infrastructure.

```python
# tests/integration/test_external_agent_governance.py

import pytest
from studio.services.external_agent_service import ExternalAgentService
from studio.services.abac_service import ABACService
from studio.services.billing_service import BillingService


@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_governance_flow(test_db, test_org, test_user):
    """Test complete governance flow with real DB."""

    # Create external agent
    agent_service = ExternalAgentService()
    agent = await agent_service.create_agent(
        org_id=test_org["id"],
        workspace_id="workspace_123",
        name="Test Agent",
        platform_type="custom_http",
        endpoint_url="https://test.example.com/api",
        auth_type="api_key",
        auth_config={"key": "test_key"},
        budget_limit_daily=100.0,
        rate_limit_per_minute=10,
        created_by=test_user["id"]
    )

    # Create ABAC policy
    abac_service = ABACService()
    policy = await abac_service.create_policy(
        organization_id=test_org["id"],
        name="Allow test user to invoke",
        resource_type="external_agent",
        action="invoke",
        effect="allow",
        conditions={
            "all": [
                {"field": "resource.id", "op": "eq", "value": agent["id"]}
            ]
        },
        created_by=test_user["id"]
    )

    await abac_service.assign_policy(
        policy_id=policy["id"],
        principal_type="user",
        principal_id=test_user["id"]
    )

    # Test authorization
    is_authorized = await abac_service.evaluate(
        user_id=test_user["id"],
        resource_type="external_agent",
        action="invoke",
        resource={"id": agent["id"]}
    )

    assert is_authorized is True

    # Test budget enforcement
    billing_service = BillingService()

    # Record some usage
    await billing_service.record_usage(
        org_id=test_org["id"],
        resource_type="external_agent_invocation",
        quantity=1,
        metadata={"external_agent_id": agent["id"], "cost": 5.0}
    )

    # Check budget (should pass)
    result = await agent_service.check_budget(
        org_id=test_org["id"],
        agent=agent,
        estimated_cost=10.0
    )

    assert result["allowed"] is True
    assert result["daily_remaining"] == 85.0  # 100 - 5 - 10
```

### Tier 3: E2E Tests (Mock External Agents)

**Focus**: End-to-end invocation flow with mock external agents.

```python
# tests/e2e/test_external_agent_invocation.py

import pytest
from httpx import AsyncClient
import respx


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_invoke_external_agent_success(
    test_client: AsyncClient,
    test_api_key,
    test_external_agent,
    mock_external_endpoint
):
    """Test successful external agent invocation."""

    # Mock external agent response
    with respx.mock:
        respx.post("https://test.example.com/api").mock(
            return_value={
                "status": 200,
                "json": {
                    "result": "Test response from external agent",
                    "metadata": {"tokens": 50}
                }
            }
        )

        # Invoke agent
        response = await test_client.post(
            f"/api/v1/external-agents/{test_external_agent['id']}/invoke",
            headers={"Authorization": f"Bearer {test_api_key}"},
            json={
                "input": "Test query",
                "context": {"user_session": "session_123"}
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert "invocation_id" in data
        assert "trace_id" in data
        assert data["output"] == "Test response from external agent"
        assert data["metadata"]["tokens_used"] == 50

        # Verify audit log created
        audit_response = await test_client.get(
            f"/api/v1/audit?resource_type=external_agent&action=invoke",
            headers={"Authorization": f"Bearer {test_api_key}"}
        )

        assert audit_response.status_code == 200
        audit_logs = audit_response.json()["logs"]
        assert len(audit_logs) > 0
        assert audit_logs[0]["status"] == "success"


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_invoke_budget_exceeded(
    test_client: AsyncClient,
    test_api_key,
    test_external_agent_with_low_budget
):
    """Test invocation rejected when budget exceeded."""

    response = await test_client.post(
        f"/api/v1/external-agents/{test_external_agent_with_low_budget['id']}/invoke",
        headers={"Authorization": f"Bearer {test_api_key}"},
        json={"input": "Test query"}
    )

    assert response.status_code == 429  # Budget exceeded
    data = response.json()

    assert "Budget exceeded" in data["error"]
    assert "limit" in data
    assert "used" in data
```

---

## Decision Records

### ADR-001: Proxy Pattern vs. Agent-to-Agent Communication

**Status**: Accepted

**Context**:
We need to integrate external agents (Copilot, custom) with Kaizen's governance. Two approaches:

1. **Proxy Pattern**: Kaizen intercepts calls, applies governance, forwards to external agent
2. **Agent-to-Agent**: External agents communicate directly with Kaizen agents as peers

**Decision**: Proxy Pattern

**Rationale**:
- **Transparency**: External agents require zero code changes (can't modify Copilot)
- **Control**: All governance gates in one place (auth, budget, approval)
- **Auditability**: Single point for audit trail capture
- **Simplicity**: No distributed coordination needed

**Consequences**:
- **Positive**: Simple integration, full governance coverage, works with any HTTP agent
- **Negative**: Adds latency (target <100ms), single point of failure (mitigate with HA)

### ADR-002: Leverage Existing vs. New Governance Services

**Status**: Accepted

**Context**:
External agents need governance (auth, budgets, policies). Two approaches:

1. **Reuse Existing**: Extend APIKeyService, ABACService, BillingService, AuditService
2. **Build New**: Create parallel ExternalAgentAuthService, ExternalAgentBudgetService, etc.

**Decision**: Reuse Existing

**Rationale**:
- **Consistency**: Same governance rules for Kaizen-native and external agents
- **Avoid Duplication**: Don't reinvent auth, policy evaluation, audit logging
- **Unified Management**: Single dashboard for all governance policies
- **Faster Delivery**: Extend existing services vs. build from scratch

**Consequences**:
- **Positive**: Faster delivery (2-3 weeks vs. 4-6), consistent UX, less code to maintain
- **Negative**: Tighter coupling (external agents depend on core services)

### ADR-003: Credential Encryption at Rest

**Status**: Accepted

**Context**:
External agent auth configs (API keys, OAuth secrets) must be stored securely.

**Decision**: Encrypt credentials using Fernet (AES-128) before database storage

**Implementation**:
```python
from cryptography.fernet import Fernet

# Encryption key from environment (rotated quarterly)
ENCRYPTION_KEY = os.getenv("CREDENTIAL_ENCRYPTION_KEY")
cipher = Fernet(ENCRYPTION_KEY)

# Encrypt before storage
encrypted = cipher.encrypt(json.dumps(auth_config).encode())

# Decrypt on use
decrypted = json.loads(cipher.decrypt(encrypted).decode())
```

**Consequences**:
- **Positive**: SOC2 compliant, protects against database breaches
- **Negative**: Performance overhead (~1ms per encrypt/decrypt), key rotation complexity

### ADR-004: Request/Response Transformation Strategy

**Status**: Accepted

**Context**:
External agents have different request/response formats. Need transformation layer.

**Decision**:
- **Request**: Jinja2 templates for flexibility
- **Response**: JSONPath for extraction

**Example**:
```python
# Request template (Jinja2)
request_template = {
  "query": "{{ input }}",
  "context": "{{ context | tojson }}",
  "user": "{{ user_id }}"
}

# Response mapping (JSONPath)
response_mapping = {
  "output": "$.result.answer",
  "metadata": "$.result.metadata"
}
```

**Consequences**:
- **Positive**: Flexible, covers 95% of use cases, familiar syntax
- **Negative**: Security risk (template injection - mitigate with sandboxing)

### ADR-005: Approval Workflow Integration

**Status**: Accepted

**Context**:
Some external agent invocations require human approval (sensitive data access, production deployments).

**Decision**: Async approval workflow with webhook callbacks

**Flow**:
1. Invocation requires approval → Return 202 Accepted with `approval_id`
2. Notify approvers via webhook (Teams, Slack, email)
3. Approver clicks approve/reject → Webhook callback to Kaizen
4. Kaizen resumes invocation or rejects
5. Notify original caller via webhook

**Consequences**:
- **Positive**: Compliance-friendly, flexible approval chains
- **Negative**: Async complexity (caller must poll or use webhooks)

---

## Appendix: Example Configurations

### Microsoft Copilot Studio

```json
{
  "name": "HR Support Copilot",
  "platform_type": "copilot_studio",
  "endpoint_url": "https://directline.botframework.com/v3/directline/conversations",
  "endpoint_method": "POST",
  "auth_type": "oauth2",
  "auth_config": {
    "token_url": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    "client_id": "abc-123-def",
    "client_secret": "encrypted:xyz789",
    "scope": "https://api.botframework.com/.default"
  },
  "request_template": {
    "type": "message",
    "from": {"id": "{{ user_id }}", "name": "{{ user_name }}"},
    "text": "{{ input }}",
    "channelData": {"kaizen_trace_id": "{{ trace_id }}"}
  },
  "response_mapping": {
    "output": "$.activities[0].text",
    "metadata": "$.activities[0].channelData"
  },
  "budget_limit_daily": 50.0,
  "rate_limit_per_minute": 10,
  "tags": ["production", "hr"]
}
```

### Azure OpenAI Service

```json
{
  "name": "Azure GPT-4 Deployment",
  "platform_type": "azure_openai",
  "endpoint_url": "https://my-resource.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview",
  "endpoint_method": "POST",
  "auth_type": "api_key",
  "auth_config": {
    "header": "api-key",
    "key": "encrypted:abc123xyz"
  },
  "request_template": {
    "messages": [
      {"role": "system", "content": "{{ system_prompt }}"},
      {"role": "user", "content": "{{ input }}"}
    ],
    "temperature": 0.7,
    "max_tokens": 800,
    "user": "{{ user_id }}"
  },
  "response_mapping": {
    "output": "$.choices[0].message.content",
    "tokens_used": "$.usage.total_tokens"
  },
  "budget_limit_monthly": 1000.0,
  "rate_limit_per_hour": 100,
  "tags": ["production", "gpt-4"]
}
```

### Custom RAG Agent

```json
{
  "name": "Internal RAG Agent",
  "platform_type": "custom_http",
  "endpoint_url": "https://internal.company.com/api/rag/query",
  "endpoint_method": "POST",
  "endpoint_headers": {
    "Content-Type": "application/json",
    "X-Internal-Source": "kaizen"
  },
  "auth_type": "bearer_token",
  "auth_config": {
    "token": "encrypted:internal_token_xyz"
  },
  "request_template": {
    "query": "{{ input }}",
    "context": "{{ context | tojson }}",
    "user_id": "{{ user_id }}"
  },
  "response_mapping": {
    "output": "$.result.answer",
    "sources": "$.result.sources"
  },
  "budget_limit_daily": 10.0,
  "requires_approval": true,
  "approval_policy_id": "policy_123",
  "tags": ["internal", "rag", "production"]
}
```

---

## Summary

The External Agent Wrapper extends Kaizen Studio's "Govern" pillar to support enterprises with mixed AI tooling. By acting as a transparent governance proxy, it enables:

- **Full Authentication Lineage**: WHO invoked the agent
- **Budget Enforcement**: Prevent runaway costs
- **Approval Workflows**: Human-in-the-loop for sensitive ops
- **Complete Audit Trail**: SOC2/GDPR/HIPAA compliance
- **Rate Limiting**: Protect against abuse

**Key Design Principles**:
1. Leverage existing Kaizen infrastructure (no parallel systems)
2. Zero code changes required for external agents (transparent proxy)
3. Fail-safe governance (deny-by-default)
4. Extensible platform adapters (Copilot, Azure, custom)

**Estimated Delivery**: 2.5-3.5 weeks

**Next Steps**: Review with engineering team → Approve → Phase 1 implementation
