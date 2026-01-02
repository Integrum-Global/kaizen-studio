"""
External Agent DataFlow Model

Represents external agents (MS Copilot, custom, etc.) registered for governance.
"""

from studio.models import db


@db.model
class ExternalAgent:
    """
    External agent registration for governance wrapping.

    DataFlow generates these nodes automatically:
    - ExternalAgentCreateNode
    - ExternalAgentReadNode
    - ExternalAgentUpdateNode
    - ExternalAgentDeleteNode
    - ExternalAgentListNode
    - ExternalAgentCountNode
    - ExternalAgentUpsertNode
    - ExternalAgentBulkCreateNode
    - ExternalAgentBulkUpdateNode
    - ExternalAgentBulkDeleteNode
    - ExternalAgentBulkUpsertNode
    """

    # Primary key - MUST be 'id' for DataFlow
    id: str

    # Organization and workspace reference
    organization_id: str
    workspace_id: str

    # Agent identification
    name: str
    description: str  # Empty string if not provided

    # Platform type
    # Enum: "teams", "discord", "slack", "telegram", "notion", "custom_http"
    platform: str

    # Platform-specific agent ID (e.g., Copilot bot ID, Discord webhook ID)
    platform_agent_id: str  # Empty string if not applicable

    # Webhook/endpoint configuration
    webhook_url: str

    # Authentication type
    # Enum: "oauth2", "api_key", "bearer_token", "basic", "custom", "none"
    auth_type: str

    # Authentication configuration (JSON string, encrypted)
    # Format depends on auth_type - see validation logic
    encrypted_credentials: str

    # Platform configuration (JSON string)
    # Platform-specific settings (tenant_id, channel_id, etc.)
    platform_config: str  # JSON string

    # Capabilities (JSON array)
    # List of capabilities this agent supports
    capabilities: str  # JSON array of strings

    # General configuration (JSON object)
    # Additional configuration settings
    config: str  # JSON object

    # Governance configuration
    budget_limit_daily: float  # -1 = unlimited
    budget_limit_monthly: float  # -1 = unlimited
    rate_limit_per_minute: int  # -1 = unlimited
    rate_limit_per_hour: int  # -1 = unlimited

    # Labels for categorization (JSON array)
    # Note: Named 'agent_tags' to avoid conflict with DataFlow's NodeMetadata 'tags' field
    agent_tags: str  # JSON array of strings

    # Status: "active", "inactive", "deleted"
    status: str

    # Audit fields
    created_by: str

    # Timestamps (ISO 8601 strings for DataFlow)
    created_at: str
    updated_at: str
