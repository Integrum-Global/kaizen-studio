"""
CSRF Protection Middleware

Provides defense-in-depth CSRF protection for state-changing requests.

Note: Since this API uses JWT tokens in Authorization headers (not cookies),
CSRF attacks are not the primary concern. This middleware adds an extra
layer of protection by validating Origin/Referer headers.
"""

import logging
from urllib.parse import urlparse

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from studio.config import get_settings, is_production

logger = logging.getLogger(__name__)

# HTTP methods that modify state
STATE_CHANGING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Paths that are exempt from CSRF validation
CSRF_EXEMPT_PATHS = {
    "/",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/metrics",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
    "/api/v1/auth/callback",  # OAuth callbacks
    "/api/v1/auth/sso/callback",  # SSO callbacks
}


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection middleware.

    Validates Origin and Referer headers for state-changing requests.
    Provides defense-in-depth protection alongside JWT authentication.
    """

    def __init__(self, app, allowed_origins: list[str] | None = None):
        """
        Initialize CSRF middleware.

        Args:
            app: FastAPI application
            allowed_origins: List of allowed origins. If None, uses settings.
        """
        super().__init__(app)
        settings = get_settings()
        self.allowed_origins = allowed_origins or settings.cors_origins_list
        self.enabled = is_production()  # Only enforce in production

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process request and validate CSRF headers.

        Args:
            request: Incoming request
            call_next: Next middleware/handler

        Returns:
            Response from next handler or 403 if CSRF validation fails
        """
        # Skip validation in non-production environments
        if not self.enabled:
            return await call_next(request)

        # Skip for non-state-changing methods
        if request.method not in STATE_CHANGING_METHODS:
            return await call_next(request)

        # Skip for exempt paths
        if request.url.path in CSRF_EXEMPT_PATHS:
            return await call_next(request)

        # Skip for API key authenticated requests
        if request.headers.get("X-API-Key"):
            return await call_next(request)

        # Validate Origin or Referer header
        origin = request.headers.get("Origin")
        referer = request.headers.get("Referer")

        if origin:
            if not self._is_allowed_origin(origin):
                logger.warning(f"CSRF blocked: invalid Origin header: {origin}")
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": "CSRF validation failed: invalid origin",
                        "code": "CSRF_INVALID_ORIGIN",
                    },
                )
        elif referer:
            referer_origin = self._extract_origin(referer)
            if referer_origin and not self._is_allowed_origin(referer_origin):
                logger.warning(f"CSRF blocked: invalid Referer header: {referer}")
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": "CSRF validation failed: invalid referer",
                        "code": "CSRF_INVALID_REFERER",
                    },
                )
        else:
            # No Origin or Referer header - might be same-origin or API client
            # Allow if using Authorization header (JWT authentication)
            if not request.headers.get("Authorization"):
                logger.warning("CSRF warning: no Origin/Referer and no Authorization")
                # Don't block - might be legitimate API client
                pass

        return await call_next(request)

    def _is_allowed_origin(self, origin: str) -> bool:
        """
        Check if origin is in allowed list.

        Args:
            origin: Origin URL

        Returns:
            True if allowed
        """
        # Normalize origin (remove trailing slash)
        origin = origin.rstrip("/")

        # Check exact match
        if origin in self.allowed_origins:
            return True

        # Check with trailing slash removed from allowed origins
        for allowed in self.allowed_origins:
            if allowed.rstrip("/") == origin:
                return True

        return False

    def _extract_origin(self, url: str) -> str | None:
        """
        Extract origin from full URL.

        Args:
            url: Full URL (e.g., from Referer header)

        Returns:
            Origin string (scheme://host:port) or None
        """
        try:
            parsed = urlparse(url)
            if parsed.scheme and parsed.netloc:
                port = f":{parsed.port}" if parsed.port else ""
                return f"{parsed.scheme}://{parsed.hostname}{port}"
            return None
        except Exception:
            return None
