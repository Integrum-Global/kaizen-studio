"""
Webhook Platform Adapters

Platform-specific webhook adapters for transforming External Agent invocation
results into platform-native formats (Teams Adaptive Cards, Discord embeds,
Slack Block Kit, Telegram messages, Notion database entries).
"""

from studio.adapters.base_webhook import BaseWebhookAdapter, DeliveryResult
from studio.adapters.discord_adapter import DiscordWebhookAdapter
from studio.adapters.notion_adapter import NotionWebhookAdapter
from studio.adapters.slack_adapter import SlackWebhookAdapter
from studio.adapters.teams_adapter import TeamsWebhookAdapter
from studio.adapters.telegram_adapter import TelegramWebhookAdapter

__all__ = [
    "BaseWebhookAdapter",
    "DeliveryResult",
    "TeamsWebhookAdapter",
    "DiscordWebhookAdapter",
    "SlackWebhookAdapter",
    "TelegramWebhookAdapter",
    "NotionWebhookAdapter",
]
