import { useState } from "react";
import { Alert, Skeleton } from "@/components/ui";
import { AlertCircle } from "lucide-react";
import { useMetrics, useMetricSeries, useMetricsSummary } from "../hooks";
import { MetricCard } from "./MetricCard";
import { MetricChart } from "./MetricChart";
import { MetricsFilters } from "./MetricsFilters";
import { MetricsSummary } from "./MetricsSummary";
import type { MetricFilter, TimeRange } from "../types";

/**
 * Loading skeleton for metric cards
 */
function MetricCardSkeleton() {
  return (
    <div className="space-y-3 p-6 border rounded-lg">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}

/**
 * Error alert component
 */
function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <div>
        <h4 className="font-semibold">Error loading metrics</h4>
        <p className="text-sm">{message}</p>
      </div>
    </Alert>
  );
}

/**
 * Main metrics dashboard component
 */
export function MetricsDashboard() {
  const [filters, setFilters] = useState<MetricFilter>({
    timeRange: "24h" as TimeRange,
  });

  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);

  // Fetch data using hooks
  const {
    data: metricsData,
    isPending: isMetricsPending,
    error: metricsError,
    refetch: refetchMetrics,
  } = useMetrics(filters);

  const {
    data: summaryData,
    isPending: isSummaryPending,
    error: summaryError,
  } = useMetricsSummary(filters);

  const {
    data: seriesData,
    isPending: isSeriesPending,
    error: seriesError,
  } = useMetricSeries(selectedMetricIds, filters);

  // Handle metric card click - toggle chart visibility
  const handleMetricClick = (metricId: string) => {
    setSelectedMetricIds((prev) => {
      if (prev.includes(metricId)) {
        return prev.filter((id) => id !== metricId);
      }
      return [...prev, metricId];
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchMetrics();
  };

  const isRefreshing = isMetricsPending;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Metrics Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your agents, executions, and system performance
        </p>
      </div>

      {/* Filters */}
      <MetricsFilters
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Summary Statistics */}
      {summaryError ? (
        <ErrorAlert message={(summaryError as Error).message} />
      ) : (
        <MetricsSummary
          summary={
            summaryData || {
              totalAgents: 0,
              totalExecutions: 0,
              successRate: 0,
              avgResponseTime: 0,
              activeUsers: 0,
              apiCalls: 0,
              errorRate: 0,
              p95ResponseTime: 0,
            }
          }
          isLoading={isSummaryPending}
        />
      )}

      {/* Metric Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Key Metrics</h2>

        {metricsError ? (
          <ErrorAlert message={(metricsError as Error).message} />
        ) : isMetricsPending ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        ) : metricsData && metricsData.records.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricsData.records.map((metric) => {
              // Get sparkline data from series if available
              const metricSeries = seriesData?.series.find(
                (s) => s.metricId === metric.id
              );
              const sparklineData = metricSeries?.dataPoints.map(
                (dp) => dp.value
              );

              return (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  sparklineData={sparklineData}
                  onClick={() => handleMetricClick(metric.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No metrics available
          </div>
        )}
      </div>

      {/* Charts Section */}
      {selectedMetricIds.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Time Series Charts</h2>
          <p className="text-sm text-muted-foreground">
            Click on metric cards above to view detailed time series charts
          </p>

          {seriesError ? (
            <ErrorAlert message={(seriesError as Error).message} />
          ) : isSeriesPending ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {selectedMetricIds.map((id) => (
                <div key={id} className="space-y-3 p-6 border rounded-lg">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ))}
            </div>
          ) : seriesData && seriesData.series.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {seriesData.series.map((series) => (
                <MetricChart key={series.metricId} series={series} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No chart data available
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      {selectedMetricIds.length === 0 && !isMetricsPending && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-lg font-medium">
            Click on any metric card to view its time series chart
          </p>
          <p className="text-sm mt-2">
            You can select multiple metrics to compare them side by side
          </p>
        </div>
      )}
    </div>
  );
}
