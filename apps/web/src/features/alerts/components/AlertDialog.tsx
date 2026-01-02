import { AlertForm } from "./AlertForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { AlertRule, CreateAlertRuleInput } from "../types";
import { useCreateAlertRule, useUpdateAlertRule } from "../hooks";
import { useToast } from "@/hooks/use-toast";

interface AlertDialogProps {
  rule?: AlertRule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertDialog({ rule, open, onOpenChange }: AlertDialogProps) {
  const createAlertRule = useCreateAlertRule();
  const updateAlertRule = useUpdateAlertRule();
  const { toast } = useToast();

  const isEditing = !!rule;

  const handleSubmit = async (data: CreateAlertRuleInput) => {
    try {
      if (isEditing) {
        await updateAlertRule.mutateAsync({
          id: rule.id,
          input: data,
        });
        toast({
          title: "Success",
          description: "Alert rule updated successfully",
        });
      } else {
        await createAlertRule.mutateAsync(data);
        toast({
          title: "Success",
          description: "Alert rule created successfully",
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} alert rule`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Alert Rule" : "Create Alert Rule"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the alert rule configuration below."
              : "Configure a new alert rule to monitor your system metrics."}
          </DialogDescription>
        </DialogHeader>

        <AlertForm
          rule={rule}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={createAlertRule.isPending || updateAlertRule.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
