import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useOrientation } from "../hooks/useOrientation";

describe("useOrientation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return portrait when height > width", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 667,
    });

    const { result } = renderHook(() => useOrientation());

    expect(result.current.orientation).toBe("portrait");
    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isLandscape).toBe(false);
  });

  it("should return landscape when width > height", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 667,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useOrientation());

    expect(result.current.orientation).toBe("landscape");
    expect(result.current.isPortrait).toBe(false);
    expect(result.current.isLandscape).toBe(true);
  });

  it("should update orientation on orientationchange event", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 667,
    });

    const { result } = renderHook(() => useOrientation());

    expect(result.current.orientation).toBe("portrait");

    // Simulate device rotation
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 667,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 375,
      });

      window.dispatchEvent(new Event("orientationchange"));
    });

    await waitFor(() => {
      expect(result.current.orientation).toBe("landscape");
      expect(result.current.isLandscape).toBe(true);
    });
  });

  it("should update orientation on resize event", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 667,
    });

    const { result } = renderHook(() => useOrientation());

    expect(result.current.orientation).toBe("portrait");

    // Simulate window resize (backup for browsers without orientationchange)
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 667,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 375,
      });

      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(result.current.orientation).toBe("landscape");
    });
  });

  it("should cleanup event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 667,
    });

    const { unmount } = renderHook(() => useOrientation());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "orientationchange",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
  });

  it("should handle square dimensions (width === height)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useOrientation());

    // When equal, should default to portrait (width > height is false)
    expect(result.current.orientation).toBe("portrait");
    expect(result.current.isPortrait).toBe(true);
  });

  it("should handle multiple orientation changes", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 667,
    });

    const { result } = renderHook(() => useOrientation());

    expect(result.current.orientation).toBe("portrait");

    // First rotation: portrait -> landscape
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 667,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 375,
      });
      window.dispatchEvent(new Event("orientationchange"));
    });

    await waitFor(() => {
      expect(result.current.orientation).toBe("landscape");
    });

    // Second rotation: landscape -> portrait
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 667,
      });
      window.dispatchEvent(new Event("orientationchange"));
    });

    await waitFor(() => {
      expect(result.current.orientation).toBe("portrait");
    });
  });

  it("should provide all return values correctly", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    });

    const { result } = renderHook(() => useOrientation());

    expect(result.current).toEqual({
      orientation: "landscape",
      isPortrait: false,
      isLandscape: true,
    });
  });

  it("should detect landscape on wide screens", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 1080,
    });

    const { result } = renderHook(() => useOrientation());

    expect(result.current.orientation).toBe("landscape");
    expect(result.current.isLandscape).toBe(true);
  });
});
