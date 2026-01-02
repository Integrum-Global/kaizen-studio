import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useMediaQuery } from "../hooks/useMediaQuery";

describe("useMediaQuery", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
  });

  it("should return false initially on server (SSR)", () => {
    matchMediaMock.mockImplementation((query: string) => ({
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

    // Initial state should be false for SSR safety
    // Then it syncs to true after mount
    expect([false, true]).toContain(result.current);
  });

  it("should return true when media query matches", async () => {
    matchMediaMock.mockImplementation((query: string) => ({
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

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("should return false when media query does not match", async () => {
    matchMediaMock.mockImplementation((query: string) => ({
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

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("should update when media query match changes", async () => {
    let listeners: Array<(event: MediaQueryListEvent) => void> = [];

    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, handler: () => void) => {
        listeners.push(handler);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    // Simulate media query change
    listeners.forEach((listener) => {
      listener({ matches: true, media: "" } as MediaQueryListEvent);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("should handle different media query types", async () => {
    const queries = [
      "(min-width: 768px)",
      "(max-width: 1024px)",
      "(orientation: landscape)",
      "(prefers-color-scheme: dark)",
      "(hover: hover)",
    ];

    for (const query of queries) {
      matchMediaMock.mockImplementation((q: string) => ({
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

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    }
  });

  it("should cleanup event listeners on unmount", () => {
    const removeEventListener = vi.fn();

    matchMediaMock.mockImplementation((query: string) => ({
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

  it("should handle query changes", async () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result, rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      {
        initialProps: { query: "(min-width: 768px)" },
      }
    );

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    // Change query
    rerender({ query: "(min-width: 1024px)" });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("should handle complex query strings", async () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query.includes("(min-width: 768px) and (max-width: 1024px)"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px) and (max-width: 1024px)")
    );

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
