"""
API Key Model

DataFlow model for API key management with scoped access and rate limiting.
"""

from studio.models import db


@db.model
class APIKey:
    """
    API Key model for external service authentication.

    Attributes:
        id: Unique identifier
        organization_id: Organization this key belongs to
        name: Human-readable name for the key
        key_hash: Bcrypt hash of the key
        key_prefix: First 8 characters for identification (e.g., sk_live_a1b2c3d4)
        scopes: JSON array of permission scopes
        rate_limit: Requests per minute allowed
        expires_at: Optional expiration timestamp
        last_used_at: Last time the key was used
        status: Key status (active, revoked)
        created_by: User ID who created the key
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    id: str
    organization_id: str
    name: str
    key_hash: str
    key_prefix: str
    scopes: str  # JSON array of scopes
    rate_limit: int
    expires_at: str | None
    last_used_at: str | None
    status: str
    created_by: str
    created_at: str
    updated_at: str | None
