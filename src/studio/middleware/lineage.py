"""
Lineage Middleware

Extracts external identity headers and creates lineage context for requests.
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


class LineageMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract X-External-* headers and create lineage context.

    This middleware intercepts requests to external agent invocation endpoints
    and extracts external identity information from headers for lineage tracking.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """
        Extract external headers and add to request state.

        Args:
            request: FastAPI request
            call_next: Next middleware in chain

        Returns:
            Response from downstream handler
        """
        # Extract external identity headers
        external_headers = {}

        # Required headers
        if "x-external-user-id" in request.headers:
            external_headers["X-External-User-ID"] = request.headers[
                "x-external-user-id"
            ]

        if "x-external-user-email" in request.headers:
            external_headers["X-External-User-Email"] = request.headers[
                "x-external-user-email"
            ]

        if "x-external-system" in request.headers:
            external_headers["X-External-System"] = request.headers["x-external-system"]

        if "x-external-session-id" in request.headers:
            external_headers["X-External-Session-ID"] = request.headers[
                "x-external-session-id"
            ]

        # Optional headers
        if "x-external-user-name" in request.headers:
            external_headers["X-External-User-Name"] = request.headers[
                "x-external-user-name"
            ]

        if "x-external-trace-id" in request.headers:
            external_headers["X-External-Trace-ID"] = request.headers[
                "x-external-trace-id"
            ]

        if "x-external-context" in request.headers:
            external_headers["X-External-Context"] = request.headers[
                "x-external-context"
            ]

        # Store in request state
        request.state.external_headers = external_headers

        # Continue to next handler
        response = await call_next(request)

        return response
