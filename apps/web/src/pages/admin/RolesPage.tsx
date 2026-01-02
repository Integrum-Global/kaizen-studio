import { useState } from "react";
import { Button } from "@/components/ui";
import { Plus } from "lucide-react";
import { RoleList, RoleEditor } from "@/features/governance";
import type { Role } from "@/features/governance";

export function RolesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsCreateDialogOpen(false);
      setEditingRole(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground mt-1">
            Define roles and configure permission sets for access control
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Role List */}
      <RoleList onEditRole={(role) => setEditingRole(role)} />

      {/* Create/Edit Dialog */}
      <RoleEditor
        role={editingRole ?? undefined}
        open={isCreateDialogOpen || !!editingRole}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
}
