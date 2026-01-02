# External Agents Administrator Guide

**Version**: 1.0.0
**Last Updated**: 2025-12-20
**For**: System Administrators, DevOps Engineers, Infrastructure Teams

---

## Introduction

This guide covers installation, configuration, monitoring, and maintenance of the External Agents feature in Kaizen Studio. External Agents enable integration with Microsoft Copilot, Discord, Slack, Telegram, Notion, and custom REST APIs.

---

## Installation

### Prerequisites

**Required Infrastructure**:
- **PostgreSQL** 13+ (for ExternalAgent, InvocationLineage, BillingUsage tables)
- **Redis** 6+ (for rate limiting with sliding window algorithm)
- **Python** 3.10+
- **Kaizen Studio** v1.5.0+

**Required Packages**:
```bash
pip install kailash-dataflow>=0.10.0
pip install kailash-nexus>=0.3.0
pip install kailash-kaizen>=0.2.0
pip install redis>=5.0.0
pip install cryptography>=41.0.0
```

### Database Migrations

External Agents uses DataFlow for database operations. Run migrations to create required tables:

```bash
# Navigate to Kaizen Studio directory
cd /path/to/kaizen-studio

# Run DataFlow migrations
python -m dataflow migrate

# Expected output:
# ✅ Created table: external_agents
# ✅ Created table: invocation_lineage
# ✅ Created table: billing_usage
# ✅ Created indexes on: organization_id, external_user_email, external_agent_id
```

**Created Tables**:
1. **external_agents**: Agent configuration, credentials, governance settings
2. **invocation_lineage**: Complete audit trail for every invocation
3. **billing_usage**: Cost tracking for budget enforcement (extends existing table)

**Database Indexes** (created automatically):
- `external_agents.organization_id` (for multi-tenancy)
- `invocation_lineage.external_user_email` (for GDPR queries)
- `invocation_lineage.external_agent_id` (for lineage queries)
- `invocation_lineage.request_timestamp` (for time-based queries)

### Environment Variables

Add these to your `.env` file:

```bash
# Redis Configuration (for rate limiting)
REDIS_URL=redis://localhost:6379/0
REDIS_MAX_CONNECTIONS=50
REDIS_TIMEOUT_SECONDS=5.0

# External Agent Defaults
EXTERNAL_AGENT_DEFAULT_MONTHLY_BUDGET=100.0
EXTERNAL_AGENT_DEFAULT_DAILY_BUDGET=10.0
EXTERNAL_AGENT_DEFAULT_RATE_LIMIT_PER_MINUTE=10
EXTERNAL_AGENT_DEFAULT_RATE_LIMIT_PER_HOUR=100
EXTERNAL_AGENT_DEFAULT_RATE_LIMIT_PER_DAY=500

# Credential Encryption
EXTERNAL_AGENT_ENCRYPTION_KEY=<generate-with-fernet-keygen>

# Governance Settings
EXTERNAL_AGENT_BUDGET_WARNING_THRESHOLD=0.80
EXTERNAL_AGENT_BUDGET_DEGRADATION_THRESHOLD=0.90
EXTERNAL_AGENT_RATE_LIMIT_FAIL_OPEN=true

# Webhook Delivery
EXTERNAL_AGENT_WEBHOOK_TIMEOUT_SECONDS=30
EXTERNAL_AGENT_WEBHOOK_RETRY_ATTEMPTS=3
```

**Generate Encryption Key**:
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
# Copy output to EXTERNAL_AGENT_ENCRYPTION_KEY
```

### Service Restart

After migrations and environment variable setup, restart services:

```bash
# Restart Kaizen Studio API
systemctl restart kaizen-studio

# Restart Redis (if not already running)
systemctl start redis

