import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { DeploymentForm } from "./DeploymentForm";
import { useCreateDeployment, useUpdateDeployment } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import type {
  Deployment,
  CreateDeploymentInput,
  UpdateDeploymentInput,
} from "../types";

interface DeploymentDialogProps {
  deployment?: Deployment;
  pipelineId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeploymentDialog({
  deployment,
  pipelineId,
  open,
  onOpenChange,
}: DeploymentDialogProps) {
  const createDeployment = useCreateDeployment();
  const updateDeployment = useUpdateDeployment();
  const { toast } = useToast();

  const handleSubmit = async (
    data: CreateDeploymentInput | UpdateDeploymentInput
  ) => {
    try {
      if (deployment) {
        await updateDeployment.mutateAsync({
          id: deployment.id,
          input: data as UpdateDeploymentInput,
        });
        toast({
          title: "Success",
          description: "Deployment configuration updated successfully",
        });
      } else {
        await createDeployment.mutateAsync(data as CreateDeploymentInput);
        toast({
          title: "Success",
          description: "Deployment created successfully",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.detail || "Failed to save deployment",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {deployment
              ? "Edit Deployment Configuration"
              : "Create New Deployment"}
          </DialogTitle>
          <DialogDescription>
            {deployment
              ? "Update the configuration for your deployment"
              : "Deploy your pipeline to a target environment"}
          </DialogDescription>
        </DialogHeader>
        <DeploymentForm
          pipelineId={pipelineId}
          initialData={
            deployment
              ? {
                  config: deployment.config,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={
            createDeployment.isPending || updateDeployment.isPending
          }
          mode={deployment ? "update" : "create"}
        />
      </DialogContent>
    </Dialog>
  );
}
