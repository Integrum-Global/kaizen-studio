# Webhook Platform Adapters - Technical Plan

## Executive Summary

Extend Kaizen Studio's existing WebhookService to support platform-specific message formats for Microsoft Teams, Discord, and Telegram. This enhancement transforms generic HTTP POST notifications into rich, interactive messages tailored to each platform's capabilities.

**Current State**: Generic HTTP POST with HMAC signing
**Target State**: Platform-aware adapters with rich formatting, action buttons, and optimal user experience

## 1. Current State Analysis

### Existing Architecture

#### WebhookService (`src/studio/services/webhook_service.py`)

**Core Capabilities**:
- Generic HTTP POST delivery with HMAC-SHA256 signing
- Automatic retry with exponential backoff (0s, 60s, 300s)
- Delivery history tracking via DataFlow
- Event subscription management

**Current Flow**:
```python
# Generic payload structure (lines 376-382)
payload_dict = {
    "id": f"evt_{uuid.uuid4().hex[:12]}",
    "type": event_type,
    "organization_id": organization_id,
    "data": data,
    "created_at": now,
}
```

**Delivery Headers** (lines 418-425):
```python
headers={
    "Content-Type": "application/json",
    "X-Webhook-Signature": signature,
    "X-Webhook-Timestamp": str(timestamp),
}
```

#### Supported Event Types (lines 21-33)
```python
WEBHOOK_EVENTS = [
    "agent.created",
    "agent.updated",
    "agent.deleted",
    "deployment.created",
    "deployment.active",
    "deployment.failed",
    "deployment.stopped",
    "pipeline.created",
    "pipeline.updated",
    "user.invited",
    "user.joined",
]
```

#### Data Models

**Webhook Model** (`src/studio/models/webhook.py`):
```python
@db.model
class Webhook:
    id: str
    organization_id: str
    name: str
    url: str
    secret: str
    events: str  # JSON array of event types
    status: str  # active, inactive
    last_triggered_at: Optional[str]
    failure_count: int
    created_by: str
    created_at: str
    updated_at: Optional[str]
```

**WebhookDelivery Model** (`src/studio/models/webhook_delivery.py`):
```python
@db.model
class WebhookDelivery:
    id: str
    webhook_id: str
    event_type: str
    payload: str  # JSON payload sent
    response_status: Optional[int]
    response_body: Optional[str]
    duration_ms: Optional[int]
    status: str  # pending, success, failed
    attempt_count: int
    created_at: str
```

### Current Limitations

1. **No Platform Awareness**: Single JSON format for all destinations
2. **No Rich Formatting**: Plain JSON lacks visual hierarchy and interactivity
3. **No Action Buttons**: Cannot embed approval/deployment controls
4. **No Platform Validation**: URL format not validated per platform
5. **No Encrypted Config Storage**: Platform-specific credentials stored in plain text

---

## 2. Platform Requirements

### 2.1 Microsoft Teams

#### Incoming Webhook URL Format
```
https://[org].webhook.office.com/webhookb2/[guid]@[tenant]/IncomingWebhook/[webhook-id]/[unique-id]
```

**URL Pattern**: `/^https:\/\/[^\.]+\.webhook\.office\.com\/webhookb2\//`

#### Message Card Schema (Adaptive Cards)

**Basic Structure**:
```json
{
  "@type": "MessageCard",
  "@context": "http://schema.org/extensions",
  "themeColor": "0076D7",
  "summary": "Deployment Status",
  "sections": [{
    "activityTitle": "Production Deployment Active",
    "activitySubtitle": "Agent: customer-support-v2",
    "activityImage": "https://kaizen.studio/icons/deployment.png",
    "facts": [
      {"name": "Environment", "value": "production"},
      {"name": "Version", "value": "v2.3.1"},
      {"name": "Started At", "value": "2025-12-20T14:30:00Z"}
    ],
    "markdown": true
  }],
  "potentialAction": [
    {
      "@type": "OpenUri",
      "name": "View Deployment",
      "targets": [
        {"os": "default", "uri": "https://kaizen.studio/deployments/abc123"}
      ]
    },
    {
      "@type": "HttpPOST",
      "name": "Stop Deployment",
      "target": "https://api.kaizen.studio/deployments/abc123/stop"
    }
  ]
}
```

#### Color Codes by Event Type
```python
TEAMS_COLORS = {
    "deployment.active": "0076D7",      # Blue - success
    "deployment.failed": "D13438",      # Red - error
    "deployment.stopped": "FFB900",     # Yellow - warning
    "agent.created": "00CC6A",          # Green - creation
    "agent.updated": "0078D4",          # Blue - update
    "agent.deleted": "8764B8",          # Purple - deletion
    "pipeline.created": "00CC6A",       # Green
    "pipeline.updated": "0078D4",       # Blue
    "user.invited": "0076D7",           # Blue
    "user.joined": "00CC6A",            # Green
}
```

#### Rate Limits
- **No official limit** for incoming webhooks
- **Best Practice**: 1 request/second per webhook URL
- **Recommended**: Batch multiple events if possible

---

### 2.2 Discord

#### Webhook URL Format
```
https://discord.com/api/webhooks/[webhook-id]/[webhook-token]
https://discordapp.com/api/webhooks/[webhook-id]/[webhook-token]
```

**URL Pattern**: `/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\//`

#### Embed Object Structure

**Basic Structure**:
```json
{
  "username": "Kaizen Studio",
  "avatar_url": "https://kaizen.studio/logo.png",
  "embeds": [{
    "title": "Production Deployment Active",
    "description": "Agent **customer-support-v2** deployed to production",
    "color": 65280,
    "timestamp": "2025-12-20T14:30:00.000Z",
    "footer": {
      "text": "Kaizen Studio",
      "icon_url": "https://kaizen.studio/icon.png"
    },
    "fields": [
      {
        "name": "Environment",
        "value": "production",
        "inline": true
      },
      {
        "name": "Version",
        "value": "v2.3.1",
        "inline": true
      },
      {
        "name": "Started At",
        "value": "<t:1734705000:R>",
        "inline": false
      }
    ]
  }]
}
```

#### Color Codes (Decimal RGB)
```python
DISCORD_COLORS = {
    "deployment.active": 65280,         # Green (#00FF00)
    "deployment.failed": 16711680,      # Red (#FF0000)
    "deployment.stopped": 16776960,     # Yellow (#FFFF00)
    "agent.created": 65280,             # Green
    "agent.updated": 255,               # Blue (#0000FF)
    "agent.deleted": 8421504,           # Gray (#808080)
    "pipeline.created": 65280,          # Green
    "pipeline.updated": 255,            # Blue
    "user.invited": 16776960,           # Yellow
    "user.joined": 65280,               # Green
}
```

#### Rate Limits
- **Global Limit**: 50 requests/second per application
- **Per-Webhook Limit**: 5 requests/2 seconds (30 req/min per webhook)
- **Burst Allowance**: 5 requests immediately, then rate-limited
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Mitigation Strategy**: Queue webhooks and throttle to 2 req/second per webhook URL

---

### 2.3 Telegram

#### Bot API vs Webhook

**Telegram uses Bot API, not traditional webhooks**:

1. **Bot Token Format**: `123456789:ABCdefGhIjklmnopqrstuvwxyz`
2. **Endpoint**: `https://api.telegram.org/bot{token}/sendMessage`
3. **Chat ID**: Required to identify recipient (user/group/channel)

#### Bot Token Management

**Security Requirements**:
- Store bot token encrypted in database
- Validate token format: `/^\d{8,10}:[A-Za-z0-9_-]{35}$/`
- Support token rotation without webhook recreation

#### Configuration Structure
```json
{
  "bot_token": "123456789:ABCdefGhIjklmnopqrstuvwxyz",
  "chat_id": "-1001234567890",
  "parse_mode": "MarkdownV2"
}
```

#### Message Format (MarkdownV2)

**Basic Structure**:
```json
{
  "chat_id": "-1001234567890",
  "text": "*Production Deployment Active*\n\n*Agent:* customer\\-support\\-v2\n*Environment:* production\n*Version:* v2\\.3\\.1\n*Started At:* 2025\\-12\\-20T14:30:00Z",
  "parse_mode": "MarkdownV2",
  "disable_web_page_preview": false,
  "reply_markup": {
    "inline_keyboard": [
      [
        {
          "text": "View Deployment",
          "url": "https://kaizen.studio/deployments/abc123"
        },
        {
          "text": "Stop Deployment",
          "callback_data": "stop_deployment_abc123"
        }
      ]
    ]
  }
}
```

