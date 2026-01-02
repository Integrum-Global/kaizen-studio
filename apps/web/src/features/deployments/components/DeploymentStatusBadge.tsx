import { Badge } from "@/components/ui";
import type { DeploymentStatus } from "../types";
import { cn } from "@/lib/utils";

interface DeploymentStatusBadgeProps {
  status: DeploymentStatus;
  className?: string;
}

const statusConfig: Record<
  DeploymentStatus,
  { label: string; className: string; pulse?: boolean }
> = {
  pending: {
    label: "Pending",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
  deploying: {
    label: "Deploying",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    pulse: true,
  },
  active: {
    label: "Active",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  stopped: {
    label: "Stopped",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
};

export function DeploymentStatusBadge({
  status,
  className,
}: DeploymentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge className={cn(config.className, className)}>
      {config.pulse && (
        <span className="relative mr-1.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
        </span>
      )}
      {config.label}
    </Badge>
  );
}
