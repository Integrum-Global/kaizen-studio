/**
 * TrustBadgeWithTooltip Component
 *
 * Reusable trust badge with enhanced tooltip showing:
 * - Trust status explanation
 * - Expiration date
 * - Authority name
 * - Quick stats
 *
 * Used in agent cards and agent lists for quick trust status visibility
 */

import { format, formatDistanceToNow } from "date-fns";
import { TrustStatusBadge } from "../TrustStatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TrustStatus, AuthorityType } from "../../types";

interface TrustBadgeWithTooltipProps {
  status: TrustStatus;
  authorityName?: string;
  authorityType?: AuthorityType;
  expiresAt?: string | null;
  capabilityCount?: number;
  constraintCount?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const sizeMap = {
  xs: "sm" as const,
  sm: "sm" as const,
  md: "md" as const,
};

export function TrustBadgeWithTooltip({
  status,
  authorityName,
  authorityType,
  expiresAt,
  capabilityCount,
  constraintCount,
  size = "sm",
  className,
}: TrustBadgeWithTooltipProps) {
  const badgeSize = sizeMap[size];

  const tooltipContent = (
    <div className="space-y-2 text-xs">
      <div>
        <p className="font-medium">Trust Status</p>
        <p className="text-muted-foreground">
          {status === "valid" && "This agent has valid, active trust"}
          {status === "expired" && "Trust has expired and needs renewal"}
          {status === "revoked" && "Trust has been revoked by authority"}
          {status === "pending" && "Trust is pending verification"}
          {status === "invalid" && "Trust is invalid or corrupted"}
        </p>
      </div>

      {authorityName && (
        <div>
          <p className="font-medium">Authority</p>
          <p className="text-muted-foreground">
            {authorityName} ({authorityType || "unknown"})
          </p>
        </div>
      )}

      {expiresAt && (
        <div>
          <p className="font-medium">Expiration</p>
          <p className="text-muted-foreground">
            {format(new Date(expiresAt), "PPP")}
            <span className="text-xs text-muted-foreground ml-1">
              ({formatDistanceToNow(new Date(expiresAt), { addSuffix: true })})
            </span>
          </p>
        </div>
      )}

      {(capabilityCount !== undefined || constraintCount !== undefined) && (
        <div className="pt-1 border-t border-border">
          {capabilityCount !== undefined && (
            <p className="text-muted-foreground">
              {capabilityCount}{" "}
              {capabilityCount === 1 ? "capability" : "capabilities"}
            </p>
          )}
          {constraintCount !== undefined && (
            <p className="text-muted-foreground">
              {constraintCount}{" "}
              {constraintCount === 1 ? "constraint" : "constraints"}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>
            <TrustStatusBadge
              status={status}
              size={badgeSize}
              showIcon={true}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
