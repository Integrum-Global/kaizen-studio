# API Key Management

## Overview

API keys provide programmatic access to Kaizen Studio for service accounts, integrations, and automated workflows.

## API Key Model

```python
@db.model
class APIKey:
    id: str
    organization_id: str
    name: str
    key_hash: str
    key_prefix: str
    scopes: str
    rate_limit: int
    expires_at: Optional[str]
    last_used_at: Optional[str]
    status: str
    created_by: str
    created_at: str
```

## Key Format

```
sk_live_<prefix>_<suffix>
```

Example: `sk_live_a1b2c3d4_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

- **prefix**: 8 characters for identification
- **suffix**: 32 random characters

## Creating Keys

```bash
POST /api/v1/api-keys
```

```json
{
  "name": "CI/CD Pipeline",
  "scopes": ["agents:read", "deployments:write"],
  "rate_limit": 100,
  "expires_at": "2025-12-31T23:59:59Z"
}
```

Response (plain key shown only once):

```json
{
  "id": "key-123",
  "name": "CI/CD Pipeline",
  "key": "sk_live_a1b2c3d4_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "key_prefix": "sk_live_a1b2c3d4",
  "scopes": ["agents:read", "deployments:write"],
  "rate_limit": 100,
  "expires_at": "2025-12-31T23:59:59Z",
  "created_at": "2024-01-15T10:00:00Z"
}
```

## Using Keys

### Header Authentication

```bash
curl https://api.kaizen-studio.com/api/v1/agents \
  -H "Authorization: Bearer sk_live_a1b2c3d4_xxxxx"
```

Or:

```bash
curl https://api.kaizen-studio.com/api/v1/agents \
  -H "X-API-Key: sk_live_a1b2c3d4_xxxxx"
```

### SDK Usage

```python
from studio import KaizenClient

client = KaizenClient(api_key="sk_live_a1b2c3d4_xxxxx")
agents = client.agents.list()
```

## Scopes

| Scope | Description |
|-------|-------------|
| `agents:read` | View agents |
| `agents:write` | Create/update/delete agents |
| `deployments:read` | View deployments |
| `deployments:write` | Create/manage deployments |
| `metrics:read` | View metrics |
| `pipelines:read` | View pipelines |
| `pipelines:write` | Create/manage pipelines |
| `gateways:read` | View gateways |
| `gateways:write` | Manage gateways |

## API Endpoints

### List Available Scopes

```bash
GET /api/v1/api-keys/scopes
```

### Create Key

```bash
POST /api/v1/api-keys
```

### List Keys

```bash
GET /api/v1/api-keys
```

### Get Key Details

```bash
GET /api/v1/api-keys/{id}
```

### Revoke Key

```bash
DELETE /api/v1/api-keys/{id}
```

### Get Usage Stats

```bash
GET /api/v1/api-keys/{id}/usage
```

Returns:

```json
{
  "key_id": "key-123",
  "window_start": "2024-01-15T10:00:00Z",
  "request_count": 45,
  "rate_limit": 100,
  "remaining": 55,
  "reset_at": "2024-01-15T10:01:00Z"
}
```

## Service Operations

```python
from studio.services.api_key_service import APIKeyService

service = APIKeyService()

# Create key (returns plain key once)
key_record, plain_key = await service.create(
    org_id=org_id,
    name="My API Key",
    scopes=["agents:read", "deployments:write"],
    rate_limit=100,
    user_id=user_id
)
print(f"Save this key: {plain_key}")

# Validate key
key = await service.validate(plain_key)
if key:
    print(f"Key belongs to org: {key['organization_id']}")

# Check scope
if await service.check_scope(key, "agents:write"):
    # Allowed
    pass

# List keys
keys = await service.list(organization_id=org_id)

# Revoke key
await service.revoke(key_id)
```

## Security

### Key Storage

- Plain key shown only at creation
- Only bcrypt hash stored in database
- Prefix stored for identification

### Expiration

Set `expires_at` for temporary keys:

```json
{
  "expires_at": "2024-03-31T23:59:59Z"
}
```

### Rotation

1. Create new key
2. Update integrations
3. Revoke old key

## Best Practices

1. **Minimum scopes** - Grant only required permissions
2. **Descriptive names** - Identify key purpose
3. **Set expiration** - Rotate keys regularly
4. **Monitor usage** - Check for anomalies
5. **Revoke unused** - Clean up inactive keys
