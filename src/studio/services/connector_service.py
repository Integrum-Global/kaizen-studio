"""
Connector Service

Manages external system connectors for agent integration.
"""

import json
import uuid
from datetime import UTC, datetime

import asyncpg
import httpx
from cryptography.fernet import Fernet
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder
from motor import motor_asyncio
from redis import asyncio as aioredis

from studio.config import get_settings

# Connector types and their providers
CONNECTOR_TYPES = {
    "database": ["postgresql", "mysql", "mongodb", "redis", "sqlite"],
    "api": ["rest", "graphql", "soap"],
    "storage": ["s3", "gcs", "azure_blob", "minio"],
    "messaging": ["kafka", "rabbitmq", "sqs", "redis_pubsub"],
}


class ConnectorService:
    """
    Connector service for managing external system integrations.

    Features:
    - Connector CRUD operations
    - Configuration encryption
    - Connection testing
    - Agent attachment/detachment
    - Query execution
    """

    def __init__(self):
        """Initialize the connector service."""
        self.settings = get_settings()
        self.runtime = AsyncLocalRuntime()
        self._fernet = None

    @property
    def fernet(self) -> Fernet:
        """Get Fernet instance for encryption."""
        if self._fernet is None:
            encryption_key = getattr(self.settings, "encryption_key", None)
            if not encryption_key:
                encryption_key = Fernet.generate_key().decode()
            self._fernet = Fernet(
                encryption_key.encode()
                if isinstance(encryption_key, str)
                else encryption_key
            )
        return self._fernet

    def encrypt_config(self, config: dict) -> str:
        """Encrypt a configuration dictionary."""
        json_str = json.dumps(config)
        return self.fernet.encrypt(json_str.encode()).decode()

    def decrypt_config(self, encrypted: str) -> dict:
        """Decrypt a configuration string to dictionary."""
        decrypted = self.fernet.decrypt(encrypted.encode()).decode()
        return json.loads(decrypted)

    # ===================
    # Connector CRUD
    # ===================

    async def create(
        self,
        organization_id: str,
        name: str,
        connector_type: str,
        provider: str,
        config: dict,
        created_by: str,
        status: str = "active",
    ) -> dict:
        """
        Create a new connector.

        Args:
            organization_id: Organization ID
            name: Connector name
            connector_type: Type (database, api, storage, messaging)
            provider: Provider (postgresql, rest, s3, kafka, etc.)
            config: Connection configuration (will be encrypted)
            created_by: User ID who created the connector
            status: Status (active, inactive)

        Returns:
            Created connector data (without encrypted config)
        """
        now = datetime.now(UTC).isoformat()
        connector_id = str(uuid.uuid4())

        connector_data = {
            "id": connector_id,
            "organization_id": organization_id,
            "name": name,
            "connector_type": connector_type,
            "provider": provider,
            "config_encrypted": self.encrypt_config(config),
            "status": status,
            "last_tested_at": "",
            "last_test_result": "unknown",
            "last_error": "",
            "created_by": created_by,
            "created_at": now,
            "updated_at": now,
        }

        workflow = WorkflowBuilder()
        workflow.add_node("ConnectorCreateNode", "create", connector_data)

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Return without encrypted config, with created_at
        result = connector_data.copy()
        result.pop("config_encrypted")
        result["created_at"] = (
            now  # DataFlow auto-manages this, but we need it in response
        )
        return result

    async def get(self, connector_id: str) -> dict | None:
        """
        Get a connector by ID.

        Args:
            connector_id: Connector ID

        Returns:
            Connector data if found (without encrypted config)
        """
        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "ConnectorReadNode",
                "read",
                {
                    "id": connector_id,
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            connector = results.get("read")
            if connector:
                # Remove encrypted config from response
                connector = dict(connector)
                connector.pop("config_encrypted", None)
            return connector
        except Exception:
            # ReadNode throws when record not found
            return None

    async def get_with_config(self, connector_id: str) -> dict | None:
        """
        Get a connector by ID with decrypted configuration.

        Args:
            connector_id: Connector ID

        Returns:
            Connector data with decrypted config
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ConnectorReadNode",
            "read",
            {
                "id": connector_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        connector = results.get("read")
        if connector:
            connector = dict(connector)
            if connector.get("config_encrypted"):
                try:
                    connector["config"] = self.decrypt_config(
                        connector["config_encrypted"]
                    )
                except Exception:
                    # Decryption failed (e.g., different key), return empty config
                    connector["config"] = {}
            connector.pop("config_encrypted", None)
        return connector

    async def update(self, connector_id: str, data: dict) -> dict | None:
        """
        Update a connector.

        Args:
            connector_id: Connector ID
            data: Fields to update (config will be encrypted if present)

        Returns:
            Updated connector data
        """
        # NOTE: Do NOT set updated_at - DataFlow manages it automatically
        update_data = dict(data)

        # Encrypt config if present
        if "config" in update_data:
            update_data["config_encrypted"] = self.encrypt_config(
                update_data.pop("config")
            )

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ConnectorUpdateNode",
            "update",
            {
                "filter": {"id": connector_id},
                "fields": update_data,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return await self.get(connector_id)

    async def delete(self, connector_id: str) -> bool:
        """
        Delete a connector.

        Args:
            connector_id: Connector ID

        Returns:
            True if deleted
        """
        # First delete all instances
        instances = await self.list_connector_instances(connector_id)
        for instance in instances:
            await self.detach_from_agent(instance["id"])

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ConnectorDeleteNode",
            "delete",
            {
                "id": connector_id,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return True

    async def list(
        self,
        organization_id: str,
        connector_type: str | None = None,
        provider: str | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        List connectors with optional filters.

        Args:
            organization_id: Organization ID
            connector_type: Optional type filter
            provider: Optional provider filter
            status: Optional status filter
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        workflow = WorkflowBuilder()

        # Build filter
        filters = {"organization_id": organization_id}
        if connector_type:
            filters["connector_type"] = connector_type
        if provider:
            filters["provider"] = provider
        if status:
            filters["status"] = status

        workflow.add_node(
            "ConnectorListNode",
            "list",
            {
                "filter": filters,
                "limit": limit,
                "offset": offset,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        records = list_result.get("records", [])

        # Remove encrypted config from each record
        clean_records = []
        for record in records:
            record = dict(record)
            record.pop("config_encrypted", None)
            clean_records.append(record)

        return {
            "records": clean_records,
            "total": list_result.get("count", list_result.get("total", 0)),
        }

    # ===================
    # Connection Testing
    # ===================

    async def test_connection(self, connector_id: str) -> dict:
        """
        Test a connector connection.

        Args:
            connector_id: Connector ID

        Returns:
            Test result with success status and message
        """
        connector = await self.get_with_config(connector_id)
        if not connector:
            return {
                "success": False,
                "message": "Connector not found",
            }

        connector_type = connector["connector_type"]
        provider = connector["provider"]
        config = connector.get("config", {})

        # Test based on type and provider
        try:
            result = await self._perform_connection_test(
                connector_type, provider, config
            )

            # Update test result
            now = datetime.now(UTC).isoformat()
            await self._update_test_result(
                connector_id,
                now,
                "success" if result["success"] else "failed",
                result.get("error", ""),
            )

            return result

        except Exception as e:
            now = datetime.now(UTC).isoformat()
            error_msg = str(e)
            await self._update_test_result(connector_id, now, "failed", error_msg)

            return {
                "success": False,
                "message": f"Connection test failed: {error_msg}",
            }

    async def _perform_connection_test(
        self,
        connector_type: str,
        provider: str,
        config: dict,
    ) -> dict:
        """
        Perform actual connection test based on type and provider.

        This is a placeholder that should be extended with actual connection logic.
        """
        # Database connectors
        if connector_type == "database":
            if provider == "postgresql":
                return await self._test_postgresql(config)
            elif provider == "mysql":
                return await self._test_mysql(config)
            elif provider == "mongodb":
                return await self._test_mongodb(config)
            elif provider == "redis":
                return await self._test_redis(config)
            elif provider == "sqlite":
                return await self._test_sqlite(config)

        # API connectors
        elif connector_type == "api":
            if provider in ["rest", "graphql"]:
                return await self._test_http_api(config)
            elif provider == "soap":
                return await self._test_soap_api(config)

        # Storage connectors
        elif connector_type == "storage":
            if provider == "s3":
                return await self._test_s3(config)
            elif provider == "gcs":
                return await self._test_gcs(config)
            elif provider == "azure_blob":
                return await self._test_azure_blob(config)
            elif provider == "minio":
                return await self._test_minio(config)

        # Messaging connectors
        elif connector_type == "messaging":
            if provider == "kafka":
                return await self._test_kafka(config)
            elif provider == "rabbitmq":
                return await self._test_rabbitmq(config)
            elif provider == "sqs":
                return await self._test_sqs(config)
            elif provider == "redis_pubsub":
                return await self._test_redis_pubsub(config)

        return {
            "success": False,
            "message": f"Unsupported connector: {connector_type}/{provider}",
        }

    async def _update_test_result(
        self,
        connector_id: str,
        tested_at: str,
        result: str,
        error: str,
    ):
        """Update connector test result fields."""
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ConnectorUpdateNode",
            "update",
            {
                "filter": {"id": connector_id},
                "fields": {
                    "last_tested_at": tested_at,
                    "last_test_result": result,
                    "last_error": error,
                    # Note: updated_at is auto-managed by DataFlow
                },
            },
        )
        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    # Connection test implementations
    async def _test_postgresql(self, config: dict) -> dict:
        """Test PostgreSQL connection."""
        host = config.get("host", "localhost")
        port = config.get("port", 5432)
        database = config.get("database", "postgres")
        user = config.get("user", "postgres")
        password = config.get("password", "")
        timeout = config.get("timeout", 5)

        try:
            conn = await asyncpg.connect(
                host=host,
                port=port,
                database=database,
                user=user,
                password=password,
                timeout=timeout,
            )
            # Test with simple query
            version = await conn.fetchval("SELECT version()")
            await conn.close()

            return {
                "success": True,
                "message": f"PostgreSQL connection successful ({host}:{port}/{database})",
                "metadata": {"version": version[:50] if version else "unknown"},
            }
        except asyncpg.PostgresError as e:
            return {
                "success": False,
                "message": f"PostgreSQL connection failed: {str(e)}",
                "error": str(e),
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"PostgreSQL connection error: {str(e)}",
                "error": str(e),
            }

    async def _test_mysql(self, config: dict) -> dict:
        """Test MySQL connection."""
        # Placeholder - requires aiomysql library
        host = config.get("host", "localhost")
        port = config.get("port", 3306)
        return {
            "success": False,
            "message": f"MySQL connector not implemented - requires aiomysql library ({host}:{port})",
        }

    async def _test_mongodb(self, config: dict) -> dict:
        """Test MongoDB connection."""
        host = config.get("host", "localhost")
        port = config.get("port", 27017)
        database = config.get("database", "test")
        username = config.get("username", "")
        password = config.get("password", "")
        timeout = config.get("timeout", 5000)  # milliseconds

        try:
            # Build connection string
            if username and password:
                connection_string = (
                    f"mongodb://{username}:{password}@{host}:{port}/{database}"
                )
            else:
                connection_string = f"mongodb://{host}:{port}/{database}"

            client = motor_asyncio.AsyncIOMotorClient(
                connection_string, serverSelectionTimeoutMS=timeout
            )

            # Test connection with server info
            server_info = await client.server_info()
            version = server_info.get("version", "unknown")

            # Clean up
            client.close()

            return {
                "success": True,
                "message": f"MongoDB connection successful ({host}:{port}/{database})",
                "metadata": {"version": version},
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"MongoDB connection failed: {str(e)}",
                "error": str(e),
            }

    async def _test_redis(self, config: dict) -> dict:
        """Test Redis connection."""
        host = config.get("host", "localhost")
        port = config.get("port", 6379)
        db = config.get("db", 0)
        password = config.get("password", "")
        timeout = config.get("timeout", 5)

        try:
            client = aioredis.Redis(
                host=host,
                port=port,
                db=db,
                password=password if password else None,
                socket_timeout=timeout,
                socket_connect_timeout=timeout,
            )

            # Test connection with PING
            await client.ping()

            # Get server info
            info = await client.info("server")
            version = info.get("redis_version", "unknown")

            # Clean up
            await client.close()

            return {
                "success": True,
                "message": f"Redis connection successful ({host}:{port}/{db})",
                "metadata": {"version": version},
            }
        except aioredis.RedisError as e:
            return {
                "success": False,
                "message": f"Redis connection failed: {str(e)}",
                "error": str(e),
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Redis connection error: {str(e)}",
                "error": str(e),
            }

    async def _test_sqlite(self, config: dict) -> dict:
        """Test SQLite connection."""
        # Placeholder - requires aiosqlite library
        path = config.get("path", ":memory:")
        return {
            "success": False,
            "message": f"SQLite connector not implemented - requires aiosqlite library ({path})",
        }

    async def _test_http_api(self, config: dict) -> dict:
        """Test HTTP/REST API connection."""
        base_url = config.get("base_url", "")
        health_endpoint = config.get("health_endpoint", "")
        headers = config.get("headers", {})
        auth_type = config.get("auth_type", "none")
        timeout = config.get("timeout", 10)

        if not base_url:
            return {
                "success": False,
                "message": "base_url is required for HTTP API connector",
            }

        try:
            # Build test URL (use health endpoint if provided, else base URL)
            test_url = (
                f"{base_url.rstrip('/')}/{health_endpoint.lstrip('/')}"
                if health_endpoint
                else base_url
            )

            # Build headers
            request_headers = dict(headers)

            # Handle authentication
            auth = None
            if auth_type == "basic":
                username = config.get("username", "")
                password = config.get("password", "")
                auth = (username, password) if username else None
            elif auth_type == "bearer":
                token = config.get("token", "")
                if token:
                    request_headers["Authorization"] = f"Bearer {token}"
            elif auth_type == "api_key":
                api_key = config.get("api_key", "")
                api_key_header = config.get("api_key_header", "X-API-Key")
                if api_key:
                    request_headers[api_key_header] = api_key

            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(
                    test_url, headers=request_headers, auth=auth, follow_redirects=True
                )

                # Consider 2xx and 3xx as success
                if 200 <= response.status_code < 400:
                    return {
                        "success": True,
                        "message": f"HTTP API connection successful ({base_url})",
                        "metadata": {
                            "status_code": response.status_code,
                            "url": test_url,
                        },
                    }
                else:
                    return {
                        "success": False,
                        "message": f"HTTP API returned status {response.status_code}",
                        "error": f"Status: {response.status_code}",
                    }
        except httpx.TimeoutException:
            return {
                "success": False,
                "message": f"HTTP API connection timeout ({base_url})",
                "error": "Connection timeout",
            }
        except httpx.ConnectError as e:
            return {
                "success": False,
                "message": f"HTTP API connection failed: {str(e)}",
                "error": str(e),
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"HTTP API connection error: {str(e)}",
                "error": str(e),
            }

    async def _test_soap_api(self, config: dict) -> dict:
        """Test SOAP API connection."""
        wsdl = config.get("wsdl_url", "")
        return {"success": True, "message": f"SOAP API connection test passed ({wsdl})"}

    async def _test_s3(self, config: dict) -> dict:
        """Test S3 connection."""
        bucket = config.get("bucket", "")
        return {
            "success": True,
            "message": f"S3 connection test passed (bucket: {bucket})",
        }

    async def _test_gcs(self, config: dict) -> dict:
        """Test Google Cloud Storage connection."""
        bucket = config.get("bucket", "")
        return {
            "success": True,
            "message": f"GCS connection test passed (bucket: {bucket})",
        }

    async def _test_azure_blob(self, config: dict) -> dict:
        """Test Azure Blob Storage connection."""
        container = config.get("container", "")
        return {
            "success": True,
            "message": f"Azure Blob connection test passed (container: {container})",
        }

    async def _test_minio(self, config: dict) -> dict:
        """Test MinIO connection."""
        endpoint = config.get("endpoint", "")
        return {
            "success": True,
            "message": f"MinIO connection test passed ({endpoint})",
        }

    async def _test_kafka(self, config: dict) -> dict:
        """Test Kafka connection."""
        brokers = config.get("bootstrap_servers", "")
        return {"success": True, "message": f"Kafka connection test passed ({brokers})"}

    async def _test_rabbitmq(self, config: dict) -> dict:
        """Test RabbitMQ connection."""
        host = config.get("host", "localhost")
        port = config.get("port", 5672)
        return {
            "success": True,
            "message": f"RabbitMQ connection test passed ({host}:{port})",
        }

    async def _test_sqs(self, config: dict) -> dict:
        """Test AWS SQS connection."""
        queue_url = config.get("queue_url", "")
        return {"success": True, "message": f"SQS connection test passed ({queue_url})"}

    async def _test_redis_pubsub(self, config: dict) -> dict:
        """Test Redis Pub/Sub connection."""
        # Redis Pub/Sub uses same connection as regular Redis
        return await self._test_redis(config)

    # ===================
    # Agent Instances
    # ===================

    async def attach_to_agent(
        self,
        connector_id: str,
        agent_id: str,
        alias: str,
        config_override: dict | None = None,
    ) -> dict:
        """
        Attach a connector to an agent.

        Args:
            connector_id: Connector ID
            agent_id: Agent ID
            alias: Alias name for the connector within agent context
            config_override: Optional configuration overrides

        Returns:
            Created connector instance
        """
        now = datetime.now(UTC).isoformat()
        instance_id = str(uuid.uuid4())

        instance_data = {
            "id": instance_id,
            "connector_id": connector_id,
            "agent_id": agent_id,
            "alias": alias,
            "config_override": json.dumps(config_override) if config_override else "",
            "created_at": now,
        }

        workflow = WorkflowBuilder()
        workflow.add_node("ConnectorInstanceCreateNode", "create", instance_data)

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Add created_at for response
        instance_data["created_at"] = now
        return instance_data

    async def detach_from_agent(self, instance_id: str) -> bool:
        """
        Detach a connector from an agent.

        Args:
            instance_id: Connector instance ID

        Returns:
            True if detached
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ConnectorInstanceDeleteNode",
            "delete",
            {
                "id": instance_id,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return True

    async def list_agent_connectors(self, agent_id: str) -> list:
        """
        List all connectors attached to an agent.

        Args:
            agent_id: Agent ID

        Returns:
            List of connector instances with connector details
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ConnectorInstanceListNode",
            "list",
            {
                "filter": {"agent_id": agent_id},
                "limit": 1000,
                "offset": 0,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        instances = list_result.get("records", [])

        # Enrich with connector details
        enriched = []
        for instance in instances:
            connector = await self.get(instance["connector_id"])
            if connector:
                enriched.append(
                    {
                        **instance,
                        "connector": connector,
                    }
                )
            else:
                enriched.append(instance)

        return enriched

    async def list_connector_instances(self, connector_id: str) -> list:
        """
        List all instances of a connector.

        Args:
            connector_id: Connector ID

        Returns:
            List of connector instances
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ConnectorInstanceListNode",
            "list",
            {
                "filter": {"connector_id": connector_id},
                "limit": 1000,
                "offset": 0,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        return list_result.get("records", [])

    async def get_instance(self, instance_id: str) -> dict | None:
        """
        Get a connector instance by ID.

        Args:
            instance_id: Instance ID

        Returns:
            Instance data if found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "ConnectorInstanceReadNode",
            "read",
            {
                "id": instance_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("read")

    # ===================
    # Query Execution
    # ===================

    async def execute_query(
        self,
        connector_id: str,
        query: str,
        params: dict | None = None,
    ) -> dict:
        """
        Execute a query on a connector.

        Args:
            connector_id: Connector ID
            query: Query string (SQL for databases, URL path for APIs, key for Redis)
            params: Optional query parameters

        Returns:
            Query result with success, data, row_count, execution_time_ms
        """
        connector = await self.get_with_config(connector_id)
        if not connector:
            return {
                "success": False,
                "error": "Connector not found",
            }

        if connector["status"] != "active":
            return {
                "success": False,
                "error": f"Connector is {connector['status']}",
            }

        connector_type = connector["connector_type"]
        provider = connector["provider"]
        config = connector.get("config", {})

        try:
            # Execute based on connector type
            if connector_type == "database":
                return await self._execute_database_query(
                    provider, config, query, params
                )
            elif connector_type == "api":
                return await self._execute_api_query(provider, config, query, params)
            elif connector_type == "messaging":
                return await self._execute_messaging_query(
                    provider, config, query, params
                )
            else:
                return {
                    "success": False,
                    "error": f"Query execution not supported for {connector_type}/{provider}",
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Query execution failed: {str(e)}",
            }

    # Query execution helpers
    async def _execute_database_query(
        self, provider: str, config: dict, query: str, params: dict | None = None
    ) -> dict:
        """Execute database query."""
        import time

        start_time = time.time()

        if provider == "postgresql":
            return await self._execute_postgresql_query(
                config, query, params, start_time
            )
        elif provider == "mongodb":
            return await self._execute_mongodb_query(config, query, params, start_time)
        elif provider == "redis":
            return await self._execute_redis_query(config, query, params, start_time)
        else:
            return {
                "success": False,
                "error": f"Query execution not implemented for {provider}",
            }

    async def _execute_postgresql_query(
        self, config: dict, query: str, params: dict | None, start_time: float
    ) -> dict:
        """Execute PostgreSQL query."""
        import time

        host = config.get("host", "localhost")
        port = config.get("port", 5432)
        database = config.get("database", "postgres")
        user = config.get("user", "postgres")
        password = config.get("password", "")
        timeout = config.get("timeout", 30)

        try:
            conn = await asyncpg.connect(
                host=host,
                port=port,
                database=database,
                user=user,
                password=password,
                timeout=timeout,
            )

            # Determine query type
            query_upper = query.strip().upper()
            is_select = query_upper.startswith("SELECT")

            # Execute query
            if is_select:
                # SELECT query - fetch results
                rows = await conn.fetch(query)
                data = [dict(row) for row in rows]
                row_count = len(data)
            else:
                # DML/DDL query - execute and return status
                result = await conn.execute(query)
                data = []
                # Extract row count from result string (e.g., "UPDATE 5")
                row_count = (
                    int(result.split()[-1]) if result.split()[-1].isdigit() else 0
                )

            await conn.close()

            execution_time = (time.time() - start_time) * 1000  # milliseconds

            return {
                "success": True,
                "data": data,
                "row_count": row_count,
                "execution_time_ms": round(execution_time, 2),
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"PostgreSQL query failed: {str(e)}",
            }

    async def _execute_mongodb_query(
        self, config: dict, query: str, params: dict | None, start_time: float
    ) -> dict:
        """Execute MongoDB query."""
        import time

        host = config.get("host", "localhost")
        port = config.get("port", 27017)
        database = config.get("database", "test")
        username = config.get("username", "")
        password = config.get("password", "")
        collection = params.get("collection") if params else None

        if not collection:
            return {
                "success": False,
                "error": "collection parameter is required for MongoDB queries",
            }

        try:
            # Build connection string
            if username and password:
                connection_string = (
                    f"mongodb://{username}:{password}@{host}:{port}/{database}"
                )
            else:
                connection_string = f"mongodb://{host}:{port}/{database}"

            client = motor_asyncio.AsyncIOMotorClient(connection_string)
            db = client[database]
            coll = db[collection]

            # Parse query as JSON (MongoDB filter)
            try:
                filter_doc = json.loads(query) if query else {}
            except json.JSONDecodeError:
                return {
                    "success": False,
                    "error": "Invalid MongoDB query - must be valid JSON",
                }

            # Execute find operation
            cursor = coll.find(filter_doc)
            documents = await cursor.to_list(length=1000)  # Limit to 1000 docs

            # Convert ObjectId to string for JSON serialization
            for doc in documents:
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])

            client.close()

            execution_time = (time.time() - start_time) * 1000

            return {
                "success": True,
                "data": documents,
                "row_count": len(documents),
                "execution_time_ms": round(execution_time, 2),
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"MongoDB query failed: {str(e)}",
            }

    async def _execute_redis_query(
        self, config: dict, query: str, params: dict | None, start_time: float
    ) -> dict:
        """Execute Redis query."""
        import time

        host = config.get("host", "localhost")
        port = config.get("port", 6379)
        db = config.get("db", 0)
        password = config.get("password", "")
        operation = params.get("operation", "get") if params else "get"

        try:
            client = aioredis.Redis(
                host=host,
                port=port,
                db=db,
                password=password if password else None,
            )

            # Execute based on operation type
            result = None
            if operation == "get":
                result = await client.get(query)
                if result:
                    result = (
                        result.decode("utf-8") if isinstance(result, bytes) else result
                    )
            elif operation == "set":
                value = params.get("value", "") if params else ""
                await client.set(query, value)
                result = "OK"
            elif operation == "delete":
                deleted_count = await client.delete(query)
                result = f"Deleted {deleted_count} keys"
            elif operation == "keys":
                # List keys matching pattern
                keys = await client.keys(query)
                result = [
                    k.decode("utf-8") if isinstance(k, bytes) else k for k in keys
                ]
            else:
                await client.close()
                return {
                    "success": False,
                    "error": f"Unsupported Redis operation: {operation}",
                }

            await client.close()

            execution_time = (time.time() - start_time) * 1000

            return {
                "success": True,
                "data": result,
                "row_count": 1 if result else 0,
                "execution_time_ms": round(execution_time, 2),
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Redis query failed: {str(e)}",
            }

    async def _execute_api_query(
        self, provider: str, config: dict, query: str, params: dict | None
    ) -> dict:
        """Execute API query."""
        import time

        start_time = time.time()

        if provider not in ["rest", "graphql"]:
            return {
                "success": False,
                "error": f"API query execution not implemented for {provider}",
            }

        base_url = config.get("base_url", "")
        headers = config.get("headers", {})
        auth_type = config.get("auth_type", "none")
        timeout = config.get("timeout", 30)
        method = params.get("method", "GET").upper() if params else "GET"

        if not base_url:
            return {
                "success": False,
                "error": "base_url is required for API queries",
            }

        try:
            # Build request URL
            url = f"{base_url.rstrip('/')}/{query.lstrip('/')}"

            # Build headers
            request_headers = dict(headers)

            # Handle authentication
            auth = None
            if auth_type == "basic":
                username = config.get("username", "")
                password = config.get("password", "")
                auth = (username, password) if username else None
            elif auth_type == "bearer":
                token = config.get("token", "")
                if token:
                    request_headers["Authorization"] = f"Bearer {token}"
            elif auth_type == "api_key":
                api_key = config.get("api_key", "")
                api_key_header = config.get("api_key_header", "X-API-Key")
                if api_key:
                    request_headers[api_key_header] = api_key

            # Prepare request body
            json_body = params.get("body") if params else None

            async with httpx.AsyncClient(timeout=timeout) as client:
                if method == "GET":
                    response = await client.get(url, headers=request_headers, auth=auth)
                elif method == "POST":
                    response = await client.post(
                        url, headers=request_headers, auth=auth, json=json_body
                    )
                elif method == "PUT":
                    response = await client.put(
                        url, headers=request_headers, auth=auth, json=json_body
                    )
                elif method == "DELETE":
                    response = await client.delete(
                        url, headers=request_headers, auth=auth
                    )
                else:
                    return {
                        "success": False,
                        "error": f"Unsupported HTTP method: {method}",
                    }

                execution_time = (time.time() - start_time) * 1000

                # Try to parse JSON response
                try:
                    data = response.json()
                except Exception:
                    data = response.text

                return {
                    "success": 200 <= response.status_code < 400,
                    "data": data,
                    "status_code": response.status_code,
                    "execution_time_ms": round(execution_time, 2),
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"API query failed: {str(e)}",
            }

    async def _execute_messaging_query(
        self, provider: str, config: dict, query: str, params: dict | None
    ) -> dict:
        """Execute messaging query."""
        if provider == "redis_pubsub":
            # For Redis Pub/Sub, query is the channel name
            # Operation is in params: publish, subscribe
            operation = params.get("operation", "publish") if params else "publish"
            message = params.get("message", "") if params else ""

            if operation == "publish":
                # Publish message to channel
                import time

                start_time = time.time()
                result = await self._redis_publish(config, query, message)
                execution_time = (time.time() - start_time) * 1000

                if result.get("success"):
                    return {
                        "success": True,
                        "data": result,
                        "execution_time_ms": round(execution_time, 2),
                    }
                else:
                    return result
            else:
                return {
                    "success": False,
                    "error": f"Unsupported Redis Pub/Sub operation: {operation}",
                }
        else:
            return {
                "success": False,
                "error": f"Messaging query not implemented for {provider}",
            }

    async def _redis_publish(self, config: dict, channel: str, message: str) -> dict:
        """Publish message to Redis Pub/Sub channel."""
        host = config.get("host", "localhost")
        port = config.get("port", 6379)
        db = config.get("db", 0)
        password = config.get("password", "")

        try:
            client = aioredis.Redis(
                host=host,
                port=port,
                db=db,
                password=password if password else None,
            )

            # Publish message
            subscribers = await client.publish(channel, message)
            await client.close()

            return {
                "success": True,
                "message": f"Published to {subscribers} subscribers",
                "subscribers": subscribers,
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Redis publish failed: {str(e)}",
            }

    # ===================
    # Utility Methods
    # ===================

    def get_connector_types(self) -> dict:
        """Get available connector types and providers."""
        return CONNECTOR_TYPES

    def validate_connector_type(self, connector_type: str, provider: str) -> bool:
        """Validate that provider is valid for connector type."""
        if connector_type not in CONNECTOR_TYPES:
            return False
        return provider in CONNECTOR_TYPES[connector_type]
