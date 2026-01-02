import apiClient from "@/api";
import type {
  Metric,
  MetricSeries,
  MetricFilter,
  MetricsSummary,
  MetricsResponse,
  MetricSeriesResponse,
  DataPoint,
  TimeRange,
} from "../types";

/**
 * Map time range to ISO dates
 */
function getDateRange(timeRange: TimeRange): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case "1h":
      startDate.setHours(startDate.getHours() - 1);
      break;
    case "6h":
      startDate.setHours(startDate.getHours() - 6);
      break;
    case "24h":
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 1);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

/**
 * Map time range to backend interval
 */
function getInterval(timeRange: TimeRange): string {
  switch (timeRange) {
    case "1h":
    case "6h":
      return "hour";
    case "24h":
    case "7d":
      return "day";
    case "30d":
    case "90d":
      return "week";
    default:
      return "day";
  }
}

/**
 * Transform backend dashboard data to frontend metrics
 */
function transformDashboardToMetrics(
  dashboard: Record<string, unknown>
): Metric[] {
  const metrics: Metric[] = [];
  const summary = (dashboard.summary as Record<string, number>) || {};
  const topAgents = (dashboard.top_agents as Record<string, unknown>[]) || [];

  // Total executions
  metrics.push({
    id: "total-executions",
    name: "Total Executions",
    value: summary.total_executions || 0,
    unit: "executions",
    change: 0,
    changePercent: 0,
    trend: "stable",
    category: "executions",
    description: "Total workflow executions",
  });

  // Success rate
  const totalExecs = summary.total_executions || 0;
  const successRate =
    totalExecs > 0
      ? ((totalExecs - (summary.error_count || 0)) / totalExecs) * 100
      : 100;
  metrics.push({
    id: "success-rate",
    name: "Success Rate",
    value: Math.round(successRate * 10) / 10,
    unit: "%",
    change: 0,
    changePercent: 0,
    trend: successRate >= 95 ? "up" : "down",
    category: "performance",
    description: "Percentage of successful executions",
  });

  // Average latency
  metrics.push({
    id: "avg-response-time",
    name: "Avg Response Time",
    value: Math.round(summary.avg_latency || 0),
    unit: "ms",
    change: 0,
    changePercent: 0,
    trend: (summary.avg_latency || 0) < 500 ? "down" : "up",
    category: "performance",
    description: "Average response time",
  });

  // Total tokens
  metrics.push({
    id: "total-tokens",
    name: "Total Tokens",
    value: summary.total_tokens || 0,
    unit: "tokens",
    change: 0,
    changePercent: 0,
    trend: "up",
    category: "usage",
    description: "Total tokens consumed",
  });

  // Error rate
  const errorRate =
    totalExecs > 0 ? ((summary.error_count || 0) / totalExecs) * 100 : 0;
  metrics.push({
    id: "error-rate",
    name: "Error Rate",
    value: Math.round(errorRate * 10) / 10,
    unit: "%",
    change: 0,
    changePercent: 0,
    trend: errorRate < 5 ? "down" : "up",
    category: "errors",
    description: "Percentage of failed requests",
  });

  // Total cost
  metrics.push({
    id: "total-cost",
    name: "Total Cost",
    value: Math.round((summary.total_cost || 0) * 100) / 100,
    unit: "USD",
    change: 0,
    changePercent: 0,
    trend: "stable",
    category: "usage",
    description: "Total cost for the period",
  });

  // Active agents (from top agents count)
  metrics.push({
    id: "total-agents",
    name: "Active Agents",
    value: topAgents.length,
    unit: "agents",
    change: 0,
    changePercent: 0,
    trend: "stable",
    category: "agents",
    description: "Number of agents with executions",
  });

  return metrics;
}

/**
 * Transform backend timeseries to frontend DataPoint format
 */
function transformTimeseries(data: Record<string, unknown>[]): DataPoint[] {
  return data.map((point) => ({
    timestamp: point.timestamp as string,
    value: point.value as number,
  }));
}

/**
 * Metrics API client
 */
