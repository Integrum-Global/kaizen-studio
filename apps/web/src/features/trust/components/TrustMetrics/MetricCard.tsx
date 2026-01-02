/**
 * MetricCard Component
 *
 * Displays individual metric with trend indicator
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  suffix?: string;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  suffix,
  isLoading,
  onClick,
  className,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-[100px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[80px] mb-2" />
          <Skeleton className="h-3 w-[60px]" />
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) {
      return <Minus className="h-3 w-3" />;
    }
    return trend > 0 ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) {
      return "text-muted-foreground";
    }
    return trend > 0
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  return (
    <Card
      className={cn(
        onClick && "cursor-pointer hover:bg-accent transition-colors",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {suffix && <span className="text-lg ml-1">{suffix}</span>}
        </div>
        {trend !== undefined && (
          <div
            className={cn("flex items-center text-xs mt-1", getTrendColor())}
          >
            {getTrendIcon()}
            <span className="ml-1">
              {Math.abs(trend).toFixed(1)}% from previous period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
