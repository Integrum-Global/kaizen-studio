/**
 * Analytics Feature - Usage Examples
 *
 * This file contains practical examples of using the analytics feature.
 * Copy and adapt these examples to your specific use case.
 */
import {
  AnalyticsDashboard,
  AnalyticsCard,
  LineChart,
  BarChart,
  PieChart,
  TrendIndicator,
  useExecutionMetrics,
  useMetricsSummary,
  type TimeSeriesData,
  type ChartData,
  type CategoryData,
} from "@/features/analytics";
import { Button } from "@/components/ui";
import { RefreshCw } from "lucide-react";

/**
 * Example 1: Full Analytics Dashboard
 * Drop-in complete analytics view
 */
export function FullDashboardExample() {
  return <AnalyticsDashboard />;
}

/**
 * Example 2: Custom Metric Card
 * Single metric with trend indicator
 */
export function MetricCardExample() {
  const { data: metrics, isPending, refetch } = useMetricsSummary();

  if (isPending) {
    return <div>Loading...</div>;
  }

  const totalExecutions = metrics?.find((m) => m.name === "Total Executions");

  return (
    <AnalyticsCard
      title="Total Executions"
      description="Last 30 days"
      action={
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-2">
        <div className="text-3xl font-bold">
          {totalExecutions?.value.toLocaleString()}
        </div>
        <TrendIndicator
          value={totalExecutions?.change ?? 0}
          trend={totalExecutions?.trend}
        />
      </div>
    </AnalyticsCard>
  );
}

/**
 * Example 3: Time Series Line Chart
 * Agent executions over time
 */
export function ExecutionTrendExample() {
  const { data, isPending } = useExecutionMetrics();

  if (isPending) {
    return <div className="h-[300px] animate-pulse bg-muted rounded" />;
  }

  return (
    <AnalyticsCard title="Execution Trend" description="Daily executions">
      <LineChart
        data={data ?? []}
        color="hsl(var(--chart-1))"
        height={300}
        showGrid={true}
        label="Executions"
      />
    </AnalyticsCard>
  );
}

/**
 * Example 4: Multi-Series Bar Chart
 * Compare multiple metrics across agents
 */
export function AgentComparisonExample() {
  const comparisonData: ChartData = {
    labels: ["Agent A", "Agent B", "Agent C", "Agent D"],
    datasets: [
      {
        label: "Executions",
        data: [1250, 980, 1450, 870],
        color: "hsl(var(--chart-1))",
      },
      {
        label: "Success Rate %",
        data: [95, 92, 98, 88],
        color: "hsl(var(--chart-2))",
      },
    ],
  };

  return (
    <AnalyticsCard
      title="Agent Performance"
      description="Executions vs Success Rate"
    >
      <BarChart data={comparisonData} layout="vertical" showLegend={true} />
    </AnalyticsCard>
  );
}

/**
 * Example 5: Donut Chart for Distribution
 * Environment deployment distribution
 */
export function DeploymentDistributionExample() {
  const deploymentData: CategoryData[] = [
    { name: "Production", value: 45, percentage: 45 },
    { name: "Staging", value: 30, percentage: 30 },
    { name: "Development", value: 15, percentage: 15 },
    { name: "Testing", value: 10, percentage: 10 },
  ];

  return (
    <AnalyticsCard
      title="Deployment Distribution"
      description="Active deployments by environment"
    >
      <PieChart data={deploymentData} innerRadius={60} showLegend={true} />
    </AnalyticsCard>
  );
}

/**
 * Example 6: Custom Chart with Formatting
 * Response time with custom formatters
 */
export function ResponseTimeExample() {
  const responseTimeData: TimeSeriesData[] = [
    { timestamp: "2024-01-01T00:00:00Z", value: 234 },
    { timestamp: "2024-01-02T00:00:00Z", value: 198 },
    { timestamp: "2024-01-03T00:00:00Z", value: 212 },
    { timestamp: "2024-01-04T00:00:00Z", value: 187 },
    { timestamp: "2024-01-05T00:00:00Z", value: 201 },
  ];

  return (
    <AnalyticsCard
      title="Response Time"
      description="Average response time in milliseconds"
    >
      <LineChart
        data={responseTimeData}
        color="hsl(var(--chart-3))"
        height={250}
        showGrid={true}
        label="Response Time"
        formatYAxis={(value) => `${value}ms`}
        formatTooltip={(value) => `${value}ms`}
      />
    </AnalyticsCard>
  );
}

/**
 * Example 7: Horizontal Bar Chart
 * Error types ranked by frequency
 */
export function ErrorRankingExample() {
  const errorData: CategoryData[] = [
    { name: "Timeout", value: 45, percentage: 45 },
    { name: "Authentication", value: 28, percentage: 28 },
    { name: "Rate Limit", value: 15, percentage: 15 },
    { name: "Server Error", value: 8, percentage: 8 },
    { name: "Other", value: 4, percentage: 4 },
  ];

  return (
    <AnalyticsCard title="Error Distribution" description="Top error types">
      <BarChart data={errorData} layout="horizontal" showLegend={false} />
    </AnalyticsCard>
  );
}

/**
 * Example 8: Grid of Metric Cards
 * Key metrics dashboard
 */
export function MetricsGridExample() {
  const { data: metrics, isPending } = useMetricsSummary();

  if (isPending) {
    return <div>Loading metrics...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics?.map((metric) => (
        <AnalyticsCard key={metric.name} title={metric.name}>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {metric.name === "Avg Response Time"
                ? `${metric.value}ms`
                : metric.name === "Success Rate"
                  ? `${metric.value}%`
                  : metric.value.toLocaleString()}
            </div>
            <TrendIndicator value={metric.change} trend={metric.trend} />
          </div>
        </AnalyticsCard>
      ))}
    </div>
  );
}

/**
 * Example 9: Standalone Trend Indicators
 * Show trends without full cards
 */
export function TrendIndicatorsExample() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">API Calls</span>
        <TrendIndicator value={12.5} trend="up" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Error Rate</span>
        <TrendIndicator value={-8.3} trend="down" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Active Users</span>
        <TrendIndicator value={0} trend="neutral" />
      </div>
    </div>
  );
}

/**
 * Example 10: Combining Charts in Custom Layout
 * Custom 2-column analytics view
 */
export function CustomLayoutExample() {
  const { data: executions } = useExecutionMetrics();

  const deploymentData: CategoryData[] = [
    { name: "Production", value: 45, percentage: 45 },
    { name: "Staging", value: 30, percentage: 30 },
    { name: "Development", value: 25, percentage: 25 },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left column */}
      <div className="space-y-6">
        <AnalyticsCard title="Executions" description="Last 30 days">
          <LineChart
            data={executions ?? []}
            color="hsl(var(--chart-1))"
            height={250}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Quick Stats">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">45,678</div>
              <div className="text-sm text-muted-foreground">Total Runs</div>
            </div>
            <div>
              <div className="text-2xl font-bold">94.3%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </AnalyticsCard>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        <AnalyticsCard title="Deployments" description="By environment">
          <PieChart data={deploymentData} innerRadius={50} />
        </AnalyticsCard>

        <AnalyticsCard title="Performance">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg Response Time</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">234ms</span>
                <TrendIndicator value={-8.5} trend="down" showIcon={false} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">P95 Response Time</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">512ms</span>
                <TrendIndicator value={-3.2} trend="down" showIcon={false} />
              </div>
            </div>
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
