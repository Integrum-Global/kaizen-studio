import { useParams, useNavigate } from "react-router-dom";
import { AlertHistory } from "@/features/alerts";
import { Button } from "@/components/ui";
import { ArrowLeft } from "lucide-react";

export function AlertHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Alert ID not provided</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alert History</h1>
          <p className="text-muted-foreground">
            View alert event history and timeline
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/alerts")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Alerts
        </Button>
      </div>

      <AlertHistory alertId={id} />
    </div>
  );
}
