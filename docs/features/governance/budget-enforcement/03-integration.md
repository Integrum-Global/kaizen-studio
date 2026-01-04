# Budget Integration Patterns

## Integration with ExternalAgentService

The `ExternalAgentService` automatically integrates with budget enforcement.

### Pre-Invocation Check

```python
from studio.services.external_agent_service import ExternalAgentService

service = ExternalAgentService()

# Budget is checked automatically in invoke()
try:
    result = await service.invoke(
        agent_id="agent-001",
        user_id="user-001",
        organization_id="org-001",
        request_data={"input": "Process document"}
    )
except ValueError as e:
    if "budget" in str(e).lower():
        # Handle budget exceeded
        print(f"Budget exceeded: {e}")
```

### Manual Budget Check

```python
# Check budget before invocation
allowed, info = await service.check_budget(
    agent_id="agent-001",
    organization_id="org-001",
    estimated_cost=10.0
)

if not allowed:
    print(f"Budget check failed: {info['reason']}")
    print(f"Remaining: ${info['remaining_budget_usd']:.2f}")
```

## Direct GovernanceService Usage

For advanced use cases, use `GovernanceService` directly.

```python
from studio.services.governance_service import GovernanceService

# Initialize
service = GovernanceService()
await service.initialize()

# Check budget
result = await service.check_budget(
    external_agent_id="agent-001",
    organization_id="org-001",
    estimated_cost=10.0,
    user_id="user-001"  # Optional
)

if result.allowed:
    # Execute operation
    await execute_operation()

    # Record cost
    await service.record_invocation_cost(
        external_agent_id="agent-001",
        organization_id="org-001",
        actual_cost=9.50,
        execution_success=True,
        metadata={"duration_ms": 1500}
    )
elif result.warning_triggered:
    # Proceed with warning
    print(f"Warning: {result.warning_message}")
else:
    # Budget exceeded
    print(f"Blocked: {result.reason}")
```

## Direct Enforcer Usage

For fine-grained control, use the enforcer directly.

```python
from kaizen.trust.governance import (
    ExternalAgentBudgetEnforcer,
    ExternalAgentBudgetConfig,
    ExternalAgentBudget,
    BudgetScope,
)

# Configure enforcer
config = ExternalAgentBudgetConfig(
    warning_threshold=0.75,
    degradation_threshold=0.90,
    enforcement_mode="hard"
)

enforcer = ExternalAgentBudgetEnforcer(config=config)

# Create budget
budget = ExternalAgentBudget(
    external_agent_id="agent-001",
    monthly_budget_usd=1000.0,
    monthly_spent_usd=750.0
)

# Check budget
result = await enforcer.check_budget(budget, estimated_cost=50.0)

# Handle result
if not result.allowed:
    raise BudgetExceededError(result.reason)
elif result.warning_triggered:
    log.warning(result.warning_message)
elif result.degraded_mode:
    log.warning("Operating in degraded mode")
```

## Webhook Integration

Budget alerts can trigger webhooks.

### Configuration

```python
from kaizen.trust.governance import BudgetAlertConfig

alert_config = BudgetAlertConfig(
    webhook_url="https://hooks.slack.com/services/...",
    email_recipients=["admin@company.com"],
    thresholds=[0.50, 0.75, 0.90, 1.00],
    alert_once_per_threshold=True,
    cooldown_minutes=15
)
```

### Webhook Payload

When a threshold is reached, a webhook is sent:

```json
{
  "event": "budget.warning",
  "external_agent_id": "agent-001",
  "organization_id": "org-001",
  "threshold": 0.75,
  "current_usage_percentage": 0.78,
  "monthly_spent_usd": 780.0,
  "monthly_budget_usd": 1000.0,
  "remaining_budget_usd": 220.0,
  "timestamp": "2026-01-04T12:00:00Z"
}
```

## FastAPI Integration

Example FastAPI endpoint with budget checking:

```python
from fastapi import APIRouter, HTTPException, Depends
from studio.services.governance_service import GovernanceService

router = APIRouter()

async def get_governance_service():
    service = GovernanceService()
    await service.initialize()
    return service

@router.post("/invoke/{agent_id}")
async def invoke_agent(
    agent_id: str,
    data: InvokeRequest,
    current_user: User = Depends(get_current_user),
    governance: GovernanceService = Depends(get_governance_service)
):
    # Check budget
    budget_result = await governance.check_budget(
        external_agent_id=agent_id,
        organization_id=current_user.organization_id,
        estimated_cost=estimate_cost(data)
    )

    if not budget_result.allowed:
        raise HTTPException(
            status_code=402,
            detail=budget_result.reason
        )

    # Execute invocation
    result = await execute_invocation(agent_id, data)

    # Record cost
    await governance.record_invocation_cost(
        external_agent_id=agent_id,
        organization_id=current_user.organization_id,
        actual_cost=result.actual_cost,
        execution_success=True
    )

    return result
```

## Testing Integration

### Unit Testing (Tier 1)

```python
import pytest
from kaizen.trust.governance import (
    ExternalAgentBudgetEnforcer,
    ExternalAgentBudget,
)
from kaizen.trust.governance.store import InMemoryBudgetStore

@pytest.fixture
def enforcer():
    store = InMemoryBudgetStore()
    return ExternalAgentBudgetEnforcer(store=store)

@pytest.mark.asyncio
async def test_budget_check_allowed(enforcer):
    budget = ExternalAgentBudget(
        external_agent_id="test-agent",
        monthly_budget_usd=100.0,
        monthly_spent_usd=50.0
    )

    result = await enforcer.check_budget(budget, estimated_cost=10.0)

    assert result.allowed is True
    assert result.remaining_budget_usd == 50.0
```

### Integration Testing (Tier 2)

```python
import pytest
from studio.services.governance_service import GovernanceService

@pytest.fixture
async def governance_service():
    service = GovernanceService()
    await service.initialize()
    yield service
    await service.close()

@pytest.mark.asyncio
async def test_governance_service_integration(governance_service):
    # Check budget
    result = await governance_service.check_budget(
        external_agent_id="test-agent",
        organization_id="test-org",
        estimated_cost=10.0
    )

    assert result.allowed is True
```
