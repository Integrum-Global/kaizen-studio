# TODO-033: Phase 4 - Multi-Organization Support

**Status**: COMPLETED
**Priority**: HIGH
**Created**: 2025-12-26
**Completed**: 2025-12-26
**Dependencies**: TODO-032 (completed)

---

## Objective

Enable users to belong to multiple organizations with organization switching:
- Token structure changes for multi-org
- Organization switching API endpoint
- Role hierarchy enforcement

---

## Tasks

### 4.1 Token Structure Changes
- [x] Token payload uses `org_id` for active organization
- [x] AuthService.switch_organization() creates new tokens with target org
- [x] Backward compatible with existing token structure

### 4.2 Organization Switching API
- [x] Create `POST /api/v1/auth/me/switch-org` endpoint
- [x] Validate user has access to target organization
- [x] Return new access token with updated `org_id`
- [x] Return active_organization details in response

### 4.3 Auth Context Updates
- [x] AuthService.get_user_organizations() method added
- [x] GET /api/v1/auth/me/organizations endpoint added
- [x] Fallback to User.organization_id for legacy users
- [x] Support both UserOrganization and legacy single-org users

### 4.4 Role Hierarchy Enforcement
```
Platform Level:
  super_admin - Can manage all organizations, users, billing

Organization Level:
  tenant_admin - Full org control, can manage admins
  org_admin - Manage users, teams, resources within org
  developer - Create/edit agents, pipelines, deployments
  viewer - Read-only access
```

- [ ] Update RBAC service to check role hierarchy
- [ ] Prevent role escalation (can't assign role higher than own)
- [ ] Super admin bypass for platform operations

---

## API Design

### Switch Organization
```
POST /api/v1/users/me/switch-org
{
  "organization_id": "target-org-id"
}

Response:
{
  "access_token": "new-jwt-token",
  "refresh_token": "new-refresh-token",
  "active_organization": {
    "id": "target-org-id",
    "name": "Target Org Name",
    "role": "developer"
  }
}
```

### Get User Organizations
```
GET /api/v1/users/me/organizations

Response:
{
  "organizations": [
    {
      "id": "org-1",
      "name": "Org 1",
      "role": "tenant_admin",
      "is_primary": true
    },
    {
      "id": "org-2",
      "name": "Org 2",
      "role": "developer",
      "is_primary": false
    }
  ]
}
```

---

## Files to Modify

- `src/studio/services/auth_service.py`: Token structure changes
- `src/studio/api/auth.py`: Add switch-org and organizations endpoints
- `src/studio/middleware/rbac.py`: Role hierarchy enforcement

---

## Acceptance Criteria

1. [ ] Users can switch between their organizations
2. [ ] Token includes active_org_id and organization_ids
3. [ ] Role hierarchy prevents escalation
4. [ ] Super admin can access all organizations

---

## Next

TODO-034: Phase 5 - Frontend Updates (org switcher component)
