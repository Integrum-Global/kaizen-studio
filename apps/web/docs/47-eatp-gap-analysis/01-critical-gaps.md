# Critical Implementation Gaps

**Date**: 2026-01-04
**Status**: Analysis Complete - High Priority Gaps RESOLVED

## Summary

This document details implementation gaps identified through comprehensive analysis of the EATP Ontology and Frontend plans versus actual implementation. Each gap has been verified with file evidence.

**Update**: High priority gaps have been resolved with dialog components.

---

## High Priority Gaps - RESOLVED

### 1. ~~Missing Workspace Member/Work Unit Management Routes~~

**Status**: RESOLVED - Dialogs implemented instead of routes

**Original Issue**: The WorkspaceDetailPage had buttons that navigated to non-existent routes.

**Resolution**: Created dialog components instead of separate pages:
- `AddWorkUnitDialog.tsx` - Multi-select work units, uses `useAddWorkUnit` hook
- `InviteMemberDialog.tsx` - User search with role selection, uses `useAddWorkspaceMember` hook
- Updated `WorkspaceDetailPage.tsx` to open dialogs instead of navigating

**Files Created/Modified**:
- `/src/features/work-units/components/AddWorkUnitDialog.tsx` (NEW)
- `/src/features/work-units/components/InviteMemberDialog.tsx` (NEW)
- `/src/pages/build/WorkspaceDetailPage.tsx` (MODIFIED)

---

### 2. Database Migration Script (Backend)

**Status**: Not found

**Issue**: No migration script to convert existing agents/pipelines data to work_units schema.

**Evidence**: Searched `/scripts/` directory - no migration files found

**Impact**: Production data migration requires manual intervention

**Fix Required**: Create migration script that:
- Maps `agents` table to `work_units` (type: 'atomic')
- Maps `pipelines` table to `work_units` (type: 'composite')
- Creates composite relationships for pipeline agents
- Preserves all IDs for existing references

---

## Medium Priority Gaps (Before Full Feature Parity)

### 3. ~~ExpiryBadge Component~~

**Status**: RESOLVED - Component created

**Original Issue**: Temporary workspaces showed expiration in plain text without visual warning states.

**Resolution**: Created `ExpiryBadge.tsx` component with color-coded status:
- Green (normal): > 7 days remaining
- Amber (warning): 1-7 days remaining
- Red (critical/expired): Expired or < 1 day

**Files Created/Modified**:
- `/src/features/work-units/components/ExpiryBadge.tsx` (NEW)
- `/src/pages/build/WorkspaceDetailPage.tsx` (MODIFIED to use ExpiryBadge)

---

### 4. Global Search / Command Palette

**Status**: Not implemented

**Issue**: No quick search functionality across work units, tasks, and workspaces.

**Evidence**:
- Glob search for `CommandPalette*.tsx` - No files found
- Glob search for `GlobalSearch*.tsx` - No files found

**Expected Behavior**:
- Keyboard shortcut (`/` or `Cmd+K`)
- Search work units by name
- Search tasks by name
- Navigate to workspaces
- Quick actions

**Fix Required**: Create command palette using `cmdk` library or shadcn/ui's command component

---

### 5. Terminology Migration (Partial)

**Status**: In progress - ~50% complete

**Issue**: Old terminology ("Agent", "Pipeline") still appears in code.

**Evidence**:
- 32 occurrences of "Agent" in 19 .tsx files
- 5 occurrences of "Pipeline" in 5 .tsx files

**Files with most occurrences**:
- `src/features/agents/components/__tests__/AgentList.test.tsx` (7 occurrences)
- `src/features/external-agents/__tests__/ExternalAgentsPage.test.tsx` (3 occurrences)
- `src/features/trust/__tests__/AuditTrail.test.tsx` (3 occurrences)

**Fix Required**:
- Review each occurrence
- Replace user-facing strings with Work Unit terminology
- Keep EATP protocol references (legitimate use of "Agent" in EATP context)

---

## Low Priority Gaps (Polish/Enhancement)

### 6. DepartmentTags Component

**Status**: Not implemented

**Issue**: No color-coded department indicators on work units.

**Evidence**: Glob search for `DepartmentTags*.tsx` - No files found

**Impact**: Visual enhancement only, not blocking functionality

---

### 7. Level Transition Notifications

**Status**: Hooks exist, notifications not integrated

**Issue**: Users aren't notified when their trust level changes.

**Evidence**:
- `useLevelTransition` hook exists in `/src/hooks/`
- No toast integration when level changes

**Fix Required**: Connect `useLevelTransition` hook to toast notifications in AppShell

---

### 8. Delegation Timeline

**Status**: Not implemented

**Issue**: No visual timeline combining delegation history with audit events.

**Evidence**: Glob search for `DelegationTimeline*.tsx` - No files found

**Impact**: Advanced visualization, not blocking core functionality

---

## Implementation Priority Matrix (Updated)

| Gap | Effort | Impact | Priority | Status |
|-----|--------|--------|----------|--------|
| ~~Workspace Routes/Modals~~ | ~~Medium~~ | ~~High~~ | ~~P0~~ | DONE |
| DB Migration Script | Medium (2-3 days) | High - Required for production | P0 | Backend task |
| ~~ExpiryBadge~~ | ~~Low~~ | ~~Medium~~ | ~~P1~~ | DONE |
| Global Search | Medium (2-3 days) | Medium - Navigation UX | P1 | Open |
| Terminology Cleanup | Low (1-2 days) | Medium - User confusion | P1 | Open |
| DepartmentTags | Low (0.5 days) | Low - Visual only | P2 | Open |
| Level Transitions | Low (0.5 days) | Low - UX improvement | P2 | Open |
| Delegation Timeline | Medium (2-3 days) | Low - Advanced feature | P2 | Open |

---

## Verification Checklist (Updated)

### What Works (Verified)

- [x] WorkspaceDetailPage renders correctly
- [x] Work units displayed in workspace
- [x] Members displayed in workspace
- [x] Add/Invite buttons visible (for L2+)
- [x] **Add Work Unit opens dialog** (NEW)
- [x] **Invite Member opens dialog** (NEW)
- [x] Hooks for add/remove operations exist
- [x] Trust status badges on work units
- [x] **Expiry badges with color-coded warnings** (NEW)

### What Doesn't Work (Remaining Gaps)

- [ ] No command palette / global search
- [ ] Some old terminology in UI strings (37 occurrences)
- [ ] No DepartmentTags visual component
- [ ] Level transition notifications not integrated

---

## Completed in This Session

1. **AddWorkUnitDialog** - Multi-select dialog for adding work units to workspace
2. **InviteMemberDialog** - User search + role selection dialog for inviting members
3. **ExpiryBadge** - Color-coded expiration warnings (green/amber/red)
4. **WorkspaceDetailPage updates** - Now uses dialogs instead of broken navigation

## Next Steps

1. **Backend (P0)**: Create database migration script (agents→work_units)
2. **Frontend (P1)**: Implement Global Search / Command Palette
3. **Frontend (P1)**: Complete terminology migration (37 occurrences)
4. **Frontend (P2)**: Add polish features (DepartmentTags, DelegationTimeline)
