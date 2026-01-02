"""
API Keys Router

FastAPI router for API key management endpoints.
"""

import logging

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from studio.services.api_key_service import API_KEY_SCOPES, APIKeyService
from studio.services.rate_limit_service import RateLimitService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


# Request/Response Models
class CreateAPIKeyRequest(BaseModel):
    """Request model for creating an API key."""

    name: str = Field(..., min_length=1, max_length=100)
    scopes: list[str] = Field(default_factory=list)
    rate_limit: int = Field(default=60, ge=1, le=10000)
    expires_at: str | None = None


class CreateAPIKeyResponse(BaseModel):
    """Response model for creating an API key."""

    id: str
    organization_id: str
    name: str
    key_prefix: str
    key: str  # Plain key - shown only once
    scopes: list[str]
    rate_limit: int
    expires_at: str | None
    status: str
    created_at: str


class APIKeyResponse(BaseModel):
    """Response model for API key info."""

    id: str
    organization_id: str
    name: str
    key_prefix: str
    scopes: list[str]
    rate_limit: int
    expires_at: str | None
    last_used_at: str | None
    status: str
    created_by: str
    created_at: str


class APIKeyUsageResponse(BaseModel):
    """Response model for API key usage stats."""

    key_id: str
    window_start: str
    request_count: int
    rate_limit: int
    remaining: int


class APIKeyScopesResponse(BaseModel):
    """Response model for available scopes."""

    scopes: list[str]


# Helper function to get current user
def get_current_user(request: Request) -> dict:
    """Get the current authenticated user from request state."""
    user_id = getattr(request.state, "user_id", None)
    org_id = getattr(request.state, "org_id", None)

    if not user_id or not org_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return {
        "user_id": user_id,
        "org_id": org_id,
        "role": getattr(request.state, "role", None),
    }


@router.get("/scopes", response_model=APIKeyScopesResponse)
async def list_available_scopes():
    """
    List all available API key scopes.

    Returns list of valid scope values that can be assigned to API keys.
    """
    return {"scopes": API_KEY_SCOPES}


@router.post("", response_model=CreateAPIKeyResponse)
async def create_api_key(
    data: CreateAPIKeyRequest,
    request: Request,
):
    """
    Create a new API key.

    Returns the full API key in the response. This is the only time
    the full key will be shown - it cannot be retrieved later.
    """
    user = get_current_user(request)
    service = APIKeyService()

    # Validate scopes
    invalid_scopes = [s for s in data.scopes if s not in API_KEY_SCOPES]
    if invalid_scopes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scopes: {invalid_scopes}. Valid scopes: {API_KEY_SCOPES}",
        )

    key_record, plain_key = await service.create(
        org_id=user["org_id"],
        name=data.name,
        scopes=data.scopes,
        rate_limit=data.rate_limit,
        user_id=user["user_id"],
        expires_at=data.expires_at,
    )

    return {
        **key_record,
        "key": plain_key,
    }


@router.get("", response_model=list[APIKeyResponse])
async def list_api_keys(request: Request):
    """
    List all API keys for the organization.

    Returns key metadata but not the actual key values.
    """
    user = get_current_user(request)
    service = APIKeyService()

    keys = await service.list(user["org_id"])
    return keys


@router.get("/{key_id}", response_model=APIKeyResponse)
async def get_api_key(key_id: str, request: Request):
    """
    Get details of a specific API key.

    Returns key metadata but not the actual key value.
    """
    user = get_current_user(request)
    service = APIKeyService()

    try:
        key = await service.get(key_id)
    except Exception:
        raise HTTPException(status_code=404, detail="API key not found")

    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    # Verify key belongs to user's organization
    if key["organization_id"] != user["org_id"]:
        raise HTTPException(status_code=404, detail="API key not found")

    return key


@router.delete("/{key_id}")
async def revoke_api_key(key_id: str, request: Request):
    """
    Revoke an API key.

    The key will no longer be valid for authentication.
    """
    user = get_current_user(request)
    service = APIKeyService()

    try:
        key = await service.get(key_id)
    except Exception:
        raise HTTPException(status_code=404, detail="API key not found")

    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    # Verify key belongs to user's organization
    if key["organization_id"] != user["org_id"]:
        raise HTTPException(status_code=404, detail="API key not found")

    await service.revoke(key_id)

    return {"message": "API key revoked successfully"}


@router.get("/{key_id}/usage", response_model=APIKeyUsageResponse)
async def get_api_key_usage(key_id: str, request: Request):
    """
    Get usage statistics for an API key.

    Returns current rate limit usage for the key.
    """
    user = get_current_user(request)
    api_key_service = APIKeyService()
    rate_limit_service = RateLimitService()

    key = await api_key_service.get(key_id)
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    # Verify key belongs to user's organization
    if key["organization_id"] != user["org_id"]:
        raise HTTPException(status_code=404, detail="API key not found")

    usage = await rate_limit_service.get_usage(key_id)

    return {
        "key_id": key_id,
        "window_start": usage["window_start"],
        "request_count": usage["request_count"],
        "rate_limit": key["rate_limit"],
        "remaining": max(0, key["rate_limit"] - usage["request_count"]),
    }
