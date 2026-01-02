# Connector Component Tests

This directory contains comprehensive tests for the connector feature components.

## Test Files

### ConnectorCard.test.tsx

Tests for the `ConnectorCard` component with 18 test cases covering:

**Rendering Tests:**

- Basic connector information display
- Icon rendering for all 6 connector types (database, cloud, email, messaging, storage, api)
- Status badge variants (connected, disconnected, error, pending)
- Created date display
- Last tested date (when available/unavailable)

**Interaction Tests:**

- Test Connection button click handler
- Edit button click handler
- Delete button click handler

**Styling Tests:**

- Hover effects on card

### ConnectorList.test.tsx

Tests for the `ConnectorList` component with 19 test cases covering:

**Loading States:**

- Loading skeleton display
- Skeleton count validation

**Empty States:**

- No connectors message
- Empty state with filter message
- Create button in empty state

**Data Display:**

- Rendering multiple connectors
- Grid layout
- Different connector types with icons
- Different status badges

**Filtering:**

- Filter by connector type
- Reset page on filter change
- Empty results with filters

**Pagination:**

- Previous/Next button functionality
- Page number display
- Disable previous on first page
- Disable next on last page
- Hide pagination when not needed

**Error Handling:**

- API error display

**API Integration:**

- API call on mount
- Filter parameters passed correctly

## Test Patterns

All tests follow the established patterns:

1. **vitest** and **@testing-library/react** for testing
2. **vi.mock** for mocking API calls and hooks
3. **renderWithProviders** for consistent rendering with QueryClient
4. **createTestQueryClient** for test isolation
5. **userEvent** for user interaction simulation
6. Mock factory functions (`createMockConnector`) for test data

## Running Tests

```bash
# Run all connector component tests
npm test -- src/features/connectors/components/__tests__/

# Run specific test file
npm test -- src/features/connectors/components/__tests__/ConnectorCard.test.tsx
npm test -- src/features/connectors/components/__tests__/ConnectorList.test.tsx

# Run in watch mode
npm test -- src/features/connectors/components/__tests__/ --watch
```

## Test Coverage

- **Total Tests:** 37
- **ConnectorCard:** 18 tests
- **ConnectorList:** 19 tests
- **Status:** All passing ✓

## Mock Structure

### ConnectorCard Mocks

- No API mocks needed (pure presentation component)
- Props: `onEdit`, `onDelete`, `onTest` callback functions

### ConnectorList Mocks

- `connectorsApi.getAll` - GET list of connectors
- `connectorsApi.delete` - DELETE connector
- `connectorsApi.testConnection` - POST test connection
- `useToast` hook for notifications
- `window.confirm` for delete confirmation

## Test Data

Mock connector structure:

```typescript
{
  id: string;
  organization_id: string;
  name: string;
  connector_type: "database" | "cloud" | "email" | "messaging" | "storage" | "api";
  provider: string;
  status: "connected" | "disconnected" | "error" | "pending";
  created_by: string;
  created_at: string;
  updated_at: string;
  last_tested_at?: string; // Optional
}
```

## Future Enhancements

Potential additional tests:

- Delete confirmation dialog interaction
- Test connection result display
- Edit dialog integration
- Create dialog integration
- Keyboard navigation
- Accessibility (a11y) tests
