# Error Handling - Usage Examples

## 1. Basic App-Level Error Boundary

Wrap your entire app to catch all unhandled errors:

```tsx
// src/App.tsx
import { ErrorBoundary } from "@/features/errors";

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Optional: Send to error tracking service
        console.error("App error:", error, errorInfo);
      }}
    >
      <Router>
        <Routes>{/* Your routes */}</Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

## 2. Route-Level Error Pages

Use error pages for specific routes:

```tsx
// src/App.tsx
import { NotFoundPage, ForbiddenPage } from "@/features/errors";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/agents" element={<AgentsPage />} />

      {/* Error routes */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
```

## 3. Component-Level Error Handling with useErrorHandler

Handle errors in async operations:

```tsx
// src/features/agents/components/AgentList.tsx
import { useErrorHandler } from "@/features/errors";
import { ErrorAlert } from "@/features/errors";
import { useQuery } from "@tanstack/react-query";

function AgentList() {
  const { error, handleError, clearError } = useErrorHandler();

  const { data, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    onError: (err) => {
      handleError(err as Error, {
        component: "AgentList",
        action: "fetchAgents",
        metadata: { timestamp: Date.now() },
      });
    },
  });

  if (error) {
    return (
      <ErrorAlert
        error={error}
        onDismiss={clearError}
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
```

## 4. Form Submission Error Handling

Handle errors in form submissions:

```tsx
// src/features/agents/components/AgentForm.tsx
import { useState } from "react";
import { useErrorHandler } from "@/features/errors";
import { ErrorAlert } from "@/features/errors";

function AgentForm() {
  const [name, setName] = useState("");
  const { error, handleError, clearError } = useErrorHandler();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError(); // Clear previous errors

    try {
      await createAgent({ name });
      // Success handling
    } catch (err) {
      handleError(err as Error, {
        component: "AgentForm",
        action: "createAgent",
        userId: currentUser.id,
        metadata: { agentName: name },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <ErrorAlert
          error={error}
          onDismiss={clearError}
          onRetry={handleSubmit}
        />
      )}

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Agent name"
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Agent"}
      </button>
    </form>
  );
}
```

## 5. Programmatic Error Throwing with useErrorBoundary

Throw errors to be caught by error boundary:

```tsx
// src/features/agents/components/AgentDetails.tsx
import { useErrorBoundary } from "@/features/errors";

function AgentDetails({ agentId }: { agentId: string }) {
  const { showBoundary } = useErrorBoundary();

  const { data: agent } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => fetchAgent(agentId),
    onError: (err) => {
      // For critical errors, throw to error boundary
      if ((err as any).status === 500) {
        showBoundary(err as Error);
      }
    },
  });

  if (!agent) return null;

  return <div>{agent.name}</div>;
}
```

## 6. Custom Error Boundary with Custom Fallback

Create a custom fallback for specific sections:

```tsx
// src/features/pipelines/components/PipelineCanvas.tsx
import { ErrorBoundary } from "@/features/errors";

function PipelineCanvas() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3>Pipeline Editor Error</h3>
            <p>Unable to load the pipeline editor.</p>
            <button onClick={() => window.location.reload()}>
              Reload Editor
            </button>
          </div>
        </div>
      }
      onError={(error) => {
        console.error("Pipeline canvas error:", error);
      }}
    >
      <Canvas />
      <NodePalette />
      <ConfigPanel />
    </ErrorBoundary>
  );
}
```

## 7. Multiple Error Boundaries for Different Sections

Isolate errors to specific UI sections:

```tsx
// src/pages/Dashboard.tsx
import { ErrorBoundary } from "@/features/errors";

function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ErrorBoundary
        onError={(error) => console.error("Agents section:", error)}
      >
        <AgentsList />
      </ErrorBoundary>

      <ErrorBoundary
        onError={(error) => console.error("Pipelines section:", error)}
      >
        <PipelinesList />
      </ErrorBoundary>

      <ErrorBoundary
        onError={(error) => console.error("Metrics section:", error)}
      >
        <MetricsChart />
      </ErrorBoundary>

      <ErrorBoundary
        onError={(error) => console.error("Activity section:", error)}
      >
        <ActivityFeed />
      </ErrorBoundary>
    </div>
  );
}
```

## 8. Protected Routes with Error Handling

Handle authentication errors:

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { ForbiddenPage } from "@/features/errors";
import { useAuthStore } from "@/store/auth";

function ProtectedRoute({ children, requiredPermission }: Props) {
  const { isAuthenticated, permissions } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
```

## 9. API Integration with Error Context

Track detailed error context:

```tsx
// src/api/agents.ts
import { useErrorHandler } from "@/features/errors";

export function useAgentMutation() {
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: createAgent,
    onError: (error, variables) => {
      handleError(error as Error, {
        component: "AgentMutation",
        action: "createAgent",
        userId: getCurrentUserId(),
        metadata: {
          agentData: variables,
          timestamp: Date.now(),
          endpoint: "/api/agents",
          method: "POST",
        },
      });
    },
  });
}
```

## 10. Error Recovery Pattern

Implement automatic retry with exponential backoff:

```tsx
// src/features/agents/hooks/useAgentWithRetry.ts
import { useState, useEffect } from "react";
import { useErrorHandler } from "@/features/errors";

function useAgentWithRetry(agentId: string) {
  const [retryCount, setRetryCount] = useState(0);
  const { error, handleError, clearError } = useErrorHandler();

  const { data, refetch } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => fetchAgent(agentId),
    retry: false,
    onError: (err) => {
      if (retryCount < 3) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000;

        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          refetch();
        }, delay);
      } else {
        handleError(err as Error, {
          component: "AgentRetry",
          action: "fetchAgent",
          metadata: {
            agentId,
            retryCount,
            finalAttempt: true,
          },
        });
      }
    },
    onSuccess: () => {
      setRetryCount(0);
      clearError();
    },
  });

  return { data, error, isRetrying: retryCount > 0 };
}
```

## Best Practices Summary

1. **Use ErrorBoundary at the app level** to catch all unhandled errors
2. **Use useErrorHandler for recoverable errors** in components
3. **Use ErrorAlert for inline error display** with dismiss/retry options
4. **Use error pages for route-level errors** (404, 403, 500)
5. **Always track error context** for easier debugging
6. **Provide retry mechanisms** for recoverable errors
7. **Use multiple error boundaries** to isolate sections
8. **Log errors with full context** for monitoring
9. **Test error scenarios** thoroughly
10. **Provide helpful error messages** to users
