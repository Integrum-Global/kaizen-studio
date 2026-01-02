import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useErrorBoundary } from "../hooks/useErrorBoundary";

describe("useErrorBoundary", () => {
  const originalLocation = window.location;

  beforeAll(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { reload: vi.fn() },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should provide resetErrorBoundary function", () => {
      const { result } = renderHook(() => useErrorBoundary());

      expect(typeof result.current.resetErrorBoundary).toBe("function");
    });

    it("should provide showBoundary function", () => {
      const { result } = renderHook(() => useErrorBoundary());

      expect(typeof result.current.showBoundary).toBe("function");
    });
  });

  describe("resetErrorBoundary", () => {
    it("should reload the page when called", () => {
      const { result } = renderHook(() => useErrorBoundary());

      act(() => {
        result.current.resetErrorBoundary();
      });

      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });

    it("should be safe to call multiple times", () => {
      const { result } = renderHook(() => useErrorBoundary());

      act(() => {
        result.current.resetErrorBoundary();
      });

      act(() => {
        result.current.resetErrorBoundary();
      });

      expect(window.location.reload).toHaveBeenCalledTimes(2);
    });
  });

  describe("showBoundary", () => {
    it("should throw error when called", () => {
      const { result } = renderHook(() => useErrorBoundary());
      const testError = new Error("Test boundary error");

      expect(() => {
        act(() => {
          result.current.showBoundary(testError);
        });
      }).toThrow("Test boundary error");
    });

    it("should throw the exact error object", () => {
      const { result } = renderHook(() => useErrorBoundary());
      const testError = new Error("Exact error");
      testError.name = "CustomError";

      try {
        act(() => {
          result.current.showBoundary(testError);
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBe(testError);
        expect((error as Error).message).toBe("Exact error");
        expect((error as Error).name).toBe("CustomError");
      }
    });
  });

  describe("function stability", () => {
    it("should maintain resetErrorBoundary reference across renders", () => {
      const { result, rerender } = renderHook(() => useErrorBoundary());
      const firstReset = result.current.resetErrorBoundary;

      rerender();

      expect(result.current.resetErrorBoundary).toBe(firstReset);
    });

    it("should maintain showBoundary reference across renders", () => {
      const { result, rerender } = renderHook(() => useErrorBoundary());
      const firstShow = result.current.showBoundary;

      rerender();

      expect(result.current.showBoundary).toBe(firstShow);
    });
  });

  describe("error types", () => {
    it("should handle Error objects", () => {
      const { result } = renderHook(() => useErrorBoundary());
      const error = new Error("Standard error");

      try {
        act(() => {
          result.current.showBoundary(error);
        });
      } catch (thrown) {
        expect(thrown).toBeInstanceOf(Error);
      }
    });

    it("should handle custom error types", () => {
      const { result } = renderHook(() => useErrorBoundary());

      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "CustomError";
        }
      }

      const error = new CustomError("Custom error message");

      try {
        act(() => {
          result.current.showBoundary(error);
        });
      } catch (thrown) {
        expect((thrown as Error).name).toBe("CustomError");
        expect((thrown as Error).message).toBe("Custom error message");
      }
    });

    it("should handle errors with additional properties", () => {
      const { result } = renderHook(() => useErrorBoundary());
      const error = new Error("Error with code") as Error & { code: string };
      error.code = "ERR_CUSTOM";

      try {
        act(() => {
          result.current.showBoundary(error);
        });
      } catch (thrown) {
        expect((thrown as any).code).toBe("ERR_CUSTOM");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty error message", () => {
      const { result } = renderHook(() => useErrorBoundary());
      const error = new Error("");

      try {
        act(() => {
          result.current.showBoundary(error);
        });
      } catch (thrown) {
        expect((thrown as Error).message).toBe("");
      }
    });

    it("should handle error with stack trace", () => {
      const { result } = renderHook(() => useErrorBoundary());
      const error = new Error("Error with stack");

      try {
        act(() => {
          result.current.showBoundary(error);
        });
      } catch (thrown) {
        expect((thrown as Error).stack).toBeDefined();
      }
    });
  });

  describe("integration scenarios", () => {
    it("should handle multiple sequential errors", () => {
      const { result } = renderHook(() => useErrorBoundary());
      const error1 = new Error("First error");
      const error2 = new Error("Second error");

      try {
        act(() => {
          result.current.showBoundary(error1);
        });
      } catch (error) {
        expect((error as Error).message).toBe("First error");
      }

      try {
        act(() => {
          result.current.showBoundary(error2);
        });
      } catch (error) {
        expect((error as Error).message).toBe("Second error");
      }
    });

    it("should allow reset between errors", () => {
      const { result } = renderHook(() => useErrorBoundary());
      const error = new Error("Test error");

      try {
        act(() => {
          result.current.showBoundary(error);
        });
      } catch (error) {
        // Expected
      }

      act(() => {
        result.current.resetErrorBoundary();
      });

      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });
});
