"""
ABAC Middleware

Middleware for evaluating attribute-based access control policies on API requests.
Works alongside RBAC to provide fine-grained access control.
"""

import logging
from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status

from studio.services.abac_service import ABACService

logger = logging.getLogger(__name__)

# Global ABAC service instance
_abac_service = None


def get_abac_service() -> ABACService:
    """Get or create the ABAC service singleton."""
    global _abac_service
    if _abac_service is None:
        _abac_service = ABACService()
    return _abac_service


# Map HTTP methods to ABAC actions
METHOD_TO_ACTION = {
    "GET": "read",
    "POST": "create",
    "PUT": "update",
    "PATCH": "update",
    "DELETE": "delete",
}

# Map URL path prefixes to resource types
PATH_TO_RESOURCE = {
    "/api/v1/agents": "agent",
    "/api/v1/pipelines": "pipeline",
    "/api/v1/deployments": "deployment",
    "/api/v1/gateways": "gateway",
    "/api/v1/teams": "team",
    "/api/v1/users": "user",
    "/api/v1/organizations": "organization",
    "/api/v1/workspaces": "workspace",
    "/api/v1/external-agents": "external_agent",
    "/api/v1/policies": "policy",
    "/api/v1/settings": "settings",
    "/api/v1/billing": "billing",
    "/api/v1/audit": "audit",
    "/api/v1/connectors": "connector",
    "/api/v1/invitations": "invitation",
    "/api/v1/api-keys": "api_key",
    "/api/v1/executions": "execution",
}


def get_resource_type_from_path(path: str) -> str | None:
    """
    Extract resource type from URL path.

    Args:
        path: Request URL path

    Returns:
        Resource type or None if not matched
    """
    for prefix, resource_type in PATH_TO_RESOURCE.items():
        if path.startswith(prefix):
            return resource_type
    return None


def get_action_from_method(method: str) -> str:
    """
    Map HTTP method to ABAC action.

    Args:
        method: HTTP method

    Returns:
        ABAC action
    """
    return METHOD_TO_ACTION.get(method.upper(), "read")


class ABACDependency:
    """
    FastAPI dependency for ABAC policy evaluation.

    Usage:
        @router.post("/agents")
        async def create_agent(
            abac_result: bool = Depends(ABACDependency("agent", "create"))
        ):
            ...
    """

    def __init__(
        self,
        resource_type: str | None = None,
        action: str | None = None,
        resource_extractor: Callable[[Request], dict] | None = None,
    ):
        """
        Initialize ABAC dependency.

        Args:
            resource_type: Override resource type (auto-detected from path if None)
            action: Override action (auto-detected from method if None)
            resource_extractor: Optional function to extract resource attributes from request
        """
        self.resource_type = resource_type
        self.action = action
        self.resource_extractor = resource_extractor

    async def __call__(
        self,
        request: Request,
        abac: ABACService = Depends(get_abac_service),
    ) -> bool:
        """
        Evaluate ABAC policy for the request.

        Args:
            request: FastAPI request
            abac: ABAC service

        Returns:
            True if allowed

        Raises:
            HTTPException: If denied by ABAC policy
        """
        # Get user from request state
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            # No user context - let RBAC middleware handle auth
            return True

        # Determine resource type
        resource_type = self.resource_type
        if not resource_type:
            resource_type = get_resource_type_from_path(request.url.path)

        if not resource_type:
            # Unknown resource type - skip ABAC check
            return True

        # Determine action
        action = self.action or get_action_from_method(request.method)

        # Extract resource attributes if extractor provided
        resource = {}
        if self.resource_extractor:
            try:
                resource = self.resource_extractor(request)
            except Exception as e:
                logger.warning(f"Failed to extract resource attributes: {e}")

        # Build context
        context = {
            "ip_address": request.client.host if request.client else None,
            "path": request.url.path,
            "method": request.method,
            "org_id": getattr(request.state, "org_id", None),
        }

        # Evaluate ABAC policy
        try:
            allowed = await abac.evaluate(
                user_id=user_id,
                resource_type=resource_type,
                action=action,
                resource=resource,
                context=context,
            )

            if not allowed:
                logger.info(
                    f"ABAC denied: user={user_id}, resource={resource_type}, action={action}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied by policy: {resource_type}:{action}",
                )

            return True

        except HTTPException:
            raise
        except Exception as e:
            # SECURITY: Fail-closed on ABAC evaluation errors
            # Log error and deny access to prevent security bypass
            logger.error(f"ABAC evaluation error (denying access): {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Access control evaluation failed. Please try again later.",
            )


def require_abac(
    resource_type: str | None = None,
    action: str | None = None,
) -> Callable:
    """
    Convenience function for requiring ABAC check.

    Usage:
        @router.post("/agents")
        async def create_agent(
            _: bool = require_abac("agent", "create")
        ):
            ...
    """
    return Depends(ABACDependency(resource_type=resource_type, action=action))


async def evaluate_abac_policy(
    request: Request,
    resource_type: str,
    action: str,
    resource: dict | None = None,
) -> bool:
    """
    Evaluate ABAC policy programmatically.

    Useful when you need to check permissions inside a handler.

    Args:
        request: FastAPI request with user context
        resource_type: Resource type
        action: Action to check
        resource: Optional resource attributes

    Returns:
        True if allowed, False otherwise
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        return False

    abac = get_abac_service()

    context = {
        "ip_address": request.client.host if request.client else None,
        "path": request.url.path,
        "method": request.method,
        "org_id": getattr(request.state, "org_id", None),
    }

    try:
        return await abac.evaluate(
            user_id=user_id,
            resource_type=resource_type,
            action=action,
            resource=resource or {},
            context=context,
        )
    except Exception as e:
        # SECURITY: Fail-closed on ABAC evaluation errors
        logger.error(f"ABAC evaluation error (denying access): {e}")
        return False  # Fail-closed for security