# Verify services
systemctl status kaizen-studio
systemctl status redis
```

### Verify Installation

```bash
# Test API health endpoint
curl http://localhost:8000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "services": {
#     "database": "connected",
#     "redis": "connected",
#     "external_agents": "enabled"
#   }
# }
```

---

## Configuration

### Default Governance Settings

Defaults apply to all new External Agents unless overridden during registration.

**Budget Defaults** (`.env`):
```bash
EXTERNAL_AGENT_DEFAULT_MONTHLY_BUDGET=100.0   # $100/month
EXTERNAL_AGENT_DEFAULT_DAILY_BUDGET=10.0      # $10/day
EXTERNAL_AGENT_DEFAULT_COST_PER_EXECUTION=0.05 # $0.05 per invocation
```

**Rate Limit Defaults** (`.env`):
```bash
EXTERNAL_AGENT_DEFAULT_RATE_LIMIT_PER_MINUTE=10   # 10 req/min
EXTERNAL_AGENT_DEFAULT_RATE_LIMIT_PER_HOUR=100    # 100 req/hour
EXTERNAL_AGENT_DEFAULT_RATE_LIMIT_PER_DAY=500     # 500 req/day
```

**Per-Agent Overrides**:

Users can override defaults during registration via UI or API:

```bash
curl -X POST "http://localhost:8000/api/external-agents" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High-Volume Agent",
    "platform": "discord",
    "max_monthly_cost": 500.0,
    "max_daily_cost": 50.0,
    "requests_per_minute": 50,
    "requests_per_hour": 1000,
    "requests_per_day": 5000
  }'
```

### ABAC Policy Configuration

External Agents integrate with Kaizen Trust Governance for policy-based access control.

**Create Policy** (via API):
```bash
curl -X POST "http://localhost:8000/api/policies" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "policy_id": "prod_only_copilot",
    "name": "Production Only - Microsoft Copilot",
    "effect": "allow",
    "priority": 1,
    "conditions": [
      {
        "type": "environment",
        "environments": ["production"]
      },
      {
        "type": "provider",
        "providers": ["copilot_studio"]
      }
    ]
  }'
```

**Common Policy Patterns**:

**1. Business Hours Only**:
```json
{
  "policy_id": "business_hours",
  "effect": "deny",
  "conditions": [{
    "type": "time_window",
    "business_hours": {
      "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
      "start_time": "09:00",
      "end_time": "17:00",
      "timezone": "America/New_York"
    }
  }]
}
```

**2. Geographic Restrictions**:
```json
{
  "policy_id": "us_only",
  "effect": "allow",
  "conditions": [{
    "type": "location",
    "countries": ["US", "CA"]
  }]
}
```

**3. Block Development Environment**:
```json
{
  "policy_id": "block_dev",
  "effect": "deny",
  "priority": 1,
  "conditions": [{
    "type": "environment",
    "environments": ["development"]
  }]
}
```

**Policy Conflict Resolution**:
- `DENY_OVERRIDES` (default): Any DENY wins
- `ALLOW_OVERRIDES`: Any ALLOW wins
- `FIRST_APPLICABLE`: First match wins (by priority)

Set in `.env`:
```bash
EXTERNAL_AGENT_POLICY_CONFLICT_RESOLUTION=DENY_OVERRIDES
```

### Redis Configuration (Rate Limiting)

**Production Setup** (`docker-compose.yml`):
```yaml
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
    restart: unless-stopped

volumes:
  redis_data:
```

**Redis Persistence**:
```bash
# Append-only file (AOF) for durability
redis-cli CONFIG SET appendonly yes
redis-cli CONFIG SET appendfsync everysec
```

**Connection Pooling** (`.env`):
```bash
REDIS_MAX_CONNECTIONS=50        # Connection pool size
REDIS_TIMEOUT_SECONDS=5.0       # Timeout for Redis operations
REDIS_SOCKET_KEEPALIVE=true     # Enable TCP keepalive
```

**Graceful Degradation**:
```bash
# If Redis unavailable, allow requests (fail-open)
EXTERNAL_AGENT_RATE_LIMIT_FAIL_OPEN=true

# Or deny requests (fail-closed) for security-critical systems
EXTERNAL_AGENT_RATE_LIMIT_FAIL_OPEN=false
```

### Credential Encryption

All External Agent credentials are encrypted at rest using Fernet (symmetric encryption).

**Key Rotation** (every 90 days):

```bash
# 1. Generate new key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# 2. Add to .env as EXTERNAL_AGENT_ENCRYPTION_KEY_NEW
EXTERNAL_AGENT_ENCRYPTION_KEY_NEW=<new-key>

# 3. Run migration script
python scripts/rotate_encryption_key.py

# 4. Replace old key with new key in .env
EXTERNAL_AGENT_ENCRYPTION_KEY=<new-key>

# 5. Remove EXTERNAL_AGENT_ENCRYPTION_KEY_NEW
```

**Key Storage Best Practices**:
- **AWS**: Use AWS Secrets Manager or KMS
- **Azure**: Use Azure Key Vault
- **GCP**: Use Google Secret Manager
- **On-Prem**: Use HashiCorp Vault

---

## Monitoring

### Governance Metrics

**Budget Metrics** (query via API):
```bash
curl "http://localhost:8000/api/external-agents/{agent_id}/governance-status" \
  -H "Authorization: Bearer $API_KEY"

