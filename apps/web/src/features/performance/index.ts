// Types
export type {
  MetricName,
  MetricRating,
  PerformanceMetric,
  PerformanceThresholds,
  PerformanceReport,
  PerformanceMonitorOptions,
} from "./types";

// Hooks
export { usePerformance } from "./hooks/usePerformance";
export {
  useComponentPerformance,
  useAsyncPerformance,
} from "./hooks/useComponentPerformance";

// Utils
export {
  DEFAULT_THRESHOLDS,
  getMetricRating,
  getRatingColor,
  getMetricDescription,
  getMetricUnit,
  formatMetricValue,
  calculatePerformanceScore,
  initWebVitals,
  getPerformanceMetrics,
  measurePerformance,
  markPerformance,
  measureBetweenMarks,
} from "./utils";

// Components
export {
  PerformanceIndicator,
  PerformanceScore,
  PerformancePanel,
} from "./components";