export const metricsApi = {
  /**
   * Get all metrics with optional filters
   */
  getAll: async (filters?: MetricFilter): Promise<MetricsResponse> => {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        "/api/v1/metrics/dashboard"
      );
      const metrics = transformDashboardToMetrics(response.data);

      // Apply category filter if specified
      const filteredMetrics = filters?.category
        ? metrics.filter((m) => m.category === filters.category)
        : metrics;

      return {
        records: filteredMetrics,
        total: filteredMetrics.length,
      };
    } catch {
      // Return empty metrics on error
      return { records: [], total: 0 };
    }
  },

  /**
   * Get a single metric by ID
   */
  getById: async (id: string): Promise<Metric> => {
    const response = await apiClient.get<Record<string, unknown>>(
      "/api/v1/metrics/dashboard"
    );
    const metrics = transformDashboardToMetrics(response.data);
    const metric = metrics.find((m) => m.id === id);

    if (!metric) {
      throw new Error(`Metric with id ${id} not found`);
    }

    return metric;
  },

  /**
   * Get time series data for metrics
   */
  getSeries: async (
    metricIds: string[],
    filters?: MetricFilter
  ): Promise<MetricSeriesResponse> => {
    const timeRange = filters?.timeRange || "24h";
    const { startDate, endDate } = getDateRange(timeRange);
    const interval = getInterval(timeRange);

    const series: MetricSeries[] = [];

    // Map frontend metric IDs to backend metric names
    const metricMapping: Record<string, string> = {
      "total-executions": "latency", // Use latency data as proxy for executions
      "success-rate": "errors",
      "avg-response-time": "latency",
      "total-tokens": "tokens",
      "error-rate": "errors",
      "total-cost": "cost",
    };

    // Fetch timeseries for each metric
    for (const metricId of metricIds) {
      const backendMetric = metricMapping[metricId] || "latency";

      try {
        const response = await apiClient.get<{
          data: Record<string, unknown>[];
        }>("/api/v1/metrics/timeseries", {
          params: {
            metric: backendMetric,
            interval,
            start_date: startDate,
            end_date: endDate,
          },
        });

        const dataPoints = transformTimeseries(response.data.data || []);

        // Get metric name from dashboard
        const dashboardResponse = await apiClient.get<Record<string, unknown>>(
          "/api/v1/metrics/dashboard"
        );
        const metrics = transformDashboardToMetrics(dashboardResponse.data);
        const metricInfo = metrics.find((m) => m.id === metricId);

        series.push({
          metricId,
          metricName: metricInfo?.name || metricId,
          dataPoints,
          unit: metricInfo?.unit || "",
        });
      } catch {
        // Return empty series for this metric
        series.push({
          metricId,
          metricName: metricId,
          dataPoints: [],
          unit: "",
        });
      }
    }

    return { series };
  },

  /**
   * Get metrics summary
   */
  getSummary: async (filters?: MetricFilter): Promise<MetricsSummary> => {
    const timeRange = filters?.timeRange || "24h";
    const { startDate, endDate } = getDateRange(timeRange);

    try {
      const response = await apiClient.get<Record<string, unknown>>(
        "/api/v1/metrics/summary",
        {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        }
      );

      const summary = response.data;
      const byResource =
        (summary.by_resource as Record<string, Record<string, number>>) || {};

      // Calculate metrics from backend response
      const totalExecutions = Object.values(byResource).reduce(
        (sum, r) => sum + (r.quantity || 0),
        0
      );

      // Get dashboard for additional metrics
      const dashboardResponse = await apiClient.get<Record<string, unknown>>(
        "/api/v1/metrics/dashboard"
      );
      const dashboardSummary =
        (dashboardResponse.data.summary as Record<string, number>) || {};
      const dashTotalExecs = dashboardSummary.total_executions || 0;

      return {
        totalAgents: Object.keys(byResource).length,
        totalExecutions,
        successRate:
          dashTotalExecs > 0
            ? ((dashTotalExecs - (dashboardSummary.error_count || 0)) /
                dashTotalExecs) *
              100
            : 100,
        avgResponseTime: dashboardSummary.avg_latency || 0,
        activeUsers: 0, // Not available from backend
        apiCalls: byResource.api_call?.quantity || 0,
        errorRate:
          dashTotalExecs > 0
            ? ((dashboardSummary.error_count || 0) / dashTotalExecs) * 100
            : 0,
        p95ResponseTime: (dashboardSummary.avg_latency || 0) * 1.5, // Estimate P95
      };
    } catch {
      // Return default summary on error
      return {
        totalAgents: 0,
        totalExecutions: 0,
        successRate: 100,
        avgResponseTime: 0,
        activeUsers: 0,
        apiCalls: 0,
        errorRate: 0,
        p95ResponseTime: 0,
      };
    }
  },

  /**
   * Get executions list
   */
  getExecutions: async (filters?: {
    deploymentId?: string;
    agentId?: string;
    status?: string;
    limit?: number;
  }): Promise<{ executions: Record<string, unknown>[]; count: number }> => {
    const response = await apiClient.get<{
      executions: Record<string, unknown>[];
      count: number;
    }>("/api/v1/metrics/executions", {
      params: {
        deployment_id: filters?.deploymentId,
        agent_id: filters?.agentId,
        status: filters?.status,
        limit: filters?.limit || 100,
      },
    });
    return response.data;
  },

  /**
   * Get top errors
   */
  getTopErrors: async (
    limit: number = 10
  ): Promise<{ errors: Record<string, unknown>[] }> => {
    const response = await apiClient.get<{ errors: Record<string, unknown>[] }>(
      "/api/v1/metrics/errors",
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Get deployment metrics
   */
  getDeploymentMetrics: async (
    deploymentId: string
  ): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/v1/metrics/deployments/${deploymentId}`
    );
    return response.data;
  },

  /**
   * Get agent metrics
   */
  getAgentMetrics: async (
    agentId: string
  ): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/v1/metrics/agents/${agentId}`
    );
    return response.data;
  },
};

export default metricsApi;