#### Character Escaping (MarkdownV2)
Must escape: `_`, `*`, `[`, `]`, `(`, `)`, `~`, `` ` ``, `>`, `#`, `+`, `-`, `=`, `|`, `{`, `}`, `.`, `!`

```python
def escape_markdown_v2(text: str) -> str:
    """Escape special characters for Telegram MarkdownV2."""
    escape_chars = r'_*[]()~`>#+-=|{}.!'
    return ''.join(f'\\{char}' if char in escape_chars else char for char in text)
```

#### Rate Limits
- **Global Limit**: 30 messages/second across all chats
- **Per-Chat Limit**:
  - Groups: 20 messages/minute
  - Private chats: No specific limit (use 30/sec global)
- **HTTP 429 Response**: Includes `retry_after` field (seconds)

**Mitigation Strategy**: Implement per-chat queue with 1 message/3 seconds

---

## 3. Adapter Pattern Design

### 3.1 Base Adapter Interface

```python
# src/studio/services/webhook_adapters/base.py

from abc import ABC, abstractmethod
from typing import Any, Optional
from dataclasses import dataclass


@dataclass
class AdapterConfig:
    """Base configuration for platform adapters."""
    url: str
    platform_config: dict[str, Any]  # Platform-specific encrypted config


@dataclass
class AdapterResponse:
    """Standardized response from adapter delivery."""
    success: bool
    status_code: int
    response_body: str
    duration_ms: int
    error_message: Optional[str] = None


class WebhookAdapter(ABC):
    """
    Base adapter for platform-specific webhook transformations.

    All platform adapters must implement:
    1. validate_url() - Validate platform URL format
    2. transform_payload() - Convert generic event to platform format
    3. get_headers() - Generate platform-specific headers
    4. should_retry() - Determine retry eligibility based on error
    5. get_rate_limit() - Return rate limit for throttling
    """

    @abstractmethod
    def validate_url(self, url: str) -> tuple[bool, str]:
        """
        Validate webhook URL format.

        Args:
            url: Webhook target URL

        Returns:
            (is_valid, error_message)
        """
        pass

    @abstractmethod
    def transform_payload(
        self,
        event_type: str,
        data: dict,
        organization_id: str,
        timestamp: str,
    ) -> dict:
        """
        Transform generic event into platform-specific payload.

        Args:
            event_type: Kaizen event type (e.g., "deployment.active")
            data: Event data dictionary
            organization_id: Organization ID
            timestamp: Event timestamp (ISO 8601)

        Returns:
            Platform-specific payload dictionary
        """
        pass

    @abstractmethod
    def get_headers(self, config: AdapterConfig) -> dict[str, str]:
        """
        Generate platform-specific HTTP headers.

        Args:
            config: Adapter configuration

        Returns:
            Dictionary of HTTP headers
        """
        pass

    @abstractmethod
    def should_retry(self, status_code: int, response_body: str) -> bool:
        """
        Determine if failed delivery should be retried.

        Args:
            status_code: HTTP response status code
            response_body: Response body text

        Returns:
            True if retry is recommended
        """
        pass

    @abstractmethod
    def get_rate_limit(self) -> tuple[int, int]:
        """
        Get rate limit for this platform.

        Returns:
            (max_requests, time_window_seconds)
        """
        pass

    def validate_config(self, config: dict[str, Any]) -> tuple[bool, str]:
        """
        Validate platform-specific configuration.

        Args:
            config: Platform configuration dictionary

        Returns:
            (is_valid, error_message)
        """
        # Default implementation - override if platform needs validation
        return True, ""
```

---

### 3.2 Microsoft Teams Adapter

```python
# src/studio/services/webhook_adapters/teams.py

import re
from typing import Any

from studio.services.webhook_adapters.base import (
    WebhookAdapter,
    AdapterConfig,
)


class TeamsAdapter(WebhookAdapter):
    """Microsoft Teams Incoming Webhook adapter."""

    # Theme colors for different event types
    THEME_COLORS = {
        "deployment.active": "0076D7",      # Blue - success
        "deployment.failed": "D13438",      # Red - error
        "deployment.stopped": "FFB900",     # Yellow - warning
        "agent.created": "00CC6A",          # Green - creation
        "agent.updated": "0078D4",          # Blue - update
        "agent.deleted": "8764B8",          # Purple - deletion
        "pipeline.created": "00CC6A",       # Green
        "pipeline.updated": "0078D4",       # Blue
        "user.invited": "0076D7",           # Blue
        "user.joined": "00CC6A",            # Green
    }

    # Event titles and descriptions
    EVENT_TEMPLATES = {
        "deployment.active": {
            "title": "Deployment Active",
            "icon": "https://kaizen.studio/icons/deployment-active.png",
        },
        "deployment.failed": {
            "title": "Deployment Failed",
            "icon": "https://kaizen.studio/icons/deployment-failed.png",
        },
        "deployment.stopped": {
            "title": "Deployment Stopped",
            "icon": "https://kaizen.studio/icons/deployment-stopped.png",
        },
        "agent.created": {
            "title": "Agent Created",
            "icon": "https://kaizen.studio/icons/agent.png",
        },
        "agent.updated": {
            "title": "Agent Updated",
            "icon": "https://kaizen.studio/icons/agent.png",
        },
        "agent.deleted": {
            "title": "Agent Deleted",
            "icon": "https://kaizen.studio/icons/agent.png",
        },
        "pipeline.created": {
            "title": "Pipeline Created",
            "icon": "https://kaizen.studio/icons/pipeline.png",
        },
        "pipeline.updated": {
            "title": "Pipeline Updated",
            "icon": "https://kaizen.studio/icons/pipeline.png",
        },
        "user.invited": {
            "title": "User Invited",
            "icon": "https://kaizen.studio/icons/user.png",
        },
        "user.joined": {
            "title": "User Joined",
            "icon": "https://kaizen.studio/icons/user.png",
        },
    }

    def validate_url(self, url: str) -> tuple[bool, str]:
        """Validate Teams webhook URL format."""
        pattern = r'^https://[^\.]+\.webhook\.office\.com/webhookb2/'
        if not re.match(pattern, url):
            return False, "Invalid Teams webhook URL format"
        return True, ""

    def transform_payload(
        self,
        event_type: str,
        data: dict,
        organization_id: str,
        timestamp: str,
    ) -> dict:
        """Transform event into Teams MessageCard format."""
        template = self.EVENT_TEMPLATES.get(event_type, {
            "title": event_type.replace(".", " ").title(),
            "icon": "https://kaizen.studio/icons/default.png",
        })

        # Build facts list from event data
        facts = []
        for key, value in data.items():
            if key not in ["id", "organization_id"]:  # Skip internal fields
                facts.append({
                    "name": key.replace("_", " ").title(),
                    "value": str(value),
                })

        # Build action buttons
        actions = []
        if "deployment_id" in data:
            actions.append({
                "@type": "OpenUri",
                "name": "View Deployment",
                "targets": [{
                    "os": "default",
                    "uri": f"https://kaizen.studio/deployments/{data['deployment_id']}"
                }]
            })

            # Add stop action for active deployments
            if event_type == "deployment.active":
                actions.append({
                    "@type": "HttpPOST",
                    "name": "Stop Deployment",
                    "target": f"https://api.kaizen.studio/deployments/{data['deployment_id']}/stop"
                })

        if "agent_id" in data:
            actions.append({
                "@type": "OpenUri",
                "name": "View Agent",
                "targets": [{
                    "os": "default",
                    "uri": f"https://kaizen.studio/agents/{data['agent_id']}"
                }]
            })

        if "pipeline_id" in data:
            actions.append({
                "@type": "OpenUri",
                "name": "View Pipeline",
                "targets": [{
                    "os": "default",
                    "uri": f"https://kaizen.studio/pipelines/{data['pipeline_id']}"
                }]
            })

        # Build MessageCard
        return {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": self.THEME_COLORS.get(event_type, "0078D4"),
            "summary": template["title"],
            "sections": [{
                "activityTitle": template["title"],
                "activitySubtitle": f"Organization: {organization_id}",
                "activityImage": template["icon"],
                "facts": facts,
                "markdown": True,
            }],
            "potentialAction": actions if actions else None,
        }

    def get_headers(self, config: AdapterConfig) -> dict[str, str]:
        """Generate Teams-specific headers."""
        return {
            "Content-Type": "application/json",
        }

    def should_retry(self, status_code: int, response_body: str) -> bool:
        """Determine retry eligibility."""
        # Teams returns 4xx for client errors (don't retry)
        if 400 <= status_code < 500:
            return False
        # Retry on 5xx server errors and network errors
        return True

    def get_rate_limit(self) -> tuple[int, int]:
        """Get Teams rate limit."""
        # Conservative: 1 request per second
        return (1, 1)
