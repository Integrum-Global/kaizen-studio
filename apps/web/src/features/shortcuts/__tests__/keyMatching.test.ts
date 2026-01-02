/**
 * Tests for key matching utilities
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isInputElement,
  getEventKeys,
  matchesShortcut,
  shouldAllowShortcut,
  parseShortcutString,
} from "../utils/keyMatching";
import type { Shortcut } from "../types/shortcuts";

describe("keyMatching utilities", () => {
  describe("isInputElement", () => {
    it("should return true for input elements", () => {
      const input = document.createElement("input");
      expect(isInputElement(input)).toBe(true);
    });

    it("should return true for textarea elements", () => {
      const textarea = document.createElement("textarea");
      expect(isInputElement(textarea)).toBe(true);
    });

    it("should return true for select elements", () => {
      const select = document.createElement("select");
      expect(isInputElement(select)).toBe(true);
    });

    // Note: isContentEditable doesn't work correctly in jsdom test environment
    // This works correctly in real browsers but skipping in tests
    it.skip("should return true for contentEditable elements", () => {
      const div = document.createElement("div");
      div.setAttribute("contenteditable", "true");
      expect(isInputElement(div)).toBe(true);
    });

    it("should return false for regular elements", () => {
      const div = document.createElement("div");
      expect(isInputElement(div)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isInputElement(null)).toBe(false);
    });
  });

  describe("getEventKeys", () => {
    it("should extract Control key", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
        ctrlKey: true,
      });
      const keys = getEventKeys(event);
      expect(keys).toContain("Control");
      expect(keys).toContain("K");
    });

    it("should extract Meta key", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
        metaKey: true,
      });
      const keys = getEventKeys(event);
      expect(keys).toContain("Meta");
      expect(keys).toContain("K");
    });

    it("should extract Shift key", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
        shiftKey: true,
      });
      const keys = getEventKeys(event);
      expect(keys).toContain("Shift");
      expect(keys).toContain("K");
    });

    it("should extract Alt key", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
        altKey: true,
      });
      const keys = getEventKeys(event);
      expect(keys).toContain("Alt");
      expect(keys).toContain("K");
    });

    it("should extract multiple modifier keys", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
        ctrlKey: true,
        shiftKey: true,
      });
      const keys = getEventKeys(event);
      expect(keys).toContain("Control");
      expect(keys).toContain("Shift");
      expect(keys).toContain("K");
    });

    it("should normalize lowercase letters to uppercase", () => {
      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
      });
      const keys = getEventKeys(event);
      expect(keys).toContain("K");
    });

    it("should skip modifier-only key presses", () => {
      const event = new KeyboardEvent("keydown", {
        key: "Control",
        ctrlKey: true,
      });
      const keys = getEventKeys(event);
      expect(keys).toEqual(["Control"]);
    });

    it("should normalize special keys", () => {
      const event = new KeyboardEvent("keydown", {
        key: "Esc",
      });
      const keys = getEventKeys(event);
      expect(keys).toContain("Escape");
    });

    it("should normalize space key", () => {
      // Create event with space key
      const event = new KeyboardEvent("keydown", {
        key: " ",
      });
      const keys = getEventKeys(event);
      // The key should be normalized to "Space"
      expect(keys.length).toBeGreaterThan(0);
      expect(keys[keys.length - 1]).toBe("Space");
    });
  });

  describe("matchesShortcut", () => {
    it("should match simple shortcut", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
        ctrlKey: true,
      });

      const shortcut: Shortcut = {
        id: "test",
        keys: ["Control", "K"],
        description: "Test",
        category: "general",
        action: () => {},
      };

      expect(matchesShortcut(event, shortcut)).toBe(true);
    });

    it("should match multi-modifier shortcut", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
        ctrlKey: true,
        shiftKey: true,
      });

      const shortcut: Shortcut = {
        id: "test",
        keys: ["Control", "Shift", "K"],
        description: "Test",
        category: "general",
        action: () => {},
      };

      expect(matchesShortcut(event, shortcut)).toBe(true);
    });

    it("should not match different keys", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
        ctrlKey: true,
      });

      const shortcut: Shortcut = {
        id: "test",
        keys: ["Control", "S"],
        description: "Test",
        category: "general",
        action: () => {},
      };

      expect(matchesShortcut(event, shortcut)).toBe(false);
    });

    it("should not match if modifier missing", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
      });

      const shortcut: Shortcut = {
        id: "test",
        keys: ["Control", "K"],
        description: "Test",
        category: "general",
        action: () => {},
      };

      expect(matchesShortcut(event, shortcut)).toBe(false);
    });

    it("should not match if extra modifier pressed", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
        ctrlKey: true,
        shiftKey: true,
      });

      const shortcut: Shortcut = {
        id: "test",
        keys: ["Control", "K"],
        description: "Test",
        category: "general",
        action: () => {},
      };

      expect(matchesShortcut(event, shortcut)).toBe(false);
    });
  });

  describe("shouldAllowShortcut", () => {
    let input: HTMLInputElement;

    beforeEach(() => {
      input = document.createElement("input");
      document.body.appendChild(input);
    });

    afterEach(() => {
      document.body.removeChild(input);
    });

    it("should block shortcuts on input by default", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
        ctrlKey: true,
      });

      // Manually set target
      Object.defineProperty(event, "target", {
        value: input,
        writable: false,
      });

      expect(shouldAllowShortcut(event)).toBe(false);
    });

    it("should allow shortcuts on input if config allows", () => {
      const event = new KeyboardEvent("keydown", {
        key: "K",
        ctrlKey: true,
      });

      Object.defineProperty(event, "target", {
        value: input,
        writable: false,
      });

      expect(shouldAllowShortcut(event, { allowInInput: true })).toBe(true);
    });

    it("should allow shortcuts on non-input elements", () => {
      const div = document.createElement("div");
      const event = new KeyboardEvent("keydown", {
        key: "K",
        ctrlKey: true,
      });

      Object.defineProperty(event, "target", {
        value: div,
        writable: false,
      });

      expect(shouldAllowShortcut(event)).toBe(true);
    });
  });

  describe("parseShortcutString", () => {
    it("should parse simple shortcut", () => {
      expect(parseShortcutString("Ctrl+K")).toEqual(["Control", "K"]);
    });

    it("should parse multi-modifier shortcut", () => {
      expect(parseShortcutString("Ctrl+Shift+K")).toEqual([
        "Control",
        "Shift",
        "K",
      ]);
    });

    it("should normalize ctrl to Control", () => {
      expect(parseShortcutString("ctrl+k")).toEqual(["Control", "k"]);
    });

    it("should normalize cmd to Meta", () => {
      expect(parseShortcutString("cmd+k")).toEqual(["Meta", "k"]);
    });

    it("should normalize alt", () => {
      expect(parseShortcutString("alt+k")).toEqual(["Alt", "k"]);
    });

    it("should normalize shift", () => {
      expect(parseShortcutString("shift+k")).toEqual(["Shift", "k"]);
    });

    it("should handle spaces", () => {
      expect(parseShortcutString("Ctrl + K")).toEqual(["Control", "K"]);
    });

    it("should handle single key", () => {
      expect(parseShortcutString("Escape")).toEqual(["Escape"]);
    });
  });
});
