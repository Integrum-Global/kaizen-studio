# Business User Flow Guide

**Role**: Developer
**Primary Focus**: Building AI agents, creating pipelines, and deploying solutions
**Permissions**: agents:*, deployments:*, pipelines:read, connectors:read/execute

---

## Overview

Business users (Developers) are responsible for creating and deploying AI solutions. They design agents, build pipelines, configure connectors, and manage deployments. This guide walks through the complete journey from login to production deployment.

---

## Flow 1: Initial Login and Workspace Setup

### Step 1.1: Login to Platform

**User Action**: Navigate to login page and enter credentials

**Frontend Route**: `/login`

**API Endpoint**: `POST /api/v1/auth/login`

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jack@integrum.global",
    "password": "your-password"
  }'
```

**Expected Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "jack@integrum.global",
    "name": "Jack",
    "organization_id": "org-uuid",
    "role": "developer"
  },
  "access_token": "eyJhbGciOiJ...",
  "refresh_token": "eyJhbGciOiJ...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Frontend Behavior**:
- Store tokens in localStorage
- Redirect to `/dashboard`
- Display user name in header

---

### Step 1.2: View Dashboard

**User Action**: After login, view the main dashboard

**Frontend Route**: `/dashboard`

**API Endpoints Called**:
1. `GET /api/v1/auth/me` - Get current user info
2. `GET /api/v1/agents` - List recent agents
3. `GET /api/v1/metrics/summary` - Get activity metrics

**Expected Dashboard Elements**:
- Welcome message with user name
- Quick stats (agents count, deployments, executions)
- Recent activity feed
- Quick actions (Create Agent, Create Pipeline)

---

## Flow 2: Creating an AI Agent

### Step 2.1: Navigate to Agent Designer

**User Action**: Click "Agents" in sidebar, then "Create Agent"

**Frontend Route**: `/agents` → `/agents/new`

**API Endpoint**: `GET /api/v1/agents`

```bash
curl -X GET http://localhost:8000/api/v1/agents \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "records": [],
  "total": 0
}
```

---

### Step 2.2: Create New Agent

**User Action**: Fill agent creation form with name, type, model, and system prompt

**Frontend Route**: `/agents/new` or dialog on `/agents`

**API Endpoint**: `POST /api/v1/agents`

```bash
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-uuid",
    "name": "Customer Support Agent",
    "agent_type": "chat",
    "model_id": "gpt-4",
    "description": "AI agent for handling customer inquiries",
    "system_prompt": "You are a helpful customer support agent for Integrum Global. Be professional, empathetic, and solution-oriented.",
    "temperature": 0.7,
    "max_tokens": 1000
  }'
```

**Expected Response**:
```json
{
  "id": "agent-uuid",
  "workspace_id": "workspace-uuid",
  "name": "Customer Support Agent",
  "agent_type": "chat",
  "model_id": "gpt-4",
  "description": "AI agent for handling customer inquiries",
  "status": "draft",
  "version": 1,
  "created_at": "2025-12-17T10:00:00Z"
}
```

**Frontend Behavior**:
- Show success toast notification
- Redirect to agent detail page `/agents/{agent-id}`
- Display agent configuration

---

### Step 2.3: Add Context to Agent

**User Action**: Add knowledge base context for the agent

**Frontend Route**: `/agents/{agent-id}` (Contexts tab)

**API Endpoint**: `POST /api/v1/agents/{agent_id}/contexts`

```bash
curl -X POST http://localhost:8000/api/v1/agents/$AGENT_ID/contexts \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Knowledge Base",
    "content_type": "text",
    "content": "Integrum Global offers AI solutions including Kaizen Studio for enterprise AI management, Kailash SDK for workflow automation, and DataFlow for database operations.",
    "is_active": true
  }'
```

**Expected Response**:
```json
{
  "id": "context-uuid",
  "agent_id": "agent-uuid",
  "name": "Product Knowledge Base",
  "content_type": "text",
  "is_active": true,
  "created_at": "2025-12-17T10:05:00Z"
}
```

---

### Step 2.4: Add Tools to Agent

**User Action**: Enable tools for the agent to use

**Frontend Route**: `/agents/{agent-id}` (Tools tab)

**API Endpoint**: `POST /api/v1/agents/{agent_id}/tools`

```bash
curl -X POST http://localhost:8000/api/v1/agents/$AGENT_ID/tools \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search_knowledge_base",
    "description": "Search the product knowledge base for relevant information",
    "tool_type": "builtin",
    "config": {
      "max_results": 5
    },
    "is_active": true
  }'
