"""
Notion API Adapter

Transforms External Agent invocation results into Notion database page entries.
Reference: https://developers.notion.com/reference/post-page
"""

from studio.adapters.base_webhook import BaseWebhookAdapter, DeliveryResult


class NotionWebhookAdapter(BaseWebhookAdapter):
    """
    Notion API adapter for creating database page entries.

    Notion Features:
    - Database page creation with rich properties
    - Property types: Title, Rich Text, Select, Number, Date
    - Automatic timestamps and metadata
    - Database schema validation

    Rate Limits:
    - 3 requests/second per integration
    - HTTP 429 response on rate limit

    Note:
    Requires Notion integration token and database_id in platform_config.
    Database must have properties: Title, Status, Agent ID, Invocation ID,
    Execution Time, Invoked At, Completed At, Error Message.
    """

    # Status select options
    STATUS_OPTIONS = {
        "success": "Success",
        "failed": "Failed",
        "pending": "Pending",
    }

    def format_payload(self, invocation_result: dict) -> dict:
        """
        Format invocation result as Notion page properties.

        Args:
            invocation_result: ExternalAgentInvocation record

        Returns:
            Notion page creation payload

        Page Structure:
        - Title: "Invocation {invocation_id}"
        - Properties:
          - Status: Select (Success/Failed/Pending)
          - Agent ID: Rich Text
          - Invocation ID: Rich Text
          - Execution Time: Number (milliseconds)
          - Invoked At: Date
          - Completed At: Date
          - Error Message: Rich Text (if failed)
        """
        # Extract key fields
        invocation_id = invocation_result.get("id", "")
        external_agent_id = invocation_result.get("external_agent_id", "")
        status = invocation_result.get("status", "pending")
        execution_time_ms = invocation_result.get("execution_time_ms", 0)
        error_message = invocation_result.get("error_message", "")
        invoked_at = invocation_result.get("invoked_at", "")
        completed_at = invocation_result.get("completed_at", "")

        # Build page properties
        properties = {
            # Title property (required)
            "Name": {
                "title": [
                    {
                        "text": {
                            "content": f"Invocation {invocation_id[:8]}",
                        }
                    }
                ]
            },
            # Status select
            "Status": {
                "select": {
                    "name": self.STATUS_OPTIONS.get(status, "Pending"),
                }
            },
            # Agent ID rich text
            "Agent ID": {
                "rich_text": [
                    {
                        "text": {
                            "content": external_agent_id,
                        }
                    }
                ]
            },
            # Invocation ID rich text
            "Invocation ID": {
                "rich_text": [
                    {
                        "text": {
                            "content": invocation_id,
                        }
                    }
                ]
            },
            # Execution time number
            "Execution Time (ms)": {
                "number": execution_time_ms,
            },
        }

        # Add invoked_at date
        if invoked_at:
            properties["Invoked At"] = {
                "date": {
                    "start": invoked_at,
                }
            }

        # Add completed_at date
        if completed_at:
            properties["Completed At"] = {
                "date": {
                    "start": completed_at,
                }
            }

        # Add error message if failed
        if error_message:
            properties["Error Message"] = {
                "rich_text": [
                    {
                        "text": {
                            "content": error_message[:2000],  # Notion limit
                        }
                    }
                ]
            }

        # Build Notion page payload
        database_id = self.platform_config.get("database_id", "")
        payload = {
            "parent": {
                "database_id": database_id,
            },
            "properties": properties,
        }

        return payload

    async def deliver(self, payload: dict) -> DeliveryResult:
        """
        Create Notion database page entry.

        Args:
            payload: Notion page creation payload

        Returns:
            DeliveryResult with delivery status

        Note:
            Requires Notion integration token in auth_config.
            Database ID must be configured in platform_config.
        """
        database_id = self.platform_config.get("database_id", "")
        if not database_id:
            return DeliveryResult(
                success=False,
                error_message="database_id not configured in platform_config",
            )

        # Notion API endpoint
        url = "https://api.notion.com/v1/pages"

        # Notion requires API version header
        headers = {
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",  # Latest stable version
        }

        # Add Authorization header from auth_config
        # Note: _get_auth_headers() will add this automatically for bearer_token auth

        return await self._execute_http_delivery(
            url=url,
            payload=payload,
            headers=headers,
            method="POST",
            timeout=30.0,
        )
