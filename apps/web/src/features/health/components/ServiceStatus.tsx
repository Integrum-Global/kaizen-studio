import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { HealthIndicator } from "./HealthIndicator";
import type { ServiceHealth } from "../types";
import { Activity, Clock, TrendingUp, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ServiceStatusProps {
  service: ServiceHealth;
  onClick?: () => void;
}

export function ServiceStatus({ service, onClick }: ServiceStatusProps) {
  const lastCheckTime = formatDistanceToNow(new Date(service.lastCheck), {
    addSuffix: true,
  });

  return (
    <Card
      className="transition-all hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              {service.endpoint && (
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            {service.description && (
              <CardDescription>{service.description}</CardDescription>
            )}
          </div>
          <HealthIndicator status={service.status} showLabel />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>Latency</span>
            </div>
            <p className="text-sm font-medium">
              {service.status === "down" ? "N/A" : `${service.latency}ms`}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Uptime</span>
            </div>
            <p className="text-sm font-medium">{service.uptime}%</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last Check</span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {lastCheckTime}
            </p>
          </div>
        </div>

        {service.endpoint && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground font-mono truncate">
              {service.endpoint}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for lists
 */
export function ServiceStatusCompact({ service }: { service: ServiceHealth }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <HealthIndicator status={service.status} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{service.name}</p>
          {service.description && (
            <p className="text-xs text-muted-foreground truncate">
              {service.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="text-right">
          <p className="font-medium">{service.latency}ms</p>
          <p>latency</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{service.uptime}%</p>
          <p>uptime</p>
        </div>
      </div>
    </div>
  );
}
