import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMediaQuery } from "../useMediaQuery";

describe("useMediaQuery", () => {
  beforeEach(() => {
    // Reset the matchMedia mock before each test
    vi.clearAllMocks();
  });

  it("should return false for non-matching media query", () => {
    // Mock matchMedia to return false
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("should return true for matching media query", () => {
    // Mock matchMedia to return true
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("should update when media query changes", async () => {
    let listeners: ((event: MediaQueryListEvent) => void)[] = [];

    // Mock matchMedia with ability to trigger change events
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_, listener) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn((_, listener) => {
        listeners = listeners.filter((l) => l !== listener);
      }),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    // Simulate media query change
    listeners.forEach((listener) => {
      listener({ matches: true } as MediaQueryListEvent);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("should clean up event listeners on unmount", () => {
    const removeEventListener = vi.fn();

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener,
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("should handle different media queries", () => {
    const queries = [
      "(min-width: 640px)",
      "(min-width: 1024px)",
      "(max-width: 768px)",
      "(orientation: portrait)",
    ];

    queries.forEach((query) => {
      window.matchMedia = vi.fn().mockImplementation((q) => ({
        matches: q === query,
        media: q,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery(query));
      expect(result.current).toBe(true);
    });
  });
});
