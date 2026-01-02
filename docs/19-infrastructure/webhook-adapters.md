# Webhook Platform Adapters

**Status**: Phase 4 Complete
**Version**: 1.0.0
**Last Updated**: 2025-12-20

## Overview

Webhook Platform Adapters transform External Agent invocation results into platform-native formats for Microsoft Teams, Discord, Slack, Telegram, and Notion. Each adapter implements platform-specific message formatting (Adaptive Cards, embeds, Block Kit, bot messages, database entries) while sharing common authentication, retry logic, and delivery tracking.

## Architecture

### Component Structure

```
studio/adapters/
├── base_webhook.py          # BaseWebhookAdapter abstract class
├── teams_adapter.py          # Microsoft Teams Adaptive Cards
├── discord_adapter.py        # Discord embeds
├── slack_adapter.py          # Slack Block Kit
├── telegram_adapter.py       # Telegram bot messages (MarkdownV2)
└── notion_adapter.py         # Notion database pages

studio/services/
└── webhook_delivery_service.py  # Adapter registry & orchestration
```

### Design Pattern

All adapters inherit from `BaseWebhookAdapter` which provides:

1. **Authentication**: API Key, OAuth2, Bearer Token, Custom headers
2. **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 4s)
3. **Error Handling**: Credential sanitization, delivery tracking
4. **HTTP Delivery**: Async execution with timeout handling

Each adapter implements two abstract methods:
- `format_payload()`: Transform invocation result to platform format
- `deliver()`: Execute delivery to platform endpoint

## Supported Platforms

### 1. Microsoft Teams

**Adapter**: `TeamsWebhookAdapter`
**Format**: Adaptive Card (Message Card schema v1.5)
**Endpoint**: Teams incoming webhook URL

#### Features
- Theme colors based on invocation status (blue/red/yellow)
- Facts list with invocation metadata
- Action buttons (View Invocation)
- Icon and image support

#### Example Payload
```python
{
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0076D7",  # Blue for success
    "summary": "Agent Invocation SUCCESS",
    "sections": [{
        "activityTitle": "External Agent Invocation",
        "activitySubtitle": "Status: SUCCESS",
        "facts": [
            {"name": "Agent ID", "value": "agent_456"},
            {"name": "Execution Time", "value": "123ms"}
        ]
    }],
    "potentialAction": [{
        "@type": "OpenUri",
        "name": "View Invocation",
        "targets": [{"os": "default", "uri": "https://kaizen.studio/..."}]
    }]
}
```

#### Platform Configuration
```json
{
    "webhook_url": "https://outlook.webhook.office.com/webhookb2/.../IncomingWebhook/...",
    "studio_base_url": "https://kaizen.studio",
    "icon_url": "https://kaizen.studio/icons/external-agent.png"
}
```

### 2. Discord

**Adapter**: `DiscordWebhookAdapter`
**Format**: Discord Embed
**Endpoint**: Discord webhook URL

#### Features
- Colored embeds (green/red/yellow)
- Up to 25 fields per embed
- Footer branding
- Timestamp support
- URL linking

#### Example Payload
```python
{
    "username": "Kaizen Studio",
    "avatar_url": "https://kaizen.studio/logo.png",
    "embeds": [{
        "title": "External Agent Invocation",
        "description": "✅ Agent invocation completed successfully",
        "color": 65280,  # Green
        "fields": [
            {"name": "Agent ID", "value": "agent_456", "inline": True},
            {"name": "Execution Time", "value": "123ms", "inline": True}
        ],
        "footer": {"text": "Kaizen Studio"},
        "timestamp": "2025-12-20T10:00:01Z"
    }]
}
```

#### Platform Configuration
```json
{
    "webhook_url": "https://discord.com/api/webhooks/123/abc",
    "username": "Kaizen Studio",
    "avatar_url": "https://kaizen.studio/logo.png",
    "footer_icon_url": "https://kaizen.studio/icon.png"
}
```

### 3. Slack

**Adapter**: `SlackWebhookAdapter`
**Format**: Block Kit
**Endpoint**: Slack incoming webhook URL

#### Features
- Structured blocks (header, section, divider, context)
- Markdown formatting (mrkdwn)
- Action buttons
- Emoji support
- Fallback text for notifications

#### Example Payload
```python
{
    "blocks": [
        {"type": "header", "text": {"type": "plain_text", "text": "External Agent Invocation"}},
        {"type": "section", "text": {"type": "mrkdwn", "text": ":white_check_mark: *Agent invocation completed successfully*"}},
        {"type": "divider"},
        {"type": "section", "text": {"type": "mrkdwn", "text": "*Agent ID:* agent_456\n*Execution Time:* 123ms"}},
        {"type": "actions", "elements": [{"type": "button", "text": {"type": "plain_text", "text": "View Invocation"}, "url": "..."}]},
        {"type": "context", "elements": [{"type": "mrkdwn", "text": "Kaizen Studio • External Agent Governance"}]}
    ],
    "text": "External Agent Invocation SUCCESS"
}
```

