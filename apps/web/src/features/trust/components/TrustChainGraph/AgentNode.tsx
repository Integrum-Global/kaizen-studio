/**
 * AgentNode Component
 *
 * Custom React Flow node for displaying agents in the trust graph
 */

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Bot, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrustStatus } from "../../types";

export interface AgentNodeData {
  id: string;
  name: string;
  status: TrustStatus;
  capabilityCount: number;
  constraintCount: number;
  expiresAt?: string | null;
  isExpiringSoon?: boolean;
  [key: string]: unknown; // Index signature for React Flow compatibility
}

const statusConfig: Record<
  TrustStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  [TrustStatus.VALID]: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-300 dark:border-green-700",
  },
  [TrustStatus.EXPIRED]: {
    icon: Clock,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    borderColor: "border-yellow-300 dark:border-yellow-700",
  },
  [TrustStatus.REVOKED]: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-300 dark:border-red-700",
  },
  [TrustStatus.PENDING]: {
    icon: Clock,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950",
    borderColor: "border-gray-300 dark:border-gray-700",
  },
  [TrustStatus.INVALID]: {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-300 dark:border-red-700",
  },
};

function AgentNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as AgentNodeData;
  const config =
    statusConfig[nodeData.status] || statusConfig[TrustStatus.PENDING];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 min-w-[180px] transition-all bg-card",
        config.borderColor,
        selected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-3 !h-3 !border-2 !border-background"
      />

      <div className="flex items-start gap-2">
        <div className={cn("p-1.5 rounded-md", config.bgColor)}>
          <Bot className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{nodeData.name}</div>
          <code className="text-xs text-muted-foreground">
            {nodeData.id.slice(0, 8)}...
          </code>
        </div>
        <div className="flex-shrink-0">
          <StatusIcon className={cn("h-4 w-4", config.color)} />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <Badge variant="secondary" className="text-xs">
          {nodeData.capabilityCount} cap
          {nodeData.capabilityCount !== 1 ? "s" : ""}
        </Badge>
        {nodeData.constraintCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {nodeData.constraintCount} constraint
            {nodeData.constraintCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {nodeData.isExpiringSoon && (
        <Badge variant="destructive" className="text-xs mt-2">
          <Clock className="h-3 w-3 mr-1" />
          Expiring soon
        </Badge>
      )}

      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-3 !h-3 !border-2 !border-background"
      />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
