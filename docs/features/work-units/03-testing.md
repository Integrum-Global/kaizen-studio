# Work Units Testing

This document describes the testing strategy for the Work Units feature.

## Test Coverage

### Unit Tests (239 tests)

| Test File | Tests | Description |
|-----------|-------|-------------|
| `WorkUnitIcon.test.tsx` | 9 | Icon rendering for atomic/composite types |
| `TrustStatusBadge.test.tsx` | 22 | Trust status display and interactions |
| `SubUnitCount.test.tsx` | 14 | Sub-unit count display |
| `CapabilityTags.test.tsx` | 18 | Capability tag rendering and overflow |
| `WorkUnitCard.test.tsx` | 31 | Card display and actions |
| `WorkUnitActions.test.tsx` | 21 | Action button behavior |
| `WorkUnitGrid.test.tsx` | 28 | Grid layout, loading, empty states |
| `WorkUnitFilters.test.tsx` | 28 | Search and filter controls |
| `WorkUnitDetailPanel.test.tsx` | 38 | Detail panel content and actions |
| `types/index.test.ts` | 30 | Type guards and permissions |

### E2E Tests (59 tests)

#### Phase 1: My Tasks Page (31 tests)
- Navigation and page display
- Task cards and status indicators
- Level-based navigation visibility
- Trust status display
- User menu
- Accessibility (landmarks, keyboard)
- Responsive design
- Error handling

#### Phase 2: Work Units Page (28 tests)
- Navigation to `/build/work-units`
- Grid display and empty states
- Filters (search, type, trust status, workspace)
- Card actions
- Detail panel
- Pagination
- Level-based features (Configure, Delegate)
- Responsive design

## Running Tests

### Unit Tests

```bash
# Run all work-units tests
npm test -- --run src/features/work-units/

# Run specific test file
npm test -- --run src/features/work-units/components/__tests__/WorkUnitCard.test.tsx

# Run with coverage
npm test -- --coverage src/features/work-units/
```

### E2E Tests

```bash
# Run work-units E2E tests
npx playwright test e2e/work-units.spec.ts

# Run with UI
npx playwright test e2e/work-units.spec.ts --ui

# Run specific test
npx playwright test e2e/work-units.spec.ts -g "should display work unit grid"
```

## Testing Patterns

### Testing UserLevelContext

The `UserLevelContext` fetches level data from API. In tests, mock the fetch:

```tsx
import { vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserLevelProvider } from '@/contexts/UserLevelContext';

// Mock auth store
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' },
    isAuthenticated: true,
  })),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to get mock response for level
const getMockLevelResponse = (level: 1 | 2 | 3) => {
  switch (level) {
    case 3:
      return {
        level: 3,
        delegationsGiven: 3,
        canEstablishTrust: true,
        trustChainPosition: 'intermediate',
      };
    case 2:
      return {
        level: 2,
        delegationsGiven: 1, // Triggers Level 2
        canEstablishTrust: false,
        trustChainPosition: 'leaf',
      };
    default:
      return {
        level: 1,
        delegationsGiven: 0,
        canEstablishTrust: false,
        trustChainPosition: 'leaf',
      };
  }
};

// Use in tests
it('should show trust section for Level 2', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => getMockLevelResponse(2),
  });

  render(
    <QueryClientProvider client={new QueryClient()}>
      <UserLevelProvider>
        <MyComponent />
      </UserLevelProvider>
    </QueryClientProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('TRUST')).toBeInTheDocument();
  });
});
```

### Testing ForLevel Component

The `ForLevel` component conditionally renders based on user level:

```tsx
// Content only shows for Level 2+
<ForLevel min={2}>
  <TrustSection />
</ForLevel>

// In tests, ensure mock provides correct level response
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => getMockLevelResponse(2),
});
```

### Testing Radix UI Selects

Radix Select components render options in portals:

```tsx
// Click trigger to open dropdown
await user.click(screen.getByTestId('filter-trust-status'));

// Options are rendered as role="option"
expect(screen.getByRole('option', { name: 'Valid' })).toBeInTheDocument();

// Default option appears in both trigger and dropdown
expect(screen.getAllByText('All Status').length).toBeGreaterThanOrEqual(1);
```

### Testing Grid with Nested Lists

Work unit grid has nested lists (grid + capability tags):

```tsx
// Get main grid list by aria-label
const mainList = screen.getByRole('list', { name: 'Work units' });

// Get only direct children (not nested capability tags)
const listItems = mainList.querySelectorAll(':scope > [role="listitem"]');
expect(listItems).toHaveLength(3);
```

## Test Data Factories

### Creating Mock Work Units

```tsx
const createMockWorkUnit = (id: string, overrides?: Partial<WorkUnit>): WorkUnit => ({
  id,
  name: `Work Unit ${id}`,
  description: `Description for ${id}`,
  type: 'atomic',
  capabilities: ['extract', 'validate'],
  trustInfo: {
    status: 'valid',
    establishedAt: '2024-01-01T00:00:00Z',
  },
  createdBy: 'user-123',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Create multiple
const createMockWorkUnits = (count: number): WorkUnit[] =>
  Array.from({ length: count }, (_, i) => createMockWorkUnit(`wu-${i + 1}`));
```

### Creating Mock Handlers

```tsx
const defaultHandlers = {
  onWorkUnitClick: vi.fn(),
  onRun: vi.fn(),
  onConfigure: vi.fn(),
  onDelegate: vi.fn(),
  onViewTrust: vi.fn(),
  onLoadMore: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});
```

## Accessibility Testing

### Landmarks

```tsx
// Page should have proper landmarks
expect(screen.getByRole('main')).toBeInTheDocument();
expect(screen.getByRole('navigation')).toBeInTheDocument();
```

### Keyboard Navigation

```tsx
// Tab to interactive elements
await page.keyboard.press('Tab');
const focusedElement = page.locator(':focus');
await expect(focusedElement).toBeVisible();
```

### ARIA Labels

```tsx
// Buttons should have accessible names
const button = screen.getByRole('button', { name: 'Run' });
expect(button).toBeInTheDocument();

// Lists should have labels
const grid = screen.getByRole('list', { name: 'Work units' });
expect(grid).toBeInTheDocument();
```

## Debugging Failed Tests

### Common Issues

1. **ForLevel not showing content**: Ensure mock returns correct `delegationsGiven` for Level 2+
2. **Multiple elements found**: Use more specific selectors like `getByRole('option', { name: 'X' })`
3. **Async context not updated**: Use `waitFor` for ForLevel components
4. **Element not found**: Check if component uses portal (Radix UI)

### Debug Tools

```tsx
// Print DOM
screen.debug();

// Print specific element
screen.debug(screen.getByTestId('my-element'));

// Log to console in E2E
console.log(await page.content());
```
