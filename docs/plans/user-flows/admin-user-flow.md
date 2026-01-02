# Admin User Flow Guide

**Role**: Org Admin (Organization Administrator)
**Primary Focus**: User management, team administration, security policies, and operational oversight
**Permissions**: users:*, teams:*, policies:*, connectors:*, webhooks:*, invitations:*, sso:*, scaling:*

---

## Overview

Admin users are responsible for the operational management of the Kaizen Studio platform. They manage users and teams, configure access policies, set up integrations, and ensure platform security. This guide covers all administrative workflows.

---

## Flow 1: Initial Login and Admin Dashboard

### Step 1.1: Login as Admin

**User Action**: Navigate to login page and enter admin credentials

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
    "role": "org_admin"
  },
  "access_token": "eyJhbGciOiJ...",
  "refresh_token": "eyJhbGciOiJ...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

### Step 1.2: View Admin Permissions

**User Action**: Check available admin permissions

**API Endpoint**: `GET /api/v1/auth/permissions`

```bash
curl -X GET http://localhost:8000/api/v1/auth/permissions \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "permissions": [
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "teams:create",
    "teams:read",
    "teams:update",
    "teams:delete",
    "policies:create",
    "policies:read",
    "policies:update",
    "policies:delete",
    "invitations:create",
    "invitations:read",
    "sso:create",
    "sso:read",
    "sso:update",
    "webhooks:create",
    "webhooks:read",
    "scaling:read",
    "scaling:update"
  ]
}
```

---

## Flow 2: User Management

### Step 2.1: View All Users

**User Action**: Navigate to Users section

**Frontend Route**: `/users`

**API Endpoint**: `GET /api/v1/users`

```bash
curl -X GET http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "user-uuid-1",
      "email": "developer@integrum.global",
      "name": "Developer User",
      "role": "developer",
      "status": "active",
      "created_at": "2025-12-01T10:00:00Z",
      "last_login_at": "2025-12-17T08:30:00Z"
    },
    {
      "id": "user-uuid-2",
      "email": "viewer@integrum.global",
      "name": "Viewer User",
      "role": "viewer",
      "status": "active",
      "created_at": "2025-12-05T14:00:00Z",
      "last_login_at": "2025-12-16T16:45:00Z"
    }
  ],
  "total": 2
}
```

---

### Step 2.2: Invite New User

**User Action**: Click "Invite User" and fill form

**Frontend Route**: `/users` (Invite dialog)

**API Endpoint**: `POST /api/v1/invitations`

```bash
curl -X POST http://localhost:8000/api/v1/invitations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@integrum.global",
    "role": "developer",
    "team_ids": ["team-uuid"],
    "message": "Welcome to Kaizen Studio! Join our AI development team."
  }'
```

**Expected Response**:
```json
{
  "id": "invitation-uuid",
  "email": "newuser@integrum.global",
  "role": "developer",
  "status": "pending",
  "token": "inv_abc123...",
  "expires_at": "2025-12-24T10:00:00Z",
  "created_at": "2025-12-17T10:00:00Z"
}
```

**Frontend Behavior**:
- Show success notification
- Update invitations list
- Email sent automatically to invitee

---

### Step 2.3: View Pending Invitations

**User Action**: Check status of sent invitations

**API Endpoint**: `GET /api/v1/invitations`

```bash
curl -X GET http://localhost:8000/api/v1/invitations \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "invitation-uuid",
      "email": "newuser@integrum.global",
      "role": "developer",
      "status": "pending",
      "expires_at": "2025-12-24T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

### Step 2.4: Update User Role

**User Action**: Change a user's role

**Frontend Route**: `/users/{user-id}`

**API Endpoint**: `PUT /api/v1/users/{user_id}`

```bash
curl -X PUT http://localhost:8000/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "org_admin"
  }'
