# TODO-006: Pipeline Canvas

**Status**: PENDING
**Priority**: HIGH
**Estimated Effort**: 5 days (Week 6)
**Phase**: 2 - Agent Studio
**Pillar**: ORCHESTRATE

---

## Objective

Implement the Visual Orchestration Canvas using React Flow for creating multi-agent pipelines with 9 orchestration patterns, custom nodes, and parameter mapping.

---

## Acceptance Criteria

### Backend
- [ ] Orchestration CRUD with DataFlow
- [ ] Pattern-specific configuration validation
- [ ] Orchestration to Pipeline code generation
- [ ] Agent-to-agent connection validation

### Frontend
- [ ] Pattern selector with visual previews
- [ ] React Flow canvas
- [ ] Custom agent nodes
- [ ] Custom connector nodes
- [ ] Connection visualization with parameter mapping
- [ ] Orchestration properties panel
- [ ] Node palette (drag & drop)
- [ ] MiniMap and controls

---

## Technical Approach

### DataFlow Models
```python
@db.model
class Orchestration:
    id: str
    organization_id: str
    workspace_id: str
    team_id: Optional[str]
    created_by: str
    name: str
    description: str
    pattern: str  # sequential, supervisor_worker, router, parallel, ensemble, debate
    config_yaml: str
    agent_ids: dict  # ["agent-1", "agent-2"]
    current_version: str
    status: str  # draft, active, deployed
```

### React Flow Components
```typescript
// Custom Node Types
const nodeTypes = {
  agent: AgentNode,
  connector: ConnectorNode,
  input: InputNode,
  output: OutputNode,
  router: RouterNode,
  merger: MergerNode,
};

// Agent Node
const AgentNode = ({ data }) => (
  <div className="agent-node">
    <Handle type="target" position={Position.Top} />
    <div className="node-header">
      <RobotOutlined />
      <span>{data.name}</span>
    </div>
    <div className="node-body">
      <Tag color="blue">{data.pattern}</Tag>
      <span>{data.model}</span>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);
```

### 9 Orchestration Patterns
1. **Sequential**: A -> B -> C
2. **Supervisor-Worker**: Supervisor delegates to workers
3. **Router**: Route to best-fit agent based on input
4. **Parallel**: Concurrent execution, merge results
5. **Ensemble**: Multiple agents vote on output
6. **Debate**: Pro/Con with Judge
7. **MapReduce**: Split, process in parallel, reduce
8. **Hierarchical**: Multi-level delegation
9. **Blackboard**: Shared context agents contribute to

### Code Generation
Convert canvas to Kaizen Pipeline code:
```python
def generate_pipeline_code(orchestration: Orchestration) -> str:
    pattern_template = PATTERN_TEMPLATES[orchestration.pattern]
    return pattern_template.render(
        name=orchestration.name,
        agents=orchestration.agents,
        connections=orchestration.connections
    )
```

---

## Dependencies

- TODO-005: Agent Designer (agents to orchestrate)

---

## Risk Assessment

- **MEDIUM**: React Flow performance with many nodes - Mitigation: Virtualization, memoization, lazy loading
- **MEDIUM**: Complex pattern configurations - Mitigation: Pre-built templates for each pattern
- **LOW**: Connection validation complexity - Mitigation: Strict schema, clear error messages

---

## Subtasks

### Day 1: Orchestration Backend
- [ ] Implement Orchestration DataFlow model (Est: 2h)
- [ ] Create Orchestration CRUD endpoints (Est: 3h)
- [ ] Add pattern validation logic (Est: 2h)
- [ ] Implement connection validation (Est: 1h)

### Day 2: Code Generation
- [ ] Create pipeline code generation service (Est: 4h)
- [ ] Implement templates for all 9 patterns (Est: 4h)

### Day 3: React Flow Setup
- [ ] Set up React Flow with TypeScript (Est: 2h)
- [ ] Create custom AgentNode component (Est: 2h)
- [ ] Create custom ConnectorNode component (Est: 2h)
- [ ] Add Input/Output nodes (Est: 2h)

### Day 4: Canvas Features
- [ ] Implement node palette with drag & drop (Est: 2h)
- [ ] Add connection drawing with validation (Est: 2h)
- [ ] Create properties panel for node editing (Est: 3h)
- [ ] Add MiniMap and controls (Est: 1h)

### Day 5: Pattern Integration
- [ ] Build pattern selector with previews (Est: 2h)
- [ ] Implement parameter mapping UI (Est: 3h)
- [ ] Add save/load orchestration (Est: 2h)
- [ ] Integration testing (Est: 1h)

---

## Testing Requirements

### Tier 1: Unit Tests
- [ ] Orchestration validation logic
- [ ] Pattern configuration validation
- [ ] Code generation for each pattern
- [ ] Connection validation rules

### Tier 2: Integration Tests
- [ ] Orchestration CRUD with real database
- [ ] Code generation output compilation
- [ ] Pattern application to nodes
- [ ] Agent assignment validation

### Tier 3: E2E Tests
- [ ] Complete orchestration creation flow
- [ ] Drag & drop agent placement
- [ ] Connection drawing and validation
- [ ] Pattern switching

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (3-tier strategy)
- [ ] All 9 pipeline patterns working
- [ ] Valid Kaizen code generated from canvas
- [ ] React Flow performance acceptable (<100 nodes smooth)
- [ ] Code review completed

---

## Related Documentation

- [06-enterprise-saas-product.md](../../docs/implement/06-enterprise-saas-product.md) - Orchestration Canvas specification
- [07-enterprise-dataflow-models.md](../../docs/implement/07-enterprise-dataflow-models.md) - Orchestration model
- [08-implementation-roadmap.md](../../docs/implement/08-implementation-roadmap.md) - Week 6 tasks
- [01-kaizen-capabilities.md](../../docs/implement/01-kaizen-capabilities.md) - 9 pipeline patterns
