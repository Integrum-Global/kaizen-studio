/**
 * AuthorityNode Component
 *
 * Custom React Flow node for displaying authorities in the trust graph
 */

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Shield, Building2, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AuthorityType } from "../../types";

export interface AuthorityNodeData {
  id: string;
  name: string;
  authorityType: AuthorityType;
  isActive: boolean;
  agentCount?: number;
  [key: string]: unknown; // Index signature for React Flow compatibility
}

const authorityIcons: Record<
  AuthorityType,
  React.ComponentType<{ className?: string }>
> = {
  [AuthorityType.ORGANIZATION]: Building2,
  [AuthorityType.SYSTEM]: Settings,
  [AuthorityType.HUMAN]: User,
};

const authorityColors: Record<
  AuthorityType,
  { bg: string; border: string; text: string }
> = {
  [AuthorityType.ORGANIZATION]: {
    bg: "bg-purple-50 dark:bg-purple-950",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-600 dark:text-purple-400",
  },
  [AuthorityType.SYSTEM]: {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-600 dark:text-blue-400",
  },
  [AuthorityType.HUMAN]: {
    bg: "bg-amber-50 dark:bg-amber-950",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-600 dark:text-amber-400",
  },
};

function AuthorityNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as AuthorityNodeData;
  const Icon = authorityIcons[nodeData.authorityType] || Shield;
  const colors =
    authorityColors[nodeData.authorityType] ||
    authorityColors[AuthorityType.ORGANIZATION];

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 min-w-[160px] transition-all",
        colors.bg,
        colors.border,
        selected && "ring-2 ring-primary ring-offset-2",
        !nodeData.isActive && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-md", colors.bg)}>
          <Icon className={cn("h-4 w-4", colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{nodeData.name}</div>
          <Badge variant="outline" className="text-xs mt-0.5">
            {nodeData.authorityType}
          </Badge>
        </div>
      </div>

      {nodeData.agentCount !== undefined && (
        <div className="text-xs text-muted-foreground">
          {nodeData.agentCount} agent{nodeData.agentCount !== 1 ? "s" : ""}
        </div>
      )}

      {!nodeData.isActive && (
        <Badge variant="secondary" className="text-xs mt-1">
          Inactive
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

export const AuthorityNode = memo(AuthorityNodeComponent);
