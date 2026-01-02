import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Metric } from "../types";

interface MetricCardProps {
  metric: Metric;
  sparklineData?: number[];
  onClick?: () => void;
}

/**
 * Simple sparkline visualization for metric trends
 */
function Sparkline({ dataPoints }: { dataPoints: number[] }) {
  if (dataPoints.length < 2) return null;

  const max = Math.max(...dataPoints);
  const min = Math.min(...dataPoints);
  const range = max - min || 1;

  const points = dataPoints
    .map((value, i) => {
      const x = (i / (dataPoints.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="w-full h-12 mt-2"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
      />
    </svg>
  );
}

export function MetricCard({
  metric,
  sparklineData,
  onClick,
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "stable":
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    // For metrics like error rate, down is good
    if (metric.name.toLowerCase().includes("error")) {
      return metric.trend === "down" ? "text-green-600" : "text-red-600";
    }
    // For most metrics, up is good
    return metric.trend === "up" ? "text-green-600" : "text-red-600";
  };

  const formatValue = (value: number) => {
    if (metric.unit === "%") {
      return value.toFixed(1);
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const formatChange = (change: number) => {
    const abs = Math.abs(change);
    const formatted =
      abs >= 1000 ? `${(abs / 1000).toFixed(1)}K` : abs.toFixed(0);
    return change >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <Card
      className={
        onClick
          ? "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
          : ""
      }
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium">
          {metric.name}
        </CardDescription>
        <CardTitle className="text-3xl font-bold">
          {formatValue(metric.value)}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {metric.unit}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {formatChange(metric.change)} ({metric.changePercent.toFixed(1)}%)
          </span>
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <Sparkline dataPoints={sparklineData} />
        )}

        {metric.description && (
          <p className="text-xs text-muted-foreground mt-2">
            {metric.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
