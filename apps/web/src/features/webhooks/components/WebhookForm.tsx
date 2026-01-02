import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Label, Checkbox } from "@/components/ui";
import type {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookStatus,
} from "../types";
import { useWebhookEvents } from "../hooks";
import { Loader2 } from "lucide-react";

const webhookFormSchema = z.object({
  name: z
    .string()
    .min(1, "Webhook name is required")
    .max(100, "Webhook name must be less than 100 characters"),
  url: z.string().url("Must be a valid URL"),
  events: z.array(z.string()).min(1, "Select at least one event"),
  status: z.enum(["active", "inactive"]).optional(),
});

type WebhookFormData = z.infer<typeof webhookFormSchema>;

interface WebhookFormProps {
  initialData?: {
    name: string;
    url: string;
    events: string[];
    status?: WebhookStatus;
  };
  onSubmit: (data: CreateWebhookRequest | UpdateWebhookRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode: "create" | "update";
}

export function WebhookForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
}: WebhookFormProps) {
  const { data: eventsData, isPending: isLoadingEvents } = useWebhookEvents();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      url: initialData?.url || "",
      events: initialData?.events || [],
      status: initialData?.status || "active",
    },
  });

  const handleFormSubmit = (data: WebhookFormData) => {
    if (mode === "create") {
      const createInput: CreateWebhookRequest = {
        name: data.name,
        url: data.url,
        events: data.events,
      };
      onSubmit(createInput);
    } else {
      const updateInput: UpdateWebhookRequest = {
        name: data.name,
        url: data.url,
        events: data.events,
        status: data.status,
      };
      onSubmit(updateInput);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Webhook Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Webhook Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g., Slack Notifications"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Webhook URL */}
      <div className="space-y-2">
        <Label htmlFor="url">
          Webhook URL <span className="text-destructive">*</span>
        </Label>
        <Input
          id="url"
          {...register("url")}
          placeholder="https://example.com/webhook"
          type="url"
        />
        {errors.url && (
          <p className="text-sm text-destructive">{errors.url.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          The endpoint that will receive webhook events
        </p>
      </div>

      {/* Events Selection */}
      <div className="space-y-2">
        <Label>
          Events <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          Select which events should trigger this webhook
        </p>

        {isLoadingEvents ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading events...
          </div>
        ) : (
          <Controller
            name="events"
            control={control}
            render={({ field }) => (
              <div className="border rounded-lg p-4 space-y-3">
                {eventsData?.events.map((event) => (
                  <div key={event} className="flex items-center gap-2">
                    <Checkbox
                      id={event}
                      checked={field.value.includes(event)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...field.value, event]);
                        } else {
                          field.onChange(
                            field.value.filter((e) => e !== event)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={event}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          />
        )}

        {errors.events && (
          <p className="text-sm text-destructive">{errors.events.message}</p>
        )}
      </div>

      {/* Status (only for updates) */}
      {mode === "update" && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            {...register("status")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoadingEvents}>
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create Webhook"
              : "Update Webhook"}
        </Button>
      </div>
    </form>
  );
}
