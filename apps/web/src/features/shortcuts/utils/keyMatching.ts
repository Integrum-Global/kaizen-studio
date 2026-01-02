/**
 * Keyboard event matching utilities
 */

import type { Shortcut, ShortcutConfig } from "../types/shortcuts";
import { normalizeKeys } from "./platform";

/**
 * Check if target element is an input field where shortcuts should be disabled
 */
export function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();
  // Check if element is contentEditable (true if editable, false/undefined if not)
  const isContentEditable = element.isContentEditable === true;

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    isContentEditable
  );
}

/**
 * Extract pressed keys from keyboard event
 */
export function getEventKeys(event: KeyboardEvent): string[] {
  const keys: string[] = [];

  // Add modifier keys
  if (event.ctrlKey) keys.push("Control");
  if (event.metaKey) keys.push("Meta");
  if (event.shiftKey) keys.push("Shift");
  if (event.altKey) keys.push("Alt");

  // Add the main key (normalize to avoid special cases)
  const key = event.key;

  // Skip if only modifier keys pressed
  if (key === "Control" || key === "Meta" || key === "Shift" || key === "Alt") {
    return keys;
  }

  // Normalize key names
  const normalizedKey = normalizeKey(key);
  keys.push(normalizedKey);

  return keys;
}

/**
 * Normalize key name for consistent matching
 */
function normalizeKey(key: string): string {
  // Normalize special keys first
  const keyMap: Record<string, string> = {
    Esc: "Escape",
    Del: "Delete",
    " ": "Space",
  };

  if (keyMap[key]) {
    return keyMap[key];
  }

  // Convert to uppercase for single letter keys
  if (key.length === 1 && key !== " ") {
    return key.toUpperCase();
  }

  return key;
}

/**
 * Check if event matches shortcut keys
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: Shortcut
): boolean {
  const eventKeys = getEventKeys(event);
  const shortcutKeys = normalizeKeys(shortcut.keys);

  // Must have same number of keys
  if (eventKeys.length !== shortcutKeys.length) {
    return false;
  }

  // Check if all shortcut keys are pressed
  return shortcutKeys.every((key) => eventKeys.includes(key));
}

/**
 * Check if shortcut should be allowed based on focus and config
 */
export function shouldAllowShortcut(
  event: KeyboardEvent,
  config?: ShortcutConfig
): boolean {
  // Check if focused on input element
  const isInput = isInputElement(event.target);

  // If focused on input and shortcut doesn't allow it, block
  if (isInput && !config?.allowInInput) {
    return false;
  }

  return true;
}

/**
 * Format shortcut keys as display string
 */
export function formatShortcutKeys(keys: string[]): string {
  return keys.join("+");
}

/**
 * Parse shortcut string to keys array
 * Example: "Ctrl+K" -> ["Control", "K"]
 */
export function parseShortcutString(shortcut: string): string[] {
  return shortcut.split("+").map((key) => {
    const trimmed = key.trim();
    // Normalize common variations
    if (trimmed.toLowerCase() === "ctrl") return "Control";
    if (trimmed.toLowerCase() === "cmd") return "Meta";
    if (trimmed.toLowerCase() === "alt") return "Alt";
    if (trimmed.toLowerCase() === "shift") return "Shift";
    return trimmed;
  });
}
