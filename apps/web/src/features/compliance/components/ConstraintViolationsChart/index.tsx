/**
 * ConstraintViolationsChart Component
 *
 * Bar chart showing weekly constraint violations.
 * Supports click to drill down to specific week.
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ConstraintViolationsChartProps, WeeklyViolations } from '../../types';

/**
 * Bar component
 */
function Bar({
  data,
  maxCount,
  onClick,
}: {
  data: WeeklyViolations;
  maxCount: number;
  onClick?: () => void;
}) {
  const percentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0;

  // Color based on count
  const barColor = data.count > 10
    ? 'bg-red-500'
    : data.count > 5
      ? 'bg-amber-500'
      : 'bg-blue-500';

  return (
    <button
      type="button"
      className={cn(
        'flex flex-col items-center gap-1 flex-1 min-w-[40px]',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity'
      )}
      onClick={onClick}
      title={`${data.week}: ${data.count} violations`}
      data-testid={`bar-${data.week}`}
    >
      {/* Bar container */}
      <div className="w-full h-32 flex items-end justify-center">
        <div
          className={cn(
            'w-full max-w-[30px] rounded-t transition-all duration-300',
            barColor,
            percentage === 0 && 'bg-muted h-1'
          )}
          style={{ height: `${Math.max(percentage, 4)}%` }}
        />
      </div>
      {/* Count label */}
      <span className="text-xs font-medium">{data.count}</span>
      {/* Week label */}
      <span className="text-xs text-muted-foreground">{data.week}</span>
    </button>
  );
}

/**
 * Y-axis labels
 */
function YAxisLabels({ maxCount }: { maxCount: number }) {
  const labels = useMemo(() => {
    if (maxCount === 0) return [0];
    // Create 4 evenly spaced labels
    const step = Math.ceil(maxCount / 4);
    return [0, step, step * 2, step * 3, maxCount].filter((v, i, arr) => arr.indexOf(v) === i);
  }, [maxCount]);

  return (
    <div className="flex flex-col justify-between h-32 text-xs text-muted-foreground pr-2">
      {labels.reverse().map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}

/**
 * ConstraintViolationsChart Component
 */
export function ConstraintViolationsChart({
  data,
  onWeekClick,
  className,
}: ConstraintViolationsChartProps) {
  // Calculate max count for scaling
  const maxCount = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map((d) => d.count));
  }, [data]);

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className={cn('space-y-2', className)}
        data-testid="violations-chart-empty"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Constraint Violations (Last 30 Days)</span>
        </div>
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
          No violation data available
        </div>
      </div>
    );
  }

  // No violations state
  const totalViolations = data.reduce((sum, d) => sum + d.count, 0);
  if (totalViolations === 0) {
    return (
      <div
        className={cn('space-y-2', className)}
        data-testid="violations-chart"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Constraint Violations (Last 30 Days)</span>
          <span className="text-sm text-green-600 font-medium">No violations</span>
        </div>
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground border rounded-lg">
          No constraint violations in the last 30 days
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-2', className)}
      data-testid="violations-chart"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Constraint Violations (Last 30 Days)</span>
        <span className="text-sm text-muted-foreground">
          Total: {totalViolations}
        </span>
      </div>

      {/* Chart */}
      <div className="flex gap-2 pt-2">
        <YAxisLabels maxCount={maxCount} />
        <div className="flex-1 flex gap-1 border-l border-b pl-2 pb-2">
          {data.map((weekData) => (
            <Bar
              key={weekData.week}
              data={weekData}
              maxCount={maxCount}
              onClick={onWeekClick ? () => onWeekClick(weekData.week) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground justify-end">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          Low (≤5)
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          Medium (6-10)
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          High (&gt;10)
        </span>
      </div>
    </div>
  );
}

export default ConstraintViolationsChart;
