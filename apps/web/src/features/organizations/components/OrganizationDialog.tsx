import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";
import { OrganizationForm } from "./OrganizationForm";
import { useCreateOrganization, useUpdateOrganization } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import type { Organization, CreateOrganizationInput, UpdateOrganizationInput } from "../types";

interface OrganizationDialogProps {
  organization?: Organization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationDialog({
  organization,
  open,
  onOpenChange,
}: OrganizationDialogProps) {
  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization();
  const { toast } = useToast();

  const isEdit = !!organization;
  const isPending = createOrganization.isPending || updateOrganization.isPending;

  const handleSubmit = async (data: CreateOrganizationInput | UpdateOrganizationInput) => {
    try {
      if (isEdit && organization) {
        await updateOrganization.mutateAsync({
          id: organization.id,
          input: data as UpdateOrganizationInput,
        });
        toast({
          title: "Success",
          description: "Organization updated successfully",
        });
      } else {
        await createOrganization.mutateAsync(data as CreateOrganizationInput);
        toast({
          title: "Success",
          description: "Organization created successfully",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.detail ||
          `Failed to ${isEdit ? "update" : "create"} organization`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Organization" : "Create Organization"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the organization details below."
              : "Create a new organization (tenant) in the platform."}
          </DialogDescription>
        </DialogHeader>
        <OrganizationForm
          organization={organization}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
