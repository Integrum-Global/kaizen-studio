# External Agents User Guide

## Introduction

External Agents allow you to integrate third-party webhook platforms (Microsoft Teams, Discord, Slack, Telegram, Notion) with your Kaizen Studio workflows. This guide will walk you through registering, managing, and monitoring external agents.

## Accessing External Agents

1. Navigate to **Settings** → **External Agents** from the main navigation
2. You'll see a list of all registered external agents
3. Click **Register External Agent** to add a new integration

## Registering an External Agent

The registration process uses a 6-step wizard:

### Step 1: Provider Selection

Choose your integration platform:

- **Microsoft Teams**: Send messages to Teams channels
- **Discord**: Post to Discord channels via webhooks
- **Slack**: Send notifications to Slack channels
- **Telegram**: Message Telegram chats via bot API
- **Notion**: Create entries in Notion databases

**Tip**: Each provider has different configuration requirements in later steps.

### Step 2: Basic Information

Provide details about your agent:

- **Name** (required): Descriptive name (minimum 3 characters)
- **Description** (optional): Purpose and usage notes
- **Tags** (optional): Categorize agents for organization

**Example**:
- Name: "Production Alerts to Teams"
- Description: "Sends critical production alerts to #alerts channel"
- Tags: "production", "monitoring", "alerts"

### Step 3: Authentication Configuration

Configure how to authenticate with the external platform:

**API Key** (recommended for most platforms):
- API Key: Your platform's API key or token
- Header Name: HTTP header name (default: "X-API-Key")

**OAuth2** (for platforms requiring OAuth):
- Client ID: OAuth application client ID
- Client Secret: OAuth application secret
- Token URL: OAuth token endpoint URL

**Custom** (for advanced use cases):
- JSON configuration object for custom auth schemes

**Security Note**: Credentials are encrypted at rest and masked in the UI.

### Step 4: Platform Configuration

Provide platform-specific settings:

**Microsoft Teams**:
- Tenant ID: Azure AD tenant identifier (UUID format)
- Channel ID: Teams channel ID (format: `19:xxxxxx@thread.tacv2`)

**Discord**:
- Webhook URL: Discord webhook endpoint
- Username (optional): Display name for webhook bot

**Slack**:
- Webhook URL: Slack incoming webhook endpoint
- Channel: Target channel (e.g., `#general`)

**Telegram**:
- Bot Token: Telegram bot API token
- Chat ID: Target chat identifier

**Notion**:
- Integration Token: Notion integration secret
- Database ID: Target database UUID

**Tip**: Refer to each platform's documentation for obtaining these values.

### Step 5: Governance Settings (Optional)

Set budget limits and rate limits to control usage:

**Budget Limits**:
- Max Cost Per Invocation: Maximum cost per single invocation (USD)
- Max Monthly Cost: Total monthly budget cap (USD)

**Rate Limits**:
- Requests Per Minute: Maximum invocations per minute
- Requests Per Hour: Maximum invocations per hour
- Requests Per Day: Maximum invocations per day

**Example**: For a production notification agent:
- Max Monthly Cost: $100
- Requests Per Minute: 10
- Requests Per Hour: 100
- Requests Per Day: 1000

**Note**: Leave blank for unlimited usage.

### Step 6: Review and Submit

Review all configuration before submitting:

- Verify provider selection
- Check authentication details (credentials are masked)
- Confirm platform configuration
- Review governance limits

Click **Edit Step X** to make changes, or **Submit** to register the agent.

## Viewing Agent Details

Click any agent in the list to open the details modal with 4 tabs:

### Overview Tab

Displays agent metadata:
- Provider and status
- Created date and last invocation time
- Tags
- Authentication type
- Platform configuration (secrets masked)

### Invocations Tab

View invocation history:
- Timestamp and status (pending, success, failed)
- Execution time and response code
- Cost per invocation
- Expandable rows showing request/response payloads

**Actions**:
- Click row to expand and view details
- Filter by status (coming soon)
- Export invocation logs (coming soon)

### Lineage Tab

Interactive lineage graph showing:
- Workflow → External Agent → Webhook flow
- External agent nodes with **purple borders**
- Platform icons for easy identification
- Click nodes for more details

**Controls**:
- Zoom: Mouse wheel or + / - buttons
- Pan: Click and drag
- Fit View: Reset to see all nodes
- Minimap: Navigate large graphs

### Governance Tab

Monitor compliance and usage:

