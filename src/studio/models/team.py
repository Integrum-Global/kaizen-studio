"""
Team DataFlow Model

Represents a team within an organization in the Kaizen Studio platform.
"""

from studio.models import db


@db.model
class Team:
    """
    Team model for organizing users within an organization.

    DataFlow generates these nodes automatically:
    - TeamCreateNode
    - TeamReadNode
    - TeamUpdateNode
    - TeamDeleteNode
    - TeamListNode
    - TeamCountNode
    - TeamUpsertNode
    - TeamBulkCreateNode
    - TeamBulkUpdateNode
    - TeamBulkDeleteNode
    - TeamBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization reference
    organization_id: str

    # Team details
    name: str

    # Description (optional)
    description: str | None = None

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
