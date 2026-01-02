# Frontend Architecture

**Date**: 2025-12-11
**Status**: Planning

---

## Overview

This document defines the frontend architecture for Kaizen Studio, based on patterns extracted from three reference codebases (kailash_workflow_studio, agentic_platform, xaiflow) and aligned with the backend API.

---

## Directory Structure

```
src/
├── app/                      # Application entry and routing
│   ├── App.tsx               # Root component with providers
│   ├── routes.tsx            # Route definitions
│   └── providers/            # Context providers
│       ├── QueryProvider.tsx
│       ├── AuthProvider.tsx
│       └── ThemeProvider.tsx
│
├── components/               # Reusable UI components
│   ├── ui/                   # Shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── layout/               # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── PageLayout.tsx
│   │   └── Breadcrumbs.tsx
│   └── shared/               # Shared business components
│       ├── EntityCard.tsx
│       ├── StatusBadge.tsx
│       ├── PermissionGate.tsx
│       └── LoadingState.tsx
│
├── features/                 # Feature modules (domain-specific)
│   ├── agents/               # Agent Designer
│   │   ├── components/
│   │   │   ├── AgentForm.tsx
│   │   │   ├── AgentCard.tsx
│   │   │   ├── SignatureBuilder.tsx
│   │   │   └── ToolConfigurator.tsx
│   │   ├── hooks/
│   │   │   └── useAgents.ts
│   │   └── schemas/
│   │       └── agent.ts
│   │
│   ├── pipelines/            # Pipeline Canvas
│   │   ├── components/
│   │   │   ├── Canvas.tsx
│   │   │   ├── NodePalette.tsx
│   │   │   ├── nodes/
│   │   │   │   ├── AgentNode.tsx
│   │   │   │   ├── SupervisorNode.tsx
│   │   │   │   ├── RouterNode.tsx
│   │   │   │   └── SynthesizerNode.tsx
│   │   │   └── edges/
│   │   │       ├── DefaultEdge.tsx
│   │   │       └── LoopEdge.tsx
│   │   ├── hooks/
│   │   │   └── usePipelines.ts
│   │   └── schemas/
│   │       └── pipeline.ts
│   │
│   ├── deployments/          # Deployment Management
│   │   ├── components/
│   │   │   ├── DeploymentCard.tsx
│   │   │   ├── GatewaySelector.tsx
│   │   │   └── PromotionDialog.tsx
│   │   └── hooks/
│   │       └── useDeployments.ts
│   │
│   ├── governance/           # RBAC/ABAC/Policies
│   │   ├── components/
│   │   │   ├── PolicyBuilder.tsx
│   │   │   ├── RoleManager.tsx
│   │   │   └── AuditLog.tsx
│   │   └── hooks/
│   │       └── usePolicies.ts
│   │
│   ├── observability/        # Metrics & Monitoring
│   │   ├── components/
│   │   │   ├── MetricsDashboard.tsx
│   │   │   ├── LatencyChart.tsx
│   │   │   └── HealthStatus.tsx
│   │   └── hooks/
│   │       └── useMetrics.ts
│   │
│   ├── auth/                 # Authentication
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── SSOCallback.tsx
│   │   └── hooks/
│   │       └── useAuth.ts
│   │
│   └── admin/                # Admin Console
│       ├── components/
│       │   ├── UserManagement.tsx
│       │   ├── TeamSettings.tsx
│       │   └── BillingOverview.tsx
│       └── hooks/
│           └── useAdmin.ts
│
├── pages/                    # Route pages (thin, compose features)
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── agents/
│   │   ├── AgentsListPage.tsx
│   │   ├── AgentDetailPage.tsx
│   │   └── AgentCreatePage.tsx
│   ├── pipelines/
│   │   ├── PipelinesListPage.tsx
│   │   └── PipelineEditorPage.tsx
│   ├── deployments/
│   │   └── DeploymentsPage.tsx
│   ├── governance/
│   │   ├── PoliciesPage.tsx
│   │   └── AuditPage.tsx
│   ├── observability/
│   │   └── MetricsPage.tsx
│   ├── admin/
│   │   ├── UsersPage.tsx
│   │   ├── TeamsPage.tsx
│   │   └── BillingPage.tsx
│   └── auth/
│       ├── LoginPage.tsx
│       ├── RegisterPage.tsx
│       └── SSOCallbackPage.tsx
│
├── stores/                   # Zustand stores (client state)
│   ├── authStore.ts          # User, tokens, permissions
│   ├── uiStore.ts            # Modals, sidebars, preferences
│   ├── canvasStore.ts        # Workflow canvas state
│   ├── historyStore.ts       # Undo/redo stack
│   └── executionStore.ts     # Test execution state
│
├── services/                 # API services
│   ├── api/
│   │   ├── client.ts         # Axios instance with interceptors
│   │   ├── agents.ts         # Agent API calls
│   │   ├── pipelines.ts      # Pipeline API calls
│   │   ├── deployments.ts    # Deployment API calls
│   │   ├── auth.ts           # Auth API calls
│   │   └── ...
│   └── websocket/
│       └── executionWs.ts    # WebSocket for execution streaming
│
├── hooks/                    # Shared React Query hooks
│   ├── useQueryConfig.ts     # Common query options
│   └── useMutationConfig.ts  # Common mutation options
│
├── lib/                      # Utilities
│   ├── utils.ts              # cn(), formatDate(), etc.
│   ├── constants.ts          # App constants
│   └── types.ts              # Shared TypeScript types
│
├── styles/                   # Global styles
│   ├── globals.css           # Tailwind directives + CSS vars
│   └── tokens.css            # Design tokens
│
└── types/                    # TypeScript type definitions
    ├── api.ts                # API response types
    ├── models.ts             # Domain model types
    └── canvas.ts             # React Flow types
```

