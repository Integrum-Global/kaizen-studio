# Management User Flow Guide

**Role**: Org Owner (Organization Owner)
**Primary Focus**: Strategic oversight, billing management, organizational governance, and compliance
**Permissions**: Full platform access (all permissions including organizations:*, billing:*, audit:read)

---

## Overview

Management users (Org Owners) have complete control over the Kaizen Studio platform. They are responsible for strategic decisions, financial management, organizational structure, and compliance. This guide covers executive-level workflows including billing, organization management, and platform governance.

---

## Flow 1: Executive Login and Overview

### Step 1.1: Login as Organization Owner

**User Action**: Navigate to login page with executive credentials

**Frontend Route**: `/login`

**API Endpoint**: `POST /api/v1/auth/login`

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jack@integrum.global",
    "password": "your-password"
  }'
```

**Expected Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "jack@integrum.global",
    "name": "Jack",
    "organization_id": "org-uuid",
    "role": "org_owner"
  },
  "access_token": "eyJhbGciOiJ...",
  "refresh_token": "eyJhbGciOiJ...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

### Step 1.2: Verify Full Access Permissions

**User Action**: Confirm organization owner privileges

**API Endpoint**: `GET /api/v1/auth/permissions`

```bash
curl -X GET http://localhost:8000/api/v1/auth/permissions \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "permissions": [
    "organizations:*",
    "users:*",
    "teams:*",
    "workspaces:*",
    "agents:*",
    "deployments:*",
    "billing:*",
    "policies:*",
    "connectors:*",
    "promotions:*",
    "pipelines:*",
    "panels:*",
    "metrics:*",
    "gateways:*",
    "api_keys:*",
    "webhooks:*",
    "scaling:*",
    "invitations:*",
    "sso:*",
    "audit:read"
  ]
}
```

---

### Step 1.3: View Executive Dashboard

**User Action**: Access high-level platform overview

**Frontend Route**: `/dashboard`

**API Endpoints Called**:
1. `GET /api/v1/metrics/dashboard` - Executive metrics
2. `GET /api/v1/billing/usage` - Usage summary
3. `GET /api/v1/organizations/{org_id}` - Organization details

```bash
# Get executive dashboard metrics
curl -X GET http://localhost:8000/api/v1/metrics/dashboard \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "total_agents": 25,
  "active_deployments": 12,
  "total_executions_30d": 150000,
  "total_tokens_30d": 5000000,
  "active_users": 15,
  "teams_count": 4,
  "error_rate_7d": 0.02,
  "avg_response_time_ms": 850
}
```

---

## Flow 2: Organization Management

### Step 2.1: View Organization Details

**User Action**: Navigate to organization settings

**Frontend Route**: `/settings/organization`

**API Endpoint**: `GET /api/v1/organizations/{org_id}`

```bash
curl -X GET http://localhost:8000/api/v1/organizations/$ORG_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "id": "org-uuid",
  "name": "Integrum Global",
  "slug": "integrum-global",
  "status": "active",
  "plan_tier": "enterprise",
  "created_by": "owner-uuid",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-12-17T10:00:00Z",
  "settings": {
    "default_workspace_id": "workspace-uuid",
    "require_2fa": true,
    "allowed_domains": ["integrum.global"]
  }
}
```

---

### Step 2.2: Update Organization Settings

**User Action**: Modify organization configuration

**API Endpoint**: `PUT /api/v1/organizations/{org_id}`

```bash
curl -X PUT http://localhost:8000/api/v1/organizations/$ORG_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integrum Global AI",
    "settings": {
      "require_2fa": true,
      "session_timeout_minutes": 480,
      "ip_whitelist": ["192.168.1.0/24", "10.0.0.0/8"]
    }
  }'
