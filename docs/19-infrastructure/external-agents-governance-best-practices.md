# External Agents Governance Best Practices

**Last Updated**: 2025-12-20
**Audience**: Platform Administrators, DevOps Engineers, Security Teams
**Prerequisites**: [External Agents Governance Features](./external-agents-governance.md)

---

## Overview

This guide provides recommended practices for configuring and operating external agent governance features in production environments.

---

## Budget Management

### Setting Budget Limits

**Recommended Approach**: Start Conservative

```python
# Initial budget configuration (conservative)
budget_config = {
    "monthly_budget_usd": 100.0,      # Start with $100/month
    "daily_budget_usd": 10.0,         # $10/day limit (spike protection)
    "monthly_execution_limit": 1000,  # 1000 executions/month
}
```

**Scaling Strategy**:

1. **Week 1-2**: Monitor actual usage with conservative limits
2. **Week 3-4**: Adjust based on observed patterns (±20%)
3. **Month 2+**: Set production budgets based on historical data

### Budget by Provider

Recommended budget limits by platform type:

| Provider | Base Cost/Invocation | Recommended Monthly Budget | Recommended Daily Budget |
|----------|---------------------|---------------------------|-------------------------|
| **Microsoft Copilot Studio** | $0.05 - $0.10 | $500 - $1000 | $50 - $100 |
| **Custom REST API** | $0.01 - $0.05 | $100 - $500 | $10 - $50 |
| **Third-Party AI Agent** | $0.10 - $0.50 | $1000 - $5000 | $100 - $500 |
| **Webhook Integrations** | $0.001 - $0.01 | $50 - $100 | $5 - $10 |

### Cost Estimation Best Practices

**1. Platform-Specific Pricing**

```python
# Configure cost estimator with platform-specific pricing
from kaizen.trust.governance import ExternalAgentCostEstimator

estimator = ExternalAgentCostEstimator()

# Copilot Studio pricing (based on Microsoft's pricing model)
copilot_cost = estimator.estimate_cost(
    platform_type="copilot_studio",
    agent_name="hr_assistant",
    complexity="standard",
    input_tokens=500,
    output_tokens=300,
)
# Estimated: $0.06 per invocation
```

**2. Add Safety Buffer**

Always add 20% safety buffer to cost estimates:

```python
estimated_cost = base_cost * 1.20  # 20% buffer
```

**3. Monitor Actual vs Estimated**

Track cost accuracy and adjust estimates:

```python
# After invocation
actual_cost = calculate_actual_cost(execution_metadata)
cost_variance = (actual_cost - estimated_cost) / estimated_cost

if abs(cost_variance) > 0.15:  # >15% variance
    # Adjust cost estimation model
    update_cost_model(platform_type, actual_cost)
```

### Budget Thresholds

**Recommended Thresholds**:

```python
budget_config = {
    "warning_threshold": 0.80,      # Warn at 80%
    "degradation_threshold": 0.90,  # Degrade at 90%
    "enforcement_mode": "hard",     # Block at 100%
}
```

**Threshold Actions**:

- **80% (Warning)**: Send email/Slack notification to team lead
- **90% (Degradation)**: Increase monitoring frequency, alert on-call
- **100% (Hard Limit)**: Block invocations, escalate to management

### Budget Monitoring

**Daily Review** (automated):
- Current spending vs daily limit
- Execution count vs daily limit
- Cost per execution trends

**Weekly Review** (manual):
- Monthly spending trajectory
- Budget utilization by agent
- Identify cost outliers

**Monthly Review** (executive):
- Total spending vs budget
- ROI analysis per agent
- Budget adjustments for next month

---

## Rate Limiting Configuration

### Rate Limits by Use Case

**High-Volume Automation** (batch processing):
```python
RateLimitConfig(
    requests_per_minute=100,    # 100 req/min
    requests_per_hour=5000,     # 5000 req/hour
    requests_per_day=50000,     # 50000 req/day
    burst_multiplier=2.0,       # Allow 100% burst
)
```

**User-Facing Integration** (interactive):
```python
RateLimitConfig(
    requests_per_minute=10,     # 10 req/min per user
    requests_per_hour=100,      # 100 req/hour per user
    requests_per_day=500,       # 500 req/day per user
    burst_multiplier=1.5,       # Allow 50% burst
)
```

**Background Processing** (scheduled):
```python
RateLimitConfig(
    requests_per_minute=5,      # 5 req/min
    requests_per_hour=200,      # 200 req/hour
    requests_per_day=2000,      # 2000 req/day
    burst_multiplier=1.0,       # No burst
)
```

**Critical Services** (high priority):
```python
RateLimitConfig(
    requests_per_minute=200,    # 200 req/min
    requests_per_hour=10000,    # 10000 req/hour
    requests_per_day=100000,    # 100000 req/day
    burst_multiplier=3.0,       # Allow 200% burst
)
```

