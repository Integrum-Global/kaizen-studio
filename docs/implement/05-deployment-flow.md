# One-Click Nexus Deployment

**Date**: 2025-11-22
**Purpose**: How the deploy button works

---

## Overview

The visual layer's "Deploy" button generates Nexus registration code and starts the deployment. Users get:

- **API endpoint**: `POST /workflows/{name}/execute`
- **MCP server**: For Claude Code integration
- **CLI command**: `nexus execute {name}`

All from one click.

---

## Nexus Capabilities

### What Nexus Provides
```python
from nexus import Nexus

app = Nexus(
    api_port=8000,
    mcp_port=3001,
    enable_auth=True,  # Auto-enabled in production
    rate_limit=100     # Requests per minute
)

# Single registration = all channels
app.register("my_agent", workflow.build())

# Start all channels
app.start()
```

This exposes:
- `POST http://localhost:8000/workflows/my_agent/execute`
- MCP server on port 3001
- CLI: `nexus execute my_agent`

### With Kaizen Agent
```python
from kaizen.integrations.nexus import deploy_multi_channel

# Even simpler
channels = deploy_multi_channel(agent, app, "my_agent")
# Returns: {"api": "...", "cli": "...", "mcp": "..."}
```

---

## Deployment Flow

### User Clicks "Deploy"

```
┌─────────────────┐
│  Deploy Button  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  1. Load Agent/Orch Config  │
│     from DataFlow           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  2. Build Kaizen Workflow   │
│     from YAML config        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  3. Create Nexus Instance   │
│     with user's settings    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  4. Register Workflow       │
│     app.register(name, wf)  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  5. Start Nexus             │
│     (background process)    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  6. Store Deployment Record │
│     in DataFlow             │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  7. Return URLs to User     │
│     API, MCP, CLI commands  │
└─────────────────────────────┘
```

---

## Generated Code

When user clicks Deploy, the backend generates and executes:

### For Agent Deployment
```python
from nexus import Nexus
from kailash.workflow.builder import WorkflowBuilder
from kaizen.core.base_agent import BaseAgent

# Configuration from visual layer
name = "customer_support"
config = yaml.safe_load(agent_record["config_yaml"])

# Build signature
class CustomerSupportSignature(Signature):
    inquiry: str = InputField(desc="Customer question")
    response: str = OutputField(desc="Agent response")

# Build agent workflow
workflow = WorkflowBuilder()
workflow.add_node("KaizenAgentNode", "agent", {
    "signature": CustomerSupportSignature,
    "config": {
        "llm_provider": config["provider"]["provider"],
        "model": config["provider"]["model"],
        "temperature": config["config"]["temperature"],
        "strategy_type": config["config"]["strategy"]
    }
})

# Create Nexus
app = Nexus(
    api_port=8001,
    mcp_port=3001,
    enable_auth=False,  # Or True with API key
    rate_limit=100
)

# Register
app.register(name, workflow.build())

# Start in background
import subprocess
subprocess.Popen(["python", "-m", "nexus.run", name])
```

### For Orchestration Deployment
```python
from nexus import Nexus
from kaizen.orchestration.pipeline import Pipeline
from kaizen.orchestration.runtime import OrchestrationRuntime

# Configuration from visual layer
name = "support_escalation"
config = yaml.safe_load(orch_record["config_yaml"])
agent_ids = orch_record["agent_ids"]["ids"]

# Load agents
agents = []
for agent_id in agent_ids:
    agent_record = await get_agent(agent_id)
    agent = build_agent_from_config(agent_record)
    agents.append(agent)

# Build pipeline based on pattern
pattern = config["pattern"]
if pattern == "supervisor_worker":
    pipeline = Pipeline.supervisor_worker(
        supervisor=agents[0],
        workers=agents[1:],
        routing_mode="semantic"
    )
elif pattern == "ensemble":
    pipeline = Pipeline.ensemble(
        agents=agents[:-1],
        synthesizer=agents[-1],
        discovery_mode="a2a"
    )
# ... more patterns

# Build workflow from pipeline
workflow = pipeline.to_workflow()

# Create and start Nexus
app = Nexus(api_port=8001, mcp_port=3001)
app.register(name, workflow.build())
app.start()
```

---

## Deployment Options

### Channel Selection
Users select which channels to enable:

```typescript
// Frontend
const DeployModal = () => (
  <Modal title="Deploy to Nexus">
    <Checkbox.Group
      options={[
        { label: 'API Endpoint', value: 'api' },
        { label: 'MCP Server (Claude)', value: 'mcp' },
        { label: 'CLI Command', value: 'cli' }
      ]}
      defaultValue={['api', 'mcp']}
    />

    <InputNumber label="API Port" defaultValue={8001} />
    <InputNumber label="MCP Port" defaultValue={3001} />
    <InputNumber label="Rate Limit (req/min)" defaultValue={100} />

    <Switch label="Enable Authentication" />
    {authEnabled && (
      <Input label="API Key" />
    )}

    <Button type="primary" onClick={deploy}>Deploy</Button>
  </Modal>
);
```

