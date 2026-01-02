import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { ExecutionStatus as ExecutionStatusType } from "../types";

interface ExecutionStatusProps {
  status: ExecutionStatusType;
  completedNodes?: number;
  totalNodes?: number;
  duration?: number;
  className?: string;
}

export function ExecutionStatus({
  status,
  completedNodes = 0,
  totalNodes = 0,
  duration,
  className,
}: ExecutionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "idle":
        return {
          variant: "outline" as const,
          icon: Clock,
          label: "Idle",
          color: "text-gray-500",
        };
      case "running":
        return {
          variant: "default" as const,
          icon: Loader2,
          label: "Running",
          color: "text-blue-500",
        };
      case "completed":
        return {
          variant: "secondary" as const,
          icon: CheckCircle2,
          label: "Completed",
          color: "text-green-500",
        };
      case "failed":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          label: "Failed",
          color: "text-red-500",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatDuration = (ms?: number) => {
    if (ms === undefined) return "--:--";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <Badge variant={config.variant} className="gap-1.5">
          <Icon
            className={`h-3.5 w-3.5 ${status === "running" ? "animate-spin" : ""}`}
          />
          {config.label}
        </Badge>

        {totalNodes > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-medium">{completedNodes}</span>
              <span>/</span>
              <span>{totalNodes}</span>
              <span>nodes</span>
            </div>

            <div className="h-1.5 w-32 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {status !== "idle" && (
          <div className="text-sm text-muted-foreground">
            <Clock className="inline h-3.5 w-3.5 mr-1" />
            {formatDuration(duration)}
          </div>
        )}
      </div>
    </div>
  );
}
