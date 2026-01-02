/**
 * Zustand store for keyboard shortcuts registry
 */

import { create } from "zustand";
import type { Shortcut, ShortcutContext } from "../types/shortcuts";

interface ShortcutsState {
  shortcuts: Map<string, Shortcut>;
  currentContext: ShortcutContext;
  enabled: boolean;

  // Actions
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (id: string) => void;
  getShortcut: (id: string) => Shortcut | undefined;
  getAllShortcuts: () => Shortcut[];
  getShortcutsByContext: (context?: ShortcutContext) => Shortcut[];
  setContext: (context: ShortcutContext) => void;
  setEnabled: (enabled: boolean) => void;
  clear: () => void;
}

export const useShortcutsStore = create<ShortcutsState>((set, get) => ({
  shortcuts: new Map(),
  currentContext: "global",
  enabled: true,

  registerShortcut: (shortcut: Shortcut) => {
    set((state) => {
      const newShortcuts = new Map(state.shortcuts);
      newShortcuts.set(shortcut.id, {
        ...shortcut,
        enabled: shortcut.enabled ?? true,
      });
      return { shortcuts: newShortcuts };
    });
  },

  unregisterShortcut: (id: string) => {
    set((state) => {
      const newShortcuts = new Map(state.shortcuts);
      newShortcuts.delete(id);
      return { shortcuts: newShortcuts };
    });
  },

  getShortcut: (id: string) => {
    return get().shortcuts.get(id);
  },

  getAllShortcuts: () => {
    return Array.from(get().shortcuts.values());
  },

  getShortcutsByContext: (context?: ShortcutContext) => {
    const targetContext = context ?? get().currentContext;
    return Array.from(get().shortcuts.values()).filter(
      (shortcut) =>
        shortcut.enabled !== false &&
        (!shortcut.context ||
          shortcut.context === targetContext ||
          shortcut.context === "global")
    );
  },

  setContext: (context: ShortcutContext) => {
    set({ currentContext: context });
  },

  setEnabled: (enabled: boolean) => {
    set({ enabled });
  },

  clear: () => {
    set({ shortcuts: new Map() });
  },
}));