```

**Expected Response**:
```json
{
  "id": "tool-uuid",
  "agent_id": "agent-uuid",
  "name": "search_knowledge_base",
  "tool_type": "builtin",
  "is_active": true,
  "created_at": "2025-12-17T10:10:00Z"
}
```

---

### Step 2.5: Test the Agent

**User Action**: Test the agent with sample input

**Frontend Route**: `/agents/{agent-id}` (Test panel)

**API Endpoint**: `POST /api/v1/test/agents/{agent_id}`

```bash
curl -X POST http://localhost:8000/api/v1/test/agents/$AGENT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "message": "What products does Integrum Global offer?"
    },
    "options": {
      "timeout": 30
    }
  }'
```

**Expected Response**:
```json
{
  "execution_id": "exec-uuid",
  "status": "completed",
  "output": {
    "response": "Integrum Global offers several AI solutions: Kaizen Studio for enterprise AI management, Kailash SDK for workflow automation, and DataFlow for database operations."
  },
  "metrics": {
    "duration_ms": 1250,
    "tokens_used": 150
  }
}
```

**Frontend Behavior**:
- Show loading spinner during execution
- Display response in chat-like interface
- Show execution metrics (duration, tokens)

---

### Step 2.6: Create Agent Version

**User Action**: Save current configuration as a version

**Frontend Route**: `/agents/{agent-id}` (Versions tab)

**API Endpoint**: `POST /api/v1/agents/{agent_id}/versions`

```bash
curl -X POST http://localhost:8000/api/v1/agents/$AGENT_ID/versions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "changelog": "Initial version with customer support capabilities"
  }'
```

**Expected Response**:
```json
{
  "id": "version-uuid",
  "agent_id": "agent-uuid",
  "version_number": 1,
  "changelog": "Initial version with customer support capabilities",
  "created_at": "2025-12-17T10:15:00Z"
}
```

---

## Flow 3: Creating a Pipeline

### Step 3.1: Navigate to Pipelines

**User Action**: Click "Pipelines" in sidebar

**Frontend Route**: `/pipelines`

**API Endpoint**: `GET /api/v1/pipelines`

```bash
curl -X GET http://localhost:8000/api/v1/pipelines \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### Step 3.2: Create New Pipeline

**User Action**: Click "Create Pipeline" and configure

**Frontend Route**: `/pipelines/new`

**API Endpoint**: `POST /api/v1/pipelines`

```bash
curl -X POST http://localhost:8000/api/v1/pipelines \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-uuid",
    "name": "Customer Inquiry Pipeline",
    "description": "Process customer inquiries through classification and response",
    "pattern": "sequential"
  }'
```

**Expected Response**:
```json
{
  "id": "pipeline-uuid",
  "name": "Customer Inquiry Pipeline",
  "pattern": "sequential",
  "status": "draft",
  "created_at": "2025-12-17T10:20:00Z"
}
```

---

### Step 3.3: Add Pipeline Nodes

**User Action**: Drag nodes from palette onto canvas

**Frontend Route**: `/pipelines/{pipeline-id}` (Canvas editor)

**API Endpoint**: `POST /api/v1/pipelines/{pipeline_id}/nodes`

```bash
# Add input node
curl -X POST http://localhost:8000/api/v1/pipelines/$PIPELINE_ID/nodes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "input",
    "name": "Customer Message",
    "config": {
      "schema": {
        "message": "string",
        "customer_id": "string"
      }
    },
    "position": {"x": 100, "y": 100}
  }'

# Add agent node
curl -X POST http://localhost:8000/api/v1/pipelines/$PIPELINE_ID/nodes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "agent",
    "name": "Support Agent",
    "config": {
      "agent_id": "agent-uuid"
    },
    "position": {"x": 300, "y": 100}
  }'

# Add output node
curl -X POST http://localhost:8000/api/v1/pipelines/$PIPELINE_ID/nodes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "output",
    "name": "Response",
    "config": {},
    "position": {"x": 500, "y": 100}
  }'
```

---

### Step 3.4: Connect Pipeline Nodes

