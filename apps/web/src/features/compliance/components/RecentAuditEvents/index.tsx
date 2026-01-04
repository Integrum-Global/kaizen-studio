/**
 * RecentAuditEvents Component
 *
 * List of recent audit events with icons and descriptions.
 */

import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2,
  ArrowRightLeft,
  XCircle,
  Shield,
  AlertTriangle,
  RefreshCw,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AuditEvent, AuditEventType } from '../../types';

/**
 * Get event icon and color
 */
function getEventDisplay(type: AuditEventType) {
  switch (type) {
    case 'ESTABLISH':
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      };
    case 'DELEGATE':
      return {
        icon: ArrowRightLeft,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      };
    case 'REVOKE':
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
      };
    case 'VERIFY':
      return {
        icon: Shield,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      };
    case 'VIOLATION':
      return {
        icon: AlertTriangle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      };
    case 'RENEW':
      return {
        icon: RefreshCw,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      };
    case 'EXPIRE':
      return {
        icon: Clock,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      };
  }
}

interface AuditEventItemProps {
  event: AuditEvent;
  onClick?: () => void;
}

/**
 * Single audit event item
 */
function AuditEventItem({ event, onClick }: AuditEventItemProps) {
  const display = getEventDisplay(event.type);
  const Icon = display.icon;
  const timeAgo = formatDistanceToNow(new Date(event.timestamp), { addSuffix: true });

  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
        'hover:bg-muted/50',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
      data-testid={`audit-event-${event.id}`}
    >
      <div className={cn('p-2 rounded-full flex-shrink-0', display.bgColor)}>
        <Icon className={cn('h-4 w-4', display.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{event.actorName}</span>
          {event.departmentName && (
            <>
              <span>·</span>
              <span>{event.departmentName}</span>
            </>
          )}
        </div>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo}</span>
    </button>
  );
}

interface RecentAuditEventsProps {
  events: AuditEvent[];
  onEventClick?: (eventId: string) => void;
  onViewAll?: () => void;
  className?: string;
}

/**
 * RecentAuditEvents Component
 */
export function RecentAuditEvents({
  events,
  onEventClick,
  onViewAll,
  className,
}: RecentAuditEventsProps) {
  // Empty state
  if (!events || events.length === 0) {
    return (
      <div
        className={cn('space-y-2', className)}
        data-testid="recent-audit-events"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Recent Audit Events</span>
        </div>
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground border rounded-lg">
          No recent audit events
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-2', className)}
      data-testid="recent-audit-events"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Recent Audit Events</span>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View Full Audit Trail
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-1 border rounded-lg p-1">
        {events.map((event) => (
          <AuditEventItem
            key={event.id}
            event={event}
            onClick={onEventClick ? () => onEventClick(event.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export default RecentAuditEvents;