#### Platform Configuration
```json
{
    "webhook_url": "https://hooks.slack.com/services/ABC/DEF/GHI",
    "studio_base_url": "https://kaizen.studio"
}
```

### 4. Telegram

**Adapter**: `TelegramWebhookAdapter`
**Format**: Bot message with MarkdownV2
**Endpoint**: Telegram Bot API sendMessage

#### Features
- MarkdownV2 formatting (bold, italic, code)
- Inline keyboard buttons
- Emoji indicators
- Special character escaping
- Parse mode configuration

#### Example Payload
```python
{
    "chat_id": "-1001234567890",
    "text": "✅ *External Agent Invocation*\n\nStatus: *SUCCESS* ✓\n\n*Agent ID:* agent\\_456\n*Execution Time:* 123ms",
    "parse_mode": "MarkdownV2",
    "disable_web_page_preview": False,
    "reply_markup": {
        "inline_keyboard": [[
            {"text": "View Invocation", "url": "https://kaizen.studio/..."}
        ]]
    }
}
```

#### Platform Configuration
```json
{
    "bot_token": "123456789:ABCdefGhIjklmnopqrstuvwxyz12345",
    "chat_id": "-1001234567890",
    "studio_base_url": "https://kaizen.studio"
}
```

### 5. Notion

**Adapter**: `NotionWebhookAdapter`
**Format**: Database page entry
**Endpoint**: Notion API pages endpoint

#### Features
- Database page creation
- Rich property types (Title, Rich Text, Select, Number, Date)
- Automatic timestamps
- Error message tracking
- Invocation metadata storage

#### Example Payload
```python
{
    "parent": {"database_id": "abc123def456"},
    "properties": {
        "Name": {"title": [{"text": {"content": "Invocation inv_123a"}}]},
        "Status": {"select": {"name": "Success"}},
        "Agent ID": {"rich_text": [{"text": {"content": "agent_456"}}]},
        "Execution Time (ms)": {"number": 123},
        "Invoked At": {"date": {"start": "2025-12-20T10:00:00Z"}},
        "Completed At": {"date": {"start": "2025-12-20T10:00:01Z"}}
    }
}
```

#### Platform Configuration
```json
{
    "database_id": "abc123def456"
}
```

#### Authentication
```json
{
    "auth_type": "bearer_token",
    "credentials": {
        "token": "secret_abc123"
    }
}
```

## WebhookDeliveryService

### Adapter Registry

The `WebhookDeliveryService` maintains a registry of platform adapters and orchestrates webhook delivery:

```python
from studio.services.webhook_delivery_service import WebhookDeliveryService

service = WebhookDeliveryService()

# Deliver synchronously (blocks until complete)
result = await service.deliver(external_agent, invocation_result)

# Deliver asynchronously (fire-and-forget)
await service.deliver_async(external_agent, invocation_result)
```

### Delivery Flow

1. **Select Adapter**: Based on `external_agent.platform`
2. **Format Payload**: Call `adapter.format_payload(invocation_result)`
3. **Deliver**: Call `adapter.deliver(payload)` with retry
4. **Update Status**: Update `ExternalAgentInvocation.webhook_delivery_status`
5. **Audit Log**: Log delivery event to AuditService

### Delivery Status Tracking

Webhook delivery status is tracked in `ExternalAgentInvocation`:

- `webhook_delivery_status`: "pending" | "delivered" | "failed"
- `webhook_delivery_error`: Error message if failed
- `webhook_delivered_at`: Delivery completion timestamp

## Authentication

All adapters support multiple authentication types via `auth_config`:

### API Key
```python
{
    "auth_type": "api_key",
    "credentials": {
        "api_key": "your_api_key",
        "header_name": "X-API-Key"  # Optional, defaults to X-API-Key
    }
}
```

### OAuth2 / Bearer Token
```python
{
    "auth_type": "oauth2",
    "credentials": {
        "token": "your_bearer_token"
    }
}
```

### Custom Headers
```python
{
    "auth_type": "custom",
    "credentials": {
        "headers": {
            "X-Custom-Header": "value",
            "Authorization": "Custom auth_scheme"
        }
    }
}
```

### No Authentication
```python
{
    "auth_type": "none",
    "credentials": {}
}
```

## Retry Logic

All adapters use exponential backoff retry:

- **Attempt 1**: Immediate
- **Attempt 2**: After 1 second
- **Attempt 3**: After 2 seconds (total 3 seconds delay)