```

---

### 3.3 Discord Adapter

```python
# src/studio/services/webhook_adapters/discord.py

import re
from datetime import datetime

from studio.services.webhook_adapters.base import WebhookAdapter, AdapterConfig


class DiscordAdapter(WebhookAdapter):
    """Discord Webhook adapter."""

    # Embed colors (decimal RGB)
    EMBED_COLORS = {
        "deployment.active": 65280,         # Green (#00FF00)
        "deployment.failed": 16711680,      # Red (#FF0000)
        "deployment.stopped": 16776960,     # Yellow (#FFFF00)
        "agent.created": 65280,             # Green
        "agent.updated": 255,               # Blue (#0000FF)
        "agent.deleted": 8421504,           # Gray (#808080)
        "pipeline.created": 65280,          # Green
        "pipeline.updated": 255,            # Blue
        "user.invited": 16776960,           # Yellow
        "user.joined": 65280,               # Green
    }

    EVENT_TITLES = {
        "deployment.active": "Deployment Active",
        "deployment.failed": "Deployment Failed",
        "deployment.stopped": "Deployment Stopped",
        "agent.created": "Agent Created",
        "agent.updated": "Agent Updated",
        "agent.deleted": "Agent Deleted",
        "pipeline.created": "Pipeline Created",
        "pipeline.updated": "Pipeline Updated",
        "user.invited": "User Invited",
        "user.joined": "User Joined",
    }

    def validate_url(self, url: str) -> tuple[bool, str]:
        """Validate Discord webhook URL format."""
        pattern = r'^https://(discord|discordapp)\.com/api/webhooks/\d+/'
        if not re.match(pattern, url):
            return False, "Invalid Discord webhook URL format"
        return True, ""

    def transform_payload(
        self,
        event_type: str,
        data: dict,
        organization_id: str,
        timestamp: str,
    ) -> dict:
        """Transform event into Discord embed format."""
        title = self.EVENT_TITLES.get(
            event_type,
            event_type.replace(".", " ").title()
        )

        # Build description from key data
        description_parts = []
        if "name" in data:
            description_parts.append(f"**{data['name']}**")
        if "status" in data:
            description_parts.append(f"Status: {data['status']}")

        description = "\n".join(description_parts) if description_parts else title

        # Build fields list
        fields = []
        for key, value in data.items():
            if key not in ["id", "organization_id", "name", "status"]:
                fields.append({
                    "name": key.replace("_", " ").title(),
                    "value": str(value),
                    "inline": True,
                })

        # Limit fields to 25 (Discord max)
        fields = fields[:25]

        # Build embed
        embed = {
            "title": title,
            "description": description,
            "color": self.EMBED_COLORS.get(event_type, 255),
            "timestamp": timestamp,
            "footer": {
                "text": "Kaizen Studio",
                "icon_url": "https://kaizen.studio/icon.png",
            },
            "fields": fields,
        }

        # Add URL if available
        if "deployment_id" in data:
            embed["url"] = f"https://kaizen.studio/deployments/{data['deployment_id']}"
        elif "agent_id" in data:
            embed["url"] = f"https://kaizen.studio/agents/{data['agent_id']}"
        elif "pipeline_id" in data:
            embed["url"] = f"https://kaizen.studio/pipelines/{data['pipeline_id']}"

        return {
            "username": "Kaizen Studio",
            "avatar_url": "https://kaizen.studio/logo.png",
            "embeds": [embed],
        }

    def get_headers(self, config: AdapterConfig) -> dict[str, str]:
        """Generate Discord-specific headers."""
        return {
            "Content-Type": "application/json",
        }

    def should_retry(self, status_code: int, response_body: str) -> bool:
        """Determine retry eligibility."""
        # Don't retry rate limits (handle with throttling)
        if status_code == 429:
            return False
        # Don't retry client errors
        if 400 <= status_code < 500:
            return False
        # Retry server errors
        return True

    def get_rate_limit(self) -> tuple[int, int]:
        """Get Discord rate limit."""
        # Conservative: 2 requests per second (30/min limit)
        return (2, 1)
```

---

### 3.4 Telegram Adapter

```python
# src/studio/services/webhook_adapters/telegram.py

import re
from typing import Any

from studio.services.webhook_adapters.base import WebhookAdapter, AdapterConfig


class TelegramAdapter(WebhookAdapter):
    """Telegram Bot API adapter."""

    EVENT_EMOJIS = {
        "deployment.active": "🚀",
        "deployment.failed": "❌",
        "deployment.stopped": "⏸",
        "agent.created": "✨",
        "agent.updated": "🔄",
        "agent.deleted": "🗑",
        "pipeline.created": "➕",
        "pipeline.updated": "✏️",
        "user.invited": "📧",
        "user.joined": "👋",
    }

    EVENT_TITLES = {
        "deployment.active": "Deployment Active",
        "deployment.failed": "Deployment Failed",
        "deployment.stopped": "Deployment Stopped",
        "agent.created": "Agent Created",
        "agent.updated": "Agent Updated",
        "agent.deleted": "Agent Deleted",
        "pipeline.created": "Pipeline Created",
        "pipeline.updated": "Pipeline Updated",
        "user.invited": "User Invited",
        "user.joined": "User Joined",
    }

    def validate_url(self, url: str) -> tuple[bool, str]:
        """
        Telegram doesn't use webhooks - validate bot token format.
        URL should be stored as bot token in platform_config.
        """
        # URL field not used for Telegram
        return True, ""

    def validate_config(self, config: dict[str, Any]) -> tuple[bool, str]:
        """Validate Telegram bot configuration."""
        # Validate bot token format
        bot_token = config.get("bot_token", "")
        if not re.match(r'^\d{8,10}:[A-Za-z0-9_-]{35}$', bot_token):
            return False, "Invalid bot token format"

        # Validate chat ID
        chat_id = config.get("chat_id", "")
        if not chat_id:
            return False, "chat_id is required"

        return True, ""

    def transform_payload(
        self,
        event_type: str,
        data: dict,
        organization_id: str,
        timestamp: str,
    ) -> dict:
        """Transform event into Telegram message format."""
        emoji = self.EVENT_EMOJIS.get(event_type, "📢")
        title = self.EVENT_TITLES.get(
            event_type,
            event_type.replace(".", " ").title()
        )

        # Build message text with MarkdownV2 escaping
        text_parts = [f"{emoji} *{self._escape_md(title)}*\n"]

        # Add key fields
        for key, value in data.items():
            if key not in ["id", "organization_id"]:
                escaped_key = self._escape_md(key.replace("_", " ").title())
                escaped_value = self._escape_md(str(value))
                text_parts.append(f"*{escaped_key}:* {escaped_value}")

        text = "\n".join(text_parts)

        # Build inline keyboard with action buttons
        inline_keyboard = []

        if "deployment_id" in data:
            row = [
                {
                    "text": "View Deployment",
                    "url": f"https://kaizen.studio/deployments/{data['deployment_id']}"
                }
            ]
            # Add stop button for active deployments
            if event_type == "deployment.active":
                row.append({
                    "text": "Stop",
                    "callback_data": f"stop_deployment_{data['deployment_id']}"
                })
            inline_keyboard.append(row)

        if "agent_id" in data:
            inline_keyboard.append([
                {
                    "text": "View Agent",
                    "url": f"https://kaizen.studio/agents/{data['agent_id']}"
                }
            ])

        if "pipeline_id" in data:
            inline_keyboard.append([
                {
                    "text": "View Pipeline",
                    "url": f"https://kaizen.studio/pipelines/{data['pipeline_id']}"
                }
            ])

        payload = {
            "text": text,
            "parse_mode": "MarkdownV2",
            "disable_web_page_preview": False,
        }

        if inline_keyboard:
            payload["reply_markup"] = {
                "inline_keyboard": inline_keyboard
            }

        return payload

    def get_headers(self, config: AdapterConfig) -> dict[str, str]:
        """Generate Telegram-specific headers."""
        return {
            "Content-Type": "application/json",
        }

    def should_retry(self, status_code: int, response_body: str) -> bool:
        """Determine retry eligibility."""
        # Don't retry rate limits (429)
        if status_code == 429:
            return False
        # Don't retry client errors
        if 400 <= status_code < 500:
            return False
        # Retry server errors
        return True

    def get_rate_limit(self) -> tuple[int, int]:
        """Get Telegram rate limit."""
        # Conservative: 1 message per 3 seconds per chat
        return (1, 3)

    def _escape_md(self, text: str) -> str:
        """Escape special characters for MarkdownV2."""
        escape_chars = r'_*[]()~`>#+-=|{}.!'
        return ''.join(f'\\{char}' if char in escape_chars else char for char in text)

    def get_telegram_url(self, config: AdapterConfig) -> str:
        """Build Telegram API URL from bot token."""
        bot_token = config.platform_config.get("bot_token", "")
        return f"https://api.telegram.org/bot{bot_token}/sendMessage"
