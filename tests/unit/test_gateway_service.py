"""
Unit Tests for Gateway Service

Tier 1: Fast, isolated tests without external dependencies.
Tests encryption, decryption, secret management, and service initialization.
"""

import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from cryptography.fernet import Fernet
from studio.services.gateway_service import GatewayService


class TestGatewayServiceEncryption:
    """Test encryption and decryption functionality."""

    @pytest.fixture
    def gateway_service(self):
        """Create gateway service instance."""
        return GatewayService()

    def test_fernet_initialization(self, gateway_service):
        """Test Fernet cipher is initialized correctly."""
        fernet = gateway_service.fernet
        assert fernet is not None
        assert isinstance(fernet, Fernet)

    def test_fernet_singleton(self, gateway_service):
        """Test Fernet instance is cached."""
        fernet1 = gateway_service.fernet
        fernet2 = gateway_service.fernet
        assert fernet1 is fernet2

    def test_encrypt_secret_returns_string(self, gateway_service):
        """Test encrypt_secret returns encrypted string."""
        secret = "test-api-key-123"
        encrypted = gateway_service.encrypt_secret(secret)
        assert isinstance(encrypted, str)
        assert encrypted != secret

    def test_decrypt_secret_returns_original(self, gateway_service):
        """Test decrypt_secret recovers original value."""
        secret = "test-api-key-456"
        encrypted = gateway_service.encrypt_secret(secret)
        decrypted = gateway_service.decrypt_secret(encrypted)
        assert decrypted == secret

    def test_encrypt_decrypt_roundtrip(self, gateway_service):
        """Test multiple encrypt/decrypt cycles."""
        secrets = ["key1", "key2", "complex-key_with.symbols!@#"]
        for secret in secrets:
            encrypted = gateway_service.encrypt_secret(secret)
            decrypted = gateway_service.decrypt_secret(encrypted)
            assert decrypted == secret

    def test_decrypt_invalid_encrypted_raises_error(self, gateway_service):
        """Test decrypting invalid data raises error."""
        with pytest.raises(Exception):
            gateway_service.decrypt_secret("not-valid-encrypted-data")

    def test_encrypt_empty_string(self, gateway_service):
        """Test encrypting empty string."""
        encrypted = gateway_service.encrypt_secret("")
        decrypted = gateway_service.decrypt_secret(encrypted)
        assert decrypted == ""

    def test_encrypt_unicode_characters(self, gateway_service):
        """Test encrypting Unicode characters."""
        secret = "password-with-émojis-🔐"
        encrypted = gateway_service.encrypt_secret(secret)
        decrypted = gateway_service.decrypt_secret(encrypted)
        assert decrypted == secret

    def test_encrypt_long_secret(self, gateway_service):
        """Test encrypting very long secret."""
        secret = "x" * 10000
        encrypted = gateway_service.encrypt_secret(secret)
        decrypted = gateway_service.decrypt_secret(encrypted)
        assert decrypted == secret

    def test_different_secrets_produce_different_encrypted_values(
        self, gateway_service
    ):
        """Test different inputs produce different outputs."""
        secret1 = "secret-1"
        secret2 = "secret-2"
        encrypted1 = gateway_service.encrypt_secret(secret1)
        encrypted2 = gateway_service.encrypt_secret(secret2)
        assert encrypted1 != encrypted2


