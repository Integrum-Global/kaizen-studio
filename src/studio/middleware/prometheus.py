"""
Prometheus Metrics Integration

Exposes application metrics for Prometheus scraping.
"""

import time
from collections.abc import Callable

from fastapi import Request, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)
from starlette.middleware.base import BaseHTTPMiddleware

# Counters
api_requests_total = Counter(
    "api_requests_total", "Total API requests", ["method", "endpoint", "status"]
)

executions_total = Counter(
    "executions_total", "Total agent executions", ["agent_id", "status"]
)

auth_attempts_total = Counter(
    "auth_attempts_total", "Total authentication attempts", ["status"]
)

deployments_total = Counter(
    "deployments_total", "Total deployment operations", ["operation", "status"]
)


# Histograms
request_latency = Histogram(
    "request_latency_seconds",
    "Request latency in seconds",
    ["method", "endpoint"],
    buckets=[
        0.005,
        0.01,
        0.025,
        0.05,
        0.075,
        0.1,
        0.25,
        0.5,
        0.75,
        1.0,
        2.5,
        5.0,
        7.5,
        10.0,
    ],
)

execution_latency = Histogram(
    "execution_latency_seconds",
    "Agent execution latency in seconds",
    ["agent_id"],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0],
)

database_query_latency = Histogram(
    "database_query_latency_seconds",
    "Database query latency in seconds",
    ["operation"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
)


# Gauges
active_deployments = Gauge(
    "active_deployments", "Number of active deployments", ["gateway_id"]
)

connected_gateways = Gauge("connected_gateways", "Number of connected gateways")

active_users = Gauge("active_users", "Number of active users")

pending_invitations = Gauge("pending_invitations", "Number of pending invitations")


class PrometheusMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track request metrics for Prometheus.

    Records request count, latency, and status codes.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and record metrics.

        Args:
            request: The incoming request
            call_next: Next middleware/route handler

        Returns:
            The response
        """
        # Skip metrics endpoint
        if request.url.path == "/metrics":
            return await call_next(request)

        # Record start time
        start_time = time.time()

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Get endpoint path (normalize to avoid high cardinality)
        endpoint = self._normalize_path(request.url.path)

        # Record metrics
        api_requests_total.labels(
            method=request.method, endpoint=endpoint, status=response.status_code
        ).inc()

        request_latency.labels(method=request.method, endpoint=endpoint).observe(
            duration
        )

        return response

    def _normalize_path(self, path: str) -> str:
        """
        Normalize path to reduce cardinality.

        Replaces UUIDs and IDs with placeholders.

        Args:
            path: Original path

        Returns:
            Normalized path
        """
        import re

        # Replace UUIDs
        path = re.sub(
            r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
            "{id}",
            path,
        )

        # Replace numeric IDs
        path = re.sub(r"/\d+", "/{id}", path)

        return path


def get_metrics_endpoint():
    """
    Generate Prometheus metrics output.

    Returns:
        Prometheus metrics in text format
    """
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Helper functions for recording metrics


def record_execution(agent_id: str, status: str, latency_seconds: float):
    """
    Record an agent execution metric.

    Args:
        agent_id: Agent ID
        status: Execution status (success, failure, timeout)
        latency_seconds: Execution duration in seconds
    """
    executions_total.labels(agent_id=agent_id, status=status).inc()
    execution_latency.labels(agent_id=agent_id).observe(latency_seconds)


def record_auth_attempt(status: str):
    """
    Record an authentication attempt.

    Args:
        status: Auth status (success, failure)
    """
    auth_attempts_total.labels(status=status).inc()


def record_deployment(operation: str, status: str):
    """
    Record a deployment operation.

    Args:
        operation: Operation type (create, start, stop, delete)
        status: Operation status (success, failure)
    """
    deployments_total.labels(operation=operation, status=status).inc()


def record_database_query(operation: str, duration_seconds: float):
    """
    Record a database query.

    Args:
        operation: Query operation type
        duration_seconds: Query duration in seconds
    """
    database_query_latency.labels(operation=operation).observe(duration_seconds)


def set_active_deployments(gateway_id: str, count: int):
    """
    Set the number of active deployments for a gateway.

    Args:
        gateway_id: Gateway ID
        count: Number of active deployments
    """
    active_deployments.labels(gateway_id=gateway_id).set(count)


def set_connected_gateways(count: int):
    """
    Set the number of connected gateways.

    Args:
        count: Number of connected gateways
    """
    connected_gateways.set(count)


def set_active_users(count: int):
    """
    Set the number of active users.

    Args:
        count: Number of active users
    """
    active_users.set(count)


def set_pending_invitations(count: int):
    """
    Set the number of pending invitations.

    Args:
        count: Number of pending invitations
    """
    pending_invitations.set(count)
