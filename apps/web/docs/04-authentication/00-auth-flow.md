# Authentication Flow

## Overview

Kaizen Studio uses JWT-based authentication with support for SSO providers.

```
┌─────────────────────────────────────────────────────┐
│                 Authentication Flow                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  User → Login Page → POST /auth/login → JWT Tokens  │
│                                                      │
│  ┌─────────────┐                                    │
│  │ Auth Store  │ ← Store tokens, user, permissions  │
│  └─────────────┘                                    │
│         │                                            │
│         ▼                                            │
│  ┌─────────────┐                                    │
│  │ API Client  │ ← Attach Bearer token              │
│  └─────────────┘                                    │
│         │                                            │
│         ▼                                            │
│  401 Response? → Try Refresh → Success → Retry      │
│                       │                              │
│                       └─→ Failed → Redirect Login   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Login

### Email/Password

```tsx
import { useLogin } from '@/features/auth/hooks/useAuth';

function LoginPage() {
  const login = useLogin();

  const onSubmit = async (data: { email: string; password: string }) => {
    await login.mutateAsync(data);
    // Automatically redirects to dashboard
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input name="email" type="email" />
      <Input name="password" type="password" />
      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

### SSO

```tsx
import { SSOButtons } from '@/features/auth/components/SSOButtons';

// Renders buttons for Microsoft, Google, Okta
<SSOButtons />

// SSO flow:
// 1. User clicks provider button
// 2. Redirect to provider's auth page
// 3. Provider redirects back to /auth/callback/:provider
// 4. SSOCallbackPage exchanges code for tokens
// 5. User is authenticated
```

## Protected Routes

```tsx
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// Basic protection
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// With permission requirement
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredPermission="admin:access">
      <AdminPanel />
    </ProtectedRoute>
  }
/>
```

## Permission Gates

```tsx
import { PermissionGate } from '@/features/auth/components/PermissionGate';

// Hide content without permission
<PermissionGate permission="agents:create">
  <Button>Create Agent</Button>
</PermissionGate>

// Show alternative content
<PermissionGate
  permission="agents:delete"
  fallback={<Button disabled>Delete (No Permission)</Button>}
>
  <Button variant="destructive">Delete</Button>
</PermissionGate>
```

## Auth Hooks

```tsx
import {
  useLogin,
  useLogout,
  useCurrentUser,
  useHasPermission,
} from '@/features/auth/hooks/useAuth';

// Login mutation
const login = useLogin();
await login.mutateAsync({ email, password });

// Logout mutation
const logout = useLogout();
logout.mutate();

// Current user query
const { data: user, isPending } = useCurrentUser();

// Permission check
const canCreateAgents = useHasPermission('agents:create');
```

## Token Refresh

The API client automatically handles token refresh:

```typescript
// In src/api/index.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry original request
        return api(error.config);
      }
      // Refresh failed, logout
      logout();
    }
    return Promise.reject(error);
  }
);
```

## Logout

```tsx
import { useLogout } from '@/features/auth/hooks/useAuth';

function UserMenu() {
  const logout = useLogout();

  return (
    <Button onClick={() => logout.mutate()}>
      Logout
    </Button>
  );
}

// Logout performs:
// 1. POST /auth/logout (invalidate server session)
// 2. Clear auth store
// 3. Clear React Query cache
// 4. Redirect to /login
```