```

---

### 3.5 Adapter Registry

```python
# src/studio/services/webhook_adapters/__init__.py

from studio.services.webhook_adapters.base import (
    WebhookAdapter,
    AdapterConfig,
    AdapterResponse,
)
from studio.services.webhook_adapters.teams import TeamsAdapter
from studio.services.webhook_adapters.discord import DiscordAdapter
from studio.services.webhook_adapters.telegram import TelegramAdapter


# Platform adapter registry
ADAPTERS: dict[str, type[WebhookAdapter]] = {
    "generic": None,  # Use existing generic HTTP POST
    "teams": TeamsAdapter,
    "discord": DiscordAdapter,
    "telegram": TelegramAdapter,
}


def get_adapter(platform: str) -> WebhookAdapter | None:
    """
    Get adapter instance for platform.

    Args:
        platform: Platform name (generic, teams, discord, telegram)

    Returns:
        Adapter instance or None for generic
    """
    adapter_class = ADAPTERS.get(platform)
    if adapter_class is None:
        return None
    return adapter_class()


def validate_platform(platform: str) -> bool:
    """Check if platform is supported."""
    return platform in ADAPTERS


__all__ = [
    "WebhookAdapter",
    "AdapterConfig",
    "AdapterResponse",
    "TeamsAdapter",
    "DiscordAdapter",
    "TelegramAdapter",
    "ADAPTERS",
    "get_adapter",
    "validate_platform",
]
```

---

## 4. Data Model Extensions

### 4.1 Extended Webhook Model

```python
# src/studio/models/webhook.py (UPDATED)

from typing import Optional

from studio.models import db


