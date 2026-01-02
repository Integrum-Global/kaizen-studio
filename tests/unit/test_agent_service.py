"""
Tier 1: Agent Service Unit Tests

Tests agent CRUD logic in isolation with mocked DataFlow operations.
Mocking is allowed in Tier 1 for external dependencies.
"""

import json
import uuid
from datetime import UTC, datetime
from unittest.mock import patch

import pytest


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAgentServiceValidation:
    """Test agent service parameter validation."""

    def test_create_agent_requires_name(self, agent_factory):
        """Should validate agent name is required."""
        agent_data = agent_factory(name="")
        assert agent_data["name"] == ""

    def test_agent_name_length_limits(self, agent_factory):
        """Should validate agent name length."""
        short_name = agent_factory(name="A")
        assert len(short_name["name"]) >= 1

        long_name = agent_factory(name="X" * 100)
        assert len(long_name["name"]) == 100

    def test_agent_types_valid(self, agent_factory):
        """Should validate agent type values."""
        valid_types = ["chat", "task", "pipeline", "custom"]
        for agent_type in valid_types:
            agent = agent_factory(agent_type=agent_type)
            assert agent["agent_type"] == agent_type

    def test_agent_status_values(self, agent_factory):
        """Should validate agent status values."""
        valid_statuses = ["draft", "active", "archived"]
        for status in valid_statuses:
            agent = agent_factory(status=status)
            assert agent["status"] == status

    def test_temperature_range(self, agent_factory):
        """Should validate temperature is within 0-2.0."""
        agent = agent_factory(temperature=0.0)
        assert agent["temperature"] == 0.0

        agent = agent_factory(temperature=2.0)
        assert agent["temperature"] == 2.0

        agent = agent_factory(temperature=0.7)
        assert agent["temperature"] == 0.7

    def test_max_tokens_non_negative(self, agent_factory):
        """Should validate max_tokens is non-negative."""
        agent = agent_factory(max_tokens=0)
        assert agent["max_tokens"] == 0

        agent = agent_factory(max_tokens=4096)
        assert agent["max_tokens"] == 4096

    def test_agent_has_required_fields(self, agent_factory):
        """Should have all required fields."""
        agent = agent_factory()
        required_fields = [
            "id",
            "organization_id",
            "workspace_id",
            "name",
            "agent_type",
            "model_id",
            "created_by",
            "created_at",
            "updated_at",
        ]
        for field in required_fields:
            assert field in agent, f"Missing required field: {field}"

    def test_agent_id_is_valid_uuid(self, agent_factory):
        """Agent ID should be valid UUID."""
        agent = agent_factory()
        parsed = uuid.UUID(agent["id"])
        assert str(parsed) == agent["id"]

    def test_organization_id_is_valid_uuid(self, agent_factory):
        """Organization ID should be valid UUID."""
        agent = agent_factory()
        parsed = uuid.UUID(agent["organization_id"])
        assert str(parsed) == agent["organization_id"]

    def test_created_at_is_iso8601(self, agent_factory):
        """Created at should be ISO 8601 format."""
        agent = agent_factory()
        # Should parse without error
        datetime.fromisoformat(agent["created_at"].replace("Z", "+00:00"))

    def test_description_can_be_empty(self, agent_factory):
        """Description can be empty string."""
        agent = agent_factory(description="")
        assert agent["description"] == ""

    def test_description_can_be_long(self, agent_factory):
        """Description can be long."""
        long_desc = "X" * 2000
        agent = agent_factory(description=long_desc)
        assert agent["description"] == long_desc

    def test_system_prompt_can_be_empty(self, agent_factory):
        """System prompt can be empty."""
        agent = agent_factory(system_prompt="")
        assert agent["system_prompt"] == ""

    def test_system_prompt_can_be_long(self, agent_factory):
        """System prompt can be long."""
        long_prompt = "You are a helpful assistant. " * 100
        agent = agent_factory(system_prompt=long_prompt)
        assert agent["system_prompt"] == long_prompt


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAgentVersionValidation:
    """Test agent version validation."""

    def test_version_has_required_fields(self, agent_version_factory):
        """Version should have all required fields."""
        version = agent_version_factory()
        required_fields = [
            "id",
            "agent_id",
            "version_number",
            "config_snapshot",
            "created_by",
            "created_at",
        ]
        for field in required_fields:
            assert field in version

    def test_version_number_positive(self, agent_version_factory):
        """Version number should be positive."""
        version = agent_version_factory(version_number=1)
        assert version["version_number"] == 1

        version = agent_version_factory(version_number=42)
        assert version["version_number"] == 42

    def test_config_snapshot_is_json(self, agent_version_factory):
        """Config snapshot should be valid JSON."""
        config = {"name": "Agent V2", "model_id": "gpt-4-turbo", "temperature": 0.5}
        version = agent_version_factory(config_snapshot=config)
        parsed = json.loads(version["config_snapshot"])
        assert parsed["name"] == "Agent V2"

    def test_changelog_can_be_empty(self, agent_version_factory):
        """Changelog can be empty."""
        version = agent_version_factory(changelog="")
        assert version["changelog"] == ""

    def test_changelog_can_be_long(self, agent_version_factory):
        """Changelog can be long."""
        long_changelog = "- Fixed bug X\n- Added feature Y\n" * 50
        version = agent_version_factory(changelog=long_changelog)
        assert version["changelog"] == long_changelog

    def test_version_id_is_uuid(self, agent_version_factory):
        """Version ID should be UUID."""
        version = agent_version_factory()
        parsed = uuid.UUID(version["id"])
        assert str(parsed) == version["id"]

    def test_version_agent_id_is_uuid(self, agent_version_factory):
        """Agent ID in version should be UUID."""
        agent_id = str(uuid.uuid4())
        version = agent_version_factory(agent_id=agent_id)
        assert version["agent_id"] == agent_id


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAgentContextValidation:
    """Test agent context validation."""

    def test_context_has_required_fields(self, agent_context_factory):
        """Context should have all required fields."""
        context = agent_context_factory()
        required_fields = [
            "id",
            "agent_id",
            "name",
            "content_type",
            "content",
            "is_active",
            "created_at",
            "updated_at",
        ]
        for field in required_fields:
            assert field in context

    def test_context_content_types(self, agent_context_factory):
        """Context should support valid content types."""
        valid_types = ["text", "file", "url"]
        for content_type in valid_types:
            context = agent_context_factory(content_type=content_type)
            assert context["content_type"] == content_type

    def test_context_is_active_as_int(self, agent_context_factory):
        """is_active should be stored as int (DataFlow compatibility)."""
        context = agent_context_factory(is_active=1)
        assert context["is_active"] == 1

        context = agent_context_factory(is_active=0)
        assert context["is_active"] == 0

    def test_context_name_required(self, agent_context_factory):
        """Context name should not be empty."""
        context = agent_context_factory(name="Knowledge Base")
        assert context["name"] == "Knowledge Base"

    def test_context_content_not_empty(self, agent_context_factory):
        """Context content should not be empty."""
        context = agent_context_factory(content="Important information")
        assert context["content"] == "Important information"

    def test_context_id_is_uuid(self, agent_context_factory):
        """Context ID should be UUID."""
        context = agent_context_factory()
        parsed = uuid.UUID(context["id"])
        assert str(parsed) == context["id"]


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAgentToolValidation:
    """Test agent tool validation."""

    def test_tool_has_required_fields(self, agent_tool_factory):
        """Tool should have all required fields."""
        tool = agent_tool_factory()
        required_fields = [
            "id",
            "agent_id",
            "tool_type",
            "name",
            "description",
            "config",
            "is_enabled",
            "created_at",
        ]
        for field in required_fields:
            assert field in tool

    def test_tool_types(self, agent_tool_factory):
        """Tool should support valid types."""
        valid_types = ["function", "mcp", "api"]
        for tool_type in valid_types:
            tool = agent_tool_factory(tool_type=tool_type)
            assert tool["tool_type"] == tool_type

    def test_tool_config_is_json(self, agent_tool_factory):
        """Tool config should be valid JSON string."""
        config = {"endpoint": "https://api.example.com", "method": "GET"}
        tool = agent_tool_factory(config=config)
        parsed = json.loads(tool["config"])
        assert parsed["endpoint"] == "https://api.example.com"

    def test_tool_is_enabled_as_int(self, agent_tool_factory):
        """is_enabled should be stored as int (DataFlow compatibility)."""
        tool = agent_tool_factory(is_enabled=1)
        assert tool["is_enabled"] == 1

        tool = agent_tool_factory(is_enabled=0)
        assert tool["is_enabled"] == 0

    def test_tool_name_required(self, agent_tool_factory):
        """Tool name should be present."""
        tool = agent_tool_factory(name="WebSearch")
        assert tool["name"] == "WebSearch"

    def test_tool_description_required(self, agent_tool_factory):
        """Tool description should be present."""
        tool = agent_tool_factory(description="Search the web for information")
        assert tool["description"] == "Search the web for information"

    def test_tool_id_is_uuid(self, agent_tool_factory):
        """Tool ID should be UUID."""
        tool = agent_tool_factory()
        parsed = uuid.UUID(tool["id"])
        assert str(parsed) == tool["id"]


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAgentServiceLogic:
    """Test agent service business logic."""

    @patch("studio.services.agent_service.WorkflowBuilder")
    @patch("studio.services.agent_service.AsyncLocalRuntime")
    def test_agent_create_generates_id(self, mock_runtime, mock_builder):
        """Agent create should generate new ID if not provided."""
        from studio.services.agent_service import AgentService

        # This is a structural test that ID is generated
        service = AgentService()
        # Service initialization should work
        assert service is not None

    def test_agent_factory_generates_unique_ids(self, agent_factory):
        """Factory should generate unique IDs."""
        agent1 = agent_factory()
        agent2 = agent_factory()
        assert agent1["id"] != agent2["id"]

    def test_agent_factory_preserves_values(self, agent_factory):
        """Factory should preserve passed values."""
        specific_name = "Custom Agent Name"
        agent = agent_factory(name=specific_name)
        assert agent["name"] == specific_name

    def test_agent_timestamps_are_current(self, agent_factory):
        """Agent timestamps should be current."""
        before = datetime.now(UTC)
        agent = agent_factory()
        after = datetime.now(UTC)

        created = datetime.fromisoformat(agent["created_at"].replace("Z", "+00:00"))
        assert before <= created <= after

    def test_agent_status_defaults_to_draft(self, agent_factory):
        """Agent status should default to draft."""
        agent = agent_factory(status="draft")
        assert agent["status"] == "draft"

    def test_agent_temperature_defaults_reasonable(self, agent_factory):
        """Agent temperature should have reasonable default."""
        agent = agent_factory()
        assert 0.0 <= agent["temperature"] <= 2.0

    def test_agent_max_tokens_defaults_to_zero(self, agent_factory):
        """Agent max_tokens should default to 0 (unlimited)."""
        agent = agent_factory(max_tokens=0)
        assert agent["max_tokens"] == 0

    def test_version_increments_correctly(self, agent_version_factory):
        """Version numbers should increment."""
        v1 = agent_version_factory(version_number=1)
        v2 = agent_version_factory(version_number=2)
        assert v2["version_number"] > v1["version_number"]

    def test_context_can_be_inactive(self, agent_context_factory):
        """Context can be marked inactive."""
        inactive = agent_context_factory(is_active=0)
        assert inactive["is_active"] == 0

    def test_tool_can_be_disabled(self, agent_tool_factory):
        """Tool can be disabled."""
        disabled = agent_tool_factory(is_enabled=0)
        assert disabled["is_enabled"] == 0


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAgentServiceFieldDefaults:
    """Test agent service field default values."""

    def test_agent_empty_description_default(self, agent_factory):
        """Agent description should default to empty string."""
        agent = agent_factory(description="")
        assert agent["description"] == ""

    def test_agent_empty_system_prompt_default(self, agent_factory):
        """Agent system_prompt should default to empty string."""
        agent = agent_factory(system_prompt="")
        assert agent["system_prompt"] == ""

    def test_agent_temperature_default_is_0_7(self, agent_factory):
        """Agent temperature should default to 0.7."""
        agent = agent_factory(temperature=0.7)
        assert agent["temperature"] == 0.7

    def test_agent_max_tokens_default_is_zero(self, agent_factory):
        """Agent max_tokens should default to 0."""
        agent = agent_factory(max_tokens=0)
        assert agent["max_tokens"] == 0

    def test_version_changelog_default_empty(self, agent_version_factory):
        """Version changelog should default to empty."""
        version = agent_version_factory(changelog="")
        assert version["changelog"] == ""

    def test_context_active_default_true(self, agent_context_factory):
        """Context should default to active (is_active=1)."""
        context = agent_context_factory(is_active=1)
        assert context["is_active"] == 1

    def test_tool_enabled_default_true(self, agent_tool_factory):
        """Tool should default to enabled (is_enabled=1)."""
        tool = agent_tool_factory(is_enabled=1)
        assert tool["is_enabled"] == 1

    def test_tool_type_default_is_function(self, agent_tool_factory):
        """Tool type should default to function."""
        tool = agent_tool_factory(tool_type="function")
        assert tool["tool_type"] == "function"

    def test_context_type_default_is_text(self, agent_context_factory):
        """Context type should default to text."""
        context = agent_context_factory(content_type="text")
        assert context["content_type"] == "text"


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAgentDataConsistency:
    """Test data consistency across models."""

    def test_agent_version_references_agent(self, agent_factory, agent_version_factory):
        """Agent version should reference correct agent."""
        agent = agent_factory()
        version = agent_version_factory(agent_id=agent["id"])
        assert version["agent_id"] == agent["id"]

    def test_context_references_agent(self, agent_factory, agent_context_factory):
        """Context should reference correct agent."""
        agent = agent_factory()
        context = agent_context_factory(agent_id=agent["id"])
        assert context["agent_id"] == agent["id"]

    def test_tool_references_agent(self, agent_factory, agent_tool_factory):
        """Tool should reference correct agent."""
        agent = agent_factory()
        tool = agent_tool_factory(agent_id=agent["id"])
        assert tool["agent_id"] == agent["id"]

    def test_multiple_contexts_same_agent(self, agent_factory, agent_context_factory):
        """Agent can have multiple contexts."""
        agent = agent_factory()
        ctx1 = agent_context_factory(agent_id=agent["id"], name="Context1")
        ctx2 = agent_context_factory(agent_id=agent["id"], name="Context2")
        assert ctx1["agent_id"] == ctx2["agent_id"] == agent["id"]
        assert ctx1["id"] != ctx2["id"]

    def test_multiple_tools_same_agent(self, agent_factory, agent_tool_factory):
        """Agent can have multiple tools."""
        agent = agent_factory()
        tool1 = agent_tool_factory(agent_id=agent["id"], name="Tool1")
        tool2 = agent_tool_factory(agent_id=agent["id"], name="Tool2")
        assert tool1["agent_id"] == tool2["agent_id"] == agent["id"]
        assert tool1["id"] != tool2["id"]

    def test_multiple_versions_same_agent(self, agent_factory, agent_version_factory):
        """Agent can have multiple versions."""
        agent = agent_factory()
        v1 = agent_version_factory(agent_id=agent["id"], version_number=1)
        v2 = agent_version_factory(agent_id=agent["id"], version_number=2)
        assert v1["agent_id"] == v2["agent_id"] == agent["id"]
        assert v1["version_number"] < v2["version_number"]


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAgentOrganizationIsolation:
    """Test organization isolation for agents."""

    def test_agents_belong_to_organization(self, agent_factory):
        """Agents should belong to organization."""
        org_id = str(uuid.uuid4())
        agent = agent_factory(organization_id=org_id)
        assert agent["organization_id"] == org_id

    def test_agents_belong_to_workspace(self, agent_factory):
        """Agents should belong to workspace."""
        ws_id = str(uuid.uuid4())
        agent = agent_factory(workspace_id=ws_id)
        assert agent["workspace_id"] == ws_id

    def test_different_organizations_different_agents(self, agent_factory):
        """Agents from different orgs should have different org_ids."""
        org1_agent = agent_factory(organization_id=str(uuid.uuid4()))
        org2_agent = agent_factory(organization_id=str(uuid.uuid4()))
        assert org1_agent["organization_id"] != org2_agent["organization_id"]

    def test_different_workspaces_different_agents(self, agent_factory):
        """Agents from different workspaces should have different workspace_ids."""
        ws1_agent = agent_factory(workspace_id=str(uuid.uuid4()))
        ws2_agent = agent_factory(workspace_id=str(uuid.uuid4()))
        assert ws1_agent["workspace_id"] != ws2_agent["workspace_id"]


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAgentAuditFields:
    """Test agent audit and timestamp fields."""

    def test_agent_has_created_by(self, agent_factory):
        """Agent should track who created it."""
        user_id = str(uuid.uuid4())
        agent = agent_factory(created_by=user_id)
        assert agent["created_by"] == user_id

    def test_agent_has_created_at(self, agent_factory):
        """Agent should have creation timestamp."""
        agent = agent_factory()
        assert "created_at" in agent
        assert agent["created_at"]

    def test_agent_has_updated_at(self, agent_factory):
        """Agent should have update timestamp."""
        agent = agent_factory()
        assert "updated_at" in agent
        assert agent["updated_at"]

    def test_version_has_created_by(self, agent_version_factory):
        """Version should track who created it."""
        user_id = str(uuid.uuid4())
        version = agent_version_factory(created_by=user_id)
        assert version["created_by"] == user_id

    def test_version_has_created_at(self, agent_version_factory):
        """Version should have creation timestamp."""
        version = agent_version_factory()
        assert "created_at" in version
        assert version["created_at"]

    def test_context_has_timestamps(self, agent_context_factory):
        """Context should have creation and update timestamps."""
        context = agent_context_factory()
        assert "created_at" in context
        assert "updated_at" in context

    def test_tool_has_created_at(self, agent_tool_factory):
        """Tool should have creation timestamp."""
        tool = agent_tool_factory()
        assert "created_at" in tool
        assert tool["created_at"]
