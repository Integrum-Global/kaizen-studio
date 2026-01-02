# External Agents Migration Guide

**Version**: 1.0.0
**Last Updated**: 2025-12-20
**For**: DevOps Engineers, System Administrators

---

## Introduction

This guide covers upgrading existing Kaizen Studio installations to support the External Agents feature. The migration adds new database tables, environment variables, and services while maintaining backward compatibility with existing workflows.

---

## Prerequisites

### Version Requirements

**Minimum Versions**:
- **Kaizen Studio**: v1.4.0 or higher
- **PostgreSQL**: 13+ (with pg_trgm extension)
- **Redis**: 6+ (for rate limiting)
- **Python**: 3.10+
- **DataFlow**: 0.10.0+
- **Kaizen SDK**: 0.2.0+

**Check Current Version**:
```bash
# Check Kaizen Studio version
curl http://localhost:8000/api/version

# Check PostgreSQL version
psql --version

# Check Redis version
redis-cli --version

# Check Python packages
pip list | grep -E "kailash|dataflow"
```

### Backup Database

**CRITICAL**: Back up your database before migration.

```bash
# PostgreSQL backup
pg_dump -h localhost -U kaizen_user kaizen_db > kaizen_backup_$(date +%Y%m%d).sql

# Verify backup
ls -lh kaizen_backup_*.sql

# Test restore (on test database)
createdb kaizen_test
psql -U kaizen_user kaizen_test < kaizen_backup_$(date +%Y%m%d).sql
```

### Estimate Downtime

**Expected Downtime**: 5-10 minutes
- Database migrations: 2-3 minutes
- Service restart: 1-2 minutes
- Smoke tests: 2-3 minutes

**Maintenance Window**: Schedule during low-traffic period.

---

## Migration Steps

### Step 1: Update Python Packages

**Install New Dependencies**:
```bash
# Activate virtual environment
source venv/bin/activate

# Update packages
pip install --upgrade \
  kailash-dataflow>=0.10.0 \
  kailash-nexus>=0.3.0 \
  kailash-kaizen>=0.2.0 \
  redis>=5.0.0 \
  cryptography>=41.0.0

# Verify installations
pip list | grep -E "kailash|dataflow|redis|cryptography"
```

### Step 2: Update Environment Variables

**Add to `.env` file**:

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
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
EXTERNAL_AGENT_ENCRYPTION_KEY=<your-generated-key>

# Governance Settings
EXTERNAL_AGENT_BUDGET_WARNING_THRESHOLD=0.80
EXTERNAL_AGENT_BUDGET_DEGRADATION_THRESHOLD=0.90
EXTERNAL_AGENT_RATE_LIMIT_FAIL_OPEN=true

# Webhook Delivery
EXTERNAL_AGENT_WEBHOOK_TIMEOUT_SECONDS=30
EXTERNAL_AGENT_WEBHOOK_RETRY_ATTEMPTS=3
```

**Generate Encryption Key**:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Output: 1_abcdefghijklmnopqrstuvwxyz123456789ABCDEFG=
# Copy this to EXTERNAL_AGENT_ENCRYPTION_KEY
```

**Verify Environment Variables**:
```bash
# Check Redis connection
redis-cli -u $REDIS_URL ping
# Expected: PONG

# Check encryption key format
python -c "from cryptography.fernet import Fernet; import os; Fernet(os.environ['EXTERNAL_AGENT_ENCRYPTION_KEY'].encode())"
# Expected: No error
```

### Step 3: Start Redis Service

**Docker Compose** (recommended):
```yaml
# docker-compose.yml (add Redis service)
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

**Start Redis**:
```bash
# Via docker-compose
docker-compose up -d redis

# Verify Redis is running
docker-compose ps redis

# Test connection
redis-cli ping
# Expected: PONG
```

**Systemd** (alternative):
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Verify
sudo systemctl status redis
```

### Step 4: Run Database Migrations

**IMPORTANT**: This creates new tables and indexes. Ensure database is backed up.

```bash
# Navigate to Kaizen Studio directory
cd /path/to/kaizen-studio

# Run DataFlow migrations
python -m dataflow migrate

# Expected output:
# ✅ Creating table: external_agents
# ✅ Creating table: invocation_lineage
# ✅ Extending table: billing_usage (adding external_agent_id column)
# ✅ Creating index: idx_external_agents_org_id
# ✅ Creating index: idx_invocation_lineage_user_email
# ✅ Creating index: idx_invocation_lineage_agent_id
# ✅ Creating index: idx_invocation_lineage_timestamp
# ✅ Migration completed successfully
```

**Verify Migrations**:
```bash
# Check table creation
psql -U kaizen_user kaizen_db -c "\dt external_agents"
psql -U kaizen_user kaizen_db -c "\dt invocation_lineage"

# Check indexes
psql -U kaizen_user kaizen_db -c "\di idx_external_agents_org_id"
psql -U kaizen_user kaizen_db -c "\di idx_invocation_lineage_user_email"

# Check schema
psql -U kaizen_user kaizen_db -c "\d external_agents"
```

