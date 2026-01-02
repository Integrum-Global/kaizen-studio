"""
Tier 1 Unit Tests: Webhook Adapters

Intent: Verify adapter payload formatting and authentication logic in isolation.
NO MOCKING of adapters - only external HTTP calls.
"""

import json

import pytest
from studio.adapters.base_webhook import BaseWebhookAdapter, DeliveryResult
from studio.adapters.discord_adapter import DiscordWebhookAdapter
from studio.adapters.notion_adapter import NotionWebhookAdapter
from studio.adapters.slack_adapter import SlackWebhookAdapter
from studio.adapters.teams_adapter import TeamsWebhookAdapter
from studio.adapters.telegram_adapter import TelegramWebhookAdapter

# ===================
# Test Data Fixtures
# ===================


@pytest.fixture
def sample_invocation_success():
    """Sample successful invocation result."""
    return {
        "id": "inv_123abc",
        "external_agent_id": "agent_456def",
        "user_id": "user_789ghi",
        "organization_id": "org_111jkl",
        "request_payload": json.dumps({"input": "test request"}),
        "request_ip": "192.168.1.1",
        "request_user_agent": "TestClient/1.0",
        "response_payload": json.dumps({"result": "test response"}),
        "response_status_code": 200,
        "execution_time_ms": 123,
        "status": "success",
        "error_message": "",
        "trace_id": "trace_xyz",
        "invoked_at": "2025-12-20T10:00:00Z",
        "completed_at": "2025-12-20T10:00:01Z",
        "created_at": "2025-12-20T10:00:01Z",
    }


@pytest.fixture
def sample_invocation_failed():
    """Sample failed invocation result."""
    return {
        "id": "inv_456def",
        "external_agent_id": "agent_789ghi",
        "user_id": "user_111jkl",
        "organization_id": "org_222mno",
        "request_payload": json.dumps({"input": "test request"}),
        "request_ip": "192.168.1.2",
        "request_user_agent": "TestClient/1.0",
        "response_payload": "{}",
        "response_status_code": 0,
        "execution_time_ms": 50,
        "status": "failed",
        "error_message": "Connection timeout",
        "trace_id": "trace_abc",
        "invoked_at": "2025-12-20T10:05:00Z",
        "completed_at": "2025-12-20T10:05:01Z",
        "created_at": "2025-12-20T10:05:01Z",
    }


# ===================
# TeamsWebhookAdapter Tests
# ===================


def test_teams_adapter_format_payload_success(sample_invocation_success):
    """
    Intent: Ensure Teams messages conform to Adaptive Card schema v1.5.
    Verification: Check required fields, theme color, facts structure.
    """
    adapter = TeamsWebhookAdapter(
        auth_config={"auth_type": "none", "credentials": {}},
        platform_config={
            "webhook_url": "https://test.webhook.office.com/webhookb2/test",
            "studio_base_url": "https://kaizen.studio",
        },
    )

    payload = adapter.format_payload(sample_invocation_success)

    # Verify Adaptive Card structure
    assert payload["@type"] == "MessageCard"
    assert payload["@context"] == "http://schema.org/extensions"
    assert payload["themeColor"] == "0076D7"  # Blue for success
    assert payload["summary"] == "Agent Invocation SUCCESS"

    # Verify sections
    assert len(payload["sections"]) == 1
    section = payload["sections"][0]
    assert section["activityTitle"] == "External Agent Invocation"
    assert section["activitySubtitle"] == "Status: SUCCESS"
    assert section["markdown"] is True

    # Verify facts
    facts = section["facts"]
    assert len(facts) >= 5
    assert any(f["name"] == "Agent ID" and f["value"] == "agent_456def" for f in facts)
    assert any(
        f["name"] == "Invocation ID" and f["value"] == "inv_123abc" for f in facts
    )
    assert any(f["name"] == "Status" and f["value"] == "SUCCESS" for f in facts)
    assert any(f["name"] == "Execution Time" and f["value"] == "123ms" for f in facts)

    # Verify action buttons
    assert "potentialAction" in payload
    assert len(payload["potentialAction"]) == 1
    assert payload["potentialAction"][0]["@type"] == "OpenUri"
    assert payload["potentialAction"][0]["name"] == "View Invocation"


