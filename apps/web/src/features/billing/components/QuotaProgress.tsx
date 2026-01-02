import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Quota } from "../types";

interface QuotaProgressProps {
  quota: Quota;
  showDetails?: boolean;
  compact?: boolean;
}

function formatValue(value: number, unit: string): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M ${unit}`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K ${unit}`;
  }
  return `${value} ${unit}`;
}

function getStatusColor(
  percentUsed: number,
  warning: number,
  critical: number
): string {
  if (percentUsed >= critical) return "text-red-500";
  if (percentUsed >= warning) return "text-yellow-500";
  return "text-green-500";
}

function getProgressColor(
  percentUsed: number,
  warning: number,
  critical: number
): string {
  if (percentUsed >= critical) return "bg-red-500";
  if (percentUsed >= warning) return "bg-yellow-500";
  return "";
}

export function QuotaProgress({
  quota,
  showDetails = false,
  compact = false,
}: QuotaProgressProps) {
  const percentUsed = quota.limit > 0 ? (quota.current / quota.limit) * 100 : 0;
  const statusColor = getStatusColor(
    percentUsed,
    quota.warningThreshold,
    quota.criticalThreshold
  );
  const progressColor = getProgressColor(
    percentUsed,
    quota.warningThreshold,
    quota.criticalThreshold
  );

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{quota.name}</span>
          <span className={cn("font-medium", statusColor)}>
            {Math.round(percentUsed)}%
          </span>
        </div>
        <Progress value={percentUsed} className={cn("h-1", progressColor)} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{quota.name}</p>
          {quota.description && (
            <p className="text-sm text-muted-foreground">{quota.description}</p>
          )}
        </div>
        <span className={cn("text-lg font-bold", statusColor)}>
          {Math.round(percentUsed)}%
        </span>
      </div>

      <Progress value={percentUsed} className={cn("h-2", progressColor)} />

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatValue(quota.current, quota.unit)} used</span>
        <span>
          {quota.limit > 0
            ? formatValue(quota.limit, quota.unit) + " limit"
            : "Unlimited"}
        </span>
      </div>

      {showDetails && quota.resetDate && (
        <p className="text-xs text-muted-foreground">
          Resets on {new Date(quota.resetDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
