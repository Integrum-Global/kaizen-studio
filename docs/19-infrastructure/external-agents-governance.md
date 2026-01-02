# External Agents Governance Features

**Last Updated**: 2025-12-20
**Status**: Production
**Dependencies**: Kaizen Trust Governance Components, Redis, PostgreSQL

---

## Overview

External agents (Microsoft Copilot, custom enterprise tools, third-party AI systems) are governed by Kaizen Studio's comprehensive governance layer, which provides:

- **Budget Enforcement**: Cost control and execution limits per agent/team
- **Rate Limiting**: Protection against runaway costs and abuse
- **Policy-Based Controls (ABAC)**: Time, location, and environment restrictions

This governance layer integrates production-ready components from `kaizen.trust.governance` into Kaizen Studio's External Agent Service.

---

## Architecture

### Governance Components

Kaizen Studio integrates three core governance components:

```python
from kaizen.trust.governance import (
    ExternalAgentBudgetEnforcer,  # Budget tracking and enforcement
    ExternalAgentRateLimiter,     # Redis-backed rate limiting
    ExternalAgentPolicyEngine,    # ABAC policy evaluation
)
```

### Governance Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL AGENT REQUEST                             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PRE-EXECUTION GOVERNANCE                           │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Budget     │  │  Rate Limit  │  │  ABAC Policy │             │
│  │   Enforcer   │  │   Service    │  │   Engine     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  - Check budget availability (monthly + daily)                      │
│  - Check rate limits (per-minute, per-hour, per-day)                │
│  - Evaluate ABAC policies (time, location, env)                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                     ✓ ALLOWED / ✗ DENIED
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  EXTERNAL AGENT EXECUTION                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  POST-EXECUTION GOVERNANCE                           │
│  - Record actual cost                                                │
│  - Update rate limit counters                                        │
│  - Create audit log entry                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Budget Enforcement

### Overview

Budget enforcement prevents runaway costs by:

1. **Estimating cost before execution**
2. **Checking budget availability**
3. **Recording actual cost after execution**
4. **Automatic degradation when limits approached**

### Budget Configuration

External agents support multi-dimensional budgets:

```python
budget = ExternalAgentBudget(
    external_agent_id="copilot_hr",

    # Primary budget (monthly)
    monthly_budget_usd=500.0,        # $500/month limit
    monthly_spent_usd=250.0,         # Current spending

    # Execution limits (non-monetary)
    monthly_execution_limit=10000,   # Max executions/month
    monthly_execution_count=5000,    # Current count

    # Daily limits (spike prevention)
    daily_budget_usd=50.0,           # $50/day limit (optional)
    daily_spent_usd=25.0,            # Today's spending
    daily_execution_limit=1000,      # 1000/day (optional)
    daily_execution_count=500,       # Today's count

    # Cost estimation
    cost_per_execution=0.05,         # $0.05 per invocation

    # Degradation thresholds
    warning_threshold=0.80,          # Warn at 80%
    degradation_threshold=0.90,      # Degrade at 90%
)
```

### Budget Check Example

```python
from studio.services.governance_service import GovernanceService

governance_service = GovernanceService()
await governance_service.initialize()

# Check budget before invocation
result = await governance_service.check_budget(
    external_agent_id="copilot_hr",
    organization_id="org-001",
    estimated_cost=10.0,
)

if result.allowed:
    # Execute invocation
    await invoke_agent()

    # Record actual cost
    await governance_service.record_invocation_cost(
        external_agent_id="copilot_hr",
        organization_id="org-001",
        actual_cost=9.5,
        execution_success=True,
    )
else:
    # Return 402 Payment Required
    raise HTTPException(
        status_code=402,
        detail=f"Budget exceeded: {result.reason}"
    )
```

### Budget Error Responses

When budget is exceeded, the API returns HTTP 402 Payment Required:

```json
{
  "status_code": 402,
  "detail": "Budget limit exceeded: Monthly budget would be exceeded: $510.00 > $500.00"
}
```

