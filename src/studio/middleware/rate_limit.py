"""
Rate Limit Middleware

Middleware for enforcing rate limits on API requests.
"""

import logging
import os

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from studio.services.rate_limit_service import RateLimitService

logger = logging.getLogger(__name__)

# Check if we're in test mode (DATABASE_URL contains _test or pytest is running)
_IS_TEST_MODE = "kaizen_studio_test" in os.environ.get(
    "DATABASE_URL", ""
) or "pytest" in os.environ.get("_", "")


# Auth endpoints that need stricter rate limiting
AUTH_ENDPOINTS = {
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/refresh",
}

# Rate limits for auth endpoints (per minute per IP)
AUTH_RATE_LIMITS = {
    "/api/v1/auth/login": 10,  # 10 login attempts per minute
    "/api/v1/auth/register": 5,  # 5 registrations per minute
    "/api/v1/auth/forgot-password": 3,  # 3 password reset requests per minute
    "/api/v1/auth/reset-password": 5,  # 5 password resets per minute
    "/api/v1/auth/refresh": 30,  # 30 token refreshes per minute
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce rate limits on API requests.

    Adds rate limit headers to all responses:
    - X-RateLimit-Limit: Maximum requests allowed
    - X-RateLimit-Remaining: Requests remaining in window
    - X-RateLimit-Reset: Seconds until window resets

    Features:
    - API key based rate limiting for authenticated requests
    - User ID based rate limiting for JWT authenticated requests
    - IP-based rate limiting for auth endpoints (to prevent brute force)
    """

    def __init__(self, app, exclude_paths: list | None = None):
        """
        Initialize the rate limit middleware.

        Args:
            app: FastAPI application
            exclude_paths: List of paths to exclude from rate limiting
        """
        super().__init__(app)
        self.rate_limit_service = RateLimitService()
        self.exclude_paths = exclude_paths or [
            "/",
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/metrics",
        ]

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process the request and enforce rate limits.

        Args:
            request: Incoming request
            call_next: Next middleware/handler

        Returns:
            Response with rate limit headers
        """
        # Skip rate limiting for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)

        # Skip auth endpoint rate limiting in test mode to prevent test flakiness
        if _IS_TEST_MODE and request.url.path in AUTH_ENDPOINTS:
            return await call_next(request)

        # Check if this is an API key authenticated request
        api_key = getattr(request.state, "api_key", None)

        if api_key:
            key_id = api_key["id"]
            limit = api_key["rate_limit"]

            # Check rate limit
            allowed, remaining = await self.rate_limit_service.check_rate_limit(
                key_id, limit
            )

            if not allowed:
                reset_time = await self.rate_limit_service.get_reset_time()
                response = JSONResponse(
                    status_code=429,
                    content={
                        "error": "rate_limit_exceeded",
                        "message": "Too many requests. Please try again later.",
                        "retry_after": reset_time,
                    },
                )
                response.headers["X-RateLimit-Limit"] = str(limit)
                response.headers["X-RateLimit-Remaining"] = "0"
                response.headers["X-RateLimit-Reset"] = str(reset_time)
                response.headers["Retry-After"] = str(reset_time)
                return response

            # Increment the counter
            await self.rate_limit_service.increment(key_id)

            # Get updated remaining count
            reset_time = await self.rate_limit_service.get_reset_time()

            # Process the request
            response = await call_next(request)

            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(max(0, remaining - 1))
            response.headers["X-RateLimit-Reset"] = str(reset_time)

            return response

        # For non-API key requests, check if user-based rate limiting is needed
        user_id = getattr(request.state, "user_id", None)

        if user_id:
            # Default rate limit for authenticated users
            default_limit = 1000  # requests per minute

            # Check rate limit
            allowed, remaining = await self.rate_limit_service.check_rate_limit(
                user_id, default_limit
            )

            if not allowed:
                reset_time = await self.rate_limit_service.get_reset_time()
                response = JSONResponse(
                    status_code=429,
                    content={
                        "error": "rate_limit_exceeded",
                        "message": "Too many requests. Please try again later.",
                        "retry_after": reset_time,
                    },
                )
                response.headers["X-RateLimit-Limit"] = str(default_limit)
                response.headers["X-RateLimit-Remaining"] = "0"
                response.headers["X-RateLimit-Reset"] = str(reset_time)
                response.headers["Retry-After"] = str(reset_time)
                return response

            # Increment the counter
            await self.rate_limit_service.increment(user_id)

            # Get updated remaining count
            reset_time = await self.rate_limit_service.get_reset_time()

            # Process the request
            response = await call_next(request)

            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(default_limit)
            response.headers["X-RateLimit-Remaining"] = str(max(0, remaining - 1))
            response.headers["X-RateLimit-Reset"] = str(reset_time)

            return response

        # IP-based rate limiting for auth endpoints (to prevent brute force attacks)
        if request.url.path in AUTH_ENDPOINTS:
            # Get client IP
            client_ip = request.client.host if request.client else "unknown"

            # Use IP + path as the rate limit key
            rate_key = f"auth:{client_ip}:{request.url.path}"

            # Get rate limit for this endpoint
            limit = AUTH_RATE_LIMITS.get(request.url.path, 10)

            # Check rate limit
            allowed, remaining = await self.rate_limit_service.check_rate_limit(
                rate_key, limit
            )

            if not allowed:
                logger.warning(
                    f"Auth rate limit exceeded: IP={client_ip}, path={request.url.path}"
                )
                reset_time = await self.rate_limit_service.get_reset_time()
                response = JSONResponse(
                    status_code=429,
                    content={
                        "error": "rate_limit_exceeded",
                        "message": "Too many attempts. Please try again later.",
                        "retry_after": reset_time,
                    },
                )
                response.headers["X-RateLimit-Limit"] = str(limit)
                response.headers["X-RateLimit-Remaining"] = "0"
                response.headers["X-RateLimit-Reset"] = str(reset_time)
                response.headers["Retry-After"] = str(reset_time)
                return response

            # Increment the counter
            await self.rate_limit_service.increment(rate_key)

            # Get updated remaining count
            reset_time = await self.rate_limit_service.get_reset_time()

            # Process the request
            response = await call_next(request)

            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(max(0, remaining - 1))
            response.headers["X-RateLimit-Reset"] = str(reset_time)

            return response

        # No rate limiting for other unauthenticated requests
        return await call_next(request)
