"""
Microsoft Teams Webhook Adapter

Transforms External Agent invocation results into Teams Adaptive Card format.
Reference: https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook
"""

import json

from studio.adapters.base_webhook import BaseWebhookAdapter, DeliveryResult


class TeamsWebhookAdapter(BaseWebhookAdapter):
    """
    Microsoft Teams webhook adapter using Adaptive Card format.

    Adaptive Card Schema v1.5:
    - Rich visual cards with facts, images, and action buttons
    - Theme colors for different event types
    - OpenUri and HttpPOST actions for interactivity

    Rate Limits:
    - Best practice: 1 request/second per webhook URL
    - No official limit, but avoid bursts
    """

    # Theme colors for Adaptive Cards
    THEME_COLORS = {
        "success": "0076D7",  # Blue
        "failed": "D13438",  # Red
        "pending": "FFB900",  # Yellow
    }

    def format_payload(self, invocation_result: dict) -> dict:
        """
        Format invocation result as Teams Adaptive Card.

        Args:
            invocation_result: ExternalAgentInvocation record

        Returns:
            Adaptive Card JSON payload

        Card Structure:
        - Title: "Agent Invocation Result"
        - Facts: Agent ID, Status, Execution Time, etc.
        - Actions: View Invocation (OpenUri)
        """
        # Extract key fields
        invocation_id = invocation_result.get("id", "")
        external_agent_id = invocation_result.get("external_agent_id", "")
        status = invocation_result.get("status", "pending")
        execution_time_ms = invocation_result.get("execution_time_ms", 0)
        error_message = invocation_result.get("error_message", "")
        invoked_at = invocation_result.get("invoked_at", "")
        completed_at = invocation_result.get("completed_at", "")

        # Parse request/response payloads
        request_payload = self._parse_json_field(
            invocation_result.get("request_payload", "{}")
        )
        response_payload = self._parse_json_field(
            invocation_result.get("response_payload", "{}")
        )

        # Determine theme color
        theme_color = self.THEME_COLORS.get(status, self.THEME_COLORS["pending"])

        # Build facts list
        facts = [
            {"name": "Agent ID", "value": external_agent_id},
            {"name": "Invocation ID", "value": invocation_id},
            {"name": "Status", "value": status.upper()},
            {"name": "Execution Time", "value": f"{execution_time_ms}ms"},
            {"name": "Invoked At", "value": invoked_at},
        ]

        if completed_at:
            facts.append({"name": "Completed At", "value": completed_at})

        if error_message:
            facts.append({"name": "Error", "value": error_message})

        # Build action buttons
        actions = []
        webhook_url = self.platform_config.get("webhook_url", "")

        # Add "View Invocation" button if studio URL is configured
        studio_base_url = self.platform_config.get(
            "studio_base_url", "https://kaizen.studio"
        )
        if studio_base_url:
            actions.append(
                {
                    "@type": "OpenUri",
                    "name": "View Invocation",
                    "targets": [
                        {
                            "os": "default",
                            "uri": f"{studio_base_url}/external-agents/invocations/{invocation_id}",
                        }
                    ],
                }
            )

        # Build Adaptive Card
        card = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": theme_color,
            "summary": f"Agent Invocation {status.upper()}",
            "sections": [
                {
                    "activityTitle": "External Agent Invocation",
                    "activitySubtitle": f"Status: {status.upper()}",
                    "activityImage": self.platform_config.get(
                        "icon_url",
                        "https://kaizen.studio/icons/external-agent.png",
                    ),
                    "facts": facts,
                    "markdown": True,
                }
            ],
        }

        # Add actions if available
        if actions:
            card["potentialAction"] = actions

        return card

    async def deliver(self, payload: dict) -> DeliveryResult:
        """
        Deliver Adaptive Card to Teams webhook URL.

        Args:
            payload: Adaptive Card JSON

        Returns:
            DeliveryResult with delivery status
        """
        webhook_url = self.platform_config.get("webhook_url", "")
        if not webhook_url:
            return DeliveryResult(
                success=False,
                error_message="webhook_url not configured in platform_config",
            )

        # Teams webhooks use standard POST with JSON
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

    def _parse_json_field(self, json_string: str) -> dict:
        """Parse JSON string field, return empty dict if invalid."""
        try:
            return json.loads(json_string) if json_string else {}
        except json.JSONDecodeError:
            return {}
