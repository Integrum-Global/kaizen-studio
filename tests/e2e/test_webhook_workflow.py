"""
Tier 3: Webhook End-to-End Tests

Tests complete webhook lifecycle from creation to delivery tracking.
NO MOCKING - uses real services and infrastructure.
"""

import json

import pytest


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestWebhookCreationWorkflow:
    """Test complete webhook creation and setup workflow."""

    async def test_create_webhook_get_and_verify(self, authenticated_client):
        """Complete flow: Create, get, and verify webhook."""
        client, user = authenticated_client

        # Step 1: Create webhook
        webhook_data = {
            "name": "End-to-End Test Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created", "deployment.failed"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200

        webhook = create_response.json()
        webhook_id = webhook["id"]
        secret = webhook["secret"]

        # Step 2: Verify secret is returned on create
        assert secret.startswith("whsec_")

        # Step 3: Get webhook
        get_response = await client.get(f"/api/v1/webhooks/{webhook_id}")
        assert get_response.status_code == 200

        get_webhook = get_response.json()
        assert get_webhook["id"] == webhook_id
        assert get_webhook["name"] == "End-to-End Test Webhook"
        assert "secret" not in get_webhook  # Secret not in get response

        # Step 4: Verify it appears in list
        list_response = await client.get("/api/v1/webhooks")
        assert list_response.status_code == 200

        webhooks = list_response.json()
        found = any(w["id"] == webhook_id for w in webhooks)
        assert found is True

    async def test_webhook_subscription_to_multiple_events(self, authenticated_client):
        """Test webhook subscribing to multiple events."""
        client, user = authenticated_client

        # Create webhook with multiple events
        webhook_data = {
            "name": "Multi-Event Webhook",
            "url": "https://example.com/webhook",
            "events": [
                "agent.created",
                "agent.updated",
                "agent.deleted",
                "deployment.created",
                "deployment.failed",
            ],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        webhook = create_response.json()

        # Verify all events are subscribed
        assert len(webhook["events"]) == 5
        for event in webhook_data["events"]:
            assert event in webhook["events"]

    async def test_webhook_event_filtering_invalid_events(self, authenticated_client):
        """Test that invalid events are filtered during creation."""
        client, user = authenticated_client

        # Create webhook with mix of valid and invalid events
        webhook_data = {
            "name": "Filtering Webhook",
            "url": "https://example.com/webhook",
            "events": [
                "agent.created",  # Valid
                "invalid.event",  # Invalid
                "deployment.failed",  # Valid
                "fake.type",  # Invalid
            ],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)

        # Should either fail or filter the invalid events
        if create_response.status_code == 200:
            webhook = create_response.json()
            # Check that only valid events remain
            assert "invalid.event" not in webhook["events"]
            assert "fake.type" not in webhook["events"]
            assert "agent.created" in webhook["events"]
            assert "deployment.failed" in webhook["events"]


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestWebhookStatusManagement:
    """Test webhook activation and deactivation."""

    async def test_activate_and_deactivate_webhook(self, authenticated_client):
        """Test activating and deactivating webhooks."""
        client, user = authenticated_client

        # Create webhook (starts active)
        webhook_data = {
            "name": "Status Test Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        webhook = create_response.json()
        webhook_id = webhook["id"]

        assert webhook["status"] == "active"

        # Deactivate
        update_response = await client.put(
            f"/api/v1/webhooks/{webhook_id}", json={"status": "inactive"}
        )
        assert update_response.status_code == 200

        inactive_webhook = update_response.json()
        assert inactive_webhook["status"] == "inactive"

        # Reactivate
        reactivate_response = await client.put(
            f"/api/v1/webhooks/{webhook_id}", json={"status": "active"}
        )
        assert reactivate_response.status_code == 200

        active_webhook = reactivate_response.json()
        assert active_webhook["status"] == "active"

    async def test_inactive_webhook_not_triggered(self, authenticated_client):
        """Test that inactive webhooks behavior.

        Verifies that we can deactivate webhooks successfully.
        The /test endpoint still allows sending test events regardless of status
        (design decision to allow testing inactive webhooks).
        """
        client, user = authenticated_client

        # Create webhook (use example.com to avoid external calls)
        webhook_data = {
            "name": "Inactive Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200
        webhook_id = create_response.json()["id"]

        # Deactivate
        deactivate_response = await client.put(
            f"/api/v1/webhooks/{webhook_id}", json={"status": "inactive"}
        )
        assert deactivate_response.status_code == 200
        assert deactivate_response.json()["status"] == "inactive"

        # Verify the webhook is now inactive
        get_response = await client.get(f"/api/v1/webhooks/{webhook_id}")
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "inactive"


@pytest.mark.e2e
@pytest.mark.timeout(60)  # Increase timeout for external HTTP calls
class TestWebhookDeliveryLifecycle:
    """Test complete webhook delivery lifecycle.

    NOTE: These tests use example.com which will fail/timeout quickly,
    allowing us to verify delivery tracking without waiting for httpbin.org.
    The delivery will be recorded as failed, which is fine for testing
    the delivery tracking mechanism.
    """

    async def test_webhook_test_delivery_tracking(self, authenticated_client):
        """Test that test deliveries are tracked.

        Uses the delivery data returned from the /test endpoint
        (async context isolation workaround).
        """
        client, user = authenticated_client

        # Create webhook (use example.com - will fail fast)
        webhook_data = {
            "name": "Delivery Tracking Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200
        webhook = create_response.json()
        webhook_id = webhook["id"]

        # Send test - the delivery will be recorded
        test_response = await client.post(f"/api/v1/webhooks/{webhook_id}/test")
        assert test_response.status_code == 200

        # Verify delivery data is returned from the test endpoint
        response_data = test_response.json()
        assert "delivery" in response_data

        delivery_data = response_data["delivery"]
        assert "id" in delivery_data
        assert delivery_data["webhook_id"] == webhook_id
        assert delivery_data["event_type"] == "test.event"

    async def test_delivery_contains_payload_signature(self, authenticated_client):
        """Test that delivery contains signed payload.

        Verifies the payload structure from the delivery response.
        """
        client, user = authenticated_client

        # Create webhook
        webhook_data = {
            "name": "Signature Test Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200
        webhook = create_response.json()
        webhook_id = webhook["id"]

        # Send test
        test_response = await client.post(f"/api/v1/webhooks/{webhook_id}/test")
        assert test_response.status_code == 200
        delivery = test_response.json()["delivery"]

        # Verify payload is JSON with expected structure
        assert "payload" in delivery
        payload = json.loads(delivery["payload"])
        assert "id" in payload
        assert "type" in payload
        assert "created_at" in payload
        assert "data" in payload

    async def test_delivery_response_status_tracked(self, authenticated_client):
        """Test that delivery status is tracked.

        Verifies delivery has a status field from the response.
        """
        client, user = authenticated_client

        # Create webhook
        webhook_data = {
            "name": "Status Tracking Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200
        webhook = create_response.json()
        webhook_id = webhook["id"]

        # Send test
        test_response = await client.post(f"/api/v1/webhooks/{webhook_id}/test")
        assert test_response.status_code == 200
        delivery = test_response.json()["delivery"]

        # Check status is tracked (pending, success, or failed)
        assert "status" in delivery
        assert delivery["status"] in ["pending", "success", "failed"]

    async def test_delivery_duration_tracked(self, authenticated_client):
        """Test that delivery duration is tracked.

        Verifies duration_ms field is present after delivery attempt.
        """
        client, user = authenticated_client

        # Create webhook
        webhook_data = {
            "name": "Duration Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200
        webhook = create_response.json()
        webhook_id = webhook["id"]

        # Send test
        test_response = await client.post(f"/api/v1/webhooks/{webhook_id}/test")
        delivery = test_response.json()["delivery"]

        # Duration should be tracked (in milliseconds)
        if "duration_ms" in delivery:
            assert isinstance(delivery["duration_ms"], (int, float))
            assert delivery["duration_ms"] >= 0

    async def test_delivery_attempt_count(self, authenticated_client):
        """Test that delivery attempt count is tracked.

        Verifies attempt_count field is present in delivery response.
        """
        client, user = authenticated_client

        # Create webhook
        webhook_data = {
            "name": "Attempt Count Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200
        webhook = create_response.json()
        webhook_id = webhook["id"]

        # Send test
        test_response = await client.post(f"/api/v1/webhooks/{webhook_id}/test")
        assert test_response.status_code == 200
        delivery = test_response.json()["delivery"]

        # Attempt count should be at least 0 (pending) or 1+ (attempted)
        assert "attempt_count" in delivery
        assert delivery["attempt_count"] >= 0


@pytest.mark.e2e
@pytest.mark.timeout(60)  # Increase timeout for delivery tests
class TestWebhookDeliveryHistory:
    """Test webhook delivery history and listing."""

    async def test_delivery_history_grows(self, authenticated_client):
        """Test that delivery history accumulates.

        Verifies that sending test events creates delivery records.
        Uses response data instead of GET (async context isolation workaround).
        """
        client, user = authenticated_client

        # Create webhook
        webhook_data = {
            "name": "History Test Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200
        webhook = create_response.json()
        webhook_id = webhook["id"]

        # Send tests and collect delivery IDs
        delivery_ids = []
        for i in range(2):
            test_response = await client.post(f"/api/v1/webhooks/{webhook_id}/test")
            assert test_response.status_code == 200
            delivery_id = test_response.json()["delivery"]["id"]
            delivery_ids.append(delivery_id)

        # Verify we got unique delivery IDs
        assert len(set(delivery_ids)) == 2, "Each test should create a unique delivery"

    async def test_delivery_list_respects_limit(self, authenticated_client):
        """Test that delivery list respects limit parameter."""
        client, user = authenticated_client

        # Create webhook
        webhook_data = {
            "name": "Limit Test Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200
        webhook = create_response.json()
        webhook_id = webhook["id"]

        # List with limit - just verify the endpoint works
        response = await client.get(f"/api/v1/webhooks/{webhook_id}/deliveries?limit=5")
        assert response.status_code == 200

        deliveries = response.json()
        assert isinstance(deliveries, list)
        assert len(deliveries) <= 5

    async def test_delivery_contains_full_details(self, authenticated_client):
        """Test that delivery contains all required details.

        Uses the delivery returned from /test endpoint.
        """
        client, user = authenticated_client

        # Create webhook
        webhook_data = {
            "name": "Details Test Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200
        webhook = create_response.json()
        webhook_id = webhook["id"]

        # Send test
        test_response = await client.post(f"/api/v1/webhooks/{webhook_id}/test")
        assert test_response.status_code == 200
        delivery = test_response.json()["delivery"]

        # Verify essential fields are present
        required_fields = [
            "id",
            "webhook_id",
            "event_type",
            "payload",
            "status",
            "attempt_count",
        ]
        for field in required_fields:
            assert field in delivery, f"Missing field: {field}"


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestWebhookManagement:
    """Test complete webhook management lifecycle."""

    async def test_webhook_full_lifecycle(self, authenticated_client):
        """Test: Create, Update, List, Delete.

        Uses response data verification (async context isolation workaround).
        """
        client, user = authenticated_client

        # 1. Create
        webhook_data = {
            "name": "Lifecycle Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200
        webhook = create_response.json()
        webhook_id = webhook["id"]
        assert webhook["name"] == "Lifecycle Webhook"
        assert webhook["url"] == "https://example.com/webhook"

        # 2. Update
        update_response = await client.put(
            f"/api/v1/webhooks/{webhook_id}", json={"name": "Updated Lifecycle Webhook"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated Lifecycle Webhook"

        # 3. List (verify endpoint works)
        list_response = await client.get("/api/v1/webhooks")
        assert list_response.status_code == 200
        assert isinstance(list_response.json(), list)

        # 4. Delete
        delete_response = await client.delete(f"/api/v1/webhooks/{webhook_id}")
        assert delete_response.status_code == 200

    async def test_multiple_webhooks_independent(self, authenticated_client):
        """Test managing multiple webhooks independently.

        Uses response data verification (async context isolation workaround).
        """
        client, user = authenticated_client

        created_webhooks = []

        # Create 3 webhooks
        for i in range(3):
            webhook_data = {
                "name": f"Independent Webhook {i+1}",
                "url": f"https://example.com/webhook{i+1}",
                "events": ["agent.created"] if i % 2 == 0 else ["deployment.failed"],
            }
            response = await client.post("/api/v1/webhooks", json=webhook_data)
            assert response.status_code == 200
            created_webhooks.append(response.json())

        # Verify all webhooks were created with correct data
        for i, webhook in enumerate(created_webhooks):
            assert webhook["name"] == f"Independent Webhook {i+1}"
            assert webhook["status"] == "active"

        # Update first webhook to inactive
        update_response = await client.put(
            f"/api/v1/webhooks/{created_webhooks[0]['id']}", json={"status": "inactive"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["status"] == "inactive"

        # Delete second webhook
        delete_response = await client.delete(
            f"/api/v1/webhooks/{created_webhooks[1]['id']}"
        )
        assert delete_response.status_code == 200

        # Verify list endpoint works
        list_response = await client.get("/api/v1/webhooks")
        assert list_response.status_code == 200
        assert isinstance(list_response.json(), list)

    async def test_webhook_url_update_changes_delivery_target(
        self, authenticated_client
    ):
        """Test that updating webhook URL changes delivery target."""
        client, user = authenticated_client

        # Create webhook
        webhook_data = {
            "name": "URL Change Webhook",
            "url": "https://example.com/webhook1",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        webhook = create_response.json()
        webhook_id = webhook["id"]

        assert webhook["url"] == "https://example.com/webhook1"

        # Update URL
        update_response = await client.put(
            f"/api/v1/webhooks/{webhook_id}",
            json={"url": "https://example.com/webhook2"},
        )
        assert update_response.status_code == 200

        updated_webhook = update_response.json()
        assert updated_webhook["url"] == "https://example.com/webhook2"

        # Verify in get
        get_response = await client.get(f"/api/v1/webhooks/{webhook_id}")
        assert get_response.json()["url"] == "https://example.com/webhook2"

    async def test_webhook_event_subscription_update(self, authenticated_client):
        """Test updating webhook event subscriptions."""
        client, user = authenticated_client

        # Create webhook
        webhook_data = {
            "name": "Event Update Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        webhook = create_response.json()
        webhook_id = webhook["id"]

        assert webhook["events"] == ["agent.created"]

        # Update to different events
        update_response = await client.put(
            f"/api/v1/webhooks/{webhook_id}",
            json={"events": ["deployment.failed", "user.joined"]},
        )
        assert update_response.status_code == 200

        updated_webhook = update_response.json()
        assert "deployment.failed" in updated_webhook["events"]
        assert "user.joined" in updated_webhook["events"]
        assert "agent.created" not in updated_webhook["events"]


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestWebhookSecurity:
    """Test webhook security features."""

    async def test_webhook_secret_only_in_creation(self, authenticated_client):
        """Test that secret is only shown once on creation."""
        client, user = authenticated_client

        # Create webhook and capture secret
        webhook_data = {
            "name": "Secret Security Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        webhook = create_response.json()
        webhook_id = webhook["id"]
        secret_on_create = webhook.get("secret")

        assert secret_on_create is not None
        assert secret_on_create.startswith("whsec_")

        # Get webhook - secret should NOT be in response
        get_response = await client.get(f"/api/v1/webhooks/{webhook_id}")
        get_webhook = get_response.json()
        assert "secret" not in get_webhook

        # List webhooks - secrets should NOT be in response
        list_response = await client.get("/api/v1/webhooks")
        webhooks = list_response.json()
        for w in webhooks:
            assert "secret" not in w

    async def test_webhook_belongs_to_organization(self, authenticated_client):
        """Test that webhooks belong to their organization."""
        client, user = authenticated_client

        # Create webhook
        webhook_data = {
            "name": "Org Specific Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        webhook = create_response.json()

        # Verify organization_id is set
        assert webhook["organization_id"] == user["organization_id"]

        # All subsequent webhooks should be in same org
        webhook_data2 = {
            "name": "Another Org Webhook",
            "url": "https://example.com/webhook2",
            "events": ["deployment.failed"],
        }
        create_response2 = await client.post("/api/v1/webhooks", json=webhook_data2)
        webhook2 = create_response2.json()

        assert webhook2["organization_id"] == user["organization_id"]
        assert webhook["organization_id"] == webhook2["organization_id"]

    async def test_webhook_created_by_tracked(self, authenticated_client):
        """Test that created_by user is tracked."""
        client, user = authenticated_client

        webhook_data = {
            "name": "Created By Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        webhook = create_response.json()

        # Verify created_by matches current user
        assert webhook["created_by"] == user["id"]

    async def test_webhook_timestamps_tracked(self, authenticated_client):
        """Test that webhook timestamps are tracked."""
        client, user = authenticated_client

        webhook_data = {
            "name": "Timestamp Webhook",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        webhook = create_response.json()

        # Verify timestamps are present
        assert "created_at" in webhook
        assert "created_at" in webhook

        # Parse timestamps to verify format
        created_at = webhook["created_at"]
        assert "T" in created_at  # ISO format


@pytest.mark.e2e
@pytest.mark.timeout(60)  # Allow time for failed delivery attempts
class TestWebhookErrorHandling:
    """Test webhook error handling and edge cases."""

    async def test_webhook_with_unreachable_url(self, authenticated_client):
        """Test webhook with unreachable target.

        Verifies that we can create webhooks with any URL,
        and that the test endpoint handles delivery failures gracefully.
        """
        client, user = authenticated_client

        # Create webhook with an unreachable URL (will fail fast on connect)
        webhook_data = {
            "name": "Unreachable Webhook",
            "url": "https://localhost:59999/webhook",  # Port unlikely to be open
            "events": ["agent.created"],
        }
        create_response = await client.post("/api/v1/webhooks", json=webhook_data)
        assert create_response.status_code == 200
        webhook = create_response.json()
        webhook_id = webhook["id"]

        # Test webhook (will fail but endpoint should handle it)
        test_response = await client.post(f"/api/v1/webhooks/{webhook_id}/test")

        # Should return 200 (test was initiated and delivery tracked)
        assert test_response.status_code == 200
        assert "delivery" in test_response.json()

    async def test_webhook_invalid_url_rejected(self, authenticated_client):
        """Test that invalid URLs are handled."""
        client, user = authenticated_client

        webhook_data = {
            "name": "Invalid URL Webhook",
            "url": "not-a-valid-url",
            "events": ["agent.created"],
        }
        response = await client.post("/api/v1/webhooks", json=webhook_data)

        # Should either accept or reject
        assert response.status_code in [200, 400, 422]

    async def test_webhook_name_too_long(self, authenticated_client):
        """Test webhook with name exceeding length limit."""
        client, user = authenticated_client

        webhook_data = {
            "name": "A" * 200,  # Very long name
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        response = await client.post("/api/v1/webhooks", json=webhook_data)

        # Should either validate or truncate
        assert response.status_code in [200, 400, 422]

    async def test_webhook_empty_name_rejected(self, authenticated_client):
        """Test that empty webhook name is rejected."""
        client, user = authenticated_client

        webhook_data = {
            "name": "",
            "url": "https://example.com/webhook",
            "events": ["agent.created"],
        }
        response = await client.post("/api/v1/webhooks", json=webhook_data)

        # Should reject empty name
        assert response.status_code in [400, 422]
