"""
Webhook Service

Business logic for webhook management including delivery, retries, and signature verification.
"""

import asyncio
import hashlib
import hmac
import json
import secrets
import time
import uuid
from datetime import UTC, datetime

import httpx
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

# Available webhook event types
WEBHOOK_EVENTS = [
    "agent.created",
    "agent.updated",
    "agent.deleted",
    "deployment.created",
    "deployment.active",
    "deployment.failed",
    "deployment.stopped",
    "pipeline.created",
    "pipeline.updated",
    "user.invited",
    "user.joined",
]

# Retry delays in seconds (exponential backoff)
RETRY_DELAYS = [0, 60, 300]  # Immediate, 1 minute, 5 minutes
MAX_ATTEMPTS = 3


class WebhookService:
    """
    Service for managing webhooks and deliveries.

    Features:
    - Webhook CRUD operations
    - HMAC-SHA256 payload signing
    - Automatic retry with exponential backoff
    - Delivery history tracking
    """

    def __init__(self, runtime=None):
        """Initialize the webhook service."""
        self.runtime = runtime or AsyncLocalRuntime()

    def _generate_secret(self) -> str:
        """
        Generate a webhook secret for HMAC signing.

        Returns:
            Random secret string
        """
        return f"whsec_{secrets.token_urlsafe(32)}"

    def sign_payload(self, payload: str, secret: str) -> str:
        """
        Sign a payload with HMAC-SHA256.

        Args:
            payload: JSON payload string
            secret: Webhook secret

        Returns:
            HMAC signature as hex string
        """
        signature = hmac.new(
            secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"

    def verify_signature(self, payload: str, signature: str, secret: str) -> bool:
        """
        Verify a webhook signature.

        Args:
            payload: JSON payload string
            signature: Signature to verify
            secret: Webhook secret

        Returns:
            True if signature is valid
        """
        expected = self.sign_payload(payload, secret)
        return hmac.compare_digest(expected, signature)

    async def create(
        self,
        org_id: str,
        name: str,
        url: str,
        events: list,
        user_id: str,
    ) -> dict:
        """
        Create a new webhook.

        Args:
            org_id: Organization ID
            name: Webhook name
            url: Target URL
            events: List of event types to subscribe to
            user_id: User creating the webhook

        Returns:
            Created webhook record
        """
        webhook_id = str(uuid.uuid4())
        secret = self._generate_secret()
        now = datetime.now(UTC).isoformat()

        # Validate events
        valid_events = [e for e in events if e in WEBHOOK_EVENTS]

        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookCreateNode",
            "create_webhook",
            {
                "id": webhook_id,
                "organization_id": org_id,
                "name": name,
                "url": url,
                "secret": secret,
                "events": json.dumps(valid_events),
                "status": "active",
                "last_triggered_at": "",  # Kailash requires string, not None
                "failure_count": 0,
                "created_by": user_id,
                # Note: created_at and updated_at are auto-managed by DataFlow
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return {
            "id": webhook_id,
            "organization_id": org_id,
            "name": name,
            "url": url,
            "secret": secret,
            "events": valid_events,
            "status": "active",
            "last_triggered_at": "",
            "failure_count": 0,
            "created_by": user_id,
            "created_at": now,
        }

    async def get(self, webhook_id: str) -> dict | None:
        """
        Get a webhook by ID.

        Args:
            webhook_id: Webhook ID

        Returns:
            Webhook record or None
        """
        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                "WebhookReadNode",
                "read_webhook",
                {
                    "id": webhook_id,
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            webhook = results.get("read_webhook")
            if not webhook:
                return None

            return {
                "id": webhook["id"],
                "organization_id": webhook["organization_id"],
                "name": webhook["name"],
                "url": webhook["url"],
                "secret": webhook["secret"],
                "events": json.loads(webhook["events"]) if webhook["events"] else [],
                "status": webhook["status"],
                "last_triggered_at": webhook.get("last_triggered_at"),
                "failure_count": webhook["failure_count"],
                "created_by": webhook["created_by"],
                "created_at": webhook["created_at"],
            }
        except Exception:
            # ReadNode throws when record not found
            return None

    async def update(self, webhook_id: str, data: dict) -> dict | None:
        """
        Update a webhook.

        Args:
            webhook_id: Webhook ID
            data: Fields to update

        Returns:
            Updated webhook record or None
        """
        # Note: updated_at is auto-managed by DataFlow
        fields = {}

        if "name" in data:
            fields["name"] = data["name"]
        if "url" in data:
            fields["url"] = data["url"]
        if "events" in data:
            valid_events = [e for e in data["events"] if e in WEBHOOK_EVENTS]
            fields["events"] = json.dumps(valid_events)
        if "status" in data:
            fields["status"] = data["status"]

        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookUpdateNode",
            "update_webhook",
            {
                "filter": {"id": webhook_id},
                "fields": fields,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return await self.get(webhook_id)

    async def delete(self, webhook_id: str) -> None:
        """
        Delete a webhook.

        Args:
            webhook_id: Webhook ID
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookDeleteNode",
            "delete_webhook",
            {
                "id": webhook_id,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    async def list(self, organization_id: str) -> list:
        """
        List all webhooks for an organization.

        Args:
            organization_id: Organization ID

        Returns:
            List of webhook records
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookListNode",
            "list_webhooks",
            {
                "filter": {"organization_id": organization_id},
                "limit": 100,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        webhooks = results.get("list_webhooks", {}).get("records", [])
        return [
            {
                "id": w["id"],
                "organization_id": w["organization_id"],
                "name": w["name"],
                "url": w["url"],
                "events": json.loads(w["events"]) if w["events"] else [],
                "status": w["status"],
                "last_triggered_at": w.get("last_triggered_at"),
                "failure_count": w["failure_count"],
                "created_by": w["created_by"],
                "created_at": w["created_at"],
            }
            for w in webhooks
        ]

    async def trigger(
        self,
        organization_id: str,
        event_type: str,
        data: dict,
    ) -> None:
        """
        Trigger webhooks for an event.

        Args:
            organization_id: Organization ID
            event_type: Event type
            data: Event data payload
        """
        # Get all active webhooks for this organization subscribed to this event
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookListNode",
            "list_webhooks",
            {
                "filter": {
                    "organization_id": organization_id,
                    "status": "active",
                },
                "limit": 100,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        webhooks = results.get("list_webhooks", {}).get("records", [])

        # Filter webhooks subscribed to this event
        for webhook in webhooks:
            events = json.loads(webhook["events"]) if webhook["events"] else []
            if event_type in events:
                # Deliver to each webhook asynchronously
                asyncio.create_task(
                    self.deliver(
                        {
                            "id": webhook["id"],
                            "url": webhook["url"],
                            "secret": webhook["secret"],
                        },
                        event_type,
                        data,
                        organization_id,
                    )
                )

    async def deliver(
        self,
        webhook: dict,
        event_type: str,
        data: dict,
        organization_id: str,
    ) -> dict:
        """
        Deliver a webhook payload.

        Args:
            webhook: Webhook record (id, url, secret)
            event_type: Event type
            data: Event data
            organization_id: Organization ID

        Returns:
            Delivery record
        """
        now = datetime.now(UTC).isoformat()
        delivery_id = str(uuid.uuid4())
        timestamp = int(time.time())

        # Build payload
        payload_dict = {
            "id": f"evt_{uuid.uuid4().hex[:12]}",
            "type": event_type,
            "organization_id": organization_id,
            "data": data,
            "created_at": now,
        }
        payload = json.dumps(payload_dict)

        # Sign payload
        signature = self.sign_payload(payload, webhook["secret"])

        # Create delivery record with initial values
        # Database schema requires non-null for response fields, so we provide defaults
        # created_at and updated_at are auto-managed by DataFlow
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookDeliveryCreateNode",
            "create_delivery",
            {
                "id": delivery_id,
                "webhook_id": webhook["id"],
                "event_type": event_type,
                "payload": payload,
                "status": "pending",
                "attempt_count": 0,
                "response_status": 0,  # Will be updated after delivery attempt
                "response_body": "",  # Will be updated after delivery attempt
                "duration_ms": 0,  # Will be updated after delivery attempt
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        # Attempt delivery with retries
        for attempt in range(MAX_ATTEMPTS):
            if attempt > 0:
                # Wait before retry
                await asyncio.sleep(RETRY_DELAYS[attempt])

            start_time = time.time()
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        webhook["url"],
                        content=payload,
                        headers={
                            "Content-Type": "application/json",
                            "X-Webhook-Signature": signature,
                            "X-Webhook-Timestamp": str(timestamp),
                        },
                    )

                duration_ms = int((time.time() - start_time) * 1000)
                success = 200 <= response.status_code < 300

                # Update delivery record
                workflow = WorkflowBuilder()
                workflow.add_node(
                    "WebhookDeliveryUpdateNode",
                    "update_delivery",
                    {
                        "filter": {"id": delivery_id},
                        "fields": {
                            "response_status": response.status_code,
                            "response_body": (
                                response.text[:1000] if response.text else None
                            ),
                            "duration_ms": duration_ms,
                            "status": "success" if success else "failed",
                            "attempt_count": attempt + 1,
                        },
                    },
                )

                await self.runtime.execute_workflow_async(workflow.build(), inputs={})

                if success:
                    # Reset failure count on success
                    await self._update_webhook_status(webhook["id"], 0)
                    break
                else:
                    # Increment failure count
                    await self._increment_failure_count(webhook["id"])

                    # Don't retry on 4xx client errors (they won't succeed with retry)
                    if 400 <= response.status_code < 500:
                        break

            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)

                # Update delivery record with error
                # Use 0 for response_status on connection error (DB requires non-null)
                workflow = WorkflowBuilder()
                workflow.add_node(
                    "WebhookDeliveryUpdateNode",
                    "update_delivery",
                    {
                        "filter": {"id": delivery_id},
                        "fields": {
                            "response_status": 0,  # 0 indicates connection error
                            "response_body": str(e)[:1000],
                            "duration_ms": duration_ms,
                            "status": "failed",
                            "attempt_count": attempt + 1,
                        },
                    },
                )

                await self.runtime.execute_workflow_async(workflow.build(), inputs={})

                # Increment failure count
                await self._increment_failure_count(webhook["id"])

                # Don't retry on connection errors (they usually persist)
                break

        # Update last triggered timestamp
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookUpdateNode",
            "update_triggered",
            {
                "filter": {"id": webhook["id"]},
                "fields": {"last_triggered_at": now},
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

        return await self.get_delivery(delivery_id)

    async def _update_webhook_status(self, webhook_id: str, failure_count: int) -> None:
        """Update webhook failure count."""
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookUpdateNode",
            "update_status",
            {
                "filter": {"id": webhook_id},
                "fields": {"failure_count": failure_count},
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    async def _increment_failure_count(self, webhook_id: str) -> None:
        """Increment webhook failure count."""
        webhook = await self.get(webhook_id)
        if webhook:
            new_count = webhook["failure_count"] + 1
            await self._update_webhook_status(webhook_id, new_count)

    async def retry_failed(self, delivery_id: str) -> dict | None:
        """
        Retry a failed delivery.

        Args:
            delivery_id: Delivery ID to retry

        Returns:
            New delivery record or None
        """
        delivery = await self.get_delivery(delivery_id)
        if not delivery or delivery["status"] != "failed":
            return None

        webhook = await self.get(delivery["webhook_id"])
        if not webhook:
            return None

        # Parse original payload
        payload_dict = json.loads(delivery["payload"])

        # Create new delivery
        return await self.deliver(
            {
                "id": webhook["id"],
                "url": webhook["url"],
                "secret": webhook["secret"],
            },
            delivery["event_type"],
            payload_dict["data"],
            payload_dict["organization_id"],
        )

    async def list_deliveries(
        self,
        webhook_id: str,
        limit: int = 50,
    ) -> list:
        """
        List delivery history for a webhook.

        Args:
            webhook_id: Webhook ID
            limit: Maximum records to return

        Returns:
            List of delivery records
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookDeliveryListNode",
            "list_deliveries",
            {
                "filter": {"webhook_id": webhook_id},
                "limit": limit,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        deliveries = results.get("list_deliveries", {}).get("records", [])
        return [
            {
                "id": d["id"],
                "webhook_id": d["webhook_id"],
                "event_type": d["event_type"],
                "payload": d["payload"],
                "response_status": d.get("response_status"),
                "response_body": d.get("response_body"),
                "duration_ms": d.get("duration_ms"),
                "status": d["status"],
                "attempt_count": d["attempt_count"],
                "created_at": d["created_at"],
            }
            for d in deliveries
        ]

    async def get_delivery(self, delivery_id: str) -> dict | None:
        """
        Get a delivery by ID.

        Args:
            delivery_id: Delivery ID

        Returns:
            Delivery record or None
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "WebhookDeliveryReadNode",
            "read_delivery",
            {
                "id": delivery_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        delivery = results.get("read_delivery")
        if not delivery:
            return None

        return {
            "id": delivery["id"],
            "webhook_id": delivery["webhook_id"],
            "event_type": delivery["event_type"],
            "payload": delivery["payload"],
            "response_status": delivery.get("response_status"),
            "response_body": delivery.get("response_body"),
            "duration_ms": delivery.get("duration_ms"),
            "status": delivery["status"],
            "attempt_count": delivery["attempt_count"],
            "created_at": delivery["created_at"],
        }
