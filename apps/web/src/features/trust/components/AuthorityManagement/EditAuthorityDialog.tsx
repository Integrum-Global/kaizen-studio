/**
 * EditAuthorityDialog Component
 *
 * Modal dialog for editing an existing authority
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUpdateAuthority } from "../../hooks";
import type { Authority } from "../../types";

const editAuthoritySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof editAuthoritySchema>;

interface EditAuthorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authority: Authority | null;
  onSuccess?: (authority: Authority) => void;
}

export function EditAuthorityDialog({
  open,
  onOpenChange,
  authority,
  onSuccess,
}: EditAuthorityDialogProps) {
  const { toast } = useToast();
  const { mutate: updateAuthority, isPending } = useUpdateAuthority();

  const form = useForm<FormValues>({
    resolver: zodResolver(editAuthoritySchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  // Update form when authority changes
  useEffect(() => {
    if (authority) {
      form.reset({
        name: authority.name,
        description: authority.description || "",
        isActive: authority.isActive,
      });
    }
  }, [authority, form]);

  const onSubmit = (data: FormValues) => {
    if (!authority) return;

    updateAuthority(
      {
        id: authority.id,
        input: {
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
        },
      },
      {
        onSuccess: (updatedAuthority) => {
          toast({
            title: "Authority Updated",
            description: `Successfully updated authority "${updatedAuthority.name}"`,
          });
          form.reset();
          onOpenChange(false);
          onSuccess?.(updatedAuthority);
        },
        onError: (error: any) => {
          toast({
            title: "Failed to Update Authority",
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
          <DialogTitle>Edit Authority</DialogTitle>
          <DialogDescription>
            Update authority details. Type cannot be changed after creation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corporation" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this authority
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description of this authority"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional context about this authority
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Inactive authorities cannot establish new trust
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Authority
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
