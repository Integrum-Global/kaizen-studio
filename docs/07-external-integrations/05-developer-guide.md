# External Agents Developer Guide

**Version**: 1.0.0
**Last Updated**: 2025-12-20
**For**: Developers, Contributors, Platform Engineers

---

## Introduction

This guide covers the architecture, extension patterns, testing strategies, and contribution guidelines for the External Agents feature in Kaizen Studio.

---

## Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ Registration     │  │ Governance       │  │ Lineage          │ │
│  │ Wizard           │  │ Dashboard        │  │ Visualization    │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼ (REST API)
┌─────────────────────────────────────────────────────────────────────┐
│                       API LAYER (FastAPI)                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ /api/external-agents/* endpoints                             │  │
│  │ - POST /external-agents (create)                             │  │
│  │ - GET /external-agents (list)                                │  │
│  │ - POST /external-agents/{id}/invoke (invoke with governance) │  │
│  │ - GET /external-agents/{id}/governance-status                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ ExternalAgent    │  │ Governance       │  │ Webhook          │ │
│  │ Service          │  │ Service          │  │ Delivery         │ │
│  │                  │  │                  │  │ Service          │ │
│  │ - CRUD           │  │ - Budget check   │  │ - Format payload │ │
│  │ - Invoke         │  │ - Rate limit     │  │ - Deliver        │ │
│  │ - Lineage track  │  │ - Policy eval    │  │ - Retry logic    │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (DataFlow)                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ ExternalAgent    │  │ InvocationLineage│  │ BillingUsage     │ │
│  │ Model            │  │ Model            │  │ Model            │ │
│  │                  │  │                  │  │                  │ │
│  │ - @db.model      │  │ - 5 identity     │  │ - Cost tracking  │ │
│  │ - 11 auto-nodes  │  │   layers         │  │ - Budget enforce │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ PostgreSQL       │  │ Redis            │  │ External Systems │ │
│  │                  │  │                  │  │                  │ │
│  │ - Agent config   │  │ - Rate limiting  │  │ - Teams          │ │
│  │ - Lineage audit  │  │ - Sliding window │  │ - Discord        │ │
│  │ - Billing data   │  │ - Fail-open mode │  │ - Slack, etc.    │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

**Invocation Flow** (with governance):

```
1. Client Request
   POST /api/external-agents/{id}/invoke
   + Headers: X-External-User-*, Authorization

2. API Endpoint (external_agents.py)
   - Extract lineage headers
   - Call ExternalAgentService.invoke()

3. ExternalAgentService.invoke()
   - Step 1: Check governance (budget, rate limit, policy)
   - Step 2: Create lineage record (InvocationLineage)
   - Step 3: Execute HTTP request to external endpoint
   - Step 4: Record actual cost and update lineage
   - Step 5: Trigger webhook delivery (async)

4. GovernanceService.check_all()
   - Budget check (EstimatedBudgetEnforcer)
   - Rate limit check (ExternalAgentRateLimiter + Redis)
   - Policy evaluation (ExternalAgentPolicyEngine)
   - Return GovernanceCheckResult (allowed/denied)

5. HTTP Request to External Agent
   - Use platform adapter (TeamsAdapter, DiscordAdapter, etc.)
   - Apply authentication (API key, OAuth2, etc.)
   - Send formatted payload

6. WebhookDeliveryService.deliver_async()
   - Select adapter based on platform
   - Format payload (Adaptive Card, embed, Block Kit, etc.)
   - Deliver with retry (3 attempts, exponential backoff)
   - Update webhook_delivery_status

7. Response to Client
   - Return invocation_id, trace_id, cost_usd, duration_ms
   - Include rate limit headers
```

---

## Extension Guide

### Adding a New Platform Adapter

**Use Case**: Integrate a new external platform (e.g., Mattermost, Telegram, custom REST API).

#### Step 1: Create Adapter Class

Create `studio/adapters/mattermost_adapter.py`:

```python
from studio.adapters.base_webhook import BaseWebhookAdapter, DeliveryResult
from typing import Dict, Any

class MattermostWebhookAdapter(BaseWebhookAdapter):
    """Mattermost webhook adapter for External Agent invocations."""

    def format_payload(self, invocation_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format invocation result to Mattermost message format.

        Mattermost Message Format:
        https://docs.mattermost.com/developer/webhooks-incoming.html
        """
        status = invocation_result.get("status", "unknown")
        agent_id = invocation_result.get("external_agent_id", "N/A")
        duration_ms = invocation_result.get("duration_ms", 0)

        # Status emoji
        emoji = "✅" if status == "success" else "❌"

        # Build Mattermost message
        payload = {
            "username": self.platform_config.get("username", "Kaizen Studio"),
            "icon_url": self.platform_config.get("icon_url"),
            "text": f"{emoji} **External Agent Invocation**",
            "attachments": [{
                "fallback": f"Agent invocation {status}",
                "color": "#00FF00" if status == "success" else "#FF0000",
                "title": "Invocation Details",
                "fields": [
                    {
                        "short": True,
                        "title": "Agent ID",
                        "value": agent_id
                    },
                    {
                        "short": True,
                        "title": "Status",
                        "value": status.upper()
                    },
                    {
                        "short": True,
                        "title": "Duration",
                        "value": f"{duration_ms}ms"
                    }
                ]
            }]
        }

        return payload

    async def deliver(self, payload: Dict[str, Any]) -> DeliveryResult:
        """Execute webhook delivery to Mattermost."""
        webhook_url = self.platform_config.get("webhook_url")

        if not webhook_url:
            return DeliveryResult(
                success=False,
                error="Missing webhook_url in platform_config"
            )

        # Use base class HTTP delivery with retry
        return await self._execute_http_delivery(
            url=webhook_url,
            payload=payload,
            headers={"Content-Type": "application/json"}
        )
```

#### Step 2: Register Adapter

Update `studio/services/webhook_delivery_service.py`:

```python
from studio.adapters.mattermost_adapter import MattermostWebhookAdapter

class WebhookDeliveryService:
    def __init__(self):
        self._adapters: Dict[str, Type[BaseWebhookAdapter]] = {
            "teams": TeamsWebhookAdapter,
            "discord": DiscordWebhookAdapter,
            "slack": SlackWebhookAdapter,
            "telegram": TelegramWebhookAdapter,
            "notion": NotionWebhookAdapter,
            "mattermost": MattermostWebhookAdapter,  # NEW
        }
```

#### Step 3: Add Tests

Create `tests/unit/adapters/test_mattermost_adapter.py`:

```python
import pytest
from studio.adapters.mattermost_adapter import MattermostWebhookAdapter

@pytest.mark.asyncio
async def test_mattermost_payload_formatting():
    """Test Mattermost message formatting."""
    adapter = MattermostWebhookAdapter(
        platform_config={
            "webhook_url": "https://mattermost.example.com/hooks/abc123",
            "username": "Kaizen Bot",
            "icon_url": "https://kaizen.studio/logo.png"
        },
        auth_config={"auth_type": "none", "credentials": {}}
    )

    invocation_result = {
        "status": "success",
        "external_agent_id": "agent_456",
        "duration_ms": 123
    }

    payload = adapter.format_payload(invocation_result)

    assert payload["username"] == "Kaizen Bot"
    assert payload["text"] == "✅ **External Agent Invocation**"
    assert payload["attachments"][0]["color"] == "#00FF00"
    assert any(f["value"] == "agent_456" for f in payload["attachments"][0]["fields"])
```

#### Step 4: Update Documentation

Add to user guide platform configuration examples:

```markdown
**For Mattermost:**
```json
{
  "webhook_url": "https://mattermost.example.com/hooks/abc123",
  "username": "Kaizen Studio",
  "icon_url": "https://kaizen.studio/logo.png"
}
```

---

### Adding a Custom Authentication Type

**Use Case**: Support a new authentication method (e.g., HMAC signatures, mutual TLS).

#### Step 1: Extend Auth Config Schema

Update `studio/models/external_agent.py`:

```python
# Add new auth type to enum
AUTH_TYPES = ["api_key", "oauth2", "bearer_token", "hmac", "none"]

# Example auth_config for HMAC:
# {
#   "auth_type": "hmac",
#   "credentials": {
#     "secret_key": "your-secret-key",
#     "algorithm": "sha256",
#     "header_name": "X-Signature"
#   }
# }
```

#### Step 2: Implement Auth Logic in Adapter

Update `studio/adapters/base_webhook.py`:

```python
import hmac
import hashlib

class BaseWebhookAdapter:
    def _build_auth_headers(self, payload: Dict[str, Any]) -> Dict[str, str]:
        """Build authentication headers based on auth_type."""
        headers = {}
        auth_type = self.auth_config.get("auth_type", "none")
        credentials = self.auth_config.get("credentials", {})

        if auth_type == "api_key":
            header_name = credentials.get("header_name", "X-API-Key")
            headers[header_name] = credentials.get("api_key", "")

        elif auth_type == "oauth2" or auth_type == "bearer_token":
            token = credentials.get("token", "")
            headers["Authorization"] = f"Bearer {token}"

        elif auth_type == "hmac":
            # NEW: HMAC authentication
            secret_key = credentials.get("secret_key", "").encode()
            algorithm = credentials.get("algorithm", "sha256")
            header_name = credentials.get("header_name", "X-Signature")

            # Create signature from payload
            payload_str = json.dumps(payload, sort_keys=True)
            signature = hmac.new(
                secret_key,
                payload_str.encode(),
                getattr(hashlib, algorithm)
            ).hexdigest()

            headers[header_name] = signature

        return headers
```

#### Step 3: Add Tests

Create `tests/unit/test_hmac_auth.py`:

```python
@pytest.mark.asyncio
async def test_hmac_authentication():
    """Test HMAC signature generation."""
    adapter = TeamsWebhookAdapter(
        platform_config={"webhook_url": "https://example.com/webhook"},
        auth_config={
            "auth_type": "hmac",
            "credentials": {
                "secret_key": "test-secret",
                "algorithm": "sha256",
                "header_name": "X-Signature"
            }
        }
    )

    payload = {"message": "test"}
    headers = adapter._build_auth_headers(payload)

    assert "X-Signature" in headers
    assert len(headers["X-Signature"]) == 64  # SHA256 hex digest length
```

---

## Testing Strategy

### 3-Tier Testing Methodology

**Tier 1: Unit Tests** (tests/unit/)
- **Speed**: <1 second per test
- **Isolation**: No external dependencies
- **Mocking**: Allowed for external services
- **Focus**: Individual component functionality

**Example**: Test payload formatting in isolation
```python
def test_discord_embed_formatting():
    adapter = DiscordWebhookAdapter(...)
    payload = adapter.format_payload(invocation_result)
    assert payload["embeds"][0]["color"] == 65280  # Green
```

**Tier 2: Integration Tests** (tests/integration/)
- **Speed**: <5 seconds per test
- **Infrastructure**: Real PostgreSQL, real Redis
- **NO MOCKING**: Use real services (MANDATORY)
- **Focus**: Component interactions

**Example**: Test governance with real Redis
```python
@pytest.mark.asyncio
async def test_rate_limiting_integration(redis_client):
    governance_service = GovernanceService(redis_client=redis_client)

    # Make 10 requests (within limit)
    for i in range(10):
        result = await governance_service.check_rate_limit(...)
        assert result.allowed == True

    # 11th request should be denied
    result = await governance_service.check_rate_limit(...)
    assert result.allowed == False
```

**Tier 3: End-to-End Tests** (tests/e2e/)
- **Speed**: <30 seconds per test
- **Infrastructure**: Complete real infrastructure
- **NO MOCKING**: Only mock external webhook endpoints
- **Focus**: Complete user workflows

**Example**: Test full invocation lifecycle
```python
@pytest.mark.asyncio
async def test_complete_invocation_lifecycle(test_client, mock_teams_webhook):
    # Register agent
    response = test_client.post("/api/external-agents", json={...})
    agent_id = response.json()["id"]

    # Invoke agent
    response = test_client.post(f"/api/external-agents/{agent_id}/invoke", json={...})
    assert response.status_code == 200

    # Verify webhook delivered
    assert mock_teams_webhook.called == True
```

### NO MOCKING Policy (Tiers 2-3)

**FORBIDDEN** ❌:
- Mocking PostgreSQL (use real database)
- Mocking Redis (use real Redis)
- Mocking DataFlow nodes (use real nodes)
- Stubbing internal service responses

**ALLOWED** ✅:
- Mocking external webhook endpoints (Teams, Discord, etc.)
- Time freezing (`freeze_time`)
- Environment variable testing (`patch.dict(os.environ)`)

**Why NO MOCKING?**
1. **Real-world validation**: Tests prove system works in production
2. **Integration verification**: Mocks hide integration failures
3. **Configuration validation**: Real services catch config errors

---

## Code Structure

### Directory Layout

```
apps/kaizen-studio/
├── src/studio/
│   ├── api/
│   │   └── external_agents.py          # FastAPI endpoints
│   ├── models/
│   │   ├── external_agent.py           # DataFlow @db.model
│   │   ├── invocation_lineage.py       # DataFlow @db.model
│   │   └── billing_usage.py            # DataFlow @db.model (extended)
│   ├── services/
│   │   ├── external_agent_service.py   # CRUD + invoke logic
│   │   ├── governance_service.py       # Budget + rate limit + policy
│   │   ├── webhook_delivery_service.py # Webhook orchestration
│   │   └── lineage_service.py          # Lineage tracking
│   └── adapters/
│       ├── base_webhook.py             # Abstract base adapter
│       ├── teams_adapter.py            # Microsoft Teams
│       ├── discord_adapter.py          # Discord
│       ├── slack_adapter.py            # Slack
│       ├── telegram_adapter.py         # Telegram
│       └── notion_adapter.py           # Notion
├── tests/
│   ├── unit/
│   │   ├── test_external_agent_service.py
│   │   ├── test_governance_service.py
│   │   └── adapters/
│   │       └── test_*_adapter.py
│   ├── integration/
│   │   ├── test_external_agents_api.py
│   │   ├── test_governance_integration.py
│   │   └── test_webhook_delivery.py
│   └── e2e/
│       ├── test_external_agent_complete_lifecycle.py
│       ├── test_external_agent_governance_integration.py
│       └── test_external_agent_auth_lineage_integration.py
└── docs/
    └── external-integrations/
        ├── user-guide.md
        ├── admin-guide.md
        ├── api-reference.md
        └── developer-guide.md  # This document
```

### DataFlow Integration

External Agents uses **DataFlow** (Kailash SDK framework) for database operations:

```python
from dataflow import DataFlow

# Initialize DataFlow
db = DataFlow(database_url="postgresql://...")
await db.initialize()

# Define model with @db.model decorator
@db.model
class ExternalAgent:
    id: str
    name: str
    platform: str
    # ... fields

# DataFlow auto-generates 11 nodes:
# - ExternalAgentCreateNode
# - ExternalAgentReadNode
# - ExternalAgentUpdateNode
# - ExternalAgentDeleteNode
# - ExternalAgentListNode
# - ExternalAgentCountNode
# - ExternalAgentBulkCreateNode
# - ExternalAgentBulkUpdateNode
# - ExternalAgentBulkDeleteNode
# - ExternalAgentGetOrCreateNode
# - ExternalAgentUpsertNode

# Use nodes in service layer
from studio.models import ExternalAgent

async def create_agent(data: dict):
    workflow = WorkflowBuilder()
    workflow.add_node("ExternalAgentCreateNode", "create", data)

    runtime = AsyncLocalRuntime()
    results, _ = await runtime.execute_workflow_async(workflow.build())
    return results["create"]
```

**DataFlow Benefits**:
- ✅ Zero-config database operations
- ✅ Automatic migrations
- ✅ Type-safe queries
- ✅ Built-in validation
- ✅ Multi-tenancy support (organization_id isolation)

---

## Contribution Guidelines

### Pull Request Process

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/your-fork/kaizen-studio.git
   cd kaizen-studio
   ```

2. **Create Feature Branch**:
   ```bash
   git checkout -b feature/add-mattermost-adapter
   ```

3. **Implement Changes**:
   - Add code (adapter, service, etc.)
   - Add tests (unit, integration, E2E)
   - Update documentation

4. **Run Tests**:
   ```bash
   # Start test infrastructure
   ./tests/utils/test-env up

   # Run all tests
   pytest tests/ -v

   # Run linting
   ruff check src/
   mypy src/

   # Run type checking
   pyright src/
   ```

5. **Commit and Push**:
   ```bash
   git add .
   git commit -m "feat: Add Mattermost webhook adapter"
   git push origin feature/add-mattermost-adapter
   ```

6. **Create Pull Request**:
   - Title: `feat: Add Mattermost webhook adapter`
   - Description: Explain what, why, how
   - Link related issues
   - Add screenshots (if UI changes)

### Code Review Checklist

**Code Quality**:
- [ ] Follows existing code style (ruff, black)
- [ ] Type hints for all functions
- [ ] Docstrings for all public methods
- [ ] No hardcoded credentials or secrets

**Testing**:
- [ ] Unit tests for new components (Tier 1)
- [ ] Integration tests for service interactions (Tier 2)
- [ ] E2E tests for complete workflows (Tier 3)
- [ ] All tests passing (`pytest tests/ -v`)
- [ ] Code coverage >80% for new code

**Documentation**:
- [ ] User guide updated (if user-facing change)
- [ ] Admin guide updated (if config change)
- [ ] API reference updated (if API change)
- [ ] Developer guide updated (if architecture change)
- [ ] Inline code comments for complex logic

**Security**:
- [ ] No plaintext credentials in code or tests
- [ ] Credentials encrypted at rest
- [ ] Credentials masked in logs
- [ ] Audit logging for sensitive operations

**Performance**:
- [ ] No N+1 queries
- [ ] Database indexes for new query patterns
- [ ] Redis operations use pipelining where possible
- [ ] Benchmarks pass (if performance-critical change)

---

## Performance Considerations

### Rate Limiting Overhead

**Target**: <10ms per invocation

**Optimization Strategies**:
1. **Redis Pipelining**: Batch Redis operations (single round-trip)
   ```python
   async with redis_client.pipeline(transaction=True) as pipe:
       for window in ["minute", "hour", "day"]:
           pipe.zremrangebyscore(key, 0, min_score)
           pipe.zcard(key)
       results = await pipe.execute()
   ```

2. **Connection Pooling**: Reuse Redis connections
   ```python
   connection_pool = ConnectionPool.from_url(
       redis_url,
       max_connections=50
   )
   ```

3. **Fail-Open Mode**: Allow requests if Redis unavailable
   ```python
   if not redis_available:
       logger.warning("Redis unavailable, allowing request (fail-open)")
       return RateLimitCheckResult(allowed=True)
   ```

### Budget Check Overhead

**Target**: <5ms per invocation (with cache)

**Optimization Strategies**:
1. **In-Memory Cache**: Cache budget for 60 seconds
   ```python
   _budget_cache: dict[str, ExternalAgentBudget] = {}
   _cache_ttl_seconds = 60
   ```

2. **Lazy Loading**: Load budget only when needed
3. **Batch Updates**: Update budget in background task

### Database Query Performance

**Optimization Strategies**:
1. **Database Indexes**: Create indexes on frequently queried columns
   ```sql
   CREATE INDEX idx_external_agents_org_id ON external_agents(organization_id);
   CREATE INDEX idx_invocation_lineage_timestamp ON invocation_lineage(request_timestamp);
   ```

2. **Connection Pooling**: Reuse database connections
   ```bash
   DATABASE_POOL_SIZE=20
   DATABASE_MAX_OVERFLOW=10
   ```

3. **Query Optimization**: Use selective fetching
   ```python
   # Bad: Fetch all columns
   agents = await ExternalAgent.list()

   # Good: Fetch only needed columns
   agents = await ExternalAgent.list(
       fields=["id", "name", "platform", "max_monthly_cost"]
   )
   ```

---

## Security Best Practices

### Credential Encryption

**At Rest** (Fernet symmetric encryption):
```python
from cryptography.fernet import Fernet

# Generate key
key = Fernet.generate_key()
cipher = Fernet(key)

# Encrypt credentials
encrypted = cipher.encrypt(json.dumps(credentials).encode())

# Decrypt credentials
decrypted = json.loads(cipher.decrypt(encrypted).decode())
```

**In Transit** (HTTPS only):
- All API calls use HTTPS
- TLS 1.3 for Redis (if supported)

**At Runtime** (decrypt only when needed):
```python
# Decrypt only in service layer
def get_auth_headers(self):
    decrypted_creds = self._decrypt_credentials()
    # Use credentials
    # Immediately discard from memory
```

### Audit Logging

**Log All Sensitive Operations**:
```python
await audit_service.log_event(
    event_type="external_agent.credentials_accessed",
    user_id=current_user_id,
    external_agent_id=agent_id,
    ip_address=request.client.host,
    metadata={"action": "decrypt"}
)
```

### ABAC Policy Enforcement

**Fail-Closed by Default**:
```python
try:
    result = await policy_engine.evaluate_policies(context)
except Exception:
    # If evaluation fails, deny by default
    return PolicyEvaluationResult(effect=PolicyEffect.DENY, reason="Policy evaluation failed")
```

---

## Troubleshooting Development Issues

### Redis Connection Errors

**Symptom**: `ConnectionError: Error connecting to Redis`

**Solution**:
```bash
# Start Redis via docker-compose
docker-compose up -d redis

# Test connection
redis-cli ping

# Check environment variable
echo $REDIS_URL
```

### DataFlow Migration Errors

**Symptom**: `Table already exists`

**Solution**:
```bash
# Check migration status
python -m dataflow migrate --status

# Rollback if needed
python -m dataflow migrate --rollback

# Re-run migrations
python -m dataflow migrate
```

### Test Failures

**Symptom**: Tests failing with "Event loop is closed"

**Solution**:
```python
# Ensure event_loop fixture is session-scoped
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
```

---

## Related Documentation

- [User Guide](./02-user-guide.md) - End-user registration and usage
- [Admin Guide](./03-admin-guide.md) - Installation and configuration
- [API Reference](./04-api-reference.md) - Complete API documentation
- [Migration Guide](./06-migration.md) - Upgrade instructions

---

## Support

**Questions?** Contact the Kaizen Studio development team.

**Bugs?** File an issue in the project repository.

**Contributing?** See CONTRIBUTING.md for detailed guidelines.
