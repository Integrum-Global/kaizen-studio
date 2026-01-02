import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, Download } from "lucide-react";
import { StatusIndicator } from "./StatusIndicator";
import { ServiceStatusCard } from "./ServiceStatusCard";
import { HealthMetrics } from "./HealthMetrics";
import { IncidentTimeline } from "./IncidentTimeline";
import {
  useSystemHealth,
  useIncidents,
  useRefreshHealth,
  useExportReport,
} from "../hooks";
import type { ExportFormat } from "../types";

export function HealthDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshHealth = useRefreshHealth();
  const { mutate: exportReport, isPending: isExporting } = useExportReport();

  const {
    data: systemHealth,
    isPending: isHealthPending,
    error: healthError,
  } = useSystemHealth({
    refetchInterval: autoRefresh ? 30000 : undefined, // 30s when auto-refresh enabled
    enabled: true,
  });

  const {
    data: incidents = [],
    isPending: isIncidentsPending,
  } = useIncidents();

  useEffect(() => {
    if (systemHealth) {
      setLastUpdated(new Date());
    }
  }, [systemHealth]);

  const handleRefresh = () => {
    refreshHealth();
    setLastUpdated(new Date());
  };

  const handleExport = (format: ExportFormat) => {
    exportReport(format);
  };

  if (healthError) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          Failed to load health data. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">System Health Status</h1>
          <p className="text-muted-foreground">
            Monitor system health and service availability
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Auto-refresh toggle */}
          <div className="flex items-center gap-2" data-testid="auto-refresh">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              aria-label="Toggle auto-refresh"
            />
            <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
              Auto Refresh
            </Label>
          </div>

          {/* Refresh button */}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            aria-label="Refresh health status"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          {/* Export button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting}
                aria-label="Export health report"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
        Last updated: <time>{lastUpdated.toLocaleString()}</time>
        {autoRefresh && " (Live)"}
      </div>

      {/* Overall Status */}
      {isHealthPending ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        systemHealth && (
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Overall Status</h2>
                <p className="text-muted-foreground">
                  System is currently {systemHealth.status || systemHealth.overallStatus || "healthy"}
                </p>
              </div>
              <StatusIndicator status={systemHealth.status || systemHealth.overallStatus || "healthy"} />
            </div>
          </div>
        )
      )}

      {/* Service Status Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Services</h2>
        {isHealthPending ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          systemHealth?.services && systemHealth.services.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemHealth.services.map((service) => (
                <ServiceStatusCard key={service.name} service={service} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Dependencies */}
      {systemHealth?.dependencies && systemHealth.dependencies.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Dependencies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemHealth.dependencies.map((dep) => (
              <div
                key={dep.name}
                className="border rounded-lg p-4 dependency-status"
                data-testid={`dependency-${dep.name}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{dep.name}</h3>
                  <StatusIndicator status={dep.status} showText={false} />
                </div>
                <div className="text-sm text-muted-foreground">
                  Type: {dep.type}
                </div>
                {dep.message && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {dep.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {systemHealth?.metrics && <HealthMetrics metrics={systemHealth.metrics} />}

      {/* Incident Timeline */}
      {isIncidentsPending ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <IncidentTimeline incidents={incidents} />
      )}
    </div>
  );
}
