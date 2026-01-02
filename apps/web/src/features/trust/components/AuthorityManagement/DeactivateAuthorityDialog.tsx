/**
 * DeactivateAuthorityDialog Component
 *
 * Confirmation dialog for deactivating an authority
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertTriangle, Loader2 } from "lucide-react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useDeactivateAuthority } from "../../hooks";
import type { Authority } from "../../types";

const deactivateAuthoritySchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

type FormValues = z.infer<typeof deactivateAuthoritySchema>;

interface DeactivateAuthorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authority: Authority | null;
  onSuccess?: (authority: Authority) => void;
}

export function DeactivateAuthorityDialog({
  open,
  onOpenChange,
  authority,
  onSuccess,
}: DeactivateAuthorityDialogProps) {
  const { toast } = useToast();
  const { mutate: deactivateAuthority, isPending } = useDeactivateAuthority();

  const form = useForm<FormValues>({
    resolver: zodResolver(deactivateAuthoritySchema),
    defaultValues: {
      reason: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!authority) return;

    deactivateAuthority(
      {
        id: authority.id,
        reason: data.reason,
      },
      {
        onSuccess: (updatedAuthority) => {
          toast({
            title: "Authority Deactivated",
            description: `Successfully deactivated authority "${updatedAuthority.name}"`,
          });
          form.reset();
          onOpenChange(false);
          onSuccess?.(updatedAuthority);
        },
        onError: (error: any) => {
          toast({
            title: "Failed to Deactivate Authority",
            description: error.response?.data?.detail || error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (!authority) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deactivate Authority</DialogTitle>
          <DialogDescription>
            This will prevent the authority from establishing new trust
            relationships.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Deactivating this authority will
                affect <strong>{authority.agentCount}</strong> agent
                {authority.agentCount !== 1 ? "s" : ""}. Existing trust
                relationships will remain valid, but no new ones can be created.
              </AlertDescription>
            </Alert>

            {/* Authority Info */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="text-sm font-medium">{authority.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="text-sm font-medium capitalize">
                  {authority.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Agents Affected:
                </span>
                <span className="text-sm font-medium">
                  {authority.agentCount}
                </span>
              </div>
            </div>

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this authority is being deactivated"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be recorded in the audit trail
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deactivate Authority
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
