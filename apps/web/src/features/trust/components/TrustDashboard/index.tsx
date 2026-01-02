/**
 * TrustDashboard Component
 *
 * Main dashboard for EATP trust management
 */

import { Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrustDashboardStats } from "../../hooks";
import { TrustStatsCard } from "./TrustStatsCard";
import { RecentAuditEvents } from "./RecentAuditEvents";
import type { AuditAnchor } from "../../types";

interface TrustDashboardProps {
  onEstablishTrust?: () => void;
  onViewAuditTrail?: () => void;
  onAuditEventClick?: (event: AuditAnchor) => void;
}

export function TrustDashboard({
  onEstablishTrust,
  onViewAuditTrail,
  onAuditEventClick,
}: TrustDashboardProps) {
  const { data: stats, isPending, error } = useTrustDashboardStats();

  // Calculate verification rate
  const verificationRate = stats
    ? Math.round(
        ((stats.total_verifications_24h - stats.failed_verifications_24h) /
          Math.max(stats.total_verifications_24h, 1)) *
          100
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trust Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage agent trust relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onViewAuditTrail}>
            <FileText className="h-4 w-4 mr-2" />
            View Audit Trail
          </Button>
          <Button onClick={onEstablishTrust}>
            <Shield className="h-4 w-4 mr-2" />
            Establish Trust
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <TrustStatsCard
          variant="trustedAgents"
          count={stats?.active_agents ?? 0}
          isLoading={isPending}
          error={error}
        />
        <TrustStatsCard
          variant="activeDelegations"
          count={stats?.active_delegations ?? 0}
          isLoading={isPending}
          error={error}
        />
        <TrustStatsCard
          variant="auditEvents"
          count={stats?.total_verifications_24h ?? 0}
          isLoading={isPending}
          error={error}
        />
        <TrustStatsCard
          variant="verificationRate"
          count={verificationRate}
          isLoading={isPending}
          error={error}
        />
      </div>

      {/* Recent Audit Events */}
      <RecentAuditEvents
        events={stats?.recent_audits ?? []}
        isLoading={isPending}
        onEventClick={onAuditEventClick}
      />
    </div>
  );
}