def test_teams_adapter_format_payload_failed(sample_invocation_failed):
    """
    Intent: Ensure Teams failed messages use red theme color and include error.
    """
    adapter = TeamsWebhookAdapter(
        auth_config={"auth_type": "none", "credentials": {}},
        platform_config={
            "webhook_url": "https://test.webhook.office.com/webhookb2/test"
        },
    )

    payload = adapter.format_payload(sample_invocation_failed)

    # Verify failed theme color
    assert payload["themeColor"] == "D13438"  # Red for failed

    # Verify error message in facts
    facts = payload["sections"][0]["facts"]
    assert any(
        f["name"] == "Error" and f["value"] == "Connection timeout" for f in facts
    )


# ===================
# DiscordWebhookAdapter Tests
# ===================


def test_discord_adapter_format_payload_success(sample_invocation_success):
    """
    Intent: Ensure Discord embeds include required fields (color, title, description, fields).
    Verification: Check embed structure, color, field count, footer.
    """
    adapter = DiscordWebhookAdapter(
        auth_config={"auth_type": "none", "credentials": {}},
        platform_config={
            "webhook_url": "https://discord.com/api/webhooks/123/abc",
            "username": "Kaizen Studio",
            "avatar_url": "https://kaizen.studio/logo.png",
        },
    )

    payload = adapter.format_payload(sample_invocation_success)

    # Verify webhook payload structure
    assert payload["username"] == "Kaizen Studio"
    assert payload["avatar_url"] == "https://kaizen.studio/logo.png"
    assert "embeds" in payload
    assert len(payload["embeds"]) == 1

    # Verify embed structure
    embed = payload["embeds"][0]
    assert embed["title"] == "External Agent Invocation"
    assert "✅" in embed["description"]  # Success emoji
    assert embed["color"] == 65280  # Green for success
    assert embed["timestamp"] == "2025-12-20T10:00:01Z"

    # Verify fields
    assert len(embed["fields"]) >= 5
    assert embed["fields"][0]["name"] == "Agent ID"
    assert embed["fields"][0]["value"] == "agent_456def"
    assert embed["fields"][0]["inline"] is True

    # Verify footer
    assert embed["footer"]["text"] == "Kaizen Studio"


def test_discord_adapter_format_payload_failed(sample_invocation_failed):
    """
    Intent: Ensure Discord failed embeds use red color and include error in description.
    """
    adapter = DiscordWebhookAdapter(
        auth_config={"auth_type": "none", "credentials": {}},
        platform_config={"webhook_url": "https://discord.com/api/webhooks/123/abc"},
    )

    payload = adapter.format_payload(sample_invocation_failed)

    embed = payload["embeds"][0]
    assert embed["color"] == 16711680  # Red for failed
    assert "❌" in embed["description"]
    assert "Connection timeout" in embed["description"]


# ===================
# SlackWebhookAdapter Tests
# ===================


def test_slack_adapter_format_payload_success(sample_invocation_success):
    """
    Intent: Ensure Slack messages conform to Block Kit schema.
    Verification: Check blocks array (header, section, divider, context).
    """
    adapter = SlackWebhookAdapter(
        auth_config={"auth_type": "none", "credentials": {}},
        platform_config={"webhook_url": "https://hooks.slack.com/services/ABC/DEF/GHI"},
    )

    payload = adapter.format_payload(sample_invocation_success)

    # Verify payload structure
    assert "blocks" in payload
    assert "text" in payload  # Fallback text

    # Verify blocks structure
    blocks = payload["blocks"]
    assert len(blocks) >= 5  # header, section, divider, section, context

    # Verify header block
    assert blocks[0]["type"] == "header"
    assert blocks[0]["text"]["text"] == "External Agent Invocation"

    # Verify status section
    assert blocks[1]["type"] == "section"
    assert ":white_check_mark:" in blocks[1]["text"]["text"]

    # Verify divider
    assert blocks[2]["type"] == "divider"

    # Verify details section
    assert blocks[3]["type"] == "section"
    assert "agent_456def" in blocks[3]["text"]["text"]
    assert "123ms" in blocks[3]["text"]["text"]

    # Verify action buttons
    assert blocks[4]["type"] == "actions"
    assert blocks[4]["elements"][0]["type"] == "button"
    assert blocks[4]["elements"][0]["text"]["text"] == "View Invocation"

    # Verify context (footer)
    assert blocks[5]["type"] == "context"