---

## Rate Limiting

### Overview

Rate limiting protects against runaway costs and abuse using Redis-backed sliding window algorithm with multi-tier limits:

- **Per-minute**: Short-term spike protection
- **Per-hour**: Medium-term usage control
- **Per-day**: Long-term quota enforcement

### Rate Limit Configuration

```python
from kaizen.trust.governance import RateLimitConfig

config = RateLimitConfig(
    requests_per_minute=60,     # 60 requests/minute
    requests_per_hour=1000,     # 1000 requests/hour
    requests_per_day=10000,     # 10000 requests/day
    burst_multiplier=1.5,       # Allow 50% burst
    fail_open_on_error=True,    # Allow requests if Redis unavailable
)
```

### Rate Limit Check Example

```python
# Check rate limit before invocation
result = await governance_service.check_rate_limit(
    external_agent_id="copilot_hr",
    user_id="user-001",
    org_id="org-001",
)

if result.allowed:
    # Execute invocation
    await invoke_agent()

    # Record invocation for rate limiting
    await governance_service.record_rate_limit_invocation(
        external_agent_id="copilot_hr",
        user_id="user-001",
        org_id="org-001",
    )
else:
    # Return 429 Too Many Requests
    raise HTTPException(
        status_code=429,
        detail=f"Rate limit exceeded",
        headers={
            "X-RateLimit-Limit": str(config.requests_per_minute),
            "X-RateLimit-Remaining": str(result.remaining),
            "X-RateLimit-Reset": result.reset_time.isoformat() if result.reset_time else "",
            "Retry-After": str(result.retry_after_seconds),
        }
    )
```

### Rate Limit Headers

All API responses include rate limit headers:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2025-12-20T10:15:00Z
```

When rate limited:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-12-20T10:15:00Z
```

### Graceful Degradation

If Redis is unavailable, rate limiting **fails open** (allows requests):

```python
# Rate limiter not initialized - fails open
result = await governance_service.check_rate_limit(...)
# result.allowed == True (with warning logged)
```

---

## Policy-Based Access Control (ABAC)

### Overview

ABAC policies provide fine-grained access control based on:

- **Time**: Business hours, maintenance windows
- **Location**: Country, IP allowlists
- **Environment**: Production, staging, development
- **Provider**: Copilot Studio, custom REST, third-party
- **Tags**: Agent classification tags

### Policy Configuration

```python
from kaizen.trust.governance import (
    ExternalAgentPolicy,
    PolicyEffect,
    EnvironmentCondition,
    ProviderCondition,
    TimeWindowCondition,
)

# Policy 1: Allow Copilot in production only
policy_prod = ExternalAgentPolicy(
    policy_id="allow_copilot_prod",
    name="Allow Copilot in Production",
    effect=PolicyEffect.ALLOW,
    conditions=[
        ProviderCondition(providers=["copilot_studio"]),
        EnvironmentCondition(environments=["production"]),
    ],
    priority=1,
)

# Policy 2: Block development environment
policy_dev = ExternalAgentPolicy(
    policy_id="block_development",
    name="Block Development Environment",
    effect=PolicyEffect.DENY,
    conditions=[
        EnvironmentCondition(environments=["development"]),
    ],
    priority=2,
)

# Policy 3: Business hours only
policy_hours = ExternalAgentPolicy(
    policy_id="business_hours_only",
    name="Business Hours Only",
    effect=PolicyEffect.DENY,
    conditions=[
        TimeWindowCondition(
            business_hours={
                "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
                "start_time": "09:00",
                "end_time": "17:00",
                "timezone": "America/New_York"
            }
        )
    ],
    priority=3,
)

governance_service.add_policy(policy_prod)
governance_service.add_policy(policy_dev)
governance_service.add_policy(policy_hours)
```

### Policy Evaluation Example