**Budget Usage Widget**:
- Current month cost vs budget limit
- Percentage used (color-coded)
- **Warning**: Red when >90% used
- **Notice**: Yellow when 80-90% used

**Rate Limit Status Widget**:
- Three gauges: Per-minute, per-hour, per-day
- Remaining invocations
- Color indicators:
  - Green: < 80% used (healthy)
  - Yellow: 80-95% used (approaching limit)
  - Red: > 95% used (limit exceeded)

**Policy Evaluations Table**:
- Recent ABAC policy decisions
- Policy name and allow/deny decision
- Timestamp

**Real-Time Updates**: Governance metrics auto-refresh every 30 seconds.

## Managing Agents

### Filtering and Searching

Use the filters at the top of the page:

- **Search**: Filter by agent name
- **Status**: Show only Active, Inactive, or Deleted agents

### Agent Actions

Click the **⋮** menu on each row for:

- **View Details**: Open details modal
- **Delete**: Permanently remove agent

**Note**: Deleted agents can be filtered in/out but are soft-deleted (retained for audit).

## Governance Enforcement

When governance limits are exceeded:

1. **Budget Exceeded** (402 error):
   - Invocation is blocked
   - Error message: "Budget exceeded"
   - Budget widget shows red warning

2. **Rate Limit Exceeded** (429 error):
   - Invocation is throttled
   - Error message: "Rate limit exceeded"
   - Rate limit gauge shows red indicator

3. **Policy Denied** (403 error):
   - ABAC policy blocked invocation
   - Error message from policy
   - Policy evaluation appears in Governance tab

## Best Practices

### Naming Conventions

Use descriptive names that indicate:
- Purpose: "Production Alerts"
- Destination: "to Teams #alerts"
- Environment: "[PROD]" prefix

Example: "[PROD] Production Alerts to Teams #alerts"

### Tags for Organization

Use tags to categorize:
- Environment: `production`, `staging`, `dev`
- Purpose: `alerts`, `notifications`, `logs`
- Team: `platform`, `frontend`, `backend`

### Security

- **Rotate credentials** regularly (recommended: every 90 days)
- **Use unique tokens** per agent (don't share across agents)
- **Set governance limits** to prevent runaway costs
- **Monitor invocations** for unusual patterns

### Governance Limits

Set appropriate limits based on:
- **Production agents**: Higher limits (e.g., 100 req/min)
- **Test agents**: Lower limits (e.g., 10 req/min)
- **Cost-sensitive**: Set monthly budget caps

## Troubleshooting

### Registration Fails

**Symptom**: "Failed to register external agent" error

**Solutions**:
1. Verify authentication credentials are correct
2. Check platform configuration (UUIDs, URLs)
3. Ensure webhook endpoint is accessible
4. Review backend logs for detailed error

### Invocations Failing

**Symptom**: Invocations show "failed" status

**Solutions**:
1. Check Invocations tab for error messages
2. Verify webhook endpoint is still valid
3. Ensure credentials haven't expired
4. Check platform-specific rate limits
5. Review Governance tab for policy denials

### Lineage Not Showing

**Symptom**: Lineage tab shows "No lineage data"

**Solutions**:
1. Agent must be invoked at least once
2. Wait a few seconds for lineage to generate
3. Refresh the page
4. Check backend lineage service is running

### Governance Metrics Not Updating

**Symptom**: Budget/rate limit values don't change

**Solutions**:
1. Wait 30 seconds (auto-refresh interval)
2. Close and reopen details modal
3. Check if invocations are actually occurring
4. Verify backend governance service is running

## Keyboard Shortcuts

- **Tab**: Navigate between elements
- **Enter/Space**: Activate buttons/select options
- **Escape**: Close modals/cancel operations
- **Arrow Keys**: Navigate tabs within modals

## Accessibility

The External Agents UI is fully accessible:

- **Screen Readers**: Full support for NVDA, JAWS, VoiceOver
- **Keyboard Navigation**: All features accessible without mouse
- **High Contrast**: Works with system high contrast modes
- **Color Blindness**: Color is not the only indicator (icons + text)

## Getting Help

For additional support:

1. Check backend API logs for detailed errors
2. Review webhook platform documentation
3. Contact platform support team
4. File a bug report with error details

## Changelog

**v1.0.0** (Initial Release):
- 6-step registration wizard
- Support for 5 platforms (Teams, Discord, Slack, Telegram, Notion)
- Invocation history tracking
- Lineage visualization
- Governance enforcement (budget + rate limits)
- Real-time metrics dashboard
