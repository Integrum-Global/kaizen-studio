import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Incident } from "../types";

interface IncidentTimelineProps {
  incidents: Incident[];
}

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  const severityColors: Record<string, string> = {
    critical: "bg-red-500 hover:bg-red-600",
    high: "bg-orange-500 hover:bg-orange-600",
    medium: "bg-yellow-500 hover:bg-yellow-600",
    low: "bg-blue-500 hover:bg-blue-600",
  };

  const statusColors: Record<string, string> = {
    open: "bg-red-500 hover:bg-red-600",
    investigating: "bg-yellow-500 hover:bg-yellow-600",
    resolved: "bg-green-500 hover:bg-green-600",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Incident Timeline</h3>

      {incidents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No incidents reported
          </CardContent>
        </Card>
      ) : (
        <div className="timeline space-y-4">
          {incidents.map((incident) => (
            <Card
              key={incident.id}
              className="border rounded-lg incident-item"
              data-testid={`incident-${incident.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-base">{incident.title}</h4>
                  <div className="flex gap-2">
                    <Badge
                      className={`${severityColors[incident.severity]} text-white`}
                    >
                      {incident.severity}
                    </Badge>
                    {incident.status && (
                      <Badge className={`${statusColors[incident.status]} text-white`}>
                        {incident.status}
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {incident.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Started:</span>{" "}
                    <time>{new Date(incident.startedAt).toLocaleString()}</time>
                  </div>

                  {incident.resolvedAt && (
                    <div>
                      <span className="font-medium">Resolved:</span>{" "}
                      <time>{new Date(incident.resolvedAt).toLocaleString()}</time>
                    </div>
                  )}

                  {incident.duration && (
                    <div>
                      <span className="font-medium">Duration:</span>{" "}
                      {incident.duration} minutes
                    </div>
                  )}
                </div>

                {incident.affectedServices.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-xs font-medium">Affected Services:</span>
                    {incident.affectedServices.map((service) => (
                      <Badge key={service} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
