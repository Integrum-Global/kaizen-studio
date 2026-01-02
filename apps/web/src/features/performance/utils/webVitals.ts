/**
 * Web Vitals measurement utilities
 */

import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from "web-vitals";
import type { Metric } from "web-vitals";
import type {
  MetricName,
  PerformanceMetric,
  PerformanceMonitorOptions,
} from "../types";
import { DEFAULT_THRESHOLDS, getMetricRating } from "./thresholds";

/**
 * Convert web-vitals Metric to our PerformanceMetric type
 */
function convertMetric(
  metric: Metric,
  thresholds = DEFAULT_THRESHOLDS
): PerformanceMetric {
  const name = metric.name as MetricName;
  // Map web-vitals navigation types to our supported types
  const navType = metric.navigationType;
  const navigationType: PerformanceMetric["navigationType"] =
    navType === "back-forward-cache" || navType === "restore"
      ? "back-forward"
      : (navType as PerformanceMetric["navigationType"]);

  return {
    name,
    value: metric.value,
    rating: getMetricRating(name, metric.value, thresholds),
    delta: metric.delta,
    id: metric.id,
    navigationType,
    entries: metric.entries,
  };
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(options: PerformanceMonitorOptions = {}): void {
  const { debug = false, thresholds, onMetric, reportEndpoint } = options;

  const handleMetric = (metric: Metric) => {
    const performanceMetric = convertMetric(metric, {
      ...DEFAULT_THRESHOLDS,
      ...thresholds,
    });

    // Log to console in debug mode
    if (debug) {
      console.log(
        `[Performance] ${performanceMetric.name}: ${performanceMetric.value.toFixed(2)} (${performanceMetric.rating})`
      );
    }

    // Call custom callback
    if (onMetric) {
      onMetric(performanceMetric);
    }

    // Report to endpoint
    if (reportEndpoint) {
      reportMetric(reportEndpoint, performanceMetric);
    }
  };

  // Register all Web Vitals observers
  onCLS(handleMetric);
  onFCP(handleMetric);
  onFID(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
}

/**
 * Report a metric to an endpoint
 */
async function reportMetric(
  endpoint: string,
  metric: PerformanceMetric
): Promise<void> {
  try {
    // Use sendBeacon for reliability, fall back to fetch
    const body = JSON.stringify({
      ...metric,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      await fetch(endpoint, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      });
    }
  } catch (error) {
    console.error("[Performance] Failed to report metric:", error);
  }
}

/**
 * Get the current performance metrics using the Performance API
 */
export function getPerformanceMetrics(): {
  navigationTiming: PerformanceTiming | null;
  paintTiming: PerformanceEntryList;
  resourceTiming: PerformanceEntryList;
} {
  const navigationTiming =
    performance.timing && performance.timing.navigationStart !== 0
      ? performance.timing
      : null;

  const paintTiming = performance.getEntriesByType("paint");
  const resourceTiming = performance.getEntriesByType("resource");

  return {
    navigationTiming,
    paintTiming,
    resourceTiming,
  };
}

/**
 * Measure custom performance marks
 */
export function measurePerformance(markName: string): number | null {
  try {
    const entries = performance.getEntriesByName(markName, "mark");
    if (entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      return lastEntry?.startTime ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create a performance mark
 */
export function markPerformance(markName: string): void {
  try {
    performance.mark(markName);
  } catch {
    // Ignore errors in environments without performance API
  }
}

/**
 * Measure time between two marks
 */
export function measureBetweenMarks(
  measureName: string,
  startMark: string,
  endMark: string
): number | null {
  try {
    performance.measure(measureName, startMark, endMark);
    const entries = performance.getEntriesByName(measureName, "measure");
    if (entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      return lastEntry?.duration ?? null;
    }
    return null;
  } catch {
    return null;
  }
}