**User Action**: Draw connections between nodes on canvas

**API Endpoint**: `POST /api/v1/pipelines/{pipeline_id}/connections`

```bash
# Connect input to agent
curl -X POST http://localhost:8000/api/v1/pipelines/$PIPELINE_ID/connections \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_node_id": "input-node-uuid",
    "source_port": "output",
    "target_node_id": "agent-node-uuid",
    "target_port": "input"
  }'

# Connect agent to output
curl -X POST http://localhost:8000/api/v1/pipelines/$PIPELINE_ID/connections \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_node_id": "agent-node-uuid",
    "source_port": "output",
    "target_node_id": "output-node-uuid",
    "target_port": "input"
  }'
```

---

### Step 3.5: Validate Pipeline

**User Action**: Click "Validate" button

**API Endpoint**: `POST /api/v1/pipelines/{pipeline_id}/validate`

```bash
curl -X POST http://localhost:8000/api/v1/pipelines/$PIPELINE_ID/validate \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

---

### Step 3.6: Test Pipeline

**User Action**: Run test execution

**API Endpoint**: `POST /api/v1/test/pipelines/{pipeline_id}`

```bash
curl -X POST http://localhost:8000/api/v1/test/pipelines/$PIPELINE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "message": "How do I reset my password?",
      "customer_id": "cust-123"
    }
  }'
```

**Expected Response**:
```json
{
  "execution_id": "exec-uuid",
  "status": "completed",
  "output": {
    "response": "To reset your password, please visit..."
  },
  "node_results": [
    {"node_id": "input-uuid", "status": "completed"},
    {"node_id": "agent-uuid", "status": "completed"},
    {"node_id": "output-uuid", "status": "completed"}
  ],
  "metrics": {
    "duration_ms": 2100,
    "tokens_used": 200
  }
}
```

---

## Flow 4: Deploying to Production

### Step 4.1: View Available Gateways

**User Action**: Navigate to Deployments section

**Frontend Route**: `/deployments`

**API Endpoint**: `GET /api/v1/gateways`

```bash
curl -X GET http://localhost:8000/api/v1/gateways \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### Step 4.2: Create Deployment

**User Action**: Click "Deploy" on pipeline or agent

**Frontend Route**: `/deployments/new`

**API Endpoint**: `POST /api/v1/deployments`

```bash
curl -X POST http://localhost:8000/api/v1/deployments \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Production",
    "workspace_id": "workspace-uuid",
    "environment": "production",
    "resource_type": "agent",
    "resource_id": "agent-uuid",
    "gateway_id": "gateway-uuid",
    "config": {
      "replicas": 2,
      "auto_scale": true
    }
  }'
```

**Expected Response**:
```json
{
  "id": "deployment-uuid",
  "name": "Customer Support Production",
  "status": "deploying",
  "environment": "production",
  "created_at": "2025-12-17T10:30:00Z"
}
```

---

### Step 4.3: Monitor Deployment

**User Action**: View deployment status and logs

**Frontend Route**: `/deployments/{deployment-id}`

**API Endpoints**:
1. `GET /api/v1/deployments/{deployment_id}` - Get status
2. `GET /api/v1/deployments/{deployment_id}/logs` - Get logs

```bash
# Get deployment status
curl -X GET http://localhost:8000/api/v1/deployments/$DEPLOYMENT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Get deployment logs
curl -X GET http://localhost:8000/api/v1/deployments/$DEPLOYMENT_ID/logs \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Flow 5: Using Connectors

### Step 5.1: View Available Connectors

**User Action**: Navigate to Connectors

**Frontend Route**: `/connectors`

**API Endpoint**: `GET /api/v1/connectors/types`

```bash
curl -X GET http://localhost:8000/api/v1/connectors/types \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "types": [
    {"id": "postgresql", "name": "PostgreSQL", "category": "database"},
    {"id": "mongodb", "name": "MongoDB", "category": "database"},
    {"id": "redis", "name": "Redis", "category": "cache"},
    {"id": "http_api", "name": "HTTP API", "category": "api"}
  ]
}
```

---

### Step 5.2: Test Connector Connection

**User Action**: Test database connectivity

**API Endpoint**: `POST /api/v1/connectors/{connector_id}/test`

```bash
curl -X POST http://localhost:8000/api/v1/connectors/$CONNECTOR_ID/test \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Connected to PostgreSQL 15.1",
  "latency_ms": 42
}
```

---

### Step 5.3: Attach Connector to Agent

**User Action**: Configure agent to use connector

**API Endpoint**: `POST /api/v1/connectors/{connector_id}/attach`

```bash
curl -X POST http://localhost:8000/api/v1/connectors/$CONNECTOR_ID/attach \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent-uuid"
  }'
