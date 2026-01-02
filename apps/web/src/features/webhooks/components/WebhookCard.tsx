import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
} from "@/components/ui";
import {
  MoreVertical,
  Trash2,
  Edit,
  Webhook as WebhookIcon,
  Activity,
  AlertCircle,
} from "lucide-react";
import type { Webhook } from "../types";

interface WebhookCardProps {
  webhook: Webhook;
  onEdit: (webhook: Webhook) => void;
  onDelete: (id: string) => void;
  onTest: (webhook: Webhook) => void;
  onViewDeliveries: (webhook: Webhook) => void;
}

const statusVariants: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  active: "default",
  inactive: "secondary",
};

export function WebhookCard({
  webhook,
  onEdit,
  onDelete,
  onTest,
  onViewDeliveries,
}: WebhookCardProps) {
  const hasFailures = webhook.failure_count > 0;

  return (
    <Card className="hover:shadow-lg transition-all hover:border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <WebhookIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{webhook.name}</CardTitle>
            <Badge variant={statusVariants[webhook.status]}>
              {webhook.status}
            </Badge>
            {hasFailures && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                {webhook.failure_count} failures
              </Badge>
            )}
          </div>
          <CardDescription className="break-all">{webhook.url}</CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onTest(webhook)}>
              <Activity className="mr-2 h-4 w-4" />
              Test Webhook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewDeliveries(webhook)}>
              View Deliveries
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(webhook)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(webhook.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {webhook.events.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Subscribed Events:</p>
              <div className="flex flex-wrap gap-2">
                {webhook.events.map((event) => (
                  <Badge key={event} variant="outline" className="text-xs">
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Created {new Date(webhook.created_at).toLocaleDateString()}
            </span>
            {webhook.last_triggered_at && (
              <>
                <span>•</span>
                <span>
                  Last triggered{" "}
                  {new Date(webhook.last_triggered_at).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
