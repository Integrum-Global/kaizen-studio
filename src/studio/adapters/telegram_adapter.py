"""
Telegram Bot API Adapter

Transforms External Agent invocation results into Telegram bot messages with MarkdownV2.
Reference: https://core.telegram.org/bots/api
"""

from studio.adapters.base_webhook import BaseWebhookAdapter, DeliveryResult


class TelegramWebhookAdapter(BaseWebhookAdapter):
    """
    Telegram Bot API adapter using sendMessage endpoint.

    Telegram Bot Features:
    - MarkdownV2 formatting (bold, italic, code, links)
    - Inline keyboard buttons for actions
    - Rich messages with emojis
    - Chat-based delivery (requires chat_id)

    Rate Limits:
    - Global: 30 messages/second across all chats
    - Per-chat (groups): 20 messages/minute
    - HTTP 429 response includes retry_after field

    Note:
    Telegram uses Bot API instead of traditional webhooks.
    Requires bot_token and chat_id in platform_config.
    """

    # Status emojis
    STATUS_EMOJI = {
        "success": "✅",
        "failed": "❌",
        "pending": "⏳",
    }

    def format_payload(self, invocation_result: dict) -> dict:
        """
        Format invocation result as Telegram message with MarkdownV2.

        Args:
            invocation_result: ExternalAgentInvocation record

        Returns:
            Telegram sendMessage payload

        Message Structure:
        - Emoji indicator (✅/❌/⏳)
        - Bold title: "External Agent Invocation"
        - Details: Agent ID, Invocation ID, Status, etc.
        - Inline keyboard: "View Invocation" button
        """
        # Extract key fields
        invocation_id = invocation_result.get("id", "")
        external_agent_id = invocation_result.get("external_agent_id", "")
        status = invocation_result.get("status", "pending")
        execution_time_ms = invocation_result.get("execution_time_ms", 0)
        error_message = invocation_result.get("error_message", "")
        invoked_at = invocation_result.get("invoked_at", "")
        completed_at = invocation_result.get("completed_at", "")

        # Get status emoji
        status_emoji = self.STATUS_EMOJI.get(status, "❓")

        # Build message text with MarkdownV2 escaping
        text_parts = [
            f"{status_emoji} *External Agent Invocation*\n",
        ]

        # Add status summary
        if status == "success":
            text_parts.append("Status: *SUCCESS* ✓\n")
        elif status == "failed":
            text_parts.append("Status: *FAILED* ✗\n")
            if error_message:
                text_parts.append(f"Error: {self._escape_markdown_v2(error_message)}\n")
        else:
            text_parts.append("Status: *PENDING*\n")

        # Add details
        text_parts.append(
            f"\n*Agent ID:* {self._escape_markdown_v2(external_agent_id)}"
        )
        text_parts.append(
            f"\n*Invocation ID:* {self._escape_markdown_v2(invocation_id)}"
        )
        text_parts.append(f"\n*Execution Time:* {execution_time_ms}ms")
        text_parts.append(f"\n*Invoked At:* {self._escape_markdown_v2(invoked_at)}")

        if completed_at:
            text_parts.append(
                f"\n*Completed At:* {self._escape_markdown_v2(completed_at)}"
            )

        text = "".join(text_parts)

        # Build inline keyboard
        inline_keyboard = []
        studio_base_url = self.platform_config.get(
            "studio_base_url", "https://kaizen.studio"
        )
        if studio_base_url:
            inline_keyboard.append(
                [
                    {
                        "text": "View Invocation",
                        "url": f"{studio_base_url}/external-agents/invocations/{invocation_id}",
                    }
                ]
            )

        # Build payload
        payload = {
            "text": text,
            "parse_mode": "MarkdownV2",
            "disable_web_page_preview": False,
        }

        if inline_keyboard:
            payload["reply_markup"] = {"inline_keyboard": inline_keyboard}

        return payload

    async def deliver(self, payload: dict) -> DeliveryResult:
        """
        Deliver message to Telegram Bot API.

        Args:
            payload: Telegram sendMessage payload

        Returns:
            DeliveryResult with delivery status

        Note:
            Requires bot_token and chat_id in platform_config.
            URL format: https://api.telegram.org/bot{token}/sendMessage
        """
        bot_token = self.platform_config.get("bot_token", "")
        chat_id = self.platform_config.get("chat_id", "")

        if not bot_token:
            return DeliveryResult(
                success=False,
                error_message="bot_token not configured in platform_config",
            )

        if not chat_id:
            return DeliveryResult(
                success=False,
                error_message="chat_id not configured in platform_config",
            )

        # Build Telegram API URL
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

        # Add chat_id to payload
        payload["chat_id"] = chat_id

        # Telegram API uses standard POST with JSON
        headers = {
            "Content-Type": "application/json",
        }

        return await self._execute_http_delivery(
            url=url,
            payload=payload,
            headers=headers,
            method="POST",
            timeout=30.0,
        )

    def _escape_markdown_v2(self, text: str) -> str:
        """
        Escape special characters for Telegram MarkdownV2.

        Characters to escape:
        _ * [ ] ( ) ~ ` > # + - = | { } . !

        Args:
            text: Raw text

        Returns:
            Escaped text for MarkdownV2
        """
        escape_chars = r"_*[]()~`>#+-=|{}.!"
        return "".join(f"\\{char}" if char in escape_chars else char for char in text)
