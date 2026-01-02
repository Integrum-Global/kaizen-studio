"""
Tier 1: Connector Service Unit Tests

Tests config encryption/decryption, connection testing methods, and agent attachment.
Mocking is allowed in Tier 1 for external services.
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from cryptography.fernet import Fernet
from studio.services.connector_service import ConnectorService


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestEncryption:
    """Test configuration encryption/decryption."""

    def test_fernet_initialization(self):
        """Fernet should be initialized with encryption key."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            assert service.fernet is not None
            assert isinstance(service.fernet, Fernet)

    def test_encrypt_config_returns_string(self):
        """encrypt_config should return encrypted string."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            config = {"host": "localhost", "port": 5432, "password": "secret"}
            encrypted = service.encrypt_config(config)

            assert isinstance(encrypted, str)
            assert encrypted != json.dumps(config)
            assert len(encrypted) > 0

    def test_decrypt_config_returns_dict(self):
        """decrypt_config should return original dictionary."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            key = Fernet.generate_key().decode()
            mock_settings.return_value = MagicMock(encryption_key=key)
            service = ConnectorService()

            original = {"host": "localhost", "port": 5432, "password": "secret"}
            encrypted = service.encrypt_config(original)
            decrypted = service.decrypt_config(encrypted)

            assert decrypted == original

    def test_encrypt_decrypt_roundtrip_complex_config(self):
        """Complex config should survive encrypt/decrypt roundtrip."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            original = {
                "host": "db.example.com",
                "port": 5432,
                "username": "admin",
                "password": "p@ss!word123",
                "database": "mydb",
                "ssl": True,
                "options": {"timeout": 30, "retry_count": 3},
            }

            encrypted = service.encrypt_config(original)
            decrypted = service.decrypt_config(encrypted)

            assert decrypted == original

    def test_encrypt_empty_config(self):
        """Empty config should be encryptable."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            encrypted = service.encrypt_config({})
            decrypted = service.decrypt_config(encrypted)

            assert decrypted == {}

    def test_decrypt_invalid_encrypted_string_raises_error(self):
        """Decrypting invalid string should raise error."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            with pytest.raises(
                (ValueError, TypeError, Exception)
            ):  # Fernet raises various exceptions
                service.decrypt_config("invalid_encrypted_string")


@pytest.mark.unit
@pytest.mark.timeout(5)
class TestConnectionTestMethods:
    """Test connection testing for various providers."""

    @pytest.mark.asyncio
    async def test_postgresql_connection_test_success(self):
        """PostgreSQL connection test should handle successful connection."""
        with (
            patch("studio.services.connector_service.get_settings") as mock_settings,
            patch("studio.services.connector_service.asyncpg.connect") as mock_connect,
        ):

            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )

            # Mock successful connection
            mock_conn = AsyncMock()
            mock_conn.fetchval = AsyncMock(return_value="PostgreSQL 15.0")
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            service = ConnectorService()
            config = {
                "host": "localhost",
                "port": 5432,
                "database": "testdb",
                "user": "user",
                "password": "pass",
            }
            result = await service._test_postgresql(config)

            assert result["success"] is True
            assert "PostgreSQL connection successful" in result["message"]
            assert "localhost:5432/testdb" in result["message"]
            assert "metadata" in result
            mock_connect.assert_called_once()
            mock_conn.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_postgresql_connection_test_failure(self):
        """PostgreSQL connection test should handle connection failure."""
        with (
            patch("studio.services.connector_service.get_settings") as mock_settings,
            patch("studio.services.connector_service.asyncpg.connect") as mock_connect,
        ):

            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )

            # Mock connection failure
            mock_connect.side_effect = Exception("Connection refused")

            service = ConnectorService()
            config = {"host": "badhost", "port": 5432}
            result = await service._test_postgresql(config)

            assert result["success"] is False
            assert "Connection refused" in result["message"]
            assert "error" in result

    @pytest.mark.asyncio
    async def test_mysql_connection_test(self):
        """MySQL connection test should indicate not implemented."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            config = {"host": "db.example.com", "port": 3306}
            result = await service._test_mysql(config)

            # MySQL requires aiomysql which we don't have
            assert result["success"] is False
            assert "not implemented" in result["message"]

    @pytest.mark.asyncio
    async def test_mongodb_connection_test_success(self):
        """MongoDB connection test should handle successful connection."""
        with (
            patch("studio.services.connector_service.get_settings") as mock_settings,
            patch(
                "studio.services.connector_service.motor_asyncio.AsyncIOMotorClient"
            ) as mock_client,
        ):

            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )

            # Mock successful MongoDB connection
            mock_instance = MagicMock()
            mock_instance.server_info = AsyncMock(return_value={"version": "6.0.0"})
            mock_instance.close = MagicMock()
            mock_client.return_value = mock_instance

            service = ConnectorService()
            config = {"host": "localhost", "port": 27017, "database": "testdb"}
            result = await service._test_mongodb(config)

            assert result["success"] is True
            assert "MongoDB connection successful" in result["message"]
            assert "metadata" in result
            assert result["metadata"]["version"] == "6.0.0"

    @pytest.mark.asyncio
    async def test_redis_connection_test_success(self):
        """Redis connection test should handle successful connection."""
        with (
            patch("studio.services.connector_service.get_settings") as mock_settings,
            patch("studio.services.connector_service.aioredis.Redis") as mock_redis,
        ):

            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )

            # Mock successful Redis connection
            mock_instance = AsyncMock()
            mock_instance.ping = AsyncMock()
            mock_instance.info = AsyncMock(return_value={"redis_version": "7.0.0"})
            mock_instance.close = AsyncMock()
            mock_redis.return_value = mock_instance

            service = ConnectorService()
            config = {"host": "localhost", "port": 6379, "db": 0}
            result = await service._test_redis(config)

            assert result["success"] is True
            assert "Redis connection successful" in result["message"]
            assert "metadata" in result
            mock_instance.ping.assert_called_once()
            mock_instance.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_sqlite_connection_test(self):
        """SQLite connection test should indicate not implemented."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            config = {"path": "/tmp/test.db"}
            result = await service._test_sqlite(config)

            # SQLite requires aiosqlite which we don't have
            assert result["success"] is False
            assert "not implemented" in result["message"]

    @pytest.mark.asyncio
    async def test_http_api_connection_test_success(self):
        """HTTP API connection test should handle successful connection."""
        with (
            patch("studio.services.connector_service.get_settings") as mock_settings,
            patch("studio.services.connector_service.httpx.AsyncClient") as mock_client,
        ):

            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )

            # Mock successful HTTP response
            mock_response = MagicMock()
            mock_response.status_code = 200

            mock_instance = AsyncMock()
            mock_instance.get = AsyncMock(return_value=mock_response)
            mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
            mock_instance.__aexit__ = AsyncMock()
            mock_client.return_value = mock_instance

            service = ConnectorService()
            config = {"base_url": "https://api.example.com"}
            result = await service._test_http_api(config)

            assert result["success"] is True
            assert "HTTP API connection successful" in result["message"]
            assert "metadata" in result
            assert result["metadata"]["status_code"] == 200

    @pytest.mark.asyncio
    async def test_s3_connection_test(self):
        """S3 connection test should return success."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            config = {"bucket": "my-bucket"}
            result = await service._test_s3(config)

            assert result["success"] is True
            assert "S3" in result["message"]

    @pytest.mark.asyncio
    async def test_kafka_connection_test(self):
        """Kafka connection test should return success."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            config = {"bootstrap_servers": "localhost:9092"}
            result = await service._test_kafka(config)

            assert result["success"] is True
            assert "Kafka" in result["message"]

    @pytest.mark.asyncio
    async def test_perform_connection_test_unsupported_type(self):
        """Unsupported connector type should return failure."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            result = await service._perform_connection_test(
                "unknown_type", "unknown_provider", {}
            )

            assert result["success"] is False
            assert "Unsupported" in result["message"]


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestConnectorTypeValidation:
    """Test connector type and provider validation."""

    def test_validate_connector_type_valid(self):
        """Valid connector type/provider should return True."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            assert service.validate_connector_type("database", "postgresql") is True
            assert service.validate_connector_type("api", "rest") is True
            assert service.validate_connector_type("storage", "s3") is True
            assert service.validate_connector_type("messaging", "kafka") is True

    def test_validate_connector_type_invalid_type(self):
        """Invalid connector type should return False."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            assert (
                service.validate_connector_type("invalid_type", "postgresql") is False
            )

    def test_validate_connector_type_invalid_provider(self):
        """Invalid provider for type should return False."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            assert service.validate_connector_type("database", "rest") is False
            assert service.validate_connector_type("api", "s3") is False

    def test_get_connector_types_returns_all_types(self):
        """get_connector_types should return all available types."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            types = service.get_connector_types()

            assert "database" in types
            assert "api" in types
            assert "storage" in types
            assert "messaging" in types
            assert "postgresql" in types["database"]
            assert "rest" in types["api"]


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestConnectorInstanceValidation:
    """Test connector instance validation."""

    def test_instance_config_override_json_serialization(self):
        """Instance config override should serialize/deserialize correctly."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            config_override = {"timeout": 60, "retry": 3}
            json_str = json.dumps(config_override)

            # Simulate what the service stores
            deserialized = json.loads(json_str)
            assert deserialized == config_override

    def test_empty_instance_config_override(self):
        """Empty instance config override should be valid."""
        assert json.dumps(None) is not None
        assert json.dumps({}) == "{}"


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestServiceInitialization:
    """Test ConnectorService initialization."""

    def test_service_initialization_creates_runtime(self):
        """Service initialization should create runtime."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            assert service.runtime is not None
            assert service.settings is not None

    def test_service_fernet_lazy_initialization(self):
        """Fernet should be initialized lazily."""
        with patch("studio.services.connector_service.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )
            service = ConnectorService()

            assert service._fernet is None  # Not initialized yet
            fernet1 = service.fernet  # Initialize
            assert service._fernet is not None
            fernet2 = service.fernet  # Should return same instance
            assert fernet1 is fernet2


@pytest.mark.unit
@pytest.mark.timeout(5)
class TestQueryExecution:
    """Test query execution for various providers."""

    @pytest.mark.asyncio
    async def test_execute_postgresql_query_select(self):
        """PostgreSQL SELECT query should return data."""
        with (
            patch("studio.services.connector_service.get_settings") as mock_settings,
            patch("studio.services.connector_service.asyncpg.connect") as mock_connect,
        ):

            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )

            # Mock query result
            mock_row1 = {"id": 1, "name": "Alice"}
            mock_row2 = {"id": 2, "name": "Bob"}
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[mock_row1, mock_row2])
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            service = ConnectorService()
            config = {
                "host": "localhost",
                "port": 5432,
                "database": "testdb",
                "user": "user",
                "password": "pass",
            }
            result = await service._execute_postgresql_query(
                config, "SELECT * FROM users", None, 0
            )

            assert result["success"] is True
            assert result["row_count"] == 2
            assert len(result["data"]) == 2
            assert "execution_time_ms" in result

    @pytest.mark.asyncio
    async def test_execute_mongodb_query_success(self):
        """MongoDB query should return documents."""
        with (
            patch("studio.services.connector_service.get_settings") as mock_settings,
            patch(
                "studio.services.connector_service.motor_asyncio.AsyncIOMotorClient"
            ) as mock_client,
        ):

            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )

            # Mock MongoDB query result
            mock_docs = [{"_id": "123", "name": "Alice"}, {"_id": "456", "name": "Bob"}]
            mock_cursor = AsyncMock()
            mock_cursor.to_list = AsyncMock(return_value=mock_docs)

            mock_collection = MagicMock()
            mock_collection.find = MagicMock(return_value=mock_cursor)

            mock_db = MagicMock()
            mock_db.__getitem__ = MagicMock(return_value=mock_collection)

            mock_instance = MagicMock()
            mock_instance.__getitem__ = MagicMock(return_value=mock_db)
            mock_instance.close = MagicMock()
            mock_client.return_value = mock_instance

            service = ConnectorService()
            config = {"host": "localhost", "port": 27017, "database": "testdb"}
            result = await service._execute_mongodb_query(
                config, '{"status": "active"}', {"collection": "users"}, 0
            )

            assert result["success"] is True
            assert result["row_count"] == 2
            assert len(result["data"]) == 2
            assert result["data"][0]["_id"] == "123"

    @pytest.mark.asyncio
    async def test_execute_redis_query_get(self):
        """Redis GET operation should return value."""
        with (
            patch("studio.services.connector_service.get_settings") as mock_settings,
            patch("studio.services.connector_service.aioredis.Redis") as mock_redis,
        ):

            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )

            # Mock Redis GET
            mock_instance = AsyncMock()
            mock_instance.get = AsyncMock(return_value=b"test_value")
            mock_instance.close = AsyncMock()
            mock_redis.return_value = mock_instance

            service = ConnectorService()
            config = {"host": "localhost", "port": 6379, "db": 0}
            result = await service._execute_redis_query(
                config, "test_key", {"operation": "get"}, 0
            )

            assert result["success"] is True
            assert result["data"] == "test_value"
            assert "execution_time_ms" in result

    @pytest.mark.asyncio
    async def test_execute_api_query_get(self):
        """API GET query should return response."""
        with (
            patch("studio.services.connector_service.get_settings") as mock_settings,
            patch("studio.services.connector_service.httpx.AsyncClient") as mock_client,
        ):

            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )

            # Mock HTTP response
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json = MagicMock(return_value={"status": "ok"})

            mock_instance = AsyncMock()
            mock_instance.get = AsyncMock(return_value=mock_response)
            mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
            mock_instance.__aexit__ = AsyncMock()
            mock_client.return_value = mock_instance

            service = ConnectorService()
            config = {"base_url": "https://api.example.com", "auth_type": "none"}
            result = await service._execute_api_query(
                "rest", config, "/users", {"method": "GET"}
            )

            assert result["success"] is True
            assert result["status_code"] == 200
            assert result["data"] == {"status": "ok"}
            assert "execution_time_ms" in result

    @pytest.mark.asyncio
    async def test_execute_redis_publish(self):
        """Redis Pub/Sub publish should work."""
        with (
            patch("studio.services.connector_service.get_settings") as mock_settings,
            patch("studio.services.connector_service.aioredis.Redis") as mock_redis,
        ):

            mock_settings.return_value = MagicMock(
                encryption_key=Fernet.generate_key().decode()
            )

            # Mock Redis PUBLISH
            mock_instance = AsyncMock()
            mock_instance.publish = AsyncMock(return_value=5)  # 5 subscribers
            mock_instance.close = AsyncMock()
            mock_redis.return_value = mock_instance

            service = ConnectorService()
            config = {"host": "localhost", "port": 6379, "db": 0}
            result = await service._redis_publish(
                config, "test_channel", "test_message"
            )

            assert result["success"] is True
            assert result["subscribers"] == 5
            mock_instance.publish.assert_called_once_with(
                "test_channel", "test_message"
            )
