# Keyboard Shortcuts System

The keyboard shortcuts system provides a complete solution for registering, displaying, and managing keyboard shortcuts throughout the application.

## Feature Location

```
src/features/shortcuts/
├── types/
│   └── shortcuts.ts           # Type definitions
├── utils/
│   ├── platform.ts            # Platform detection
│   └── keyMatching.ts         # Key matching logic
├── hooks/
│   ├── useKeyboardShortcuts.ts # Main hook
│   ├── useShortcutContext.ts   # Context management
│   └── useGlobalShortcuts.ts   # Default shortcuts
├── components/
│   ├── ShortcutsDialog.tsx    # Shortcuts dialog
│   └── ShortcutBadge.tsx      # Key display
├── store/
│   └── shortcuts.ts           # Zustand store
└── index.ts                   # Barrel exports
```

## Types

### Shortcut

```typescript
interface Shortcut {
  id: string;
  keys: string[];           // ['Ctrl', 'K'] or ['Meta', 'K']
  description: string;
  category: ShortcutCategory;
  action: () => void;
  enabled?: boolean;
  context?: ShortcutContext;
}

type ShortcutCategory = 'navigation' | 'canvas' | 'editing' | 'general';
type ShortcutContext = 'global' | 'canvas' | 'form' | 'dialog' | 'editor';
```

## Hooks

### useKeyboardShortcuts

Main hook for registering shortcuts.

```tsx
import { useKeyboardShortcuts } from '@/features/shortcuts';

function MyComponent() {
  useKeyboardShortcuts({
    id: 'save',
    keys: ['Ctrl', 'S'],
    description: 'Save changes',
    category: 'general',
    action: () => handleSave(),
  });

  // Or multiple shortcuts
  useKeyboardShortcuts([
    {
      id: 'save',
      keys: ['Ctrl', 'S'],
      description: 'Save changes',
      category: 'general',
      action: handleSave,
    },
    {
      id: 'undo',
      keys: ['Ctrl', 'Z'],
      description: 'Undo',
      category: 'editing',
      action: handleUndo,
    },
  ]);
}
```

### useGlobalShortcuts

Convenience hook for common shortcuts.

```tsx
import { useGlobalShortcuts } from '@/features/shortcuts';

function App() {
  const { showShortcutsDialog, setShowShortcutsDialog } = useGlobalShortcuts({
    onSave: handleSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSearch: () => setSearchOpen(true),
  });

  return (
    <>
      <AppContent />
      <ShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
      />
    </>
  );
}
```

### useShortcutContext

Context-aware shortcut management.

```tsx
import { useShortcutContext } from '@/features/shortcuts';

function CanvasEditor() {
  const { setContext, clearContext } = useShortcutContext();

  useEffect(() => {
    setContext('canvas');
    return () => clearContext();
  }, []);

  return <Canvas />;
}
```

## Components

### ShortcutsDialog

Dialog showing all registered shortcuts.

```tsx
import { ShortcutsDialog } from '@/features/shortcuts';

<ShortcutsDialog
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

Features:
- Grouped by category
- Searchable
- Platform-aware key display (⌘ on Mac, Ctrl on Windows)

### ShortcutBadge

Display shortcut keys in the UI.

```tsx
import { ShortcutBadge } from '@/features/shortcuts';

// Badge style
<ShortcutBadge keys={['Ctrl', 'S']} />

// Inline style
<ShortcutBadge keys={['Ctrl', 'S']} variant="inline" />

// With custom separator
<ShortcutBadge keys={['Ctrl', 'Shift', 'Z']} separator="-" />
```

## Default Shortcuts

| Shortcut | Description | Category |
|----------|-------------|----------|
| Ctrl+K / ⌘K | Command palette / search | General |
| Ctrl+/ / ⌘/ | Show shortcuts dialog | General |
| Ctrl+S / ⌘S | Save | General |
| Ctrl+Z / ⌘Z | Undo | Editing |
| Ctrl+Shift+Z / ⌘⇧Z | Redo | Editing |
| Ctrl+Y / ⌘Y | Redo (alternative) | Editing |
| Escape | Close dialog/cancel | General |
| Delete | Delete selected item | Editing |

## Platform Detection

```tsx
import { isMac, getModifierKey, formatKey } from '@/features/shortcuts';

// Check platform
if (isMac()) {
  // Mac-specific behavior
}

// Get modifier key
const modifier = getModifierKey(); // 'Meta' on Mac, 'Ctrl' on Windows

// Format key for display
formatKey('Meta'); // '⌘' on Mac, 'Ctrl' on Windows
formatKey('Alt');  // '⌥' on Mac, 'Alt' on Windows
```

## Integration Example

```tsx
import {
  useGlobalShortcuts,
  ShortcutsDialog,
  ShortcutBadge,
} from '@/features/shortcuts';

function App() {
  const { showShortcutsDialog, setShowShortcutsDialog } = useGlobalShortcuts({
    onSave: () => console.log('Save'),
    onUndo: () => console.log('Undo'),
  });

  return (
    <>
      <Header>
        <Button onClick={() => setShowShortcutsDialog(true)}>
          Shortcuts <ShortcutBadge keys={['Ctrl', '/']} variant="inline" />
        </Button>
      </Header>

      <MainContent />

      <ShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
      />
    </>
  );
}
```

## Input Safety

Shortcuts are automatically disabled when typing in:
- `<input>` elements
- `<textarea>` elements
- `<select>` elements
- Elements with `contenteditable="true"`

To override this behavior:

```tsx
useKeyboardShortcuts({
  id: 'escape',
  keys: ['Escape'],
  description: 'Close',
  category: 'general',
  action: handleClose,
  // This shortcut works even in input fields
  allowInInput: true,
});
```

## Testing

The shortcuts feature has comprehensive test coverage:

```
src/features/shortcuts/__tests__/
├── keyMatching.test.ts          # Key matching logic (31 tests)
├── platform.test.ts             # Platform detection (21 tests)
├── useKeyboardShortcuts.test.ts # Main hook (tests)
├── ShortcutsDialog.test.tsx     # Dialog component (tests)
└── ShortcutBadge.test.tsx       # Badge components (26 tests)
```

Run tests:
```bash
npm run test src/features/shortcuts
```
