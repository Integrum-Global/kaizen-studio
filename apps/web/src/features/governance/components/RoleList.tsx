import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Shield } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoleCard } from "./RoleCard";
import { useRoles, useDeleteRole } from "../hooks";
import type { Role, RoleFilter } from "../types";

interface RoleListProps {
  onEditRole?: (role: Role) => void;
  onViewMembers?: (role: Role) => void;
}

export function RoleList({ onEditRole, onViewMembers }: RoleListProps) {
  const [filters, setFilters] = useState<RoleFilter>({
    includeSystem: true,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);

  const { data, isLoading } = useRoles(filters);
  const deleteRole = useDeleteRole();

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value || undefined }));
  };

  const handleIncludeSystemChange = (checked: boolean) => {
    setFilters((prev) => ({ ...prev, includeSystem: checked }));
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteRole.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete role:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  const roles = data?.records || [];

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              className="pl-9"
              value={filters.search || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="includeSystem"
              checked={filters.includeSystem}
              onCheckedChange={handleIncludeSystemChange}
            />
            <Label htmlFor="includeSystem" className="text-sm">
              Include system roles
            </Label>
          </div>
        </div>

        {roles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No roles found</h3>
              <p className="text-muted-foreground text-center">
                {filters.search
                  ? "Try adjusting your search"
                  : "Create your first role using the button above"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={onEditRole}
                onDelete={(r) => setDeleteConfirm(r)}
                onViewMembers={onViewMembers}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{deleteConfirm?.name}"?
              This will remove the role from all assigned users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
