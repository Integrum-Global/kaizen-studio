# TODO-007: Execution & Testing

**Status**: PENDING
**Priority**: HIGH
**Estimated Effort**: 5 days (Week 7)
**Phase**: 2 - Agent Studio
**Pillar**: ORCHESTRATE

---

## Objective

Implement the Test Panel for immediate agent and orchestration testing during design, with streaming output, execution history, and trace viewing.

---

## Acceptance Criteria

### Backend
- [ ] Agent test execution endpoint
- [ ] Orchestration execution endpoint
- [ ] Execution tracking with DataFlow
- [ ] WebSocket for streaming results
- [ ] Execution cost and latency tracking

### Frontend
- [ ] Test panel with 3 modes: Single Agent, Node in Context, Full Workflow
- [ ] Dynamic input form from signature
- [ ] Streaming output display
- [ ] Execution history list
- [ ] Trace viewer (step-by-step visualization)
- [ ] Cost and latency display

---

## Technical Approach

### DataFlow Models
```python
@db.model
class Execution:
    id: str
    organization_id: str
    workspace_id: str
    gateway_id: Optional[str]
    execution_type: str  # agent, orchestration, test
    agent_id: Optional[str]
    orchestration_id: Optional[str]
    version: str
    triggered_by: str
    trigger_type: str  # api, cli, mcp, test_panel
    input_data: dict
    output_data: dict
    status: str  # queued, running, completed, failed
    error_message: Optional[str]
    queued_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    execution_time_ms: int
    input_tokens: int
    output_tokens: int
    cost_usd: float
    trace_id: str

@db.model
class ExecutionStep:
    id: str
    execution_id: str
    agent_id: str
    step_number: int
    input_data: dict
    output_data: dict
    status: str
    started_at: str
    completed_at: Optional[str]
    execution_time_ms: int
    tokens_used: int
    cost_usd: float
```

### WebSocket Streaming
```python
@app.websocket("/ws/execution/{execution_id}")
async def execution_stream(websocket: WebSocket, execution_id: str):
    await websocket.accept()

    async for chunk in execute_agent_stream(execution_id):
        await websocket.send_json({
            "type": "chunk",
            "content": chunk.content,
            "tokens": chunk.tokens
        })

    await websocket.send_json({
        "type": "complete",
        "execution_id": execution_id
    })
```

### Test Panel Modes
1. **Single Agent**: Test one agent in isolation
2. **Node in Context**: Test agent with simulated upstream input
3. **Full Workflow**: Test entire orchestration end-to-end

---

## Dependencies

- TODO-006: Pipeline Canvas (orchestrations to test)

---

## Risk Assessment

- **MEDIUM**: WebSocket reliability - Mitigation: Reconnection logic, message acknowledgment
- **MEDIUM**: Test panel latency - Mitigation: Queue executions, show cached results
- **LOW**: Cost tracking accuracy - Mitigation: Use provider APIs for exact token counts

---

## Subtasks

### Day 1: Execution Backend
- [ ] Implement Execution DataFlow model (Est: 2h)
- [ ] Implement ExecutionStep model (Est: 2h)
- [ ] Create agent test execution endpoint (Est: 3h)
- [ ] Add execution status tracking (Est: 1h)

### Day 2: Streaming & Orchestration
- [ ] Implement WebSocket streaming (Est: 3h)
- [ ] Create orchestration execution endpoint (Est: 3h)
- [ ] Add step-by-step tracking (Est: 2h)

### Day 3: Cost & History
- [ ] Implement token counting (Est: 2h)
- [ ] Add cost calculation per provider (Est: 2h)
- [ ] Create execution history endpoint (Est: 2h)
- [ ] Add execution filtering and search (Est: 2h)

### Day 4: Test Panel Frontend
- [ ] Build test panel container with tabs (Est: 2h)
- [ ] Create dynamic input form from signature (Est: 3h)
- [ ] Implement streaming output display (Est: 2h)
- [ ] Add WebSocket connection handling (Est: 1h)

### Day 5: History & Traces
- [ ] Build execution history list (Est: 2h)
- [ ] Create trace viewer component (Est: 3h)
- [ ] Add cost/latency display (Est: 2h)
- [ ] Integration testing (Est: 1h)

---

## Testing Requirements

### Tier 1: Unit Tests
- [ ] Execution model validation
- [ ] Token counting logic
- [ ] Cost calculation accuracy
- [ ] WebSocket message formatting

### Tier 2: Integration Tests
- [ ] Agent execution with real Kaizen
- [ ] Orchestration execution end-to-end
- [ ] WebSocket streaming behavior
- [ ] Execution history queries

### Tier 3: E2E Tests
- [ ] Single agent test from UI
- [ ] Full workflow test with trace
- [ ] Execution history viewing
- [ ] Streaming output display

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (3-tier strategy)
- [ ] Test execution with streaming works
- [ ] Trace viewer shows step-by-step execution
- [ ] Cost and latency displayed accurately
- [ ] Code review completed

---

## Related Documentation

- [06-enterprise-saas-product.md](../../docs/implement/06-enterprise-saas-product.md) - Test Panel specification
- [07-enterprise-dataflow-models.md](../../docs/implement/07-enterprise-dataflow-models.md) - Execution models
- [08-implementation-roadmap.md](../../docs/implement/08-implementation-roadmap.md) - Week 7 tasks