# Response:
{
  "budget": {
    "monthly_budget_usd": 100.0,
    "monthly_spent_usd": 67.5,
    "remaining_monthly_usd": 32.5,
    "usage_percentage": 0.675,
    "warning_triggered": false,
    "degraded_mode": false
  },
  "rate_limit": {
    "allowed": true,
    "remaining": 7,
    "current_usage": {
      "minute": 3,
      "hour": 45,
      "day": 200
    }
  }
}
```

**Key Metrics to Monitor**:
- `usage_percentage`: Budget utilization (alert at >80%)
- `remaining`: Rate limit remaining requests (alert at <10%)
- `current_usage.day`: Daily invocation count (trend analysis)

### Webhook Delivery Logs

**Query Recent Deliveries** (via DataFlow):
```python
from studio.models import ExternalAgentInvocation

# Get failed deliveries in last 24 hours
failed = await ExternalAgentInvocation.list(
    filters={
        "webhook_delivery_status": "failed",
        "created_at__gte": datetime.now() - timedelta(days=1)
    },
    limit=100
)

for invocation in failed:
    print(f"Agent: {invocation.external_agent_id}")
    print(f"Error: {invocation.webhook_delivery_error}")
    print(f"Timestamp: {invocation.created_at}")
```

**Webhook Delivery Metrics**:
- **Delivery Rate**: Percentage of successful deliveries (target >95%)
- **Average Latency**: Time from invocation to delivery (target <500ms)
- **Failure Rate**: Percentage of failed deliveries (target <5%)

### Audit Logs

**Query Governance Denials**:
```python
from studio.services import AuditService

audit = AuditService()

# Budget exceeded events
budget_denials = await audit.query_events(
    event_type="external_agent.budget_exceeded",
    start_date=datetime.now() - timedelta(days=7)
)

# Rate limit exceeded events
rate_limit_denials = await audit.query_events(
    event_type="external_agent.rate_limit_exceeded",
    start_date=datetime.now() - timedelta(days=7)
)

# Policy denials
policy_denials = await audit.query_events(
    event_type="external_agent.policy_denied",
    start_date=datetime.now() - timedelta(days=7)
)
```

**Audit Metrics**:
- **Governance Denials per Day**: Trend analysis (increasing = review limits)
- **Failed Authentications**: Security monitoring (spikes = potential attack)
- **Credential Access Events**: Compliance tracking

### Performance Monitoring

**Rate Limiting Latency**:
```bash
# Query Redis metrics
redis-cli INFO stats

# Key metrics:
# - instantaneous_ops_per_sec: Current ops/sec
# - total_commands_processed: Total commands
# - keyspace_hits: Cache hit rate
# - keyspace_misses: Cache miss rate
```

**Target Latencies**:
- Rate limit check: <10ms (p95)
- Budget check: <5ms (p95, with cache)
- Policy evaluation: <5ms (p95, in-memory)

**Database Query Performance**:
```sql
-- Slow query analysis
SELECT * FROM pg_stat_statements
WHERE query LIKE '%external_agents%'
ORDER BY total_time DESC
LIMIT 10;
```

### Alerting

**Critical Alerts** (page on-call):
```yaml
# Budget exhaustion
- alert: ExternalAgentBudgetExhausted
  expr: external_agent_budget_usage_percentage >= 0.95
  severity: critical

# Rate limiter unavailable
- alert: RateLimiterUnavailable
  expr: redis_up == 0
  severity: critical

# High policy denial rate
- alert: HighPolicyDenialRate
  expr: rate(external_agent_policy_denials[5m]) > 10
  severity: critical
```

**Warning Alerts** (email/Slack):
```yaml
# Budget warning threshold
- alert: ExternalAgentBudgetWarning
  expr: external_agent_budget_usage_percentage >= 0.80
  severity: warning

# High rate limit usage
- alert: HighRateLimitUsage
  expr: external_agent_rate_limit_remaining < 10
  severity: warning

# Webhook delivery failures
- alert: WebhookDeliveryFailures
  expr: rate(external_agent_webhook_failures[1h]) > 0.05
  severity: warning
