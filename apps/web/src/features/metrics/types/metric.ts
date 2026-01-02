/**
 * Metrics types and interfaces
 */

export type MetricTrend = "up" | "down" | "stable";
export type TimeGranularity = "1h" | "6h" | "24h" | "7d" | "30d";
export type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d" | "90d";

/**
 * Individual metric with current value and change
 */
export interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  changePercent: number;
  trend: MetricTrend;
  category: string;
  description?: string;
}

/**
 * Data point in a time series
 */
export interface DataPoint {
  timestamp: string;
  value: number;
}

/**
 * Time series data for a metric
 */
export interface MetricSeries {
  metricId: string;
  metricName: string;
  dataPoints: DataPoint[];
  unit: string;
}

/**
 * Filters for metrics queries
 */
export interface MetricFilter {
  timeRange: TimeRange;
  granularity?: TimeGranularity;
  resource?: string;
  metric?: string;
  category?: string;
}

/**
 * Summary statistics for metrics
 */
export interface MetricsSummary {
  totalAgents: number;
  totalExecutions: number;
  successRate: number;
  avgResponseTime: number;
  activeUsers: number;
  apiCalls: number;
  errorRate: number;
  p95ResponseTime: number;
}

/**
 * Response from metrics list endpoint
 */
export interface MetricsResponse {
  records: Metric[];
  total: number;
}

/**
 * Response from metrics series endpoint
 */
export interface MetricSeriesResponse {
  series: MetricSeries[];
}
