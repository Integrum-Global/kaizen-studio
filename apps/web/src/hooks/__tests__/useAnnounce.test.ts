import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnnounce } from "../useAnnounce";

describe("useAnnounce", () => {
  beforeEach(() => {
    // Clear any existing ARIA live regions
    document
      .querySelectorAll('[aria-live="polite"], [aria-live="assertive"]')
      .forEach((el) => el.remove());
  });

  afterEach(() => {
    // Cleanup after each test
    document
      .querySelectorAll('[aria-live="polite"], [aria-live="assertive"]')
      .forEach((el) => el.remove());
  });

  it("should create polite and assertive live regions on mount", () => {
    renderHook(() => useAnnounce());

    const politeRegion = document.querySelector('[aria-live="polite"]');
    const assertiveRegion = document.querySelector('[aria-live="assertive"]');

    expect(politeRegion).toBeTruthy();
    expect(assertiveRegion).toBeTruthy();
    expect(politeRegion?.getAttribute("aria-atomic")).toBe("true");
    expect(assertiveRegion?.getAttribute("aria-atomic")).toBe("true");
  });

  it("should have sr-only class on live regions", () => {
    renderHook(() => useAnnounce());

    const politeRegion = document.querySelector('[aria-live="polite"]');
    const assertiveRegion = document.querySelector('[aria-live="assertive"]');

    expect(politeRegion?.className).toBe("sr-only");
    expect(assertiveRegion?.className).toBe("sr-only");
  });

  it("should announce polite messages by default", () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current.announce("Test message");
    });

    // Use setTimeout to allow requestAnimationFrame to complete
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const politeRegion = document.querySelector('[aria-live="polite"]');
        expect(politeRegion?.textContent).toBe("Test message");
        resolve();
      }, 50);
    });
  });

  it("should announce assertive messages when specified", () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current.announce("Urgent message", "assertive");
    });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const assertiveRegion = document.querySelector(
          '[aria-live="assertive"]'
        );
        expect(assertiveRegion?.textContent).toBe("Urgent message");
        resolve();
      }, 50);
    });
  });

  it("should clear previous message before announcing new one", () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current.announce("First message");
    });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const politeRegion = document.querySelector('[aria-live="polite"]');
        expect(politeRegion?.textContent).toBe("First message");

        act(() => {
          result.current.announce("Second message");
        });

        setTimeout(() => {
          expect(politeRegion?.textContent).toBe("Second message");
          resolve();
        }, 50);
      }, 50);
    });
  });

  it("should remove live regions on unmount", () => {
    const { unmount } = renderHook(() => useAnnounce());

    expect(
      document.querySelectorAll('[aria-live="polite"]').length
    ).toBeGreaterThan(0);
    expect(
      document.querySelectorAll('[aria-live="assertive"]').length
    ).toBeGreaterThan(0);

    unmount();

    expect(document.querySelectorAll('[aria-live="polite"]').length).toBe(0);
    expect(document.querySelectorAll('[aria-live="assertive"]').length).toBe(0);
  });

  it("should handle multiple announcements in quick succession", () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current.announce("Message 1");
      result.current.announce("Message 2");
      result.current.announce("Message 3");
    });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const politeRegion = document.querySelector('[aria-live="polite"]');
        // Last message should be visible
        expect(politeRegion?.textContent).toBe("Message 3");
        resolve();
      }, 50);
    });
  });

  it("should handle empty string announcements", () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current.announce("");
    });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const politeRegion = document.querySelector('[aria-live="polite"]');
        expect(politeRegion?.textContent).toBe("");
        resolve();
      }, 50);
    });
  });
});
