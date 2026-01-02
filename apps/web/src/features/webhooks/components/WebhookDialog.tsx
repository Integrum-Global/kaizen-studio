import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Alert,
  AlertDescription,
} from "@/components/ui";
import { WebhookForm } from "./WebhookForm";
import { useCreateWebhook, useUpdateWebhook } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import type {
  Webhook,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookWithSecret,
} from "../types";
import { Copy, AlertTriangle } from "lucide-react";

interface WebhookDialogProps {
  webhook?: Webhook;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookDialog({
  webhook,
  open,
  onOpenChange,
}: WebhookDialogProps) {
  const [createdWebhook, setCreatedWebhook] =
    useState<WebhookWithSecret | null>(null);
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const { toast } = useToast();

  const handleSubmit = async (
    data: CreateWebhookRequest | UpdateWebhookRequest
  ) => {
    try {
      if (webhook) {
        await updateWebhook.mutateAsync({
          id: webhook.id,
          input: data as UpdateWebhookRequest,
        });
        toast({
          title: "Success",
          description: "Webhook updated successfully",
        });
        onOpenChange(false);
        setCreatedWebhook(null);
      } else {
        const newWebhook = await createWebhook.mutateAsync(
          data as CreateWebhookRequest
        );
        setCreatedWebhook(newWebhook);
        toast({
          title: "Success",
          description: "Webhook created successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to save webhook",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setCreatedWebhook(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setCreatedWebhook(null);
  };

  const handleCopySecret = () => {
    if (createdWebhook?.secret) {
      navigator.clipboard.writeText(createdWebhook.secret);
      toast({
        title: "Copied",
        description: "Webhook secret copied to clipboard",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {createdWebhook ? (
          <>
            <DialogHeader>
              <DialogTitle>Webhook Created Successfully</DialogTitle>
              <DialogDescription>
                Save the webhook secret below. It will only be shown once.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This secret will only be shown once. Make sure to save it
                  securely.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook Name</label>
                <p className="text-sm text-muted-foreground">
                  {createdWebhook.name}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL</label>
                <p className="text-sm text-muted-foreground break-all">
                  {createdWebhook.url}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook Secret</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                    {createdWebhook.secret}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopySecret}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this secret to verify webhook signatures
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {webhook ? "Edit Webhook" : "Create New Webhook"}
              </DialogTitle>
              <DialogDescription>
                {webhook
                  ? "Update the webhook configuration"
                  : "Create a new webhook to receive event notifications"}
              </DialogDescription>
            </DialogHeader>
            <WebhookForm
              initialData={
                webhook
                  ? {
                      name: webhook.name,
                      url: webhook.url,
                      events: webhook.events,
                      status: webhook.status,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={createWebhook.isPending || updateWebhook.isPending}
              mode={webhook ? "update" : "create"}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
