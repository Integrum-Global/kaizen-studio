"""
Audit Decorator

Decorator for manual audit logging of specific actions.
"""

import functools
import logging
from collections.abc import Callable
from typing import Any

from fastapi import Request

from studio.services.audit_service import AuditService

logger = logging.getLogger(__name__)


def audit_action(action: str, resource_type: str):
    """
    Decorator to audit specific actions.

    Use this decorator on endpoint functions that need explicit audit logging
    beyond what the middleware captures (e.g., login, logout, deploy).

    Args:
        action: Action type (e.g., "deploy", "login", "logout")
        resource_type: Resource type being acted upon

    Returns:
        Decorated function

    Example:
        @audit_action("deploy", "agent")
        async def deploy_agent(request: Request, agent_id: str):
            # ... deployment logic ...
            return {"status": "deployed"}
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Find request object in args or kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                request = kwargs.get("request")

            # Execute the function
            error_message = None
            status = "success"
            result = None

            try:
                result = await func(*args, **kwargs)
            except Exception as e:
                status = "failure"
                error_message = str(e)
                raise
            finally:
                # Log the audit entry
                try:
                    if request:
                        await _log_audit(
                            request=request,
                            action=action,
                            resource_type=resource_type,
                            status=status,
                            error_message=error_message,
                            result=result,
                            kwargs=kwargs,
                        )
                except Exception as e:
                    # Don't fail the request if audit logging fails
                    logger.error(f"Failed to log audit entry: {e}")

            return result

        return wrapper

    return decorator


async def _log_audit(
    request: Request,
    action: str,
    resource_type: str,
    status: str,
    error_message: str,
    result: Any,
    kwargs: dict,
):
    """
    Log an audit entry for the decorated action.

    Args:
        request: The request object
        action: Action type
        resource_type: Resource type
        status: Outcome status
        error_message: Error message if failed
        result: Function result
        kwargs: Function kwargs (may contain resource_id)
    """
    # Extract user context
    user_id = getattr(request.state, "user_id", None)
    organization_id = getattr(request.state, "organization_id", None)

    if not user_id or not organization_id:
        return

    # Try to extract resource_id from common kwargs
    resource_id = None
    for key in [
        "id",
        "agent_id",
        "deployment_id",
        "user_id",
        "team_id",
        "gateway_id",
        "pipeline_id",
    ]:
        if key in kwargs:
            resource_id = kwargs[key]
            break

    # Extract request metadata
    ip_address = _get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")

    # Build details
    details = {
        "method": request.method,
        "path": request.url.path,
    }

    # Add result info if available
    if result and isinstance(result, dict):
        if "id" in result:
            details["result_id"] = result["id"]
        if "status" in result:
            details["result_status"] = result["status"]

    # Log the entry
    audit_service = AuditService()
    await audit_service.log(
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


def _get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"
