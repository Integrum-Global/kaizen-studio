/**
 * WorkUnitCard Component
 *
 * The primary representation of a work unit in lists and grids.
 * Provides a unified design for both atomic and composite work units,
 * with trust status always visible.
 *
 * @see docs/plans/eatp-frontend/03-work-units-ui.md
 */

import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { WorkUnit, UserLevel } from '../types';
import { WorkUnitIcon } from './WorkUnitIcon';
import { TrustStatusBadge } from './TrustStatusBadge';
import { CapabilityTags } from './CapabilityTags';
import { SubUnitCount } from './SubUnitCount';
import { WorkUnitActions } from './WorkUnitActions';

export interface WorkUnitCardProps {
  /**
   * Work unit to display
   */
  workUnit: WorkUnit;

  /**
   * Current user level for determining action visibility
   */
  userLevel: UserLevel;

  /**
   * Handler for running the work unit
   */
  onRun?: () => void;

  /**
   * Handler for opening configuration
   */
  onConfigure?: () => void;

  /**
   * Handler for opening delegation wizard
   */
  onDelegate?: () => void;

  /**
   * Handler for card click (opens detail panel)
   */
  onClick?: () => void;

  /**
   * Handler for viewing trust details
   */
  onViewTrust?: () => void;

  /**
   * Handler for expanding sub-units
   */
  onExpandSubUnits?: () => void;

  /**
   * Whether to show action buttons
   */
  showActions?: boolean;

  /**
   * Compact mode for embedding in other views
   */
  compact?: boolean;

  /**
   * Whether an action is loading
   */
  isLoading?: boolean;

  /**
   * Which action is loading
   */
  loadingAction?: 'run' | 'configure' | 'delegate';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * WorkUnitCard provides a unified view of any work unit.
 *
 * Design principles:
 * 1. Unified visual language - atomic and composite share base design
 * 2. Trust-first - trust status is always visible
 * 3. Progressive disclosure - Level 1 sees simplified view
 */
export function WorkUnitCard({
  workUnit,
  userLevel,
  onRun,
  onConfigure,
  onDelegate,
  onClick,
  onViewTrust,
  onExpandSubUnits,
  showActions = true,
  compact = false,
  isLoading = false,
  loadingAction,
  className,
}: WorkUnitCardProps) {
  const isComposite = workUnit.type === 'composite';
  const trustStatus = workUnit.trustInfo?.status || 'pending';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on interactive elements inside the card
    const target = e.target as HTMLElement;
    const cardElement = e.currentTarget;

    // Check if the clicked element (or its parent) is an interactive element that's NOT the card itself
    const closestButton = target.closest('button');
    const closestRoleButton = target.closest('[role="button"]');
    const closestAnchor = target.closest('a');

    // If clicking on a child interactive element (not the card itself), don't trigger card click
    if (
      (closestButton && closestButton !== cardElement) ||
      (closestRoleButton && closestRoleButton !== cardElement) ||
      closestAnchor
    ) {
      return;
    }
    onClick?.();
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/50',
        compact && 'p-3',
        className
      )}
      onClick={handleCardClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${workUnit.name} - ${workUnit.type} work unit, trust ${trustStatus}`}
    >
      <CardHeader className={cn('flex flex-row items-start gap-4', compact && 'p-0 pb-2')}>
        {/* Icon */}
        <WorkUnitIcon
          type={workUnit.type}
          size={compact ? 'sm' : 'md'}
          className="flex-shrink-0"
        />

        {/* Header content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className={cn('line-clamp-1', compact ? 'text-base' : 'text-lg')}>
              {workUnit.name}
            </CardTitle>
            <TrustStatusBadge
              status={trustStatus}
              expiresAt={workUnit.trustInfo?.expiresAt}
              showExpiry={userLevel >= 2}
              size={compact ? 'sm' : 'md'}
              onClick={onViewTrust}
              className="flex-shrink-0"
            />
          </div>
          {!compact && workUnit.description && (
            <CardDescription className="line-clamp-2">
              {workUnit.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn('space-y-4', compact && 'p-0 pt-2')}>
        {/* Capabilities */}
        <CapabilityTags
          capabilities={workUnit.capabilities}
          maxVisible={compact ? 3 : 4}
          size={compact ? 'sm' : 'md'}
        />

        {/* Sub-unit count for composite work units */}
        {isComposite && workUnit.subUnitCount !== undefined && (
          <SubUnitCount
            count={workUnit.subUnitCount}
            onClick={onExpandSubUnits}
          />
        )}

        {/* Actions */}
        {showActions && !compact && (
          <WorkUnitActions
            workUnit={workUnit}
            userLevel={userLevel}
            onRun={onRun || (() => {})}
            onConfigure={onConfigure || (() => {})}
            onDelegate={onDelegate || (() => {})}
            isLoading={isLoading}
            loadingAction={loadingAction}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default WorkUnitCard;
