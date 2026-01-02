# Testing Strategy: External Integrations

## Executive Summary

This document defines the comprehensive testing strategy for External Agent Integrations in Kaizen Studio. It follows the established **3-tier testing methodology** (Unit, Integration, E2E) with strict adherence to the **NO MOCKING policy** for Tiers 2-3.

### Testing Scope

- External agent wrapper and registration
- Platform adapters (MS Teams, Discord, Telegram, Slack, Notion)
- Webhook delivery and retry mechanisms
- Authentication lineage tracking
- Budget enforcement and rate limiting
- Governance policies

### Success Criteria

- **Tier 1 (Unit)**: <1 second per test, 100% coverage of pure functions
- **Tier 2 (Integration)**: <5 seconds per test, real infrastructure validation
- **Tier 3 (E2E)**: <10 seconds per test, complete workflow verification
- **NO MOCKING** in Tiers 2-3: All tests use real PostgreSQL, Redis, and HTTP endpoints

---

## 1. Testing Tiers Overview

### Tier 1: Unit Tests (Mocking Allowed)

**Purpose**: Test isolated components and pure functions
**Infrastructure**: In-memory, mocked external services
**Speed Target**: <1 second per test
**Location**: `tests/unit/`

**What to Test**:
- Platform adapter payload transformations
- Lineage data model validation
- Governance config parsing
- HMAC signature generation/verification
- Event filtering logic
- Retry calculation algorithms

**Mocking Allowed For**:
- External HTTP clients (httpx)
- Time-based operations (freeze_time)
- Random/UUID generation (for deterministic tests)
- Environment variables

### Tier 2: Integration Tests (NO MOCKING)

**Purpose**: Test component interactions with real infrastructure
**Infrastructure**: Real PostgreSQL, Redis, test HTTP servers
**Speed Target**: <5 seconds per test
**Location**: `tests/integration/`

**What to Test**:
- External agent registration flow
- Webhook delivery to real test endpoints
- Auth lineage capture in database
- Budget enforcement with real quota checks
- Platform adapter integration with test servers
- RBAC policy enforcement

**CRITICAL**: NO MOCKING of:
- Database operations
- Redis cache operations
- HTTP requests (use real test servers)
- DataFlow nodes
- File operations

### Tier 3: End-to-End Tests (NO MOCKING)

**Purpose**: Test complete user workflows
**Infrastructure**: Full system with real services
**Speed Target**: <10 seconds per test
**Location**: `tests/e2e/` (backend), `apps/frontend/e2e/` (frontend)

**What to Test**:
- Complete external agent registration workflow
- Webhook configuration and delivery UI
- Lineage viewer with real data
- Multi-step governance enforcement
- Error recovery and retry flows
- Frontend-to-backend integration

---

## 2. Backend Test Structure

### Directory Organization

```
apps/kaizen-studio/tests/
├── unit/
│   ├── test_platform_adapters.py           # Platform payload transformations
│   ├── test_lineage_model.py               # Lineage data validation
│   ├── test_governance_config.py           # Governance config parsing
│   ├── test_external_agent_wrapper.py      # Wrapper logic (isolated)
│   └── test_webhook_signature.py           # HMAC signing/verification
│
├── integration/
│   ├── test_external_agent_api.py          # Agent registration endpoints
│   ├── test_webhook_delivery.py            # Real webhook delivery
│   ├── test_auth_lineage.py                # Lineage capture integration
│   ├── test_budget_enforcement.py          # Quota and rate limiting
│   ├── test_platform_adapters_integration.py  # Adapter HTTP integration
│   └── test_governance_enforcement.py      # Policy enforcement
│
└── e2e/
    ├── test_external_agent_workflow.py     # Complete agent lifecycle
    ├── test_webhook_e2e.py                 # Webhook setup to delivery
    └── test_lineage_tracking_e2e.py        # Full lineage capture flow
```

---

## 3. Frontend Test Structure

### Directory Organization

```
apps/kaizen-studio/apps/frontend/
├── src/features/external-agents/
│   └── components/__tests__/
│       ├── ExternalAgentList.test.tsx       # Agent list component
│       ├── ExternalAgentWizard.test.tsx     # Registration wizard
│       ├── LineageViewer.test.tsx           # Lineage visualization
│       ├── WebhookConfigForm.test.tsx       # Webhook configuration
│       └── PlatformSelector.test.tsx        # Platform selection
│
└── e2e/
    ├── external-agents.spec.ts              # E2E agent workflows
    ├── webhook-platforms.spec.ts            # Platform-specific webhooks
    └── lineage-viewer.spec.ts               # Lineage UI workflows
```

---

## 4. Test Implementation Examples

### 4.1 Tier 1: Unit Tests

#### Platform Adapter Payload Transformation

```python
"""
Tier 1: Platform Adapters Unit Tests

Tests payload transformation logic for each platform.
Mocking is allowed for HTTP clients and time operations.
"""

import pytest
from datetime import datetime, UTC
from freezegun import freeze_time
from studio.services.platform_adapters import (
    TeamsAdapter,
    DiscordAdapter,
    TelegramAdapter,
    SlackAdapter,
    NotionAdapter
)


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestTeamsAdapterPayloadTransformation:
    """Test MS Teams Adaptive Card payload transformation."""

    def test_transform_text_message_to_adaptive_card(self):
        """Should transform plain text to Adaptive Card format."""
        adapter = TeamsAdapter()

        input_message = {
            "type": "text",
            "content": "Hello from Kaizen Studio!",
            "metadata": {
                "agent_id": "agent-123",
                "workspace_id": "ws-456"
            }
        }

        result = adapter.transform_outbound(input_message)

        # Verify Adaptive Card structure
        assert result["type"] == "message"
        assert result["attachments"][0]["contentType"] == "application/vnd.microsoft.card.adaptive"

        card = result["attachments"][0]["content"]
        assert card["type"] == "AdaptiveCard"
        assert card["version"] == "1.4"
        assert len(card["body"]) > 0
        assert card["body"][0]["type"] == "TextBlock"
        assert card["body"][0]["text"] == "Hello from Kaizen Studio!"

    def test_transform_rich_message_with_buttons(self):
        """Should transform rich message with action buttons."""
        adapter = TeamsAdapter()

        input_message = {
            "type": "rich",
            "content": "Choose an option:",
            "actions": [
                {"type": "button", "label": "Approve", "value": "approve"},
                {"type": "button", "label": "Reject", "value": "reject"}
            ]
        }

        result = adapter.transform_outbound(input_message)

        card = result["attachments"][0]["content"]
        assert "actions" in card
        assert len(card["actions"]) == 2
        assert card["actions"][0]["type"] == "Action.Submit"
        assert card["actions"][0]["title"] == "Approve"
        assert card["actions"][0]["data"]["value"] == "approve"

    def test_validate_inbound_webhook_payload(self):
        """Should validate inbound webhook payload from Teams."""
        adapter = TeamsAdapter()

        # Valid Teams webhook payload
        valid_payload = {
            "type": "message",
            "id": "msg-123",
            "timestamp": "2025-12-20T10:00:00Z",
            "from": {
                "id": "user-456",
                "name": "John Doe"
            },
            "text": "Help me with this task"
        }

        result = adapter.validate_inbound(valid_payload)
        assert result is True

    def test_reject_invalid_inbound_payload(self):
        """Should reject invalid inbound payload."""
        adapter = TeamsAdapter()

        # Missing required fields
        invalid_payload = {
            "type": "message"
            # Missing id, timestamp, from, text
        }

        result = adapter.validate_inbound(invalid_payload)
        assert result is False


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestDiscordAdapterPayloadTransformation:
    """Test Discord embed payload transformation."""

    def test_transform_text_to_discord_embed(self):
        """Should transform text to Discord embed format."""
        adapter = DiscordAdapter()

        input_message = {
            "type": "text",
            "content": "Task completed successfully!",
            "metadata": {
                "color": "success"
            }
        }

        result = adapter.transform_outbound(input_message)

        assert "embeds" in result
        assert len(result["embeds"]) == 1

        embed = result["embeds"][0]
        assert embed["description"] == "Task completed successfully!"
        assert embed["color"] == 0x00FF00  # Green for success
        assert "timestamp" in embed

    def test_transform_error_message_with_red_color(self):
        """Should use red color for error messages."""
        adapter = DiscordAdapter()

        input_message = {
            "type": "text",
            "content": "Operation failed!",
            "metadata": {
                "color": "error"
            }
        }

        result = adapter.transform_outbound(input_message)
        embed = result["embeds"][0]

        assert embed["color"] == 0xFF0000  # Red for error


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestTelegramAdapterPayloadTransformation:
    """Test Telegram Bot API payload transformation."""

    def test_transform_text_to_telegram_format(self):
        """Should transform text to Telegram sendMessage format."""
        adapter = TelegramAdapter()

        input_message = {
            "type": "text",
            "content": "Your report is ready!",
            "recipient": "chat-123"
        }

        result = adapter.transform_outbound(input_message)

        assert result["chat_id"] == "chat-123"
        assert result["text"] == "Your report is ready!"
        assert result["parse_mode"] == "Markdown"

    def test_transform_message_with_inline_keyboard(self):
        """Should create inline keyboard for actions."""
        adapter = TelegramAdapter()

        input_message = {
            "type": "rich",
            "content": "Select an action:",
            "recipient": "chat-123",
            "actions": [
                {"type": "button", "label": "View", "callback_data": "view_123"},
                {"type": "button", "label": "Download", "callback_data": "dl_123"}
            ]
        }

        result = adapter.transform_outbound(input_message)

        assert "reply_markup" in result
        keyboard = result["reply_markup"]["inline_keyboard"]
        assert len(keyboard) == 1
        assert len(keyboard[0]) == 2
        assert keyboard[0][0]["text"] == "View"
        assert keyboard[0][0]["callback_data"] == "view_123"
```

#### Lineage Data Model Validation

