# Agent Contexts & Tools

## Contexts

### Overview

Contexts provide additional knowledge to agents. They can be text snippets, documents, or URLs.

### Model

```python
@db.model
class AgentContext:
    id: str
    agent_id: str
    name: str
    content_type: str     # text, file, url
    content: str          # Content or path
    is_active: bool
    created_at: str
    updated_at: str
```

### Content Types

| Type | Content Field |
|------|---------------|
| `text` | Raw text content |
| `file` | File path in storage |
| `url` | URL to fetch content from |

### API Endpoints

#### Add Context

```bash
POST /api/v1/agents/{id}/contexts
```

```json
{
  "name": "Product FAQ",
  "content_type": "text",
  "content": "Q: What are your hours?\nA: We're open 9-5 M-F..."
}
```

#### List Contexts

```bash
GET /api/v1/agents/{id}/contexts
```

#### Update Context

```bash
PUT /api/v1/agents/{id}/contexts/{ctx_id}
```

```json
{
  "content": "Updated content...",
  "is_active": true
}
```

#### Remove Context

```bash
DELETE /api/v1/agents/{id}/contexts/{ctx_id}
```

### Service Operations

```python
from studio.services.agent_service import AgentService

service = AgentService()

# Add context
context = await service.add_context(agent_id, {
    "name": "Product FAQ",
    "content_type": "text",
    "content": "FAQ content here...",
})

# List contexts
contexts = await service.list_contexts(agent_id)

# Update context
context = await service.update_context(context_id, {
    "is_active": False
})

# Remove context
await service.remove_context(context_id)
```

## Tools

### Overview

Tools extend agent capabilities with functions, MCP servers, or API integrations.

### Model

```python
@db.model
class AgentTool:
    id: str
    agent_id: str
    tool_type: str        # function, mcp, api
    name: str
    description: str
    config: str           # JSON configuration
    is_enabled: bool
    created_at: str
```

### Tool Types

| Type | Config Schema |
|------|--------------|
| `function` | `{"parameters": {...}, "handler": "..."}` |
| `mcp` | `{"server": "...", "tools": [...]}` |
| `api` | `{"endpoint": "...", "method": "...", "headers": {...}}` |

### API Endpoints

#### Add Tool

```bash
POST /api/v1/agents/{id}/tools
```

**Function Tool**:
```json
{
  "tool_type": "function",
  "name": "get_weather",
  "description": "Get current weather for a location",
  "config": {
    "parameters": {
      "type": "object",
      "properties": {
        "location": {"type": "string"}
      },
      "required": ["location"]
    },
    "handler": "tools.weather.get_weather"
  }
}
```

**MCP Tool**:
```json
{
  "tool_type": "mcp",
  "name": "Database Access",
  "description": "Query the product database",
  "config": {
    "server": "mcp://localhost:8080",
    "tools": ["query", "insert"]
  }
}
```

**API Tool**:
```json
{
  "tool_type": "api",
  "name": "CRM Lookup",
  "description": "Look up customer in CRM",
  "config": {
    "endpoint": "https://api.crm.com/customers/{id}",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer ${CRM_API_KEY}"
    }
  }
}
```

#### List Tools

```bash
GET /api/v1/agents/{id}/tools
```

#### Update Tool

```bash
PUT /api/v1/agents/{id}/tools/{tool_id}
```

```json
{
  "is_enabled": false
}
```

#### Remove Tool

```bash
DELETE /api/v1/agents/{id}/tools/{tool_id}
```

### Service Operations

```python
service = AgentService()

# Add tool
tool = await service.add_tool(agent_id, {
    "tool_type": "function",
    "name": "calculator",
    "description": "Perform calculations",
    "config": json.dumps({"handler": "tools.calc"}),
})

# List tools
tools = await service.list_tools(agent_id)

# Update tool
tool = await service.update_tool(tool_id, {
    "is_enabled": False
})

# Remove tool
await service.remove_tool(tool_id)
```

## Best Practices

### Contexts

1. **Keep focused** - One topic per context
2. **Update regularly** - Keep information current
3. **Use active flag** - Toggle without deleting
4. **Size limits** - Stay within token budgets

### Tools

1. **Clear descriptions** - Help LLM understand when to use
2. **Minimal parameters** - Only required fields
3. **Error handling** - Tools should return clear errors
4. **Security** - Use secrets manager for API keys