Retries stop on:
- Successful delivery (2xx status code)
- Client errors (4xx) - no retry for bad requests
- Max attempts reached (3 attempts)

## Error Handling

### Credential Sanitization

All error messages are sanitized to remove sensitive data:
- API keys redacted as `api_key=<REDACTED>`
- Bearer tokens redacted as `Bearer <REDACTED>`
- Authorization headers redacted
- Passwords redacted

### Error Propagation

Webhook delivery failures do NOT fail the invocation:
- Invocation succeeds regardless of webhook delivery status
- Delivery errors are logged to AuditService
- Delivery status is tracked in `ExternalAgentInvocation`

## Integration with ExternalAgentService

Webhook delivery is automatically triggered after each invocation:

```python
# In ExternalAgentService.invoke()
invocation = await self.log_invocation({...})

# Trigger webhook delivery (async, non-blocking)
await self._trigger_webhook_delivery(agent, invocation)

return invocation_result  # Returns immediately, delivery happens in background
```

## Testing

### Tier 1: Unit Tests

Test adapter payload formatting and authentication logic:

```bash
pytest tests/unit/services/test_webhook_adapters.py -v
```

Tests include:
- Teams Adaptive Card formatting
- Discord embed formatting
- Slack Block Kit formatting
- Telegram MarkdownV2 formatting
- Notion page properties formatting
- Authentication header generation
- Error message sanitization
- Retry logic

### Tier 2: Integration Tests

Test end-to-end delivery with mock webhook servers (NO MOCKING of adapters):

```bash
pytest tests/integration/test_webhook_delivery.py -v
```

Tests include:
- Real HTTP delivery to mock servers
- Retry logic with failing servers
- Delivery status tracking
- Audit logging

### Tier 3: E2E Tests

Test complete workflow with real infrastructure (PostgreSQL, Redis, mock servers):

```bash
pytest tests/e2e/test_webhook_platform_workflow.py -v
```

## Extensibility

### Adding a New Platform

1. **Create Adapter Class**:
```python
from studio.adapters.base_webhook import BaseWebhookAdapter, DeliveryResult

class NewPlatformAdapter(BaseWebhookAdapter):
    def format_payload(self, invocation_result: dict) -> dict:
        # Transform to platform format
        return {
            "platform_specific_field": "value"
        }

    async def deliver(self, payload: dict) -> DeliveryResult:
        # Execute delivery
        return await self._execute_http_delivery(
            url=self.platform_config["webhook_url"],
            payload=payload,
            headers={"Content-Type": "application/json"},
        )
```

2. **Register Adapter**:
```python
from studio.services.webhook_delivery_service import WebhookDeliveryService

service = WebhookDeliveryService()
service.register_adapter("new_platform", NewPlatformAdapter)
```

3. **Configure ExternalAgent**:
```json
{
    "platform": "new_platform",
    "platform_config": {
        "webhook_url": "https://platform.com/webhook"
    }
}
```

## Best Practices

1. **Platform Configuration**: Store all platform-specific settings in `platform_config` (webhook URLs, bot tokens, database IDs)

2. **Authentication**: Use `auth_config` for credentials, leverage encryption for sensitive data

3. **Error Handling**: Always sanitize error messages before logging or returning

4. **Async Delivery**: Use `deliver_async()` to avoid blocking invocation responses

5. **Testing**: Test all three tiers - unit (payload formatting), integration (HTTP delivery), E2E (full workflow)

6. **Monitoring**: Track delivery status in `ExternalAgentInvocation`, use AuditService for event logging

## Rate Limits

Each platform has different rate limits:

- **Teams**: 1 request/second (best practice)
- **Discord**: 5 requests/2 seconds per webhook (30/minute)
- **Slack**: 1 request/second per webhook
- **Telegram**: 30 messages/second globally, 20 messages/minute per chat
- **Notion**: 3 requests/second per integration

Adapters respect these limits through throttling and retry logic.

## Security Considerations

1. **Credential Encryption**: All credentials stored in `encrypted_credentials` field
2. **Error Sanitization**: Sensitive data removed from error messages
3. **HTTPS Only**: All webhook deliveries use HTTPS
4. **Audit Logging**: All delivery events logged to AuditService
5. **No Credential Leakage**: Credentials never included in API responses

## References

- **Teams**: https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook
- **Discord**: https://discord.com/developers/docs/resources/webhook
- **Slack**: https://api.slack.com/messaging/webhooks
- **Telegram**: https://core.telegram.org/bots/api
- **Notion**: https://developers.notion.com/reference/post-page

## Version History

- **1.0.0** (2025-12-20): Initial release with 5 platform adapters (Teams, Discord, Slack, Telegram, Notion)
