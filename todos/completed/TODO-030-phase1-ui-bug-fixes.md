# TODO-030: Phase 1 - UI Bug Fixes (Roles, Teams)

**Status**: COMPLETED
**Completed**: 2025-12-26
**Priority**: HIGH

---

## Objective

Fix two UI bugs in the admin section:
1. Role editing: Wire up the edit flow in RolesPage
2. Team member management: Create TeamDetailPage with member editor

---

## Completed Tasks

### 1.1 Role Editing
- [x] Added `editingRole` state to RolesPage
- [x] Wired up `onEditRole` handler to RoleList component
- [x] Passed editing role to RoleEditor for edit mode
- [x] Dialog properly clears state on close

### 1.2 Team Detail Page
- [x] Created `TeamDetailPage.tsx` component
- [x] Integrated `TeamMembersEditor` for member management
- [x] Added team info card with edit capabilities
- [x] Added back navigation to teams list
- [x] Added `/teams/:teamId` route to App.tsx
- [x] Exported TeamDetailPage from pages/admin index

---

## Files Modified

**apps/frontend/src/pages/admin/RolesPage.tsx**
- Lines 5, 8-9, 35, 38-42: Added editing role state and wired up handlers

**apps/frontend/src/pages/admin/TeamDetailPage.tsx** (NEW)
- Complete team detail page with member management

**apps/frontend/src/pages/admin/index.ts**
- Line 2: Added TeamDetailPage export

**apps/frontend/src/App.tsx**
- Lines 47-49: Added TeamDetailPage lazy loading
- Line 191: Added `/teams/:teamId` route

---

## Test Evidence

- TypeScript type check: PASSED
- Vite build: PASSED (4015 modules transformed)
- Governance E2E tests: 46/46 PASSED

---

## User Flow

### Role Editing
1. Navigate to `/roles`
2. Click edit button on any role card
3. RoleEditor opens in edit mode with existing data
4. Make changes and save

### Team Member Management
1. Navigate to `/teams`
2. Click on a team card
3. Redirected to `/teams/:teamId`
4. View team details and members
5. Add/remove/update member roles using TeamMembersEditor
