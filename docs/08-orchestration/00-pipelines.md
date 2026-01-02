# Pipelines

## Overview

Pipelines combine multiple agents into orchestrated workflows using visual graph patterns.

## Pipeline Model

```python
@db.model
class Pipeline:
    id: str
    organization_id: str
    workspace_id: str
    name: str
    description: Optional[str]
    pattern: str              # sequential, parallel, router, supervisor, ensemble
    status: str               # draft, active, archived
    created_by: str
    created_at: str
    updated_at: str
```

## Orchestration Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| `sequential` | Agents execute in order | Step-by-step processing |
| `parallel` | Agents execute simultaneously | Independent tasks |
| `router` | Route based on condition | Classification, triage |
| `supervisor` | Supervisor delegates work | Complex coordination |
| `ensemble` | Multiple agents vote | Improved accuracy |

## Pipeline Structure

A pipeline consists of:
- **Nodes**: Individual units (agents, inputs, outputs)
- **Connections**: Links between nodes

### Node Types

| Type | Description |
|------|-------------|
| `agent` | Kaizen agent execution |
| `input` | Pipeline input |
| `output` | Pipeline output |
| `condition` | Conditional branching |
| `merge` | Combine parallel results |

## API Endpoints

### Create Pipeline

```bash
POST /api/v1/pipelines
```

```json
{
  "name": "Customer Support Pipeline",
  "description": "Triage and respond to inquiries",
  "workspace_id": "ws-123",
  "pattern": "router"
}
```

### Get Pipeline with Graph

```bash
GET /api/v1/pipelines/{id}
```

Returns pipeline with nodes and connections:

```json
{
  "id": "pipe-123",
  "name": "Customer Support Pipeline",
  "pattern": "router",
  "nodes": [...],
  "connections": [...]
}
```

### Save Graph

```bash
PUT /api/v1/pipelines/{id}/graph
```

```json
{
  "nodes": [
    {
      "id": "node-1",
      "node_type": "input",
      "label": "Customer Query",
      "position_x": 100,
      "position_y": 100
    },
    {
      "id": "node-2",
      "node_type": "agent",
      "agent_id": "agent-classifier",
      "label": "Classifier",
      "position_x": 300,
      "position_y": 100
    }
  ],
  "connections": [
    {
      "source_node_id": "node-1",
      "target_node_id": "node-2",
      "source_handle": "output",
      "target_handle": "input"
    }
  ]
}
```

### Validate Pipeline

```bash
POST /api/v1/pipelines/{id}/validate
```

Returns validation result:

```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "Node 'Classifier' has no outgoing connections"
  ]
}
```

### List Patterns

```bash
GET /api/v1/pipelines/patterns
```

## Service Operations

```python
from studio.services.pipeline_service import PipelineService

service = PipelineService()

# Create
pipeline = await service.create({
    "organization_id": org_id,
    "workspace_id": ws_id,
    "name": "Support Pipeline",
    "pattern": "router",
    "created_by": user_id,
})

# Get with graph
pipeline = await service.get_with_graph(pipeline["id"])

# Save graph
await service.save_graph(
    pipeline["id"],
    nodes=[...],
    connections=[...]
)

# Validate
result = await service.validate(pipeline["id"])
if not result["valid"]:
    print(result["errors"])

# Build Kailash workflow
workflow = await service.build_workflow(pipeline["id"])
```

## Visual Canvas Integration

The frontend uses React Flow for the visual canvas. The backend API supports:

1. **Load graph**: `GET /pipelines/{id}` returns nodes/connections
2. **Save graph**: `PUT /pipelines/{id}/graph` saves entire graph
3. **Incremental edits**: Add/update/delete individual nodes/connections
4. **Validation**: Check graph structure before deployment

## Best Practices

1. **Start simple** - Begin with sequential, add complexity
2. **Validate often** - Check structure before deploying
3. **Name clearly** - Descriptive node labels
4. **Document patterns** - Explain why pattern was chosen
5. **Test incrementally** - Test each node before connecting
