/**
 * EnterpriseOverview Component
 *
 * Dashboard cards showing enterprise-wide trust metrics.
 * Displays active trust, expiring trust, and issues counts.
 */

import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { EnterpriseOverviewProps } from '../../types';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'amber' | 'red';
  onClick?: () => void;
  testId: string;
}

/**
 * Individual metric card
 */
function MetricCard({ title, value, icon, color, onClick, testId }: MetricCardProps) {
  const colorClasses = {
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      icon: 'text-green-600',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      icon: 'text-amber-600',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      icon: 'text-red-600',
    },
  };

  const classes = colorClasses[color];

  return (
    <Card
      className={cn(
        'border-2 transition-all',
        classes.bg,
        classes.border,
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onClick}
      data-testid={testId}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
        <div className={cn('mb-2', classes.icon)}>{icon}</div>
        <p className={cn('text-3xl font-bold', classes.text)}>{value.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  );
}

/**
 * EnterpriseOverview Component
 */
export function EnterpriseOverview({
  metrics,
  onActiveTrustClick,
  onExpiringClick,
  onIssuesClick,
  className,
}: EnterpriseOverviewProps) {
  return (
    <div className={cn('space-y-3', className)} data-testid="enterprise-overview">
      <h3 className="text-sm font-medium text-muted-foreground">Enterprise Trust Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Active Trust"
          value={metrics.activeTrust}
          icon={<CheckCircle2 className="h-6 w-6" />}
          color="green"
          onClick={onActiveTrustClick}
          testId="active-trust-card"
        />
        <MetricCard
          title="Expiring Soon"
          value={metrics.expiringTrust}
          icon={<Clock className="h-6 w-6" />}
          color="amber"
          onClick={onExpiringClick}
          testId="expiring-trust-card"
        />
        <MetricCard
          title="Issues"
          value={metrics.issues}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="red"
          onClick={onIssuesClick}
          testId="issues-card"
        />
      </div>
      <div className="text-xs text-muted-foreground text-center">
        {metrics.valueChainCount} value chains · {metrics.departmentCount} departments · {metrics.workUnitCount} work units · {metrics.userCount} users
      </div>
    </div>
  );
}

export default EnterpriseOverview;
