# External Integrations: API Design

**Date**: 2025-12-20
**Status**: Planning
**Scope**: REST API specifications for External Agent Wrapper and Webhook Platform Adapters

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [External Agent Management](#external-agent-management)
4. [External Agent Invocation](#external-agent-invocation)
5. [Webhook Platform Configuration](#webhook-platform-configuration)
6. [Request/Response Schemas](#requestresponse-schemas)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [OpenAPI Documentation](#openapi-documentation)
10. [Code Examples](#code-examples)

---

## API Overview

### Base Paths

```
/api/v1/external-agents      # External agent management
/api/v1/invoke               # External agent invocation
/api/v1/webhooks             # Webhook management (extended)
```

### Versioning

- **Current Version**: v1
- **Versioning Strategy**: URL-based (`/api/v1/...`)
- **Deprecation Policy**: 6 months notice before breaking changes

### Response Format

All responses follow a consistent structure:

```json
{
  "id": "string",
  "organization_id": "string",
  "created_at": "2025-12-20T10:30:00Z",
  "updated_at": "2025-12-20T10:30:00Z",
  ...
}
```

Timestamps are ISO 8601 format in UTC.

---

## Authentication

### Authentication Methods

#### 1. OAuth 2.0 (UI Management)

For Studio UI operations:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Payload**:
```json
{
  "sub": "user_id",
  "org_id": "organization_id",
  "role": "org_owner",
  "jti": "token_id",
  "exp": 1735650000
}
```

#### 2. API Key (External Invocations)

For programmatic external agent invocations:

**Header Format**:
```http
X-API-Key: sk_live_1234567890abcdef
```

Or:
```http
Authorization: Bearer sk_live_1234567890abcdef
```

**Scopes Required**:
- `external_agents:invoke` - Invoke external agents
- `external_agents:read` - Read external agent configuration
- `external_agents:write` - Manage external agents

### Authentication Flow

```
┌─────────────────┐
│  External Tool  │
│  (Copilot, etc) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  Kaizen API: /api/v1/invoke/{agent_id}      │
│                                             │
│  1. Validate API Key (X-API-Key header)     │
│  2. Extract organization_id from API key    │
│  3. Verify scope: external_agents:invoke    │
│  4. Check rate limits                       │
│  5. Create invocation record (lineage)      │
│  6. Apply governance (budget, approvals)    │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  External Agent │
│   Execution     │
└─────────────────┘
```

---

## External Agent Management

### Endpoints

#### 1. Register External Agent

```http
POST /api/v1/external-agents
```

**Authorization**: `external_agents:create` permission

**Request Body**:
```json
{
  "name": "HR Copilot Assistant",
  "description": "Microsoft Copilot agent for HR queries",
  "platform": "microsoft_copilot",
  "endpoint_url": "https://copilot.microsoft.com/api/agents/hr-assistant",
  "auth_type": "oauth2",
  "auth_config": {
    "client_id": "microsoft_client_id",
    "client_secret": "microsoft_client_secret",
    "token_url": "https://login.microsoftonline.com/token",
    "scope": "https://graph.microsoft.com/.default"
  },
  "timeout_seconds": 30,
  "metadata": {
    "team": "Human Resources",
    "cost_center": "HR-001"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "ext_agent_1234567890",
  "organization_id": "org_abc123",
  "workspace_id": "workspace_xyz",
  "name": "HR Copilot Assistant",
  "description": "Microsoft Copilot agent for HR queries",
  "platform": "microsoft_copilot",
  "endpoint_url": "https://copilot.microsoft.com/api/agents/hr-assistant",
  "auth_type": "oauth2",
  "auth_config": {
    "client_id": "microsoft_client_id",
    "token_url": "https://login.microsoftonline.com/token",
    "scope": "https://graph.microsoft.com/.default"
  },
  "api_key": "sk_live_ext_1234567890abcdef",
  "status": "active",
  "timeout_seconds": 30,
  "metadata": {
    "team": "Human Resources",
    "cost_center": "HR-001"
  },
  "created_by": "user_123",
  "created_at": "2025-12-20T10:30:00Z",
  "updated_at": "2025-12-20T10:30:00Z"
}
```

**Notes**:
- `api_key` is shown only once on creation
- `auth_config.client_secret` is encrypted before storage
- Automatically creates API key with scope `external_agents:invoke`

---

#### 2. List External Agents

```http
GET /api/v1/external-agents
```

**Authorization**: `external_agents:read` permission

**Query Parameters**:
```
?workspace_id=workspace_xyz     # Filter by workspace
&status=active                  # Filter by status (active, inactive, error)
&platform=microsoft_copilot     # Filter by platform
&limit=50                       # Page size (1-100)
&offset=0                       # Pagination offset
```

**Response** (200 OK):
```json
{
  "records": [
    {
      "id": "ext_agent_1234567890",
      "organization_id": "org_abc123",
      "workspace_id": "workspace_xyz",
      "name": "HR Copilot Assistant",
      "description": "Microsoft Copilot agent for HR queries",
      "platform": "microsoft_copilot",
      "status": "active",
      "endpoint_url": "https://copilot.microsoft.com/api/agents/hr-assistant",
      "last_invoked_at": "2025-12-20T09:15:00Z",
      "total_invocations": 1247,
      "error_count": 3,
      "created_at": "2025-12-20T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

#### 3. Get External Agent

```http
GET /api/v1/external-agents/{id}
```

**Authorization**: `external_agents:read` permission

**Response** (200 OK):
```json
{
  "id": "ext_agent_1234567890",
  "organization_id": "org_abc123",
  "workspace_id": "workspace_xyz",
  "name": "HR Copilot Assistant",
  "description": "Microsoft Copilot agent for HR queries",
  "platform": "microsoft_copilot",
  "endpoint_url": "https://copilot.microsoft.com/api/agents/hr-assistant",
  "auth_type": "oauth2",
  "auth_config": {
    "client_id": "microsoft_client_id",
    "token_url": "https://login.microsoftonline.com/token",
    "scope": "https://graph.microsoft.com/.default"
  },
  "api_key_prefix": "sk_live_ext_123",
  "status": "active",
  "timeout_seconds": 30,
  "metadata": {
    "team": "Human Resources",
    "cost_center": "HR-001"
  },
  "last_invoked_at": "2025-12-20T09:15:00Z",
  "total_invocations": 1247,
  "error_count": 3,
  "created_by": "user_123",
  "created_at": "2025-12-20T10:30:00Z",
  "updated_at": "2025-12-20T10:30:00Z"
}
```

**Notes**:
- `api_key` is NOT returned (only prefix)
- `auth_config.client_secret` is NOT returned

---

#### 4. Update External Agent

```http
PUT /api/v1/external-agents/{id}
```

**Authorization**: `external_agents:update` permission

**Request Body**:
```json
{
  "name": "HR Copilot Assistant v2",
  "description": "Updated description",
  "endpoint_url": "https://copilot.microsoft.com/api/agents/hr-assistant-v2",
  "timeout_seconds": 45,
  "status": "active"
}
```

**Response** (200 OK):
```json
{
  "id": "ext_agent_1234567890",
  "organization_id": "org_abc123",
  "name": "HR Copilot Assistant v2",
  "description": "Updated description",
  ...
}
```

---

#### 5. Delete External Agent

```http
DELETE /api/v1/external-agents/{id}
```

**Authorization**: `external_agents:delete` permission

**Response** (200 OK):
```json
{
  "message": "External agent archived successfully"
}
```

**Notes**:
- Soft delete (sets `status = 'archived'`)
- Revokes associated API key
- Preserves invocation history for audit

---

#### 6. Test Connection

```http
POST /api/v1/external-agents/{id}/test
```

**Authorization**: `external_agents:update` permission

**Request Body**:
```json
{
  "test_payload": {
    "message": "Test connection"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "response_time_ms": 245,
  "status_code": 200,
  "response_body": {
    "message": "Connection successful"
  },
  "tested_at": "2025-12-20T10:35:00Z"
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Connection timeout",
  "response_time_ms": 30000,
  "tested_at": "2025-12-20T10:35:00Z"
}
```

---

#### 7. Rotate Secret

```http
POST /api/v1/external-agents/{id}/rotate-secret
```

**Authorization**: `external_agents:update` permission

**Response** (200 OK):
```json
{
  "id": "ext_agent_1234567890",
  "api_key": "sk_live_ext_new_1234567890abcdef",
  "rotated_at": "2025-12-20T10:40:00Z",
  "message": "API key rotated successfully. Update your external agent configuration."
}
```

**Notes**:
- Old API key is revoked immediately
- New API key is shown only once
- Audit event created

---

#### 8. List Invocations

```http
GET /api/v1/external-agents/{id}/invocations
```

**Authorization**: `external_agents:read` permission

**Query Parameters**:
```
?start_date=2025-12-01T00:00:00Z
&end_date=2025-12-20T23:59:59Z
&status=success                  # success, error, timeout
&limit=50
&offset=0
```

**Response** (200 OK):
```json
{
  "records": [
    {
      "id": "invocation_abc123",
      "external_agent_id": "ext_agent_1234567890",
      "status": "success",
      "invoked_by": "user_456",
      "invoked_at": "2025-12-20T09:15:00Z",
      "duration_ms": 1250,
      "input_tokens": 120,
      "output_tokens": 450,
      "cost_usd": 0.0023,
      "source_ip": "203.0.113.45",
      "source_platform": "microsoft_copilot",
      "session_id": "session_xyz"
    }
  ],
  "total": 1247
}
```

---

#### 9. Get Usage Metrics

```http
GET /api/v1/external-agents/{id}/metrics
```

**Authorization**: `external_agents:read` permission

**Query Parameters**:
```
?start_date=2025-12-01T00:00:00Z
&end_date=2025-12-20T23:59:59Z
&granularity=day                 # hour, day, week, month
```

**Response** (200 OK):
```json
{
  "external_agent_id": "ext_agent_1234567890",
  "period": {
    "start": "2025-12-01T00:00:00Z",
    "end": "2025-12-20T23:59:59Z"
  },
  "metrics": {
    "total_invocations": 1247,
    "success_count": 1244,
    "error_count": 3,
    "timeout_count": 0,
    "avg_duration_ms": 1150,
    "p95_duration_ms": 2340,
    "p99_duration_ms": 4500,
    "total_cost_usd": 2.87,
    "total_input_tokens": 149640,
    "total_output_tokens": 561300
  },
  "timeseries": [
    {
      "timestamp": "2025-12-01T00:00:00Z",
      "invocations": 62,
      "success": 62,
      "errors": 0,
      "avg_duration_ms": 1100,
      "cost_usd": 0.14
    }
  ]
}
```

---

## External Agent Invocation

### Endpoints

#### 1. Invoke External Agent

```http
POST /api/v1/invoke/{external_agent_id}
```

**Authorization**: API Key with `external_agents:invoke` scope

**Request Headers**:
```http
X-API-Key: sk_live_ext_1234567890abcdef
Content-Type: application/json
X-Source-Platform: microsoft_copilot
X-Session-ID: session_xyz
X-User-ID: copilot_user_123
X-Trace-ID: trace_abc456
```

**Request Body**:
```json
{
  "inputs": {
    "message": "What is the PTO policy for new employees?",
    "context": {
      "user_department": "Engineering",
      "user_tenure_months": 3
    }
  },
  "metadata": {
    "source": "microsoft_teams",
    "conversation_id": "conv_123",
    "user_agent": "MSTeams/1.5.0"
  }
}
```

**Response** (200 OK):
```json
{
  "invocation_id": "invocation_abc123",
  "external_agent_id": "ext_agent_1234567890",
  "status": "success",
  "result": {
    "message": "New employees receive 15 days of PTO annually...",
    "confidence": 0.95,
    "sources": [
      "HR Policy Document v3.2"
    ]
  },
  "lineage": {
    "invoked_by": "user_456",
    "invoked_at": "2025-12-20T10:45:00Z",
    "organization_id": "org_abc123",
    "workspace_id": "workspace_xyz",
    "source_platform": "microsoft_copilot",
    "session_id": "session_xyz",
    "trace_id": "trace_abc456"
  },
  "metrics": {
    "duration_ms": 1250,
    "input_tokens": 120,
    "output_tokens": 450,
    "cost_usd": 0.0023
  },
  "governance": {
    "budget_enforced": true,
    "approval_required": false,
    "rate_limit_remaining": 957
  }
}
```

**Response** (402 Payment Required - Budget Exceeded):
```json
{
  "error": "budget_exceeded",
  "message": "Monthly budget limit exceeded for external agent",
  "details": {
    "budget_limit_usd": 100.0,
    "current_spend_usd": 102.34,
    "reset_date": "2025-01-01T00:00:00Z"
  }
}
```

**Response** (429 Too Many Requests):
```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded for external agent invocations",
  "details": {
    "limit": 1000,
    "window": "1 hour",
    "reset_at": "2025-12-20T11:00:00Z"
  }
}
```

**Response** (503 Service Unavailable - Approval Required):
```json
{
  "error": "approval_required",
  "message": "This invocation requires approval before execution",
  "details": {
    "approval_id": "approval_123",
    "approvers": ["user_789"],
    "policy": "Production External Agent Invocations",
    "estimated_approval_time": "15 minutes"
  }
}
```

---

#### 2. Get Invocation Details

```http
GET /api/v1/invocations/{id}
```

**Authorization**: `external_agents:read` permission

**Response** (200 OK):
```json
{
  "id": "invocation_abc123",
  "external_agent_id": "ext_agent_1234567890",
  "external_agent_name": "HR Copilot Assistant",
  "organization_id": "org_abc123",
  "workspace_id": "workspace_xyz",
  "status": "success",
  "inputs": {
    "message": "What is the PTO policy for new employees?",
    "context": {
      "user_department": "Engineering",
      "user_tenure_months": 3
    }
  },
  "result": {
    "message": "New employees receive 15 days of PTO annually...",
    "confidence": 0.95,
    "sources": [
      "HR Policy Document v3.2"
    ]
  },
  "invoked_by": "user_456",
  "invoked_at": "2025-12-20T10:45:00Z",
  "completed_at": "2025-12-20T10:45:01Z",
  "duration_ms": 1250,
  "input_tokens": 120,
  "output_tokens": 450,
  "cost_usd": 0.0023,
  "source_ip": "203.0.113.45",
  "source_platform": "microsoft_copilot",
  "session_id": "session_xyz",
  "trace_id": "trace_abc456",
  "metadata": {
    "source": "microsoft_teams",
    "conversation_id": "conv_123",
    "user_agent": "MSTeams/1.5.0"
  }
}
```

---

#### 3. Get Full Lineage

```http
GET /api/v1/invocations/{id}/lineage
```

**Authorization**: `external_agents:read` permission

**Response** (200 OK):
```json
{
  "invocation_id": "invocation_abc123",
  "lineage_chain": [
    {
      "type": "external_agent_invocation",
      "timestamp": "2025-12-20T10:45:00Z",
      "actor": {
        "user_id": "user_456",
        "organization_id": "org_abc123",
        "source_platform": "microsoft_copilot",
        "source_ip": "203.0.113.45"
      },
      "action": "invoke_external_agent",
      "target": {
        "external_agent_id": "ext_agent_1234567890",
        "external_agent_name": "HR Copilot Assistant",
        "platform": "microsoft_copilot"
      }
    },
    {
      "type": "budget_enforcement",
      "timestamp": "2025-12-20T10:45:00.123Z",
      "actor": {
        "service": "BudgetEnforcer"
      },
      "action": "check_budget",
      "result": "passed",
      "details": {
        "current_spend_usd": 89.76,
        "budget_limit_usd": 100.0,
        "projected_cost_usd": 0.0023
      }
    },
    {
      "type": "rate_limit_check",
      "timestamp": "2025-12-20T10:45:00.145Z",
      "actor": {
        "service": "RateLimitService"
      },
      "action": "check_rate_limit",
      "result": "passed",
      "details": {
        "current_count": 43,
        "limit": 1000,
        "window": "1 hour"
      }
    },
    {
      "type": "external_execution",
      "timestamp": "2025-12-20T10:45:00.200Z",
      "actor": {
        "service": "ExternalAgentExecutor"
      },
      "action": "execute",
      "target": {
        "endpoint": "https://copilot.microsoft.com/api/agents/hr-assistant",
        "method": "POST"
      },
      "result": "success",
      "duration_ms": 1050
    },
    {
      "type": "audit_log",
      "timestamp": "2025-12-20T10:45:01.250Z",
      "actor": {
        "service": "ObservabilityManager"
      },
      "action": "record_audit",
      "details": {
        "audit_log_id": "audit_xyz789",
        "compliance_tags": ["SOC2", "GDPR"]
      }
    }
  ],
  "summary": {
    "total_steps": 5,
    "total_duration_ms": 1250,
    "governance_checks": 2,
    "all_checks_passed": true,
    "compliance_satisfied": true
  }
}
```

---

## Webhook Platform Configuration

### Endpoints

#### 1. List Supported Platforms

```http
GET /api/v1/webhooks/platforms
```

**Authorization**: `webhooks:read` permission

**Response** (200 OK):
```json
{
  "platforms": [
    {
      "id": "slack",
      "name": "Slack",
      "description": "Slack Block Kit formatted messages",
      "status": "active",
      "capabilities": ["interactive_buttons", "rich_formatting", "threads"],
      "config_schema": {
        "webhook_url": {
          "type": "string",
          "required": true,
          "description": "Slack incoming webhook URL"
        },
        "channel": {
          "type": "string",
          "required": false,
          "description": "Default channel name (optional)"
        }
      }
    },
    {
      "id": "microsoft_teams",
      "name": "Microsoft Teams",
      "description": "Teams Adaptive Cards",
      "status": "active",
      "capabilities": ["adaptive_cards", "action_buttons", "rich_formatting"],
      "config_schema": {
        "webhook_url": {
          "type": "string",
          "required": true,
          "description": "Teams incoming webhook URL"
        }
      }
    },
    {
      "id": "discord",
      "name": "Discord",
      "description": "Discord embeds with color-coded messages",
      "status": "active",
      "capabilities": ["embeds", "color_coding", "rich_formatting"],
      "config_schema": {
        "webhook_url": {
          "type": "string",
          "required": true,
          "description": "Discord webhook URL"
        },
        "username": {
          "type": "string",
          "required": false,
          "description": "Bot username override"
        }
      }
    },
    {
      "id": "telegram",
      "name": "Telegram",
      "description": "Telegram Bot API with Markdown",
      "status": "active",
      "capabilities": ["markdown", "inline_buttons"],
      "config_schema": {
        "bot_token": {
          "type": "string",
          "required": true,
          "description": "Telegram bot token"
        },
        "chat_id": {
          "type": "string",
          "required": true,
          "description": "Chat ID to send messages to"
        }
      }
    }
  ]
}
```

---

#### 2. Create Webhook (Extended)

```http
POST /api/v1/webhooks
```

**Authorization**: `webhooks:create` permission

**Request Body** (Microsoft Teams):
```json
{
  "name": "Teams Production Alerts",
  "url": "https://outlook.office.com/webhook/...",
  "platform": "microsoft_teams",
  "events": [
    "external_agent.invocation.failed",
    "external_agent.budget.exceeded",
    "external_agent.approval.required"
  ],
  "platform_config": {
    "format": "adaptive_card",
    "mention_users": ["user@company.com"],
    "color_scheme": "error_red"
  }
}
```

**Request Body** (Discord):
```json
{
  "name": "Discord Error Notifications",
  "url": "https://discord.com/api/webhooks/...",
  "platform": "discord",
  "events": [
    "external_agent.invocation.failed",
    "external_agent.error_threshold.exceeded"
  ],
  "platform_config": {
    "username": "Kaizen Bot",
    "avatar_url": "https://kaizen.studio/bot-avatar.png",
    "color": "#FF0000"
  }
}
```

**Request Body** (Telegram):
```json
{
  "name": "Telegram Budget Alerts",
  "url": "https://api.telegram.org/bot{token}/sendMessage",
  "platform": "telegram",
  "events": [
    "external_agent.budget.threshold",
    "external_agent.budget.exceeded"
  ],
  "platform_config": {
    "bot_token": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
    "chat_id": "-1001234567890",
    "parse_mode": "MarkdownV2"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "webhook_123",
  "organization_id": "org_abc123",
  "name": "Teams Production Alerts",
  "url": "https://outlook.office.com/webhook/...",
  "platform": "microsoft_teams",
  "secret": "whsec_1234567890abcdef",
  "events": [
    "external_agent.invocation.failed",
    "external_agent.budget.exceeded",
    "external_agent.approval.required"
  ],
  "platform_config": {
    "format": "adaptive_card",
    "mention_users": ["user@company.com"],
    "color_scheme": "error_red"
  },
  "status": "active",
  "last_triggered_at": null,
  "failure_count": 0,
  "created_by": "user_123",
  "created_at": "2025-12-20T10:50:00Z"
}
```

---

#### 3. Test Webhook Delivery

```http
POST /api/v1/webhooks/{id}/test
```

**Authorization**: `webhooks:update` permission

**Request Body**:
```json
{
  "event_type": "external_agent.test",
  "sample_data": {
    "external_agent_id": "ext_agent_1234567890",
    "external_agent_name": "HR Copilot Assistant",
    "message": "This is a test notification"
  }
}
```

**Response** (200 OK):
```json
{
  "message": "Test delivery sent",
  "delivery": {
    "id": "delivery_abc123",
    "webhook_id": "webhook_123",
    "event_type": "external_agent.test",
    "status": "success",
    "response_status": 200,
    "response_body": "{\"status\":\"ok\"}",
    "duration_ms": 234,
    "platform_formatted": true,
    "created_at": "2025-12-20T10:55:00Z"
  }
}
```

---

## Request/Response Schemas

### Pydantic Models

#### External Agent Models

```python
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime

class ExternalAgentAuthConfig(BaseModel):
    """Authentication configuration for external agents."""

    # OAuth2
    client_id: Optional[str] = None
    client_secret: Optional[str] = Field(None, exclude=True)  # Never return
    token_url: Optional[HttpUrl] = None
    scope: Optional[str] = None

    # API Key
    api_key_header: Optional[str] = None
    api_key_value: Optional[str] = Field(None, exclude=True)  # Never return

    # Basic Auth
    username: Optional[str] = None
    password: Optional[str] = Field(None, exclude=True)  # Never return

class CreateExternalAgentRequest(BaseModel):
    """Request to create external agent."""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    platform: str = Field(
        ...,
        pattern=r"^(microsoft_copilot|custom|openai_assistant|anthropic|google_vertex)$"
    )
    endpoint_url: HttpUrl
    auth_type: str = Field(..., pattern=r"^(oauth2|api_key|basic|none)$")
    auth_config: ExternalAgentAuthConfig
    timeout_seconds: int = Field(default=30, ge=5, le=300)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class UpdateExternalAgentRequest(BaseModel):
    """Request to update external agent."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    endpoint_url: Optional[HttpUrl] = None
    auth_config: Optional[ExternalAgentAuthConfig] = None
    timeout_seconds: Optional[int] = Field(None, ge=5, le=300)
    status: Optional[str] = Field(None, pattern=r"^(active|inactive|archived)$")
    metadata: Optional[Dict[str, Any]] = None

class ExternalAgentResponse(BaseModel):
    """Response for external agent."""

    id: str
    organization_id: str
    workspace_id: str
    name: str
    description: Optional[str]
    platform: str
    endpoint_url: str
    auth_type: str
    auth_config: ExternalAgentAuthConfig  # Secrets excluded
    api_key_prefix: str
    status: str
    timeout_seconds: int
    metadata: Dict[str, Any]
    last_invoked_at: Optional[datetime]
    total_invocations: int
    error_count: int
    created_by: str
    created_at: datetime
    updated_at: datetime

class ExternalAgentWithKeyResponse(ExternalAgentResponse):
    """Response for external agent with API key (create only)."""

    api_key: str  # Shown only on creation

class ExternalAgentListResponse(BaseModel):
    """Response for external agent list."""

    records: List[ExternalAgentResponse]
    total: int
```

#### Invocation Models

```python
class InvokeExternalAgentRequest(BaseModel):
    """Request to invoke external agent."""

    inputs: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class InvocationLineage(BaseModel):
    """Lineage information for invocation."""

    invoked_by: str
    invoked_at: datetime
    organization_id: str
    workspace_id: str
    source_platform: Optional[str]
    session_id: Optional[str]
    trace_id: Optional[str]

class InvocationMetrics(BaseModel):
    """Metrics for invocation."""

    duration_ms: int
    input_tokens: Optional[int]
    output_tokens: Optional[int]
    cost_usd: Optional[float]

class InvocationGovernance(BaseModel):
    """Governance checks for invocation."""

    budget_enforced: bool
    approval_required: bool
    rate_limit_remaining: int

class InvokeExternalAgentResponse(BaseModel):
    """Response for external agent invocation."""

    invocation_id: str
    external_agent_id: str
    status: str
    result: Dict[str, Any]
    lineage: InvocationLineage
    metrics: InvocationMetrics
    governance: InvocationGovernance

class InvocationDetailResponse(BaseModel):
    """Detailed invocation information."""

    id: str
    external_agent_id: str
    external_agent_name: str
    organization_id: str
    workspace_id: str
    status: str
    inputs: Dict[str, Any]
    result: Optional[Dict[str, Any]]
    error: Optional[str]
    invoked_by: str
    invoked_at: datetime
    completed_at: Optional[datetime]
    duration_ms: int
    input_tokens: Optional[int]
    output_tokens: Optional[int]
    cost_usd: Optional[float]
    source_ip: Optional[str]
    source_platform: Optional[str]
    session_id: Optional[str]
    trace_id: Optional[str]
    metadata: Dict[str, Any]

class LineageStep(BaseModel):
    """Single step in lineage chain."""

    type: str
    timestamp: datetime
    actor: Dict[str, Any]
    action: str
    target: Optional[Dict[str, Any]] = None
    result: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    duration_ms: Optional[int] = None

class LineageResponse(BaseModel):
    """Full lineage chain."""

    invocation_id: str
    lineage_chain: List[LineageStep]
    summary: Dict[str, Any]
```

#### Webhook Models

```python
class WebhookPlatformConfig(BaseModel):
    """Platform-specific webhook configuration."""

    # Microsoft Teams
    format: Optional[str] = Field(None, pattern=r"^(adaptive_card|message_card)$")
    mention_users: Optional[List[str]] = None
    color_scheme: Optional[str] = None

    # Discord
    username: Optional[str] = None
    avatar_url: Optional[HttpUrl] = None
    color: Optional[str] = None

    # Telegram
    bot_token: Optional[str] = Field(None, exclude=True)  # Never return
    chat_id: Optional[str] = None
    parse_mode: Optional[str] = Field(None, pattern=r"^(Markdown|MarkdownV2|HTML)$")

class CreateWebhookExtendedRequest(BaseModel):
    """Extended webhook creation with platform support."""

    name: str = Field(..., min_length=1, max_length=100)
    url: HttpUrl
    platform: str = Field(
        default="generic",
        pattern=r"^(generic|slack|microsoft_teams|discord|telegram)$"
    )
    events: List[str] = Field(default_factory=list)
    platform_config: Optional[WebhookPlatformConfig] = None

class WebhookPlatformResponse(BaseModel):
    """Supported webhook platform."""

    id: str
    name: str
    description: str
    status: str
    capabilities: List[str]
    config_schema: Dict[str, Any]

class WebhookPlatformListResponse(BaseModel):
    """List of supported platforms."""

    platforms: List[WebhookPlatformResponse]
```

---

## Error Handling

### Error Response Format

All errors follow consistent structure:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  },
  "request_id": "req_abc123"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Missing or invalid authentication |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `validation_error` | 400 | Invalid request data |
| `budget_exceeded` | 402 | Budget limit reached |
| `rate_limit_exceeded` | 429 | Too many requests |
| `approval_required` | 503 | Manual approval needed |
| `external_agent_error` | 502 | External agent execution failed |
| `timeout` | 504 | External agent timeout |
| `internal_error` | 500 | Server error |

### Examples

#### Validation Error

```json
{
  "error": "validation_error",
  "message": "Invalid request data",
  "details": {
    "field": "timeout_seconds",
    "constraint": "Must be between 5 and 300",
    "provided": 500
  },
  "request_id": "req_abc123"
}
```

#### External Agent Error

```json
{
  "error": "external_agent_error",
  "message": "External agent execution failed",
  "details": {
    "external_agent_id": "ext_agent_1234567890",
    "error_type": "http_error",
    "status_code": 500,
    "response_body": "Internal Server Error"
  },
  "request_id": "req_abc123"
}
```

---

## Rate Limiting

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 957
X-RateLimit-Reset: 1735650000
X-RateLimit-Window: 3600
```

### Rate Limit Tiers

| Resource | Limit | Window |
|----------|-------|--------|
| External agent invocations | 1000 per API key | 1 hour |
| Management operations | 100 per user | 1 hour |
| Webhook deliveries | 10000 per organization | 1 hour |
| Test connections | 10 per external agent | 1 hour |

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735650000
Retry-After: 3600
```

```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded for external agent invocations",
  "details": {
    "limit": 1000,
    "window": "1 hour",
    "reset_at": "2025-12-20T11:00:00Z"
  }
}
```

---

## OpenAPI Documentation

### FastAPI Router Tags

```python
router = APIRouter(
    prefix="/external-agents",
    tags=["External Agents"],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not Found"}
    }
)
```

### Endpoint Metadata

```python
@router.post(
    "",
    response_model=ExternalAgentWithKeyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register External Agent",
    description="""
    Register an external agent built on platforms like Microsoft Copilot,
    OpenAI Assistants, or custom tools. This wraps the agent with Kaizen's
    enterprise governance features.

    The response includes a unique API key (shown only once) that external
    systems use to invoke the agent through Kaizen's governance layer.

    **Required Permission**: `external_agents:create`
    """,
    responses={
        201: {
            "description": "External agent registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "ext_agent_1234567890",
                        "name": "HR Copilot Assistant",
                        "api_key": "sk_live_ext_1234567890abcdef",
                        "status": "active"
                    }
                }
            }
        },
        400: {"description": "Invalid request data"},
        403: {"description": "Insufficient permissions"}
    }
)
async def register_external_agent(
    request: CreateExternalAgentRequest,
    current_user: dict = Depends(require_permission("external_agents:create")),
    service: ExternalAgentService = Depends(get_external_agent_service)
):
    ...
```

---

## Code Examples

### Complete FastAPI Router

```python
"""
External Agents Router

FastAPI router for external agent management and invocation endpoints.
"""

import logging
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from kailash.runtime import AsyncLocalRuntime
from pydantic import BaseModel, Field, HttpUrl

from studio.api.auth import require_permission
from studio.services.external_agent_service import ExternalAgentService
from studio.services.budget_service import BudgetService
from studio.services.approval_service import ApprovalService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/external-agents", tags=["External Agents"])


# Dependency factory functions
def get_runtime() -> AsyncLocalRuntime:
    """Get AsyncLocalRuntime for dependency injection."""
    return AsyncLocalRuntime()


def get_external_agent_service(
    runtime: AsyncLocalRuntime = Depends(get_runtime),
) -> ExternalAgentService:
    """Get ExternalAgentService with injected runtime."""
    return ExternalAgentService(runtime=runtime)


def get_budget_service(
    runtime: AsyncLocalRuntime = Depends(get_runtime),
) -> BudgetService:
    """Get BudgetService with injected runtime."""
    return BudgetService(runtime=runtime)


def get_approval_service(
    runtime: AsyncLocalRuntime = Depends(get_runtime),
) -> ApprovalService:
    """Get ApprovalService with injected runtime."""
    return ApprovalService(runtime=runtime)


# Request/Response Models (from schemas above)
# ... (Include all Pydantic models here)


# Management Endpoints

@router.post(
    "",
    response_model=ExternalAgentWithKeyResponse,
    status_code=status.HTTP_201_CREATED
)
async def register_external_agent(
    request: CreateExternalAgentRequest,
    current_user: dict = Depends(require_permission("external_agents:create")),
    service: ExternalAgentService = Depends(get_external_agent_service)
):
    """
    Register an external agent.

    Creates a new external agent registration with governance wrapper.
    Returns API key for invocations (shown only once).
    """
    agent, api_key = await service.create(
        organization_id=current_user["organization_id"],
        workspace_id=current_user.get("workspace_id"),
        name=request.name,
        description=request.description,
        platform=request.platform,
        endpoint_url=str(request.endpoint_url),
        auth_type=request.auth_type,
        auth_config=request.auth_config.model_dump(exclude_none=True),
        timeout_seconds=request.timeout_seconds,
        metadata=request.metadata,
        created_by=current_user["id"]
    )

    return ExternalAgentWithKeyResponse(
        **agent,
        api_key=api_key
    )


@router.get("", response_model=ExternalAgentListResponse)
async def list_external_agents(
    workspace_id: Optional[str] = None,
    status: Optional[str] = None,
    platform: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(require_permission("external_agents:read")),
    service: ExternalAgentService = Depends(get_external_agent_service)
):
    """
    List external agents for the organization.
    """
    filters = {}
    if status:
        filters["status"] = status
    if platform:
        filters["platform"] = platform

    result = await service.list(
        organization_id=current_user["organization_id"],
        workspace_id=workspace_id,
        filters=filters if filters else None,
        limit=limit,
        offset=offset
    )

    return ExternalAgentListResponse(
        records=[ExternalAgentResponse(**r) for r in result["records"]],
        total=result["total"]
    )


@router.get("/{agent_id}", response_model=ExternalAgentResponse)
async def get_external_agent(
    agent_id: str,
    current_user: dict = Depends(require_permission("external_agents:read")),
    service: ExternalAgentService = Depends(get_external_agent_service)
):
    """
    Get external agent details.
    """
    agent = await service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="External agent not found"
        )

    # Verify ownership
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this external agent"
        )

    return ExternalAgentResponse(**agent)


@router.put("/{agent_id}", response_model=ExternalAgentResponse)
async def update_external_agent(
    agent_id: str,
    request: UpdateExternalAgentRequest,
    current_user: dict = Depends(require_permission("external_agents:update")),
    service: ExternalAgentService = Depends(get_external_agent_service)
):
    """
    Update external agent configuration.
    """
    agent = await service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="External agent not found"
        )

    # Verify ownership
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this external agent"
        )

    # Build update data
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    updated_agent = await service.update(agent_id, update_data)
    return ExternalAgentResponse(**updated_agent)


@router.delete("/{agent_id}")
async def delete_external_agent(
    agent_id: str,
    current_user: dict = Depends(require_permission("external_agents:delete")),
    service: ExternalAgentService = Depends(get_external_agent_service)
):
    """
    Archive external agent (soft delete).
    """
    agent = await service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="External agent not found"
        )

    # Verify ownership
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this external agent"
        )

    await service.archive(agent_id)
    return {"message": "External agent archived successfully"}


@router.post("/{agent_id}/test")
async def test_external_agent(
    agent_id: str,
    request: Dict[str, Any],
    current_user: dict = Depends(require_permission("external_agents:update")),
    service: ExternalAgentService = Depends(get_external_agent_service)
):
    """
    Test external agent connection.
    """
    agent = await service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="External agent not found"
        )

    # Verify ownership
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to test this external agent"
        )

    result = await service.test_connection(
        agent_id,
        test_payload=request.get("test_payload", {})
    )

    return result


@router.post("/{agent_id}/rotate-secret")
async def rotate_external_agent_secret(
    agent_id: str,
    current_user: dict = Depends(require_permission("external_agents:update")),
    service: ExternalAgentService = Depends(get_external_agent_service)
):
    """
    Rotate external agent API key.
    """
    agent = await service.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="External agent not found"
        )

    # Verify ownership
    if agent["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to rotate secret for this external agent"
        )

    new_api_key = await service.rotate_api_key(agent_id)

    return {
        "id": agent_id,
        "api_key": new_api_key,
        "rotated_at": datetime.utcnow().isoformat() + "Z",
        "message": "API key rotated successfully. Update your external agent configuration."
    }


# Invocation Endpoints

invocation_router = APIRouter(prefix="/invoke", tags=["External Agent Invocation"])


@invocation_router.post("/{external_agent_id}", response_model=InvokeExternalAgentResponse)
async def invoke_external_agent(
    external_agent_id: str,
    request: InvokeExternalAgentRequest,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    x_source_platform: Optional[str] = Header(None, alias="X-Source-Platform"),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_trace_id: Optional[str] = Header(None, alias="X-Trace-ID"),
    service: ExternalAgentService = Depends(get_external_agent_service),
    budget_service: BudgetService = Depends(get_budget_service),
    approval_service: ApprovalService = Depends(get_approval_service)
):
    """
    Invoke external agent with governance.

    This endpoint wraps external agent execution with:
    - Authentication lineage
    - Budget enforcement
    - Approval workflows
    - Rate limiting
    - Audit trails
    """
    # Validate API key
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header"
        )

    # Get external agent
    agent = await service.get(external_agent_id)
    if not agent or agent["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="External agent not found or inactive"
        )

    # Verify API key matches agent
    if not await service.validate_api_key(external_agent_id, x_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key for this external agent"
        )

    # Budget enforcement
    budget_check = await budget_service.check_external_agent_budget(
        organization_id=agent["organization_id"],
        external_agent_id=external_agent_id,
        estimated_cost=0.01  # Estimate based on inputs
    )

    if not budget_check["allowed"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Monthly budget limit exceeded for external agent",
            headers={
                "X-Budget-Limit": str(budget_check["limit"]),
                "X-Budget-Current": str(budget_check["current"]),
                "X-Budget-Reset": budget_check["reset_date"]
            }
        )

    # Approval check
    approval_required = await approval_service.is_approval_required(
        resource_type="external_agent_invocation",
        resource_id=external_agent_id,
        organization_id=agent["organization_id"]
    )

    if approval_required:
        approval = await approval_service.create_approval_request(
            resource_type="external_agent_invocation",
            resource_id=external_agent_id,
            requested_by=x_user_id or "unknown",
            context={
                "inputs": request.inputs,
                "source_platform": x_source_platform
            }
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="This invocation requires approval before execution",
            headers={
                "X-Approval-ID": approval["id"],
                "X-Approval-Status": "pending"
            }
        )

    # Execute external agent
    result = await service.invoke(
        external_agent_id=external_agent_id,
        inputs=request.inputs,
        metadata={
            **request.metadata,
            "source_platform": x_source_platform,
            "session_id": x_session_id,
            "user_id": x_user_id,
            "trace_id": x_trace_id
        }
    )

    return InvokeExternalAgentResponse(**result)
```

---

## Summary

This API design provides:

1. **Complete External Agent Lifecycle**: Registration, management, testing, rotation
2. **Governed Invocation**: Budget enforcement, approvals, rate limiting
3. **Full Lineage Tracking**: WHO, WHAT, WHEN, WHERE, WHY, RESULT
4. **Platform-Specific Webhooks**: Teams, Discord, Telegram with native formatting
5. **Consistent Patterns**: Following existing Kaizen Studio API conventions
6. **Enterprise-Ready**: Error handling, rate limits, OpenAPI documentation
7. **Security First**: API keys, OAuth, secret management

All endpoints follow the established patterns from `agents.py`, `webhooks.py`, and `api_keys.py` for consistency across the Kaizen Studio API surface.
