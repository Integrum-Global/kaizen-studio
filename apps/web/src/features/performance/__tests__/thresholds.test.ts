import { describe, it, expect } from "vitest";
import {
  DEFAULT_THRESHOLDS,
  getMetricRating,
  getRatingColor,
  getMetricDescription,
  getMetricUnit,
  formatMetricValue,
  calculatePerformanceScore,
} from "../utils/thresholds";
import type { MetricName } from "../types";

describe("thresholds", () => {
  describe("DEFAULT_THRESHOLDS", () => {
    it("should have thresholds for all metric types", () => {
      expect(DEFAULT_THRESHOLDS).toHaveProperty("LCP");
      expect(DEFAULT_THRESHOLDS).toHaveProperty("FID");
      expect(DEFAULT_THRESHOLDS).toHaveProperty("CLS");
      expect(DEFAULT_THRESHOLDS).toHaveProperty("INP");
      expect(DEFAULT_THRESHOLDS).toHaveProperty("FCP");
      expect(DEFAULT_THRESHOLDS).toHaveProperty("TTFB");
    });

    it("should have good and poor values for each threshold", () => {
      Object.values(DEFAULT_THRESHOLDS).forEach((threshold) => {
        expect(threshold).toHaveProperty("good");
        expect(threshold).toHaveProperty("poor");
        expect(typeof threshold.good).toBe("number");
        expect(typeof threshold.poor).toBe("number");
        expect(threshold.good).toBeLessThan(threshold.poor);
      });
    });

    it("should have correct LCP thresholds (2.5s good, 4s poor)", () => {
      expect(DEFAULT_THRESHOLDS.LCP.good).toBe(2500);
      expect(DEFAULT_THRESHOLDS.LCP.poor).toBe(4000);
    });

    it("should have correct INP thresholds (200ms good, 500ms poor)", () => {
      expect(DEFAULT_THRESHOLDS.INP.good).toBe(200);
      expect(DEFAULT_THRESHOLDS.INP.poor).toBe(500);
    });
  });

  describe("getMetricRating", () => {
    it("should return good for values below good threshold", () => {
      expect(getMetricRating("LCP", 2000)).toBe("good");
      expect(getMetricRating("LCP", 2500)).toBe("good");
      expect(getMetricRating("INP", 100)).toBe("good");
      expect(getMetricRating("CLS", 0.05)).toBe("good");
    });

    it("should return poor for values at or above poor threshold", () => {
      expect(getMetricRating("LCP", 4000)).toBe("poor");
      expect(getMetricRating("LCP", 5000)).toBe("poor");
      expect(getMetricRating("INP", 500)).toBe("poor");
      expect(getMetricRating("CLS", 0.3)).toBe("poor");
    });

    it("should return needs-improvement for values between thresholds", () => {
      expect(getMetricRating("LCP", 3000)).toBe("needs-improvement");
      expect(getMetricRating("INP", 300)).toBe("needs-improvement");
      expect(getMetricRating("CLS", 0.15)).toBe("needs-improvement");
    });

    it("should handle edge cases at threshold boundaries", () => {
      // At good threshold
      expect(getMetricRating("LCP", 2500)).toBe("good");
      // Just above good threshold
      expect(getMetricRating("LCP", 2501)).toBe("needs-improvement");
      // Just below poor threshold
      expect(getMetricRating("LCP", 3999)).toBe("needs-improvement");
      // At poor threshold
      expect(getMetricRating("LCP", 4000)).toBe("poor");
    });

    it("should work with all metric types", () => {
      const metrics: MetricName[] = ["LCP", "FID", "CLS", "INP", "FCP", "TTFB"];
      metrics.forEach((metric) => {
        const rating = getMetricRating(metric, 0);
        expect(["good", "needs-improvement", "poor"]).toContain(rating);
      });
    });

    it("should accept custom thresholds", () => {
      const customThresholds = {
        ...DEFAULT_THRESHOLDS,
        LCP: { good: 1000, poor: 2000 },
      };
      expect(getMetricRating("LCP", 1500, customThresholds)).toBe(
        "needs-improvement"
      );
      expect(getMetricRating("LCP", 500, customThresholds)).toBe("good");
    });
  });

  describe("getRatingColor", () => {
    it("should return green for good rating", () => {
      expect(getRatingColor("good")).toBe("green");
    });

    it("should return orange for needs-improvement rating", () => {
      expect(getRatingColor("needs-improvement")).toBe("orange");
    });

    it("should return red for poor rating", () => {
      expect(getRatingColor("poor")).toBe("red");
    });
  });

  describe("getMetricDescription", () => {
    it("should return description for LCP", () => {
      const desc = getMetricDescription("LCP");
      expect(desc).toContain("loading performance");
    });

    it("should return description for INP", () => {
      const desc = getMetricDescription("INP");
      expect(desc).toContain("responsiveness");
    });

    it("should return description for CLS", () => {
      const desc = getMetricDescription("CLS");
      expect(desc).toContain("visual stability");
    });

    it("should return description for all metrics", () => {
      const metrics: MetricName[] = ["LCP", "FID", "CLS", "INP", "FCP", "TTFB"];
      metrics.forEach((metric) => {
        const desc = getMetricDescription(metric);
        expect(typeof desc).toBe("string");
        expect(desc.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getMetricUnit", () => {
    it("should return empty string for CLS", () => {
      expect(getMetricUnit("CLS")).toBe("");
    });

    it("should return ms for time-based metrics", () => {
      expect(getMetricUnit("LCP")).toBe("ms");
      expect(getMetricUnit("FID")).toBe("ms");
      expect(getMetricUnit("INP")).toBe("ms");
      expect(getMetricUnit("FCP")).toBe("ms");
      expect(getMetricUnit("TTFB")).toBe("ms");
    });
  });

  describe("formatMetricValue", () => {
    it("should format CLS with 3 decimal places", () => {
      expect(formatMetricValue("CLS", 0.1234)).toBe("0.123");
      expect(formatMetricValue("CLS", 0.1)).toBe("0.100");
    });

    it("should format time metrics with ms suffix", () => {
      expect(formatMetricValue("LCP", 2500)).toBe("2500ms");
      expect(formatMetricValue("INP", 150)).toBe("150ms");
    });

    it("should round time metrics to whole numbers", () => {
      expect(formatMetricValue("LCP", 2500.7)).toBe("2501ms");
      expect(formatMetricValue("FCP", 1800.3)).toBe("1800ms");
    });
  });

  describe("calculatePerformanceScore", () => {
    it("should return 100 for all good metrics", () => {
      const metrics = {
        LCP: { value: 2000, rating: "good" as const },
        INP: { value: 100, rating: "good" as const },
        CLS: { value: 0.05, rating: "good" as const },
        FCP: { value: 1500, rating: "good" as const },
      };
      expect(calculatePerformanceScore(metrics)).toBe(100);
    });

    it("should return 0 for all poor metrics", () => {
      const metrics = {
        LCP: { value: 5000, rating: "poor" as const },
        INP: { value: 600, rating: "poor" as const },
        CLS: { value: 0.3, rating: "poor" as const },
      };
      expect(calculatePerformanceScore(metrics)).toBe(0);
    });

    it("should return 50 for all needs-improvement metrics", () => {
      const metrics = {
        LCP: { value: 3000, rating: "needs-improvement" as const },
        INP: { value: 300, rating: "needs-improvement" as const },
        CLS: { value: 0.15, rating: "needs-improvement" as const },
      };
      expect(calculatePerformanceScore(metrics)).toBe(50);
    });

    it("should return 0 for empty metrics", () => {
      expect(calculatePerformanceScore({})).toBe(0);
    });

    it("should weight metrics according to importance", () => {
      // LCP and CLS have higher weight (25 each) than FCP (10)
      const goodLCP = {
        LCP: { value: 2000, rating: "good" as const },
        FCP: { value: 5000, rating: "poor" as const },
      };
      const goodFCP = {
        LCP: { value: 5000, rating: "poor" as const },
        FCP: { value: 1500, rating: "good" as const },
      };
      // goodLCP should have higher score because LCP has higher weight
      expect(calculatePerformanceScore(goodLCP)).toBeGreaterThan(
        calculatePerformanceScore(goodFCP)
      );
    });

    it("should handle partial metrics", () => {
      const partialMetrics = {
        LCP: { value: 2000, rating: "good" as const },
      };
      const score = calculatePerformanceScore(partialMetrics);
      expect(score).toBe(100);
    });
  });
});
