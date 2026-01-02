# Agents Feature Testing

Comprehensive tests for the agents feature components.

## Test Files

```
src/features/agents/components/__tests__/
├── AgentCard.test.tsx    # 27 tests
├── AgentList.test.tsx    # 21 tests
└── README.md             # Test documentation
```

## AgentCard Tests (27 tests)

### Rendering Tests
- Renders agent name and description
- Renders agent type (Chat, Completion, Embedding, Custom)
- Renders provider (OpenAI, Anthropic, Google, Azure, Custom)
- Renders model name
- Shows enabled tools count

### Status Badge Tests
- Shows green badge for active status
- Shows gray badge for inactive status
- Shows red badge for error status

### User Interaction Tests
- Opens dropdown menu on button click
- Calls onEdit when Edit menu item clicked
- Calls onDuplicate when Duplicate menu item clicked
- Calls onDelete when Delete menu item clicked
- Does not navigate when clicking dropdown menu

### Navigation Tests
- Navigates to agent detail page on card click
- Uses correct agent ID in navigation path

### Type Mapping Tests
- Displays "Chat" for chat type
- Displays "Completion" for completion type
- Displays "Embedding" for embedding type
- Displays "Custom" for custom type

### Provider Mapping Tests
- Displays "OpenAI" for openai provider
- Displays "Anthropic" for anthropic provider
- Displays "Google" for google provider
- Displays "Azure" for azure provider
- Displays "Custom" for custom provider

## AgentList Tests (21 tests)

### Loading State Tests
- Renders loading skeletons when isPending is true
- Shows correct number of skeleton cards

### Empty State Tests
- Renders empty state when no agents
- Shows "Create your first agent" message
- Shows "Try adjusting your search filters" when filters applied

### Data Rendering Tests
- Renders agent cards when data exists
- Renders correct number of cards

### Filter Tests
- Filters by search query
- Filters by type
- Filters by provider
- Filters by status

### Pagination Tests
- Shows pagination when multiple pages
- Disables Previous on first page
- Disables Next on last page
- Handles page change

### Error State Tests
- Shows error state on fetch failure

### Action Tests
- Opens edit dialog on edit click
- Calls duplicate mutation on duplicate click
- Calls delete mutation on delete click (with confirm)
- Shows success toast on successful duplicate
- Shows error toast on failed delete

## Running Tests

```bash
# Run all agents tests
npm test -- src/features/agents

# Run specific test file
npm test -- src/features/agents/components/__tests__/AgentCard.test.tsx

# Run with coverage
npm test -- --coverage src/features/agents
```

## Test Utilities

```tsx
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { vi } from "vitest";

// Mock hooks
vi.mock("../hooks", () => ({
  useAgents: vi.fn(),
  useDeleteAgent: vi.fn(),
  useDuplicateAgent: vi.fn(),
}));

// Mock navigation
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));
```

## Example Test

```tsx
it("should render agent name and description", () => {
  const agent = createMockAgent({
    name: "My Agent",
    description: "Test description",
  });

  render(
    <AgentCard
      agent={agent}
      onEdit={vi.fn()}
      onDuplicate={vi.fn()}
      onDelete={vi.fn()}
    />
  );

  expect(screen.getByText("My Agent")).toBeInTheDocument();
  expect(screen.getByText("Test description")).toBeInTheDocument();
});
```
