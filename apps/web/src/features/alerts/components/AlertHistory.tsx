import { useAlertHistory } from "../hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from "@/components/ui";
import { alertSeverityLabels } from "../types";
import type { AlertHistory as AlertHistoryType, AlertSeverity } from "../types";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, CheckCircle, TrendingUp } from "lucide-react";

interface AlertHistoryProps {
  alertId: string;
}

export function AlertHistory({ alertId }: AlertHistoryProps) {
  const { data, isPending, error } = useAlertHistory(alertId);

  if (isPending) {
    return <AlertHistorySkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load alert history</p>
      </div>
    );
  }

  if (!data || data.records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <Clock className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">No history available</p>
        <p className="text-sm text-muted-foreground">
          This alert has not been triggered yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Alert History</h3>
        <p className="text-sm text-muted-foreground">
          {data.total} {data.total === 1 ? "event" : "events"}
        </p>
      </div>

      <div className="space-y-3">
        {data.records.map((event) => (
          <AlertHistoryItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

interface AlertHistoryItemProps {
  event: AlertHistoryType;
}

function AlertHistoryItem({ event }: AlertHistoryItemProps) {
  const getSeverityColor = (
    severity: AlertSeverity
  ): "destructive" | "secondary" | "outline" | "default" => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "outline";
      case "info":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>{format(new Date(event.triggered_at), "PPp")}</span>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {formatDistanceToNow(new Date(event.triggered_at), {
                addSuffix: true,
              })}
            </CardDescription>
          </div>
          <Badge variant={getSeverityColor(event.severity)}>
            {alertSeverityLabels[event.severity]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Value:</span>
            <span className="ml-2 font-medium">{event.value}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Threshold:</span>
            <span className="ml-2 font-medium">{event.threshold}</span>
          </div>
        </div>

        {event.resolved_at && (
          <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-secondary/50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <span className="text-muted-foreground">Resolved:</span>
              <span className="ml-2 font-medium">
                {format(new Date(event.resolved_at), "PPp")}
              </span>
            </div>
            {event.duration && (
              <Badge variant="outline">
                Duration: {formatDuration(event.duration)}
              </Badge>
            )}
          </div>
        )}

        {!event.resolved_at && (
          <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-700 dark:text-yellow-400">
              Still active
            </span>
          </div>
        )}

        {event.details && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {event.details}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertHistorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