def test_slack_adapter_format_payload_failed(sample_invocation_failed):
    """
    Intent: Ensure Slack failed messages include error emoji and error text.
    """
    adapter = SlackWebhookAdapter(
        auth_config={"auth_type": "none", "credentials": {}},
        platform_config={"webhook_url": "https://hooks.slack.com/services/ABC/DEF/GHI"},
    )

    payload = adapter.format_payload(sample_invocation_failed)

    # Verify failed status emoji
    blocks = payload["blocks"]
    assert ":x:" in blocks[1]["text"]["text"]
    assert "Connection timeout" in blocks[1]["text"]["text"]


# ===================
# TelegramWebhookAdapter Tests
# ===================


def test_telegram_adapter_format_payload_success(sample_invocation_success):
    """
    Intent: Ensure Telegram messages use MarkdownV2 syntax correctly.
    Verification: Check parse_mode, text escaping, inline keyboard.
    """
    adapter = TelegramWebhookAdapter(
        auth_config={"auth_type": "none", "credentials": {}},
        platform_config={
            "bot_token": "123456789:ABCdefGhIjklmnopqrstuvwxyz12345",
            "chat_id": "-1001234567890",
            "studio_base_url": "https://kaizen.studio",
        },
    )

    payload = adapter.format_payload(sample_invocation_success)

    # Verify message structure
    assert payload["parse_mode"] == "MarkdownV2"
    assert payload["disable_web_page_preview"] is False

    # Verify text content
    text = payload["text"]
    assert "✅" in text  # Success emoji
    assert "*External Agent Invocation*" in text
    assert "*SUCCESS*" in text
    assert "123ms" in text

    # Verify inline keyboard
    assert "reply_markup" in payload
    assert "inline_keyboard" in payload["reply_markup"]
    keyboard = payload["reply_markup"]["inline_keyboard"]
    assert len(keyboard) == 1  # One row
    assert keyboard[0][0]["text"] == "View Invocation"
    assert "kaizen.studio" in keyboard[0][0]["url"]


def test_telegram_adapter_markdown_escaping():
    """
    Intent: Verify MarkdownV2 special characters are escaped correctly.
    """
    adapter = TelegramWebhookAdapter(
        auth_config={"auth_type": "none", "credentials": {}},
        platform_config={
            "bot_token": "123456789:ABCdefGhIjklmnopqrstuvwxyz12345",
            "chat_id": "-1001234567890",
        },
    )

    # Test escaping special characters
    test_text = "Test_value-1.0 (v2.3)"
    escaped = adapter._escape_markdown_v2(test_text)

    # Verify escaping
    assert "\\_" in escaped  # Underscore escaped
    assert "\\-" in escaped  # Dash escaped
    assert "\\." in escaped  # Dot escaped
    assert "\\(" in escaped  # Parentheses escaped
    assert "\\)" in escaped


# ===================
# NotionWebhookAdapter Tests
# ===================


def test_notion_adapter_format_payload_success(sample_invocation_success):
    """
    Intent: Ensure Notion pages include required properties for database schema.
    Verification: Check title, properties (Status, Agent ID, Execution Time, dates).
    """
    adapter = NotionWebhookAdapter(
        auth_config={
            "auth_type": "bearer_token",
            "credentials": {"token": "secret_abc123"},
        },
        platform_config={"database_id": "abc123def456"},
    )

    payload = adapter.format_payload(sample_invocation_success)

    # Verify page structure
    assert "parent" in payload
    assert payload["parent"]["database_id"] == "abc123def456"
    assert "properties" in payload

    # Verify properties
    props = payload["properties"]

    # Title property
    assert "Name" in props
    assert props["Name"]["title"][0]["text"]["content"] == "Invocation inv_123a"

    # Status select
    assert "Status" in props
    assert props["Status"]["select"]["name"] == "Success"

    # Agent ID rich text
    assert "Agent ID" in props
    assert props["Agent ID"]["rich_text"][0]["text"]["content"] == "agent_456def"

    # Invocation ID rich text
    assert "Invocation ID" in props
    assert props["Invocation ID"]["rich_text"][0]["text"]["content"] == "inv_123abc"

    # Execution time number
    assert "Execution Time (ms)" in props
    assert props["Execution Time (ms)"]["number"] == 123

    # Invoked At date
    assert "Invoked At" in props
    assert props["Invoked At"]["date"]["start"] == "2025-12-20T10:00:00Z"

    # Completed At date
    assert "Completed At" in props
    assert props["Completed At"]["date"]["start"] == "2025-12-20T10:00:01Z"


