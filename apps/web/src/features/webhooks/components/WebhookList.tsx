import { useState } from "react";
import { WebhookCard } from "./WebhookCard";
import { WebhookDialog } from "./WebhookDialog";
import { WebhookDeliveries } from "./WebhookDeliveries";
import { useWebhooks, useDeleteWebhook, useTestWebhook } from "../hooks";
import { Button, Skeleton } from "@/components/ui";
import { Plus } from "lucide-react";
import type { Webhook } from "../types";
import { useToast } from "@/hooks/use-toast";

export function WebhookList() {
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deliveriesWebhook, setDeliveriesWebhook] = useState<Webhook | null>(
    null
  );

  const { data, isPending, error } = useWebhooks();
  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();
  const { toast } = useToast();

  const handleEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) {
      return;
    }

    try {
      await deleteWebhook.mutateAsync(id);
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    }
  };

  const handleTest = async (webhook: Webhook) => {
    try {
      await testWebhook.mutateAsync({ id: webhook.id });
      toast({
        title: "Success",
        description: "Test delivery sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test delivery",
        variant: "destructive",
      });
    }
  };

  const handleViewDeliveries = (webhook: Webhook) => {
    setDeliveriesWebhook(webhook);
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <WebhookListHeader onCreateClick={() => setIsCreateDialogOpen(true)} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <WebhookCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load webhooks</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6">
        <WebhookListHeader onCreateClick={() => setIsCreateDialogOpen(true)} />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground text-lg">No webhooks found</p>
          <p className="text-sm text-muted-foreground">
            Create your first webhook to get started
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Webhook
          </Button>
        </div>
        <WebhookDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WebhookListHeader onCreateClick={() => setIsCreateDialogOpen(true)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((webhook) => (
          <WebhookCard
            key={webhook.id}
            webhook={webhook}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTest={handleTest}
            onViewDeliveries={handleViewDeliveries}
          />
        ))}
      </div>

      {selectedWebhook && (
        <WebhookDialog
          webhook={selectedWebhook}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}

      <WebhookDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {deliveriesWebhook && (
        <WebhookDeliveries
          webhook={deliveriesWebhook}
          open={!!deliveriesWebhook}
          onOpenChange={(open) => !open && setDeliveriesWebhook(null)}
        />
      )}
    </div>
  );
}

interface WebhookListHeaderProps {
  onCreateClick: () => void;
}

function WebhookListHeader({ onCreateClick }: WebhookListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">Webhooks</h2>
        <p className="text-muted-foreground">
          Configure webhooks to receive real-time event notifications
        </p>
      </div>
      <Button onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Create Webhook
      </Button>
    </div>
  );
}

function WebhookCardSkeleton() {
  return (
    <div className="space-y-4 border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-9 w-9" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}
