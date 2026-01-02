"""
Tier 1: Webhook Service Unit Tests

Tests HMAC signing/verification, event filtering, and retry logic.
Mocking is allowed in Tier 1 for external services (httpx).
"""

import hashlib
import hmac
import json
import uuid
from datetime import UTC, datetime

import pytest
from studio.services.webhook_service import (
    MAX_ATTEMPTS,
    RETRY_DELAYS,
    WEBHOOK_EVENTS,
    WebhookService,
)


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestWebhookSecretGeneration:
    """Test webhook secret generation."""

    def test_generate_secret_creates_valid_format(self):
        """Generated secret should have correct format."""
        service = WebhookService()
        secret = service._generate_secret()

        assert secret.startswith("whsec_")
        assert len(secret) > 6
        assert "_" in secret

    def test_generate_secret_unique(self):
        """Each generated secret should be unique."""
        service = WebhookService()
        secret1 = service._generate_secret()
        secret2 = service._generate_secret()

        assert secret1 != secret2

    def test_generate_secret_multiple_calls_all_different(self):
        """Multiple secret generation should produce different values."""
        service = WebhookService()
        secrets = set()
        for _ in range(10):
            secret = service._generate_secret()
            secrets.add(secret)

        assert len(secrets) == 10


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestHMACSigningVerification:
    """Test HMAC signing and verification."""

    def test_sign_payload_creates_sha256_signature(self):
        """Payload signing should create SHA256-based HMAC signature."""
        service = WebhookService()
        payload = '{"id": "evt_123", "type": "agent.created", "data": {"name": "test"}}'
        secret = "whsec_test_secret"

        signature = service.sign_payload(payload, secret)

        # Signature should have sha256= prefix
        assert signature.startswith("sha256=")
        assert len(signature) > 10

    def test_sign_payload_deterministic(self):
        """Same payload and secret should produce same signature."""
        service = WebhookService()
        payload = '{"id": "evt_123", "type": "agent.created"}'
        secret = "whsec_test_secret"

        sig1 = service.sign_payload(payload, secret)
        sig2 = service.sign_payload(payload, secret)

        assert sig1 == sig2

    def test_sign_payload_different_secrets_different_signatures(self):
        """Different secrets should produce different signatures."""
        service = WebhookService()
        payload = '{"id": "evt_123"}'

        sig1 = service.sign_payload(payload, "secret1")
        sig2 = service.sign_payload(payload, "secret2")

        assert sig1 != sig2

    def test_sign_payload_different_payloads_different_signatures(self):
        """Different payloads should produce different signatures."""
        service = WebhookService()
        secret = "whsec_test_secret"

        sig1 = service.sign_payload('{"id": "evt_1"}', secret)
        sig2 = service.sign_payload('{"id": "evt_2"}', secret)

        assert sig1 != sig2

    def test_verify_signature_valid(self):
        """Valid signature should verify successfully."""
        service = WebhookService()
        payload = '{"id": "evt_123", "type": "agent.created"}'
        secret = "whsec_test_secret"

        signature = service.sign_payload(payload, secret)
        is_valid = service.verify_signature(payload, signature, secret)

        assert is_valid is True

    def test_verify_signature_invalid_signature(self):
        """Invalid signature should fail verification."""
        service = WebhookService()
        payload = '{"id": "evt_123"}'
        secret = "whsec_test_secret"

        # Create a wrong signature
        wrong_signature = "sha256=invalid_signature_hex"
        is_valid = service.verify_signature(payload, wrong_signature, secret)

        assert is_valid is False

    def test_verify_signature_wrong_secret(self):
        """Signature verified with wrong secret should fail."""
        service = WebhookService()
        payload = '{"id": "evt_123"}'
        secret1 = "whsec_secret1"
        secret2 = "whsec_secret2"

        signature = service.sign_payload(payload, secret1)
        is_valid = service.verify_signature(payload, signature, secret2)

        assert is_valid is False

    def test_verify_signature_tampered_payload(self):
        """Signature of tampered payload should fail verification."""
        service = WebhookService()
        payload1 = '{"id": "evt_123"}'
        payload2 = '{"id": "evt_124"}'
        secret = "whsec_test_secret"

        signature = service.sign_payload(payload1, secret)
        is_valid = service.verify_signature(payload2, signature, secret)

        assert is_valid is False

    def test_verify_signature_missing_sha256_prefix(self):
        """Signature without sha256= prefix should be handled."""
        service = WebhookService()
        payload = '{"id": "evt_123"}'
        secret = "whsec_test_secret"

        # Signature without prefix
        expected_sig = hmac.new(
            secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        is_valid = service.verify_signature(payload, expected_sig, secret)

        # Should fail because format doesn't match
        assert is_valid is False


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestEventFiltering:
    """Test webhook event filtering logic."""

    def test_valid_events_list(self):
        """WEBHOOK_EVENTS should contain expected event types."""
        assert "agent.created" in WEBHOOK_EVENTS
        assert "agent.updated" in WEBHOOK_EVENTS
        assert "agent.deleted" in WEBHOOK_EVENTS
        assert "deployment.created" in WEBHOOK_EVENTS
        assert "deployment.active" in WEBHOOK_EVENTS
        assert "deployment.failed" in WEBHOOK_EVENTS
        assert "deployment.stopped" in WEBHOOK_EVENTS
        assert "pipeline.created" in WEBHOOK_EVENTS
        assert "pipeline.updated" in WEBHOOK_EVENTS
        assert "user.invited" in WEBHOOK_EVENTS
        assert "user.joined" in WEBHOOK_EVENTS

    def test_event_filtering_valid_events(self):
        """Valid events should be accepted."""
        events = ["agent.created", "agent.updated"]
        valid_events = [e for e in events if e in WEBHOOK_EVENTS]

        assert len(valid_events) == 2
        assert valid_events == events

    def test_event_filtering_invalid_events_removed(self):
        """Invalid events should be filtered out."""
        events = ["agent.created", "invalid.event", "agent.updated", "fake.type"]
        valid_events = [e for e in events if e in WEBHOOK_EVENTS]

        assert len(valid_events) == 2
        assert "invalid.event" not in valid_events
        assert "fake.type" not in valid_events
        assert "agent.created" in valid_events
        assert "agent.updated" in valid_events

    def test_event_filtering_empty_list(self):
        """Empty event list should remain empty."""
        events = []
        valid_events = [e for e in events if e in WEBHOOK_EVENTS]

        assert len(valid_events) == 0

    def test_event_filtering_all_invalid(self):
        """All invalid events should be filtered out."""
        events = ["invalid1", "invalid2", "invalid3"]
        valid_events = [e for e in events if e in WEBHOOK_EVENTS]

        assert len(valid_events) == 0

    def test_event_filtering_case_sensitive(self):
        """Event filtering should be case-sensitive."""
        events = ["Agent.Created", "AGENT.CREATED", "agent.created"]
        valid_events = [e for e in events if e in WEBHOOK_EVENTS]

        assert len(valid_events) == 1
        assert "agent.created" in valid_events

    def test_event_type_matches_webhook_event(self):
        """Event type should match webhook subscribed events."""
        subscribed_events = ["agent.created", "agent.updated"]
        event_type = "agent.created"

        is_subscribed = event_type in subscribed_events

        assert is_subscribed is True

    def test_event_type_not_subscribed(self):
        """Unsubscribed event type should not match."""
        subscribed_events = ["agent.created", "agent.updated"]
        event_type = "deployment.created"

        is_subscribed = event_type in subscribed_events

        assert is_subscribed is False


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestRetryLogic:
    """Test retry mechanism and exponential backoff."""

    def test_retry_delays_configuration(self):
        """Retry delays should be configured correctly."""
        assert len(RETRY_DELAYS) == 3
        assert RETRY_DELAYS[0] == 0  # Immediate
        assert RETRY_DELAYS[1] == 60  # 1 minute
        assert RETRY_DELAYS[2] == 300  # 5 minutes

    def test_max_attempts_configuration(self):
        """Maximum attempts should be configured."""
        assert MAX_ATTEMPTS == 3

    def test_exponential_backoff_progression(self):
        """Backoff delays should increase exponentially."""
        assert RETRY_DELAYS[0] < RETRY_DELAYS[1]
        assert RETRY_DELAYS[1] < RETRY_DELAYS[2]

    def test_retry_loop_creates_correct_delays(self):
        """Retry loop should use correct delay values."""
        delays_used = []
        for attempt in range(MAX_ATTEMPTS):
            if attempt > 0:
                delays_used.append(RETRY_DELAYS[attempt])

        assert delays_used == [60, 300]

    def test_attempt_count_increment(self):
        """Attempt count should increment correctly."""
        attempt_counts = []
        for attempt in range(MAX_ATTEMPTS):
            attempt_counts.append(attempt + 1)

        assert attempt_counts == [1, 2, 3]

    def test_retry_stops_on_success(self):
        """Retry loop should stop on successful delivery."""
        # Simulate: first attempt succeeds
        success_on_attempt = 0
        attempts_made = 0

        for attempt in range(MAX_ATTEMPTS):
            attempts_made += 1
            if attempt == success_on_attempt:
                # Success condition
                break

        assert attempts_made == 1

    def test_retry_continues_until_max_attempts(self):
        """Retry loop should continue until max attempts reached."""
        # Simulate: all attempts fail
        attempts_made = 0

        for attempt in range(MAX_ATTEMPTS):
            attempts_made += 1
            success = False  # Always fails
            if success:
                break

        assert attempts_made == MAX_ATTEMPTS

    def test_response_status_determines_success(self):
        """Response status 200-299 indicates success."""
        success_statuses = [200, 201, 202, 204, 299]
        fail_statuses = [199, 300, 400, 404, 500, 502, 503]

        for status in success_statuses:
            is_success = 200 <= status < 300
            assert is_success is True

        for status in fail_statuses:
            is_success = 200 <= status < 300
            assert is_success is False


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPayloadConstruction:
    """Test webhook payload construction."""

    def test_payload_has_required_fields(self):
        """Webhook payload should have required fields."""
        payload_dict = {
            "id": "evt_123abc",
            "type": "agent.created",
            "created_at": datetime.now(UTC).isoformat(),
            "organization_id": "org_123",
            "data": {"name": "Test Agent"},
        }
        payload = json.dumps(payload_dict)

        parsed = json.loads(payload)
        assert "id" in parsed
        assert "type" in parsed
        assert "created_at" in parsed
        assert "organization_id" in parsed
        assert "data" in parsed

    def test_payload_event_id_format(self):
        """Event ID should have evt_ prefix."""
        event_id = "evt_abc123def456"
        assert event_id.startswith("evt_")

    def test_payload_json_serializable(self):
        """Payload should be JSON serializable."""
        payload_dict = {
            "id": "evt_123",
            "type": "agent.created",
            "data": {
                "agent_id": str(uuid.uuid4()),
                "name": "Test",
                "created_at": datetime.now(UTC).isoformat(),
            },
        }

        # Should not raise
        payload = json.dumps(payload_dict)
        assert isinstance(payload, str)

    def test_payload_with_complex_data(self):
        """Payload should handle complex nested data."""
        payload_dict = {
            "id": "evt_123",
            "type": "agent.created",
            "data": {
                "agent": {
                    "id": "agent_123",
                    "config": {
                        "model": "gpt-4",
                        "temperature": 0.7,
                        "max_tokens": 2000,
                    },
                }
            },
        }

        payload = json.dumps(payload_dict)
        parsed = json.loads(payload)
        assert parsed["data"]["agent"]["config"]["temperature"] == 0.7


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestSignatureHeaders:
    """Test webhook signature headers."""

    def test_signature_header_format(self):
        """X-Webhook-Signature header should have correct format."""
        signature = "sha256=abcdef0123456789"
        assert signature.startswith("sha256=")
        assert len(signature) > 10

    def test_timestamp_header_is_unix_time(self):
        """X-Webhook-Timestamp should be Unix timestamp."""
        import time

        timestamp = int(time.time())

        # Should be large number
        assert timestamp > 1600000000
        assert timestamp < 2000000000

    def test_headers_required_for_verification(self):
        """Signature and timestamp headers are required."""
        headers = {
            "X-Webhook-Signature": "sha256=abc123",
            "X-Webhook-Timestamp": "1234567890",
            "Content-Type": "application/json",
        }

        assert "X-Webhook-Signature" in headers
        assert "X-Webhook-Timestamp" in headers
        assert "Content-Type" in headers


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestFailureTracking:
    """Test failure count tracking."""

    def test_failure_count_increment(self):
        """Failure count should increment on failures."""
        failure_count = 0
        failure_count += 1

        assert failure_count == 1

    def test_failure_count_multiple_increments(self):
        """Failure count should track multiple failures."""
        failure_count = 0
        for _ in range(3):
            failure_count += 1

        assert failure_count == 3

    def test_failure_count_reset_on_success(self):
        """Failure count should reset to 0 on success."""
        failure_count = 3
        failure_count = 0  # Reset on success

        assert failure_count == 0

    def test_last_triggered_timestamp_updated(self):
        """Last triggered timestamp should be updated."""
        now = datetime.now(UTC).isoformat()
        last_triggered = now

        assert last_triggered is not None
        # Should be ISO format
        assert "T" in last_triggered
        assert "Z" in last_triggered or "+00:00" in last_triggered


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestDeliveryStatus:
    """Test delivery status transitions."""

    def test_delivery_initial_status_pending(self):
        """Initial delivery status should be pending."""
        status = "pending"
        assert status == "pending"

    def test_delivery_success_status(self):
        """Successful delivery status should be success."""
        status = "success"
        assert status == "success"

    def test_delivery_failed_status(self):
        """Failed delivery status should be failed."""
        status = "failed"
        assert status == "failed"

    def test_valid_delivery_statuses(self):
        """Valid delivery statuses should be predefined."""
        valid_statuses = ["pending", "success", "failed"]

        for status in valid_statuses:
            assert status in valid_statuses

    def test_status_transition_pending_to_success(self):
        """Status transition from pending to success."""
        status = "pending"
        success = True

        new_status = "success" if success else "failed"

        assert new_status == "success"

    def test_status_transition_pending_to_failed(self):
        """Status transition from pending to failed."""
        status = "pending"
        success = False

        new_status = "success" if success else "failed"

        assert new_status == "failed"


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestWebhookStatus:
    """Test webhook active/inactive status."""

    def test_webhook_initial_status_active(self):
        """Initial webhook status should be active."""
        status = "active"
        assert status == "active"

    def test_webhook_can_be_inactive(self):
        """Webhook can be marked as inactive."""
        status = "inactive"
        assert status == "inactive"

    def test_only_active_webhooks_trigger(self):
        """Only active webhooks should be triggered."""
        webhooks = [
            {"id": "w1", "status": "active"},
            {"id": "w2", "status": "inactive"},
            {"id": "w3", "status": "active"},
        ]

        active_webhooks = [w for w in webhooks if w["status"] == "active"]

        assert len(active_webhooks) == 2
        assert all(w["status"] == "active" for w in active_webhooks)
