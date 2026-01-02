import apiClient from "@/api";
import type {
  ChartData,
  AnalyticsSummary,
  TimeSeriesData,
  MetricData,
  CategoryData,
  AnalyticsFilters,
} from "../types";

/**
 * Get date range from filters
 */
function getDateRange(filters?: AnalyticsFilters): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date();
  const startDate = new Date();

  const days = filters?.days || 30;
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

/**
 * Analytics API client
 */
export const analyticsApi = {
  /**
   * Get agent execution metrics over time
   */
  getExecutionMetrics: async (
    filters?: AnalyticsFilters
  ): Promise<TimeSeriesData[]> => {
    try {
      const { startDate, endDate } = getDateRange(filters);

      const response = await apiClient.get<{ data: Record<string, unknown>[] }>(
        "/api/v1/metrics/timeseries",
        {
          params: {
            metric: "latency",
            interval: filters?.days && filters.days > 7 ? "day" : "hour",
            start_date: startDate,
            end_date: endDate,
          },
        }
      );

      return (response.data.data || []).map((point) => ({
        timestamp: point.timestamp as string,
        value: (point.count as number) || (point.value as number) || 0,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get API usage metrics
   */
  getApiUsageMetrics: async (
    filters?: AnalyticsFilters
  ): Promise<TimeSeriesData[]> => {
    try {
      const { startDate, endDate } = getDateRange(filters);

      // Try to get timeseries data from metrics endpoint
      const response = await apiClient.get<{ data: Record<string, unknown>[] }>(
        "/api/v1/metrics/timeseries",
        {
          params: {
            metric: "api_calls",
            interval: filters?.days && filters.days > 7 ? "day" : "hour",
            start_date: startDate,
            end_date: endDate,
          },
        }
      );

      return (response.data.data || []).map((point) => ({
        timestamp: point.timestamp as string,
        value: (point.count as number) || (point.value as number) || 0,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get success rate over time
   */
  getSuccessRateMetrics: async (
    filters?: AnalyticsFilters
  ): Promise<TimeSeriesData[]> => {
    try {
      const { startDate, endDate } = getDateRange(filters);

      const response = await apiClient.get<{ data: Record<string, unknown>[] }>(
        "/api/v1/metrics/timeseries",
        {
          params: {
            metric: "errors",
            interval: filters?.days && filters.days > 7 ? "day" : "hour",
            start_date: startDate,
            end_date: endDate,
          },
        }
      );

      // Convert error rate to success rate
      return (response.data.data || []).map((point) => ({
        timestamp: point.timestamp as string,
        value: Math.min(100, Math.max(0, 100 - ((point.value as number) || 0))),
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get agent performance comparison
   */
  getAgentPerformance: async (
    _filters?: AnalyticsFilters
  ): Promise<ChartData> => {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        "/api/v1/metrics/dashboard"
      );
      const topAgents =
        (response.data.top_agents as Record<string, unknown>[]) || [];

      if (topAgents.length === 0) {
        return {
          labels: [],
          datasets: [],
        };
      }

      const labels = topAgents.map(
        (a) => (a.agent_id as string)?.substring(0, 8) || "Unknown"
      );
      const executions = topAgents.map(
        (a) => (a.execution_count as number) || 0
      );
      const successRates = topAgents.map((a) => {
        const total = (a.execution_count as number) || 1;
        const errors = (a.error_count as number) || 0;
        return Math.round(((total - errors) / total) * 100);
      });

      return {
        labels,
        datasets: [
          {
            label: "Executions",
            data: executions,
            color: "hsl(var(--chart-1))",
          },
          {
            label: "Success Rate %",
            data: successRates,
            color: "hsl(var(--chart-2))",
          },
        ],
      };
    } catch {
      return { labels: [], datasets: [] };
    }
  },

  /**
   * Get deployment distribution
   */
  getDeploymentDistribution: async (
    _filters?: AnalyticsFilters
  ): Promise<CategoryData[]> => {
    try {
      const response = await apiClient.get<Record<string, unknown>[]>(
        "/api/v1/deployments"
      );
      const deployments = response.data || [];

      // Count by environment
      const envCounts: Record<string, number> = {};
      for (const d of deployments) {
        const env = (d.environment as string) || "development";
        envCounts[env] = (envCounts[env] || 0) + 1;
      }

      const total =
        Object.values(envCounts).reduce((sum, c) => sum + c, 0) || 1;

      return Object.entries(envCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        percentage: Math.round((value / total) * 100),
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get key metrics summary
   */
  getMetricsSummary: async (
    _filters?: AnalyticsFilters
  ): Promise<MetricData[]> => {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        "/api/v1/metrics/dashboard"
      );
      const summary = (response.data.summary as Record<string, number>) || {};

      const totalExecutions = summary.total_executions || 0;
      const errorCount = summary.error_count || 0;
      const avgLatency = summary.avg_latency || 0;

      const successRate =
        totalExecutions > 0
          ? ((totalExecutions - errorCount) / totalExecutions) * 100
          : 100;

      // Get agent count
      const agentsResponse = await apiClient.get<
        { records: unknown[] } | unknown[]
      >("/api/v1/agents");
      const agents = Array.isArray(agentsResponse.data)
        ? agentsResponse.data
        : agentsResponse.data.records || [];

      return [
        {
          name: "Total Executions",
          value: totalExecutions,
          change: 0,
          trend: "neutral" as const,
        },
        {
          name: "Success Rate",
          value: Math.round(successRate * 10) / 10,
          change: 0,
          trend: successRate >= 95 ? ("up" as const) : ("down" as const),
        },
        {
          name: "Avg Response Time",
          value: Math.round(avgLatency),
          change: 0,
          trend: avgLatency < 500 ? ("down" as const) : ("up" as const),
        },
        {
          name: "Active Agents",
          value: agents.length,
          change: 0,
          trend: "neutral" as const,
        },
      ];
    } catch {
      return [];
    }
  },

  /**
   * Get analytics summary for a dataset
   */
  getAnalyticsSummary: async (
    data: TimeSeriesData[]
  ): Promise<AnalyticsSummary> => {
    if (data.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        trend: 0,
      };
    }

    const values = data.map((d) => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend (compare last value to first value)
    const firstValue = values[0] ?? 0;
    const lastValue = values[values.length - 1] ?? 0;
    const trend =
      firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100;

    return {
      total: Math.round(total),
      average: Math.round(average * 10) / 10,
      min,
      max,
      trend: Math.round(trend * 10) / 10,
    };
  },

  /**
   * Get error rate distribution
   */
  getErrorDistribution: async (
    _filters?: AnalyticsFilters
  ): Promise<CategoryData[]> => {
    try {
      const response = await apiClient.get<{
        errors: Record<string, unknown>[];
      }>("/api/v1/metrics/errors", { params: { limit: 10 } });

      const errors = response.data.errors || [];
      if (errors.length === 0) {
        return [];
      }

      const total =
        errors.reduce((sum, e) => sum + ((e.count as number) || 0), 0) || 1;

      return errors.map((e) => ({
        name: (e.error_type as string) || "Unknown",
        value: (e.count as number) || 0,
        percentage: Math.round((((e.count as number) || 0) / total) * 100),
      }));
    } catch {
      return [];
    }
  },
};

export default analyticsApi;
