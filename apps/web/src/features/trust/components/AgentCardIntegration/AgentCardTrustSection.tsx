/**
 * AgentCardTrustSection Component
 *
 * Trust information section for agent cards showing:
 * - Trust status badge
 * - Authority name
 * - Expiration date with countdown
 * - Capability count badge
 * - Link to full trust chain viewer
 *
 * Supports compact mode for embedded use in agent cards
 */

import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { ExternalLink, Shield, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustBadgeWithTooltip } from "./TrustBadgeWithTooltip";
import { useAgentTrustSummary } from "../../hooks";
import { cn } from "@/lib/utils";

interface AgentCardTrustSectionProps {
  agentId: string;
  compact?: boolean;
  onViewChain?: (agentId: string) => void;
  className?: string;
}

export function AgentCardTrustSection({
  agentId,
  compact = false,
  onViewChain,
  className,
}: AgentCardTrustSectionProps) {
  const {
    data: trustSummary,
    isPending,
    error,
  } = useAgentTrustSummary(agentId);

  if (isPending) {
    return (
      <AgentCardTrustSectionSkeleton compact={compact} className={className} />
    );
  }

  if (error || !trustSummary) {
    return (
      <Card className={cn("border-destructive/50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Failed to load trust information</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysUntilExpiration = trustSummary.expiresAt
    ? differenceInDays(new Date(trustSummary.expiresAt), new Date())
    : null;

  const showExpirationWarning =
    daysUntilExpiration !== null &&
    daysUntilExpiration <= 7 &&
    daysUntilExpiration > 0;

  if (compact) {
    return (
      <div className={cn("flex items-center justify-between gap-2", className)}>
        <div className="flex items-center gap-2 min-w-0">
          <TrustBadgeWithTooltip
            status={trustSummary.status}
            authorityName={trustSummary.authorityName}
            authorityType={trustSummary.authorityType}
            expiresAt={trustSummary.expiresAt}
            capabilityCount={trustSummary.capabilityCount}
            constraintCount={trustSummary.constraintCount}
            size="xs"
          />
          {trustSummary.capabilityCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {trustSummary.capabilityCount}{" "}
              {trustSummary.capabilityCount === 1 ? "cap" : "caps"}
            </Badge>
          )}
        </div>
        {onViewChain && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChain(agentId)}
            className="h-6 px-2 text-xs"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("border-muted", className)}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Trust Status</span>
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

        {/* Authority */}
        <div className="text-sm">
          <p className="text-muted-foreground">Authority</p>
          <p className="font-medium">{trustSummary.authorityName}</p>
        </div>

        {/* Expiration */}
        {trustSummary.expiresAt && (
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-muted-foreground">Expires</p>
            </div>
            <p
              className={cn(
                "font-medium",
                showExpirationWarning && "text-yellow-600"
              )}
            >
              {format(new Date(trustSummary.expiresAt), "PPP")}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(trustSummary.expiresAt), {
                addSuffix: true,
              })}
            </p>
            {showExpirationWarning && (
              <div className="flex items-center gap-1 mt-1 text-xs text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Expiring soon</span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {trustSummary.capabilityCount}{" "}
            {trustSummary.capabilityCount === 1 ? "capability" : "capabilities"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {trustSummary.constraintCount}{" "}
            {trustSummary.constraintCount === 1 ? "constraint" : "constraints"}
          </Badge>
        </div>

        {/* Action */}
        {onViewChain && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewChain(agentId)}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Trust Chain
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function AgentCardTrustSectionSkeleton({
  compact,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <div className={cn("flex items-center justify-between gap-2", className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-6 w-6" />
      </div>
    );
  }

  return (
    <Card className={cn("border-muted", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}
