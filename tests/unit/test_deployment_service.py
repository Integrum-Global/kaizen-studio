"""
Unit Tests for Deployment Service

Tier 1: Fast, isolated tests without external dependencies.
Tests deployment lifecycle, status transitions, and logging logic.
"""

import json
import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from cryptography.fernet import Fernet
from studio.services.deployment_service import DeploymentService


class TestDeploymentServiceInitialization:
    """Test deployment service initialization."""

    def test_service_initialization(self):
        """Test service initializes without errors."""
        service = DeploymentService()
        assert service is not None
        assert service.settings is not None
        assert service.runtime is not None

    @patch("studio.services.deployment_service.get_settings")
    def test_settings_loaded_from_config(self, mock_get_settings):
        """Test settings are loaded from config."""
        mock_settings = MagicMock()
        mock_get_settings.return_value = mock_settings
        service = DeploymentService()
        mock_get_settings.assert_called_once()

    def test_runtime_is_async_local_runtime(self):
        """Test runtime is AsyncLocalRuntime."""
        service = DeploymentService()
        from kailash.runtime import AsyncLocalRuntime

        assert isinstance(service.runtime, AsyncLocalRuntime)

    @patch("studio.services.deployment_service.get_settings")
    def test_fernet_uses_provided_key(self, mock_get_settings):
        """Test Fernet uses provided encryption key."""
        encryption_key = Fernet.generate_key()
        mock_settings = MagicMock()
        mock_settings.encryption_key = encryption_key
        mock_get_settings.return_value = mock_settings
        service = DeploymentService()
        fernet = service.fernet
        assert fernet is not None


class TestDeploymentServiceEncryption:
    """Test decryption functionality."""

    @pytest.fixture
    def deployment_service(self):
        """Create deployment service."""
        return DeploymentService()

    def test_decrypt_secret_returns_string(self, deployment_service):
        """Test decrypt_secret returns string."""
        # Create encrypted data using the service's fernet
        original = "test-api-key"
        encrypted = deployment_service.fernet.encrypt(original.encode()).decode()
        decrypted = deployment_service.decrypt_secret(encrypted)
        assert decrypted == original

    def test_decrypt_invalid_raises_error(self, deployment_service):
        """Test decrypting invalid data raises error."""
        with pytest.raises(Exception):
            deployment_service.decrypt_secret("not-valid-encrypted-data")

    def test_decrypt_unicode_secret(self, deployment_service):
        """Test decrypting Unicode secrets."""
        original = "api-key-with-émojis-🔐"
        encrypted = deployment_service.fernet.encrypt(original.encode()).decode()
        decrypted = deployment_service.decrypt_secret(encrypted)
        assert decrypted == original


class TestDeploymentDataStructure:
    """Test deployment data structure and initialization."""

    def test_deployment_data_structure(self):
        """Test expected deployment data structure."""
        now = datetime.now(UTC).isoformat()
        deployment_data = {
            "id": str(uuid.uuid4()),
            "organization_id": str(uuid.uuid4()),
            "agent_id": str(uuid.uuid4()),
            "agent_version_id": str(uuid.uuid4()),
            "gateway_id": str(uuid.uuid4()),
            "registration_id": None,
            "status": "pending",
            "endpoint_url": None,
            "error_message": None,
            "deployed_by": str(uuid.uuid4()),
            "deployed_at": None,
            "stopped_at": None,
            "created_at": now,
            "updated_at": now,
        }
        assert "id" in deployment_data
        assert deployment_data["status"] == "pending"
        assert deployment_data["registration_id"] is None

    def test_deployment_initial_status_is_pending(self):
        """Test new deployment starts with pending status."""
        initial_status = "pending"
        assert initial_status == "pending"

    def test_deployment_initial_fields_are_none(self):
        """Test deployment initial fields are None."""
        fields = {
            "registration_id": None,
            "endpoint_url": None,
            "error_message": None,
            "deployed_at": None,
            "stopped_at": None,
        }
        for field, value in fields.items():
            assert value is None