**Expected Schema**:
```sql
-- external_agents table
Table "public.external_agents"
Column                      | Type                     | Nullable
----------------------------+--------------------------+----------
id                          | character varying(255)   | not null
name                        | character varying(255)   | not null
description                 | text                     |
platform                    | character varying(50)    | not null
platform_config             | jsonb                    | not null
auth_config                 | jsonb                    | not null
encrypted_credentials       | bytea                    |
max_monthly_cost            | double precision         |
max_daily_cost              | double precision         |
cost_per_execution          | double precision         |
requests_per_minute         | integer                  |
requests_per_hour           | integer                  |
requests_per_day            | integer                  |
organization_id             | character varying(255)   | not null
created_by                  | character varying(255)   | not null
created_at                  | timestamp with time zone | not null
updated_at                  | timestamp with time zone |

Indexes:
    "external_agents_pkey" PRIMARY KEY, btree (id)
    "idx_external_agents_org_id" btree (organization_id)
```

### Step 5: Restart Services

**Stop Services**:
```bash
# Via systemd
sudo systemctl stop kaizen-studio

# Via docker-compose
docker-compose down kaizen-studio

# Via supervisor
sudo supervisorctl stop kaizen-studio
```

**Start Services**:
```bash
# Via systemd
sudo systemctl start kaizen-studio
sudo systemctl status kaizen-studio

# Via docker-compose
docker-compose up -d kaizen-studio
docker-compose logs -f kaizen-studio

# Via supervisor
sudo supervisorctl start kaizen-studio
sudo supervisorctl status kaizen-studio
```

**Verify Services**:
```bash
# Check API health
curl http://localhost:8000/api/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected",
    "external_agents": "enabled"
  }
}
```

### Step 6: Post-Migration Validation

**Smoke Tests**:

**Test 1: Create External Agent**
```bash
curl -X POST "http://localhost:8000/api/external-agents" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "platform": "teams",
    "platform_config": {"webhook_url": "https://example.com/webhook"},
    "auth_config": {"auth_type": "none", "credentials": {}},
    "max_monthly_cost": 100.0
  }'

# Expected: 201 Created with agent details
```

**Test 2: List External Agents**
```bash
curl "http://localhost:8000/api/external-agents" \
  -H "Authorization: Bearer $API_KEY"

# Expected: 200 OK with list of agents
```

**Test 3: Check Governance Status**
```bash
curl "http://localhost:8000/api/external-agents/{agent_id}/governance-status" \
  -H "Authorization: Bearer $API_KEY"

# Expected: 200 OK with budget, rate limit, policy status
```

**Test 4: Verify Lineage Tracking**
```bash
# Invoke agent
curl -X POST "http://localhost:8000/api/external-agents/{agent_id}/invoke" \
  -H "Authorization: Bearer $API_KEY" \
  -H "X-External-User-ID: test@example.com" \
  -H "X-External-User-Email: test@example.com" \
  -H "X-External-System: test" \
  -H "X-External-Session-ID: test-session-123" \
  -d '{"input": "test"}'

# Expected: 200 OK with invocation_id

# Verify lineage record created
psql -U kaizen_user kaizen_db -c "SELECT * FROM invocation_lineage WHERE external_user_email = 'test@example.com';"
```

**Test 5: Existing Workflows Still Work**
```bash
# Execute existing workflow (without external agents)
curl -X POST "http://localhost:8000/api/workflows/{workflow_id}/execute" \
  -H "Authorization: Bearer $API_KEY"

# Expected: 200 OK (backward compatibility)
```

---

## Rollback Plan

If migration fails, follow these steps to rollback.

### Step 1: Stop Services

```bash
sudo systemctl stop kaizen-studio
```

### Step 2: Restore Database

```bash
# Drop new tables
psql -U kaizen_user kaizen_db <<EOF
DROP TABLE IF EXISTS invocation_lineage CASCADE;
DROP TABLE IF EXISTS external_agents CASCADE;
ALTER TABLE billing_usage DROP COLUMN IF EXISTS external_agent_id;
EOF

# Restore from backup
psql -U kaizen_user kaizen_db < kaizen_backup_$(date +%Y%m%d).sql
```

### Step 3: Revert Environment Variables

```bash
# Remove External Agent variables from .env
# Keep only original variables
```

### Step 4: Downgrade Packages

```bash
pip install --upgrade \
  kailash-dataflow==0.9.0 \
  kailash-nexus==0.2.0 \
  kailash-kaizen==0.1.0
```

### Step 5: Restart Services

```bash
sudo systemctl start kaizen-studio
sudo systemctl status kaizen-studio
```

### Step 6: Verify Rollback

```bash
# Check API health
curl http://localhost:8000/api/health

# Verify external_agents table does not exist
psql -U kaizen_user kaizen_db -c "\dt external_agents"
# Expected: "Did not find any relation named "external_agents"."
```

---

## Migration Checklist

### Pre-Migration
- [ ] Version requirements met (Kaizen Studio v1.4.0+, PostgreSQL 13+, Redis 6+)
- [ ] Database backed up (`pg_dump` completed)
- [ ] Backup verified (test restore successful)
- [ ] Maintenance window scheduled
- [ ] Team notified of downtime

