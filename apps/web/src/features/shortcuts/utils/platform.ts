/**
 * Platform detection utilities for keyboard shortcuts
 */

import type { Platform } from "../types/shortcuts";

/**
 * Detect the current platform
 */
export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") {
    return "windows";
  }

  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  if (platform.includes("mac") || userAgent.includes("mac")) {
    return "mac";
  }

  if (platform.includes("linux") || userAgent.includes("linux")) {
    return "linux";
  }

  return "windows";
}

/**
 * Check if current platform is Mac
 */
export function isMac(): boolean {
  return detectPlatform() === "mac";
}

/**
 * Get the modifier key for the current platform
 * Returns 'Meta' for Mac (Cmd key), 'Control' for others
 */
export function getModifierKey(): string {
  return isMac() ? "Meta" : "Control";
}

/**
 * Get the display name for the modifier key
 */
export function getModifierKeyDisplay(): string {
  return isMac() ? "⌘" : "Ctrl";
}

/**
 * Convert key names to display format
 */
export function formatKeyDisplay(key: string): string {
  const keyMap: Record<string, string> = {
    Meta: isMac() ? "⌘" : "Win",
    Control: isMac() ? "⌃" : "Ctrl",
    Alt: isMac() ? "⌥" : "Alt",
    Shift: isMac() ? "⇧" : "Shift",
    Enter: "↵",
    Escape: "Esc",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Backspace: "⌫",
    Delete: isMac() ? "⌦" : "Del",
    Tab: "⇥",
    Space: "Space",
  };

  return keyMap[key] || key;
}

/**
 * Normalize keys for cross-platform compatibility
 * Converts platform-specific keys to standard names
 */
export function normalizeKeys(keys: string[]): string[] {
  return keys.map((key) => {
    // Convert Ctrl to Meta on Mac
    if (key === "Ctrl" && isMac()) {
      return "Meta";
    }
    // Convert Meta to Control on non-Mac
    if (key === "Meta" && !isMac()) {
      return "Control";
    }
    return key;
  });
}
