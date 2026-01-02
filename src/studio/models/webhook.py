"""
Webhook Model

DataFlow model for webhook configuration and event subscription management.
"""

from studio.models import db


@db.model
class Webhook:
    """
    Webhook model for event notification subscriptions.

    Attributes:
        id: Unique identifier
        organization_id: Organization this webhook belongs to
        name: Human-readable name for the webhook
        url: Target URL for webhook deliveries
        secret: Secret key for HMAC signature generation
        events: JSON array of subscribed event types
        status: Webhook status (active, inactive)
        last_triggered_at: Last time the webhook was triggered
        failure_count: Consecutive failure count
        created_by: User ID who created the webhook
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    id: str
    organization_id: str
    name: str
    url: str
    secret: str
    events: str  # JSON array of event types
    status: str  # active, inactive
    last_triggered_at: str | None
    failure_count: int
    created_by: str
    created_at: str
    updated_at: str | None
