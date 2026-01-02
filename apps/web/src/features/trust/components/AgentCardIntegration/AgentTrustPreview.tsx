/**
 * AgentTrustPreview Component
 *
 * Hover/click preview showing quick view of agent's trust status:
 * - Trust status badge
 * - Top capabilities list (max 5)
 * - Constraints summary
 * - Link to full trust chain viewer
 *
 * Used in agent lists, searches, and hover states
 */

import { ExternalLink, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustBadgeWithTooltip } from "./TrustBadgeWithTooltip";
import { useAgentTrustSummary, useAgentCapabilitySummary } from "../../hooks";
import { CapabilityType } from "../../types";
import { cn } from "@/lib/utils";

interface AgentTrustPreviewProps {
  agentId: string;
  agentName?: string;
  maxCapabilities?: number;
  onViewChain?: (agentId: string) => void;
  className?: string;
}

export function AgentTrustPreview({
  agentId,
  agentName,
  maxCapabilities = 5,
  onViewChain,
  className,
}: AgentTrustPreviewProps) {
  const { data: trustSummary, isPending: isTrustPending } =
    useAgentTrustSummary(agentId);
  const { data: capabilities, isPending: isCapabilitiesPending } =
    useAgentCapabilitySummary(agentId);

  if (isTrustPending || isCapabilitiesPending) {
    return <AgentTrustPreviewSkeleton className={className} />;
  }

  if (!trustSummary) {
    return (
      <Card className={cn("w-80", className)}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            No trust information available
          </p>
        </CardContent>
      </Card>
    );
  }

  const topCapabilities = capabilities?.slice(0, maxCapabilities) || [];

  return (
    <Card className={cn("w-80", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-sm font-medium truncate">
              {agentName || trustSummary.agentName || agentId}
            </CardTitle>
            <CardDescription className="text-xs">
              Agent Trust Status
            </CardDescription>
          </div>
          <TrustBadgeWithTooltip
            status={trustSummary.status}
            authorityName={trustSummary.authorityName}
            authorityType={trustSummary.authorityType}
            expiresAt={trustSummary.expiresAt}
            capabilityCount={trustSummary.capabilityCount}
            constraintCount={trustSummary.constraintCount}
            size="sm"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Authority */}
        <div className="flex items-center gap-2 text-xs">
          <Shield className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Authority:</span>
          <span className="font-medium">{trustSummary.authorityName}</span>
        </div>

        <Separator />

        {/* Capabilities Preview */}
        {topCapabilities.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium">
              Top Capabilities ({trustSummary.capabilityCount})
            </p>
            <ul className="space-y-1.5">
              {topCapabilities.map((capability, index) => (
                <li
                  key={index}
                  className="text-xs flex items-center justify-between gap-2"
                >
                  <span className="truncate">{capability.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {getCapabilityTypeLabel(capability.type)}
                  </span>
                </li>
              ))}
            </ul>
            {trustSummary.capabilityCount > maxCapabilities && (
              <p className="text-xs text-muted-foreground">
                +{trustSummary.capabilityCount - maxCapabilities} more...
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No capabilities</p>
        )}

        {/* Constraints Summary */}
        {trustSummary.constraintCount > 0 && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-xs">
              <Lock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {trustSummary.constraintCount}{" "}
                {trustSummary.constraintCount === 1
                  ? "constraint"
                  : "constraints"}{" "}
                active
              </span>
            </div>
          </>
        )}
      </CardContent>

      {onViewChain && (
        <CardFooter className="pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewChain(agentId)}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Trust Chain
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function getCapabilityTypeLabel(type: CapabilityType): string {
  switch (type) {
    case CapabilityType.ACCESS:
      return "Access";
    case CapabilityType.ACTION:
      return "Action";
    case CapabilityType.DELEGATION:
      return "Delegation";
    default:
      return "Unknown";
  }
}

function AgentTrustPreviewSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("w-80", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-40" />
        </div>

        <Separator />

        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <div className="space-y-1.5">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-full" />
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}