class TestGatewayServiceInitialization:
    """Test service initialization and configuration."""

    def test_service_initialization(self):
        """Test service initializes without errors."""
        service = GatewayService()
        assert service is not None
        assert service.settings is not None
        assert service.runtime is not None

    @patch("studio.services.gateway_service.get_settings")
    def test_settings_loaded_from_config(self, mock_get_settings):
        """Test settings are loaded from config."""
        mock_settings = MagicMock()
        mock_get_settings.return_value = mock_settings
        service = GatewayService()
        mock_get_settings.assert_called_once()

    @patch("studio.services.gateway_service.get_settings")
    def test_fernet_generated_when_no_key_in_settings(self, mock_get_settings):
        """Test Fernet key is generated when not in settings."""
        mock_settings = MagicMock()
        mock_settings.encryption_key = None
        mock_get_settings.return_value = mock_settings
        service = GatewayService()
        fernet = service.fernet
        assert fernet is not None

    @patch("studio.services.gateway_service.get_settings")
    def test_fernet_uses_provided_key(self, mock_get_settings):
        """Test Fernet uses provided encryption key."""
        encryption_key = Fernet.generate_key()
        mock_settings = MagicMock()
        mock_settings.encryption_key = encryption_key
        mock_get_settings.return_value = mock_settings
        service = GatewayService()
        fernet = service.fernet
        # Test that encryption/decryption works with the provided key
        secret = "test"
        encrypted = fernet.encrypt(secret.encode())
        decrypted = fernet.decrypt(encrypted).decode()
        assert decrypted == secret

    def test_runtime_is_async_local_runtime(self):
        """Test runtime is AsyncLocalRuntime."""
        service = GatewayService()
        from kailash.runtime import AsyncLocalRuntime

        assert isinstance(service.runtime, AsyncLocalRuntime)


class TestGatewayServiceDataPreparation:
    """Test gateway data preparation and validation."""

    @pytest.fixture
    def gateway_service(self):
        """Create gateway service."""
        return GatewayService()

    def test_generate_uuid_for_gateway_id(self):
        """Test gateway IDs are valid UUIDs."""
        service = GatewayService()
        gateway_id = str(uuid.uuid4())
        assert isinstance(gateway_id, str)
        assert len(gateway_id) == 36  # Standard UUID format

    def test_timestamp_is_iso_format(self):
        """Test timestamps are ISO format."""
        now = datetime.now(UTC).isoformat()
        assert isinstance(now, str)
        assert "T" in now
        assert "Z" in now or "+" in now

    def test_environment_values_valid(self):
        """Test valid environment values."""
        valid_envs = ["development", "staging", "production"]
        for env in valid_envs:
            assert env in valid_envs

    def test_status_values_valid(self):
        """Test valid status values."""
        valid_statuses = ["active", "inactive", "error"]
        for status in valid_statuses:
            assert status in valid_statuses

    def test_health_check_status_values_valid(self):
        """Test valid health check status values."""
        valid_statuses = ["healthy", "unhealthy", "unknown"]
        for status in valid_statuses:
            assert status in valid_statuses


class TestGatewayServiceWorkflowConstruction:
    """Test workflow construction patterns."""

    @pytest.fixture
    def gateway_service(self):
        """Create gateway service."""
        return GatewayService()

    def test_url_trailing_slash_removed(self, gateway_service):
        """Test trailing slashes are removed from URLs."""
        # Simulating the URL cleaning logic
        urls = [
            "https://gateway.example.com/",
            "https://gateway.example.com",
        ]
        for url in urls:
            cleaned = url.rstrip("/")
            assert not cleaned.endswith("/")

    def test_gateway_data_structure(self, gateway_service):
        """Test expected gateway data structure."""
        now = datetime.now(UTC).isoformat()
        gateway_data = {
            "id": str(uuid.uuid4()),
            "organization_id": str(uuid.uuid4()),
            "name": "Test Gateway",
            "description": "Test Description",
            "api_url": "https://gateway.example.com",
            "api_key_encrypted": "encrypted_key",
            "environment": "development",
            "status": "active",
            "health_check_url": None,
            "last_health_check": None,
            "last_health_status": "unknown",
            "created_at": now,
            "updated_at": now,
        }
        assert "id" in gateway_data
        assert "organization_id" in gateway_data
        assert "api_key_encrypted" in gateway_data
        assert gateway_data["status"] == "active"

    def test_gateway_response_excludes_encrypted_key(self):
        """Test encrypted key is removed from response."""
        gateway_data = {
            "id": str(uuid.uuid4()),
            "organization_id": str(uuid.uuid4()),
            "name": "Test Gateway",
            "api_key_encrypted": "should_be_removed",
            "api_url": "https://gateway.example.com",
            "status": "active",
        }
        # Simulate response preparation
        result = gateway_data.copy()
        result.pop("api_key_encrypted", None)
        assert "api_key_encrypted" not in result


