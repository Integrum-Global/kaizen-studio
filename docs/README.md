# Kaizen Studio Documentation

Comprehensive documentation for developing, testing, and deploying Kaizen Studio - an AI agent platform built on Kailash SDK.

## Documentation Structure

### Phase 1: Foundation & Architecture

#### 00-overview/
**Architecture and system overview**

- **[00-management-vs-data-plane.md](00-overview/00-management-vs-data-plane.md)** - Management plane vs data plane architecture
- **[01-fastapi-backend.md](00-overview/01-fastapi-backend.md)** - FastAPI backend architecture
- **[02-fastapi-vs-nexus.md](00-overview/02-fastapi-vs-nexus.md)** - FastAPI vs Nexus comparison
- **[03-implementation-status.md](00-overview/03-implementation-status.md)** - Current implementation status

#### 01-foundation/
**Project setup and DataFlow patterns**

- **[00-project-setup.md](01-foundation/00-project-setup.md)** - Environment setup, installation, and configuration
- **[01-dataflow-models.md](01-foundation/01-dataflow-models.md)** - DataFlow model patterns and registration
- **[02-authentication.md](01-foundation/02-authentication.md)** - Authentication setup

### Phase 2: User & Access Management

#### 02-user-management/
**User and organization management**

- **[00-organization-model.md](02-user-management/00-organization-model.md)** - Organization model and multi-tenancy
- **[01-user-roles.md](02-user-management/01-user-roles.md)** - User roles and permissions
- **[02-teams-invitations.md](02-user-management/02-teams-invitations.md)** - Team management and invitations

#### 03-sso-integration/
**Single Sign-On integration**

- **[00-overview.md](03-sso-integration/00-overview.md)** - SSO integration overview
- **[01-provider-setup.md](03-sso-integration/01-provider-setup.md)** - SSO provider configuration

#### 04-rbac/
**Role-Based Access Control**

- **[00-overview.md](04-rbac/00-overview.md)** - RBAC overview and implementation

### Phase 3: Agent Studio

#### 05-agents/
**Agent designer and management**

- **[00-agent-model.md](05-agents/00-agent-model.md)** - Agent model definition
- **[01-contexts-tools.md](05-agents/01-contexts-tools.md)** - Agent contexts and tools
- **[02-versioning.md](05-agents/02-versioning.md)** - Agent versioning

#### 06-gateways/
**Gateway deployment and management**

- **[00-gateway-model.md](06-gateways/00-gateway-model.md)** - Gateway model and configuration
- **[01-deployment-lifecycle.md](06-gateways/01-deployment-lifecycle.md)** - Deployment lifecycle management
- **[external-agents-ui.md](06-gateways/external-agents-ui.md)** - External agents UI components
- **[lineage-visualization.md](06-gateways/lineage-visualization.md)** - Lineage visualization

#### 07-external-integrations/
**External agent integration (consolidated documentation)**

- **[01-overview.md](07-external-integrations/01-overview.md)** - Feature overview and documentation index
- **[02-user-guide.md](07-external-integrations/02-user-guide.md)** - End-user guide for external agents
- **[03-admin-guide.md](07-external-integrations/03-admin-guide.md)** - Administrator guide
- **[04-api-reference.md](07-external-integrations/04-api-reference.md)** - Complete API documentation
- **[05-developer-guide.md](07-external-integrations/05-developer-guide.md)** - Architecture and extension guide
- **[06-migration.md](07-external-integrations/06-migration.md)** - Migration and upgrade guide
- **[07-release-notes.md](07-external-integrations/07-release-notes.md)** - Release notes and changelog

#### 08-orchestration/
**Pipeline and workflow orchestration**

- **[00-pipelines.md](08-orchestration/00-pipelines.md)** - Pipeline configuration
- **[01-graph-operations.md](08-orchestration/01-graph-operations.md)** - Graph operations and execution
- **[02-test-panel.md](08-orchestration/02-test-panel.md)** - Test panel interface

### Phase 4: Enterprise Governance

#### 09-governance/
**Governance and compliance**

- **[00-audit-logging.md](09-governance/00-audit-logging.md)** - Audit logging and compliance

#### 10-observability/
**Metrics and monitoring**

