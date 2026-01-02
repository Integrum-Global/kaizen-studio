"""
Permission DataFlow Model

Represents a permission in the RBAC system.
"""

from studio.models import db


@db.model
class Permission:
    """
    Permission model for RBAC authorization.

    DataFlow generates these nodes automatically:
    - PermissionCreateNode
    - PermissionReadNode
    - PermissionUpdateNode
    - PermissionDeleteNode
    - PermissionListNode
    - PermissionCountNode
    - PermissionUpsertNode
    - PermissionBulkCreateNode
    - PermissionBulkUpdateNode
    - PermissionBulkDeleteNode
    - PermissionBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Permission name (e.g., "agents:create", "deployments:delete")
    name: str

    # Resource category (e.g., "agents", "deployments", "users")
    resource: str

    # Action type (create, read, update, delete, deploy, *)
    action: str

    # Human-readable description
    description: str
