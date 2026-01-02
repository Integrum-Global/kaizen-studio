"""
Webhooks Router

FastAPI router for webhook management and delivery endpoints.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from kailash.runtime import AsyncLocalRuntime
from pydantic import BaseModel, Field

from studio.services.webhook_service import WEBHOOK_EVENTS, WebhookService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


# Dependency factory functions
def get_runtime() -> AsyncLocalRuntime:
    """Get AsyncLocalRuntime for dependency injection."""
    return AsyncLocalRuntime()


def get_webhook_service(
    runtime: AsyncLocalRuntime = Depends(get_runtime),
) -> WebhookService:
    """Get WebhookService with injected runtime."""
    return WebhookService(runtime=runtime)


# Request/Response Models
class CreateWebhookRequest(BaseModel):
    """Request model for creating a webhook."""

    name: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., min_length=1)
    events: list[str] = Field(default_factory=list)


class UpdateWebhookRequest(BaseModel):
    """Request model for updating a webhook."""

    name: str | None = Field(None, min_length=1, max_length=100)
    url: str | None = None
    events: list[str] | None = None
    status: str | None = Field(None, pattern="^(active|inactive)$")


class WebhookResponse(BaseModel):
    """Response model for webhook info."""

    id: str
    organization_id: str
    name: str
    url: str
    events: list[str]
    status: str
    last_triggered_at: str | None
    failure_count: int
    created_by: str
    created_at: str


class WebhookWithSecretResponse(BaseModel):
    """Response model for webhook with secret (shown on create)."""

    id: str
    organization_id: str
    name: str
    url: str
    secret: str
    events: list[str]
    status: str
    last_triggered_at: str | None
    failure_count: int
    created_by: str
    created_at: str


class WebhookDeliveryResponse(BaseModel):
    """Response model for webhook delivery."""

    id: str
    webhook_id: str
    event_type: str
    payload: str
    response_status: int | None
    response_body: str | None
    duration_ms: int | None
    status: str
    attempt_count: int
    created_at: str


class WebhookEventsResponse(BaseModel):
    """Response model for available events."""

    events: list[str]


class TestWebhookRequest(BaseModel):
    """Request model for testing a webhook."""

    event_type: str | None = "test.event"


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


@router.get("/events", response_model=WebhookEventsResponse)
async def list_webhook_events():
    """
    List all available webhook event types.

    Returns list of valid event types that webhooks can subscribe to.
    """
    return WebhookEventsResponse(
        events=[
            "agent.created",
            "agent.updated",
            "agent.deleted",
            "deployment.created",
            "deployment.updated",
            "deployment.deleted",
        ]
    )


@router.post("", response_model=WebhookWithSecretResponse)
async def create_webhook(
    data: CreateWebhookRequest,
    request: Request,
    service: WebhookService = Depends(get_webhook_service),
):
    """
    Create a new webhook.

    Returns the webhook with its secret. The secret is only shown once
    and should be stored securely for signature verification.
    """
    user = get_current_user(request)

    # Validate events
    invalid_events = [e for e in data.events if e not in WEBHOOK_EVENTS]
    if invalid_events:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid events: {invalid_events}. Valid events: {WEBHOOK_EVENTS}",
        )

    webhook = await service.create(
        org_id=user["org_id"],
        name=data.name,
        url=data.url,
        events=data.events,
        user_id=user["user_id"],
    )

    return webhook


@router.get("", response_model=list[WebhookResponse])
async def list_webhooks(
    request: Request,
    service: WebhookService = Depends(get_webhook_service),
):
    """
    List all webhooks for the organization.

    Returns webhook metadata but not secrets.
    """
    user = get_current_user(request)

    webhooks = await service.list(user["org_id"])
    return webhooks


@router.get("/{webhook_id}", response_model=WebhookResponse)
async def get_webhook(
    webhook_id: str,
    request: Request,
    service: WebhookService = Depends(get_webhook_service),
):
    """
    Get details of a specific webhook.

    Returns webhook metadata but not the secret.
    """
    user = get_current_user(request)

    webhook = await service.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    # Verify webhook belongs to user's organization
    if webhook["organization_id"] != user["org_id"]:
        raise HTTPException(status_code=404, detail="Webhook not found")

    # Remove secret from response
    webhook.pop("secret", None)
    return webhook


@router.put("/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(
    webhook_id: str,
    data: UpdateWebhookRequest,
    request: Request,
    service: WebhookService = Depends(get_webhook_service),
):
    """
    Update a webhook.

    Updates the specified fields of the webhook.
    """
    user = get_current_user(request)

    webhook = await service.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    # Verify webhook belongs to user's organization
    if webhook["organization_id"] != user["org_id"]:
        raise HTTPException(status_code=404, detail="Webhook not found")

    # Validate events if provided
    if data.events:
        invalid_events = [e for e in data.events if e not in WEBHOOK_EVENTS]
        if invalid_events:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid events: {invalid_events}. Valid events: {WEBHOOK_EVENTS}",
            )

    updated = await service.update(
        webhook_id,
        data.model_dump(exclude_none=True),
    )

    # Remove secret from response
    updated.pop("secret", None)
    return updated


@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    request: Request,
    service: WebhookService = Depends(get_webhook_service),
):
    """
    Delete a webhook.

    Removes the webhook and stops all future deliveries.
    """
    user = get_current_user(request)

    webhook = await service.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    # Verify webhook belongs to user's organization
    if webhook["organization_id"] != user["org_id"]:
        raise HTTPException(status_code=404, detail="Webhook not found")

    await service.delete(webhook_id)
    return {"message": "Webhook deleted"}


@router.post("/{webhook_id}/test")
async def test_webhook(
    webhook_id: str,
    request: Request,
    data: TestWebhookRequest = None,
    service: WebhookService = Depends(get_webhook_service),
):
    """
    Send a test event to a webhook.

    Triggers a test delivery to verify the webhook configuration.
    """
    user = get_current_user(request)

    webhook = await service.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    # Verify webhook belongs to user's organization
    if webhook["organization_id"] != user["org_id"]:
        raise HTTPException(status_code=404, detail="Webhook not found")

    event_type = data.event_type if data else "test.event"

    # Deliver test event
    delivery = await service.deliver(
        {
            "id": webhook["id"],
            "url": webhook["url"],
            "secret": webhook["secret"],
        },
        event_type,
        {
            "test": True,
            "message": "This is a test webhook delivery",
        },
        user["org_id"],
    )

    return {"message": "Test delivery sent", "delivery": delivery}


@router.get("/{webhook_id}/deliveries", response_model=list[WebhookDeliveryResponse])
async def list_deliveries(
    webhook_id: str,
    request: Request,
    limit: int = 50,
    service: WebhookService = Depends(get_webhook_service),
):
    """
    List delivery history for a webhook.

    Returns recent deliveries with their status and response info.
    """
    user = get_current_user(request)

    webhook = await service.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    # Verify webhook belongs to user's organization
    if webhook["organization_id"] != user["org_id"]:
        raise HTTPException(status_code=404, detail="Webhook not found")

    deliveries = await service.list_deliveries(webhook_id, limit)
    return deliveries


@router.get("/deliveries/{delivery_id}", response_model=WebhookDeliveryResponse)
async def get_delivery(
    delivery_id: str,
    request: Request,
    service: WebhookService = Depends(get_webhook_service),
):
    """
    Get details of a specific delivery.

    Returns full delivery information including payload and response.
    """
    user = get_current_user(request)

    delivery = await service.get_delivery(delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    # Verify delivery's webhook belongs to user's organization
    webhook = await service.get(delivery["webhook_id"])
    if not webhook or webhook["organization_id"] != user["org_id"]:
        raise HTTPException(status_code=404, detail="Delivery not found")

    return delivery


@router.post("/deliveries/{delivery_id}/retry", response_model=WebhookDeliveryResponse)
async def retry_delivery(
    delivery_id: str,
    request: Request,
    service: WebhookService = Depends(get_webhook_service),
):
    """
    Retry a failed delivery.

    Creates a new delivery attempt for a failed delivery.
    """
    user = get_current_user(request)

    delivery = await service.get_delivery(delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    # Verify delivery's webhook belongs to user's organization
    webhook = await service.get(delivery["webhook_id"])
    if not webhook or webhook["organization_id"] != user["org_id"]:
        raise HTTPException(status_code=404, detail="Delivery not found")

    if delivery["status"] != "failed":
        raise HTTPException(
            status_code=400,
            detail="Only failed deliveries can be retried",
        )

    new_delivery = await service.retry_failed(delivery_id)
    if not new_delivery:
        raise HTTPException(status_code=500, detail="Failed to retry delivery")

    return new_delivery
