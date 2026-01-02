# Error Handling Feature

## Overview

The errors feature provides comprehensive error handling components, hooks, and error boundary patterns for graceful error recovery in React applications.

## Directory Structure

```
src/features/errors/
├── types/
│   └── index.ts         # AppError, ErrorSeverity, ErrorContext types
├── hooks/
│   ├── useErrorHandler.ts   # Error handling with logging
│   ├── useErrorBoundary.ts  # Error boundary hook
│   └── index.ts
├── components/
│   ├── ErrorBoundary.tsx    # React error boundary wrapper
│   ├── ErrorFallback.tsx    # Fallback UI for caught errors
│   ├── ErrorAlert.tsx       # Dismissible error alert
│   ├── NotFoundPage.tsx     # 404 page component
│   ├── ServerErrorPage.tsx  # 500 page component
│   ├── ForbiddenPage.tsx    # 403 page component
│   └── index.ts
├── __tests__/               # 154 tests total
│   ├── ErrorBoundary.test.tsx
│   ├── ErrorFallback.test.tsx
│   ├── ErrorAlert.test.tsx
│   ├── NotFoundPage.test.tsx
│   ├── ServerErrorPage.test.tsx
│   ├── ForbiddenPage.test.tsx
│   ├── useErrorHandler.test.ts
│   └── useErrorBoundary.test.ts
└── index.ts
```

## Types

### AppError

```typescript
interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  stack?: string;
}
```

### ErrorSeverity

```typescript
type ErrorSeverity = "info" | "warning" | "error" | "critical";
```

### ErrorContext

```typescript
interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}
```

## Components

### ErrorBoundary

React error boundary wrapper that catches JavaScript errors in child components.

```tsx
import { ErrorBoundary } from "@/features/errors";

function App() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong</div>}
      onError={(error, errorInfo) => console.error(error)}
      onReset={() => window.location.reload()}
    >
      <ChildComponent />
    </ErrorBoundary>
  );
}
```

### ErrorFallback

Fallback UI displayed when an error is caught. Includes retry and navigation options.

```tsx
import { ErrorFallback } from "@/features/errors";

<ErrorFallback
  error={new Error("Something failed")}
  resetErrorBoundary={() => window.location.reload()}
/>;
```

### ErrorAlert

Dismissible alert for inline error display.

```tsx
import { ErrorAlert } from "@/features/errors";

<ErrorAlert
  error="Failed to load data"
  variant="destructive"
  onDismiss={() => setError(null)}
  onRetry={() => refetch()}
/>;
```

### Error Pages

- **NotFoundPage** - 404 page with home navigation
- **ServerErrorPage** - 500 page with retry option
- **ForbiddenPage** - 403 page with access request option

## Hooks

### useErrorHandler

Hook for handling errors with logging and context.

```tsx
import { useErrorHandler } from "@/features/errors";

function MyComponent() {
  const { handleError, clearError, error } = useErrorHandler();

  const fetchData = async () => {
    try {
      await api.getData();
    } catch (err) {
      handleError(err, { component: "MyComponent", action: "fetchData" });
    }
  };

  return error ? <ErrorAlert error={error} /> : <DataDisplay />;
}
```

### useErrorBoundary

Hook for programmatically triggering error boundaries.

```tsx
import { useErrorBoundary } from "@/features/errors";

function MyComponent() {
  const { showBoundary, resetErrorBoundary } = useErrorBoundary();

  const handleApiError = (error: Error) => {
    if (error.message === "CRITICAL") {
      showBoundary(error); // Triggers nearest error boundary
    }
  };

  return <button onClick={resetErrorBoundary}>Reset</button>;
}
```

## Testing

154 tests covering:
- Component rendering and visual elements
- User interactions (click, keyboard navigation)
- Error state handling
- Accessibility (WCAG compliance, screen readers)
- Edge cases and error scenarios

Run tests:
```bash
npm run test src/features/errors
```

## Usage Example

```tsx
import {
  ErrorBoundary,
  ErrorFallback,
  ErrorAlert,
  useErrorHandler,
  NotFoundPage,
  ServerErrorPage,
  ForbiddenPage,
} from "@/features/errors";

// In router
<Route path="/404" element={<NotFoundPage />} />
<Route path="/500" element={<ServerErrorPage />} />
<Route path="/403" element={<ForbiddenPage />} />

// Wrap app with error boundary
<ErrorBoundary>
  <App />
</ErrorBoundary>
```
