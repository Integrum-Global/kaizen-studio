import { useState } from "react";
import { Button } from "@/components/ui";
import { Plus } from "lucide-react";
import { TeamList, TeamDialog } from "@/features/teams";

export function TeamsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Organize users into teams and manage team permissions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* Team List */}
      <TeamList />

      {/* Create Dialog */}
      <TeamDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
