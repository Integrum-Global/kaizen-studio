# AdaptiveSidebar - Level-Aware Navigation

The AdaptiveSidebar provides navigation that adapts to the user's level, showing only relevant sections and items.

## Usage

```tsx
import { AdaptiveSidebar } from '@/components/layout/AdaptiveSidebar';

function Layout() {
  return (
    <div className="flex">
      <AdaptiveSidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
```

## Navigation Structure by Level

### Level 1 (Task Performer)

```
Dashboard
WORK
  └─ My Tasks
```

### Level 2 (Process Owner)

```
Dashboard
WORK
  ├─ My Tasks
  └─ My Processes
BUILD
  ├─ Work Units
  ├─ Workspaces
  └─ Connectors
GOVERN
  └─ Trust
OBSERVE
  ├─ Metrics
  ├─ Logs
  └─ Alerts
```

### Level 3 (Value Chain Owner)

```
Dashboard
WORK
  ├─ My Tasks
  ├─ My Processes
  └─ Value Chains
BUILD
  ├─ Work Units
  ├─ Workspaces
  └─ Connectors
GOVERN
  ├─ Trust
  ├─ Compliance
  └─ Activity
OBSERVE
  ├─ Metrics
  ├─ Logs
  └─ Alerts
ADMIN
  └─ Organizations
```

## Features

### Collapse/Expand

The sidebar can be collapsed to icons-only mode:

```tsx
// Controlled by Zustand store
const { sidebarCollapsed, toggleSidebar } = useUIStore();
```

When collapsed:
- Only icons are visible
- Section titles are hidden
- Level indicator is hidden
- Branding shows "K" instead of "Kaizen Studio"

### Level Indicator

Shows the current user level prominently:

- L1 (purple background)
- L2 (blue background)
- L3 (green background)

### Active Route Highlighting

Current route is highlighted with primary color background.

### User Menu

Integrated user menu at the bottom with:
- User avatar/name
- Account settings access
- Logout option

## Customization

### Adding New Navigation Items

Navigation items are defined with level requirements:

```typescript
const navItems = [
  {
    label: 'My Feature',
    href: '/feature',
    icon: FeatureIcon,
    minLevel: 2,  // Only visible for Level 2+
  },
];
```

### Section Configuration

Sections can be level-gated:

```typescript
const sections = [
  {
    title: 'ADMIN',
    minLevel: 3,  // Entire section only for Level 3
    items: [...],
  },
];
```

## Responsive Behavior

- **Desktop (1024px+)**: Full sidebar, collapsible
- **Tablet (768px-1023px)**: Collapsed by default
- **Mobile (<768px)**: Hidden, accessible via menu button

## Testing

```tsx
// Mock stores for testing
vi.mock('@/store/ui', () => ({
  useUIStore: vi.fn(() => ({
    sidebarCollapsed: false,
    toggleSidebar: mockToggle,
  })),
}));

// Test level-based visibility
renderWithProviders('/', { level: 2 });
expect(screen.getByText('My Processes')).toBeInTheDocument();
expect(screen.queryByText('Value Chains')).not.toBeInTheDocument();
```
