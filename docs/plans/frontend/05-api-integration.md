# API Integration

**Date**: 2025-12-11
**Status**: Planning

---

## Overview

This document defines the API integration layer for Kaizen Studio frontend, connecting to the FastAPI backend.

### Backend API Details
- **Base URL**: `http://localhost:8000` (dev), `https://api.kaizen.io` (prod)
- **API Prefix**: `/api/v1`
- **Auth**: JWT Bearer tokens with refresh
- **Docs**: `/docs` (Swagger), `/redoc` (ReDoc)

---

## API Client Setup

### Axios Instance

```typescript
// services/api/client.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors and refresh token
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: Error) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else if (token) {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token: newRefreshToken } = response.data

        useAuthStore.getState().setTokens({
          access: access_token,
          refresh: newRefreshToken || refreshToken,
        })

        processQueue(null, access_token)

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
```

### Error Types

```typescript
// types/api.ts
export interface ApiError {
  detail: string | ValidationError[]
  status_code: number
}

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}
```

### Error Handling Utility

```typescript
// lib/apiError.ts
import { AxiosError } from 'axios'
import { ApiError, ValidationError } from '@/types/api'

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError | undefined

    if (apiError?.detail) {
      if (typeof apiError.detail === 'string') {
        return apiError.detail
      }
      // Validation errors
      if (Array.isArray(apiError.detail)) {
        return apiError.detail
          .map((e: ValidationError) => `${e.loc.join('.')}: ${e.msg}`)
          .join(', ')
      }
    }

    // HTTP status messages
    switch (error.response?.status) {
      case 400:
        return 'Bad request. Please check your input.'
      case 401:
        return 'Session expired. Please log in again.'
      case 403:
        return 'You do not have permission to perform this action.'
      case 404:
        return 'Resource not found.'
      case 409:
        return 'Resource already exists.'
      case 422:
        return 'Validation failed. Please check your input.'
      case 429:
        return 'Too many requests. Please try again later.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return 'An unexpected error occurred.'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred.'
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof AxiosError && !error.response
}
```

---

## Service Layer

### Base Service Pattern

```typescript
// services/api/base.ts
import { apiClient } from './client'
import type { PaginatedResponse } from '@/types/api'

export interface ListParams {
  page?: number
  page_size?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export abstract class BaseService<T, CreateDTO, UpdateDTO> {
  constructor(protected readonly endpoint: string) {}

  async list(params: ListParams = {}): Promise<PaginatedResponse<T>> {
    const response = await apiClient.get<PaginatedResponse<T>>(this.endpoint, {
      params,
    })
    return response.data
  }

  async get(id: string): Promise<T> {
    const response = await apiClient.get<T>(`${this.endpoint}/${id}`)
    return response.data
  }

  async create(data: CreateDTO): Promise<T> {
    const response = await apiClient.post<T>(this.endpoint, data)
    return response.data
  }

  async update(id: string, data: UpdateDTO): Promise<T> {
    const response = await apiClient.patch<T>(`${this.endpoint}/${id}`, data)
    return response.data
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.endpoint}/${id}`)
  }
}
```

### Agent Service

```typescript
// services/api/agents.ts
import { apiClient } from './client'
import type { Agent, CreateAgentInput, UpdateAgentInput } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'

export interface AgentFilters {
  page?: number
  page_size?: number
  search?: string
  status?: 'active' | 'inactive' | 'draft'
  provider?: string
}

