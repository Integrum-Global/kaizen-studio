# React Query

React Query (TanStack Query) manages server state - data fetched from APIs.

## Configuration

Query client is configured in `src/lib/queryClient.ts`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

## Query Keys

All query keys are defined in `src/lib/queryKeys.ts`:

```typescript
import { queryKeys } from '@/lib/queryKeys';

// Examples
queryKeys.auth.current           // ['auth', 'current']
queryKeys.agents.all             // ['agents']
queryKeys.agents.list({ status: 'active' }) // ['agents', 'list', { status: 'active' }]
queryKeys.agents.detail('123')   // ['agents', 'detail', '123']
```

### Available Keys

| Key | Description |
|-----|-------------|
| `auth.current` | Current user |
| `auth.permissions` | User permissions |
| `agents.all` | Invalidation key for all agents |
| `agents.list(filters)` | Filtered agents list |
| `agents.detail(id)` | Single agent |
| `pipelines.*` | Pipeline queries |
| `deployments.*` | Deployment queries |
| `users.*` | User management queries |
| `teams.*` | Team queries |
| `metrics.*` | Metrics and analytics |

## Fetching Data

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { agentsApi } from '@/api/agents';

function AgentsList() {
  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.agents.list({ status: 'active' }),
    queryFn: () => agentsApi.getAll({ status: 'active' }),
  });

  if (isPending) return <LoadingScreen />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ul>
      {data.map(agent => (
        <li key={agent.id}>{agent.name}</li>
      ))}
    </ul>
  );
}
```

## Mutations

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { agentsApi } from '@/api/agents';
import { useToast } from '@/hooks/use-toast';

function CreateAgentForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: agentsApi.create,
    onSuccess: () => {
      // Invalidate agents list to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.all
      });
      toast({ title: 'Agent created' });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create agent',
        description: error.message,
      });
    },
  });

  const handleSubmit = (data: CreateAgentInput) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <Button disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create Agent'}
      </Button>
    </form>
  );
}
```

## Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: agentsApi.update,
  onMutate: async (newAgent) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({
      queryKey: queryKeys.agents.detail(newAgent.id)
    });

    // Snapshot previous value
    const previousAgent = queryClient.getQueryData(
      queryKeys.agents.detail(newAgent.id)
    );

    // Optimistically update
    queryClient.setQueryData(
      queryKeys.agents.detail(newAgent.id),
      newAgent
    );

    return { previousAgent };
  },
  onError: (err, newAgent, context) => {
    // Rollback on error
    queryClient.setQueryData(
      queryKeys.agents.detail(newAgent.id),
      context?.previousAgent
    );
  },
  onSettled: () => {
    // Always refetch after mutation
    queryClient.invalidateQueries({
      queryKey: queryKeys.agents.all
    });
  },
});
```

## Prefetching

```typescript
// Prefetch on hover
const queryClient = useQueryClient();

<Link
  to={`/agents/${agent.id}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.agents.detail(agent.id),
      queryFn: () => agentsApi.getById(agent.id),
    });
  }}
>
  {agent.name}
</Link>
```

## Infinite Queries

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: queryKeys.agents.list({}),
  queryFn: ({ pageParam = 1 }) =>
    agentsApi.getAll({ page: pageParam, limit: 20 }),
  getNextPageParam: (lastPage) =>
    lastPage.hasMore ? lastPage.page + 1 : undefined,
});

// Flatten pages
const agents = data?.pages.flatMap(page => page.items) ?? [];
```
