/**
 * TrustMetricsDashboard Component
 *
 * Main analytics dashboard for trust metrics
 */

import { useState, useMemo } from "react";
import { Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTrustMetrics, useExportMetrics } from "../../hooks";
import { MetricCard } from "./MetricCard";
import { TrustActivityChart } from "./TrustActivityChart";
import { DelegationDistributionChart } from "./DelegationDistributionChart";
import { TopCapabilitiesChart } from "./TopCapabilitiesChart";
import { ConstraintViolationsChart } from "./ConstraintViolationsChart";
import type { TimeRange } from "../../types";

type TimePreset = "24h" | "7d" | "30d" | "90d";

interface TrustMetricsDashboardProps {
  onMetricClick?: (metric: string) => void;
}

export function TrustMetricsDashboard({
  onMetricClick,
}: TrustMetricsDashboardProps) {
  const { toast } = useToast();
  const [timePreset, setTimePreset] = useState<TimePreset>("7d");

  const timeRange = useMemo<TimeRange>(() => {
    const end = new Date();
    const start = new Date();

    switch (timePreset) {
      case "24h":
        start.setDate(end.getDate() - 1);
        break;
      case "7d":
        start.setDate(end.getDate() - 7);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      case "90d":
        start.setDate(end.getDate() - 90);
        break;
    }

    return { start, end, preset: timePreset };
  }, [timePreset]);

  const { data: metrics, isPending, error } = useTrustMetrics(timeRange);
  const exportMutation = useExportMetrics();

  const handleExport = async (format: "csv" | "json") => {
    try {
      const blob = await exportMutation.mutateAsync({ timeRange, format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trust-metrics-${timePreset}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Metrics exported as ${format.toUpperCase()}`,
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: "Failed to export metrics. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trust Metrics</h1>
            <p className="text-muted-foreground">
              Analytics and insights for trust operations
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load metrics. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trust Metrics</h1>
          <p className="text-muted-foreground">
            Analytics and insights for trust operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={timePreset}
            onValueChange={(value) => setTimePreset(value as TimePreset)}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("json")}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Trust Establishments"
          value={metrics?.summary.totalEstablishments ?? 0}
          trend={metrics?.summary.establishmentsTrend}
          isLoading={isPending}
          onClick={() => onMetricClick?.("establishments")}
        />
        <MetricCard
          title="Active Delegations"
          value={metrics?.summary.activeDelegations ?? 0}
          trend={metrics?.summary.delegationsTrend}
          isLoading={isPending}
          onClick={() => onMetricClick?.("delegations")}
        />
        <MetricCard
          title="Verification Success Rate"
          value={metrics?.summary.verificationSuccessRate ?? 0}
          trend={metrics?.summary.successRateTrend}
          suffix="%"
          isLoading={isPending}
          onClick={() => onMetricClick?.("verifications")}
        />
        <MetricCard
          title="Audit Events"
          value={metrics?.summary.totalAuditEvents ?? 0}
          trend={metrics?.summary.auditEventsTrend}
          isLoading={isPending}
          onClick={() => onMetricClick?.("audit")}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Activity Chart - Full Width on Mobile, Half on Desktop */}
        <div className="lg:col-span-2">
          <TrustActivityChart
            data={metrics?.activityOverTime ?? []}
            isLoading={isPending}
          />
        </div>

        {/* Distribution Chart */}
        <DelegationDistributionChart
          data={metrics?.delegationDistribution ?? []}
          isLoading={isPending}
        />

        {/* Top Capabilities */}
        <TopCapabilitiesChart
          data={metrics?.topCapabilities ?? []}
          isLoading={isPending}
        />

        {/* Violations Chart - Full Width */}
        <div className="lg:col-span-2">
          <ConstraintViolationsChart
            data={metrics?.constraintViolations ?? []}
            isLoading={isPending}
          />
        </div>
      </div>
    </div>
  );
}
