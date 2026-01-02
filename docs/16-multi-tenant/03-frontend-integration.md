# Frontend Integration

## Organization Switcher Component

Users with multiple organizations see an organization switcher in the app header.

### Location
`src/components/layout/OrganizationSwitcher.tsx`

### Features
- Shows current organization name with building icon
- Dropdown displays all user's organizations with roles
- Primary organization marked with "Primary" badge
- Active organization has checkmark indicator
- Switching invalidates all queries and refreshes data
- Hidden when user only has one organization

### Usage
The component is automatically included in the Header:

```tsx
// src/components/layout/Header.tsx
import { OrganizationSwitcher } from "./OrganizationSwitcher";

<div className="flex items-center gap-4">
  <Breadcrumb />
  <OrganizationSwitcher />
</div>
```

## Auth Store

### Location
`src/store/auth.ts`

### Multi-Organization State

```typescript
interface AuthState {
  // ... existing state
  organizations: OrganizationMembership[];
  activeOrganization: OrganizationMembership | null;

  // Actions
  setOrganizations: (orgs: OrganizationMembership[]) => void;
  setActiveOrganization: (org: OrganizationMembership) => void;
  switchOrganization: (org: OrganizationMembership, tokens: AuthTokens) => void;
}
```

### Behavior
- `setOrganizations`: Sets organizations array and auto-selects primary as active
- `switchOrganization`: Updates tokens and active organization
- State persisted to localStorage via Zustand persist middleware

## API Methods

### Location
`src/api/auth.ts`

### Get Organizations

```typescript
const response = await authApi.getOrganizations();
// Returns: { organizations: OrganizationMembership[] }
```

### Switch Organization

```typescript
const result = await authApi.switchOrganization({
  organization_id: "org-123"
});
// Returns: { access_token, refresh_token, active_organization, ... }
```

## Types

### Location
`src/types/auth.ts`

```typescript
export interface OrganizationMembership {
  id: string;
  name: string;
  slug: string;
  role: string;
  is_primary: boolean;
  joined_at: string;
  joined_via: string;
}

export interface SwitchOrganizationRequest {
  organization_id: string;
}

export interface SwitchOrganizationResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  active_organization: OrganizationMembership;
}
```

## Query Invalidation

When switching organizations, all React Query queries are invalidated to refresh data with the new organization context:

```typescript
// In OrganizationSwitcher.tsx
onSuccess: (data) => {
  switchOrganization(data.active_organization, tokens);
  queryClient.invalidateQueries(); // Refetch all data
}
```

## Related Files

- `src/components/layout/OrganizationSwitcher.tsx` - Switcher component
- `src/components/layout/Header.tsx` - Header integration
- `src/store/auth.ts` - Auth store with multi-org state
- `src/api/auth.ts` - API methods
- `src/types/auth.ts` - TypeScript types