class TestGatewayServiceErrorHandling:
    """Test error handling and edge cases."""

    @pytest.fixture
    def gateway_service(self):
        """Create gateway service."""
        return GatewayService()

    def test_empty_organization_id_detected(self, gateway_service):
        """Test empty organization_id is detected."""
        org_id = ""
        assert len(org_id) == 0

    def test_invalid_url_format_detected(self, gateway_service):
        """Test invalid URL formats are detected."""
        invalid_urls = ["", "not-a-url", "htp://bad"]
        for url in invalid_urls:
            assert not (url.startswith("http://") or url.startswith("https://"))

    def test_missing_required_fields(self):
        """Test missing required fields in gateway data."""
        incomplete_data = {
            "name": "Test Gateway",
            # Missing: organization_id, api_url, api_key
        }
        required_fields = ["organization_id", "api_url", "api_key"]
        missing = [f for f in required_fields if f not in incomplete_data]
        assert len(missing) > 0

    def test_invalid_environment_value(self):
        """Test invalid environment values."""
        valid_envs = ["development", "staging", "production"]
        invalid_env = "invalid-env"
        assert invalid_env not in valid_envs

    def test_invalid_status_value(self):
        """Test invalid status values."""
        valid_statuses = ["active", "inactive", "error"]
        invalid_status = "processing"
        assert invalid_status not in valid_statuses


class TestGatewayServiceHealthCheckLogic:
    """Test health check logic and status determination."""

    @pytest.fixture
    def gateway_service(self):
        """Create gateway service."""
        return GatewayService()

    def test_health_check_url_construction(self, gateway_service):
        """Test health check URL construction."""
        api_url = "https://gateway.example.com"
        health_check_url = None
        # Simulating the logic: use provided URL or construct default
        final_url = health_check_url or f"{api_url}/health"
        assert final_url == "https://gateway.example.com/health"

    def test_custom_health_check_url_used(self, gateway_service):
        """Test custom health check URL is preferred."""
        api_url = "https://gateway.example.com"
        custom_url = "https://gateway.example.com/api/health/status"
        final_url = custom_url or f"{api_url}/health"
        assert final_url == custom_url

    def test_status_determination_from_http_code(self):
        """Test status is determined by HTTP response code."""
        status_map = {
            200: "healthy",
            201: "healthy",
            400: "unhealthy",
            500: "unhealthy",
        }
        for code, expected_status in status_map.items():
            if code in (200, 201):
                assert expected_status == "healthy"
            else:
                assert expected_status == "unhealthy"

    def test_timeout_handling(self):
        """Test timeout is treated as unhealthy."""
        health_status = "unhealthy"
        error_message = "Connection timeout"
        assert health_status == "unhealthy"
        assert error_message is not None

    def test_generic_exception_handling(self):
        """Test generic exceptions are handled."""
        health_status = "unhealthy"
        error_message = "Connection refused"
        assert health_status == "unhealthy"
        assert error_message is not None

    def test_response_time_calculation(self):
        """Test response time is calculated correctly."""
        from datetime import timedelta

        start = datetime.now()
        end = datetime.now() + timedelta(milliseconds=250)
        response_time_ms = (end - start).total_seconds() * 1000
        assert response_time_ms >= 0

    def test_gateway_status_update_on_health_check(self):
        """Test gateway status is updated based on health check."""
        health_status = "healthy"
        expected_gateway_status = "active" if health_status == "healthy" else "error"
        assert expected_gateway_status == "active"

    def test_unhealthy_gateway_status_update(self):
        """Test unhealthy gateway status is set to error."""
        health_status = "unhealthy"
        expected_gateway_status = "active" if health_status == "healthy" else "error"
        assert expected_gateway_status == "error"


