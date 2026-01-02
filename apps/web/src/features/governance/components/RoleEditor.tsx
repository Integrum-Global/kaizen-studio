import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import {
  useCreateRole,
  useUpdateRole,
  useAvailablePermissions,
} from "../hooks";
import type {
  Role,
  ResourceType,
  ActionType,
  CreateRoleRequest,
} from "../types";

interface RoleEditorProps {
  role?: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const resourceLabels: Record<ResourceType, string> = {
  agent: "Agents",
  pipeline: "Pipelines",
  deployment: "Deployments",
  gateway: "Gateways",
  team: "Teams",
  user: "Users",
  settings: "Settings",
  billing: "Billing",
  audit: "Audit",
};

const actionLabels: Record<ActionType, string> = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
  execute: "Execute",
  manage: "Manage",
  admin: "Admin",
};

export function RoleEditor({
  role,
  open,
  onOpenChange,
  onSuccess,
}: RoleEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );

  const { data: availablePermissions, isLoading: loadingPermissions } =
    useAvailablePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const isEditing = !!role;
  const isPending = createRole.isPending || updateRole.isPending;

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || "");
      setSelectedPermissions(
        new Set(role.permissions.map((p) => `${p.resource}:${p.action}`))
      );
    } else {
      setName("");
      setDescription("");
      setSelectedPermissions(new Set());
    }
  }, [role, open]);

  const togglePermission = (resource: ResourceType, action: ActionType) => {
    const key = `${resource}:${action}`;
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleResourceAll = (resource: ResourceType, actions: ActionType[]) => {
    const resourceKeys = actions.map((a) => `${resource}:${a}`);
    const allSelected = resourceKeys.every((k) => selectedPermissions.has(k));

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        resourceKeys.forEach((k) => next.delete(k));
      } else {
        resourceKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const permissions = Array.from(selectedPermissions).map((key) => {
      const [resource, action] = key.split(":") as [ResourceType, ActionType];
      return { resource, action };
    });

    const request: CreateRoleRequest = {
      name,
      description: description || undefined,
      permissions,
    };

    try {
      if (isEditing && role) {
        await updateRole.mutateAsync({ id: role.id, updates: request });
      } else {
        await createRole.mutateAsync(request);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save role:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("");
      setDescription("");
      setSelectedPermissions(new Set());
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            Configure role permissions for access control.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Project Manager"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this role is for..."
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <Label>Permissions</Label>
            {loadingPermissions ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4 border rounded-lg p-4">
                {availablePermissions?.map((ap) => {
                  const resourceKeys = ap.actions.map(
                    (a) => `${ap.resource}:${a}`
                  );
                  const selectedCount = resourceKeys.filter((k) =>
                    selectedPermissions.has(k)
                  ).length;
                  const allSelected = selectedCount === ap.actions.length;
                  const someSelected =
                    selectedCount > 0 && selectedCount < ap.actions.length;

                  return (
                    <div key={ap.resource} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`resource-${ap.resource}`}
                          checked={allSelected}
                          ref={(el) => {
                            if (el) {
                              (el as HTMLButtonElement).dataset.indeterminate =
                                String(someSelected);
                            }
                          }}
                          onCheckedChange={() =>
                            toggleResourceAll(ap.resource, ap.actions)
                          }
                        />
                        <Label
                          htmlFor={`resource-${ap.resource}`}
                          className="font-medium"
                        >
                          {resourceLabels[ap.resource]}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          ({selectedCount}/{ap.actions.length})
                        </span>
                      </div>
                      <div className="ml-6 flex flex-wrap gap-4">
                        {ap.actions.map((action) => {
                          const key = `${ap.resource}:${action}`;
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <Checkbox
                                id={key}
                                checked={selectedPermissions.has(key)}
                                onCheckedChange={() =>
                                  togglePermission(ap.resource, action)
                                }
                              />
                              <Label
                                htmlFor={key}
                                className="text-sm font-normal"
                              >
                                {actionLabels[action]}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || selectedPermissions.size === 0 || isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
