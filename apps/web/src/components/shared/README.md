# Shared Components

Reusable UI components used throughout the Kaizen Studio application.

## Components

### LoadingScreen

Full-page or container loading state with spinner.

**Usage:**

```tsx
import { LoadingScreen } from '@/components/shared';

// Basic
<LoadingScreen />

// With message
<LoadingScreen message="Loading agents..." />

// In a container
<div className="h-96">
  <LoadingScreen message="Fetching data..." />
</div>
```

**Props:**

```tsx
interface LoadingScreenProps {
  message?: string; // Optional loading message
  className?: string; // Additional CSS classes
}
```

**Features:**

- Centered spinner (Loader2 from lucide-react)
- Optional message below spinner
- Minimum height of 400px
- Responsive and accessible

---

### ErrorBoundary

React error boundary component that catches JavaScript errors in child components.

**Usage:**

```tsx
import { ErrorBoundary } from "@/components/shared";

// Wrap your app or sections
function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <MyComponent />
</ErrorBoundary>;
```

**Props:**

```tsx
interface ErrorBoundaryProps {
  children: ReactNode; // Components to protect
  fallback?: ReactNode; // Custom error UI (optional)
}
```

**Features:**

- Catches React component errors
- Logs errors to console
- Shows user-friendly error message
- "Try again" button to reset error state
- Optional custom fallback UI
- Prevents entire app crashes

**Default Error UI:**

- Card with error icon
- Error message
- "Try again" button to reset

**When to Use:**

- Wrap entire app for global error handling
- Wrap critical sections (dashboards, forms)
- Wrap third-party components
- Wrap experimental features

---

### EmptyState

Empty state component for lists, tables, or sections with no data.

**Usage:**

```tsx
import { EmptyState } from '@/components/shared';
import { Users } from 'lucide-react';

// Basic
<EmptyState
  title="No agents found"
  description="Get started by creating your first AI agent."
/>

// With icon and action
<EmptyState
  icon={Users}
  title="No team members"
  description="Invite team members to collaborate on your projects."
  action={{
    label: "Invite Members",
    onClick: () => openInviteDialog()
  }}
/>

// Custom styling
<EmptyState
  icon={Inbox}
  title="Inbox empty"
  description="You're all caught up!"
  className="min-h-[300px]"
/>
```

**Props:**

```tsx
interface EmptyStateProps {
  icon?: LucideIcon; // Optional icon component
  title: string; // Main heading
  description?: string; // Subtitle/description
  action?: {
    label: string; // Button text
    onClick: () => void; // Button click handler
  };
  className?: string; // Additional CSS classes
}
```

**Features:**

- Responsive design
- Dashed border for visual distinction
- Optional icon in circle
- Optional call-to-action button
- Centered content
- Customizable styling

**Common Use Cases:**

1. **Empty Lists:**

```tsx
{
  agents.length === 0 ? (
    <EmptyState
      icon={Users}
      title="No agents yet"
      description="Create your first AI agent to get started."
      action={{ label: "Create Agent", onClick: () => navigate("/agents/new") }}
    />
  ) : (
    <AgentList agents={agents} />
  );
}
```

2. **Search No Results:**

```tsx
{
  searchResults.length === 0 && (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`No matches for "${searchQuery}"`}
    />
  );
}
```

3. **Feature Not Available:**

```tsx
<EmptyState
  icon={Lock}
  title="Premium Feature"
  description="Upgrade to access advanced analytics."
  action={{ label: "Upgrade Now", onClick: () => navigate("/upgrade") }}
/>
```

4. **Success State:**

```tsx
<EmptyState
  icon={CheckCircle}
  title="All done!"
  description="You've completed all pending tasks."
/>
```

---

## Accessibility

All shared components follow accessibility best practices:

### LoadingScreen

- Uses `aria-busy` implicitly through spinner
- Visible loading text for screen readers
- High contrast spinner

### ErrorBoundary

- Semantic HTML structure
- Keyboard-accessible reset button
- Clear error messaging
- Focus management on error

### EmptyState

- Semantic heading hierarchy
- Descriptive text for screen readers
- Keyboard-accessible action buttons
- Sufficient color contrast

---

## Styling

All components use:

- **Tailwind CSS** for utility classes
- **shadcn/ui** base components (Button, Card)
- **CSS Variables** for theme colors
- **cn()** utility for class merging

They support:

- Light/dark mode
- Responsive breakpoints
- Custom className override
- Theme color variables

---

## Examples

### Data Fetching Pattern

```tsx
function AgentList() {
  const { isPending, error, data } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  if (isPending) {
    return <LoadingScreen message="Loading agents..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load agents"
        description={error.message}
        action={{ label: "Try Again", onClick: () => refetch() }}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No agents yet"
        description="Create your first AI agent to get started."
        action={{
          label: "Create Agent",
          onClick: () => navigate("/agents/new"),
        }}
      />
    );
  }

  return <div>{/* Render agents */}</div>;
}
```

### Nested Error Boundaries

```tsx
function App() {
  return (
    <ErrorBoundary>
      <AppShell>
        <Routes>
          <Route
            path="/agents"
            element={
              <ErrorBoundary fallback={<AgentErrorFallback />}>
                <AgentPage />
              </ErrorBoundary>
            }
          />
        </Routes>
      </AppShell>
    </ErrorBoundary>
  );
}
```

### Conditional Empty States

```tsx
function SearchResults({ query, results }) {
  if (!query) {
    return (
      <EmptyState
        icon={Search}
        title="Start searching"
        description="Enter a query to find agents, pipelines, or connectors."
      />
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No results found"
        description={`No matches for "${query}". Try different keywords.`}
      />
    );
  }

  return <ResultsList results={results} />;
}
```

---

## Testing

### LoadingScreen

```tsx
import { render, screen } from "@testing-library/react";
import { LoadingScreen } from "@/components/shared";

test("renders loading spinner", () => {
  render(<LoadingScreen />);
  expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
});

test("renders loading message", () => {
  render(<LoadingScreen message="Loading data..." />);
  expect(screen.getByText("Loading data...")).toBeInTheDocument();
});
```

### ErrorBoundary

```tsx
test("catches and displays errors", () => {
  const ThrowError = () => {
    throw new Error("Test error");
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  expect(screen.getByText("Test error")).toBeInTheDocument();
});
```

### EmptyState

```tsx
test("renders with action button", async () => {
  const handleClick = jest.fn();

  render(
    <EmptyState
      title="No data"
      action={{ label: "Add Data", onClick: handleClick }}
    />
  );

  const button = screen.getByRole("button", { name: "Add Data" });
  await userEvent.click(button);

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```
