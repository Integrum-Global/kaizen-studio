/**
 * ComplianceDashboard Page
 *
 * Level 3 (Value Chain Owner) page for monitoring compliance.
 * Shows trust health, constraint violations, and audit events.
 */

import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, RefreshCw, CalendarDays, Filter } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  TrustHealthBar,
  ConstraintViolationsChart,
  RecentAuditEvents,
  ComplianceAlerts,
  useComplianceDashboard,
  useAcknowledgeAlert,
  useExportComplianceReport,
} from '@/features/compliance';
import type { ComplianceFilter, ExportFormat } from '@/features/compliance';

/**
 * Date range presets
 */
const DATE_PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Custom', value: 'custom' },
];

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

/**
 * ComplianceDashboard Component
 */
export function ComplianceDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const valueChainId = searchParams.get('valueChainId') ?? undefined;

  // Date range state
  const [datePreset, setDatePreset] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({ start: undefined, end: undefined });

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = endOfDay(new Date());
    let start: Date;

    switch (datePreset) {
      case '7d':
        start = startOfDay(subDays(new Date(), 7));
        break;
      case '30d':
        start = startOfDay(subDays(new Date(), 30));
        break;
      case '90d':
        start = startOfDay(subDays(new Date(), 90));
        break;
      case 'custom':
        start = customDateRange.start || startOfDay(subDays(new Date(), 30));
        break;
      default:
        start = startOfDay(subDays(new Date(), 30));
    }

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    };
  }, [datePreset, customDateRange.start]);

  // Build filter
  const filter: Partial<ComplianceFilter> = useMemo(
    () => ({
      valueChainId,
      dateRange,
    }),
    [valueChainId, dateRange]
  );

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useComplianceDashboard(filter);

  // Mutations
  const acknowledgeAlert = useAcknowledgeAlert();
  const exportReport = useExportComplianceReport();

  // Handlers
  const handleRefresh = () => {
    refetch();
  };

  const handleExport = (format: ExportFormat) => {
    exportReport.mutate({
      format,
      filter: filter as ComplianceFilter,
      includeAuditEvents: true,
      includeViolations: true,
      includeTrustHealth: true,
    });
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeAlert.mutate(alertId);
  };

  const handleAlertNavigate = (_alertId: string, link: string) => {
    navigate(link);
  };

  const handleWeekClick = (week: string) => {
    navigate(`/govern/activity?week=${week}`);
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/govern/activity?eventId=${eventId}`);
  };

  const handleViewAllAudit = () => {
    navigate('/govern/activity');
  };

  return (
    <div className="space-y-6 p-6" data-testid="compliance-dashboard">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor trust health and constraint violations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Select onValueChange={(format) => handleExport(format as ExportFormat)}>
            <SelectTrigger className="w-[140px]">
              <Download className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">Export PDF</SelectItem>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="json">Export JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[150px]">
              <CalendarDays className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {datePreset === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  {customDateRange.start && customDateRange.end
                    ? `${format(customDateRange.start, 'MMM d')} - ${format(customDateRange.end, 'MMM d')}`
                    : 'Select dates'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: customDateRange.start,
                    to: customDateRange.end,
                  }}
                  onSelect={(range) =>
                    setCustomDateRange({
                      start: range?.from,
                      end: range?.to,
                    })
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : dashboardData ? (
        <div className="space-y-6">
          {/* Compliance Alerts */}
          {dashboardData.alerts && dashboardData.alerts.length > 0 && (
            <ComplianceAlerts
              alerts={dashboardData.alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onNavigate={handleAlertNavigate}
            />
          )}

          {/* Trust Health Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Trust Health</CardTitle>
            </CardHeader>
            <CardContent>
              <TrustHealthBar
                valid={dashboardData.trustHealth.valid}
                expiring={dashboardData.trustHealth.expiring}
                expired={dashboardData.trustHealth.expired}
                revoked={dashboardData.trustHealth.revoked}
              />
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Constraint Violations Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Constraint Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <ConstraintViolationsChart
                  data={dashboardData.weeklyViolations}
                  onWeekClick={handleWeekClick}
                />
              </CardContent>
            </Card>

            {/* Recent Audit Events */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentAuditEvents
                  events={dashboardData.recentEvents}
                  onEventClick={handleEventClick}
                  onViewAll={handleViewAllAudit}
                />
              </CardContent>
            </Card>
          </div>

          {/* Last Updated */}
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {format(new Date(dashboardData.lastUpdated), 'PPpp')}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No compliance data available
        </div>
      )}
    </div>
  );
}

export default ComplianceDashboard;