### Environment Configuration
```python
# Backend generates based on user selection
app = Nexus(
    api_port=user_settings["api_port"],
    mcp_port=user_settings["mcp_port"] if user_settings["enable_mcp"] else None,
    enable_auth=user_settings["enable_auth"],
    rate_limit=user_settings["rate_limit"]
)
```

---

## Deployment Management

### Storing Deployment State
```python
# Create deployment record
deployment = {
    "id": f"deploy-{uuid4()}",
    "organization_id": user.organization_id,
    "agent_id": agent_id,
    "orchestration_id": orchestration_id,
    "name": name,
    "channels": {
        "api": api_port,
        "mcp": mcp_port,
        "cli": True
    },
    "api_url": f"http://localhost:{api_port}/workflows/{name}/execute",
    "status": "running",
    "process_id": process.pid,
    "started_at": datetime.now().isoformat()
}
```

### Listing Deployments
```typescript
// Frontend
const DeploymentList = () => (
  <Table
    columns={[
      { title: 'Name', dataIndex: 'name' },
      { title: 'Status', dataIndex: 'status' },
      { title: 'API URL', dataIndex: 'api_url', render: url => <a href={url}>{url}</a> },
      { title: 'Started', dataIndex: 'started_at' },
      { title: 'Actions', render: (_, record) => (
        <>
          <Button onClick={() => openLogs(record.id)}>Logs</Button>
          <Button danger onClick={() => stop(record.id)}>Stop</Button>
        </>
      )}
    ]}
    dataSource={deployments}
  />
);
```

### Stopping Deployment
```python
@app.delete("/api/deployments/{id}")
async def stop_deployment(id: str):
    # Get deployment
    deployment = await get_deployment(id)

    # Kill process
    os.kill(deployment["process_id"], signal.SIGTERM)

    # Update status
    await update_deployment(id, {"status": "stopped"})

    return {"status": "stopped"}
```

---

## User Experience

### After Clicking Deploy

```typescript
const DeployResult = ({ result }) => (
  <Card title="Deployment Successful">
    <Alert
      type="success"
      message="Your agent is now live!"
    />

    <h4>API Endpoint</h4>
    <Input.Group compact>
      <Input value={result.api_url} readOnly style={{ width: '80%' }} />
      <Button onClick={() => copy(result.api_url)}>Copy</Button>
    </Input.Group>

    <h4>Example Request</h4>
    <SyntaxHighlighter language="bash">
      {`curl -X POST ${result.api_url} \\
  -H "Content-Type: application/json" \\
  -d '{"inquiry": "How do I reset my password?"}'`}
    </SyntaxHighlighter>

    <h4>MCP Server</h4>
    <p>Connect Claude Code:</p>
    <SyntaxHighlighter language="bash">
      {`claude --mcp-server localhost:${result.mcp_port}`}
    </SyntaxHighlighter>

    <h4>CLI Command</h4>
    <SyntaxHighlighter language="bash">
      {`nexus execute ${result.name} --input '{"inquiry": "..."}'`}
    </SyntaxHighlighter>
  </Card>
);
```

---

## Enterprise Deployment

### With Authentication
```python
app = Nexus(
    api_port=8001,
    enable_auth=True  # Requires API key
)

# Generate API key for user
api_key = generate_api_key()
store_api_key(user.id, api_key)

# User must include in requests
# curl -H "Authorization: Bearer {api_key}" ...
```

### With SSL/TLS
```python
# Nexus doesn't handle SSL directly
# Deploy behind nginx/traefik

# nginx.conf
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8001;
    }
}
```

### With Rate Limiting
```python
app = Nexus(
    rate_limit=1000,  # Requests per minute
    rate_limit_burst=100  # Burst allowance
)
```

### With Monitoring
```python
app = Nexus(
    enable_monitoring=True  # Expose /metrics endpoint
)

# Prometheus scrape config
# - job_name: 'nexus'
#   static_configs:
#     - targets: ['localhost:8001']
```

---

## Docker Deployment

For production, generate Docker Compose:

```yaml
# Generated docker-compose.yml
version: '3.8'

services:
  agent:
    image: kailash-studio:latest
    command: python -m nexus.run customer_support
    ports:
      - "8001:8001"
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/studio
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: studio
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### One-Click Docker Deploy
```typescript
const DockerDeployButton = ({ agentId }) => {
  const generateDocker = async () => {
    const res = await fetch(`/api/deploy/docker/${agentId}`);
    const { dockerCompose, dockerfile } = await res.json();

    // Download files
    downloadFile('docker-compose.yml', dockerCompose);
    downloadFile('Dockerfile', dockerfile);

    // Show instructions
    showModal({
      title: 'Docker Deployment Ready',
      content: (
        <div>
          <p>Files downloaded. Run:</p>
          <code>docker-compose up -d</code>
        </div>
      )
    });
  };

  return <Button onClick={generateDocker}>Generate Docker</Button>;
};
```

---

## Conclusion

The deploy button:
1. Loads agent/orchestration config from DataFlow
2. Builds Kaizen workflow from YAML
3. Creates Nexus instance with user settings
4. Registers and starts the workflow
5. Returns API/MCP/CLI access details

Users get multi-channel deployment with one click - no code required.
