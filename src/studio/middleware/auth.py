"""
Authentication Middleware

Middleware for processing authentication tokens and adding user context.
"""

import logging

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from studio.config import is_production
from studio.services.api_key_service import APIKeyService
from studio.services.auth_service import AuthService

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to process authentication tokens.

    Extracts and validates JWT tokens from Authorization header,
    adding user context to the request state.
    """

    def __init__(self, app, exclude_paths: list | None = None):
        """
        Initialize the auth middleware.

        Args:
            app: FastAPI application
            exclude_paths: List of paths to exclude from auth processing
        """
        super().__init__(app)
        self.auth_service = AuthService()
        self.api_key_service = APIKeyService()
        self.exclude_paths = exclude_paths or [
            "/",
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/metrics",
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
        ]

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process the request and add user context if authenticated.

        Args:
            request: Incoming request
            call_next: Next middleware/handler

        Returns:
            Response from the next handler
        """
        # Skip auth processing for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)

        # Initialize state
        request.state.user_id = None
        request.state.org_id = None
        request.state.role = None
        request.state.api_key = None

        # Check for test headers (x-user-id, x-org-id) - TESTING/DEVELOPMENT ONLY
        # This allows integration/E2E tests to set user context directly
        # CRITICAL: Only allowed in non-production environments
        if not is_production():
            x_user_id = request.headers.get("x-user-id")
            x_org_id = request.headers.get("x-org-id")
            if x_user_id:
                logger.debug(
                    f"Test auth bypass: user_id={x_user_id}, org_id={x_org_id}"
                )
                request.state.user_id = x_user_id
                request.state.org_id = x_org_id
                request.state.role = request.headers.get("x-role", "org_owner")
                response = await call_next(request)
                return response

        # Check for API key authentication first
        # Supports: X-API-Key header or Bearer token starting with sk_live_
        api_key_header = request.headers.get("X-API-Key")
        auth_header = request.headers.get("Authorization")

        # Check X-API-Key header
        if api_key_header and api_key_header.startswith("sk_live_"):
            api_key = await self.api_key_service.validate(api_key_header)
            if api_key:
                request.state.api_key = api_key
                request.state.org_id = api_key["organization_id"]
                # Update last used timestamp
                await self.api_key_service.update_last_used(api_key["id"])
            # API key auth - don't fall through to JWT
            response = await call_next(request)
            return response

        # Check Bearer token for API key (sk_live_) or JWT
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]

            # Check if it's an API key
            if token.startswith("sk_live_"):
                api_key = await self.api_key_service.validate(token)
                if api_key:
                    request.state.api_key = api_key
                    request.state.org_id = api_key["organization_id"]
                    # Update last used timestamp
                    await self.api_key_service.update_last_used(api_key["id"])
            else:
                # Verify JWT token and add user context
                payload = self.auth_service.verify_token(token)
                if payload:
                    user_id = payload.get("sub")
                    jwt_role = payload.get("role")
                    jwt_org_id = payload.get("org_id")

                    # SECURITY FIX (HIGH-8): Check for stale JWT role
                    # When user role changes, existing JWTs still have old role
                    # Validate against database to prevent privilege escalation
                    current_user = await self.auth_service.get_user_by_id(user_id)
                    if current_user:
                        # Check if user is still in the claimed organization
                        # and has the claimed role
                        db_org_id = current_user.get("organization_id")
                        db_role = current_user.get("role")

                        # If org or role changed, use database values
                        # This prevents using stale elevated privileges
                        if db_org_id != jwt_org_id or db_role != jwt_role:
                            logger.warning(
                                f"Stale JWT detected for user {user_id}: "
                                f"JWT org={jwt_org_id}/role={jwt_role}, "
                                f"DB org={db_org_id}/role={db_role}"
                            )
                            # Use current database values instead of JWT claims
                            request.state.user_id = user_id
                            request.state.org_id = db_org_id
                            request.state.role = db_role
                            request.state.token_jti = payload.get("jti")
                            request.state.role_stale = True
                        else:
                            request.state.user_id = user_id
                            request.state.org_id = jwt_org_id
                            request.state.role = jwt_role
                            request.state.token_jti = payload.get("jti")
                    else:
                        # User deleted - don't authenticate
                        logger.warning(f"JWT for deleted user: {user_id}")

        response = await call_next(request)
        return response


def get_user_from_request(request: Request) -> dict | None:
    """
    Get user context from request state.

    Args:
        request: FastAPI request object

    Returns:
        User context dict or None if not authenticated
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        return None

    return {
        "user_id": user_id,
        "org_id": getattr(request.state, "org_id", None),
        "role": getattr(request.state, "role", None),
    }