```

**Expected Response**:
```json
{
  "id": "org-uuid",
  "name": "Integrum Global AI",
  "status": "active",
  "settings": {
    "require_2fa": true,
    "session_timeout_minutes": 480,
    "ip_whitelist": ["192.168.1.0/24", "10.0.0.0/8"]
  },
  "updated_at": "2025-12-17T10:05:00Z"
}
```

---

### Step 2.3: View All Organizations (Multi-tenant)

**User Action**: List all organizations (if super admin)

**API Endpoint**: `GET /api/v1/organizations`

```bash
curl -X GET http://localhost:8000/api/v1/organizations \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "org-uuid-1",
      "name": "Integrum Global AI",
      "slug": "integrum-global",
      "status": "active",
      "plan_tier": "enterprise",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

---

## Flow 3: Billing and Financial Management

### Step 3.1: View Usage Summary

**User Action**: Check current billing period usage

**Frontend Route**: `/billing`

**API Endpoint**: `GET /api/v1/billing/usage`

```bash
curl -X GET http://localhost:8000/api/v1/billing/usage \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "period": {
    "start": "2025-12-01T00:00:00Z",
    "end": "2025-12-31T23:59:59Z"
  },
  "usage": {
    "total_tokens": 5250000,
    "total_executions": 175000,
    "total_storage_gb": 12.5,
    "total_api_calls": 450000
  },
  "costs": {
    "tokens": 525.00,
    "executions": 87.50,
    "storage": 12.50,
    "api_calls": 45.00,
    "total": 670.00,
    "currency": "USD"
  }
}
```

---

### Step 3.2: View Detailed Usage Breakdown

**User Action**: Analyze usage by resource

**API Endpoint**: `GET /api/v1/billing/usage/details`

```bash
curl -X GET "http://localhost:8000/api/v1/billing/usage/details?group_by=agent" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "period": {
    "start": "2025-12-01T00:00:00Z",
    "end": "2025-12-31T23:59:59Z"
  },
  "breakdown": [
    {
      "resource_type": "agent",
      "resource_id": "agent-uuid-1",
      "resource_name": "Customer Support Agent",
      "tokens": 2100000,
      "executions": 75000,
      "cost": 285.00
    },
    {
      "resource_type": "agent",
      "resource_id": "agent-uuid-2",
      "resource_name": "Sales Assistant",
      "tokens": 1500000,
      "executions": 50000,
      "cost": 195.00
    }
  ]
}
```

---

### Step 3.3: View and Manage Quotas

**User Action**: Check and adjust resource limits

**API Endpoint**: `GET /api/v1/billing/quotas`

```bash
curl -X GET http://localhost:8000/api/v1/billing/quotas \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "quotas": [
    {
      "resource_type": "tokens",
      "limit": 10000000,
      "used": 5250000,
      "remaining": 4750000,
      "percentage_used": 52.5
    },
    {
      "resource_type": "executions",
      "limit": 500000,
      "used": 175000,
      "remaining": 325000,
      "percentage_used": 35.0
    },
    {
      "resource_type": "agents",
      "limit": 50,
      "used": 25,
      "remaining": 25,
      "percentage_used": 50.0
    },
    {
      "resource_type": "deployments",
      "limit": 20,
      "used": 12,
      "remaining": 8,
      "percentage_used": 60.0
    }
  ]
}
```

---

### Step 3.4: Update Quota Limits

**User Action**: Increase resource quota

**API Endpoint**: `PUT /api/v1/billing/quotas/{resource_type}`

```bash
curl -X PUT http://localhost:8000/api/v1/billing/quotas/tokens \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 20000000
  }'
```

**Expected Response**:
```json
{
  "resource_type": "tokens",
  "previous_limit": 10000000,
  "new_limit": 20000000,
  "updated_at": "2025-12-17T10:10:00Z"
}
```

---

### Step 3.5: View Billing Periods

**User Action**: Review historical billing

**API Endpoint**: `GET /api/v1/billing/periods`

```bash
curl -X GET http://localhost:8000/api/v1/billing/periods \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "period-uuid-1",
      "start_date": "2025-12-01",
      "end_date": "2025-12-31",
      "status": "active",
      "total_cost": 670.00
    },
    {
      "id": "period-uuid-2",
      "start_date": "2025-11-01",
      "end_date": "2025-11-30",
      "status": "closed",
      "total_cost": 542.50
    }
  ],
  "total": 2
}
```

---