```

**Expected Response**:
```json
{
  "id": "user-uuid",
  "email": "developer@integrum.global",
  "name": "Developer User",
  "role": "org_admin",
  "status": "active",
  "updated_at": "2025-12-17T10:15:00Z"
}
```

---

### Step 2.5: Deactivate User

**User Action**: Disable a user account

**API Endpoint**: `PUT /api/v1/users/{user_id}`

```bash
curl -X PUT http://localhost:8000/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive"
  }'
```

---

## Flow 3: Team Management

### Step 3.1: View All Teams

**User Action**: Navigate to Teams section

**Frontend Route**: `/teams`

**API Endpoint**: `GET /api/v1/teams`

```bash
curl -X GET http://localhost:8000/api/v1/teams \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "team-uuid-1",
      "name": "AI Engineering",
      "description": "AI development and deployment team",
      "member_count": 5,
      "created_at": "2025-12-01T10:00:00Z"
    },
    {
      "id": "team-uuid-2",
      "name": "Platform Operations",
      "description": "Platform maintenance and support",
      "member_count": 3,
      "created_at": "2025-12-05T14:00:00Z"
    }
  ],
  "total": 2
}
```

---

### Step 3.2: Create New Team

**User Action**: Click "Create Team" and fill form

**Frontend Route**: `/teams` (Create dialog)

**API Endpoint**: `POST /api/v1/teams`

```bash
curl -X POST http://localhost:8000/api/v1/teams \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Science",
    "description": "Data science and analytics team"
  }'
```

**Expected Response**:
```json
{
  "id": "team-uuid-3",
  "name": "Data Science",
  "description": "Data science and analytics team",
  "member_count": 0,
  "created_at": "2025-12-17T10:20:00Z"
}
```

---

### Step 3.3: Add Member to Team

**User Action**: Add user to team

**Frontend Route**: `/teams/{team-id}` (Members tab)

**API Endpoint**: `POST /api/v1/teams/{team_id}/members`

```bash
curl -X POST http://localhost:8000/api/v1/teams/$TEAM_ID/members \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "role": "member"
  }'
```

**Expected Response**:
```json
{
  "team_id": "team-uuid",
  "user_id": "user-uuid",
  "role": "member",
  "added_at": "2025-12-17T10:25:00Z"
}
```

---

### Step 3.4: Remove Member from Team

**User Action**: Remove user from team

**API Endpoint**: `DELETE /api/v1/teams/{team_id}/members/{user_id}`

```bash
curl -X DELETE http://localhost:8000/api/v1/teams/$TEAM_ID/members/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Flow 4: Access Policy Management (ABAC)

### Step 4.1: View All Policies

**User Action**: Navigate to Policies section

**Frontend Route**: `/policies`

**API Endpoint**: `GET /api/v1/policies`

```bash
curl -X GET http://localhost:8000/api/v1/policies \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "policy-uuid-1",
      "name": "Production Access Restriction",
      "description": "Restrict production deployments to senior developers",
      "resource_type": "deployments",
      "effect": "deny",
      "priority": 100,
      "is_active": true
    }
  ],
  "total": 1
}
```

---

### Step 4.2: Create Access Policy

**User Action**: Define new ABAC policy

**Frontend Route**: `/policies/new`

**API Endpoint**: `POST /api/v1/policies`

```bash
curl -X POST http://localhost:8000/api/v1/policies \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Workspace Development Only",
    "description": "Restrict viewers to development workspace only",
    "resource_type": "agents",
    "conditions": [
      {
        "attribute": "workspace.environment_type",
        "operator": "eq",
        "value": "development"
      }
    ],
    "effect": "allow",
    "priority": 50,
    "is_active": true
  }'
```

**Expected Response**:
```json
{
  "id": "policy-uuid-2",
  "name": "Workspace Development Only",
  "resource_type": "agents",
  "effect": "allow",
  "priority": 50,
  "is_active": true,
  "created_at": "2025-12-17T10:30:00Z"
}
```

---

### Step 4.3: Assign Policy to Team

