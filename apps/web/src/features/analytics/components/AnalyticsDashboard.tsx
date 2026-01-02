/**
 * Analytics Dashboard - Main analytics view
 */

import { useState } from "react";
import { AnalyticsCard, AnalyticsCardSkeleton } from "./AnalyticsCard";
import { LineChart } from "./LineChart";
import { BarChart } from "./BarChart";
import { PieChart } from "./PieChart";
import { TrendIndicator } from "./TrendIndicator";
import {
  useExecutionMetrics,
  useApiUsageMetrics,
  useSuccessRateMetrics,
  useAgentPerformance,
  useDeploymentDistribution,
  useMetricsSummary,
  useErrorDistribution,
} from "../hooks";
import { Button } from "@/components/ui";
import { Calendar, Download } from "lucide-react";

export function AnalyticsDashboard() {
  const [timeRange] = useState<string>("30d");

  const { data: executions, isPending: executionsLoading } =
    useExecutionMetrics();
  const { data: apiUsage, isPending: apiUsageLoading } = useApiUsageMetrics();
  const { data: successRate, isPending: successRateLoading } =
    useSuccessRateMetrics();
  const { data: agentPerformance, isPending: agentPerfLoading } =
    useAgentPerformance();
  const { data: deployments, isPending: deploymentsLoading } =
    useDeploymentDistribution();
  const { data: metrics, isPending: metricsLoading } = useMetricsSummary();
  const { data: errors, isPending: errorsLoading } = useErrorDistribution();

  const handleExport = () => {
    // Mock export functionality
    console.log("Exporting analytics data...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your agents, executions, and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last {timeRange === "7d" ? "7 days" : "30 days"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <AnalyticsCardSkeleton key={i} />
            ))}
          </>
        ) : (
          metrics?.map((metric) => (
            <AnalyticsCard key={metric.name} title={metric.name}>
              <div className="space-y-2">
                <div className="text-3xl font-bold">
                  {metric.name === "Avg Response Time"
                    ? `${metric.value}ms`
                    : metric.name === "Success Rate"
                      ? `${metric.value}%`
                      : metric.value.toLocaleString()}
                </div>
                <TrendIndicator value={metric.change} trend={metric.trend} />
              </div>
            </AnalyticsCard>
          ))
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Execution Metrics */}
        <AnalyticsCard
          title="Execution Metrics"
          description="Agent executions over time"
        >
          {executionsLoading ? (
            <div className="h-[300px] animate-pulse bg-muted rounded" />
          ) : executions ? (
            <LineChart
              data={executions}
              color="hsl(var(--chart-1))"
              label="Executions"
            />
          ) : null}
        </AnalyticsCard>

        {/* API Usage */}
        <AnalyticsCard title="API Usage" description="API calls over time">
          {apiUsageLoading ? (
            <div className="h-[300px] animate-pulse bg-muted rounded" />
          ) : apiUsage ? (
            <LineChart
              data={apiUsage}
              color="hsl(var(--chart-2))"
              label="API Calls"
            />
          ) : null}
        </AnalyticsCard>

        {/* Success Rate */}
        <AnalyticsCard
          title="Success Rate"
          description="Execution success rate over time"
        >
          {successRateLoading ? (
            <div className="h-[300px] animate-pulse bg-muted rounded" />
          ) : successRate ? (
            <LineChart
              data={successRate}
              color="hsl(var(--chart-3))"
              label="Success Rate %"
              formatYAxis={(value) => `${value}%`}
              formatTooltip={(value) => `${value}%`}
            />
          ) : null}
        </AnalyticsCard>

        {/* Agent Performance */}
        <AnalyticsCard
          title="Agent Performance"
          description="Comparison of agent metrics"
        >
          {agentPerfLoading ? (
            <div className="h-[300px] animate-pulse bg-muted rounded" />
          ) : agentPerformance ? (
            <BarChart data={agentPerformance} />
          ) : null}
        </AnalyticsCard>

        {/* Deployment Distribution */}
        <AnalyticsCard
          title="Deployment Distribution"
          description="Active deployments by environment"
        >
          {deploymentsLoading ? (
            <div className="h-[300px] animate-pulse bg-muted rounded" />
          ) : deployments ? (
            <PieChart data={deployments} innerRadius={60} />
          ) : null}
        </AnalyticsCard>

        {/* Error Distribution */}
        <AnalyticsCard
          title="Error Distribution"
          description="Error types breakdown"
        >
          {errorsLoading ? (
            <div className="h-[300px] animate-pulse bg-muted rounded" />
          ) : errors ? (
            <PieChart data={errors} />
          ) : null}
        </AnalyticsCard>
      </div>
    </div>
  );
}
