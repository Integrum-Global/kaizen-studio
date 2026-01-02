# Tech Stack Decisions

**Date**: 2025-12-11
**Status**: Planning

---

## Core Framework

### React 19 + TypeScript 5.8

**Decision**: Use React 19 with TypeScript 5.8 strict mode

**Evidence from Reference Codebases**:
- kailash_workflow_studio: React 19.1.0 + TypeScript 5.8.3 (working well)
- agentic_platform: React 19 + TypeScript 5.9 (stable)
- xaiflow (current): React 18.2.0 + TypeScript 5.3.3 (outdated)

**Rationale**:
- React 19 has stable Actions, use() hook, and improved hydration
- TypeScript 5.8 has better type inference and const type parameters
- Strict mode catches bugs early (enterprise requirement)

**Configuration**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Build Tool

### Vite 6

**Decision**: Use Vite 6 with manual chunk splitting

**Evidence from Reference Codebases**:
- All three use Vite (5.x or 6.x)
- kailash_workflow_studio has excellent chunk splitting (9 vendor chunks)
- Sub-second HMR in all projects

**Configuration**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-slot'],
          'flow-vendor': ['@xyflow/react'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## State Management

### Zustand 5 (Client State)

**Decision**: Use Zustand for client-side state with domain-specific stores

**Evidence from Reference Codebases**:
- kailash_workflow_studio: Zustand 5.0.5 (single 2,273-line store - TOO BIG)
- agentic_platform: Zustand 5.0 (minimal usage)
- xaiflow: Zustand 4.4.7 (auth store only - good pattern)

**Key Learning**: Split stores by domain to avoid monolithic mess

**Store Structure**:
```typescript
// stores/
├── authStore.ts        // User, tokens, permissions
├── uiStore.ts          // Modals, sidebars, preferences
├── canvasStore.ts      // Workflow canvas state (nodes, edges, selection)
├── historyStore.ts     // Undo/redo stack
├── executionStore.ts   // Test execution state
```

**Pattern from kailash_workflow_studio (adapted)**:
```typescript
// canvasStore.ts - Split from original 2,273-line store
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  isDirty: boolean
  // Actions
  addNode: (node: Node) => void
  deleteNode: (id: string) => void
  updateNode: (id: string, data: Partial<Node>) => void
  onConnect: (connection: Connection) => void
  setSelection: (id: string | null) => void
}

export const useCanvasStore = create<CanvasState>()(
  devtools(
    persist(
      (set, get) => ({
        nodes: [],
        edges: [],
        selectedNodeId: null,
        isDirty: false,
        // ... actions
      }),
      { name: 'kaizen-canvas' }
    )
  )
)
```

### React Query 5 (Server State)

**Decision**: Use TanStack React Query for all API data

**Evidence from Reference Codebases**:
- kailash_workflow_studio: React Query 5.80.7 (excellent integration)
- agentic_platform: React Query 5.90 (similar patterns)

**Configuration**:
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes (was cacheTime)
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,   // Prevent disruption
      refetchOnReconnect: true,      // Recover from network issues
    },
    mutations: {
      retry: 1,
    },
  },
})
```

---

## UI Framework

### Shadcn/ui + Tailwind CSS 4

**Decision**: Use Shadcn/ui with Tailwind CSS and custom design tokens

**Evidence from Reference Codebases**:
- kailash_workflow_studio: Shadcn/ui + Tailwind 3.4.17 (clean, flexible)
- agentic_platform: Custom components + Tailwind 4.1 + CVA (comprehensive)
- xaiflow: Ant Design 5.12.8 (heavy, less customizable)

**Rationale**:
- Shadcn/ui provides copy-paste components (not dependencies)
- Full control over styling and behavior
- Tailwind CSS for utility-first approach
- CVA (Class Variance Authority) for component variants

**Why NOT Ant Design** (current xaiflow):
- Large bundle size
- Opinionated styling hard to customize
- Less control over accessibility

**Component Variants Pattern (from agentic_platform)**:
```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200',
        ghost: 'hover:bg-neutral-100 hover:text-neutral-900',
        destructive: 'bg-error-600 text-white hover:bg-error-700',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-11 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}