```python
from kaizen.trust.governance import (
    ExternalAgentPolicyContext,
    ExternalAgentPrincipal,
)

# Create evaluation context
context = ExternalAgentPolicyContext(
    principal=ExternalAgentPrincipal(
        external_agent_id="copilot_hr",
        provider="copilot_studio",
        environment="production",
        org_id="org-001",
        tags=["approved", "hr"],
    ),
    action="invoke",
    resource="copilot_hr",
)

# Evaluate policies
result = await governance_service.evaluate_policy("copilot_hr", context)

if result.effect == PolicyEffect.DENY:
    # Return 403 Forbidden
    raise HTTPException(
        status_code=403,
        detail=f"Policy denied: {result.reason}"
    )
```

### Conflict Resolution Strategies

- **DENY_OVERRIDES** (default): Any DENY policy wins
- **ALLOW_OVERRIDES**: Any ALLOW policy wins
- **FIRST_APPLICABLE**: First matching policy wins

---

## Governance Status Endpoint

### Overview

The governance status endpoint provides comprehensive governance information for an external agent.

### Endpoint

```http
GET /api/external-agents/{agent_id}/governance-status
```

### Response

```json
{
  "external_agent_id": "copilot_hr",
  "organization_id": "org-001",
  "budget": {
    "monthly_budget_usd": 500.0,
    "monthly_spent_usd": 250.0,
    "remaining_monthly_usd": 250.0,
    "daily_budget_usd": 50.0,
    "daily_spent_usd": 25.0,
    "remaining_daily_usd": 25.0,
    "monthly_execution_limit": 10000,
    "monthly_execution_count": 5000,
    "remaining_executions": 5000,
    "usage_percentage": 0.5,
    "warning_triggered": false,
    "degraded_mode": false
  },
  "rate_limit": {
    "allowed": true,
    "limit_exceeded": null,
    "remaining": 45,
    "current_usage": {
      "minute": 15,
      "hour": 500,
      "day": 2000
    },
    "retry_after_seconds": null
  },
  "policy": {
    "total_policies": 3,
    "enabled_policies": 3
  },
  "timestamp": "2025-12-20T10:00:00Z"
}
```

---

## Performance

### Governance Overhead

Governance checks are designed for minimal overhead:

- **Budget check**: <5ms (with cache)
- **Rate limit check**: <10ms (Redis pipeline)
- **Policy evaluation**: <5ms (in-memory)

**Total overhead**: <20ms per invocation

### Caching

- **Budget cache**: 60-second TTL to reduce database lookups
- **Policy cache**: In-memory for fast evaluation

---

## Monitoring and Alerts

### Budget Alerts

Budget alerts trigger at configurable thresholds:

- **Warning threshold** (default 80%): Log warning
- **Degradation threshold** (default 90%): Trigger degradation alert

### Rate Limit Metrics

Rate limiter tracks metrics for monitoring:

```python
metrics = governance_service.rate_limiter.get_metrics()

print(f"Total checks: {metrics.checks_total}")
print(f"Total exceeded: {metrics.exceeded_total}")
print(f"Exceeded by limit: {metrics.exceeded_by_limit}")
print(f"Fail-open count: {metrics.fail_open_total}")
```

---

## Best Practices

1. **Set realistic budgets**: Start conservative and adjust based on actual usage
2. **Use daily limits**: Prevent daily spikes even if monthly budget available
3. **Enable burst handling**: Allow temporary spikes with burst_multiplier
4. **Fail-open for rate limits**: Graceful degradation if Redis unavailable
5. **Fail-closed for policies**: Security-first approach for policy evaluation
6. **Monitor governance metrics**: Track budget usage, rate limits, and policy denials

---

## See Also

- [External Agents Governance Best Practices](./external-agents-governance-best-practices.md)
- [External Agents API Documentation](./external-agents-api.md)
- [Kaizen Trust Governance Documentation](../../kailash-kaizen/docs/trust/governance.md)
