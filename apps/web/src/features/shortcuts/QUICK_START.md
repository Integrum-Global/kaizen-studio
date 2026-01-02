# Keyboard Shortcuts - Quick Start Guide

## Installation

The keyboard shortcuts feature is already included. Just import and use:

```tsx
import { useGlobalShortcuts, ShortcutsDialog } from "@/features/shortcuts";
```

## 5-Minute Integration

### Step 1: Add to Your Main App (2 min)

```tsx
// src/App.tsx
import { useGlobalShortcuts, ShortcutsDialog } from "@/features/shortcuts";

function App() {
  const { showShortcutsDialog, setShowShortcutsDialog } = useGlobalShortcuts({
    onSave: () => console.log("Save"),
    onUndo: () => console.log("Undo"),
    onRedo: () => console.log("Redo"),
  });

  return (
    <div>
      <YourAppContent />

      {/* Shortcuts dialog - triggered by Ctrl+/ */}
      <ShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
      />
    </div>
  );
}
```

**That's it! You now have:**

- Ctrl+/ to show shortcuts
- Ctrl+S to save
- Ctrl+Z to undo
- Ctrl+Shift+Z to redo

### Step 2: Add Custom Shortcuts (2 min)

```tsx
import { useKeyboardShortcuts } from "@/features/shortcuts";

function MyComponent() {
  useKeyboardShortcuts([
    {
      id: "my.action",
      keys: ["Control", "K"],
      description: "Do something",
      category: "general",
      action: () => console.log("Action!"),
    },
  ]);

  return <div>My Component</div>;
}
```

### Step 3: Context-Specific Shortcuts (1 min)

```tsx
import { useShortcutContext, useKeyboardShortcuts } from "@/features/shortcuts";

function CanvasEditor() {
  // Set context so canvas shortcuts are active
  useShortcutContext("canvas");

  useKeyboardShortcuts([
    {
      id: "canvas.delete",
      keys: ["Delete"],
      description: "Delete node",
      category: "canvas",
      action: handleDelete,
      context: "canvas", // Only active in canvas
    },
  ]);

  return <Canvas />;
}
```

## Common Patterns

### Navigation Shortcuts

```tsx
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

useKeyboardShortcuts([
  {
    id: "nav.dashboard",
    keys: ["Control", "1"],
    description: "Go to dashboard",
    category: "navigation",
    action: () => navigate("/dashboard"),
  },
]);
```

### Toolbar with Shortcuts

```tsx
import { ShortcutBadge } from "@/features/shortcuts";

<button onClick={handleSave}>
  Save
  <ShortcutBadge keys={["Control", "S"]} />
</button>;
```

### Allow Shortcuts in Input Fields

```tsx
useKeyboardShortcuts(
  [{ id: 'save', keys: ['Control', 'S'], ... }],
  { config: { allowInInput: true } } // Save even when typing
);
```

## Available Contexts

- `global` - Always active (default)
- `canvas` - Canvas editor
- `form` - Form editing
- `dialog` - Dialogs/modals
- `editor` - Text editor

## Default Shortcuts

Press **Ctrl+/** to see all shortcuts!

| Shortcut           | Action                 |
| ------------------ | ---------------------- |
| Ctrl+K / ⌘K        | Search/Command Palette |
| Ctrl+/ / ⌘/        | Show Shortcuts         |
| Ctrl+S / ⌘S        | Save                   |
| Ctrl+Z / ⌘Z        | Undo                   |
| Ctrl+Shift+Z / ⌘⇧Z | Redo                   |
| Escape             | Close Dialog           |
| Delete             | Delete Item            |

## Tips

1. **Mac Support**: Automatically uses ⌘ instead of Ctrl on Mac
2. **Input Safe**: Shortcuts disabled in text inputs by default
3. **Search**: Type Ctrl+/ and search for shortcuts
4. **Context**: Use `useShortcutContext()` for component-specific shortcuts
5. **Disable**: Use `useDisableShortcuts()` in modals to disable all shortcuts

## Need Help?

- Full docs: `src/features/shortcuts/README.md`
- Examples: `src/features/shortcuts/examples/`
- Types: `src/features/shortcuts/types/shortcuts.ts`

## Try It Now!

1. Press **Ctrl+/** to see the shortcuts dialog
2. Search for shortcuts
3. Click tabs to see different categories

That's it! You're ready to use keyboard shortcuts in your app.