### Step 3.6: Get Cost Estimate

**User Action**: Project future costs

**API Endpoint**: `POST /api/v1/billing/estimate`

```bash
curl -X POST http://localhost:8000/api/v1/billing/estimate \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": 10000000,
    "executions": 300000,
    "agents": 40,
    "deployments": 15
  }'
```

**Expected Response**:
```json
{
  "estimated_cost": {
    "tokens": 1000.00,
    "executions": 150.00,
    "platform_fee": 500.00,
    "total": 1650.00,
    "currency": "USD"
  },
  "recommendations": [
    "Consider enterprise tier for 20% discount on tokens",
    "Bulk execution package available for high-volume usage"
  ]
}
```

---

### Step 3.7: View Pricing Information

**User Action**: Check current pricing tiers

**API Endpoint**: `GET /api/v1/billing/pricing`

```bash
curl -X GET http://localhost:8000/api/v1/billing/pricing \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "pricing": {
    "tokens": {
      "unit": "per 1M tokens",
      "price": 100.00,
      "currency": "USD"
    },
    "executions": {
      "unit": "per 1K executions",
      "price": 0.50,
      "currency": "USD"
    },
    "storage": {
      "unit": "per GB/month",
      "price": 1.00,
      "currency": "USD"
    }
  },
  "plans": [
    {
      "name": "Free",
      "monthly_cost": 0,
      "tokens_included": 100000,
      "executions_included": 1000
    },
    {
      "name": "Pro",
      "monthly_cost": 99,
      "tokens_included": 1000000,
      "executions_included": 50000
    },
    {
      "name": "Enterprise",
      "monthly_cost": 499,
      "tokens_included": 10000000,
      "executions_included": 500000
    }
  ]
}
```

---

## Flow 4: Promotion Workflow Management

### Step 4.1: View Pending Promotions

**User Action**: Review deployment promotions awaiting approval

**Frontend Route**: `/promotions`

**API Endpoint**: `GET /api/v1/promotions`

```bash
curl -X GET "http://localhost:8000/api/v1/promotions?status=pending" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "promotion-uuid",
      "name": "Customer Support Agent v2.0",
      "resource_type": "agent",
      "resource_id": "agent-uuid",
      "source_environment": "staging",
      "target_environment": "production",
      "status": "pending_approval",
      "requested_by": "developer-uuid",
      "requested_at": "2025-12-17T09:00:00Z",
      "changes": {
        "system_prompt": "Updated with new product information",
        "temperature": "0.7 → 0.5"
      }
    }
  ],
  "total": 1
}
```

---

### Step 4.2: Approve Promotion

**User Action**: Approve deployment to production

**API Endpoint**: `POST /api/v1/promotions/{promotion_id}/approve`

```bash
curl -X POST http://localhost:8000/api/v1/promotions/$PROMOTION_ID/approve \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Approved for production release after QA review"
  }'
```

**Expected Response**:
```json
{
  "id": "promotion-uuid",
  "status": "approved",
  "approved_by": "owner-uuid",
  "approved_at": "2025-12-17T10:20:00Z",
  "comment": "Approved for production release after QA review"
}
```

---

### Step 4.3: Reject Promotion

**User Action**: Deny deployment with feedback

**API Endpoint**: `POST /api/v1/promotions/{promotion_id}/reject`

```bash
curl -X POST http://localhost:8000/api/v1/promotions/$PROMOTION_ID/reject \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Performance regression detected in staging. Please optimize before production."
  }'
```

---

### Step 4.4: Configure Promotion Rules

**User Action**: Set up automatic promotion policies

**API Endpoint**: `POST /api/v1/promotions/rules`

```bash
curl -X POST http://localhost:8000/api/v1/promotions/rules \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auto-promote to Staging",
    "source_environment": "development",
    "target_environment": "staging",
    "conditions": {
      "all_tests_passed": true,
      "min_code_coverage": 80,
      "no_critical_vulnerabilities": true
    },
    "auto_approve": true,
    "notify_on_promotion": ["jack@integrum.global"],
    "is_active": true
  }'
```