```python
"""
Tier 1: Lineage Model Unit Tests

Tests lineage data structure validation.
"""

import pytest
import uuid
from datetime import datetime, UTC
from studio.models.lineage import LineageNode, LineageChain, validate_lineage_data


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestLineageNodeValidation:
    """Test lineage node data validation."""

    def test_valid_lineage_node_structure(self):
        """Should accept valid lineage node structure."""
        node_data = {
            "id": str(uuid.uuid4()),
            "agent_id": "agent-123",
            "agent_name": "External GPT-4",
            "platform": "openai",
            "action": "completion",
            "timestamp": datetime.now(UTC).isoformat(),
            "input_tokens": 100,
            "output_tokens": 50,
            "cost_usd": 0.0015,
            "metadata": {
                "model": "gpt-4-turbo",
                "temperature": 0.7
            }
        }

        is_valid, errors = validate_lineage_data(node_data)

        assert is_valid is True
        assert len(errors) == 0

    def test_reject_missing_required_fields(self):
        """Should reject lineage node with missing required fields."""
        node_data = {
            "id": str(uuid.uuid4()),
            "agent_id": "agent-123",
            # Missing: agent_name, platform, action, timestamp
        }

        is_valid, errors = validate_lineage_data(node_data)

        assert is_valid is False
        assert "agent_name" in str(errors)
        assert "platform" in str(errors)

    def test_validate_token_counts_positive(self):
        """Should reject negative token counts."""
        node_data = {
            "id": str(uuid.uuid4()),
            "agent_id": "agent-123",
            "agent_name": "Test Agent",
            "platform": "openai",
            "action": "completion",
            "timestamp": datetime.now(UTC).isoformat(),
            "input_tokens": -10,  # Invalid: negative
            "output_tokens": 50,
        }

        is_valid, errors = validate_lineage_data(node_data)

        assert is_valid is False
        assert "input_tokens" in str(errors)

    def test_validate_timestamp_format(self):
        """Should validate ISO 8601 timestamp format."""
        node_data = {
            "id": str(uuid.uuid4()),
            "agent_id": "agent-123",
            "agent_name": "Test Agent",
            "platform": "openai",
            "action": "completion",
            "timestamp": "invalid-timestamp",  # Invalid format
            "input_tokens": 100,
            "output_tokens": 50,
        }

        is_valid, errors = validate_lineage_data(node_data)

        assert is_valid is False
        assert "timestamp" in str(errors)


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestLineageChainValidation:
    """Test lineage chain data validation."""

    def test_valid_lineage_chain(self):
        """Should accept valid lineage chain structure."""
        chain_data = {
            "chain_id": str(uuid.uuid4()),
            "execution_id": "exec-123",
            "workspace_id": "ws-456",
            "initiated_by": "user-789",
            "nodes": [
                {
                    "id": str(uuid.uuid4()),
                    "agent_id": "agent-1",
                    "agent_name": "Initial Agent",
                    "platform": "kaizen",
                    "action": "process",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "input_tokens": 100,
                    "output_tokens": 50,
                },
                {
                    "id": str(uuid.uuid4()),
                    "agent_id": "agent-2",
                    "agent_name": "External GPT-4",
                    "platform": "openai",
                    "action": "completion",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "input_tokens": 200,
                    "output_tokens": 150,
                    "parent_node_id": None  # First external call
                }
            ]
        }

        chain = LineageChain(**chain_data)

        assert chain.chain_id == chain_data["chain_id"]
        assert len(chain.nodes) == 2
        assert chain.get_total_tokens() == 500
        assert chain.get_external_calls_count() == 1

    def test_calculate_chain_metrics(self):
        """Should calculate aggregate metrics for lineage chain."""
        chain = LineageChain(
            chain_id=str(uuid.uuid4()),
            execution_id="exec-123",
            workspace_id="ws-456",
            initiated_by="user-789",
            nodes=[
                LineageNode(
                    id=str(uuid.uuid4()),
                    agent_id="agent-1",
                    agent_name="Agent 1",
                    platform="kaizen",
                    action="process",
                    timestamp=datetime.now(UTC).isoformat(),
                    input_tokens=100,
                    output_tokens=50,
                    cost_usd=0.001
                ),
                LineageNode(
                    id=str(uuid.uuid4()),
                    agent_id="agent-2",
                    agent_name="Agent 2",
                    platform="openai",
                    action="completion",
                    timestamp=datetime.now(UTC).isoformat(),
                    input_tokens=200,
                    output_tokens=150,
                    cost_usd=0.002
                )
            ]
        )

        metrics = chain.calculate_metrics()

        assert metrics["total_tokens"] == 500
        assert metrics["total_cost_usd"] == 0.003
        assert metrics["external_calls"] == 1
        assert metrics["platforms_used"] == {"kaizen", "openai"}
```

#### Governance Config Validation

```python
"""
Tier 1: Governance Config Unit Tests

Tests governance policy configuration parsing and validation.
"""

import pytest
from studio.services.governance import (
    GovernanceConfig,
    BudgetPolicy,
    PlatformPolicy,
    validate_governance_config
)


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestBudgetPolicyValidation:
    """Test budget policy configuration validation."""

    def test_valid_budget_policy(self):
        """Should accept valid budget policy configuration."""
        config = {
            "enabled": True,
            "daily_limit_usd": 100.00,
            "monthly_limit_usd": 2000.00,
            "per_execution_limit_usd": 5.00,
            "alert_threshold_pct": 80,
            "enforcement": "hard"
        }

        policy = BudgetPolicy(**config)

        assert policy.enabled is True
        assert policy.daily_limit_usd == 100.00
        assert policy.enforcement == "hard"

    def test_reject_invalid_alert_threshold(self):
        """Should reject alert threshold outside valid range."""
        config = {
            "enabled": True,
            "daily_limit_usd": 100.00,
            "alert_threshold_pct": 150,  # Invalid: >100
        }

        with pytest.raises(ValueError, match="alert_threshold_pct"):
            BudgetPolicy(**config)

    def test_reject_negative_limits(self):
        """Should reject negative budget limits."""
        config = {
            "enabled": True,
            "daily_limit_usd": -10.00,  # Invalid: negative
        }

        with pytest.raises(ValueError, match="daily_limit_usd"):
            BudgetPolicy(**config)


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestPlatformPolicyValidation:
    """Test platform policy configuration validation."""

    def test_valid_platform_allowlist(self):
        """Should accept valid platform allowlist."""
        config = {
            "mode": "allowlist",
            "platforms": ["openai", "anthropic", "google"],
            "require_approval": True
        }

        policy = PlatformPolicy(**config)

        assert policy.mode == "allowlist"
        assert len(policy.platforms) == 3
        assert "openai" in policy.platforms

    def test_valid_platform_blocklist(self):
        """Should accept valid platform blocklist."""
        config = {
            "mode": "blocklist",
            "platforms": ["untrusted-platform"],
            "require_approval": False
        }

        policy = PlatformPolicy(**config)

        assert policy.mode == "blocklist"
        assert "untrusted-platform" in policy.platforms

    def test_reject_invalid_mode(self):
        """Should reject invalid platform policy mode."""
        config = {
            "mode": "invalid-mode",  # Invalid: not allowlist/blocklist
            "platforms": ["openai"]
        }

        with pytest.raises(ValueError, match="mode"):
            PlatformPolicy(**config)


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestGovernanceConfigValidation:
    """Test complete governance configuration validation."""

    def test_valid_governance_config(self):
        """Should accept complete valid governance configuration."""
        config = {
            "organization_id": "org-123",
            "budget_policy": {
                "enabled": True,
                "daily_limit_usd": 100.00,
                "enforcement": "hard"
            },
            "platform_policy": {
                "mode": "allowlist",
                "platforms": ["openai", "anthropic"],
                "require_approval": True
            },
            "audit_settings": {
                "log_all_calls": True,
                "retention_days": 90
            }
        }

        is_valid, errors = validate_governance_config(config)

        assert is_valid is True
        assert len(errors) == 0

    def test_merge_workspace_overrides(self):
        """Should correctly merge workspace-level overrides."""
        org_config = GovernanceConfig(
            organization_id="org-123",
            budget_policy=BudgetPolicy(
                enabled=True,
                daily_limit_usd=100.00
            )
        )

        workspace_override = {
            "budget_policy": {
                "daily_limit_usd": 50.00  # Stricter limit
            }
        }

        merged = org_config.merge_workspace_override(workspace_override)

        assert merged.budget_policy.daily_limit_usd == 50.00
        assert merged.budget_policy.enabled is True  # Preserved from org
```

---

### 4.2 Tier 2: Integration Tests (NO MOCKING)

#### External Agent Registration Flow

```python
"""
Tier 2: External Agent API Integration Tests

Tests external agent registration with real database and HTTP.
NO MOCKING - uses real DataFlow nodes and PostgreSQL.
"""

import pytest
import uuid
from kailash.runtime import AsyncLocalRuntime


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestExternalAgentRegistration:
    """Test external agent registration endpoints with real infrastructure."""

    @pytest.mark.asyncio
    async def test_register_external_agent_success(
        self, authenticated_client, test_db
    ):
        """Should register external agent and create database records."""
        client, user = authenticated_client

        registration_data = {
            "name": "External GPT-4 Agent",
            "platform": "openai",
            "platform_agent_id": "gpt-4-turbo-preview",
            "workspace_id": "ws-" + uuid.uuid4().hex[:8],
            "capabilities": {
                "text_generation": True,
                "function_calling": True,
                "vision": True
            },
            "config": {
                "model": "gpt-4-turbo-preview",
                "temperature": 0.7,
                "max_tokens": 4096
            },
            "credentials": {
                "api_key": "sk-test-key-123"  # Will be encrypted
            }
        }

        response = await client.post(
            "/api/v1/external-agents",
            json=registration_data
        )

        assert response.status_code == 201
        agent = response.json()

        # Verify response structure
        assert agent["name"] == "External GPT-4 Agent"
        assert agent["platform"] == "openai"
        assert agent["status"] == "active"
        assert agent["organization_id"] == user["organization_id"]
        assert "id" in agent
        assert "created_at" in agent

        # Verify credentials are NOT returned (security)
        assert "credentials" not in agent
        assert "api_key" not in agent

        # Verify database record creation using real DataFlow
        runtime = AsyncLocalRuntime()
        from kailash.workflow.builder import WorkflowBuilder

        workflow = WorkflowBuilder()
        workflow.add_node(
            "ExternalAgentQueryNode",
            "query",
            {"filter": {"id": agent["id"]}}
        )

        results, _ = await runtime.execute_workflow_async(
            workflow.build(),
            inputs={}
        )

        db_agent = results["query"]["results"][0]
        assert db_agent["id"] == agent["id"]
        assert db_agent["platform"] == "openai"

        # Verify credentials are encrypted in database
        assert db_agent["encrypted_credentials"] is not None
        assert db_agent["encrypted_credentials"] != "sk-test-key-123"

    @pytest.mark.asyncio
    async def test_register_agent_enforces_platform_policy(
        self, authenticated_client, test_db
    ):
        """Should enforce platform governance policy during registration."""
        client, user = authenticated_client

        # Set up governance policy: only allow OpenAI and Anthropic
        gov_policy = {
            "organization_id": user["organization_id"],
            "platform_policy": {
                "mode": "allowlist",
                "platforms": ["openai", "anthropic"]
            }
        }

        # Create governance policy in database
        runtime = AsyncLocalRuntime()
        from kailash.workflow.builder import WorkflowBuilder

        workflow = WorkflowBuilder()
        workflow.add_node(
            "GovernancePolicyCreateNode",
            "create_policy",
            gov_policy
        )

        await runtime.execute_workflow_async(workflow.build(), inputs={})

        # Attempt to register agent with blocked platform
        registration_data = {
            "name": "Blocked Agent",
            "platform": "untrusted-platform",  # Not in allowlist
            "platform_agent_id": "agent-123",
            "workspace_id": "ws-test"
        }

        response = await client.post(
            "/api/v1/external-agents",
            json=registration_data
        )

        # Should be rejected by governance policy
        assert response.status_code == 403
        error = response.json()
        assert "platform_policy" in error["detail"].lower()
        assert "untrusted-platform" in error["detail"].lower()

    @pytest.mark.asyncio
    async def test_list_external_agents_filters_by_workspace(
        self, authenticated_client, test_db
    ):
        """Should filter external agents by workspace."""
        client, user = authenticated_client

        workspace_1 = "ws-" + uuid.uuid4().hex[:8]
        workspace_2 = "ws-" + uuid.uuid4().hex[:8]

        # Create agents in different workspaces
        for i, workspace_id in enumerate([workspace_1, workspace_1, workspace_2]):
            await client.post(
                "/api/v1/external-agents",
                json={
                    "name": f"Agent {i}",
                    "platform": "openai",
                    "platform_agent_id": f"agent-{i}",
                    "workspace_id": workspace_id
                }
            )

        # Query workspace_1 (should have 2 agents)
        response = await client.get(
            f"/api/v1/external-agents?workspace_id={workspace_1}"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["agents"]) == 2
        assert all(a["workspace_id"] == workspace_1 for a in data["agents"])

        # Query workspace_2 (should have 1 agent)
        response = await client.get(
            f"/api/v1/external-agents?workspace_id={workspace_2}"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["agents"]) == 1
        assert data["agents"][0]["workspace_id"] == workspace_2
```

