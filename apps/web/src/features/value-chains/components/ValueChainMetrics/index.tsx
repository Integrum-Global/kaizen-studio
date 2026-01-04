/**
 * ValueChainMetrics Component
 *
 * Dashboard showing execution statistics, cost consumption,
 * and error trends for a value chain.
 */

import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/**
 * Execution statistics
 */
export interface ExecutionStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  averageDuration: number; // in seconds
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

/**
 * Cost metrics
 */
export interface CostMetrics {
  currentSpend: number;
  budget: number;
  percentUsed: number;
  projectedSpend: number;
  currency: string;
}

/**
 * Error trend data point
 */
export interface ErrorTrendPoint {
  date: string;
  count: number;
}

/**
 * Value chain metrics data
 */
export interface ValueChainMetricsData {
  execution: ExecutionStats;
  cost: CostMetrics;
  errorTrend: ErrorTrendPoint[];
}

export interface ValueChainMetricsProps {
  data: ValueChainMetricsData;
  dateRange?: {
    start: Date;
    end: Date;
  };
  className?: string;
}

/**
 * Metric card component
 */
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'blue' | 'green' | 'amber' | 'red';
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div
                className={cn(
                  'flex items-center gap-1 mt-2 text-xs',
                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                )}
              >
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple bar chart for error trend
 */
function ErrorTrendChart({ data }: { data: ErrorTrendPoint[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((point, index) => {
        const height = (point.count / maxCount) * 100;
        return (
          <div
            key={index}
            className="flex-1 flex flex-col items-center gap-1"
            title={`${point.date}: ${point.count} errors`}
          >
            <div
              className={cn(
                'w-full rounded-t transition-all',
                point.count > 0 ? 'bg-red-400' : 'bg-gray-200 dark:bg-gray-700'
              )}
              style={{ height: `${Math.max(height, 4)}%` }}
            />
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(point.date), 'd')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Format duration in seconds to human readable
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format currency
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * ValueChainMetrics Component
 */
export function ValueChainMetrics({
  data,
  dateRange,
  className,
}: ValueChainMetricsProps) {
  const { execution, cost, errorTrend } = data;

  // Calculate date range label
  const dateRangeLabel = useMemo(() => {
    if (dateRange) {
      return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`;
    }
    return 'Last 7 days';
  }, [dateRange]);

  // Total errors in the trend period
  const totalErrors = errorTrend.reduce((sum, point) => sum + point.count, 0);

  // Cost status color
  const costColor =
    cost.percentUsed > 90
      ? 'red'
      : cost.percentUsed > 70
        ? 'amber'
        : 'green';

  return (
    <div className={cn('space-y-6', className)} data-testid="value-chain-metrics">
      {/* Date range header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Metrics</h3>
        <span className="text-sm text-muted-foreground">{dateRangeLabel}</span>
      </div>

      {/* Top metrics grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Executions"
          value={execution.totalRuns.toLocaleString()}
          subtitle={`${execution.successRate.toFixed(1)}% success rate`}
          icon={Activity}
          trend={execution.trend}
          trendValue={`${execution.trendPercentage > 0 ? '+' : ''}${execution.trendPercentage}% vs last period`}
          color="blue"
        />
        <MetricCard
          title="Successful Runs"
          value={execution.successfulRuns.toLocaleString()}
          subtitle={formatDuration(execution.averageDuration) + ' avg'}
          icon={CheckCircle2}
          color="green"
        />
        <MetricCard
          title="Failed Runs"
          value={execution.failedRuns.toLocaleString()}
          subtitle={`${totalErrors} errors this period`}
          icon={AlertCircle}
          color={execution.failedRuns > 0 ? 'red' : 'green'}
        />
        <MetricCard
          title="Cost"
          value={formatCurrency(cost.currentSpend, cost.currency)}
          subtitle={`of ${formatCurrency(cost.budget, cost.currency)} budget`}
          icon={DollarSign}
          color={costColor}
        />
      </div>

      {/* Cost progress and error trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost consumption */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Budget Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {formatCurrency(cost.currentSpend, cost.currency)} used
                </span>
                <span className="text-muted-foreground">
                  {cost.percentUsed.toFixed(1)}%
                </span>
              </div>
              <Progress value={cost.percentUsed} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Budget: {formatCurrency(cost.budget, cost.currency)}</span>
                <span>
                  Projected: {formatCurrency(cost.projectedSpend, cost.currency)}
                </span>
              </div>
              {cost.projectedSpend > cost.budget && (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>Projected to exceed budget</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Error Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {errorTrend.length > 0 ? (
              <div className="space-y-3">
                <ErrorTrendChart data={errorTrend} />
                <p className="text-xs text-muted-foreground text-center">
                  {totalErrors} total errors in the period
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                No error data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ValueChainMetrics;
