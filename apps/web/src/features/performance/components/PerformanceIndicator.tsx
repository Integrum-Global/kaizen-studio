import { cn } from "@/lib/utils";
import type { MetricName, MetricRating, PerformanceMetric } from "../types";
import { formatMetricValue, getMetricDescription } from "../utils";

interface PerformanceIndicatorProps {
  /**
   * Performance metric to display
   */
  metric: PerformanceMetric;

  /**
   * Whether to show description
   */
  showDescription?: boolean;

  /**
   * Whether to show in compact mode
   */
  compact?: boolean;

  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Visual indicator for a single performance metric
 */
export function PerformanceIndicator({
  metric,
  showDescription = false,
  compact = false,
  className,
}: PerformanceIndicatorProps) {
  const ratingColors: Record<MetricRating, string> = {
    good: "bg-green-500",
    "needs-improvement": "bg-amber-500",
    poor: "bg-red-500",
  };

  const ratingTextColors: Record<MetricRating, string> = {
    good: "text-green-700 dark:text-green-400",
    "needs-improvement": "text-amber-700 dark:text-amber-400",
    poor: "text-red-700 dark:text-red-400",
  };

  if (compact) {
    return (
      <div
        className={cn("inline-flex items-center gap-1", className)}
        title={`${metric.name}: ${formatMetricValue(metric.name, metric.value)} (${metric.rating})`}
      >
        <span
          className={cn("h-2 w-2 rounded-full", ratingColors[metric.rating])}
          aria-hidden="true"
        />
        <span className="text-xs font-medium">{metric.name}</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{metric.name}</span>
        <span
          className={cn(
            "text-sm font-semibold",
            ratingTextColors[metric.rating]
          )}
        >
          {formatMetricValue(metric.name, metric.value)}
        </span>
      </div>
      {showDescription && (
        <p className="text-xs text-muted-foreground">
          {getMetricDescription(metric.name)}
        </p>
      )}
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={cn(
            "h-1.5 rounded-full transition-all",
            ratingColors[metric.rating]
          )}
          style={{
            width:
              metric.rating === "good"
                ? "100%"
                : metric.rating === "needs-improvement"
                  ? "60%"
                  : "30%",
          }}
        />
      </div>
    </div>
  );
}

interface PerformanceScoreProps {
  /**
   * Score value (0-100)
   */
  score: number;

  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";

  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Circular performance score indicator
 */
export function PerformanceScore({
  score,
  size = "md",
  className,
}: PerformanceScoreProps) {
  const sizeClasses = {
    sm: "h-12 w-12 text-sm",
    md: "h-20 w-20 text-xl",
    lg: "h-32 w-32 text-3xl",
  };

  const rating: MetricRating =
    score >= 90 ? "good" : score >= 50 ? "needs-improvement" : "poor";

  const ratingColors: Record<MetricRating, string> = {
    good: "border-green-500 text-green-700 dark:text-green-400",
    "needs-improvement": "border-amber-500 text-amber-700 dark:text-amber-400",
    poor: "border-red-500 text-red-700 dark:text-red-400",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-4",
        sizeClasses[size],
        ratingColors[rating],
        className
      )}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Performance score: ${score}`}
    >
      <span className="font-bold">{score}</span>
    </div>
  );
}

interface PerformancePanelProps {
  /**
   * All collected metrics
   */
  metrics: Partial<Record<MetricName, PerformanceMetric>>;

  /**
   * Overall score
   */
  score: number;

  /**
   * Whether metrics are still being collected
   */
  isCollecting?: boolean;

  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Panel displaying all performance metrics
 */
export function PerformancePanel({
  metrics,
  score,
  isCollecting = false,
  className,
}: PerformancePanelProps) {
  const metricOrder: MetricName[] = ["LCP", "INP", "CLS", "FCP", "FID", "TTFB"];
  const availableMetrics = metricOrder.filter((name) => metrics[name]);

  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="flex items-center gap-4">
        <PerformanceScore score={score} size="md" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Performance</h3>
          <p className="text-sm text-muted-foreground">
            {isCollecting
              ? "Collecting metrics..."
              : `${availableMetrics.length} metrics measured`}
          </p>
        </div>
      </div>

      {availableMetrics.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableMetrics.map((name) => (
            <PerformanceIndicator
              key={name}
              metric={metrics[name]!}
              showDescription
            />
          ))}
        </div>
      )}
    </div>
  );
}