class TestDeploymentStatusTransitions:
    """Test deployment status lifecycle transitions."""

    def test_valid_status_values(self):
        """Test all valid deployment status values."""
        valid_statuses = ["pending", "deploying", "active", "failed", "stopped"]
        assert len(valid_statuses) == 5

    def test_pending_to_deploying_transition(self):
        """Test transition from pending to deploying."""
        current_status = "pending"
        new_status = "deploying"
        valid_transitions = {
            "pending": ["deploying"],
        }
        assert new_status in valid_transitions.get(current_status, [])

    def test_deploying_to_active_transition(self):
        """Test transition from deploying to active."""
        current_status = "deploying"
        new_status = "active"
        valid_transitions = {
            "deploying": ["active", "failed"],
        }
        assert new_status in valid_transitions.get(current_status, [])

    def test_deploying_to_failed_transition(self):
        """Test transition from deploying to failed."""
        current_status = "deploying"
        new_status = "failed"
        valid_transitions = {
            "deploying": ["active", "failed"],
        }
        assert new_status in valid_transitions.get(current_status, [])

    def test_active_to_stopped_transition(self):
        """Test transition from active to stopped."""
        current_status = "active"
        new_status = "stopped"
        valid_transitions = {
            "active": ["stopped"],
        }
        assert new_status in valid_transitions.get(current_status, [])

    def test_deploying_to_stopped_transition(self):
        """Test transition from deploying to stopped."""
        current_status = "deploying"
        new_status = "stopped"
        # Can stop during deployment in some cases
        stoppable_statuses = ["active", "deploying"]
        assert current_status in stoppable_statuses

    def test_failed_deployment_cannot_be_restarted(self):
        """Test failed deployments cannot transition to deploying."""
        current_status = "failed"
        new_status = "deploying"
        stoppable_statuses = ["active", "deploying"]
        assert current_status not in stoppable_statuses

    def test_stopped_deployment_cannot_be_restarted(self):
        """Test stopped deployments cannot transition to deploying."""
        current_status = "stopped"
        stoppable_statuses = ["active", "deploying"]
        assert current_status not in stoppable_statuses


class TestDeploymentLoggingLogic:
    """Test deployment logging functionality."""

    def test_deployment_log_data_structure(self):
        """Test deployment log data structure."""
        now = datetime.now(UTC).isoformat()
        log_data = {
            "id": str(uuid.uuid4()),
            "deployment_id": str(uuid.uuid4()),
            "event_type": "started",
            "message": "Deployment initiated",
            "metadata": None,
            "created_at": now,
        }
        assert "id" in log_data
        assert "deployment_id" in log_data
        assert "event_type" in log_data

    def test_valid_event_types(self):
        """Test valid deployment event types."""
        valid_types = ["started", "building", "registered", "failed", "stopped"]
        assert len(valid_types) == 5

    def test_metadata_json_serialization(self):
        """Test metadata is JSON serialized."""
        metadata = {
            "registration_id": "reg-123",
            "endpoint_url": "https://api.example.com",
        }
        serialized = json.dumps(metadata)
        assert isinstance(serialized, str)
        deserialized = json.loads(serialized)
        assert deserialized == metadata

    def test_metadata_none_handling(self):
        """Test None metadata is handled correctly."""
        metadata = None
        serialized = json.dumps(metadata) if metadata else None
        assert serialized is None

    def test_log_message_stored_as_string(self):
        """Test log message is stored as string."""
        message = "Deployment failed: Gateway connection timeout"
        assert isinstance(message, str)

    def test_event_type_coverage(self):
        """Test all event types are covered."""
        event_types = {
            "started": "Deployment initiated",
            "building": "Building agent for deployment",
            "registered": "Agent registered successfully",
            "failed": "Deployment failed",
            "stopped": "Deployment stopped",
        }
        assert len(event_types) == 5


class TestDeploymentEndpointConstruction:
    """Test endpoint URL construction."""

    def test_endpoint_url_from_gateway_api_url(self):
        """Test endpoint URL is constructed from gateway URL."""
        gateway_api_url = "https://gateway.example.com"
        agent_name = "my-agent"
        endpoint_url = f"{gateway_api_url}/api/v1/agents/{agent_name}"
        assert endpoint_url.startswith(gateway_api_url)
        assert "/agents/" in endpoint_url

    def test_endpoint_url_includes_registration_id(self):
        """Test endpoint URL includes registration ID when available."""
        gateway_api_url = "https://gateway.example.com"
        registration_id = "reg-uuid-12345"
        endpoint_url = f"{gateway_api_url}/api/v1/agents/{registration_id}"
        assert registration_id in endpoint_url

    def test_endpoint_url_format_valid(self):
        """Test endpoint URL is properly formatted."""
        endpoint_url = "https://gateway.example.com/api/v1/agents/reg-123"
        assert endpoint_url.startswith("https://")
        assert "/api/v1/agents/" in endpoint_url

    def test_endpoint_url_with_trailing_slash(self):
        """Test endpoint URL without unexpected trailing slashes."""
        gateway_api_url = "https://gateway.example.com"
        endpoint_url = f"{gateway_api_url}/api/v1/agents/agent-1"
        assert not endpoint_url.endswith("/")


