# Agents Component Tests

Comprehensive test suite for the Agents feature components.

## Test Files

### AgentCard.test.tsx (27 tests)

Tests for the AgentCard component that displays individual agent information.

**Coverage includes:**

- Basic rendering (name, description, type, provider, model)
- Status badge colors (active=green, inactive=gray, error=red)
- Tools count display
- Action handlers (onEdit, onDuplicate, onDelete)
- Navigation behavior
- All agent types (chat, completion, embedding, custom)
- All providers (openai, anthropic, google, azure, custom)
- All status types (active, inactive, error)
- UI interactions (dropdown menu, card click)
- Event propagation (preventing navigation when clicking menu)

**Key test patterns:**

```typescript
// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Render with router
render(
  <BrowserRouter>
    <AgentCard agent={agent} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
  </BrowserRouter>
);
```

### AgentList.test.tsx (21 tests)

Tests for the AgentList component that displays a grid of agents with filtering and pagination.

**Coverage includes:**

- Loading states (skeletons)
- Empty states (no agents, filtered results)
- Agent rendering (multiple agents)
- Search functionality
- Filtering (type, provider, status)
- Pagination (next/previous, disabled states)
- Error states
- Action handlers (edit, duplicate, delete with confirmation)
- Grid layout
- Different agent types and statuses

**Key test patterns:**

```typescript
// Mock hooks
vi.mock("../../hooks", () => ({
  useAgents: vi.fn(),
  useDeleteAgent: vi.fn(),
  useDuplicateAgent: vi.fn(),
}));

// Mock dialog component to avoid hook dependencies
vi.mock("../AgentFormDialog", () => ({
  AgentFormDialog: ({ agent, open, onOpenChange }: any) => {
    if (!open) return null;
    return <div data-testid="agent-form-dialog">Edit Agent: {agent?.name}</div>;
  },
}));

// Render with providers
renderWithProviders(<AgentList />, {
  queryClient: createTestQueryClient(),
});

// Test Shadcn Select components
const typeSelectButton = screen.getAllByRole("combobox").find(btn =>
  btn.textContent?.includes("All Types")
);
await user.click(typeSelectButton!);
```

## Test Statistics

- **Total Tests:** 48
- **AgentCard Tests:** 27
- **AgentList Tests:** 21
- **Pass Rate:** 100%

## Running Tests

```bash
# Run all agent component tests
npm test -- src/features/agents/components/__tests__ --run

# Run specific test file
npm test -- src/features/agents/components/__tests__/AgentCard.test.tsx --run
npm test -- src/features/agents/components/__tests__/AgentList.test.tsx --run

# Run in watch mode
npm test -- src/features/agents/components/__tests__
```

## Test Dependencies

- **vitest** - Test runner
- **@testing-library/react** - React testing utilities
- **@testing-library/user-event** - User interaction simulation
- **@/test/utils** - Custom test utilities (renderWithProviders, createTestQueryClient)

## Type Safety

All tests use proper TypeScript types from:

- `src/features/agents/types/agent.ts` - Agent, AgentType, AgentProvider, AgentStatus
- `src/features/agents/hooks` - useAgents, useDeleteAgent, useDuplicateAgent

## Mocking Strategy

1. **Hooks:** All API hooks are mocked at module level
2. **Navigation:** react-router-dom navigation is mocked
3. **Toast:** useToast hook is mocked
4. **Window.confirm:** Global confirm is mocked
5. **AgentFormDialog:** Mocked to avoid deep component dependencies

## Best Practices Followed

1. ✅ All tests use proper TypeScript types
2. ✅ Non-null assertions (!) used where needed for array indexing
3. ✅ renderWithProviders for consistent provider setup
4. ✅ createTestQueryClient for react-query testing
5. ✅ Proper async/await with waitFor for async assertions
6. ✅ Mock cleanup in beforeEach
7. ✅ Descriptive test names
8. ✅ Clear arrange-act-assert pattern
9. ✅ Test isolation (each test is independent)
10. ✅ Edge cases covered (empty states, error states)
