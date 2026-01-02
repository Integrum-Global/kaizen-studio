import { cn } from "@/lib/utils";
import type { HealthStatus } from "../types";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface HealthIndicatorProps {
  status: HealthStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    label: "Healthy",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Degraded",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  down: {
    icon: XCircle,
    label: "Down",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  unhealthy: {
    icon: XCircle,
    label: "Unhealthy",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
};

const sizeConfig = {
  sm: {
    icon: "h-3 w-3",
    text: "text-xs",
    container: "gap-1 px-2 py-0.5",
  },
  md: {
    icon: "h-4 w-4",
    text: "text-sm",
    container: "gap-1.5 px-2.5 py-1",
  },
  lg: {
    icon: "h-5 w-5",
    text: "text-base",
    container: "gap-2 px-3 py-1.5",
  },
};

export function HealthIndicator({
  status,
  size = "md",
  showLabel = false,
  className,
}: HealthIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border",
        config.bgColor,
        config.borderColor,
        sizes.container,
        className
      )}
    >
      <Icon className={cn(sizes.icon, config.color)} />
      {showLabel && (
        <span className={cn("font-medium", config.color, sizes.text)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * Simple dot indicator for compact displays
 */
export function HealthDot({
  status,
  className,
}: {
  status: HealthStatus;
  className?: string;
}) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "h-2 w-2 rounded-full",
        config.color.replace("text-", "bg-"),
        className
      )}
      title={config.label}
    />
  );
}

/**
 * Pulsing dot for real-time status
 */
export function HealthPulse({
  status,
  className,
}: {
  status: HealthStatus;
  className?: string;
}) {
  const config = statusConfig[status];

  return (
    <div className={cn("relative flex h-3 w-3", className)}>
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
          config.color.replace("text-", "bg-")
        )}
      />
      <span
        className={cn(
          "relative inline-flex h-3 w-3 rounded-full",
          config.color.replace("text-", "bg-")
        )}
      />
    </div>
  );
}