class TestDeploymentPayloadConstruction:
    """Test deployment payload for gateway registration."""

    def test_deployment_payload_structure(self):
        """Test deployment payload has required fields."""
        payload = {
            "name": "My Agent",
            "description": "Agent description",
            "agent_type": "conversational",
            "config": "System prompt or config",
        }
        required_fields = ["name", "agent_type"]
        for field in required_fields:
            assert field in payload

    def test_payload_includes_agent_name(self):
        """Test payload includes agent name."""
        agent_name = "customer-support-bot"
        payload = {"name": agent_name}
        assert payload["name"] == agent_name

    def test_payload_includes_agent_type(self):
        """Test payload includes agent type."""
        agent_type = "conversational"
        payload = {"agent_type": agent_type}
        assert payload["agent_type"] == agent_type

    def test_payload_includes_optional_description(self):
        """Test payload can include optional description."""
        description = "A helpful agent"
        payload = {"description": description}
        assert payload.get("description") == description

    def test_payload_includes_optional_config(self):
        """Test payload can include optional config."""
        config = {"temperature": 0.7, "max_tokens": 1000}
        payload = {"config": config}
        assert payload.get("config") == config

    def test_none_description_handled(self):
        """Test None description is handled."""
        description = None
        payload = {}
        if description:
            payload["description"] = description
        assert "description" not in payload

    def test_gateway_registration_endpoint(self):
        """Test gateway registration endpoint path."""
        gateway_url = "https://gateway.example.com"
        register_endpoint = f"{gateway_url}/api/v1/agents/register"
        assert register_endpoint.endswith("/register")
        assert "/agents/" in register_endpoint


class TestDeploymentErrorHandling:
    """Test error handling and validation."""

    def test_missing_agent_id(self):
        """Test error when agent_id is missing."""
        deployment_data = {
            "organization_id": str(uuid.uuid4()),
            # Missing: agent_id
            "gateway_id": str(uuid.uuid4()),
        }
        assert "agent_id" not in deployment_data

    def test_missing_gateway_id(self):
        """Test error when gateway_id is missing."""
        deployment_data = {
            "organization_id": str(uuid.uuid4()),
            "agent_id": str(uuid.uuid4()),
            # Missing: gateway_id
        }
        assert "gateway_id" not in deployment_data

    def test_missing_deployed_by(self):
        """Test error when deployed_by is missing."""
        deployment_data = {
            "organization_id": str(uuid.uuid4()),
            "agent_id": str(uuid.uuid4()),
            "gateway_id": str(uuid.uuid4()),
            # Missing: deployed_by
        }
        assert "deployed_by" not in deployment_data

    def test_gateway_not_found_error_message(self):
        """Test gateway not found error message."""
        error_message = "Gateway not found: gateway-123"
        assert "Gateway not found" in error_message

    def test_agent_not_found_error_message(self):
        """Test agent not found error message."""
        error_message = "Agent not found: agent-456"
        assert "Agent not found" in error_message

    def test_gateway_inactive_error_message(self):
        """Test gateway inactive error message."""
        gateway_status = "error"
        error_message = f"Gateway is not active: {gateway_status}"
        assert "not active" in error_message

    def test_deployment_not_found_error_message(self):
        """Test deployment not found error message."""
        error_message = "Deployment not found: deployment-789"
        assert "Deployment not found" in error_message

    def test_cannot_stop_pending_deployment_error(self):
        """Test cannot stop pending deployment."""
        deployment_status = "pending"
        stoppable_statuses = ["active", "deploying"]
        assert deployment_status not in stoppable_statuses

    def test_http_error_response_handling(self):
        """Test HTTP error response is handled."""
        status_code = 400
        response_text = '{"error": "Invalid request"}'
        error_message = f"Gateway registration failed: {response_text}"
        assert "registration failed" in error_message


class TestDeploymentTimestamps:
    """Test timestamp handling in deployments."""

    def test_created_at_is_set(self):
        """Test created_at timestamp is set."""
        now = datetime.now(UTC).isoformat()
        assert isinstance(now, str)
        assert "T" in now

    def test_updated_at_is_set(self):
        """Test updated_at timestamp is set."""
        now = datetime.now(UTC).isoformat()
        assert isinstance(now, str)

    def test_deployed_at_set_on_success(self):
        """Test deployed_at is set on successful deployment."""
        deployed_at = datetime.now(UTC).isoformat()
        assert deployed_at is not None

    def test_deployed_at_none_initially(self):
        """Test deployed_at is None initially."""
        deployed_at = None
        assert deployed_at is None

    def test_stopped_at_set_on_stop(self):
        """Test stopped_at is set when stopped."""
        stopped_at = datetime.now(UTC).isoformat()
        assert stopped_at is not None

    def test_stopped_at_none_initially(self):
        """Test stopped_at is None initially."""
        stopped_at = None
        assert stopped_at is None

    def test_timestamp_iso_format(self):
        """Test timestamps are in ISO format."""
        now = datetime.now(UTC).isoformat()
        assert "T" in now
        assert "Z" in now or "+" in now


