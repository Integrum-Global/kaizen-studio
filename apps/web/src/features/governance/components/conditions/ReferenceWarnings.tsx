/**
 * ReferenceWarnings - Shows warnings for orphaned or changed resource references
 * in policy conditions
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Link2Off, RefreshCw } from "lucide-react";
import type { ResourceReferenceStatus } from "../../types";

interface ReferenceWarningsProps {
  references: ResourceReferenceStatus[];
  onDismiss?: () => void;
  onRefresh?: () => void;
  className?: string;
}

/**
 * Get a human-readable label for a reference type
 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    agent: "Work Unit",
    pipeline: "Process",
    deployment: "Deployment",
    gateway: "Gateway",
    team: "Team",
    user: "User",
    role: "Role",
    resource: "Resource",
  };
  return labels[type] || type;
}

/**
 * Get status-specific styling and icon
 */
function getStatusInfo(status: ResourceReferenceStatus["status"]) {
  switch (status) {
    case "orphaned":
      return {
        icon: Link2Off,
        label: "Deleted",
        className: "text-destructive",
      };
    case "changed":
      return {
        icon: RefreshCw,
        label: "Modified",
        className: "text-yellow-600 dark:text-yellow-400",
      };
    default:
      return {
        icon: null,
        label: "Valid",
        className: "text-green-600",
      };
  }
}

export function ReferenceWarnings({
  references,
  onDismiss,
  onRefresh,
  className,
}: ReferenceWarningsProps) {
  // Filter to only show problematic references
  const problemReferences = references.filter(
    (ref) => ref.status === "orphaned" || ref.status === "changed"
  );

  if (problemReferences.length === 0) {
    return null;
  }

  const orphanedCount = problemReferences.filter(
    (r) => r.status === "orphaned"
  ).length;
  const changedCount = problemReferences.filter(
    (r) => r.status === "changed"
  ).length;

  // Determine severity - orphaned is more severe
  const hasOrphaned = orphanedCount > 0;
  const variant = hasOrphaned ? "destructive" : "warning";

  // Build summary message
  const messages: string[] = [];
  if (orphanedCount > 0) {
    messages.push(
      `${orphanedCount} deleted resource${orphanedCount > 1 ? "s" : ""}`
    );
  }
  if (changedCount > 0) {
    messages.push(
      `${changedCount} modified resource${changedCount > 1 ? "s" : ""}`
    );
  }
  const summary = messages.join(" and ");

  return (
    <Alert variant={variant} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Resource Reference Issues</span>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-6 px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
        </div>
      </AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          This policy references {summary}. The policy may not work as expected.
        </p>
        <ul className="space-y-1 text-sm">
          {problemReferences.map((ref) => {
            const statusInfo = getStatusInfo(ref.status);
            const StatusIcon = statusInfo.icon;
            return (
              <li key={`${ref.type}-${ref.id}`} className="flex items-center gap-2">
                {StatusIcon && (
                  <StatusIcon className={`h-3 w-3 ${statusInfo.className}`} />
                )}
                <span className="font-medium">{getTypeLabel(ref.type)}:</span>
                <span className="font-mono text-xs">{ref.name || ref.id}</span>
                <span className={`text-xs ${statusInfo.className}`}>
                  ({statusInfo.label})
                </span>
              </li>
            );
          })}
        </ul>
        {hasOrphaned && (
          <p className="mt-2 text-xs">
            Consider updating or removing conditions that reference deleted
            resources.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default ReferenceWarnings;
