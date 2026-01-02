# Layout Components

Layout components provide the application shell structure.

## AppShell

The main layout wrapper that contains sidebar and content area.

```tsx
import { AppShell } from '@/components/layout/AppShell';

// Used automatically in protected routes
<Route element={<AppShell />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/agents" element={<Agents />} />
</Route>
```

### Structure

```
┌─────────────────────────────────────────────────────┐
│                    Header                            │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│   Sidebar    │           Main Content               │
│              │           (Outlet)                   │
│              │                                       │
│              │                                       │
└──────────────┴──────────────────────────────────────┘
```

## Sidebar

Desktop navigation sidebar with collapsible state.

```tsx
// Controlled by UI store
const { sidebarCollapsed, toggleSidebar } = useUIStore();
```

### Navigation Sections

| Section | Items |
|---------|-------|
| BUILD | Agents, Pipelines, Connectors |
| DEPLOY | Deployments, Gateways |
| GOVERN | Teams, Roles, Policies, Audit |
| OBSERVE | Metrics, Logs |
| ADMIN | Settings, API Keys, Webhooks |

### Collapsed Mode

When collapsed, sidebar shows only icons with tooltips on hover.

## Header

Top header bar with mobile menu, breadcrumbs, and user actions.

```tsx
// Header components
<Header>
  <MobileMenuButton />      {/* Mobile only */}
  <Breadcrumb />
  <SearchBar />             {/* Desktop only */}
  <NotificationBell />
  <UserMenu />              {/* Mobile only */}
</Header>
```

## Breadcrumb

Auto-generated breadcrumbs from current route.

```tsx
// Route: /agents/agent-123/settings
// Breadcrumb: Home > Agents > agent-123 > Settings
```

### Usage

```tsx
import { Breadcrumb } from '@/components/layout/Breadcrumb';

// Automatic - uses current location
<Breadcrumb />
```

## UserMenu

Dropdown menu with user info and actions.

```tsx
import { UserMenu } from '@/components/layout/UserMenu';

// Features:
// - Avatar with fallback
// - User name and email
// - Theme toggle (light/dark/system)
// - Settings link
// - Logout button
```

### Theme Toggle

```tsx
// Theme options
type Theme = 'light' | 'dark' | 'system';

// Controlled by UI store
const { theme, setTheme } = useUIStore();
setTheme('dark');
```

## MobileSidebar

Sheet-based sidebar for mobile devices.

```tsx
import { MobileSidebar } from '@/components/layout/MobileSidebar';

// Controlled open/close
<MobileSidebar
  open={mobileOpen}
  onOpenChange={setMobileOpen}
/>
```

## Shared Components

### LoadingScreen

Full-page loading indicator.

```tsx
import { LoadingScreen } from '@/components/shared/LoadingScreen';

<LoadingScreen />
<LoadingScreen message="Loading agents..." />
```

### ErrorBoundary

React error boundary for graceful error handling.

```tsx
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

<ErrorBoundary fallback={<CustomError />}>
  <SomeComponent />
</ErrorBoundary>

// Default fallback shows error and reset button
```

### EmptyState

Placeholder for empty lists or no data.

```tsx
import { EmptyState } from '@/components/shared/EmptyState';

<EmptyState
  icon={<Package className="h-12 w-12" />}
  title="No agents found"
  description="Create your first agent to get started."
  action={
    <Button onClick={createAgent}>
      Create Agent
    </Button>
  }
/>
```