#### Webhook Delivery Integration

```python
"""
Tier 2: Webhook Delivery Integration Tests

Tests webhook delivery to real test HTTP servers.
NO MOCKING - uses real HTTP servers and database.
"""

import pytest
import asyncio
import hmac
import hashlib
from aiohttp import web


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestWebhookDelivery:
    """Test webhook delivery with real HTTP servers."""

    @pytest.mark.asyncio
    async def test_deliver_webhook_to_real_endpoint(
        self, authenticated_client, test_db
    ):
        """Should deliver webhook to real HTTP endpoint."""
        client, user = authenticated_client

        # Start test webhook receiver
        received_webhooks = []

        async def webhook_handler(request):
            payload = await request.json()
            headers = dict(request.headers)
            received_webhooks.append({
                "payload": payload,
                "headers": headers
            })
            return web.Response(status=200, text="OK")

        app = web.Application()
        app.router.add_post('/webhook', webhook_handler)

        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', 8899)
        await site.start()

        try:
            # Register webhook
            webhook_data = {
                "name": "Test Webhook",
                "url": "http://localhost:8899/webhook",
                "events": ["external_agent.invoked"]
            }

            webhook_response = await client.post(
                "/api/v1/webhooks",
                json=webhook_data
            )

            assert webhook_response.status_code == 200
            webhook = webhook_response.json()
            webhook_secret = webhook["secret"]

            # Trigger event that should fire webhook
            await client.post(
                "/api/v1/external-agents/invoke",
                json={
                    "agent_id": "agent-123",
                    "input": {"message": "Test"}
                }
            )

            # Wait for webhook delivery
            await asyncio.sleep(1)

            # Verify webhook was delivered
            assert len(received_webhooks) == 1

            received = received_webhooks[0]
            payload = received["payload"]
            headers = received["headers"]

            # Verify payload structure
            assert payload["event"] == "external_agent.invoked"
            assert "data" in payload
            assert "timestamp" in payload

            # Verify HMAC signature
            signature = headers.get("X-Webhook-Signature")
            assert signature is not None
            assert signature.startswith("sha256=")

            # Verify signature is valid
            import json
            payload_str = json.dumps(payload, separators=(',', ':'))
            expected_sig = "sha256=" + hmac.new(
                webhook_secret.encode(),
                payload_str.encode(),
                hashlib.sha256
            ).hexdigest()

            assert signature == expected_sig

        finally:
            await site.stop()
            await runner.cleanup()

    @pytest.mark.asyncio
    async def test_webhook_retry_on_failure(
        self, authenticated_client, test_db
    ):
        """Should retry webhook delivery on failure."""
        client, user = authenticated_client

        attempts = []

        async def failing_webhook_handler(request):
            attempts.append({
                "timestamp": asyncio.get_event_loop().time(),
                "headers": dict(request.headers)
            })

            # Fail first 2 attempts, succeed on 3rd
            if len(attempts) < 3:
                return web.Response(status=500, text="Error")
            else:
                return web.Response(status=200, text="OK")

        app = web.Application()
        app.router.add_post('/webhook', failing_webhook_handler)

        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', 8900)
        await site.start()

        try:
            # Register webhook
            webhook_data = {
                "name": "Retry Test Webhook",
                "url": "http://localhost:8900/webhook",
                "events": ["test.event"]
            }

            webhook_response = await client.post(
                "/api/v1/webhooks",
                json=webhook_data
            )

            webhook = webhook_response.json()

            # Trigger event
            from studio.services.webhook_service import WebhookService
            webhook_service = WebhookService()

            await webhook_service.trigger_event(
                event="test.event",
                data={"test": "data"},
                organization_id=user["organization_id"]
            )

            # Wait for retries (exponential backoff: 1s, 2s, 4s)
            await asyncio.sleep(8)

            # Verify retry attempts
            assert len(attempts) == 3

            # Verify exponential backoff timing
            time_diffs = [
                attempts[i]["timestamp"] - attempts[i-1]["timestamp"]
                for i in range(1, len(attempts))
            ]

            # First retry after ~1s, second after ~2s
            assert 0.8 < time_diffs[0] < 1.5
            assert 1.5 < time_diffs[1] < 2.5

        finally:
            await site.stop()
            await runner.cleanup()
```

#### Auth Lineage Capture Integration

```python
"""
Tier 2: Auth Lineage Integration Tests

Tests lineage capture with real database operations.
NO MOCKING - uses real DataFlow and PostgreSQL.
"""

import pytest
from datetime import datetime, UTC
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestAuthLineageCapture:
    """Test authentication lineage tracking integration."""

    @pytest.mark.asyncio
    async def test_capture_lineage_on_external_invocation(
        self, authenticated_client, test_db
    ):
        """Should capture lineage data when external agent is invoked."""
        client, user = authenticated_client

        # Register external agent
        agent_response = await client.post(
            "/api/v1/external-agents",
            json={
                "name": "GPT-4 Agent",
                "platform": "openai",
                "platform_agent_id": "gpt-4",
                "workspace_id": "ws-test"
            }
        )

        external_agent = agent_response.json()

        # Invoke external agent
        invocation_response = await client.post(
            f"/api/v1/external-agents/{external_agent['id']}/invoke",
            json={
                "input": {
                    "messages": [
                        {"role": "user", "content": "Hello, world!"}
                    ]
                },
                "execution_id": "exec-123"
            }
        )

        assert invocation_response.status_code == 200
        invocation = invocation_response.json()

        # Query lineage records using real DataFlow
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()

        workflow.add_node(
            "LineageNodeQueryNode",
            "query_lineage",
            {
                "filter": {
                    "execution_id": "exec-123"
                },
                "sort": [{"field": "timestamp", "direction": "asc"}]
            }
        )

        results, _ = await runtime.execute_workflow_async(
            workflow.build(),
            inputs={}
        )

        lineage_nodes = results["query_lineage"]["results"]

        # Verify lineage was captured
        assert len(lineage_nodes) >= 1

        # Find the external agent invocation node
        external_node = next(
            (n for n in lineage_nodes if n["agent_id"] == external_agent["id"]),
            None
        )

        assert external_node is not None
        assert external_node["platform"] == "openai"
        assert external_node["action"] == "invoke"
        assert external_node["execution_id"] == "exec-123"
        assert external_node["initiated_by"] == user["id"]

        # Verify token usage was captured
        assert "input_tokens" in external_node
        assert "output_tokens" in external_node
        assert external_node["input_tokens"] > 0

    @pytest.mark.asyncio
    async def test_lineage_chain_with_multiple_agents(
        self, authenticated_client, test_db
    ):
        """Should create lineage chain with parent-child relationships."""
        client, user = authenticated_client

        # Create workspace and agents
        workspace_id = "ws-chain-test"

        # Register internal Kaizen agent
        internal_agent = await client.post(
            "/api/v1/agents",
            json={
                "name": "Orchestrator Agent",
                "workspace_id": workspace_id,
                "agent_type": "chat",
                "model_id": "internal-model"
            }
        )

        internal_agent = internal_agent.json()

        # Register external agent
        external_agent = await client.post(
            "/api/v1/external-agents",
            json={
                "name": "GPT-4 Specialist",
                "platform": "openai",
                "platform_agent_id": "gpt-4",
                "workspace_id": workspace_id
            }
        )

        external_agent = external_agent.json()

        # Execute workflow: Internal agent calls external agent
        execution_id = "exec-chain-" + uuid.uuid4().hex[:8]

        # Step 1: Internal agent starts execution
        step1_response = await client.post(
            f"/api/v1/agents/{internal_agent['id']}/execute",
            json={
                "input": {"task": "Analyze document"},
                "execution_id": execution_id
            }
        )

        # Step 2: Internal agent invokes external agent
        step2_response = await client.post(
            f"/api/v1/external-agents/{external_agent['id']}/invoke",
            json={
                "input": {"document": "Sample text"},
                "execution_id": execution_id,
                "parent_node_id": step1_response.json()["lineage_node_id"]
            }
        )

        # Query complete lineage chain
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()

        workflow.add_node(
            "LineageChainQueryNode",
            "query_chain",
            {"filter": {"execution_id": execution_id}}
        )

        results, _ = await runtime.execute_workflow_async(
            workflow.build(),
            inputs={}
        )

        chain = results["query_chain"]["results"][0]

        # Verify chain structure
        assert chain["execution_id"] == execution_id
        assert len(chain["nodes"]) == 2

        # Verify parent-child relationship
        internal_node = next(
            (n for n in chain["nodes"] if n["agent_id"] == internal_agent["id"]),
            None
        )
        external_node = next(
            (n for n in chain["nodes"] if n["agent_id"] == external_agent["id"]),
            None
        )

        assert external_node["parent_node_id"] == internal_node["id"]

        # Verify aggregate metrics
        assert chain["total_tokens"] == (
            internal_node["input_tokens"] + internal_node["output_tokens"] +
            external_node["input_tokens"] + external_node["output_tokens"]
        )
```

