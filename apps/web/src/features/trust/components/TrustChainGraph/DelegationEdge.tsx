/**
 * DelegationEdge Component
 *
 * Custom React Flow edge for displaying delegation relationships
 */

import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface DelegationEdgeData {
  type: "establish" | "delegate";
  capabilityCount: number;
  isActive: boolean;
  isExpired?: boolean;
  [key: string]: unknown; // Index signature for React Flow compatibility
}

function DelegationEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as DelegationEdgeData | undefined;
  const isEstablish = edgeData?.type === "establish";
  const isActive = edgeData?.isActive ?? true;
  const isExpired = edgeData?.isExpired ?? false;

  const edgeColor = isEstablish
    ? isActive
      ? "stroke-purple-500"
      : "stroke-purple-300"
    : isActive
      ? "stroke-blue-500"
      : "stroke-blue-300";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(
          "!stroke-2",
          edgeColor,
          selected && "!stroke-[3px]",
          isExpired && "opacity-50"
        )}
        style={{ strokeDasharray: isExpired ? "5,5" : undefined }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <Badge
            variant={isEstablish ? "default" : "secondary"}
            className={cn("text-xs cursor-pointer", isExpired && "opacity-50")}
          >
            {isEstablish ? "EST" : "DEL"}
            {edgeData?.capabilityCount && ` (${edgeData.capabilityCount})`}
          </Badge>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const DelegationEdge = memo(DelegationEdgeComponent);
