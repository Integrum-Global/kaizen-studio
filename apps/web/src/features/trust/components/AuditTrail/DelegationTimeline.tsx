/**
 * DelegationTimeline Component
 *
 * Vertical timeline showing delegation and action events
 */

import { useMemo, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Shield,
  Activity,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DelegationRecord, AuditAnchor, ActionResult } from "../../types";

type TimelineEventType = "delegation" | "action" | "completion" | "failure";

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  description: string;
  result?: ActionResult;
  metadata?: Record<string, any>;
  agentId?: string;
}

interface DelegationTimelineProps {
  delegations: DelegationRecord[];
  auditEvents: AuditAnchor[];
  onEventClick?: (event: TimelineEvent) => void;
  onAgentClick?: (agentId: string) => void;
}

const eventConfig: Record<
  TimelineEventType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }
> = {
  delegation: {
    icon: ArrowRight,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  action: {
    icon: Activity,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  completion: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  failure: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
};

const resultIcons: Record<
  ActionResult,
  React.ComponentType<{ className?: string }>
> = {
  success: CheckCircle,
  failure: XCircle,
  denied: AlertTriangle,
  partial: Clock,
};

export function DelegationTimeline({
  delegations,
  auditEvents,
  onEventClick,
  onAgentClick,
}: DelegationTimelineProps) {
  const [filter, setFilter] = useState<TimelineEventType | "all">("all");
  const [resultFilter, setResultFilter] = useState<ActionResult | "all">("all");

  // Convert delegations and audit events to timeline events
  const allEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add delegation events
    delegations.forEach((delegation) => {
      events.push({
        id: delegation.id,
        type: "delegation",
        timestamp: delegation.delegated_at,
        title: "Trust Delegated",
        description: `${delegation.delegator_id.slice(0, 8)}... delegated ${
          delegation.capabilities_delegated.length
        } capability(ies) to ${delegation.delegatee_id.slice(0, 8)}...`,
        metadata: {
          delegatorId: delegation.delegator_id,
          delegateeId: delegation.delegatee_id,
          capabilities: delegation.capabilities_delegated,
          constraints: delegation.constraint_subset,
          expiresAt: delegation.expires_at,
        },
        agentId: delegation.delegatee_id,
      });
    });

    // Add audit events
    auditEvents.forEach((audit) => {
      const eventType: TimelineEventType =
        audit.result === "success"
          ? "completion"
          : audit.result === "failure" || audit.result === "denied"
            ? "failure"
            : "action";

      events.push({
        id: audit.id,
        type: eventType,
        timestamp: audit.timestamp,
        title: audit.action,
        description: audit.resource
          ? `Action on ${audit.resource}`
          : "Agent action executed",
        result: audit.result,
        metadata: {
          trustChainHash: audit.trust_chain_hash,
          context: audit.context,
          parentAnchorId: audit.parent_anchor_id,
        },
        agentId: audit.agent_id,
      });
    });

    // Sort by timestamp descending (newest first)
    return events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [delegations, auditEvents]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      if (filter !== "all" && event.type !== filter) return false;
      if (resultFilter !== "all" && event.result !== resultFilter) return false;
      return true;
    });
  }, [allEvents, filter, resultFilter]);

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No timeline events</h3>
        <p className="text-muted-foreground">
          Delegation and action events will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as TimelineEventType | "all")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="delegation">Delegations</SelectItem>
              <SelectItem value="action">Actions</SelectItem>
              <SelectItem value="completion">Completions</SelectItem>
              <SelectItem value="failure">Failures</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select
          value={resultFilter}
          onValueChange={(v) => setResultFilter(v as ActionResult | "all")}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failure">Failure</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground ml-auto">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const config = eventConfig[event.type];
            const Icon = config.icon;
            const ResultIcon = event.result
              ? resultIcons[event.result]
              : undefined;

            return (
              <div
                key={event.id}
                className={cn(
                  "relative flex gap-4 pl-10",
                  onEventClick &&
                    "cursor-pointer hover:bg-muted/50 -ml-2 pl-12 py-2 rounded-lg"
                )}
                onClick={() => onEventClick?.(event)}
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute left-2 flex h-8 w-8 items-center justify-center rounded-full",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{event.title}</span>
                    {event.result && ResultIcon && (
                      <Badge
                        variant={
                          event.result === "success"
                            ? "default"
                            : event.result === "failure" ||
                                event.result === "denied"
                              ? "destructive"
                              : "secondary"
                        }
                        className="gap-1"
                      >
                        <ResultIcon className="h-3 w-3" />
                        {event.result}
                      </Badge>
                    )}
                    {event.type === "delegation" && (
                      <Badge variant="outline">Delegation</Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {event.agentId && (
                      <span
                        className={cn(
                          onAgentClick &&
                            "hover:underline cursor-pointer hover:text-primary"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAgentClick?.(event.agentId!);
                        }}
                      >
                        Agent: {event.agentId.slice(0, 8)}...
                      </span>
                    )}
                    <span title={format(new Date(event.timestamp), "PPpp")}>
                      {formatDistanceToNow(new Date(event.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