---

### 4.3 Tier 3: End-to-End Tests

#### Complete External Agent Workflow

```python
"""
Tier 3: External Agent E2E Tests

Tests complete external agent workflows with full system.
NO MOCKING - complete end-to-end scenarios.
"""

import pytest
import uuid


@pytest.mark.e2e
@pytest.mark.timeout(10)
class TestExternalAgentCompleteWorkflow:
    """Test complete external agent lifecycle workflows."""

    @pytest.mark.asyncio
    async def test_register_configure_invoke_track_workflow(
        self, authenticated_client, test_db
    ):
        """
        Complete workflow:
        1. Register external agent
        2. Configure governance policies
        3. Invoke agent
        4. Track lineage
        5. Enforce budget
        6. Verify audit trail
        """
        client, user = authenticated_client
        org_id = user["organization_id"]
        workspace_id = "ws-e2e-" + uuid.uuid4().hex[:8]

        # STEP 1: Register External Agent
        print("Step 1: Registering external agent...")

        agent_response = await client.post(
            "/api/v1/external-agents",
            json={
                "name": "Production GPT-4 Agent",
                "platform": "openai",
                "platform_agent_id": "gpt-4-turbo",
                "workspace_id": workspace_id,
                "capabilities": {
                    "text_generation": True,
                    "function_calling": True
                },
                "config": {
                    "model": "gpt-4-turbo",
                    "temperature": 0.7
                },
                "credentials": {
                    "api_key": "sk-real-key-for-testing"
                }
            }
        )

        assert agent_response.status_code == 201
        agent = agent_response.json()
        agent_id = agent["id"]

        print(f"✓ Agent registered: {agent_id}")

        # STEP 2: Configure Governance Policies
        print("Step 2: Configuring governance policies...")

        # Set budget policy
        budget_response = await client.post(
            f"/api/v1/governance/budget-policy",
            json={
                "organization_id": org_id,
                "workspace_id": workspace_id,
                "enabled": True,
                "daily_limit_usd": 10.00,
                "per_execution_limit_usd": 1.00,
                "alert_threshold_pct": 80,
                "enforcement": "hard"
            }
        )

        assert budget_response.status_code == 200
        print("✓ Budget policy configured")

        # Set platform policy
        platform_response = await client.post(
            f"/api/v1/governance/platform-policy",
            json={
                "organization_id": org_id,
                "workspace_id": workspace_id,
                "mode": "allowlist",
                "platforms": ["openai", "anthropic"],
                "require_approval": False
            }
        )

        assert platform_response.status_code == 200
        print("✓ Platform policy configured")

        # STEP 3: Invoke External Agent
        print("Step 3: Invoking external agent...")

        execution_id = "exec-e2e-" + uuid.uuid4().hex[:8]

        invocation_response = await client.post(
            f"/api/v1/external-agents/{agent_id}/invoke",
            json={
                "input": {
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful assistant."
                        },
                        {
                            "role": "user",
                            "content": "Explain quantum computing in simple terms."
                        }
                    ],
                    "max_tokens": 500
                },
                "execution_id": execution_id
            }
        )

        assert invocation_response.status_code == 200
        invocation = invocation_response.json()

        assert "output" in invocation
        assert "lineage_node_id" in invocation
        assert invocation["status"] == "completed"

        print(f"✓ Agent invoked successfully: {invocation['lineage_node_id']}")

        # STEP 4: Track Lineage
        print("Step 4: Verifying lineage tracking...")

        lineage_response = await client.get(
            f"/api/v1/lineage/execution/{execution_id}"
        )

        assert lineage_response.status_code == 200
        lineage = lineage_response.json()

        # Verify lineage data
        assert lineage["execution_id"] == execution_id
        assert len(lineage["nodes"]) >= 1

        agent_node = lineage["nodes"][0]
        assert agent_node["agent_id"] == agent_id
        assert agent_node["platform"] == "openai"
        assert agent_node["input_tokens"] > 0
        assert agent_node["output_tokens"] > 0
        assert "cost_usd" in agent_node

        print(f"✓ Lineage tracked: {agent_node['input_tokens']} + {agent_node['output_tokens']} tokens")

        # STEP 5: Verify Budget Enforcement
        print("Step 5: Verifying budget enforcement...")

        budget_status_response = await client.get(
            f"/api/v1/governance/budget-status?workspace_id={workspace_id}"
        )

        assert budget_status_response.status_code == 200
        budget_status = budget_status_response.json()

        # Verify usage was tracked
        assert budget_status["daily_usage_usd"] > 0
        assert budget_status["daily_usage_usd"] <= budget_status["daily_limit_usd"]
        assert budget_status["remaining_daily_usd"] < 10.00

        print(f"✓ Budget tracked: ${budget_status['daily_usage_usd']:.4f} / ${budget_status['daily_limit_usd']:.2f}")

        # Test budget limit enforcement
        print("Step 5b: Testing budget limit enforcement...")

        # Attempt multiple invocations to exceed budget
        for i in range(15):  # Attempt to exceed $10 daily limit
            try:
                await client.post(
                    f"/api/v1/external-agents/{agent_id}/invoke",
                    json={
                        "input": {
                            "messages": [{"role": "user", "content": f"Test {i}"}],
                            "max_tokens": 1000
                        },
                        "execution_id": f"exec-budget-test-{i}"
                    }
                )
            except Exception:
                # Expected to fail when budget exceeded
                pass

        # Verify budget was enforced
        final_budget = await client.get(
            f"/api/v1/governance/budget-status?workspace_id={workspace_id}"
        )
        final_budget = final_budget.json()

        # Should not exceed daily limit due to hard enforcement
        assert final_budget["daily_usage_usd"] <= 10.00
        print("✓ Budget limit enforced (hard limit not exceeded)")

        # STEP 6: Verify Audit Trail
        print("Step 6: Verifying audit trail...")

        audit_response = await client.get(
            f"/api/v1/audit/logs?workspace_id={workspace_id}"
        )

        assert audit_response.status_code == 200
        audit_logs = audit_response.json()

        # Verify audit events were logged
        events = audit_logs["logs"]
        event_types = {log["event_type"] for log in events}

        assert "external_agent.registered" in event_types
        assert "external_agent.invoked" in event_types
        assert "governance.budget_policy.created" in event_types

        print(f"✓ Audit trail verified: {len(events)} events logged")

        # Verify detailed audit log entry
        invocation_log = next(
            (log for log in events if log["event_type"] == "external_agent.invoked"),
            None
        )

        assert invocation_log is not None
        assert invocation_log["actor_id"] == user["id"]
        assert invocation_log["resource_id"] == agent_id
        assert "cost_usd" in invocation_log["metadata"]

        print("✅ Complete workflow test passed!")
```

---

### 4.4 Frontend Component Tests

#### External Agent Wizard (Vitest)

```typescript
/**
 * Tier 1: External Agent Wizard Unit Tests
 *
 * Tests wizard component logic and state management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExternalAgentWizard } from '@/features/external-agents/components/ExternalAgentWizard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('ExternalAgentWizard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWizard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ExternalAgentWizard onComplete={vi.fn()} />
      </QueryClientProvider>
    );
  };

  it('should render wizard with platform selection step', () => {
    renderWizard();

    expect(screen.getByText(/select platform/i)).toBeInTheDocument();
    expect(screen.getByText(/openai/i)).toBeInTheDocument();
    expect(screen.getByText(/anthropic/i)).toBeInTheDocument();
    expect(screen.getByText(/google/i)).toBeInTheDocument();
  });

  it('should progress to configuration step after platform selection', async () => {
    renderWizard();

    // Select OpenAI platform
    const openaiCard = screen.getByTestId('platform-openai');
    fireEvent.click(openaiCard);

    // Click Next
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Should show configuration step
    await waitFor(() => {
      expect(screen.getByText(/configure agent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/agent name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields in configuration step', async () => {
    renderWizard();

    // Navigate to configuration step
    fireEvent.click(screen.getByTestId('platform-openai'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Try to proceed without filling required fields
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(submitButton);
    });

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/agent name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/api key is required/i)).toBeInTheDocument();
    });
  });

  it('should mask API key input', async () => {
    renderWizard();

    // Navigate to configuration step
    fireEvent.click(screen.getByTestId('platform-openai'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      const apiKeyInput = screen.getByLabelText(/api key/i) as HTMLInputElement;
      expect(apiKeyInput.type).toBe('password');

      // Type API key
      fireEvent.change(apiKeyInput, { target: { value: 'sk-test-key-123' } });

      // Value should be set but masked
      expect(apiKeyInput.value).toBe('sk-test-key-123');
      expect(apiKeyInput.type).toBe('password');
    });
  });

  it('should show capabilities configuration for selected platform', async () => {
    renderWizard();

    // Select OpenAI
    fireEvent.click(screen.getByTestId('platform-openai'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      // OpenAI should show GPT-4 capabilities
      expect(screen.getByText(/text generation/i)).toBeInTheDocument();
      expect(screen.getByText(/function calling/i)).toBeInTheDocument();
      expect(screen.getByText(/vision/i)).toBeInTheDocument();
    });
  });

  it('should display governance settings step', async () => {
    renderWizard();

    // Navigate through steps
    fireEvent.click(screen.getByTestId('platform-openai'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Fill configuration
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/agent name/i), {
        target: { value: 'Test Agent' },
      });
      fireEvent.change(screen.getByLabelText(/api key/i), {
        target: { value: 'sk-test-key' },
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Should show governance step
    await waitFor(() => {
      expect(screen.getByText(/governance settings/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/daily budget limit/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/per-execution limit/i)).toBeInTheDocument();
    });
  });
});
```

#### Lineage Viewer Component (Vitest)

