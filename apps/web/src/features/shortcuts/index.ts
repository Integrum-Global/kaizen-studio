/**
 * Keyboard shortcuts feature exports
 *
 * @example
 * ```tsx
 * import {
 *   useKeyboardShortcuts,
 *   useGlobalShortcuts,
 *   ShortcutsDialog,
 *   ShortcutBadge
 * } from '@/features/shortcuts';
 * ```
 */

// Types
export type {
  Shortcut,
  ShortcutCategory,
  ShortcutContext,
  ShortcutBinding,
  ShortcutGroup,
  ShortcutConfig,
  Platform,
} from "./types/shortcuts";

// Hooks
export {
  useKeyboardShortcuts,
  useKeyboardShortcut,
} from "./hooks/useKeyboardShortcuts";
export {
  useShortcutContext,
  useCurrentContext,
  useDisableShortcuts,
} from "./hooks/useShortcutContext";
export { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";

// Components
export { ShortcutsDialog } from "./components/ShortcutsDialog";
export { ShortcutBadge, InlineShortcut } from "./components/ShortcutBadge";

// Store
export { useShortcutsStore } from "./store/shortcuts";

// Utils
export {
  detectPlatform,
  isMac,
  getModifierKey,
  getModifierKeyDisplay,
  formatKeyDisplay,
  normalizeKeys,
} from "./utils/platform";

export {
  isInputElement,
  getEventKeys,
  matchesShortcut,
  shouldAllowShortcut,
  formatShortcutKeys,
  parseShortcutString,
} from "./utils/keyMatching";
