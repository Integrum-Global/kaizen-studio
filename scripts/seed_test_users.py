#!/usr/bin/env python3
"""
Seed test users and data for AI Hub Agents integration tests.

This script creates:
1. Organization: Integrum Global
2. Admin user: admin@integrum.global (org_owner)
3. Regular user: jack@integrum.global (developer)
4. Workspace for agents
"""

import httpx
import sys

BASE_URL = "http://localhost:8000/api/v1"
TEST_PASSWORD = "Integrum2024!"


def seed_data():
    """Seed all required test data."""
    print("=" * 60)
    print("Seeding AI Hub Test Data")
    print("=" * 60)

    org_id = None
    workspace_id = None
    admin_token = None

    # Step 1: Register admin user (creates organization)
    print("\n[1/4] Registering admin@integrum.global...")
    response = httpx.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": "admin@integrum.global",
            "password": TEST_PASSWORD,
            "name": "Admin User",
            "organization_name": "Integrum Global",
        },
        timeout=30.0,
    )

    if response.status_code == 201:
        data = response.json()
        print(f"  ✓ Admin registered successfully")
        # Response: {"user": {...}, "tokens": {"access_token": ...}}
        admin_token = data.get("tokens", {}).get("access_token")
        org_id = data.get("user", {}).get("organization_id")
        print(f"    Organization ID: {org_id}")
    elif response.status_code == 409:
        print(f"  ✓ Admin already exists, logging in...")
        # Login instead
        login_resp = httpx.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@integrum.global", "password": TEST_PASSWORD},
            timeout=30.0,
        )
        if login_resp.status_code == 200:
            data = login_resp.json()
            # Login response: {"user": {...}, "access_token": ...}
            admin_token = data.get("access_token")
            org_id = data.get("user", {}).get("organization_id")
            print(f"    Organization ID: {org_id}")
        else:
            print(f"  ✗ Login failed: {login_resp.text}")
            return False
    else:
        print(f"  ✗ Registration failed: {response.status_code}")
        print(f"    {response.text}")
        return False

    if not admin_token:
        print("  ✗ Failed to get admin token")
        return False

    headers = {"Authorization": f"Bearer {admin_token}"}

    # Verify admin access
    me_resp = httpx.get(f"{BASE_URL}/auth/me", headers=headers, timeout=30.0)
    if me_resp.status_code != 200:
        print(f"  ✗ Admin verification failed: {me_resp.text}")
        return False
    print(f"  ✓ Admin token verified")

    # Step 2: Create jack user via direct creation
    print("\n[2/4] Creating jack@integrum.global...")

    user_resp = httpx.post(
        f"{BASE_URL}/users",
        headers=headers,
        json={
            "email": "jack@integrum.global",
            "password": TEST_PASSWORD,
            "name": "Jack User",
            "role": "developer",
        },
        timeout=30.0,
    )

    if user_resp.status_code == 201:
        print(f"  ✓ Jack created successfully")
    elif user_resp.status_code == 409:
        print(f"  ✓ Jack already exists")
    elif user_resp.status_code == 403:
        print(f"  ! Admin cannot create users directly, trying invitation...")
        # Create invitation
        invite_resp = httpx.post(
            f"{BASE_URL}/invitations",
            headers=headers,
            json={
                "email": "jack@integrum.global",
                "role": "developer",
            },
            timeout=30.0,
        )

        if invite_resp.status_code == 201:
            invite_data = invite_resp.json()
            token = invite_data.get("token")
            print(f"  ✓ Invitation created, accepting...")

            accept_resp = httpx.post(
                f"{BASE_URL}/invitations/{token}/accept",
                json={
                    "password": TEST_PASSWORD,
                    "name": "Jack User",
                },
                timeout=30.0,
            )

            if accept_resp.status_code in [200, 201]:
                print(f"  ✓ Jack created via invitation")
            else:
                print(f"  ! Accept invitation failed: {accept_resp.text}")
        elif invite_resp.status_code == 409:
            print(f"  ✓ Jack already exists (invitation conflict)")
        else:
            print(f"  ! Invitation failed: {invite_resp.text}")
    else:
        print(f"  ! User creation returned: {user_resp.status_code}")
        print(f"    {user_resp.text}")

    # Step 3: Create workspace
    print("\n[3/4] Creating workspace...")
    ws_resp = httpx.post(
        f"{BASE_URL}/workspaces",
        headers=headers,
        json={
            "name": "AI Hub Workspace",
            "workspace_type": "permanent",
            "description": "Workspace for AI Hub Agents",
        },
        timeout=30.0,
    )

    if ws_resp.status_code == 201:
        ws_data = ws_resp.json()
        workspace_id = ws_data.get("id")
        print(f"  ✓ Workspace created: {workspace_id}")
    else:
        print(f"  Workspace response: {ws_resp.status_code}")
        # List existing workspaces
        list_resp = httpx.get(
            f"{BASE_URL}/workspaces",
            headers=headers,
            timeout=30.0,
        )
        if list_resp.status_code == 200:
            workspaces = list_resp.json().get("records", [])
            if workspaces:
                workspace_id = workspaces[0].get("id")
                print(f"  ✓ Using existing workspace: {workspace_id}")
            else:
                print(f"  ! No workspaces found")
        else:
            print(f"  ! Failed to list workspaces: {list_resp.text}")

    # Step 4: Verify setup
    print("\n[4/4] Verifying setup...")

    # Verify jack can login
    jack_login = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": "jack@integrum.global", "password": TEST_PASSWORD},
        timeout=30.0,
    )
    if jack_login.status_code == 200:
        jack_data = jack_login.json()
        jack_org = jack_data.get("user", {}).get("organization_id")
        print(f"  ✓ Jack login verified")
        print(f"    Jack's org: {jack_org}")
        if jack_org == org_id:
            print(f"    ✓ Same organization as admin")
        else:
            print(f"    ! Different organization!")
    else:
        print(f"  ! Jack login failed: {jack_login.status_code}")

    print("\n" + "=" * 60)
    print("Seeding complete!")
    print("=" * 60)

    # Print configuration for tests
    print(f"\nTest Configuration (update in test file if needed):")
    print(f'  ORG_ID = "{org_id}"')
    print(f'  WORKSPACE_ID = "{workspace_id}"')
    print(f'  TEST_PASSWORD = "{TEST_PASSWORD}"')

    # Update test file with actual IDs
    if org_id and workspace_id:
        print("\nUpdating test file with actual IDs...")
        try:
            with open("tests/integration/test_ai_hub_agents.py", "r") as f:
                content = f.read()

            # Replace the hardcoded IDs
            import re
            content = re.sub(
                r'ORG_ID = "[^"]+"',
                f'ORG_ID = "{org_id}"',
                content
            )
            content = re.sub(
                r'WORKSPACE_ID = "[^"]+"',
                f'WORKSPACE_ID = "{workspace_id}"',
                content
            )

            with open("tests/integration/test_ai_hub_agents.py", "w") as f:
                f.write(content)

            print("  ✓ Test file updated with actual IDs")
        except Exception as e:
            print(f"  ! Failed to update test file: {e}")

    return True


if __name__ == "__main__":
    success = seed_data()
    sys.exit(0 if success else 1)
