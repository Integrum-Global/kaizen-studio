"""
Tier 1: API Key Service Unit Tests

Tests key generation, hashing, validation, and scope checking.
Mocking is allowed in Tier 1 for external services (AsyncLocalRuntime).
"""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from studio.services.api_key_service import API_KEY_SCOPES, APIKeyService, pwd_context


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestKeyGeneration:
    """Test API key generation functionality."""

    def test_generate_key_creates_valid_format(self):
        """Generated key should have correct format."""
        service = APIKeyService()
        plain_key, key_prefix = service._generate_key()

        # Check format
        assert plain_key.startswith("sk_live_")
        assert key_prefix.startswith("sk_live_")
        assert "_" in plain_key
        assert len(plain_key) > len(key_prefix)

    def test_generate_key_prefix_is_8_chars_after_prefix(self):
        """Key prefix should be sk_live_<8_hex_chars>."""
        service = APIKeyService()
        plain_key, key_prefix = service._generate_key()

        # Prefix format: sk_live_<8_hex_chars>
        parts = key_prefix.split("_")
        assert len(parts) == 3
        assert parts[0] == "sk"
        assert parts[1] == "live"
        assert len(parts[2]) == 8  # 4 bytes * 2 hex chars

    def test_generate_key_suffix_is_unique(self):
        """Each generated key should be unique."""
        service = APIKeyService()
        key1, _ = service._generate_key()
        key2, _ = service._generate_key()

        assert key1 != key2
        assert key1.split("_")[-1] != key2.split("_")[-1]

    def test_generate_key_multiple_calls_different_prefixes(self):
        """Multiple key generation should produce different prefixes."""
        service = APIKeyService()
        prefixes = set()
        for _ in range(10):
            _, prefix = service._generate_key()
            prefixes.add(prefix)

        # All 10 should be unique
        assert len(prefixes) == 10


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestKeyHashing:
    """Test API key hashing and verification."""

    def test_hash_key_creates_bcrypt_hash(self):
        """Key hashing should create a valid bcrypt hash."""
        service = APIKeyService()
        plain_key = "sk_live_abc123_secretsuffix"
        hashed = service._hash_key(plain_key)

        # Bcrypt hashes start with $2b$ or $2a$
        assert hashed.startswith("$2")
        assert hashed != plain_key
        assert len(hashed) == 60  # Bcrypt hash length

    def test_hash_key_unique_each_time(self):
        """Same key should produce different hashes due to salt."""
        service = APIKeyService()
        plain_key = "sk_live_abc123_secretsuffix"

        hash1 = service._hash_key(plain_key)
        hash2 = service._hash_key(plain_key)

        # Different hashes due to random salt
        assert hash1 != hash2

    def test_verify_key_success(self):
        """Correct key should verify successfully."""
        service = APIKeyService()
        plain_key = "sk_live_abc123_secretsuffix"
        hashed = service._hash_key(plain_key)

        assert service._verify_key(plain_key, hashed) is True

    def test_verify_key_failure(self):
        """Incorrect key should fail verification."""
        service = APIKeyService()
        plain_key = "sk_live_abc123_correctkey"
        wrong_key = "sk_live_abc123_wrongkey"
        hashed = service._hash_key(plain_key)

        assert service._verify_key(wrong_key, hashed) is False

    def test_verify_key_case_sensitive(self):
        """Key verification should be case-sensitive."""
        service = APIKeyService()
        plain_key = "sk_live_AbC123_Key"
        hashed = service._hash_key(plain_key)

        # Different case should fail
        assert service._verify_key("sk_live_abc123_key", hashed) is False


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestKeyCreation:
    """Test API key creation logic."""

    @pytest.mark.asyncio
    async def test_create_key_with_valid_scopes(self):
        """Creating key with valid scopes should succeed."""
        service = APIKeyService()

        with patch.object(
            service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({}, "run_id")

            org_id = str(uuid.uuid4())
            user_id = str(uuid.uuid4())
            scopes = ["agents:read", "agents:write"]

            key_record, plain_key = await service.create(
                org_id=org_id,
                name="Test Key",
                scopes=scopes,
                rate_limit=100,
                user_id=user_id,
            )

            assert key_record["organization_id"] == org_id
            assert key_record["name"] == "Test Key"
            assert key_record["scopes"] == scopes
            assert key_record["status"] == "active"
            assert plain_key.startswith("sk_live_")

    @pytest.mark.asyncio
    async def test_create_key_filters_invalid_scopes(self):
        """Creating key should filter out invalid scopes."""
        service = APIKeyService()

        with patch.object(
            service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({}, "run_id")

            org_id = str(uuid.uuid4())
            user_id = str(uuid.uuid4())
            scopes = ["agents:read", "invalid:scope", "agents:write"]

            key_record, plain_key = await service.create(
                org_id=org_id,
                name="Test Key",
                scopes=scopes,
                rate_limit=100,
                user_id=user_id,
            )

            # Only valid scopes should be included
            assert "agents:read" in key_record["scopes"]
            assert "agents:write" in key_record["scopes"]
            assert "invalid:scope" not in key_record["scopes"]

    @pytest.mark.asyncio
    async def test_create_key_with_expiration(self):
        """Creating key with expiration date should be stored."""
        service = APIKeyService()

        with patch.object(
            service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({}, "run_id")

            org_id = str(uuid.uuid4())
            user_id = str(uuid.uuid4())
            expires_at = (datetime.now(UTC) + timedelta(days=30)).isoformat()

            key_record, _ = await service.create(
                org_id=org_id,
                name="Expiring Key",
                scopes=[],
                rate_limit=100,
                user_id=user_id,
                expires_at=expires_at,
            )

            assert key_record["expires_at"] == expires_at

    @pytest.mark.asyncio
    async def test_create_key_stores_key_hash_not_plain(self):
        """Key creation should hash the key, not store plaintext."""
        service = APIKeyService()

        with patch.object(
            service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            # Capture the call to see what's being stored
            async def capture_call(workflow, inputs=None):
                # The key_hash should be hashed, not plain
                return ({}, "run_id")

            mock_execute.side_effect = capture_call

            org_id = str(uuid.uuid4())
            user_id = str(uuid.uuid4())

            key_record, plain_key = await service.create(
                org_id=org_id,
                name="Test Key",
                scopes=[],
                rate_limit=100,
                user_id=user_id,
            )

            # Returned plain_key should be usable format
            assert plain_key.startswith("sk_live_")
            # But not stored directly in record (record only has prefix)
            assert plain_key not in [key_record.get("key_hash"), ""]


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestKeyValidation:
    """Test API key validation."""

    @pytest.mark.asyncio
    async def test_validate_key_requires_sk_live_prefix(self):
        """Validation should reject keys without sk_live_ prefix."""
        service = APIKeyService()

        # Key without proper prefix
        assert await service.validate("invalid_key_format") is None
        assert await service.validate("wrong_prefix_abc123_suffix") is None

    @pytest.mark.asyncio
    async def test_validate_key_requires_proper_format(self):
        """Validation should reject malformed keys."""
        service = APIKeyService()

        # Properly formatted but insufficient parts
        assert await service.validate("sk_live_abc") is None

    @pytest.mark.asyncio
    async def test_validate_key_checks_active_status(self):
        """Validation should reject revoked keys."""
        service = APIKeyService()

        with patch.object(
            service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            # Mock finding a revoked key
            mock_execute.return_value = (
                {
                    "find_key": {
                        "records": [
                            {
                                "id": "key1",
                                "organization_id": "org1",
                                "name": "Test",
                                "key_prefix": "sk_live_abc123",
                                "key_hash": pwd_context.hash(
                                    "sk_live_abc123_anysuffix"
                                ),
                                "scopes": "[]",
                                "rate_limit": 100,
                                "status": "revoked",  # Revoked status
                                "created_by": "user1",
                                "created_at": datetime.now(UTC).isoformat(),
                            }
                        ]
                    }
                },
                "run_id",
            )

            result = await service.validate("sk_live_abc123_anysuffix")
            assert result is None

    @pytest.mark.asyncio
    async def test_validate_key_checks_expiration(self):
        """Validation should reject expired keys."""
        service = APIKeyService()

        with patch.object(
            service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            # Mock finding an expired key
            expired_time = (datetime.now(UTC) - timedelta(days=1)).isoformat()

            mock_execute.return_value = (
                {
                    "find_key": {
                        "records": [
                            {
                                "id": "key1",
                                "organization_id": "org1",
                                "name": "Test",
                                "key_prefix": "sk_live_abc123",
                                "key_hash": pwd_context.hash(
                                    "sk_live_abc123_anysuffix"
                                ),
                                "scopes": "[]",
                                "rate_limit": 100,
                                "status": "active",
                                "expires_at": expired_time,
                                "created_by": "user1",
                                "created_at": datetime.now(UTC).isoformat(),
                            }
                        ]
                    }
                },
                "run_id",
            )

            result = await service.validate("sk_live_abc123_anysuffix")
            assert result is None

    @pytest.mark.asyncio
    async def test_validate_key_returns_record_for_valid_key(self):
        """Validation should return key record for valid keys."""
        service = APIKeyService()

        with patch.object(
            service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            future_time = (datetime.now(UTC) + timedelta(days=30)).isoformat()

            # Mock finding a valid key
            mock_execute.return_value = (
                {
                    "find_key": {
                        "records": [
                            {
                                "id": "key1",
                                "organization_id": "org1",
                                "name": "Test Key",
                                "key_prefix": "sk_live_abc123",
                                "key_hash": pwd_context.hash(
                                    "sk_live_abc123_realsuffix"
                                ),
                                "scopes": '["agents:read"]',
                                "rate_limit": 100,
                                "status": "active",
                                "expires_at": future_time,
                                "created_by": "user1",
                                "created_at": datetime.now(UTC).isoformat(),
                            }
                        ]
                    }
                },
                "run_id",
            )

            result = await service.validate("sk_live_abc123_realsuffix")
            assert result is not None
            assert result["status"] == "active"


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestScopeChecking:
    """Test scope-based access control."""

    def test_check_scope_exact_match(self):
        """Scope checking should match exact scope."""
        service = APIKeyService()
        key = {"scopes": ["agents:read", "agents:write"]}

        assert service.check_scope(key, "agents:read") is True
        assert service.check_scope(key, "agents:write") is True

    def test_check_scope_write_includes_read(self):
        """Write scope should satisfy read scope requirement."""
        service = APIKeyService()
        key = {"scopes": ["agents:write"]}

        # agents:write should satisfy agents:read requirement
        assert service.check_scope(key, "agents:read") is True

    def test_check_scope_read_does_not_include_write(self):
        """Read scope should not satisfy write scope requirement."""
        service = APIKeyService()
        key = {"scopes": ["agents:read"]}

        # agents:read should not satisfy agents:write requirement
        assert service.check_scope(key, "agents:write") is False

    def test_check_scope_missing_scope(self):
        """Scope checking should return false for missing scopes."""
        service = APIKeyService()
        key = {"scopes": ["agents:read"]}

        assert service.check_scope(key, "pipelines:write") is False

    def test_check_scope_empty_scopes(self):
        """Key with no scopes should not have any access."""
        service = APIKeyService()
        key = {"scopes": []}

        assert service.check_scope(key, "agents:read") is False
        assert service.check_scope(key, "agents:write") is False

    def test_check_scope_with_different_resource(self):
        """Scope checking should work with different resources."""
        service = APIKeyService()
        key = {"scopes": ["pipelines:write", "deployments:read"]}

        assert service.check_scope(key, "pipelines:read") is True
        assert service.check_scope(key, "pipelines:write") is True
        assert service.check_scope(key, "deployments:read") is True
        assert service.check_scope(key, "deployments:write") is False


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestKeyRetrieval:
    """Test key retrieval operations."""

    @pytest.mark.asyncio
    async def test_get_key_by_id(self):
        """Getting key by ID should return key record."""
        service = APIKeyService()

        with patch.object(
            service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            now = datetime.now(UTC).isoformat()

            mock_execute.return_value = (
                {
                    "read_key": {
                        "id": "key1",
                        "organization_id": "org1",
                        "name": "Test Key",
                        "key_prefix": "sk_live_abc123",
                        "scopes": '["agents:read"]',
                        "rate_limit": 100,
                        "expires_at": None,
                        "last_used_at": now,
                        "status": "active",
                        "created_by": "user1",
                        "created_at": now,
                    }
                },
                "run_id",
            )

            result = await service.get("key1")
            assert result is not None
            assert result["id"] == "key1"
            assert result["name"] == "Test Key"

    @pytest.mark.asyncio
    async def test_get_key_returns_none_if_not_found(self):
        """Getting non-existent key should return None."""
        service = APIKeyService()

        with patch.object(
            service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({"read_key": None}, "run_id")

            result = await service.get("nonexistent")
            assert result is None

    @pytest.mark.asyncio
    async def test_list_keys_for_organization(self):
        """Listing keys should return all org keys."""
        service = APIKeyService()

        with patch.object(
            service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            now = datetime.now(UTC).isoformat()

            mock_execute.return_value = (
                {
                    "list_keys": {
                        "records": [
                            {
                                "id": "key1",
                                "organization_id": "org1",
                                "name": "Key 1",
                                "key_prefix": "sk_live_abc123",
                                "scopes": '["agents:read"]',
                                "rate_limit": 100,
                                "status": "active",
                                "created_by": "user1",
                                "created_at": now,
                            },
                            {
                                "id": "key2",
                                "organization_id": "org1",
                                "name": "Key 2",
                                "key_prefix": "sk_live_def456",
                                "scopes": '["pipelines:write"]',
                                "rate_limit": 50,
                                "status": "active",
                                "created_by": "user1",
                                "created_at": now,
                            },
                        ]
                    }
                },
                "run_id",
            )

            results = await service.list("org1")
            assert len(results) == 2
            assert results[0]["id"] == "key1"
            assert results[1]["id"] == "key2"


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestKeyRevocation:
    """Test key revocation."""

    @pytest.mark.asyncio
    async def test_revoke_key_updates_status(self):
        """Revoking key should update status to revoked."""
        service = APIKeyService()

        with patch.object(
            service.runtime, "execute_workflow_async", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = ({}, "run_id")

            key_id = "key1"
            await service.revoke(key_id)

            # Verify the workflow was called with update
            assert mock_execute.called


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAvailableScopes:
    """Test available API scopes."""

    def test_api_key_scopes_defined(self):
        """Available scopes should be defined."""
        assert len(API_KEY_SCOPES) > 0

    def test_api_key_scopes_have_proper_format(self):
        """Scopes should have resource:action format."""
        for scope in API_KEY_SCOPES:
            assert ":" in scope
            resource, action = scope.split(":")
            assert resource in [
                "agents",
                "deployments",
                "metrics",
                "pipelines",
                "gateways",
            ]
            assert action in ["read", "write"]

    def test_all_standard_scopes_present(self):
        """Standard scopes should be available."""
        expected_scopes = [
            "agents:read",
            "agents:write",
            "deployments:read",
            "deployments:write",
            "pipelines:read",
            "pipelines:write",
        ]
        for scope in expected_scopes:
            assert scope in API_KEY_SCOPES
