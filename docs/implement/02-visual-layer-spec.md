# Visual Layer Specification

**Date**: 2025-11-22
**Purpose**: React component specifications for Kaizen Studio

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Visual Layer (React)                  │
├─────────────────────────────────────────────────┤
│  Agent Designer → generates Signature + Config  │
│  Pipeline Canvas → generates Pipeline code      │
│  Runtime Dashboard → displays OrchestrationRuntime │
│  Deploy Button → calls Nexus.register()         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│     Kaizen + Nexus + DataFlow (Python)          │
│  (Already 100% production-ready)                │
└─────────────────────────────────────────────────┘
```

---

## 1. Agent Designer

### Purpose
Visual form that generates Kaizen Signature and BaseAgent configuration.

### Components

#### SignatureBuilder
```typescript
interface SignatureBuilderProps {
  onSignatureChange: (signature: SignatureConfig) => void;
}

interface SignatureConfig {
  systemPrompt: string;
  inputs: FieldConfig[];
  outputs: FieldConfig[];
}

interface FieldConfig {
  name: string;
  type: 'string' | 'int' | 'float' | 'bool' | 'enum' | 'array' | 'object';
  description: string;
  required: boolean;
  enumValues?: string[];
  default?: any;
}

const SignatureBuilder = ({ onSignatureChange }: SignatureBuilderProps) => {
  return (
    <div>
      {/* System Prompt */}
      <MonacoEditor
        language="markdown"
        placeholder="You are a helpful assistant..."
        onChange={setSystemPrompt}
      />

      {/* Input Fields */}
      <FieldList
        title="Inputs"
        fields={inputs}
        onAdd={addInput}
        onRemove={removeInput}
        onChange={updateInput}
      />

      {/* Output Fields */}
      <FieldList
        title="Outputs"
        fields={outputs}
        onAdd={addOutput}
        onRemove={removeOutput}
        onChange={updateOutput}
      />
    </div>
  );
};
```

#### AgentConfigPanel
```typescript
interface AgentConfigPanelProps {
  onConfigChange: (config: AgentConfig) => void;
}

interface AgentConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  strategy: Strategy;
  budgetLimitUsd: number;
  permissions: PermissionConfig;
  memory: MemoryConfig;
}

const AgentConfigPanel = ({ onConfigChange }: AgentConfigPanelProps) => {
  return (
    <Tabs>
      <Tab key="llm" title="LLM Settings">
        <Select label="Provider" options={providers} />
        <Select label="Model" options={models} />
        <Slider label="Temperature" min={0} max={2} step={0.1} />
        <InputNumber label="Max Tokens" min={1} max={128000} />
      </Tab>

      <Tab key="strategy" title="Strategy">
        <Select
          label="Strategy"
          options={[
            { value: 'single_shot', label: 'Single Shot' },
            { value: 'chain_of_thought', label: 'Chain of Thought' },
            { value: 'react', label: 'ReAct (Tools)' },
            { value: 'self_reflection', label: 'Self Reflection' },
          ]}
        />
      </Tab>

      <Tab key="permissions" title="Permissions">
        <Select label="Mode" options={permissionModes} />
        <InputNumber label="Budget Limit (USD)" min={0} />
        <Checkbox.Group label="Allowed Tools" options={tools} />
      </Tab>

      <Tab key="memory" title="Memory">
        <Switch label="Enable Memory" />
        <Select label="Memory Type" options={memoryTypes} />
        <InputNumber label="Max Turns" />
      </Tab>
    </Tabs>
  );
};
```

#### YAMLPreview
```typescript
const YAMLPreview = ({ signature, config }: Props) => {
  const yaml = generateYAML(signature, config);

  return (
    <Card title="Generated Configuration">
      <MonacoEditor
        language="yaml"
        value={yaml}
        options={{ readOnly: true }}
      />
      <Button onClick={() => copyToClipboard(yaml)}>Copy YAML</Button>
    </Card>
  );
};
```

---

## 2. Pipeline Canvas

### Purpose
Drag-drop canvas for creating multi-agent orchestrations using 9 patterns.

### Components

#### PatternSelector
```typescript
const patterns = [
  {
    id: 'sequential',
    name: 'Sequential',
    icon: <ArrowRight />,
    description: 'Linear execution, each agent receives previous output',
    minAgents: 2,
    maxAgents: 10,
  },
  {
    id: 'supervisor_worker',
    name: 'Supervisor-Worker',
    icon: <Team />,
    description: 'Supervisor delegates to workers via A2A routing',
    minAgents: 2,
    maxAgents: 20,
  },
  {
    id: 'router',
    name: 'Router',
    icon: <Branch />,
    description: 'Intelligent routing based on input classification',
    minAgents: 2,
    maxAgents: 10,
  },
  {
    id: 'ensemble',
    name: 'Ensemble',
    icon: <Users />,
    description: 'Multiple experts + synthesizer',
    minAgents: 3,
    maxAgents: 10,
  },
  {
    id: 'consensus',
    name: 'Consensus',
    icon: <Vote />,
    description: 'Democratic voting among agents',
    minAgents: 3,
    maxAgents: 10,
  },
  {
    id: 'debate',
    name: 'Debate',
    icon: <Debate />,
    description: 'Adversarial analysis with judge',
    minAgents: 3,
    maxAgents: 5,
  },
  {
    id: 'handoff',
    name: 'Handoff',
    icon: <Escalate />,
    description: 'Tier escalation (L1 → L2 → L3)',
    minAgents: 2,
    maxAgents: 5,
  },
  {
    id: 'blackboard',
    name: 'Blackboard',
    icon: <Board />,
    description: 'Iterative collaboration on shared state',
    minAgents: 2,
    maxAgents: 10,
  },
  {
    id: 'parallel',
    name: 'Parallel',
    icon: <Parallel />,
    description: 'Concurrent execution, aggregate results',
    minAgents: 2,
    maxAgents: 20,
  },
];

