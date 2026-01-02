import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Activity } from "lucide-react";
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
import {
  useScalingPolicies,
  useUpdateScalingPolicy,
  useDeleteScalingPolicy,
} from "../hooks";
import { ScalingPolicyEditor } from "./ScalingPolicyEditor";
import type { ScalingPolicy } from "../types";

interface ScalingPolicyListProps {
  gatewayId: string;
}

const metricLabels: Record<ScalingPolicy["metric"], string> = {
  cpu: "CPU",
  memory: "Memory",
  requests: "Requests",
  latency: "Latency",
};

const metricUnits: Record<ScalingPolicy["metric"], string> = {
  cpu: "%",
  memory: "%",
  requests: "req/s",
  latency: "ms",
};

export function ScalingPolicyList({ gatewayId }: ScalingPolicyListProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<
    ScalingPolicy | undefined
  >();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: policies, isLoading } = useScalingPolicies(gatewayId);
  const updatePolicy = useUpdateScalingPolicy();
  const deletePolicy = useDeleteScalingPolicy();

  const handleEdit = (policy: ScalingPolicy) => {
    setEditingPolicy(policy);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingPolicy(undefined);
    setEditorOpen(true);
  };

  const handleToggle = async (policy: ScalingPolicy) => {
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
      await deletePolicy.mutateAsync(deleteConfirm);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete policy:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Scaling Policies</CardTitle>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add Policy
          </Button>
        </CardHeader>
        <CardContent>
          {!policies || policies.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No scaling policies configured
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Policy
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={policy.enabled}
                      onCheckedChange={() => handleToggle(policy)}
                      disabled={updatePolicy.isPending}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{policy.name}</span>
                        <Badge
                          variant={policy.enabled ? "default" : "secondary"}
                        >
                          {policy.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {metricLabels[policy.metric]} target:{" "}
                        {policy.targetValue}
                        {metricUnits[policy.metric]} • Scale up at{" "}
                        {policy.scaleUpThreshold}
                        {metricUnits[policy.metric]} • Scale down at{" "}
                        {policy.scaleDownThreshold}
                        {metricUnits[policy.metric]}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Replicas: {policy.minReplicas} - {policy.maxReplicas} •
                        Cooldown: {policy.cooldownSeconds}s
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(policy)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirm(policy.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ScalingPolicyEditor
        gatewayId={gatewayId}
        policy={editingPolicy}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open: boolean) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scaling Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scaling policy? This action
              cannot be undone.
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
