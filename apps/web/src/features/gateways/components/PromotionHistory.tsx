import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { usePromotions, useUpdatePromotion } from "../hooks";
import type {
  PromotionRequest,
  PromotionStatus,
  GatewayEnvironment,
} from "../types";

interface PromotionHistoryProps {
  gatewayId?: string;
  maxItems?: number;
  showActions?: boolean;
}

const statusIcons: Record<PromotionStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  in_progress: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
  rolled_back: <RotateCcw className="h-4 w-4 text-orange-500" />,
};

const statusColors: Record<
  PromotionStatus,
  "default" | "destructive" | "secondary" | "outline"
> = {
  pending: "secondary",
  in_progress: "default",
  completed: "default",
  failed: "destructive",
  rolled_back: "secondary",
};

const environmentLabels: Record<GatewayEnvironment, string> = {
  development: "Dev",
  staging: "Staging",
  production: "Prod",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PromotionHistory({
  gatewayId,
  maxItems,
  showActions = false,
}: PromotionHistoryProps) {
  const { data, isLoading } = usePromotions(gatewayId);
  const updatePromotion = useUpdatePromotion();

  const handleApprove = async (id: string) => {
    try {
      await updatePromotion.mutateAsync({ id, action: "approve" });
    } catch (error) {
      console.error("Failed to approve promotion:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updatePromotion.mutateAsync({ id, action: "reject" });
    } catch (error) {
      console.error("Failed to reject promotion:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  let promotions = data?.records || [];
  if (maxItems) {
    promotions = promotions.slice(0, maxItems);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promotion History</CardTitle>
      </CardHeader>
      <CardContent>
        {promotions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No promotion history
          </p>
        ) : (
          <div className="space-y-3">
            {promotions.map((promotion) => (
              <PromotionItem
                key={promotion.id}
                promotion={promotion}
                showActions={showActions}
                onApprove={handleApprove}
                onReject={handleReject}
                isPending={updatePromotion.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PromotionItemProps {
  promotion: PromotionRequest;
  showActions: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isPending: boolean;
}

function PromotionItem({
  promotion,
  showActions,
  onApprove,
  onReject,
  isPending,
}: PromotionItemProps) {
  const canAct = showActions && promotion.status === "pending";

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        {statusIcons[promotion.status]}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>{environmentLabels[promotion.sourceEnvironment]}</span>
            <ArrowRight className="h-3 w-3" />
            <span>{environmentLabels[promotion.targetEnvironment]}</span>
            <Badge variant={statusColors[promotion.status]} className="ml-2">
              {promotion.status.replace("_", " ")}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            v{promotion.version} • {formatDate(promotion.createdAt)} •{" "}
            {promotion.requestedBy}
          </div>
          {promotion.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              {promotion.notes}
            </p>
          )}
        </div>
      </div>

      {canAct && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(promotion.id)}
            disabled={isPending}
          >
            Reject
          </Button>
          <Button
            size="sm"
            onClick={() => onApprove(promotion.id)}
            disabled={isPending}
          >
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}