```typescript
/**
 * Tier 1: Lineage Viewer Unit Tests
 *
 * Tests lineage visualization component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LineageViewer } from '@/features/external-agents/components/LineageViewer';

describe('LineageViewer', () => {
  const mockLineageData = {
    chain_id: 'chain-123',
    execution_id: 'exec-456',
    workspace_id: 'ws-789',
    initiated_by: 'user-001',
    nodes: [
      {
        id: 'node-1',
        agent_id: 'agent-internal',
        agent_name: 'Orchestrator Agent',
        platform: 'kaizen',
        action: 'process',
        timestamp: '2025-12-20T10:00:00Z',
        input_tokens: 100,
        output_tokens: 50,
        cost_usd: 0.001,
      },
      {
        id: 'node-2',
        agent_id: 'agent-external',
        agent_name: 'GPT-4 Specialist',
        platform: 'openai',
        action: 'completion',
        timestamp: '2025-12-20T10:00:05Z',
        input_tokens: 500,
        output_tokens: 300,
        cost_usd: 0.008,
        parent_node_id: 'node-1',
      },
    ],
  };

  it('should render lineage chain with all nodes', () => {
    render(<LineageViewer lineageData={mockLineageData} />);

    // Should show both agents
    expect(screen.getByText('Orchestrator Agent')).toBeInTheDocument();
    expect(screen.getByText('GPT-4 Specialist')).toBeInTheDocument();

    // Should show platforms
    expect(screen.getByText(/kaizen/i)).toBeInTheDocument();
    expect(screen.getByText(/openai/i)).toBeInTheDocument();
  });

  it('should display token usage for each node', () => {
    render(<LineageViewer lineageData={mockLineageData} />);

    // Internal agent tokens
    expect(screen.getByText(/100.*input/i)).toBeInTheDocument();
    expect(screen.getByText(/50.*output/i)).toBeInTheDocument();

    // External agent tokens
    expect(screen.getByText(/500.*input/i)).toBeInTheDocument();
    expect(screen.getByText(/300.*output/i)).toBeInTheDocument();
  });

  it('should display cost information', () => {
    render(<LineageViewer lineageData={mockLineageData} />);

    // Individual costs
    expect(screen.getByText(/\$0\.001/)).toBeInTheDocument();
    expect(screen.getByText(/\$0\.008/)).toBeInTheDocument();

    // Total cost
    expect(screen.getByText(/total.*\$0\.009/i)).toBeInTheDocument();
  });

  it('should visualize parent-child relationships', () => {
    const { container } = render(<LineageViewer lineageData={mockLineageData} />);

    // Should render connection lines (SVG paths or divs)
    const connections = container.querySelectorAll('[data-testid*="connection"]');
    expect(connections.length).toBeGreaterThan(0);
  });

  it('should highlight external agent calls', () => {
    render(<LineageViewer lineageData={mockLineageData} />);

    const externalNode = screen.getByTestId('node-node-2');

    // Should have external indicator class/badge
    expect(externalNode).toHaveClass(/external/i);
    expect(screen.getByText(/external/i)).toBeInTheDocument();
  });

  it('should show aggregate metrics', () => {
    render(<LineageViewer lineageData={mockLineageData} />);

    // Total tokens
    expect(screen.getByText(/950.*total tokens/i)).toBeInTheDocument();

    // External calls count
    expect(screen.getByText(/1.*external call/i)).toBeInTheDocument();

    // Platforms used
    expect(screen.getByText(/2.*platforms/i)).toBeInTheDocument();
  });
});
```

---

### 4.5 Frontend E2E Tests (Playwright)

#### External Agent Registration E2E

```typescript
/**
 * Tier 3: External Agent Registration E2E Tests
 *
 * Tests complete registration workflow in browser.
 */

import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';

test.describe('External Agent Registration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated).toBeTruthy();

    await page.goto('/external-agents');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full registration workflow', async ({ page }) => {
    // Step 1: Navigate to create wizard
    await page.click('button:has-text("Register External Agent")');

    // Should show wizard dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Select Platform')).toBeVisible();

    // Step 2: Select OpenAI platform
    await page.click('[data-testid="platform-openai"]');
    await page.click('button:has-text("Next")');

    // Should show configuration step
    await expect(page.locator('text=Configure Agent')).toBeVisible();

    // Step 3: Fill configuration
    await page.fill('[name="name"]', 'E2E Test Agent');
    await page.fill('[name="platform_agent_id"]', 'gpt-4-turbo');
    await page.fill('[name="api_key"]', 'sk-test-key-for-e2e');

    // Select capabilities
    await page.check('[name="capability_text_generation"]');
    await page.check('[name="capability_function_calling"]');

    await page.click('button:has-text("Next")');

    // Step 4: Configure governance
    await expect(page.locator('text=Governance Settings')).toBeVisible();

    await page.fill('[name="daily_limit_usd"]', '50.00');
    await page.fill('[name="per_execution_limit_usd"]', '5.00');

    await page.click('button:has-text("Next")');

    // Step 5: Review and confirm
    await expect(page.locator('text=Review & Confirm')).toBeVisible();

    // Should show summary
    await expect(page.locator('text=E2E Test Agent')).toBeVisible();
    await expect(page.locator('text=OpenAI')).toBeVisible();
    await expect(page.locator('text=$50.00')).toBeVisible();

    // Confirm registration
    await page.click('button:has-text("Register Agent")');

    // Should show success message
    await expect(page.locator('text=Successfully registered')).toBeVisible({
      timeout: 5000,
    });

    // Should navigate to agent list
    await expect(page).toHaveURL(/\/external-agents$/);

    // Verify agent appears in list
    await expect(page.locator('text=E2E Test Agent')).toBeVisible();
  });

  test('should validate API key format for OpenAI', async ({ page }) => {
    await page.click('button:has-text("Register External Agent")');
    await page.click('[data-testid="platform-openai"]');
    await page.click('button:has-text("Next")');

    // Enter invalid API key format
    await page.fill('[name="api_key"]', 'invalid-key-format');
    await page.click('button:has-text("Next")');

    // Should show validation error
    await expect(
      page.locator('text=/OpenAI API keys must start with "sk-"/i')
    ).toBeVisible();
  });

  test('should show platform-specific configuration fields', async ({ page }) => {
    await page.click('button:has-text("Register External Agent")');

    // Select Anthropic
    await page.click('[data-testid="platform-anthropic"]');
    await page.click('button:has-text("Next")');

    // Should show Anthropic-specific fields
    await expect(page.locator('text=/Claude model/i')).toBeVisible();
    await expect(page.locator('[name="api_key"]')).toHaveAttribute(
      'placeholder',
      /anthropic/i
    );
  });
});

test.describe('External Agent Invocation E2E', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated).toBeTruthy();
  });

  test('should invoke agent and display results', async ({ page }) => {
    await page.goto('/external-agents');
    await page.waitForLoadState('networkidle');

    // Assume agent already exists from previous test
    await page.click('text=E2E Test Agent');

    // Should show agent details page
    await expect(page.locator('h1:has-text("E2E Test Agent")')).toBeVisible();

    // Open invocation dialog
    await page.click('button:has-text("Invoke Agent")');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Enter input
    await page.fill(
      '[name="input"]',
      JSON.stringify({
        messages: [
          { role: 'user', content: 'Explain quantum computing briefly.' },
        ],
      })
    );

    // Submit invocation
    await page.click('button:has-text("Invoke")');

    // Should show loading state
    await expect(page.locator('text=/invoking/i')).toBeVisible();

    // Should show results (wait up to 10 seconds)
    await expect(page.locator('text=/response/i')).toBeVisible({
      timeout: 10000,
    });

    // Should show token usage
    await expect(page.locator('text=/tokens used/i')).toBeVisible();
    await expect(page.locator('text=/cost/i')).toBeVisible();

    // Should show lineage link
    await expect(page.locator('a:has-text("View Lineage")')).toBeVisible();
  });
});

test.describe('Lineage Viewer E2E', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated).toBeTruthy();
  });

  test('should display lineage chain visualization', async ({ page }) => {
    await page.goto('/lineage');
    await page.waitForLoadState('networkidle');

    // Filter to recent execution
    await page.fill('[placeholder*="Search"]', 'exec-');

    // Click on an execution
    await page.click('[data-testid*="lineage-chain"]').first();

    // Should show lineage visualization
    await expect(page.locator('text=/lineage chain/i')).toBeVisible();

    // Should show nodes
    const nodes = page.locator('[data-testid*="lineage-node"]');
    await expect(nodes).toHaveCountGreaterThan(0);

    // Should show connections
    const connections = page.locator('[data-testid*="connection"]');
    await expect(connections).toHaveCountGreaterThan(0);

    // Should show metrics panel
    await expect(page.locator('text=/total tokens/i')).toBeVisible();
    await expect(page.locator('text=/total cost/i')).toBeVisible();
    await expect(page.locator('text=/external calls/i')).toBeVisible();
  });

  test('should filter lineage by platform', async ({ page }) => {
    await page.goto('/lineage');
    await page.waitForLoadState('networkidle');

    // Apply platform filter
    await page.click('[data-testid="filter-platform"]');
    await page.check('input[value="openai"]');
    await page.click('button:has-text("Apply")');

    // Should only show OpenAI lineage chains
    const chains = page.locator('[data-testid*="lineage-chain"]');
    const count = await chains.count();

    for (let i = 0; i < count; i++) {
      await expect(chains.nth(i).locator('text=/openai/i')).toBeVisible();
    }
  });
});
```

---

## 5. Test Fixtures and Test Data

### 5.1 Backend Test Fixtures

#### Platform Adapter Fixtures

```python
"""
Test fixtures for platform adapters.
"""

import pytest


@pytest.fixture
def teams_webhook_payload():
    """Valid MS Teams webhook payload."""
    return {
        "type": "message",
        "id": "msg-123456",
        "timestamp": "2025-12-20T10:00:00Z",
        "from": {
            "id": "user-789",
            "name": "John Doe",
            "aadObjectId": "aad-123"
        },
        "conversation": {
            "id": "conv-456",
            "tenantId": "tenant-789"
        },
        "text": "Help me with this task",
        "channelData": {
            "teamsChannelId": "channel-123",
            "teamsTeamId": "team-456"
        }
    }


@pytest.fixture
def discord_webhook_payload():
    """Valid Discord webhook payload."""
    return {
        "id": "msg-123456789",
        "channel_id": "channel-987654",
        "guild_id": "guild-123456",
        "author": {
            "id": "user-456789",
            "username": "testuser",
            "discriminator": "1234"
        },
        "content": "Process this request",
        "timestamp": "2025-12-20T10:00:00.000Z",
        "type": 0
    }


@pytest.fixture
def telegram_update_payload():
    """Valid Telegram update payload."""
    return {
        "update_id": 123456789,
        "message": {
            "message_id": 456,
            "from": {
                "id": 987654321,
                "is_bot": False,
                "first_name": "John",
                "username": "johndoe"
            },
            "chat": {
                "id": 987654321,
                "first_name": "John",
                "username": "johndoe",
                "type": "private"
            },
            "date": 1734696000,
            "text": "Execute task"
        }
    }


@pytest.fixture
def slack_event_payload():
    """Valid Slack event payload."""
    return {
        "type": "event_callback",
        "event_id": "evt-123456",
        "event_time": 1734696000,
        "event": {
            "type": "message",
            "channel": "C123456",
            "user": "U789012",
            "text": "Run workflow",
            "ts": "1734696000.000100"
        }
    }


@pytest.fixture
def notion_page_created_payload():
    """Valid Notion page created payload."""
    return {
        "object": "event",
        "id": "evt-123456789",
        "created_time": "2025-12-20T10:00:00.000Z",
        "type": "page.created",
        "page": {
            "id": "page-123456",
            "created_time": "2025-12-20T10:00:00.000Z",
            "last_edited_time": "2025-12-20T10:00:00.000Z",
            "properties": {
                "title": {
                    "title": [
                        {
                            "text": {
                                "content": "New Task"
                            }
                        }
                    ]
                }
            }
        }
    }
```

