# Permissions

## Permission Format

Permissions follow the format: `resource:action`

| Resource | Actions |
|----------|---------|
| agents | read, create, update, delete |
| pipelines | read, create, update, delete, execute |
| deployments | read, create, update, delete |
| teams | read, create, update, delete |
| users | read, create, update, delete |
| roles | read, create, update, delete |
| policies | read, create, update, delete |
| metrics | read |
| audit | read |
| admin | access, settings |

## Checking Permissions

### In Components

```tsx
import { useHasPermission } from '@/features/auth/hooks/useAuth';

function AgentActions({ agent }) {
  const canEdit = useHasPermission('agents:update');
  const canDelete = useHasPermission('agents:delete');

  return (
    <div>
      {canEdit && <Button>Edit</Button>}
      {canDelete && <Button variant="destructive">Delete</Button>}
    </div>
  );
}
```

### From Store Directly

```tsx
import { useAuthStore } from '@/store/auth';

function MyComponent() {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (hasPermission('admin:access')) {
    // Show admin features
  }
}
```

## Permission Gate Component

```tsx
import { PermissionGate } from '@/features/auth/components/PermissionGate';

// Basic usage - hides content if no permission
<PermissionGate permission="agents:create">
  <Button>Create Agent</Button>
</PermissionGate>

// With fallback
<PermissionGate
  permission="agents:delete"
  fallback={<span className="text-muted">No permission</span>}
>
  <Button variant="destructive">Delete</Button>
</PermissionGate>

// Multiple permissions (any)
<PermissionGate permission="admin:access">
  <AdminPanel />
</PermissionGate>
```

## Route-Level Protection

```tsx
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// Require authentication only
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// Require specific permission
<Route
  path="/admin/users"
  element={
    <ProtectedRoute requiredPermission="users:read">
      <UserManagement />
    </ProtectedRoute>
  }
/>
```

### Unauthorized Redirect

When a user lacks permission, they see an unauthorized message:

```tsx
// Default unauthorized view
<div className="text-center">
  <ShieldAlert className="h-12 w-12" />
  <h2>Access Denied</h2>
  <p>You don't have permission to view this page.</p>
  <Button onClick={() => navigate('/dashboard')}>
    Return to Dashboard
  </Button>
</div>
```

## Permission Hook

```tsx
import { usePermissionGate } from '@/features/auth/hooks/useAuth';

function EditAgentPage({ agentId }) {
  // Redirects to /dashboard if no permission
  usePermissionGate('agents:update', {
    redirectTo: '/dashboard'
  });

  return <AgentForm agentId={agentId} />;
}
```

## Testing Permissions

```tsx
import { mockAuthStore, resetAuthStore } from '@/test/utils';

describe('PermissionGate', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  it('shows content when user has permission', () => {
    mockAuthStore(createMockUser(), createMockTokens());
    useAuthStore.setState({
      permissions: ['agents:create']
    });

    render(
      <PermissionGate permission="agents:create">
        <Button>Create</Button>
      </PermissionGate>
    );

    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('hides content when user lacks permission', () => {
    mockAuthStore(createMockUser(), createMockTokens());
    useAuthStore.setState({ permissions: [] });

    render(
      <PermissionGate permission="agents:create">
        <Button>Create</Button>
      </PermissionGate>
    );

    expect(screen.queryByText('Create')).not.toBeInTheDocument();
  });
});
```
