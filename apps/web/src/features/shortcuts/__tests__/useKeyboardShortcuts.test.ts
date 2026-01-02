/**
 * Tests for useKeyboardShortcuts hook
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  useKeyboardShortcuts,
  useKeyboardShortcut,
} from "../hooks/useKeyboardShortcuts";
import { useShortcutsStore } from "../store/shortcuts";
import type { Shortcut } from "../types/shortcuts";

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    // Clear store before each test
    useShortcutsStore.getState().clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should register shortcuts", () => {
    const mockAction = vi.fn();
    const shortcuts: Shortcut[] = [
      {
        id: "test.shortcut",
        keys: ["Control", "K"],
        description: "Test shortcut",
        category: "general",
        action: mockAction,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const registeredShortcut = useShortcutsStore
      .getState()
      .getShortcut("test.shortcut");
    expect(registeredShortcut).toBeDefined();
    expect(registeredShortcut?.keys).toEqual(["Control", "K"]);
  });

  it("should unregister shortcuts on unmount", () => {
    const mockAction = vi.fn();
    const shortcuts: Shortcut[] = [
      {
        id: "test.shortcut",
        keys: ["Control", "K"],
        description: "Test shortcut",
        category: "general",
        action: mockAction,
      },
    ];

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

    expect(
      useShortcutsStore.getState().getShortcut("test.shortcut")
    ).toBeDefined();

    unmount();

    expect(
      useShortcutsStore.getState().getShortcut("test.shortcut")
    ).toBeUndefined();
  });

  it("should execute action when matching keys pressed", async () => {
    const mockAction = vi.fn();
    const shortcuts: Shortcut[] = [
      {
        id: "test.shortcut",
        keys: ["Control", "K"],
        description: "Test shortcut",
        category: "general",
        action: mockAction,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Ctrl+K keypress
    const event = new KeyboardEvent("keydown", {
      key: "K",
      ctrlKey: true,
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  it("should not execute action when disabled", async () => {
    const mockAction = vi.fn();
    const shortcuts: Shortcut[] = [
      {
        id: "test.shortcut",
        keys: ["Control", "K"],
        description: "Test shortcut",
        category: "general",
        action: mockAction,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, { enabled: false }));

    const event = new KeyboardEvent("keydown", {
      key: "K",
      ctrlKey: true,
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(mockAction).not.toHaveBeenCalled();
    });
  });

  it("should not execute action when focused on input", async () => {
    const mockAction = vi.fn();
    const shortcuts: Shortcut[] = [
      {
        id: "test.shortcut",
        keys: ["Control", "K"],
        description: "Test shortcut",
        category: "general",
        action: mockAction,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Create input element and focus it
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "K",
      ctrlKey: true,
      bubbles: true,
    });

    act(() => {
      input.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(mockAction).not.toHaveBeenCalled();
    });

    document.body.removeChild(input);
  });

  it("should execute action when focused on input if allowInInput is true", async () => {
    const mockAction = vi.fn();
    const shortcuts: Shortcut[] = [
      {
        id: "test.shortcut",
        keys: ["Control", "K"],
        description: "Test shortcut",
        category: "general",
        action: mockAction,
      },
    ];

    renderHook(() =>
      useKeyboardShortcuts(shortcuts, { config: { allowInInput: true } })
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "K",
      ctrlKey: true,
      bubbles: true,
    });

    act(() => {
      input.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    document.body.removeChild(input);
  });

  it("should handle multiple shortcuts", async () => {
    const mockAction1 = vi.fn();
    const mockAction2 = vi.fn();
    const shortcuts: Shortcut[] = [
      {
        id: "test.shortcut1",
        keys: ["Control", "K"],
        description: "Test shortcut 1",
        category: "general",
        action: mockAction1,
      },
      {
        id: "test.shortcut2",
        keys: ["Control", "S"],
        description: "Test shortcut 2",
        category: "general",
        action: mockAction2,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Test first shortcut
    const event1 = new KeyboardEvent("keydown", {
      key: "K",
      ctrlKey: true,
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(event1);
    });

    await waitFor(() => {
      expect(mockAction1).toHaveBeenCalledTimes(1);
      expect(mockAction2).not.toHaveBeenCalled();
    });

    // Test second shortcut
    const event2 = new KeyboardEvent("keydown", {
      key: "S",
      ctrlKey: true,
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(event2);
    });

    await waitFor(() => {
      expect(mockAction1).toHaveBeenCalledTimes(1);
      expect(mockAction2).toHaveBeenCalledTimes(1);
    });
  });
});

describe("useKeyboardShortcut", () => {
  beforeEach(() => {
    useShortcutsStore.getState().clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should register single shortcut", () => {
    const mockAction = vi.fn();
    const shortcut: Shortcut = {
      id: "test.shortcut",
      keys: ["Control", "K"],
      description: "Test shortcut",
      category: "general",
      action: mockAction,
    };

    renderHook(() => useKeyboardShortcut(shortcut));

    const registeredShortcut = useShortcutsStore
      .getState()
      .getShortcut("test.shortcut");
    expect(registeredShortcut).toBeDefined();
  });

  it("should return trigger function", () => {
    const mockAction = vi.fn();
    const shortcut: Shortcut = {
      id: "test.shortcut",
      keys: ["Control", "K"],
      description: "Test shortcut",
      category: "general",
      action: mockAction,
    };

    const { result } = renderHook(() => useKeyboardShortcut(shortcut));

    act(() => {
      result.current.trigger();
    });

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it("should handle errors in action", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const mockAction = vi.fn(() => {
      throw new Error("Test error");
    });

    const shortcut: Shortcut = {
      id: "test.shortcut",
      keys: ["Control", "K"],
      description: "Test shortcut",
      category: "general",
      action: mockAction,
    };

    const { result } = renderHook(() => useKeyboardShortcut(shortcut));

    act(() => {
      result.current.trigger();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