### Migration
- [ ] Python packages updated (kailash-dataflow, redis, cryptography)
- [ ] Environment variables added to `.env`
- [ ] Encryption key generated and added
- [ ] Redis service started and verified
- [ ] Database migrations run successfully
- [ ] Migration logs reviewed (no errors)
- [ ] Services restarted

### Post-Migration
- [ ] API health check passed
- [ ] External agents table created
- [ ] Invocation lineage table created
- [ ] Indexes created
- [ ] Smoke tests passed (create agent, list agents, invoke)
- [ ] Existing workflows still work (backward compatibility)
- [ ] Lineage tracking verified
- [ ] Governance checks verified (budget, rate limit)
- [ ] Team notified migration complete

### Rollback (if needed)
- [ ] Services stopped
- [ ] Database restored from backup
- [ ] Environment variables reverted
- [ ] Packages downgraded
- [ ] Services restarted
- [ ] Rollback verified

---

## Common Migration Issues

### Issue 1: Migration Fails - "Table already exists"

**Symptom**:
```
Error: Table "external_agents" already exists
```

**Cause**: Partial migration from previous attempt.

**Solution**:
```bash
# Check migration state
python -m dataflow migrate --status

# Rollback partial migration
python -m dataflow migrate --rollback

# Re-run migration
python -m dataflow migrate
```

---

### Issue 2: Redis Connection Refused

**Symptom**:
```
ConnectionError: Error connecting to Redis (localhost:6379)
```

**Cause**: Redis not started or wrong URL.

**Solution**:
```bash
# Check Redis status
systemctl status redis

# Start Redis
systemctl start redis

# Test connection
redis-cli ping

# Verify REDIS_URL in .env
echo $REDIS_URL
```

---

### Issue 3: Encryption Key Invalid

**Symptom**:
```
ValueError: Fernet key must be 32 url-safe base64-encoded bytes
```

**Cause**: Invalid encryption key format.

**Solution**:
```bash
# Generate new key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Update .env
EXTERNAL_AGENT_ENCRYPTION_KEY=<new-key>

# Restart services
systemctl restart kaizen-studio
```

---

### Issue 4: Existing Workflows Break

**Symptom**: Workflows that worked before migration now fail.

**Cause**: Backward incompatibility (should not happen).

**Solution**:
```bash
# Check error logs
journalctl -u kaizen-studio -n 100

# If critical, rollback immediately
# Follow Rollback Plan above

# If minor, file bug report with logs
```

---

### Issue 5: Slow Performance After Migration

**Symptom**: API responses 2-3x slower after migration.

**Cause**: Missing indexes or Redis not configured.

**Solution**:
```bash
# Verify indexes created
psql -U kaizen_user kaizen_db -c "\di idx_external_agents_org_id"

# Check Redis connection pooling
redis-cli INFO clients

# Optimize PostgreSQL
ANALYZE external_agents;
ANALYZE invocation_lineage;
```

---

## Performance Validation

After migration, validate performance meets targets:

**Rate Limiting Latency** (target <10ms):
```bash
# Run benchmark
pytest tests/benchmarks/test_rate_limiting_performance.py -v

# Expected: p95 latency <10ms
```

**Lineage Graph Query** (target <1s for 100 nodes):
```bash
# Run benchmark
pytest tests/benchmarks/test_lineage_performance.py -v

# Expected: 100 nodes <1000ms
```

**Database Query Performance**:
```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE query LIKE '%external_agents%'
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Security Validation

After migration, verify security measures:

**Credentials Encrypted**:
```bash
# Query database directly
psql -U kaizen_user kaizen_db -c "SELECT id, name, length(encrypted_credentials) FROM external_agents LIMIT 1;"

# Expected: encrypted_credentials has length >100 (encrypted, not plaintext)
```

**Audit Logging**:
```bash
# Create external agent and verify audit log
curl -X POST "http://localhost:8000/api/external-agents" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{...}'

# Check audit logs
psql -U kaizen_user kaizen_db -c "SELECT * FROM audit_log WHERE event_type = 'external_agent.created' ORDER BY created_at DESC LIMIT 1;"
```

**ABAC Policies**:
```bash
# Create test policy
curl -X POST "http://localhost:8000/api/policies" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{...}'

# Test policy enforcement
curl -X POST "http://localhost:8000/api/external-agents/{agent_id}/invoke" \
  -H "Authorization: Bearer $API_KEY"

# Expected: 403 if policy denies
```

---

## Support

**Migration Issues?** Contact the Kaizen Studio support team.

**Emergency Rollback?** Follow Rollback Plan above immediately.

**Performance Issues?** Review Performance Validation section.

---

## Related Documentation

- [User Guide](./02-user-guide.md) - End-user registration and usage
- [Admin Guide](./03-admin-guide.md) - Configuration and monitoring
- [API Reference](./04-api-reference.md) - Complete API documentation
- [Developer Guide](./05-developer-guide.md) - Architecture and extension guide
