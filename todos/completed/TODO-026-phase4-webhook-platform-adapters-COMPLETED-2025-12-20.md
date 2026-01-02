# TODO-026: Phase 4 - Webhook Platform Adapters

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 2-3 days
**Dependencies**: TODO-023 (Phase 1)
**Parallel Execution**: Can run in parallel with TODO-024 (Phase 2) and TODO-025 (Phase 3)

## Description
Implement platform-specific webhook adapters for Microsoft Teams, Discord, Slack, Telegram, and Notion. Each adapter transforms External Agent invocation results into platform-native formats (Teams Adaptive Cards, Discord embeds, Slack Block Kit, Telegram bot messages, Notion database entries).

## Acceptance Criteria
- [ ] BaseWebhookAdapter abstract class with common webhook delivery logic
- [ ] TeamsWebhookAdapter with Adaptive Card formatting
- [ ] DiscordWebhookAdapter with embed formatting
- [ ] SlackWebhookAdapter with Block Kit formatting
- [ ] TelegramWebhookAdapter with bot message formatting
- [ ] NotionWebhookAdapter with database entry creation
- [ ] WebhookDeliveryService orchestrates adapter selection and delivery
- [ ] All adapters support authentication (API Key, OAuth2, Custom)
- [ ] All adapters support retry logic with exponential backoff (3 attempts, 1s/2s/4s delays)
- [ ] Webhook delivery events logged to AuditService with platform-specific metadata
- [ ] Webhook delivery failures tracked in ExternalAgentInvocation with error details

## Dependencies
**External**:
- Platform-specific SDKs/APIs (Teams Graph API, Discord Webhooks API, Slack Web API, Telegram Bot API, Notion API)
- AuditService (existing)
- ObservabilityManager (for lineage tracking from TODO-024)

**Internal**:
- TODO-023: ExternalAgent model with platform_config and auth_config fields
- TODO-023: ExternalAgentInvocation model for delivery tracking

## Risk Assessment
- **HIGH**: Platform API changes could break adapters (versioning strategy required)
- **MEDIUM**: Authentication failures must not leak credentials in error messages
- **MEDIUM**: Webhook delivery timeouts must not block caller (async delivery preferred)
- **LOW**: Adapter extensibility must support future platforms without core changes

## Subtasks

### Day 1: Base Adapter Framework (Est: 6-8h)
- [ ] Create BaseWebhookAdapter abstract class (2h)
  - Verification: Abstract methods defined: format_payload(), deliver(), authenticate(), validate_config()
  - Methods: _retry_delivery() with exponential backoff, _log_delivery() for audit trail
- [ ] Implement WebhookDeliveryService with adapter registry (2h)
  - Verification: Service maintains dict mapping provider→adapter class, deliver() method selects adapter based on platform_config.provider
- [ ] Implement common retry logic in BaseWebhookAdapter._retry_delivery() (2h)
  - Verification: 3 retry attempts with 1s/2s/4s delays, logs each attempt to AuditService, raises DeliveryFailedError after final failure
- [ ] Implement authentication helpers in BaseWebhookAdapter (2h)
  - Verification: _get_auth_headers() returns headers based on auth_type (API Key: X-API-Key or custom header, OAuth2: Authorization Bearer token, Custom: arbitrary headers from auth_config)

### Day 2: Platform Adapters - Teams, Discord, Slack (Est: 6-8h)
- [ ] Implement TeamsWebhookAdapter (2h)
  - Verification: format_payload() converts invocation result to Adaptive Card JSON with card schema v1.5, title=agent name, body=result summary, facts=metadata (execution_time_ms, status), deliver() POSTs to Teams webhook URL from platform_config.webhook_url
  - Example Adaptive Card: Title "Agent Result", Text "Request processed", FactSet with execution time and status
- [ ] Implement DiscordWebhookAdapter (2h)
  - Verification: format_payload() converts invocation result to Discord embed with color=#5865F2, title=agent name, description=result summary, fields=metadata, deliver() POSTs to Discord webhook URL with embeds array
  - Example embed: Title "Agent Result", Description "Request processed", Fields: Execution Time (123ms), Status (success)
- [ ] Implement SlackWebhookAdapter (2h)
  - Verification: format_payload() converts invocation result to Block Kit JSON with blocks=[header, section, divider, context], header.text=agent name, section.text=result summary, context=metadata, deliver() POSTs to Slack webhook URL from platform_config.webhook_url
  - Example Block Kit: Header "Agent Result", Section "Request processed", Context "Executed in 123ms • Status: success"