```

---

## Maintenance

### Credential Rotation

**Recommended Frequency**: Every 90 days

**Process**:
1. **Generate new credentials** in external platform (Teams, Discord, etc.)
2. **Update External Agent** via API or UI:
   ```bash
   curl -X PATCH "http://localhost:8000/api/external-agents/{agent_id}" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "auth_config": {
         "auth_type": "api_key",
         "credentials": {
           "api_key": "new-api-key-here"
         }
       }
     }'
   ```
3. **Test** to verify new credentials work
4. **Revoke old credentials** in external platform
5. **Audit log review** to confirm no failures

**Automation** (cron job):
```bash
# /etc/cron.d/rotate-external-agent-creds
0 0 1 */3 * /usr/local/bin/rotate-external-agent-credentials.sh
```

### Platform Adapter Updates

When external platforms change APIs (e.g., Teams Adaptive Card schema updates):

**Update Process**:
1. **Review platform changelog** (Microsoft, Discord, Slack, etc.)
2. **Update adapter code** in `studio/adapters/{platform}_adapter.py`
3. **Add tests** for new schema/features
4. **Deploy to staging**, test with real webhooks
5. **Deploy to production** during maintenance window

**Backward Compatibility**:
- Maintain support for old schema versions (6-12 months)
- Use version detection in adapters
- Log warnings for deprecated schemas

### Database Maintenance

**Lineage Retention** (default 90 days):
```python
# Archive old lineage records
from studio.services import LineageService

lineage_service = LineageService()
await lineage_service.archive_old_lineage(
    retention_days=90,
    archive_bucket="s3://kaizen-lineage-archive"
)
```

**Billing Usage Retention** (default 13 months for compliance):
```python
# Archive old billing records
from studio.services import BillingService

billing_service = BillingService()
await billing_service.archive_old_usage(
    retention_months=13,
    archive_bucket="s3://kaizen-billing-archive"
)
```

**GDPR Data Erasure**:
```python
# Redact user data (GDPR Right to Erasure)
from studio.services import LineageService

lineage_service = LineageService()
redacted_count = await lineage_service.redact_user_data(
    external_user_email="user@company.com"
)
# Replaces PII with [REDACTED], preserves audit trail
```

### Redis Maintenance

**Memory Management**:
```bash
# Monitor Redis memory usage
redis-cli INFO memory

# Expected output:
# used_memory_human: 512.5M
# maxmemory_human: 2.0G
# maxmemory_policy: allkeys-lru
```

**Key Eviction** (automatic with LRU):
```bash
# Set eviction policy (already in docker-compose.yml)
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

**Persistence** (AOF snapshots):
```bash
# Manual snapshot
redis-cli BGSAVE

# Verify snapshot
ls -lh /var/lib/redis/dump.rdb
```

---

## Security

### Credential Protection

**At Rest**:
- All credentials encrypted with Fernet (symmetric encryption)
- Encryption keys stored in AWS Secrets Manager / Azure Key Vault
- Database column-level encryption for `encrypted_credentials`

**In Transit**:
- HTTPS only for all API calls
- TLS 1.3 for Redis connections (if Redis supports)

**At Runtime**:
- Credentials decrypted only in service layer
- Never logged in plaintext (automatically masked in audit logs)
- Never returned in API responses to unauthorized users

**Audit Trail**:
- All credential access events logged to AuditService
- `event_type: "external_agent.credentials_accessed"`
- Includes user ID, timestamp, IP address

### Policy Enforcement

**Fail-Closed by Default**:
```python
# If policy evaluation fails, deny by default
EXTERNAL_AGENT_POLICY_FAIL_MODE=closed
```

**Policy Audit Trail**:
- All policy evaluations logged (ALLOW and DENY)
- `event_type: "external_agent.policy_evaluated"`
- Includes matched policies, decision rationale

### Network Security

**Firewall Rules**:
```bash
# Allow outbound HTTPS to webhook endpoints
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT

# Block all other outbound (if strict)
iptables -A OUTPUT -j DROP
```

**Webhook URL Allowlisting** (optional):
```bash
# .env configuration
EXTERNAL_AGENT_ALLOWED_WEBHOOK_DOMAINS=outlook.office.com,discord.com,hooks.slack.com,api.telegram.org,api.notion.com
```

### Compliance

**SOC2 Requirements**:
- ✅ Access controls (ABAC policies)
- ✅ Audit logging (all events tracked)
- ✅ Encryption at rest (credentials)
- ✅ Credential rotation (90-day policy)

**GDPR Requirements**:
- ✅ Right of Access (lineage query by user email)
- ✅ Right to Erasure (redaction with audit trail preservation)
- ✅ Consent tracking (captured in `external_context`)
- ✅ Data minimization (only necessary fields stored)