```

---

## Flow 6: Viewing Metrics

### Step 6.1: View Agent Metrics

**User Action**: Check agent performance

**Frontend Route**: `/metrics`

**API Endpoint**: `GET /api/v1/metrics/agents/{agent_id}`

```bash
curl -X GET http://localhost:8000/api/v1/metrics/agents/$AGENT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "agent_id": "agent-uuid",
  "period": "24h",
  "metrics": {
    "total_executions": 1250,
    "avg_duration_ms": 850,
    "total_tokens": 45000,
    "error_rate": 0.02,
    "success_rate": 0.98
  }
}
```

---

## Flow 7: Creating API Keys

### Step 7.1: View Available Scopes

**Frontend Route**: `/settings/api-keys`

**API Endpoint**: `GET /api/v1/api-keys/scopes`

```bash
curl -X GET http://localhost:8000/api/v1/api-keys/scopes \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### Step 7.2: Create API Key

**User Action**: Create key for external integration

**API Endpoint**: `POST /api/v1/api-keys`

```bash
curl -X POST http://localhost:8000/api/v1/api-keys \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Integration Key",
    "scopes": ["agents:execute", "pipelines:execute"],
    "expires_at": "2026-12-31T23:59:59Z"
  }'
```

**Expected Response**:
```json
{
  "id": "key-uuid",
  "name": "Production Integration Key",
  "key": "ks_live_abc123...",
  "scopes": ["agents:execute", "pipelines:execute"],
  "created_at": "2025-12-17T10:45:00Z"
}
```

**Note**: The full API key is only shown once at creation time.

---

## Summary: Business User API Endpoints

| Flow | Action | Endpoint |
|------|--------|----------|
| Login | Authenticate | `POST /api/v1/auth/login` |
| Dashboard | View stats | `GET /api/v1/metrics/summary` |
| Agents | List | `GET /api/v1/agents` |
| Agents | Create | `POST /api/v1/agents` |
| Agents | Add context | `POST /api/v1/agents/{id}/contexts` |
| Agents | Add tool | `POST /api/v1/agents/{id}/tools` |
| Agents | Test | `POST /api/v1/test/agents/{id}` |
| Agents | Version | `POST /api/v1/agents/{id}/versions` |
| Pipelines | List | `GET /api/v1/pipelines` |
| Pipelines | Create | `POST /api/v1/pipelines` |
| Pipelines | Add node | `POST /api/v1/pipelines/{id}/nodes` |
| Pipelines | Connect | `POST /api/v1/pipelines/{id}/connections` |
| Pipelines | Validate | `POST /api/v1/pipelines/{id}/validate` |
| Pipelines | Test | `POST /api/v1/test/pipelines/{id}` |
| Deployments | Create | `POST /api/v1/deployments` |
| Deployments | View | `GET /api/v1/deployments/{id}` |
| Connectors | List types | `GET /api/v1/connectors/types` |
| Connectors | Test | `POST /api/v1/connectors/{id}/test` |
| Metrics | Agent stats | `GET /api/v1/metrics/agents/{id}` |
| API Keys | Create | `POST /api/v1/api-keys` |

---

## Frontend Routes Summary

| Route | Page | Purpose |
|-------|------|---------|
| `/login` | LoginPage | User authentication |
| `/dashboard` | Dashboard | Main landing page |
| `/agents` | AgentsListPage | List all agents |
| `/agents/:id` | AgentDetailPage | Agent editor |
| `/pipelines` | PipelinesListPage | List all pipelines |
| `/pipelines/:id` | PipelineEditorPage | Pipeline canvas |
| `/deployments` | DeploymentsPage | Deployment management |
| `/connectors` | ConnectorsPage | Connector management |
| `/metrics` | MetricsPage | Analytics dashboard |
| `/settings/api-keys` | APIKeysPage | API key management |

---

*Document Version: 1.0*
*Last Updated: 2025-12-17*
*Author: Kaizen Studio Team*