export const agentService = {
  // List agents
  async list(filters: AgentFilters = {}): Promise<PaginatedResponse<Agent>> {
    const response = await apiClient.get<PaginatedResponse<Agent>>('/agents', {
      params: filters,
    })
    return response.data
  },

  // Get single agent
  async get(id: string): Promise<Agent> {
    const response = await apiClient.get<Agent>(`/agents/${id}`)
    return response.data
  },

  // Create agent
  async create(data: CreateAgentInput): Promise<Agent> {
    const response = await apiClient.post<Agent>('/agents', data)
    return response.data
  },

  // Update agent
  async update(id: string, data: UpdateAgentInput): Promise<Agent> {
    const response = await apiClient.patch<Agent>(`/agents/${id}`, data)
    return response.data
  },

  // Delete agent
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/agents/${id}`)
  },

  // Get agent versions
  async getVersions(id: string): Promise<AgentVersion[]> {
    const response = await apiClient.get<AgentVersion[]>(`/agents/${id}/versions`)
    return response.data
  },

  // Create new version
  async createVersion(id: string): Promise<AgentVersion> {
    const response = await apiClient.post<AgentVersion>(`/agents/${id}/versions`)
    return response.data
  },

  // Activate/deactivate
  async setActive(id: string, active: boolean): Promise<Agent> {
    const response = await apiClient.patch<Agent>(`/agents/${id}`, {
      is_active: active,
    })
    return response.data
  },
}
```

### Pipeline Service

```typescript
// services/api/pipelines.ts
import { apiClient } from './client'
import type { Pipeline, CreatePipelineInput, UpdatePipelineInput } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'

export interface PipelineFilters {
  page?: number
  page_size?: number
  search?: string
  status?: string
}

export const pipelineService = {
  async list(filters: PipelineFilters = {}): Promise<PaginatedResponse<Pipeline>> {
    const response = await apiClient.get<PaginatedResponse<Pipeline>>('/pipelines', {
      params: filters,
    })
    return response.data
  },

  async get(id: string): Promise<Pipeline> {
    const response = await apiClient.get<Pipeline>(`/pipelines/${id}`)
    return response.data
  },

  async create(data: CreatePipelineInput): Promise<Pipeline> {
    const response = await apiClient.post<Pipeline>('/pipelines', data)
    return response.data
  },

  async update(id: string, data: UpdatePipelineInput): Promise<Pipeline> {
    const response = await apiClient.patch<Pipeline>(`/pipelines/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/pipelines/${id}`)
  },

  // Get nodes for a pipeline
  async getNodes(id: string): Promise<PipelineNode[]> {
    const response = await apiClient.get<PipelineNode[]>(`/pipelines/${id}/nodes`)
    return response.data
  },

  // Update pipeline nodes (batch)
  async updateNodes(id: string, nodes: PipelineNode[], edges: PipelineEdge[]): Promise<void> {
    await apiClient.put(`/pipelines/${id}/nodes`, { nodes, edges })
  },
}
```

### Auth Service

```typescript
// services/api/auth.ts
import axios from 'axios'
import { apiClient } from './client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  organization_name?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  full_name: string
  organization_id: string
  role: string
  is_active: boolean
  created_at: string
}

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    // Use form data for OAuth2 password flow
    const formData = new URLSearchParams()
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)

    const response = await axios.post<AuthTokens>(
      `${API_BASE_URL}/api/v1/auth/login`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    return response.data
  },

  // Register
  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, data)
    return response.data
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/users/me')
    return response.data
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await axios.post<AuthTokens>(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      { refresh_token: refreshToken }
    )
    return response.data
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignore errors - just clear local state
    }
  },

  // SSO initiate
  async ssoInitiate(provider: string): Promise<{ authorization_url: string }> {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/sso/${provider}/authorize`
    )
    return response.data
  },

  // SSO callback
  async ssoCallback(provider: string, code: string, state: string): Promise<AuthTokens> {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/sso/${provider}/callback`,
      { code, state }
    )
    return response.data
  },
}
```

### Deployment Service

```typescript
// services/api/deployments.ts
import { apiClient } from './client'
import type { Deployment, CreateDeploymentInput } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'

export interface DeploymentFilters {
  page?: number
  page_size?: number
  environment?: 'development' | 'staging' | 'production'
  status?: string
  pipeline_id?: string
}

export const deploymentService = {
  async list(filters: DeploymentFilters = {}): Promise<PaginatedResponse<Deployment>> {
    const response = await apiClient.get<PaginatedResponse<Deployment>>('/deployments', {
      params: filters,
    })
    return response.data
  },

  async get(id: string): Promise<Deployment> {
    const response = await apiClient.get<Deployment>(`/deployments/${id}`)
    return response.data
  },

  async create(data: CreateDeploymentInput): Promise<Deployment> {
    const response = await apiClient.post<Deployment>('/deployments', data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/deployments/${id}`)
  },

  // Deploy a pipeline to an environment
  async deploy(pipelineId: string, environment: string): Promise<Deployment> {
    const response = await apiClient.post<Deployment>('/deployments', {
      pipeline_id: pipelineId,
      environment,
    })
    return response.data
  },

  // Promote deployment to next environment
  async promote(id: string, targetEnvironment: string): Promise<Deployment> {
    const response = await apiClient.post<Deployment>(`/deployments/${id}/promote`, {
      target_environment: targetEnvironment,
    })
    return response.data
  },

  // Rollback deployment
  async rollback(id: string): Promise<Deployment> {
    const response = await apiClient.post<Deployment>(`/deployments/${id}/rollback`)
    return response.data
  },

  // Get deployment logs
  async getLogs(id: string): Promise<DeploymentLog[]> {
    const response = await apiClient.get<DeploymentLog[]>(`/deployments/${id}/logs`)
    return response.data
  },
}
```

### Metrics Service

```typescript
// services/api/metrics.ts
import { apiClient } from './client'

