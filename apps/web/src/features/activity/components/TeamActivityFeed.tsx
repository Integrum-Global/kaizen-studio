/**
 * TeamActivityFeed Component
 *
 * Real-time activity feed showing team member actions.
 * Displays execution events, delegation events, and errors.
 *
 * @see docs/plans/eatp-ontology/03-user-experience-levels.md
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Share2,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { ActivityEvent } from '@/features/work-units/api/work-units';

interface TeamActivityFeedProps {
  /** Activity events to display */
  events?: ActivityEvent[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Maximum events to show */
  limit?: number;
  /** Handler for viewing an error */
  onViewError?: (runId: string) => void;
  /** Handler for retrying a failed run */
  onRetry?: (workUnitId: string) => void;
  /** Handler for viewing all activity */
  onViewAll?: () => void;
  /** Handler for refreshing */
  onRefresh?: () => void;
  /** Show "View All" button */
  showViewAll?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Configuration for activity event display
 */
const eventConfig = {
  run: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'started',
    animate: true,
  },
  completion: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'completed',
    animate: false,
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'failed',
    animate: false,
  },
  delegation: {
    icon: Share2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'delegated',
    animate: false,
  },
};

/**
 * Format relative time string
 */
function formatRelativeTime(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

/**
 * Single activity event item
 */
function ActivityItem({
  event,
  onViewError,
  onRetry,
}: {
  event: ActivityEvent;
  onViewError?: (runId: string) => void;
  onRetry?: (workUnitId: string) => void;
}) {
  const config = eventConfig[event.type];
  const Icon = config.icon;

  return (
    <div
      className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors rounded-lg"
      data-testid={`activity-item-${event.id}`}
    >
      <div className={cn('p-1.5 rounded-full', config.bgColor)}>
        <Icon
          className={cn(
            'w-4 h-4',
            config.color,
            config.animate && 'animate-spin'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{event.userName}</span>{' '}
          <span className="text-muted-foreground">{config.label}</span>{' '}
          <span className="font-medium">{event.workUnitName}</span>
          {event.type === 'delegation' && event.details?.delegateeName && (
            <>
              <span className="text-muted-foreground"> to </span>
              <span className="font-medium">{event.details.delegateeName}</span>
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatRelativeTime(event.timestamp)}
        </p>
        {event.type === 'error' && event.details?.errorMessage && (
          <p className="text-xs text-red-600 mt-1 line-clamp-1">
            {event.details.errorMessage}
          </p>
        )}
      </div>
      {event.type === 'error' && (
        <div className="flex items-center gap-1">
          {onViewError && event.details?.runId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onViewError(event.details!.runId!)}
            >
              View Error
            </Button>
          )}
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onRetry(event.workUnitId)}
            >
              Retry
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for activity items
 */
function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

/**
 * Empty state when no activity
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">No recent activity</p>
      <p className="text-xs text-muted-foreground mt-1">
        Team activity will appear here
      </p>
    </div>
  );
}

/**
 * TeamActivityFeed displays a real-time feed of team activity.
 *
 * Key features:
 * - Different event types (run, completion, error, delegation)
 * - Relative timestamps with auto-refresh
 * - Error actions (View Error, Retry)
 * - View All link for full activity page
 */
export function TeamActivityFeed({
  events,
  isLoading,
  error,
  limit = 5,
  onViewError,
  onRetry,
  onViewAll,
  onRefresh,
  showViewAll = true,
  className,
}: TeamActivityFeedProps) {
  const displayEvents = events?.slice(0, limit) || [];

  if (error) {
    return (
      <div className={cn('rounded-lg border p-4', className)}>
        <div className="flex items-center justify-between text-red-600">
          <p className="text-sm">Failed to load activity</p>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border', className)} data-testid="team-activity-feed">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold">Team Activity</h3>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
          )}
          {showViewAll && onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="divide-y">
        {isLoading ? (
          <>
            <ActivitySkeleton />
            <ActivitySkeleton />
            <ActivitySkeleton />
          </>
        ) : displayEvents.length > 0 ? (
          displayEvents.map((event) => (
            <ActivityItem
              key={event.id}
              event={event}
              onViewError={onViewError}
              onRetry={onRetry}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

export default TeamActivityFeed;
