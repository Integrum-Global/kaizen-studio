/**
 * TrustChainPreview Component
 *
 * Visual preview of trust delegation chain showing the flow from
 * delegator to delegatee with constraint summaries.
 *
 * @see docs/plans/eatp-ontology/04-workspaces.md
 */

import { ArrowRight, User, Bot, Shield, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Represents a link in the trust chain
 */
export interface TrustChainLink {
  /** Source agent/user ID */
  fromId: string;
  /** Source name */
  fromName: string;
  /** Source type (human or agent) */
  fromType: 'human' | 'agent';
  /** Target agent/user ID */
  toId: string;
  /** Target name */
  toName: string;
  /** Target type (human or agent) */
  toType: 'human' | 'agent';
  /** Constraint summary (e.g., "$500/day") */
  constraintSummary?: string;
  /** Full constraint list */
  constraints?: string[];
  /** Whether this link is the new delegation being created */
  isNew?: boolean;
  /** Whether this link has constraint violations */
  hasViolation?: boolean;
  /** Violation message if any */
  violationMessage?: string;
}

export interface TrustChainPreviewProps {
  /** Trust chain links to display */
  chain: TrustChainLink[];
  /** Highlight the new delegation being created */
  highlightNew?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Orientation of the chain */
  orientation?: 'horizontal' | 'vertical';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get icon for entity type
 */
function EntityIcon({ type, className }: { type: 'human' | 'agent'; className?: string }) {
  if (type === 'human') {
    return <User className={cn('w-4 h-4', className)} />;
  }
  return <Bot className={cn('w-4 h-4', className)} />;
}

/**
 * Single node in the trust chain
 */
function ChainNode({
  id,
  name,
  type,
  isStart,
  isEnd,
  isNew,
  compact,
}: {
  id: string;
  name: string;
  type: 'human' | 'agent';
  isStart?: boolean;
  isEnd?: boolean;
  isNew?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1',
        isNew && 'ring-2 ring-blue-500 ring-offset-2 rounded-lg p-2'
      )}
      data-testid={`chain-node-${id}`}
    >
      <Avatar className={cn(compact ? 'w-8 h-8' : 'w-10 h-10')}>
        <AvatarFallback
          className={cn(
            isStart && 'bg-green-100 text-green-700',
            isEnd && 'bg-blue-100 text-blue-700',
            isNew && 'bg-purple-100 text-purple-700'
          )}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-center">
        <span className={cn('font-medium text-center', compact ? 'text-xs' : 'text-sm')}>
          {name}
        </span>
        <div className="flex items-center gap-1 text-muted-foreground">
          <EntityIcon type={type} className="w-3 h-3" />
          <span className="text-xs capitalize">{type}</span>
        </div>
      </div>
      {isNew && (
        <Badge variant="secondary" className="text-xs mt-1">
          New
        </Badge>
      )}
    </div>
  );
}

/**
 * Arrow with constraint summary
 */
function ChainArrow({
  constraintSummary,
  constraints,
  hasViolation,
  violationMessage,
  isNew,
  compact,
  orientation,
}: {
  constraintSummary?: string;
  constraints?: string[];
  hasViolation?: boolean;
  violationMessage?: string;
  isNew?: boolean;
  compact?: boolean;
  orientation: 'horizontal' | 'vertical';
}) {
  const arrowContent = (
    <div
      className={cn(
        'flex items-center gap-1',
        orientation === 'vertical' && 'flex-col',
        hasViolation && 'text-destructive',
        isNew && 'text-blue-600'
      )}
    >
      {hasViolation && <AlertTriangle className="w-4 h-4" />}
      {!hasViolation && <Shield className={cn('w-4 h-4', isNew && 'text-blue-500')} />}
      <ArrowRight
        className={cn(
          compact ? 'w-4 h-4' : 'w-5 h-5',
          orientation === 'vertical' && 'rotate-90'
        )}
      />
    </div>
  );

  const constraintDisplay = constraintSummary && (
    <span
      className={cn(
        'text-xs text-muted-foreground text-center',
        hasViolation && 'text-destructive font-medium',
        isNew && 'text-blue-600'
      )}
    >
      {constraintSummary}
    </span>
  );

  if (constraints && constraints.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center',
                orientation === 'horizontal' ? 'flex-col gap-1 mx-2' : 'flex-row gap-1 my-2'
              )}
            >
              {arrowContent}
              {constraintDisplay}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium text-sm">Constraints:</p>
              <ul className="text-xs space-y-0.5">
                {constraints.map((constraint, idx) => (
                  <li key={idx} className="font-mono">
                    • {constraint}
                  </li>
                ))}
              </ul>
              {hasViolation && violationMessage && (
                <p className="text-destructive text-xs font-medium mt-2">
                  ⚠ {violationMessage}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center',
        orientation === 'horizontal' ? 'flex-col gap-1 mx-2' : 'flex-row gap-1 my-2'
      )}
    >
      {arrowContent}
      {constraintDisplay}
    </div>
  );
}

/**
 * TrustChainPreview displays a visual representation of the
 * trust delegation chain from origin to target.
 *
 * Example visual (horizontal):
 * ```
 * [CFO] ─→ [You] ─→ [Alice]
 * $500/day   $500/day   $250/day (New)
 * ```
 */
export function TrustChainPreview({
  chain,
  highlightNew = true,
  compact = false,
  orientation = 'horizontal',
  className,
}: TrustChainPreviewProps) {
  if (chain.length === 0) {
    return (
      <div className={cn('text-center text-muted-foreground py-4', className)}>
        No trust chain to display
      </div>
    );
  }

  // Build nodes from chain links
  const nodes: Array<{
    id: string;
    name: string;
    type: 'human' | 'agent';
    isNew?: boolean;
    isStart: boolean;
    isEnd: boolean;
  }> = [];

  // Add the first node (start of chain)
  if (chain[0]) {
    nodes.push({
      id: chain[0].fromId,
      name: chain[0].fromName,
      type: chain[0].fromType,
      isStart: true,
      isEnd: chain.length === 0,
    });
  }

  // Add all destination nodes
  chain.forEach((link, index) => {
    nodes.push({
      id: link.toId,
      name: link.toName,
      type: link.toType,
      isNew: highlightNew && link.isNew,
      isStart: false,
      isEnd: index === chain.length - 1,
    });
  });

  return (
    <div
      className={cn(
        'flex items-center justify-center p-4',
        orientation === 'vertical' && 'flex-col',
        className
      )}
      data-testid="trust-chain-preview"
    >
      {nodes.map((node, nodeIndex) => {
        // Get the link that leads TO this node (if any)
        const linkIndex = nodeIndex - 1;
        const link = chain[linkIndex];

        return (
          <div
            key={node.id}
            className={cn(
              'flex items-center',
              orientation === 'vertical' && 'flex-col'
            )}
          >
            {/* Arrow from previous node */}
            {nodeIndex > 0 && link && (
              <ChainArrow
                constraintSummary={link.constraintSummary}
                constraints={link.constraints}
                hasViolation={link.hasViolation}
                violationMessage={link.violationMessage}
                isNew={highlightNew && link.isNew}
                compact={compact}
                orientation={orientation}
              />
            )}

            {/* Node */}
            <ChainNode
              id={node.id}
              name={node.name}
              type={node.type}
              isStart={node.isStart}
              isEnd={node.isEnd}
              isNew={node.isNew}
              compact={compact}
            />
          </div>
        );
      })}
    </div>
  );
}

export default TrustChainPreview;
