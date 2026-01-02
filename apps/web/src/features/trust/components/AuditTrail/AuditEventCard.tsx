/**
 * AuditEventCard Component
 *
 * Displays a single audit event with expandable details
 */

import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Copy,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import type { AuditAnchor, ActionResult } from "../../types";

interface AuditEventCardProps {
  event: AuditAnchor;
  onAgentClick?: (agentId: string) => void;
  onParentClick?: (parentId: string) => void;
}

const resultConfig: Record<
  ActionResult,
  {
    label: string;
    variant: "default" | "destructive" | "secondary" | "outline";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  success: {
    label: "Success",
    variant: "default",
    icon: CheckCircle,
  },
  failure: {
    label: "Failure",
    variant: "destructive",
    icon: XCircle,
  },
  denied: {
    label: "Denied",
    variant: "destructive",
    icon: AlertTriangle,
  },
  partial: {
    label: "Partial",
    variant: "secondary",
    icon: Clock,
  },
};

export function AuditEventCard({
  event,
  onAgentClick,
  onParentClick,
}: AuditEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const config = resultConfig[event.result] || resultConfig.failure;
  const ResultIcon = config.icon;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(event.id);
      toast({
        title: "Copied",
        description: "Event ID copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(event.trust_chain_hash);
      toast({
        title: "Copied",
        description: "Trust chain hash copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          "rounded-lg border bg-card p-4 transition-colors",
          isExpanded && "border-primary/50"
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-start gap-4 cursor-pointer">
            <div className="flex-shrink-0 mt-0.5">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={config.variant} className="gap-1">
                  <ResultIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
                <span className="font-medium text-sm">{event.action}</span>
                {event.resource && (
                  <span className="text-muted-foreground text-sm truncate">
                    on {event.resource}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "hover:underline cursor-pointer",
                    onAgentClick && "hover:text-primary"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAgentClick?.(event.agent_id);
                  }}
                >
                  Agent: {event.agent_id.slice(0, 8)}...
                </span>
                <span title={format(new Date(event.timestamp), "PPpp")}>
                  {formatDistanceToNow(new Date(event.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs mb-1">
                  Event ID
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1">
                    {event.id}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopyId}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground text-xs mb-1">
                  Timestamp
                </div>
                <div className="text-xs">
                  {format(new Date(event.timestamp), "PPpp")}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground text-xs mb-1">
                  Trust Chain Hash
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1">
                    {event.trust_chain_hash.slice(0, 16)}...
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopyHash}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground text-xs mb-1">
                  Agent ID
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1">
                    {event.agent_id}
                  </code>
                  {onAgentClick && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onAgentClick(event.agent_id)}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {event.parent_anchor_id && (
              <div>
                <div className="text-muted-foreground text-xs mb-1">
                  Parent Anchor
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1">
                    {event.parent_anchor_id}
                  </code>
                  {onParentClick && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onParentClick(event.parent_anchor_id!)}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {Object.keys(event.context).length > 0 && (
              <div>
                <div className="text-muted-foreground text-xs mb-1">
                  Context
                </div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(event.context, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
