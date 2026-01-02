import { useState } from "react";
import { Button } from "@/components/ui";
import { Plus } from "lucide-react";
import { AgentList, AgentFormDialog } from "@/features/agents/components";

export function AgentsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AI agents and configure their behavior
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      {/* Agent List */}
      <AgentList />

      {/* Create Dialog */}
      <AgentFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
