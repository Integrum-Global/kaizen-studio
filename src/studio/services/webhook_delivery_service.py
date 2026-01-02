"""
Webhook Delivery Service

Orchestrates webhook delivery using platform-specific adapters.
Supports async delivery to avoid blocking invocation responses.
"""

import asyncio
import json
import logging
from datetime import UTC, datetime

from cryptography.fernet import Fernet, InvalidToken
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.adapters.base_webhook import BaseWebhookAdapter, DeliveryResult
from studio.config import get_settings

logger = logging.getLogger(__name__)


class WebhookDeliveryService:
    """
    Service for delivering webhook notifications using platform adapters.

    Features:
    - Platform adapter registry (Teams, Discord, Slack, Telegram, Notion)
    - Async delivery (non-blocking)
    - Automatic retry with exponential backoff
    - Delivery status tracking in ExternalAgentInvocation
    - Audit logging via AuditService
    """

    def __init__(self, runtime: AsyncLocalRuntime | None = None):
        """
        Initialize the webhook delivery service.

        Args:
            runtime: Kailash AsyncLocalRuntime (defaults to new instance)
        """
        self.runtime = runtime or AsyncLocalRuntime()
        self._adapter_registry: dict[str, type[BaseWebhookAdapter]] = {}
        self._fernet: Fernet | None = None
        self._register_default_adapters()

    @property
    def fernet(self) -> Fernet | None:
        """Get Fernet instance for credential decryption."""
        if self._fernet is None:
            settings = get_settings()
            encryption_key = getattr(settings, "credential_encryption_key", "")
            if encryption_key:
                try:
                    self._fernet = Fernet(
                        encryption_key.encode()
                        if isinstance(encryption_key, str)
                        else encryption_key
                    )
                except Exception as e:
                    logger.error(f"Invalid credential encryption key: {e}")
                    self._fernet = None
        return self._fernet

    def _register_default_adapters(self):
        """Register default platform adapters."""
        # Import adapters lazily to avoid circular dependencies
        try:
            from studio.adapters.teams_adapter import TeamsWebhookAdapter

            self.register_adapter("teams", TeamsWebhookAdapter)
        except ImportError:
            pass

        try:
            from studio.adapters.discord_adapter import DiscordWebhookAdapter

            self.register_adapter("discord", DiscordWebhookAdapter)
        except ImportError:
            pass

        try:
            from studio.adapters.slack_adapter import SlackWebhookAdapter

            self.register_adapter("slack", SlackWebhookAdapter)
        except ImportError:
            pass

        try:
            from studio.adapters.telegram_adapter import TelegramWebhookAdapter

            self.register_adapter("telegram", TelegramWebhookAdapter)
        except ImportError:
            pass

        try:
            from studio.adapters.notion_adapter import NotionWebhookAdapter

            self.register_adapter("notion", NotionWebhookAdapter)
        except ImportError:
            pass

    def register_adapter(
        self,
        platform: str,
        adapter_class: type[BaseWebhookAdapter],
    ):
        """
        Register a platform adapter.

        Args:
            platform: Platform identifier (e.g., "teams", "discord")
            adapter_class: Adapter class (must inherit from BaseWebhookAdapter)
        """
        if not issubclass(adapter_class, BaseWebhookAdapter):
            raise ValueError(
                f"Adapter class must inherit from BaseWebhookAdapter: {adapter_class}"
            )
        self._adapter_registry[platform] = adapter_class

    def get_adapter(
        self,
        platform: str,
        auth_config: dict,
        platform_config: dict,
    ) -> BaseWebhookAdapter | None:
        """
        Get adapter instance for platform.

        Args:
            platform: Platform identifier
            auth_config: Authentication configuration
            platform_config: Platform-specific configuration

        Returns:
            Adapter instance or None if platform not registered
        """
        adapter_class = self._adapter_registry.get(platform)
        if adapter_class is None:
            return None
        return adapter_class(auth_config=auth_config, platform_config=platform_config)

    async def deliver(
        self,
        external_agent: dict,
        invocation_result: dict,
    ) -> DeliveryResult:
        """
        Deliver webhook notification for external agent invocation.

        This method:
        1. Selects platform adapter based on external_agent.platform
        2. Formats payload using adapter.format_payload()
        3. Delivers payload using adapter.deliver()
        4. Updates ExternalAgentInvocation with delivery status
        5. Logs delivery event to AuditService

        Args:
            external_agent: ExternalAgent record
                - id: Agent ID
                - platform: Platform identifier (teams, discord, etc.)
                - platform_config: Platform-specific config (JSON string)
                - auth_type: Authentication type
                - encrypted_credentials: Auth credentials (encrypted JSON)
            invocation_result: ExternalAgentInvocation record
                - id: Invocation ID
                - external_agent_id: Agent ID
                - request_payload: Original request
                - response_payload: Agent response
                - status: "success" or "failed"
                - execution_time_ms: Execution time
                - error_message: Error details if failed
                - invoked_at: Invocation timestamp
                - completed_at: Completion timestamp

        Returns:
            DeliveryResult with success status and metadata

        Note:
            This method updates the ExternalAgentInvocation record with:
            - webhook_delivery_status: "pending" -> "delivered" or "failed"
            - webhook_delivery_error: Error message if failed
            - webhook_delivered_at: Delivery completion timestamp
        """
        # Update status to pending
        await self._update_delivery_status(
            invocation_id=invocation_result["id"],
            status="pending",
        )

        # Get platform adapter
        platform = external_agent.get("platform", "")
        platform_config = json.loads(external_agent.get("platform_config", "{}"))

        # Decrypt and parse auth config
        auth_config = {
            "auth_type": external_agent.get("auth_type", "none"),
            "credentials": self._decrypt_credentials(
                external_agent.get("encrypted_credentials", "")
            ),
        }

        adapter = self.get_adapter(platform, auth_config, platform_config)
        if adapter is None:
            # Platform not supported - mark as failed
            error_message = f"Platform not supported: {platform}"
            await self._update_delivery_status(
                invocation_id=invocation_result["id"],
                status="failed",
                error_message=error_message,
            )
            return DeliveryResult(
                success=False,
                error_message=error_message,
            )

        try:
            # Format payload using adapter
            payload = adapter.format_payload(invocation_result)

            # Deliver with retry
            result = await adapter._retry_delivery(payload)

            # Update delivery status
            if result.success:
                await self._update_delivery_status(
                    invocation_id=invocation_result["id"],
                    status="delivered",
                )
            else:
                await self._update_delivery_status(
                    invocation_id=invocation_result["id"],
                    status="failed",
                    error_message=result.error_message or "Delivery failed",
                )

            # Log to AuditService
            await self._log_delivery_event(
                organization_id=external_agent.get("organization_id", ""),
                external_agent_id=external_agent["id"],
                invocation_id=invocation_result["id"],
                platform=platform,
                result=result,
            )

            return result

        except Exception as e:
            # Unexpected error - mark as failed
            error_message = f"Delivery error: {str(e)}"
            await self._update_delivery_status(
                invocation_id=invocation_result["id"],
                status="failed",
                error_message=error_message,
            )
            return DeliveryResult(
                success=False,
                error_message=error_message,
            )

    async def deliver_async(
        self,
        external_agent: dict,
        invocation_result: dict,
    ):
        """
        Deliver webhook notification asynchronously (fire-and-forget).

        Use this method when you don't want to block on delivery result.
        Delivery happens in the background.

        Args:
            external_agent: ExternalAgent record
            invocation_result: ExternalAgentInvocation record
        """
        asyncio.create_task(self.deliver(external_agent, invocation_result))

    async def _update_delivery_status(
        self,
        invocation_id: str,
        status: str,
        error_message: str | None = None,
    ):
        """
        Update ExternalAgentInvocation with delivery status.

        Args:
            invocation_id: Invocation ID
            status: Delivery status ("pending", "delivered", "failed")
            error_message: Error message if failed
        """
        fields = {
            "webhook_delivery_status": status,
        }

        if error_message:
            fields["webhook_delivery_error"] = error_message

        if status == "delivered":
            fields["webhook_delivered_at"] = datetime.now(UTC).isoformat()

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationUpdateNode",
            "update_invocation",
            {
                "filter": {"id": invocation_id},
                "fields": fields,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    async def _log_delivery_event(
        self,
        organization_id: str,
        external_agent_id: str,
        invocation_id: str,
        platform: str,
        result: DeliveryResult,
    ):
        """
        Log delivery event to AuditService.

        Args:
            organization_id: Organization ID
            external_agent_id: External agent ID
            invocation_id: Invocation ID
            platform: Platform identifier
            result: Delivery result
        """
        # Import AuditService lazily to avoid circular dependency
        try:
            from studio.services.audit_service import AuditService

            audit_service = AuditService(runtime=self.runtime)

            event_data = {
                "external_agent_id": external_agent_id,
                "invocation_id": invocation_id,
                "platform": platform,
                "success": result.success,
                "status_code": result.status_code,
                "retry_count": result.retry_count,
                "duration_ms": result.duration_ms,
            }

            if result.error_message:
                event_data["error_message"] = result.error_message

            await audit_service.log_event(
                organization_id=organization_id,
                event_type="webhook.delivered" if result.success else "webhook.failed",
                user_id="system",  # System event
                resource_type="external_agent_invocation",
                resource_id=invocation_id,
                event_data=json.dumps(event_data),
            )

        except Exception as e:
            # Don't fail delivery if audit logging fails
            # Just log the error for debugging
            print(f"Failed to log webhook delivery event: {e}")

    def encrypt_credentials(self, credentials: dict) -> str:
        """
        Encrypt credentials for storage using Fernet symmetric encryption.

        Args:
            credentials: Credentials dictionary to encrypt

        Returns:
            Fernet-encrypted JSON string

        Raises:
            ValueError: If encryption key is not configured
        """
        if self.fernet is None:
            raise ValueError(
                "CREDENTIAL_ENCRYPTION_KEY not configured. "
                "Cannot encrypt credentials without encryption key."
            )

        json_str = json.dumps(credentials)
        return self.fernet.encrypt(json_str.encode()).decode()

    def _decrypt_credentials(self, encrypted_credentials: str) -> dict:
        """
        Decrypt authentication credentials using Fernet symmetric encryption.

        Args:
            encrypted_credentials: Fernet-encrypted JSON string

        Returns:
            Decrypted credentials dictionary

        Security:
            - Uses Fernet symmetric encryption (AES-128-CBC with HMAC)
            - Requires CREDENTIAL_ENCRYPTION_KEY environment variable
            - Falls back to JSON parsing for backward compatibility with unencrypted data
            - Logs warnings when encryption is not configured
        """
        if not encrypted_credentials:
            return {}

        # Try to decrypt with Fernet first
        if self.fernet is not None:
            try:
                decrypted = self.fernet.decrypt(encrypted_credentials.encode()).decode()
                return json.loads(decrypted)
            except InvalidToken:
                # Data may not be encrypted (backward compatibility) or key is wrong
                logger.warning(
                    "Failed to decrypt credentials with Fernet. "
                    "Data may be unencrypted (legacy) or encryption key is incorrect."
                )
            except Exception as e:
                logger.error(f"Credential decryption error: {e}")
        else:
            # No encryption key configured - log warning in production
            from studio.config import is_production

            if is_production():
                logger.warning(
                    "CREDENTIAL_ENCRYPTION_KEY not configured. "
                    "Credentials should be encrypted in production!"
                )

        # Fallback: try parsing as unencrypted JSON (backward compatibility)
        try:
            return json.loads(encrypted_credentials)
        except json.JSONDecodeError:
            logger.error("Failed to parse credentials as JSON")
            return {}
