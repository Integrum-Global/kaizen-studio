/**
 * TrustStatusBadge Component
 *
 * Displays trust status with color-coded badge and icon
 */

import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrustStatus } from "../../types";
import { cn } from "@/lib/utils";

interface TrustStatusBadgeProps {
  status: TrustStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  [TrustStatus.VALID]: {
    label: "Valid",
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 border-green-200",
    tooltip: "Trust is valid and active",
  },
  [TrustStatus.EXPIRED]: {
    label: "Expired",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    tooltip: "Trust has expired",
  },
  [TrustStatus.REVOKED]: {
    label: "Revoked",
    icon: XCircle,
    className: "bg-red-100 text-red-800 border-red-200",
    tooltip: "Trust has been revoked",
  },
  [TrustStatus.PENDING]: {
    label: "Pending",
    icon: AlertCircle,
    className: "bg-gray-100 text-gray-800 border-gray-200",
    tooltip: "Trust is pending verification",
  },
  [TrustStatus.INVALID]: {
    label: "Invalid",
    icon: XCircle,
    className: "bg-red-100 text-red-800 border-red-200",
    tooltip: "Trust is invalid",
  },
};

const sizeConfig = {
  sm: {
    badge: "text-xs px-2 py-0.5",
    icon: "h-3 w-3",
  },
  md: {
    badge: "text-sm px-2.5 py-0.5",
    icon: "h-4 w-4",
  },
  lg: {
    badge: "text-base px-3 py-1",
    icon: "h-5 w-5",
  },
};

export function TrustStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: TrustStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              config.className,
              sizeStyles.badge,
              "inline-flex items-center gap-1",
              className
            )}
          >
            {showIcon && <Icon className={sizeStyles.icon} />}
            <span>{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
