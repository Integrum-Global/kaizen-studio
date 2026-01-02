/**
 * Trend Indicator component showing up/down arrow with percentage change
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  value: number;
  trend?: "up" | "down" | "neutral";
  className?: string;
  showIcon?: boolean;
  showSign?: boolean;
  suffix?: string;
}

export function TrendIndicator({
  value,
  trend,
  className,
  showIcon = true,
  showSign = true,
  suffix = "%",
}: TrendIndicatorProps) {
  // Auto-detect trend from value if not provided
  const detectedTrend =
    trend || (value > 0 ? "up" : value < 0 ? "down" : "neutral");
  const absoluteValue = Math.abs(value);

  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-500",
      bgColor: "bg-green-100 dark:bg-green-500/10",
    },
    down: {
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-500",
      bgColor: "bg-red-100 dark:bg-red-500/10",
    },
    neutral: {
      icon: Minus,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-500/10",
    },
  };

  const config = trendConfig[detectedTrend];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
        config.bgColor,
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>
        {showSign && value !== 0 && (value > 0 ? "+" : "")}
        {absoluteValue.toFixed(1)}
        {suffix}
      </span>
    </div>
  );
}
