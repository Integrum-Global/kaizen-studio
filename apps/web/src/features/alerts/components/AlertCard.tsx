import { Alert as AlertType, alertSeverityLabels } from "../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { MoreVertical, CheckCircle, AlertCircle, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AlertCardProps {
  alert: AlertType;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
  onViewHistory?: (id: string) => void;
}

export function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
  onViewHistory,
}: AlertCardProps) {
  const getSeverityColor = (
    severity: AlertType["severity"]
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

  const getStatusColor = (
    status: AlertType["status"]
  ): "destructive" | "secondary" | "outline" | "default" => {
    switch (status) {
      case "active":
        return "destructive";
      case "acknowledged":
        return "outline";
      case "resolved":
        return "secondary";
      default:
        return "default";
    }
  };

  const getSeverityIcon = (severity: AlertType["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getSeverityIcon(alert.severity)}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">
                {alert.name}
              </CardTitle>
              {alert.description && (
                <CardDescription className="text-sm mt-1 line-clamp-2">
                  {alert.description}
                </CardDescription>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {alert.status === "active" && onAcknowledge && (
                <DropdownMenuItem onClick={() => onAcknowledge(alert.id)}>
                  Acknowledge
                </DropdownMenuItem>
              )}
              {alert.status !== "resolved" && onResolve && (
                <DropdownMenuItem onClick={() => onResolve(alert.id)}>
                  Resolve
                </DropdownMenuItem>
              )}
              {onViewHistory && (
                <DropdownMenuItem onClick={() => onViewHistory(alert.id)}>
                  View History
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant={getSeverityColor(alert.severity)}>
            {alertSeverityLabels[alert.severity]}
          </Badge>
          <Badge variant={getStatusColor(alert.status)}>
            {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Condition:</span>
            <span className="font-medium">{alert.condition}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Value:</span>
            <span className="font-medium">{alert.current_value ?? "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Threshold:</span>
            <span className="font-medium">{alert.threshold}</span>
          </div>
        </div>

        <div className="pt-2 border-t space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span>Triggered:</span>
            <span>
              {formatDistanceToNow(new Date(alert.triggered_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          {alert.resolved_at && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>
                Resolved{" "}
                {formatDistanceToNow(new Date(alert.resolved_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}
          {alert.acknowledged_at && !alert.resolved_at && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>
                Acknowledged{" "}
                {formatDistanceToNow(new Date(alert.acknowledged_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
