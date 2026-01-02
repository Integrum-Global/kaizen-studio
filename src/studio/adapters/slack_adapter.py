"""
Slack Webhook Adapter

Transforms External Agent invocation results into Slack Block Kit format.
Reference: https://api.slack.com/messaging/webhooks
"""

from studio.adapters.base_webhook import BaseWebhookAdapter, DeliveryResult


class SlackWebhookAdapter(BaseWebhookAdapter):
    """
    Slack webhook adapter using Block Kit format.

    Block Kit Features:
    - Structured blocks (header, section, divider, context)
    - Rich text formatting with mrkdwn
    - Action buttons and interactive elements
    - Accessory images and thumbnails

    Rate Limits:
    - Incoming webhooks: 1 request/second per webhook URL
    - Burst allowance available
    - HTTP 429 response on rate limit
    """

    # Block Kit emoji indicators
    STATUS_EMOJI = {
        "success": ":white_check_mark:",
        "failed": ":x:",
        "pending": ":hourglass_flowing_sand:",
    }

    def format_payload(self, invocation_result: dict) -> dict:
        """
        Format invocation result as Slack Block Kit.

        Args:
            invocation_result: ExternalAgentInvocation record

        Returns:
            Slack webhook payload with blocks

        Block Structure:
        - Header: "External Agent Invocation"
        - Section: Status summary with emoji
        - Divider
        - Section: Details (Agent ID, Invocation ID, etc.)
        - Context: Timestamps and metadata
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
        status_emoji = self.STATUS_EMOJI.get(status, ":grey_question:")

        # Build blocks
        blocks = []

        # Header block
        blocks.append(
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "External Agent Invocation",
                    "emoji": True,
                },
            }
        )

        # Status section
        if status == "success":
            status_text = f"{status_emoji} *Agent invocation completed successfully*"
        elif status == "failed":
            status_text = f"{status_emoji} *Agent invocation failed*\n>{error_message}"
        else:
            status_text = f"{status_emoji} *Agent invocation pending*"

        blocks.append(
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": status_text,
                },
            }
        )

        # Divider
        blocks.append({"type": "divider"})

        # Details section
        details_text = (
            f"*Agent ID:* {external_agent_id}\n"
            f"*Invocation ID:* {invocation_id}\n"
            f"*Status:* {status.upper()}\n"
            f"*Execution Time:* {execution_time_ms}ms\n"
            f"*Invoked At:* {invoked_at}"
        )

        if completed_at:
            details_text += f"\n*Completed At:* {completed_at}"

        blocks.append(
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": details_text,
                },
            }
        )

        # Add action button if studio URL is configured
        studio_base_url = self.platform_config.get(
            "studio_base_url", "https://kaizen.studio"
        )
        if studio_base_url:
            blocks.append(
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "View Invocation",
                                "emoji": True,
                            },
                            "url": f"{studio_base_url}/external-agents/invocations/{invocation_id}",
                            "action_id": "view_invocation",
                        }
                    ],
                }
            )

        # Context block (footer)
        blocks.append(
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "Kaizen Studio • External Agent Governance",
                    }
                ],
            }
        )

        # Build webhook payload
        payload = {
            "blocks": blocks,
            "text": f"External Agent Invocation {status.upper()}",  # Fallback text
        }

        return payload

    async def deliver(self, payload: dict) -> DeliveryResult:
        """
        Deliver Block Kit message to Slack webhook URL.

        Args:
            payload: Slack webhook payload with blocks

        Returns:
            DeliveryResult with delivery status
        """
        webhook_url = self.platform_config.get("webhook_url", "")
        if not webhook_url:
            return DeliveryResult(
                success=False,
                error_message="webhook_url not configured in platform_config",
            )

        # Slack webhooks use standard POST with JSON
        headers = {
            "Content-Type": "application/json",
        }

        return await self._execute_http_delivery(
            url=webhook_url,
            payload=payload,
            headers=headers,
            method="POST",
            timeout=30.0,
        )
