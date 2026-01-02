import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, User, Bot } from "lucide-react";
import { useScalingEvents } from "../hooks";
import type { ScalingEvent } from "../types";

interface ScalingEventTimelineProps {
  gatewayId?: string;
  maxItems?: number;
}

const eventIcons: Record<ScalingEvent["type"], React.ReactNode> = {
  scale_up: <TrendingUp className="h-4 w-4 text-green-500" />,
  scale_down: <TrendingDown className="h-4 w-4 text-orange-500" />,
  manual: <User className="h-4 w-4 text-blue-500" />,
};

const eventColors: Record<
  ScalingEvent["type"],
  "default" | "secondary" | "outline"
> = {
  scale_up: "default",
  scale_down: "secondary",
  manual: "outline",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEventType(type: ScalingEvent["type"]): string {
  return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function ScalingEventTimeline({
  gatewayId,
  maxItems = 10,
}: ScalingEventTimelineProps) {
  const { data, isLoading } = useScalingEvents(gatewayId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const events = data?.records.slice(0, maxItems) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scaling Events</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No scaling events recorded
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    {eventIcons[event.type]}
                  </div>

                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={eventColors[event.type]}>
                        {formatEventType(event.type)}
                      </Badge>
                      <span className="text-sm font-medium">
                        {event.previousReplicas} → {event.newReplicas} replicas
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {event.reason}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {event.triggeredBy === "auto-scaler" ? (
                        <Bot className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      <span>{event.triggeredBy}</span>
                      <span>•</span>
                      <span>{formatDate(event.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
