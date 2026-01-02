# Zustand Stores

Zustand handles client-side state that doesn't come from the server.

## Auth Store

Manages authentication state including user, tokens, and permissions.

```tsx
import { useAuthStore } from '@/store/auth';

// Access state
const user = useAuthStore((state) => state.user);
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

// Access actions
const { login, logout, hasPermission } = useAuthStore();

// Check permissions
if (hasPermission('agents:create')) {
  // User can create agents
}
```

### State Shape

```typescript
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### Actions

| Action | Description |
|--------|-------------|
| `login(user, tokens)` | Set user and tokens after successful login |
| `logout()` | Clear all auth state |
| `setUser(user)` | Update user data |
| `setTokens(tokens)` | Update tokens |
| `setPermissions(permissions)` | Set user permissions |
| `hasPermission(permission)` | Check if user has specific permission |

### Persistence

Auth store persists to localStorage:

```typescript
// Persisted keys
- user
- tokens
- permissions
```

## UI Store

Manages UI preferences and transient state.

```tsx
import { useUIStore } from '@/store/ui';

// Sidebar
const collapsed = useUIStore((state) => state.sidebarCollapsed);
const toggleSidebar = useUIStore((state) => state.toggleSidebar);

// Theme
const theme = useUIStore((state) => state.theme);
const setTheme = useUIStore((state) => state.setTheme);

// Notifications
const { addNotification, removeNotification } = useUIStore();
```

### State Shape

```typescript
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
}
```

### Actions

| Action | Description |
|--------|-------------|
| `toggleSidebar()` | Toggle sidebar collapsed state |
| `setSidebarCollapsed(collapsed)` | Set sidebar state directly |
| `setTheme(theme)` | Set theme and update DOM |
| `addNotification(notification)` | Add notification with auto-dismiss |
| `removeNotification(id)` | Remove notification by ID |
| `clearNotifications()` | Clear all notifications |

### Theme Handling

Theme changes automatically update the document:

```typescript
// When setTheme is called:
// 1. Update store state
// 2. Add/remove 'dark' class on <html>
// 3. Persist to localStorage

setTheme('dark');
// Results in: <html class="dark">
```

### Persistence

UI store persists sidebar and theme (not notifications):

```typescript
// Persisted keys
- sidebarCollapsed
- theme
```

## Best Practices

### Selecting State

Always use selectors for performance:

```tsx
// Good - only re-renders when user changes
const user = useAuthStore((state) => state.user);

// Bad - re-renders on any store change
const { user } = useAuthStore();
```

### Multiple Values

Use multiple selectors or shallow compare:

```tsx
import { shallow } from 'zustand/shallow';

// Multiple selectors (preferred)
const user = useAuthStore((state) => state.user);
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

// Or shallow compare
const { user, isAuthenticated } = useAuthStore(
  (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
  shallow
);
```

### Testing

Reset stores between tests:

```tsx
import { resetAuthStore, resetUIStore } from '@/test/utils';

beforeEach(() => {
  resetAuthStore();
  resetUIStore();
});
```