#### Lineage Test Fixtures

```python
"""
Test fixtures for lineage data.
"""

import pytest
import uuid
from datetime import datetime, UTC, timedelta


@pytest.fixture
def simple_lineage_chain():
    """Simple lineage chain with one internal and one external agent."""
    now = datetime.now(UTC)

    return {
        "chain_id": str(uuid.uuid4()),
        "execution_id": "exec-simple-test",
        "workspace_id": "ws-test",
        "initiated_by": "user-test",
        "created_at": now.isoformat(),
        "nodes": [
            {
                "id": str(uuid.uuid4()),
                "agent_id": "agent-internal-1",
                "agent_name": "Orchestrator",
                "platform": "kaizen",
                "action": "orchestrate",
                "timestamp": now.isoformat(),
                "input_tokens": 100,
                "output_tokens": 50,
                "cost_usd": 0.0005,
                "parent_node_id": None
            },
            {
                "id": str(uuid.uuid4()),
                "agent_id": "agent-external-gpt4",
                "agent_name": "GPT-4",
                "platform": "openai",
                "action": "completion",
                "timestamp": (now + timedelta(seconds=1)).isoformat(),
                "input_tokens": 500,
                "output_tokens": 300,
                "cost_usd": 0.008,
                "parent_node_id": None,  # Will be set to first node's ID
                "metadata": {
                    "model": "gpt-4-turbo",
                    "temperature": 0.7
                }
            }
        ]
    }


@pytest.fixture
def complex_lineage_chain():
    """Complex lineage chain with multiple branching paths."""
    now = datetime.now(UTC)

    nodes = []

    # Root node
    root_id = str(uuid.uuid4())
    nodes.append({
        "id": root_id,
        "agent_id": "agent-root",
        "agent_name": "Root Orchestrator",
        "platform": "kaizen",
        "action": "orchestrate",
        "timestamp": now.isoformat(),
        "input_tokens": 200,
        "output_tokens": 100,
        "cost_usd": 0.001,
        "parent_node_id": None
    })

    # Branch 1: GPT-4
    branch1_id = str(uuid.uuid4())
    nodes.append({
        "id": branch1_id,
        "agent_id": "agent-gpt4",
        "agent_name": "GPT-4 Specialist",
        "platform": "openai",
        "action": "completion",
        "timestamp": (now + timedelta(seconds=1)).isoformat(),
        "input_tokens": 600,
        "output_tokens": 400,
        "cost_usd": 0.01,
        "parent_node_id": root_id
    })

    # Branch 2: Claude
    branch2_id = str(uuid.uuid4())
    nodes.append({
        "id": branch2_id,
        "agent_id": "agent-claude",
        "agent_name": "Claude Analyst",
        "platform": "anthropic",
        "action": "completion",
        "timestamp": (now + timedelta(seconds=1)).isoformat(),
        "input_tokens": 800,
        "output_tokens": 600,
        "cost_usd": 0.012,
        "parent_node_id": root_id
    })

    # Synthesizer node (combines both branches)
    synth_id = str(uuid.uuid4())
    nodes.append({
        "id": synth_id,
        "agent_id": "agent-synthesizer",
        "agent_name": "Result Synthesizer",
        "platform": "kaizen",
        "action": "synthesize",
        "timestamp": (now + timedelta(seconds=3)).isoformat(),
        "input_tokens": 300,
        "output_tokens": 150,
        "cost_usd": 0.002,
        "parent_node_id": branch1_id,  # Primary parent
        "additional_parent_ids": [branch2_id]  # Additional dependencies
    })

    return {
        "chain_id": str(uuid.uuid4()),
        "execution_id": "exec-complex-test",
        "workspace_id": "ws-test",
        "initiated_by": "user-test",
        "created_at": now.isoformat(),
        "nodes": nodes
    }


@pytest.fixture
def lineage_with_errors():
    """Lineage chain containing failed node."""
    now = datetime.now(UTC)

    return {
        "chain_id": str(uuid.uuid4()),
        "execution_id": "exec-error-test",
        "workspace_id": "ws-test",
        "initiated_by": "user-test",
        "created_at": now.isoformat(),
        "nodes": [
            {
                "id": str(uuid.uuid4()),
                "agent_id": "agent-start",
                "agent_name": "Start Agent",
                "platform": "kaizen",
                "action": "process",
                "timestamp": now.isoformat(),
                "input_tokens": 100,
                "output_tokens": 50,
                "cost_usd": 0.0005,
                "status": "completed"
            },
            {
                "id": str(uuid.uuid4()),
                "agent_id": "agent-failed",
                "agent_name": "Failed External Agent",
                "platform": "openai",
                "action": "completion",
                "timestamp": (now + timedelta(seconds=1)).isoformat(),
                "input_tokens": 200,
                "output_tokens": 0,
                "cost_usd": 0.002,
                "status": "failed",
                "error_message": "Rate limit exceeded",
                "error_code": "rate_limit_error"
            }
        ]
    }
```

---

### 5.2 Frontend Test Fixtures

#### Mock API Responses

```typescript
/**
 * Mock API responses for frontend tests.
 */

export const mockExternalAgents = [
  {
    id: 'agent-1',
    name: 'Production GPT-4',
    platform: 'openai',
    platform_agent_id: 'gpt-4-turbo',
    workspace_id: 'ws-prod',
    status: 'active',
    capabilities: {
      text_generation: true,
      function_calling: true,
      vision: true,
    },
    created_at: '2025-12-01T10:00:00Z',
    created_by: 'user-123',
  },
  {
    id: 'agent-2',
    name: 'Claude Analyst',
    platform: 'anthropic',
    platform_agent_id: 'claude-3-opus',
    workspace_id: 'ws-prod',
    status: 'active',
    capabilities: {
      text_generation: true,
      function_calling: true,
    },
    created_at: '2025-12-05T14:30:00Z',
    created_by: 'user-123',
  },
];

export const mockLineageChain = {
  chain_id: 'chain-123',
  execution_id: 'exec-456',
  workspace_id: 'ws-prod',
  initiated_by: 'user-123',
  created_at: '2025-12-20T10:00:00Z',
  nodes: [
    {
      id: 'node-1',
      agent_id: 'agent-internal',
      agent_name: 'Orchestrator',
      platform: 'kaizen',
      action: 'orchestrate',
      timestamp: '2025-12-20T10:00:00Z',
      input_tokens: 100,
      output_tokens: 50,
      cost_usd: 0.0005,
    },
    {
      id: 'node-2',
      agent_id: 'agent-1',
      agent_name: 'Production GPT-4',
      platform: 'openai',
      action: 'completion',
      timestamp: '2025-12-20T10:00:02Z',
      input_tokens: 500,
      output_tokens: 300,
      cost_usd: 0.008,
      parent_node_id: 'node-1',
    },
  ],
  metrics: {
    total_tokens: 950,
    total_cost_usd: 0.0085,
    external_calls: 1,
    platforms_used: ['kaizen', 'openai'],
  },
};

export const mockGovernancePolicy = {
  organization_id: 'org-123',
  workspace_id: 'ws-prod',
  budget_policy: {
    enabled: true,
    daily_limit_usd: 100.0,
    monthly_limit_usd: 2000.0,
    per_execution_limit_usd: 10.0,
    alert_threshold_pct: 80,
    enforcement: 'hard',
  },
  platform_policy: {
    mode: 'allowlist',
    platforms: ['openai', 'anthropic', 'google'],
    require_approval: false,
  },
  audit_settings: {
    log_all_calls: true,
    retention_days: 90,
  },
};
```

---

## 6. Platform-Specific Testing

### 6.1 MS Teams Adapter Testing

```python
"""
Platform-specific tests for MS Teams adapter.
"""

import pytest
from studio.services.platform_adapters.teams import TeamsAdapter


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestTeamsAdaptiveCardValidation:
    """Test MS Teams Adaptive Card schema validation."""

    def test_adaptive_card_schema_version(self):
        """Should use correct Adaptive Card schema version."""
        adapter = TeamsAdapter()

        card = adapter.create_adaptive_card(
            title="Test Card",
            body="Test content"
        )

        assert card["type"] == "AdaptiveCard"
        assert card["$schema"] == "http://adaptivecards.io/schemas/adaptive-card.json"
        assert card["version"] == "1.4"

    def test_adaptive_card_with_action_buttons(self):
        """Should create valid Action.Submit buttons."""
        adapter = TeamsAdapter()

        card = adapter.create_adaptive_card(
            title="Approval Request",
            body="Please review and approve",
            actions=[
                {"type": "submit", "title": "Approve", "data": {"action": "approve"}},
                {"type": "submit", "title": "Reject", "data": {"action": "reject"}}
            ]
        )

        assert len(card["actions"]) == 2
        assert card["actions"][0]["type"] == "Action.Submit"
        assert card["actions"][0]["title"] == "Approve"
        assert card["actions"][0]["data"]["action"] == "approve"
```

### 6.2 Discord Embed Testing

