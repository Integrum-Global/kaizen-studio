import { useQuery } from "@tanstack/react-query";
import { metricsApi } from "../api";
import type { MetricFilter } from "../types";

/**
 * Query key factory for metrics
 */
export const metricKeys = {
  all: ["metrics"] as const,
  lists: () => [...metricKeys.all, "list"] as const,
  list: (filters?: MetricFilter) => [...metricKeys.lists(), filters] as const,
  details: () => [...metricKeys.all, "detail"] as const,
  detail: (id: string) => [...metricKeys.details(), id] as const,
  series: () => [...metricKeys.all, "series"] as const,
  seriesFor: (metricIds: string[], filters?: MetricFilter) =>
    [...metricKeys.series(), { metricIds, filters }] as const,
  summary: () => [...metricKeys.all, "summary"] as const,
  summaryFor: (filters?: MetricFilter) =>
    [...metricKeys.summary(), filters] as const,
};

/**
 * Hook to get all metrics with optional filters
 */
export function useMetrics(filters?: MetricFilter) {
  return useQuery({
    queryKey: metricKeys.list(filters),
    queryFn: () => metricsApi.getAll(filters),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get a single metric by ID
 */
export function useMetric(id: string) {
  return useQuery({
    queryKey: metricKeys.detail(id),
    queryFn: () => metricsApi.getById(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get time series data for metrics
 */
export function useMetricSeries(metricIds: string[], filters?: MetricFilter) {
  return useQuery({
    queryKey: metricKeys.seriesFor(metricIds, filters),
    queryFn: () => metricsApi.getSeries(metricIds, filters),
    enabled: metricIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get metrics summary
 */
export function useMetricsSummary(filters?: MetricFilter) {
  return useQuery({
    queryKey: metricKeys.summaryFor(filters),
    queryFn: () => metricsApi.getSummary(filters),
    staleTime: 60 * 1000, // 1 minute
  });
}