export interface MetricsSummary {
  total_requests: number
  success_rate: number
  avg_latency_ms: number
  p95_latency_ms: number
  p99_latency_ms: number
  error_count: number
}

export interface TimeseriesPoint {
  timestamp: string
  value: number
}

export interface MetricsTimeseries {
  requests: TimeseriesPoint[]
  latency_p50: TimeseriesPoint[]
  latency_p95: TimeseriesPoint[]
  latency_p99: TimeseriesPoint[]
  errors: TimeseriesPoint[]
}

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'

export const metricsService = {
  // Get metrics summary for a deployment
  async getSummary(deploymentId: string, range: TimeRange = '24h'): Promise<MetricsSummary> {
    const response = await apiClient.get<MetricsSummary>(
      `/metrics/${deploymentId}/summary`,
      { params: { range } }
    )
    return response.data
  },

  // Get timeseries metrics
  async getTimeseries(
    deploymentId: string,
    range: TimeRange = '24h'
  ): Promise<MetricsTimeseries> {
    const response = await apiClient.get<MetricsTimeseries>(
      `/metrics/${deploymentId}/timeseries`,
      { params: { range } }
    )
    return response.data
  },

  // Get execution metrics for a specific execution
  async getExecutionMetrics(executionId: string): Promise<ExecutionMetrics> {
    const response = await apiClient.get<ExecutionMetrics>(
      `/metrics/executions/${executionId}`
    )
    return response.data
  },
}
```

### Test Execution Service

```typescript
// services/api/test.ts
import { apiClient } from './client'

export interface TestInput {
  pipeline_id: string
  input_data: Record<string, unknown>
}

export interface TestResult {
  execution_id: string
  status: 'success' | 'failed' | 'timeout'
  duration_ms: number
  output: unknown
  node_results: Record<string, NodeResult>
  logs: ExecutionLog[]
}

export interface NodeResult {
  node_id: string
  status: 'success' | 'failed' | 'skipped'
  duration_ms: number
  output?: unknown
  error?: string
}

export interface ExecutionLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  node_id?: string
  message: string
  data?: unknown
}

export const testService = {
  // Execute a test
  async execute(input: TestInput): Promise<TestResult> {
    const response = await apiClient.post<TestResult>('/test/execute', input)
    return response.data
  },

  // Get test result
  async getResult(executionId: string): Promise<TestResult> {
    const response = await apiClient.get<TestResult>(`/test/${executionId}`)
    return response.data
  },

  // List recent test executions
  async listExecutions(pipelineId: string): Promise<TestResult[]> {
    const response = await apiClient.get<TestResult[]>(`/test/pipeline/${pipelineId}`)
    return response.data
  },
}
```

---

## WebSocket Integration

### Execution Streaming

```typescript
// services/websocket/executionWs.ts
import { useExecutionStore } from '@/stores/executionStore'

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export interface ExecutionMessage {
  type: 'log' | 'progress' | 'node_start' | 'node_complete' | 'result' | 'error'
  data: unknown
}

export class ExecutionWebSocket {
  private ws: WebSocket | null = null
  private executionId: string | null = null

  connect(executionId: string, token: string): void {
    this.executionId = executionId
    this.ws = new WebSocket(
      `${WS_BASE_URL}/ws/executions/${executionId}?token=${token}`
    )

    this.ws.onopen = () => {
      console.log('WebSocket connected')
    }

    this.ws.onmessage = (event) => {
      const message: ExecutionMessage = JSON.parse(event.data)
      this.handleMessage(message)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      useExecutionStore.getState().addLog({
        level: 'error',
        message: 'Connection error',
      })
    }

    this.ws.onclose = () => {
      console.log('WebSocket closed')
    }
  }

