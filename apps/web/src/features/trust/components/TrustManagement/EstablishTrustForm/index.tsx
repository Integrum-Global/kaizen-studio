/**
 * EstablishTrustForm Component
 *
 * Form for establishing initial trust for an agent with authority, capabilities,
 * constraints, and metadata
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { z } from "zod";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useEstablishTrust } from "../../../hooks";
import { AuthoritySelector } from "../AuthoritySelector";
import { CapabilityEditor } from "../CapabilityEditor";
import { ConstraintEditor } from "../ConstraintEditor";
import { establishTrustFormSchema } from "./schema";
import type { CapabilityFormData } from "./schema";
import type { EstablishTrustRequest, TrustChain } from "../../../types";

// Infer the form type from the schema
type FormValues = z.infer<typeof establishTrustFormSchema>;

interface EstablishTrustFormProps {
  onSuccess?: (trustChain: TrustChain) => void;
  onCancel?: () => void;
}

export function EstablishTrustForm({
  onSuccess,
  onCancel,
}: EstablishTrustFormProps) {
  const { toast } = useToast();
  const { mutate: establishTrust, isPending } = useEstablishTrust();
  const [metadataFields, setMetadataFields] = useState<
    Array<{ key: string; value: string }>
  >([]);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(establishTrustFormSchema) as any,
    defaultValues: {
      agentId: "",
      authorityId: "",
      capabilities: [] as CapabilityFormData[],
      constraints: [] as string[],
      expiresAt: null,
      metadata: {},
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    // Convert metadata fields to record
    const metadata: Record<string, string> = {};
    metadataFields.forEach((field) => {
      if (field.key.trim() && field.value.trim()) {
        metadata[field.key.trim()] = field.value.trim();
      }
    });

    // Build request
    const request: EstablishTrustRequest = {
      agent_id: data.agentId,
      authority_id: data.authorityId,
      capabilities: data.capabilities.map((cap) => ({
        capability: cap.capability,
        capability_type: cap.capability_type,
        constraints: cap.constraints,
        scope: cap.scope,
      })),
      constraints: data.constraints,
      expires_at: data.expiresAt || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    establishTrust(request, {
      onSuccess: (trustChain) => {
        toast({
          title: "Trust Established",
          description: `Successfully established trust for agent ${data.agentId}`,
        });
        form.reset();
        setMetadataFields([]);
        onSuccess?.(trustChain);
      },
      onError: (error: any) => {
        toast({
          title: "Failed to Establish Trust",
          description: error.response?.data?.detail || error.message,
          variant: "destructive",
        });
      },
    });
  };

  const addMetadataField = () => {
    setMetadataFields([...metadataFields, { key: "", value: "" }]);
  };

  const updateMetadataField = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updated = [...metadataFields];
    const item = updated[index];
    if (item) {
      item[field] = value;
      setMetadataFields(updated);
    }
  };

  const removeMetadataField = (index: number) => {
    setMetadataFields(metadataFields.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Agent ID */}
        <FormField
          control={form.control}
          name="agentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent ID *</FormLabel>
              <FormControl>
                <Input
                  placeholder="00000000-0000-0000-0000-000000000000"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                UUID of the agent to establish trust for
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Authority Selector */}
        <FormField
          control={form.control}
          name="authorityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Authority *</FormLabel>
              <FormControl>
                <AuthoritySelector
                  value={field.value}
                  onValueChange={field.onChange}
                  error={form.formState.errors.authorityId?.message}
                />
              </FormControl>
              <FormDescription>
                The organizational authority establishing this trust
              </FormDescription>
            </FormItem>
          )}
        />

        <Separator />

        {/* Capabilities */}
        <FormField
          control={form.control}
          name="capabilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capabilities *</FormLabel>
              <FormControl>
                <CapabilityEditor
                  capabilities={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.capabilities?.message}
                />
              </FormControl>
              <FormDescription>
                Define what the agent is allowed to do
              </FormDescription>
            </FormItem>
          )}
        />

        <Separator />

        {/* Global Constraints */}
        <FormField
          control={form.control}
          name="constraints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Global Constraints</FormLabel>
              <FormControl>
                <ConstraintEditor
                  constraints={field.value || []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Global constraints that apply to all capabilities
              </FormDescription>
            </FormItem>
          )}
        />

        <Separator />

        {/* Expiration Date */}
        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expiration Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      field.onChange(date ? date.toISOString() : null);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  {field.value && (
                    <div className="p-3 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange(null)}
                        className="w-full"
                      >
                        Clear Date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <FormDescription>
                When this trust should expire (leave empty for no expiration)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Metadata */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>Metadata</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMetadataField}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          {metadataFields.length > 0 && (
            <div className="space-y-2">
              {metadataFields.map((field, index) => (
                <Card key={index} className="p-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={field.key}
                      onChange={(e) =>
                        updateMetadataField(index, "key", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) =>
                        updateMetadataField(index, "value", e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMetadataField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <FormDescription>
            Additional metadata as key-value pairs (e.g., purpose, description)
          </FormDescription>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Establish Trust
          </Button>
        </div>
      </form>
    </Form>
  );
}
