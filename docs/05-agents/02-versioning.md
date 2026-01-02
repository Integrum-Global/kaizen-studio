# Agent Versioning

## Overview

Kaizen Studio automatically tracks agent configuration changes through versioning, enabling rollback and audit capabilities.

## Version Model

```python
@db.model
class AgentVersion:
    id: str
    agent_id: str
    version_number: int      # Auto-increment per agent
    config_snapshot: str     # JSON blob
    changelog: Optional[str]
    created_by: str
    created_at: str
```

## Config Snapshot

The snapshot captures:

```json
{
  "name": "Customer Support Agent",
  "description": "Handles inquiries",
  "agent_type": "chat",
  "system_prompt": "You are helpful...",
  "model_id": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

## API Endpoints

### Create Version

```bash
POST /api/v1/agents/{id}/versions
```

```json
{
  "changelog": "Updated system prompt for better accuracy"
}
```

Response:

```json
{
  "id": "ver-456",
  "version_number": 3,
  "config_snapshot": "{...}",
  "changelog": "Updated system prompt for better accuracy",
  "created_by": "user-123",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### List Versions

```bash
GET /api/v1/agents/{id}/versions
```

Returns versions newest first:

```json
[
  {"version_number": 3, ...},
  {"version_number": 2, ...},
  {"version_number": 1, ...}
]
```

### Rollback to Version

```bash
POST /api/v1/agents/{id}/versions/{version_id}/rollback
```

Restores agent configuration from the specified version snapshot.

## Service Operations

```python
from studio.services.agent_service import AgentService

service = AgentService()

# Create version before major change
version = await service.create_version(
    agent_id,
    changelog="Before prompt rewrite"
)

# Make changes
await service.update(agent_id, {
    "system_prompt": "New prompt..."
})

# If issues, rollback
await service.rollback_to_version(agent_id, version["id"])

# List all versions
versions = await service.get_versions(agent_id)
```

## Workflow

### Recommended Practice

```python
# 1. Create version snapshot
version = await service.create_version(agent_id, "Backup before changes")

# 2. Make changes
await service.update(agent_id, new_config)

# 3. Test the agent
test_result = await test_agent(agent_id)

# 4. If test fails, rollback
if not test_result.passed:
    await service.rollback_to_version(agent_id, version["id"])
```

### Automatic Versioning

Consider creating versions automatically on significant changes:

```python
async def update_agent_with_version(agent_id: str, data: dict, reason: str):
    # Snapshot current state
    await service.create_version(agent_id, f"Auto: {reason}")

    # Apply update
    return await service.update(agent_id, data)
```

## Version Comparison

To compare versions:

```python
import json

v1 = await service.get_version(version_id_1)
v2 = await service.get_version(version_id_2)

config1 = json.loads(v1["config_snapshot"])
config2 = json.loads(v2["config_snapshot"])

# Compare fields
for key in config1:
    if config1[key] != config2.get(key):
        print(f"Changed: {key}")
        print(f"  v1: {config1[key]}")
        print(f"  v2: {config2.get(key)}")
```

## Retention Policy

Versions are retained indefinitely for audit purposes. For cleanup:

```python
# Keep last N versions
async def cleanup_old_versions(agent_id: str, keep: int = 10):
    versions = await service.get_versions(agent_id)
    for version in versions[keep:]:
        await service.delete_version(version["id"])
```

## Best Practices

1. **Version before deployment** - Always snapshot before pushing to production
2. **Meaningful changelogs** - Describe what changed and why
3. **Regular cleanup** - Archive old versions to reduce storage
4. **Test after rollback** - Verify rollback restored expected behavior
5. **Compare before rollback** - Review what will change
