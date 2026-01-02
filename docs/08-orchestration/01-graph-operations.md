# Graph Operations

## Node Operations

### Node Model

```python
@db.model
class PipelineNode:
    id: str
    pipeline_id: str
    node_type: str            # agent, input, output, condition, merge
    agent_id: Optional[str]
    label: str
    position_x: float
    position_y: float
    config: Optional[str]
    created_at: str
    updated_at: str
```

### Add Node

```bash
POST /api/v1/pipelines/{id}/nodes
```

```json
{
  "node_type": "agent",
  "agent_id": "agent-123",
  "label": "Customer Classifier",
  "position_x": 200,
  "position_y": 150,
  "config": {
    "timeout": 30
  }
}
```

### Update Node

```bash
PUT /api/v1/pipelines/{id}/nodes/{node_id}
```

```json
{
  "label": "Updated Label",
  "position_x": 250,
  "position_y": 175
}
```

### Delete Node

```bash
DELETE /api/v1/pipelines/{id}/nodes/{node_id}
```

Also removes associated connections.

## Connection Operations

### Connection Model

```python
@db.model
class PipelineConnection:
    id: str
    pipeline_id: str
    source_node_id: str
    target_node_id: str
    source_handle: str
    target_handle: str
    condition: Optional[str]
    created_at: str
```

### Add Connection

```bash
POST /api/v1/pipelines/{id}/connections
```

```json
{
  "source_node_id": "node-1",
  "target_node_id": "node-2",
  "source_handle": "output",
  "target_handle": "input"
}
```

### Conditional Connection

For router patterns:

```json
{
  "source_node_id": "node-classifier",
  "target_node_id": "node-billing",
  "source_handle": "output",
  "target_handle": "input",
  "condition": "category == 'billing'"
}
```

### Delete Connection

```bash
DELETE /api/v1/pipelines/{id}/connections/{conn_id}
```

## Batch Operations

### Save Complete Graph

Save entire graph atomically:

```bash
PUT /api/v1/pipelines/{id}/graph
```

```json
{
  "nodes": [
    {
      "id": "input-1",
      "node_type": "input",
      "label": "Query",
      "position_x": 50,
      "position_y": 100
    },
    {
      "id": "agent-1",
      "node_type": "agent",
      "agent_id": "agent-classifier",
      "label": "Classify",
      "position_x": 200,
      "position_y": 100
    },
    {
      "id": "agent-2",
      "node_type": "agent",
      "agent_id": "agent-billing",
      "label": "Billing Agent",
      "position_x": 350,
      "position_y": 50
    },
    {
      "id": "agent-3",
      "node_type": "agent",
      "agent_id": "agent-support",
      "label": "Support Agent",
      "position_x": 350,
      "position_y": 150
    },
    {
      "id": "output-1",
      "node_type": "output",
      "label": "Response",
      "position_x": 500,
      "position_y": 100
    }
  ],
  "connections": [
    {
      "source_node_id": "input-1",
      "target_node_id": "agent-1",
      "source_handle": "output",
      "target_handle": "input"
    },
    {
      "source_node_id": "agent-1",
      "target_node_id": "agent-2",
      "source_handle": "output",
      "target_handle": "input",
      "condition": "category == 'billing'"
    },
    {
      "source_node_id": "agent-1",
      "target_node_id": "agent-3",
      "source_handle": "output",
      "target_handle": "input",
      "condition": "category == 'support'"
    },
    {
      "source_node_id": "agent-2",
      "target_node_id": "output-1",
      "source_handle": "output",
      "target_handle": "input"
    },
    {
      "source_node_id": "agent-3",
      "target_node_id": "output-1",
      "source_handle": "output",
      "target_handle": "input"
    }
  ]
}
```

## Validation

### Validate Graph

```bash
POST /api/v1/pipelines/{id}/validate
```

Checks:
- Has input node
- Has output node
- All nodes connected
- No orphan nodes
- No cycles (for non-cyclic patterns)
- Agent nodes have valid agent_id

Response:

```json
{
  "valid": false,
  "errors": [
    "Missing input node",
    "Node 'agent-3' has no incoming connections"
  ],
  "warnings": [
    "Output node has multiple incoming connections"
  ]
}
```

## Service Examples

```python
from studio.services.pipeline_service import PipelineService

service = PipelineService()

# Add multiple nodes
nodes = [
    {"node_type": "input", "label": "Start", "position_x": 0, "position_y": 0},
    {"node_type": "agent", "agent_id": "agent-1", "label": "Process", "position_x": 200, "position_y": 0},
    {"node_type": "output", "label": "End", "position_x": 400, "position_y": 0}
]

node_ids = []
for node in nodes:
    result = await service.add_node(pipeline_id, node)
    node_ids.append(result["id"])

# Connect them
await service.add_connection(pipeline_id, {
    "source_node_id": node_ids[0],
    "target_node_id": node_ids[1],
    "source_handle": "output",
    "target_handle": "input"
})

await service.add_connection(pipeline_id, {
    "source_node_id": node_ids[1],
    "target_node_id": node_ids[2],
    "source_handle": "output",
    "target_handle": "input"
})

# Validate
result = await service.validate(pipeline_id)
print(result["valid"])  # True
```

## Frontend Integration

React Flow uses this data format. Convert as needed:

```typescript
// Load pipeline
const { nodes, connections } = await api.get(`/pipelines/${id}`);

// Convert to React Flow format
const rfNodes = nodes.map(n => ({
  id: n.id,
  type: n.node_type,
  data: { label: n.label, agentId: n.agent_id },
  position: { x: n.position_x, y: n.position_y }
}));

const rfEdges = connections.map(c => ({
  id: c.id,
  source: c.source_node_id,
  target: c.target_node_id,
  sourceHandle: c.source_handle,
  targetHandle: c.target_handle,
  data: { condition: c.condition }
}));
```
