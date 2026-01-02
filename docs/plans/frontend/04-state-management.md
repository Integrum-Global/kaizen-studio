# State Management

**Date**: 2025-12-11
**Status**: Planning

---

## Overview

This document defines the state management strategy for Kaizen Studio:
- **Server State**: React Query (TanStack Query) for API data
- **Client State**: Zustand for UI state, canvas state, auth
- **Form State**: React Hook Form with Zod validation

### Key Learning from kailash_workflow_studio
The original workflowStore.ts was **2,273 lines** - a monolithic store handling everything. This caused:
- Hard to maintain and test
- Re-renders across unrelated components
- Difficult to understand data flow

**Our approach**: Split into focused domain stores.

---

## State Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                      State Management                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Server State (React Query)           Client State (Zustand)    │
│  ─────────────────────────           ─────────────────────────  │
│  • Agents list/detail                 • Auth (user, token)     │
│  • Pipelines list/detail              • UI (modals, sidebar)   │
│  • Deployments                        • Canvas (nodes, edges)   │
│  • Metrics                            • History (undo/redo)     │
│  • Teams/Users                        • Execution (test state)  │
│  • Policies                                                     │
│                                                                 │
│  Cached, invalidated automatically    Persisted locally        │
│  Refetched on stale/focus             Sync across tabs          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## React Query Setup

### Query Client Configuration

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Keep in cache for 10 minutes after unmount
      gcTime: 10 * 60 * 1000,

      // Retry failed requests twice
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Don't refetch on window focus (prevents disruption)
      refetchOnWindowFocus: false,

      // Refetch when reconnecting
      refetchOnReconnect: true,

      // Network mode: always try (for offline support)
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
})
```

### Query Keys

```typescript
// lib/queryKeys.ts
export const queryKeys = {
  // Agents
  agents: {
    all: ['agents'] as const,
    lists: () => [...queryKeys.agents.all, 'list'] as const,
    list: (filters: AgentFilters) => [...queryKeys.agents.lists(), filters] as const,
    details: () => [...queryKeys.agents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.agents.details(), id] as const,
    versions: (id: string) => [...queryKeys.agents.detail(id), 'versions'] as const,
  },

  // Pipelines
  pipelines: {
    all: ['pipelines'] as const,
    lists: () => [...queryKeys.pipelines.all, 'list'] as const,
    list: (filters: PipelineFilters) => [...queryKeys.pipelines.lists(), filters] as const,
    details: () => [...queryKeys.pipelines.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.pipelines.details(), id] as const,
  },

  // Deployments
  deployments: {
    all: ['deployments'] as const,
    lists: () => [...queryKeys.deployments.all, 'list'] as const,
    list: (filters: DeploymentFilters) => [...queryKeys.deployments.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.deployments.all, 'detail', id] as const,
  },

  // Metrics
  metrics: {
    all: ['metrics'] as const,
    summary: (deploymentId: string) => [...queryKeys.metrics.all, 'summary', deploymentId] as const,
    timeseries: (deploymentId: string, range: string) =>
      [...queryKeys.metrics.all, 'timeseries', deploymentId, range] as const,
  },

  // Teams & Users
  teams: {
    all: ['teams'] as const,
    list: () => [...queryKeys.teams.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.teams.all, 'detail', id] as const,
    members: (id: string) => [...queryKeys.teams.detail(id), 'members'] as const,
  },

  // Governance
  policies: {
    all: ['policies'] as const,
    list: () => [...queryKeys.policies.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.policies.all, 'detail', id] as const,
  },

  // Current user
  user: {
    current: ['user', 'current'] as const,
    permissions: ['user', 'permissions'] as const,
  },
}
```

### Query Hooks Example

```typescript
// features/agents/hooks/useAgents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { agentService } from '@/services/api/agents'
import type { Agent, AgentFilters, CreateAgentInput } from '@/types/models'

// List agents
export function useAgents(filters: AgentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.agents.list(filters),
    queryFn: () => agentService.list(filters),
  })
}

// Get single agent
export function useAgent(id: string) {
  return useQuery({
    queryKey: queryKeys.agents.detail(id),
    queryFn: () => agentService.get(id),
    enabled: !!id,
  })
}

