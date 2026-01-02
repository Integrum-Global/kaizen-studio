/**
 * TrustStatsCard Component
 *
 * Displays a single stat with trend indicator
 */

import {
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  Activity,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type StatsVariant =
  | "trustedAgents"
  | "activeDelegations"
  | "auditEvents"
  | "verificationRate";

interface TrustStatsCardProps {
  variant: StatsVariant;
  count: number;
  trend?: {
    direction: "up" | "down";
    percentage: number;
  };
  isLoading?: boolean;
  error?: Error | null;
}

const variantConfig = {
  trustedAgents: {
    title: "Trusted Agents",
    icon: Users,
    iconClassName: "text-blue-600",
  },
  activeDelegations: {
    title: "Active Delegations",
    icon: Shield,
    iconClassName: "text-purple-600",
  },
  auditEvents: {
    title: "Audit Events (24h)",
    icon: Activity,
    iconClassName: "text-orange-600",
  },
  verificationRate: {
    title: "Verification Rate",
    icon: CheckCircle,
    iconClassName: "text-green-600",
  },
};

export function TrustStatsCard({
  variant,
  count,
  trend,
  isLoading,
  error,
}: TrustStatsCardProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
          <Icon className={cn("h-4 w-4", config.iconClassName)} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
          <Icon className={cn("h-4 w-4", config.iconClassName)} />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  // Format count based on variant
  const displayValue =
    variant === "verificationRate" ? `${count}%` : count.toLocaleString();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
        <Icon className={cn("h-4 w-4", config.iconClassName)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
        {trend && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend.direction === "up" ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span
              className={
                trend.direction === "up" ? "text-green-600" : "text-red-600"
              }
            >
              {trend.percentage}%
            </span>
            <span className="ml-1">from last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
