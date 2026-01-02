"""
Audit Middleware

Automatically logs API requests for audit trail.
"""

import logging
import time
from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from studio.config import get_settings
from studio.services.audit_service import AuditService

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware to automatically log API requests for audit trail.

    Captures POST, PUT, PATCH, DELETE requests and logs them
    with user context, resource information, and outcome.
    """

    # HTTP methods to audit
    AUDITABLE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    # Paths to exclude from auditing
    EXCLUDED_PATHS = {
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/",
    }

    # Map HTTP methods to actions
    METHOD_ACTION_MAP = {
        "POST": "create",
        "PUT": "update",
        "PATCH": "update",
        "DELETE": "delete",
    }

    def __init__(self, app, audit_enabled: bool = True):
        super().__init__(app)
        self.audit_service = AuditService()
        self.audit_enabled = audit_enabled

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and log audit entry if applicable.

        Args:
            request: Incoming request
            call_next: Next middleware/endpoint

        Returns:
            Response from endpoint
        """
        settings = get_settings()

        # Skip if audit is disabled
        if not self.audit_enabled:
            return await call_next(request)

        # Skip non-auditable methods
        if request.method not in self.AUDITABLE_METHODS:
            return await call_next(request)

        # Skip excluded paths
        path = request.url.path
        if path in self.EXCLUDED_PATHS:
            return await call_next(request)

        # Skip if path starts with excluded prefixes
        if path.startswith("/docs") or path.startswith("/redoc"):
            return await call_next(request)

        # Extract request details
        start_time = time.time()
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")

        # Call the endpoint
        response = await call_next(request)

        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000

        # Try to log audit entry
        try:
            await self._log_audit_entry(
                request=request,
                response=response,
                ip_address=ip_address,
                user_agent=user_agent,
                duration_ms=duration_ms,
            )
        except Exception as e:
            # Don't fail the request if audit logging fails
            logger.error(f"Failed to log audit entry: {e}")

        return response

    async def _log_audit_entry(
        self,
        request: Request,
        response: Response,
        ip_address: str,
        user_agent: str,
        duration_ms: float,
    ):
        """
        Log an audit entry for the request.

        Args:
            request: The request object
            response: The response object
            ip_address: Client IP address
            user_agent: Client user agent
            duration_ms: Request duration in milliseconds
        """
        # Extract user context from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        organization_id = getattr(request.state, "organization_id", None)

        # Skip if no user context (unauthenticated requests)
        if not user_id or not organization_id:
            return

        # Parse resource info from path
        resource_type, resource_id = self._parse_resource_from_path(request.url.path)

        # Determine action
        action = self.METHOD_ACTION_MAP.get(request.method, "unknown")

        # Determine status
        status = "success" if response.status_code < 400 else "failure"
        error_message = None
        if status == "failure":
            error_message = f"HTTP {response.status_code}"

        # Build details
        details = {
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "duration_ms": round(duration_ms, 2),
            "status_code": response.status_code,
        }

        # Log the audit entry
        await self.audit_service.log(
            organization_id=organization_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            error_message=error_message,
        )

    def _get_client_ip(self, request: Request) -> str:
        """
        Get the client IP address from request.

        Handles X-Forwarded-For header for proxied requests.

        Args:
            request: The request object

        Returns:
            Client IP address
        """
        # Check for forwarded header (behind proxy/load balancer)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()

        # Fall back to direct client
        if request.client:
            return request.client.host

        return "unknown"

    def _parse_resource_from_path(self, path: str) -> tuple:
        """
        Parse resource type and ID from URL path.

        Args:
            path: URL path (e.g., /api/v1/agents/123)

        Returns:
            Tuple of (resource_type, resource_id)
        """
        # Remove API prefix
        parts = path.strip("/").split("/")

        # Skip 'api' and version parts
        if len(parts) >= 2 and parts[0] == "api":
            parts = parts[2:]  # Skip 'api/v1'

        if not parts:
            return ("unknown", None)

        # First part is resource type
        resource_type = parts[0]

        # Second part (if exists) is resource ID
        resource_id = parts[1] if len(parts) > 1 else None

        return (resource_type, resource_id)
