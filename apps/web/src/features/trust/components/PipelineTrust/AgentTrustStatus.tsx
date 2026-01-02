/**
 * AgentTrustStatus Component
 *
 * Mini widget/badge for pipeline nodes showing trust status
 * Features:
 * - Small badge showing trust status
 * - Click to open trust detail popup
 * - Capability match indicator (shows if agent has required capabilities)
 * - Visual indicator (green check, yellow warning, red X)
 */

import { useState } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle, Shield } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrustStatus } from "../../types";
import { TrustStatusBadge } from "../TrustStatusBadge";
import { cn } from "@/lib/utils";

interface AgentTrustStatusProps {
  agentId: string;
  agentName: string;
  trustStatus: TrustStatus;
  requiredCapabilities?: string[];
  availableCapabilities?: string[];
  constraintViolations?: string[];
  onClick?: () => void;
  onEstablishTrust?: () => void;
  className?: string;
}

const statusConfig = {
  [TrustStatus.VALID]: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    tooltip: "Trust is valid",
  },
  [TrustStatus.EXPIRED]: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500",
    hoverColor: "hover:bg-yellow-600",
    tooltip: "Trust has expired",
  },
  [TrustStatus.REVOKED]: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-500",
    hoverColor: "hover:bg-red-600",
    tooltip: "Trust has been revoked",
  },
  [TrustStatus.PENDING]: {
    icon: AlertCircle,
    color: "text-gray-600",
    bgColor: "bg-gray-400",
    hoverColor: "hover:bg-gray-500",
    tooltip: "Trust is pending",
  },
  [TrustStatus.INVALID]: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-500",
    hoverColor: "hover:bg-red-600",
    tooltip: "Trust is invalid",
  },
};

export function AgentTrustStatus({
  agentId,
  agentName,
  trustStatus,
  requiredCapabilities = [],
  availableCapabilities = [],
  constraintViolations = [],
  onClick,
  onEstablishTrust,
  className,
}: AgentTrustStatusProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const config = statusConfig[trustStatus];
  const Icon = config.icon;

  // Check capability match
  const missingCapabilities = requiredCapabilities.filter(
    (cap) => !availableCapabilities.includes(cap)
  );
  const hasCapabilityMatch = missingCapabilities.length === 0;
  const hasIssues = !hasCapabilityMatch || constraintViolations.length > 0;

  // Badge variant
  const BadgeComponent = (
    <button
      onClick={() => setIsPopoverOpen(true)}
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm transition-all",
        config.bgColor,
        config.hoverColor,
        "cursor-pointer active:scale-95",
        hasIssues && "ring-2 ring-yellow-400 ring-offset-1",
        className
      )}
      aria-label={`Trust status for ${agentName}`}
    >
      <Icon className="h-3.5 w-3.5 text-white" />
    </button>
  );

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>{BadgeComponent}</PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{config.tooltip}</p>
            {hasIssues && (
              <p className="text-xs text-yellow-600">Click for details</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <p className="font-medium text-sm truncate">{agentName}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {agentId}
              </p>
            </div>
            <TrustStatusBadge status={trustStatus} size="sm" />
          </div>

          <Separator />

          {/* Trust Status Description */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Trust Status</p>
            <div className={cn("flex items-start gap-2 text-sm", config.color)}>
              <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>{config.tooltip}</p>
            </div>
          </div>

          {/* Capability Match */}
          {requiredCapabilities.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Capability Match</p>
              {hasCapabilityMatch ? (
                <div className="flex items-start gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>All required capabilities are available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>Missing {missingCapabilities.length} capability(ies)</p>
                  </div>
                  <div className="ml-6 space-y-1">
                    {missingCapabilities.map((cap) => (
                      <Badge key={cap} variant="destructive" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Constraint Violations */}
          {constraintViolations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Constraint Violations</p>
              <div className="space-y-1">
                {constraintViolations.map((violation, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-red-600"
                  >
                    <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <p>{violation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            {onClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClick();
                  setIsPopoverOpen(false);
                }}
                className="flex-1"
              >
                View Details
              </Button>
            )}
            {onEstablishTrust &&
              (trustStatus === TrustStatus.INVALID ||
                trustStatus === TrustStatus.EXPIRED ||
                trustStatus === TrustStatus.REVOKED) && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    onEstablishTrust();
                    setIsPopoverOpen(false);
                  }}
                  className="flex-1"
                >
                  Establish Trust
                </Button>
              )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