```python
"""
Platform-specific tests for Discord adapter.
"""

import pytest
from studio.services.platform_adapters.discord import DiscordAdapter


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestDiscordEmbedStructure:
    """Test Discord embed structure validation."""

    def test_embed_color_codes(self):
        """Should use correct hex color codes."""
        adapter = DiscordAdapter()

        # Success (green)
        success_embed = adapter.create_embed(
            description="Success",
            color="success"
        )
        assert success_embed["color"] == 0x00FF00

        # Error (red)
        error_embed = adapter.create_embed(
            description="Error",
            color="error"
        )
        assert error_embed["color"] == 0xFF0000

        # Info (blue)
        info_embed = adapter.create_embed(
            description="Info",
            color="info"
        )
        assert info_embed["color"] == 0x0099FF

    def test_embed_with_fields(self):
        """Should create embed with structured fields."""
        adapter = DiscordAdapter()

        embed = adapter.create_embed(
            title="Execution Results",
            description="Task completed",
            fields=[
                {"name": "Status", "value": "Success", "inline": True},
                {"name": "Duration", "value": "2.5s", "inline": True},
                {"name": "Cost", "value": "$0.008", "inline": True}
            ]
        )

        assert len(embed["fields"]) == 3
        assert embed["fields"][0]["name"] == "Status"
        assert embed["fields"][0]["inline"] is True
```

### 6.3 Telegram Bot API Testing

```python
"""
Platform-specific tests for Telegram adapter.
"""

import pytest
from studio.services.platform_adapters.telegram import TelegramAdapter


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestTelegramInlineKeyboard:
    """Test Telegram inline keyboard structure."""

    def test_inline_keyboard_structure(self):
        """Should create valid inline keyboard markup."""
        adapter = TelegramAdapter()

        keyboard = adapter.create_inline_keyboard([
            [
                {"text": "Option 1", "callback_data": "opt1"},
                {"text": "Option 2", "callback_data": "opt2"}
            ],
            [
                {"text": "Cancel", "callback_data": "cancel"}
            ]
        ])

        assert "inline_keyboard" in keyboard
        assert len(keyboard["inline_keyboard"]) == 2
        assert len(keyboard["inline_keyboard"][0]) == 2
        assert keyboard["inline_keyboard"][0][0]["text"] == "Option 1"

    def test_markdown_parsing_mode(self):
        """Should use Markdown parse mode by default."""
        adapter = TelegramAdapter()

        message = adapter.create_message(
            chat_id="123456",
            text="*Bold* and _italic_ text"
        )

        assert message["parse_mode"] == "Markdown"
```

---

## 7. Security Testing

### 7.1 API Key Validation

```python
"""
Security tests for API key validation and encryption.
"""

import pytest
from studio.services.credential_manager import CredentialManager


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestAPIKeyValidation:
    """Test API key format validation."""

    def test_validate_openai_key_format(self):
        """Should validate OpenAI API key format."""
        manager = CredentialManager()

        # Valid
        assert manager.validate_api_key("sk-proj-abcd1234", "openai") is True
        assert manager.validate_api_key("sk-abcd1234efgh5678", "openai") is True

        # Invalid
        assert manager.validate_api_key("invalid-key", "openai") is False
        assert manager.validate_api_key("api-key-123", "openai") is False

    def test_validate_anthropic_key_format(self):
        """Should validate Anthropic API key format."""
        manager = CredentialManager()

        # Valid
        assert manager.validate_api_key("sk-ant-api03-abcd1234", "anthropic") is True

        # Invalid
        assert manager.validate_api_key("sk-abcd1234", "anthropic") is False


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestCredentialEncryption:
    """Test credential encryption and decryption."""

    @pytest.mark.asyncio
    async def test_encrypt_and_store_credentials(
        self, authenticated_client, test_db
    ):
        """Should encrypt credentials before storing in database."""
        client, user = authenticated_client

        plaintext_key = "sk-test-key-12345678"

        # Register agent with credentials
        response = await client.post(
            "/api/v1/external-agents",
            json={
                "name": "Test Agent",
                "platform": "openai",
                "platform_agent_id": "gpt-4",
                "workspace_id": "ws-test",
                "credentials": {
                    "api_key": plaintext_key
                }
            }
        )

        assert response.status_code == 201
        agent = response.json()

        # Verify credentials are NOT in response
        assert "credentials" not in agent
        assert "api_key" not in agent

        # Query database directly
        from kailash.runtime import AsyncLocalRuntime
        from kailash.workflow.builder import WorkflowBuilder

        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()

        workflow.add_node(
            "ExternalAgentQueryNode",
            "query",
            {"filter": {"id": agent["id"]}}
        )

        results, _ = await runtime.execute_workflow_async(
            workflow.build(),
            inputs={}
        )

        db_agent = results["query"]["results"][0]

        # Verify encrypted in database
        assert db_agent["encrypted_credentials"] is not None
        assert db_agent["encrypted_credentials"] != plaintext_key
        assert "sk-test-key" not in db_agent["encrypted_credentials"]

    @pytest.mark.asyncio
    async def test_decrypt_credentials_for_invocation(
        self, authenticated_client, test_db
    ):
        """Should decrypt credentials only during invocation."""
        client, user = authenticated_client

        plaintext_key = "sk-test-key-for-decrypt"

        # Register agent
        register_response = await client.post(
            "/api/v1/external-agents",
            json={
                "name": "Decrypt Test Agent",
                "platform": "openai",
                "platform_agent_id": "gpt-4",
                "workspace_id": "ws-test",
                "credentials": {
                    "api_key": plaintext_key
                }
            }
        )

        agent = register_response.json()

        # Invoke agent (mocked external call)
        with patch('studio.services.external_agent_service.httpx.AsyncClient') as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "choices": [
                    {"message": {"content": "Test response"}}
                ],
                "usage": {"prompt_tokens": 10, "completion_tokens": 20}
            }
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response

            invocation_response = await client.post(
                f"/api/v1/external-agents/{agent['id']}/invoke",
                json={
                    "input": {"messages": [{"role": "user", "content": "Test"}]}
                }
            )

            assert invocation_response.status_code == 200

            # Verify the mocked HTTP client was called with decrypted key
            mock_call = mock_client.return_value.__aenter__.return_value.post.call_args
            headers = mock_call.kwargs.get('headers', {})

            assert 'Authorization' in headers
            assert plaintext_key in headers['Authorization']
```

### 7.2 RBAC Enforcement

```python
"""
Security tests for RBAC enforcement.
"""

import pytest


@pytest.mark.integration
@pytest.mark.timeout(5)
class TestExternalAgentRBAC:
    """Test RBAC enforcement for external agent operations."""

    @pytest.mark.asyncio
    async def test_developer_can_register_agent(
        self, authenticated_developer_client
    ):
        """Developer should be able to register external agents."""
        client, user = authenticated_developer_client

        response = await client.post(
            "/api/v1/external-agents",
            json={
                "name": "Developer Agent",
                "platform": "openai",
                "platform_agent_id": "gpt-4",
                "workspace_id": "ws-test"
            }
        )

        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_viewer_cannot_register_agent(
        self, test_client, test_db
    ):
        """Viewer role should not be able to register agents."""
        # Create viewer user
        from studio.services.auth_service import AuthService
        from studio.services.user_service import UserService
        from studio.services.organization_service import OrganizationService
        from kailash.runtime import AsyncLocalRuntime

        runtime = AsyncLocalRuntime()
        org_service = OrganizationService(runtime)
        user_service = UserService(runtime)
        auth_service = AuthService(runtime)

        # Create org and viewer user
        org = await org_service.create_organization(
            name="Test Org",
            slug="test-org",
            plan_tier="free",
            created_by="system"
        )

        viewer = await user_service.create_user(
            organization_id=org["id"],
            email="viewer@test.com",
            name="Viewer User",
            password="password123",
            role="viewer"
        )

        # Create session
        session = auth_service.create_session(
            user_id=viewer["id"],
            organization_id=org["id"],
            role="viewer"
        )

        # Attempt to register agent
        response = await test_client.post(
            "/api/v1/external-agents",
            json={
                "name": "Unauthorized Agent",
                "platform": "openai",
                "platform_agent_id": "gpt-4",
                "workspace_id": "ws-test"
            },
            headers={"Authorization": f"Bearer {session['token']}"}
        )

        # Should be denied
        assert response.status_code == 403
        error = response.json()
        assert "permission" in error["detail"].lower()

    @pytest.mark.asyncio
    async def test_workspace_isolation(
        self, authenticated_client, test_db
    ):
        """Users should only see agents in their workspace."""
        client, user = authenticated_client

        # Create agents in different workspaces
        ws1 = "ws-isolated-1"
        ws2 = "ws-isolated-2"

        await client.post(
            "/api/v1/external-agents",
            json={
                "name": "Agent WS1",
                "platform": "openai",
                "platform_agent_id": "gpt-4",
                "workspace_id": ws1
            }
        )

        await client.post(
            "/api/v1/external-agents",
            json={
                "name": "Agent WS2",
                "platform": "openai",
                "platform_agent_id": "gpt-4",
                "workspace_id": ws2
            }
        )

        # Query ws1
        response1 = await client.get(f"/api/v1/external-agents?workspace_id={ws1}")
        agents1 = response1.json()["agents"]

        # Should only see ws1 agent
        assert len(agents1) == 1
        assert agents1[0]["workspace_id"] == ws1

        # Query ws2
        response2 = await client.get(f"/api/v1/external-agents?workspace_id={ws2}")
        agents2 = response2.json()["agents"]

        # Should only see ws2 agent
        assert len(agents2) == 1
        assert agents2[0]["workspace_id"] == ws2
```

---

## 8. Performance Testing

### 8.1 Invocation Latency Tests

```python
"""
Performance tests for external agent invocation latency.
"""

import pytest
import time
from statistics import mean, stdev


@pytest.mark.integration
@pytest.mark.timeout(30)
class TestInvocationLatency:
    """Test external agent invocation latency."""

    @pytest.mark.asyncio
    async def test_invocation_latency_under_threshold(
        self, authenticated_client, test_db
    ):
        """Invocation overhead should be <100ms."""
        client, user = authenticated_client

        # Register agent
        agent_response = await client.post(
            "/api/v1/external-agents",
            json={
                "name": "Latency Test Agent",
                "platform": "openai",
                "platform_agent_id": "gpt-4",
                "workspace_id": "ws-perf"
            }
        )

        agent = agent_response.json()

        # Measure latency over multiple invocations
        latencies = []

        for i in range(10):
            start_time = time.perf_counter()

            # Mock external API call (instant response)
            with patch('studio.services.external_agent_service.httpx.AsyncClient') as mock:
                mock_response = AsyncMock()
                mock_response.status_code = 200
                mock_response.json.return_value = {
                    "choices": [{"message": {"content": "Response"}}],
                    "usage": {"prompt_tokens": 10, "completion_tokens": 10}
                }
                mock.return_value.__aenter__.return_value.post.return_value = mock_response

                await client.post(
                    f"/api/v1/external-agents/{agent['id']}/invoke",
                    json={
                        "input": {"messages": [{"role": "user", "content": f"Test {i}"}]}
                    }
                )

            end_time = time.perf_counter()
            latencies.append((end_time - start_time) * 1000)  # Convert to ms

        # Calculate statistics
        avg_latency = mean(latencies)
        std_latency = stdev(latencies)
        max_latency = max(latencies)

        print(f"\nInvocation Latency Stats:")
        print(f"  Average: {avg_latency:.2f}ms")
        print(f"  Std Dev: {std_latency:.2f}ms")
        print(f"  Max: {max_latency:.2f}ms")

        # Assert latency thresholds
        assert avg_latency < 100, f"Average latency {avg_latency:.2f}ms exceeds 100ms threshold"
        assert max_latency < 200, f"Max latency {max_latency:.2f}ms exceeds 200ms threshold"
```