### Day 3: Platform Adapters - Telegram, Notion + Integration (Est: 6-8h)
- [ ] Implement TelegramWebhookAdapter (2h)
  - Verification: format_payload() converts invocation result to Telegram message with parse_mode=MarkdownV2, text includes agent name (bold), result summary, metadata table, deliver() POSTs to Telegram Bot API sendMessage with chat_id from platform_config.chat_id
  - Example message: "**Agent Result**\nRequest processed\n\nExecution Time: 123ms\nStatus: success"
- [ ] Implement NotionWebhookAdapter (2h)
  - Verification: format_payload() converts invocation result to Notion page properties with title=agent name, properties={Result (rich text), Status (select), ExecutionTime (number)}, deliver() POSTs to Notion API pages endpoint with database_id from platform_config.database_id
  - Example Notion page: Title "Agent Result - 2025-12-20", Properties: Result="Request processed", Status="Success", ExecutionTime=123
- [ ] Integrate WebhookDeliveryService with ExternalAgentService.invoke_agent() (1h)
  - Verification: invoke_agent() calls WebhookDeliveryService.deliver() after successful invocation, passes invocation result and platform_config, delivery runs asynchronously (does not block response)
- [ ] Update ExternalAgentInvocation model with webhook_delivery_status field (1h)
  - Verification: DataFlow migration adds webhook_delivery_status ENUM('pending', 'delivered', 'failed'), webhook_delivery_error TEXT, webhook_delivered_at TIMESTAMP

## Testing Requirements

### Tier 1: Unit Tests (tests/unit/services/test_webhook_adapters.py)
**Intent**: Verify adapter payload formatting and authentication logic in isolation
- [ ] Test TeamsWebhookAdapter.format_payload() generates valid Adaptive Card JSON
  - Intent: Ensure Teams messages conform to Adaptive Card schema v1.5
- [ ] Test DiscordWebhookAdapter.format_payload() generates valid Discord embed
  - Intent: Ensure Discord embeds include required fields (color, title, description, fields)
- [ ] Test SlackWebhookAdapter.format_payload() generates valid Block Kit JSON
  - Intent: Ensure Slack messages conform to Block Kit schema
- [ ] Test TelegramWebhookAdapter.format_payload() generates valid Markdown message
  - Intent: Ensure Telegram messages use MarkdownV2 syntax correctly
- [ ] Test NotionWebhookAdapter.format_payload() generates valid Notion page properties
  - Intent: Ensure Notion pages include required properties for database schema
- [ ] Test BaseWebhookAdapter._get_auth_headers() with API Key auth
  - Intent: Verify API Key auth headers are constructed correctly
- [ ] Test BaseWebhookAdapter._get_auth_headers() with OAuth2 auth
  - Intent: Verify OAuth2 Bearer token is included in Authorization header
- [ ] Test BaseWebhookAdapter._retry_delivery() retries 3 times with exponential backoff
  - Intent: Verify retry logic delays (1s, 2s, 4s) and raises DeliveryFailedError after final failure

### Tier 2: Integration Tests (tests/integration/test_webhook_delivery.py)
**Intent**: Verify webhook delivery with real platform APIs or mock webhook servers (NO MOCKING of adapters)
- [ ] Test TeamsWebhookAdapter delivers to mock Teams webhook server
  - Intent: Verify end-to-end Teams delivery with real HTTP requests
  - Setup: Mock HTTP server simulating Teams webhook endpoint, ExternalAgent with Teams platform_config
  - Assertions: Mock server receives POST with valid Adaptive Card JSON, Content-Type: application/json, delivery logged to AuditService
- [ ] Test DiscordWebhookAdapter delivers to mock Discord webhook server
  - Intent: Verify end-to-end Discord delivery with real HTTP requests
  - Setup: Mock HTTP server simulating Discord webhook endpoint, ExternalAgent with Discord platform_config
  - Assertions: Mock server receives POST with valid embed JSON, embeds array present, delivery logged to AuditService
- [ ] Test SlackWebhookAdapter delivers to mock Slack webhook server
  - Intent: Verify end-to-end Slack delivery with real HTTP requests
  - Setup: Mock HTTP server simulating Slack webhook endpoint, ExternalAgent with Slack platform_config
  - Assertions: Mock server receives POST with valid Block Kit JSON, blocks array present, delivery logged to AuditService
- [ ] Test TelegramWebhookAdapter delivers to mock Telegram Bot API server
  - Intent: Verify end-to-end Telegram delivery with real HTTP requests
  - Setup: Mock HTTP server simulating Telegram sendMessage endpoint, ExternalAgent with Telegram platform_config
  - Assertions: Mock server receives POST with chat_id, text, parse_mode=MarkdownV2, delivery logged to AuditService
- [ ] Test NotionWebhookAdapter delivers to mock Notion API server
  - Intent: Verify end-to-end Notion delivery with real HTTP requests
  - Setup: Mock HTTP server simulating Notion pages endpoint, ExternalAgent with Notion platform_config
  - Assertions: Mock server receives POST with database_id, properties, delivery logged to AuditService