---

## Component Architecture

### Component Hierarchy

```
App
├── QueryClientProvider
│   └── ThemeProvider
│       └── AuthProvider
│           └── RouterProvider
│               └── Layout
│                   ├── Sidebar
│                   ├── Header
│                   └── PageContent
│                       └── [Feature Components]
```

### Component Design Principles

**From agentic_platform: 8-State Component Design**

Every interactive component supports 8 visual states:

```typescript
// components/ui/button.tsx
export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  // 8 states: default, hover, focus, active, disabled, loading, error, empty
}
```

**State Mapping**:
1. **Default**: Base appearance
2. **Hover**: Mouse over (cursor: pointer, color shift)
3. **Focus**: Keyboard focus (ring-2, ring-offset-2)
4. **Active**: Being pressed (scale-95)
5. **Disabled**: Not interactive (opacity-50, cursor-not-allowed)
6. **Loading**: Async operation (spinner, disabled interaction)
7. **Error**: Validation failed (red border, error icon)
8. **Empty**: No data (empty state illustration)

### Component Categories

**1. UI Components (Atomic)**
```typescript
// Shadcn/ui pattern - copy/paste, not npm install
// components/ui/button.tsx

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 rounded-md px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
```

**2. Layout Components**
```typescript
// components/layout/PageLayout.tsx

interface PageLayoutProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PageLayout({ title, description, actions, children }: PageLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
```

**3. Feature Components**
```typescript
// features/agents/components/AgentCard.tsx

interface AgentCardProps {
  agent: Agent
  onEdit: () => void
  onDelete: () => void
  onDeploy: () => void
}

export function AgentCard({ agent, onEdit, onDelete, onDeploy }: AgentCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{agent.name}</CardTitle>
          <StatusBadge status={agent.status} />
        </div>
        <CardDescription>{agent.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{agent.provider}</span>
          <span>•</span>
          <span>{agent.model}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        <Button size="sm" onClick={onDeploy}>
          <Rocket className="h-4 w-4 mr-1" />
          Deploy
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

## Data Flow Architecture

### Server State (React Query)

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Query                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  useQuery('agents', fetchAgents)                                │
│       │                                                         │
│       ├──→ Stale Time: 5 min (don't refetch if fresh)          │
│       ├──→ Cache Time: 10 min (keep in cache after unmount)    │
│       ├──→ Retry: 2 times with 1s delay                        │
│       └──→ Refetch on reconnect: true                          │
│                                                                 │
│  useMutation(createAgent)                                       │
│       │                                                         │
│       └──→ onSuccess: invalidateQueries(['agents'])            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Query Keys Convention**:
```typescript
// hooks/queryKeys.ts
export const queryKeys = {
  agents: {
    all: ['agents'] as const,
    lists: () => [...queryKeys.agents.all, 'list'] as const,
    list: (filters: AgentFilters) => [...queryKeys.agents.lists(), filters] as const,
    details: () => [...queryKeys.agents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.agents.details(), id] as const,
  },
  pipelines: {
    all: ['pipelines'] as const,
    // ... similar structure
  },
}