  private handleMessage(message: ExecutionMessage): void {
    const store = useExecutionStore.getState()

    switch (message.type) {
      case 'log':
        store.addLog(message.data as ExecutionLog)
        break

      case 'progress':
        const { progress, node_id } = message.data as { progress: number; node_id?: string }
        store.setProgress(progress, node_id)
        break

      case 'node_start':
        store.addLog({
          level: 'info',
          nodeId: (message.data as { node_id: string }).node_id,
          message: 'Node started',
        })
        break

      case 'node_complete':
        const nodeResult = message.data as NodeResult
        store.addLog({
          level: nodeResult.status === 'success' ? 'info' : 'error',
          nodeId: nodeResult.node_id,
          message: `Node ${nodeResult.status}`,
          data: nodeResult.output,
        })
        break

      case 'result':
        store.setResult(message.data as TestResult)
        break

      case 'error':
        store.setFailed((message.data as { message: string }).message)
        break
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(message: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }
}

// Singleton instance
export const executionWs = new ExecutionWebSocket()
```

### WebSocket Hook

```typescript
// hooks/useExecutionWebSocket.ts
import { useEffect, useRef } from 'react'
import { executionWs } from '@/services/websocket/executionWs'
import { useAuthStore } from '@/stores/authStore'
import { useExecutionStore } from '@/stores/executionStore'

export function useExecutionWebSocket(executionId: string | null) {
  const { accessToken } = useAuthStore()
  const { status } = useExecutionStore()
  const connectedRef = useRef(false)

  useEffect(() => {
    if (executionId && accessToken && status === 'running' && !connectedRef.current) {
      executionWs.connect(executionId, accessToken)
      connectedRef.current = true
    }

    return () => {
      if (connectedRef.current) {
        executionWs.disconnect()
        connectedRef.current = false
      }
    }
  }, [executionId, accessToken, status])

  return {
    send: (message: unknown) => executionWs.send(message),
    disconnect: () => executionWs.disconnect(),
  }
}
```

---

## API Types (Backend Models)

```typescript
// types/models.ts

// Agent
export interface Agent {
  id: string
  name: string
  description: string | null
  system_prompt: string
  provider: 'openai' | 'anthropic' | 'azure' | 'ollama'
  model: string
  temperature: number
  max_tokens: number | null
  tools: string[]
  is_active: boolean
  organization_id: string
  created_by_id: string
  created_at: string
  updated_at: string
}

export interface CreateAgentInput {
  name: string
  description?: string
  system_prompt: string
  provider: string
  model: string
  temperature?: number
  max_tokens?: number
  tools?: string[]
}

export type UpdateAgentInput = Partial<CreateAgentInput>

// Pipeline
export interface Pipeline {
  id: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'archived'
  pattern: string
  config: Record<string, unknown>
  organization_id: string
  created_by_id: string
  created_at: string
  updated_at: string
}

export interface PipelineNode {
  id: string
  pipeline_id: string
  node_type: 'agent' | 'supervisor' | 'router' | 'synthesizer' | 'connector'
  agent_id: string | null
  config: Record<string, unknown>
  position_x: number
  position_y: number
}

export interface PipelineConnection {
  id: string
  pipeline_id: string
  source_node_id: string
  target_node_id: string
  source_handle: string | null
  target_handle: string | null
}

// Deployment
export interface Deployment {
  id: string
  pipeline_id: string
  pipeline_version: number
  environment: 'development' | 'staging' | 'production'
  status: 'pending' | 'deploying' | 'active' | 'failed' | 'stopped'
  gateway_id: string
  config: Record<string, unknown>
  organization_id: string
  created_by_id: string
  created_at: string
  updated_at: string
}

// Team
export interface Team {
  id: string
  name: string
  description: string | null
  organization_id: string
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'admin' | 'member'
  user: {
    id: string
    email: string
    full_name: string
  }
}

// Policy
export interface Policy {
  id: string
  name: string
  description: string | null
  effect: 'allow' | 'deny'
  resource_type: string
  actions: string[]
  conditions: PolicyCondition[]
  organization_id: string
}

export interface PolicyCondition {
  attribute: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'contains' | 'regex'
  value: unknown
}
```

---

## Environment Configuration

```typescript
// .env.development
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

// .env.production
VITE_API_URL=https://api.kaizen.io
VITE_WS_URL=wss://api.kaizen.io

// lib/env.ts
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [04-state-management.md](04-state-management.md) | React Query hooks |
| [07-authentication.md](07-authentication.md) | Auth service usage |
| Backend API Docs | http://localhost:8000/docs |
