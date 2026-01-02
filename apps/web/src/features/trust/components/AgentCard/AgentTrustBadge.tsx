/**
 * AgentTrustBadge Component
 *
 * Compact trust status badge for agent lists
 * Shows trust status with icon, tooltip with details, and click to open trust detail
 */

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TrustStatusBadge } from "../TrustStatusBadge";
import { AgentTrustSummary } from "../../types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface AgentTrustBadgeProps {
  agentId: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  showPopover?: boolean;
  onViewDetail?: (agentId: string) => void;
  className?: string;
}

async function fetchAgentTrustSummary(
  agentId: string
): Promise<AgentTrustSummary> {
  const response = await fetch(
    `/api/v1/trust/agents/${agentId}/trust-summary`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch agent trust summary");
  }
  return response.json();
}

function AgentTrustBadgeSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "h-5 w-16",
    md: "h-6 w-20",
    lg: "h-7 w-24",
  };

  return <Skeleton className={sizeMap[size]} />;
}

function TrustDetailPopover({
  summary,
  onViewDetail,
}: {
  summary: AgentTrustSummary;
  onViewDetail?: (agentId: string) => void;
}) {
  return (
    <div className="space-y-3 min-w-[280px]">
      <div>
        <p className="text-sm font-medium">
          {summary.agentName || summary.agentId}
        </p>
        <p className="text-xs text-muted-foreground">{summary.agentId}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Authority:</span>
          <p className="font-medium">{summary.authorityName}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Type:</span>
          <p className="font-medium capitalize">{summary.authorityType}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Capabilities:</span>
          <p className="font-medium">{summary.capabilityCount}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Constraints:</span>
          <p className="font-medium">{summary.constraintCount}</p>
        </div>
      </div>

      {summary.expiresAt && (
        <div className="text-xs">
          <span className="text-muted-foreground">Expires:</span>
          <p
            className={cn(
              "font-medium",
              summary.isExpiringSoon && "text-yellow-600"
            )}
          >
            {formatDistanceToNow(new Date(summary.expiresAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      )}

      {summary.verifiedAt && (
        <div className="text-xs">
          <span className="text-muted-foreground">Last verified:</span>
          <p className="font-medium">
            {formatDistanceToNow(new Date(summary.verifiedAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      )}

      {onViewDetail && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetail(summary.agentId)}
          className="w-full"
        >
          View Trust Details
        </Button>
      )}
    </div>
  );
}

export function AgentTrustBadge({
  agentId,
  size = "md",
  showTooltip = true,
  showPopover = false,
  onViewDetail,
  className,
}: AgentTrustBadgeProps) {
  const { data: summary, isPending, error } = useQuery({
    queryKey: ["agent-trust-summary", agentId],
    queryFn: () => fetchAgentTrustSummary(agentId),
  });

  if (isPending) {
    return <AgentTrustBadgeSkeleton size={size} />;
  }

  if (error || !summary) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn("border-destructive text-destructive", className)}
            >
              Error
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Failed to load trust status</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const badge = (
    <TrustStatusBadge
      status={summary.status}
      size={size}
      className={cn(
        showPopover && "cursor-pointer hover:opacity-80",
        className
      )}
    />
  );

  // Show popover with detailed trust information
  if (showPopover) {
    return (
      <Popover>
        <PopoverTrigger asChild>{badge}</PopoverTrigger>
        <PopoverContent align="start" className="w-auto">
          <TrustDetailPopover summary={summary} onViewDetail={onViewDetail} />
        </PopoverContent>
      </Popover>
    );
  }

  // Show simple tooltip with basic trust information
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            asChild
            onClick={onViewDetail ? () => onViewDetail(agentId) : undefined}
          >
            <div className={cn(onViewDetail && "cursor-pointer")}>{badge}</div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <p>
                <span className="font-medium">Authority:</span>{" "}
                {summary.authorityName}
              </p>
              <p>
                <span className="font-medium">Capabilities:</span>{" "}
                {summary.capabilityCount}
              </p>
              {summary.expiresAt && (
                <p>
                  <span className="font-medium">Expires:</span>{" "}
                  {formatDistanceToNow(new Date(summary.expiresAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
              {onViewDetail && (
                <p className="text-muted-foreground italic">Click for details</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // No tooltip or popover
  return <div onClick={onViewDetail ? () => onViewDetail(agentId) : undefined}>{badge}</div>;
}
