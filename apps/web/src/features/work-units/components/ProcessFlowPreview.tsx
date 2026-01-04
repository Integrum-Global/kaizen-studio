/**
 * ProcessFlowPreview Component
 *
 * Compact visualization of a composite work unit's sub-unit flow.
 * Shows the sequence of steps in a process with trust status indicators.
 *
 * @see docs/plans/eatp-ontology/02-work-unit-model.md
 */

import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { TrustStatus, SubUnit } from '../types';

interface ProcessFlowPreviewProps {
  /** Sub-units that make up this process */
  subUnits: SubUnit[];
  /** Optional click handler for a sub-unit */
  onSubUnitClick?: (subUnit: SubUnit) => void;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Maximum number of nodes to show before ellipsis */
  maxNodes?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get trust status icon and color
 */
function getTrustIndicator(status: TrustStatus) {
  switch (status) {
    case 'valid':
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950/30',
        borderColor: 'border-green-200 dark:border-green-800',
      };
    case 'expired':
      return {
        icon: AlertTriangle,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        borderColor: 'border-amber-200 dark:border-amber-800',
      };
    case 'revoked':
      return {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-200 dark:border-red-800',
      };
    case 'pending':
    default:
      return {
        icon: Clock,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-950/30',
        borderColor: 'border-gray-200 dark:border-gray-800',
      };
  }
}

/**
 * Single flow node representing a sub-unit
 */
function FlowNode({
  subUnit,
  compact,
  onClick,
}: {
  subUnit: SubUnit;
  compact?: boolean;
  onClick?: () => void;
}) {
  const trustStatus: TrustStatus = subUnit.trustStatus;
  const indicator = getTrustIndicator(trustStatus);
  const Icon = indicator.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            className={cn(
              'relative rounded-lg border transition-all',
              'hover:shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50',
              indicator.bgColor,
              indicator.borderColor,
              compact ? 'px-2 py-1.5' : 'px-3 py-2',
              onClick && 'cursor-pointer'
            )}
          >
            <span
              className={cn(
                'block font-medium truncate',
                compact ? 'text-xs max-w-[60px]' : 'text-sm max-w-[80px]'
              )}
            >
              {subUnit.name}
            </span>
            <Icon
              className={cn(
                'absolute -top-1 -right-1',
                indicator.color,
                compact ? 'w-3 h-3' : 'w-4 h-4'
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{subUnit.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{subUnit.type}</p>
            <p className="text-xs">
              Trust: <span className={indicator.color}>{trustStatus}</span>
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Arrow connector between flow nodes
 */
function FlowArrow({ compact }: { compact?: boolean }) {
  return (
    <ArrowRight
      className={cn(
        'flex-shrink-0 text-muted-foreground',
        compact ? 'w-3 h-3' : 'w-4 h-4'
      )}
    />
  );
}

/**
 * Ellipsis indicator for hidden nodes
 */
function EllipsisNode({ count, compact }: { count: number; compact?: boolean }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'rounded-lg border border-dashed border-muted-foreground/50',
              'bg-muted/30 text-muted-foreground',
              compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'
            )}
          >
            +{count}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{count} more step{count > 1 ? 's' : ''}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * ProcessFlowPreview displays a compact visualization of the sub-unit flow.
 *
 * Key features:
 * - Shows up to maxNodes sub-units with ellipsis for overflow
 * - Trust status indicators on each node
 * - Hover tooltips with details
 * - Responsive compact mode
 */
export function ProcessFlowPreview({
  subUnits,
  onSubUnitClick,
  compact = false,
  maxNodes = 4,
  className,
}: ProcessFlowPreviewProps) {
  if (!subUnits || subUnits.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground italic', className)}>
        No sub-units defined
      </div>
    );
  }

  const visibleUnits = subUnits.slice(0, maxNodes);
  const hiddenCount = subUnits.length - maxNodes;

  return (
    <div
      className={cn(
        'flex items-center flex-wrap',
        compact ? 'gap-1.5' : 'gap-2',
        className
      )}
      data-testid="process-flow-preview"
    >
      {visibleUnits.map((unit, index) => (
        <div key={unit.id} className="flex items-center gap-1.5">
          <FlowNode
            subUnit={unit}
            compact={compact}
            onClick={onSubUnitClick ? () => onSubUnitClick(unit) : undefined}
          />
          {index < visibleUnits.length - 1 && <FlowArrow compact={compact} />}
          {index === visibleUnits.length - 1 && hiddenCount > 0 && (
            <>
              <FlowArrow compact={compact} />
              <EllipsisNode count={hiddenCount} compact={compact} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default ProcessFlowPreview;
