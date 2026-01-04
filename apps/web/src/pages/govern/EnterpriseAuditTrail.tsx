/**
 * EnterpriseAuditTrail Page
 *
 * Level 3 (Value Chain Owner) page for viewing enterprise audit trail.
 * Shows all trust operations with filtering and export functionality.
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Download,
  RefreshCw,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowRightLeft,
  XCircle,
  Shield,
  AlertTriangle,
  RefreshCcw,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAuditEvents,
  useExportAuditTrail,
} from '@/features/compliance';
import type { ComplianceFilter, AuditEvent, AuditEventType } from '@/features/compliance';
import { cn } from '@/lib/utils';

/**
 * Get event icon and color
 */
function getEventDisplay(type: AuditEventType) {
  switch (type) {
    case 'ESTABLISH':
      return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' };
    case 'DELEGATE':
      return { icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-100' };
    case 'REVOKE':
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
    case 'VERIFY':
      return { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' };
    case 'VIOLATION':
      return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' };
    case 'RENEW':
      return { icon: RefreshCcw, color: 'text-green-600', bg: 'bg-green-100' };
    case 'EXPIRE':
      return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' };
  }
}

/**
 * Audit event row component
 */
function AuditEventRow({
  event,
  expanded,
  onToggle,
}: {
  event: AuditEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const display = getEventDisplay(event.type);
  const Icon = display.icon;

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        expanded && 'ring-2 ring-primary'
      )}
      onClick={onToggle}
      data-testid={`audit-event-row-${event.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn('p-2 rounded-full', display.bg)}>
            <Icon className={cn('h-5 w-5', display.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{event.type}</Badge>
                {event.departmentName && (
                  <Badge variant="secondary">{event.departmentName}</Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(event.timestamp), 'PPp')}
              </span>
            </div>
            <p className="mt-1 text-sm">{event.description}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>By: {event.actorName}</span>
              {event.targetName && <span>To: {event.targetName}</span>}
              {event.valueChainName && <span>Chain: {event.valueChainName}</span>}
            </div>

            {/* Expanded details */}
            {expanded && event.metadata && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-xs">
                <p className="font-medium mb-2">Additional Details</p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Pagination component
 */
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

const EVENT_TYPES: { value: AuditEventType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'ESTABLISH', label: 'Establish' },
  { value: 'DELEGATE', label: 'Delegate' },
  { value: 'REVOKE', label: 'Revoke' },
  { value: 'VERIFY', label: 'Verify' },
  { value: 'VIOLATION', label: 'Violation' },
  { value: 'RENEW', label: 'Renew' },
  { value: 'EXPIRE', label: 'Expire' },
];

/**
 * EnterpriseAuditTrail Component
 */
export function EnterpriseAuditTrail() {
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId');

  // Filter state
  const [filter, setFilter] = useState<ComplianceFilter>({
    type: 'all',
    searchQuery: '',
  });
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({ start: undefined, end: undefined });
  const [page, setPage] = useState(1);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(
    initialEventId
  );

  const pageSize = 20;

  // Build full filter with date range
  const fullFilter = useMemo<ComplianceFilter>(() => {
    const f: ComplianceFilter = { ...filter };
    if (dateRange.start && dateRange.end) {
      f.dateRange = {
        start: format(dateRange.start, 'yyyy-MM-dd'),
        end: format(dateRange.end, 'yyyy-MM-dd'),
      };
    }
    return f;
  }, [filter, dateRange]);

  // Fetch audit events
  const { data, isLoading, refetch } = useAuditEvents(fullFilter, page, pageSize);

  // Export mutation
  const exportAudit = useExportAuditTrail();

  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  // Handlers
  const handleSearchChange = (value: string) => {
    setFilter((prev) => ({ ...prev, searchQuery: value }));
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setFilter((prev) => ({
      ...prev,
      type: value as AuditEventType | 'all',
    }));
    setPage(1);
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    exportAudit.mutate({ filter: fullFilter, format });
  };

  const handleToggleExpand = (eventId: string) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  };

  return (
    <div className="space-y-6 p-6" data-testid="enterprise-audit-trail">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Complete history of trust operations across the organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Select onValueChange={(format) => handleExport(format as 'csv' | 'pdf')}>
            <SelectTrigger className="w-[120px]">
              <Download className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="pdf">Export PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={filter.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filter.type || 'all'} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              {dateRange.start && dateRange.end
                ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`
                : 'Date Range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: dateRange.start,
                to: dateRange.end,
              }}
              onSelect={(range) => {
                setDateRange({
                  start: range?.from,
                  end: range?.to,
                });
                setPage(1);
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {(filter.searchQuery || filter.type !== 'all' || dateRange.start) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilter({ type: 'all', searchQuery: '' });
              setDateRange({ start: undefined, end: undefined });
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results summary */}
      <div className="text-sm text-muted-foreground">
        {total} event{total !== 1 ? 's' : ''} found
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No audit events found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or date range
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event: AuditEvent) => (
            <AuditEventRow
              key={event.id}
              event={event}
              expanded={expandedEventId === event.id}
              onToggle={() => handleToggleExpand(event.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}

export default EnterpriseAuditTrail;
