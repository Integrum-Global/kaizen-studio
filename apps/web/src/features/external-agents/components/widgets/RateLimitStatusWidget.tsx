import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle } from "lucide-react";
import type { GovernanceStatus } from "../../types";

interface RateLimitStatusWidgetProps {
  rateLimits?: GovernanceStatus["rate_limits"];
}

export function RateLimitStatusWidget({
  rateLimits,
}: RateLimitStatusWidgetProps) {
  if (!rateLimits) {
    return (
      <div className="border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          No rate limit configuration set
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h4 className="font-semibold">Rate Limit Status</h4>
      </div>

      <div className="space-y-4">
        <RateLimitGauge
          label="Per Minute"
          current={rateLimits.per_minute.current}
          limit={rateLimits.per_minute.limit}
          remaining={rateLimits.per_minute.remaining}
        />
        <RateLimitGauge
          label="Per Hour"
          current={rateLimits.per_hour.current}
          limit={rateLimits.per_hour.limit}
          remaining={rateLimits.per_hour.remaining}
        />
        <RateLimitGauge
          label="Per Day"
          current={rateLimits.per_day.current}
          limit={rateLimits.per_day.limit}
          remaining={rateLimits.per_day.remaining}
        />
      </div>
    </div>
  );
}

interface RateLimitGaugeProps {
  label: string;
  current: number;
  limit?: number;
  remaining: number;
}

function RateLimitGauge({
  label,
  current,
  limit,
  remaining,
}: RateLimitGaugeProps) {
  const percentage = limit ? (current / limit) * 100 : 0;
  const isNearLimit = percentage > 80 && percentage <= 95;
  const isOverLimit = percentage > 95;

  const progressColor = isOverLimit
    ? "bg-red-500"
    : isNearLimit
      ? "bg-yellow-500"
      : "bg-green-500";

  const textColor = isOverLimit
    ? "text-destructive"
    : isNearLimit
      ? "text-yellow-600 dark:text-yellow-500"
      : "text-green-600 dark:text-green-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {isOverLimit && (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {current} / {limit !== undefined ? limit : "∞"}
          </span>
          <span className={`text-sm font-medium ${textColor}`}>
            {remaining} remaining
          </span>
        </div>
      </div>

      <div className="relative">
        <Progress
          value={percentage}
          className="h-3"
          indicatorClassName={progressColor}
        />
        {percentage > 0 && (
          <div
            className="absolute top-0 left-0 h-3 flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            {percentage > 15 && `${percentage.toFixed(0)}%`}
          </div>
        )}
      </div>

      {isOverLimit && (
        <p className="text-xs text-destructive">
          Rate limit exceeded - invocations may be throttled
        </p>
      )}
      {isNearLimit && !isOverLimit && (
        <p className="text-xs text-yellow-600 dark:text-yellow-500">
          Approaching rate limit
        </p>
      )}
    </div>
  );
}
