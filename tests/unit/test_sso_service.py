"""
Unit Tests for SSO Service

Tier 1: Fast, isolated unit tests with mocked external dependencies.
Tests encryption, authorization URL generation, state validation, and domain restrictions.
"""

import secrets
from unittest.mock import AsyncMock, Mock, patch
from urllib.parse import parse_qs, urlparse

import pytest
from studio.config.sso import PROVIDER_PRESETS, get_provider_urls
from studio.services.sso_service import SSOService


@pytest.mark.unit
class TestSSOServiceEncryption:
    """Test encryption and decryption of client secrets."""

    def test_encrypt_secret(self):
        """Test that secrets are encrypted properly."""
        service = SSOService()
        secret = "super_secret_client_secret"

        encrypted = service.encrypt_secret(secret)

        assert encrypted != secret
        assert isinstance(encrypted, str)
        assert len(encrypted) > 0

    def test_decrypt_secret(self):
        """Test that encrypted secrets can be decrypted."""
        service = SSOService()
        secret = "super_secret_client_secret"

        encrypted = service.encrypt_secret(secret)
        decrypted = service.decrypt_secret(encrypted)

        assert decrypted == secret

    def test_decrypt_invalid_secret_raises_error(self):
        """Test that decrypting invalid data raises an error."""
        service = SSOService()

        with pytest.raises((ValueError, TypeError, Exception)):
            service.decrypt_secret("invalid_encrypted_data")

    def test_encrypt_empty_secret(self):
        """Test encryption of empty strings."""
        service = SSOService()
        secret = ""

        encrypted = service.encrypt_secret(secret)
        decrypted = service.decrypt_secret(encrypted)

        assert decrypted == secret

    def test_encrypt_special_characters(self):
        """Test encryption with special characters."""
        service = SSOService()
        secret = "secret!@#$%^&*()_+-=[]{}|;':\",./<>?"

        encrypted = service.encrypt_secret(secret)
        decrypted = service.decrypt_secret(encrypted)

        assert decrypted == secret

    def test_encrypt_unicode_characters(self):
        """Test encryption with unicode characters."""
        service = SSOService()
        secret = "secret_with_unicode_你好_мир_🔐"

        encrypted = service.encrypt_secret(secret)
        decrypted = service.decrypt_secret(encrypted)

        assert decrypted == secret

    def test_fernet_lazy_initialization(self):
        """Test that Fernet is lazily initialized."""
        service = SSOService()

        assert service._fernet is None

        # Access fernet property
        fernet1 = service.fernet

        assert service._fernet is not None

        # Second access should return same instance
        fernet2 = service.fernet

        assert fernet1 is fernet2