**User Action**: Apply policy to a team

**API Endpoint**: `POST /api/v1/policies/{policy_id}/assign`

```bash
curl -X POST http://localhost:8000/api/v1/policies/$POLICY_ID/assign \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_type": "team",
    "target_id": "team-uuid"
  }'
```

**Expected Response**:
```json
{
  "id": "assignment-uuid",
  "policy_id": "policy-uuid",
  "target_type": "team",
  "target_id": "team-uuid",
  "created_at": "2025-12-17T10:35:00Z"
}
```

---

### Step 4.4: Test Policy Evaluation

**User Action**: Verify policy works correctly

**API Endpoint**: `POST /api/v1/policies/evaluate`

```bash
curl -X POST http://localhost:8000/api/v1/policies/evaluate \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "resource_type": "agents",
    "resource_id": "agent-uuid",
    "action": "read"
  }'
```

**Expected Response**:
```json
{
  "allowed": true,
  "matched_policies": [
    {
      "id": "policy-uuid",
      "name": "Workspace Development Only",
      "effect": "allow"
    }
  ],
  "evaluation_time_ms": 5
}
```

---

## Flow 5: SSO Configuration

### Step 5.1: View SSO Connections

**User Action**: Navigate to SSO settings

**Frontend Route**: `/settings/sso`

**API Endpoint**: `GET /api/v1/sso/connections`

```bash
curl -X GET http://localhost:8000/api/v1/sso/connections \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [],
  "total": 0
}
```

---

### Step 5.2: Configure Google SSO

**User Action**: Set up Google OAuth

**API Endpoint**: `POST /api/v1/sso/connections`

```bash
curl -X POST http://localhost:8000/api/v1/sso/connections \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google Workspace",
    "provider": "google",
    "client_id": "your-google-client-id.apps.googleusercontent.com",
    "client_secret": "your-google-client-secret",
    "allowed_domains": ["integrum.global"],
    "auto_provision": true,
    "default_role": "developer",
    "is_active": true
  }'
```

**Expected Response**:
```json
{
  "id": "sso-uuid",
  "name": "Google Workspace",
  "provider": "google",
  "allowed_domains": ["integrum.global"],
  "auto_provision": true,
  "is_active": true,
  "created_at": "2025-12-17T10:40:00Z"
}
```

---

### Step 5.3: Configure Okta SSO

**User Action**: Set up Okta OIDC

**API Endpoint**: `POST /api/v1/sso/connections`

```bash
curl -X POST http://localhost:8000/api/v1/sso/connections \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Okta Enterprise",
    "provider": "okta",
    "client_id": "your-okta-client-id",
    "client_secret": "your-okta-client-secret",
    "metadata_url": "https://your-domain.okta.com/.well-known/openid-configuration",
    "allowed_domains": ["integrum.global"],
    "auto_provision": true,
    "default_role": "developer",
    "is_active": true
  }'
```

---

### Step 5.4: Test SSO Connection

**User Action**: Verify SSO works

**API Endpoint**: `GET /api/v1/sso/initiate/{provider}`

```bash
curl -X GET "http://localhost:8000/api/v1/sso/initiate/google" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response** (when configured):
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "csrf-token"
}
```

---

## Flow 6: Webhook Management

### Step 6.1: View Available Events

**User Action**: Check webhook event types

**API Endpoint**: `GET /api/v1/webhooks/events`

```bash
curl -X GET http://localhost:8000/api/v1/webhooks/events \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "events": [
    {"id": "agent.created", "name": "Agent Created"},
    {"id": "agent.updated", "name": "Agent Updated"},
    {"id": "agent.deployed", "name": "Agent Deployed"},
    {"id": "deployment.started", "name": "Deployment Started"},
    {"id": "deployment.completed", "name": "Deployment Completed"},
    {"id": "deployment.failed", "name": "Deployment Failed"},
    {"id": "pipeline.executed", "name": "Pipeline Executed"},
    {"id": "user.created", "name": "User Created"},
    {"id": "user.invited", "name": "User Invited"}
  ]
}
```