@db.model
class Webhook:
    """
    Webhook model for event notification subscriptions.

    Attributes:
        id: Unique identifier
        organization_id: Organization this webhook belongs to
        name: Human-readable name for the webhook
        url: Target URL for webhook deliveries
        secret: Secret key for HMAC signature generation
        events: JSON array of subscribed event types
        status: Webhook status (active, inactive)
        platform: Platform type (generic, teams, discord, telegram)
        platform_config: Encrypted JSON config for platform-specific settings
        last_triggered_at: Last time the webhook was triggered
        failure_count: Consecutive failure count
        created_by: User ID who created the webhook
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    id: str
    organization_id: str
    name: str
    url: str
    secret: str
    events: str  # JSON array of event types
    status: str  # active, inactive
    platform: str  # NEW: generic, teams, discord, telegram
    platform_config: Optional[str]  # NEW: Encrypted JSON config
    last_triggered_at: Optional[str]
    failure_count: int
    created_by: str
    created_at: str
    updated_at: Optional[str]
```

### 4.2 Migration Script

```python
# src/studio/migrations/add_webhook_platform_fields.py

from dataflow import DataFlow
from studio.models import db


async def upgrade():
    """Add platform fields to webhook table."""
    # DataFlow auto-migration will detect schema changes
    # But we need to set default values for existing records

    workflow = WorkflowBuilder()
    workflow.add_node(
        "WebhookUpdateNode",
        "set_platform_defaults",
        {
            "filter": {},  # All records
            "fields": {
                "platform": "generic",
                "platform_config": None,
            },
        },
    )

    runtime = AsyncLocalRuntime()
    await runtime.execute_workflow_async(workflow.build(), inputs={})


async def downgrade():
    """Remove platform fields from webhook table."""
    # DataFlow doesn't support schema downgrades
    # Manual SQL required if needed
    pass
```

### 4.3 Platform Config Encryption

```python
# src/studio/services/encryption_service.py

import json
from cryptography.fernet import Fernet
from studio.config import get_settings


class EncryptionService:
    """Service for encrypting/decrypting platform config."""

    def __init__(self):
        settings = get_settings()
        # Use encryption key from environment
        # In production: ENCRYPTION_KEY should be from secrets manager
        key = settings.encryption_key.encode()
        self.cipher = Fernet(key)

    def encrypt_config(self, config: dict) -> str:
        """
        Encrypt platform config dictionary.

        Args:
            config: Platform config dictionary

        Returns:
            Encrypted JSON string
        """
        json_str = json.dumps(config)
        encrypted = self.cipher.encrypt(json_str.encode())
        return encrypted.decode()

    def decrypt_config(self, encrypted: str) -> dict:
        """
        Decrypt platform config string.

        Args:
            encrypted: Encrypted JSON string

        Returns:
            Decrypted config dictionary
        """
        decrypted = self.cipher.decrypt(encrypted.encode())
        return json.loads(decrypted.decode())
```

---

## 5. Event-to-Message Mapping

### 5.1 Event Data Structures

```python
# src/studio/services/webhook_service.py (ADDITIONS)

# Event data structure definitions
EVENT_DATA_SCHEMAS = {
    "deployment.active": {
        "deployment_id": "str",
        "name": "str",
        "environment": "str",
        "version": "str",
        "agent_id": "str",
        "agent_name": "str",
        "started_at": "datetime",
    },
    "deployment.failed": {
        "deployment_id": "str",
        "name": "str",
        "environment": "str",
        "error": "str",
        "agent_id": "str",
        "agent_name": "str",
        "failed_at": "datetime",
    },
    "deployment.stopped": {
        "deployment_id": "str",
        "name": "str",
        "environment": "str",
        "agent_id": "str",
        "agent_name": "str",
        "stopped_by": "str",
        "stopped_at": "datetime",
    },
    "agent.created": {
        "agent_id": "str",
        "name": "str",
        "description": "str",
        "created_by": "str",
    },
    "agent.updated": {
        "agent_id": "str",
        "name": "str",
        "changes": "list[str]",
        "updated_by": "str",
    },
    "agent.deleted": {
        "agent_id": "str",
        "name": "str",
        "deleted_by": "str",
    },
    "pipeline.created": {
        "pipeline_id": "str",
        "name": "str",
        "description": "str",
        "created_by": "str",
    },
    "pipeline.updated": {
        "pipeline_id": "str",
        "name": "str",
        "changes": "list[str]",
        "updated_by": "str",
    },
    "user.invited": {
        "email": "str",
        "role": "str",
        "invited_by": "str",
    },
    "user.joined": {
        "user_id": "str",
        "email": "str",
        "name": "str",
        "role": "str",
    },
}
```

### 5.2 Example Mappings

#### Deployment Active Event

**Generic Payload**:
```json
{
  "id": "evt_a1b2c3d4e5f6",
  "type": "deployment.active",
  "organization_id": "org_123",
  "data": {
    "deployment_id": "dep_789",
    "name": "customer-support-v2-prod",
    "environment": "production",
    "version": "v2.3.1",
    "agent_id": "agent_456",
    "agent_name": "customer-support-v2",
    "started_at": "2025-12-20T14:30:00Z"
  },
  "created_at": "2025-12-20T14:30:00Z"
}
```

**Teams Transformation**:
```json
{
  "@type": "MessageCard",
  "@context": "http://schema.org/extensions",
  "themeColor": "0076D7",
  "summary": "Deployment Active",
  "sections": [{
    "activityTitle": "Deployment Active",
    "activitySubtitle": "Organization: org_123",
    "activityImage": "https://kaizen.studio/icons/deployment-active.png",
    "facts": [
      {"name": "Name", "value": "customer-support-v2-prod"},
      {"name": "Environment", "value": "production"},
      {"name": "Version", "value": "v2.3.1"},
      {"name": "Agent Name", "value": "customer-support-v2"},
      {"name": "Started At", "value": "2025-12-20T14:30:00Z"}
    ],
    "markdown": true
  }],
  "potentialAction": [
    {
      "@type": "OpenUri",
      "name": "View Deployment",
      "targets": [{"os": "default", "uri": "https://kaizen.studio/deployments/dep_789"}]
    },
    {
      "@type": "HttpPOST",
      "name": "Stop Deployment",
      "target": "https://api.kaizen.studio/deployments/dep_789/stop"
    }
  ]
}
```

**Discord Transformation**:
```json
{
  "username": "Kaizen Studio",
  "avatar_url": "https://kaizen.studio/logo.png",
  "embeds": [{
    "title": "Deployment Active",
    "description": "**customer-support-v2-prod**\nStatus: production",
    "color": 65280,
    "url": "https://kaizen.studio/deployments/dep_789",
    "timestamp": "2025-12-20T14:30:00Z",
    "footer": {
      "text": "Kaizen Studio",
      "icon_url": "https://kaizen.studio/icon.png"
    },
    "fields": [
      {"name": "Environment", "value": "production", "inline": true},
      {"name": "Version", "value": "v2.3.1", "inline": true},
      {"name": "Agent Name", "value": "customer-support-v2", "inline": true},
      {"name": "Started At", "value": "2025-12-20T14:30:00Z", "inline": false}
    ]
  }]
}
```

**Telegram Transformation**:
```json
{
  "text": "🚀 *Deployment Active*\n\n*Name:* customer\\-support\\-v2\\-prod\n*Environment:* production\n*Version:* v2\\.3\\.1\n*Agent Name:* customer\\-support\\-v2\n*Started At:* 2025\\-12\\-20T14:30:00Z",
  "parse_mode": "MarkdownV2",
  "disable_web_page_preview": false,
  "reply_markup": {
    "inline_keyboard": [
      [
        {"text": "View Deployment", "url": "https://kaizen.studio/deployments/dep_789"},
        {"text": "Stop", "callback_data": "stop_deployment_dep_789"}
      ]
    ]
  }
}
```

---

## 6. Configuration UI

### 6.1 Extended API Models

```python
# src/studio/api/webhooks.py (UPDATED REQUEST MODELS)

from pydantic import BaseModel, Field, validator


class CreateWebhookRequest(BaseModel):
    """Request model for creating a webhook."""

    name: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., min_length=1)
    events: list[str] = Field(default_factory=list)
    platform: str = Field(default="generic", pattern="^(generic|teams|discord|telegram)$")
    platform_config: dict | None = None

    @validator("platform_config")
    def validate_platform_config(cls, v, values):
        """Validate platform_config based on platform."""
        platform = values.get("platform")

        if platform == "telegram":
            if not v or "bot_token" not in v or "chat_id" not in v:
                raise ValueError("Telegram requires bot_token and chat_id in platform_config")

        return v


class UpdateWebhookRequest(BaseModel):
    """Request model for updating a webhook."""

    name: str | None = Field(None, min_length=1, max_length=100)
    url: str | None = None
    events: list[str] | None = None
    status: str | None = Field(None, pattern="^(active|inactive)$")
    platform: str | None = Field(None, pattern="^(generic|teams|discord|telegram)$")
    platform_config: dict | None = None


class WebhookResponse(BaseModel):
    """Response model for webhook info."""

    id: str
    organization_id: str
    name: str
    url: str
    events: list[str]
    status: str
    platform: str  # NEW
    last_triggered_at: str | None
    failure_count: int
    created_by: str
    created_at: str
```

### 6.2 Updated Create Endpoint

```python
# src/studio/api/webhooks.py (UPDATED CREATE ENDPOINT)

@router.post("", response_model=WebhookWithSecretResponse)
async def create_webhook(
    data: CreateWebhookRequest,
    request: Request,
    service: WebhookService = Depends(get_webhook_service),
):
    """
    Create a new webhook with platform adapter.

    Platform-specific requirements:
    - Teams: URL must be *.webhook.office.com
    - Discord: URL must be discord.com/api/webhooks/*
    - Telegram: Requires bot_token and chat_id in platform_config
    """
    user = get_current_user(request)

    # Validate events
    invalid_events = [e for e in data.events if e not in WEBHOOK_EVENTS]
    if invalid_events:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid events: {invalid_events}. Valid events: {WEBHOOK_EVENTS}",
        )

    # Validate platform and URL
    from studio.services.webhook_adapters import get_adapter, validate_platform

    if not validate_platform(data.platform):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid platform: {data.platform}. Valid: generic, teams, discord, telegram",
        )

    adapter = get_adapter(data.platform)
    if adapter:
        # Validate URL format
        is_valid, error = adapter.validate_url(data.url)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)

        # Validate platform config
        if data.platform_config:
            is_valid, error = adapter.validate_config(data.platform_config)
            if not is_valid:
                raise HTTPException(status_code=400, detail=error)

    webhook = await service.create(
        org_id=user["org_id"],
        name=data.name,
        url=data.url,
        events=data.events,
        user_id=user["user_id"],
        platform=data.platform,
        platform_config=data.platform_config,
    )

    return webhook
```

### 6.3 Test Platform Endpoint

```python
# src/studio/api/webhooks.py (NEW ENDPOINT)

class TestPlatformRequest(BaseModel):
    """Request model for testing platform configuration."""

    platform: str = Field(..., pattern="^(teams|discord|telegram)$")
    url: str = Field(..., min_length=1)
    platform_config: dict | None = None


@router.post("/test-platform")
async def test_platform(
    data: TestPlatformRequest,
    request: Request,
):
    """
    Test platform configuration before creating webhook.

    Validates URL format and platform-specific config without saving.
    """
    user = get_current_user(request)

    from studio.services.webhook_adapters import get_adapter

    adapter = get_adapter(data.platform)
    if not adapter:
        raise HTTPException(status_code=400, detail="Invalid platform")

    # Validate URL
    is_valid, error = adapter.validate_url(data.url)
    if not is_valid:
        return {"valid": False, "error": error}

    # Validate config
    if data.platform_config:
        is_valid, error = adapter.validate_config(data.platform_config)
        if not is_valid:
            return {"valid": False, "error": error}

    return {"valid": True, "message": "Platform configuration is valid"}
```

### 6.4 Frontend Component (React/TypeScript)

```tsx
// apps/frontend/src/features/webhooks/components/CreateWebhookForm.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface WebhookFormData {
  name: string;
  url: string;
  platform: 'generic' | 'teams' | 'discord' | 'telegram';
  events: string[];
  platformConfig?: {
    bot_token?: string;
    chat_id?: string;
  };
}

export function CreateWebhookForm() {
  const { register, handleSubmit, watch, setValue } = useForm<WebhookFormData>({
    defaultValues: {
      platform: 'generic',
      events: [],
    },
  });

  const platform = watch('platform');
  const [testResult, setTestResult] = useState<{valid: boolean; error?: string} | null>(null);

  const onSubmit = async (data: WebhookFormData) => {
    // Create webhook via API
    const response = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const webhook = await response.json();
      alert(`Webhook created! Secret: ${webhook.secret}`);
    }
  };

  const testPlatform = async () => {
    const data = watch();
    const response = await fetch('/api/webhooks/test-platform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: data.platform,
        url: data.url,
        platform_config: data.platformConfig,
      }),
    });

    const result = await response.json();
    setTestResult(result);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Webhook Name</Label>
        <Input id="name" {...register('name', { required: true })} />
      </div>

      <div>
        <Label htmlFor="platform">Platform</Label>
        <Select
          id="platform"
          {...register('platform')}
          onChange={(e) => {
            setValue('platform', e.target.value as any);
            setTestResult(null);
          }}
        >
          <option value="generic">Generic HTTP POST</option>
          <option value="teams">Microsoft Teams</option>
          <option value="discord">Discord</option>
          <option value="telegram">Telegram</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="url">
          {platform === 'telegram' ? 'Bot Token' : 'Webhook URL'}
        </Label>
        <Input
          id="url"
          {...register('url', { required: true })}
          placeholder={
            platform === 'teams' ? 'https://*.webhook.office.com/webhookb2/...' :
            platform === 'discord' ? 'https://discord.com/api/webhooks/...' :
            platform === 'telegram' ? '123456789:ABCdefGhIjklmnopqrstuvwxyz' :
            'https://your-endpoint.com/webhook'
          }
        />
      </div>

      {platform === 'telegram' && (
        <div>
          <Label htmlFor="chat_id">Chat ID</Label>
          <Input
            id="chat_id"
            {...register('platformConfig.chat_id', { required: platform === 'telegram' })}
            placeholder="-1001234567890"
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={testPlatform}>
          Test Configuration
        </Button>
        <Button type="submit">Create Webhook</Button>
      </div>

      {testResult && (
        <div className={testResult.valid ? 'text-green-600' : 'text-red-600'}>
          {testResult.valid ? '✓ Configuration valid' : `✗ ${testResult.error}`}
        </div>
      )}
    </form>
  );
}
```

---

## 7. Updated WebhookService Implementation

### 7.1 Extended Service Methods

```python
# src/studio/services/webhook_service.py (UPDATED METHODS)

from studio.services.encryption_service import EncryptionService
from studio.services.webhook_adapters import get_adapter, AdapterConfig


class WebhookService:
    """
    Service for managing webhooks and deliveries with platform adapters.
    """

    def __init__(self, runtime=None):
        """Initialize the webhook service."""
        self.runtime = runtime or AsyncLocalRuntime()
        self.encryption = EncryptionService()

    async def create(
        self,
        org_id: str,
        name: str,
        url: str,
        events: list,
        user_id: str,
        platform: str = "generic",
        platform_config: dict | None = None,
    ) -> dict:
        """
        Create a new webhook with platform adapter.

        Args:
            org_id: Organization ID
            name: Webhook name
            url: Target URL
            events: List of event types to subscribe to
            user_id: User creating the webhook
            platform: Platform type (generic, teams, discord, telegram)
            platform_config: Platform-specific configuration

        Returns:
            Created webhook record
        """
        webhook_id = str(uuid.uuid4())
        secret = self._generate_secret()
        now = datetime.now(UTC).isoformat()

        # Validate events
        valid_events = [e for e in events if e in WEBHOOK_EVENTS]

        # Encrypt platform config if provided
        encrypted_config = None
        if platform_config:
            encrypted_config = self.encryption.encrypt_config(platform_config)

        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookCreateNode",
            "create_webhook",
            {
                "id": webhook_id,
                "organization_id": org_id,
                "name": name,
                "url": url,
                "secret": secret,
                "events": json.dumps(valid_events),
                "status": "active",
                "platform": platform,
                "platform_config": encrypted_config or "",
                "last_triggered_at": "",
                "failure_count": 0,
                "created_by": user_id,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return {
            "id": webhook_id,
            "organization_id": org_id,
            "name": name,
            "url": url,
            "secret": secret,
            "events": valid_events,
            "status": "active",
            "platform": platform,
            "last_triggered_at": "",
            "failure_count": 0,
            "created_by": user_id,
            "created_at": now,
        }

    async def deliver(
        self,
        webhook: dict,
        event_type: str,
        data: dict,
        organization_id: str,
    ) -> dict:
        """
        Deliver a webhook payload with platform adapter.

        Args:
            webhook: Webhook record (id, url, secret, platform, platform_config)
            event_type: Event type
            data: Event data
            organization_id: Organization ID

        Returns:
            Delivery record
        """
        now = datetime.now(UTC).isoformat()
        delivery_id = str(uuid.uuid4())
        timestamp = int(time.time())

        platform = webhook.get("platform", "generic")
        adapter = get_adapter(platform)

        # Build payload based on platform
        if adapter:
            # Decrypt platform config
            config = None
            if webhook.get("platform_config"):
                config = self.encryption.decrypt_config(webhook["platform_config"])

            adapter_config = AdapterConfig(
                url=webhook["url"],
                platform_config=config or {},
            )

            # Transform payload using adapter
            payload_dict = adapter.transform_payload(
                event_type=event_type,
                data=data,
                organization_id=organization_id,
                timestamp=now,
            )
            payload = json.dumps(payload_dict)

            # Get platform-specific headers
            headers = adapter.get_headers(adapter_config)

            # For Telegram, override URL with API endpoint
            if platform == "telegram":
                from studio.services.webhook_adapters.telegram import TelegramAdapter
                target_url = TelegramAdapter().get_telegram_url(adapter_config)
                # Add chat_id to payload
                payload_dict["chat_id"] = config.get("chat_id")
                payload = json.dumps(payload_dict)
            else:
                target_url = webhook["url"]
        else:
            # Generic payload (existing behavior)
            payload_dict = {
                "id": f"evt_{uuid.uuid4().hex[:12]}",
                "type": event_type,
                "organization_id": organization_id,
                "data": data,
                "created_at": now,
            }
            payload = json.dumps(payload_dict)
            signature = self.sign_payload(payload, webhook["secret"])
            headers = {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signature,
                "X-Webhook-Timestamp": str(timestamp),
            }
            target_url = webhook["url"]

        # Create delivery record
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookDeliveryCreateNode",
            "create_delivery",
            {
                "id": delivery_id,
                "webhook_id": webhook["id"],
                "event_type": event_type,
                "payload": payload,
                "status": "pending",
                "attempt_count": 0,
                "response_status": 0,
                "response_body": "",
                "duration_ms": 0,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Attempt delivery with retries
        for attempt in range(MAX_ATTEMPTS):
            if attempt > 0:
                await asyncio.sleep(RETRY_DELAYS[attempt])

            start_time = time.time()
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        target_url,
                        content=payload,
                        headers=headers,
                    )

                duration_ms = int((time.time() - start_time) * 1000)
                success = 200 <= response.status_code < 300

                # Update delivery record
                workflow = WorkflowBuilder()
                workflow.add_node(
                    "WebhookDeliveryUpdateNode",
                    "update_delivery",
                    {
                        "filter": {"id": delivery_id},
                        "fields": {
                            "response_status": response.status_code,
                            "response_body": (
                                response.text[:1000] if response.text else None
                            ),
                            "duration_ms": duration_ms,
                            "status": "success" if success else "failed",
                            "attempt_count": attempt + 1,
                        },
                    },
                )

                await self.runtime.execute_workflow_async(workflow.build(), inputs={})

                if success:
                    await self._update_webhook_status(webhook["id"], 0)
                    break
                else:
                    await self._increment_failure_count(webhook["id"])

                    # Check if adapter recommends retry
                    should_retry = True
                    if adapter:
                        should_retry = adapter.should_retry(response.status_code, response.text)
                    elif 400 <= response.status_code < 500:
                        should_retry = False

                    if not should_retry:
                        break

            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)

                workflow = WorkflowBuilder()
                workflow.add_node(
                    "WebhookDeliveryUpdateNode",
                    "update_delivery",
                    {
                        "filter": {"id": delivery_id},
                        "fields": {
                            "response_status": 0,
                            "response_body": str(e)[:1000],
                            "duration_ms": duration_ms,
                            "status": "failed",
                            "attempt_count": attempt + 1,
                        },
                    },
                )

                await self.runtime.execute_workflow_async(workflow.build(), inputs={})
                await self._increment_failure_count(webhook["id"])
                break

        # Update last triggered timestamp
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookUpdateNode",
            "update_triggered",
            {
                "filter": {"id": webhook["id"]},
                "fields": {"last_triggered_at": now},
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return await self.get_delivery(delivery_id)
```

---

## 8. Testing Strategy

### 8.1 Unit Tests (Adapter Logic)

```python
# tests/unit/test_webhook_adapters.py

import pytest
from studio.services.webhook_adapters.teams import TeamsAdapter
from studio.services.webhook_adapters.discord import DiscordAdapter
from studio.services.webhook_adapters.telegram import TelegramAdapter


class TestTeamsAdapter:
    """Test Teams adapter transformations."""

    def test_validate_url_valid(self):
        adapter = TeamsAdapter()
        is_valid, error = adapter.validate_url(
            "https://outlook.webhook.office.com/webhookb2/abc/IncomingWebhook/def/ghi"
        )
        assert is_valid
        assert error == ""

    def test_validate_url_invalid(self):
        adapter = TeamsAdapter()
        is_valid, error = adapter.validate_url("https://example.com/webhook")
        assert not is_valid
        assert "Invalid Teams webhook URL" in error

    def test_transform_deployment_active(self):
        adapter = TeamsAdapter()
        payload = adapter.transform_payload(
            event_type="deployment.active",
            data={
                "deployment_id": "dep_123",
                "name": "test-deployment",
                "environment": "production",
                "version": "v1.0.0",
            },
            organization_id="org_456",
            timestamp="2025-12-20T14:30:00Z",
        )

        assert payload["@type"] == "MessageCard"
        assert payload["themeColor"] == "0076D7"
        assert len(payload["sections"]) == 1
        assert payload["sections"][0]["activityTitle"] == "Deployment Active"
        assert len(payload["potentialAction"]) == 2  # View + Stop


class TestDiscordAdapter:
    """Test Discord adapter transformations."""

    def test_validate_url_valid(self):
        adapter = DiscordAdapter()
        is_valid, error = adapter.validate_url(
            "https://discord.com/api/webhooks/123456789/abcdefg"
        )
        assert is_valid

    def test_transform_agent_created(self):
        adapter = DiscordAdapter()
        payload = adapter.transform_payload(
            event_type="agent.created",
            data={
                "agent_id": "agent_123",
                "name": "customer-support",
                "description": "Support agent",
            },
            organization_id="org_456",
            timestamp="2025-12-20T14:30:00Z",
        )

        assert "embeds" in payload
        assert payload["embeds"][0]["color"] == 65280  # Green
        assert payload["embeds"][0]["title"] == "Agent Created"


class TestTelegramAdapter:
    """Test Telegram adapter transformations."""

    def test_validate_config_valid(self):
        adapter = TelegramAdapter()
        is_valid, error = adapter.validate_config({
            "bot_token": "123456789:ABCdefGhIjklmnopqrstuvwxyz12345",
            "chat_id": "-1001234567890",
        })
        assert is_valid

    def test_validate_config_invalid_token(self):
        adapter = TelegramAdapter()
        is_valid, error = adapter.validate_config({
            "bot_token": "invalid",
            "chat_id": "-1001234567890",
        })
        assert not is_valid
        assert "Invalid bot token" in error

    def test_markdown_escaping(self):
        adapter = TelegramAdapter()
        escaped = adapter._escape_md("Test_value-1.0")
        assert escaped == "Test\\_value\\-1\\.0"

    def test_transform_deployment_failed(self):
        adapter = TelegramAdapter()
        payload = adapter.transform_payload(
            event_type="deployment.failed",
            data={
                "deployment_id": "dep_123",
                "name": "test-deployment",
                "error": "Timeout error",
            },
            organization_id="org_456",
            timestamp="2025-12-20T14:30:00Z",
        )

        assert payload["parse_mode"] == "MarkdownV2"
        assert "❌" in payload["text"]
        assert "Deployment Failed" in payload["text"]
```

### 8.2 Integration Tests (End-to-End Delivery)

```python
# tests/integration/test_webhook_platform_delivery.py

import pytest
import httpx
from studio.services.webhook_service import WebhookService
from kailash.runtime import AsyncLocalRuntime


@pytest.mark.asyncio
async def test_teams_webhook_delivery(test_db):
    """Test full delivery flow to Teams webhook."""
    service = WebhookService(runtime=AsyncLocalRuntime())

    # Create Teams webhook (use mock server URL)
    webhook = await service.create(
        org_id="org_test",
        name="Test Teams Webhook",
        url="https://outlook.webhook.office.com/webhookb2/test/IncomingWebhook/abc/def",
        events=["deployment.active"],
        user_id="user_test",
        platform="teams",
    )

    # Mock httpx to capture request
    captured_payload = None

    async def mock_post(url, content, headers):
        nonlocal captured_payload
        captured_payload = json.loads(content)
        return type('Response', (), {'status_code': 200, 'text': 'ok'})()

    # Deliver event
    with patch('httpx.AsyncClient.post', mock_post):
        await service.deliver(
            webhook={
                "id": webhook["id"],
                "url": webhook["url"],
                "secret": webhook["secret"],
                "platform": "teams",
                "platform_config": None,
            },
            event_type="deployment.active",
            data={
                "deployment_id": "dep_123",
                "name": "test-deployment",
                "environment": "production",
            },
            organization_id="org_test",
        )

    # Verify Teams MessageCard structure
    assert captured_payload is not None
    assert captured_payload["@type"] == "MessageCard"
    assert captured_payload["sections"][0]["activityTitle"] == "Deployment Active"


@pytest.mark.asyncio
async def test_telegram_webhook_delivery(test_db):
    """Test full delivery flow to Telegram."""
    service = WebhookService(runtime=AsyncLocalRuntime())

    # Create Telegram webhook
    webhook = await service.create(
        org_id="org_test",
        name="Test Telegram Webhook",
        url="",  # Not used for Telegram
        events=["agent.created"],
        user_id="user_test",
        platform="telegram",
        platform_config={
            "bot_token": "123456789:ABCdefGhIjklmnopqrstuvwxyz12345",
            "chat_id": "-1001234567890",
        },
    )

    # Deliver event (use mock to verify)
    captured_url = None
    captured_payload = None

    async def mock_post(url, content, headers):
        nonlocal captured_url, captured_payload
        captured_url = url
        captured_payload = json.loads(content)
        return type('Response', (), {'status_code': 200, 'text': '{"ok":true}'})()

    with patch('httpx.AsyncClient.post', mock_post):
        await service.deliver(
            webhook={
                "id": webhook["id"],
                "url": webhook["url"],
                "secret": webhook["secret"],
                "platform": "telegram",
                "platform_config": service.encryption.encrypt_config({
                    "bot_token": "123456789:ABCdefGhIjklmnopqrstuvwxyz12345",
                    "chat_id": "-1001234567890",
                }),
            },
            event_type="agent.created",
            data={
                "agent_id": "agent_123",
                "name": "test-agent",
            },
            organization_id="org_test",
        )

    # Verify Telegram API URL
    assert "api.telegram.org/bot123456789" in captured_url
    assert captured_payload["chat_id"] == "-1001234567890"
    assert captured_payload["parse_mode"] == "MarkdownV2"
```

### 8.3 E2E Tests (Manual Validation)

```bash
# Manual test script for real platform endpoints

# 1. Create Teams webhook
curl -X POST http://localhost:8000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teams Production Alerts",
    "url": "https://YOUR_TEAMS_WEBHOOK_URL",
    "platform": "teams",
    "events": ["deployment.active", "deployment.failed"]
  }'

# 2. Trigger test event
curl -X POST http://localhost:8000/api/webhooks/{webhook_id}/test

# 3. Verify Teams channel receives MessageCard with action buttons

# 4. Create Discord webhook
curl -X POST http://localhost:8000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Discord Dev Notifications",
    "url": "https://discord.com/api/webhooks/YOUR_WEBHOOK",
    "platform": "discord",
    "events": ["agent.created", "pipeline.updated"]
  }'

# 5. Trigger test event
curl -X POST http://localhost:8000/api/webhooks/{webhook_id}/test

# 6. Verify Discord channel receives embed with colors and fields
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Tasks**:
1. Add `platform` and `platform_config` fields to Webhook model
2. Run DataFlow auto-migration
3. Create `EncryptionService` for config encryption
4. Update existing webhooks to `platform: "generic"`

**Deliverables**:
- Database schema updated
- Existing webhooks migrated
- Encryption service implemented

**Success Criteria**:
- All existing webhooks work without changes
- New fields appear in database
- Encryption/decryption works correctly

---

### Phase 2: Adapter Implementation (Week 2)

**Tasks**:
1. Create `base.py` with `WebhookAdapter` abstract class
2. Implement `TeamsAdapter` with MessageCard transformation
3. Implement `DiscordAdapter` with embed transformation
4. Implement `TelegramAdapter` with MarkdownV2 formatting
5. Create adapter registry and `get_adapter()` function

**Deliverables**:
- All three platform adapters complete
- Unit tests for each adapter (URL validation, payload transformation)

**Success Criteria**:
- All adapters pass unit tests
- Payload transformations match platform specs
- Rate limit configurations defined

---

### Phase 3: Service Integration (Week 3)

**Tasks**:
1. Update `WebhookService.create()` to support platform parameter
2. Update `WebhookService.deliver()` to use adapters
3. Add platform-specific retry logic
4. Add platform config validation

**Deliverables**:
- `webhook_service.py` updated with adapter support
- Integration tests for delivery flow

**Success Criteria**:
- Generic webhooks still work (backward compatible)
- Platform webhooks deliver correctly formatted payloads
- Retry logic respects platform recommendations

---

### Phase 4: API & UI (Week 4)

**Tasks**:
1. Update API models (`CreateWebhookRequest`, etc.)
2. Add `/test-platform` endpoint for validation
3. Create frontend platform selector component
4. Add platform-specific config forms
5. Update webhook list UI to show platform icons

**Deliverables**:
- API endpoints updated
- Frontend components complete
- Platform validation working

**Success Criteria**:
- Users can select platform from dropdown
- Validation errors show immediately
- Test functionality works before creation

---

### Phase 5: Testing & Documentation (Week 5)

**Tasks**:
1. Complete E2E tests with mock servers
2. Manual testing with real Teams/Discord/Telegram webhooks
3. Write user documentation with screenshots
4. Create migration guide for existing webhooks

**Deliverables**:
- Full test coverage (unit + integration + E2E)
- User documentation complete
- Migration guide published

**Success Criteria**:
- All tests pass
- Real platform deliveries work correctly
- Documentation reviewed by QA

---

## 10. Risk Assessment

### Risk Matrix

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Platform API Changes** | High | Medium | Version API calls, monitor changelogs, implement fallbacks |
| **Rate Limit Violations** | Medium | High | Implement per-webhook throttling, queue system |
| **Encryption Key Compromise** | Critical | Low | Use secrets manager, rotate keys regularly |
| **Backward Compatibility** | High | Medium | Default `platform: "generic"`, migrate existing records |
| **Config Migration Errors** | Medium | Low | Test migration script on staging, backup before migration |

### Mitigation Details

#### Platform API Changes
- **Teams**: Monitor Office 365 Message Center for deprecations
- **Discord**: Subscribe to Discord developer changelog
- **Telegram**: Bot API versioning is stable (low risk)
- **Fallback**: Keep generic HTTP POST as backup delivery method

#### Rate Limit Violations
```python
# Implement per-webhook rate limiter
from asyncio import Semaphore

class RateLimiter:
    def __init__(self, max_requests: int, time_window: int):
        self.semaphore = Semaphore(max_requests)
        self.window = time_window

    async def acquire(self):
        await self.semaphore.acquire()
        asyncio.create_task(self._release_after_window())

    async def _release_after_window(self):
        await asyncio.sleep(self.window)
        self.semaphore.release()
```

#### Encryption Key Rotation
```python
# Support dual-key decryption during rotation
class EncryptionService:
    def __init__(self):
        self.current_key = get_current_key()
        self.previous_key = get_previous_key()  # For rotation

    def decrypt_config(self, encrypted: str) -> dict:
        try:
            return self._decrypt(encrypted, self.current_key)
        except:
            # Fall back to previous key during rotation
            return self._decrypt(encrypted, self.previous_key)
```

---

## 11. Success Metrics

### Functional Metrics

1. **Delivery Success Rate**: >95% for all platforms
2. **Transformation Accuracy**: 100% schema validation pass rate
3. **Response Time**: <500ms for payload transformation
4. **Retry Efficiency**: <10% of deliveries require retry

### User Experience Metrics

1. **Configuration Errors**: <5% invalid config submissions (via validation)
2. **Time to First Webhook**: <2 minutes from setup to first delivery
3. **Platform Adoption**: 60% of new webhooks use platform adapters

### Technical Metrics

1. **Test Coverage**: >90% for adapter code
2. **Backward Compatibility**: 100% of existing webhooks work post-migration
3. **Rate Limit Compliance**: 0 platform-imposed throttling events

---

## 12. Future Enhancements

### Phase 6: Advanced Features (Post-Launch)

1. **Custom Templates**:
   - User-defined message templates per event type
   - Template variables and conditional formatting
   - Template preview in UI

2. **Webhook Groups**:
   - Send to multiple platforms simultaneously
   - Unified delivery tracking
   - Group-level statistics

3. **Callback Handlers**:
   - Handle Telegram callback queries (button presses)
   - Two-way interaction for approvals
   - Action confirmation tracking

4. **Additional Platforms**:
   - Slack (incoming webhooks + Block Kit)
   - PagerDuty (event v2 API)
   - Datadog (events API)
   - Custom HTTP with jinja2 templates

5. **Analytics Dashboard**:
   - Delivery success rates by platform
   - Response time trends
   - Event type distribution
   - Failed delivery analysis

---

## Appendix A: Complete File Structure

```
apps/kaizen-studio/
├── src/studio/
│   ├── models/
│   │   ├── webhook.py (UPDATED - add platform fields)
│   │   └── webhook_delivery.py (no changes)
│   ├── services/
│   │   ├── webhook_service.py (UPDATED - adapter integration)
│   │   ├── encryption_service.py (NEW)
│   │   └── webhook_adapters/
│   │       ├── __init__.py (NEW - registry)
│   │       ├── base.py (NEW - abstract class)
│   │       ├── teams.py (NEW - Teams adapter)
│   │       ├── discord.py (NEW - Discord adapter)
│   │       └── telegram.py (NEW - Telegram adapter)
│   ├── api/
│   │   └── webhooks.py (UPDATED - platform support)
│   └── migrations/
│       └── add_webhook_platform_fields.py (NEW)
├── tests/
│   ├── unit/
│   │   └── test_webhook_adapters.py (NEW)
│   ├── integration/
│   │   └── test_webhook_platform_delivery.py (NEW)
│   └── e2e/
│       └── test_webhook_platforms_e2e.py (NEW)
└── apps/frontend/
    └── src/features/webhooks/
        ├── components/
        │   ├── CreateWebhookForm.tsx (UPDATED)
        │   ├── PlatformSelector.tsx (NEW)
        │   └── PlatformConfigForm.tsx (NEW)
        └── api/
            └── webhooks.ts (UPDATED)
```

---

## Appendix B: Configuration Examples

### Environment Variables

```bash
# .env

# Encryption key for platform_config (32-byte base64)
ENCRYPTION_KEY=your-base64-encoded-32-byte-key

# Optional: Platform-specific settings
TEAMS_DEFAULT_ICON_URL=https://kaizen.studio/icons/default.png
DISCORD_AVATAR_URL=https://kaizen.studio/logo.png
TELEGRAM_WEBHOOK_PROXY=https://your-proxy.com  # If Telegram blocked
```

### Platform Configuration Storage

```python
# Example encrypted platform_config values

# Teams (minimal - no extra config needed)
{
  "platform": "teams",
  "platform_config": None  # URL contains all info
}

# Discord (minimal - no extra config needed)
{
  "platform": "discord",
  "platform_config": None
}

# Telegram (requires bot token + chat ID)
{
  "platform": "telegram",
  "platform_config": {
    "bot_token": "123456789:ABCdefGhIjklmnopqrstuvwxyz12345",
    "chat_id": "-1001234567890",
    "parse_mode": "MarkdownV2",  # optional, defaults to MarkdownV2
    "disable_notification": false  # optional
  }
}
```

---

## Appendix C: Platform API References

### Microsoft Teams
- **Documentation**: https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook
- **MessageCard Schema**: https://learn.microsoft.com/en-us/outlook/actionable-messages/message-card-reference
- **Adaptive Cards**: https://adaptivecards.io/designer/ (future enhancement)

### Discord
- **Webhook Guide**: https://discord.com/developers/docs/resources/webhook
- **Embed Limits**: https://discord.com/developers/docs/resources/channel#embed-limits
- **Rate Limits**: https://discord.com/developers/docs/topics/rate-limits

### Telegram
- **Bot API**: https://core.telegram.org/bots/api
- **sendMessage**: https://core.telegram.org/bots/api#sendmessage
- **MarkdownV2**: https://core.telegram.org/bots/api#markdownv2-style
- **Inline Keyboards**: https://core.telegram.org/bots/api#inlinekeyboardmarkup

---

## Document Metadata

- **Version**: 1.0
- **Created**: 2025-12-20
- **Author**: Requirements Analysis Specialist
- **Status**: Draft for Review
- **Target Release**: Q1 2026
- **Dependencies**: Kailash DataFlow, AsyncLocalRuntime, WorkflowBuilder
