import { useState } from "react";
import { AlertList, AlertDialog } from "@/features/alerts";
import { useNavigate } from "react-router-dom";

export function AlertsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreateRule = () => {
    setIsCreateDialogOpen(true);
  };

  const handleViewHistory = (alertId: string) => {
    navigate(`/alerts/history/${alertId}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage system alerts and notifications
          </p>
        </div>
      </div>

      <AlertList
        onCreateRule={handleCreateRule}
        onViewHistory={handleViewHistory}
      />

      <AlertDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
