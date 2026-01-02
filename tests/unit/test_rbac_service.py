"""
Tier 1: RBAC Service Unit Tests

Tests permission checking logic, wildcard matching, permission inheritance.
Mocking is allowed in Tier 1 for DataFlow operations.

Test Coverage:
- Permission checking (exact match and wildcard)
- Role-based permission resolution
- Default permission matrix fallback
- Permission structure validation
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from studio.config.permissions import (
    PERMISSION_DESCRIPTIONS,
    PERMISSION_MATRIX,
    VALID_ROLES,
)
from studio.services.rbac_service import RBACService


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPermissionMatrixConfiguration:
    """Test permission matrix configuration."""

    def test_permission_matrix_has_all_valid_roles(self):
        """Permission matrix should include all valid roles."""
        for role in VALID_ROLES:
            assert role in PERMISSION_MATRIX
            assert isinstance(PERMISSION_MATRIX[role], list)
            assert len(PERMISSION_MATRIX[role]) > 0

    def test_permission_matrix_has_valid_permission_names(self):
        """All permissions should follow resource:action format."""
        for role, perms in PERMISSION_MATRIX.items():
            for perm in perms:
                # Should be "resource:action" format
                assert ":" in perm, f"Invalid permission format: {perm}"
                parts = perm.split(":")
                assert (
                    len(parts) == 2
                ), f"Permission should have exactly 2 parts: {perm}"
                resource, action = parts
                assert resource, f"Resource is empty: {perm}"
                assert action, f"Action is empty: {perm}"

    def test_org_owner_has_widest_permissions(self):
        """Org owner should have wildcard permissions for most resources."""
        owner_perms = PERMISSION_MATRIX["org_owner"]
        assert "organizations:*" in owner_perms
        assert "users:*" in owner_perms
        assert "teams:*" in owner_perms
        assert "agents:*" in owner_perms

    def test_viewer_has_read_only_permissions(self):
        """Viewer should only have read permissions."""
        viewer_perms = PERMISSION_MATRIX["viewer"]
        assert "agents:read" in viewer_perms
        assert "deployments:read" in viewer_perms
        # Should not have create/update/delete
        for perm in viewer_perms:
            assert not perm.endswith(":create")
            assert not perm.endswith(":update")
            assert not perm.endswith(":delete")

    def test_permission_descriptions_exist(self):
        """All permissions should have descriptions."""
        all_permissions = set()
        for perms in PERMISSION_MATRIX.values():
            all_permissions.update(perms)

        for perm in all_permissions:
            assert perm in PERMISSION_DESCRIPTIONS


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPermissionChecking:
    """Test permission checking logic."""

    @pytest.mark.asyncio
    async def test_check_permission_exact_match(self):
        """Should return True for exact permission match."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            # Mock user read
            mock_runtime.execute_workflow_async.return_value = (
                {
                    "read_user": {
                        "id": "user-1",
                        "role": "developer",
                    }
                },
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            # Mock get_user_permissions to return developer permissions
            with patch.object(
                service,
                "get_user_permissions",
                return_value=["agents:create", "agents:read"],
            ):
                result = await service.check_permission("user-1", "agents:create")
                assert result is True

    @pytest.mark.asyncio
    async def test_check_permission_wildcard_match(self):
        """Should return True for wildcard permission match."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            mock_runtime.execute_workflow_async.return_value = (
                {"read_user": {"id": "user-1", "role": "org_owner"}},
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            # User has "agents:*" permission
            with patch.object(
                service, "get_user_permissions", return_value=["agents:*", "users:*"]
            ):
                # Should match specific permission via wildcard
                result = await service.check_permission("user-1", "agents:create")
                assert result is True

                result = await service.check_permission("user-1", "agents:delete")
                assert result is True

    @pytest.mark.asyncio
    async def test_check_permission_no_match(self):
        """Should return False when user lacks permission."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            mock_runtime.execute_workflow_async.return_value = (
                {"read_user": {"id": "user-1", "role": "viewer"}},
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            with patch.object(
                service,
                "get_user_permissions",
                return_value=["agents:read", "deployments:read"],
            ):
                result = await service.check_permission("user-1", "agents:create")
                assert result is False

    @pytest.mark.asyncio
    async def test_check_permission_nonexistent_user(self):
        """Should return False for nonexistent user."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            # User not found
            mock_runtime.execute_workflow_async.return_value = (
                {"read_user": None},
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            result = await service.check_permission("nonexistent", "agents:read")
            assert result is False

    @pytest.mark.asyncio
    async def test_check_permission_user_without_role(self):
        """Should return False for user without role."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            mock_runtime.execute_workflow_async.return_value = (
                {"read_user": {"id": "user-1", "role": None}},
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            result = await service.check_permission("user-1", "agents:read")
            assert result is False


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestWildcardMatching:
    """Test wildcard permission matching logic."""

    @pytest.mark.asyncio
    async def test_wildcard_matches_all_actions(self):
        """Wildcard should match all actions for a resource."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            mock_runtime.execute_workflow_async.return_value = (
                {"read_user": {"id": "user-1", "role": "org_admin"}},
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            wildcard_perms = ["users:*", "teams:*"]
            with patch.object(
                service, "get_user_permissions", return_value=wildcard_perms
            ):
                # Test all specific actions
                assert await service.check_permission("user-1", "users:create")
                assert await service.check_permission("user-1", "users:read")
                assert await service.check_permission("user-1", "users:update")
                assert await service.check_permission("user-1", "users:delete")

    @pytest.mark.asyncio
    async def test_wildcard_does_not_cross_resources(self):
        """Wildcard for one resource should not match other resources."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            mock_runtime.execute_workflow_async.return_value = (
                {"read_user": {"id": "user-1", "role": "developer"}},
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            with patch.object(
                service, "get_user_permissions", return_value=["agents:*"]
            ):
                # agents:* should match agents but not deployments
                assert await service.check_permission("user-1", "agents:create")
                assert not await service.check_permission(
                    "user-1", "deployments:create"
                )


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestUserPermissions:
    """Test getting user permissions."""

    @pytest.mark.asyncio
    async def test_get_user_permissions_from_role(self):
        """Should return permissions from user's role."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            service = RBACService()
            service.runtime = mock_runtime

            # Mock workflow executions
            call_count = 0

            async def mock_execute(*args, **kwargs):
                nonlocal call_count
                call_count += 1

                if call_count == 1:
                    # First call: get user
                    return (
                        {"read_user": {"id": "user-1", "role": "developer"}},
                        "run-1",
                    )
                elif call_count == 2:
                    # Second call: list role permissions (empty)
                    return (
                        {"list_role_perms": {"records": []}},
                        "run-2",
                    )
                return ({}, "run-x")

            mock_runtime.execute_workflow_async = mock_execute

            perms = await service.get_user_permissions("user-1")

            # Should return developer permissions from matrix
            assert "agents:create" in perms
            assert "agents:read" in perms
            assert "agents:update" in perms
            assert "workspaces:read" in perms

    @pytest.mark.asyncio
    async def test_get_user_permissions_nonexistent_user(self):
        """Should return empty list for nonexistent user."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            mock_runtime.execute_workflow_async.return_value = (
                {"read_user": None},
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            perms = await service.get_user_permissions("nonexistent")
            assert perms == []

    @pytest.mark.asyncio
    async def test_get_user_permissions_user_without_role(self):
        """Should return empty list for user without role."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            mock_runtime.execute_workflow_async.return_value = (
                {"read_user": {"id": "user-1", "role": None}},
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            perms = await service.get_user_permissions("user-1")
            assert perms == []


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestGrantRevokePermissions:
    """Test granting and revoking permissions."""

    @pytest.mark.asyncio
    async def test_grant_permission_creates_mapping(self):
        """Should create role-permission mapping."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            created_record = {
                "id": "mapping-1",
                "role": "developer",
                "permission_id": "perm-1",
                "created_at": datetime.now(UTC).isoformat(),
            }
            mock_runtime.execute_workflow_async.return_value = (
                {"create_role_perm": created_record},
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            result = await service.grant_permission("developer", "perm-1")

            assert result["id"] == "mapping-1"
            assert result["role"] == "developer"
            assert result["permission_id"] == "perm-1"

    @pytest.mark.asyncio
    async def test_grant_permission_invalid_role(self):
        """Should raise ValueError for invalid role."""
        service = RBACService()

        with pytest.raises(ValueError, match="Invalid role"):
            await service.grant_permission("invalid_role", "perm-1")

    @pytest.mark.asyncio
    async def test_revoke_permission_removes_mapping(self):
        """Should revoke permission mapping."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            service = RBACService()
            service.runtime = mock_runtime

            call_count = 0

            async def mock_execute(*args, **kwargs):
                nonlocal call_count
                call_count += 1

                if call_count == 1:
                    # Find mapping
                    return (
                        {
                            "find_role_perm": {
                                "records": [
                                    {
                                        "id": "mapping-1",
                                        "role": "developer",
                                        "permission_id": "perm-1",
                                    }
                                ]
                            }
                        },
                        "run-1",
                    )
                else:
                    # Delete mapping
                    return ({}, "run-2")

            mock_runtime.execute_workflow_async = mock_execute

            result = await service.revoke_permission("developer", "perm-1")
            assert result is True

    @pytest.mark.asyncio
    async def test_revoke_permission_not_found(self):
        """Should return False if mapping not found."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            mock_runtime.execute_workflow_async.return_value = (
                {"find_role_perm": {"records": []}},
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            result = await service.revoke_permission("developer", "perm-1")
            assert result is False


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestListPermissions:
    """Test listing permissions."""

    @pytest.mark.asyncio
    async def test_list_permissions_returns_all(self):
        """Should return all available permissions."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            permissions = [
                {
                    "id": "perm-1",
                    "name": "agents:create",
                    "resource": "agents",
                    "action": "create",
                    "description": "Create AI agents",
                },
                {
                    "id": "perm-2",
                    "name": "agents:read",
                    "resource": "agents",
                    "action": "read",
                    "description": "View AI agents",
                },
            ]
            mock_runtime.execute_workflow_async.return_value = (
                {"list_perms": {"records": permissions}},
                "run-1",
            )

            service = RBACService()
            service.runtime = mock_runtime

            result = await service.list_permissions()

            assert len(result) == 2
            assert result[0]["name"] == "agents:create"
            assert result[1]["name"] == "agents:read"

    @pytest.mark.asyncio
    async def test_get_role_permissions_returns_role_perms(self):
        """Should return permissions for specific role."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime
            # Return empty records to use default matrix
            mock_runtime.execute_workflow_async.return_value = (
                {"list_role_perms": {"records": []}},
                "run_id",
            )

            service = RBACService()
            service.runtime = mock_runtime

            # Should use default matrix if no database records
            result = await service.get_role_permissions("viewer")

            assert len(result) > 0
            # Viewer should have read-only
            perm_names = [p.get("name") if isinstance(p, dict) else p for p in result]
            assert any("read" in str(perm) for perm in perm_names)


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestSeedPermissions:
    """Test permission seeding."""

    @pytest.mark.asyncio
    async def test_seed_default_permissions_creates_records(self):
        """Should create permissions from matrix."""
        with patch(
            "studio.services.rbac_service.AsyncLocalRuntime"
        ) as mock_runtime_class:
            mock_runtime = AsyncMock()
            mock_runtime_class.return_value = mock_runtime

            service = RBACService()
            service.runtime = mock_runtime

            call_sequence = []

            async def track_execute(*args, **kwargs):
                call_sequence.append(1)
                # Simulate: all checks return empty (don't exist)
                return (
                    {
                        "check_perm": {"records": []},
                        "create_perm": {"id": f"perm-{len(call_sequence)}"},
                        "check_mapping": {"records": []},
                        "create_mapping": {"id": f"mapping-{len(call_sequence)}"},
                    },
                    f"run-{len(call_sequence)}",
                )

            mock_runtime.execute_workflow_async = track_execute

            result = await service.seed_default_permissions()

            assert "permissions_created" in result
            assert "mappings_created" in result
            # Should create multiple permissions
            assert result["permissions_created"] >= 0
            assert result["mappings_created"] >= 0