---

### Step 6.2: Create Webhook

**User Action**: Configure external notification

**Frontend Route**: `/settings/webhooks`

**API Endpoint**: `POST /api/v1/webhooks`

```bash
curl -X POST http://localhost:8000/api/v1/webhooks \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Notifications",
    "url": "https://example.com/webhook/slack-endpoint",
    "events": ["deployment.completed", "deployment.failed"],
    "secret": "webhook-signing-secret",
    "is_active": true
  }'
```

**Expected Response**:
```json
{
  "id": "webhook-uuid",
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/services/...",
  "events": ["deployment.completed", "deployment.failed"],
  "is_active": true,
  "created_at": "2025-12-17T10:45:00Z"
}
```

---

### Step 6.3: Test Webhook

**User Action**: Send test payload

**API Endpoint**: `POST /api/v1/webhooks/{webhook_id}/test`

```bash
curl -X POST http://localhost:8000/api/v1/webhooks/$WEBHOOK_ID/test \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "response_status": 200,
  "response_time_ms": 150
}
```

---

### Step 6.4: View Webhook Deliveries

**User Action**: Check delivery history

**API Endpoint**: `GET /api/v1/webhooks/{webhook_id}/deliveries`

```bash
curl -X GET http://localhost:8000/api/v1/webhooks/$WEBHOOK_ID/deliveries \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "delivery-uuid",
      "event": "deployment.completed",
      "status": "delivered",
      "response_status": 200,
      "delivered_at": "2025-12-17T10:50:00Z"
    }
  ],
  "total": 1
}
```

---

## Flow 7: Scaling Configuration

### Step 7.1: View Scaling Policies

**User Action**: Navigate to Scaling settings

**Frontend Route**: `/settings/scaling`

**API Endpoint**: `GET /api/v1/scaling/policies`

```bash
curl -X GET http://localhost:8000/api/v1/scaling/policies \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### Step 7.2: Create Scaling Policy

**User Action**: Configure auto-scaling rules

**API Endpoint**: `POST /api/v1/scaling/policies`

```bash
curl -X POST http://localhost:8000/api/v1/scaling/policies \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Traffic Scaling",
    "gateway_id": "gateway-uuid",
    "min_replicas": 2,
    "max_replicas": 10,
    "target_cpu_utilization": 70,
    "scale_up_threshold": 80,
    "scale_down_threshold": 30,
    "cooldown_seconds": 300,
    "is_active": true
  }'
```

**Expected Response**:
```json
{
  "id": "policy-uuid",
  "name": "High Traffic Scaling",
  "gateway_id": "gateway-uuid",
  "min_replicas": 2,
  "max_replicas": 10,
  "is_active": true,
  "created_at": "2025-12-17T10:55:00Z"
}
```

---

### Step 7.3: View Scaling Events

**User Action**: Monitor scaling activity

**API Endpoint**: `GET /api/v1/scaling/gateways/{gateway_id}/events`

```bash
curl -X GET http://localhost:8000/api/v1/scaling/gateways/$GATEWAY_ID/events \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "event-uuid",
      "event_type": "scale_up",
      "from_replicas": 2,
      "to_replicas": 4,
      "trigger": "cpu_threshold",
      "cpu_utilization": 85,
      "occurred_at": "2025-12-17T11:00:00Z"
    }
  ],
  "total": 1
}
```

---

## Flow 8: Audit Log Review

### Step 8.1: View Audit Logs

**User Action**: Review platform activity

**Frontend Route**: `/audit`

**API Endpoint**: `GET /api/v1/audit/logs`

```bash
curl -X GET "http://localhost:8000/api/v1/audit/logs?limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [
    {
      "id": "audit-uuid-1",
      "user_id": "user-uuid",
      "user_email": "jack@integrum.global",
      "action": "user.invited",
      "resource_type": "invitation",
      "resource_id": "invitation-uuid",
      "details": {"invitee_email": "newuser@integrum.global"},
      "ip_address": "192.168.1.1",
      "created_at": "2025-12-17T10:00:00Z"
    },
    {
      "id": "audit-uuid-2",
      "user_id": "user-uuid",
      "user_email": "jack@integrum.global",
      "action": "team.created",
      "resource_type": "team",
      "resource_id": "team-uuid",
      "details": {"team_name": "Data Science"},
      "ip_address": "192.168.1.1",
      "created_at": "2025-12-17T10:20:00Z"
    }
  ],
  "total": 2
}
```

---

### Step 8.2: View User Activity

**User Action**: Check specific user's activity

**API Endpoint**: `GET /api/v1/audit/users/{user_id}`

```bash
curl -X GET http://localhost:8000/api/v1/audit/users/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### Step 8.3: Export Audit Logs

