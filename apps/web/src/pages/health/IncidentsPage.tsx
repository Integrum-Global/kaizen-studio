import { IncidentTimeline } from "@/features/health";
import { useIncidents } from "@/features/health/hooks";
import { Skeleton } from "@/components/ui/skeleton";

export function IncidentsPage() {
  const { data: incidents = [], isPending } = useIncidents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Incident History</h1>
        <p className="text-muted-foreground">
          View historical incidents and their resolutions
        </p>
      </div>

      {isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <IncidentTimeline incidents={incidents} />
      )}
    </div>
  );
}
