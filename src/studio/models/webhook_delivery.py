"""
Webhook Delivery Model

DataFlow model for tracking webhook delivery attempts and history.
"""

from studio.models import db


@db.model
class WebhookDelivery:
    """
    Webhook delivery model for tracking delivery attempts.

    Attributes:
        id: Unique identifier
        webhook_id: Webhook this delivery belongs to
        event_type: Type of event delivered
        payload: JSON payload sent
        response_status: HTTP response status code
        response_body: Response body from target
        duration_ms: Request duration in milliseconds
        status: Delivery status (pending, success, failed)
        attempt_count: Number of delivery attempts
        created_at: Creation timestamp
    """

    id: str
    webhook_id: str
    event_type: str
    payload: str  # JSON payload sent
    response_status: int  # HTTP response status code (0 for connection errors)
    response_body: str  # Response body from target (empty string if no response)
    duration_ms: int  # Request duration in milliseconds (0 initially)
    status: str  # pending, success, failed
    attempt_count: int
    created_at: str  # Declared so DataFlow returns it on reads; auto-managed when not passed on create
