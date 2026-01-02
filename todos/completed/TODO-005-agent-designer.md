# TODO-005: Agent Designer

**Status**: PENDING
**Priority**: HIGH
**Estimated Effort**: 5 days (Week 5)
**Phase**: 2 - Agent Studio
**Pillar**: BUILD

---

## Objective

Implement the Agent Designer (BUILD pillar) enabling users to create agents via form-based UI with natural language instructions, signature definition, provider selection, and YAML preview.

---

## Acceptance Criteria

### Backend
- [ ] Agent CRUD with versioning (DataFlow)
- [ ] AgentVersion model for history
- [ ] YAML validation endpoint
- [ ] Agent to Kaizen code generation
- [ ] Provider management (API keys)

### Frontend
- [ ] Agent list page with filters
- [ ] Agent creation wizard
- [ ] Signature builder (inputs/outputs)
- [ ] Config panel (provider, strategy, permissions)
- [ ] YAML preview/editor
- [ ] Provider settings page

---

## Technical Approach

### DataFlow Models
```python
@db.model
class Agent:
    id: str
    organization_id: str
    workspace_id: str
    team_id: Optional[str]
    created_by: str
    name: str
    description: str
    agent_type: str  # base, rag, vision, etc.
    config_yaml: str
    current_version: str
    risk_level: str  # low, medium, high, critical
    status: str  # draft, active, deprecated

@db.model
class AgentVersion:
    id: str
    agent_id: str
    version: str
    config_yaml: str
    change_summary: str
    created_by: str
    is_current: bool
    security_scan_status: str
    security_scan_results: dict

@db.model
class Provider:
    id: str
    organization_id: str
    name: str
    provider_type: str  # openai, anthropic, azure, ollama
    api_key_encrypted: str
    is_default: bool
    models: dict  # Available models
```

### Agent Builder UI Components
- Basic Info Card: name, description, instructions, knowledge
- Model Selection: provider dropdown, model dropdown, temperature, max_tokens
- Signature Editor: dynamic input/output field builder
- Context Materials: file upload, paste content
- YAML Preview: live-updating code view

### Code Generation
Convert UI form to Kaizen agent code:
```python
def generate_agent_code(config: AgentConfig) -> str:
    return f'''
from kaizen import BaseAgent

class {config.class_name}(BaseAgent):
    """
    {config.description}
    """
    signature = """
    {config.instructions}

    Inputs:
    {format_inputs(config.inputs)}

    Outputs:
    {format_outputs(config.outputs)}
    """

    provider = "{config.provider}"
    model = "{config.model}"
    temperature = {config.temperature}
'''
```

---

## Dependencies

- TODO-004: Basic RBAC (permissions for agent creation)

---

## Risk Assessment

- **MEDIUM**: YAML syntax errors - Mitigation: Real-time validation with helpful error messages
- **MEDIUM**: Code generation edge cases - Mitigation: Comprehensive templates, thorough testing
- **LOW**: Provider API key security - Mitigation: Encrypt at rest, never return in responses

---

## Subtasks

### Day 1: Agent Backend
- [ ] Implement Agent DataFlow model (Est: 2h)
- [ ] Implement AgentVersion model (Est: 2h)
- [ ] Create Agent CRUD endpoints (Est: 3h)
- [ ] Add versioning logic (Est: 1h)

### Day 2: Provider Management
- [ ] Implement Provider DataFlow model (Est: 2h)
- [ ] Create Provider CRUD endpoints (Est: 2h)
- [ ] Add API key encryption (Est: 2h)
- [ ] Implement provider validation (test connection) (Est: 2h)

### Day 3: YAML & Code Generation
- [ ] Implement YAML validation endpoint (Est: 2h)
- [ ] Create agent code generation service (Est: 4h)
- [ ] Add template rendering for different agent types (Est: 2h)

### Day 4: Agent Builder Frontend
- [ ] Build agent list page (Est: 2h)
- [ ] Create agent builder wizard structure (Est: 2h)
- [ ] Build signature editor component (Est: 3h)
- [ ] Add context materials upload (Est: 1h)

### Day 5: Configuration & Preview
- [ ] Build provider/model selection UI (Est: 2h)
- [ ] Create YAML preview component (Est: 2h)
- [ ] Build provider settings page (Est: 2h)
- [ ] Integration testing (Est: 2h)

---

## Testing Requirements

### Tier 1: Unit Tests
- [ ] Agent validation logic
- [ ] YAML parsing and validation
- [ ] Code generation templates
- [ ] Signature schema validation

### Tier 2: Integration Tests
- [ ] Agent CRUD with real database
- [ ] Version history tracking
- [ ] Provider connection testing
- [ ] Code generation output

### Tier 3: E2E Tests
- [ ] Complete agent creation flow
- [ ] Agent editing and versioning
- [ ] Provider configuration
- [ ] YAML export/import

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (3-tier strategy)
- [ ] Agent creation in <5 minutes
- [ ] Valid Kaizen code generated from UI
- [ ] Provider API keys stored securely
- [ ] Code review completed

---

## Related Documentation

- [06-enterprise-saas-product.md](../../docs/implement/06-enterprise-saas-product.md) - Agent Builder specification
- [07-enterprise-dataflow-models.md](../../docs/implement/07-enterprise-dataflow-models.md) - Agent models
- [08-implementation-roadmap.md](../../docs/implement/08-implementation-roadmap.md) - Week 5 tasks
- [01-kaizen-capabilities.md](../../docs/implement/01-kaizen-capabilities.md) - Kaizen agent features
