import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePerformance } from "../hooks/usePerformance";

// Mock web-vitals
vi.mock("web-vitals", () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onFID: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

describe("usePerformance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with empty metrics", () => {
      const { result } = renderHook(() => usePerformance());

      expect(result.current.metrics).toEqual({});
    });

    it("should start with isCollecting true", () => {
      const { result } = renderHook(() => usePerformance());

      expect(result.current.isCollecting).toBe(true);
    });

    it("should have initial score of 0", () => {
      const { result } = renderHook(() => usePerformance());

      expect(result.current.score).toBe(0);
    });
  });

  describe("isCollecting state", () => {
    it("should set isCollecting to false after 10 seconds", async () => {
      const { result } = renderHook(() => usePerformance());

      expect(result.current.isCollecting).toBe(true);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.isCollecting).toBe(false);
    });

    it("should remain collecting before 10 seconds", () => {
      const { result } = renderHook(() => usePerformance());

      act(() => {
        vi.advanceTimersByTime(9999);
      });

      expect(result.current.isCollecting).toBe(true);
    });
  });

  describe("getReport", () => {
    it("should return a performance report", () => {
      const { result } = renderHook(() => usePerformance());

      const report = result.current.getReport();

      expect(report).toHaveProperty("timestamp");
      expect(report).toHaveProperty("url");
      expect(report).toHaveProperty("metrics");
      expect(report).toHaveProperty("score");
    });

    it("should include current URL in report", () => {
      const { result } = renderHook(() => usePerformance());

      const report = result.current.getReport();

      expect(report.url).toBe(window.location.href);
    });

    it("should include timestamp in report", () => {
      const { result } = renderHook(() => usePerformance());

      const before = new Date();
      const report = result.current.getReport();
      const after = new Date();

      expect(report.timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(report.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should include current metrics in report", () => {
      const { result } = renderHook(() => usePerformance());

      const report = result.current.getReport();

      expect(report.metrics).toEqual(result.current.metrics);
    });

    it("should include current score in report", () => {
      const { result } = renderHook(() => usePerformance());

      const report = result.current.getReport();

      expect(report.score).toBe(result.current.score);
    });
  });

  describe("options", () => {
    it("should accept debug option", () => {
      const { result } = renderHook(() => usePerformance({ debug: true }));

      expect(result.current.metrics).toBeDefined();
    });

    it("should accept reportEndpoint option", () => {
      const { result } = renderHook(() =>
        usePerformance({ reportEndpoint: "https://example.com/metrics" })
      );

      expect(result.current.metrics).toBeDefined();
    });
  });

  describe("cleanup", () => {
    it("should clean up timer on unmount", () => {
      const { unmount } = renderHook(() => usePerformance());

      unmount();

      // No error should be thrown when timers are cleared
      act(() => {
        vi.advanceTimersByTime(15000);
      });
    });
  });

  describe("single initialization", () => {
    it("should only initialize once even on re-render", () => {
      const { result, rerender } = renderHook(() => usePerformance());

      const initialMetrics = result.current.metrics;
      rerender();

      expect(result.current.metrics).toBe(initialMetrics);
    });
  });
});