**Expected Response**:
```json
{
  "id": "rule-uuid",
  "name": "Auto-promote to Staging",
  "source_environment": "development",
  "target_environment": "staging",
  "auto_approve": true,
  "is_active": true,
  "created_at": "2025-12-17T10:25:00Z"
}
```

---

## Flow 5: RBAC Management

### Step 5.1: View All Permissions

**User Action**: Review available permissions

**API Endpoint**: `GET /api/v1/rbac/permissions`

```bash
curl -X GET http://localhost:8000/api/v1/rbac/permissions \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "permissions": [
    {"id": "perm-1", "name": "organizations:create", "description": "Create organizations"},
    {"id": "perm-2", "name": "organizations:read", "description": "View organizations"},
    {"id": "perm-3", "name": "users:create", "description": "Create users"},
    {"id": "perm-4", "name": "users:read", "description": "View users"},
    {"id": "perm-5", "name": "agents:create", "description": "Create AI agents"},
    {"id": "perm-6", "name": "billing:read", "description": "View billing information"}
  ],
  "total": 50
}
```

---

### Step 5.2: View Role Permissions

**User Action**: Check specific role's permissions

**API Endpoint**: `GET /api/v1/rbac/roles/{role}`

```bash
curl -X GET http://localhost:8000/api/v1/rbac/roles/developer \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "role": "developer",
  "permissions": [
    "agents:create",
    "agents:read",
    "agents:update",
    "agents:delete",
    "deployments:create",
    "deployments:read",
    "deployments:update",
    "pipelines:read",
    "connectors:read",
    "connectors:execute",
    "metrics:read",
    "api_keys:create",
    "api_keys:read"
  ]
}
```

---

### Step 5.3: Grant Permission to Role

**User Action**: Add new permission to role

**API Endpoint**: `POST /api/v1/rbac/roles/{role}`

```bash
curl -X POST http://localhost:8000/api/v1/rbac/roles/developer \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permission": "pipelines:create"
  }'
```

**Expected Response**:
```json
{
  "role": "developer",
  "permission_added": "pipelines:create",
  "total_permissions": 14
}
```

---

### Step 5.4: Revoke Permission from Role

**User Action**: Remove permission from role

**API Endpoint**: `DELETE /api/v1/rbac/roles/{role}/{permission_id}`

```bash
curl -X DELETE http://localhost:8000/api/v1/rbac/roles/developer/perm-uuid \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Flow 6: Compliance and Audit

### Step 6.1: View Comprehensive Audit Trail

**User Action**: Review all platform activity

**Frontend Route**: `/audit`

**API Endpoint**: `GET /api/v1/audit/logs`

```bash
curl -X GET "http://localhost:8000/api/v1/audit/logs?limit=50&sort=desc" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "audit-uuid-1",
      "timestamp": "2025-12-17T10:20:00Z",
      "user_id": "owner-uuid",
      "user_email": "jack@integrum.global",
      "action": "promotion.approved",
      "resource_type": "promotion",
      "resource_id": "promotion-uuid",
      "details": {
        "target_environment": "production",
        "comment": "Approved for production release"
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0..."
    },
    {
      "id": "audit-uuid-2",
      "timestamp": "2025-12-17T10:10:00Z",
      "user_id": "owner-uuid",
      "user_email": "jack@integrum.global",
      "action": "quota.updated",
      "resource_type": "quota",
      "resource_id": "tokens",
      "details": {
        "previous_limit": 10000000,
        "new_limit": 20000000
      },
      "ip_address": "192.168.1.1"
    }
  ],
  "total": 50
}
```

---

### Step 6.2: Filter Audit by Resource

**User Action**: Review activity for specific resource type

**API Endpoint**: `GET /api/v1/audit/resources/{resource_type}/{resource_id}`

```bash
curl -X GET http://localhost:8000/api/v1/audit/resources/agent/$AGENT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### Step 6.3: Export Compliance Report

**User Action**: Generate compliance audit report

**API Endpoint**: `GET /api/v1/audit/export`

