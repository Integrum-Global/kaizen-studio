# UserLevelContext - Level Detection and Permissions

The UserLevelContext provides automatic user level detection and permission management for the three-level UX model.

## Usage

### Basic Usage

```tsx
import { UserLevelProvider, useUserLevel } from '@/contexts/UserLevelContext';

function App() {
  return (
    <UserLevelProvider>
      <MyComponent />
    </UserLevelProvider>
  );
}

function MyComponent() {
  const { level, userId, userName } = useUserLevel();
  return <div>User Level: {level}</div>;
}
```

### Permission Checking

```tsx
import { usePermission, useMinLevel } from '@/contexts/UserLevelContext';

function ActionButtons() {
  const canConfigure = usePermission('canConfigure');
  const isLevel2OrAbove = useMinLevel(2);

  return (
    <>
      {canConfigure && <ConfigureButton />}
      {isLevel2OrAbove && <AdvancedOptions />}
    </>
  );
}
```

### Declarative Rendering

```tsx
import { ForLevel, ForPermission } from '@/contexts/UserLevelContext';

function Dashboard() {
  return (
    <>
      {/* Always visible */}
      <TaskList />

      {/* Only for Level 2+ */}
      <ForLevel min={2}>
        <ProcessManager />
      </ForLevel>

      {/* Only if user can delegate */}
      <ForPermission permission="canDelegate">
        <DelegationPanel />
      </ForPermission>

      {/* With fallback for lower levels */}
      <ForLevel min={3} fallback={<UpgradePrompt />}>
        <ValueChainViewer />
      </ForLevel>
    </>
  );
}
```

## Level Detection

Levels are determined automatically from the backend API:

| Condition | Level |
|-----------|-------|
| Can establish trust (root of trust chain) | Level 3 |
| Has delegations given (mid-chain) | Level 2 |
| Only has delegations received (leaf) | Level 1 |

## Permission Matrix

| Permission | Level 1 | Level 2 | Level 3 |
|------------|---------|---------|---------|
| canRun | Yes | Yes | Yes |
| canViewResults | Yes | Yes | Yes |
| canConfigure | No | Yes | Yes |
| canDelegate | No | Yes | Yes |
| canEstablishTrust | No | No | Yes |
| canManageCompliance | No | No | Yes |
| canViewAuditLogs | No | No | Yes |
| canDeleteWorkUnits | No | No | Yes |

## Helper Functions

```tsx
import { getLevelLabel, getLevelDescription } from '@/contexts/UserLevelContext';

// Returns "Task Performer", "Process Owner", or "Value Chain Owner"
const label = getLevelLabel(2); // "Process Owner"

// Returns a description of what the level can do
const description = getLevelDescription(2);
// "Configure processes and delegate to team members"
```

## Context Values

The `useUserLevel` hook returns:

```typescript
interface UserLevelContextValue {
  level: UserLevel;           // 1, 2, or 3
  permissions: UserPermissions;
  userId: string;
  userName: string;
  email: string;
  organizationId: string;
  delegationsReceived: number;
  delegationsGiven: number;
  canEstablishTrust: boolean;
  trustChainPosition: 'root' | 'leaf' | 'intermediate';
  isLoading: boolean;
  error: string | null;
}
```

## Testing

The context can be easily mocked for testing:

```tsx
// In test file
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    isAuthenticated: true,
  })),
}));

// Mock API response
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({
    level: 2,
    delegationsGiven: 3,
    canEstablishTrust: false,
  }),
});
```
