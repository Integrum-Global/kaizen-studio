/**
 * RecentAuditEvents Component
 *
 * Displays a list of recent audit events
 */

import { formatDistanceToNow } from "date-fns";
import { Activity, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionResult, type AuditAnchor } from "../../types";
import { cn } from "@/lib/utils";

interface RecentAuditEventsProps {
  events: AuditAnchor[];
  isLoading?: boolean;
  onEventClick?: (event: AuditAnchor) => void;
}

const resultConfig = {
  [ActionResult.SUCCESS]: {
    icon: CheckCircle,
    className: "text-green-600",
    badgeClassName: "bg-green-100 text-green-800 border-green-200",
  },
  [ActionResult.FAILURE]: {
    icon: XCircle,
    className: "text-red-600",
    badgeClassName: "bg-red-100 text-red-800 border-red-200",
  },
  [ActionResult.DENIED]: {
    icon: AlertCircle,
    className: "text-orange-600",
    badgeClassName: "bg-orange-100 text-orange-800 border-orange-200",
  },
  [ActionResult.PARTIAL]: {
    icon: Activity,
    className: "text-yellow-600",
    badgeClassName: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
};

function AuditEventSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  );
}

function AuditEventCard({
  event,
  onClick,
}: {
  event: AuditAnchor;
  onClick?: (event: AuditAnchor) => void;
}) {
  const config = resultConfig[event.result];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        onClick && "cursor-pointer hover:bg-accent"
      )}
      onClick={() => onClick?.(event)}
    >
      <div className={cn("p-2 rounded-full bg-muted", config.className)}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{event.action}</p>
            <p className="text-xs text-muted-foreground truncate">
              Agent: {event.agent_id}
            </p>
            {event.resource && (
              <p className="text-xs text-muted-foreground truncate">
                Resource: {event.resource}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className={config.badgeClassName}>{event.result}</Badge>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(event.timestamp), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecentAuditEvents({
  events,
  isLoading,
  onEventClick,
}: RecentAuditEventsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <AuditEventSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No audit events recorded yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Audit Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.map((event) => (
          <AuditEventCard key={event.id} event={event} onClick={onEventClick} />
        ))}
      </CardContent>
    </Card>
  );
}