- **[00-metrics.md](10-observability/00-metrics.md)** - Execution metrics and dashboards

#### 11-api-keys/
**API key management**

- **[00-api-key-management.md](11-api-keys/00-api-key-management.md)** - Key generation and management
- **[01-rate-limiting.md](11-api-keys/01-rate-limiting.md)** - Rate limiting configuration

#### 12-integrations/
**External integrations**

- **[00-webhooks.md](12-integrations/00-webhooks.md)** - Webhook integration patterns

#### 13-billing/
**Billing and usage**

- **[00-usage-tracking.md](13-billing/00-usage-tracking.md)** - Usage tracking
- **[01-billing-periods.md](13-billing/01-billing-periods.md)** - Billing period management

#### 14-connectors/
**External system connectors**

- **[00-connector-management.md](14-connectors/00-connector-management.md)** - Connector configuration and management

#### 15-abac/
**Attribute-Based Access Control**

- **[00-policy-based-access.md](15-abac/00-policy-based-access.md)** - Fine-grained policy-based access

#### 16-multi-tenant/
**Multi-tenant architecture**

- **[00-overview.md](16-multi-tenant/00-overview.md)** - Multi-tenant architecture overview
- **[01-sso-domain-grouping.md](16-multi-tenant/01-sso-domain-grouping.md)** - SSO domain grouping
- **[02-multi-organization.md](16-multi-tenant/02-multi-organization.md)** - Multi-organization support
- **[03-frontend-integration.md](16-multi-tenant/03-frontend-integration.md)** - Frontend integration patterns

#### 17-promotions/
**Environment promotion workflows**

- **[00-environment-promotion.md](17-promotions/00-environment-promotion.md)** - Dev → Staging → Production promotion

#### 18-scaling/
**Gateway auto-scaling**

- **[00-auto-scaling.md](18-scaling/00-auto-scaling.md)** - Metric-based auto-scaling policies

### Phase 5: Infrastructure & Operations

#### 19-infrastructure/
**Infrastructure management**

- **[01-known-issues.md](19-infrastructure/01-known-issues.md)** - Known issues and workarounds
- **[02-local-development.md](19-infrastructure/02-local-development.md)** - Local development setup
- **[auth-lineage.md](19-infrastructure/auth-lineage.md)** - Authentication lineage tracking
- **[external-agents-governance.md](19-infrastructure/external-agents-governance.md)** - External agents governance
- **[lineage-api.md](19-infrastructure/lineage-api.md)** - Lineage API documentation
- **[webhook-adapters.md](19-infrastructure/webhook-adapters.md)** - Webhook adapter patterns

#### 20-e2e-testing/
**End-to-end testing patterns**

- **[00-async-context-isolation.md](20-e2e-testing/00-async-context-isolation.md)** - Async context isolation patterns
- **[01-service-layer-patterns.md](20-e2e-testing/01-service-layer-patterns.md)** - Service layer test patterns
- **[02-test-structure-patterns.md](20-e2e-testing/02-test-structure-patterns.md)** - Test structure and organization
- **[03-common-errors-and-fixes.md](20-e2e-testing/03-common-errors-and-fixes.md)** - Common testing errors and fixes
- **[04-running-tests.md](20-e2e-testing/04-running-tests.md)** - Test execution guide
- **[05-dataflow-integration.md](20-e2e-testing/05-dataflow-integration.md)** - DataFlow integration testing

### Reference Documentation

#### implement/
**Implementation details and specifications**

- **[00-executive-summary.md](implement/00-executive-summary.md)** - Executive summary
- **[01-kaizen-capabilities.md](implement/01-kaizen-capabilities.md)** - Kaizen framework capabilities
- **[02-visual-layer-spec.md](implement/02-visual-layer-spec.md)** - Visual layer specification
- **[03-dataflow-models.md](implement/03-dataflow-models.md)** - DataFlow model specifications
- **[04-api-endpoints.md](implement/04-api-endpoints.md)** - API endpoint specifications
- **[05-deployment-flow.md](implement/05-deployment-flow.md)** - Deployment flow
- **[06-enterprise-saas-product.md](implement/06-enterprise-saas-product.md)** - Enterprise SaaS product spec
- **[07-enterprise-dataflow-models.md](implement/07-enterprise-dataflow-models.md)** - Enterprise DataFlow models
- **[08-implementation-roadmap.md](implement/08-implementation-roadmap.md)** - Implementation roadmap
- **[09-architecture-overview.md](implement/09-architecture-overview.md)** - Architecture overview

