import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useBreakpoint } from "../hooks/useBreakpoint";

describe("useBreakpoint", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks before each test
    matchMediaMock = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
  });

  it("should return mobile breakpoint for width < 640px", () => {
    // Mock matchMedia to return false for both queries (< 640px)
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

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.breakpoint).toBe("mobile");
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it("should return tablet breakpoint for width 640px-1023px", () => {
    // Mock matchMedia: true for min-width: 640px, false for min-width: 1024px
    matchMediaMock.mockImplementation((query: string) => {
      const matches = query.includes("640px") && !query.includes("1024px");
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.breakpoint).toBe("tablet");
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it("should return desktop breakpoint for width >= 1024px", () => {
    // Mock matchMedia to return true for both queries (>= 1024px)
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

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.breakpoint).toBe("desktop");
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });

  it("should handle breakpoint transitions", () => {
    let listeners: Array<(event: MediaQueryListEvent) => void> = [];

    // Initial state: mobile
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

    const { result, rerender } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe("mobile");

    // Simulate transition to desktop
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

    // Trigger the listeners to simulate media query change
    listeners.forEach((listener) => {
      listener({
        matches: true,
        media: "",
      } as MediaQueryListEvent);
    });

    rerender();
    expect(result.current.breakpoint).toBe("desktop");
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

    const { unmount } = renderHook(() => useBreakpoint());
    unmount();

    // Should cleanup both media queries (640px and 1024px)
    expect(removeEventListener).toHaveBeenCalled();
  });

  it("should return all boolean flags correctly for mobile", () => {
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

    const { result } = renderHook(() => useBreakpoint());

    // Explicitly check all flags
    expect(result.current).toEqual({
      breakpoint: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });
  });

  it("should return all boolean flags correctly for tablet", () => {
    matchMediaMock.mockImplementation((query: string) => {
      const matches = query.includes("640px") && !query.includes("1024px");
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toEqual({
      breakpoint: "tablet",
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });
  });

  it("should return all boolean flags correctly for desktop", () => {
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

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toEqual({
      breakpoint: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });
  });
});
