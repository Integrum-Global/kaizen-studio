import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useGatewayHealth } from "../hooks";
import type { GatewayStatus } from "../types";

interface GatewayHealthProps {
  gatewayId: string;
  gatewayName?: string;
}

const statusIcons: Record<GatewayStatus, React.ReactNode> = {
  healthy: <CheckCircle className="h-5 w-5 text-green-500" />,
  degraded: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  down: <XCircle className="h-5 w-5 text-red-500" />,
  unknown: <Activity className="h-5 w-5 text-gray-500" />,
};

const statusColors: Record<
  GatewayStatus,
  "default" | "destructive" | "secondary" | "outline"
> = {
  healthy: "default",
  degraded: "secondary",
  down: "destructive",
  unknown: "outline",
};

function formatUptime(uptime: number): string {
  return `${uptime.toFixed(2)}%`;
}

function formatLatency(latency: number): string {
  return `${latency}ms`;
}

export function GatewayHealth({ gatewayId, gatewayName }: GatewayHealthProps) {
  const { data: health, isLoading } = useGatewayHealth(gatewayId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Unable to fetch health data
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {statusIcons[health.status]}
            {gatewayName || "Gateway"} Health
          </CardTitle>
          <Badge variant={statusColors[health.status]}>{health.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Latency</p>
            <p className="text-2xl font-bold">
              {formatLatency(health.latency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Requests/sec</p>
            <p className="text-2xl font-bold">
              {health.requestsPerSecond.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Error Rate</p>
            <p className="text-2xl font-bold">{health.errorRate}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Uptime</p>
            <p className="text-2xl font-bold">{formatUptime(health.uptime)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">CPU Usage</span>
              <span className="font-medium">{health.cpuUsage}%</span>
            </div>
            <Progress value={health.cpuUsage} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Memory Usage</span>
              <span className="font-medium">{health.memoryUsage}%</span>
            </div>
            <Progress value={health.memoryUsage} className="h-2" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
          <Clock className="h-4 w-4" />
          Last checked: {new Date(health.lastCheck).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
