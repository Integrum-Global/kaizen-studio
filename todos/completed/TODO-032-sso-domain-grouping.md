# TODO-032: Phase 3 - SSO Domain Grouping

**Status**: COMPLETED
**Priority**: HIGH
**Completed**: 2025-12-26
**Dependencies**: TODO-031 (completed)

---

## Objective

Implement domain-based organization grouping for SSO users:
- First user from domain creates new organization (becomes tenant_admin)
- Subsequent users from same domain auto-join existing organization
- Uses OrganizationDomain table for verified domain auto-join

---

## Tasks

### 3.1 Domain-Based Organization Discovery
- [x] Add `_find_org_by_domain()` helper function
- [x] Check OrganizationDomain table for verified domains with auto_join_enabled
- [x] Fallback to Organization.sso_domain field

### 3.2 Update SSO Provisioning Logic
- [x] Modify `_provision_sso_user()` in `sso.py`
- [x] Add domain lookup before creating new organization
- [x] Join existing org with default role if domain matches
- [x] Create new org only for first user from domain

### 3.3 Organization Domain Records
- [x] Add `_create_organization_domain()` helper function
- [x] Auto-verify domains from SSO (verification_method: "sso")
- [x] Set auto_join_enabled=True by default

### 3.4 UserOrganization Junction Records
- [x] Add `_create_user_organization()` helper function
- [x] Track joined_via: "sso" for first user, "domain_match" for subsequent
- [x] Set is_primary=True for new users

### 3.5 Role Assignment
- [x] First user from domain gets "tenant_admin" role
- [x] Subsequent users get OrganizationDomain.default_role (defaults to "developer")
- [x] Set primary_organization_id on User record

---

## Implementation Details

**Modified Files**:
- `src/studio/api/sso.py`:
  - `_provision_sso_user()` (lines 416-658): Added domain-based grouping logic
  - `_find_org_by_domain()` (lines 661-723): New helper for domain lookup
  - `_create_organization_domain()` (lines 726-751): New helper for domain records
  - `_create_user_organization()` (lines 754-785): New helper for junction records

**SSO Flow Summary**:
```
1. Check if user identity exists → return existing user
2. Check if email exists → link SSO identity
3. Check if org exists for domain → join existing org (developer role)
4. First user from domain → create new org (tenant_admin role)
```

---

## Acceptance Criteria

1. [x] First SSO user from domain.com creates new organization
2. [x] Second SSO user from domain.com joins same organization
3. [x] First user gets tenant_admin role
4. [x] Subsequent users get default_role from OrganizationDomain
5. [x] OrganizationDomain record created for auto-join
6. [x] UserOrganization junction record created for multi-org support

---

## Next

TODO-033: Phase 4 - Multi-Organization Support (org switching API)
