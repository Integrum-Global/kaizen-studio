/**
 * AgentTrustWidget Component
 *
 * Mini trust badge for pipeline nodes - shows trust status with tooltip
 * Click to expand to full trust view
 */

import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrustStatus } from "../../types";
import { cn } from "@/lib/utils";

interface AgentTrustWidgetProps {
  agentId: string;
  agentName: string;
  trustStatus: TrustStatus;
  capabilityMatch?: boolean; // Whether required capabilities are met
  onClick?: () => void;
  className?: string;
}

const statusConfig = {
  [TrustStatus.VALID]: {
    icon: CheckCircle,
    className: "bg-green-500 hover:bg-green-600",
    tooltip: "Trust is valid",
  },
  [TrustStatus.EXPIRED]: {
    icon: Clock,
    className: "bg-yellow-500 hover:bg-yellow-600",
    tooltip: "Trust has expired",
  },
  [TrustStatus.REVOKED]: {
    icon: XCircle,
    className: "bg-red-500 hover:bg-red-600",
    tooltip: "Trust has been revoked",
  },
  [TrustStatus.PENDING]: {
    icon: AlertCircle,
    className: "bg-gray-400 hover:bg-gray-500",
    tooltip: "Trust is pending",
  },
  [TrustStatus.INVALID]: {
    icon: XCircle,
    className: "bg-red-500 hover:bg-red-600",
    tooltip: "Trust is invalid",
  },
};

export function AgentTrustWidget({
  agentName,
  trustStatus,
  capabilityMatch = true,
  onClick,
  className,
}: AgentTrustWidgetProps) {
  const config = statusConfig[trustStatus];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm transition-all",
              config.className,
              onClick && "cursor-pointer active:scale-95",
              !onClick && "cursor-default",
              className
            )}
            aria-label={`Trust status for ${agentName}`}
          >
            <Icon className="h-3.5 w-3.5 text-white" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{agentName}</p>
            <p className="text-sm text-muted-foreground">{config.tooltip}</p>
            {!capabilityMatch && trustStatus === TrustStatus.VALID && (
              <p className="text-sm text-yellow-600">
                Required capabilities not met
              </p>
            )}
            {onClick && (
              <p className="text-xs text-muted-foreground">
                Click to view details
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
