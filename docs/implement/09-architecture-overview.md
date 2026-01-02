# System Architecture Overview

**Date**: 2025-11-22
**Purpose**: Complete system architecture for Kaizen Studio SaaS

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KAIZEN STUDIO SAAS PLATFORM                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              PRESENTATION LAYER (React)                  │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │     │
│  │  │  Agent   │ │ Pipeline │ │ Gateway  │ │  Admin   │    │     │
│  │  │ Designer │ │  Canvas  │ │ Manager  │ │ Console  │    │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │     │
│  └─────────────────────────┬───────────────────────────────┘     │
│                            │                                      │
│  ┌─────────────────────────▼───────────────────────────────┐     │
│  │              API LAYER (FastAPI)                         │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │     │
│  │  │   Auth   │ │  Agents  │ │ Gateways │ │  Admin   │    │     │
│  │  │   SSO    │ │  Orchs   │ │  Deploy  │ │ Billing  │    │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │     │
│  └─────────────────────────┬───────────────────────────────┘     │
│                            │                                      │
│  ┌─────────────────────────▼───────────────────────────────┐     │
│  │              SERVICE LAYER                               │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │     │
│  │  │ Identity │ │  Policy  │ │Deployment│ │ Billing  │    │     │
│  │  │ Service  │ │  Engine  │ │ Service  │ │ Service  │    │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │     │
│  └─────────────────────────┬───────────────────────────────┘     │
│                            │                                      │
│  ┌─────────────────────────▼───────────────────────────────┐     │
│  │         KAIZEN FRAMEWORK (Already Built)                 │     │
│  │  ┌──────────────────┐  ┌──────────────────┐             │     │
│  │  │ OrchestrationRT  │  │   AgentRegistry  │             │     │
│  │  │ (10-100+ agents) │  │ (A2A Discovery)  │             │     │
│  │  └──────────────────┘  └──────────────────┘             │     │
│  │  ┌──────────────────┐  ┌──────────────────┐             │     │
│  │  │ 9 Pipeline       │  │   Permissions    │             │     │
│  │  │ Patterns         │  │   + Budgets      │             │     │
│  │  └──────────────────┘  └──────────────────┘             │     │
│  └─────────────────────────┬───────────────────────────────┘     │
│                            │                                      │
│  ┌─────────────────────────▼───────────────────────────────┐     │
│  │         DATA LAYER (DataFlow + Redis)                    │     │
│  │  ┌──────────────────┐  ┌──────────────────┐             │     │
│  │  │   PostgreSQL     │  │      Redis       │             │     │
│  │  │  (Multi-tenant)  │  │    (Sessions)    │             │     │
│  │  └──────────────────┘  └──────────────────┘             │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

                              │
                              │ Manages
                              ▼

┌─────────────────────────────────────────────────────────────────┐
│                    NEXUS GATEWAY FLEET                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Gateway: Dev │  │Gateway: Stage│  │ Gateway: Prod│           │
│  │  (Shared)    │  │  (Dedicated) │  │  (Dedicated) │           │
│  │              │  │              │  │              │           │
│  │ API  ───────▶│  │ API  ───────▶│  │ API  ───────▶│           │
│  │ CLI  ───────▶│  │ CLI  ───────▶│  │ CLI  ───────▶│           │
│  │ MCP  ───────▶│  │ MCP  ───────▶│  │ MCP  ───────▶│           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Presentation Layer (React)

```
frontend/
├── src/
│   ├── pages/
│   │   ├── auth/           # Login, register, SSO callback
│   │   ├── dashboard/      # Organization dashboard
│   │   ├── agents/         # Agent list, designer
│   │   ├── orchestrations/ # Pipeline canvas
│   │   ├── gateways/       # Gateway management
│   │   ├── connectors/     # Data source connectors
│   │   ├── environments/   # Workspace management
│   │   ├── policies/       # RBAC/ABAC editor
│   │   ├── monitoring/     # Metrics, traces, logs
│   │   ├── admin/          # Org admin settings
│   │   └── billing/        # Subscription, usage
│   ├── components/
│   │   ├── agent-designer/
│   │   ├── pipeline-canvas/
│   │   ├── policy-builder/
│   │   └── ...
│   ├── hooks/
│   ├── services/
│   └── store/
```

### 2. API Layer (FastAPI)

```
backend/
├── src/kailash_studio/
│   ├── api/
│   │   ├── auth.py         # Auth, SSO, API keys
│   │   ├── organizations.py
│   │   ├── users.py
│   │   ├── teams.py
│   │   ├── agents.py
│   │   ├── orchestrations.py
│   │   ├── deployments.py
│   │   ├── gateways.py
│   │   ├── connectors.py
│   │   ├── workspaces.py
│   │   ├── policies.py
│   │   ├── executions.py
│   │   ├── monitoring.py
│   │   └── admin.py
│   ├── services/
│   ├── middleware/
│   └── main.py
```

### 3. Service Layer

| Service | Responsibility |
|---------|----------------|
| **IdentityService** | SSO, JWT, MFA, sessions |
| **PolicyEngine** | RBAC/ABAC evaluation |
| **DeploymentService** | Nexus gateway management |
| **ExecutionService** | Agent/orchestration execution |
| **BillingService** | Stripe, usage tracking |
| **AuditService** | Event logging |
| **NotificationService** | Emails, webhooks |

### 4. Kaizen Framework (Built-In)

Already complete - we just integrate:
- `OrchestrationRuntime` for execution
- `AgentRegistry` for discovery
- `Pipeline` for patterns
- `PermissionSystem` for access control
- `ObservabilityManager` for monitoring

