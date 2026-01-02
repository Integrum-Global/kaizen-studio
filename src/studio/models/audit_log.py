"""
AuditLog DataFlow Model

Represents audit trail entries for compliance and security monitoring.
"""

from studio.models import db


@db.model
class AuditLog:
    """
    Audit log model for tracking all system activities.

    DataFlow generates these nodes automatically:
    - AuditLogCreateNode
    - AuditLogReadNode
    - AuditLogUpdateNode
    - AuditLogDeleteNode
    - AuditLogListNode
    - AuditLogCountNode
    - AuditLogUpsertNode
    - AuditLogBulkCreateNode
    - AuditLogBulkUpdateNode
    - AuditLogBulkDeleteNode
    - AuditLogBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization context
    organization_id: str

    # User who performed the action
    user_id: str

    # Action performed: create, read, update, delete, deploy, login, logout
    action: str

    # Resource type: agent, deployment, user, organization, pipeline, gateway, team
    resource_type: str

    # Resource identifier (optional for some actions like login)
    resource_id: str | None = None

    # JSON string with additional details (changes, parameters, etc.)
    details: str | None = None

    # Request metadata
    ip_address: str | None = None
    user_agent: str | None = None

    # Outcome: success, failure
    status: str

    # Error message if status is failure
    error_message: str | None = None

    # Timestamp (ISO 8601 string)
    created_at: str
