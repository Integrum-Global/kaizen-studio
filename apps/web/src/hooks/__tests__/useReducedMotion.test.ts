import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useReducedMotion } from "../useReducedMotion";

describe("useReducedMotion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return false when prefers-reduced-motion is not set", () => {
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

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("should return true when prefers-reduced-motion is set to reduce", () => {
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

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("should update when prefers-reduced-motion preference changes", async () => {
    let listeners: ((event: MediaQueryListEvent) => void)[] = [];

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

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    // Simulate preference change to reduce motion
    listeners.forEach((listener) => {
      listener({ matches: true } as MediaQueryListEvent);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("should handle preference change from reduce to no-preference", async () => {
    let listeners: ((event: MediaQueryListEvent) => void)[] = [];

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
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

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);

    // Simulate preference change to no preference
    listeners.forEach((listener) => {
      listener({ matches: false } as MediaQueryListEvent);
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("should clean up event listener on unmount", () => {
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

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("should query for the correct media query", () => {
    const matchMediaSpy = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    window.matchMedia = matchMediaSpy;

    renderHook(() => useReducedMotion());

    expect(matchMediaSpy).toHaveBeenCalledWith(
      "(prefers-reduced-motion: reduce)"
    );
  });

  it("should handle multiple hook instances independently", () => {
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

    const { result: result1 } = renderHook(() => useReducedMotion());
    const { result: result2 } = renderHook(() => useReducedMotion());

    expect(result1.current).toBe(false);
    expect(result2.current).toBe(false);
  });
});
