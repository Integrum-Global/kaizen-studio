"""
Team Membership DataFlow Model

Represents a user's membership in a team.
"""

from studio.models import db


@db.model
class TeamMembership:
    """
    Team membership model for linking users to teams.

    DataFlow generates these nodes automatically:
    - TeamMembershipCreateNode
    - TeamMembershipReadNode
    - TeamMembershipUpdateNode
    - TeamMembershipDeleteNode
    - TeamMembershipListNode
    - TeamMembershipCountNode
    - TeamMembershipUpsertNode
    - TeamMembershipBulkCreateNode
    - TeamMembershipBulkUpdateNode
    - TeamMembershipBulkDeleteNode
    - TeamMembershipBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # References
    team_id: str
    user_id: str

    # Role within team: team_lead, member
    role: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
