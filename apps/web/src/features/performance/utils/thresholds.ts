/**
 * Performance thresholds based on Google's Web Vitals recommendations
 * @see https://web.dev/vitals/
 */

import type { MetricName, MetricRating, PerformanceThresholds } from "../types";

/**
 * Default thresholds for Web Vitals metrics
 * Values in milliseconds except CLS (unitless)
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  // Largest Contentful Paint: <2.5s good, >4s poor
  LCP: { good: 2500, poor: 4000 },

  // First Input Delay: <100ms good, >300ms poor
  FID: { good: 100, poor: 300 },

  // Cumulative Layout Shift: <0.1 good, >0.25 poor
  CLS: { good: 0.1, poor: 0.25 },

  // Interaction to Next Paint: <200ms good, >500ms poor
  INP: { good: 200, poor: 500 },

  // First Contentful Paint: <1.8s good, >3s poor
  FCP: { good: 1800, poor: 3000 },

  // Time to First Byte: <800ms good, >1.8s poor
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Get the rating for a metric value
 */
export function getMetricRating(
  name: MetricName,
  value: number,
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
): MetricRating {
  const threshold = thresholds[name];

  if (value <= threshold.good) {
    return "good";
  }

  if (value >= threshold.poor) {
    return "poor";
  }

  return "needs-improvement";
}

/**
 * Get color for a metric rating
 */
export function getRatingColor(rating: MetricRating): string {
  switch (rating) {
    case "good":
      return "green";
    case "needs-improvement":
      return "orange";
    case "poor":
      return "red";
  }
}

/**
 * Get human-readable description for a metric
 */
export function getMetricDescription(name: MetricName): string {
  const descriptions: Record<MetricName, string> = {
    LCP: "Largest Contentful Paint measures loading performance",
    FID: "First Input Delay measures interactivity",
    CLS: "Cumulative Layout Shift measures visual stability",
    INP: "Interaction to Next Paint measures responsiveness",
    FCP: "First Contentful Paint measures initial render time",
    TTFB: "Time to First Byte measures server response time",
  };

  return descriptions[name];
}

/**
 * Get the unit for a metric
 */
export function getMetricUnit(name: MetricName): string {
  if (name === "CLS") {
    return "";
  }
  return "ms";
}

/**
 * Format a metric value for display
 */
export function formatMetricValue(name: MetricName, value: number): string {
  if (name === "CLS") {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Calculate overall performance score (0-100)
 */
export function calculatePerformanceScore(
  metrics: Partial<Record<MetricName, { value: number; rating: MetricRating }>>
): number {
  const weights: Partial<Record<MetricName, number>> = {
    LCP: 25,
    FID: 15,
    CLS: 25,
    INP: 20,
    FCP: 10,
    TTFB: 5,
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const [name, metric] of Object.entries(metrics)) {
    const weight = weights[name as MetricName] ?? 0;
    if (weight > 0 && metric) {
      totalWeight += weight;

      // Convert rating to score: good=100, needs-improvement=50, poor=0
      const ratingScore =
        metric.rating === "good"
          ? 100
          : metric.rating === "needs-improvement"
            ? 50
            : 0;
      weightedScore += ratingScore * weight;
    }
  }

  if (totalWeight === 0) {
    return 0;
  }

  return Math.round(weightedScore / totalWeight);
}
