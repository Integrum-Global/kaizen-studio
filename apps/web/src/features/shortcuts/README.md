# Keyboard Shortcuts Feature

A comprehensive keyboard shortcuts system for Kaizen Studio with cross-platform support, context-aware shortcuts, and a built-in shortcuts dialog.

## Features

- **Cross-Platform Support**: Automatically detects Mac/Windows/Linux and maps keys appropriately (Cmd on Mac, Ctrl on Windows/Linux)
- **Context-Aware**: Different shortcuts based on current context (canvas, form, dialog, etc.)
- **Input-Safe**: Automatically disables shortcuts when focused on input elements (unless explicitly allowed)
- **Searchable Dialog**: Built-in dialog showing all shortcuts, searchable and grouped by category
- **Type-Safe**: Full TypeScript support with comprehensive types
- **Zustand Store**: Centralized shortcut registry with React hooks

## Installation

The feature is already included in the project. Import from:

```typescript
import { useKeyboardShortcuts, ShortcutsDialog } from "@/features/shortcuts";
```

## Quick Start

### 1. Register Global Shortcuts

```tsx
import { useGlobalShortcuts, ShortcutsDialog } from "@/features/shortcuts";

function App() {
  const { showShortcutsDialog, setShowShortcutsDialog } = useGlobalShortcuts({
    onSave: handleSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSearch: () => setShowCommandPalette(true),
  });

  return (
    <div>
      <YourApp />
      <ShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
      />
    </div>
  );
}
```

### 2. Register Custom Shortcuts

```tsx
import { useKeyboardShortcuts } from "@/features/shortcuts";

function CanvasEditor() {
  useKeyboardShortcuts([
    {
      id: "canvas.duplicate",
      keys: ["Control", "D"],
      description: "Duplicate selected node",
      category: "canvas",
      action: handleDuplicate,
      context: "canvas", // Only active in canvas context
    },
    {
      id: "canvas.delete",
      keys: ["Delete"],
      description: "Delete selected node",
      category: "canvas",
      action: handleDelete,
      context: "canvas",
    },
  ]);

  return <div>Canvas content</div>;
}
```

### 3. Set Context

```tsx
import { useShortcutContext } from "@/features/shortcuts";

function CanvasEditor() {
  // Set context so canvas-specific shortcuts are active
  useShortcutContext("canvas");

  return <div>Canvas content</div>;
}
```

## API Reference

### Hooks

#### `useKeyboardShortcuts(shortcuts, options?)`

Register multiple keyboard shortcuts.

```tsx
useKeyboardShortcuts(
  [
    {
      id: "save",
      keys: ["Control", "S"],
      description: "Save",
      category: "general",
      action: handleSave,
    },
  ],
  {
    enabled: true, // Enable/disable shortcuts
    config: {
      preventDefault: true, // Prevent default browser behavior
      stopPropagation: false, // Stop event propagation
      allowInInput: false, // Allow in input elements
    },
  }
);
```

#### `useKeyboardShortcut(shortcut, options?)`

Register a single keyboard shortcut.

```tsx
const { trigger } = useKeyboardShortcut({
  id: "save",
  keys: ["Control", "S"],
  description: "Save",
  category: "general",
  action: handleSave,
});

// Manually trigger the shortcut
trigger();
```

#### `useShortcutContext(context)`

Set the current shortcut context.

```tsx
useShortcutContext("canvas"); // canvas | form | dialog | editor | global
```

#### `useGlobalShortcuts(options)`

Register default global shortcuts.

```tsx
const { showShortcutsDialog, setShowShortcutsDialog } = useGlobalShortcuts({
  onSave: handleSave,
  onUndo: handleUndo,
  onRedo: handleRedo,
  onDelete: handleDelete,
  onSearch: handleSearch,
  onEscape: handleEscape,
});
```

#### `useDisableShortcuts(disabled?)`

Temporarily disable all shortcuts.

```tsx
function Modal() {
  // Disable shortcuts while modal is open
  useDisableShortcuts(true);

  return <div>Modal content</div>;
}
```

### Components

#### `<ShortcutsDialog>`

Display all registered shortcuts in a searchable dialog.

```tsx
<ShortcutsDialog open={open} onOpenChange={setOpen} />
```

#### `<ShortcutBadge>`

Display shortcut keys as badges.

```tsx
<ShortcutBadge keys={["Control", "K"]} size="sm" />
// Renders: Ctrl+K (or ⌘K on Mac)
```

#### `<InlineShortcut>`

Display shortcut keys inline with text.

```tsx
<InlineShortcut keys={["Control", "K"]} />
```

### Store

#### `useShortcutsStore`

Access the shortcuts store directly.

```tsx
const {
  shortcuts, // Map of all shortcuts
  currentContext, // Current context
  enabled, // Global enabled state
  registerShortcut,
  unregisterShortcut,
  getShortcut,
  getAllShortcuts,
  getShortcutsByContext,
  setContext,
  setEnabled,
} = useShortcutsStore();
```

## Types

```typescript
type ShortcutCategory = "navigation" | "canvas" | "editing" | "general";

type ShortcutContext = "global" | "canvas" | "form" | "dialog" | "editor";

interface Shortcut {
  id: string;
  keys: string[]; // ['Ctrl', 'K'] or ['Meta', 'K'] for Mac
  description: string;
  category: ShortcutCategory;
  action: () => void;
  context?: ShortcutContext; // If specified, only active in this context
  enabled?: boolean; // Default true
}
```

## Default Shortcuts

The `useGlobalShortcuts` hook registers these default shortcuts:

| Shortcut               | Description                   | Category |
| ---------------------- | ----------------------------- | -------- |
| `Ctrl+K` / `⌘K`        | Open command palette / search | General  |
| `Ctrl+/` / `⌘/`        | Show keyboard shortcuts       | General  |
| `Ctrl+S` / `⌘S`        | Save                          | General  |
| `Ctrl+Z` / `⌘Z`        | Undo                          | Editing  |
| `Ctrl+Shift+Z` / `⌘⇧Z` | Redo                          | Editing  |
| `Ctrl+Y` / `⌘Y`        | Redo (alternative)            | Editing  |
| `Escape`               | Close dialog or cancel        | General  |
| `Delete`               | Delete selected item          | Editing  |

## Platform Support

The system automatically detects the platform and maps keys:

- **Mac**: Uses `Meta` (⌘) key
- **Windows/Linux**: Uses `Control` (Ctrl) key

All shortcuts are automatically normalized:

- `Ctrl` → `Meta` on Mac
- `Meta` → `Control` on Windows/Linux

## Context System

Shortcuts can be scoped to specific contexts:

```tsx
// Global context - always active
{
  context: 'global', // or omit context
}

// Canvas context - only active when in canvas
{
  context: 'canvas',
}

// Form context - only active when in forms
{
  context: 'form',
}
```

Set the context in your component:

```tsx
function CanvasEditor() {
  useShortcutContext("canvas");
  // Canvas shortcuts are now active
  return <Canvas />;
}
```

## Best Practices

### 1. Use Descriptive IDs

```tsx
// Good
id: "canvas.duplicate";

// Bad
id: "shortcut1";
```

### 2. Group Related Shortcuts

```tsx
// Group canvas shortcuts together
useKeyboardShortcuts([
  { id: 'canvas.duplicate', ... },
  { id: 'canvas.delete', ... },
  { id: 'canvas.select-all', ... },
]);
```

### 3. Set Context for Component-Specific Shortcuts

```tsx
function CanvasEditor() {
  useShortcutContext('canvas');

  useKeyboardShortcuts([
    {
      id: 'canvas.duplicate',
      context: 'canvas', // Only active in canvas context
      ...
    }
  ]);
}
```

### 4. Allow Shortcuts in Input When Needed

```tsx
// Save shortcut should work even in input fields
useKeyboardShortcuts(
  [{ id: 'save', keys: ['Control', 'S'], ... }],
  { config: { allowInInput: true } }
);
```

### 5. Disable Shortcuts in Modals

```tsx
function Modal() {
  useDisableShortcuts(); // Disable all shortcuts
  return <div>Modal content</div>;
}
```

## Testing

Tests are included in `__tests__/` directory:

```bash
npm test shortcuts
```

Test files:

- `useKeyboardShortcuts.test.ts` - Hook tests
- `ShortcutsDialog.test.tsx` - Dialog component tests
- `platform.test.ts` - Platform detection tests
- `keyMatching.test.ts` - Key matching tests

## Examples

### Example 1: Canvas Editor

```tsx
import { useShortcutContext, useKeyboardShortcuts } from "@/features/shortcuts";

function CanvasEditor() {
  const [selectedNode, setSelectedNode] = useState(null);

  useShortcutContext("canvas");

  useKeyboardShortcuts([
    {
      id: "canvas.duplicate",
      keys: ["Control", "D"],
      description: "Duplicate selected node",
      category: "canvas",
      action: () => duplicateNode(selectedNode),
      context: "canvas",
    },
    {
      id: "canvas.delete",
      keys: ["Delete"],
      description: "Delete selected node",
      category: "canvas",
      action: () => deleteNode(selectedNode),
      context: "canvas",
    },
    {
      id: "canvas.select-all",
      keys: ["Control", "A"],
      description: "Select all nodes",
      category: "canvas",
      action: selectAllNodes,
      context: "canvas",
    },
  ]);

  return <Canvas />;
}
```

### Example 2: Form Editor

```tsx
import { useShortcutContext, useKeyboardShortcuts } from "@/features/shortcuts";

function FormEditor() {
  const { save, isDirty } = useForm();

  useShortcutContext("form");

  useKeyboardShortcuts(
    [
      {
        id: "form.save",
        keys: ["Control", "S"],
        description: "Save form",
        category: "general",
        action: save,
        context: "form",
      },
    ],
    {
      config: { allowInInput: true }, // Allow save even when in input
    }
  );

  return <Form />;
}
```

### Example 3: Navigation Shortcuts

```tsx
import { useKeyboardShortcuts } from "@/features/shortcuts";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  useKeyboardShortcuts([
    {
      id: "nav.dashboard",
      keys: ["Control", "1"],
      description: "Go to dashboard",
      category: "navigation",
      action: () => navigate("/dashboard"),
    },
    {
      id: "nav.agents",
      keys: ["Control", "2"],
      description: "Go to agents",
      category: "navigation",
      action: () => navigate("/agents"),
    },
    {
      id: "nav.pipelines",
      keys: ["Control", "3"],
      description: "Go to pipelines",
      category: "navigation",
      action: () => navigate("/pipelines"),
    },
  ]);

  return <Router />;
}
```

## Architecture

```
shortcuts/
├── types/
│   └── shortcuts.ts          # Type definitions
├── utils/
│   ├── platform.ts           # Platform detection
│   └── keyMatching.ts        # Key matching logic
├── hooks/
│   ├── useKeyboardShortcuts.ts   # Main hook
│   ├── useShortcutContext.ts     # Context management
│   └── useGlobalShortcuts.ts     # Default shortcuts
├── components/
│   ├── ShortcutsDialog.tsx   # Shortcuts dialog
│   └── ShortcutBadge.tsx     # Key display
├── store/
│   └── shortcuts.ts          # Zustand store
├── __tests__/               # Tests
└── index.ts                 # Public exports
```

## License

Part of Kaizen Studio frontend application.
