# Testing Strategy

**Date**: 2025-12-11
**Status**: Planning

---

## Overview

This document defines the testing strategy for Kaizen Studio frontend, based on:
- **agentic_platform**: 34+ E2E specs with Playwright
- **Enterprise requirement**: High test coverage for reliability
- **Gap in reference codebases**: kailash_workflow_studio and xaiflow have NO TESTS

---

## Testing Pyramid

```
                    ┌───────────────┐
                    │     E2E       │  Playwright
                    │   (10-20%)    │  Critical user journeys
                    ├───────────────┤
                    │  Integration  │  React Testing Library
                    │   (20-30%)    │  Component interactions
                    ├───────────────┤
                    │     Unit      │  Vitest
                    │   (60-70%)    │  Pure logic, utilities
                    └───────────────┘
```

---

## Tool Selection

| Type | Tool | Purpose |
|------|------|---------|
| Unit | Vitest | Fast, Vite-native test runner |
| Component | React Testing Library | Component behavior testing |
| E2E | Playwright | Browser automation, visual regression |
| Mocking | MSW | API mocking for integration tests |
| Coverage | c8/istanbul | Code coverage reporting |

---

## Unit Tests (Vitest)

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

### Unit Test Example - Utility Functions

```typescript
// lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatNumber, truncate } from './utils'

describe('cn (classnames)', () => {
  it('merges classes correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-01-15T10:30:00')
    expect(formatDate(date)).toContain('Jan')
    expect(formatDate(date)).toContain('15')
  })
})

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...')
  })

  it('returns short strings unchanged', () => {
    expect(truncate('Hi', 5)).toBe('Hi')
  })
})
```

### Unit Test Example - Zustand Store

```typescript
// stores/authStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      isAuthenticated: false,
    })
  })

  it('initializes with empty state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('sets user on login', () => {
    const user = { id: '1', email: 'test@example.com', full_name: 'Test User' }
    const tokens = { access: 'access-token', refresh: 'refresh-token' }

    useAuthStore.getState().login(user, tokens)

    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.accessToken).toBe('access-token')
    expect(state.isAuthenticated).toBe(true)
  })

  it('clears state on logout', () => {
    // First login
    useAuthStore.getState().login(
      { id: '1', email: 'test@example.com' },
      { access: 'token', refresh: 'refresh' }
    )

    // Then logout
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('checks permissions correctly', () => {
    useAuthStore.setState({ permissions: ['agents:read', 'agents:create'] })

    expect(useAuthStore.getState().hasPermission('agents:read')).toBe(true)
    expect(useAuthStore.getState().hasPermission('agents:delete')).toBe(false)
  })

  it('grants all permissions to admin', () => {
    useAuthStore.setState({
      user: { role: 'admin' },
      permissions: [],
    })

    expect(useAuthStore.getState().hasPermission('anything')).toBe(true)
  })
})
```

---

## Component Tests (React Testing Library)

### Test Utilities

```typescript
// src/test/utils.tsx
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Create a fresh query client for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

interface AllProvidersProps {
  children: React.ReactNode
}

function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Component Test Example

```typescript
// features/agents/components/AgentCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { AgentCard } from './AgentCard'

const mockAgent = {
  id: '1',
  name: 'Test Agent',
  description: 'A test agent',
  provider: 'openai',
  model: 'gpt-4',
  status: 'active',
}

