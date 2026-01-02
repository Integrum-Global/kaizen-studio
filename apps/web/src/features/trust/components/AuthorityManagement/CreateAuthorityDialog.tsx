/**
 * CreateAuthorityDialog Component
 *
 * Modal dialog for creating a new authority
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateAuthority } from "../../hooks";
import { AuthorityType } from "../../types";
import type { Authority } from "../../types";

const createAuthoritySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.nativeEnum(AuthorityType),
  description: z.string().optional(),
  parentAuthorityId: z.string().optional(),
});

type FormValues = z.infer<typeof createAuthoritySchema>;

interface CreateAuthorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (authority: Authority) => void;
}

export function CreateAuthorityDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAuthorityDialogProps) {
  const { toast } = useToast();
  const { mutate: createAuthority, isPending } = useCreateAuthority();

  const form = useForm<FormValues>({
    resolver: zodResolver(createAuthoritySchema),
    defaultValues: {
      name: "",
      type: AuthorityType.ORGANIZATION,
      description: "",
      parentAuthorityId: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    createAuthority(
      {
        name: data.name,
        type: data.type,
        description: data.description || undefined,
        parentAuthorityId: data.parentAuthorityId || undefined,
      },
      {
        onSuccess: (authority) => {
          toast({
            title: "Authority Created",
            description: `Successfully created authority "${authority.name}"`,
          });
          form.reset();
          onOpenChange(false);
          onSuccess?.(authority);
        },
        onError: (error: any) => {
          toast({
            title: "Failed to Create Authority",
            description: error.response?.data?.detail || error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Authority</DialogTitle>
          <DialogDescription>
            Create a new authority to establish trust for agents
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

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select authority type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={AuthorityType.ORGANIZATION}>
                        Organization
                      </SelectItem>
                      <SelectItem value={AuthorityType.SYSTEM}>
                        System
                      </SelectItem>
                      <SelectItem value={AuthorityType.HUMAN}>Human</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of authority being created
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

            {/* Parent Authority */}
            <FormField
              control={form.control}
              name="parentAuthorityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Authority (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00000000-0000-0000-0000-000000000000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    For hierarchical authorities, specify the parent authority
                    ID
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
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Authority
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
