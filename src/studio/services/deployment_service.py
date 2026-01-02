"""
Deployment Service

Manages agent deployments to Nexus gateways.
"""

import json
import uuid
from datetime import UTC, datetime

import httpx
from cryptography.fernet import Fernet
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.config import get_settings


class DeploymentService:
    """
    Deployment service for managing agent deployments.

    Features:
    - Deployment CRUD operations
    - Deployment lifecycle management
    - Deployment logging
    - Gateway communication
    """

    def __init__(self, runtime=None):
        """Initialize the deployment service."""
        self.settings = get_settings()
        self.runtime = runtime or AsyncLocalRuntime()
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

    def decrypt_secret(self, encrypted: str) -> str:
        """Decrypt a secret using Fernet."""
        return self.fernet.decrypt(encrypted.encode()).decode()

    async def create(self, data: dict) -> dict:
        """
        Create a new deployment record.

        Args:
            data: Deployment data

        Returns:
            Created deployment data
        """
        now = datetime.now(UTC).isoformat()
        deployment_id = str(uuid.uuid4())

        deployment_data = {
            "id": deployment_id,
            "organization_id": data["organization_id"],
            "agent_id": data["agent_id"],
            "agent_version_id": data.get("agent_version_id") or "",
            "gateway_id": data["gateway_id"],
            "registration_id": "",  # Kailash requires string, not None
            "status": "pending",
            "endpoint_url": "",  # Will be set when deployed
            "error_message": "",  # Will be set on error
            "deployed_by": data["deployed_by"],
            "deployed_at": "",  # Will be set when deployed
            "stopped_at": "",  # Will be set when stopped
            "updated_at": now,
        }

        workflow = WorkflowBuilder()
        workflow.add_node("DeploymentCreateNode", "create_deployment", deployment_data)

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return deployment_data

    async def get(self, deployment_id: str) -> dict | None:
        """
        Get a deployment by ID.

        Args:
            deployment_id: Deployment ID

        Returns:
            Deployment data if found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "DeploymentReadNode",
            "read_deployment",
            {
                "id": deployment_id,
            },
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            return results.get("read_deployment")
        except Exception:
            # Record not found - DataFlow throws an exception
            return None

    async def list(
        self,
        organization_id: str,
        agent_id: str | None = None,
        gateway_id: str | None = None,
        status: str | None = None,
    ) -> list:
        """
        List deployments with optional filters.

        Args:
            organization_id: Organization ID
            agent_id: Optional agent filter
            gateway_id: Optional gateway filter
            status: Optional status filter

        Returns:
            List of deployments
        """
        filter_data = {"organization_id": organization_id}
        if agent_id:
            filter_data["agent_id"] = agent_id
        if gateway_id:
            filter_data["gateway_id"] = gateway_id
        if status:
            filter_data["status"] = status

        workflow = WorkflowBuilder()
        workflow.add_node(
            "DeploymentListNode",
            "list_deployments",
            {
                "filter": filter_data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        return results.get("list_deployments", {}).get("records", [])

    async def deploy(
        self,
        agent_id: str,
        gateway_id: str,
        user_id: str,
        agent_version_id: str | None = None,
    ) -> dict:
        """
        Deploy an agent to a gateway.

        Args:
            agent_id: Agent ID to deploy
            gateway_id: Target gateway ID
            user_id: User initiating deployment
            agent_version_id: Optional specific version

        Returns:
            Deployment data
        """
        # Get agent
        agent_workflow = WorkflowBuilder()
        agent_workflow.add_node("AgentReadNode", "read_agent", {"id": agent_id})
        agent_results, _ = await self.runtime.execute_workflow_async(
            agent_workflow.build(), inputs={}
        )
        agent = agent_results.get("read_agent")

        if not agent:
            raise ValueError(f"Agent not found: {agent_id}")

        # Get gateway
        gateway_workflow = WorkflowBuilder()
        gateway_workflow.add_node("GatewayReadNode", "read_gateway", {"id": gateway_id})
        gateway_results, _ = await self.runtime.execute_workflow_async(
            gateway_workflow.build(), inputs={}
        )
        gateway = gateway_results.get("read_gateway")

        if not gateway:
            raise ValueError(f"Gateway not found: {gateway_id}")

        if gateway["status"] != "active":
            raise ValueError(f"Gateway is not active: {gateway['status']}")

        # Create deployment record
        deployment = await self.create(
            {
                "organization_id": agent["organization_id"],
                "agent_id": agent_id,
                "agent_version_id": agent_version_id,
                "gateway_id": gateway_id,
                "deployed_by": user_id,
            }
        )

        # Log deployment start
        await self.add_log(
            deployment["id"], "started", f"Deployment initiated by user {user_id}"
        )

        # Update status to deploying
        await self.update_status(deployment["id"], "deploying")
        await self.add_log(
            deployment["id"], "building", "Building agent for deployment"
        )

        try:
            # Get agent version if specified
            version_config = None
            if agent_version_id:
                version_workflow = WorkflowBuilder()
                version_workflow.add_node(
                    "AgentVersionReadNode", "read_version", {"id": agent_version_id}
                )
                version_results, _ = await self.runtime.execute_workflow_async(
                    version_workflow.build(), inputs={}
                )
                version = version_results.get("read_version")
                if version:
                    version_config = version.get("config")

            # Build deployment payload for Nexus
            deploy_payload = {
                "name": agent["name"],
                "description": agent.get("description"),
                "agent_type": agent.get("agent_type", "conversational"),
                "config": version_config or agent.get("system_prompt"),
            }

            # Send to Nexus gateway
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{gateway['api_url']}/api/v1/agents/register",
                    json=deploy_payload,
                    headers={
                        "Authorization": f"Bearer {self.decrypt_secret(gateway['api_key_encrypted'])}",
                        "Content-Type": "application/json",
                    },
                )

                if response.status_code not in (200, 201):
                    raise Exception(f"Gateway registration failed: {response.text}")

                result = response.json()

            # Update deployment with success
            now = datetime.now(UTC).isoformat()
            endpoint_url = (
                f"{gateway['api_url']}/api/v1/agents/{result.get('id', agent['name'])}"
            )

            # NOTE: Do NOT set updated_at - DataFlow manages it automatically
            update_workflow = WorkflowBuilder()
            update_workflow.add_node(
                "DeploymentUpdateNode",
                "update_deployment",
                {
                    "filter": {"id": deployment["id"]},
                    "fields": {
                        "status": "active",
                        "registration_id": result.get("id"),
                        "endpoint_url": endpoint_url,
                        "deployed_at": now,
                    },
                },
            )

            await self.runtime.execute_workflow_async(
                update_workflow.build(), inputs={}
            )

            await self.add_log(
                deployment["id"],
                "registered",
                f"Agent registered with endpoint: {endpoint_url}",
                {"registration_id": result.get("id"), "endpoint_url": endpoint_url},
            )

            deployment["status"] = "active"
            deployment["registration_id"] = result.get("id")
            deployment["endpoint_url"] = endpoint_url
            deployment["deployed_at"] = now

            return deployment

        except Exception as e:
            # Update deployment with failure
            error_message = str(e)
            await self.update_status(deployment["id"], "failed", error_message)
            await self.add_log(
                deployment["id"],
                "failed",
                f"Deployment failed: {error_message}",
                {"error": error_message},
            )

            deployment["status"] = "failed"
            deployment["error_message"] = error_message
            return deployment

    async def stop(self, deployment_id: str) -> dict:
        """
        Stop a deployment.

        Args:
            deployment_id: Deployment ID

        Returns:
            Updated deployment data
        """
        deployment = await self.get(deployment_id)
        if not deployment:
            raise ValueError(f"Deployment not found: {deployment_id}")

        if deployment["status"] not in ("active", "deploying"):
            raise ValueError(
                f"Cannot stop deployment in status: {deployment['status']}"
            )

        # Get gateway to unregister
        if deployment.get("registration_id"):
            gateway_workflow = WorkflowBuilder()
            gateway_workflow.add_node(
                "GatewayReadNode", "read_gateway", {"id": deployment["gateway_id"]}
            )
            gateway_results, _ = await self.runtime.execute_workflow_async(
                gateway_workflow.build(), inputs={}
            )
            gateway = gateway_results.get("read_gateway")

            if gateway:
                try:
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        await client.delete(
                            f"{gateway['api_url']}/api/v1/agents/{deployment['registration_id']}",
                            headers={
                                "Authorization": f"Bearer {self.decrypt_secret(gateway['api_key_encrypted'])}"
                            },
                        )
                except Exception as e:
                    await self.add_log(
                        deployment_id,
                        "stopped",
                        f"Warning: Could not unregister from gateway: {str(e)}",
                    )

        # Update deployment status
        # NOTE: Do NOT set updated_at - DataFlow manages it automatically
        now = datetime.now(UTC).isoformat()
        update_workflow = WorkflowBuilder()
        update_workflow.add_node(
            "DeploymentUpdateNode",
            "update_deployment",
            {
                "filter": {"id": deployment_id},
                "fields": {
                    "status": "stopped",
                    "stopped_at": now,
                },
            },
        )

        await self.runtime.execute_workflow_async(update_workflow.build(), inputs={})

        await self.add_log(deployment_id, "stopped", "Deployment stopped")

        deployment["status"] = "stopped"
        deployment["stopped_at"] = now
        return deployment

    async def redeploy(self, deployment_id: str) -> dict:
        """
        Redeploy an existing deployment.

        Args:
            deployment_id: Deployment ID

        Returns:
            New deployment data
        """
        deployment = await self.get(deployment_id)
        if not deployment:
            raise ValueError(f"Deployment not found: {deployment_id}")

        # Stop existing if active
        if deployment["status"] in ("active", "deploying"):
            await self.stop(deployment_id)

        # Create new deployment with same parameters
        return await self.deploy(
            deployment["agent_id"],
            deployment["gateway_id"],
            deployment["deployed_by"],
            deployment.get("agent_version_id"),
        )

    async def add_log(
        self,
        deployment_id: str,
        event_type: str,
        message: str,
        metadata: dict | None = None,
    ):
        """
        Add a log entry for a deployment.

        Args:
            deployment_id: Deployment ID
            event_type: Type of event
            message: Log message
            metadata: Optional metadata dict
        """
        log_data = {
            "id": str(uuid.uuid4()),
            "deployment_id": deployment_id,
            "event_type": event_type,
            "message": message,
            "metadata": json.dumps(metadata) if metadata else None,
            "created_at": datetime.now(UTC).isoformat(),
        }

        workflow = WorkflowBuilder()
        workflow.add_node("DeploymentLogCreateNode", "create_log", log_data)

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    async def get_logs(self, deployment_id: str) -> list:
        """
        Get logs for a deployment.

        Args:
            deployment_id: Deployment ID

        Returns:
            List of log entries
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "DeploymentLogListNode",
            "list_logs",
            {
                "filter": {"deployment_id": deployment_id},
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        logs = results.get("list_logs", {}).get("records", [])

        # Parse metadata JSON
        for log in logs:
            if log.get("metadata"):
                try:
                    log["metadata"] = json.loads(log["metadata"])
                except json.JSONDecodeError:
                    pass

        return logs

    async def update_status(
        self, deployment_id: str, status: str, error: str | None = None
    ):
        """
        Update deployment status.

        Args:
            deployment_id: Deployment ID
            status: New status
            error: Optional error message
        """
        fields = {
            "status": status,
            "updated_at": datetime.now(UTC).isoformat(),
        }

        if error:
            fields["error_message"] = error

        workflow = WorkflowBuilder()
        workflow.add_node(
            "DeploymentUpdateNode",
            "update_status",
            {
                "filter": {"id": deployment_id},
                "fields": fields,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})
