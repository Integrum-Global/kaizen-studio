import type { HelpArticle } from "../types";

export const helpArticles: HelpArticle[] = [
  // Getting Started
  {
    id: "getting-started-first-agent",
    title: "Creating Your First Agent",
    category: "getting-started",
    keywords: [
      "agent",
      "create",
      "new",
      "first",
      "getting started",
      "tutorial",
    ],
    content: `# Creating Your First Agent

Welcome to Kaizen Studio! This guide will walk you through creating your first AI agent.

## What is an Agent?

An agent is an autonomous AI entity that can perform tasks, make decisions, and interact with external systems. In Kaizen Studio, agents are built using the Kaizen framework.

## Steps to Create an Agent

1. **Navigate to Agents**: Click on "Agents" in the main navigation
2. **Click "New Agent"**: This opens the agent designer
3. **Configure Basic Settings**:
   - **Name**: Give your agent a descriptive name
   - **Description**: Explain what your agent does
   - **Model**: Select the AI model (e.g., GPT-4, Claude)
4. **Add Tools**: Click "Add Tool" to give your agent capabilities
5. **Configure Prompts**: Set up system and user prompts
6. **Test**: Use the test panel to try your agent
7. **Save**: Click "Save" to store your agent

## Next Steps

Once you've created your first agent, you can:
- Add it to a pipeline
- Deploy it to production
- Monitor its performance in the analytics dashboard`,
  },
  {
    id: "getting-started-build-pipeline",
    title: "Building a Pipeline",
    category: "getting-started",
    keywords: ["pipeline", "build", "create", "workflow", "nodes", "canvas"],
    content: `# Building a Pipeline

Pipelines allow you to connect multiple agents and nodes into complex workflows.

## Pipeline Canvas

The pipeline canvas is a visual drag-and-drop interface for building workflows.

### Adding Nodes

1. Click the "+" button or drag from the node palette
2. Select a node type (Agent, Transform, API, etc.)
3. Place the node on the canvas

### Connecting Nodes

1. Click on a node's output port
2. Drag to another node's input port
3. The connection shows data flow direction

### Node Types

- **Agent Nodes**: Execute AI agents
- **Transform Nodes**: Modify data between steps
- **API Nodes**: Make external API calls
- **Conditional Nodes**: Branch based on conditions
- **Loop Nodes**: Repeat steps multiple times

## Testing Your Pipeline

1. Click "Test Run" in the toolbar
2. Provide test inputs in the panel
3. Watch execution in real-time
4. Review outputs and logs

## Saving and Deploying

- **Save**: Stores the pipeline configuration
- **Deploy**: Makes your pipeline available for production use`,
  },

  // Agents
  {
    id: "agents-configuration",
    title: "Agent Configuration",
    category: "agents",
    keywords: [
      "agent",
      "configure",
      "settings",
      "model",
      "temperature",
      "parameters",
    ],
    content: `# Agent Configuration

Learn how to configure agents for optimal performance.

## Model Selection

Choose the right AI model for your use case:

- **GPT-4**: Best for complex reasoning and long context
- **GPT-3.5**: Faster and more cost-effective
- **Claude**: Excellent for analysis and detailed responses
- **Ollama Models**: Self-hosted open-source options

## Parameters

### Temperature (0.0 - 2.0)
Controls randomness in responses:
- **0.0**: Deterministic, consistent outputs
- **0.7**: Balanced creativity and consistency
- **1.5+**: More creative and varied outputs

### Max Tokens
Maximum length of the response:
- Short answers: 256-512 tokens
- Medium responses: 1024-2048 tokens
- Long content: 4096+ tokens

### Top P (0.0 - 1.0)
Nucleus sampling parameter:
- **0.1**: Very focused responses
- **0.5**: Balanced
- **0.9**: More diverse

## System Prompts

System prompts define the agent's behavior:

\`\`\`
You are a helpful customer service agent.
Always be polite and professional.
If you don't know something, say so clearly.
\`\`\`

## Best Practices

1. Start with default settings
2. Test thoroughly before adjusting
3. Document any custom configurations
4. Monitor performance metrics`,
  },
  {
    id: "agents-tools",
    title: "Using Tools",
    category: "agents",
    keywords: ["tools", "functions", "capabilities", "integrations", "api"],
    content: `# Using Tools

Tools extend your agent's capabilities beyond text generation.

## Available Tools

### Web Search
Allows agents to search the internet for current information:
\`\`\`json
{
  "name": "web_search",
  "parameters": {
    "query": "latest AI developments"
  }
}
\`\`\`

### Database Query
Execute database queries:
\`\`\`json
{
  "name": "db_query",
  "parameters": {
    "query": "SELECT * FROM users WHERE active = true"
  }
}
\`\`\`

### API Call
Make HTTP requests:
\`\`\`json
{
  "name": "api_call",
  "parameters": {
    "url": "https://api.example.com/data",
    "method": "GET"
  }
}
\`\`\`

## Adding Tools to Agents

1. Open agent configuration
2. Navigate to "Tools" section
3. Click "Add Tool"
4. Select tool type
5. Configure parameters
6. Test the tool

## Tool Permissions

Tools can have different permission levels:
- **Read**: Can only fetch data
- **Write**: Can modify data
- **Execute**: Can run operations

Always use the principle of least privilege.

## Custom Tools

You can create custom tools using Python functions:

\`\`\`python
from kaizen import tool

@tool
def calculate_price(quantity: int, unit_price: float) -> float:
    """Calculate total price with discount."""
    total = quantity * unit_price
    if quantity > 10:
        total *= 0.9  # 10% discount
    return total
\`\`\``,
  },

  // Pipelines
  {
    id: "pipelines-node-types",
    title: "Node Types",
    category: "pipelines",
    keywords: [
      "nodes",
      "types",
      "agent",
      "transform",
      "api",
      "conditional",
      "loop",
    ],
    content: `# Node Types

Understanding different node types in pipeline canvas.

## Core Node Types

### 1. Agent Node
Executes an AI agent with inputs and returns outputs.

**Inputs:**
- Prompt or message
- Context data
- Previous outputs

**Outputs:**
- Agent response
- Metadata
- Tool call results

### 2. Transform Node
Modifies data between pipeline steps.

**Common Transforms:**
- JSON parsing
- String manipulation
- Data filtering
- Format conversion

### 3. API Node
Makes HTTP requests to external services.

**Configuration:**
- URL endpoint
- HTTP method (GET, POST, PUT, DELETE)
- Headers
- Request body

### 4. Conditional Node
Branches execution based on conditions.

**Example:**
\`\`\`javascript
if (score > 0.8) {
  // High confidence path
} else {
  // Low confidence path
}
\`\`\`

### 5. Loop Node
Repeats operations over collections.

**Use Cases:**
- Process array items
- Batch operations
- Retry logic

### 6. Merge Node
Combines outputs from multiple branches.

**Strategies:**
- Concatenate
- Union
- Intersection

## Best Practices

1. **Keep it Simple**: Start with basic nodes
2. **Test Each Step**: Verify outputs at each node
3. **Error Handling**: Add error paths for robustness
4. **Documentation**: Add descriptions to complex nodes`,
  },
  {
    id: "pipelines-connecting-nodes",
    title: "Connecting Nodes",
    category: "pipelines",
    keywords: ["connect", "nodes", "links", "data flow", "ports", "edges"],
    content: `# Connecting Nodes

Learn how to connect nodes and manage data flow.

## Connection Basics

### Output Ports
Each node has output ports that emit data:
- **Primary Output**: Main result of the node
- **Secondary Outputs**: Additional data or metadata
- **Error Output**: Error information if node fails

### Input Ports
Nodes accept data through input ports:
- **Required Inputs**: Must be connected
- **Optional Inputs**: Provide defaults if not connected
- **Multiple Inputs**: Can accept data from multiple sources

## Creating Connections

1. **Click and Drag**: Click output port, drag to input port
2. **Auto-connect**: Double-click compatible ports
3. **Context Menu**: Right-click for connection options

## Connection Types

### Data Connections
Transfer data between nodes:
\`\`\`
NodeA.output -> NodeB.input
\`\`\`

### Control Connections
Determine execution order:
\`\`\`
NodeA.complete -> NodeB.trigger
\`\`\`

## Data Mapping

Map specific fields between nodes:

\`\`\`json
{
  "from": "agent_response.result",
  "to": "transform_input.data"
}
\`\`\`

## Validation

The canvas validates connections:
- ✅ **Type Compatibility**: Matching data types
- ✅ **Required Inputs**: All required inputs connected
- ❌ **Circular Dependencies**: No infinite loops
- ❌ **Type Mismatch**: Incompatible data types

## Tips

1. **Color Coding**: Connections are colored by data type
2. **Hover Info**: Hover over connections to see data preview
3. **Bulk Connect**: Select multiple nodes to connect at once
4. **Reconnect**: Drag connection end to change target`,
  },

  // Deployments
  {
    id: "deployments-production",
    title: "Deploying to Production",
    category: "deployments",
    keywords: ["deploy", "production", "environment", "release", "publish"],
    content: `# Deploying to Production

Deploy your agents and pipelines to production environments.

## Pre-Deployment Checklist

Before deploying, ensure:
- ✅ All tests pass
- ✅ Performance benchmarks met
- ✅ Security review completed
- ✅ Documentation updated
- ✅ Error handling tested
- ✅ Monitoring configured

## Deployment Steps

### 1. Select Environment
Choose your target environment:
- **Development**: For testing
- **Staging**: Pre-production validation
- **Production**: Live environment

### 2. Configure Deployment

Set deployment parameters:
\`\`\`json
{
  "environment": "production",
  "replicas": 3,
  "resources": {
    "cpu": "1000m",
    "memory": "2Gi"
  }
}
\`\`\`

### 3. Review Changes
View deployment diff:
- Configuration changes
- Code updates
- Dependency changes

### 4. Deploy
Click "Deploy" to start:
1. Building artifacts
2. Running tests
3. Deploying to environment
4. Health checks
5. Traffic switching

## Monitoring

After deployment, monitor:
- **Health**: Service health status
- **Metrics**: Response time, error rate
- **Logs**: Application logs
- **Alerts**: Automated alerts for issues

## Rollback

If issues occur:
1. Click "Rollback" button
2. Select previous version
3. Confirm rollback
4. Monitor recovery

## Best Practices

1. **Blue-Green Deployments**: Deploy to new environment first
2. **Canary Releases**: Gradual traffic shift
3. **Automated Tests**: Run tests before deployment
4. **Monitoring**: Set up alerts before deploying`,
  },

  // Admin
  {
    id: "admin-user-management",
    title: "User Management",
    category: "admin",
    keywords: ["users", "teams", "permissions", "roles", "access", "admin"],
    content: `# User Management

Manage users, teams, and permissions in Kaizen Studio.

## User Roles

### Admin
Full access to all features:
- Create/delete users
- Manage permissions
- Access all workspaces
- Configure system settings

### Developer
Create and manage agents/pipelines:
- Create agents and pipelines
- Deploy to development/staging
- View analytics
- Cannot manage users

### Viewer
Read-only access:
- View agents and pipelines
- View analytics
- Cannot modify anything

## Adding Users

1. Navigate to Admin → Users
2. Click "Add User"
3. Enter details:
   - Email address
   - Full name
   - Role
4. Send invitation

## Team Management

### Creating Teams
1. Go to Admin → Teams
2. Click "New Team"
3. Add team members
4. Set team permissions

### Team Permissions
Control what teams can access:
- Workspaces
- Agents
- Pipelines
- Deployments

## Access Control

### Workspace-Level
Control access per workspace:
\`\`\`json
{
  "workspace": "production",
  "permissions": {
    "read": ["team-a", "team-b"],
    "write": ["team-a"],
    "deploy": ["team-a"]
  }
}
\`\`\`

### Resource-Level
Fine-grained control per resource:
- Agent-specific permissions
- Pipeline-specific permissions

## Best Practices

1. **Least Privilege**: Grant minimum required permissions
2. **Regular Audits**: Review permissions quarterly
3. **Team Structure**: Organize by project/department
4. **Offboarding**: Revoke access immediately when users leave`,
  },

  // Troubleshooting
  {
    id: "troubleshooting-common-errors",
    title: "Common Errors",
    category: "troubleshooting",
    keywords: [
      "errors",
      "troubleshooting",
      "debugging",
      "issues",
      "problems",
      "fixes",
    ],
    content: `# Common Errors

Solutions to frequently encountered errors.

## Agent Errors

### "Model Not Available"
**Cause**: Selected model is not accessible or quota exceeded.

**Solution**:
1. Check API key validity
2. Verify model availability in your region
3. Check quota limits
4. Try alternative model

### "Timeout Error"
**Cause**: Agent execution exceeded time limit.

**Solution**:
1. Increase timeout setting
2. Optimize prompts for faster responses
3. Use streaming for long responses
4. Check network connectivity

## Pipeline Errors

### "Circular Dependency Detected"
**Cause**: Nodes form an infinite loop.

**Solution**:
1. Review node connections
2. Remove circular references
3. Use conditional logic to break cycles

### "Type Mismatch"
**Cause**: Incompatible data types between nodes.

**Solution**:
1. Add transform node between incompatible types
2. Check node output types
3. Validate input requirements

## Deployment Errors

### "Health Check Failed"
**Cause**: Deployed service not responding correctly.

**Solution**:
1. Check service logs
2. Verify environment variables
3. Test endpoints manually
4. Review resource allocation

### "Build Failed"
**Cause**: Error during deployment build process.

**Solution**:
1. Review build logs
2. Check dependencies
3. Verify configuration files
4. Test locally first

## API Errors

### "Authentication Failed"
**Cause**: Invalid or expired API key.

**Solution**:
1. Regenerate API key
2. Check key permissions
3. Verify key is properly set in headers

### "Rate Limit Exceeded"
**Cause**: Too many requests in time window.

**Solution**:
1. Implement backoff strategy
2. Increase rate limit (if available)
3. Optimize request frequency
4. Use caching

## Getting More Help

If you can't resolve the issue:
1. Check system status page
2. Review documentation
3. Contact support with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Logs`,
  },
  {
    id: "troubleshooting-performance",
    title: "Performance Issues",
    category: "troubleshooting",
    keywords: ["performance", "slow", "optimization", "latency", "speed"],
    content: `# Performance Issues

Diagnose and fix performance problems.

## Slow Agent Responses

### Check Response Times
Monitor agent execution metrics:
- Average response time
- P95/P99 latency
- Timeout rate

### Optimization Strategies

1. **Use Faster Models**
   - GPT-3.5 vs GPT-4
   - Smaller context windows
   - Streaming responses

2. **Optimize Prompts**
   - Reduce prompt length
   - Be more specific
   - Remove unnecessary context

3. **Enable Caching**
   - Cache common responses
   - Reuse context when possible

## Slow Pipeline Execution

### Identify Bottlenecks
Use pipeline analytics:
- Per-node execution time
- Waiting time between nodes
- Resource utilization

### Optimization Techniques

1. **Parallel Execution**
   - Run independent nodes concurrently
   - Use parallel branches

2. **Batch Processing**
   - Group similar operations
   - Process in bulk when possible

3. **Resource Allocation**
   - Increase CPU/memory limits
   - Use faster instance types

## Database Performance

### Slow Queries
Optimize database operations:
- Add indexes
- Limit result sets
- Use pagination
- Cache frequent queries

### Connection Pooling
Configure connection pool:
\`\`\`json
{
  "pool_size": 10,
  "max_overflow": 20,
  "timeout": 30
}
\`\`\`

## Network Issues

### High Latency
Reduce network latency:
- Use regional deployments
- Enable CDN
- Compress responses
- Use HTTP/2

## Monitoring

Set up monitoring for:
- Response times
- Error rates
- Resource usage
- Queue depths

### Alert Thresholds
Configure alerts:
- Response time > 5s
- Error rate > 1%
- CPU usage > 80%
- Memory usage > 90%`,
  },
];
