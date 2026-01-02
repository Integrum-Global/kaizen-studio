# State Management Quick Reference

## Zustand Stores

### Auth Store

```typescript
import { useAuthStore } from "@/store";

// Get state
const { user, isAuthenticated, permissions } = useAuthStore();

// Use selectors (better performance)
const user = useAuthStore((state) => state.user);
const hasPermission = useAuthStore((state) => state.hasPermission);

// Actions
const { login, logout, setPermissions } = useAuthStore();

// Check permissions
if (hasPermission("agents:create")) {
  // User can create agents
}
```

### UI Store

```typescript
import { useUIStore } from "@/store";

// Get state
const { theme, sidebarCollapsed, notifications } = useUIStore();

// Actions
const { setTheme, toggleSidebar, addNotification } = useUIStore();

// Add notification
addNotification({
  title: "Success",
  message: "Operation completed",
  type: "success",
  duration: 5000, // Auto-dismiss after 5s
});
```

## React Query

### Basic Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib";

const { data, isPending, error, refetch } = useQuery({
  queryKey: queryKeys.agents.list(),
  queryFn: agentsApi.getAll,
});
```

### Query with Filters

```typescript
const filters = { status: "active", page: 1 };
const { data } = useQuery({
  queryKey: queryKeys.agents.list(filters),
  queryFn: () => agentsApi.getAll(filters),
});
```

### Mutation

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: (data) => agentsApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
  },
});

// Use mutation
createMutation.mutate(formData);
```

### Invalidate Queries

```typescript
const queryClient = useQueryClient();

// Invalidate all agents
queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });

// Invalidate specific agent
queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(id) });
```

## API Client

### Basic Usage

```typescript
import apiClient from "@/api";

// GET
const response = await apiClient.get("/api/agents");

// POST
const response = await apiClient.post("/api/agents", data);

// PUT
const response = await apiClient.put(`/api/agents/${id}`, data);

// DELETE
await apiClient.delete(`/api/agents/${id}`);
```

### Auth API

```typescript
import { authApi } from "@/api/auth";

// Login
const { user, tokens } = await authApi.login({ email, password });

// Get current user
const user = await authApi.getCurrentUser();

// Get permissions
const permissions = await authApi.getPermissions();

// SSO
const { authorization_url } = await authApi.ssoInitiate("google");
const { user, tokens } = await authApi.ssoCallback("google", code, state);
```

## Common Patterns

### Protected Component

```typescript
function ProtectedFeature() {
  const { isAuthenticated, hasPermission } = useAuthStore();

  if (!isAuthenticated) return <LoginPrompt />;
  if (!hasPermission('feature:view')) return <AccessDenied />;

  return <Feature />;
}
```

### Data Fetching Component

```typescript
function AgentList() {
  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.agents.list(),
    queryFn: agentsApi.getAll,
  });

  if (isPending) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{data.items.map(agent => <AgentCard key={agent.id} agent={agent} />)}</div>;
}
```

### Form with Mutation

```typescript
function CreateAgentForm() {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const mutation = useMutation({
    mutationFn: agentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
      addNotification({
        title: 'Success',
        message: 'Agent created',
        type: 'success',
        duration: 5000,
      });
    },
  });

  return <form onSubmit={(e) => mutation.mutate(formData)} />;
}
```

## Query Keys Reference

```typescript
import { queryKeys } from "@/lib";

// Auth
queryKeys.auth.current();
queryKeys.auth.permissions();

// Agents
queryKeys.agents.all;
queryKeys.agents.list();
queryKeys.agents.list({ status: "active" });
queryKeys.agents.detail("agent-123");

// Pipelines
queryKeys.pipelines.all;
queryKeys.pipelines.list();
queryKeys.pipelines.detail(id);

// Deployments
queryKeys.deployments.all;
queryKeys.deployments.list();
queryKeys.deployments.detail(id);

// Users
queryKeys.users.all;
queryKeys.users.list();
queryKeys.users.detail(id);

// Teams
queryKeys.teams.all;
queryKeys.teams.list();
queryKeys.teams.detail(id);

// Metrics
queryKeys.metrics.dashboard();
queryKeys.metrics.agent(id);
queryKeys.metrics.pipeline(id);
```

## Best Practices

1. **Use Selectors**: Avoid unnecessary re-renders

   ```typescript
   // BAD
   const store = useAuthStore();

   // GOOD
   const user = useAuthStore((state) => state.user);
   ```

2. **Centralized Query Keys**: Always use the query key factory

   ```typescript
   // BAD
   queryKey: ["agents", "list"];

   // GOOD
   queryKey: queryKeys.agents.list();
   ```

3. **Handle Loading States**: Always show loading UI

   ```typescript
   if (isPending) return <Skeleton />;
   ```

4. **Invalidate After Mutations**: Keep data fresh

   ```typescript
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
   };
   ```

5. **Use Notifications**: Provide user feedback
   ```typescript
   addNotification({
     title: "Success",
     message: "Action completed",
     type: "success",
     duration: 5000,
   });
   ```

For more details, see `STATE_MANAGEMENT_GUIDE.md`.