// Create agent
export function useCreateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAgentInput) => agentService.create(data),
    onSuccess: () => {
      // Invalidate all agent lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.lists() })
    },
  })
}

// Update agent
export function useUpdateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Agent> }) =>
      agentService.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific agent and lists
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.lists() })
    },
  })
}

// Delete agent
export function useDeleteAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => agentService.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: queryKeys.agents.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.lists() })
    },
  })
}
```

### Optimistic Updates

```typescript
// features/agents/hooks/useToggleAgentStatus.ts
export function useToggleAgentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      agentService.setActive(id, active),

    // Optimistic update
    onMutate: async ({ id, active }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.agents.detail(id) })

      // Snapshot previous value
      const previous = queryClient.getQueryData<Agent>(queryKeys.agents.detail(id))

      // Optimistically update
      if (previous) {
        queryClient.setQueryData<Agent>(queryKeys.agents.detail(id), {
          ...previous,
          is_active: active,
        })
      }

      return { previous }
    },

    // Rollback on error
    onError: (_, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.agents.detail(id), context.previous)
      }
    },

    // Refetch after success or error
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(id) })
    },
  })
}
```

---

## Zustand Stores

### Auth Store

```typescript
// stores/authStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'

interface User {
  id: string
  email: string
  full_name: string
  organization_id: string
  role: string
}

interface AuthState {
  // State
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (user: User, tokens: { access: string; refresh: string }) => void
  logout: () => void
  setUser: (user: User) => void
  setTokens: (tokens: { access: string; refresh: string }) => void
  setPermissions: (permissions: string[]) => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        accessToken: null,
        refreshToken: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: true,

        // Actions
        login: (user, tokens) =>
          set({
            user,
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
            isAuthenticated: true,
            isLoading: false,
          }),

        logout: () =>
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            permissions: [],
            isAuthenticated: false,
            isLoading: false,
          }),

        setUser: (user) => set({ user }),

        setTokens: (tokens) =>
          set({
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
          }),

        setPermissions: (permissions) => set({ permissions }),

        hasPermission: (permission) => {
          const { permissions, user } = get()
          // Admin has all permissions
          if (user?.role === 'admin') return true
          return permissions.includes(permission)
        },
      }),
      {
        name: 'kaizen-auth',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          user: state.user,
        }),
      }
    ),
    { name: 'authStore' }
  )
)
```

### UI Store

```typescript
// stores/uiStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // Theme
  theme: Theme

  // Modals
  activeModal: string | null
  modalData: Record<string, unknown>

  // Notifications
  notifications: Notification[]

  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: Theme) => void
  openModal: (name: string, data?: Record<string, unknown>) => void
  closeModal: () => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'system',
      activeModal: null,
      modalData: {},
      notifications: [],

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setTheme: (theme) => set({ theme }),

      openModal: (name, data = {}) =>
        set({ activeModal: name, modalData: data }),

      closeModal: () =>
        set({ activeModal: null, modalData: {} }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id: crypto.randomUUID() },
          ],
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'kaizen-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
```

### Canvas Store (Pipeline Editor)

```typescript
// stores/canvasStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'

interface CanvasState {
  // State
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  isDirty: boolean
  pipelineId: string | null
  pipelineName: string

  // Actions
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (node: Node) => void
  deleteNode: (id: string) => void
  updateNodeData: (id: string, data: Partial<Node['data']>) => void
  setSelection: (nodeId: string | null, edgeId?: string | null) => void
  loadPipeline: (pipeline: { id: string; name: string; nodes: Node[]; edges: Edge[] }) => void
  clearCanvas: () => void
  markClean: () => void
}

