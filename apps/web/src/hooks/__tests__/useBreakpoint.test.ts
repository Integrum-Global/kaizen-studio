import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBreakpoint } from "../useBreakpoint";

describe("useBreakpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return mobile breakpoint for small screens", () => {
    // Mock matchMedia for mobile (< 640px)
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false, // All min-width queries return false
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.breakpoint).toBe("mobile");
  });

  it("should return tablet breakpoint for medium screens", () => {
    // Mock matchMedia for tablet (640px - 1024px)
    window.matchMedia = vi.fn().mockImplementation((query) => {
      if (query === "(min-width: 640px)")
        return {
          matches: true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      if (query === "(min-width: 1024px)")
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      return {
        matches: false,
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

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.breakpoint).toBe("tablet");
  });

  it("should return desktop breakpoint for large screens", () => {
    // Mock matchMedia for desktop (>= 1024px)
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // All min-width queries return true
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.breakpoint).toBe("desktop");
  });

  it("should have correct boolean flags for mobile", () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());

    // Mobile: isMobile=true, isTablet=false, isDesktop=false
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it("should have correct boolean flags for tablet", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => {
      return {
        matches: query === "(min-width: 640px)",
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

    // Tablet: isMobile=false, isTablet=true, isDesktop=false
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it("should have correct boolean flags for desktop", () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());

    // Desktop: isMobile=false, isTablet=false, isDesktop=true
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });
});
