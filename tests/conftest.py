"""
Shared Test Fixtures

Provides fixtures for database, Redis, test client, and factory functions.
"""

# CRITICAL: Set environment variables FIRST, before ANY imports
# This must happen before studio.models is imported (directly or indirectly)
import os
import sys

# Add src to path if needed
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../src"))

# Set testing environment - MUST be first!
os.environ["ENVIRONMENT"] = "testing"

# Import config to get test database URL
from studio.config import get_database_url  # noqa: E402

# Set test database URL - MUST happen before studio.models is imported
os.environ["DATABASE_URL"] = get_database_url(test=True)


def pytest_configure(config):
    """
    Pytest hook that runs BEFORE test collection.

    CRITICAL: This ensures environment variables are set before ANY test modules
    are imported, preventing the database permission error during model registration.
    """
    # Ensure DATABASE_URL is set for test database BEFORE any imports
    os.environ["ENVIRONMENT"] = "testing"
    os.environ["DATABASE_URL"] = get_database_url(test=True)

    # Configure pytest markers for test tiers (moved from bottom of file)
    config.addinivalue_line("markers", "unit: Tier 1 unit tests (fast, isolated)")
    config.addinivalue_line(
        "markers", "integration: Tier 2 integration tests (real infrastructure)"
    )
    config.addinivalue_line(
        "markers", "e2e: Tier 3 end-to-end tests (complete workflows)"
    )


# NOW safe to import everything else
import asyncio  # noqa: E402
import json  # noqa: E402
import uuid  # noqa: E402
from collections.abc import AsyncGenerator  # noqa: E402
from datetime import UTC, datetime  # noqa: E402

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
import redis  # noqa: E402
from dataflow import DataFlow  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from studio.config import get_redis_url  # noqa: E402

# CRITICAL: Import studio.models at module level to ensure DataFlow initialization
# happens BEFORE any async fixtures run (prevents event loop conflicts)
from studio.models import db as _global_db  # noqa: E402
from studio.services.auth_service import AuthService  # noqa: E402

# Note: No need for pytest_sessionstart or manual table creation!
#
# DataFlow 0.9.7 Lazy Initialization Pattern:
# - Models are registered at import time (synchronous, fast)
# - Tables are created on FIRST USE with auto_migrate=True (async, deferred)
# - The global db instance in studio.models has auto_migrate=True by default
#
# Result: Tables will be automatically created when the first test accesses them.
# No manual intervention needed!