**User Action**: Download audit trail for compliance

**API Endpoint**: `GET /api/v1/audit/export`

```bash
curl -X GET "http://localhost:8000/api/v1/audit/export?start_date=2025-12-01&end_date=2025-12-31&format=csv" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o audit_logs.csv
```

---

## Summary: Admin User API Endpoints

| Flow | Action | Endpoint |
|------|--------|----------|
| Login | Authenticate | `POST /api/v1/auth/login` |
| Permissions | View | `GET /api/v1/auth/permissions` |
| Users | List | `GET /api/v1/users` |
| Users | Update | `PUT /api/v1/users/{id}` |
| Invitations | Send | `POST /api/v1/invitations` |
| Invitations | List | `GET /api/v1/invitations` |
| Teams | List | `GET /api/v1/teams` |
| Teams | Create | `POST /api/v1/teams` |
| Teams | Add member | `POST /api/v1/teams/{id}/members` |
| Teams | Remove member | `DELETE /api/v1/teams/{id}/members/{uid}` |
| Policies | List | `GET /api/v1/policies` |
| Policies | Create | `POST /api/v1/policies` |
| Policies | Assign | `POST /api/v1/policies/{id}/assign` |
| Policies | Evaluate | `POST /api/v1/policies/evaluate` |
| SSO | List | `GET /api/v1/sso/connections` |
| SSO | Create | `POST /api/v1/sso/connections` |
| SSO | Test | `GET /api/v1/sso/initiate/{provider}` |
| Webhooks | List events | `GET /api/v1/webhooks/events` |
| Webhooks | Create | `POST /api/v1/webhooks` |
| Webhooks | Test | `POST /api/v1/webhooks/{id}/test` |
| Webhooks | Deliveries | `GET /api/v1/webhooks/{id}/deliveries` |
| Scaling | List policies | `GET /api/v1/scaling/policies` |
| Scaling | Create | `POST /api/v1/scaling/policies` |
| Scaling | Events | `GET /api/v1/scaling/gateways/{id}/events` |
| Audit | List logs | `GET /api/v1/audit/logs` |
| Audit | User activity | `GET /api/v1/audit/users/{id}` |
| Audit | Export | `GET /api/v1/audit/export` |

---

## Frontend Routes Summary

| Route | Page | Purpose |
|-------|------|---------|
| `/login` | LoginPage | Admin authentication |
| `/dashboard` | Dashboard | Admin overview |
| `/users` | UsersPage | User management |
| `/teams` | TeamsPage | Team management |
| `/teams/:id` | TeamDetailPage | Team members |
| `/policies` | PoliciesPage | ABAC policy management |
| `/settings/sso` | SSOPage | SSO configuration |
| `/settings/webhooks` | WebhooksPage | Webhook management |
| `/settings/scaling` | ScalingPage | Auto-scaling config |
| `/audit` | AuditPage | Audit log viewer |

---

*Document Version: 1.0*
*Last Updated: 2025-12-17*
*Author: Kaizen Studio Team*
