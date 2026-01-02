"""
Gateway Service

Manages Nexus gateway connections for agent deployments.
"""

import uuid
from datetime import UTC, datetime

import httpx
from cryptography.fernet import Fernet
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.config import get_settings


class GatewayService:
    """
    Gateway service for managing Nexus gateway connections.

    Features:
    - Gateway CRUD operations
    - API key encryption
    - Health checks
    - Environment-based filtering
    """

    def __init__(self):
        """Initialize the gateway service."""
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

    def encrypt_secret(self, secret: str) -> str:
        """Encrypt a secret using Fernet."""
        return self.fernet.encrypt(secret.encode()).decode()

    def decrypt_secret(self, encrypted: str) -> str:
        """Decrypt a secret using Fernet."""
        return self.fernet.decrypt(encrypted.encode()).decode()

    async def create(self, data: dict) -> dict:
        """
        Create a new gateway.

        Args:
            data: Gateway data including:
                - organization_id: str
                - name: str
                - api_url: str
                - api_key: str (will be encrypted)
                - environment: str
                - description: str (optional)
                - health_check_url: str (optional)

        Returns:
            Created gateway data (without encrypted key)
        """
        now = datetime.now(UTC).isoformat()
        gateway_id = str(uuid.uuid4())

        gateway_data = {
            "id": gateway_id,
            "organization_id": data["organization_id"],
            "name": data["name"],
            "description": data.get("description")
            or "",  # Kailash requires string, not None
            "api_url": data["api_url"].rstrip("/"),
            "api_key_encrypted": self.encrypt_secret(data["api_key"]),
            "environment": data.get("environment", "development"),
            "status": "active",
            "health_check_url": data.get("health_check_url")
            or "",  # Kailash requires string
            "last_health_check": "",  # Empty string instead of None
            "last_health_status": "unknown",
            "created_at": now,
            "updated_at": now,
        }

        workflow = WorkflowBuilder()
        workflow.add_node("GatewayCreateNode", "create_gateway", gateway_data)

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Return without encrypted key
        result = gateway_data.copy()
        result.pop("api_key_encrypted")
        return result

    async def get(self, gateway_id: str) -> dict | None:
        """
        Get a gateway by ID.

        Args:
            gateway_id: Gateway ID

        Returns:
            Gateway data if found (without encrypted key)
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "GatewayReadNode",
            "read_gateway",
            {
                "id": gateway_id,
            },
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            gateway = results.get("read_gateway")

            if gateway:
                gateway.pop("api_key_encrypted", None)

            return gateway
        except Exception:
            # Record not found - DataFlow throws an exception
            return None

    async def update(self, gateway_id: str, data: dict) -> dict:
        """
        Update a gateway.

        Args:
            gateway_id: Gateway ID
            data: Fields to update

        Returns:
            Updated gateway data
        """
        # Encrypt API key if provided
        if "api_key" in data:
            data["api_key_encrypted"] = self.encrypt_secret(data.pop("api_key"))

        # Clean up URL if provided
        if "api_url" in data:
            data["api_url"] = data["api_url"].rstrip("/")

        # NOTE: Do NOT set updated_at - DataFlow manages it automatically

        workflow = WorkflowBuilder()
        workflow.add_node(
            "GatewayUpdateNode",
            "update_gateway",
            {
                "filter": {"id": gateway_id},
                "fields": data,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return await self.get(gateway_id)

    async def delete(self, gateway_id: str):
        """
        Delete a gateway.

        Args:
            gateway_id: Gateway ID
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "GatewayDeleteNode",
            "delete_gateway",
            {
                "filter": {"id": gateway_id},
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    async def list(self, organization_id: str, environment: str | None = None) -> list:
        """
        List gateways for an organization.

        Args:
            organization_id: Organization ID
            environment: Optional environment filter

        Returns:
            List of gateways
        """
        filter_data = {"organization_id": organization_id}
        if environment:
            filter_data["environment"] = environment

        workflow = WorkflowBuilder()
        workflow.add_node(
            "GatewayListNode",
            "list_gateways",
            {
                "filter": filter_data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        gateways = results.get("list_gateways", {}).get("records", [])

        # Remove encrypted keys
        for gateway in gateways:
            gateway.pop("api_key_encrypted", None)

        return gateways

    async def check_health(self, gateway_id: str) -> dict:
        """
        Check health of a gateway.

        Args:
            gateway_id: Gateway ID

        Returns:
            Health check result with status
        """
        # Get gateway with encrypted key
        workflow = WorkflowBuilder()
        workflow.add_node(
            "GatewayReadNode",
            "read_gateway",
            {
                "id": gateway_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        gateway = results.get("read_gateway")

        if not gateway:
            raise ValueError(f"Gateway not found: {gateway_id}")

        # Build health check URL
        health_url = gateway.get("health_check_url") or f"{gateway['api_url']}/health"

        now = datetime.now(UTC).isoformat()
        health_status = "unknown"
        response_time_ms = None
        error_message = None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                start_time = datetime.now()
                response = await client.get(
                    health_url,
                    headers={
                        "Authorization": f"Bearer {self.decrypt_secret(gateway['api_key_encrypted'])}"
                    },
                )
                response_time_ms = (datetime.now() - start_time).total_seconds() * 1000

                if response.status_code == 200:
                    health_status = "healthy"
                else:
                    health_status = "unhealthy"
                    error_message = f"HTTP {response.status_code}"

        except httpx.TimeoutException:
            health_status = "unhealthy"
            error_message = "Connection timeout"
        except Exception as e:
            health_status = "unhealthy"
            error_message = str(e)

        # Update gateway with health check results
        # NOTE: Do NOT set updated_at - DataFlow manages it automatically
        update_workflow = WorkflowBuilder()
        update_workflow.add_node(
            "GatewayUpdateNode",
            "update_health",
            {
                "filter": {"id": gateway_id},
                "fields": {
                    "last_health_check": now,
                    "last_health_status": health_status,
                    "status": "active" if health_status == "healthy" else "error",
                },
            },
        )

        await self.runtime.execute_workflow_async(update_workflow.build(), inputs={})

        return {
            "gateway_id": gateway_id,
            "status": health_status,
            "checked_at": now,
            "response_time_ms": response_time_ms,
            "error": error_message,
        }

    async def get_by_environment(
        self, organization_id: str, environment: str
    ) -> dict | None:
        """
        Get first active gateway for an environment.

        Args:
            organization_id: Organization ID
            environment: Environment name

        Returns:
            Gateway data if found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "GatewayListNode",
            "list_gateways",
            {
                "filter": {
                    "organization_id": organization_id,
                    "environment": environment,
                    "status": "active",
                },
                "limit": 1,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        gateways = results.get("list_gateways", {}).get("records", [])

        if gateways:
            gateway = gateways[0]
            gateway.pop("api_key_encrypted", None)
            return gateway

        return None
