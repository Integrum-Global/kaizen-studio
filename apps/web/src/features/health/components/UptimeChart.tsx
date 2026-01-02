import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { useUptimeData } from "../hooks";
import { Skeleton } from "@/components/ui";
import { Activity, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface UptimeDataPoint {
  timestamp: string;
  uptime: number;
  latency: number;
}

interface UptimeChartProps {
  serviceId: string;
  serviceName: string;
  hours?: number;
}

export function UptimeChart({
  serviceId,
  serviceName,
  hours = 24,
}: UptimeChartProps) {
  const { data, isPending, error } = useUptimeData(serviceId, hours);

  if (isPending) {
    return <UptimeChartSkeleton />;
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uptime History</CardTitle>
          <CardDescription>
            Last {hours} hours for {serviceName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load uptime data</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const avgUptime =
    data.reduce((sum, point) => sum + point.uptime, 0) / data.length;
  const avgLatency =
    data.reduce((sum, point) => sum + point.latency, 0) / data.length;

  // Determine max values for scaling
  const maxLatency = Math.max(...data.map((d) => d.latency));
  const minUptime = Math.min(...data.map((d) => d.uptime));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Uptime History</CardTitle>
            <CardDescription>
              Last {hours} hours for {serviceName}
            </CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-right">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Avg Uptime</span>
              </div>
              <p className="font-semibold">{avgUptime.toFixed(2)}%</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>Avg Latency</span>
              </div>
              <p className="font-semibold">{avgLatency.toFixed(0)}ms</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Uptime Chart */}
          <div>
            <p className="text-sm font-medium mb-2">Uptime %</p>
            <div className="relative h-32 border rounded-lg p-4 bg-muted/20">
              <div className="flex items-end justify-between h-full gap-1">
                {data.map((point: UptimeDataPoint, i: number) => {
                  const height =
                    ((point.uptime - minUptime) / (100 - minUptime)) * 100;
                  const color =
                    point.uptime >= 99.5
                      ? "bg-green-500"
                      : point.uptime >= 95
                        ? "bg-yellow-500"
                        : "bg-red-500";

                  return (
                    <div
                      key={i}
                      className="relative flex-1 group"
                      style={{ height: "100%" }}
                    >
                      <div
                        className={`absolute bottom-0 w-full rounded-t transition-all ${color}`}
                        style={{ height: `${height}%` }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                        <p className="font-medium">
                          {point.uptime.toFixed(2)}%
                        </p>
                        <p className="text-muted-foreground">
                          {format(new Date(point.timestamp), "MMM d, HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Latency Chart */}
          <div>
            <p className="text-sm font-medium mb-2">Latency (ms)</p>
            <div className="relative h-32 border rounded-lg p-4 bg-muted/20">
              <div className="flex items-end justify-between h-full gap-1">
                {data.map((point: UptimeDataPoint, i: number) => {
                  const height = (point.latency / maxLatency) * 100;
                  const color =
                    point.latency <= 50
                      ? "bg-green-500"
                      : point.latency <= 100
                        ? "bg-yellow-500"
                        : "bg-red-500";

                  return (
                    <div
                      key={i}
                      className="relative flex-1 group"
                      style={{ height: "100%" }}
                    >
                      <div
                        className={`absolute bottom-0 w-full rounded-t transition-all ${color}`}
                        style={{ height: `${height}%` }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                        <p className="font-medium">
                          {point.latency.toFixed(0)}ms
                        </p>
                        <p className="text-muted-foreground">
                          {format(new Date(point.timestamp), "MMM d, HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UptimeChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-32 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
