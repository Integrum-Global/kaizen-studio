# Architecture Overview

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19.x |
| Language | TypeScript | 5.8+ (strict) |
| Build Tool | Vite | 6.x |
| Styling | Tailwind CSS | 4.x |
| Components | Shadcn/ui | Latest |
| State (Client) | Zustand | 5.x |
| State (Server) | TanStack Query | 5.x |
| Routing | React Router | 7.x |
| Forms | React Hook Form | 7.x |
| Validation | Zod | 3.x |
| HTTP | Axios | 1.x |
| Testing (Unit) | Vitest | Latest |
| Testing (E2E) | Playwright | Latest |

## Application Layers

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                          │
│  Pages, Components, Layout                           │
├─────────────────────────────────────────────────────┤
│                 Feature Layer                        │
│  Auth, Agents, Pipelines, etc.                       │
├─────────────────────────────────────────────────────┤
│                State Layer                           │
│  Zustand (client) + React Query (server)             │
├─────────────────────────────────────────────────────┤
│               Service Layer                          │
│  API Client, Auth Service                            │
├─────────────────────────────────────────────────────┤
│              Backend API                             │
│  Kaizen Studio REST API                              │
└─────────────────────────────────────────────────────┘
```

## State Management Strategy

### Client State (Zustand)

For UI-only state that doesn't come from the server:

- Authentication status
- UI preferences (theme, sidebar)
- Form drafts
- Local notifications

### Server State (React Query)

For data that comes from the API:

- User data
- Agents, pipelines
- Deployments
- Metrics

### Why This Split?

1. **Separation of concerns**: Server data has different lifecycles than UI state
2. **Automatic caching**: React Query handles caching, refetching, invalidation
3. **Optimistic updates**: React Query makes optimistic updates straightforward
4. **Simpler stores**: Zustand stores remain small and focused

## Data Flow

```
User Action
    │
    ▼
Component (dispatch action)
    │
    ├─── UI State ───► Zustand Store ───► Component Re-render
    │
    └─── Server State ───► React Query Mutation
                                │
                                ▼
                          API Request
                                │
                                ▼
                          Cache Update
                                │
                                ▼
                       Component Re-render
```

## Bundle Optimization

Vite is configured with manual chunk splitting:

```typescript
// vite.config.ts
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'query-vendor': ['@tanstack/react-query'],
  'flow-vendor': ['@xyflow/react'],  // Future
  'ui-utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
  'icons': ['lucide-react'],
  'state': ['zustand'],
}
```

This ensures:
- Core React bundle loads first
- UI libraries load in parallel
- Visualization libraries lazy-load