- [ ] Test WebhookDeliveryService retry logic with failing webhook server
  - Intent: Verify retry attempts and exponential backoff with real HTTP timeouts
  - Setup: Mock HTTP server that fails 2 times then succeeds, ExternalAgent with Teams platform_config
  - Assertions: 3 HTTP requests made (2 failures, 1 success), delays between requests ~1s and ~2s, final delivery succeeds
- [ ] Test webhook delivery failure updates ExternalAgentInvocation status
  - Intent: Verify delivery failures are tracked in database
  - Setup: Real PostgreSQL, mock HTTP server (always returns 500), ExternalAgent with Discord platform_config
  - Assertions: ExternalAgentInvocation.webhook_delivery_status='failed', webhook_delivery_error contains error message, AuditService logs delivery failure

### Tier 3: End-to-End Tests (tests/e2e/test_webhook_platform_workflow.py)
**Intent**: Verify complete webhook delivery workflow with real infrastructure (NO MOCKING)
- [ ] Test complete External Agent invocation with Teams webhook delivery
  - Intent: Verify end-to-end flow from agent invocation to Teams message delivery
  - Setup: Real PostgreSQL, real Redis, mock Teams webhook server, ExternalAgent with Teams platform_config and auth_config
  - Steps:
    1. POST /api/external-agents/{id}/invoke with payload
    2. Mock agent processes request and returns result
    3. WebhookDeliveryService formats Adaptive Card and delivers to Teams
    4. Query ExternalAgentInvocation for delivery status
  - Assertions: Invocation created, Teams webhook server receives valid Adaptive Card, ExternalAgentInvocation.webhook_delivery_status='delivered', webhook_delivered_at populated
- [ ] Test webhook delivery with authentication (API Key)
  - Intent: Verify authentication headers are included in webhook requests
  - Setup: Real PostgreSQL, mock Slack webhook server (validates X-API-Key header), ExternalAgent with Slack platform_config and API Key auth_config
  - Steps:
    1. POST /api/external-agents/{id}/invoke
    2. WebhookDeliveryService delivers to Slack with X-API-Key header
  - Assertions: Mock Slack server receives request with X-API-Key: {expected_key}, delivery succeeds
- [ ] Test webhook delivery failure and retry recovery
  - Intent: Verify retry logic recovers from transient failures
  - Setup: Real PostgreSQL, mock Discord webhook server (fails 2 times, succeeds on 3rd attempt), ExternalAgent with Discord platform_config
  - Steps:
    1. POST /api/external-agents/{id}/invoke
    2. WebhookDeliveryService attempts delivery, retries 2 times, succeeds on 3rd
  - Assertions: ExternalAgentInvocation.webhook_delivery_status='delivered', AuditService logs 3 delivery attempts (2 failures, 1 success)

## Documentation Requirements
- [ ] Update docs/05-infrastructure/webhook-adapters.md with adapter architecture
  - BaseWebhookAdapter design, adapter registry pattern, retry logic details
- [ ] Add platform-specific adapter documentation
  - Teams Adaptive Card examples, Discord embed examples, Slack Block Kit examples, Telegram message examples, Notion page examples
- [ ] Create webhook delivery troubleshooting guide in docs/05-infrastructure/webhook-troubleshooting.md
  - Common delivery failures (authentication errors, timeout errors, schema validation errors), retry behavior, error message interpretation
- [ ] Add webhook configuration guide in docs/05-infrastructure/webhook-configuration.md
  - Platform-specific setup instructions (Teams webhook URL creation, Discord webhook setup, Slack app configuration, Telegram bot setup, Notion integration setup)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] All Tier 1 unit tests passing (8+ tests)
- [ ] All Tier 2 integration tests passing (7+ tests with mock webhook servers)
- [ ] All Tier 3 E2E tests passing (3+ tests with real infrastructure)
- [ ] Code review completed
- [ ] No linting errors (ruff, mypy)
- [ ] All documentation files created and reviewed
- [ ] Webhook delivery tested with mock servers for all 5 platforms
- [ ] Retry logic verified with transient failure scenarios
- [ ] Authentication tested for all auth types (API Key, OAuth2, Custom)
- [ ] Async delivery verified (invocation API does not block on webhook delivery)
- [ ] Phase 4 deliverables ready for Phase 5 frontend integration

## Notes
- Webhook delivery should be asynchronous to prevent blocking invocation API responses
- Platform API documentation should be referenced in code comments for future maintainers
- Retry logic should use exponential backoff to avoid overwhelming failing webhook servers
- Error messages must not leak sensitive auth credentials (sanitize before logging)
- Adapter extensibility is critical - new platforms should be addable without changing WebhookDeliveryService
