# Level Transition Experience

The `useLevelTransition` hook monitors user level changes and provides notifications when the user's trust posture changes.

## What It Is

Level transitions occur when:
- User receives delegations with delegation capability (1 → 2)
- User is granted trust establishment authority (2 → 3)
- User's delegations are revoked (2 → 1, 3 → 2)

The hook detects these changes and shows appropriate toast notifications.

## Hook Usage

```tsx
import { useLevelTransition } from '@/hooks';

function MyComponent() {
  const {
    currentLevel,
    currentLevelLabel,
    currentLevelDescription,
    lastTransition,
    isTransitioning,
    checkTransition,
  } = useLevelTransition();

  return (
    <div>
      <p>Current Level: {currentLevelLabel}</p>
      <p>{currentLevelDescription}</p>
      {isTransitioning && <p>Level is changing...</p>}
    </div>
  );
}
```

## Options

```typescript
interface UseLevelTransitionOptions {
  // Whether to show toast notifications (default: true)
  showNotifications?: boolean;

  // Callback when level changes
  onTransition?: (transition: LevelTransition) => void;

  // Whether to navigate to suggested page on upgrade (default: false)
  autoNavigate?: boolean;
}
```

## Return Value

```typescript
interface UseLevelTransitionResult {
  // Current user level (1, 2, or 3)
  currentLevel: UserLevel;

  // Human-readable level label
  currentLevelLabel: string;

  // Level description
  currentLevelDescription: string;

  // Most recent transition, if any
  lastTransition: LevelTransition | null;

  // Whether a transition is currently animating
  isTransitioning: boolean;

  // Manually trigger a transition check
  checkTransition: () => void;
}
```

## Transition Messages

| Transition | Title | Description |
|------------|-------|-------------|
| 1 → 2 | Process Owner Access Granted | You now have Process Owner access. Explore your new capabilities! |
| 1 → 3 | Value Chain Owner Access Granted | You now have full Value Chain Owner access. Manage enterprise-wide processes. |
| 2 → 3 | Value Chain Owner Access Granted | You now have Value Chain Owner access. View enterprise-wide processes. |
| 2 → 1 | Access Level Changed | Your access has changed. Some features may no longer be available. |
| 3 → 2 | Access Level Changed | Your access has changed. Value Chain features are no longer available. |
| 3 → 1 | Access Level Changed | Your access has changed. Process and Value Chain features are no longer available. |

## Example with Callback

```tsx
import { useLevelTransition, type LevelTransition } from '@/hooks';

function Dashboard() {
  const handleTransition = (transition: LevelTransition) => {
    console.log(`Level changed from ${transition.from} to ${transition.to}`);

    if (transition.direction === 'upgrade') {
      // Track analytics event
      analytics.track('level_upgrade', {
        from: transition.from,
        to: transition.to,
      });
    }
  };

  const { currentLevel } = useLevelTransition({
    onTransition: handleTransition,
  });

  return <div>Level: {currentLevel}</div>;
}
```

## Example with Auto-Navigation

```tsx
import { useLevelTransition } from '@/hooks';

function App() {
  // Automatically navigate to new features on upgrade
  useLevelTransition({
    autoNavigate: true,
  });

  // When user upgrades 1→2, they'll be redirected to /work/processes
  // When user upgrades 2→3, they'll be redirected to /work/value-chains
}
```

## Example with Manual Check

```tsx
import { useLevelTransition } from '@/hooks';

function RefreshButton() {
  const { checkTransition } = useLevelTransition();

  return (
    <button onClick={checkTransition}>
      Check for Level Changes
    </button>
  );
}
```

## Integration with AdaptiveSidebar

The AdaptiveSidebar automatically shows/hides sections based on user level. When combined with `useLevelTransition`, users get both:

1. Toast notification about level change
2. Sidebar sections appearing/disappearing smoothly

```tsx
function AppLayout() {
  // Monitor level changes
  useLevelTransition();

  return (
    <div className="flex h-screen">
      <AdaptiveSidebar />
      <main>{/* content */}</main>
    </div>
  );
}
```

## Testing

```tsx
import { renderHook, act, waitFor } from '@testing-library/react';

it('should detect level upgrade', async () => {
  // Mock API to return Level 2
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => ({
      level: 2,
      delegationsGiven: 3,
    }),
  });

  const { result } = renderHook(() => useLevelTransition());

  await waitFor(() => {
    expect(result.current.currentLevel).toBe(2);
    expect(result.current.lastTransition?.direction).toBe('upgrade');
  });
});
```

## Dependencies

The hook uses:
- `@/contexts/UserLevelContext` for level state
- `@/hooks/use-toast` for notifications
- `react-router-dom` for navigation