```bash
curl -X GET "http://localhost:8000/api/v1/audit/export?start_date=2025-01-01&end_date=2025-12-31&format=json&include_details=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o compliance_report_2025.json
```

---

## Flow 7: Platform Metrics Overview

### Step 7.1: View Platform-wide Metrics

**User Action**: Access executive metrics dashboard

**Frontend Route**: `/metrics`

**API Endpoint**: `GET /api/v1/metrics/summary`

```bash
curl -X GET http://localhost:8000/api/v1/metrics/summary \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "period": "30d",
  "summary": {
    "total_executions": 175000,
    "total_tokens": 5250000,
    "avg_latency_ms": 850,
    "error_rate": 0.02,
    "success_rate": 0.98,
    "unique_users": 15
  },
  "trends": {
    "executions": "+15%",
    "tokens": "+22%",
    "latency": "-5%",
    "error_rate": "-0.5%"
  }
}
```

---

### Step 7.2: View Time Series Data

**User Action**: Analyze trends over time

**API Endpoint**: `GET /api/v1/metrics/timeseries`

```bash
curl -X GET "http://localhost:8000/api/v1/metrics/timeseries?metric=executions&period=30d&interval=1d" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "metric": "executions",
  "period": "30d",
  "interval": "1d",
  "data": [
    {"timestamp": "2025-12-01", "value": 5000},
    {"timestamp": "2025-12-02", "value": 5200},
    {"timestamp": "2025-12-03", "value": 6100},
    {"timestamp": "2025-12-17", "value": 7500}
  ]
}
```

---

### Step 7.3: View Error Analytics

**User Action**: Analyze error patterns

**API Endpoint**: `GET /api/v1/metrics/errors`

```bash
curl -X GET "http://localhost:8000/api/v1/metrics/errors?period=7d" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "period": "7d",
  "total_errors": 3500,
  "error_rate": 0.02,
  "by_type": [
    {"type": "timeout", "count": 1500, "percentage": 42.8},
    {"type": "rate_limit", "count": 1000, "percentage": 28.6},
    {"type": "validation", "count": 500, "percentage": 14.3},
    {"type": "internal", "count": 500, "percentage": 14.3}
  ],
  "by_agent": [
    {"agent_id": "agent-uuid-1", "agent_name": "Support Bot", "errors": 2000},
    {"agent_id": "agent-uuid-2", "agent_name": "Sales Bot", "errors": 1500}
  ]
}
```

---

## Flow 8: API Key Oversight

### Step 8.1: View All API Keys

**User Action**: Review organization's API keys

**Frontend Route**: `/settings/api-keys`

**API Endpoint**: `GET /api/v1/api-keys`

```bash
curl -X GET http://localhost:8000/api/v1/api-keys \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "key-uuid-1",
      "name": "Production Integration",
      "prefix": "ks_live_abc",
      "scopes": ["agents:execute", "pipelines:execute"],
      "created_by": "developer-uuid",
      "created_at": "2025-12-01T10:00:00Z",
      "last_used_at": "2025-12-17T09:45:00Z",
      "expires_at": "2026-12-31T23:59:59Z"
    },
    {
      "id": "key-uuid-2",
      "name": "Development Testing",
      "prefix": "ks_test_xyz",
      "scopes": ["agents:*"],
      "created_by": "owner-uuid",
      "created_at": "2025-12-10T14:00:00Z",
      "last_used_at": "2025-12-17T08:30:00Z",
      "expires_at": null
    }
  ],
  "total": 2
}
```

---

### Step 8.2: View API Key Usage

**User Action**: Analyze key utilization

**API Endpoint**: `GET /api/v1/api-keys/{key_id}/usage`

```bash
curl -X GET http://localhost:8000/api/v1/api-keys/$KEY_ID/usage \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "key_id": "key-uuid-1",
  "period": "30d",
  "usage": {
    "total_requests": 45000,
    "successful_requests": 44100,
    "failed_requests": 900,
    "rate_limited": 150
  },
  "by_endpoint": [
    {"endpoint": "/agents/{id}/execute", "count": 30000},
    {"endpoint": "/pipelines/{id}/execute", "count": 15000}
  ]
}
```