#### plans/
**Planning documents and feature specs**

- Historical planning documents and feature specifications

---

## Quick Start

1. **Setup Environment**
   - Follow [Project Setup](01-foundation/00-project-setup.md)
   - Configure PostgreSQL and environment variables

2. **Understand Architecture**
   - Read [Architecture Overview](00-overview/01-fastapi-backend.md)
   - Learn DataFlow integration patterns in [DataFlow Models](01-foundation/01-dataflow-models.md)

3. **Create Your First Feature**
   - Define model with `@db.model` decorator
   - Create service using AsyncLocalRuntime
   - Build API endpoints with FastAPI
   - Write tests (Unit → Integration → E2E)

4. **Test Your Code**
   - Follow [Test Structure](20-e2e-testing/02-test-structure-patterns.md)
   - Ensure NO MOCKING in Tiers 2-3

---

## Key Concepts

### DataFlow Model Registration

DataFlow v0.9.7 auto-generates 11 workflow nodes per `@db.model`:

```python
from studio.models import db

@db.model
class Policy:
    __tablename__ = "policies"

    id: str
    name: str
    effect: str
    organization_id: str
```

Auto-generated nodes:
- `Policy_CreateNode`, `Policy_GetNode`, `Policy_UpdateNode`, `Policy_DeleteNode`
- `Policy_ListNode`, `Policy_CountNode`, `Policy_ExistsNode`
- `Policy_BulkCreateNode`, `Policy_BulkUpdateNode`, `Policy_BulkDeleteNode`
- `Policy_QueryNode`

### AsyncLocalRuntime

Preferred runtime for FastAPI and async contexts:

```python
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

runtime = AsyncLocalRuntime()

workflow = WorkflowBuilder()
workflow.add_node("User_GetNode", "get", {"id": "123"})

results, run_id = await runtime.execute_workflow_async(
    workflow.build(),
    inputs={}
)
```

### 3-Tier Testing Strategy

- **Tier 1 (Unit)**: Pure logic tests, mocking allowed
- **Tier 2 (Integration)**: API + Database, NO MOCKING
- **Tier 3 (E2E)**: Complete workflows, NO MOCKING

---

## Best Practices

1. **Always use AsyncLocalRuntime** for FastAPI applications
2. **Function-scoped fixtures** for event_loop, shared_runtime, test_db
3. **Connection pool cleanup** in all fixtures using DataFlow
4. **Real infrastructure testing** - NO MOCKING in Tiers 2-3
5. **Organization isolation** - Always filter by organization_id
6. **Permission checks** before sensitive operations
7. **Explicit table names** on all DataFlow models

---

## Project Structure

```
kaizen-studio/
├── src/studio/
│   ├── api/              # FastAPI routers
│   ├── models/           # DataFlow models
│   ├── services/         # Business logic
│   ├── adapters/         # Platform adapters
│   ├── middleware/       # FastAPI middleware
│   ├── config/           # Configuration
│   └── main.py           # Application entry
├── tests/
│   ├── unit/             # Tier 1: Pure logic
│   ├── integration/      # Tier 2: API + DB
│   ├── e2e/              # Tier 3: Complete workflows
│   ├── load/             # Load testing
│   ├── benchmarks/       # Performance benchmarks
│   └── conftest.py       # Shared fixtures
├── docs/                 # This documentation
└── README.md             # Project README
```

---

## Additional Resources

- **Kailash SDK Documentation**: `sdk-users/` in repository root
- **DataFlow Guide**: `sdk-users/apps/dataflow/`
- **Kaizen Framework**: `sdk-users/apps/kaizen/`
- **API Documentation**: http://localhost:8000/docs (when running)

---

## Support

For issues or questions:

1. Check [Common Errors](20-e2e-testing/03-common-errors-and-fixes.md)
2. Review [Known Issues](19-infrastructure/01-known-issues.md)
3. Examine test examples in `tests/` directory
4. Consult Kailash SDK documentation in `sdk-users/`
