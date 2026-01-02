import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FileKey, Pencil, Trash2 } from "lucide-react";
import type { Policy } from "../types";

interface PolicyCardProps {
  policy: Policy;
  onToggle?: (policy: Policy) => void;
  onEdit?: (policy: Policy) => void;
  onDelete?: (policy: Policy) => void;
  isPending?: boolean;
}

const effectColors: Record<Policy["effect"], "destructive" | "default"> = {
  deny: "destructive",
  allow: "default",
};

export function PolicyCard({
  policy,
  onToggle,
  onEdit,
  onDelete,
  isPending,
}: PolicyCardProps) {
  return (
    <Card className={!policy.enabled ? "opacity-60" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileKey className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {policy.name}
                <Badge variant={effectColors[policy.effect]}>
                  {policy.effect.toUpperCase()}
                </Badge>
              </CardTitle>
              {policy.description && (
                <CardDescription>{policy.description}</CardDescription>
              )}
            </div>
          </div>
          <Switch
            checked={policy.enabled}
            onCheckedChange={() => onToggle?.(policy)}
            disabled={isPending}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">
              Resource:
            </span>
            <Badge variant="outline">{policy.resource}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">Actions:</span>
            <div className="flex flex-wrap gap-1">
              {policy.actions.map((action) => (
                <Badge key={action} variant="secondary" className="text-xs">
                  {action}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">
              Priority:
            </span>
            <span className="text-sm font-medium">{policy.priority}</span>
          </div>
        </div>

        {policy.conditions.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Conditions ({policy.conditions.length})
            </p>
            <div className="space-y-1">
              {policy.conditions.slice(0, 2).map((condition) => (
                <p key={condition.id} className="text-xs font-mono">
                  {condition.attribute} {condition.operator}{" "}
                  {JSON.stringify(condition.value)}
                </p>
              ))}
              {policy.conditions.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{policy.conditions.length - 2} more conditions
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit?.(policy)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete?.(policy)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