### 5. Data Layer

| Store | Purpose | Tech |
|-------|---------|------|
| PostgreSQL | Primary data | DataFlow ORM |
| Redis | Sessions, cache | Redis 7 |
| Vault | Secrets | HashiCorp Vault |
| S3/GCS | File storage | Object storage |

---

## Multi-Tenant Data Flow

```
Request → API Gateway → Auth Middleware → Tenant Context → Handler
                            │
                            ▼
                    ┌───────────────┐
                    │ Extract org_id │
                    │ from JWT token │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Set Tenant    │
                    │ Context       │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ All DataFlow  │
                    │ queries auto- │
                    │ filtered by   │
                    │ organization_id│
                    └───────────────┘
```

---

## Gateway Deployment Flow

```
User clicks Deploy
        │
        ▼
┌───────────────────┐
│ Load Agent config │
│ from DataFlow     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Generate Kaizen   │
│ code from YAML    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Select target     │
│ Gateway           │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Create Nexus      │
│ registration      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Deploy to Gateway │
│ cluster           │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Return API/MCP    │
│ endpoints         │
└───────────────────┘
```

---

## Security Architecture

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│   SSO   │────▶│  Token  │────▶│   API   │
│         │     │ Provider│     │ Service │     │ Gateway │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                    │                               │
                    │ SAML/OIDC                     │ JWT
                    │ Assertion                    │ Validation
                    ▼                               ▼
              ┌─────────┐                    ┌─────────┐
              │  User   │                    │ Request │
              │ Created │                    │ Authed  │
              │ (JIT)   │                    │         │
              └─────────┘                    └─────────┘
```

### Authorization Flow

```
Request with JWT
        │
        ▼
┌───────────────────┐
│ Extract user_id,  │
│ org_id, role      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Load applicable   │
│ policies          │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Evaluate RBAC     │
│ rules             │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Evaluate ABAC     │
│ conditions        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Check budgets     │
│                   │
└─────────┬─────────┘
          │
          ▼
    Allow / Deny /
    Require Approval
```

---

## Deployment Architecture

### Development

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
  redis:
    image: redis:7
  backend:
    build: ./backend
    depends_on: [postgres, redis]
  frontend:
    build: ./frontend
    depends_on: [backend]
```

### Production (Kubernetes)

```
┌─────────────────────────────────────────────────────┐
│                 Kubernetes Cluster                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │   Ingress    │  │  Cert-Mgr    │                 │
│  │  (nginx)     │  │              │                 │
│  └──────┬───────┘  └──────────────┘                 │
│         │                                            │
│  ┌──────▼───────┐  ┌──────────────┐                 │
│  │   Backend    │  │   Frontend   │                 │
│  │  (3 pods)    │  │   (2 pods)   │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │   Postgres   │  │    Redis     │                 │
│  │  (Primary +  │  │  (Cluster)   │                 │
│  │   Replica)   │  │              │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │    Vault     │  │  Prometheus  │                 │
│  │              │  │  + Grafana   │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                      │
│  ┌──────────────────────────────────┐               │
│  │       Nexus Gateway Pods         │               │
│  │   (Auto-scaled per customer)     │               │
│  └──────────────────────────────────┘               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Integration Points

### External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Stripe** | Billing | API |
| **SendGrid** | Email | API |
| **Vault** | Secrets | REST API |
| **Datadog/Grafana** | Monitoring | OpenTelemetry |
| **Sentry** | Error tracking | SDK |

### Identity Providers

| Provider | Protocol | Library |
|----------|----------|---------|
| Azure AD | SAML/OIDC | MSAL |
| Okta | SAML/OIDC | okta-sdk |
| Google | OIDC | google-auth |
| Generic | SAML | python-saml |

### Data Connectors

| Category | Connectors |
|----------|------------|
| Databases | PostgreSQL, MySQL, MongoDB |
| Warehouses | Snowflake, BigQuery |
| SaaS | Salesforce, HubSpot |
| Storage | S3, Azure Blob, GCS |

---

## Scalability Considerations

### Horizontal Scaling

| Component | Strategy |
|-----------|----------|
| API | Pod autoscaling (CPU/memory) |
| Frontend | CDN + static hosting |
| Gateways | Per-tenant dedicated pods |
| Database | Read replicas + connection pooling |
| Redis | Cluster mode |

### Limits & Quotas

| Resource | Free | Pro | Enterprise |
|----------|------|-----|------------|
| Users | 3 | Unlimited | Unlimited |
| Agents | 10 | 100 | Unlimited |
| Executions/mo | 10K | 100K | Unlimited |
| Gateways | Shared | 1 dedicated | 10+ |

---

## Monitoring & Alerting

### Metrics

- Request latency (p50, p95, p99)
- Error rate
- Execution throughput
- Gateway health
- Database connections
- Cache hit rate

### Alerts

- Error rate > 1%
- Latency p99 > 1s
- Gateway unhealthy
- Budget exceeded
- Security event detected

### Dashboards

- Platform overview
- Per-organization usage
- Gateway performance
- Cost analytics
- Compliance status

---

## Disaster Recovery

### Backup Strategy

| Data | Frequency | Retention |
|------|-----------|-----------|
| PostgreSQL | Every 6 hours | 30 days |
| Redis | Hourly AOF | 7 days |
| Vault | Daily | 90 days |
| Audit logs | Continuous | 1 year |

### Recovery Objectives

- **RPO** (Recovery Point): 6 hours
- **RTO** (Recovery Time): 4 hours

### Failover

- Multi-AZ PostgreSQL
- Redis sentinel/cluster
- Cross-region backup
