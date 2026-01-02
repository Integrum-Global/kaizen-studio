/**
 * Analytics types and interfaces
 */

export interface DataPoint {
  x: string | number;
  y: number;
}

export interface Dataset {
  label: string;
  data: number[];
  color: string;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface AnalyticsSummary {
  total: number;
  average: number;
  min: number;
  max: number;
  trend: number; // Percentage change
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export interface MetricData {
  name: string;
  value: number;
  change: number; // Percentage change
  trend: "up" | "down" | "neutral";
}

export interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

export interface AnalyticsFilters {
  start_date?: string;
  end_date?: string;
  metric_type?: string;
  granularity?: "hour" | "day" | "week" | "month";
  days?: number;
}

export type ChartType = "line" | "bar" | "pie" | "area";
export type TimeGranularity = "hour" | "day" | "week" | "month" | "year";
