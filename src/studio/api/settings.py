"""
Settings API Endpoints

Handles organization and user settings management.
"""

import json
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder
from pydantic import BaseModel, Field

from studio.api.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])


# =============================================================================
# Request/Response Models
# =============================================================================


class NotificationSettings(BaseModel):
    """Notification settings."""

    email: bool = True
    push: bool = True
    slack: bool = False
    digest: bool = True


class SecuritySettings(BaseModel):
    """Security settings."""

    mfa_enabled: bool = Field(default=False, alias="mfaEnabled")
    session_timeout: int = Field(default=30, alias="sessionTimeout")  # minutes
    ip_whitelist: list[str] = Field(default_factory=list, alias="ipWhitelist")

    class Config:
        populate_by_name = True


class OrganizationSettingsResponse(BaseModel):
    """Organization settings response."""

    id: str
    organization_id: str = Field(..., alias="organizationId")
    name: str
    theme: str = "system"
    timezone: str = "UTC"
    language: str = "en"
    notifications: NotificationSettings
    security: SecuritySettings
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    class Config:
        populate_by_name = True


class UserSettingsResponse(BaseModel):
    """User settings response."""

    id: str
    user_id: str = Field(..., alias="userId")
    theme: str = "system"
    timezone: str = "UTC"
    language: str = "en"
    notifications: NotificationSettings
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    class Config:
        populate_by_name = True


class UpdateOrganizationSettingsRequest(BaseModel):
    """Update organization settings request."""

    name: str | None = None
    theme: str | None = None
    timezone: str | None = None
    language: str | None = None
    notifications: dict | None = None
    security: dict | None = None


class UpdateUserSettingsRequest(BaseModel):
    """Update user settings request."""

    theme: str | None = None
    timezone: str | None = None
    language: str | None = None
    notifications: dict | None = None


# =============================================================================
# API Endpoints
# =============================================================================


def get_runtime() -> AsyncLocalRuntime:
    """Get AsyncLocalRuntime for dependency injection."""
    return AsyncLocalRuntime()


@router.get("/organization", response_model=OrganizationSettingsResponse)
async def get_organization_settings(
    current_user: dict = Depends(get_current_user),
    runtime: AsyncLocalRuntime = Depends(get_runtime),
):
    """
    Get organization settings.

    Returns the settings for the current user's organization.
    """
    org_id = current_user["organization_id"]

    # Get organization to retrieve settings JSON
    workflow = WorkflowBuilder()
    workflow.add_node(
        "OrganizationReadNode",
        "read_org",
        {"id": org_id},
    )

    results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
    org = results.get("read_org")

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    # Parse settings from JSON field or use defaults
    settings_json = org.get("settings")
    if settings_json:
        try:
            settings = json.loads(settings_json)
        except json.JSONDecodeError:
            settings = {}
    else:
        settings = {}

    now = datetime.now(UTC).isoformat()

    return OrganizationSettingsResponse(
        id=f"orgsettings-{org_id[:8]}",
        organizationId=org_id,
        name=org.get("name", ""),
        theme=settings.get("theme", "system"),
        timezone=settings.get("timezone", "UTC"),
        language=settings.get("language", "en"),
        notifications=NotificationSettings(**settings.get("notifications", {})),
        security=SecuritySettings(**settings.get("security", {})),
        createdAt=org.get("created_at", now),
        updatedAt=org.get("updated_at", now),
    )


