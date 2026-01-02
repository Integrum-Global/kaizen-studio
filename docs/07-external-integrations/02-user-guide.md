# External Agents User Guide

**Version**: 1.0.0
**Last Updated**: 2025-12-20
**For**: End Users, Team Leads, Product Managers

---

## Introduction

External Agents allow you to integrate Microsoft Copilot, Discord bots, Slack apps, and other external AI systems into your Kaizen workflows. Instead of building everything from scratch, you can leverage existing tools your team already uses.

### What You Can Do

- **Notify Teams**: Send Microsoft Teams messages when workflows complete
- **Log to Notion**: Create database entries with workflow results
- **Discord Alerts**: Post formatted alerts to Discord channels
- **Slack Updates**: Send Block Kit messages to Slack
- **Telegram Bots**: Deliver messages via Telegram bot API

### Why Use External Agents?

1. **Reuse Existing Tools**: Your team already uses Teams, Discord, or Slack
2. **Cost Control**: Set budgets and rate limits to prevent runaway costs
3. **Full Traceability**: Track every invocation from user to system to agent
4. **Easy Setup**: Registration wizard walks you through configuration

---

## Quick Start: Your First External Agent

### Step 1: Navigate to External Agents

1. Log in to Kaizen Studio
2. Click **"Gateways"** in the left navigation
3. Click **"External Agents"** tab

### Step 2: Register Your Agent

Click **"Register External Agent"** button to start the wizard.

#### **Screen 1: Basic Information**

Fill in these fields:

- **Agent Name**: A friendly name (e.g., "Team Notifications")
- **Description**: What this agent does (e.g., "Sends workflow updates to Teams")
- **Platform**: Select your platform:
  - `Microsoft Copilot` - Microsoft Copilot Studio agents
  - `Discord` - Discord webhooks
  - `Slack` - Slack incoming webhooks
  - `Telegram` - Telegram bot API
  - `Notion` - Notion database integration
  - `Custom HTTP` - Any REST API endpoint

Click **"Next"** to continue.

#### **Screen 2: Platform Configuration**

Configuration depends on your platform:

**For Microsoft Teams:**
```json
{
  "webhook_url": "https://outlook.webhook.office.com/webhookb2/.../IncomingWebhook/...",
  "studio_base_url": "https://kaizen.studio"
}
```

**For Discord:**
```json
{
  "webhook_url": "https://discord.com/api/webhooks/123/abc",
  "username": "Kaizen Studio",
  "avatar_url": "https://kaizen.studio/logo.png"
}
```

**For Slack:**
```json
{
  "webhook_url": "https://hooks.slack.com/services/ABC/DEF/GHI",
  "studio_base_url": "https://kaizen.studio"
}
```

**For Telegram:**
```json
{
  "bot_token": "123456789:ABCdefGhIjklmnopqrstuvwxyz12345",
  "chat_id": "-1001234567890",
  "studio_base_url": "https://kaizen.studio"
}
```

**For Notion:**
```json
{
  "database_id": "abc123def456"
}
```

Click **"Next"** to continue.

#### **Screen 3: Authentication**

Configure how Kaizen authenticates to your external system:

**API Key** (most common):
```json
{
  "auth_type": "api_key",
  "credentials": {
    "api_key": "your-api-key-here"
  }
}
```

**OAuth2 / Bearer Token**:
```json
{
  "auth_type": "oauth2",
  "credentials": {
    "token": "your-bearer-token"
  }
}
```

**No Authentication** (for webhook URLs with embedded secrets):
```json
{
  "auth_type": "none",
  "credentials": {}
}
```

> **Security Note**: All credentials are encrypted at rest. Only authorized users can view them.

Click **"Next"** to continue.

#### **Screen 4: Governance Settings**

Set cost and usage limits to protect your budget:

**Budget Limits**:
- **Monthly Budget (USD)**: Maximum spend per month (e.g., $100)
- **Daily Budget (USD)**: Maximum spend per day (e.g., $10)
- **Cost Per Execution**: Estimated cost per invocation (e.g., $0.05)

**Execution Limits**:
- **Monthly Execution Limit**: Maximum invocations per month (e.g., 1000)
- **Daily Execution Limit**: Maximum invocations per day (e.g., 100)