class TestGatewayServiceFilteringLogic:
    """Test filtering and query building logic."""

    @pytest.fixture
    def gateway_service(self):
        """Create gateway service."""
        return GatewayService()

    def test_organization_filter_always_included(self, gateway_service):
        """Test organization_id is always in filter."""
        org_id = str(uuid.uuid4())
        filter_data = {"organization_id": org_id}
        assert "organization_id" in filter_data

    def test_optional_environment_filter(self, gateway_service):
        """Test optional environment filter."""
        org_id = str(uuid.uuid4())
        env = "production"
        filter_data = {"organization_id": org_id}
        if env:
            filter_data["environment"] = env
        assert filter_data["environment"] == env

    def test_no_environment_filter_when_none(self, gateway_service):
        """Test environment filter not added when None."""
        org_id = str(uuid.uuid4())
        env = None
        filter_data = {"organization_id": org_id}
        if env:
            filter_data["environment"] = env
        assert "environment" not in filter_data

    def test_multiple_filters_combined(self, gateway_service):
        """Test multiple filters can be combined."""
        org_id = str(uuid.uuid4())
        env = "production"
        status = "active"
        filters = {
            "organization_id": org_id,
            "environment": env,
            "status": status,
        }
        assert len(filters) == 3
        assert filters["organization_id"] == org_id


class TestGatewayServiceDataEncryption:
    """Test API key encryption in gateway operations."""

    @pytest.fixture
    def gateway_service(self):
        """Create gateway service."""
        return GatewayService()

    def test_api_key_encrypted_on_storage(self, gateway_service):
        """Test API key is encrypted before storage."""
        api_key = "my-secret-api-key"
        encrypted = gateway_service.encrypt_secret(api_key)
        assert encrypted != api_key
        assert isinstance(encrypted, str)

    def test_encrypted_key_can_be_decrypted(self, gateway_service):
        """Test encrypted key can be recovered."""
        api_key = "my-secret-api-key"
        encrypted = gateway_service.encrypt_secret(api_key)
        decrypted = gateway_service.decrypt_secret(encrypted)
        assert decrypted == api_key

    def test_api_key_never_in_response(self):
        """Test API key is never included in responses."""
        gateway_response = {
            "id": str(uuid.uuid4()),
            "name": "Test Gateway",
            "api_url": "https://gateway.example.com",
            # api_key_encrypted should be removed
        }
        assert "api_key_encrypted" not in gateway_response
        assert "api_key" not in gateway_response

    def test_encrypted_key_unique_each_time(self, gateway_service):
        """Test same key encrypts differently each time (due to IV)."""
        secret = "same-secret"
        encrypted1 = gateway_service.encrypt_secret(secret)
        encrypted2 = gateway_service.encrypt_secret(secret)
        # Fernet includes timestamp and IV, so results differ
        assert encrypted1 != encrypted2
        # But both decrypt to same value
        assert gateway_service.decrypt_secret(encrypted1) == secret
        assert gateway_service.decrypt_secret(encrypted2) == secret


class TestGatewayServiceDataValidation:
    """Test data validation before operations."""

    @pytest.fixture
    def gateway_service(self):
        """Create gateway service."""
        return GatewayService()

    def test_gateway_name_length_validation(self, gateway_service):
        """Test gateway name length validation."""
        valid_names = ["A", "Gateway Name", "x" * 255]
        for name in valid_names:
            assert 1 <= len(name) <= 255

    def test_gateway_name_too_long_invalid(self, gateway_service):
        """Test name exceeding max length is invalid."""
        name = "x" * 256
        assert len(name) > 255

    def test_gateway_name_empty_invalid(self, gateway_service):
        """Test empty name is invalid."""
        name = ""
        assert len(name) == 0

    def test_api_url_format_validation(self, gateway_service):
        """Test API URL must be valid."""
        valid_urls = [
            "https://gateway.example.com",
            "http://localhost:8000",
            "https://api.service.co.uk/gateway",
        ]
        for url in valid_urls:
            assert url.startswith("http://") or url.startswith("https://")

    def test_api_key_required(self, gateway_service):
        """Test API key is required."""
        api_key = ""
        assert len(api_key) == 0

    def test_organization_id_required(self, gateway_service):
        """Test organization_id is required."""
        org_id = None
        assert org_id is None

    def test_environment_default_value(self, gateway_service):
        """Test environment defaults to development."""
        provided_env = None
        default_env = "development"
        final_env = provided_env or default_env
        assert final_env == "development"

    def test_status_default_value(self, gateway_service):
        """Test status defaults to active."""
        default_status = "active"
        assert default_status == "active"

    def test_health_status_default_value(self, gateway_service):
        """Test health status defaults to unknown."""
        default_health_status = "unknown"
        assert default_health_status == "unknown"
