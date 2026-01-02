# Project Structure

## Directory Layout

```
src/
├── api/                    # API client and services
│   ├── index.ts           # Axios client with interceptors
│   └── auth.ts            # Authentication API service
│
├── components/
│   ├── layout/            # App shell components
│   │   ├── AppShell.tsx   # Main layout wrapper
│   │   ├── Sidebar.tsx    # Desktop navigation
│   │   ├── Header.tsx     # Top header bar
│   │   ├── Breadcrumb.tsx # Route breadcrumbs
│   │   ├── UserMenu.tsx   # User dropdown
│   │   └── MobileSidebar.tsx
│   │
│   ├── shared/            # Reusable components
│   │   ├── LoadingScreen.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── EmptyState.tsx
│   │
│   └── ui/                # Shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── select.tsx
│       ├── toast.tsx
│       └── ...
│
├── features/              # Feature-based organization
│   └── auth/
│       ├── components/
│       │   ├── AuthProvider.tsx
│       │   ├── ProtectedRoute.tsx
│       │   ├── PermissionGate.tsx
│       │   └── SSOButtons.tsx
│       └── hooks/
│           └── useAuth.ts
│
├── hooks/                 # Global hooks
│   └── use-toast.ts
│
├── lib/                   # Utilities and configuration
│   ├── utils.ts          # cn() and other utilities
│   ├── queryClient.ts    # React Query configuration
│   └── queryKeys.ts      # Query key factory
│
├── pages/                 # Route pages
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── SSOCallbackPage.tsx
│   └── Dashboard.tsx
│
├── store/                 # Zustand stores
│   ├── auth.ts           # Authentication state
│   ├── ui.ts             # UI state (sidebar, theme)
│   └── index.ts
│
├── test/                  # Test utilities
│   ├── setup.ts          # Test configuration
│   └── utils.tsx         # Test helpers
│
├── types/                 # TypeScript types
│   ├── auth.ts
│   ├── api.ts
│   └── index.ts
│
├── App.tsx               # Root component with routing
├── main.tsx              # Application entry point
└── index.css             # Global styles and CSS variables
```

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `LoginPage.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Stores | camelCase | `auth.ts` |
| Utils | camelCase | `queryKeys.ts` |
| Types | camelCase | `auth.ts` |
| Tests | same as source with `.test` | `auth.test.ts` |

### Components

```typescript
// Named exports for components
export function LoginPage() { ... }

// Type props inline or with interface
interface ButtonProps {
  variant?: 'default' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}
```

### Imports

Use path aliases for clean imports:

```typescript
// Preferred
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';

// Avoid
import { Button } from '../../../components/ui/button';
```

## Feature Organization

Features are self-contained modules:

```
features/
└── agents/
    ├── components/
    │   ├── AgentCard.tsx
    │   ├── AgentForm.tsx
    │   └── AgentList.tsx
    ├── hooks/
    │   └── useAgents.ts
    ├── types/
    │   └── agent.ts
    └── index.ts          # Public exports
```

Each feature exports only what's needed publicly:

```typescript
// features/agents/index.ts
export { AgentCard } from './components/AgentCard';
export { AgentForm } from './components/AgentForm';
export { useAgents, useAgent } from './hooks/useAgents';
export type { Agent, CreateAgentInput } from './types/agent';
```
