import { Badge } from "@/components/ui/badge";
import type { HealthStatus } from "../types";

interface StatusIndicatorProps {
  status: HealthStatus;
  showText?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  showText = true,
  className = "",
}: StatusIndicatorProps) {
  const statusConfig: Record<
    HealthStatus,
    {
      variant: "default" | "destructive";
      text: string;
      ariaLabel: string;
      className: string;
    }
  > = {
    healthy: {
      variant: "default" as const,
      text: "Healthy",
      ariaLabel: "System is healthy and operational",
      className: "bg-green-500 hover:bg-green-600 text-white",
    },
    degraded: {
      variant: "default" as const,
      text: "Degraded",
      ariaLabel: "System is degraded with partial functionality",
      className: "bg-yellow-500 hover:bg-yellow-600 text-white",
    },
    unhealthy: {
      variant: "destructive" as const,
      text: "Unhealthy",
      ariaLabel: "System is unhealthy or down",
      className: "bg-red-500 hover:bg-red-600 text-white",
    },
    down: {
      variant: "destructive" as const,
      text: "Down",
      ariaLabel: "System is down",
      className: "bg-red-500 hover:bg-red-600 text-white",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className}`}
      aria-label={config.ariaLabel}
      data-status={status}
    >
      {showText && config.text}
    </Badge>
  );
}
