# Test Panel

## Overview

The Test Panel enables immediate testing of agents and pipelines during development, allowing rapid iteration and validation.

## Test Execution Model

```python
@db.model
class TestExecution:
    id: str
    organization_id: str
    agent_id: Optional[str]
    pipeline_id: Optional[str]
    input_data: str
    output_data: Optional[str]
    status: str
    execution_time_ms: Optional[int]
    token_usage: Optional[str]
    error_message: Optional[str]
    created_by: str
    created_at: str
```

## Test Modes

### 1. Single Agent Test

Test an individual agent with sample input.

```bash
POST /api/v1/test/agents/{id}
```

```json
{
  "input": {
    "message": "What are your business hours?"
  },
  "options": {
    "timeout_ms": 30000
  }
}
```

### 2. Pipeline Test

Test an entire orchestration pipeline.

```bash
POST /api/v1/test/pipelines/{id}
```

```json
{
  "input": {
    "query": "I need help with billing"
  },
  "options": {
    "timeout_ms": 60000
  }
}
```

### 3. Node Test

Test a single node within a pipeline context.

```bash
POST /api/v1/test/pipelines/{id}/nodes/{node_id}
```

```json
{
  "input": {
    "category": "billing"
  }
}
```

## Response Format

All test endpoints return:

```json
{
  "id": "exec-123",
  "status": "completed",
  "output": {
    "response": "Our business hours are 9 AM to 5 PM, Monday through Friday."
  },
  "execution_time_ms": 450,
  "token_usage": {
    "input": 15,
    "output": 32,
    "total": 47
  }
}
```

## Execution Status

| Status | Description |
|--------|-------------|
| `pending` | Test queued |
| `running` | Currently executing |
| `completed` | Successfully finished |
| `failed` | Error occurred |

## API Endpoints

### Run Agent Test

```bash
POST /api/v1/test/agents/{id}
```

### Get Agent Test History

```bash
GET /api/v1/test/agents/{id}/history?limit=20
```

### Run Pipeline Test

```bash
POST /api/v1/test/pipelines/{id}
```

### Get Pipeline Test History

```bash
GET /api/v1/test/pipelines/{id}/history?limit=20
```

### Run Node Test

```bash
POST /api/v1/test/pipelines/{id}/nodes/{node_id}
```

### Get Execution Result

```bash
GET /api/v1/test/executions/{id}
```

### Delete Execution

```bash
DELETE /api/v1/test/executions/{id}
```

## Service Operations

```python
from studio.services.test_service import TestService

test = TestService()

# Test agent
result = await test.run_agent_test(
    agent_id="agent-123",
    input_data={"message": "Hello"},
    user_id="user-456"
)

# Test pipeline
result = await test.run_pipeline_test(
    pipeline_id="pipe-789",
    input_data={"query": "Help me"},
    user_id="user-456"
)

# Test single node
result = await test.run_node_test(
    pipeline_id="pipe-789",
    node_id="node-classifier",
    input_data={"text": "billing issue"},
    user_id="user-456"
)

# Get history
history = await test.list_executions(
    organization_id=org_id,
    agent_id="agent-123",
    limit=20
)

# Get specific execution
execution = await test.get_execution("exec-123")

# Delete execution
await test.delete_execution("exec-123")
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout_ms` | int | 30000 | Max execution time |
| `stream` | bool | false | Stream output (future) |

## Error Handling

Failed tests include error details:

```json
{
  "id": "exec-456",
  "status": "failed",
  "error_message": "Agent timeout after 30000ms",
  "execution_time_ms": 30000
}
```

## Best Practices

1. **Test before deploy** - Always validate in test panel
2. **Use realistic inputs** - Test with production-like data
3. **Check token usage** - Monitor costs before scaling
4. **Review history** - Compare results across changes
5. **Clean up** - Delete old test executions
6. **Test edge cases** - Try error scenarios
