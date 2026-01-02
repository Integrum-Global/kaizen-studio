"""
Tier 1: Auth Service Unit Tests

Tests password hashing, JWT token generation/validation, and token claims.
Mocking is allowed in Tier 1 for external services.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

import jwt
import pytest
from studio.services.auth_service import AuthService


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPasswordHashing:
    """Test password hashing functionality."""

    def test_hash_password_creates_bcrypt_hash(self):
        """Password hashing should create a valid bcrypt hash."""
        # Mock Redis to avoid connection
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            password = "securepassword123"
            hashed = service.hash_password(password)

            # Bcrypt hashes start with $2b$ or $2a$
            assert hashed.startswith("$2")
            assert hashed != password
            assert len(hashed) == 60  # Bcrypt hash length

    def test_verify_password_success(self):
        """Correct password should verify successfully."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            password = "mysecretpassword"
            hashed = service.hash_password(password)

            assert service.verify_password(password, hashed) is True

    def test_verify_password_failure(self):
        """Incorrect password should fail verification."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            password = "correctpassword"
            wrong_password = "wrongpassword"
            hashed = service.hash_password(password)

            assert service.verify_password(wrong_password, hashed) is False

    def test_hash_password_unique_each_time(self):
        """Same password should produce different hashes (salt)."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            password = "samepassword"
            hash1 = service.hash_password(password)
            hash2 = service.hash_password(password)

            # Different hashes due to random salt
            assert hash1 != hash2
            # But both should verify
            assert service.verify_password(password, hash1)
            assert service.verify_password(password, hash2)


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAccessTokenGeneration:
    """Test JWT access token generation."""

    def test_create_access_token_with_correct_claims(self):
        """Access token should contain correct claims."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            user_id = "user-123"
            org_id = "org-456"
            role = "developer"

            token = service.create_access_token(user_id, org_id, role)
            payload = service.decode_token(token)

            assert payload["sub"] == user_id
            assert payload["org_id"] == org_id
            assert payload["role"] == role
            assert payload["type"] == "access"
            assert "jti" in payload  # JWT ID
            assert "iat" in payload  # Issued at
            assert "exp" in payload  # Expiration

    def test_create_access_token_default_expiry(self):
        """Access token should expire in configured minutes."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            token = service.create_access_token("user-1", "org-1", "admin")
            payload = service.decode_token(token)

            exp = datetime.fromtimestamp(payload["exp"], tz=UTC)
            iat = datetime.fromtimestamp(payload["iat"], tz=UTC)

            # Should be around 15 minutes (default)
            delta = exp - iat
            expected_minutes = service.settings.jwt_access_token_expire_minutes
            assert abs(delta.total_seconds() - expected_minutes * 60) < 2

    def test_create_access_token_custom_expiry(self):
        """Access token should respect custom expiry."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            custom_delta = timedelta(hours=1)
            token = service.create_access_token(
                "user-1", "org-1", "admin", expires_delta=custom_delta
            )
            payload = service.decode_token(token)

            exp = datetime.fromtimestamp(payload["exp"], tz=UTC)
            iat = datetime.fromtimestamp(payload["iat"], tz=UTC)

            delta = exp - iat
            assert abs(delta.total_seconds() - 3600) < 2


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestRefreshTokenGeneration:
    """Test JWT refresh token generation."""

    def test_create_refresh_token_with_correct_claims(self):
        """Refresh token should contain correct claims."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            user_id = "user-789"
            token = service.create_refresh_token(user_id)
            payload = service.decode_token(token)

            assert payload["sub"] == user_id
            assert payload["type"] == "refresh"
            assert "jti" in payload
            assert "iat" in payload
            assert "exp" in payload
            # Should NOT have org_id or role
            assert "org_id" not in payload
            assert "role" not in payload

    def test_create_refresh_token_default_expiry(self):
        """Refresh token should expire in configured days."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            token = service.create_refresh_token("user-1")
            payload = service.decode_token(token)

            exp = datetime.fromtimestamp(payload["exp"], tz=UTC)
            iat = datetime.fromtimestamp(payload["iat"], tz=UTC)

            delta = exp - iat
            expected_days = service.settings.jwt_refresh_token_expire_days
            assert abs(delta.total_seconds() - expected_days * 86400) < 2


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestTokenValidation:
    """Test token validation functionality."""

    def test_verify_token_success(self):
        """Valid token should verify successfully."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_client = MagicMock()
            mock_client.exists.return_value = 0  # Not blacklisted
            mock_redis.return_value = mock_client
            service = AuthService()

            token = service.create_access_token("user-1", "org-1", "admin")
            payload = service.verify_token(token)

            assert payload is not None
            assert payload["sub"] == "user-1"

    def test_verify_token_expired(self):
        """Expired token should return None."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            # Create token that's already expired
            token = service.create_access_token(
                "user-1", "org-1", "admin", expires_delta=timedelta(seconds=-1)
            )

            payload = service.verify_token(token)
            assert payload is None

    def test_verify_token_invalid(self):
        """Invalid token should return None."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            payload = service.verify_token("invalid.token.here")
            assert payload is None

    def test_verify_token_blacklisted(self):
        """Blacklisted token should return None."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_client = MagicMock()
            mock_client.exists.return_value = 1  # Blacklisted
            mock_redis.return_value = mock_client
            service = AuthService()

            token = service.create_access_token("user-1", "org-1", "admin")
            payload = service.verify_token(token)

            assert payload is None

    def test_decode_token_invalid_signature(self):
        """Token with invalid signature should raise error."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            # Create token and tamper with it
            token = service.create_access_token("user-1", "org-1", "admin")
            tampered = token[:-5] + "xxxxx"

            with pytest.raises(jwt.InvalidTokenError):
                service.decode_token(tampered)


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestTokenBlacklisting:
    """Test token blacklisting with Redis."""

    def test_blacklist_token(self):
        """Token should be blacklisted in Redis."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_client = MagicMock()
            mock_redis.return_value = mock_client
            service = AuthService()

            jti = "token-id-123"
            expires_in = 3600

            service.blacklist_token(jti, expires_in)

            mock_client.setex.assert_called_once_with(
                f"blacklist:{jti}", expires_in, "blacklisted"
            )

    def test_is_token_blacklisted_true(self):
        """Should return True for blacklisted token."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_client = MagicMock()
            mock_client.exists.return_value = 1
            mock_redis.return_value = mock_client
            service = AuthService()

            result = service.is_token_blacklisted("token-123")

            assert result is True
            mock_client.exists.assert_called_with("blacklist:token-123")

    def test_is_token_blacklisted_false(self):
        """Should return False for non-blacklisted token."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_client = MagicMock()
            mock_client.exists.return_value = 0
            mock_redis.return_value = mock_client
            service = AuthService()

            result = service.is_token_blacklisted("token-456")

            assert result is False


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestCreateTokens:
    """Test combined token creation."""

    def test_create_tokens_returns_both(self):
        """Should return both access and refresh tokens."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            user = {
                "id": "user-123",
                "organization_id": "org-456",
                "role": "developer",
            }

            tokens = service.create_tokens(user)

            assert "access_token" in tokens
            assert "refresh_token" in tokens
            assert tokens["token_type"] == "bearer"
            assert "expires_in" in tokens
            assert (
                tokens["expires_in"]
                == service.settings.jwt_access_token_expire_minutes * 60
            )

    def test_create_tokens_valid_jwt(self):
        """Created tokens should be valid JWTs."""
        with patch("studio.services.auth_service.redis.from_url") as mock_redis:
            mock_redis.return_value = MagicMock()
            service = AuthService()

            user = {
                "id": "user-123",
                "organization_id": "org-456",
                "role": "org_owner",
            }

            tokens = service.create_tokens(user)

            # Verify access token
            access_payload = service.decode_token(tokens["access_token"])
            assert access_payload["sub"] == user["id"]
            assert access_payload["type"] == "access"

            # Verify refresh token
            refresh_payload = service.decode_token(tokens["refresh_token"])
            assert refresh_payload["sub"] == user["id"]
            assert refresh_payload["type"] == "refresh"
