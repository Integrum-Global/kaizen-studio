# TODO-034: Phase 5 - Frontend Updates

**Status**: COMPLETED
**Priority**: HIGH
**Created**: 2025-12-26
**Completed**: 2025-12-26
**Dependencies**: TODO-033 (completed)

---

## Objective

Update frontend to support multi-organization:
- Organization switcher in header
- Updated auth context
- Invitation flow improvements

---

## Tasks

### 5.1 Organization Switcher Component
- [x] Create `OrganizationSwitcher` component
- [x] Add to app header (next to breadcrumb)
- [x] Show current organization name
- [x] Dropdown with user's organizations
- [x] Visual indicator for active org (checkmark)
- [x] Quick switch without page reload

### 5.2 Auth Store Updates
- [x] Add `organizations` array to auth store
- [x] Add `activeOrganization` to auth store
- [x] Add `switchOrganization` action
- [x] Add `setOrganizations` action
- [x] Persist active org in localStorage

### 5.3 API Integration
- [x] Add `authApi.getOrganizations()` method
- [x] Add `authApi.switchOrganization()` method
- [x] Use React Query for org fetching and mutation
- [x] Handle org switch errors gracefully with toast

### 5.4 Invitation Flow Improvements
Modern UX:
1. Org admin clicks "Invite User"
2. Enter email, select role
3. User receives branded email with magic link
4. Click link → create account or link existing → join org

- [ ] Update InvitationDialog with role selector
- [ ] Create invitation acceptance page
- [ ] Handle existing user invitations
- [ ] Email template updates (backend)

### 5.5 Super Admin Features
- [ ] Add "All Organizations" view for super admins
- [ ] Org management page (create, suspend, delete)
- [ ] User search across all orgs
- [ ] Platform-level settings

---

## Components to Create

1. `OrganizationSwitcher.tsx` - Header dropdown
2. `OrganizationBadge.tsx` - Visual indicator
3. `InvitationAcceptPage.tsx` - Invitation acceptance
4. `SuperAdminDashboard.tsx` - Platform admin view

---

## Files to Modify

- `src/App.tsx`: Add invitation routes
- `src/components/layout/AppHeader.tsx`: Add org switcher
- `src/contexts/AuthContext.tsx`: Multi-org support
- `src/features/teams/components/InvitationDialog.tsx`: Role selection

---

## Acceptance Criteria

1. [ ] User can switch between organizations from header
2. [ ] Active organization persists across page reloads
3. [ ] Invitation flow works end-to-end
4. [ ] Super admin can view all organizations

---

## E2E Tests

- [ ] Test org switching
- [ ] Test invitation acceptance
- [ ] Test role-based access after switch
- [ ] Test super admin features

---

## Related

- TODO-030: Phase 1 - UI Bug Fixes (COMPLETED)
- TODO-031: Phase 2 - Database Models (COMPLETED)
- TODO-032: Phase 3 - SSO Domain Grouping (COMPLETED)
- TODO-033: Phase 4 - Multi-Org Support (IN_PROGRESS)
