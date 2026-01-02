"""
RolePermission DataFlow Model

Maps roles to permissions in the RBAC system.
"""

from studio.models import db


@db.model
class RolePermission:
    """
    RolePermission model for RBAC authorization.

    DataFlow generates these nodes automatically:
    - RolePermissionCreateNode
    - RolePermissionReadNode
    - RolePermissionUpdateNode
    - RolePermissionDeleteNode
    - RolePermissionListNode
    - RolePermissionCountNode
    - RolePermissionUpsertNode
    - RolePermissionBulkCreateNode
    - RolePermissionBulkUpdateNode
    - RolePermissionBulkDeleteNode
    - RolePermissionBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Role name (org_owner, org_admin, developer, viewer)
    role: str

    # Foreign key to Permission
    permission_id: str

    # Timestamp (ISO 8601 string for DataFlow)
    created_at: str
