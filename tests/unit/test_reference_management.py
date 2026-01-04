"""
Tier 1: Reference Management Unit Tests

Tests condition validation, resource reference extraction, and reference
status checking for ABAC policy conditions.

Test Coverage:
- Resource reference extraction from conditions
- Reference validation logic
- Condition validation with errors and warnings
- Edge cases and error handling
"""

import pytest
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

from studio.services.abac_service import ABACService


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestExtractResourceReferences:
    """Test resource reference extraction from conditions."""

    def test_extract_empty_conditions(self):
        """Test extracting references from empty conditions."""
        service = ABACService()
        refs = service._extract_resource_references({})
        assert refs == []

    def test_extract_no_references(self):
        """Test conditions without any resource references."""
        service = ABACService()
        conditions = {
            "all": [
                {"field": "resource.status", "op": "eq", "value": "active"},
                {"field": "user.role", "op": "in", "value": ["admin", "editor"]},
            ]
        }
        refs = service._extract_resource_references(conditions)
        assert refs == []

    def test_extract_single_reference(self):
        """Test extracting a single resource reference."""
        service = ABACService()
        conditions = {
            "all": [
                {
                    "field": "resource.agent_id",
                    "op": "eq",
                    "value": {
                        "$ref": "resource",
                        "type": "agent",
                        "selector": {"id": "agent-123"},
                        "display": {"name": "My Agent"},
                    },
                }
            ]
        }
        refs = service._extract_resource_references(conditions)
        assert len(refs) == 1
        assert refs[0]["type"] == "agent"
        assert refs[0]["id"] == "agent-123"
        assert refs[0]["name"] == "My Agent"

    def test_extract_multiple_references(self):
        """Test extracting multiple resource references."""
        service = ABACService()
        conditions = {
            "all": [
                {
                    "field": "resource.agent_id",
                    "op": "eq",
                    "value": {
                        "$ref": "resource",
                        "type": "agent",
                        "selector": {"id": "agent-1"},
                        "display": {"name": "Agent One"},
                    },
                },
                {
                    "field": "resource.team_id",
                    "op": "eq",
                    "value": {
                        "$ref": "resource",
                        "type": "team",
                        "selector": {"id": "team-1"},
                        "display": {"name": "Team One"},
                    },
                },
            ]
        }
        refs = service._extract_resource_references(conditions)
        assert len(refs) == 2
        assert any(r["type"] == "agent" for r in refs)
        assert any(r["type"] == "team" for r in refs)

    def test_extract_reference_with_multiple_ids(self):
        """Test extracting reference with multiple IDs (e.g., in operator)."""
        service = ABACService()
        conditions = {
            "all": [
                {
                    "field": "resource.agent_id",
                    "op": "in",
                    "value": {
                        "$ref": "resource",
                        "type": "agent",
                        "selector": {"ids": ["agent-1", "agent-2", "agent-3"]},
                        "display": {"name": "Selected Agents"},
                    },
                }
            ]
        }
        refs = service._extract_resource_references(conditions)
        assert len(refs) == 1
        assert refs[0]["ids"] == ["agent-1", "agent-2", "agent-3"]

    def test_extract_nested_any_conditions(self):
        """Test extracting references from nested any conditions."""
        service = ABACService()
        conditions = {
            "any": [
                {
                    "field": "resource.agent_id",
                    "op": "eq",
                    "value": {
                        "$ref": "resource",
                        "type": "agent",
                        "selector": {"id": "agent-1"},
                        "display": {"name": "Agent One"},
                    },
                },
                {
                    "field": "resource.agent_id",
                    "op": "eq",
                    "value": {
                        "$ref": "resource",
                        "type": "agent",
                        "selector": {"id": "agent-2"},
                        "display": {"name": "Agent Two"},
                    },
                },
            ]
        }
        refs = service._extract_resource_references(conditions)
        assert len(refs) == 2

    def test_extract_deeply_nested_reference(self):
        """Test extracting reference from deeply nested structure."""
        service = ABACService()
        conditions = {
            "all": [
                {"field": "resource.status", "op": "eq", "value": "active"},
                {
                    "any": [
                        {
                            "field": "resource.team_id",
                            "op": "eq",
                            "value": {
                                "$ref": "resource",
                                "type": "team",
                                "selector": {"id": "team-deep"},
                                "display": {"name": "Deep Team"},
                            },
                        },
                    ]
                },
            ]
        }
        refs = service._extract_resource_references(conditions)
        assert len(refs) == 1
        assert refs[0]["id"] == "team-deep"

    def test_extract_reference_without_display_name(self):
        """Test extracting reference without display name."""
        service = ABACService()
        conditions = {
            "all": [
                {
                    "field": "resource.agent_id",
                    "op": "eq",
                    "value": {
                        "$ref": "resource",
                        "type": "agent",
                        "selector": {"id": "agent-no-name"},
                    },
                }
            ]
        }
        refs = service._extract_resource_references(conditions)
        assert len(refs) == 1
        assert refs[0]["id"] == "agent-no-name"
        assert refs[0]["name"] is None

    def test_extract_ignores_non_resource_refs(self):
        """Test that non-resource $ref values are ignored."""
        service = ABACService()
        conditions = {
            "all": [
                {
                    "field": "resource.config",
                    "op": "eq",
                    "value": {
                        "$ref": "config",  # Not 'resource'
                        "type": "settings",
                        "selector": {"key": "value"},
                    },
                }
            ]
        }
        refs = service._extract_resource_references(conditions)
        assert len(refs) == 0

    def test_extract_handles_list_values(self):
        """Test extraction from list values."""
        service = ABACService()
        conditions = {
            "all": [
                {
                    "field": "resource.tags",
                    "op": "in",
                    "value": [
                        {
                            "$ref": "resource",
                            "type": "tag",
                            "selector": {"id": "tag-1"},
                            "display": {"name": "Tag One"},
                        },
                        {
                            "$ref": "resource",
                            "type": "tag",
                            "selector": {"id": "tag-2"},
                            "display": {"name": "Tag Two"},
                        },
                    ],
                }
            ]
        }
        refs = service._extract_resource_references(conditions)
        assert len(refs) == 2

    def test_extract_all_resource_types(self):
        """Test extraction of various resource types."""
        service = ABACService()
        resource_types = ["agent", "deployment", "pipeline", "gateway", "team", "user"]

        for resource_type in resource_types:
            conditions = {
                "all": [
                    {
                        "field": f"resource.{resource_type}_id",
                        "op": "eq",
                        "value": {
                            "$ref": "resource",
                            "type": resource_type,
                            "selector": {"id": f"{resource_type}-123"},
                            "display": {"name": f"Test {resource_type.title()}"},
                        },
                    }
                ]
            }
            refs = service._extract_resource_references(conditions)
            assert len(refs) == 1
            assert refs[0]["type"] == resource_type


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestValidateResourceReference:
    """Test resource reference validation."""

    @pytest.fixture
    def service_with_mock_runtime(self):
        """Create ABAC service with mocked runtime for unit testing."""
        service = ABACService()
        service.runtime = AsyncMock()
        return service

    @pytest.mark.asyncio
    async def test_validate_existing_resource(self, service_with_mock_runtime):
        """Test validating a reference to an existing resource."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"check_resource": {"id": "agent-123", "name": "Test Agent"}}, "run-1")
        )

        ref = {"type": "agent", "id": "agent-123", "name": "Test Agent"}
        result = await service._validate_resource_reference(ref, "org-123")

        assert result["status"] == "valid"
        assert result["type"] == "agent"
        assert result["id"] == "agent-123"
        assert result["name"] == "Test Agent"
        assert "validated_at" in result

    @pytest.mark.asyncio
    async def test_validate_orphaned_resource(self, service_with_mock_runtime):
        """Test validating a reference to a deleted resource."""
        service = service_with_mock_runtime
        # Simulate resource not found (ReadNode returns found=False)
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"check_resource": {"id": "agent-deleted", "found": False}}, "run-1")
        )

        ref = {"type": "agent", "id": "agent-deleted", "name": "Deleted Agent"}
        result = await service._validate_resource_reference(ref, "org-123")

        assert result["status"] == "orphaned"
        assert result["type"] == "agent"
        assert result["id"] == "agent-deleted"

    @pytest.mark.asyncio
    async def test_validate_multiple_ids_all_exist(self, service_with_mock_runtime):
        """Test validating reference with multiple IDs, all existing."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"check_resource": {"id": "agent", "name": "Agent"}}, "run-1")
        )

        ref = {"type": "agent", "ids": ["agent-1", "agent-2", "agent-3"], "name": "Agents"}
        result = await service._validate_resource_reference(ref, "org-123")

        assert result["status"] == "valid"
        assert result["ids"] == ["agent-1", "agent-2", "agent-3"]

    @pytest.mark.asyncio
    async def test_validate_multiple_ids_some_missing(self, service_with_mock_runtime):
        """Test validating reference with multiple IDs, some missing."""
        service = service_with_mock_runtime

        call_count = [0]

        async def mock_execute(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 2:
                # Second resource is missing
                return ({"check_resource": {"id": "agent-2", "found": False}}, "run-2")
            return ({"check_resource": {"id": f"agent-{call_count[0]}", "name": "Agent"}}, f"run-{call_count[0]}")

        service.runtime.execute_workflow_async = mock_execute

        ref = {"type": "agent", "ids": ["agent-1", "agent-2", "agent-3"], "name": "Agents"}
        result = await service._validate_resource_reference(ref, "org-123")

        assert result["status"] == "orphaned"

    @pytest.mark.asyncio
    async def test_validate_unknown_resource_type(self, service_with_mock_runtime):
        """Test validating reference with unknown resource type."""
        service = service_with_mock_runtime

        ref = {"type": "unknown_type", "id": "resource-123", "name": "Unknown Resource"}
        result = await service._validate_resource_reference(ref, "org-123")

        # Unknown types should be treated as valid to avoid false positives
        assert result["status"] == "valid"

    @pytest.mark.asyncio
    async def test_validate_reference_without_id(self, service_with_mock_runtime):
        """Test validating reference without ID."""
        service = service_with_mock_runtime

        ref = {"type": "agent", "name": "No ID Reference"}
        result = await service._validate_resource_reference(ref, "org-123")

        assert result["status"] == "orphaned"
        assert result["id"] is None

    @pytest.mark.asyncio
    async def test_validate_reference_on_error(self, service_with_mock_runtime):
        """Test validation handles errors gracefully."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            side_effect=Exception("Database connection failed")
        )

        ref = {"type": "agent", "id": "agent-123", "name": "Test Agent"}
        result = await service._validate_resource_reference(ref, "org-123")

        # On error, assume exists to avoid false orphans
        assert result["status"] == "valid"


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestValidateConditions:
    """Test condition validation."""

    @pytest.fixture
    def service_with_mock_runtime(self):
        """Create ABAC service with mocked runtime for unit testing."""
        service = ABACService()
        service.runtime = AsyncMock()
        return service

    @pytest.mark.asyncio
    async def test_validate_empty_conditions(self, service_with_mock_runtime):
        """Test validating empty conditions."""
        service = service_with_mock_runtime

        result = await service.validate_conditions({}, "org-123")

        assert result["is_valid"] is True
        assert result["errors"] == []
        assert result["warnings"] == []
        assert result["references"] == []

    @pytest.mark.asyncio
    async def test_validate_conditions_no_references(self, service_with_mock_runtime):
        """Test validating conditions without resource references."""
        service = service_with_mock_runtime

        conditions = {
            "all": [
                {"field": "resource.status", "op": "eq", "value": "active"},
                {"field": "user.role", "op": "in", "value": ["admin", "editor"]},
            ]
        }

        result = await service.validate_conditions(conditions, "org-123")

        assert result["is_valid"] is True
        assert result["errors"] == []
        assert result["warnings"] == []
        assert result["references"] == []

    @pytest.mark.asyncio
    async def test_validate_conditions_all_valid_references(self, service_with_mock_runtime):
        """Test validating conditions with all valid references."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"check_resource": {"id": "agent-123", "name": "Agent"}}, "run-1")
        )

        conditions = {
            "all": [
                {
                    "field": "resource.agent_id",
                    "op": "eq",
                    "value": {
                        "$ref": "resource",
                        "type": "agent",
                        "selector": {"id": "agent-123"},
                        "display": {"name": "Test Agent"},
                    },
                }
            ]
        }

        result = await service.validate_conditions(conditions, "org-123")

        assert result["is_valid"] is True
        assert result["errors"] == []
        assert result["warnings"] == []
        assert len(result["references"]) == 1
        assert result["references"][0]["status"] == "valid"

    @pytest.mark.asyncio
    async def test_validate_conditions_with_orphaned_reference(self, service_with_mock_runtime):
        """Test validating conditions with orphaned reference."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"check_resource": {"id": "agent-deleted", "found": False}}, "run-1")
        )

        conditions = {
            "all": [
                {
                    "field": "resource.agent_id",
                    "op": "eq",
                    "value": {
                        "$ref": "resource",
                        "type": "agent",
                        "selector": {"id": "agent-deleted"},
                        "display": {"name": "Deleted Agent"},
                    },
                }
            ]
        }

        result = await service.validate_conditions(conditions, "org-123")

        assert result["is_valid"] is True  # Orphaned refs generate warnings, not errors
        assert result["errors"] == []
        assert len(result["warnings"]) == 1
        assert "not found" in result["warnings"][0].lower()
        assert len(result["references"]) == 1
        assert result["references"][0]["status"] == "orphaned"

    @pytest.mark.asyncio
    async def test_validate_conditions_mixed_references(self, service_with_mock_runtime):
        """Test validating conditions with mixed valid and orphaned references."""
        service = service_with_mock_runtime

        call_count = [0]

        async def mock_execute(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return ({"check_resource": {"id": "agent-1", "name": "Agent One"}}, "run-1")
            else:
                return ({"check_resource": {"id": "agent-2", "found": False}}, "run-2")

        service.runtime.execute_workflow_async = mock_execute

        conditions = {
            "all": [
                {
                    "field": "resource.agent_id",
                    "op": "in",
                    "value": [
                        {
                            "$ref": "resource",
                            "type": "agent",
                            "selector": {"id": "agent-1"},
                            "display": {"name": "Agent One"},
                        },
                        {
                            "$ref": "resource",
                            "type": "agent",
                            "selector": {"id": "agent-2"},
                            "display": {"name": "Agent Two"},
                        },
                    ],
                }
            ]
        }

        result = await service.validate_conditions(conditions, "org-123")

        assert len(result["warnings"]) == 1  # One orphaned
        assert len(result["references"]) == 2
        valid_refs = [r for r in result["references"] if r["status"] == "valid"]
        orphaned_refs = [r for r in result["references"] if r["status"] == "orphaned"]
        assert len(valid_refs) == 1
        assert len(orphaned_refs) == 1


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestGetPolicyReferences:
    """Test getting policy references."""

    @pytest.fixture
    def service_with_mock_runtime(self):
        """Create ABAC service with mocked runtime for unit testing."""
        service = ABACService()
        service.runtime = AsyncMock()
        return service

    @pytest.mark.asyncio
    async def test_get_references_nonexistent_policy(self, service_with_mock_runtime):
        """Test getting references for non-existent policy."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"read_policy": {"id": "policy-123", "found": False}}, "run-1")
        )

        refs = await service.get_policy_references("policy-123", "org-123")

        assert refs == []

    @pytest.mark.asyncio
    async def test_get_references_policy_no_conditions(self, service_with_mock_runtime):
        """Test getting references for policy with no conditions."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=(
                {
                    "read_policy": {
                        "id": "policy-123",
                        "name": "Test Policy",
                        "conditions": "{}",
                    }
                },
                "run-1",
            )
        )

        refs = await service.get_policy_references("policy-123", "org-123")

        assert refs == []

    @pytest.mark.asyncio
    async def test_get_references_policy_with_references(self, service_with_mock_runtime):
        """Test getting references for policy with references."""
        service = service_with_mock_runtime

        import json
        conditions = {
            "all": [
                {
                    "field": "resource.agent_id",
                    "op": "eq",
                    "value": {
                        "$ref": "resource",
                        "type": "agent",
                        "selector": {"id": "agent-123"},
                        "display": {"name": "Test Agent"},
                    },
                }
            ]
        }

        call_count = [0]

        async def mock_execute(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                # First call: read policy
                return (
                    {
                        "read_policy": {
                            "id": "policy-123",
                            "name": "Test Policy",
                            "conditions": json.dumps(conditions),
                        }
                    },
                    "run-1",
                )
            else:
                # Subsequent calls: check resource
                return ({"check_resource": {"id": "agent-123", "name": "Agent"}}, f"run-{call_count[0]}")

        service.runtime.execute_workflow_async = mock_execute

        refs = await service.get_policy_references("policy-123", "org-123")

        assert len(refs) == 1
        assert refs[0]["type"] == "agent"
        assert refs[0]["id"] == "agent-123"
        assert refs[0]["status"] == "valid"


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestCheckResourceExists:
    """Test resource existence checking."""

    @pytest.fixture
    def service_with_mock_runtime(self):
        """Create ABAC service with mocked runtime for unit testing."""
        service = ABACService()
        service.runtime = AsyncMock()
        return service

    @pytest.mark.asyncio
    async def test_check_existing_agent(self, service_with_mock_runtime):
        """Test checking existing agent."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"check_resource": {"id": "agent-123", "name": "Test Agent"}}, "run-1")
        )

        exists = await service._check_resource_exists("agent", "agent-123", "org-123")

        assert exists is True

    @pytest.mark.asyncio
    async def test_check_nonexistent_agent(self, service_with_mock_runtime):
        """Test checking non-existent agent."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"check_resource": {"id": "agent-missing", "found": False}}, "run-1")
        )

        exists = await service._check_resource_exists("agent", "agent-missing", "org-123")

        assert exists is False

    @pytest.mark.asyncio
    async def test_check_unknown_resource_type(self, service_with_mock_runtime):
        """Test checking unknown resource type returns True."""
        service = service_with_mock_runtime

        exists = await service._check_resource_exists("unknown_type", "id-123", "org-123")

        # Unknown types assumed to exist
        assert exists is True

    @pytest.mark.asyncio
    async def test_check_resource_on_exception(self, service_with_mock_runtime):
        """Test resource check on exception returns True."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            side_effect=Exception("Database error")
        )

        exists = await service._check_resource_exists("agent", "agent-123", "org-123")

        # On error, assume exists
        assert exists is True

    @pytest.mark.asyncio
    async def test_check_all_supported_resource_types(self, service_with_mock_runtime):
        """Test checking all supported resource types."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"check_resource": {"id": "resource-123", "name": "Resource"}}, "run-1")
        )

        resource_types = ["agent", "deployment", "pipeline", "gateway", "team", "user", "workspace"]

        for resource_type in resource_types:
            exists = await service._check_resource_exists(resource_type, f"{resource_type}-123", "org-123")
            assert exists is True, f"Failed for resource type: {resource_type}"


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestValidationResultStructure:
    """Test validation result structure and format."""

    @pytest.fixture
    def service_with_mock_runtime(self):
        """Create ABAC service with mocked runtime for unit testing."""
        service = ABACService()
        service.runtime = AsyncMock()
        return service

    @pytest.mark.asyncio
    async def test_validation_result_structure(self, service_with_mock_runtime):
        """Test that validation result has correct structure."""
        service = service_with_mock_runtime

        result = await service.validate_conditions({}, "org-123")

        assert "is_valid" in result
        assert "errors" in result
        assert "warnings" in result
        assert "references" in result
        assert isinstance(result["is_valid"], bool)
        assert isinstance(result["errors"], list)
        assert isinstance(result["warnings"], list)
        assert isinstance(result["references"], list)

    @pytest.mark.asyncio
    async def test_reference_status_structure(self, service_with_mock_runtime):
        """Test that reference status has correct structure."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"check_resource": {"id": "agent-123", "name": "Agent"}}, "run-1")
        )

        conditions = {
            "all": [
                {
                    "field": "resource.agent_id",
                    "op": "eq",
                    "value": {
                        "$ref": "resource",
                        "type": "agent",
                        "selector": {"id": "agent-123"},
                        "display": {"name": "Test Agent"},
                    },
                }
            ]
        }

        result = await service.validate_conditions(conditions, "org-123")

        assert len(result["references"]) == 1
        ref = result["references"][0]
        assert "type" in ref
        assert "id" in ref or "ids" in ref
        assert "status" in ref
        assert "validated_at" in ref
        assert ref["status"] in ["valid", "orphaned", "changed"]

    @pytest.mark.asyncio
    async def test_warning_message_format(self, service_with_mock_runtime):
        """Test that warning messages have informative format."""
        service = service_with_mock_runtime
        service.runtime.execute_workflow_async = AsyncMock(
            return_value=({"check_resource": {"id": "agent-deleted", "found": False}}, "run-1")
        )

        conditions = {
            "all": [
                {
                    "field": "resource.agent_id",
                    "op": "eq",
                    "value": {
                        "$ref": "resource",
                        "type": "agent",
                        "selector": {"id": "agent-deleted"},
                        "display": {"name": "Deleted Agent"},
                    },
                }
            ]
        }

        result = await service.validate_conditions(conditions, "org-123")

        assert len(result["warnings"]) == 1
        warning = result["warnings"][0]
        # Warning should mention the resource type and name/id
        assert "agent" in warning.lower()
        assert "deleted agent" in warning.lower() or "agent-deleted" in warning.lower()
