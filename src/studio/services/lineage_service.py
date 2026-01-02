"""
Lineage Service

Business logic for invocation lineage operations.
Provides CRUD operations, querying, and compliance support.
"""

import json
import uuid
from datetime import UTC, datetime

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

# Import studio.models to ensure DataFlow models and nodes are registered
import studio.models  # noqa: F401


class LineageService:
    """
    Service for managing external agent invocation lineage.

    Provides methods for creating lineage records, updating results,
    querying lineage data, and supporting compliance requirements.
    """

    def __init__(self, runtime=None):
        """Initialize the lineage service."""
        self.runtime = runtime or AsyncLocalRuntime()

    # ===================
    # Lineage Creation
    # ===================

    async def create_lineage_record(
        self,
        request_headers: dict,
        external_agent: dict,
        api_key: dict,
        request_body: dict,
        ip_address: str = "",
        user_agent: str = "",
    ) -> dict:
        """
        Create a lineage record from request headers and context.

        Extracts external user identity, system context, and Kaizen authentication
        from headers and creates a complete lineage record.

        Args:
            request_headers: HTTP request headers (must include X-External-* headers)
            external_agent: External agent being invoked
            api_key: API key used for authentication
            request_body: Request payload
            ip_address: Client IP address
            user_agent: Client user agent

        Returns:
            Created lineage record

        Raises:
            ValueError: If required headers are missing
        """
        # Extract required external identity headers
        external_user_id = request_headers.get("X-External-User-ID")
        external_user_email = request_headers.get("X-External-User-Email")
        external_system = request_headers.get("X-External-System")
        external_session_id = request_headers.get("X-External-Session-ID")

        if not external_user_id:
            raise ValueError("Missing required header: X-External-User-ID")
        if not external_user_email:
            raise ValueError("Missing required header: X-External-User-Email")
        if not external_system:
            raise ValueError("Missing required header: X-External-System")
        if not external_session_id:
            raise ValueError("Missing required header: X-External-Session-ID")

        # Extract optional headers
        external_user_name = request_headers.get("X-External-User-Name")
        external_trace_id = request_headers.get("X-External-Trace-ID")
        external_context_str = request_headers.get("X-External-Context")

        # Parse external context if provided
        external_context = None
        if external_context_str:
            try:
                external_context = json.dumps(json.loads(external_context_str))
            except json.JSONDecodeError:
                external_context = json.dumps({"raw": external_context_str})

        # Generate invocation IDs
        invocation_id = f"inv-{uuid.uuid4().hex[:12]}"
        trace_id = f"otel-trace-{uuid.uuid4().hex[:12]}"
        span_id = f"otel-span-{uuid.uuid4().hex[:12]}"

        now = datetime.now(UTC).isoformat()

        # Sanitize request headers (remove sensitive data)
        sanitized_headers = {
            k: v
            for k, v in request_headers.items()
            if k.lower() not in ["authorization", "x-api-key"]
        }

        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvocationLineageCreateNode",
            "create",
            {
                # Primary key
                "id": invocation_id,
                # Layer 1: External User Identity
                "external_user_id": external_user_id,
                "external_user_email": external_user_email,
                "external_user_name": external_user_name,
                "external_user_role": None,  # Will be extracted from external_context if available
                # Layer 2: External System Identity
                "external_system": external_system,
                "external_session_id": external_session_id,
                "external_trace_id": external_trace_id,
                "external_context": external_context,
                # Layer 3: Kaizen Authentication
                "api_key_id": api_key["id"],
                "api_key_prefix": api_key.get("key_prefix", ""),
                "organization_id": api_key["organization_id"],
                "team_id": api_key.get("team_id"),
                # Layer 4: External Agent
                "external_agent_id": external_agent["id"],
                "external_agent_name": external_agent["name"],
                "external_agent_endpoint": external_agent["webhook_url"],
                "external_agent_version": external_agent.get("version"),
                # Layer 5: Invocation Metadata
                "trace_id": trace_id,
                "span_id": span_id,
                "parent_trace_id": external_trace_id,  # Link to parent if provided
                # Request Context
                "ip_address": ip_address,
                "user_agent": user_agent,
                "request_timestamp": now,
                "request_headers": json.dumps(sanitized_headers),
                "request_body": json.dumps(request_body),
                # Execution Results (initialized as pending)
                "status": "pending",
                "response_timestamp": None,
                "duration_ms": None,
                # Cost Attribution (initialized as None)
                "cost_usd": None,
                "input_tokens": None,
                "output_tokens": None,
                "api_calls_count": None,
                # Error Handling (initialized as None)
                "error_type": None,
                "error_message": None,
                "error_stacktrace": None,
                # Response Data (initialized as None)
                "response_status_code": None,
                "response_headers": None,
                "response_body": None,
                # Governance Decisions (initialized)
                "budget_checked": False,
                "budget_remaining_before": None,
                "budget_remaining_after": None,
                "approval_required": False,
                "approval_status": None,
                "approval_id": None,
                # Timestamps
                "created_at": now,
                "updated_at": now,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # DataFlow nodes return results in {"result": data} format
        create_result = results.get("create", {})
        if isinstance(create_result, dict) and "result" in create_result:
            return create_result["result"]
        return create_result

    # ===================
    # Lineage Update
    # ===================

    async def update_lineage_result(
        self,
        invocation_id: str,
        status: str,
        response: dict | None = None,
        cost: dict | None = None,
        duration_ms: int | None = None,
        error: dict | None = None,
    ) -> dict:
        """
        Update lineage record with execution results.

        Args:
            invocation_id: Invocation ID to update
            status: Execution status (success, failure, timeout, etc.)
            response: Response data (status_code, headers, body)
            cost: Cost attribution (cost_usd, input_tokens, output_tokens, api_calls_count)
            duration_ms: Execution duration in milliseconds
            error: Error details (type, message, stacktrace)

        Returns:
            Updated lineage record
        """
        now = datetime.now(UTC).isoformat()

        # NOTE: Do NOT set updated_at - DataFlow manages it automatically
        updates = {
            "status": status,
            "response_timestamp": now,
        }

        if duration_ms is not None:
            updates["duration_ms"] = duration_ms

        # Add response data
        if response:
            updates["response_status_code"] = response.get("status_code")
            if response.get("headers"):
                updates["response_headers"] = json.dumps(response["headers"])
            if response.get("body"):
                updates["response_body"] = json.dumps(response["body"])

        # Add cost data
        if cost:
            updates["cost_usd"] = cost.get("cost_usd")
            updates["input_tokens"] = cost.get("input_tokens")
            updates["output_tokens"] = cost.get("output_tokens")
            updates["api_calls_count"] = cost.get("api_calls_count")

        # Add error data
        if error:
            updates["error_type"] = error.get("type")
            updates["error_message"] = error.get("message")
            updates["error_stacktrace"] = error.get("stacktrace")

        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvocationLineageUpdateNode",
            "update",
            {"id": invocation_id, **updates},
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # DataFlow nodes return results in {"result": data} format
        update_result = results.get("update", {})
        if isinstance(update_result, dict) and "result" in update_result:
            return update_result["result"]
        return update_result

    # ===================
    # Lineage Retrieval
    # ===================

    async def get_lineage_by_id(self, invocation_id: str) -> dict | None:
        """
        Get a single lineage record by ID.

        Args:
            invocation_id: Invocation ID

        Returns:
            Lineage record or None if not found
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvocationLineageReadNode",
            "read",
            {"id": invocation_id},
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # DataFlow nodes return results in {"result": data} format
        read_result = results.get("read", {})
        if isinstance(read_result, dict) and "result" in read_result:
            return read_result["result"]
        return read_result

    async def list_lineages(
        self,
        filters: dict | None = None,
        page: int = 1,
        limit: int = 100,
    ) -> dict:
        """
        List lineage records with filtering and pagination.

        Args:
            filters: Filter conditions (external_user_id, organization_id, status, etc.)
            page: Page number (1-indexed)
            limit: Page size

        Returns:
            Dictionary with lineages, total, page, limit
        """
        offset = (page - 1) * limit

        # Build filter conditions
        filter_conditions = filters or {}

        workflow = WorkflowBuilder()
        workflow.add_node(
            "InvocationLineageListNode",
            "list",
            {
                "filter": filter_conditions,  # DataFlow expects "filter" as dict
                "limit": limit,
                "offset": offset,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # DataFlow nodes return results in {"result": data} format
        list_result = results.get("list", {})
        if isinstance(list_result, dict) and "result" in list_result:
            list_result = list_result["result"]

        # Handle different result formats
        # DataFlow ListNode returns {"records": [...], "total": N}
        if isinstance(list_result, list):
            lineages = list_result
            total = len(lineages)
        else:
            # Try "records" first (DataFlow standard), then "items" for compatibility
            lineages = (
                list_result.get("records", list_result.get("items", []))
                if isinstance(list_result, dict)
                else []
            )
            total = (
                list_result.get("total", len(lineages))
                if isinstance(list_result, dict)
                else 0
            )

        return {
            "lineages": lineages,
            "total": total,
            "page": page,
            "limit": limit,
        }

    # ===================
    # Lineage Graph
    # ===================

    async def get_lineage_graph(
        self,
        workflow_id: str | None = None,
        external_agent_id: str | None = None,
    ) -> dict:
        """
        Get lineage graph for a workflow or external agent.

        Builds a graph representation showing the chain of invocations.

        Args:
            workflow_id: Optional workflow ID to filter by
            external_agent_id: Optional external agent ID to filter by

        Returns:
            Dictionary with nodes and edges representing the lineage graph
        """
        # Build filter
        filters = {}
        if external_agent_id:
            filters["external_agent_id"] = external_agent_id

        # Get all lineages matching the filter
        result = await self.list_lineages(filters=filters, limit=1000)
        lineages = result["lineages"]

        # Build graph structure
        nodes = []
        edges = []

        for lineage in lineages:
            # Create node for this invocation
            node = {
                "id": lineage["id"],
                "type": "external_agent",
                "label": lineage["external_agent_name"],
                "metadata": {
                    "external_agent_id": lineage["external_agent_id"],
                    "external_user_email": lineage["external_user_email"],
                    "external_system": lineage["external_system"],
                    "status": lineage["status"],
                    "duration_ms": lineage.get("duration_ms"),
                    "cost_usd": lineage.get("cost_usd"),
                    "timestamp": lineage["request_timestamp"],
                },
            }
            nodes.append(node)

            # Create edge if there's a parent
            if lineage.get("parent_trace_id"):
                edge = {
                    "source": lineage["parent_trace_id"],
                    "target": lineage["id"],
                    "label": "invokes",
                }
                edges.append(edge)

        return {
            "nodes": nodes,
            "edges": edges,
        }

    # ===================
    # Compliance Support
    # ===================

    async def export_lineage(
        self,
        filters: dict | None = None,
        format: str = "json",
    ) -> str:
        """
        Export lineage records for compliance (GDPR, SOC2, HIPAA).

        Args:
            filters: Filter conditions
            format: Export format (json or csv)

        Returns:
            Exported data as string
        """
        # Get all matching lineages
        result = await self.list_lineages(filters=filters, limit=10000)
        lineages = result["lineages"]

        if format == "json":
            return json.dumps(lineages, indent=2)
        elif format == "csv":
            # Simple CSV export (in production, use a CSV library)
            if not lineages:
                return ""

            # Get all unique keys
            keys = set()
            for lineage in lineages:
                keys.update(lineage.keys())
            keys = sorted(keys)

            # Build CSV
            lines = [",".join(keys)]
            for lineage in lineages:
                values = [str(lineage.get(k, "")) for k in keys]
                lines.append(",".join(f'"{v}"' for v in values))

            return "\n".join(lines)
        else:
            raise ValueError(f"Unsupported export format: {format}")

    async def redact_user_data(self, user_email: str) -> int:
        """
        Redact user data for GDPR compliance (Right to Erasure).

        Removes PII while preserving audit trail for compliance.

        Args:
            user_email: Email of user to redact

        Returns:
            Number of records redacted
        """
        # Get all lineages for this user
        result = await self.list_lineages(
            filters={"external_user_email": user_email},
            limit=10000,
        )
        lineages = result["lineages"]

        redacted_count = 0

        # Redact each lineage
        for lineage in lineages:
            redacted_id = f"[REDACTED-{uuid.uuid4().hex[:8]}]"

            await self.update_lineage_result(
                invocation_id=lineage["id"],
                status=lineage["status"],  # Keep status for audit
                response={
                    "status_code": lineage.get("response_status_code"),
                    "headers": None,  # Redact
                    "body": None,  # Redact
                },
            )

            # Also update PII fields directly
            workflow = WorkflowBuilder()
            workflow.add_node(
                "InvocationLineageUpdateNode",
                "update",
                {
                    "id": lineage["id"],
                    "external_user_email": "[REDACTED]",
                    "external_user_name": "[REDACTED]",
                    "external_user_id": redacted_id,
                    "request_body": "[REDACTED]",
                    "response_body": "[REDACTED]",
                    "updated_at": datetime.now(UTC).isoformat(),
                },
            )

            await self.runtime.execute_workflow_async(workflow.build(), inputs={})

            redacted_count += 1

        return redacted_count
