/**
 * ComplianceAlerts Component
 *
 * Display compliance alerts with severity indicators.
 */

import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { ComplianceAlert } from '../../types';

/**
 * Get severity display config
 */
function getSeverityDisplay(severity: ComplianceAlert['severity']) {
  switch (severity) {
    case 'info':
      return {
        icon: Info,
        variant: 'default' as const,
        color: 'text-blue-600',
        bgColor: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        variant: 'default' as const,
        color: 'text-amber-600',
        bgColor: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
      };
    case 'error':
      return {
        icon: AlertCircle,
        variant: 'destructive' as const,
        color: 'text-red-600',
        bgColor: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
      };
    case 'critical':
      return {
        icon: XCircle,
        variant: 'destructive' as const,
        color: 'text-red-700',
        bgColor: 'border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/40',
      };
  }
}

interface ComplianceAlertItemProps {
  alert: ComplianceAlert;
  onAcknowledge?: () => void;
  onNavigate?: () => void;
}

/**
 * Single alert item
 */
function ComplianceAlertItem({
  alert,
  onAcknowledge,
  onNavigate,
}: ComplianceAlertItemProps) {
  const display = getSeverityDisplay(alert.severity);
  const Icon = display.icon;
  const timeAgo = formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true });

  return (
    <Alert
      className={cn(display.bgColor, alert.acknowledged && 'opacity-60')}
      data-testid={`compliance-alert-${alert.id}`}
    >
      <Icon className={cn('h-4 w-4', display.color)} />
      <AlertTitle className="flex items-center justify-between">
        <span>{alert.title}</span>
        <span className="text-xs font-normal text-muted-foreground">{timeAgo}</span>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm">{alert.description}</p>
        <div className="flex items-center gap-2 mt-3">
          {alert.link && onNavigate && (
            <Button variant="outline" size="sm" onClick={onNavigate}>
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details
            </Button>
          )}
          {!alert.acknowledged && onAcknowledge && (
            <Button variant="ghost" size="sm" onClick={onAcknowledge}>
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface ComplianceAlertsProps {
  alerts: ComplianceAlert[];
  onAcknowledge?: (alertId: string) => void;
  onNavigate?: (alertId: string, link: string) => void;
  className?: string;
}

/**
 * ComplianceAlerts Component
 */
export function ComplianceAlerts({
  alerts,
  onAcknowledge,
  onNavigate,
  className,
}: ComplianceAlertsProps) {
  // Filter to show unacknowledged first, then sort by severity
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.acknowledged !== b.acknowledged) {
      return a.acknowledged ? 1 : -1;
    }
    const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Empty state
  if (!alerts || alerts.length === 0) {
    return (
      <div
        className={cn('space-y-2', className)}
        data-testid="compliance-alerts"
      >
        <span className="text-sm font-medium">Compliance Alerts</span>
        <div className="p-4 text-center text-sm text-muted-foreground border rounded-lg">
          No active compliance alerts
        </div>
      </div>
    );
  }

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="compliance-alerts"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Compliance Alerts</span>
        {unacknowledgedCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {unacknowledgedCount} unacknowledged
          </span>
        )}
      </div>

      <div className="space-y-2">
        {sortedAlerts.map((alert) => (
          <ComplianceAlertItem
            key={alert.id}
            alert={alert}
            onAcknowledge={
              onAcknowledge ? () => onAcknowledge(alert.id) : undefined
            }
            onNavigate={
              alert.link && onNavigate
                ? () => onNavigate(alert.id, alert.link!)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

export default ComplianceAlerts;