export const useCanvasStore = create<CanvasState>()(
  devtools(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      isDirty: false,
      pipelineId: null,
      pipelineName: 'Untitled Pipeline',

      // Actions
      setNodes: (nodes) => set({ nodes, isDirty: true }),

      setEdges: (edges) => set({ edges, isDirty: true }),

      onNodesChange: (changes) =>
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes),
          isDirty: true,
        })),

      onEdgesChange: (changes) =>
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
          isDirty: true,
        })),

      onConnect: (connection) =>
        set((state) => ({
          edges: addEdge(connection, state.edges),
          isDirty: true,
        })),

      addNode: (node) =>
        set((state) => ({
          nodes: [...state.nodes, node],
          isDirty: true,
        })),

      deleteNode: (id) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
          isDirty: true,
        })),

      updateNodeData: (id, data) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, ...data } } : node
          ),
          isDirty: true,
        })),

      setSelection: (nodeId, edgeId = null) =>
        set({ selectedNodeId: nodeId, selectedEdgeId: edgeId }),

      loadPipeline: (pipeline) =>
        set({
          pipelineId: pipeline.id,
          pipelineName: pipeline.name,
          nodes: pipeline.nodes,
          edges: pipeline.edges,
          isDirty: false,
          selectedNodeId: null,
          selectedEdgeId: null,
        }),

      clearCanvas: () =>
        set({
          nodes: [],
          edges: [],
          pipelineId: null,
          pipelineName: 'Untitled Pipeline',
          isDirty: false,
          selectedNodeId: null,
          selectedEdgeId: null,
        }),

      markClean: () => set({ isDirty: false }),
    }),
    { name: 'canvasStore' }
  )
)
```

### History Store (Undo/Redo)

```typescript
// stores/historyStore.ts
import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'

interface CanvasSnapshot {
  nodes: Node[]
  edges: Edge[]
  timestamp: number
}

interface HistoryState {
  past: CanvasSnapshot[]
  future: CanvasSnapshot[]
  maxHistory: number

  // Actions
  pushState: (snapshot: Omit<CanvasSnapshot, 'timestamp'>) => void
  undo: () => CanvasSnapshot | null
  redo: () => CanvasSnapshot | null
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],
  maxHistory: 100,

  pushState: (snapshot) =>
    set((state) => {
      const newPast = [
        ...state.past,
        { ...snapshot, timestamp: Date.now() },
      ].slice(-state.maxHistory)

      return {
        past: newPast,
        future: [], // Clear redo stack on new action
      }
    }),

  undo: () => {
    const { past, future } = get()
    if (past.length === 0) return null

    const previous = past[past.length - 1]
    const newPast = past.slice(0, -1)

    set({ past: newPast, future: [previous, ...future] })
    return previous
  },

  redo: () => {
    const { past, future } = get()
    if (future.length === 0) return null

    const next = future[0]
    const newFuture = future.slice(1)

    set({ past: [...past, next], future: newFuture })
    return next
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),
}))
```

### Execution Store (Test Panel)

```typescript
// stores/executionStore.ts
import { create } from 'zustand'

type ExecutionStatus = 'idle' | 'preparing' | 'running' | 'completed' | 'failed' | 'cancelled'

interface ExecutionLog {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  nodeId?: string
  message: string
  data?: unknown
}

interface ExecutionResult {
  success: boolean
  duration: number
  output: unknown
  nodeResults: Record<string, { status: string; output?: unknown; error?: string }>
}

interface ExecutionState {
  // State
  status: ExecutionStatus
  logs: ExecutionLog[]
  result: ExecutionResult | null
  currentNodeId: string | null
  progress: number
  startTime: Date | null

  // Actions
  startExecution: () => void
  setProgress: (progress: number, currentNodeId?: string) => void
  addLog: (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => void
  setResult: (result: ExecutionResult) => void
  setFailed: (error: string) => void
  cancel: () => void
  reset: () => void
}

export const useExecutionStore = create<ExecutionState>()((set) => ({
  // Initial state
  status: 'idle',
  logs: [],
  result: null,
  currentNodeId: null,
  progress: 0,
  startTime: null,

  // Actions
  startExecution: () =>
    set({
      status: 'running',
      logs: [],
      result: null,
      currentNodeId: null,
      progress: 0,
      startTime: new Date(),
    }),

  setProgress: (progress, currentNodeId) =>
    set({ progress, currentNodeId }),

  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          ...log,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),

  setResult: (result) =>
    set({
      status: result.success ? 'completed' : 'failed',
      result,
      progress: 100,
      currentNodeId: null,
    }),

  setFailed: (error) =>
    set({
      status: 'failed',
      logs: (state) => [
        ...state.logs,
        {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          level: 'error',
          message: error,
        },
      ],
    }),

  cancel: () =>
    set({
      status: 'cancelled',
      currentNodeId: null,
    }),

  reset: () =>
    set({
      status: 'idle',
      logs: [],
      result: null,
      currentNodeId: null,
      progress: 0,
      startTime: null,
    }),
}))
```

---

## Form State (React Hook Form)

### Form with Zod Validation

```typescript
// features/agents/schemas/agent.ts
import { z } from 'zod'

