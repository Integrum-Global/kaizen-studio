"""
Discord Webhook Adapter

Transforms External Agent invocation results into Discord embed format.
Reference: https://discord.com/developers/docs/resources/webhook
"""

from studio.adapters.base_webhook import BaseWebhookAdapter, DeliveryResult


class DiscordWebhookAdapter(BaseWebhookAdapter):
    """
    Discord webhook adapter using embed format.

    Discord Embed Features:
    - Rich embeds with colors, fields, timestamps, and footers
    - Up to 25 fields per embed
    - Inline field support for compact layouts
    - Avatar and username customization

    Rate Limits:
    - Per-webhook: 5 requests/2 seconds (30 requests/minute)
    - Burst allowance: 5 requests immediately
    - Response headers: X-RateLimit-Limit, X-RateLimit-Remaining
    """

    # Embed colors (decimal RGB)
    EMBED_COLORS = {
        "success": 65280,  # Green (#00FF00)
        "failed": 16711680,  # Red (#FF0000)
        "pending": 16776960,  # Yellow (#FFFF00)
    }

    def format_payload(self, invocation_result: dict) -> dict:
        """
        Format invocation result as Discord embed.

        Args:
            invocation_result: ExternalAgentInvocation record

        Returns:
            Discord webhook payload with embed

        Embed Structure:
        - Title: "External Agent Invocation"
        - Description: Status summary
        - Color: Based on status (green/red/yellow)
        - Fields: Agent ID, Invocation ID, Execution Time, etc.
        - Footer: Kaizen Studio branding
        - Timestamp: Completion timestamp
        """
        # Extract key fields
        invocation_id = invocation_result.get("id", "")
        external_agent_id = invocation_result.get("external_agent_id", "")
        status = invocation_result.get("status", "pending")
        execution_time_ms = invocation_result.get("execution_time_ms", 0)
        error_message = invocation_result.get("error_message", "")
        invoked_at = invocation_result.get("invoked_at", "")
        completed_at = invocation_result.get("completed_at", "")

        # Determine embed color
        color = self.EMBED_COLORS.get(status, self.EMBED_COLORS["pending"])

        # Build description
        if status == "success":
            description = "✅ Agent invocation completed successfully"
        elif status == "failed":
            description = f"❌ Agent invocation failed: {error_message}"
        else:
            description = "⏳ Agent invocation pending"

        # Build fields
        fields = [
            {
                "name": "Agent ID",
                "value": external_agent_id,
                "inline": True,
            },
            {
                "name": "Invocation ID",
                "value": invocation_id,
                "inline": True,
            },
            {
                "name": "Status",
                "value": status.upper(),
                "inline": True,
            },
            {
                "name": "Execution Time",
                "value": f"{execution_time_ms}ms",
                "inline": True,
            },
            {
                "name": "Invoked At",
                "value": invoked_at,
                "inline": False,
            },
        ]

        if completed_at:
            fields.append(
                {
                    "name": "Completed At",
                    "value": completed_at,
                    "inline": False,
                }
            )

        # Limit fields to 25 (Discord max)
        fields = fields[:25]

        # Build embed
        embed = {
            "title": "External Agent Invocation",
            "description": description,
            "color": color,
            "fields": fields,
            "footer": {
                "text": "Kaizen Studio",
                "icon_url": self.platform_config.get(
                    "footer_icon_url",
                    "https://kaizen.studio/icon.png",
                ),
            },
            "timestamp": completed_at or invoked_at,
        }

        # Add URL if studio base URL is configured
        studio_base_url = self.platform_config.get(
            "studio_base_url", "https://kaizen.studio"
        )
        if studio_base_url:
            embed["url"] = (
                f"{studio_base_url}/external-agents/invocations/{invocation_id}"
            )

        # Build webhook payload
        payload = {
            "username": self.platform_config.get("username", "Kaizen Studio"),
            "avatar_url": self.platform_config.get(
                "avatar_url",
                "https://kaizen.studio/logo.png",
            ),
            "embeds": [embed],
        }

        return payload

    async def deliver(self, payload: dict) -> DeliveryResult:
        """
        Deliver embed to Discord webhook URL.

        Args:
            payload: Discord webhook payload with embeds

        Returns:
            DeliveryResult with delivery status
        """
        webhook_url = self.platform_config.get("webhook_url", "")
        if not webhook_url:
            return DeliveryResult(
                success=False,
                error_message="webhook_url not configured in platform_config",
            )

        # Discord webhooks use standard POST with JSON
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