**HIPAA Requirements**:
- ✅ Audit controls (comprehensive logging)
- ✅ Access management (role-based via ABAC)
- ✅ Encryption (at rest and in transit)
- ✅ Data integrity (immutable audit logs)

---

## Troubleshooting

### Redis Connection Failures

**Symptoms**: `ConnectionError: Error connecting to Redis`

**Solutions**:
1. Verify Redis is running: `systemctl status redis`
2. Check connectivity: `redis-cli ping` (expect `PONG`)
3. Verify URL in `.env`: `REDIS_URL=redis://localhost:6379/0`
4. Check firewall: `telnet localhost 6379`
5. Review Redis logs: `journalctl -u redis -n 100`

**Graceful Degradation**:
```bash
# Allow requests if Redis unavailable (fail-open)
EXTERNAL_AGENT_RATE_LIMIT_FAIL_OPEN=true
```

### Database Migration Failures

**Symptoms**: `Table already exists` or `Column not found`

**Solutions**:
1. **Check migration state**:
   ```bash
   python -m dataflow migrate --status
   ```
2. **Rollback last migration**:
   ```bash
   python -m dataflow migrate --rollback
   ```
3. **Re-run migrations**:
   ```bash
   python -m dataflow migrate
   ```
4. **Manual verification**:
   ```sql
   \d external_agents
   \d invocation_lineage
   \d billing_usage
   ```

### High Rate Limit Failures

**Symptoms**: Many `429 Too Many Requests` errors

**Root Causes**:
1. Runaway workflow loop
2. Rate limits too conservative
3. Burst traffic spike

**Solutions**:
1. **Identify culprit agent**:
   ```bash
   curl "http://localhost:8000/api/metrics/rate-limit-violations"
   ```
2. **Review workflow logic** for loops
3. **Increase rate limits** (if legitimate traffic):
   ```bash
   curl -X PATCH "http://localhost:8000/api/external-agents/{agent_id}" \
     -d '{"requests_per_minute": 50}'
   ```
4. **Enable burst handling**:
   ```bash
   EXTERNAL_AGENT_RATE_LIMIT_BURST_MULTIPLIER=2.0
   ```

### Webhook Delivery Failures

**Symptoms**: `webhook_delivery_status: "failed"`

**Debug Steps**:
1. **Check webhook URL**:
   ```bash
   curl -X POST "{webhook_url}" -d '{"text": "test"}'
   ```
2. **Verify credentials** (API key, bearer token)
3. **Review delivery error**:
   ```python
   invocation = await ExternalAgentInvocation.get(id=invocation_id)
   print(invocation.webhook_delivery_error)
   ```
4. **Check platform status** (is Teams/Discord/Slack down?)
5. **Review audit logs** for detailed error messages

---

## Performance Optimization

### Caching Strategy

**Budget Cache** (60-second TTL):
```python
# Reduces database lookups for budget checks
_budget_cache: dict[str, ExternalAgentBudget] = {}
_cache_ttl_seconds = 60
```

**Policy Cache** (in-memory):
```python
# Policies evaluated in-memory for speed
policy_engine.cache_ttl_seconds = 60
```

### Redis Optimization

**Pipeline Operations**:
```python
# Single round-trip for multi-tier rate limit checks
async with redis_client.pipeline(transaction=True) as pipe:
    for window in ["minute", "hour", "day"]:
        pipe.zremrangebyscore(key, 0, min_score)
        pipe.zcard(key)
    results = await pipe.execute()
```

**Connection Pooling**:
```bash
REDIS_MAX_CONNECTIONS=50
REDIS_CONNECTION_POOL_TIMEOUT=10
```

### Database Optimization

**Query Optimization**:
```sql
-- Index on frequently queried columns
CREATE INDEX idx_external_agents_org_id ON external_agents(organization_id);
CREATE INDEX idx_invocation_lineage_user_email ON invocation_lineage(external_user_email);
CREATE INDEX idx_invocation_lineage_timestamp ON invocation_lineage(request_timestamp);
```

**Connection Pooling** (DataFlow):
```bash
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
```

---

## Related Documentation

- [User Guide](./02-user-guide.md) - End-user registration and usage
- [API Reference](./04-api-reference.md) - Complete API documentation
- [Developer Guide](./05-developer-guide.md) - Architecture and extension guide
- [Migration Guide](./06-migration.md) - Upgrade instructions

---

## Support

**Questions?** Contact the Kaizen Studio team.

**Security Issues?** Email security@kaizen.studio.
