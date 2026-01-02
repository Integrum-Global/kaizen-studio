/**
 * DelegationCard Component
 *
 * Displays a delegation record with delegator → delegatee flow
 */

import { format, formatDistanceToNow } from "date-fns";
import { ArrowRight, Clock, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type DelegationRecord } from "../../types";

interface DelegationCardProps {
  delegation: DelegationRecord;
}

export function DelegationCard({ delegation }: DelegationCardProps) {
  const isExpired = delegation.expires_at
    ? new Date(delegation.expires_at) < new Date()
    : false;

  const isActive = !isExpired;

  const timeUntilExpiry = delegation.expires_at
    ? formatDistanceToNow(new Date(delegation.expires_at), { addSuffix: true })
    : null;

  return (
    <Card className={isExpired ? "opacity-60" : ""}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        <div className="p-2 rounded-lg bg-muted">
          <UserCheck className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base">Delegation</CardTitle>
          <p className="text-xs text-muted-foreground font-mono">
            {delegation.task_id}
          </p>
        </div>
        <Badge
          className={
            isActive
              ? "bg-green-100 text-green-800 border-green-200"
              : "bg-gray-100 text-gray-800 border-gray-200"
          }
        >
          {isActive ? "Active" : "Expired"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Delegation Flow */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground">Delegator</label>
            <p className="text-sm font-mono truncate">
              {delegation.delegator_id}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground">Delegatee</label>
            <p className="text-sm font-mono truncate">
              {delegation.delegatee_id}
            </p>
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Capabilities Delegated
          </label>
          <div className="flex flex-wrap gap-1 mt-1">
            {delegation.capabilities_delegated.map((capability, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {capability}
              </Badge>
            ))}
          </div>
        </div>

        {/* Constraints */}
        {delegation.constraint_subset.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Additional Constraints
            </label>
            <div className="flex flex-wrap gap-1 mt-1">
              {delegation.constraint_subset.map((constraint, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs bg-orange-50 text-orange-800 border-orange-200"
                >
                  {constraint}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-muted-foreground">Delegated</label>
            <p>{format(new Date(delegation.delegated_at), "PP")}</p>
          </div>
          {delegation.expires_at && (
            <div>
              <label className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expires
              </label>
              <p className={isExpired ? "text-red-600 font-medium" : ""}>
                {timeUntilExpiry}
              </p>
            </div>
          )}
        </div>

        {/* Parent Delegation */}
        {delegation.parent_delegation_id && (
          <div className="text-xs">
            <label className="text-muted-foreground">Parent Delegation</label>
            <p className="font-mono text-xs bg-muted px-2 py-1 rounded mt-1">
              {delegation.parent_delegation_id}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
