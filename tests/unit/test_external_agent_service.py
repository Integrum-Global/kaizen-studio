"""
Tier 1: External Agent Service Unit Tests

Tests external agent business logic in isolation with mocked DataFlow operations.
Mocking is allowed in Tier 1 for external dependencies.
"""

import json
import uuid
from unittest.mock import AsyncMock

import pytest


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestExternalAgentServiceValidation:
    """Test external agent service parameter validation."""

    # ==================
    # Auth Config Validation Tests
    # ==================

    @pytest.mark.asyncio
    async def test_validate_auth_config_oauth2_valid(self, external_agent_service):
        """
        Intent: Ensure OAuth2 validation accepts valid client_id, client_secret, token_url.

        This verifies that well-formed OAuth2 configurations with all required fields
        are accepted by the validation logic.
        """
        auth_config = {
            "client_id": "abc-123-def",
            "client_secret": "secret_xyz",
            "token_url": "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
            "scope": "https://api.botframework.com/.default",
        }

        result = await external_agent_service.validate_auth_config(
            "oauth2", auth_config
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_auth_config_oauth2_missing_client_id(
        self, external_agent_service
    ):
        """
        Intent: Ensure validation rejects incomplete OAuth2 configs.

        OAuth2 configurations must have client_id, client_secret, and token_url.
        Missing any of these should raise a validation error.
        """
        auth_config = {
            "client_secret": "secret_xyz",
            "token_url": "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
        }

        with pytest.raises(ValueError, match="client_id"):
            await external_agent_service.validate_auth_config("oauth2", auth_config)

    @pytest.mark.asyncio
    async def test_validate_auth_config_oauth2_missing_client_secret(
        self, external_agent_service
    ):
        """
        Intent: Ensure validation rejects OAuth2 configs without client_secret.

        Client secret is a critical security credential for OAuth2.
        """
        auth_config = {
            "client_id": "abc-123-def",
            "token_url": "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
        }

        with pytest.raises(ValueError, match="client_secret"):
            await external_agent_service.validate_auth_config("oauth2", auth_config)

    @pytest.mark.asyncio
    async def test_validate_auth_config_oauth2_missing_token_url(
        self, external_agent_service
    ):
        """
        Intent: Ensure validation rejects OAuth2 configs without token_url.

        Token URL is required to obtain access tokens.
        """
        auth_config = {"client_id": "abc-123-def", "client_secret": "secret_xyz"}

        with pytest.raises(ValueError, match="token_url"):
            await external_agent_service.validate_auth_config("oauth2", auth_config)

    @pytest.mark.asyncio
    async def test_validate_auth_config_api_key_valid(self, external_agent_service):
        """
        Intent: Ensure API Key validation accepts valid key and header_name.

        API key authentication requires both the key value and the header name
        where it should be sent.
        """
        auth_config = {"key": "sk_live_abc123xyz", "header_name": "X-API-Key"}

        result = await external_agent_service.validate_auth_config(
            "api_key", auth_config
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_auth_config_api_key_missing_key(
        self, external_agent_service
    ):
        """
        Intent: Ensure validation rejects incomplete API Key configs.

        API key configurations must have the key value.
        """
        auth_config = {"header_name": "X-API-Key"}

        with pytest.raises(ValueError, match="key"):
            await external_agent_service.validate_auth_config("api_key", auth_config)

    @pytest.mark.asyncio
    async def test_validate_auth_config_bearer_token_valid(
        self, external_agent_service
    ):
        """
        Intent: Ensure Bearer token validation accepts valid token.

        Bearer token authentication requires just the token value.
        """
        auth_config = {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}

        result = await external_agent_service.validate_auth_config(
            "bearer_token", auth_config
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_auth_config_bearer_token_missing_token(
        self, external_agent_service
    ):
        """
        Intent: Ensure validation rejects Bearer configs without token.
        """
        auth_config = {}

        with pytest.raises(ValueError, match="token"):
            await external_agent_service.validate_auth_config(
                "bearer_token", auth_config
            )

    @pytest.mark.asyncio
    async def test_validate_auth_config_custom_valid(self, external_agent_service):
        """
        Intent: Ensure Custom auth validation accepts arbitrary JSON.

        Custom auth types allow flexibility for proprietary authentication schemes.
        Any valid JSON object should be accepted.
        """
        auth_config = {
            "custom_field_1": "value1",
            "custom_field_2": {"nested": "value"},
        }

        result = await external_agent_service.validate_auth_config(
            "custom", auth_config
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_auth_config_invalid_type(self, external_agent_service):
        """
        Intent: Ensure validation rejects unknown auth types.

        Only predefined auth types (oauth2, api_key, bearer_token, custom, none)
        should be accepted.
        """
        auth_config = {"some": "config"}

        with pytest.raises(ValueError, match="Invalid auth_type"):
            await external_agent_service.validate_auth_config(
                "invalid_type", auth_config
            )

    # ==================
    # Platform Config Validation Tests
    # ==================

    @pytest.mark.asyncio
    async def test_validate_platform_config_teams_valid(self, external_agent_service):
        """
        Intent: Ensure Teams validation accepts valid tenant_id and channel_id.

        Microsoft Teams platform requires both tenant and channel identifiers.
        """
        platform_config = {
            "tenant_id": "12345678-1234-1234-1234-123456789012",
            "channel_id": "19:abcdef@thread.tacv2",
        }

        result = await external_agent_service.validate_platform_config(
            "teams", platform_config
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_platform_config_teams_missing_tenant_id(
        self, external_agent_service
    ):
        """
        Intent: Ensure validation rejects incomplete Teams configs.

        Teams configurations must have tenant_id.
        """
        platform_config = {"channel_id": "19:abcdef@thread.tacv2"}

        with pytest.raises(ValueError, match="tenant_id"):
            await external_agent_service.validate_platform_config(
                "teams", platform_config
            )

    @pytest.mark.asyncio
    async def test_validate_platform_config_discord_valid(self, external_agent_service):
        """
        Intent: Ensure Discord validation accepts valid webhook_url and username.

        Discord platform uses webhook URLs for message posting.
        """
        platform_config = {
            "webhook_url": "https://discord.com/api/webhooks/123456789/abcdefgh",
            "username": "KaizenBot",
        }

        result = await external_agent_service.validate_platform_config(
            "discord", platform_config
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_platform_config_discord_missing_webhook_url(
        self, external_agent_service
    ):
        """
        Intent: Ensure validation rejects Discord configs without webhook_url.
        """
        platform_config = {"username": "KaizenBot"}

        with pytest.raises(ValueError, match="webhook_url"):
            await external_agent_service.validate_platform_config(
                "discord", platform_config
            )

    @pytest.mark.asyncio
    async def test_validate_platform_config_slack_valid(self, external_agent_service):
        """
        Intent: Ensure Slack validation accepts valid webhook_url and channel.

        Slack platform uses webhook URLs for message posting to channels.
        """
        platform_config = {
            "webhook_url": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX",
            "channel": "#general",
        }

        result = await external_agent_service.validate_platform_config(
            "slack", platform_config
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_platform_config_telegram_valid(
        self, external_agent_service
    ):
        """
        Intent: Ensure Telegram validation accepts valid bot_token and chat_id.

        Telegram platform requires bot token and chat identifier.
        """
        platform_config = {
            "bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
            "chat_id": "-1001234567890",
        }

        result = await external_agent_service.validate_platform_config(
            "telegram", platform_config
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_platform_config_notion_valid(self, external_agent_service):
        """
        Intent: Ensure Notion validation accepts valid token and database_id.

        Notion platform requires integration token and database identifier.
        """
        platform_config = {
            "token": "secret_abc123xyz",
            "database_id": "12345678-1234-1234-1234-123456789012",
        }

        result = await external_agent_service.validate_platform_config(
            "notion", platform_config
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_platform_config_custom_http_valid(
        self, external_agent_service
    ):
        """
        Intent: Ensure custom_http validation accepts arbitrary config.

        Custom HTTP platforms allow flexibility for any HTTP-based agent.
        """
        platform_config = {
            "endpoint": "https://api.example.com/agent",
            "custom_field": "value",
        }

        result = await external_agent_service.validate_platform_config(
            "custom_http", platform_config
        )
        assert result is True

    # ==================
    # Rate Limit Check Tests (Full Implementation in Phase 3)
    # ==================

    @pytest.mark.asyncio
    async def test_check_rate_limit_returns_tuple_with_status(
        self, external_agent_service
    ):
        """
        Intent: Verify rate limit check returns status tuple.

        Rate limiting returns a tuple of (allowed: bool, info: dict) with
        rate limit details including remaining requests and retry timing.
        """
        allowed, info = await external_agent_service.check_rate_limit(
            agent_id="ext_agent_123", user_id="user_789", organization_id="org_456"
        )

        # Fails open when Redis unavailable in unit tests
        assert allowed is True
        assert isinstance(info, dict)

    # ==================
    # Budget Check Tests (Full Implementation in Phase 3)
    # ==================

    @pytest.mark.asyncio
    async def test_check_budget_returns_tuple_with_status(self, external_agent_service):
        """
        Intent: Verify budget check returns status tuple.

        Budget enforcement returns a tuple of (allowed: bool, info: dict) with
        budget details including remaining budget and usage percentage.
        """
        allowed, info = await external_agent_service.check_budget(
            agent_id="ext_agent_123", organization_id="org_456", estimated_cost=10.0
        )

        # Fails open when DataFlow unavailable in unit tests
        assert allowed is True
        assert isinstance(info, dict)

    # ==================
    # Credential Encryption Tests
    # ==================

    @pytest.mark.asyncio
    async def test_encrypt_credentials_returns_encrypted_string(
        self, external_agent_service
    ):
        """
        Intent: Verify credentials are encrypted before storage.

        Sensitive credentials (API keys, OAuth secrets) must be encrypted at rest.
        The encrypted value should be a string that differs from the input.
        """
        credentials = {
            "api_key": "sk_live_abc123",
            "client_secret": "very_secret_value",
        }

        encrypted = await external_agent_service.encrypt_credentials(credentials)

        assert isinstance(encrypted, str)
        assert encrypted != json.dumps(credentials)
        assert len(encrypted) > 0

    @pytest.mark.asyncio
    async def test_decrypt_credentials_returns_original(self, external_agent_service):
        """
        Intent: Verify encrypted credentials can be decrypted.

        Decryption should return the original credential values.
        """
        credentials = {
            "api_key": "sk_live_abc123",
            "client_secret": "very_secret_value",
        }

        encrypted = await external_agent_service.encrypt_credentials(credentials)
        decrypted = await external_agent_service.decrypt_credentials(encrypted)

        assert decrypted == credentials

    # ==================
    # Log Invocation Tests (Stub in Phase 1)
    # ==================

    @pytest.mark.asyncio
    async def test_log_invocation_creates_record(
        self, external_agent_service_with_mock
    ):
        """
        Intent: Verify invocation logging creates basic record.

        ObservabilityManager integration deferred to Phase 2.
        Should create ExternalAgentInvocation record with basic fields.
        """
        invocation_data = {
            "external_agent_id": "ext_agent_123",
            "user_id": "user_456",
            "organization_id": "org_789",
            "status": "pending",
            "request_payload": {"input": "test query"},
        }

        result = await external_agent_service_with_mock.log_invocation(invocation_data)

        assert result is not None
        assert "id" in result
        assert result["external_agent_id"] == "ext_agent_123"
        assert result["status"] == "pending"


@pytest.fixture
def external_agent_service():
    """
    Create ExternalAgentService with mocked runtime for unit tests.

    Since we're testing validation logic in isolation, we mock the
    runtime to avoid actual database operations.
    """
    from studio.services.external_agent_service import ExternalAgentService

    mock_runtime = AsyncMock()
    service = ExternalAgentService(runtime=mock_runtime)
    return service


@pytest.fixture
def external_agent_service_with_mock():
    """
    Create ExternalAgentService with fully mocked runtime that returns data.

    For tests that need mocked execute_workflow_async responses.
    """

    from studio.services.external_agent_service import ExternalAgentService

    mock_runtime = AsyncMock()

    # Mock execute_workflow_async to return proper tuple with invocation data
    async def mock_execute(*args, **kwargs):
        invocation_id = str(uuid.uuid4())
        return (
            {
                "create": {
                    "id": invocation_id,
                    "external_agent_id": "ext_agent_123",
                    "user_id": "user_456",
                    "organization_id": "org_789",
                    "status": "pending",
                }
            },
            "run_123",
        )

    mock_runtime.execute_workflow_async = mock_execute

    service = ExternalAgentService(runtime=mock_runtime)
    return service
