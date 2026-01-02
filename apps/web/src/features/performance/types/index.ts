/**
 * Performance monitoring types
 */

/**
 * Web Vitals metric names
 */
export type MetricName = "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB";

/**
 * Rating for performance metrics
 */
export type MetricRating = "good" | "needs-improvement" | "poor";

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  /**
   * Metric name
   */
  name: MetricName;

  /**
   * Metric value
   */
  value: number;

  /**
   * Rating based on thresholds
   */
  rating: MetricRating;

  /**
   * Delta from previous measurement
   */
  delta: number;

  /**
   * Metric ID for deduplication
   */
  id: string;

  /**
   * Navigation type
   */
  navigationType: "navigate" | "reload" | "back-forward" | "prerender";

  /**
   * Attribution entries for debugging
   */
  entries: PerformanceEntry[];
}

/**
 * Performance thresholds for each metric
 */
export interface PerformanceThresholds {
  LCP: { good: number; poor: number };
  FID: { good: number; poor: number };
  CLS: { good: number; poor: number };
  INP: { good: number; poor: number };
  FCP: { good: number; poor: number };
  TTFB: { good: number; poor: number };
}

/**
 * Performance report containing all metrics
 */
export interface PerformanceReport {
  /**
   * Timestamp of the report
   */
  timestamp: Date;

  /**
   * URL of the page
   */
  url: string;

  /**
   * All collected metrics
   */
  metrics: Partial<Record<MetricName, PerformanceMetric>>;

  /**
   * Overall score (0-100)
   */
  score: number;
}

/**
 * Performance monitoring options
 */
export interface PerformanceMonitorOptions {
  /**
   * Whether to report metrics to an endpoint
   */
  reportEndpoint?: string;

  /**
   * Whether to log metrics to console in development
   */
  debug?: boolean;

  /**
   * Custom thresholds to override defaults
   */
  thresholds?: Partial<PerformanceThresholds>;

  /**
   * Callback when a metric is collected
   */
  onMetric?: (metric: PerformanceMetric) => void;
}
