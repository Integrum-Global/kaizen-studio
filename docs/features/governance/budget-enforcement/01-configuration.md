# Budget Configuration

## ExternalAgentBudgetConfig

The main configuration class for budget enforcement.

```python
from kaizen.trust.governance import ExternalAgentBudgetConfig

config = ExternalAgentBudgetConfig(
    # Budget limits
    max_tokens_per_period=1000000,
    max_cost_per_period=500.0,
    max_invocations_per_period=10000,

    # Time period
    period="monthly",  # "daily", "weekly", "monthly"
    timezone="UTC",

    # Thresholds
    warning_threshold=0.75,      # 75% triggers warning
    degradation_threshold=0.90,  # 90% enables degraded mode

    # Cost rates
    input_token_rate=0.00001,    # $0.01 per 1000 tokens
    output_token_rate=0.00003,   # $0.03 per 1000 tokens
    base_invocation_cost=0.001,  # $0.001 per call

    # Enforcement
    enforcement_mode="hard",     # "hard" or "soft"

    # Rollover
    rollover_unused=False,
    max_rollover_percentage=0.25
)
```

## Configuration Options

### Budget Limits

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_tokens_per_period` | `int \| None` | `None` | Maximum tokens allowed per period |
| `max_cost_per_period` | `float \| None` | `None` | Maximum cost in USD per period |
| `max_invocations_per_period` | `int \| None` | `None` | Maximum invocation count per period |

### Time Period

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | `str` | `"monthly"` | Budget period: "daily", "weekly", "monthly" |
| `period_start` | `datetime \| None` | `None` | Custom period start (defaults to calendar period) |
| `timezone` | `str` | `"UTC"` | Timezone for period calculations |

### Thresholds

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `warning_threshold` | `float` | `0.75` | Usage percentage that triggers warning |
| `degradation_threshold` | `float` | `0.90` | Usage percentage that enables degraded mode |
| `alert_thresholds` | `list[float]` | `[0.50, 0.75, 0.90, 1.00]` | Alert trigger points |

### Cost Rates

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `input_token_rate` | `float` | `0.00001` | Cost per input token in USD |
| `output_token_rate` | `float` | `0.00003` | Cost per output token in USD |
| `base_invocation_cost` | `float` | `0.001` | Base cost per invocation in USD |

### Enforcement

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enforcement_mode` | `str` | `"hard"` | "hard" blocks when exceeded, "soft" warns only |
| `rollover_unused` | `bool` | `False` | Carry unused budget to next period |
| `max_rollover_percentage` | `float` | `0.25` | Maximum percentage of budget that can roll over |

## ExternalAgentBudget

Runtime budget state for an agent.

```python
from kaizen.trust.governance import ExternalAgentBudget

budget = ExternalAgentBudget(
    external_agent_id="agent-001",

    # Monthly limits
    monthly_budget_usd=1000.0,
    monthly_spent_usd=250.0,

    # Daily limits (optional)
    daily_budget_usd=50.0,
    daily_spent_usd=10.0,

    # Execution limits
    monthly_execution_limit=10000,
    monthly_execution_count=500,

    # Cost estimation
    cost_per_execution=0.05,

    # Thresholds
    warning_threshold=0.80,
    degradation_threshold=0.90,

    # Enforcement
    enforcement_mode="hard"
)
```

## BudgetScope

Define the scope for budget application.

```python
from kaizen.trust.governance import BudgetScope

# Organization-wide budget
org_scope = BudgetScope(organization_id="org-001")

# Team-specific budget
team_scope = BudgetScope(
    organization_id="org-001",
    team_id="team-001"
)

# User-specific budget
user_scope = BudgetScope(
    organization_id="org-001",
    team_id="team-001",
    user_id="user-001"
)

# Agent-specific budget
agent_scope = BudgetScope(
    organization_id="org-001",
    agent_id="agent-001"
)
```

## Usage Examples

### Calculate Cost

```python
config = ExternalAgentBudgetConfig(
    input_token_rate=0.00001,
    output_token_rate=0.00003,
    base_invocation_cost=0.001
)

# Calculate cost for a request
cost = config.calculate_cost(
    input_tokens=1000,
    output_tokens=500,
    invocations=1
)
print(f"Estimated cost: ${cost:.4f}")  # $0.026
```

### Check Thresholds

```python
config = ExternalAgentBudgetConfig(
    warning_threshold=0.75,
    degradation_threshold=0.90
)

usage_percentage = 0.80

if config.is_warning_threshold_reached(usage_percentage):
    print("Warning: Budget usage at 80%")

if config.is_degradation_threshold_reached(usage_percentage):
    print("Degraded mode active")
```

### Get Triggered Alerts

```python
config = ExternalAgentBudgetConfig(
    alert_thresholds=[0.50, 0.75, 0.90, 1.00]
)

usage = 0.85
alerts = config.get_triggered_alerts(usage)
# alerts = [0.50, 0.75]  # Both 50% and 75% thresholds exceeded
```
