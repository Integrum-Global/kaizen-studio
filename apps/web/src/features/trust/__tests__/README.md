# Trust Component Tests

Comprehensive unit tests for EATP (Enterprise Agent Trust Protocol) components in Kaizen Studio frontend.

## Test Coverage

### 1. TrustStatusBadge.test.tsx (18 tests)

Tests for the trust status badge component that displays trust validation status.

**Coverage:**

- Status variants (VALID, EXPIRED, REVOKED, PENDING, INVALID)
- Size variants (sm, md, lg)
- Icon display options
- Tooltip functionality
- Custom className support
- Accessibility features

**Key Test Cases:**

- Renders all 5 status types with correct colors and icons
- Supports 3 size variants
- Shows/hides icons based on props
- Renders with tooltip provider wrapper
- Applies custom CSS classes
- Maintains proper accessibility structure

### 2. TrustDashboard.test.tsx (15 tests)

Tests for the main trust dashboard component.

**Coverage:**

- Loading state with skeletons
- Success state with real stats data
- Error handling
- Quick action buttons (Establish Trust, View Audit Trail)
- Recent audit events display
- Stats grid layout
- Verification rate calculation

**Key Test Cases:**

- Displays loading skeletons while fetching data
- Renders dashboard with stats from API
- Shows error state when API fails
- Action buttons call correct handlers
- Recent audit events render with click handlers
- Stats grid displays all 4 cards
- Verification rate card renders correctly

### 3. TrustChainViewer.test.tsx (28 tests)

Tests for the trust chain viewer component with tabbed interface.

**Coverage:**

- Tab rendering and navigation
- Genesis record display
- Capabilities tab with empty states
- Delegations tab with empty states
- Constraints tab with JSON display
- Audit tab with event details
- Header with chain hash
- Responsive design

**Key Test Cases:**

- Renders all 5 tabs with correct badge counts
- Switches between tabs on click
- Displays genesis record by default
- Shows empty states when data is missing
- Displays constraint and audit details as JSON
- Renders chain hash in header
- Responsive tab labels for mobile

### 4. trust-store.test.ts (22 tests)

Tests for the Zustand trust state management store.

**Coverage:**

- Initial state
- Selected trust chain management
- Verification results tracking
- Dashboard stats caching
- Filter state (status, search, date range)
- UI state (sidebar, panels, tabs)

**Key Test Cases:**

- Correct initial state values
- Set/clear selected trust chain
- Add verification results (max 50)
- Update dashboard stats
- Set individual filters (status, search, date range)
- Reset filters to defaults
- Toggle UI state (sidebar, panels, tabs)
- State persistence across actions

### 5. trust-hooks.test.tsx (19 tests)

Tests for React Query hooks that manage trust API interactions.

**Coverage:**

- useTrustChain hook
- useTrustChains hook
- useVerifyTrust mutation
- useTrustDashboardStats hook
- useEstablishTrust mutation
- useDelegateTrust mutation
- Query invalidation after mutations

**Key Test Cases:**

- Fetches trust chain for an agent
- Handles loading and error states
- Disabled queries when params are empty
- Lists trust chains with pagination and filters
- Verifies trust with different levels
- Establishes and delegates trust
- Invalidates queries after mutations
- Sets query cache data correctly

## Mock Data

All tests use mock data from `fixtures.ts`:

- `createMockGenesisRecord()` - Genesis records
- `createMockCapabilityAttestation()` - Capability attestations
- `createMockDelegationRecord()` - Delegation records
- `createMockConstraint()` - Individual constraints
- `createMockConstraintEnvelope()` - Constraint envelopes
- `createMockAuditAnchor()` - Audit anchors
- `createMockTrustChain()` - Complete trust chains
- `createMockTrustDashboardStats()` - Dashboard statistics
- `createMockVerificationResult()` - Verification results

## Running Tests

```bash
# Run all trust component tests
npm test -- src/features/trust/__tests__/

# Run specific test file
npm test -- src/features/trust/__tests__/TrustStatusBadge.test.tsx

# Run in watch mode
npm test -- src/features/trust/__tests__/ --watch

# Run with coverage
npm test -- src/features/trust/__tests__/ --coverage
```

## Test Statistics

- **Total Test Files:** 5
- **Total Tests:** 102
- **Pass Rate:** 100%
- **Coverage:**
  - Components: TrustDashboard, TrustStatusBadge, TrustChainViewer
  - Store: useTrustStore (Zustand)
  - Hooks: All trust-related React Query hooks

## Testing Patterns Used

1. **Vitest + React Testing Library** - Modern testing framework
2. **Mock API calls** - Using vi.mock for API isolation
3. **Mock fixtures** - Centralized test data in fixtures.ts
4. **QueryClient per test** - Fresh query client for each test
5. **Loading/Success/Error states** - All async states tested
6. **User interaction** - Button clicks, tab switches tested with userEvent
7. **Accessibility** - Structure and ARIA attributes validated

## Notes

- All tests follow existing codebase patterns (see ConnectorList.test.tsx)
- Tests are meaningful and test behavior, not implementation
- Loading states use skeleton components
- Error states show appropriate error messages
- All async operations use waitFor for proper timing
- Mock data is realistic and matches backend types
