/**
 * Hook for context-aware keyboard shortcuts
 */

import { useEffect } from "react";
import type { ShortcutContext } from "../types/shortcuts";
import { useShortcutsStore } from "../store/shortcuts";

/**
 * Set the current shortcut context
 * Shortcuts with matching context will be active
 *
 * @example
 * ```tsx
 * function CanvasEditor() {
 *   useShortcutContext('canvas');
 *
 *   return <div>Canvas content</div>;
 * }
 * ```
 */
export function useShortcutContext(context: ShortcutContext) {
  const { setContext } = useShortcutsStore();

  useEffect(() => {
    // Set context when component mounts
    setContext(context);

    // Reset to global when component unmounts
    return () => {
      setContext("global");
    };
  }, [context, setContext]);
}

/**
 * Hook to get the current shortcut context
 */
export function useCurrentContext(): ShortcutContext {
  return useShortcutsStore((state) => state.currentContext);
}

/**
 * Hook to temporarily disable all shortcuts
 *
 * @example
 * ```tsx
 * function ModalDialog() {
 *   // Disable shortcuts while modal is open
 *   useDisableShortcuts();
 *
 *   return <div>Modal content</div>;
 * }
 * ```
 */
export function useDisableShortcuts(disabled: boolean = true) {
  const { setEnabled } = useShortcutsStore();

  useEffect(() => {
    if (disabled) {
      setEnabled(false);

      return () => {
        setEnabled(true);
      };
    }
    return undefined;
  }, [disabled, setEnabled]);
}
