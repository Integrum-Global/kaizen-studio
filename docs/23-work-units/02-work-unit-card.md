# WorkUnitCard - Unified Work Unit Display

The WorkUnitCard provides a consistent visual representation for all work units (atomic and composite), with trust status always visible.

## Basic Usage

```tsx
import { WorkUnitCard } from '@/features/work-units/components/WorkUnitCard';

function WorkUnitList({ workUnits }) {
  return (
    <div className="grid gap-4">
      {workUnits.map((unit) => (
        <WorkUnitCard
          key={unit.id}
          workUnit={unit}
          userLevel={2}
          onRun={() => handleRun(unit.id)}
          onConfigure={() => handleConfigure(unit.id)}
          onClick={() => openDetail(unit.id)}
        />
      ))}
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| workUnit | WorkUnit | Yes | The work unit to display |
| userLevel | 1 \| 2 \| 3 | Yes | Current user's level |
| onRun | () => void | No | Handler for run action |
| onConfigure | () => void | No | Handler for configure action |
| onDelegate | () => void | No | Handler for delegation |
| onClick | () => void | No | Handler for card click (detail view) |
| onViewTrust | () => void | No | Handler for trust badge click |
| onExpandSubUnits | () => void | No | Handler for sub-unit expansion |
| showActions | boolean | No | Show action buttons (default: true) |
| compact | boolean | No | Compact mode for embedding |
| isLoading | boolean | No | Loading state |
| loadingAction | 'run' \| 'configure' \| 'delegate' | No | Which action is loading |
| className | string | No | Additional CSS classes |

## Component Structure

```
WorkUnitCard
├── WorkUnitIcon          # Atomic (single box) or Composite (nested boxes)
├── CardHeader
│   ├── Title
│   └── TrustStatusBadge  # Always visible
├── CardDescription       # Hidden in compact mode
├── CapabilityTags        # What the unit can do
├── SubUnitCount          # Only for composite units
└── WorkUnitActions       # Level-gated action buttons
```

## Compact Mode

For embedding in other views (detail panels, lists):

```tsx
<WorkUnitCard
  workUnit={unit}
  userLevel={userLevel}
  compact  // Smaller icons, no description, fewer capabilities shown
/>
```

## Action Visibility by Level

| Action | Level 1 | Level 2 | Level 3 |
|--------|---------|---------|---------|
| Run | Yes (if trust valid) | Yes | Yes |
| Configure | No | Yes | Yes |
| Delegate | No | Yes (if trust valid) | Yes |
| Delete | No | No | Yes |

## Trust-Gated Actions

Some actions are disabled based on trust status:

```tsx
// Run is disabled if trust is expired/revoked/pending
<Button disabled={trustStatus !== 'valid'}>Run</Button>

// Delegate requires valid trust
<Button disabled={trustStatus !== 'valid'}>Delegate</Button>

// Configure is always available for Level 2+
<Button>Configure</Button>
```

## Click Handling

The card supports both card-level and button-level clicks:

```tsx
<WorkUnitCard
  workUnit={unit}
  userLevel={2}
  onClick={() => openDetailPanel(unit.id)}  // Card click
  onRun={() => executeUnit(unit.id)}         // Button click (doesn't trigger onClick)
/>
```

Button clicks do not propagate to the card click handler.

## Keyboard Accessibility

- Cards with `onClick` are keyboard-focusable
- Enter/Space activates the card click
- Buttons within are independently focusable
- Proper ARIA labels: `{name} - {type} work unit, trust {status}`
