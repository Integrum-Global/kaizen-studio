import { useState } from "react";
import { Button } from "@/components/ui";
import { Plus } from "lucide-react";
import { PolicyList, PolicyEditor } from "@/features/governance";

export function PoliciesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policies</h1>
          <p className="text-muted-foreground mt-1">
            Create attribute-based access control (ABAC) policies for
            fine-grained permissions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {/* Policy List */}
      <PolicyList />

      {/* Create Dialog */}
      <PolicyEditor
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
