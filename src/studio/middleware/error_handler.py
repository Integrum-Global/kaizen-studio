"""
Error Handler Middleware

Provides standardized error responses across all API endpoints.
"""

import logging
import traceback
from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from studio.config import is_production

logger = logging.getLogger(__name__)


class APIError(Exception):
    """
    Base API error class for consistent error handling.

    Usage:
        raise APIError(
            status_code=400,
            error_code="INVALID_INPUT",
            message="The provided input is invalid",
            details={"field": "email", "reason": "Invalid format"}
        )
    """

    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ):
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> JSONResponse:
    """
    Create a standardized error response.

    Response format:
    {
        "error": {
            "code": "ERROR_CODE",
            "message": "Human-readable message",
            "details": {...},
            "request_id": "uuid"
        }
    }
    """
    error_body = {
        "error": {
            "code": error_code,
            "message": message,
        }
    }

    if details:
        error_body["error"]["details"] = details

    if request_id:
        error_body["error"]["request_id"] = request_id

    return JSONResponse(
        status_code=status_code,
        content=error_body,
    )


async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    """Handle custom APIError exceptions."""
    request_id = getattr(request.state, "request_id", None)
    return create_error_response(
        status_code=exc.status_code,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
        request_id=request_id,
    )


async def http_exception_handler(
    request: Request, exc: HTTPException | StarletteHTTPException
) -> JSONResponse:
    """Handle FastAPI/Starlette HTTPException."""
    request_id = getattr(request.state, "request_id", None)

    # Map status codes to error codes
    error_codes = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
    }

    error_code = error_codes.get(exc.status_code, "ERROR")

    return create_error_response(
        status_code=exc.status_code,
        error_code=error_code,
        message=str(exc.detail) if exc.detail else "An error occurred",
        request_id=request_id,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError | ValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    request_id = getattr(request.state, "request_id", None)

    # Extract validation error details
    if isinstance(exc, RequestValidationError):
        errors = exc.errors()
    else:
        errors = exc.errors()

    # Format errors for response
    formatted_errors = []
    for error in errors:
        formatted_errors.append(
            {
                "field": ".".join(str(loc) for loc in error.get("loc", [])),
                "message": error.get("msg", "Validation error"),
                "type": error.get("type", "validation_error"),
            }
        )

    return create_error_response(
        status_code=422,
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        details={"errors": formatted_errors},
        request_id=request_id,
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    request_id = getattr(request.state, "request_id", None)

    # Log the full error in development, minimal in production
    if is_production():
        logger.error(f"Unhandled exception: {type(exc).__name__}: {exc}")
    else:
        logger.error(f"Unhandled exception:\n{traceback.format_exc()}")

    # Return generic error in production, detailed in development
    if is_production():
        return create_error_response(
            status_code=500,
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred",
            request_id=request_id,
        )
    else:
        return create_error_response(
            status_code=500,
            error_code="INTERNAL_ERROR",
            message=f"{type(exc).__name__}: {str(exc)}",
            details={"traceback": traceback.format_exc().split("\n")[-5:]},
            request_id=request_id,
        )


def register_exception_handlers(app):
    """
    Register all exception handlers with the FastAPI app.

    Usage:
        from studio.middleware.error_handler import register_exception_handlers
        register_exception_handlers(app)
    """
    from fastapi import FastAPI

    if not isinstance(app, FastAPI):
        raise ValueError("app must be a FastAPI instance")

    # Register handlers in order of specificity
    app.add_exception_handler(APIError, api_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)


# Common error factories for convenience
class ErrorFactory:
    """Factory for creating common API errors."""

    @staticmethod
    def bad_request(message: str, details: dict | None = None) -> APIError:
        return APIError(400, "BAD_REQUEST", message, details)

    @staticmethod
    def unauthorized(message: str = "Authentication required") -> APIError:
        return APIError(401, "UNAUTHORIZED", message)

    @staticmethod
    def forbidden(message: str = "Access denied") -> APIError:
        return APIError(403, "FORBIDDEN", message)

    @staticmethod
    def not_found(resource: str, id: str | None = None) -> APIError:
        message = f"{resource} not found"
        if id:
            message = f"{resource} with id '{id}' not found"
        return APIError(404, "NOT_FOUND", message)

    @staticmethod
    def conflict(message: str, details: dict | None = None) -> APIError:
        return APIError(409, "CONFLICT", message, details)

    @staticmethod
    def validation_error(message: str, errors: list[dict]) -> APIError:
        return APIError(422, "VALIDATION_ERROR", message, {"errors": errors})

    @staticmethod
    def rate_limited(retry_after: int) -> APIError:
        return APIError(
            429,
            "RATE_LIMIT_EXCEEDED",
            "Too many requests",
            {"retry_after": retry_after},
        )

    @staticmethod
    def internal_error(message: str = "An unexpected error occurred") -> APIError:
        return APIError(500, "INTERNAL_ERROR", message)
