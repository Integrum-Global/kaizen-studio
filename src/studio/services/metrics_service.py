"""
Metrics Service

Manages execution metrics recording, aggregation, and querying.
"""

import uuid
from datetime import UTC, datetime, timedelta

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

from studio.config import get_settings


class MetricsService:
    """
    Metrics service for execution metrics management.

    Features:
    - Record execution metrics
    - Aggregate metrics by time periods
    - Get summary statistics
    - Time series data for dashboards
    """

    def __init__(self, runtime=None):
        """Initialize the metrics service."""
        self.settings = get_settings()
        self.runtime = runtime or AsyncLocalRuntime()

    def _parse_iso_date(self, date_str: str) -> datetime:
        """
        Parse ISO 8601 date string to timezone-aware datetime object.

        Handles various formats including 'Z' suffix and timezone offsets.
        Always returns UTC timezone-aware datetime for consistent comparisons.

        Args:
            date_str: ISO 8601 formatted date string

        Returns:
            Parsed datetime object (always timezone-aware in UTC)
        """
        if not date_str:
            raise ValueError("Date string cannot be empty")

        # Normalize the date string
        normalized = date_str
        if normalized.endswith("Z"):
            normalized = normalized[:-1] + "+00:00"

        try:
            parsed = datetime.fromisoformat(normalized)
            # Ensure the datetime is timezone-aware (convert naive to UTC)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=UTC)
            return parsed
        except ValueError as e:
            raise ValueError(f"Invalid date format: {date_str}") from e

    async def record(self, metric: dict) -> dict:
        """
        Record an execution metric.

        Args:
            metric: Metric data

        Returns:
            Created metric data
        """
        now = datetime.now(UTC).isoformat()
        metric_id = str(uuid.uuid4())

        metric_data = {
            "id": metric_id,
            "organization_id": metric["organization_id"],
            "deployment_id": metric["deployment_id"],
            "agent_id": metric["agent_id"],
            "execution_id": metric.get("execution_id", str(uuid.uuid4())),
            "status": metric["status"],
            "latency_ms": metric.get("latency_ms", 0),
            "input_tokens": metric.get("input_tokens", 0),
            "output_tokens": metric.get("output_tokens", 0),
            "total_tokens": metric.get("total_tokens", 0),
            "cost_usd": metric.get("cost_usd", 0.0),
            "error_type": metric.get("error_type"),
            "error_message": metric.get("error_message"),
            "created_at": now,
        }

        workflow = WorkflowBuilder()
        workflow.add_node("ExecutionMetricCreateNode", "create_metric", metric_data)

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Return the created metric from results, fallback to metric_data if not found
        created_metric = results.get("create_metric", {}).get("record", metric_data)
        return created_metric if created_metric else metric_data

    async def get_summary(
        self,
        organization_id: str,
        deployment_id: str | None = None,
        agent_id: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> dict:
        """
        Get aggregated metrics summary.

        Args:
            organization_id: Organization ID
            deployment_id: Optional deployment filter
            agent_id: Optional agent filter
            start_date: Optional start date (ISO format)
            end_date: Optional end date (ISO format)

        Returns:
            Summary with avg latency, total tokens, error rate, cost
        """
        # Get all metrics matching filters
        metrics = await self.list(
            organization_id=organization_id,
            deployment_id=deployment_id,
            agent_id=agent_id,
            limit=10000,  # Get all for aggregation
        )

        # Filter by date range if specified
        if start_date:
            start_dt = self._parse_iso_date(start_date)
            metrics = [
                m for m in metrics if self._parse_iso_date(m["created_at"]) >= start_dt
            ]

        if end_date:
            end_dt = self._parse_iso_date(end_date)
            metrics = [
                m for m in metrics if self._parse_iso_date(m["created_at"]) <= end_dt
            ]

        if not metrics:
            return {
                "total_executions": 0,
                "avg_latency_ms": 0,
                "total_tokens": 0,
                "total_cost_usd": 0.0,
                "error_rate": 0.0,
                "success_count": 0,
                "failure_count": 0,
            }

        total_executions = len(metrics)
        total_latency = sum(m.get("latency_ms", 0) for m in metrics)
        total_tokens = sum(m.get("total_tokens", 0) for m in metrics)
        total_cost = sum(m.get("cost_usd", 0.0) for m in metrics)

        success_count = sum(1 for m in metrics if m.get("status") == "success")
        failure_count = total_executions - success_count

        return {
            "total_executions": total_executions,
            "avg_latency_ms": (
                total_latency / total_executions if total_executions > 0 else 0
            ),
            "total_tokens": total_tokens,
            "total_cost_usd": round(total_cost, 4),
            "error_rate": (
                round(failure_count / total_executions * 100, 2)
                if total_executions > 0
                else 0.0
            ),
            "success_count": success_count,
            "failure_count": failure_count,
        }

    async def get_timeseries(
        self,
        organization_id: str,
        metric: str,
        interval: str,
        start_date: str,
        end_date: str,
    ) -> list:
        """
        Get time-bucketed metrics data.

        Args:
            organization_id: Organization ID
            metric: Metric type (latency, tokens, errors, cost)
            interval: Time interval (hour, day, week)
            start_date: Start date (ISO format)
            end_date: End date (ISO format)

        Returns:
            List of time-bucketed data points
        """
        # Get all metrics in range
        metrics = await self.list(organization_id=organization_id, limit=10000)

        start_dt = self._parse_iso_date(start_date)
        end_dt = self._parse_iso_date(end_date)

        # Filter by date range
        metrics = [
            m
            for m in metrics
            if start_dt <= self._parse_iso_date(m["created_at"]) <= end_dt
        ]

        # Determine bucket size
        if interval == "hour":
            bucket_delta = timedelta(hours=1)
        elif interval == "week":
            bucket_delta = timedelta(weeks=1)
        else:  # day
            bucket_delta = timedelta(days=1)

        # Create time buckets
        buckets = {}
        current = start_dt
        while current <= end_dt:
            bucket_key = current.isoformat()
            buckets[bucket_key] = []
            current += bucket_delta

        # Group metrics into buckets
        for m in metrics:
            m_dt = self._parse_iso_date(m["created_at"])
            # Find the appropriate bucket
            for bucket_key in buckets:
                bucket_dt = self._parse_iso_date(bucket_key)
                if bucket_dt <= m_dt < bucket_dt + bucket_delta:
                    buckets[bucket_key].append(m)
                    break

        # Aggregate each bucket
        result = []
        for bucket_key, bucket_metrics in buckets.items():
            if metric == "latency":
                value = (
                    sum(m.get("latency_ms", 0) for m in bucket_metrics)
                    / len(bucket_metrics)
                    if bucket_metrics
                    else 0
                )
            elif metric == "tokens":
                value = sum(m.get("total_tokens", 0) for m in bucket_metrics)
            elif metric == "errors":
                value = sum(1 for m in bucket_metrics if m.get("status") != "success")
            elif metric == "cost":
                value = sum(m.get("cost_usd", 0.0) for m in bucket_metrics)
            else:
                value = len(bucket_metrics)  # count

            result.append(
                {
                    "timestamp": bucket_key,
                    "value": round(value, 4) if isinstance(value, float) else value,
                    "count": len(bucket_metrics),
                }
            )

        return result

    async def list(
        self,
        organization_id: str,
        deployment_id: str | None = None,
        agent_id: str | None = None,
        status: str | None = None,
        limit: int = 100,
    ) -> list:
        """
        List execution metrics with filters.

        Args:
            organization_id: Organization ID
            deployment_id: Optional deployment filter
            agent_id: Optional agent filter
            status: Optional status filter
            limit: Maximum results

        Returns:
            List of execution metrics
        """
        filter_data = {"organization_id": organization_id}
        if deployment_id:
            filter_data["deployment_id"] = deployment_id
        if agent_id:
            filter_data["agent_id"] = agent_id
        if status:
            filter_data["status"] = status

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExecutionMetricListNode",
            "list_metrics",
            {
                "filter": filter_data,
                "limit": limit,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )
        return results.get("list_metrics", {}).get("records", [])

    async def get_top_errors(self, organization_id: str, limit: int = 10) -> list:
        """
        Get top errors by frequency.

        Args:
            organization_id: Organization ID
            limit: Maximum results

        Returns:
            List of top errors with counts
        """
        # Get all failed metrics
        metrics = await self.list(
            organization_id=organization_id, status="failure", limit=10000
        )

        # Group by error type
        error_counts = {}
        for m in metrics:
            error_type = m.get("error_type") or "Unknown"
            if error_type not in error_counts:
                error_counts[error_type] = {
                    "error_type": error_type,
                    "count": 0,
                    "last_message": None,
                    "last_occurred": None,
                }
            error_counts[error_type]["count"] += 1
            error_counts[error_type]["last_message"] = m.get("error_message")
            error_counts[error_type]["last_occurred"] = m.get("created_at")

        # Sort by count and return top N
        sorted_errors = sorted(
            error_counts.values(), key=lambda x: x["count"], reverse=True
        )

        return sorted_errors[:limit]

    async def get_dashboard(self, organization_id: str) -> dict:
        """
        Get dashboard metrics for the last 24 hours.

        Args:
            organization_id: Organization ID

        Returns:
            Dashboard data with key metrics
        """
        now = datetime.now(UTC)
        start_24h = (now - timedelta(hours=24)).isoformat()
        end_now = now.isoformat()

        # Get 24h summary
        summary = await self.get_summary(
            organization_id=organization_id, start_date=start_24h, end_date=end_now
        )

        # Get top errors
        top_errors = await self.get_top_errors(organization_id=organization_id, limit=5)

        # Get top agents by usage
        all_metrics = await self.list(organization_id=organization_id, limit=10000)

        # Filter to 24h
        start_dt = self._parse_iso_date(start_24h)
        recent_metrics = [
            m for m in all_metrics if self._parse_iso_date(m["created_at"]) >= start_dt
        ]

        # Group by agent
        agent_usage = {}
        for m in recent_metrics:
            agent_id = m.get("agent_id")
            if agent_id not in agent_usage:
                agent_usage[agent_id] = {
                    "agent_id": agent_id,
                    "execution_count": 0,
                    "total_tokens": 0,
                    "total_cost": 0.0,
                }
            agent_usage[agent_id]["execution_count"] += 1
            agent_usage[agent_id]["total_tokens"] += m.get("total_tokens", 0)
            agent_usage[agent_id]["total_cost"] += m.get("cost_usd", 0.0)

        # Sort by execution count
        top_agents = sorted(
            agent_usage.values(), key=lambda x: x["execution_count"], reverse=True
        )[:5]

        return {
            "period": "24h",
            "summary": summary,
            "top_errors": top_errors,
            "top_agents": top_agents,
        }

    async def get_deployment_metrics(
        self, deployment_id: str, organization_id: str
    ) -> dict:
        """
        Get metrics for a specific deployment.

        Args:
            deployment_id: Deployment ID
            organization_id: Organization ID

        Returns:
            Deployment metrics summary
        """
        return await self.get_summary(
            organization_id=organization_id, deployment_id=deployment_id
        )

    async def get_agent_metrics(self, agent_id: str, organization_id: str) -> dict:
        """
        Get metrics for a specific agent.

        Args:
            agent_id: Agent ID
            organization_id: Organization ID

        Returns:
            Agent metrics summary
        """
        return await self.get_summary(
            organization_id=organization_id, agent_id=agent_id
        )
