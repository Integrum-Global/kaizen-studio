"""Debug SSO flow."""

import asyncio
import os
import uuid

from httpx import ASGITransport, AsyncClient

os.environ["DATABASE_URL"] = (
    "postgresql://kaizen_dev:kaizen_dev_password@localhost:5432/kaizen_studio_test"
)
os.environ["REDIS_URL"] = "redis://localhost:6379"


async def test_sso_flow():
    from studio.main import create_app
    from studio.services.auth_service import AuthService
    from studio.services.organization_service import OrganizationService
    from studio.services.user_service import UserService

    app = create_app()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Setup: Create org and user
        org_service = OrganizationService()
        user_service = UserService()
        auth_service = AuthService()

        org = await org_service.create_organization(
            name=f"Test Org {uuid.uuid4().hex[:8]}",
            slug=f"test-org-{uuid.uuid4().hex[:8]}",
            plan_tier="enterprise",
            created_by=str(uuid.uuid4()),
        )

        user = await user_service.create_user(
            organization_id=org["id"],
            email=f"test-{uuid.uuid4().hex[:8]}@test.com",
            name="Test User",
            password="password123",
            role="org_owner",
        )

        session = auth_service.create_session(
            user_id=user["id"],
            organization_id=org["id"],
            role="org_owner",
        )

        client.headers["Authorization"] = f"Bearer {session['token']}"

        # Create first connection with is_default=True
        resp1 = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "google",
                "client_id": "client-1",
                "client_secret": "secret-1",
                "is_default": True,
            },
        )
        print(f"Create conn1: status={resp1.status_code}")
        if resp1.status_code != 200:
            print(f"Error: {resp1.json()}")
            return
        conn1 = resp1.json()
        print(f"conn1 id={conn1['id'][:8]}, is_default={conn1.get('is_default')}")

        # Create second connection with is_default=False
        resp2 = await client.post(
            "/api/v1/sso/connections",
            json={
                "provider": "azure",
                "client_id": "client-2",
                "client_secret": "secret-2",
                "is_default": False,
            },
        )
        print(f"Create conn2: status={resp2.status_code}")
        if resp2.status_code != 200:
            print(f"Error: {resp2.json()}")
            return
        conn2 = resp2.json()
        print(f"conn2 id={conn2['id'][:8]}, is_default={conn2.get('is_default')}")

        # Update second as default
        resp3 = await client.put(
            f"/api/v1/sso/connections/{conn2['id']}",
            json={
                "is_default": True,
            },
        )
        print(f"Update conn2 to default: status={resp3.status_code}")
        if resp3.status_code != 200:
            print(f"Error: {resp3.json()}")
            return
        updated_conn2 = resp3.json()
        print(f"conn2 after update is_default={updated_conn2.get('is_default')}")

        # Read first connection
        resp4 = await client.get(f"/api/v1/sso/connections/{conn1['id']}")
        print(f"Get conn1: status={resp4.status_code}")
        if resp4.status_code != 200:
            print(f"Error: {resp4.json()}")
            return
        final_conn1 = resp4.json()
        print(f"conn1 final is_default={final_conn1.get('is_default')}")
        print(f"conn1 final keys: {list(final_conn1.keys())}")


if __name__ == "__main__":
    asyncio.run(test_sso_flow())
