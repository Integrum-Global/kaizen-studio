/**
 * CascadeRevocationModal Component
 *
 * Shows the full impact of revoking an agent's trust with cascade.
 * EATP requires cascade revocation: when an agent is revoked, ALL downstream
 * agents that received delegated trust must also be revoked.
 *
 * Usage:
 *   <CascadeRevocationModal
 *     open={isOpen}
 *     onOpenChange={setIsOpen}
 *     targetAgentId="agent-123"
 *     onConfirm={handleRevoke}
 *   />
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Users,
  Activity,
  UserX,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TrustStatus,
  type RevocationImpactPreview,
  type AffectedAgent,
} from "../../types";

interface CascadeRevocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAgentId: string;
  targetAgentName?: string;
  onConfirm: (reason: string) => Promise<void>;
  loadImpact: (agentId: string) => Promise<RevocationImpactPreview>;
}

// Status colors for affected agents - keyed by enum values
const STATUS_COLORS: Record<TrustStatus, string> = {
  [TrustStatus.VALID]:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [TrustStatus.EXPIRED]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  [TrustStatus.REVOKED]:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  [TrustStatus.PENDING]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [TrustStatus.INVALID]:
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

interface AffectedAgentItemProps {
  agent: AffectedAgent;
  depth: number;
}

function AffectedAgentItem({ agent, depth }: AffectedAgentItemProps) {
  // Get the color class for the status, with fallback for unknown statuses
  const statusColorClass =
    STATUS_COLORS[agent.status] || STATUS_COLORS[TrustStatus.INVALID];

  return (
    <div
      className={cn(
        "border-l-2 pl-4 py-2",
        depth === 1 ? "border-red-300" : "border-gray-200"
      )}
      style={{ marginLeft: `${(depth - 1) * 16}px` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserX className="h-4 w-4 text-red-500" />
          <span className="font-medium text-sm">
            {agent.agentName || agent.agentId}
          </span>
          <Badge className={cn("text-xs", statusColorClass)}>
            {agent.status}
          </Badge>
        </div>
        {agent.activeTasks > 0 && (
          <Badge variant="destructive" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            {agent.activeTasks} active
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Delegation depth: {agent.delegationDepth}
      </p>
    </div>
  );
}

function ImpactSkeleton() {
  return (
    <div className="space-y-3 py-4">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function CascadeRevocationModal({
  open,
  onOpenChange,
  targetAgentId,
  targetAgentName,
  onConfirm,
  loadImpact,
}: CascadeRevocationModalProps) {
  const [impact, setImpact] = useState<RevocationImpactPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  const CONFIRM_PHRASE = "REVOKE";

  // Reset state when modal opens/closes
  const resetState = useCallback(() => {
    setImpact(null);
    setReason("");
    setConfirmText("");
    setError(null);
  }, []);

  useEffect(() => {
    if (open && targetAgentId) {
      setLoading(true);
      setError(null);
      loadImpact(targetAgentId)
        .then(setImpact)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      resetState();
    }
  }, [open, targetAgentId, loadImpact, resetState]);

  const handleConfirm = async () => {
    if (confirmText !== CONFIRM_PHRASE || !reason.trim()) return;

    setIsRevoking(true);
    try {
      await onConfirm(reason);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revocation failed");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleClose = () => {
    if (!isRevoking) {
      onOpenChange(false);
    }
  };

  const canConfirm =
    confirmText === CONFIRM_PHRASE && reason.trim().length > 0 && !isRevoking;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cascade Revocation
          </DialogTitle>
          <DialogDescription>
            Revoking trust for{" "}
            <strong>{targetAgentName || targetAgentId}</strong> will cascade to
            all downstream agents. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {loading && <ImpactSkeleton />}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {impact && !loading && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Affected Agents</span>
                </div>
                <p className="text-2xl font-bold text-destructive">
                  {impact.totalAffected}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Active Workloads</span>
                </div>
                <p className="text-2xl font-bold">
                  {impact.hasActiveWorkloads ? "Yes" : "None"}
                </p>
              </div>
            </div>

            {/* Warnings */}
            {impact.warnings.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {impact.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Affected agents list */}
            {impact.affectedAgents.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Agents that will be revoked:
                </Label>
                <ScrollArea className="h-48 border rounded-md p-2">
                  {impact.affectedAgents.map((agent) => (
                    <AffectedAgentItem
                      key={agent.agentId}
                      agent={agent}
                      depth={agent.delegationDepth}
                    />
                  ))}
                </ScrollArea>
              </div>
            )}

            {/* Reason input */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for revocation *</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Employee termination, Security incident..."
              />
            </div>

            {/* Confirmation input */}
            <div className="space-y-2">
              <Label htmlFor="confirm">
                Type{" "}
                <strong className="text-destructive">{CONFIRM_PHRASE}</strong>{" "}
                to confirm
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder={CONFIRM_PHRASE}
                className="font-mono"
                autoComplete="off"
              />
              {confirmText && confirmText !== CONFIRM_PHRASE && (
                <p className="text-xs text-red-500">
                  Please type {CONFIRM_PHRASE} exactly to confirm
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isRevoking}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isRevoking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Revoking...
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Revoke {impact?.totalAffected || 0} Agents
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CascadeRevocationModal;