// Usage in hooks
const { data: agents } = useQuery({
  queryKey: queryKeys.agents.list({ status: 'active' }),
  queryFn: () => agentService.list({ status: 'active' }),
})
```

### Client State (Zustand)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Zustand Stores                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  authStore                                                      │
│  ├── user: User | null                                         │
│  ├── token: string | null                                      │
│  ├── permissions: string[]                                     │
│  └── actions: login, logout, refreshToken                      │
│                                                                 │
│  uiStore                                                        │
│  ├── sidebarOpen: boolean                                      │
│  ├── theme: 'light' | 'dark' | 'system'                       │
│  ├── activeModal: string | null                                │
│  └── actions: toggleSidebar, setTheme, openModal              │
│                                                                 │
│  canvasStore (Pipeline Editor)                                  │
│  ├── nodes: Node[]                                             │
│  ├── edges: Edge[]                                             │
│  ├── selectedNodeId: string | null                             │
│  ├── isDirty: boolean                                          │
│  └── actions: addNode, deleteNode, onConnect, setSelection    │
│                                                                 │
│  historyStore (Undo/Redo)                                       │
│  ├── past: CanvasState[]                                       │
│  ├── future: CanvasState[]                                     │
│  └── actions: undo, redo, pushState                            │
│                                                                 │
│  executionStore (Test Panel)                                    │
│  ├── status: 'idle' | 'running' | 'completed' | 'failed'       │
│  ├── logs: ExecutionLog[]                                      │
│  ├── result: ExecutionResult | null                            │
│  └── actions: startExecution, addLog, setResult                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   Pages    │────▶│  Features  │────▶│ Components │
└────────────┘     └────────────┘     └────────────┘
      │                  │                  │
      │                  ▼                  │
      │           ┌────────────┐            │
      │           │   Hooks    │            │
      │           │ useAgents  │            │
      │           │ usePipelines            │
      │           └────────────┘            │
      │                  │                  │
      ├──────────────────┼──────────────────┤
      │                  │                  │
      ▼                  ▼                  ▼
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Zustand │      │  React   │      │ Services │
│ (Client) │      │  Query   │      │  (API)   │
└──────────┘      │ (Server) │      └──────────┘
                  └──────────┘            │
                       │                  │
                       └──────────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │ API Client   │
                        │ (Axios)      │
                        └──────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │ FastAPI      │
                        │ Backend      │
                        └──────────────┘
```

---

## Routing Architecture

### Route Structure

```typescript
// app/routes.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/sso/callback',
    element: <SSOCallbackPage />,
  },

  // Protected routes
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },

      // Agents
      { path: 'agents', element: <AgentsListPage /> },
      { path: 'agents/new', element: <AgentCreatePage /> },
      { path: 'agents/:id', element: <AgentDetailPage /> },
      { path: 'agents/:id/edit', element: <AgentEditPage /> },

      // Pipelines
      { path: 'pipelines', element: <PipelinesListPage /> },
      { path: 'pipelines/new', element: <PipelineEditorPage /> },
      { path: 'pipelines/:id', element: <PipelineEditorPage /> },

      // Deployments
      { path: 'deployments', element: <DeploymentsPage /> },
      { path: 'deployments/:id', element: <DeploymentDetailPage /> },

      // Governance
      { path: 'governance/policies', element: <PoliciesPage /> },
      { path: 'governance/roles', element: <RolesPage /> },
      { path: 'governance/audit', element: <AuditPage /> },

      // Observability
      { path: 'metrics', element: <MetricsPage /> },
      { path: 'metrics/:deploymentId', element: <DeploymentMetricsPage /> },

      // Admin
      { path: 'admin/users', element: <UsersPage /> },
      { path: 'admin/teams', element: <TeamsPage /> },
      { path: 'admin/billing', element: <BillingPage /> },
      { path: 'admin/api-keys', element: <ApiKeysPage /> },
      { path: 'admin/webhooks', element: <WebhooksPage /> },

      // Settings
      { path: 'settings', element: <SettingsPage /> },
      { path: 'settings/profile', element: <ProfilePage /> },
      { path: 'settings/organization', element: <OrganizationPage /> },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
])
```

