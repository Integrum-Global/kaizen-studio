import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FileKey } from "lucide-react";
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
import { PolicyCard } from "./PolicyCard";
import { usePolicies, useUpdatePolicy, useDeletePolicy } from "../hooks";
import type {
  Policy,
  PolicyFilter,
  ResourceType,
  PolicyEffect,
} from "../types";

interface PolicyListProps {
  onEditPolicy?: (policy: Policy) => void;
}

const resourceOptions: { value: ResourceType | "all"; label: string }[] = [
  { value: "all", label: "All Resources" },
  { value: "agent", label: "Agents" },
  { value: "pipeline", label: "Pipelines" },
  { value: "deployment", label: "Deployments" },
  { value: "gateway", label: "Gateways" },
  { value: "team", label: "Teams" },
  { value: "user", label: "Users" },
  { value: "settings", label: "Settings" },
  { value: "billing", label: "Billing" },
  { value: "audit", label: "Audit" },
];

export function PolicyList({ onEditPolicy }: PolicyListProps) {
  const [filters, setFilters] = useState<PolicyFilter>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Policy | null>(null);

  const { data, isLoading } = usePolicies(filters);
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();

  const handleResourceChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      resource: value === "all" ? undefined : (value as ResourceType),
    }));
  };

  const handleEffectChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      effect: value === "all" ? undefined : (value as PolicyEffect),
    }));
  };

  const handleToggle = async (policy: Policy) => {
    try {
      await updatePolicy.mutateAsync({
        id: policy.id,
        updates: { enabled: !policy.enabled },
      });
    } catch (error) {
      console.error("Failed to toggle policy:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deletePolicy.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete policy:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-32 ml-auto" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[250px]" />
          ))}
        </div>
      </div>
    );
  }

  const policies = data?.records || [];

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <Select
            value={filters.resource || "all"}
            onValueChange={handleResourceChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              {resourceOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.effect || "all"}
            onValueChange={handleEffectChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Effect" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Effects</SelectItem>
              <SelectItem value="allow">Allow</SelectItem>
              <SelectItem value="deny">Deny</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {policies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileKey className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No policies found</h3>
              <p className="text-muted-foreground text-center">
                {filters.resource || filters.effect
                  ? "Try adjusting your filters"
                  : "Create your first policy using the button above"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onToggle={handleToggle}
                onEdit={onEditPolicy}
                onDelete={(p) => setDeleteConfirm(p)}
                isPending={updatePolicy.isPending}
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
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the policy "{deleteConfirm?.name}
              "? This action cannot be undone.
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
