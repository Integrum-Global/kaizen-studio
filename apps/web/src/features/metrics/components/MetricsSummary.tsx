import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import {
  Activity,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import type { MetricsSummary as MetricsSummaryType } from "../types";

interface MetricsSummaryProps {
  summary: MetricsSummaryType;
  isLoading?: boolean;
}

interface SummaryStatProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: "positive" | "negative" | "neutral";
}

function SummaryStat({ icon, label, value, unit, trend }: SummaryStatProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${getTrendColor()}`}>
          {value}
          {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

function SummaryStatSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

export function MetricsSummary({ summary, isLoading }: MetricsSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SummaryStatSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryStat
            icon={<Activity className="h-5 w-5 text-primary" />}
            label="Total Agents"
            value={summary.totalAgents}
            trend="positive"
          />

          <SummaryStat
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            label="Total Executions"
            value={formatNumber(summary.totalExecutions)}
            trend="positive"
          />

          <SummaryStat
            icon={<CheckCircle className="h-5 w-5 text-primary" />}
            label="Success Rate"
            value={summary.successRate.toFixed(1)}
            unit="%"
            trend={summary.successRate >= 95 ? "positive" : "negative"}
          />

          <SummaryStat
            icon={<Clock className="h-5 w-5 text-primary" />}
            label="Avg Response Time"
            value={summary.avgResponseTime}
            unit="ms"
            trend={summary.avgResponseTime < 300 ? "positive" : "negative"}
          />

          <SummaryStat
            icon={<Users className="h-5 w-5 text-primary" />}
            label="Active Users"
            value={summary.activeUsers}
            trend="positive"
          />

          <SummaryStat
            icon={<Activity className="h-5 w-5 text-primary" />}
            label="API Calls"
            value={formatNumber(summary.apiCalls)}
            trend="neutral"
          />

          <SummaryStat
            icon={<AlertCircle className="h-5 w-5 text-primary" />}
            label="Error Rate"
            value={summary.errorRate.toFixed(1)}
            unit="%"
            trend={summary.errorRate < 2 ? "positive" : "negative"}
          />

          <SummaryStat
            icon={<Clock className="h-5 w-5 text-primary" />}
            label="P95 Response Time"
            value={summary.p95ResponseTime}
            unit="ms"
            trend={summary.p95ResponseTime < 1000 ? "positive" : "negative"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
