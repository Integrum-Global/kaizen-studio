/**
 * Tests for platform detection utilities
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  detectPlatform,
  isMac,
  getModifierKey,
  getModifierKeyDisplay,
  formatKeyDisplay,
  normalizeKeys,
} from "../utils/platform";

describe("platform utilities", () => {
  describe("detectPlatform", () => {
    it("should detect Mac platform", () => {
      const mockNavigator = {
        platform: "MacIntel",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      expect(detectPlatform()).toBe("mac");
    });

    it("should detect Windows platform", () => {
      const mockNavigator = {
        platform: "Win32",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      expect(detectPlatform()).toBe("windows");
    });

    it("should detect Linux platform", () => {
      const mockNavigator = {
        platform: "Linux x86_64",
        userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      expect(detectPlatform()).toBe("linux");
    });
  });

  describe("isMac", () => {
    it("should return true on Mac", () => {
      const mockNavigator = {
        platform: "MacIntel",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      expect(isMac()).toBe(true);
    });

    it("should return false on non-Mac", () => {
      const mockNavigator = {
        platform: "Win32",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      expect(isMac()).toBe(false);
    });
  });

  describe("getModifierKey", () => {
    it("should return Meta on Mac", () => {
      const mockNavigator = {
        platform: "MacIntel",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      expect(getModifierKey()).toBe("Meta");
    });

    it("should return Control on non-Mac", () => {
      const mockNavigator = {
        platform: "Win32",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      expect(getModifierKey()).toBe("Control");
    });
  });

  describe("getModifierKeyDisplay", () => {
    it("should return ⌘ on Mac", () => {
      const mockNavigator = {
        platform: "MacIntel",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      expect(getModifierKeyDisplay()).toBe("⌘");
    });

    it("should return Ctrl on non-Mac", () => {
      const mockNavigator = {
        platform: "Win32",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      expect(getModifierKeyDisplay()).toBe("Ctrl");
    });
  });

  describe("formatKeyDisplay", () => {
    beforeEach(() => {
      // Default to Windows for consistent testing
      const mockNavigator = {
        platform: "Win32",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });
    });

    it("should format Control key", () => {
      expect(formatKeyDisplay("Control")).toBe("Ctrl");
    });

    it("should format Meta key", () => {
      expect(formatKeyDisplay("Meta")).toBe("Win");
    });

    it("should format Alt key", () => {
      expect(formatKeyDisplay("Alt")).toBe("Alt");
    });

    it("should format Shift key", () => {
      expect(formatKeyDisplay("Shift")).toBe("Shift");
    });

    it("should format Enter key", () => {
      expect(formatKeyDisplay("Enter")).toBe("↵");
    });

    it("should format Escape key", () => {
      expect(formatKeyDisplay("Escape")).toBe("Esc");
    });

    it("should format arrow keys", () => {
      expect(formatKeyDisplay("ArrowUp")).toBe("↑");
      expect(formatKeyDisplay("ArrowDown")).toBe("↓");
      expect(formatKeyDisplay("ArrowLeft")).toBe("←");
      expect(formatKeyDisplay("ArrowRight")).toBe("→");
    });

    it("should format Delete key", () => {
      expect(formatKeyDisplay("Delete")).toBe("Del");
    });

    it("should return unrecognized keys as-is", () => {
      expect(formatKeyDisplay("K")).toBe("K");
      expect(formatKeyDisplay("F1")).toBe("F1");
    });
  });

  describe("normalizeKeys", () => {
    it("should convert Ctrl to Meta on Mac", () => {
      const mockNavigator = {
        platform: "MacIntel",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      expect(normalizeKeys(["Ctrl", "K"])).toEqual(["Meta", "K"]);
    });

    it("should convert Meta to Control on non-Mac", () => {
      const mockNavigator = {
        platform: "Win32",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      };
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      expect(normalizeKeys(["Meta", "K"])).toEqual(["Control", "K"]);
    });

    it("should keep other keys unchanged", () => {
      expect(normalizeKeys(["Shift", "Alt", "K"])).toEqual([
        "Shift",
        "Alt",
        "K",
      ]);
    });
  });
});
