# Loading Skeleton System - Usage Examples

Complete examples for integrating the loading skeleton system in Kaizen Studio.

## Table of Contents

1. [Basic Component Usage](#basic-component-usage)
2. [With React Query](#with-react-query)
3. [Page-Level Loading](#page-level-loading)
4. [Custom Skeletons](#custom-skeletons)
5. [Responsive Layouts](#responsive-layouts)
6. [Error Handling](#error-handling)
7. [Advanced Patterns](#advanced-patterns)

## Basic Component Usage

### Simple Skeleton

```tsx
import { Skeleton } from "@/features/loading";

function Example() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="rectangular" width="100%" height={200} />
      <Skeleton variant="circular" width={40} height={40} />
      <Skeleton variant="rounded" width={120} height={40} />
    </div>
  );
}
```

### Skeleton Text

```tsx
import { SkeletonText } from "@/features/loading";

function ArticleLoading() {
  return (
    <div className="space-y-6">
      <Skeleton variant="text" width="60%" height={32} />
      <SkeletonText lines={5} spacing="md" />
      <SkeletonText lines={3} spacing="lg" />
    </div>
  );
}
```

### Skeleton Card

```tsx
import { SkeletonCard } from "@/features/loading";

function ProductGridLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
```

### Skeleton Table

```tsx
import { SkeletonTable } from "@/features/loading";

function DataTableLoading() {
  return <SkeletonTable rows={10} columns={5} showHeader={true} />;
}
```

### Skeleton List

```tsx
import { SkeletonList } from "@/features/loading";

function UserListLoading() {
  return <SkeletonList items={8} showAvatar={true} showSecondary={true} />;
}
```

### Skeleton Form

```tsx
import { SkeletonForm } from "@/features/loading";

function FormLoading() {
  return <SkeletonForm fields={6} showLabels={true} showButton={true} />;
}
```

### Page Skeleton

```tsx
import { PageSkeleton } from "@/features/loading";

function DashboardLoading() {
  return <PageSkeleton variant="dashboard" />;
}

function ListPageLoading() {
  return <PageSkeleton variant="list" />;
}

function DetailPageLoading() {
  return <PageSkeleton variant="detail" />;
}

function FormPageLoading() {
  return <PageSkeleton variant="form" />;
}
```

## With React Query

### Single Query

```tsx
import { useQuery } from "@tanstack/react-query";
import { SkeletonCard } from "@/features/loading";

function UserProfile({ userId }: { userId: string }) {
  const { isPending, error, data } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetch(`/api/users/${userId}`).then((res) => res.json()),
  });

  if (isPending) {
    return (
      <SkeletonCard
        showImage={true}
        showTitle={true}
        showDescription={true}
        showActions={true}
      />
    );
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return <UserProfileCard user={data} />;
}
```

### Multiple Queries

```tsx
import { useQuery } from "@tanstack/react-query";
import { SkeletonList, SkeletonTable } from "@/features/loading";

function DashboardData() {
  const {
    isPending: isPendingUsers,
    error: usersError,
    data: users,
  } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const {
    isPending: isPendingOrders,
    error: ordersError,
    data: orders,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
        {isPendingUsers ? (
          <SkeletonList items={5} showAvatar={true} />
        ) : usersError ? (
          <ErrorMessage error={usersError} />
        ) : (
          <UserList users={users} />
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        {isPendingOrders ? (
          <SkeletonTable rows={8} columns={5} />
        ) : ordersError ? (
          <ErrorMessage error={ordersError} />
        ) : (
          <OrderTable orders={orders} />
        )}
      </div>
    </div>
  );
}
```

### Infinite Query

```tsx
import { useInfiniteQuery } from "@tanstack/react-query";
import { SkeletonCard } from "@/features/loading";

function InfiniteProductList() {
  const { data, fetchNextPage, hasNextPage, isPending, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["products"],
      queryFn: ({ pageParam = 1 }) => fetchProducts(pageParam),
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.pages.map((page) =>
          page.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>

      {isFetchingNextPage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {hasNextPage && !isFetchingNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </div>
  );
}
```

## Page-Level Loading

### Dashboard Page

```tsx
import { useQuery } from "@tanstack/react-query";
import { PageSkeleton } from "@/features/loading";
import { DashboardContent } from "./DashboardContent";

export function DashboardPage() {
  const { isPending, error, data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });

  if (isPending) return <PageSkeleton variant="dashboard" />;
  if (error) return <ErrorPage error={error} />;
  return <DashboardContent data={data} />;
}
```

### List Page with Filters

```tsx
import { useQuery } from "@tanstack/react-query";
import { PageSkeleton } from "@/features/loading";

export function AgentsListPage() {
  const [filters, setFilters] = useState({});

  const { isPending, error, data } = useQuery({
    queryKey: ["agents", filters],
    queryFn: () => fetchAgents(filters),
  });

  if (isPending) return <PageSkeleton variant="list" />;
  if (error) return <ErrorPage error={error} />;

  return (
    <div className="space-y-6">
      <AgentsHeader />
      <AgentsFilters filters={filters} setFilters={setFilters} />
      <AgentsTable agents={data} />
    </div>
  );
}
```

### Detail Page

```tsx
import { useQuery } from "@tanstack/react-query";
import { PageSkeleton } from "@/features/loading";

export function PipelineDetailPage({ id }: { id: string }) {
  const { isPending, error, data } = useQuery({
    queryKey: ["pipeline", id],
    queryFn: () => fetchPipeline(id),
  });

  if (isPending) return <PageSkeleton variant="detail" />;
  if (error) return <ErrorPage error={error} />;
  return <PipelineDetail pipeline={data} />;
}
```

### Form Page

```tsx
import { useQuery } from "@tanstack/react-query";
import { PageSkeleton } from "@/features/loading";

export function EditAgentPage({ id }: { id: string }) {
  const { isPending, error, data } = useQuery({
    queryKey: ["agent", id],
    queryFn: () => fetchAgent(id),
  });

  if (isPending) return <PageSkeleton variant="form" />;
  if (error) return <ErrorPage error={error} />;
  return <AgentEditForm agent={data} />;
}
```

## Custom Skeletons

### Profile Header

```tsx
import { Skeleton } from "@/features/loading";

function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-start gap-6">
      <Skeleton variant="circular" width={120} height={120} />
      <div className="flex-1 space-y-4">
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="text" width="60%" />
        <div className="flex gap-2">
          <Skeleton variant="rounded" width={100} height={36} />
          <Skeleton variant="rounded" width={100} height={36} />
          <Skeleton variant="rounded" width={100} height={36} />
        </div>
      </div>
    </div>
  );
}
```

### Stat Card

```tsx
import { Skeleton } from "@/features/loading";

function StatCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton variant="text" width="40%" height={36} />
      <div className="flex items-center gap-2">
        <Skeleton variant="text" width={60} />
        <Skeleton variant="text" width={80} />
      </div>
    </div>
  );
}
```

### Chat Message

```tsx
import { Skeleton } from "@/features/loading";

function ChatMessageSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="30%" />
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="70%" />
        </div>
        <Skeleton variant="text" width="15%" />
      </div>
    </div>
  );
}
```

### Sidebar Navigation

```tsx
import { Skeleton } from "@/features/loading";

function SidebarSkeleton() {
  return (
    <div className="w-64 border-r p-4 space-y-6">
      <Skeleton variant="text" width="60%" height={24} />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width="70%" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Responsive Layouts

### Two-Column Layout

```tsx
import { SkeletonCard, SkeletonList } from "@/features/loading";

function TwoColumnSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content - 2 columns on large screens */}
      <div className="lg:col-span-2 space-y-6">
        <SkeletonCard showImage={false} />
        <SkeletonCard showImage={false} />
      </div>

      {/* Sidebar - 1 column on large screens */}
      <div className="space-y-6">
        <SkeletonCard showImage={false} showActions={false} />
        <SkeletonList items={5} showAvatar={false} />
      </div>
    </div>
  );
}
```

### Grid Layout

```tsx
import { SkeletonCard } from "@/features/loading";

function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
```

### Masonry Layout

```tsx
import { SkeletonCard } from "@/features/loading";

function MasonrySkeleton() {
  const heights = [200, 300, 250, 350, 280, 320];

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
      {heights.map((height, i) => (
        <div key={i} className="mb-6 break-inside-avoid">
          <SkeletonCard showImage={true} />
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

### With Fallback

```tsx
import { useQuery } from "@tanstack/react-query";
import { SkeletonTable } from "@/features/loading";
import { ErrorBoundary } from "react-error-boundary";

function DataTableWithErrorBoundary() {
  const { isPending, error, data } = useQuery({
    queryKey: ["data"],
    queryFn: fetchData,
  });

  if (isPending) return <SkeletonTable rows={10} columns={5} />;
  if (error) throw error; // Caught by ErrorBoundary

  return <DataTable data={data} />;
}

export function DataTablePage() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <DataTableWithErrorBoundary />
    </ErrorBoundary>
  );
}
```

### Retry Logic

```tsx
import { useQuery } from "@tanstack/react-query";
import { SkeletonCard } from "@/features/loading";

function ProductCard({ id }: { id: string }) {
  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    retry: 3,
    retryDelay: 1000,
  });

  if (isPending) return <SkeletonCard />;

  if (error) {
    return (
      <div className="border rounded-lg p-6 text-center">
        <p className="text-error mb-4">Failed to load product</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return <Product data={data} />;
}
```

## Advanced Patterns

### Stale-While-Revalidate

```tsx
import { useQuery } from "@tanstack/react-query";
import { SkeletonList } from "@/features/loading";

function UserList() {
  const { isPending, data, isFetching } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  return (
    <div className="space-y-4">
      {isFetching && !isPending && (
        <div className="text-sm text-muted-foreground">Updating...</div>
      )}

      {isPending ? (
        <SkeletonList items={8} showAvatar={true} />
      ) : (
        <UserListContent users={data} />
      )}
    </div>
  );
}
```

### Optimistic Updates

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SkeletonList } from "@/features/loading";

function TodoList() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });

  const addTodoMutation = useMutation({
    mutationFn: addTodo,
    onMutate: async (newTodo) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(["todos"]);

      // Optimistically update
      queryClient.setQueryData(["todos"], (old) => [...old, newTodo]);

      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      queryClient.setQueryData(["todos"], context.previousTodos);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  if (isPending) return <SkeletonList items={5} showAvatar={false} />;

  return <TodoListContent todos={data} onAdd={addTodoMutation.mutate} />;
}
```

### Suspense Mode

```tsx
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageSkeleton } from "@/features/loading";

function DataComponent() {
  const { data } = useQuery({
    queryKey: ["data"],
    queryFn: fetchData,
    suspense: true, // Enable suspense mode
  });

  return <DataView data={data} />;
}

export function Page() {
  return (
    <Suspense fallback={<PageSkeleton variant="dashboard" />}>
      <DataComponent />
    </Suspense>
  );
}
```

### Parallel Queries

```tsx
import { useQueries } from "@tanstack/react-query";
import { SkeletonCard } from "@/features/loading";

function MultipleProducts({ ids }: { ids: string[] }) {
  const productQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["product", id],
      queryFn: () => fetchProduct(id),
    })),
  });

  const isLoading = productQueries.some((q) => q.isPending);
  const hasError = productQueries.some((q) => q.error);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ids.map((id) => (
          <SkeletonCard key={id} />
        ))}
      </div>
    );
  }

  if (hasError) {
    return <ErrorMessage />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {productQueries.map((query) => (
        <ProductCard key={query.data.id} product={query.data} />
      ))}
    </div>
  );
}
```

## Tips and Best Practices

1. **Match Content Layout:** Use skeletons that match your actual content structure
2. **Consistent Timing:** Use the same loading patterns across similar components
3. **Avoid Flash:** For very fast loads (<200ms), consider skipping the skeleton
4. **Granular Loading:** Load sections independently when possible
5. **Animation Control:** Disable animation for better performance or user preferences
6. **Accessibility:** All skeletons include proper ARIA attributes
7. **Responsive Design:** Test skeletons at all breakpoints
8. **Error States:** Always handle both loading and error states
9. **Stale Data:** Show stale data with a subtle indicator while revalidating
10. **Optimistic Updates:** Use skeletons sparingly with optimistic updates