### Rate Limit Hierarchy

**Organization-Level** (highest priority):
```python
# Apply to entire organization
check_rate_limit(
    agent_id="copilot_hr",
    org_id="org-001",          # Org-level limit
)
```

**Team-Level** (medium priority):
```python
# Apply to team
check_rate_limit(
    agent_id="copilot_hr",
    team_id="team-hr",         # Team-level limit
    org_id="org-001",
)
```

**User-Level** (lowest priority):
```python
# Apply to individual user
check_rate_limit(
    agent_id="copilot_hr",
    user_id="user-001",        # User-level limit
    org_id="org-001",
)
```

### Redis Configuration

**Production Redis Setup**:

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis_data:
```

**Connection Pooling**:

```python
RateLimitConfig(
    redis_max_connections=50,    # Connection pool size
    redis_timeout_seconds=5.0,   # Timeout for Redis operations
    fail_open_on_error=True,     # Allow requests if Redis unavailable
)
```

### Graceful Degradation

**Fail-Open Strategy** (recommended for availability):

```python
# Rate limiter unavailable - allow requests but log warning
if not rate_limiter_available:
    logger.warning("Rate limiter unavailable, allowing request (fail-open)")
    return RateLimitCheckResult(allowed=True)
```

**Fail-Closed Strategy** (for critical security):

```python
# Rate limiter unavailable - deny requests
if not rate_limiter_available:
    logger.error("Rate limiter unavailable, denying request (fail-closed)")
    return RateLimitCheckResult(allowed=False, reason="Rate limiter unavailable")
```

---

## Policy-Based Access Control (ABAC)

### Policy Design Patterns

**Pattern 1: Environment Isolation**

```python
# Production only
ExternalAgentPolicy(
    policy_id="prod_only",
    effect=PolicyEffect.ALLOW,
    conditions=[
        EnvironmentCondition(environments=["production"]),
    ],
)

# Block development
ExternalAgentPolicy(
    policy_id="block_dev",
    effect=PolicyEffect.DENY,
    conditions=[
        EnvironmentCondition(environments=["development"]),
    ],
)
```

**Pattern 2: Time-Based Restrictions**

```python
# Business hours only (Mon-Fri 9am-5pm EST)
ExternalAgentPolicy(
    policy_id="business_hours",
    effect=PolicyEffect.ALLOW,
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
)

# Block during maintenance windows
ExternalAgentPolicy(
    policy_id="maintenance_block",
    effect=PolicyEffect.DENY,
    conditions=[
        TimeWindowCondition(
            maintenance_windows=[
                {"start": "2025-12-25T00:00:00Z", "end": "2025-12-25T23:59:59Z"}
            ]
        )
    ],
)
```

**Pattern 3: Geographic Restrictions**

```python
# US and Canada only
ExternalAgentPolicy(
    policy_id="north_america_only",
    effect=PolicyEffect.ALLOW,
    conditions=[
        LocationCondition(countries=["US", "CA"]),
    ],
)

# Block specific countries (compliance)
ExternalAgentPolicy(
    policy_id="block_restricted_countries",
    effect=PolicyEffect.DENY,
    conditions=[
        LocationCondition(countries=["CN", "RU", "KP"]),
    ],
)
```

**Pattern 4: Provider Allowlisting**

```python
# Allow only Microsoft Copilot
ExternalAgentPolicy(
    policy_id="copilot_only",
    effect=PolicyEffect.ALLOW,
    conditions=[
        ProviderCondition(providers=["copilot_studio"]),
    ],
)

# Block third-party agents
ExternalAgentPolicy(
    policy_id="block_third_party",
    effect=PolicyEffect.DENY,
    conditions=[
        ProviderCondition(providers=["third_party_agent"]),
    ],
)
```

### Policy Priority

**Priority Guidelines**:

- **Priority 1-10**: Security-critical policies (DENY)
- **Priority 11-50**: Compliance policies (ALLOW/DENY)
- **Priority 51-100**: Operational policies (ALLOW)

**Example**:

```python
# Priority 1: Block development (security)
policy_1 = ExternalAgentPolicy(
    policy_id="block_dev",
    effect=PolicyEffect.DENY,
    priority=1,
    conditions=[EnvironmentCondition(environments=["development"])],
)