---

### Step 8.3: Revoke API Key

**User Action**: Disable compromised or unnecessary key

**API Endpoint**: `DELETE /api/v1/api-keys/{key_id}`

```bash
curl -X DELETE http://localhost:8000/api/v1/api-keys/$KEY_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "message": "API key revoked successfully",
  "key_id": "key-uuid",
  "revoked_at": "2025-12-17T10:35:00Z"
}
```

---

## Summary: Management User API Endpoints

| Flow | Action | Endpoint |
|------|--------|----------|
| Login | Authenticate | `POST /api/v1/auth/login` |
| Permissions | Full access | `GET /api/v1/auth/permissions` |
| Dashboard | Executive metrics | `GET /api/v1/metrics/dashboard` |
| Organization | View | `GET /api/v1/organizations/{id}` |
| Organization | Update | `PUT /api/v1/organizations/{id}` |
| Billing | Usage summary | `GET /api/v1/billing/usage` |
| Billing | Usage details | `GET /api/v1/billing/usage/details` |
| Billing | View quotas | `GET /api/v1/billing/quotas` |
| Billing | Update quota | `PUT /api/v1/billing/quotas/{type}` |
| Billing | View periods | `GET /api/v1/billing/periods` |
| Billing | Estimate | `POST /api/v1/billing/estimate` |
| Billing | Pricing | `GET /api/v1/billing/pricing` |
| Promotions | List pending | `GET /api/v1/promotions` |
| Promotions | Approve | `POST /api/v1/promotions/{id}/approve` |
| Promotions | Reject | `POST /api/v1/promotions/{id}/reject` |
| Promotions | Create rule | `POST /api/v1/promotions/rules` |
| RBAC | List permissions | `GET /api/v1/rbac/permissions` |
| RBAC | View role | `GET /api/v1/rbac/roles/{role}` |
| RBAC | Grant permission | `POST /api/v1/rbac/roles/{role}` |
| RBAC | Revoke permission | `DELETE /api/v1/rbac/roles/{role}/{id}` |
| Audit | List logs | `GET /api/v1/audit/logs` |
| Audit | Resource audit | `GET /api/v1/audit/resources/{type}/{id}` |
| Audit | Export | `GET /api/v1/audit/export` |
| Metrics | Summary | `GET /api/v1/metrics/summary` |
| Metrics | Time series | `GET /api/v1/metrics/timeseries` |
| Metrics | Errors | `GET /api/v1/metrics/errors` |
| API Keys | List all | `GET /api/v1/api-keys` |
| API Keys | Usage | `GET /api/v1/api-keys/{id}/usage` |
| API Keys | Revoke | `DELETE /api/v1/api-keys/{id}` |

---

## Frontend Routes Summary

| Route | Page | Purpose |
|-------|------|---------|
| `/login` | LoginPage | Executive authentication |
| `/dashboard` | Dashboard | Executive overview |
| `/settings/organization` | OrgSettingsPage | Organization management |
| `/billing` | BillingPage | Financial management |
| `/billing/quotas` | QuotasPage | Resource limits |
| `/promotions` | PromotionsPage | Deployment approvals |
| `/settings/roles` | RolesPage | RBAC management |
| `/audit` | AuditPage | Compliance review |
| `/metrics` | MetricsPage | Platform analytics |
| `/settings/api-keys` | APIKeysPage | Key management |

---

## Executive Decision Points

| Decision | Information Source | API Endpoint |
|----------|-------------------|--------------|
| Budget allocation | Usage details | `GET /api/v1/billing/usage/details` |
| Team scaling | User metrics | `GET /api/v1/metrics/dashboard` |
| Security posture | Audit logs | `GET /api/v1/audit/logs` |
| Production readiness | Promotion review | `GET /api/v1/promotions` |
| Cost optimization | Cost estimate | `POST /api/v1/billing/estimate` |
| Capacity planning | Quota utilization | `GET /api/v1/billing/quotas` |

---

*Document Version: 1.0*
*Last Updated: 2025-12-17*
*Author: Kaizen Studio Team*
