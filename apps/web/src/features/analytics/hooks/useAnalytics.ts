/**
 * React Query hooks for analytics data
 */

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api";
import type { AnalyticsFilters } from "../types";

/**
 * Query key factory for analytics
 */
export const analyticsKeys = {
  all: ["analytics"] as const,
  executions: (filters?: AnalyticsFilters) =>
    [...analyticsKeys.all, "executions", filters] as const,
  apiUsage: (filters?: AnalyticsFilters) =>
    [...analyticsKeys.all, "apiUsage", filters] as const,
  successRate: (filters?: AnalyticsFilters) =>
    [...analyticsKeys.all, "successRate", filters] as const,
  agentPerformance: (filters?: AnalyticsFilters) =>
    [...analyticsKeys.all, "agentPerformance", filters] as const,
  deploymentDistribution: (filters?: AnalyticsFilters) =>
    [...analyticsKeys.all, "deploymentDistribution", filters] as const,
  metricsSummary: (filters?: AnalyticsFilters) =>
    [...analyticsKeys.all, "metricsSummary", filters] as const,
  errorDistribution: (filters?: AnalyticsFilters) =>
    [...analyticsKeys.all, "errorDistribution", filters] as const,
};

/**
 * Hook to fetch execution metrics
 */
export function useExecutionMetrics(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.executions(filters),
    queryFn: () => analyticsApi.getExecutionMetrics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch API usage metrics
 */
export function useApiUsageMetrics(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.apiUsage(filters),
    queryFn: () => analyticsApi.getApiUsageMetrics(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch success rate metrics
 */
export function useSuccessRateMetrics(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.successRate(filters),
    queryFn: () => analyticsApi.getSuccessRateMetrics(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch agent performance comparison
 */
export function useAgentPerformance(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.agentPerformance(filters),
    queryFn: () => analyticsApi.getAgentPerformance(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch deployment distribution
 */
export function useDeploymentDistribution(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.deploymentDistribution(filters),
    queryFn: () => analyticsApi.getDeploymentDistribution(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch metrics summary
 */
export function useMetricsSummary(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.metricsSummary(filters),
    queryFn: () => analyticsApi.getMetricsSummary(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - more frequent updates for summary
  });
}

/**
 * Hook to fetch error distribution
 */
export function useErrorDistribution(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: analyticsKeys.errorDistribution(filters),
    queryFn: () => analyticsApi.getErrorDistribution(filters),
    staleTime: 5 * 60 * 1000,
  });
}
