/**
 * WorkUnitActions Component
 *
 * Action buttons for work units with trust-aware disabling and level-based visibility.
 *
 * Action availability:
 * - Run: Level 1+ (requires valid trust)
 * - Configure: Level 2+
 * - Delegate: Level 2+ (requires valid trust)
 * - Delete: Level 3+
 *
 * @see docs/plans/eatp-frontend/03-work-units-ui.md
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Play, Settings, Share2, Trash2, Loader2 } from 'lucide-react';
import type { WorkUnit, UserLevel, TrustStatus } from '../types';
import { canPerformAction } from '../types';

export interface WorkUnitActionsProps {
  /**
   * Work unit to perform actions on
   */
  workUnit: WorkUnit;

  /**
   * Current user level
   */
  userLevel: UserLevel;

  /**
   * Handler for running the work unit
   */
  onRun: () => void;

  /**
   * Handler for opening configuration
   */
  onConfigure: () => void;

  /**
   * Handler for opening delegation wizard
   */
  onDelegate: () => void;

  /**
   * Handler for viewing details
   */
  onViewDetails?: () => void;

  /**
   * Handler for deleting the work unit
   */
  onDelete?: () => void;

  /**
   * Whether an action is currently loading
   */
  isLoading?: boolean;

  /**
   * Which action is loading (for showing spinner on specific button)
   */
  loadingAction?: 'run' | 'configure' | 'delegate' | 'delete';

  /**
   * Layout direction
   */
  direction?: 'horizontal' | 'vertical';

  /**
   * Additional CSS classes
   */
  className?: string;
}

interface ActionButtonProps {
  action: 'run' | 'configure' | 'delegate' | 'delete';
  userLevel: UserLevel;
  trustStatus: TrustStatus;
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
}

function ActionButton({
  action,
  userLevel,
  trustStatus,
  onClick,
  isLoading,
  disabled,
  icon: Icon,
  label,
  variant = 'outline',
}: ActionButtonProps) {
  const check = canPerformAction(action, userLevel, trustStatus);
  const isDisabled = disabled || !check.allowed || isLoading;

  const button = (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(isDisabled && 'opacity-50 cursor-not-allowed')}
      aria-label={label}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4 mr-1.5" />
      )}
      {label}
    </Button>
  );

  // Show tooltip with reason when disabled
  if (!check.allowed && check.reason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{check.reason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

/**
 * WorkUnitActions renders action buttons based on user level and trust status.
 *
 * The design follows EATP principles:
 * - Trust gates execution (can't run if trust is invalid)
 * - Level determines visibility (higher levels see more actions)
 * - Clear feedback when actions are disabled
 */
export function WorkUnitActions({
  workUnit,
  userLevel,
  onRun,
  onConfigure,
  onDelegate,
  onDelete,
  isLoading = false,
  loadingAction,
  direction = 'horizontal',
  className,
}: WorkUnitActionsProps) {
  const trustStatus = workUnit.trustInfo?.status || 'pending';

  return (
    <div
      className={cn(
        'flex gap-2',
        direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
      role="group"
      aria-label="Work unit actions"
    >
      {/* Run - Available to all levels (Level 1+) */}
      <ActionButton
        action="run"
        userLevel={userLevel}
        trustStatus={trustStatus}
        onClick={onRun}
        isLoading={isLoading && loadingAction === 'run'}
        icon={Play}
        label="Run"
        variant="default"
      />

      {/* Configure - Level 2+ only */}
      {userLevel >= 2 && (
        <ActionButton
          action="configure"
          userLevel={userLevel}
          trustStatus={trustStatus}
          onClick={onConfigure}
          isLoading={isLoading && loadingAction === 'configure'}
          icon={Settings}
          label="Configure"
        />
      )}

      {/* Delegate - Level 2+ only */}
      {userLevel >= 2 && (
        <ActionButton
          action="delegate"
          userLevel={userLevel}
          trustStatus={trustStatus}
          onClick={onDelegate}
          isLoading={isLoading && loadingAction === 'delegate'}
          icon={Share2}
          label="Delegate"
        />
      )}

      {/* Delete - Level 3+ only */}
      {userLevel >= 3 && onDelete && (
        <ActionButton
          action="delete"
          userLevel={userLevel}
          trustStatus={trustStatus}
          onClick={onDelete}
          isLoading={isLoading && loadingAction === 'delete'}
          icon={Trash2}
          label="Delete"
          variant="destructive"
        />
      )}
    </div>
  );
}

export default WorkUnitActions;