@pytest.fixture(scope="session")
def event_loop():
    """
    Create event loop for async tests.

    CRITICAL: Must be session-scoped to share event loop across all tests.
    DataFlow connection pools are tied to the event loop that created them.
    Using function-scoped loops causes "Event loop is closed" errors because
    the global db instance's pools remain tied to the first (now-closed) loop.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_database_url() -> str:
    """
    Get test database URL.

    NOTE: The test_db fixture now reuses the global db instance from
    studio.models, so this fixture is primarily for reference and
    test_client setup.
    """
    return get_database_url(test=True)


@pytest.fixture(scope="session")
def test_redis_url() -> str:
    """Get test Redis URL."""
    return get_redis_url(test=True)


@pytest.fixture(scope="session")
def redis_client(test_redis_url: str):
    """
    Create Redis client for testing.

    Session-scoped for efficiency.
    """
    client = redis.from_url(test_redis_url)
    yield client
    client.close()


@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[DataFlow, None]:
    """
    Reuse global DataFlow instance with per-test cleanup.

    CRITICAL: Reuses the global db instance from studio.models to avoid
    "Event loop is closed" errors. The global instance is created once
    during import with proper event loop handling.

    Uses real PostgreSQL - NO MOCKING.
    """
    # Use the globally imported db instance (already initialized at module level)
    # This avoids importing studio.models inside an async context
    yield _global_db

    # Cleanup: Delete all test data after each test
    from kailash.runtime import AsyncLocalRuntime
    from kailash.workflow.builder import WorkflowBuilder

    runtime = AsyncLocalRuntime()

    # Delete in reverse dependency order to avoid foreign key violations
    # Order matters: child tables first, parent tables last
    cleanup_nodes = [
        # Level 5: Most dependent tables
        "WebhookDeliveryBulkDeleteNode",
        "DeploymentLogBulkDeleteNode",
        "ConnectorInstanceBulkDeleteNode",
        "RolePermissionBulkDeleteNode",
        "PolicyAssignmentBulkDeleteNode",
        "UserIdentityBulkDeleteNode",
        "TeamMembershipBulkDeleteNode",
        "ExecutionMetricBulkDeleteNode",
        "TestExecutionBulkDeleteNode",
        "UsageRecordBulkDeleteNode",
        "PipelineConnectionBulkDeleteNode",
        "PipelineNodeBulkDeleteNode",
        "AgentVersionBulkDeleteNode",
        "AgentContextBulkDeleteNode",
        "AgentToolBulkDeleteNode",
        # Level 4: Mid-level dependencies
        "WebhookBulkDeleteNode",
        "DeploymentBulkDeleteNode",
        "ConnectorBulkDeleteNode",
        "RateLimitBulkDeleteNode",
        "APIKeyBulkDeleteNode",
        "AuditLogBulkDeleteNode",
        "InvitationBulkDeleteNode",
        "PipelineBulkDeleteNode",
        "AgentBulkDeleteNode",
        "GatewayBulkDeleteNode",
        # Level 3: Workspace dependencies
        "WorkspaceBulkDeleteNode",
        # Level 2: User and team dependencies
        "TeamBulkDeleteNode",
        "UserBulkDeleteNode",
        "PermissionBulkDeleteNode",
        "PolicyBulkDeleteNode",
        # Level 1: Top-level tables
        "SSOConnectionBulkDeleteNode",
        "BillingPeriodBulkDeleteNode",
        "UsageQuotaBulkDeleteNode",
        "OrganizationBulkDeleteNode",
    ]

    for node_name in cleanup_nodes:
        workflow = WorkflowBuilder()
        workflow.add_node(node_name, "cleanup", {"filter": {}, "confirmed": True})
        try:
            await runtime.execute_workflow_async(workflow.build(), inputs={})
        except Exception:
            # Ignore cleanup errors (table might be empty or FK constraints)
            pass

    # NOTE: Do NOT call cleanup_all_pools() here!
    # DataFlow v0.7.10+ isolates pools per event loop automatically.
    # Calling cleanup here breaks subsequent tests that share the global db instance.


@pytest.fixture(scope="function")
def clean_redis(redis_client):
    """
    Clean Redis before each test.

    Flushes all keys in the test database.
    """
    redis_client.flushdb()
    yield redis_client
    redis_client.flushdb()


@pytest_asyncio.fixture(scope="function")
async def shared_runtime():
    """Shared AsyncLocalRuntime for all services in tests."""
    from kailash.runtime import AsyncLocalRuntime

    return AsyncLocalRuntime()


@pytest_asyncio.fixture(scope="function")
async def test_client(test_db, clean_redis) -> AsyncGenerator[AsyncClient, None]:
    """
    Create async test client for API testing.

    Uses real FastAPI app - NO MOCKING.
    Depends on clean_redis to clear rate limit state between tests.
    """
    # Patch the database URL for the app
    os.environ["DATABASE_URL"] = get_database_url(test=True)
    os.environ["REDIS_URL"] = get_redis_url(test=True)

    # Import app after setting environment
    from studio.main import create_app

    app = create_app()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@pytest.fixture
def auth_service(clean_redis) -> AuthService:
    """
    Create AuthService for testing.

    Uses real Redis - NO MOCKING.
    """
    # Ensure test Redis URL is used
    os.environ["REDIS_URL"] = get_redis_url(test=True)
    return AuthService()


# Factory functions for test data


@pytest.fixture
def user_factory():
    """Factory to create user test data."""

    def _create_user(
        id: str = None,
        organization_id: str = None,
        email: str = None,
        name: str = "Test User",
        password: str = "testpassword123",
        status: str = "active",
        role: str = "developer",
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "organization_id": organization_id or str(uuid.uuid4()),
            "email": email or f"test_{uuid.uuid4().hex[:8]}@example.com",
            "name": name,
            "password": password,
            "status": status,
            "role": role,
            "mfa_enabled": False,
            "created_at": now,
            "updated_at": now,
        }

    return _create_user


@pytest.fixture
def organization_factory():
    """Factory to create organization test data."""

    def _create_org(
        id: str = None,
        name: str = None,
        slug: str = None,
        status: str = "active",
        plan_tier: str = "free",
        created_by: str = None,
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        org_id = id or str(uuid.uuid4())
        org_name = name or f"Test Org {uuid.uuid4().hex[:6]}"
        return {
            "id": org_id,
            "name": org_name,
            "slug": slug or org_name.lower().replace(" ", "-"),
            "status": status,
            "plan_tier": plan_tier,
            "created_by": created_by or str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
        }

    return _create_org


@pytest.fixture
def workspace_factory():
    """Factory to create workspace test data."""

    def _create_workspace(
        id: str = None,
        organization_id: str = None,
        name: str = "Test Workspace",
        environment_type: str = "development",
        description: str = "Test workspace description",
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "organization_id": organization_id or str(uuid.uuid4()),
            "name": name,
            "environment_type": environment_type,
            "description": description,
            "created_at": now,
            "updated_at": now,
        }

    return _create_workspace


@pytest.fixture
def registration_data():
    """Generate unique registration data for each test."""
    unique_id = uuid.uuid4().hex[:8]
    return {
        "email": f"test_{unique_id}@example.com",
        "password": "securepassword123",
        "name": f"Test User {unique_id}",
        "organization_name": f"Test Org {unique_id}",
    }


# Factory for teams
@pytest.fixture
def team_factory():
    """Factory to create team test data."""

    def _create_team(
        id: str = None,
        organization_id: str = None,
        name: str = "Test Team",
        description: str = None,
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "organization_id": organization_id or str(uuid.uuid4()),
            "name": name,
            "description": description,
            "created_at": now,
            "updated_at": now,
        }

    return _create_team


@pytest.fixture
def invitation_factory():
    """Factory to create invitation test data."""
    import secrets
    from datetime import timedelta

    def _create_invitation(
        id: str = None,
        organization_id: str = None,
        email: str = None,
        role: str = "developer",
        invited_by: str = None,
        status: str = "pending",
        expires_in_days: int = 7,
    ) -> dict:
        now = datetime.now(UTC)
        return {
            "id": id or str(uuid.uuid4()),
            "organization_id": organization_id or str(uuid.uuid4()),
            "email": email or f"invite_{uuid.uuid4().hex[:8]}@example.com",
            "role": role,
            "invited_by": invited_by or str(uuid.uuid4()),
            "token": secrets.token_urlsafe(32),
            "status": status,
            "expires_at": (now + timedelta(days=expires_in_days)).isoformat(),
            "created_at": now.isoformat(),
        }

    return _create_invitation


# Agent test data factories


@pytest.fixture
def agent_factory():
    """Factory to create agent test data."""

    def _create_agent(
        id: str = None,
        organization_id: str = None,
        workspace_id: str = None,
        name: str = None,
        agent_type: str = "chat",
        model_id: str = "gpt-4",
        created_by: str = None,
        description: str = "",
        system_prompt: str = "",
        temperature: float = 0.7,
        max_tokens: int = 0,
        status: str = "draft",
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "organization_id": organization_id or str(uuid.uuid4()),
            "workspace_id": workspace_id or str(uuid.uuid4()),
            "name": f"Test Agent {uuid.uuid4().hex[:8]}" if name is None else name,
            "agent_type": agent_type,
            "model_id": model_id,
            "created_by": created_by or str(uuid.uuid4()),
            "description": description,
            "system_prompt": system_prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "status": status,
            "created_at": now,
            "updated_at": now,
        }

    return _create_agent


@pytest.fixture
def agent_version_factory():
    """Factory to create agent version test data."""
    import json

    def _create_version(
        id: str = None,
        agent_id: str = None,
        version_number: int = 1,
        config_snapshot: dict = None,
        changelog: str = "",
        created_by: str = None,
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        default_config = {
            "name": "Test Agent",
            "description": "Test description",
            "agent_type": "chat",
            "system_prompt": "You are helpful",
            "model_id": "gpt-4",
            "temperature": 0.7,
            "max_tokens": 2000,
        }
        return {
            "id": id or str(uuid.uuid4()),
            "agent_id": agent_id or str(uuid.uuid4()),
            "version_number": version_number,
            "config_snapshot": json.dumps(config_snapshot or default_config),
            "changelog": changelog,
            "created_by": created_by or str(uuid.uuid4()),
            "created_at": now,
        }

    return _create_version


@pytest.fixture
def agent_context_factory():
    """Factory to create agent context test data."""

    def _create_context(
        id: str = None,
        agent_id: str = None,
        name: str = None,
        content_type: str = "text",
        content: str = "Test context content",
        is_active: int = 1,
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "agent_id": agent_id or str(uuid.uuid4()),
            "name": name or f"Context {uuid.uuid4().hex[:6]}",
            "content_type": content_type,
            "content": content,
            "is_active": is_active,
            "created_at": now,
            "updated_at": now,
        }

    return _create_context


@pytest.fixture
def agent_tool_factory():
    """Factory to create agent tool test data."""
    import json

    def _create_tool(
        id: str = None,
        agent_id: str = None,
        tool_type: str = "function",
        name: str = None,
        description: str = "Test tool description",
        config: dict = None,
        is_enabled: int = 1,
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "agent_id": agent_id or str(uuid.uuid4()),
            "tool_type": tool_type,
            "name": name or f"Tool {uuid.uuid4().hex[:6]}",
            "description": description,
            "config": json.dumps(config or {"param1": "value1"}),
            "is_enabled": is_enabled,
            "created_at": now,
        }

    return _create_tool


# Promotion test data factories


@pytest.fixture
def promotion_factory():
    """Factory to create promotion test data."""

    def _create_promotion(
        id: str = None,
        organization_id: str = None,
        agent_id: str = None,
        source_deployment_id: str = None,
        target_gateway_id: str = None,
        source_environment: str = "development",
        target_environment: str = "staging",
        status: str = "pending",
        requires_approval: bool = False,
        approved_by: str = None,
        approved_at: str = None,
        rejection_reason: str = None,
        target_deployment_id: str = None,
        created_by: str = None,
        completed_at: str = None,
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "organization_id": organization_id or str(uuid.uuid4()),
            "agent_id": agent_id or str(uuid.uuid4()),
            "source_deployment_id": source_deployment_id or str(uuid.uuid4()),
            "target_gateway_id": target_gateway_id or str(uuid.uuid4()),
            "source_environment": source_environment,
            "target_environment": target_environment,
            "status": status,
            "requires_approval": requires_approval,
            "approved_by": approved_by,
            "approved_at": approved_at,
            "rejection_reason": rejection_reason,
            "target_deployment_id": target_deployment_id,
            "created_by": created_by or str(uuid.uuid4()),
            "created_at": now,
            "completed_at": completed_at,
        }

    return _create_promotion


@pytest.fixture
def promotion_rule_factory():
    """Factory to create promotion rule test data."""

    def _create_rule(
        id: str = None,
        organization_id: str = None,
        name: str = None,
        source_environment: str = "development",
        target_environment: str = "staging",
        requires_approval: bool = False,
        auto_promote: bool = False,
        required_approvers: int = 1,
        conditions: dict = None,
        status: str = "active",
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "organization_id": organization_id or str(uuid.uuid4()),
            "name": name or f"Rule {uuid.uuid4().hex[:6]}",
            "source_environment": source_environment,
            "target_environment": target_environment,
            "requires_approval": requires_approval,
            "auto_promote": auto_promote,
            "required_approvers": required_approvers,
            "conditions": conditions,
            "status": status,
            "created_at": now,
            "updated_at": now,
        }

    return _create_rule


# Authenticated client fixtures


@pytest_asyncio.fixture
async def authenticated_client(
    test_db, test_client, organization_factory, user_factory, shared_runtime
):
    """
    Create an authenticated test client with org_owner role.

    Returns tuple of (client, user_data).
    """
    from studio.services.auth_service import AuthService
    from studio.services.organization_service import OrganizationService
    from studio.services.user_service import UserService

    org_service = OrganizationService()
    user_service = UserService()
    auth_service = AuthService()

    # Create organization
    org_data = organization_factory()
    org = await org_service.create_organization(
        name=org_data["name"],
        slug=org_data["slug"],
        plan_tier=org_data["plan_tier"],
        created_by=org_data["created_by"],
    )

    # Create user
    user_data = user_factory(
        organization_id=org["id"],
        role="org_owner",
    )
    user = await user_service.create_user(
        organization_id=org["id"],
        email=user_data["email"],
        name=user_data["name"],
        password=user_data["password"],
        role="org_owner",
    )

    # Create session
    session = auth_service.create_session(
        user_id=user["id"],
        organization_id=org["id"],
        role="org_owner",
    )

    # Add auth header to client
    test_client.headers["Authorization"] = f"Bearer {session['token']}"

    yield test_client, user

    # NOTE: No cleanup_all_pools() - DataFlow handles pool lifecycle automatically


@pytest_asyncio.fixture
async def authenticated_admin_client(
    test_db, test_client, organization_factory, user_factory, shared_runtime
):
    """
    Create an authenticated test client with org_admin role.

    Returns tuple of (client, user_data).
    """
    from studio.services.auth_service import AuthService
    from studio.services.organization_service import OrganizationService
    from studio.services.user_service import UserService

    org_service = OrganizationService()
    user_service = UserService()
    auth_service = AuthService()

    # Create organization
    org_data = organization_factory()
    org = await org_service.create_organization(
        name=org_data["name"],
        slug=org_data["slug"],
        plan_tier=org_data["plan_tier"],
        created_by=org_data["created_by"],
    )

    # Create admin user
    user_data = user_factory(
        organization_id=org["id"],
        role="org_admin",
    )
    user = await user_service.create_user(
        organization_id=org["id"],
        email=user_data["email"],
        name=user_data["name"],
        password=user_data["password"],
        role="org_admin",
    )

    # Create session
    session = auth_service.create_session(
        user_id=user["id"],
        organization_id=org["id"],
        role="org_admin",
    )

    # Add auth header to client
    test_client.headers["Authorization"] = f"Bearer {session['token']}"

    yield test_client, user

    # NOTE: No cleanup_all_pools() - DataFlow handles pool lifecycle automatically


@pytest_asyncio.fixture
async def authenticated_developer_client(
    test_db, test_client, organization_factory, user_factory, shared_runtime
):
    """
    Create an authenticated test client with developer role.

    Returns tuple of (client, user_data).
    """
    from studio.services.auth_service import AuthService
    from studio.services.organization_service import OrganizationService
    from studio.services.user_service import UserService

    org_service = OrganizationService()
    user_service = UserService()
    auth_service = AuthService()

    # Create organization
    org_data = organization_factory()
    org = await org_service.create_organization(
        name=org_data["name"],
        slug=org_data["slug"],
        plan_tier=org_data["plan_tier"],
        created_by=org_data["created_by"],
    )

    # Create developer user
    user_data = user_factory(
        organization_id=org["id"],
        role="developer",
    )
    user = await user_service.create_user(
        organization_id=org["id"],
        email=user_data["email"],
        name=user_data["name"],
        password=user_data["password"],
        role="developer",
    )

    # Create session
    session = auth_service.create_session(
        user_id=user["id"],
        organization_id=org["id"],
        role="developer",
    )

    # Add auth header to client
    test_client.headers["Authorization"] = f"Bearer {session['token']}"

    yield test_client, user

    # NOTE: No cleanup_all_pools() - DataFlow handles pool lifecycle automatically


@pytest_asyncio.fixture
async def authenticated_owner_client(
    test_db, test_client, organization_factory, user_factory, shared_runtime
):
    """
    Create an authenticated test client with org_owner role.

    Returns tuple of (client, user_data, org_data).
    """
    from studio.services.auth_service import AuthService
    from studio.services.organization_service import OrganizationService
    from studio.services.user_service import UserService

    org_service = OrganizationService()
    user_service = UserService()
    auth_service = AuthService()

    # Create organization
    org_data = organization_factory()
    org = await org_service.create_organization(
        name=org_data["name"],
        slug=org_data["slug"],
        plan_tier=org_data["plan_tier"],
        created_by=org_data["created_by"],
    )

    # Create owner user
    user_data = user_factory(
        organization_id=org["id"],
        role="org_owner",
    )
    user = await user_service.create_user(
        organization_id=org["id"],
        email=user_data["email"],
        name=user_data["name"],
        password=user_data["password"],
        role="org_owner",
    )

    # Create session
    session = auth_service.create_session(
        user_id=user["id"],
        organization_id=org["id"],
        role="org_owner",
    )

    # Add auth header to client
    test_client.headers["Authorization"] = f"Bearer {session['token']}"

    yield test_client, user, org

    # NOTE: No cleanup_all_pools() - DataFlow handles pool lifecycle automatically


# Test data fixtures


@pytest_asyncio.fixture
async def test_organization(authenticated_client):
    """Create a test organization."""
    client, user = authenticated_client
    return {
        "id": user["organization_id"],
        "name": "Test Organization",
        "slug": "test-organization",
        "status": "active",
    }


@pytest_asyncio.fixture
async def test_workspace_2(authenticated_client, workspace_factory, shared_runtime):
    """Create a test workspace in the organization."""
    client, user = authenticated_client

    from studio.services.workspace_service import WorkspaceService

    workspace_service = WorkspaceService()

    workspace_data = workspace_factory(
        organization_id=user["organization_id"],
        name="Test Workspace 2",
        environment_type="development",
    )

    workspace = await workspace_service.create_workspace(
        organization_id=user["organization_id"],
        name=workspace_data["name"],
        environment_type=workspace_data["environment_type"],
        description=workspace_data.get("description", ""),
    )

    return workspace


@pytest_asyncio.fixture
async def test_user(authenticated_admin_client, user_factory):
    """Create a test user in the organization."""
    client, admin = authenticated_admin_client

    from studio.services.user_service import UserService

    user_service = UserService()

    user_data = user_factory(
        organization_id=admin["organization_id"],
        role="developer",
    )
    user = await user_service.create_user(
        organization_id=admin["organization_id"],
        email=user_data["email"],
        name=user_data["name"],
        password=user_data["password"],
        role="developer",
    )

    return user


@pytest_asyncio.fixture
async def test_team(authenticated_admin_client, team_factory):
    """Create a test team in the organization."""
    client, admin = authenticated_admin_client

    from studio.services.team_service import TeamService

    team_service = TeamService()

    team = await team_service.create_team(
        name=f"Test Team {uuid.uuid4().hex[:6]}",
        organization_id=admin["organization_id"],
        description="A test team",
    )

    return team


@pytest_asyncio.fixture
async def test_team_with_members(authenticated_admin_client, user_factory):
    """Create a test team with members."""
    client, admin = authenticated_admin_client

    from studio.services.team_service import TeamService
    from studio.services.user_service import UserService

    team_service = TeamService()
    user_service = UserService()

    # Create team
    team = await team_service.create_team(
        name=f"Team With Members {uuid.uuid4().hex[:6]}",
        organization_id=admin["organization_id"],
    )

    # Create and add members
    members = []
    for i in range(2):
        user_data = user_factory(
            organization_id=admin["organization_id"],
            role="developer",
        )
        user = await user_service.create_user(
            organization_id=admin["organization_id"],
            email=user_data["email"],
            name=user_data["name"],
            password=user_data["password"],
            role="developer",
        )

        membership = await team_service.add_member(
            team_id=team["id"],
            user_id=user["id"],
            role="team_lead" if i == 0 else "member",
        )
        members.append(membership)

    return team, members


@pytest_asyncio.fixture
async def test_pending_invitation(authenticated_admin_client, invitation_factory):
    """Create a pending invitation."""
    client, admin = authenticated_admin_client

    from studio.services.invitation_service import InvitationService

    invitation_service = InvitationService()

    invitation = await invitation_service.create_invitation(
        organization_id=admin["organization_id"],
        email=f"pending_{uuid.uuid4().hex[:8]}@example.com",
        role="developer",
        invited_by=admin["id"],
    )

    return invitation


@pytest_asyncio.fixture
async def test_expired_invitation(authenticated_admin_client):
    """Create an expired invitation."""
    client, admin = authenticated_admin_client

    from studio.services.invitation_service import InvitationService

    invitation_service = InvitationService()

    # Create invitation with negative expiration (already expired)
    invitation = await invitation_service.create_invitation(
        organization_id=admin["organization_id"],
        email=f"expired_{uuid.uuid4().hex[:8]}@example.com",
        role="developer",
        invited_by=admin["id"],
        expires_in_days=-1,  # Already expired
    )

    return invitation


@pytest_asyncio.fixture
async def test_accepted_invitation(authenticated_admin_client):
    """Create an already accepted invitation."""
    client, admin = authenticated_admin_client

    from studio.services.invitation_service import InvitationService

    invitation_service = InvitationService()

    # Create and accept invitation
    invitation = await invitation_service.create_invitation(
        organization_id=admin["organization_id"],
        email=f"accepted_{uuid.uuid4().hex[:8]}@example.com",
        role="developer",
        invited_by=admin["id"],
    )

    # Mark as accepted
    await invitation_service._update_invitation_status(invitation["id"], "accepted")
    invitation["status"] = "accepted"

    return invitation


# Pipeline test data factories


@pytest.fixture
def pipeline_factory():
    """Factory to create pipeline test data."""

    def _create_pipeline(
        id: str = None,
        organization_id: str = None,
        workspace_id: str = None,
        name: str = None,
        pattern: str = "sequential",
        status: str = "draft",
        description: str = "",
        created_by: str = None,
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "organization_id": organization_id or str(uuid.uuid4()),
            "workspace_id": workspace_id or str(uuid.uuid4()),
            "name": name or f"Test Pipeline {uuid.uuid4().hex[:8]}",
            "pattern": pattern,
            "status": status,
            "description": description,
            "created_by": created_by or str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
        }

    return _create_pipeline


@pytest.fixture
def pipeline_node_factory():
    """Factory to create pipeline node test data."""

    def _create_node(
        id: str = None,
        pipeline_id: str = None,
        node_type: str = "agent",
        agent_id: str = "",
        label: str = None,
        position_x: float = 0.0,
        position_y: float = 0.0,
        config: dict = None,
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "pipeline_id": pipeline_id or str(uuid.uuid4()),
            "node_type": node_type,
            "agent_id": agent_id,
            "label": label or f"Node {uuid.uuid4().hex[:6]}",
            "position_x": position_x,
            "position_y": position_y,
            "config": json.dumps(config) if config else "",
            "created_at": now,
            "updated_at": now,
        }

    return _create_node


@pytest.fixture
def pipeline_connection_factory():
    """Factory to create pipeline connection test data."""

    def _create_connection(
        id: str = None,
        pipeline_id: str = None,
        source_node_id: str = None,
        target_node_id: str = None,
        source_handle: str = "output",
        target_handle: str = "input",
        condition: dict = None,
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "pipeline_id": pipeline_id or str(uuid.uuid4()),
            "source_node_id": source_node_id or str(uuid.uuid4()),
            "target_node_id": target_node_id or str(uuid.uuid4()),
            "source_handle": source_handle,
            "target_handle": target_handle,
            "condition": json.dumps(condition) if condition else "",
            "created_at": now,
        }

    return _create_connection


# Test Execution test data factories


@pytest.fixture
def test_execution_factory():
    """Factory to create test execution test data."""

    def _create_execution(
        id: str = None,
        organization_id: str = None,
        agent_id: str = "",
        pipeline_id: str = "",
        input_data: dict = None,
        output_data: dict = None,
        status: str = "completed",
        execution_time_ms: int = 0,
        token_usage: dict = None,
        error_message: str = "",
        created_by: str = None,
    ) -> dict:
        now = datetime.now(UTC).isoformat()
        return {
            "id": id or str(uuid.uuid4()),
            "organization_id": organization_id or str(uuid.uuid4()),
            "agent_id": agent_id,
            "pipeline_id": pipeline_id,
            "input_data": json.dumps(input_data or {"message": "test"}),
            "output_data": json.dumps(output_data or {"response": "test response"}),
            "status": status,
            "execution_time_ms": execution_time_ms,
            "token_usage": json.dumps(
                token_usage or {"input": 10, "output": 20, "total": 30}
            ),
            "error_message": error_message,
            "created_by": created_by or str(uuid.uuid4()),
            "created_at": now,
        }

    return _create_execution


@pytest_asyncio.fixture
async def test_agent_with_execution(authenticated_client):
    """Create a test agent and run a test execution on it."""
    client, user = authenticated_client

    # Create agent
    agent_response = await client.post(
        "/agents",
        json={
            "workspace_id": "test-ws",
            "name": "Agent for Test Execution",
            "agent_type": "chat",
            "model_id": "gpt-4",
            "description": "Test agent",
            "system_prompt": "You are helpful",
            "temperature": 0.7,
        },
    )

    agent = agent_response.json()
    agent_id = agent["id"]

    # Run test
    test_response = await client.post(
        f"/test/agents/{agent_id}",
        json={
            "input": {"message": "Hello"},
        },
    )

    execution = test_response.json()
    execution_id = execution["id"]

    return {
        "agent_id": agent_id,
        "execution_id": execution_id,
        "agent": agent,
        "execution": execution,
    }


@pytest_asyncio.fixture
async def test_pipeline_with_execution(authenticated_client):
    """Create a test pipeline and run a test execution on it."""
    client, user = authenticated_client

    # Create pipeline
    pipeline_response = await client.post(
        "/pipelines",
        json={
            "workspace_id": "test-ws",
            "name": "Pipeline for Test Execution",
            "description": "Test pipeline",
        },
    )

    pipeline = pipeline_response.json()
    pipeline_id = pipeline["id"]

    # Run test
    test_response = await client.post(
        f"/test/pipelines/{pipeline_id}",
        json={
            "input": {"data": "test"},
        },
    )

    execution = test_response.json()
    execution_id = execution["id"]

    return {
        "pipeline_id": pipeline_id,
        "execution_id": execution_id,
        "pipeline": pipeline,
        "execution": execution,
    }


@pytest_asyncio.fixture
async def test_pipeline_with_node_execution(authenticated_client):
    """Create a test pipeline with node and run a test execution on the node."""
    client, user = authenticated_client

    # Create pipeline
    pipeline_response = await client.post(
        "/pipelines",
        json={
            "workspace_id": "test-ws",
            "name": "Pipeline with Node for Test",
        },
    )

    pipeline = pipeline_response.json()
    pipeline_id = pipeline["id"]

    # Create node
    node_response = await client.post(
        f"/pipelines/{pipeline_id}/nodes",
        json={
            "node_type": "ai",
            "label": "Test Node",
            "config": {"model": "gpt-4"},
        },
    )

    node = node_response.json()
    node_id = node["id"]

    # Run test on node
    test_response = await client.post(
        f"/test/pipelines/{pipeline_id}/nodes/{node_id}",
        json={"input": {"message": "test"}},
    )

    execution = test_response.json()
    execution_id = execution["id"]

    return {
        "pipeline_id": pipeline_id,
        "node_id": node_id,
        "execution_id": execution_id,
        "pipeline": pipeline,
        "node": node,
        "execution": execution,
    }


# Connector test fixtures


@pytest.fixture
def agent_id():
    """Generate a test agent ID."""
    return f"agent-{uuid.uuid4().hex[:8]}"


@pytest_asyncio.fixture
async def create_connector(authenticated_client):
    """Factory fixture to create connectors for testing."""
    client, user = authenticated_client

    async def _create(
        connector_type: str,
        provider: str,
        name: str = None,
        status: str = "active",
        config: dict = None,
    ) -> dict:
        """Create a connector with given parameters."""
        connector_data = {
            "name": name or f"test-{connector_type}-{provider}-{uuid.uuid4().hex[:6]}",
            "connector_type": connector_type,
            "provider": provider,
            "config": config or {"url": f"http://localhost/{provider}"},
            "status": status,
        }

        response = await client.post(
            "/api/v1/connectors",
            json=connector_data,
        )

        assert (
            response.status_code == 201
        ), f"Failed to create connector: {response.text}"
        return response.json()

    return _create


@pytest.fixture
def auth_headers_dict():
    """Return empty dict - authenticated_client already sets headers on test_client."""
    return {}


@pytest.fixture
def auth_headers_dict_different_org():
    """Get auth headers for a different organization."""
    return {}


@pytest_asyncio.fixture
async def user_headers(test_db, organization_factory, user_factory, shared_runtime):
    """
    Get auth headers for a regular viewer user (limited permissions).

    Unlike auth_headers_dict which is for org_owner, this creates a viewer
    user that lacks permissions like create:external_agent.
    """
    from studio.services.auth_service import AuthService
    from studio.services.organization_service import OrganizationService
    from studio.services.user_service import UserService

    org_service = OrganizationService()
    user_service = UserService()
    auth_service = AuthService()

    # Create organization
    org_data = organization_factory()
    org = await org_service.create_organization(
        name=org_data["name"],
        slug=org_data["slug"],
        plan_tier=org_data["plan_tier"],
        created_by=org_data["created_by"],
    )

    # Create user with viewer role (limited permissions)
    user_data = user_factory(
        organization_id=org["id"],
        role="viewer",  # Viewer has limited permissions
    )
    user = await user_service.create_user(
        organization_id=org["id"],
        email=user_data["email"],
        name=user_data["name"],
        password=user_data["password"],
        role="viewer",
    )

    # Create session
    session = auth_service.create_session(
        user_id=user["id"],
        organization_id=org["id"],
        role="viewer",
    )

    return {"Authorization": f"Bearer {session['token']}"}


@pytest_asyncio.fixture
async def e2e_user_factory(test_db, shared_runtime, organization_factory, user_factory):
    """
    Factory to create REAL users in the database for E2E tests.

    Unlike user_factory which only generates test data dicts,
    this fixture creates actual database records.

    Returns a factory function that creates and returns real user data.
    """
    from studio.services.organization_service import OrganizationService
    from studio.services.user_service import UserService

    org_service = OrganizationService()
    user_service = UserService()

    async def _create_user(
        role: str = "org_owner",
        organization_id: str = None,
    ) -> dict:
        """Create a real user in the database."""
        # Create organization if not provided
        if organization_id is None:
            org_data = organization_factory()
            org = await org_service.create_organization(
                name=org_data["name"],
                slug=org_data["slug"],
                plan_tier=org_data["plan_tier"],
                created_by=org_data["created_by"],
            )
            organization_id = org["id"]

        # Create user
        user_data = user_factory(organization_id=organization_id, role=role)
        user = await user_service.create_user(
            organization_id=organization_id,
            email=user_data["email"],
            name=user_data["name"],
            password=user_data["password"],
            role=role,
        )

        return user

    return _create_user


# Token fixtures for billing tests


@pytest_asyncio.fixture
async def shared_billing_org(test_db, shared_runtime, organization_factory) -> dict:
    """
    Create a shared organization for billing tests.

    Both test_user_token and test_admin_token fixtures use this org
    so they can share billing data.
    """
    from studio.services.organization_service import OrganizationService

    org_service = OrganizationService()

    # Create organization
    org_data = organization_factory()
    org = await org_service.create_organization(
        name=org_data["name"],
        slug=org_data["slug"],
        plan_tier=org_data["plan_tier"],
        created_by=org_data["created_by"],
    )

    return org


@pytest_asyncio.fixture
async def test_user_token(
    test_db, shared_runtime, shared_billing_org, user_factory
) -> str:
    """
    Create a test user and return their auth token.

    Used by billing tests that pass tokens explicitly in headers.
    Uses shared_billing_org so user and admin are in same organization.
    """
    from studio.services.auth_service import AuthService
    from studio.services.user_service import UserService

    user_service = UserService()
    auth_service = AuthService()

    org = shared_billing_org

    # Create regular user (developer role)
    user_data = user_factory(organization_id=org["id"], role="developer")
    user = await user_service.create_user(
        organization_id=org["id"],
        email=user_data["email"],
        name=user_data["name"],
        password=user_data["password"],
        role="developer",
    )

    # Create session and return token
    session = auth_service.create_session(
        user_id=user["id"],
        organization_id=org["id"],
        role="developer",
    )

    return session["token"]


@pytest_asyncio.fixture
async def test_admin_token(
    test_db, shared_runtime, shared_billing_org, user_factory
) -> str:
    """
    Create an admin user and return their auth token.

    Used by billing tests that pass tokens explicitly in headers.
    Uses shared_billing_org so user and admin are in same organization.
    """
    from studio.services.auth_service import AuthService
    from studio.services.user_service import UserService

    user_service = UserService()
    auth_service = AuthService()

    org = shared_billing_org

    # Create admin user (org_admin role)
    user_data = user_factory(organization_id=org["id"], role="org_admin")
    user = await user_service.create_user(
        organization_id=org["id"],
        email=user_data["email"],
        name=user_data["name"],
        password=user_data["password"],
        role="org_admin",
    )

    # Create session and return token
    session = auth_service.create_session(
        user_id=user["id"],
        organization_id=org["id"],
        role="org_admin",
    )

    return session["token"]


@pytest_asyncio.fixture
async def connector_service():
    """
    Provide ConnectorService instance for testing.

    Uses real database connections for integration tests.
    """
    from studio.services.connector_service import ConnectorService

    service = ConnectorService()
    yield service


@pytest.fixture(scope="session")
def db_url():
    """
    Provide database URL for connector tests.

    Returns the test database URL from environment.
    """
    return get_database_url(test=True)


@pytest_asyncio.fixture
async def second_org_client(
    test_db, organization_factory, user_factory, shared_runtime
):
    """
    Create an authenticated test client for a SECOND organization.

    Used for organization isolation tests - verifies that resources from
    one organization cannot be accessed by users in another organization.

    Returns tuple of (client, user_data, org_data) - same as authenticated_owner_client
    but with a completely separate organization and client instance.
    """
    from studio.services.auth_service import AuthService
    from studio.services.organization_service import OrganizationService
    from studio.services.user_service import UserService

    org_service = OrganizationService()
    user_service = UserService()
    auth_service = AuthService()

    # Create SECOND organization (different from authenticated_owner_client)
    org_data = organization_factory(name="Second Org for Isolation Tests")
    org = await org_service.create_organization(
        name=org_data["name"],
        slug=org_data["slug"],
        plan_tier=org_data["plan_tier"],
        created_by=org_data["created_by"],
    )

    # Create owner user for second org
    user_data = user_factory(
        organization_id=org["id"],
        role="org_owner",
    )
    user = await user_service.create_user(
        organization_id=org["id"],
        email=user_data["email"],
        name=user_data["name"],
        password=user_data["password"],
        role="org_owner",
    )

    # Create session
    session = auth_service.create_session(
        user_id=user["id"],
        organization_id=org["id"],
        role="org_owner",
    )

    # Create SEPARATE client instance to avoid auth header conflicts
    # with authenticated_owner_client
    os.environ["DATABASE_URL"] = get_database_url(test=True)
    os.environ["REDIS_URL"] = get_redis_url(test=True)

    from studio.main import create_app

    app = create_app()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Add auth header for second org's user
        client.headers["Authorization"] = f"Bearer {session['token']}"

        yield client, user, org


@pytest.fixture
def mock_external_webhook():
    """
    Mock external webhook server for E2E tests.

    Provides a mock HTTP server that simulates external webhook endpoints.
    In real E2E tests, this could be a local HTTP server or respx mock.

    For now, returns a simple dictionary with the mock configuration.
    The actual webhook delivery is fire-and-forget async, so we don't
    need a real server for most test scenarios.
    """
    return {
        "url": "https://mock-webhook.test/v1/callback",
        "received_requests": [],
        "status_code": 200,
        "response": {"ok": True},
    }
