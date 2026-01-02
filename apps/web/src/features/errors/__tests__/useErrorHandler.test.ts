import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useErrorHandler } from "../hooks/useErrorHandler";

describe("useErrorHandler", () => {
  const consoleErrorSpy = vi.spyOn(console, "error");

  beforeEach(() => {
    consoleErrorSpy.mockClear();
  });

  describe("initial state", () => {
    it("should initialize with null error", () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.error).toBeNull();
    });

    it("should provide handleError function", () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(typeof result.current.handleError).toBe("function");
    });

    it("should provide clearError function", () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(typeof result.current.clearError).toBe("function");
    });
  });

  describe("handleError", () => {
    it("should set error state when handleError is called", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error("Test error message");

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe("Test error message");
      expect(result.current.error?.code).toBe("Error");
    });

    it("should create AppError with error name as code", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error("Test error");
      testError.name = "CustomError";

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.error?.code).toBe("CustomError");
    });

    it("should include timestamp in error", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error("Test error");
      const beforeTime = new Date();

      act(() => {
        result.current.handleError(testError);
      });

      const afterTime = new Date();

      expect(result.current.error?.timestamp).toBeInstanceOf(Date);
      expect(result.current.error?.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(result.current.error?.timestamp.getTime()).toBeLessThanOrEqual(
        afterTime.getTime()
      );
    });

    it("should include stack trace in error", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error("Test error");

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.error?.stack).toBeDefined();
      expect(result.current.error?.stack).toBe(testError.stack);
    });

    it("should handle error with context metadata", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error("Test error");
      const context = {
        component: "TestComponent",
        action: "testAction",
        userId: "user-123",
        metadata: { key: "value", count: 42 },
      };

      act(() => {
        result.current.handleError(testError, context);
      });

      expect(result.current.error?.details).toBeDefined();
      expect(result.current.error?.details).toContain("key");
      expect(result.current.error?.details).toContain("value");
      expect(result.current.error?.details).toContain("42");
    });

    it("should log error with context to console", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error("Test error");
      const context = {
        component: "TestComponent",
        action: "testAction",
      };

      act(() => {
        result.current.handleError(testError, context);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ErrorHandler]",
        expect.objectContaining({
          error: expect.any(Object),
          context: context,
        })
      );
    });

    it("should handle error without context", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error("Test error");

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.error?.details).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ErrorHandler]",
        expect.objectContaining({
          error: expect.any(Object),
          context: undefined,
        })
      );
    });

    it("should handle error with no name", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error("Test error");
      testError.name = "";

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.error?.code).toBe("UNKNOWN_ERROR");
    });

    it("should handle error with no message", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error();

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.error?.message).toBe(
        "An unexpected error occurred"
      );
    });

    it("should handle multiple errors sequentially", () => {
      const { result } = renderHook(() => useErrorHandler());
      const error1 = new Error("First error");
      const error2 = new Error("Second error");

      act(() => {
        result.current.handleError(error1);
      });

      expect(result.current.error?.message).toBe("First error");

      act(() => {
        result.current.handleError(error2);
      });

      expect(result.current.error?.message).toBe("Second error");
    });
  });

  describe("clearError", () => {
    it("should clear error state", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error("Test error");

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("should be safe to call when no error exists", () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("should allow new errors after clearing", () => {
      const { result } = renderHook(() => useErrorHandler());
      const error1 = new Error("First error");
      const error2 = new Error("Second error");

      act(() => {
        result.current.handleError(error1);
      });

      act(() => {
        result.current.clearError();
      });

      act(() => {
        result.current.handleError(error2);
      });

      expect(result.current.error?.message).toBe("Second error");
    });
  });

  describe("function stability", () => {
    it("should maintain handleError reference across renders", () => {
      const { result, rerender } = renderHook(() => useErrorHandler());
      const firstHandleError = result.current.handleError;

      rerender();

      expect(result.current.handleError).toBe(firstHandleError);
    });

    it("should maintain clearError reference across renders", () => {
      const { result, rerender } = renderHook(() => useErrorHandler());
      const firstClearError = result.current.clearError;

      rerender();

      expect(result.current.clearError).toBe(firstClearError);
    });
  });

  describe("complex scenarios", () => {
    it("should handle rapid error updates", () => {
      const { result } = renderHook(() => useErrorHandler());
      const errors = Array.from(
        { length: 5 },
        (_, i) => new Error(`Error ${i}`)
      );

      act(() => {
        errors.forEach((error) => result.current.handleError(error));
      });

      expect(result.current.error?.message).toBe("Error 4");
    });

    it("should handle context with complex metadata", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error("Test error");
      const context = {
        component: "ComplexComponent",
        metadata: {
          nested: {
            deeply: {
              value: "test",
            },
          },
          array: [1, 2, 3],
          null: null,
          undefined: undefined,
        },
      };

      act(() => {
        result.current.handleError(testError, context);
      });

      expect(result.current.error?.details).toBeDefined();
      expect(result.current.error?.details).toContain("nested");
      expect(result.current.error?.details).toContain("array");
    });

    it("should handle error with all context properties", () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error("Test error");
      const context = {
        component: "TestComponent",
        action: "testAction",
        userId: "user-123",
        metadata: { key: "value" },
      };

      act(() => {
        result.current.handleError(testError, context);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ErrorHandler]",
        expect.objectContaining({
          error: expect.objectContaining({
            code: expect.any(String),
            message: "Test error",
            timestamp: expect.any(Date),
          }),
          context: expect.objectContaining({
            component: "TestComponent",
            action: "testAction",
            userId: "user-123",
            metadata: { key: "value" },
          }),
        })
      );
    });
  });
});