const PatternSelector = ({ onSelect }: Props) => (
  <div className="pattern-grid">
    {patterns.map(p => (
      <PatternCard key={p.id} pattern={p} onClick={() => onSelect(p)} />
    ))}
  </div>
);
```

#### OrchestrationCanvas
```typescript
import ReactFlow, { Node, Edge, Controls, Background } from 'reactflow';

const OrchestrationCanvas = ({ pattern, agents }: Props) => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  // Generate initial layout based on pattern
  useEffect(() => {
    const layout = generatePatternLayout(pattern, agents);
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [pattern, agents]);

  return (
    <div style={{ height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

const nodeTypes = {
  agent: AgentNode,
  supervisor: SupervisorNode,
  router: RouterNode,
  synthesizer: SynthesizerNode,
};
```

#### AgentNode (React Flow Custom Node)
```typescript
const AgentNode = ({ data }: NodeProps) => (
  <div className={`agent-node ${data.role}`}>
    <Handle type="target" position={Position.Top} />

    <div className="agent-header">
      <Avatar icon={<Robot />} />
      <span>{data.agent.name}</span>
    </div>

    <div className="agent-meta">
      <Tag>{data.role}</Tag>
      <Tag>{data.agent.strategy}</Tag>
    </div>

    <Handle type="source" position={Position.Bottom} />
  </div>
);
```

---

## 3. Runtime Dashboard

### Purpose
Monitor OrchestrationRuntime and AgentRegistry in real-time.

### Components

#### RuntimeStatus
```typescript
const RuntimeStatus = ({ runtimeId }: Props) => {
  const { data: status } = useQuery(['runtime', runtimeId], fetchRuntimeStatus);

  return (
    <Card title="Runtime Status">
      <Statistic title="Active Agents" value={status.activeAgents} />
      <Statistic title="Pending Tasks" value={status.pendingTasks} />
      <Statistic title="Healthy" value={status.healthyCount} suffix={`/ ${status.totalAgents}`} />
    </Card>
  );
};
```

#### AgentHealthGrid
```typescript
const AgentHealthGrid = ({ agents }: Props) => (
  <div className="agent-grid">
    {agents.map(agent => (
      <AgentHealthCard
        key={agent.id}
        name={agent.name}
        status={agent.status}  // ACTIVE, DEGRADED, UNHEALTHY, OFFLINE
        lastHeartbeat={agent.lastHeartbeat}
        circuitBreakerState={agent.circuitBreakerState}
        budgetUsed={agent.budgetUsed}
        budgetLimit={agent.budgetLimit}
      />
    ))}
  </div>
);
```

#### BudgetChart
```typescript
const BudgetChart = ({ agents }: Props) => (
  <Card title="Budget Usage">
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={agents}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="budgetUsed" fill="#1890ff" />
        <Bar dataKey="budgetLimit" fill="#f0f0f0" />
      </BarChart>
    </ResponsiveContainer>
  </Card>
);
```

#### CircuitBreakerPanel
```typescript
const CircuitBreakerPanel = ({ agents }: Props) => (
  <Table
    columns={[
      { title: 'Agent', dataIndex: 'name' },
      { title: 'State', dataIndex: 'state', render: s => <Tag color={stateColors[s]}>{s}</Tag> },
      { title: 'Error Rate', dataIndex: 'errorRate', render: r => `${(r * 100).toFixed(1)}%` },
      { title: 'Last Failure', dataIndex: 'lastFailure' },
    ]}
    dataSource={agents}
  />
);
```

---

## 4. API Key Manager

### Purpose
Configure LLM provider API keys per user/organization.

### Components

#### ProviderList
```typescript
const ProviderList = ({ providers }: Props) => (
  <div>
    {providers.map(p => (
      <ProviderCard
        key={p.id}
        name={p.name}
        provider={p.provider}  // openai, anthropic, etc.
        model={p.defaultModel}
        budgetUsed={p.currentSpend}
        budgetLimit={p.budgetLimit}
        isDefault={p.isDefault}
        onSetDefault={() => setDefault(p.id)}
        onDelete={() => deleteProvider(p.id)}
      />
    ))}
    <Button type="dashed" onClick={showAddModal}>+ Add Provider</Button>
  </div>
);
```

#### AddProviderModal
```typescript
const AddProviderModal = ({ visible, onClose }: Props) => {
  const [provider, setProvider] = useState('openai');

  return (
    <Modal title="Add LLM Provider" visible={visible} onCancel={onClose}>
      <Form>
        <Select
          label="Provider"
          value={provider}
          onChange={setProvider}
          options={[
            { value: 'openai', label: 'OpenAI' },
            { value: 'anthropic', label: 'Anthropic' },
            { value: 'azure', label: 'Azure OpenAI' },
            { value: 'google', label: 'Google Vertex AI' },
            { value: 'ollama', label: 'Ollama (Local)' },
          ]}
        />

        <Input.Password label="API Key" />

        {provider === 'azure' && (
          <>
            <Input label="Endpoint URL" />
            <Input label="API Version" />
          </>
        )}

        <InputNumber label="Budget Limit (USD/month)" />

        <Button onClick={validateKey}>Test Connection</Button>
        <Button type="primary" onClick={saveProvider}>Save</Button>
      </Form>
    </Modal>
  );
};
```

---

## 5. Deploy Button

### Purpose
One-click deployment to Nexus (API + CLI + MCP).

### Component

```typescript
const DeployButton = ({ agentId, orchestrationId }: Props) => {
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<DeployResult | null>(null);

  const deploy = async () => {
    setDeploying(true);
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        body: JSON.stringify({
          agentId,
          orchestrationId,
          channels: ['api', 'mcp'],  // User-selected
        }),
      });
      setResult(await res.json());
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div>
      <Button
        type="primary"
        size="large"
        loading={deploying}
        onClick={deploy}
      >
        Deploy to Nexus
      </Button>

      {result && (
        <Card title="Deployment Successful">
          <p>API: <a href={result.apiUrl}>{result.apiUrl}</a></p>
          <p>MCP: <code>{result.mcpCommand}</code></p>
          <p>CLI: <code>nexus execute {result.name}</code></p>
        </Card>
      )}
    </div>
  );
};
```

---

## 6. Observability Console

### Purpose
View traces, metrics, logs, and audit trails.

### Components

#### TraceViewer
```typescript
const TraceViewer = ({ traceId }: Props) => {
  const { data: trace } = useQuery(['trace', traceId], fetchTrace);

  return (
    <Timeline>
      {trace.spans.map(span => (
        <Timeline.Item
          key={span.id}
          color={span.status === 'error' ? 'red' : 'blue'}
        >
          <p><strong>{span.operationName}</strong></p>
          <p>Duration: {span.duration}ms</p>
          <p>Agent: {span.agentId}</p>
          {span.error && <Alert type="error" message={span.error} />}
        </Timeline.Item>
      ))}
    </Timeline>
  );
};
```

#### MetricsDashboard
```typescript
const MetricsDashboard = () => (
  <div className="metrics-grid">
    <Card title="Request Rate">
      <LineChart data={requestRateData} />
    </Card>
    <Card title="Latency (p50/p95/p99)">
      <LineChart data={latencyData} />
    </Card>
    <Card title="Token Usage">
      <AreaChart data={tokenData} />
    </Card>
    <Card title="Cost">
      <BarChart data={costData} />
    </Card>
  </div>
);
```

#### AuditTrailBrowser
```typescript
const AuditTrailBrowser = () => (
  <Table
    columns={[
      { title: 'Timestamp', dataIndex: 'timestamp' },
      { title: 'User', dataIndex: 'userId' },
      { title: 'Action', dataIndex: 'action' },
      { title: 'Resource', dataIndex: 'resource' },
      { title: 'Details', dataIndex: 'details' },
    ]}
    dataSource={auditLogs}
    pagination={{ pageSize: 50 }}
  />
);
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Language | TypeScript 5.3 |
| Styling | Ant Design 5.x |
| Canvas | React Flow 11.x |
| Code Editor | Monaco Editor |
| Charts | Recharts |
| State | Zustand |
| Routing | React Router 6 |
| API | Axios + React Query |

---

## Timeline

| Week | Component | Effort |
|------|-----------|--------|
| 1-2 | Agent Designer (SignatureBuilder, ConfigPanel, YAML) | 40h |
| 3-4 | Pipeline Canvas (PatternSelector, Canvas, Nodes) | 40h |
| 5-6 | Runtime Dashboard (Status, Health, Budgets) | 30h |
| 7 | API Key Manager + Deploy Button | 20h |
| 8 | Observability Console + Polish | 30h |

**Total**: ~160 hours (4 weeks full-time, 8 weeks part-time)
