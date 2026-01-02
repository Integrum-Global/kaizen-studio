import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Badge, Skeleton } from "@/components/ui";
import { useIncidents } from "../hooks";
import type { Incident, IncidentSeverity } from "../types";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface IncidentListProps {
  maxItems?: number;
}

const severityConfig = {
  low: {
    label: "Low",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  },
  high: {
    label: "High",
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  critical: {
    label: "Critical",
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
};

export function IncidentList({ maxItems }: IncidentListProps) {
  const { data: incidents, isPending, error } = useIncidents();

  if (isPending) {
    return <IncidentListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Incidents</CardTitle>
          <CardDescription>Service outages and issues</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load incidents</p>
        </CardContent>
      </Card>
    );
  }

  const displayIncidents = maxItems ? incidents?.slice(0, maxItems) : incidents;
  const activeIncidents = incidents?.filter((i) => !i.resolvedAt) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Recent Incidents</CardTitle>
            <CardDescription>
              {activeIncidents.length > 0 ? (
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  {activeIncidents.length} active incident
                  {activeIncidents.length !== 1 ? "s" : ""}
                </span>
              ) : (
                "Service outages and issues"
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!displayIncidents || displayIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
            <p className="text-sm font-medium">No incidents reported</p>
            <p className="text-xs text-muted-foreground mt-1">
              All systems operating normally
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const isActive = !incident.resolvedAt;
  const startedAgo = formatDistanceToNow(new Date(incident.startedAt), {
    addSuffix: true,
  });
  const duration = incident.resolvedAt
    ? formatDistanceToNow(new Date(incident.startedAt), {
        addSuffix: false,
        includeSeconds: true,
      })
    : null;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        isActive ? "border-orange-500/20 bg-orange-500/5" : "bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {isActive ? (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-sm">{incident.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {incident.description}
              </p>
            </div>
            <SeverityBadge severity={incident.severity} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Started {startedAgo}</span>
            </div>

            {incident.affectedUsers && (
              <span>{incident.affectedUsers} users affected</span>
            )}

            {isActive ? (
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-600"
              >
                Active
              </Badge>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium">
                Resolved {duration ? `in ${duration}` : ""}
              </span>
            )}
          </div>

          {incident.resolvedAt && (
            <p className="text-xs text-muted-foreground">
              Resolved at{" "}
              {format(new Date(incident.resolvedAt), "MMM d, yyyy HH:mm")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const config = severityConfig[severity];

  return (
    <Badge variant="outline" className={cn("text-xs", config.color)}>
      {config.label}
    </Badge>
  );
}

function IncidentListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg border space-y-2">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