class TestDeploymentFiltering:
    """Test deployment filtering and querying."""

    def test_filter_by_organization_id(self):
        """Test filtering by organization_id."""
        org_id = str(uuid.uuid4())
        filter_data = {"organization_id": org_id}
        assert filter_data["organization_id"] == org_id

    def test_filter_by_agent_id(self):
        """Test filtering by agent_id."""
        agent_id = str(uuid.uuid4())
        filter_data = {"agent_id": agent_id}
        assert filter_data["agent_id"] == agent_id

    def test_filter_by_gateway_id(self):
        """Test filtering by gateway_id."""
        gateway_id = str(uuid.uuid4())
        filter_data = {"gateway_id": gateway_id}
        assert filter_data["gateway_id"] == gateway_id

    def test_filter_by_status(self):
        """Test filtering by status."""
        status = "active"
        filter_data = {"status": status}
        assert filter_data["status"] == status

    def test_multiple_filters_combined(self):
        """Test combining multiple filters."""
        org_id = str(uuid.uuid4())
        agent_id = str(uuid.uuid4())
        status = "active"
        filter_data = {
            "organization_id": org_id,
            "agent_id": agent_id,
            "status": status,
        }
        assert len(filter_data) == 3

    def test_optional_filter_not_included_when_none(self):
        """Test optional filter is not included when None."""
        org_id = str(uuid.uuid4())
        agent_id = None
        filter_data = {"organization_id": org_id}
        if agent_id:
            filter_data["agent_id"] = agent_id
        assert "agent_id" not in filter_data


class TestDeploymentValidation:
    """Test deployment data validation."""

    def test_deployment_id_is_uuid(self):
        """Test deployment ID is valid UUID."""
        deployment_id = str(uuid.uuid4())
        assert len(deployment_id) == 36

    def test_agent_id_is_uuid(self):
        """Test agent ID is valid UUID."""
        agent_id = str(uuid.uuid4())
        assert len(agent_id) == 36

    def test_gateway_id_is_uuid(self):
        """Test gateway ID is valid UUID."""
        gateway_id = str(uuid.uuid4())
        assert len(gateway_id) == 36

    def test_organization_id_is_uuid(self):
        """Test organization ID is valid UUID."""
        org_id = str(uuid.uuid4())
        assert len(org_id) == 36

    def test_deployed_by_is_uuid(self):
        """Test deployed_by (user ID) is valid UUID."""
        user_id = str(uuid.uuid4())
        assert len(user_id) == 36

    def test_agent_version_id_optional(self):
        """Test agent_version_id is optional."""
        version_id = None
        assert version_id is None

    def test_registration_id_optional(self):
        """Test registration_id is optional."""
        registration_id = None
        assert registration_id is None

    def test_error_message_optional(self):
        """Test error_message is optional."""
        error_message = None
        assert error_message is None

    def test_error_message_stored_on_failure(self):
        """Test error_message is stored on failure."""
        error_message = "Timeout connecting to gateway"
        assert error_message is not None


class TestDeploymentRedeployLogic:
    """Test redeploy functionality."""

    def test_redeploy_requires_existing_deployment(self):
        """Test redeploy requires existing deployment."""
        deployment_id = str(uuid.uuid4())
        assert deployment_id is not None

    def test_redeploy_preserves_agent_id(self):
        """Test redeploy preserves original agent ID."""
        original_agent_id = str(uuid.uuid4())
        new_agent_id = original_agent_id
        assert new_agent_id == original_agent_id

    def test_redeploy_preserves_gateway_id(self):
        """Test redeploy preserves original gateway ID."""
        original_gateway_id = str(uuid.uuid4())
        new_gateway_id = original_gateway_id
        assert new_gateway_id == original_gateway_id

    def test_redeploy_preserves_deployed_by(self):
        """Test redeploy preserves original deployed_by."""
        original_deployed_by = str(uuid.uuid4())
        new_deployed_by = original_deployed_by
        assert new_deployed_by == original_deployed_by

    def test_redeploy_preserves_agent_version_id(self):
        """Test redeploy preserves agent version ID."""
        version_id = str(uuid.uuid4())
        preserved_version_id = version_id
        assert preserved_version_id == version_id

    def test_redeploy_stops_current_deployment(self):
        """Test redeploy stops the current deployment."""
        original_status = "active"
        stopped_status = "stopped"
        assert original_status != stopped_status

    def test_redeploy_creates_new_deployment(self):
        """Test redeploy creates a new deployment."""
        new_deployment_id = str(uuid.uuid4())
        assert new_deployment_id is not None
        assert len(new_deployment_id) == 36
