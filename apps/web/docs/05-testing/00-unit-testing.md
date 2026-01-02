# Unit Testing

Unit tests use Vitest with React Testing Library.

## Running Tests

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Test Structure

```
src/
├── components/
│   └── ui/
│       └── __tests__/
│           └── button.test.tsx
├── store/
│   └── __tests__/
│       ├── auth.test.ts
│       └── ui.test.ts
├── features/
│   └── auth/
│       └── hooks/
│           └── __tests__/
│               └── useAuth.test.ts
└── lib/
    └── __tests__/
        └── queryKeys.test.ts
```

## Test Utilities

Import test helpers from `@/test/utils`:

```tsx
import {
  renderWithProviders,
  createMockUser,
  createMockTokens,
  mockAuthStore,
  resetAuthStore,
  screen,
  userEvent,
  waitFor,
} from '@/test/utils';
```

### Render with Providers

```tsx
import { renderWithProviders, screen } from '@/test/utils';

test('renders component', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});

// With initial route
renderWithProviders(<MyComponent />, {
  initialRoute: '/agents/123',
});
```

### Mock Factories

```tsx
import {
  createMockUser,
  createMockTokens,
  createMockAgent
} from '@/test/utils';

// Create mock data
const user = createMockUser({ name: 'John' });
const tokens = createMockTokens();
const agent = createMockAgent({ status: 'active' });
```

### Store Mocking

```tsx
import { mockAuthStore, resetAuthStore } from '@/test/utils';

beforeEach(() => {
  resetAuthStore();
});

test('authenticated user', () => {
  mockAuthStore(createMockUser(), createMockTokens());

  // Test with authenticated state
});
```

## Testing Components

### Basic Component

```tsx
import { renderWithProviders, screen } from '@/test/utils';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders children', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant class', () => {
    renderWithProviders(<Button variant="destructive">Delete</Button>);
    expect(screen.getByText('Delete')).toHaveClass('bg-destructive');
  });

  it('handles click', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByText('Click'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Component with Hooks

```tsx
import { renderWithProviders, screen, waitFor } from '@/test/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgentsList } from '@/features/agents/components/AgentsList';

// Mock the API
vi.mock('@/api/agents', () => ({
  agentsApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: '1', name: 'Agent 1' },
      { id: '2', name: 'Agent 2' },
    ]),
  },
}));

test('displays agents list', async () => {
  renderWithProviders(<AgentsList />);

  await waitFor(() => {
    expect(screen.getByText('Agent 1')).toBeInTheDocument();
    expect(screen.getByText('Agent 2')).toBeInTheDocument();
  });
});
```

## Testing Stores

```tsx
import { useAuthStore } from '@/store/auth';
import { resetAuthStore, createMockUser } from '@/test/utils';

describe('authStore', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  it('login updates state', () => {
    const user = createMockUser();
    const tokens = { access_token: 'abc', refresh_token: 'def' };

    useAuthStore.getState().login(user, tokens);

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('hasPermission checks correctly', () => {
    useAuthStore.setState({ permissions: ['agents:read', 'agents:create'] });

    expect(useAuthStore.getState().hasPermission('agents:read')).toBe(true);
    expect(useAuthStore.getState().hasPermission('agents:delete')).toBe(false);
  });
});
```

## Testing Hooks

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useLogin } from '@/features/auth/hooks/useAuth';
import { createTestQueryClient } from '@/test/utils';

// Mock API
vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      access_token: 'token',
      refresh_token: 'refresh',
    }),
  },
}));

test('useLogin calls API and updates store', async () => {
  const queryClient = createTestQueryClient();

  const { result } = renderHook(() => useLogin(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  });

  await result.current.mutateAsync({
    email: 'test@example.com',
    password: 'password'
  });

  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});
```

## Coverage Thresholds

Coverage is configured in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'html'],
  exclude: ['node_modules/', 'src/test/'],
  thresholds: {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70,
  },
}
```
