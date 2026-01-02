"""
External Agent Service

CRUD operations and business logic for external agents using DataFlow nodes.
Handles validation, credential encryption, and invocation tracking.
"""

import json
import uuid
from datetime import UTC, datetime

from cryptography.fernet import Fernet
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.config import get_settings
from studio.services.governance_service import GovernanceService
from studio.services.lineage_service import LineageService


class ExternalAgentService:
    """
    External agent service for managing external agent registrations and invocations.

    Uses DataFlow nodes for all database operations.
    Implements credential encryption, validation, and invocation tracking.
    """

    def __init__(self, runtime=None, lineage_service=None, governance_service=None):
        """Initialize the external agent service."""
        self.runtime = runtime or AsyncLocalRuntime()
        self.lineage_service = lineage_service or LineageService(runtime=self.runtime)
        self.governance_service = governance_service or GovernanceService(
            runtime=self.runtime
        )

        # Initialize encryption service
        settings = get_settings()
        # Use encryption key from settings or generate for testing
        encryption_key = getattr(settings, "credential_encryption_key", None)
        if not encryption_key:
            # Generate key for testing (in production, this should come from secure storage)
            encryption_key = Fernet.generate_key()
        self.cipher = Fernet(
            encryption_key
            if isinstance(encryption_key, bytes)
            else encryption_key.encode()
        )

    def _normalize_response(self, data: dict | None) -> dict | None:
        """
        Normalize response data for API compatibility.

        Maps internal field names to API-facing names:
        - agent_tags -> tags (to avoid DataFlow NodeMetadata conflict)
        """
        if not data:
            return data
        result = data.copy()
        if "agent_tags" in result:
            result["tags"] = result.pop("agent_tags")
        return result

    # ===================
    # Validation Methods
    # ===================

    async def validate_auth_config(self, auth_type: str, auth_config: dict) -> bool:
        """
        Validate authentication configuration based on auth_type.

        Args:
            auth_type: Type of authentication (oauth2, api_key, bearer_token, custom, none)
            auth_config: Authentication configuration dictionary

        Returns:
            True if valid

        Raises:
            ValueError: If validation fails
        """
        if auth_type == "oauth2":
            if "client_id" not in auth_config:
                raise ValueError("OAuth2 auth_config must include client_id")
            if "client_secret" not in auth_config:
                raise ValueError("OAuth2 auth_config must include client_secret")
            if "token_url" not in auth_config:
                raise ValueError("OAuth2 auth_config must include token_url")
            return True

        elif auth_type == "api_key":
            if "key" not in auth_config:
                raise ValueError("API Key auth_config must include key")
            return True

        elif auth_type == "bearer_token":
            if "token" not in auth_config:
                raise ValueError("Bearer token auth_config must include token")
            return True

        elif auth_type == "basic":
            if "username" not in auth_config:
                raise ValueError("Basic auth_config must include username")
            if "password" not in auth_config:
                raise ValueError("Basic auth_config must include password")
            return True

        elif auth_type == "custom":
            # Custom auth allows arbitrary configuration
            return True

        elif auth_type == "none":
            # No auth required
            return True

        else:
            raise ValueError(
                f"Invalid auth_type: {auth_type}. Must be one of: oauth2, api_key, bearer_token, basic, custom, none"
            )

    async def validate_platform_config(
        self, platform: str, platform_config: dict
    ) -> bool:
        """
        Validate platform configuration based on platform type.

        Args:
            platform: Platform type (teams, discord, slack, telegram, notion, custom_http)
            platform_config: Platform-specific configuration

        Returns:
            True if valid

        Raises:
            ValueError: If validation fails
        """
        if platform == "teams":
            if "tenant_id" not in platform_config:
                raise ValueError("Teams platform_config must include tenant_id")
            if "channel_id" not in platform_config:
                raise ValueError("Teams platform_config must include channel_id")
            return True

        elif platform == "discord":
            if "webhook_url" not in platform_config:
                raise ValueError("Discord platform_config must include webhook_url")
            return True

        elif platform == "slack":
            if "webhook_url" not in platform_config:
                raise ValueError("Slack platform_config must include webhook_url")
            return True

        elif platform == "telegram":
            if "bot_token" not in platform_config:
                raise ValueError("Telegram platform_config must include bot_token")
            if "chat_id" not in platform_config:
                raise ValueError("Telegram platform_config must include chat_id")
            return True

        elif platform == "notion":
            if "token" not in platform_config:
                raise ValueError("Notion platform_config must include token")
            if "database_id" not in platform_config:
                raise ValueError("Notion platform_config must include database_id")
            return True

        elif platform == "custom_http":
            # Custom HTTP allows arbitrary configuration
            return True

        else:
            raise ValueError(f"Invalid platform: {platform}")

    # ===================
    # Credential Encryption
    # ===================

    async def encrypt_credentials(self, credentials: dict) -> str:
        """
        Encrypt credentials using Fernet encryption.

        Args:
            credentials: Dictionary of credentials to encrypt

        Returns:
            Encrypted credentials as string
        """
        json_str = json.dumps(credentials)
        encrypted = self.cipher.encrypt(json_str.encode())
        return encrypted.decode()

    async def decrypt_credentials(self, encrypted_credentials: str) -> dict:
        """
        Decrypt credentials.

        Args:
            encrypted_credentials: Encrypted credentials string

        Returns:
            Decrypted credentials dictionary
        """
        decrypted = self.cipher.decrypt(encrypted_credentials.encode())
        return json.loads(decrypted.decode())

    # ===================
    # Governance (Phase 3)
    # ===================

    async def check_rate_limit(
        self, agent_id: str, user_id: str, organization_id: str
    ) -> tuple[bool, dict]:
        """
        Check rate limits using GovernanceService.

        Args:
            agent_id: External agent ID
            user_id: User ID making the request
            organization_id: Organization ID

        Returns:
            Tuple of (allowed: bool, result: dict with rate limit info)
        """
        result = await self.governance_service.check_rate_limit(
            external_agent_id=agent_id,
            user_id=user_id,
            org_id=organization_id,
        )

        return result.allowed, {
            "limit_exceeded": result.limit_exceeded,
            "remaining": result.remaining,
            "retry_after_seconds": result.retry_after_seconds,
            "current_usage": result.current_usage,
        }

    async def check_budget(
        self, agent_id: str, organization_id: str, estimated_cost: float
    ) -> tuple[bool, dict]:
        """
        Check budget limits using GovernanceService.

        Args:
            agent_id: External agent ID
            organization_id: Organization ID
            estimated_cost: Estimated cost of invocation

        Returns:
            Tuple of (allowed: bool, result: dict with budget info)
        """
        result = await self.governance_service.check_budget(
            external_agent_id=agent_id,
            organization_id=organization_id,
            estimated_cost=estimated_cost,
        )

        return result.allowed, {
            "reason": result.reason,
            "remaining_budget_usd": result.remaining_budget_usd,
            "remaining_executions": result.remaining_executions,
            "degraded_mode": result.degraded_mode,
            "usage_percentage": result.usage_percentage,
        }

    # ===================
    # Invocation Logging
    # ===================

    async def log_invocation(self, invocation_data: dict) -> dict:
        """
        Log external agent invocation (stub for Phase 1, full observability in Phase 2).

        Args:
            invocation_data: Invocation details

        Returns:
            Created invocation record
        """
        now = datetime.now(UTC).isoformat()
        invocation_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentInvocationCreateNode",
            "create",
            {
                "id": invocation_id,
                "external_agent_id": invocation_data["external_agent_id"],
                "user_id": invocation_data["user_id"],
                "organization_id": invocation_data["organization_id"],
                "request_payload": invocation_data.get("request_payload", "{}"),
                "request_ip": invocation_data.get("request_ip", ""),
                "request_user_agent": invocation_data.get("request_user_agent", ""),
                "response_payload": invocation_data.get("response_payload", "{}"),
                "response_status_code": invocation_data.get("response_status_code", 0),
                "execution_time_ms": invocation_data.get("execution_time_ms", 0),
                "auth_passed": invocation_data.get("auth_passed", True),
                "budget_passed": invocation_data.get("budget_passed", True),
                "rate_limit_passed": invocation_data.get("rate_limit_passed", True),
                "status": invocation_data.get("status", "pending"),
                "error_message": invocation_data.get("error_message", ""),
                "trace_id": invocation_data.get("trace_id", str(uuid.uuid4())),
                "estimated_cost": invocation_data.get("estimated_cost", 0.0),
                "actual_cost": invocation_data.get("actual_cost", 0.0),
                "webhook_delivery_status": "pending",  # Initialize webhook delivery status
                "webhook_delivery_error": "",
                "webhook_delivered_at": "",
                "invoked_at": invocation_data.get("invoked_at", now),
                "completed_at": invocation_data.get("completed_at", now),
                "created_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Ensure the invocation id is always present in the result
        invocation_result = results.get("create", {})
        if not invocation_result.get("id"):
            # If DataFlow didn't return the record, use the generated id
            invocation_result["id"] = invocation_id
        return invocation_result

    # ===================
    # External Agent CRUD
    # ===================

    async def create(
        self,
        organization_id: str,
        workspace_id: str,
        name: str,
        platform: str,
        webhook_url: str,
        auth_type: str,
        created_by: str,
        description: str = "",
        platform_agent_id: str = "",
        auth_config: dict | None = None,
        platform_config: dict | None = None,
        capabilities: list | None = None,
        config: dict | None = None,
        budget_limit_daily: float = -1.0,
        budget_limit_monthly: float = -1.0,
        rate_limit_per_minute: int = -1,
        rate_limit_per_hour: int = -1,
        tags: list | None = None,
        status: str = "active",
    ) -> dict:
        """
        Create a new external agent.

        Args:
            organization_id: Organization ID
            workspace_id: Workspace ID
            name: Agent name
            platform: Platform type
            webhook_url: Webhook/endpoint URL
            auth_type: Authentication type
            created_by: User ID who created the agent
            description: Optional description
            platform_agent_id: Optional platform-specific agent ID
            auth_config: Authentication configuration (will be encrypted)
            platform_config: Platform configuration
            capabilities: List of capabilities
            config: General configuration
            budget_limit_daily: Daily budget limit (-1 = unlimited)
            budget_limit_monthly: Monthly budget limit (-1 = unlimited)
            rate_limit_per_minute: Rate limit per minute (-1 = unlimited)
            rate_limit_per_hour: Rate limit per hour (-1 = unlimited)
            tags: List of tags
            status: Status (active, inactive, deleted)

        Returns:
            Created external agent data
        """
        now = datetime.now(UTC).isoformat()
        agent_id = str(uuid.uuid4())

        # Validate auth config
        if auth_config is None:
            auth_config = {}
        await self.validate_auth_config(auth_type, auth_config)

        # Validate platform config
        if platform_config is None:
            platform_config = {}
        await self.validate_platform_config(platform, platform_config)

        # Encrypt credentials
        encrypted_credentials = await self.encrypt_credentials(auth_config)

        # Prepare JSON fields
        platform_config_json = json.dumps(platform_config)
        capabilities_json = json.dumps(capabilities or [])
        config_json = json.dumps(config or {})
        agent_tags_json = json.dumps(tags or [])

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentCreateNode",
            "create",
            {
                "id": agent_id,
                "organization_id": organization_id,
                "workspace_id": workspace_id,
                "name": name,
                "description": description,
                "platform": platform,
                "platform_agent_id": platform_agent_id,
                "webhook_url": webhook_url,
                "auth_type": auth_type,
                "encrypted_credentials": encrypted_credentials,
                "platform_config": platform_config_json,
                "capabilities": capabilities_json,
                "config": config_json,
                "budget_limit_daily": budget_limit_daily,
                "budget_limit_monthly": budget_limit_monthly,
                "rate_limit_per_minute": rate_limit_per_minute,
                "rate_limit_per_hour": rate_limit_per_hour,
                "agent_tags": agent_tags_json,
                "status": status,
                "created_by": created_by,
                "created_at": now,
                "updated_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        created = results.get("create", {})

        # Remove encrypted credentials from response
        if created and "encrypted_credentials" in created:
            created = created.copy()
            created.pop("encrypted_credentials", None)

        return self._normalize_response(created)

    async def get(self, agent_id: str) -> dict | None:
        """
        Get an external agent by ID.

        Args:
            agent_id: External agent ID

        Returns:
            External agent data or None if not found
        """
        workflow = WorkflowBuilder()
        workflow.add_node("ExternalAgentReadNode", "read", {"id": agent_id})

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        agent = results.get("read")

        # Remove encrypted credentials from response
        if agent and "encrypted_credentials" in agent:
            agent = agent.copy()
            agent.pop("encrypted_credentials", None)

        return self._normalize_response(agent)

    async def list(
        self,
        organization_id: str,
        workspace_id: str | None = None,
        platform: str | None = None,
        status: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict:
        """
        List external agents with filtering and pagination.

        Args:
            organization_id: Organization ID
            workspace_id: Optional workspace filter
            platform: Optional platform filter
            status: Optional status filter
            limit: Page size
            offset: Page offset

        Returns:
            Dictionary with agents, total, limit, offset
        """
        # Build filter conditions
        filters = {"organization_id": organization_id}
        if workspace_id:
            filters["workspace_id"] = workspace_id
        if platform:
            filters["platform"] = platform
        if status:
            filters["status"] = status

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentListNode",
            "list",
            {
                "filter": filters,  # DataFlow expects 'filter' as a dict, not 'filters' as JSON
                "limit": limit,
                "offset": offset,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        agents = list_result.get(
            "records", []
        )  # DataFlow ListNode returns "records", not "items"
        total = list_result.get("total", len(agents))

        # Remove encrypted credentials and normalize field names
        agents = [
            self._normalize_response(
                {k: v for k, v in agent.items() if k != "encrypted_credentials"}
            )
            for agent in agents
        ]

        return {
            "agents": agents,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    async def update(self, agent_id: str, updates: dict) -> dict | None:
        """
        Update an external agent.

        Args:
            agent_id: External agent ID
            updates: Dictionary of fields to update

        Returns:
            Updated external agent data or None if not found
        """
        # Validate auth config if being updated
        if "auth_type" in updates and "auth_config" in updates:
            await self.validate_auth_config(
                updates["auth_type"], updates["auth_config"]
            )
            # Encrypt credentials
            encrypted = await self.encrypt_credentials(updates["auth_config"])
            updates["encrypted_credentials"] = encrypted
            updates.pop("auth_config", None)

        # Validate platform config if being updated
        if "platform" in updates and "platform_config" in updates:
            await self.validate_platform_config(
                updates["platform"], updates["platform_config"]
            )
            updates["platform_config"] = json.dumps(updates["platform_config"])

        # Convert lists to JSON strings
        if "capabilities" in updates:
            updates["capabilities"] = json.dumps(updates["capabilities"])
        if "config" in updates:
            updates["config"] = json.dumps(updates["config"])
        if "tags" in updates:
            updates["agent_tags"] = json.dumps(updates.pop("tags"))

        # NOTE: Do NOT set updated_at - DataFlow manages it automatically

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentUpdateNode",
            "update",
            {"id": agent_id, **updates},
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        updated = results.get("update")

        # Remove encrypted credentials from response
        if updated and "encrypted_credentials" in updated:
            updated = updated.copy()
            updated.pop("encrypted_credentials", None)

        return self._normalize_response(updated)

    async def delete(self, agent_id: str) -> dict | None:
        """
        Soft delete an external agent (set status='deleted').

        Args:
            agent_id: External agent ID

        Returns:
            Deleted external agent data or None if not found
        """
        return await self.update(agent_id, {"status": "deleted"})

    # ===================
    # Invocation
    # ===================

    async def invoke(
        self,
        agent_id: str,
        user_id: str,
        organization_id: str,
        request_data: dict,
        request_ip: str = "",
        request_user_agent: str = "",
        external_headers: dict | None = None,
        api_key: dict | None = None,
    ) -> dict:
        """
        Invoke an external agent with full lineage tracking.

        Creates lineage record before invocation, executes the HTTP request,
        and updates lineage with results.

        Args:
            agent_id: External agent ID
            user_id: User invoking the agent
            organization_id: Organization ID
            request_data: Request payload
            request_ip: Client IP address
            request_user_agent: Client user agent
            external_headers: Optional external identity headers (X-External-*)
            api_key: Optional API key record for lineage

        Returns:
            Invocation result with invocation_id, trace_id, status, output
        """
        import traceback

        import httpx

        # Get agent details
        agent = await self.get(agent_id)
        if not agent:
            raise ValueError(f"External agent {agent_id} not found")

        if agent.get("status") == "deleted":
            raise ValueError(f"External agent {agent_id} is deleted")

        # Estimate cost (simplified for now - can be enhanced with platform-specific pricing)
        estimated_cost = 0.05  # $0.05 per invocation default

        # Check rate limit
        rate_limit_ok, rate_limit_info = await self.check_rate_limit(
            agent_id, user_id, organization_id
        )
        if not rate_limit_ok:
            error_msg = "Rate limit exceeded"
            if rate_limit_info.get("retry_after_seconds"):
                error_msg += (
                    f" - retry after {rate_limit_info['retry_after_seconds']} seconds"
                )
            raise ValueError(error_msg)

        # Check budget
        budget_ok, budget_info = await self.check_budget(
            agent_id, organization_id, estimated_cost
        )
        if not budget_ok:
            raise ValueError(
                f"Budget limit exceeded: {budget_info.get('reason', 'Unknown reason')}"
            )

        # Create lineage record if external headers are provided
        lineage = None
        if external_headers and api_key:
            try:
                lineage = await self.lineage_service.create_lineage_record(
                    request_headers=external_headers,
                    external_agent=agent,
                    api_key=api_key,
                    request_body=request_data,
                    ip_address=request_ip,
                    user_agent=request_user_agent,
                )
            except ValueError:
                # Missing required headers - log warning and continue without lineage
                # In production, you may want to enforce lineage tracking
                pass

        start_time = datetime.now(UTC)
        invoked_at = start_time.isoformat()
        trace_id = lineage["trace_id"] if lineage else str(uuid.uuid4())

        # Execute HTTP invocation
        try:
            # Make actual HTTP call to external agent
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    agent["webhook_url"], json=request_data, timeout=30.0
                )

                end_time = datetime.now(UTC)
                completed_at = end_time.isoformat()
                duration_ms = int((end_time - start_time).total_seconds() * 1000)

                response_data = response.json()

                # Calculate actual cost (can be enhanced with platform-specific pricing)
                actual_cost = estimated_cost

                # Record cost for budget tracking
                await self.governance_service.record_invocation_cost(
                    external_agent_id=agent_id,
                    organization_id=organization_id,
                    actual_cost=actual_cost,
                    execution_success=True,
                    metadata={"duration_ms": duration_ms},
                )

                # Record invocation for rate limiting
                await self.governance_service.record_rate_limit_invocation(
                    external_agent_id=agent_id,
                    user_id=user_id,
                    org_id=organization_id,
                )

                # Update lineage if created
                if lineage:
                    await self.lineage_service.update_lineage_result(
                        invocation_id=lineage["id"],
                        status="success",
                        response={
                            "status_code": response.status_code,
                            "headers": dict(response.headers),
                            "body": response_data,
                        },
                        duration_ms=duration_ms,
                    )

                # Also log to ExternalAgentInvocation for backward compatibility
                invocation = await self.log_invocation(
                    {
                        "external_agent_id": agent_id,
                        "user_id": user_id,
                        "organization_id": organization_id,
                        "request_payload": json.dumps(request_data),
                        "request_ip": request_ip,
                        "request_user_agent": request_user_agent,
                        "response_payload": json.dumps(response_data),
                        "response_status_code": response.status_code,
                        "execution_time_ms": duration_ms,
                        "status": "success",
                        "trace_id": trace_id,
                        "invoked_at": invoked_at,
                        "completed_at": completed_at,
                    }
                )

                # Trigger webhook delivery (async, non-blocking)
                await self._trigger_webhook_delivery(agent, invocation)

                return {
                    "invocation_id": lineage["id"] if lineage else invocation["id"],
                    "trace_id": trace_id,
                    "status": "success",
                    "output": response_data.get("result", ""),
                    "metadata": response_data.get("metadata", {}),
                }

        except Exception as e:
            # Log failed invocation
            end_time = datetime.now(UTC)
            completed_at = end_time.isoformat()
            duration_ms = int((end_time - start_time).total_seconds() * 1000)

            # Update lineage if created
            if lineage:
                await self.lineage_service.update_lineage_result(
                    invocation_id=lineage["id"],
                    status="failure",
                    duration_ms=duration_ms,
                    error={
                        "type": type(e).__name__,
                        "message": str(e),
                        "stacktrace": traceback.format_exc(),
                    },
                )

            # Also log to ExternalAgentInvocation for backward compatibility
            invocation = await self.log_invocation(
                {
                    "external_agent_id": agent_id,
                    "user_id": user_id,
                    "organization_id": organization_id,
                    "request_payload": json.dumps(request_data),
                    "request_ip": request_ip,
                    "request_user_agent": request_user_agent,
                    "response_payload": "{}",
                    "response_status_code": 0,
                    "execution_time_ms": duration_ms,
                    "status": "failed",
                    "error_message": str(e),
                    "trace_id": trace_id,
                    "invoked_at": invoked_at,
                    "completed_at": completed_at,
                }
            )

            # Trigger webhook delivery for failed invocations too (async, non-blocking)
            await self._trigger_webhook_delivery(agent, invocation)

            raise ValueError(f"External agent invocation failed: {str(e)}")

    async def _trigger_webhook_delivery(self, agent: dict, invocation: dict):
        """
        Trigger webhook delivery for invocation result (async, non-blocking).

        Args:
            agent: ExternalAgent record
            invocation: ExternalAgentInvocation record
        """
        try:
            # Import WebhookDeliveryService lazily to avoid circular dependency
            from studio.services.webhook_delivery_service import WebhookDeliveryService

            webhook_service = WebhookDeliveryService(runtime=self.runtime)

            # Trigger delivery asynchronously (fire-and-forget)
            await webhook_service.deliver_async(
                external_agent=agent,
                invocation_result=invocation,
            )

        except Exception as e:
            # Don't fail invocation if webhook delivery fails
            # Just log the error for debugging
            print(f"Failed to trigger webhook delivery: {e}")