### 8.2 Lineage Query Performance

```python
"""
Performance tests for lineage query operations.
"""

import pytest
import time


@pytest.mark.integration
@pytest.mark.timeout(30)
class TestLineageQueryPerformance:
    """Test lineage query performance with large datasets."""

    @pytest.mark.asyncio
    async def test_query_large_lineage_chain(
        self, authenticated_client, test_db
    ):
        """Should efficiently query lineage chains with 100+ nodes."""
        client, user = authenticated_client

        # Create large lineage chain (100 nodes)
        from kailash.runtime import AsyncLocalRuntime
        from kailash.workflow.builder import WorkflowBuilder

        runtime = AsyncLocalRuntime()
        execution_id = "exec-large-chain"

        # Create 100 lineage nodes
        for i in range(100):
            workflow = WorkflowBuilder()
            workflow.add_node(
                "LineageNodeCreateNode",
                "create_node",
                {
                    "execution_id": execution_id,
                    "agent_id": f"agent-{i}",
                    "agent_name": f"Agent {i}",
                    "platform": "kaizen" if i % 2 == 0 else "openai",
                    "action": "process",
                    "input_tokens": 100,
                    "output_tokens": 50,
                    "cost_usd": 0.001
                }
            )

            await runtime.execute_workflow_async(workflow.build(), inputs={})

        # Measure query time
        start_time = time.perf_counter()

        response = await client.get(f"/api/v1/lineage/execution/{execution_id}")

        end_time = time.perf_counter()
        query_time_ms = (end_time - start_time) * 1000

        assert response.status_code == 200
        lineage = response.json()

        # Verify all nodes returned
        assert len(lineage["nodes"]) == 100

        # Assert query performance
        print(f"\nLineage Query Performance:")
        print(f"  Nodes: 100")
        print(f"  Query Time: {query_time_ms:.2f}ms")

        assert query_time_ms < 500, f"Query time {query_time_ms:.2f}ms exceeds 500ms threshold"
```

---

## 9. CI/CD Integration

### 9.1 GitHub Actions Workflow

```yaml
name: External Integrations Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'src/studio/services/external_agent_service.py'
      - 'src/studio/services/platform_adapters/**'
      - 'src/studio/services/lineage_service.py'
      - 'tests/**external**'
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    name: Unit Tests (Tier 1)
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run unit tests
        run: |
          pytest tests/unit/ \
            -m unit \
            --timeout=1 \
            --cov=src/studio \
            --cov-report=xml \
            --cov-report=term-missing \
            -v

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          flags: unit

  integration-tests:
    name: Integration Tests (Tier 2)
    runs-on: ubuntu-latest
    timeout-minutes: 10

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: kaizen_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/kaizen_test
          REDIS_URL: redis://localhost:6379/0
          ENVIRONMENT: testing
        run: |
          pytest tests/integration/ \
            -m integration \
            --timeout=5 \
            -v

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/

  e2e-tests:
    name: E2E Tests (Tier 3)
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: kaizen_test
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run E2E tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/kaizen_test
          REDIS_URL: redis://localhost:6379/0
          ENVIRONMENT: testing
        run: |
          pytest tests/e2e/ \
            -m e2e \
            --timeout=10 \
            -v

  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: apps/frontend
        run: npm ci

      - name: Run Vitest unit tests
        working-directory: apps/frontend
        run: npm run test:unit

      - name: Run Playwright E2E tests
        working-directory: apps/frontend
        run: |
          npx playwright install --with-deps
          npm run test:e2e

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: apps/frontend/playwright-report/
```

---

## 10. Test Execution Commands

### 10.1 Backend Tests

```bash
# Unit tests only (fast feedback)
pytest tests/unit/ -m unit --timeout=1 -v

# Integration tests (requires infrastructure)
docker-compose -f docker-compose.test.yml up -d
pytest tests/integration/ -m integration --timeout=5 -v
docker-compose -f docker-compose.test.yml down

# E2E tests (full system)
docker-compose -f docker-compose.test.yml up -d
pytest tests/e2e/ -m e2e --timeout=10 -v
docker-compose -f docker-compose.test.yml down

# All tests with coverage
docker-compose -f docker-compose.test.yml up -d
pytest tests/ --cov=src/studio --cov-report=html --cov-report=term-missing -v
docker-compose -f docker-compose.test.yml down

# Specific test file
pytest tests/integration/test_external_agent_api.py -v

# Specific test method
pytest tests/e2e/test_external_agent_workflow.py::TestExternalAgentCompleteWorkflow::test_register_configure_invoke_track_workflow -v
```

### 10.2 Frontend Tests

```bash
# Vitest unit tests (watch mode)
cd apps/frontend
npm run test:unit

# Vitest unit tests (CI mode)
npm run test:unit:ci

# Playwright E2E tests (headless)
npm run test:e2e

# Playwright E2E tests (headed with UI)
npm run test:e2e:headed

# Playwright E2E tests (specific browser)
npm run test:e2e -- --project=chromium

# Playwright debug mode
npm run test:e2e:debug

# Generate Playwright report
npm run test:e2e:report
```

---

## 11. Success Metrics

### 11.1 Coverage Targets

- **Unit Tests**: ≥90% coverage for service modules
- **Integration Tests**: ≥80% coverage for API endpoints
- **E2E Tests**: ≥70% coverage for critical user workflows

### 11.2 Performance Benchmarks

| Operation | Target | Maximum |
|-----------|--------|---------|
| Agent Registration | <500ms | <1s |
| Agent Invocation Overhead | <100ms | <200ms |
| Webhook Delivery | <1s | <2s |
| Lineage Query (100 nodes) | <300ms | <500ms |
| Lineage Query (1000 nodes) | <1s | <2s |

### 11.3 Test Execution Time Targets

- **Tier 1 (Unit)**: <30 seconds total
- **Tier 2 (Integration)**: <5 minutes total
- **Tier 3 (E2E)**: <10 minutes total
- **Full Suite**: <15 minutes total

---

## 12. Common Testing Mistakes to Avoid

### ❌ DON'T: Mock in Integration/E2E Tests

```python
# ❌ WRONG - Defeats purpose of integration testing
@pytest.mark.integration
@patch('studio.services.external_agent_service.httpx.AsyncClient')
def test_agent_invocation(mock_client):
    # This is NOT testing real integration
    pass
```

### ✅ DO: Use Real Test Servers

```python
# ✅ CORRECT - Real HTTP server for integration testing
@pytest.mark.integration
async def test_webhook_delivery():
    # Start real test HTTP server
    app = web.Application()
    app.router.add_post('/webhook', webhook_handler)
    runner = web.AppRunner(app)
    await runner.setup()
    # ... test with real HTTP calls
```

### ❌ DON'T: Ignore Test Infrastructure Setup

```python
# ❌ WRONG - Assumes database is ready
def test_create_agent():
    # Will fail if PostgreSQL not running
    pass
```

### ✅ DO: Verify Test Environment

```python
# ✅ CORRECT - Use fixtures that ensure infrastructure
@pytest.mark.integration
async def test_create_agent(test_db):
    # test_db fixture ensures PostgreSQL is ready
    pass
```

---

## 13. Conclusion

This testing strategy ensures comprehensive validation of External Integrations in Kaizen Studio through:

1. **Rigorous 3-tier methodology** with clear separation of concerns
2. **NO MOCKING policy** for Tiers 2-3 to validate real-world behavior
3. **Platform-specific testing** for all supported integrations
4. **Security-first approach** with credential encryption and RBAC validation
5. **Performance benchmarks** to ensure production readiness
6. **Comprehensive coverage** across backend and frontend components

By following this strategy, we ensure that External Integrations are:
- Functionally correct
- Secure by design
- Performant at scale
- Production-ready

---

## Appendix A: Test Data Reference

### Sample External Agent Registration

```json
{
  "name": "Production GPT-4 Agent",
  "platform": "openai",
  "platform_agent_id": "gpt-4-turbo-preview",
  "workspace_id": "ws-prod-001",
  "capabilities": {
    "text_generation": true,
    "function_calling": true,
    "vision": true
  },
  "config": {
    "model": "gpt-4-turbo-preview",
    "temperature": 0.7,
    "max_tokens": 4096,
    "top_p": 1.0
  },
  "credentials": {
    "api_key": "sk-proj-abc123..."
  }
}
```

### Sample Lineage Chain

```json
{
  "chain_id": "chain-550e8400-e29b-41d4-a716-446655440000",
  "execution_id": "exec-2025-12-20-001",
  "workspace_id": "ws-prod-001",
  "initiated_by": "user-123",
  "created_at": "2025-12-20T10:00:00Z",
  "nodes": [
    {
      "id": "node-001",
      "agent_id": "agent-orchestrator",
      "agent_name": "Main Orchestrator",
      "platform": "kaizen",
      "action": "orchestrate",
      "timestamp": "2025-12-20T10:00:00Z",
      "input_tokens": 150,
      "output_tokens": 75,
      "cost_usd": 0.00075,
      "parent_node_id": null
    },
    {
      "id": "node-002",
      "agent_id": "agent-gpt4",
      "agent_name": "GPT-4 Specialist",
      "platform": "openai",
      "action": "completion",
      "timestamp": "2025-12-20T10:00:02Z",
      "input_tokens": 600,
      "output_tokens": 400,
      "cost_usd": 0.01,
      "parent_node_id": "node-001",
      "metadata": {
        "model": "gpt-4-turbo-preview",
        "temperature": 0.7,
        "finish_reason": "stop"
      }
    }
  ],
  "metrics": {
    "total_tokens": 1225,
    "total_cost_usd": 0.01075,
    "external_calls": 1,
    "platforms_used": ["kaizen", "openai"],
    "duration_ms": 2500
  }
}
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-20
**Author**: Kaizen Studio Testing Team
**Status**: Final
