# Multi-Tenant SaaS Architecture Plan

**Document**: plans/11-multi-tenant-architecture.md
**Created**: 2025-12-26
**Status**: ACTIVE
**Priority**: HIGH

---

## Executive Summary

This plan addresses five critical features for enterprise multi-tenant SaaS:

1. **UI Bug Fixes**: Wire up role editing and team member management
2. **SSO Domain Grouping**: Users from same domain auto-join same organization
3. **Modern Organization UX**: Clear org creation and invitation flows
4. **Multi-Tenant User Support**: Users can belong to multiple organizations
5. **Role Hierarchy**: Super-admin (platform) and tenant-admin (org) separation

---

## Phase 1: Immediate UI Bug Fixes (Day 1)

### 1.1 Role Editing

**Problem**: `RolesPage` mounts `RoleEditor` but doesn't wire the edit flow.

**Files to modify**:
- `apps/web/src/pages/admin/RolesPage.tsx`

**Changes**:
```typescript
// Add state for editing role
const [editingRole, setEditingRole] = useState<Role | null>(null);

// Wire up RoleList with edit handler
<RoleList onEditRole={(role) => setEditingRole(role)} />

// Pass role to editor for edit mode
<RoleEditor
  role={editingRole}
  open={isCreateDialogOpen || !!editingRole}
  onOpenChange={(open) => {
    if (!open) {
      setIsCreateDialogOpen(false);
      setEditingRole(null);
    }
  }}
/>
```

### 1.2 Team Detail Page

**Problem**: `TeamCard` navigates to `/teams/:id` but no route/page exists.

**Files to create**:
- `apps/web/src/pages/admin/TeamDetailPage.tsx`

**Files to modify**:
- `apps/web/src/App.tsx` (add route)

**Component Structure**:
```typescript
export function TeamDetailPage() {
  const { teamId } = useParams();
  const { data: team } = useTeam(teamId);

  return (
    <div>
      <TeamHeader team={team} />
      <TeamMembersEditor teamId={teamId} members={team.members} />
    </div>
  );
}
```

---

## Phase 2: Database Model Foundation (Days 2-3)

### 2.1 New Models

**UserOrganization** (Junction table for multi-org):
```python
@db.model
class UserOrganization:
    id: str
    user_id: str
    organization_id: str
    role: str  # tenant_admin, org_admin, developer, viewer
    is_primary: bool
    joined_via: str  # invitation, sso, domain_match, created
    joined_at: str
    created_at: str
    updated_at: str
```

**OrganizationDomain** (SSO domain grouping):
```python
@db.model
class OrganizationDomain:
    id: str
    organization_id: str
    domain: str  # e.g., "company.com"
    is_verified: bool
    verification_method: str  # dns_txt, email, manual
    auto_join_enabled: bool
    default_role: str
    created_at: str
    verified_at: str | None = None
```

### 2.2 Model Modifications

**User Model** (add fields, keep backward compatibility):
```python
# ADD
is_super_admin: bool = False
primary_organization_id: str | None = None

# KEEP for backward compatibility during migration
organization_id: str  # Will be deprecated
role: str  # Will be deprecated
```

**Organization Model** (add fields):
```python
# ADD
sso_domain: str | None = None  # Primary SSO domain
allow_domain_join: bool = False
settings: str | None = None  # JSON for org settings
```

---

## Phase 3: SSO Domain Grouping (Days 4-5)

### 3.1 Domain-Based Organization Discovery

**Logic for SSO callback** (`sso.py:_provision_sso_user`):

```python
async def _provision_sso_user(sso_user: dict, auth_service: AuthService) -> dict:
    email_domain = sso_user["email"].split("@")[1]

    # 1. Check if user identity already exists
    if existing_identity := await find_user_identity(sso_user):
        return await get_user_by_id(existing_identity.user_id)

    # 2. Check if organization exists for this domain
    if org := await find_org_by_verified_domain(email_domain):
        # Join existing org with default role
        return await create_user_in_org(sso_user, org, org.default_role)

    # 3. First user from domain - create new organization
    org = await create_organization(f"{email_domain} Organization", sso_domain=email_domain)

    # First user is tenant_admin
    return await create_user_in_org(sso_user, org, role="tenant_admin")
```

### 3.2 Domain Verification Flow

Admin can verify domain ownership via:
1. DNS TXT record verification
2. Email verification (send to admin@domain.com)
3. Manual verification (super-admin approval)

---

## Phase 4: Multi-Organization Support (Days 6-8)

### 4.1 Token Structure Changes

Current token:
```json
{
  "sub": "user-id",
  "org_id": "single-org-id",
  "role": "developer"
}
```

New token:
```json
{
  "sub": "user-id",
  "active_org_id": "current-org-id",
  "organization_ids": ["org-1", "org-2"],
  "is_super_admin": false
}
```

### 4.2 Organization Switching

New API endpoint:
```
POST /api/v1/users/me/switch-org
{
  "organization_id": "target-org-id"
}
```

Returns new access token with updated `active_org_id`.

### 4.3 Role Hierarchy

```
Platform Level:
  super_admin - Can manage all organizations, users, billing

Organization Level:
  tenant_admin - Full org control, can manage admins
  org_admin - Manage users, teams, resources within org
  developer - Create/edit agents, pipelines, deployments
  viewer - Read-only access
```

---

## Phase 5: Frontend Updates (Days 9-10)

### 5.1 Organization Switcher

Add to app header:
- Dropdown showing user's organizations
- Visual indicator for active org
- Quick switch without page reload

### 5.2 Updated Auth Context

```typescript
interface AuthState {
  user: User;
  activeOrganization: Organization;
  organizations: UserOrganization[];
  isSuperAdmin: boolean;
  switchOrganization: (orgId: string) => Promise<void>;
}
```

### 5.3 Invitation Flow

Modern UX:
1. Org admin clicks "Invite User"
2. Enter email, select role
3. User receives branded email with magic link
4. Click link → create account or link existing → join org

---

## Migration Strategy

### Step 1: Create new tables (non-breaking)
- UserOrganization
- OrganizationDomain

### Step 2: Migrate existing data
```sql
INSERT INTO user_organization (id, user_id, organization_id, role, is_primary)
SELECT gen_random_uuid(), id, organization_id, role, true FROM users;
```

### Step 3: Dual-write period
- New code writes to both old and new columns
- Read from new tables
- Feature flag for multi-org logic

### Step 4: Remove deprecated columns
- After verification, remove User.organization_id and User.role

---

## Security Considerations

1. **Cross-org isolation**: Every API call validates user has access to active_org_id
2. **Role escalation prevention**: Cannot assign role higher than own
3. **Domain spoofing**: Require verification before enabling auto-join
4. **Token invalidation**: Force re-auth on role/org changes

---

## Test Strategy

### Tier 1 (Unit Tests)
- UserOrganization CRUD
- Role hierarchy validation
- Domain verification logic

### Tier 2 (Integration Tests)
- SSO domain-based routing
- Multi-org authentication
- Role enforcement

### Tier 3 (E2E Tests)
- Complete org creation flow
- Invitation acceptance
- Org switching
- Role editing UI
- Team member management UI

---

## Related TODOs

- TODO-030: Phase 1 - UI Bug Fixes (Roles, Teams)
- TODO-031: Phase 2 - Database Model Foundation
- TODO-032: Phase 3 - SSO Domain Grouping
- TODO-033: Phase 4 - Multi-Organization Support
- TODO-034: Phase 5 - Frontend Updates
