# Webhooks

## Overview

Webhooks notify external systems when events occur in Kaizen Studio.

## Webhook Model

```python
@db.model
class Webhook:
    id: str
    organization_id: str
    name: str
    url: str
    secret: str
    events: str
    status: str
    last_triggered_at: Optional[str]
    failure_count: int
    created_by: str
    created_at: str
    updated_at: str
```

## Creating Webhooks

```bash
POST /api/v1/webhooks
```

```json
{
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/services/xxx",
  "events": ["deployment.active", "deployment.failed"]
}
```

Response includes secret for signature verification:

```json
{
  "id": "wh-123",
  "name": "Slack Notifications",
  "secret": "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  ...
}
```

## Event Types

| Event | Description |
|-------|-------------|
| `agent.created` | Agent created |
| `agent.updated` | Agent modified |
| `agent.deleted` | Agent archived |
| `deployment.created` | Deployment initiated |
| `deployment.active` | Deployment successful |
| `deployment.failed` | Deployment failed |
| `deployment.stopped` | Deployment stopped |
| `pipeline.created` | Pipeline created |
| `pipeline.updated` | Pipeline modified |
| `user.invited` | User invited |
| `user.joined` | User accepted invitation |

## Payload Format

```json
{
  "id": "evt_123",
  "type": "deployment.active",
  "created_at": "2024-01-15T10:00:00Z",
  "organization_id": "org-456",
  "data": {
    "deployment_id": "dep-789",
    "agent_id": "agent-abc",
    "gateway_id": "gw-def",
    "endpoint_url": "https://gateway.example.com/agent-abc"
  }
}
```

## Security

### Signature Verification

Webhooks include HMAC-SHA256 signature:

```
X-Webhook-Signature: sha256=<hmac_hex>
X-Webhook-Timestamp: <unix_timestamp>
```

### Verification Code

```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    provided = signature.replace("sha256=", "")
    return hmac.compare_digest(expected, provided)
```

## API Endpoints

### List Event Types

```bash
GET /api/v1/webhooks/events
```

### Create Webhook

```bash
POST /api/v1/webhooks
```

### List Webhooks

```bash
GET /api/v1/webhooks
```

### Get Webhook

```bash
GET /api/v1/webhooks/{id}
```

### Update Webhook

```bash
PUT /api/v1/webhooks/{id}
```

```json
{
  "events": ["deployment.active"],
  "status": "inactive"
}
```

### Delete Webhook

```bash
DELETE /api/v1/webhooks/{id}
```

### Test Webhook

```bash
POST /api/v1/webhooks/{id}/test
```

Sends test event to verify configuration.

### List Deliveries

```bash
GET /api/v1/webhooks/{id}/deliveries
```

### Get Delivery Details

```bash
GET /api/v1/webhooks/deliveries/{id}
```

### Retry Delivery

```bash
POST /api/v1/webhooks/deliveries/{id}/retry
```

## Delivery Status

| Status | Description |
|--------|-------------|
| `pending` | Queued for delivery |
| `success` | Delivered successfully (2xx) |
| `failed` | Failed after retries |

## Retry Logic

Failed deliveries retry with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 5 minutes |

After 3 failures, delivery marked as failed.

## Service Operations

```python
from studio.services.webhook_service import WebhookService

service = WebhookService()

# Create webhook
webhook = await service.create({
    "organization_id": org_id,
    "name": "My Webhook",
    "url": "https://example.com/webhook",
    "events": ["agent.created", "deployment.active"],
    "created_by": user_id,
})

# Trigger event (called internally)
await service.trigger(
    organization_id=org_id,
    event_type="deployment.active",
    payload={"deployment_id": dep_id}
)

# List deliveries
deliveries = await service.list_deliveries(webhook_id, limit=50)

# Retry failed
await service.retry_failed(delivery_id)
```

## Best Practices

1. **Verify signatures** - Always validate HMAC
2. **Respond quickly** - Return 2xx within 5 seconds
3. **Idempotent handlers** - Handle duplicate deliveries
4. **Monitor failures** - Alert on repeated failures
5. **Secure endpoints** - Use HTTPS only