### Protected Routes Pattern

```typescript
// components/layout/ProtectedLayout.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedLayout() {
  const { user, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

---

## Error Handling Architecture

### Error Boundary

```typescript
// components/shared/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error?.message}</p>
      <Button onClick={() => window.location.reload()}>
        Refresh Page
      </Button>
    </div>
  )
}
```

### API Error Handling

```typescript
// services/api/client.ts
import { toast } from '@/components/ui/toast'

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const message = error.response?.data?.detail || 'An error occurred'
    const status = error.response?.status

    switch (status) {
      case 401:
        // Handle in auth interceptor
        break
      case 403:
        toast.error('Permission denied')
        break
      case 404:
        toast.error('Resource not found')
        break
      case 422:
        // Validation errors - let component handle
        break
      case 500:
        toast.error('Server error. Please try again.')
        break
      default:
        toast.error(message)
    }

    return Promise.reject(error)
  }
)
```

---

## Performance Patterns

### Code Splitting

```typescript
// Lazy load feature modules
const AgentsListPage = lazy(() => import('@/pages/agents/AgentsListPage'))
const PipelineEditorPage = lazy(() => import('@/pages/pipelines/PipelineEditorPage'))
const MetricsPage = lazy(() => import('@/pages/observability/MetricsPage'))

// Usage with Suspense
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/agents" element={<AgentsListPage />} />
  </Routes>
</Suspense>
```

### Virtualization for Lists

```typescript
// For large lists (>100 items), use virtualization
import { useVirtualizer } from '@tanstack/react-virtual'

function AgentList({ agents }: { agents: Agent[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: agents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  })

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
              width: '100%',
            }}
          >
            <AgentCard agent={agents[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Debounced Search

```typescript
// hooks/useDebouncedValue.ts
import { useState, useEffect } from 'react'

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Usage
function AgentSearch() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list({ search: debouncedSearch }),
    queryFn: () => agentService.list({ search: debouncedSearch }),
    enabled: debouncedSearch.length > 0,
  })
}
```

---

## Accessibility Architecture

### WCAG 2.1 AA Compliance

**Keyboard Navigation**:
```typescript
// All interactive elements must be keyboard accessible
<Button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  tabIndex={0}
  aria-label="Create new agent"
>
  <Plus className="h-4 w-4" />
</Button>
```

**Focus Management**:
```typescript
// Focus trap for modals
import { FocusTrap } from '@radix-ui/react-focus-guards'

<Dialog>
  <FocusTrap>
    <DialogContent>
      {/* Dialog content */}
    </DialogContent>
  </FocusTrap>
</Dialog>
```

**Screen Reader Support**:
```typescript
// Announce dynamic content
import { useAnnounce } from '@/hooks/useAnnounce'

function AgentList() {
  const announce = useAnnounce()

  const onAgentCreated = (agent: Agent) => {
    announce(`Agent ${agent.name} created successfully`)
  }
}
```

---

## Mobile Responsiveness

### Breakpoint System

```typescript
// From Tailwind config
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
}

// Usage with clsx/cn
<div className={cn(
  'grid gap-4',
  'grid-cols-1',           // Mobile
  'sm:grid-cols-2',        // Tablet
  'lg:grid-cols-3',        // Desktop
  'xl:grid-cols-4'         // Large desktop
)}>
```

### Responsive Sidebar

```typescript
// Mobile: Sheet (slide-out)
// Desktop: Fixed sidebar

function ResponsiveSidebar() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside className="w-64 border-r h-screen">
      <SidebarContent />
    </aside>
  )
}
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [01-tech-stack.md](01-tech-stack.md) | Technology decisions |
| [03-design-system.md](03-design-system.md) | Design tokens, components |
| [04-state-management.md](04-state-management.md) | Zustand, React Query |
| [05-api-integration.md](05-api-integration.md) | API client, services |