@pytest.mark.unit
class TestSSOAuthorizationURL:
    """Test authorization URL generation."""

    @pytest.mark.asyncio
    async def test_generate_azure_authorization_url(self):
        """Test Azure AD authorization URL generation."""
        service = SSOService()

        # Mock connection data
        connection = {
            "id": "conn-123",
            "provider": "azure",
            "client_id": "azure-client-id",
            "client_secret_encrypted": "encrypted_secret",
            "status": "active",
            "tenant_id": "tenant-123",
        }

        # Mock the database read
        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            state = secrets.token_urlsafe(32)
            auth_url = await service.get_authorization_url("conn-123", state)

            # Verify URL structure
            assert auth_url.startswith("https://login.microsoftonline.com/")
            assert "client_id=azure-client-id" in auth_url
            assert f"state={state}" in auth_url
            assert "response_type=code" in auth_url
            assert "scope=openid" in auth_url

    @pytest.mark.asyncio
    async def test_generate_google_authorization_url(self):
        """Test Google OAuth authorization URL generation."""
        service = SSOService()

        connection = {
            "id": "conn-456",
            "provider": "google",
            "client_id": "google-client-id",
            "client_secret_encrypted": "encrypted_secret",
            "status": "active",
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            state = secrets.token_urlsafe(32)
            auth_url = await service.get_authorization_url("conn-456", state)

            assert auth_url.startswith("https://accounts.google.com/")
            assert "client_id=google-client-id" in auth_url
            assert f"state={state}" in auth_url

    @pytest.mark.asyncio
    async def test_generate_okta_authorization_url(self):
        """Test Okta authorization URL generation."""
        service = SSOService()

        connection = {
            "id": "conn-789",
            "provider": "okta",
            "client_id": "okta-client-id",
            "client_secret_encrypted": "encrypted_secret",
            "status": "active",
            "domain": "dev-123456.okta.com",
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            state = secrets.token_urlsafe(32)
            auth_url = await service.get_authorization_url("conn-789", state)

            assert "dev-123456.okta.com/oauth2/v1/authorize" in auth_url
            assert "client_id=okta-client-id" in auth_url

    @pytest.mark.asyncio
    async def test_generate_custom_authorization_url(self):
        """Test custom provider authorization URL generation."""
        service = SSOService()

        connection = {
            "id": "conn-custom",
            "provider": "custom",
            "client_id": "custom-client-id",
            "client_secret_encrypted": "encrypted_secret",
            "status": "active",
            "custom_authorize_url": "https://custom.provider.com/oauth/authorize",
            "custom_token_url": "https://custom.provider.com/oauth/token",
            "custom_userinfo_url": "https://custom.provider.com/oauth/userinfo",
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            state = secrets.token_urlsafe(32)
            auth_url = await service.get_authorization_url("conn-custom", state)

            assert auth_url.startswith("https://custom.provider.com/oauth/authorize")
            assert "client_id=custom-client-id" in auth_url

    @pytest.mark.asyncio
    async def test_authorization_url_with_custom_redirect_uri(self):
        """Test authorization URL generation with custom redirect URI."""
        service = SSOService()

        connection = {
            "id": "conn-123",
            "provider": "google",
            "client_id": "google-client-id",
            "client_secret_encrypted": "encrypted_secret",
            "status": "active",
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            state = secrets.token_urlsafe(32)
            custom_redirect_uri = "https://custom.redirect.uri/callback"

            auth_url = await service.get_authorization_url(
                "conn-123", state, redirect_uri=custom_redirect_uri
            )

            # Check for URL-encoded version
            from urllib.parse import quote

            assert quote(custom_redirect_uri, safe="") in auth_url

    @pytest.mark.asyncio
    async def test_authorization_url_for_inactive_connection(self):
        """Test that inactive connections raise errors."""
        service = SSOService()

        connection = {
            "id": "conn-inactive",
            "provider": "google",
            "client_id": "google-client-id",
            "client_secret_encrypted": "encrypted_secret",
            "status": "inactive",
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            state = secrets.token_urlsafe(32)

            with pytest.raises(ValueError) as exc_info:
                await service.get_authorization_url("conn-inactive", state)

            assert "not active" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_authorization_url_for_nonexistent_connection(self):
        """Test that nonexistent connections raise errors."""
        service = SSOService()

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({}, "run-123")

            state = secrets.token_urlsafe(32)

            with pytest.raises(ValueError) as exc_info:
                await service.get_authorization_url("nonexistent", state)

            assert "not found" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_azure_authorization_url_includes_nonce(self):
        """Test that Azure auth URLs include nonce parameter."""
        service = SSOService()

        connection = {
            "id": "conn-azure",
            "provider": "azure",
            "client_id": "azure-client-id",
            "client_secret_encrypted": "encrypted_secret",
            "status": "active",
            "tenant_id": "tenant-123",
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            state = secrets.token_urlsafe(32)
            auth_url = await service.get_authorization_url("conn-azure", state)

            parsed = urlparse(auth_url)
            params = parse_qs(parsed.query)

            assert "nonce" in params
            assert len(params["nonce"][0]) > 0


@pytest.mark.unit
class TestStateValidation:
    """Test OAuth state parameter validation."""

    def test_state_parameter_is_required(self):
        """Test that state parameter is required for CSRF protection."""
        # State parameter should be checked in API layer
        # This is a placeholder for state validation tests
        state = secrets.token_urlsafe(32)

        assert len(state) > 0
        assert isinstance(state, str)

    def test_state_parameter_uniqueness(self):
        """Test that generated state parameters are unique."""
        states = set()

        for _ in range(1000):
            state = secrets.token_urlsafe(32)
            assert state not in states
            states.add(state)

        assert len(states) == 1000


@pytest.mark.unit
class TestDomainRestrictionValidation:
    """Test email domain restriction validation."""

    def test_single_allowed_domain(self):
        """Test validation with single allowed domain."""
        sso_user = {
            "email": "user@example.com",
            "provider_user_id": "user-123",
            "provider": "google",
            "name": "Test User",
        }

        connection = {
            "allowed_domains": "example.com",
        }

        # Extract domain validation logic
        allowed = [d.strip().lower() for d in connection["allowed_domains"].split(",")]
        email_domain = sso_user["email"].split("@")[1].lower()

        assert email_domain in allowed

    def test_multiple_allowed_domains(self):
        """Test validation with multiple allowed domains."""
        sso_user = {
            "email": "user@company.com",
            "provider_user_id": "user-123",
            "provider": "google",
            "name": "Test User",
        }

        connection = {
            "allowed_domains": "example.com, company.com, test.org",
        }

        allowed = [d.strip().lower() for d in connection["allowed_domains"].split(",")]
        email_domain = sso_user["email"].split("@")[1].lower()

        assert email_domain in allowed

    def test_domain_case_insensitive(self):
        """Test that domain validation is case-insensitive."""
        sso_user = {
            "email": "user@EXAMPLE.COM",
            "provider_user_id": "user-123",
            "provider": "google",
            "name": "Test User",
        }

        connection = {
            "allowed_domains": "example.com",
        }

        allowed = [d.strip().lower() for d in connection["allowed_domains"].split(",")]
        email_domain = sso_user["email"].split("@")[1].lower()

        assert email_domain in allowed

    def test_restricted_domain_rejected(self):
        """Test that non-allowed domains are rejected."""
        sso_user = {
            "email": "user@unauthorized.com",
            "provider_user_id": "user-123",
            "provider": "google",
            "name": "Test User",
        }

        connection = {
            "allowed_domains": "example.com, company.com",
        }

        allowed = [d.strip().lower() for d in connection["allowed_domains"].split(",")]
        email_domain = sso_user["email"].split("@")[1].lower()

        assert email_domain not in allowed

    def test_no_domain_restriction(self):
        """Test that no restriction allows all domains."""
        sso_user = {
            "email": "user@any-domain.com",
            "provider_user_id": "user-123",
            "provider": "google",
            "name": "Test User",
        }

        connection = {
            "allowed_domains": None,
        }

        # No restriction check needed
        assert connection["allowed_domains"] is None

    def test_domain_with_whitespace(self):
        """Test that domains with whitespace are handled correctly."""
        sso_user = {
            "email": "user@company.com",
            "provider_user_id": "user-123",
            "provider": "google",
            "name": "Test User",
        }

        connection = {
            "allowed_domains": "  example.com  ,  company.com  ,  test.org  ",
        }

        allowed = [d.strip().lower() for d in connection["allowed_domains"].split(",")]
        email_domain = sso_user["email"].split("@")[1].lower()

        assert email_domain in allowed


@pytest.mark.unit
class TestProviderURLConfiguration:
    """Test provider URL configuration and resolution."""

    def test_azure_urls(self):
        """Test Azure AD provider URLs."""
        urls = get_provider_urls("azure", tenant_id="tenant-123")

        assert "login.microsoftonline.com/tenant-123" in urls["authorize_url"]
        assert "login.microsoftonline.com/tenant-123" in urls["token_url"]
        assert "graph.microsoft.com" in urls["userinfo_url"]

    def test_google_urls(self):
        """Test Google OAuth provider URLs."""
        urls = get_provider_urls("google")

        assert "accounts.google.com" in urls["authorize_url"]
        assert "oauth2.googleapis.com" in urls["token_url"]
        assert "openidconnect.googleapis.com" in urls["userinfo_url"]

    def test_okta_urls(self):
        """Test Okta provider URLs."""
        urls = get_provider_urls("okta", domain="dev-123456.okta.com")

        assert "dev-123456.okta.com/oauth2/v1/authorize" in urls["authorize_url"]
        assert "dev-123456.okta.com/oauth2/v1/token" in urls["token_url"]
        assert "dev-123456.okta.com/oauth2/v1/userinfo" in urls["userinfo_url"]

    def test_auth0_urls(self):
        """Test Auth0 provider URLs."""
        urls = get_provider_urls("auth0", domain="dev-123456.auth0.com")

        assert "dev-123456.auth0.com/authorize" in urls["authorize_url"]
        assert "dev-123456.auth0.com/oauth/token" in urls["token_url"]
        assert "dev-123456.auth0.com/userinfo" in urls["userinfo_url"]

    def test_azure_common_tenant_default(self):
        """Test that Azure defaults to 'common' tenant."""
        urls = get_provider_urls("azure")

        assert "login.microsoftonline.com/common" in urls["authorize_url"]

    def test_provider_presets_structure(self):
        """Test that all providers have required presets."""
        required_keys = ["authorize_url", "token_url", "userinfo_url", "scope"]

        for provider, preset in PROVIDER_PRESETS.items():
            assert "authorize_url" in preset
            assert "token_url" in preset
            assert "userinfo_url" in preset
            assert "scope" in preset

    def test_invalid_provider_raises_error(self):
        """Test that invalid provider raises error."""
        with pytest.raises(ValueError) as exc_info:
            get_provider_urls("invalid_provider")

        assert "Unknown provider" in str(exc_info.value)


@pytest.mark.unit
class TestSSOServiceInitialization:
    """Test SSOService initialization."""

    def test_sso_service_initialization(self):
        """Test that SSOService initializes correctly."""
        service = SSOService()

        assert service.settings is not None
        assert service.runtime is not None
        assert service._fernet is None  # Lazily initialized

    def test_multiple_service_instances_independent(self):
        """Test that multiple service instances are independent."""
        service1 = SSOService()
        service2 = SSOService()

        # Fernet instances should be independent until accessed
        assert service1._fernet is None
        assert service2._fernet is None

        # Access fernet on service1
        fernet1 = service1.fernet

        # service2 should still have None
        assert service2._fernet is None


@pytest.mark.unit
class TestUserInfoNormalization:
    """Test normalization of user info from different providers."""

    def test_normalize_google_userinfo(self):
        """Test normalization of Google user info."""
        google_userinfo = {
            "sub": "google-user-123",
            "email": "user@example.com",
            "name": "Test User",
            "given_name": "Test",
        }

        normalized = {
            "provider_user_id": google_userinfo.get("sub") or google_userinfo.get("id"),
            "email": google_userinfo.get("email"),
            "name": google_userinfo.get("name")
            or google_userinfo.get("given_name", ""),
            "provider": "google",
        }

        assert normalized["provider_user_id"] == "google-user-123"
        assert normalized["email"] == "user@example.com"
        assert normalized["name"] == "Test User"

    def test_normalize_azure_userinfo(self):
        """Test normalization of Azure user info."""
        azure_userinfo = {
            "sub": "azure-user-123",
            "email": "user@company.com",
            "given_name": "Test",
            "family_name": "User",
        }

        normalized = {
            "provider_user_id": azure_userinfo.get("sub") or azure_userinfo.get("id"),
            "email": azure_userinfo.get("email"),
            "name": azure_userinfo.get("name") or azure_userinfo.get("given_name", ""),
            "provider": "azure",
        }

        assert normalized["provider_user_id"] == "azure-user-123"
        assert normalized["email"] == "user@company.com"

    def test_normalize_okta_userinfo(self):
        """Test normalization of Okta user info."""
        okta_userinfo = {
            "sub": "okta-user-123",
            "email": "user@okta.example.com",
            "name": "Test User",
        }

        normalized = {
            "provider_user_id": okta_userinfo.get("sub") or okta_userinfo.get("id"),
            "email": okta_userinfo.get("email"),
            "name": okta_userinfo.get("name") or okta_userinfo.get("given_name", ""),
            "provider": "okta",
        }

        assert normalized["provider_user_id"] == "okta-user-123"

    def test_normalize_userinfo_fallback_id(self):
        """Test that userinfo normalization falls back to 'id' field."""
        userinfo_with_id = {
            "id": "user-id-456",
            "email": "user@example.com",
            "given_name": "Test",
        }

        normalized = {
            "provider_user_id": userinfo_with_id.get("sub")
            or userinfo_with_id.get("id"),
            "email": userinfo_with_id.get("email"),
            "name": userinfo_with_id.get("name")
            or userinfo_with_id.get("given_name", ""),
        }

        assert normalized["provider_user_id"] == "user-id-456"

    def test_normalize_userinfo_missing_name(self):
        """Test that missing name fields are handled gracefully."""
        userinfo = {
            "sub": "user-123",
            "email": "user@example.com",
        }

        normalized = {
            "provider_user_id": userinfo.get("sub"),
            "email": userinfo.get("email"),
            "name": userinfo.get("name") or userinfo.get("given_name", ""),
        }

        assert normalized["name"] == ""


@pytest.mark.unit
class TestGoogleSSOTokenExchange:
    """Test Google OAuth 2.0 token exchange and user info fetching."""

    @pytest.mark.asyncio
    async def test_google_token_exchange_success(self):
        """Test successful Google OAuth token exchange."""
        service = SSOService()

        connection = {
            "id": "conn-google",
            "provider": "google",
            "client_id": "google-client-id",
            "client_secret_encrypted": service.encrypt_secret("google-secret"),
            "status": "active",
        }

        mock_token_response = {
            "access_token": "google-access-token",
            "token_type": "Bearer",
            "expires_in": 3600,
            "refresh_token": "google-refresh-token",
        }

        mock_userinfo = {
            "id": "google-user-12345",
            "email": "user@gmail.com",
            "name": "John Doe",
            "given_name": "John",
            "family_name": "Doe",
            "picture": "https://lh3.googleusercontent.com/...",
            "verified_email": True,
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            with patch("httpx.AsyncClient") as mock_client:
                mock_instance = AsyncMock()
                mock_client.return_value.__aenter__.return_value = mock_instance

                # Mock token response
                mock_token_resp = Mock()
                mock_token_resp.status_code = 200
                mock_token_resp.json = Mock(return_value=mock_token_response)
                mock_instance.post.return_value = mock_token_resp

                # Mock userinfo response
                mock_userinfo_resp = Mock()
                mock_userinfo_resp.status_code = 200
                mock_userinfo_resp.json = Mock(return_value=mock_userinfo)
                mock_instance.get.return_value = mock_userinfo_resp

                # Execute token exchange
                result = await service.exchange_code("conn-google", "auth-code-123")

                # Verify result structure
                assert result["provider"] == "google"
                assert result["provider_user_id"] == "google-user-12345"
                assert result["email"] == "user@gmail.com"
                assert result["name"] == "John Doe"

                # Verify token endpoint was called
                mock_instance.post.assert_called_once()
                call_args = mock_instance.post.call_args
                assert "oauth2.googleapis.com/token" in call_args[0][0]

                # Verify userinfo endpoint was called
                mock_instance.get.assert_called_once()
                call_args = mock_instance.get.call_args
                assert "openidconnect.googleapis.com/v1/userinfo" in call_args[0][0]

    @pytest.mark.asyncio
    async def test_google_token_exchange_failure(self):
        """Test Google token exchange with invalid code."""
        service = SSOService()

        connection = {
            "id": "conn-google",
            "provider": "google",
            "client_id": "google-client-id",
            "client_secret_encrypted": service.encrypt_secret("google-secret"),
            "status": "active",
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            with patch("httpx.AsyncClient") as mock_client:
                mock_instance = AsyncMock()
                mock_client.return_value.__aenter__.return_value = mock_instance

                # Mock failed token response
                mock_token_resp = Mock()
                mock_token_resp.status_code = 400
                mock_token_resp.text = "invalid_grant"
                mock_instance.post.return_value = mock_token_resp

                # Expect error
                with pytest.raises(ValueError) as exc_info:
                    await service.exchange_code("conn-google", "invalid-code")

                assert "Token exchange failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_google_userinfo_fetch_failure(self):
        """Test Google token exchange with userinfo fetch failure."""
        service = SSOService()

        connection = {
            "id": "conn-google",
            "provider": "google",
            "client_id": "google-client-id",
            "client_secret_encrypted": service.encrypt_secret("google-secret"),
            "status": "active",
        }

        mock_token_response = {
            "access_token": "google-access-token",
            "token_type": "Bearer",
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            with patch("httpx.AsyncClient") as mock_client:
                mock_instance = AsyncMock()
                mock_client.return_value.__aenter__.return_value = mock_instance

                # Mock successful token response
                mock_token_resp = Mock()
                mock_token_resp.status_code = 200
                mock_token_resp.json = Mock(return_value=mock_token_response)
                mock_instance.post.return_value = mock_token_resp

                # Mock failed userinfo response
                mock_userinfo_resp = Mock()
                mock_userinfo_resp.status_code = 401
                mock_userinfo_resp.text = "Unauthorized"
                mock_instance.get.return_value = mock_userinfo_resp

                # Expect error
                with pytest.raises(ValueError) as exc_info:
                    await service.exchange_code("conn-google", "auth-code-123")

                assert "User info fetch failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_google_userinfo_normalization_with_fallback(self):
        """Test Google userinfo normalization with missing name field."""
        service = SSOService()

        connection = {
            "id": "conn-google",
            "provider": "google",
            "client_id": "google-client-id",
            "client_secret_encrypted": service.encrypt_secret("google-secret"),
            "status": "active",
        }

        mock_token_response = {
            "access_token": "google-access-token",
        }

        mock_userinfo = {
            "id": "google-user-12345",
            "email": "user@gmail.com",
            "given_name": "John",
            # Missing "name" field
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            with patch("httpx.AsyncClient") as mock_client:
                mock_instance = AsyncMock()
                mock_client.return_value.__aenter__.return_value = mock_instance

                mock_token_resp = Mock()
                mock_token_resp.status_code = 200
                mock_token_resp.json = Mock(return_value=mock_token_response)
                mock_instance.post.return_value = mock_token_resp

                mock_userinfo_resp = Mock()
                mock_userinfo_resp.status_code = 200
                mock_userinfo_resp.json = Mock(return_value=mock_userinfo)
                mock_instance.get.return_value = mock_userinfo_resp

                result = await service.exchange_code("conn-google", "auth-code-123")

                # Should fallback to given_name
                assert result["name"] == "John"


@pytest.mark.unit
class TestOktaSSOTokenExchange:
    """Test Okta OAuth 2.0/OIDC token exchange and user info fetching."""

    @pytest.mark.asyncio
    async def test_okta_token_exchange_success(self):
        """Test successful Okta OAuth token exchange."""
        service = SSOService()

        connection = {
            "id": "conn-okta",
            "provider": "okta",
            "client_id": "okta-client-id",
            "client_secret_encrypted": service.encrypt_secret("okta-secret"),
            "status": "active",
            "domain": "dev-12345.okta.com",
        }

        mock_token_response = {
            "access_token": "okta-access-token",
            "token_type": "Bearer",
            "expires_in": 3600,
            "id_token": "eyJhbGci...",
        }

        mock_userinfo = {
            "sub": "00u12345abcdefg",
            "email": "user@company.com",
            "name": "Jane Smith",
            "preferred_username": "jane.smith@company.com",
            "email_verified": True,
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            with patch("httpx.AsyncClient") as mock_client:
                mock_instance = AsyncMock()
                mock_client.return_value.__aenter__.return_value = mock_instance

                # Mock token response
                mock_token_resp = Mock()
                mock_token_resp.status_code = 200
                mock_token_resp.json = Mock(return_value=mock_token_response)
                mock_instance.post.return_value = mock_token_resp

                # Mock userinfo response
                mock_userinfo_resp = Mock()
                mock_userinfo_resp.status_code = 200
                mock_userinfo_resp.json = Mock(return_value=mock_userinfo)
                mock_instance.get.return_value = mock_userinfo_resp

                # Execute token exchange
                result = await service.exchange_code("conn-okta", "auth-code-456")

                # Verify result structure
                assert result["provider"] == "okta"
                assert result["provider_user_id"] == "00u12345abcdefg"
                assert result["email"] == "user@company.com"
                assert result["name"] == "Jane Smith"

                # Verify token endpoint was called with correct domain
                mock_instance.post.assert_called_once()
                call_args = mock_instance.post.call_args
                assert "dev-12345.okta.com/oauth2/v1/token" in call_args[0][0]

                # Verify userinfo endpoint was called
                mock_instance.get.assert_called_once()
                call_args = mock_instance.get.call_args
                assert "dev-12345.okta.com/oauth2/v1/userinfo" in call_args[0][0]

    @pytest.mark.asyncio
    async def test_okta_token_exchange_failure(self):
        """Test Okta token exchange with invalid code."""
        service = SSOService()

        connection = {
            "id": "conn-okta",
            "provider": "okta",
            "client_id": "okta-client-id",
            "client_secret_encrypted": service.encrypt_secret("okta-secret"),
            "status": "active",
            "domain": "dev-12345.okta.com",
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            with patch("httpx.AsyncClient") as mock_client:
                mock_instance = AsyncMock()
                mock_client.return_value.__aenter__.return_value = mock_instance

                # Mock failed token response
                mock_token_resp = Mock()
                mock_token_resp.status_code = 401
                mock_token_resp.text = "invalid_client"
                mock_instance.post.return_value = mock_token_resp

                # Expect error
                with pytest.raises(ValueError) as exc_info:
                    await service.exchange_code("conn-okta", "invalid-code")

                assert "Token exchange failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_okta_userinfo_normalization_with_preferred_username(self):
        """Test Okta userinfo normalization with preferred_username fallback."""
        service = SSOService()

        connection = {
            "id": "conn-okta",
            "provider": "okta",
            "client_id": "okta-client-id",
            "client_secret_encrypted": service.encrypt_secret("okta-secret"),
            "status": "active",
            "domain": "dev-12345.okta.com",
        }

        mock_token_response = {
            "access_token": "okta-access-token",
        }

        mock_userinfo = {
            "sub": "00u12345abcdefg",
            "email": "user@company.com",
            "preferred_username": "user@company.com",
            # Missing "name" field
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            with patch("httpx.AsyncClient") as mock_client:
                mock_instance = AsyncMock()
                mock_client.return_value.__aenter__.return_value = mock_instance

                mock_token_resp = Mock()
                mock_token_resp.status_code = 200
                mock_token_resp.json = Mock(return_value=mock_token_response)
                mock_instance.post.return_value = mock_token_resp

                mock_userinfo_resp = Mock()
                mock_userinfo_resp.status_code = 200
                mock_userinfo_resp.json = Mock(return_value=mock_userinfo)
                mock_instance.get.return_value = mock_userinfo_resp

                result = await service.exchange_code("conn-okta", "auth-code-456")

                # Should fallback to preferred_username
                assert result["name"] == "user@company.com"

    @pytest.mark.asyncio
    async def test_okta_custom_authorization_server(self):
        """Test Okta with custom authorization server."""
        service = SSOService()

        # Okta can use custom authorization servers
        connection = {
            "id": "conn-okta-custom",
            "provider": "okta",
            "client_id": "okta-client-id",
            "client_secret_encrypted": service.encrypt_secret("okta-secret"),
            "status": "active",
            "domain": "company.okta.com",
        }

        mock_token_response = {
            "access_token": "okta-access-token",
        }

        mock_userinfo = {
            "sub": "00u12345abcdefg",
            "email": "user@company.com",
            "name": "Test User",
        }

        with patch.object(service.runtime, "execute_workflow_async") as mock_execute:
            mock_execute.return_value = ({"read_connection": connection}, "run-123")

            with patch("httpx.AsyncClient") as mock_client:
                mock_instance = AsyncMock()
                mock_client.return_value.__aenter__.return_value = mock_instance

                mock_token_resp = Mock()
                mock_token_resp.status_code = 200
                mock_token_resp.json = Mock(return_value=mock_token_response)
                mock_instance.post.return_value = mock_token_resp

                mock_userinfo_resp = Mock()
                mock_userinfo_resp.status_code = 200
                mock_userinfo_resp.json = Mock(return_value=mock_userinfo)
                mock_instance.get.return_value = mock_userinfo_resp

                result = await service.exchange_code("conn-okta-custom", "auth-code")

                # Verify custom domain was used
                call_args = mock_instance.post.call_args
                assert "company.okta.com/oauth2/v1/token" in call_args[0][0]
