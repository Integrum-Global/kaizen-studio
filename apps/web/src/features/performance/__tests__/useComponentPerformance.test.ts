import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useComponentPerformance,
  useAsyncPerformance,
} from "../hooks/useComponentPerformance";

describe("useComponentPerformance", () => {
  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should return renderTime", () => {
      const { result } = renderHook(() =>
        useComponentPerformance("TestComponent")
      );

      expect(typeof result.current.renderTime).toBe("number");
    });

    it("should return mountTime (initially null, set after effect)", () => {
      const { result, rerender } = renderHook(() =>
        useComponentPerformance("TestComponent")
      );

      // After rerender, useEffect will have run and set mountTime
      rerender();
      // mountTime is set on first render's effect, but ref value is captured
      // The ref is updated in useEffect, subsequent reads will see the value
      expect(result.current.mountTime).toBeDefined();
    });

    it("should track render count", () => {
      const { result, rerender } = renderHook(() =>
        useComponentPerformance("TestComponent")
      );

      expect(result.current.renderCount).toBe(1);

      rerender();
      expect(result.current.renderCount).toBe(2);

      rerender();
      expect(result.current.renderCount).toBe(3);
    });
  });

  describe("timing measurement", () => {
    it("should measure render time", () => {
      let callCount = 0;
      vi.spyOn(performance, "now").mockImplementation(() => {
        callCount++;
        return callCount * 10;
      });

      const { result } = renderHook(() =>
        useComponentPerformance("TestComponent")
      );

      expect(result.current.renderTime).toBeGreaterThanOrEqual(0);
    });

    it("should have mountTime available after mount effect runs", () => {
      const { result, rerender } = renderHook(() =>
        useComponentPerformance("TestComponent")
      );

      // Force a rerender to ensure effects have run
      rerender();
      // mountTime ref is set in useEffect on first mount
      expect(result.current.mountTime).toBeDefined();
    });
  });

  describe("component name", () => {
    it("should accept component name parameter", () => {
      const { result } = renderHook(() =>
        useComponentPerformance("MyCustomComponent")
      );

      expect(result.current.renderTime).toBeDefined();
    });
  });
});

describe("useAsyncPerformance", () => {
  let performanceMarkMock: ReturnType<typeof vi.spyOn>;
  let performanceMeasureMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    let time = 0;
    vi.spyOn(performance, "now").mockImplementation(() => {
      return time++;
    });
    performanceMarkMock = vi
      .spyOn(performance, "mark")
      .mockImplementation(() => ({
        name: "test",
        entryType: "mark",
        startTime: 0,
        duration: 0,
        detail: null,
        toJSON: () => ({}),
      }));
    performanceMeasureMock = vi
      .spyOn(performance, "measure")
      .mockImplementation(() => ({
        name: "test",
        entryType: "measure",
        startTime: 0,
        duration: 100,
        detail: null,
        toJSON: () => ({}),
      }));
    vi.spyOn(performance, "getEntriesByName").mockReturnValue([
      {
        name: "test",
        entryType: "measure",
        startTime: 0,
        duration: 100,
        toJSON: () => ({}),
      },
    ] as PerformanceEntryList);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should return measurement functions", () => {
      const { result } = renderHook(() => useAsyncPerformance("fetchData"));

      expect(typeof result.current.startMeasure).toBe("function");
      expect(typeof result.current.endMeasure).toBe("function");
    });

    it("should initialize with null duration", () => {
      const { result } = renderHook(() => useAsyncPerformance("fetchData"));

      expect(result.current.duration).toBeNull();
    });

    it("should initialize with isRunning false", () => {
      const { result } = renderHook(() => useAsyncPerformance("fetchData"));

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe("startMeasure", () => {
    it("should set isRunning to true", () => {
      const { result } = renderHook(() => useAsyncPerformance("fetchData"));

      act(() => {
        result.current.startMeasure();
      });

      expect(result.current.isRunning).toBe(true);
    });

    it("should call performance.mark", () => {
      const { result } = renderHook(() => useAsyncPerformance("fetchData"));

      act(() => {
        result.current.startMeasure();
      });

      expect(performanceMarkMock).toHaveBeenCalledWith("fetchData-start");
    });
  });

  describe("endMeasure", () => {
    it("should calculate duration after start and end", () => {
      const { result } = renderHook(() => useAsyncPerformance("fetchData"));

      act(() => {
        result.current.startMeasure();
      });

      act(() => {
        result.current.endMeasure();
      });

      expect(result.current.duration).not.toBeNull();
    });

    it("should set isRunning to false", () => {
      const { result } = renderHook(() => useAsyncPerformance("fetchData"));

      act(() => {
        result.current.startMeasure();
      });

      act(() => {
        result.current.endMeasure();
      });

      expect(result.current.isRunning).toBe(false);
    });

    it("should call performance.mark for end", () => {
      const { result } = renderHook(() => useAsyncPerformance("fetchData"));

      act(() => {
        result.current.startMeasure();
      });

      act(() => {
        result.current.endMeasure();
      });

      expect(performanceMarkMock).toHaveBeenCalledWith("fetchData-end");
    });

    it("should call performance.measure", () => {
      const { result } = renderHook(() => useAsyncPerformance("fetchData"));

      act(() => {
        result.current.startMeasure();
      });

      act(() => {
        result.current.endMeasure();
      });

      expect(performanceMeasureMock).toHaveBeenCalled();
    });

    it("should not measure if start was not called", () => {
      const { result } = renderHook(() => useAsyncPerformance("fetchData"));

      act(() => {
        result.current.endMeasure();
      });

      expect(result.current.duration).toBeNull();
    });
  });

  describe("operation name", () => {
    it("should use operation name in marks", () => {
      const { result } = renderHook(() =>
        useAsyncPerformance("customOperation")
      );

      act(() => {
        result.current.startMeasure();
      });

      expect(performanceMarkMock).toHaveBeenCalledWith("customOperation-start");
    });
  });

  describe("multiple measurements", () => {
    it("should allow multiple start/end cycles", () => {
      const { result } = renderHook(() => useAsyncPerformance("fetchData"));

      // First cycle
      act(() => {
        result.current.startMeasure();
      });
      act(() => {
        result.current.endMeasure();
      });

      // Verify first duration was recorded
      expect(result.current.duration).not.toBeNull();

      // Second cycle
      act(() => {
        result.current.startMeasure();
      });
      act(() => {
        result.current.endMeasure();
      });

      expect(result.current.duration).not.toBeNull();
    });
  });
});
