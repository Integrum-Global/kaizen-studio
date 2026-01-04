/**
 * WorkUnitGrid Component
 *
 * Displays work units in a responsive grid layout.
 * Handles loading states, empty states, and pagination.
 *
 * @see docs/plans/eatp-frontend/03-work-units-ui.md
 */

import { Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorkUnit, UserLevel } from '../types';
import { WorkUnitCard } from './WorkUnitCard';

export interface WorkUnitGridProps {
  /**
   * Work units to display
   */
  workUnits: WorkUnit[];

  /**
   * Current user level
   */
  userLevel: UserLevel;

  /**
   * Whether data is loading
   */
  isLoading?: boolean;

  /**
   * Whether more items can be loaded
   */
  hasMore?: boolean;

  /**
   * Total number of work units
   */
  total?: number;

  /**
   * Handler for loading more items
   */
  onLoadMore?: () => void;

  /**
   * Handler for clicking a work unit
   */
  onWorkUnitClick?: (workUnit: WorkUnit) => void;

  /**
   * Handler for running a work unit
   */
  onRun?: (workUnit: WorkUnit) => void;

  /**
   * Handler for configuring a work unit
   */
  onConfigure?: (workUnit: WorkUnit) => void;

  /**
   * Handler for delegating a work unit
   */
  onDelegate?: (workUnit: WorkUnit) => void;

  /**
   * Handler for viewing trust details
   */
  onViewTrust?: (workUnit: WorkUnit) => void;

  /**
   * ID of currently loading work unit
   */
  loadingWorkUnitId?: string;

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
 * Empty state component
 */
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      data-testid="work-unit-empty-state"
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {hasFilters ? 'No matching work units' : 'No work units yet'}
      </h3>
      <p className="text-muted-foreground max-w-sm">
        {hasFilters
          ? 'Try adjusting your filters to find what you\'re looking for.'
          : 'Work units will appear here once they are created and assigned to you.'}
      </p>
    </div>
  );
}

/**
 * Loading skeleton for grid items
 */
function LoadingSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[200px] rounded-lg border bg-card animate-pulse"
          data-testid="work-unit-skeleton"
        >
          <div className="p-4 space-y-3">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-2/3 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
            </div>
            <div className="h-10 bg-muted rounded" />
            <div className="flex gap-2">
              <div className="h-8 flex-1 bg-muted rounded" />
              <div className="h-8 flex-1 bg-muted rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * WorkUnitGrid displays work units in a responsive grid.
 *
 * Features:
 * - Responsive grid (1-4 columns based on screen size)
 * - Loading skeletons
 * - Empty state with context-aware messaging
 * - Load more pagination
 * - Status summary
 */
export function WorkUnitGrid({
  workUnits,
  userLevel,
  isLoading = false,
  hasMore = false,
  total,
  onLoadMore,
  onWorkUnitClick,
  onRun,
  onConfigure,
  onDelegate,
  onViewTrust,
  loadingWorkUnitId,
  loadingAction,
  className,
}: WorkUnitGridProps) {
  // Determine if we have active filters (for empty state messaging)
  const hasFilters = false; // Would be passed from parent in real implementation

  if (isLoading && workUnits.length === 0) {
    return <LoadingSkeleton />;
  }

  if (workUnits.length === 0) {
    return <EmptyState hasFilters={hasFilters} />;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Grid */}
      <div
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
        aria-label="Work units"
      >
        {workUnits.map((workUnit) => (
          <div key={workUnit.id} role="listitem">
            <WorkUnitCard
              workUnit={workUnit}
              userLevel={userLevel}
              onClick={() => onWorkUnitClick?.(workUnit)}
              onRun={() => onRun?.(workUnit)}
              onConfigure={() => onConfigure?.(workUnit)}
              onDelegate={() => onDelegate?.(workUnit)}
              onViewTrust={() => onViewTrust?.(workUnit)}
              isLoading={loadingWorkUnitId === workUnit.id}
              loadingAction={loadingWorkUnitId === workUnit.id ? loadingAction : undefined}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Count */}
        <p className="text-sm text-muted-foreground">
          Showing {workUnits.length}
          {total !== undefined && total > workUnits.length && ` of ${total}`} work units
        </p>

        {/* Load More */}
        {hasMore && onLoadMore && (
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
            data-testid="load-more-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default WorkUnitGrid;