# Priority 25: Allow production (compliance)
policy_2 = ExternalAgentPolicy(
    policy_id="allow_prod",
    effect=PolicyEffect.ALLOW,
    priority=25,
    conditions=[EnvironmentCondition(environments=["production"])],
)
```

### Conflict Resolution

**DENY_OVERRIDES** (recommended for security):
- Any DENY policy wins, regardless of priority
- Use for security-critical environments

**ALLOW_OVERRIDES** (use for flexibility):
- Any ALLOW policy wins
- Use for development/testing environments

**FIRST_APPLICABLE** (use for simple policies):
- First matching policy wins (by priority)
- Use when policies are mutually exclusive

---

## Monitoring and Alerting

### Key Metrics

**Budget Metrics**:
- `budget_usage_percentage`: Current budget utilization
- `budget_remaining_usd`: Remaining budget (USD)
- `budget_overspend_count`: Number of blocked invocations due to budget

**Rate Limit Metrics**:
- `rate_limit_exceeded_count`: Number of rate-limited requests
- `rate_limit_remaining`: Remaining requests in current window
- `rate_limit_fail_open_count`: Requests allowed due to Redis unavailability

**Policy Metrics**:
- `policy_deny_count`: Number of policy denials
- `policy_evaluation_time_ms`: Policy evaluation latency

### Alert Thresholds

**Critical Alerts** (page on-call):
```yaml
budget_usage_percentage >= 95%
rate_limit_fail_open_count > 100 (in 5 minutes)
policy_deny_count > 50 (in 5 minutes)
```

**Warning Alerts** (email/Slack):
```yaml
budget_usage_percentage >= 80%
rate_limit_exceeded_count > 20 (in 1 minute)
governance_check_latency > 50ms
```

**Info Alerts** (dashboard):
```yaml
budget_usage_percentage >= 50%
daily_execution_count >= 500
```

---

## Security Considerations

### Credential Protection

**1. Encrypt All Credentials**:
```python
# Credentials are automatically encrypted in ExternalAgentService
encrypted = await service.encrypt_credentials(auth_config)
```

**2. Rotate Encryption Keys**:
- Rotate credential encryption keys every 90 days
- Use AWS KMS, Azure Key Vault, or HashiCorp Vault

**3. Audit Credential Access**:
```python
# Log all credential decryption
await audit_service.log_event(
    event_type="credential_access",
    external_agent_id=agent_id,
    user_id=current_user_id,
)
```

### Policy Enforcement

**Fail-Closed by Default**:
```python
# If policy evaluation fails, deny by default
try:
    result = await policy_engine.evaluate_policies(context)
except Exception:
    return PolicyEvaluationResult(effect=PolicyEffect.DENY, reason="Policy evaluation failed")
```

**Audit All Policy Decisions**:
```python
await audit_service.log_event(
    event_type="policy_evaluated",
    policy_effect=result.effect,
    matched_policies=result.matched_policies,
    external_agent_id=agent_id,
)
```

---

## Performance Optimization

### Caching Strategy

**Budget Cache**:
```python
# Cache budget for 60 seconds to reduce DB lookups
_budget_cache: dict[str, ExternalAgentBudget] = {}
_cache_ttl_seconds = 60
```

**Policy Cache**:
```python
# Cache policies in-memory for fast evaluation
policy_engine.cache_ttl_seconds = 60
```

### Redis Optimization

**Pipeline Operations**:
```python
# Use Redis pipeline for multi-tier rate limit checks (single round-trip)
async with redis_client.pipeline(transaction=True) as pipe:
    for window in ["minute", "hour", "day"]:
        pipe.zremrangebyscore(key, 0, min_score)
        pipe.zcard(key)
    results = await pipe.execute()
```

**Connection Pooling**:
```python
# Use connection pool to reduce connection overhead
connection_pool = ConnectionPool.from_url(
    redis_url,
    max_connections=50,
)
```

---

## Troubleshooting

### Common Issues

**Issue 1: Budget check fails with "Agent not found"**

**Solution**: Verify agent exists and cache is cleared:
```python
# Clear budget cache
governance_service._budget_cache.pop(agent_id, None)

# Retry check
result = await governance_service.check_budget(...)
```

**Issue 2: Rate limiting not working**

**Solution**: Verify Redis connection:
```bash
# Test Redis connection
redis-cli ping
# Expected: PONG

# Check rate limiter initialization
assert governance_service._rate_limiter_initialized == True
```

**Issue 3: Policy evaluation always returns DENY**

**Solution**: Check policy configuration:
```python
# List all policies
for policy_id, policy in governance_service.policy_engine.policies.items():
    print(f"{policy_id}: {policy.effect} (enabled={policy.enabled})")

# Verify at least one ALLOW policy exists
allow_policies = [p for p in policies.values() if p.effect == PolicyEffect.ALLOW]
assert len(allow_policies) > 0
```

---

## See Also

- [External Agents Governance Features](./external-agents-governance.md)
- [External Agents API Documentation](./external-agents-api.md)
- [Kaizen Trust Governance Documentation](../../kailash-kaizen/docs/trust/governance.md)
