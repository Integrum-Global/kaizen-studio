import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
  Button,
  Skeleton,
} from "@/components/ui";
import { useWebhookDeliveries, useRetryDelivery } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import type { Webhook, DeliveryStatus } from "../types";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

interface WebhookDeliveriesProps {
  webhook: Webhook;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusIcons = {
  success: CheckCircle,
  failed: XCircle,
  pending: Clock,
};

const statusVariants: Record<
  DeliveryStatus,
  "default" | "destructive" | "secondary"
> = {
  success: "default",
  failed: "destructive",
  pending: "secondary",
};

export function WebhookDeliveries({
  webhook,
  open,
  onOpenChange,
}: WebhookDeliveriesProps) {
  const {
    data: deliveries,
    isPending,
    error,
  } = useWebhookDeliveries(webhook.id);
  const retryDelivery = useRetryDelivery();
  const { toast } = useToast();

  const handleRetry = async (deliveryId: string) => {
    try {
      await retryDelivery.mutateAsync(deliveryId);
      toast({
        title: "Success",
        description: "Delivery retry initiated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry delivery",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delivery History</DialogTitle>
          <DialogDescription>
            Recent webhook deliveries for {webhook.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isPending ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <DeliveryItemSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Failed to load delivery history
            </div>
          ) : !deliveries || deliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deliveries yet
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((delivery) => {
                const StatusIcon = statusIcons[delivery.status];
                return (
                  <div
                    key={delivery.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={statusVariants[delivery.status]}
                            className="gap-1"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {delivery.status}
                          </Badge>
                          <span className="text-sm font-medium">
                            {delivery.event_type}
                          </span>
                          {delivery.response_status && (
                            <Badge variant="outline">
                              HTTP {delivery.response_status}
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          <div>
                            Delivered at{" "}
                            {new Date(delivery.created_at).toLocaleString()}
                          </div>
                          {delivery.duration_ms && (
                            <div>Duration: {delivery.duration_ms}ms</div>
                          )}
                          {delivery.attempt_count > 1 && (
                            <div>Attempts: {delivery.attempt_count}</div>
                          )}
                        </div>
                      </div>

                      {delivery.status === "failed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetry(delivery.id)}
                          disabled={retryDelivery.isPending}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>

                    {delivery.response_body && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View response
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                          {delivery.response_body}
                        </pre>
                      </details>
                    )}

                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View payload
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(JSON.parse(delivery.payload), null, 2)}
                      </pre>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryItemSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}
