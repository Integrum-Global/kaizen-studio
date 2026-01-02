/**
 * Keyboard shortcuts type definitions
 */

export type ShortcutCategory = "navigation" | "canvas" | "editing" | "general";

export type ShortcutContext =
  | "global"
  | "canvas"
  | "form"
  | "dialog"
  | "editor";

export interface Shortcut {
  id: string;
  keys: string[]; // ['Ctrl', 'K'] or ['Meta', 'K'] for Mac
  description: string;
  category: ShortcutCategory;
  action: () => void;
  context?: ShortcutContext; // If specified, only active in this context
  enabled?: boolean; // Default true
}

export interface ShortcutBinding {
  shortcut: Shortcut;
  unregister: () => void;
}

export interface KeyboardEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export interface ShortcutGroup {
  category: ShortcutCategory;
  shortcuts: Shortcut[];
}

export interface ShortcutMatch {
  shortcut: Shortcut;
  keys: string[];
}

export type Platform = "mac" | "windows" | "linux";

export interface ShortcutConfig {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  allowInInput?: boolean; // Allow shortcut when focused on input elements
}
