# Budget Enforcement for External Agents

## Overview

The Budget Enforcement system provides cost control and usage tracking for external agent invocations. It enables organizations to set spending limits, track usage, and enforce budgets at multiple scopes (organization, team, user, and per-agent).

## Key Features

### Budget Control
- **Monthly and daily limits**: Set maximum spend per period
- **Execution count limits**: Limit the number of invocations
- **Token-based tracking**: Track input/output token usage
- **Cost-based tracking**: Track actual USD spend

### Enforcement Modes
- **Hard enforcement**: Block requests when budget is exceeded
- **Soft enforcement**: Allow requests with warnings (degraded mode)

### Alert System
- **Warning threshold**: Trigger alerts at configurable usage levels (default: 75%)
- **Degradation threshold**: Enable degraded mode at high usage (default: 90%)
- **Multi-threshold alerts**: Configure multiple alert points (50%, 75%, 90%, 100%)

### Hierarchical Scopes
Budgets can be applied at multiple levels:
```
Organization → Team → User → Agent
```

Each scope is independent, allowing fine-grained budget control.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer                            │
│  GET /external-agents/{id}/budget                       │
│  PATCH /external-agents/{id}/budget/config              │
│  GET /external-agents/{id}/governance-status            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               GovernanceService                         │
│  - check_budget()                                       │
│  - record_invocation_cost()                             │
│  - get_governance_status()                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│           ExternalAgentBudgetEnforcer                   │
│  - check_budget()                                       │
│  - record_usage()                                       │
│  - get_budget_status()                                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               BudgetStore                               │
│  - InMemoryBudgetStore (testing)                        │
│  - DataFlowBudgetStore (production)                     │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Usage

```python
from kaizen.trust.governance import (
    ExternalAgentBudgetEnforcer,
    ExternalAgentBudget,
)

# Create enforcer
enforcer = ExternalAgentBudgetEnforcer()

# Create budget for an agent
budget = ExternalAgentBudget(
    external_agent_id="agent-001",
    monthly_budget_usd=1000.0,
    monthly_spent_usd=0.0
)

# Check if invocation is allowed
result = await enforcer.check_budget(budget, estimated_cost=10.0)

if result.allowed:
    # Execute invocation
    await execute_invocation()

    # Record actual cost
    await enforcer.record_usage(
        budget,
        actual_cost=9.50,
        execution_success=True
    )
else:
    # Budget exceeded
    print(f"Blocked: {result.reason}")
```

### With GovernanceService

```python
from studio.services.governance_service import GovernanceService

# Initialize service
service = GovernanceService()
await service.initialize()

# Check budget before invocation
result = await service.check_budget(
    external_agent_id="agent-001",
    organization_id="org-001",
    estimated_cost=10.0
)

if result.allowed:
    # Execute invocation
    await execute_invocation()

    # Record cost
    await service.record_invocation_cost(
        external_agent_id="agent-001",
        organization_id="org-001",
        actual_cost=9.50,
        execution_success=True
    )
```

## Related Documentation

- [01-configuration.md](./01-configuration.md) - Configuration options
- [02-api-endpoints.md](./02-api-endpoints.md) - REST API reference
- [03-integration.md](./03-integration.md) - Integration patterns
