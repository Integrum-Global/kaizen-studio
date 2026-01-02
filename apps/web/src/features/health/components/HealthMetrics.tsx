import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthMetrics as HealthMetricsType } from "../types";

interface HealthMetricsProps {
  metrics: HealthMetricsType;
}

export function HealthMetrics({ metrics }: HealthMetricsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Performance Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Response Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{metrics.responseTime.avg}ms</div>
              <div className="text-xs text-muted-foreground">
                P95: {metrics.responseTime.p95}ms | P99: {metrics.responseTime.p99}ms
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.errorRate.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        {/* Request Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.requestCount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CPU / Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">CPU:</span> {metrics.cpu}%
              </div>
              <div className="text-sm">
                <span className="font-medium">Memory:</span> {metrics.memory}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
