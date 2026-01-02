"""
PolicyAssignment DataFlow Model

Represents an assignment of a policy to a principal (user, team, or role).
"""

from studio.models import db


@db.model
class PolicyAssignment:
    """
    PolicyAssignment model for linking policies to principals.

    DataFlow generates these nodes automatically:
    - PolicyAssignmentCreateNode
    - PolicyAssignmentReadNode
    - PolicyAssignmentUpdateNode
    - PolicyAssignmentDeleteNode
    - PolicyAssignmentListNode
    - PolicyAssignmentCountNode
    - PolicyAssignmentUpsertNode
    - PolicyAssignmentBulkCreateNode
    - PolicyAssignmentBulkUpdateNode
    - PolicyAssignmentBulkDeleteNode
    - PolicyAssignmentBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Policy being assigned
    policy_id: str

    # Type of principal (user, team, role)
    principal_type: str

    # ID of the principal (user_id, team_id, or role name)
    principal_id: str

    # Timestamp
    created_at: str