@router.put("/organization", response_model=OrganizationSettingsResponse)
async def update_organization_settings(
    request: UpdateOrganizationSettingsRequest,
    current_user: dict = Depends(get_current_user),
    runtime: AsyncLocalRuntime = Depends(get_runtime),
):
    """
    Update organization settings.

    Only org_owner or org_admin can update organization settings.
    """
    if current_user["role"] not in ["org_owner", "org_admin", "tenant_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update organization settings",
        )

    org_id = current_user["organization_id"]

    # Get current organization
    read_workflow = WorkflowBuilder()
    read_workflow.add_node(
        "OrganizationReadNode",
        "read_org",
        {"id": org_id},
    )

    results, _ = await runtime.execute_workflow_async(read_workflow.build(), inputs={})
    org = results.get("read_org")

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    # Parse existing settings
    settings_json = org.get("settings")
    if settings_json:
        try:
            settings = json.loads(settings_json)
        except json.JSONDecodeError:
            settings = {}
    else:
        settings = {}

    # Update settings with provided values
    update_data = request.model_dump(exclude_unset=True)

    if "theme" in update_data:
        settings["theme"] = update_data["theme"]
    if "timezone" in update_data:
        settings["timezone"] = update_data["timezone"]
    if "language" in update_data:
        settings["language"] = update_data["language"]
    if "notifications" in update_data:
        current_notifications = settings.get("notifications", {})
        current_notifications.update(update_data["notifications"])
        settings["notifications"] = current_notifications
    if "security" in update_data:
        current_security = settings.get("security", {})
        current_security.update(update_data["security"])
        settings["security"] = current_security

    now = datetime.now(UTC).isoformat()

    # Build update fields
    update_fields = {
        "settings": json.dumps(settings),
        "updated_at": now,
    }

    # Update name if provided
    if "name" in update_data and update_data["name"]:
        update_fields["name"] = update_data["name"]

    # Update organization
    update_workflow = WorkflowBuilder()
    update_workflow.add_node(
        "OrganizationUpdateNode",
        "update_org",
        {
            "filter": {"id": org_id},
            "fields": update_fields,
        },
    )

    await runtime.execute_workflow_async(update_workflow.build(), inputs={})

    return OrganizationSettingsResponse(
        id=f"orgsettings-{org_id[:8]}",
        organizationId=org_id,
        name=update_fields.get("name", org.get("name", "")),
        theme=settings.get("theme", "system"),
        timezone=settings.get("timezone", "UTC"),
        language=settings.get("language", "en"),
        notifications=NotificationSettings(**settings.get("notifications", {})),
        security=SecuritySettings(**settings.get("security", {})),
        createdAt=org.get("created_at", now),
        updatedAt=now,
    )


@router.get("/user", response_model=UserSettingsResponse)
async def get_user_settings(
    current_user: dict = Depends(get_current_user),
    runtime: AsyncLocalRuntime = Depends(get_runtime),
):
    """
    Get current user's settings.
    """
    user_id = current_user["id"]

    # Get user to retrieve settings JSON
    workflow = WorkflowBuilder()
    workflow.add_node(
        "UserReadNode",
        "read_user",
        {"id": user_id},
    )

    results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
    user = results.get("read_user")

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Parse settings from JSON field or use defaults
    settings_json = user.get("settings")
    if settings_json:
        try:
            settings = json.loads(settings_json)
        except json.JSONDecodeError:
            settings = {}
    else:
        settings = {}

    now = datetime.now(UTC).isoformat()

    return UserSettingsResponse(
        id=f"usersettings-{user_id[:8]}",
        userId=user_id,
        theme=settings.get("theme", "system"),
        timezone=settings.get("timezone", "UTC"),
        language=settings.get("language", "en"),
        notifications=NotificationSettings(**settings.get("notifications", {})),
        createdAt=user.get("created_at", now),
        updatedAt=user.get("updated_at", now),
    )


@router.put("/user", response_model=UserSettingsResponse)
async def update_user_settings(
    request: UpdateUserSettingsRequest,
    current_user: dict = Depends(get_current_user),
    runtime: AsyncLocalRuntime = Depends(get_runtime),
):
    """
    Update current user's settings.
    """
    user_id = current_user["id"]

    # Get current user
    read_workflow = WorkflowBuilder()
    read_workflow.add_node(
        "UserReadNode",
        "read_user",
        {"id": user_id},
    )

    results, _ = await runtime.execute_workflow_async(read_workflow.build(), inputs={})
    user = results.get("read_user")

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Parse existing settings
    settings_json = user.get("settings")
    if settings_json:
        try:
            settings = json.loads(settings_json)
        except json.JSONDecodeError:
            settings = {}
    else:
        settings = {}

    # Update settings with provided values
    update_data = request.model_dump(exclude_unset=True)

    if "theme" in update_data:
        settings["theme"] = update_data["theme"]
    if "timezone" in update_data:
        settings["timezone"] = update_data["timezone"]
    if "language" in update_data:
        settings["language"] = update_data["language"]
    if "notifications" in update_data:
        current_notifications = settings.get("notifications", {})
        current_notifications.update(update_data["notifications"])
        settings["notifications"] = current_notifications

    now = datetime.now(UTC).isoformat()

    # Update user settings
    update_workflow = WorkflowBuilder()
    update_workflow.add_node(
        "UserUpdateNode",
        "update_user",
        {
            "filter": {"id": user_id},
            "fields": {
                "settings": json.dumps(settings),
                "updated_at": now,
            },
        },
    )

    await runtime.execute_workflow_async(update_workflow.build(), inputs={})

    return UserSettingsResponse(
        id=f"usersettings-{user_id[:8]}",
        userId=user_id,
        theme=settings.get("theme", "system"),
        timezone=settings.get("timezone", "UTC"),
        language=settings.get("language", "en"),
        notifications=NotificationSettings(**settings.get("notifications", {})),
        createdAt=user.get("created_at", now),
        updatedAt=now,
    )
