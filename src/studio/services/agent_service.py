"""
Agent Service

CRUD operations for agents using DataFlow nodes.
"""

import json
import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

# Import models to register DataFlow nodes
import studio.models  # noqa: F401


class AgentService:
    """
    Agent service for managing agents, versions, contexts, and tools.

    Uses DataFlow nodes for all database operations.
    """

    def __init__(self):
        """Initialize the agent service."""
        self.runtime = AsyncLocalRuntime()

    # ===================
    # Agent CRUD
    # ===================

    async def create(
        self,
        organization_id: str,
        workspace_id: str,
        name: str,
        agent_type: str,
        model_id: str,
        created_by: str,
        description: str = "",
        system_prompt: str = "",
        temperature: float = 0.7,
        max_tokens: int = 0,
        status: str = "draft",
    ) -> dict:
        """
        Create a new agent.

        Args:
            organization_id: Organization ID
            workspace_id: Workspace ID
            name: Agent name
            agent_type: Agent type (chat, task, pipeline, custom)
            model_id: Model identifier
            created_by: User ID who created the agent
            description: Optional description
            system_prompt: Optional system prompt
            temperature: Temperature setting (0.0-2.0)
            max_tokens: Max tokens (0 = no limit)
            status: Status (draft, active, archived)

        Returns:
            Created agent data
        """
        now = datetime.now(UTC).isoformat()
        agent_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentCreateNode",
            "create",
            {
                "id": agent_id,
                "organization_id": organization_id,
                "workspace_id": workspace_id,
                "name": name,
                "description": description,
                "agent_type": agent_type,
                "status": status,
                "system_prompt": system_prompt,
                "model_id": model_id,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "created_by": created_by,
                "created_at": now,
                "updated_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create", {})

    async def get(self, agent_id: str) -> dict | None:
        """
        Get an agent by ID.

        Args:
            agent_id: Agent ID

        Returns:
            Agent data if found, None otherwise
        """
        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "AgentReadNode",
                "read",
                {
                    "id": agent_id,
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            return results.get("read")
        except Exception:
            # ReadNode throws when record not found
            return None

    async def update(self, agent_id: str, data: dict) -> dict | None:
        """
        Update an agent.

        Args:
            agent_id: Agent ID
            data: Fields to update

        Returns:
            Updated agent data
        """
        # NOTE: Do NOT set updated_at - DataFlow manages it automatically

        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentUpdateNode",
            "update",
            {
                "filter": {"id": agent_id},
                "fields": data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return await self.get(agent_id)

    async def delete(self, agent_id: str) -> bool:
        """
        Soft delete an agent (set status to archived).

        Args:
            agent_id: Agent ID

        Returns:
            True if archived successfully
        """
        await self.update(agent_id, {"status": "archived"})
        return True

    async def hard_delete(self, agent_id: str) -> bool:
        """
        Permanently delete an agent.

        Args:
            agent_id: Agent ID

        Returns:
            True if deleted successfully
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentDeleteNode",
            "delete",
            {
                "id": agent_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return True

    async def list(
        self,
        organization_id: str,
        workspace_id: str | None = None,
        filters: dict | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        List agents with optional filters.

        Args:
            organization_id: Organization ID
            workspace_id: Optional workspace ID filter
            filters: Optional additional filter conditions
            limit: Maximum records to return
            offset: Number of records to skip

        Returns:
            Dict with records and total count
        """
        workflow = WorkflowBuilder()

        # Build filter
        combined_filters = {"organization_id": organization_id}
        if workspace_id:
            combined_filters["workspace_id"] = workspace_id
        if filters:
            combined_filters.update(filters)

        workflow.add_node(
            "AgentListNode",
            "list",
            {
                "filter": combined_filters,
                "limit": limit,
                "offset": offset,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        return {
            "records": list_result.get("records", []),
            "total": list_result.get("count", list_result.get("total", 0)),
        }

    # ===================
    # Agent Versions
    # ===================

    async def create_version(
        self,
        agent_id: str,
        created_by: str,
        changelog: str = "",
    ) -> dict:
        """
        Create a version snapshot of an agent.

        Args:
            agent_id: Agent ID
            created_by: User ID who created the version
            changelog: Optional change description

        Returns:
            Created version data
        """
        # Get current agent
        agent = await self.get(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")

        # Get latest version number
        versions = await self.get_versions(agent_id)
        latest_version = 0
        if versions:
            latest_version = max(v["version_number"] for v in versions)

        # Create config snapshot
        config_snapshot = json.dumps(
            {
                "name": agent["name"],
                "description": agent.get("description", ""),
                "agent_type": agent["agent_type"],
                "system_prompt": agent.get("system_prompt", ""),
                "model_id": agent["model_id"],
                "temperature": agent["temperature"],
                "max_tokens": agent.get("max_tokens", 0),
            }
        )

        now = datetime.now(UTC).isoformat()
        version_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentVersionCreateNode",
            "create",
            {
                "id": version_id,
                "agent_id": agent_id,
                "version_number": latest_version + 1,
                "config_snapshot": config_snapshot,
                "changelog": changelog,
                "created_by": created_by,
                "created_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create", {})

    async def get_versions(self, agent_id: str) -> list:
        """
        Get all versions of an agent.

        Args:
            agent_id: Agent ID

        Returns:
            List of version records
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentVersionListNode",
            "list",
            {
                "filter": {"agent_id": agent_id},
                "limit": 1000,
                "offset": 0,
                "enable_cache": False,  # Disable cache to get fresh data
            },
        )

        results, run_id = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        list_result = results.get("list", {})
        versions = list_result.get("records", [])

        # Sort by version number descending
        return sorted(versions, key=lambda v: v["version_number"], reverse=True)

    async def get_version(self, version_id: str) -> dict | None:
        """
        Get a specific version by ID.

        Args:
            version_id: Version ID

        Returns:
            Version data if found, None otherwise
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentVersionReadNode",
            "read",
            {
                "id": version_id,
            },
        )

        try:
            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )
            return results.get("read")
        except Exception:
            # ReadNode throws when record not found
            return None

    async def rollback_to_version(
        self,
        agent_id: str,
        version_id: str,
    ) -> dict:
        """
        Rollback an agent to a specific version.

        Args:
            agent_id: Agent ID
            version_id: Version ID to rollback to

        Returns:
            Updated agent data
        """
        version = await self.get_version(version_id)
        if not version:
            raise ValueError(f"Version {version_id} not found")

        if version["agent_id"] != agent_id:
            raise ValueError(
                f"Version {version_id} does not belong to agent {agent_id}"
            )

        # Parse config snapshot and update agent
        config = json.loads(version["config_snapshot"])
        return await self.update(agent_id, config)

    # ===================
    # Agent Contexts
    # ===================

    async def add_context(
        self,
        agent_id: str,
        name: str,
        content_type: str,
        content: str,
        is_active: bool = True,
    ) -> dict:
        """
        Add context to an agent.

        Args:
            agent_id: Agent ID
            name: Context name
            content_type: Content type (text, file, url)
            content: Content or file path
            is_active: Whether context is active

        Returns:
            Created context data
        """
        now = datetime.now(UTC).isoformat()
        context_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentContextCreateNode",
            "create",
            {
                "id": context_id,
                "agent_id": agent_id,
                "name": name,
                "content_type": content_type,
                "content": content,
                "is_active": 1 if is_active else 0,
                "created_at": now,
                "updated_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create", {})

    async def update_context(self, context_id: str, data: dict) -> dict | None:
        """
        Update a context.

        Args:
            context_id: Context ID
            data: Fields to update

        Returns:
            Updated context data
        """
        # NOTE: Do NOT set updated_at - DataFlow manages it automatically

        # Convert boolean to int if present
        if "is_active" in data:
            data["is_active"] = 1 if data["is_active"] else 0

        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentContextUpdateNode",
            "update",
            {
                "filter": {"id": context_id},
                "fields": data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Get updated context
        workflow2 = WorkflowBuilder()
        workflow2.add_node(
            "AgentContextReadNode",
            "read",
            {
                "id": context_id,
            },
        )
        results2, _ = await self.runtime.execute_workflow_async(
            workflow2.build(), inputs={}
        )
        return results2.get("read")

    async def remove_context(self, context_id: str) -> bool:
        """
        Remove a context.

        Args:
            context_id: Context ID

        Returns:
            True if deleted
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentContextDeleteNode",
            "delete",
            {
                "id": context_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return True

    async def list_contexts(self, agent_id: str) -> list:
        """
        List all contexts for an agent.

        Args:
            agent_id: Agent ID

        Returns:
            List of context records
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentContextListNode",
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
        return list_result.get("records", [])

    async def get_context(self, context_id: str) -> dict | None:
        """
        Get a context by ID.

        Args:
            context_id: Context ID

        Returns:
            Context data if found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentContextReadNode",
            "read",
            {
                "id": context_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("read")

    # ===================
    # Agent Tools
    # ===================

    async def add_tool(
        self,
        agent_id: str,
        tool_type: str,
        name: str,
        description: str,
        config: dict,
        is_enabled: bool = True,
    ) -> dict:
        """
        Add a tool to an agent.

        Args:
            agent_id: Agent ID
            tool_type: Tool type (function, mcp, api)
            name: Tool name
            description: Tool description
            config: Tool configuration
            is_enabled: Whether tool is enabled

        Returns:
            Created tool data
        """
        now = datetime.now(UTC).isoformat()
        tool_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentToolCreateNode",
            "create",
            {
                "id": tool_id,
                "agent_id": agent_id,
                "tool_type": tool_type,
                "name": name,
                "description": description,
                "config": json.dumps(config),
                "is_enabled": 1 if is_enabled else 0,
                "created_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create", {})

    async def update_tool(self, tool_id: str, data: dict) -> dict | None:
        """
        Update a tool.

        Args:
            tool_id: Tool ID
            data: Fields to update

        Returns:
            Updated tool data
        """
        # Convert boolean to int if present
        if "is_enabled" in data:
            data["is_enabled"] = 1 if data["is_enabled"] else 0

        # Convert config dict to JSON string if present
        if "config" in data and isinstance(data["config"], dict):
            data["config"] = json.dumps(data["config"])

        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentToolUpdateNode",
            "update",
            {
                "filter": {"id": tool_id},
                "fields": data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Get updated tool
        workflow2 = WorkflowBuilder()
        workflow2.add_node(
            "AgentToolReadNode",
            "read",
            {
                "id": tool_id,
            },
        )
        results2, _ = await self.runtime.execute_workflow_async(
            workflow2.build(), inputs={}
        )
        return results2.get("read")

    async def remove_tool(self, tool_id: str) -> bool:
        """
        Remove a tool.

        Args:
            tool_id: Tool ID

        Returns:
            True if deleted
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentToolDeleteNode",
            "delete",
            {
                "id": tool_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return True

    async def list_tools(self, agent_id: str) -> list:
        """
        List all tools for an agent.

        Args:
            agent_id: Agent ID

        Returns:
            List of tool records
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentToolListNode",
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
        return list_result.get("records", [])

    async def get_tool(self, tool_id: str) -> dict | None:
        """
        Get a tool by ID.

        Args:
            tool_id: Tool ID

        Returns:
            Tool data if found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "AgentToolReadNode",
            "read",
            {
                "id": tool_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("read")

    # ===================
    # Composite Operations
    # ===================

    async def get_with_details(self, agent_id: str) -> dict | None:
        """
        Get an agent with all its contexts and tools.

        Args:
            agent_id: Agent ID

        Returns:
            Agent data with contexts and tools
        """
        agent = await self.get(agent_id)
        if not agent:
            return None

        contexts = await self.list_contexts(agent_id)
        tools = await self.list_tools(agent_id)

        agent["contexts"] = contexts
        agent["tools"] = tools

        return agent
