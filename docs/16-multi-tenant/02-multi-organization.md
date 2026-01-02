# Multi-Organization Support

## What It Is

Multi-Organization Support allows users to belong to multiple organizations and switch between them without logging out. This is essential for consultants, contractors, or employees working across multiple company accounts.

## API Endpoints

### Get User's Organizations

```http
GET /api/v1/auth/me/organizations
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "organizations": [
    {
      "id": "org-1",
      "name": "Company A",
      "slug": "company-a",
      "role": "tenant_admin",
      "is_primary": true,
      "joined_at": "2025-01-01T00:00:00Z",
      "joined_via": "sso"
    },
    {
      "id": "org-2",
      "name": "Company B",
      "slug": "company-b",
      "role": "developer",
      "is_primary": false,
      "joined_at": "2025-01-15T00:00:00Z",
      "joined_via": "invitation"
    }
  ]
}
```

### Switch Organization

```http
POST /api/v1/auth/me/switch-org
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "organization_id": "org-2"
}
```

**Response:**
```json
{
  "access_token": "new-jwt-token",
  "refresh_token": "new-refresh-token",
  "token_type": "bearer",
  "expires_in": 900,
  "active_organization": {
    "id": "org-2",
    "name": "Company B",
    "slug": "company-b",
    "role": "developer",
    "is_primary": false,
    "joined_at": "2025-01-15T00:00:00Z",
    "joined_via": "invitation"
  }
}
```

## How It Works

### Data Model

Users are linked to organizations via the `UserOrganization` junction table:

```
User (id: "user-1")
  └── UserOrganization (user_id: "user-1", organization_id: "org-1", role: "tenant_admin", is_primary: true)
  └── UserOrganization (user_id: "user-1", organization_id: "org-2", role: "developer", is_primary: false)
```

### Token Structure

The JWT access token contains the active organization:

```json
{
  "sub": "user-id",
  "org_id": "active-org-id",
  "role": "developer",
  "email": "user@example.com",
  "name": "User Name",
  "type": "access",
  "iat": 1704067200,
  "exp": 1704068100,
  "jti": "unique-token-id"
}
```

### Switching Organizations

When a user switches organizations:

1. Validate user has access to target organization
2. Create new JWT tokens with updated `org_id` and `role`
3. Return new tokens to client
4. Client replaces stored tokens

```python
async def switch_organization(user_id: str, target_org_id: str) -> dict:
    # Get user's organizations
    user_orgs = await get_user_organizations(user_id)

    # Find target org
    target_org = next((o for o in user_orgs if o["id"] == target_org_id), None)
    if not target_org:
        raise ValueError("User does not have access to this organization")

    # Create new tokens with target org context
    user_with_org = {
        "id": user_id,
        "organization_id": target_org_id,
        "role": target_org["role"],
        ...
    }

    return create_tokens(user_with_org)
```

## Joined Via Types

The `joined_via` field tracks how a user joined an organization:

| Value | Description |
|-------|-------------|
| `sso` | First user from domain (created the org) |
| `domain_match` | Joined via SSO domain auto-join |
| `invitation` | Joined via email invitation |
| `created` | Manually created by admin |
| `legacy` | Existing user from before multi-org |

## Role Hierarchy

Within each organization, users have one of these roles:

| Role | Permissions |
|------|-------------|
| `tenant_admin` | Full org control, can manage admins |
| `org_admin` | Manage users, teams, resources |
| `developer` | Create/edit agents, pipelines, deployments |
| `viewer` | Read-only access |

Platform-level:

| Role | Permissions |
|------|-------------|
| `super_admin` | Manage all organizations, users, billing |

## Backward Compatibility

For users created before multi-org support:

1. `UserOrganization` records may not exist
2. System falls back to `User.organization_id` field
3. These users show `joined_via: "legacy"`

## Related Files

- `src/studio/services/auth_service.py` - Multi-org methods
- `src/studio/api/auth.py` - API endpoints
- `src/studio/models/user_organization.py` - Junction table model
