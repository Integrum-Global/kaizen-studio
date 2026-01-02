/**
 * AgentTrustSummary Component
 *
 * Inline trust summary for agent detail views
 * Shows trust status, capability count, constraint count, expiration info,
 * and quick actions (view chain, delegate)
 */

import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Clock,
  AlertCircle,
  ExternalLink,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustStatusBadge } from "../TrustStatusBadge";
import { AgentTrustSummary as AgentTrustSummaryType, TrustStatus } from "../../types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInDays } from "date-fns";

interface AgentTrustSummaryProps {
  agentId: string;
  onViewChain?: (agentId: string) => void;
  onDelegate?: (agentId: string) => void;
  className?: string;
}

async function fetchAgentTrustSummary(
  agentId: string
): Promise<AgentTrustSummaryType> {
  const response = await fetch(
    `/api/v1/trust/agents/${agentId}/trust-summary`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch agent trust summary");
  }
  return response.json();
}

function AgentTrustSummarySkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function AgentTrustSummary({
  agentId,
  onViewChain,
  onDelegate,
  className,
}: AgentTrustSummaryProps) {
  const { data: summary, isPending, error } = useQuery({
    queryKey: ["agent-trust-summary", agentId],
    queryFn: () => fetchAgentTrustSummary(agentId),
  });

  if (isPending) {
    return <AgentTrustSummarySkeleton />;
  }

  if (error || !summary) {
    return (
      <div
        className={cn(
          "p-4 border border-destructive rounded-lg bg-destructive/5",
          className
        )}
      >
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">
            Failed to load trust information
          </p>
        </div>
      </div>
    );
  }

  const canDelegate = summary.status === TrustStatus.VALID;
  const daysUntilExpiration = summary.expiresAt
    ? differenceInDays(new Date(summary.expiresAt), new Date())
    : null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Trust Status Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Trust Status</h3>
        </div>
        <TrustStatusBadge status={summary.status} size="md" />
      </div>

      {/* Authority Info */}
      <div className="text-sm text-muted-foreground">
        Established by{" "}
        <span className="font-medium text-foreground">
          {summary.authorityName}
        </span>{" "}
        ({summary.authorityType})
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Capability Count */}
        <div className="flex flex-col p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Capabilities</span>
          </div>
          <p className="text-2xl font-bold">{summary.capabilityCount}</p>
        </div>

        {/* Constraint Count */}
        <div className="flex flex-col p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Constraints</span>
          </div>
          <p className="text-2xl font-bold">{summary.constraintCount}</p>
        </div>

        {/* Expiration Info */}
        <div className="flex flex-col p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Expiration</span>
          </div>
          {summary.expiresAt ? (
            <div>
              <p
                className={cn(
                  "text-sm font-bold",
                  summary.isExpiringSoon && "text-yellow-600"
                )}
              >
                {daysUntilExpiration !== null &&
                  (daysUntilExpiration > 0
                    ? `${daysUntilExpiration}d`
                    : "Expired")}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(summary.expiresAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          ) : (
            <p className="text-sm font-bold">Never</p>
          )}
        </div>
      </div>

      {/* Expiration Warning */}
      {summary.isExpiringSoon && daysUntilExpiration !== null && daysUntilExpiration > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">
            Trust expires in{" "}
            <span className="font-medium">{daysUntilExpiration} days</span>.
            Consider renewing soon.
          </p>
        </div>
      )}

      {/* Verification Info */}
      {summary.verifiedAt && (
        <div className="text-xs text-muted-foreground">
          Last verified{" "}
          {formatDistanceToNow(new Date(summary.verifiedAt), {
            addSuffix: true,
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 pt-2">
        {onViewChain && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewChain(agentId)}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Trust Chain
          </Button>
        )}
        {onDelegate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelegate(agentId)}
            disabled={!canDelegate}
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Delegate Trust
          </Button>
        )}
      </div>

      {/* Delegate Disabled Message */}
      {onDelegate && !canDelegate && (
        <p className="text-xs text-muted-foreground text-center">
          Delegation requires valid trust status
        </p>
      )}
    </div>
  );
}
