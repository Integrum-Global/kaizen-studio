# Management Plane vs Data Plane Architecture

## Architectural Separation

Kaizen Studio follows the industry-standard separation between management plane and data plane.

### Management Plane (Kaizen Studio)

The management plane controls WHAT gets deployed, WHO can access it, and HOW it's governed.

**Technology**: FastAPI

**Responsibilities**:
- User authentication and authorization (SSO, OAuth2, JWT)
- Agent and workflow CRUD operations
- Deployment orchestration and promotion
- RBAC/ABAC policy evaluation
- Audit trails and compliance reporting
- Real-time collaboration (WebSockets)
- Billing and usage tracking

**Characteristics**:
- Complex business logic
- Multi-tenant data isolation
- Long-running background jobs
- Rich middleware requirements
- Database ORM with migrations

### Data Plane (Nexus Gateway Fleet)

The data plane executes deployed agents and handles runtime requests.

**Technology**: Nexus

**Responsibilities**:
- Workflow execution
- Request routing to agents
- Multi-channel access (API/CLI/MCP)
- Session management
- Execution metrics collection

**Characteristics**:
- Zero-config deployment
- Stateless request handling
- High-throughput execution
- Horizontal scaling

## Request Flow

### Studio Management Request

```
React Client → FastAPI Backend → PostgreSQL/Redis
                    ↓
              NexusService
                    ↓
            Gateway Fleet API
```

### Agent Execution Request

```
End User App → Nexus Gateway → Kaizen Agent → Response
```

## Why This Separation Matters

### Security Isolation

Management credentials never touch the data plane. Gateway API keys are separate from user OAuth tokens.

### Scaling Independence

Gateways scale based on execution load. Studio scales based on user activity. Different patterns, different infrastructure.

### Operational Clarity

Deployments are explicit. Studio pushes to gateways. Gateways don't pull from Studio.

## Implementation Pattern

### Studio Deploys to Gateway

```python
class DeploymentService:
    async def deploy(self, agent: Agent, gateway: Gateway) -> Deployment:
        # Build workflow from agent configuration
        workflow = await self.workflow_builder.build(agent)

        # Push to Nexus gateway
        registration = await self.nexus_client.register(
            endpoint=gateway.api_url,
            workflow=workflow,
            name=f"{agent.name}-{agent.environment}",
        )

        # Record deployment in Studio database
        deployment = await self.db.create(Deployment(
            agent_id=agent.id,
            gateway_id=gateway.id,
            registration_id=registration.id,
        ))

        return deployment
```

### Gateway Executes Workflow

```python
# On the Nexus gateway
gateway = Nexus()

# Agents registered dynamically by Studio
# Executed when requests arrive
@gateway.register("customer-support-v1")
async def customer_support():
    workflow = WorkflowBuilder()
    workflow.add_node("KaizenAgent", "agent", {
        "agent_class": "CustomerSupportAgent",
    })
    return workflow
```

## Comparison with Industry Patterns

| Platform | Management Plane | Data Plane |
|----------|-----------------|------------|
| **Kaizen Studio** | FastAPI | Nexus Gateways |
| AWS | Console, CLI | EC2, Lambda |
| Kubernetes | API Server | Kubelet, Pods |
| Databricks | Workspace | Clusters |
| Snowflake | Web UI | Virtual Warehouses |

## Anti-Patterns to Avoid

### Mixing Planes

Do not run business logic on the gateway. Do not register workflows directly without going through Studio.

### Direct Database Access

Gateways should not access Studio's database. Use API calls for metrics and health data.

### Shared Authentication

Management users and agent callers have different authentication flows. Keep them separate.
