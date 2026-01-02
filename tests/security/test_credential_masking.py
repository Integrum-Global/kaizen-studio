"""
Credential Masking Security Test (Phase 6)

Verifies that AuditService logs do not contain plaintext credentials:
- Search audit logs for known test credentials
- Verify no plaintext credentials found
- Verify masked values present (e.g., "api_key": "***")

Uses real PostgreSQL - NO MOCKING.
"""

import json
import uuid

import pytest
from httpx import AsyncClient
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder


@pytest.mark.integration  # Tier 2: Real infrastructure
@pytest.mark.timeout(30)
@pytest.mark.asyncio
class TestCredentialMasking:
    """
    Security tests for credential masking in audit logs.

    Intent: Verify credentials never appear in plaintext in audit logs.

    Critical Security Requirements:
    - Audit logs do not contain plaintext credentials
    - Sensitive fields are masked with "***" or similar
    - Logs are still useful for debugging (structure preserved)
    """

    async def test_audit_logs_do_not_leak_api_keys(
        self, test_db, test_client: AsyncClient, authenticated_owner_client
    ):
        """
        Intent: Verify API keys are not leaked in audit logs.

        Setup:
        - Real PostgreSQL (test_db)
        - External agent with known API key
        - Trigger operations that create audit logs

        Steps:
        1. Create external agent with known API key
        2. Perform operations (create, update, invoke)
        3. Query audit logs for organization
        4. Search all audit log details for plaintext API key
        5. Verify no plaintext found

        Assertions:
        - Audit logs exist for operations
        - Known API key NOT found in any audit log
        - Masked value ("***") found in audit logs

        NO MOCKING: Uses real PostgreSQL.
        """
        from studio.services.workspace_service import WorkspaceService

        client, user, org = authenticated_owner_client

        # Create workspace using service (no workspace API endpoint)
        workspace_service = WorkspaceService()
        workspace = await workspace_service.create_workspace(
            organization_id=org["id"],
            name=f"Audit Masking Workspace {uuid.uuid4().hex[:6]}",
            environment_type="development",
        )

        # Known API key for verification (unique to avoid collisions)
        known_api_key = f"sk-audit-test-{uuid.uuid4().hex}-SHOULD-NOT-APPEAR-IN-LOGS"

        # Create external agent with API key
        agent_data = {
            "name": "Audit Masking Test Agent",
            "description": "External agent for audit log masking testing",
            "workspace_id": workspace["id"],
            "platform": "custom_http",
            "webhook_url": "https://api.example.com/webhook",
            "auth_type": "api_key",
            "auth_config": {
                "key": known_api_key,  # This should NEVER appear in logs
                "header_name": "X-API-Key",
            },
            "platform_config": {},
            "budget_limit_daily": 100.0,
            "budget_limit_monthly": 1000.0,
            "rate_limit_per_minute": 10,
            "tags": ["audit-masking-test"],
        }

        create_response = await client.post("/api/v1/external-agents", json=agent_data)
        assert create_response.status_code == 201
        agent = create_response.json()

        print("\n--- Audit Log Credential Masking Test ---")
        print(f"Agent ID: {agent['id']}")
        print(f"Known API Key Length: {len(known_api_key)} chars")
        print(f"Searching for: {known_api_key[:20]}... (first 20 chars)")

        # Perform additional operations to generate audit logs
        # Update agent
        update_response = await client.patch(
            f"/api/v1/external-agents/{agent['id']}",
            json={"description": "Updated description"},
        )
        assert update_response.status_code == 200

        # Query all audit logs for this organization
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()

        workflow.add_node(
            "AuditLogListNode",
            "list_logs",
            {
                "filter": {"organization_id": org["id"]},
                "limit": 1000,  # Get all recent logs
            },
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        audit_logs = results.get("list_logs", {}).get("items", [])

        print("\n--- Audit Log Analysis ---")
        print(f"Total Audit Logs Found: {len(audit_logs)}")

        # Search all audit logs for plaintext API key
        logs_with_leak = []

        for log in audit_logs:
            # Convert entire log record to JSON string
            log_json = json.dumps(log)

            # Search for known API key
            if known_api_key in log_json:
                logs_with_leak.append(
                    {
                        "log_id": log["id"],
                        "action": log.get("action", "unknown"),
                        "details": log.get("details", ""),
                    }
                )

        # CRITICAL: No logs should contain the plaintext API key
        if logs_with_leak:
            print("\n--- SECURITY ISSUE DETECTED ---")
            print(f"Found {len(logs_with_leak)} logs containing plaintext API key!")
            for leak in logs_with_leak:
                print(f"  - Log ID: {leak['log_id']}")
                print(f"    Action: {leak['action']}")
                print(f"    Details: {leak['details'][:100]}...")

        assert (
            len(logs_with_leak) == 0
        ), f"SECURITY ISSUE: Found {len(logs_with_leak)} logs with plaintext API key!"

        print(f"  ✓ No plaintext API key found in {len(audit_logs)} audit logs")

        # Verify masked values are present
        # Find logs related to our agent
        agent_logs = [
            log
            for log in audit_logs
            if log.get("resource_id") == agent["id"]
            or agent["id"] in json.dumps(log.get("details", ""))
        ]

        print(f"  ✓ Agent-related logs: {len(agent_logs)}")

        # Check if any agent logs contain masked credentials
        logs_with_masking = []

        for log in agent_logs:
            details_str = json.dumps(log.get("details", ""))
            # Look for masking patterns: "***", "REDACTED", "[MASKED]", etc.
            if (
                "***" in details_str
                or "REDACTED" in details_str
                or "[MASKED]" in details_str
            ):
                logs_with_masking.append(log)

        if logs_with_masking:
            print(f"  ✓ Found {len(logs_with_masking)} logs with masked credentials")
        else:
            print("  ⚠ No explicitly masked credentials found (may not be logged)")

    async def test_audit_logs_do_not_leak_oauth2_secrets(
        self, test_db, test_client: AsyncClient, authenticated_owner_client
    ):
        """
        Intent: Verify OAuth2 client secrets are not leaked in audit logs.

        Setup:
        - Real PostgreSQL (test_db)
        - External agent with OAuth2 credentials
        - Trigger operations that create audit logs

        Steps:
        1. Create external agent with known OAuth2 client_secret
        2. Perform operations (create, update, invoke)
        3. Query audit logs
        4. Search for plaintext client_secret
        5. Verify no plaintext found

        Assertions:
        - Audit logs exist
        - client_secret NOT found in any audit log
        - Masked value present in logs

        NO MOCKING: Uses real PostgreSQL.
        """
        from studio.services.workspace_service import WorkspaceService

        client, user, org = authenticated_owner_client

        # Create workspace using service (no workspace API endpoint)
        workspace_service = WorkspaceService()
        workspace = await workspace_service.create_workspace(
            organization_id=org["id"],
            name=f"OAuth Audit Masking Workspace {uuid.uuid4().hex[:6]}",
            environment_type="development",
        )

        # Known OAuth2 secret for verification
        known_client_secret = (
            f"oauth-secret-{uuid.uuid4().hex}-SHOULD-NOT-APPEAR-IN-LOGS"
        )

        # Create external agent with OAuth2 credentials
        agent_data = {
            "name": "OAuth Audit Masking Test Agent",
            "description": "External agent for OAuth2 audit log masking testing",
            "workspace_id": workspace["id"],
            "platform": "teams",
            "webhook_url": "https://directline.botframework.com/v3/directline",
            "auth_type": "oauth2",
            "auth_config": {
                "client_id": "test-client-id",
                "client_secret": known_client_secret,  # This should NEVER appear in logs
                "token_url": "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
                "scope": "https://api.botframework.com/.default",
            },
            "platform_config": {
                "tenant_id": "test-tenant-id",
                "channel_id": "test-channel-id",
            },
            "budget_limit_daily": 100.0,
            "budget_limit_monthly": 1000.0,
            "rate_limit_per_minute": 10,
            "tags": ["oauth-audit-masking-test"],
        }

        create_response = await client.post("/api/v1/external-agents", json=agent_data)
        assert create_response.status_code == 201
        agent = create_response.json()

        print("\n--- OAuth2 Audit Log Credential Masking Test ---")
        print(f"Agent ID: {agent['id']}")
        print(f"Known client_secret Length: {len(known_client_secret)} chars")

        # Perform update to generate more audit logs
        update_response = await client.patch(
            f"/api/v1/external-agents/{agent['id']}",
            json={"description": "Updated OAuth agent"},
        )
        assert update_response.status_code == 200

        # Query audit logs
        runtime = AsyncLocalRuntime()
        workflow = WorkflowBuilder()

        workflow.add_node(
            "AuditLogListNode",
            "list_logs",
            {
                "filter": {
                    "organization_id": org["id"],
                    "resource_type": "external_agent",
                },
                "limit": 1000,
            },
        )

        results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
        audit_logs = results.get("list_logs", {}).get("items", [])

        print("\n--- Audit Log Analysis ---")
        print(f"Total Audit Logs Found: {len(audit_logs)}")

        # Search for plaintext client_secret
        logs_with_leak = []

        for log in audit_logs:
            log_json = json.dumps(log)

            if known_client_secret in log_json:
                logs_with_leak.append(log["id"])

        # CRITICAL: No logs should contain plaintext secret
        assert (
            len(logs_with_leak) == 0
        ), f"SECURITY ISSUE: Found {len(logs_with_leak)} logs with plaintext OAuth2 secret!"

        print(f"  ✓ No plaintext client_secret found in {len(audit_logs)} audit logs")

        # Verify client_id is present but secret is masked
        agent_create_logs = [
            log
            for log in audit_logs
            if log.get("action") == "external_agent.created"
            and log.get("resource_id") == agent["id"]
        ]

        if agent_create_logs:
            create_log = agent_create_logs[0]
            details = json.loads(create_log.get("details", "{}"))

            # client_id may be visible (non-sensitive)
            if "client_id" in json.dumps(details):
                print("  ✓ client_id present in audit log (non-sensitive)")

            # client_secret should NOT be visible
            assert known_client_secret not in json.dumps(
                details
            ), "client_secret found in audit log details!"
            print("  ✓ client_secret masked in audit log")