export const agentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),

  system_prompt: z
    .string()
    .min(10, 'System prompt must be at least 10 characters'),

  provider: z.enum(['openai', 'anthropic', 'azure', 'ollama'], {
    required_error: 'Provider is required',
  }),

  model: z.string().min(1, 'Model is required'),

  temperature: z
    .number()
    .min(0, 'Temperature must be at least 0')
    .max(2, 'Temperature must be at most 2')
    .default(0.7),

  max_tokens: z
    .number()
    .int()
    .positive()
    .max(128000)
    .optional(),

  tools: z.array(z.string()).default([]),
})

export type AgentFormData = z.infer<typeof agentSchema>
```

### Form Component

```typescript
// features/agents/components/AgentForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { agentSchema, AgentFormData } from '../schemas/agent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AgentFormProps {
  defaultValues?: Partial<AgentFormData>
  onSubmit: (data: AgentFormData) => void
  isSubmitting?: boolean
}

export function AgentForm({ defaultValues, onSubmit, isSubmitting }: AgentFormProps) {
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      description: '',
      system_prompt: '',
      provider: 'openai',
      model: '',
      temperature: 0.7,
      tools: [],
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Agent" {...field} />
              </FormControl>
              <FormDescription>
                A unique name for your agent.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="azure">Azure OpenAI</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Additional fields... */}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Agent'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## State Synchronization

### Auto-Save Pattern

```typescript
// hooks/useAutoSave.ts
import { useEffect, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useCanvasStore } from '@/stores/canvasStore'
import { useUpdatePipeline } from '@/features/pipelines/hooks/usePipelines'

export function useAutoSave() {
  const { pipelineId, nodes, edges, isDirty, markClean } = useCanvasStore()
  const updatePipeline = useUpdatePipeline()
  const isFirstMount = useRef(true)

  const save = useDebouncedCallback(async () => {
    if (!pipelineId || !isDirty) return

    try {
      await updatePipeline.mutateAsync({
        id: pipelineId,
        data: { nodes, edges },
      })
      markClean()
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, 2000) // 2 second debounce

  useEffect(() => {
    // Skip first mount
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    if (isDirty) {
      save()
    }
  }, [nodes, edges, isDirty, save])

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  return {
    isSaving: updatePipeline.isPending,
    lastSaved: updatePipeline.data?.updated_at,
  }
}
```

### Cross-Tab Sync

```typescript
// stores/authStore.ts (with broadcast channel)
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Create broadcast channel for cross-tab sync
const authChannel = new BroadcastChannel('kaizen-auth')

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      // Listen for changes from other tabs
      authChannel.onmessage = (event) => {
        if (event.data.type === 'LOGOUT') {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          })
        } else if (event.data.type === 'LOGIN') {
          set({
            user: event.data.user,
            accessToken: event.data.accessToken,
            refreshToken: event.data.refreshToken,
            isAuthenticated: true,
          })
        }
      }

      return {
        // ... state

        logout: () => {
          // Notify other tabs
          authChannel.postMessage({ type: 'LOGOUT' })
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          })
        },

        login: (user, tokens) => {
          // Notify other tabs
          authChannel.postMessage({
            type: 'LOGIN',
            user,
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
          })
          set({
            user,
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
            isAuthenticated: true,
          })
        },
      }
    },
    { name: 'kaizen-auth', storage: createJSONStorage(() => localStorage) }
  )
)
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [02-architecture.md](02-architecture.md) | Data flow architecture |
| [05-api-integration.md](05-api-integration.md) | API services |
| [06-workflow-canvas.md](06-workflow-canvas.md) | Canvas state usage |