```

---

## Workflow Visualization

### @xyflow/react v12 (SINGLE LIBRARY)

**Decision**: Use @xyflow/react v12 ONLY - no dual libraries

**Evidence from Reference Codebases**:
- kailash_workflow_studio: @xyflow/react 12.7.0 (single, working well)
- agentic_platform: Both @xyflow/react AND reactflow (maintenance burden!)

**Key Learning from agentic_platform**: Using two visualization libraries led to:
- Duplicated node components
- Inconsistent APIs
- Confusion about which to use where
- Bundle size bloat

**Configuration**:
```typescript
// components/workflow-canvas/index.tsx
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Custom node types
const nodeTypes = {
  agent: AgentNode,
  connector: ConnectorNode,
  supervisor: SupervisorNode,
  router: RouterNode,
  synthesizer: SynthesizerNode,
}

// Custom edge types
const edgeTypes = {
  default: KailashEdge,
  loop: LoopEdge,
}
```

---

## Forms & Validation

### React Hook Form + Zod

**Decision**: Use React Hook Form with Zod schemas

**Evidence from Reference Codebases**:
- kailash_workflow_studio: React Hook Form 7.58.1 + Zod 3.25.67 (excellent DX)
- agentic_platform: Same stack

**Pattern**:
```typescript
// schemas/agent.ts
import { z } from 'zod'

export const agentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(10, 'System prompt must be at least 10 characters'),
  provider: z.enum(['openai', 'anthropic', 'azure', 'ollama']),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().max(128000).optional(),
})

export type AgentInput = z.infer<typeof agentSchema>

// components/AgentForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export function AgentForm({ onSubmit }: Props) {
  const form = useForm<AgentInput>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      temperature: 0.7,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

---

## HTTP Client

### Axios with Interceptors

**Decision**: Use Axios with JWT interceptors (matches current backend)

**Evidence from Reference Codebases**:
- xaiflow: Axios 1.6.2 with interceptors (working pattern)
- kailash_workflow_studio: Custom fetch wrapper (session-based - different auth)
- agentic_platform: Custom fetch with JWT (same goal)

**Pattern from xaiflow (keep and enhance)**:
```typescript
// lib/api/client.ts
import axios, { AxiosError, AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kaizen_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle 401, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('kaizen_refresh_token')
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token } = response.data
        localStorage.setItem('kaizen_access_token', access_token)

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('kaizen_access_token')
        localStorage.removeItem('kaizen_refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)
```

---

## Charts & Data Visualization

### Recharts

**Decision**: Use Recharts for metrics dashboards

**Evidence from Reference Codebases**:
- agentic_platform: Recharts (clean, React-native)
- kailash_workflow_studio: N/A (no metrics UI)

**Usage**:
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function LatencyChart({ data }: { data: MetricPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="p50" stroke="#8884d8" />
        <Line type="monotone" dataKey="p95" stroke="#82ca9d" />
        <Line type="monotone" dataKey="p99" stroke="#ff7300" />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

---

## Testing

### Playwright (E2E) + Vitest (Unit)

**Decision**: Use Playwright for E2E, Vitest for unit/component tests

**Evidence from Reference Codebases**:
- agentic_platform: Playwright (34+ E2E specs, visual regression)
- kailash_workflow_studio: NO TESTS (major gap)
- xaiflow: NO TESTS (major gap)

**Configuration**:
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## Icons

### Lucide React

**Decision**: Use Lucide React for consistent iconography

**Evidence from Reference Codebases**:
- All three use Lucide React
- Consistent, tree-shakeable, well-maintained

**Usage**:
```typescript
import { Plus, Trash2, Settings, Play, ChevronDown } from 'lucide-react'

<Button>
  <Plus className="w-4 h-4 mr-2" />
  Add Agent
</Button>
```

---

## Package Summary

```json
// package.json dependencies
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",

    "@tanstack/react-query": "^5.80.0",
    "zustand": "^5.0.0",

    "@xyflow/react": "^12.7.0",

    "axios": "^1.7.0",

    "react-hook-form": "^7.58.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.25.0",

    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",

    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",

    "recharts": "^2.15.0",
    "lucide-react": "^0.460.0",

    "react-markdown": "^10.1.0",
    "react-syntax-highlighter": "^15.6.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.0",

    "tailwindcss": "^4.0.0",

    "@playwright/test": "^1.49.0",
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.0.0",

    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```
