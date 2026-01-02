import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "./StatusIndicator";
import type { ServiceStatus } from "../types";

interface ServiceStatusCardProps {
  service: ServiceStatus;
}

export function ServiceStatusCard({ service }: ServiceStatusCardProps) {
  return (
    <Card className="border rounded-lg" data-testid={`service-${service.name}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{service.name}</span>
          <StatusIndicator status={service.status} showText={false} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Status:</span>
          <StatusIndicator status={service.status} />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Uptime:</span>
          <span className="text-sm font-medium">{service.uptime.toFixed(2)}%</span>
        </div>

        {service.responseTime !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Response Time:</span>
            <span className="text-sm font-medium">{service.responseTime}ms</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Last Check:</span>
          <time className="text-sm font-medium">
            {new Date(service.lastCheck).toLocaleTimeString()}
          </time>
        </div>

        {service.message && (
          <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
            {service.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
