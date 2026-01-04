# Testing Work Units

Comprehensive testing guide for the Work Units feature, covering unit tests and E2E tests.

## Test Summary

| Component | Tests | Coverage |
|-----------|-------|----------|
| Types (index.ts) | 30 | Permission matrix, action gating |
| WorkUnitIcon | 9 | Icon variants, sizes, accessibility |
| TrustStatusBadge | 22 | All statuses, expiry display, interactions |
| CapabilityTags | 18 | Rendering, overflow, interactions |
| SubUnitCount | 14 | Singular/plural, interactions |
| WorkUnitActions | 21 | Level-based visibility, trust gating |
| WorkUnitCard | 31 | Full integration, click handling |
| UserLevelContext | 21 | Hooks, components, API integration |
| AdaptiveSidebar | 25 | Level-based nav, collapse, routing |
| E2E (work-units.spec.ts) | 31 | Full user flows |

**Total: 222 tests**

## Running Tests

```bash
# Run all Phase 1 unit tests
npm test -- --run src/features/work-units src/contexts/__tests__/UserLevelContext.test.tsx src/components/layout/__tests__/AdaptiveSidebar.test.tsx

# Run E2E tests
npx playwright test e2e/work-units.spec.ts
```

## Unit Test Patterns

### Testing Components

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkUnitCard } from '../WorkUnitCard';

describe('WorkUnitCard', () => {
  const createMockWorkUnit = (overrides?: Partial<WorkUnit>): WorkUnit => ({
    id: 'wu-123',
    name: 'Invoice Processor',
    type: 'atomic',
    capabilities: ['extract', 'validate'],
    trustInfo: { status: 'valid' },
    createdBy: 'user-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  it('should render work unit name', () => {
    render(
      <WorkUnitCard
        workUnit={createMockWorkUnit()}
        userLevel={1}
      />
    );

    expect(screen.getByText('Invoice Processor')).toBeInTheDocument();
  });
});
```

### Testing Context

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UserLevelProvider>{ui}</UserLevelProvider>
    </QueryClientProvider>
  );
};
```

### Testing Level-Based Visibility

```tsx
describe('Level-based navigation', () => {
  it('should show My Processes for Level 2', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ level: 2, delegationsGiven: 1 }),
    });

    renderWithProviders('/');

    await waitFor(() => {
      expect(screen.getByText('My Processes')).toBeInTheDocument();
    });
  });

  it('should not show Value Chains for Level 2', async () => {
    // Same setup...
    expect(screen.queryByText('Value Chains')).not.toBeInTheDocument();
  });
});
```

## E2E Test Patterns

### Authentication Setup

```typescript
import { setupAuth, navigateAuthenticated } from './fixtures/auth';

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('should navigate to tasks page', async ({ page }) => {
  await navigateAuthenticated(page, '/work/tasks');
  await expect(page.getByText('My Tasks')).toBeVisible();
});
```

### Resilient Selectors

```typescript
// Good - handles multiple possible states
const taskCards = page.locator('[data-testid*="task-card"]');
const emptyState = page.getByText(/no tasks|empty/i);

const hasCards = await taskCards.count() > 0;
const hasEmptyState = await emptyState.count() > 0;
expect(hasCards || hasEmptyState).toBeTruthy();
```

### Testing Interactions

```typescript
test('should click task card to view details', async ({ page }) => {
  await navigateAuthenticated(page, '/work/tasks');

  const taskCards = page.locator('[data-testid*="task-card"]');

  if (await taskCards.count() > 0) {
    await taskCards.first().click();
    await page.waitForTimeout(500);

    // Verify either detail panel or navigation occurred
    const detailPanel = page.locator('[data-testid*="detail"]');
    const urlChanged = !page.url().endsWith('/work/tasks');
    expect((await detailPanel.count() > 0) || urlChanged).toBeTruthy();
  }
});
```

## Accessibility Testing

```typescript
test('should have proper heading hierarchy', async ({ page }) => {
  await navigateAuthenticated(page, '/work/tasks');
  const h1 = page.locator('h1');
  expect(await h1.count()).toBeGreaterThanOrEqual(1);
});

test('should support keyboard navigation', async ({ page }) => {
  await navigateAuthenticated(page, '/work/tasks');
  await page.keyboard.press('Tab');
  const focusedElement = page.locator(':focus');
  await expect(focusedElement).toBeVisible();
});
```

## Mocking Patterns

### Mocking Zustand Stores

```typescript
vi.mock('@/store/ui', () => ({
  useUIStore: vi.fn(() => ({
    sidebarCollapsed: false,
    toggleSidebar: vi.fn(),
  })),
}));
```

### Mocking API Responses

```typescript
const mockFetch = vi.fn();
global.fetch = mockFetch;

mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({
    level: 2,
    delegationsReceived: 1,
    delegationsGiven: 3,
  }),
});
```

## Test File Organization

```
src/
├── features/work-units/
│   ├── types/
│   │   └── __tests__/
│   │       └── index.test.ts
│   └── components/
│       └── __tests__/
│           ├── WorkUnitIcon.test.tsx
│           ├── TrustStatusBadge.test.tsx
│           ├── CapabilityTags.test.tsx
│           ├── SubUnitCount.test.tsx
│           ├── WorkUnitActions.test.tsx
│           └── WorkUnitCard.test.tsx
├── contexts/
│   └── __tests__/
│       └── UserLevelContext.test.tsx
├── components/layout/
│   └── __tests__/
│       └── AdaptiveSidebar.test.tsx
e2e/
└── work-units.spec.ts
```
