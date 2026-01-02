import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  SkipForward,
} from "lucide-react";
import type { NodeStatus } from "../types";
import { cn } from "@/lib/utils";

interface NodeStatusOverlayProps {
  status: NodeStatus;
  className?: string;
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-300 dark:border-gray-600",
    label: "Pending",
  },
  running: {
    icon: Loader2,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    borderColor: "border-blue-400 dark:border-blue-600",
    label: "Running",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900",
    borderColor: "border-green-400 dark:border-green-600",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900",
    borderColor: "border-red-400 dark:border-red-600",
    label: "Failed",
  },
  skipped: {
    icon: SkipForward,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900",
    borderColor: "border-orange-400 dark:border-orange-600",
    label: "Skipped",
  },
};

export function NodeStatusOverlay({
  status,
  className,
}: NodeStatusOverlayProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "absolute top-0 right-0 m-2 flex items-center gap-1.5 px-2 py-1 rounded-md border shadow-sm",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5", config.color, {
          "animate-spin": status === "running",
        })}
      />
      <span className={cn("text-xs font-medium", config.color)}>
        {config.label}
      </span>
    </div>
  );
}
