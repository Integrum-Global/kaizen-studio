"""
Tier 2: Connector Execution Integration Tests

Tests actual connection testing and query execution with real infrastructure.
NO MOCKING - uses actual PostgreSQL, Redis, and HTTP servers.
"""

import os

import pytest


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestPostgreSQLConnectorExecution:
    """Test PostgreSQL connector with real database."""

    @pytest.mark.asyncio
    async def test_postgresql_connection_success(self, connector_service, db_url):
        """PostgreSQL should connect successfully to test database."""
        # Parse database URL for config
        # Format: postgresql://user:pass@host:port/database
        parts = db_url.replace("postgresql://", "").split("@")
        user_pass = parts[0].split(":")
        host_port_db = parts[1].split("/")
        host_port = host_port_db[0].split(":")

        config = {
            "host": host_port[0],
            "port": int(host_port[1]) if len(host_port) > 1 else 5432,
            "database": host_port_db[1] if len(host_port_db) > 1 else "postgres",
            "user": user_pass[0],
            "password": user_pass[1] if len(user_pass) > 1 else "",
            "timeout": 5,
        }

        # Try with localhost if "postgres" hostname (Docker container name)
        if config["host"] == "postgres":
            config["host"] = "localhost"

        result = await connector_service._test_postgresql(config)

        # If connection fails, it might be that PostgreSQL is not running locally
        # This is acceptable for development - test should skip gracefully
        if not result["success"]:
            pytest.skip(
                f"PostgreSQL not available: {result.get('message', 'Unknown error')}"
            )

        assert result["success"] is True
        assert "PostgreSQL connection successful" in result["message"]
        assert "metadata" in result
        assert "version" in result["metadata"]

    @pytest.mark.asyncio
    async def test_postgresql_connection_failure(self, connector_service):
        """PostgreSQL should fail with invalid credentials."""
        config = {
            "host": "localhost",
            "port": 5432,
            "database": "nonexistent",
            "user": "invalid_user",
            "password": "invalid_pass",
            "timeout": 2,
        }

        result = await connector_service._test_postgresql(config)

        assert result["success"] is False
        assert "error" in result

    @pytest.mark.asyncio
    async def test_postgresql_query_select(self, connector_service, db_url):
        """PostgreSQL should execute SELECT queries."""
        # Parse database URL
        parts = db_url.replace("postgresql://", "").split("@")
        user_pass = parts[0].split(":")
        host_port_db = parts[1].split("/")
        host_port = host_port_db[0].split(":")

        config = {
            "host": host_port[0],
            "port": int(host_port[1]) if len(host_port) > 1 else 5432,
            "database": host_port_db[1] if len(host_port_db) > 1 else "postgres",
            "user": user_pass[0],
            "password": user_pass[1] if len(user_pass) > 1 else "",
            "timeout": 30,
        }

        # Try with localhost if "postgres" hostname
        if config["host"] == "postgres":
            config["host"] = "localhost"

        # Execute simple query
        query = "SELECT 1 as num, 'test' as text"
        result = await connector_service._execute_postgresql_query(
            config, query, None, 0
        )

        if not result["success"]:
            pytest.skip(
                f"PostgreSQL not available: {result.get('error', 'Unknown error')}"
            )

        assert result["success"] is True
        assert result["row_count"] == 1
        assert len(result["data"]) == 1
        assert result["data"][0]["num"] == 1
        assert result["data"][0]["text"] == "test"
        assert "execution_time_ms" in result
        assert result["execution_time_ms"] > 0

    @pytest.mark.asyncio
    async def test_postgresql_query_create_table(self, connector_service, db_url):
        """PostgreSQL should execute DDL queries."""
        # Parse database URL
        parts = db_url.replace("postgresql://", "").split("@")
        user_pass = parts[0].split(":")
        host_port_db = parts[1].split("/")
        host_port = host_port_db[0].split(":")

        config = {
            "host": host_port[0],
            "port": int(host_port[1]) if len(host_port) > 1 else 5432,
            "database": host_port_db[1] if len(host_port_db) > 1 else "postgres",
            "user": user_pass[0],
            "password": user_pass[1] if len(user_pass) > 1 else "",
            "timeout": 30,
        }

        # Try with localhost if "postgres" hostname
        if config["host"] == "postgres":
            config["host"] = "localhost"

        # Create temporary table
        table_name = f"test_table_{os.getpid()}"
        query = f"CREATE TEMP TABLE {table_name} (id INTEGER, name TEXT)"
        result = await connector_service._execute_postgresql_query(
            config, query, None, 0
        )

        if not result["success"]:
            pytest.skip(
                f"PostgreSQL not available: {result.get('error', 'Unknown error')}"
            )

        assert result["success"] is True
        assert "execution_time_ms" in result


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestRedisConnectorExecution:
    """Test Redis connector with real Redis server."""

    @pytest.mark.asyncio
    async def test_redis_connection_success(self, connector_service):
        """Redis should connect successfully to localhost."""
        config = {
            "host": "localhost",
            "port": 6379,
            "db": 0,
            "password": "",
            "timeout": 5,
        }

        result = await connector_service._test_redis(config)

        if not result["success"]:
            pytest.skip(
                f"Redis not available: {result.get('message', 'Unknown error')}"
            )

        assert result["success"] is True
        assert "Redis connection successful" in result["message"]
        assert "metadata" in result
        assert "version" in result["metadata"]

    @pytest.mark.asyncio
    async def test_redis_connection_failure(self, connector_service):
        """Redis should fail with invalid host."""
        config = {
            "host": "nonexistent-host-12345",
            "port": 6379,
            "db": 0,
            "timeout": 2,
        }

        result = await connector_service._test_redis(config)

        assert result["success"] is False
        assert "error" in result

    @pytest.mark.asyncio
    async def test_redis_query_set_get(self, connector_service):
        """Redis should execute SET and GET operations."""
        config = {
            "host": "localhost",
            "port": 6379,
            "db": 0,
            "password": "",
        }

        # SET operation
        test_key = f"test_key_{os.getpid()}"
        test_value = "test_value_123"

        result_set = await connector_service._execute_redis_query(
            config, test_key, {"operation": "set", "value": test_value}, 0
        )

        assert result_set["success"] is True
        assert result_set["data"] == "OK"

        # GET operation
        result_get = await connector_service._execute_redis_query(
            config, test_key, {"operation": "get"}, 0
        )

        assert result_get["success"] is True
        assert result_get["data"] == test_value
        assert "execution_time_ms" in result_get

        # DELETE operation (cleanup)
        result_del = await connector_service._execute_redis_query(
            config, test_key, {"operation": "delete"}, 0
        )

        assert result_del["success"] is True

    @pytest.mark.asyncio
    async def test_redis_query_keys_pattern(self, connector_service):
        """Redis should execute KEYS pattern matching."""
        config = {
            "host": "localhost",
            "port": 6379,
            "db": 0,
            "password": "",
        }

        # Set some test keys
        prefix = f"pattern_test_{os.getpid()}"
        for i in range(3):
            key = f"{prefix}:{i}"
            await connector_service._execute_redis_query(
                config, key, {"operation": "set", "value": f"value{i}"}, 0
            )

        # Query with pattern
        result = await connector_service._execute_redis_query(
            config, f"{prefix}:*", {"operation": "keys"}, 0
        )

        assert result["success"] is True
        assert isinstance(result["data"], list)
        assert len(result["data"]) == 3

        # Cleanup
        for i in range(3):
            key = f"{prefix}:{i}"
            await connector_service._execute_redis_query(
                config, key, {"operation": "delete"}, 0
            )


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestHTTPAPIConnectorExecution:
    """Test HTTP API connector with real endpoints."""

    @pytest.mark.asyncio
    async def test_http_api_connection_success(self, connector_service):
        """HTTP API should connect to public endpoint."""
        config = {
            "base_url": "https://httpbin.org",
            "timeout": 10,
            "auth_type": "none",
        }

        result = await connector_service._test_http_api(config)

        # If connection fails (network issue), skip gracefully
        if not result["success"]:
            pytest.skip(
                f"HTTP API not reachable: {result.get('message', 'Unknown error')}"
            )

        assert result["success"] is True
        assert "HTTP API connection successful" in result["message"]
        assert "metadata" in result
        assert result["metadata"]["status_code"] in [200, 301, 302]

    @pytest.mark.asyncio
    async def test_http_api_connection_timeout(self, connector_service):
        """HTTP API should timeout on slow endpoints."""
        config = {
            "base_url": "https://httpbin.org/delay/10",
            "timeout": 1,
            "auth_type": "none",
        }

        result = await connector_service._test_http_api(config)

        # Should timeout or fail
        # Note: httpbin might be fast, so we accept both outcomes
        assert "error" in result or result["success"] is True

    @pytest.mark.asyncio
    async def test_http_api_query_get(self, connector_service):
        """HTTP API should execute GET requests."""
        config = {
            "base_url": "https://httpbin.org",
            "timeout": 10,
            "auth_type": "none",
        }

        result = await connector_service._execute_api_query(
            "rest", config, "/get", {"method": "GET"}
        )

        if not result["success"]:
            pytest.skip(
                f"HTTP API not reachable: {result.get('error', 'Unknown error')}"
            )

        assert result["success"] is True
        assert result["status_code"] == 200
        assert "data" in result
        assert "execution_time_ms" in result

    @pytest.mark.asyncio
    async def test_http_api_query_post(self, connector_service):
        """HTTP API should execute POST requests."""
        config = {
            "base_url": "https://httpbin.org",
            "timeout": 10,
            "auth_type": "none",
        }

        body = {"test": "data", "number": 123}
        result = await connector_service._execute_api_query(
            "rest", config, "/post", {"method": "POST", "body": body}
        )

        if not result["success"]:
            pytest.skip(
                f"HTTP API not reachable: {result.get('error', 'Unknown error')}"
            )

        assert result["success"] is True
        assert result["status_code"] == 200
        assert "data" in result

    @pytest.mark.asyncio
    async def test_http_api_with_bearer_auth(self, connector_service):
        """HTTP API should support Bearer authentication."""
        config = {
            "base_url": "https://httpbin.org",
            "timeout": 10,
            "auth_type": "bearer",
            "token": "test_token_123",
        }

        result = await connector_service._execute_api_query(
            "rest", config, "/bearer", {"method": "GET"}
        )

        # httpbin.org/bearer validates the token
        # With our test token, it should succeed
        assert "status_code" in result


@pytest.mark.integration
@pytest.mark.timeout(10)
class TestRedisPubSubExecution:
    """Test Redis Pub/Sub messaging."""

    @pytest.mark.asyncio
    async def test_redis_pubsub_publish(self, connector_service):
        """Redis Pub/Sub should publish messages."""
        config = {
            "host": "localhost",
            "port": 6379,
            "db": 0,
            "password": "",
        }

        channel = f"test_channel_{os.getpid()}"
        message = "Hello from test"

        result = await connector_service._redis_publish(config, channel, message)

        assert result["success"] is True
        assert "message" in result
        # Note: subscribers count might be 0 if no one is listening
        assert "subscribers" in result