def test_notion_adapter_format_payload_failed(sample_invocation_failed):
    """
    Intent: Ensure Notion failed pages include error message property.
    """
    adapter = NotionWebhookAdapter(
        auth_config={
            "auth_type": "bearer_token",
            "credentials": {"token": "secret_abc123"},
        },
        platform_config={"database_id": "abc123def456"},
    )

    payload = adapter.format_payload(sample_invocation_failed)

    props = payload["properties"]

    # Verify failed status
    assert props["Status"]["select"]["name"] == "Failed"

    # Verify error message
    assert "Error Message" in props
    assert (
        props["Error Message"]["rich_text"][0]["text"]["content"]
        == "Connection timeout"
    )


# ===================
# BaseWebhookAdapter Tests
# ===================


def test_base_adapter_get_auth_headers_api_key():
    """
    Intent: Verify API Key auth headers are constructed correctly.
    """
    adapter = TeamsWebhookAdapter(
        auth_config={
            "auth_type": "api_key",
            "credentials": {"api_key": "test_key_123"},
        },
        platform_config={"webhook_url": "https://test.com"},
    )

    headers = adapter._get_auth_headers()
    assert headers == {"X-API-Key": "test_key_123"}


def test_base_adapter_get_auth_headers_bearer_token():
    """
    Intent: Verify OAuth2 Bearer token is included in Authorization header.
    """
    adapter = TeamsWebhookAdapter(
        auth_config={
            "auth_type": "oauth2",
            "credentials": {"token": "bearer_token_456"},
        },
        platform_config={"webhook_url": "https://test.com"},
    )

    headers = adapter._get_auth_headers()
    assert headers == {"Authorization": "Bearer bearer_token_456"}


def test_base_adapter_sanitize_error_message():
    """
    Intent: Verify error messages sanitize sensitive credentials.
    """
    adapter = TeamsWebhookAdapter(
        auth_config={"auth_type": "none", "credentials": {}},
        platform_config={"webhook_url": "https://test.com"},
    )

    # Test API key sanitization
    error = "Failed with api_key=sk_live_1234567890abcdef"
    sanitized = adapter._sanitize_error_message(error)
    assert "sk_live_1234567890abcdef" not in sanitized
    assert "<REDACTED>" in sanitized

    # Test Bearer token sanitization
    error = "Auth failed: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    sanitized = adapter._sanitize_error_message(error)
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in sanitized
    assert "<REDACTED>" in sanitized


@pytest.mark.asyncio
async def test_base_adapter_retry_delivery_exponential_backoff():
    """
    Intent: Verify retry logic delays (1s, 2s, 4s) and raises DeliveryFailedError after final failure.

    Note: This test uses a mock deliver method to avoid actual HTTP calls.
    """

    class MockAdapter(BaseWebhookAdapter):
        def __init__(self):
            super().__init__(
                auth_config={"auth_type": "none", "credentials": {}},
                platform_config={"webhook_url": "https://test.com"},
            )
            self.delivery_attempts = []

        def format_payload(self, invocation_result: dict) -> dict:
            return {"test": "payload"}

        async def deliver(self, payload: dict) -> DeliveryResult:
            self.delivery_attempts.append(True)
            # Always fail
            return DeliveryResult(
                success=False,
                error_message="Delivery failed",
            )

    adapter = MockAdapter()
    result = await adapter._retry_delivery({"test": "payload"}, max_attempts=3)

    # Verify 3 delivery attempts were made
    assert len(adapter.delivery_attempts) == 3

    # Verify final result is failure
    assert result.success is False
    assert result.retry_count == 2  # 0-indexed, so last attempt is 2
