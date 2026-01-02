# Gateway Model

## Overview

Gateways represent Nexus instances where agents are deployed. Each gateway belongs to an organization and serves a specific environment.

## Model

```python
@db.model
class Gateway:
    id: str
    organization_id: str
    name: str
    description: Optional[str]
    api_url: str              # Nexus gateway URL
    api_key_encrypted: str    # Encrypted API key
    environment: str          # development, staging, production
    status: str               # active, inactive, error
    health_check_url: Optional[str]
    last_health_check: Optional[str]
    last_health_status: Optional[str]
    created_at: str
    updated_at: str
```

## Environments

| Environment | Purpose |
|-------------|---------|
| `development` | Testing and iteration |
| `staging` | Pre-production validation |
| `production` | Live traffic |

## Gateway Status

| Status | Description |
|--------|-------------|
| `active` | Healthy and accepting deployments |
| `inactive` | Manually disabled |
| `error` | Health check failed |

## API Endpoints

### Create Gateway

```bash
POST /api/v1/gateways
```

```json
{
  "name": "Production Gateway US-East",
  "description": "Main production gateway",
  "api_url": "https://nexus-prod-east.example.com",
  "api_key": "secret-key",
  "environment": "production",
  "health_check_url": "https://nexus-prod-east.example.com/health"
}
```

### List Gateways

```bash
GET /api/v1/gateways?environment=production
```

### Get Gateway

```bash
GET /api/v1/gateways/{id}
```

### Update Gateway

```bash
PUT /api/v1/gateways/{id}
```

```json
{
  "name": "Updated Name",
  "status": "inactive"
}
```

### Delete Gateway

```bash
DELETE /api/v1/gateways/{id}
```

### Check Health

```bash
POST /api/v1/gateways/{id}/health
```

Returns:

```json
{
  "status": "healthy",
  "last_check": "2024-01-15T10:30:00Z",
  "response_time_ms": 45
}
```

## Service Operations

```python
from studio.services.gateway_service import GatewayService

service = GatewayService()

# Create
gateway = await service.create({
    "organization_id": org_id,
    "name": "Production Gateway",
    "api_url": "https://nexus.example.com",
    "api_key": "secret",
    "environment": "production",
})

# Get
gateway = await service.get(gateway_id)

# List by environment
gateways = await service.list(org_id, environment="production")

# Check health
health = await service.check_health(gateway_id)

# Get for environment (first active)
gateway = await service.get_by_environment(org_id, "production")
```

## Security

### API Key Encryption

API keys are encrypted at rest using Fernet:

```python
from cryptography.fernet import Fernet

# Encrypt when storing
encrypted = Fernet(key).encrypt(api_key.encode())

# Decrypt when using
decrypted = Fernet(key).decrypt(encrypted).decode()
```

### Access Control

Only `org_owner` and `org_admin` can manage gateways.

## Health Checks

### Automatic Checks

Background job checks gateway health periodically:

```python
async def check_all_gateways():
    gateways = await gateway_service.list_all_active()
    for gateway in gateways:
        try:
            await gateway_service.check_health(gateway["id"])
        except Exception as e:
            await gateway_service.update_status(gateway["id"], "error")
```

### Manual Checks

Trigger via API when troubleshooting.

## Best Practices

1. **Separate environments** - Different gateways for dev/staging/prod
2. **Geographic distribution** - Gateways in multiple regions
3. **Health monitoring** - Set up alerts for health check failures
4. **Rotate API keys** - Regular key rotation schedule
5. **Capacity planning** - Monitor gateway load
