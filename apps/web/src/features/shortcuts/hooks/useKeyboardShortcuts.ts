/**
 * Hook for registering and managing keyboard shortcuts
 */

import { useEffect, useCallback, useRef } from "react";
import type { Shortcut, ShortcutConfig } from "../types/shortcuts";
import { useShortcutsStore } from "../store/shortcuts";
import { matchesShortcut, shouldAllowShortcut } from "../utils/keyMatching";

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  config?: ShortcutConfig;
}

/**
 * Register global keyboard shortcuts
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     id: 'save',
 *     keys: ['Control', 'S'],
 *     description: 'Save',
 *     category: 'general',
 *     action: handleSave
 *   }
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: Shortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, config } = options;
  const {
    registerShortcut,
    unregisterShortcut,
    getShortcutsByContext,
    enabled: globalEnabled,
  } = useShortcutsStore();

  // Store shortcuts in ref to avoid re-registering on every render
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  // Register shortcuts
  useEffect(() => {
    if (!enabled) return;

    shortcuts.forEach((shortcut) => {
      registerShortcut(shortcut);
    });

    return () => {
      shortcuts.forEach((shortcut) => {
        unregisterShortcut(shortcut.id);
      });
    };
  }, [enabled, registerShortcut, unregisterShortcut]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if shortcuts are enabled
      if (!enabled || !globalEnabled) {
        return;
      }

      // Check if we should allow shortcuts based on focus
      if (!shouldAllowShortcut(event, config)) {
        return;
      }

      // Get active shortcuts for current context
      const activeShortcuts = getShortcutsByContext();

      // Find matching shortcut
      for (const shortcut of activeShortcuts) {
        if (matchesShortcut(event, shortcut)) {
          // Prevent default if configured
          if (config?.preventDefault !== false) {
            event.preventDefault();
          }

          // Stop propagation if configured
          if (config?.stopPropagation) {
            event.stopPropagation();
          }

          // Execute action
          try {
            shortcut.action();
          } catch (error) {
            console.error(`Error executing shortcut ${shortcut.id}:`, error);
          }

          // Only execute first matching shortcut
          break;
        }
      }
    },
    [enabled, globalEnabled, config, getShortcutsByContext]
  );

  // Attach event listener
  useEffect(() => {
    if (!enabled || !globalEnabled) {
      return;
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, globalEnabled, handleKeyDown]);
}

/**
 * Register a single keyboard shortcut
 *
 * @example
 * ```tsx
 * const { trigger } = useKeyboardShortcut({
 *   id: 'save',
 *   keys: ['Control', 'S'],
 *   description: 'Save',
 *   category: 'general',
 *   action: handleSave
 * });
 * ```
 */
export function useKeyboardShortcut(
  shortcut: Shortcut,
  options: UseKeyboardShortcutsOptions = {}
) {
  useKeyboardShortcuts([shortcut], options);

  // Return function to manually trigger the shortcut
  const trigger = useCallback(() => {
    try {
      shortcut.action();
    } catch (error) {
      console.error(`Error executing shortcut ${shortcut.id}:`, error);
    }
  }, [shortcut]);

  return { trigger };
}
