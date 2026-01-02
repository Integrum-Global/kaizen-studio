import { useState } from "react";
import { Button } from "@/components/ui";
import { Plus } from "lucide-react";
import {
  DeploymentList,
  DeploymentDialog,
} from "@/features/deployments/components";

export function DeploymentsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deployments</h1>
          <p className="text-muted-foreground mt-1">
            Deploy and manage your pipelines across different environments
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Deployment
        </Button>
      </div>

      {/* Deployment List */}
      <DeploymentList />

      {/* Create Dialog */}
      <DeploymentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