describe('AgentCard', () => {
  it('renders agent information', () => {
    render(
      <AgentCard
        agent={mockAgent}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDeploy={vi.fn()}
      />
    )

    expect(screen.getByText('Test Agent')).toBeInTheDocument()
    expect(screen.getByText('A test agent')).toBeInTheDocument()
    expect(screen.getByText('openai')).toBeInTheDocument()
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    render(
      <AgentCard
        agent={mockAgent}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onDeploy={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    render(
      <AgentCard
        agent={mockAgent}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onDeploy={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('shows status badge with correct status', () => {
    render(
      <AgentCard
        agent={{ ...mockAgent, status: 'active' }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDeploy={vi.fn()}
      />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
```

---

## E2E Tests (Playwright)

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Example - Authentication

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Kaizen Studio' })).toBeVisible()
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder('you@company.com').fill('test@example.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder('you@company.com').fill('wrong@example.com')
    await page.getByPlaceholder('••••••••').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/agents')
    await expect(page).toHaveURL('/login')
  })
})
```

### E2E Test Example - Agent Management

```typescript
// e2e/agents.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Agent Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.getByPlaceholder('you@company.com').fill('test@example.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display agents list', async ({ page }) => {
    await page.goto('/agents')
    await expect(page.getByRole('heading', { name: 'Agents' })).toBeVisible()
  })

  test('should create new agent', async ({ page }) => {
    await page.goto('/agents')
    await page.getByRole('button', { name: 'Create Agent' }).click()

    // Fill form
    await page.getByLabel('Name').fill('Test Agent')
    await page.getByLabel('System Prompt').fill('You are a helpful assistant.')
    await page.getByLabel('Provider').click()
    await page.getByRole('option', { name: 'OpenAI' }).click()
    await page.getByLabel('Model').fill('gpt-4')

    // Submit
    await page.getByRole('button', { name: 'Save Agent' }).click()

    // Verify success
    await expect(page.getByText('Agent created successfully')).toBeVisible()
    await expect(page.getByText('Test Agent')).toBeVisible()
  })

  test('should edit existing agent', async ({ page }) => {
    await page.goto('/agents')

    // Click edit on first agent
    await page.getByRole('button', { name: 'Edit' }).first().click()

    // Modify name
    await page.getByLabel('Name').fill('Updated Agent Name')
    await page.getByRole('button', { name: 'Save Agent' }).click()

    // Verify success
    await expect(page.getByText('Agent updated successfully')).toBeVisible()
  })

  test('should delete agent', async ({ page }) => {
    await page.goto('/agents')

    // Click delete on first agent
    await page.getByRole('button', { name: 'Delete' }).first().click()

    // Confirm deletion
    await page.getByRole('button', { name: 'Confirm' }).click()

    // Verify success
    await expect(page.getByText('Agent deleted successfully')).toBeVisible()
  })
})
```

### E2E Test Example - Pipeline Canvas

```typescript
// e2e/pipeline-canvas.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Pipeline Canvas', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByPlaceholder('you@company.com').fill('test@example.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('/dashboard')
  })

  test('should create new pipeline', async ({ page }) => {
    await page.goto('/pipelines/new')

    // Verify canvas is visible
    await expect(page.locator('.react-flow')).toBeVisible()

    // Verify node palette is visible
    await expect(page.getByText('Node Types')).toBeVisible()
  })

  test('should drag and drop agent node', async ({ page }) => {
    await page.goto('/pipelines/new')

    // Get palette item and canvas
    const agentPaletteItem = page.getByText('Agent').locator('..')
    const canvas = page.locator('.react-flow')

    // Drag and drop
    await agentPaletteItem.dragTo(canvas)

    // Verify node was created
    await expect(page.locator('.react-flow__node')).toBeVisible()
  })

  test('should connect two nodes', async ({ page }) => {
    await page.goto('/pipelines/new')

    // Create two nodes by dragging from palette
    const agentPaletteItem = page.getByText('Agent').locator('..')
    const canvas = page.locator('.react-flow')

    // Drag first node
    await agentPaletteItem.dragTo(canvas, { targetPosition: { x: 250, y: 100 } })

    // Drag second node
    await agentPaletteItem.dragTo(canvas, { targetPosition: { x: 250, y: 300 } })

    // Connect nodes by dragging from source handle to target handle
    const sourceHandle = page.locator('.react-flow__handle-bottom').first()
    const targetHandle = page.locator('.react-flow__handle-top').last()

    await sourceHandle.dragTo(targetHandle)

    // Verify edge was created
    await expect(page.locator('.react-flow__edge')).toBeVisible()
  })

  test('should save pipeline', async ({ page }) => {
    await page.goto('/pipelines/new')

    // Add a node
    const agentPaletteItem = page.getByText('Agent').locator('..')
    const canvas = page.locator('.react-flow')
    await agentPaletteItem.dragTo(canvas)

    // Save pipeline
    await page.getByRole('button', { name: 'Save' }).click()

    // Enter pipeline name in dialog
    await page.getByLabel('Pipeline Name').fill('Test Pipeline')
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify success
    await expect(page.getByText('Pipeline saved')).toBeVisible()
  })
})
```

---

## API Mocking (MSW)

### Setup

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth handlers
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
    })
  }),

  http.get('/api/v1/users/me', () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User',
      organization_id: 'org-1',
      role: 'admin',
    })
  }),

  // Agents handlers
  http.get('/api/v1/agents', () => {
    return HttpResponse.json({
      items: [
        { id: '1', name: 'Agent 1', status: 'active' },
        { id: '2', name: 'Agent 2', status: 'draft' },
      ],
      total: 2,
      page: 1,
      page_size: 10,
      total_pages: 1,
    })
  }),

  http.post('/api/v1/agents', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'new-agent-id',
      ...body,
      created_at: new Date().toISOString(),
    })
  }),
]

// src/test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// src/test/setup.ts (add to existing)
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

## Coverage Requirements

| Area | Target |
|------|--------|
| Overall | 80% |
| Stores | 90% |
| Utilities | 100% |
| Components | 70% |
| E2E Critical Paths | 100% |

---

## CI Integration

```yaml
# .github/workflows/frontend-test.yml
name: Frontend Tests

on:
  push:
    paths:
      - 'frontend/**'
  pull_request:
    paths:
      - 'frontend/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [02-architecture.md](02-architecture.md) | Component structure |
| [04-state-management.md](04-state-management.md) | Store testing |