**Rate Limits**:
- **Requests Per Minute**: How many invocations per minute (e.g., 10)
- **Requests Per Hour**: How many invocations per hour (e.g., 100)
- **Requests Per Day**: How many invocations per day (e.g., 500)

**Recommended Starting Values**:
- Monthly Budget: $100
- Daily Budget: $10
- Requests Per Minute: 10
- Cost Per Execution: $0.05 (adjust based on platform)

Click **"Register Agent"** to complete setup.

### Step 3: Test Your Agent

After registration, you'll see your new agent in the list. Click **"Test"** to send a test invocation:

1. Click the **"Test"** button next to your agent
2. Review the test message payload
3. Click **"Send Test"**
4. Check your external system (Teams channel, Discord server, etc.) for the message

**Success**: You should see a formatted message arrive within seconds.

**Failed?** See [Troubleshooting](#troubleshooting) below.

---

## Use Cases

### Use Case 1: Microsoft Teams Notifications

**Scenario**: Send Adaptive Cards to Teams when workflows complete.

**Setup**:
1. In Microsoft Teams, go to your channel → **"Connectors"** → **"Incoming Webhook"**
2. Name it "Kaizen Workflow Updates"
3. Copy the webhook URL
4. In Kaizen Studio, register External Agent:
   - Platform: `Microsoft Copilot`
   - Webhook URL: Paste the webhook URL
   - Auth Type: `none` (webhook URL has embedded auth)

**Result**: Workflow completions post Adaptive Cards with status, execution time, and link to view details.

**Example Message**:
```
✅ External Agent Invocation
Status: SUCCESS ✓

Agent ID: copilot_hr
Execution Time: 123ms
Invocation ID: inv-abc123

[View Invocation]
```

---

### Use Case 2: Discord Alerts

**Scenario**: Post color-coded alerts to Discord when deployments succeed or fail.

**Setup**:
1. In Discord, go to Server Settings → Integrations → Webhooks → **"New Webhook"**
2. Name it "Kaizen Alerts", select channel, copy webhook URL
3. In Kaizen Studio, register External Agent:
   - Platform: `Discord`
   - Webhook URL: Paste the webhook URL
   - Username: "Kaizen Studio"
   - Avatar URL: (optional) Your bot avatar URL

**Result**: Deployments post embeds to Discord:
- **Green** = Success
- **Red** = Failure
- **Yellow** = Warning

**Example Message**:
```
External Agent Invocation
✅ Agent invocation completed successfully

Agent ID: deploy_bot
Execution Time: 234ms
Status: Success
```

---

### Use Case 3: Notion Logging

**Scenario**: Create database entries in Notion for every workflow execution.

**Setup**:
1. In Notion, create a database with these properties:
   - `Name` (Title)
   - `Status` (Select: Success, Failure, Pending)
   - `Agent ID` (Text)
   - `Execution Time (ms)` (Number)
   - `Invoked At` (Date)
2. Share database with your integration, copy database ID
3. In Kaizen Studio, register External Agent:
   - Platform: `Notion`
   - Database ID: Paste database ID
   - Auth Type: `bearer_token`
   - Token: Your Notion integration token

**Result**: Every invocation creates a new database page with execution details.

---

### Use Case 4: Slack Block Kit Messages

**Scenario**: Send structured messages to Slack with buttons and formatting.

**Setup**:
1. In Slack, go to workspace settings → **"Incoming Webhooks"** → **"Add New Webhook"**
2. Select channel, copy webhook URL
3. In Kaizen Studio, register External Agent:
   - Platform: `Slack`
   - Webhook URL: Paste the webhook URL

**Result**: Workflow completions post Block Kit messages with sections, dividers, and action buttons.

---

### Use Case 5: Telegram Bot Messages

**Scenario**: Send MarkdownV2 formatted messages via Telegram bot.

**Setup**:
1. Create Telegram bot via [@BotFather](https://t.me/botfather)
2. Get bot token, add bot to channel/group, get chat ID
3. In Kaizen Studio, register External Agent:
   - Platform: `Telegram`
   - Bot Token: Your bot token
   - Chat ID: Your channel/group chat ID

**Result**: Workflow completions post messages with MarkdownV2 formatting and inline keyboard buttons.

---

## Governance: Budgets and Rate Limits

### Why Set Budgets?

External agents can incur costs:
- **Microsoft Copilot**: Per-message pricing
- **Third-Party APIs**: Per-request pricing
- **Runaway Workflows**: Infinite loops can drain budgets

### Budget Enforcement

When you set a monthly budget of $100:

1. **Pre-Check**: Before each invocation, Kaizen checks if budget allows it
2. **Cost Estimation**: Estimated cost is calculated (e.g., $0.05)
3. **Budget Check**: $95 spent + $0.05 = $100 (within limit) → **ALLOWED**
4. **Execution**: Agent is invoked
5. **Post-Check**: Actual cost is recorded ($0.048)

If budget exceeded:
- **HTTP 402 Payment Required** returned
- Invocation is blocked
- Alert sent to team lead

### Rate Limiting

Rate limits prevent abuse and spikes:

**Per-Minute Limit** (e.g., 10 req/min):
- Protects against runaway loops
- Invocation 11 within 60 seconds → **429 Too Many Requests**

**Per-Hour Limit** (e.g., 100 req/hour):
- Medium-term usage control
- Smooth out spikes

**Per-Day Limit** (e.g., 500 req/day):
- Long-term quota enforcement
- Prevents daily budget exhaustion

**Rate Limit Headers** (returned in responses):
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 2025-12-20T10:15:00Z
```

When rate limited:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-12-20T10:15:00Z
```

**What to do**: Wait 30 seconds and retry.

### Monitoring Governance

Check governance status for your agent:

1. Navigate to **Gateways → External Agents**
2. Click on your agent name
3. View **"Governance Status"** panel:

```json
{
  "budget": {
    "monthly_budget_usd": 100.0,
    "monthly_spent_usd": 45.0,
    "remaining_monthly_usd": 55.0,
    "usage_percentage": 0.45,
    "warning_triggered": false
  },
  "rate_limit": {
    "allowed": true,
    "remaining": 7,
    "current_usage": {
      "minute": 3,
      "hour": 45,
      "day": 200
    }
  }
}
```

**Warning Threshold** (80%): Email notification sent
**Degradation Threshold** (90%): Alert sent to on-call
**Hard Limit** (100%): Invocations blocked

---

## Troubleshooting

### Error: "Agent not found"

**Cause**: Agent was deleted or you don't have access.

**Solution**:
1. Check spelling of agent ID/name
2. Verify you're in the correct organization
3. Ask admin to verify agent exists

---

### Error: "Budget exceeded" (HTTP 402)

**Cause**: Monthly or daily budget limit reached.

**Solution**:
1. Check current budget usage in governance status panel
2. Wait until next billing period (monthly reset)
3. Ask admin to increase budget limits
4. Optimize workflow to reduce invocations

---

### Error: "Rate limit exceeded" (HTTP 429)

**Cause**: Too many invocations within time window.

**Solution**:
1. Wait for rate limit window to reset (see `Retry-After` header)
2. Reduce invocation frequency in workflow
3. Ask admin to increase rate limits
4. Use queuing/batching to smooth out spikes

---

### Error: "Webhook delivery failed"

**Cause**: External system rejected webhook (invalid URL, auth failure, etc.).

**Solution**:
1. **Check webhook URL**: Verify it's correct (copy-paste from platform)
2. **Test externally**: Use curl to test webhook directly:
   ```bash
   curl -X POST "https://outlook.webhook.office.com/webhookb2/.../IncomingWebhook/..." \
     -H "Content-Type: application/json" \
     -d '{"text": "Test message"}'
   ```
3. **Check auth**: Verify credentials are correct (API key, bearer token, etc.)
4. **Check permissions**: Verify bot/integration has permission to post to channel
5. **Review audit logs**: Check detailed error message in audit logs

---

### Error: "Credentials invalid"

**Cause**: Authentication failed (wrong API key, expired token, etc.).

**Solution**:
1. Regenerate credentials in external platform
2. Update External Agent auth config with new credentials
3. Test again

---

### Webhook Not Arriving

**Symptoms**: No error, but message doesn't appear in Teams/Discord/Slack.

**Debugging**:
1. **Check invocation status**: Go to agent detail page → "Recent Invocations"
2. **Verify webhook_delivery_status**: Should be `"delivered"` (not `"failed"` or `"pending"`)
3. **Check webhook_delivered_at**: Should have recent timestamp
4. **Review audit logs**: Look for webhook delivery events
5. **Test webhook URL manually**: Use curl to verify URL works
6. **Check channel/chat ID**: Verify bot has access to that channel

---

### Performance Issues

**Symptoms**: Invocations taking >5 seconds, timeouts.

**Debugging**:
1. **Check external system health**: Is Teams/Discord/Slack slow?
2. **Review execution metadata**: Check `duration_ms` in invocation record
3. **Monitor rate limits**: High rate limit usage can slow down responses
4. **Check network latency**: Use traceroute to external system
5. **Contact support**: If latency >5s consistently

---

## Best Practices

### 1. Start Conservative with Budgets

**Recommendation**: Start with low limits, increase based on actual usage.

**Initial Setup**:
- Monthly Budget: $50
- Daily Budget: $5
- Requests Per Minute: 5

**After 2 weeks**: Review actual usage, adjust limits ±20%.

---

### 2. Use Descriptive Names

**Bad**: `agent_1`, `test_agent`, `copilot`

**Good**: `Teams HR Notifications`, `Discord Deploy Alerts`, `Notion Audit Log`

**Why**: Easier to identify agents in lineage graphs and audit logs.

---

### 3. Test Before Production

Always test your agent before using in production workflows:

1. Click **"Test"** button after registration
2. Verify message arrives correctly formatted
3. Check audit logs for any errors
4. Review governance metrics (cost per invocation)

---

### 4. Monitor Governance Regularly

**Daily**: Check budget usage percentage (aim <50% midway through month)

**Weekly**: Review rate limit trends (identify spikes)

**Monthly**: Review total spending, adjust budgets for next month

---

### 5. Rotate Credentials Regularly

**Recommendation**: Rotate API keys/tokens every 90 days.

**How**:
1. Generate new credentials in external platform
2. Update External Agent auth config
3. Test to verify new credentials work
4. Revoke old credentials

---

## Advanced Features

### Authentication Lineage

Every invocation is tracked with complete audit trail:

**5 Identity Layers**:
1. **External User**: Who triggered the workflow (email, name, role)
2. **External System**: Which system initiated it (Copilot, custom, etc.)
3. **Kaizen Auth**: Which API key was used (org, team)
4. **External Agent**: Which agent was invoked
5. **Invocation ID**: Unique identifier for traceability

**Use Cases**:
- **Compliance**: GDPR data subject access requests
- **Cost Attribution**: Who spent what on external agents
- **Security**: Trace invocations back to origin
- **Debugging**: Full context for troubleshooting

**Example Lineage Query**:
```
User: jane.smith@company.com (Sales Manager)
  ↓
System: Microsoft Copilot (session: copilot-xyz789)
  ↓
API Key: sk_live_a1b2c3d4 (org: Acme Corp)
  ↓
Agent: Sales Analytics Bot (version: v2.1.0)
  ↓
Invocation: inv-def456 (cost: $0.0456, duration: 1234ms)
```

---

### Policy-Based Access Control (ABAC)

Administrators can set fine-grained policies:

**Time-Based**:
- Business hours only (Mon-Fri 9am-5pm)
- Block during maintenance windows

**Location-Based**:
- US and Canada only
- Block specific countries (compliance)

**Environment-Based**:
- Production only
- Block development/staging

**Example**: "Allow Microsoft Copilot only during business hours in production environment"

If policy denies invocation:
- **HTTP 403 Forbidden** returned
- Audit log captures policy denial event
- Admin receives alert

---

## Related Documentation

- [Admin Guide](./03-admin-guide.md) - Installation, configuration, monitoring
- [API Reference](./04-api-reference.md) - Complete API documentation
- [Developer Guide](./05-developer-guide.md) - Architecture, extension guide
- [Migration Guide](./06-migration.md) - Upgrading existing installations

---

## Support

**Questions?** Contact your Kaizen Studio administrator.

**Bugs or Feature Requests?** File an issue in the project repository.

**Security Issues?** Email security@kaizen.studio (do not file public issues).
