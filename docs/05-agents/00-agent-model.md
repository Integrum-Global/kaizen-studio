# Agent Model

## Overview

Agents are the core building blocks in Kaizen Studio. An agent represents an AI-powered automation with specific instructions, context, and tools.

## Agent Model

```python
@db.model
class Agent:
    id: str                   # UUID primary key
    organization_id: str      # Tenant isolation
    workspace_id: str         # Environment context
    name: str                 # Display name
    description: Optional[str]
    agent_type: str           # chat, task, pipeline, custom
    status: str               # draft, active, archived
    system_prompt: Optional[str]
    model_id: str             # gpt-4, claude-3-opus, etc.
    temperature: float        # 0.0 - 2.0
    max_tokens: Optional[int]
    created_by: str
    created_at: str
    updated_at: str
```

## Agent Types

| Type | Description | Use Case |
|------|-------------|----------|
| `chat` | Conversational agent | Customer support, Q&A |
| `task` | Single-purpose automation | Data extraction, classification |
| `pipeline` | Multi-agent workflow | Complex processing chains |
| `custom` | Custom implementation | Specialized logic |

## Status Lifecycle

```
draft → active → archived
```

- **draft**: Under development, not deployable
- **active**: Ready for deployment
- **archived**: Soft-deleted, retained for history

## API Endpoints

### Create Agent

```bash
POST /api/v1/agents
```

```json
{
  "name": "Customer Support Agent",
  "description": "Handles customer inquiries",
  "workspace_id": "ws-123",
  "agent_type": "chat",
  "system_prompt": "You are a helpful customer support agent...",
  "model_id": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

### Get Agent

```bash
GET /api/v1/agents/{id}
```

Returns agent with contexts and tools:

```json
{
  "id": "agent-123",
  "name": "Customer Support Agent",
  "contexts": [...],
  "tools": [...],
  ...
}
```

### List Agents

```bash
GET /api/v1/agents?workspace_id=ws-123&status=active
```

### Update Agent

```bash
PUT /api/v1/agents/{id}
```

```json
{
  "name": "Updated Name",
  "temperature": 0.5
}
```

### Archive Agent

```bash
DELETE /api/v1/agents/{id}
```

Soft deletes by setting `status: "archived"`.

## Service Operations

```python
from studio.services.agent_service import AgentService

service = AgentService()

# Create
agent = await service.create({
    "organization_id": org_id,
    "workspace_id": ws_id,
    "name": "My Agent",
    "agent_type": "chat",
    "model_id": "gpt-4",
    "temperature": 0.7,
    "created_by": user_id,
})

# Get with details (contexts + tools)
agent = await service.get_with_details(agent_id)

# Update
agent = await service.update(agent_id, {
    "temperature": 0.5
})

# Delete (soft)
await service.delete(agent_id)

# List
agents = await service.list(
    organization_id=org_id,
    workspace_id=ws_id,
    filters={"status": "active"}
)
```

## Model Selection

Supported models:

| Provider | Models |
|----------|--------|
| OpenAI | gpt-4, gpt-4-turbo, gpt-3.5-turbo |
| Anthropic | claude-3-opus, claude-3-sonnet, claude-3-haiku |
| Google | gemini-pro, gemini-ultra |
| Azure | gpt-4 (via Azure OpenAI) |

## Best Practices

1. **Descriptive names** - Include purpose in name
2. **Clear prompts** - Write detailed system prompts
3. **Appropriate temperature** - Lower for factual, higher for creative
4. **Version before changes** - Create version snapshot before major updates
5. **Test in draft** - Keep in draft until tested
