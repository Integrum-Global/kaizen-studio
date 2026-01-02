/**
 * Hook to register default global shortcuts
 */

import { useState, useCallback } from "react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import type { Shortcut } from "../types/shortcuts";

interface UseGlobalShortcutsOptions {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
}

/**
 * Register default global shortcuts for common actions
 *
 * @example
 * ```tsx
 * const { showShortcutsDialog } = useGlobalShortcuts({
 *   onSave: handleSave,
 *   onUndo: handleUndo,
 *   onRedo: handleRedo,
 * });
 * ```
 */
export function useGlobalShortcuts(options: UseGlobalShortcutsOptions = {}) {
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // Create shortcuts based on provided callbacks
  const shortcuts: Shortcut[] = [];

  // Ctrl+K: Search / Command palette
  if (options.onSearch) {
    shortcuts.push({
      id: "global.search",
      keys: ["Control", "K"],
      description: "Open command palette / search",
      category: "general",
      action: options.onSearch,
    });
  }

  // Ctrl+/: Show shortcuts dialog
  shortcuts.push({
    id: "global.shortcuts",
    keys: ["Control", "/"],
    description: "Show keyboard shortcuts",
    category: "general",
    action: useCallback(() => {
      setShowShortcutsDialog((prev) => !prev);
    }, []),
  });

  // Ctrl+S: Save
  if (options.onSave) {
    shortcuts.push({
      id: "global.save",
      keys: ["Control", "S"],
      description: "Save",
      category: "general",
      action: options.onSave,
    });
  }

  // Ctrl+Z: Undo
  if (options.onUndo) {
    shortcuts.push({
      id: "global.undo",
      keys: ["Control", "Z"],
      description: "Undo",
      category: "editing",
      action: options.onUndo,
    });
  }

  // Ctrl+Shift+Z or Ctrl+Y: Redo
  if (options.onRedo) {
    shortcuts.push(
      {
        id: "global.redo",
        keys: ["Control", "Shift", "Z"],
        description: "Redo",
        category: "editing",
        action: options.onRedo,
      },
      {
        id: "global.redo.alt",
        keys: ["Control", "Y"],
        description: "Redo (alternative)",
        category: "editing",
        action: options.onRedo,
      }
    );
  }

  // Escape: Close dialog/modal
  if (options.onEscape) {
    shortcuts.push({
      id: "global.escape",
      keys: ["Escape"],
      description: "Close dialog or cancel",
      category: "general",
      action: options.onEscape,
    });
  }

  // Delete: Delete selected item
  if (options.onDelete) {
    shortcuts.push({
      id: "global.delete",
      keys: ["Delete"],
      description: "Delete selected item",
      category: "editing",
      action: options.onDelete,
    });
  }

  // Register shortcuts
  useKeyboardShortcuts(shortcuts);

  return {
    showShortcutsDialog,
    setShowShortcutsDialog,
  };
}
