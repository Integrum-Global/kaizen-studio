/**
 * ValueChainCard Component
 *
 * Card displaying a value chain with department flow,
 * trust health, and action buttons.
 */

import { formatDistanceToNow } from 'date-fns';
import {
  GitBranch,
  Network,
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Users,
  Building2,
  Boxes,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DepartmentFlowVisualization } from '../DepartmentFlowVisualization';
import type { ValueChain, ValueChainCardProps, TrustStatus } from '../../types';

/**
 * Get status badge variant and label
 */
function getStatusBadge(status: ValueChain['status']) {
  switch (status) {
    case 'active':
      return { variant: 'default' as const, label: 'Active' };
    case 'paused':
      return { variant: 'secondary' as const, label: 'Paused' };
    case 'archived':
      return { variant: 'outline' as const, label: 'Archived' };
  }
}

/**
 * Get trust health display
 */
function getTrustHealthDisplay(status: TrustStatus) {
  switch (status) {
    case 'valid':
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        label: 'All chains valid',
      };
    case 'expiring':
      return {
        icon: Clock,
        color: 'text-amber-600',
        label: 'Some chains expiring',
      };
    case 'expired':
      return {
        icon: XCircle,
        color: 'text-red-600',
        label: 'Chains expired',
      };
    case 'revoked':
      return {
        icon: AlertTriangle,
        color: 'text-gray-600',
        label: 'Chains revoked',
      };
  }
}

/**
 * Trust health summary component
 */
function TrustHealthSummary({ health, className }: { health: ValueChain['trustHealth']; className?: string }) {
  const display = getTrustHealthDisplay(health.status);
  const Icon = display.icon;

  const hasIssues = health.expiring > 0 || health.expired > 0 || health.revoked > 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon className={cn('h-4 w-4', display.color)} />
      <span className="text-sm">{display.label}</span>
      {hasIssues && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs ml-1">
                {health.expiring > 0 && `${health.expiring} expiring`}
                {health.expired > 0 && ` ${health.expired} expired`}
                {health.revoked > 0 && ` ${health.revoked} revoked`}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <p>Valid: {health.valid}</p>
                {health.expiring > 0 && <p className="text-amber-600">Expiring: {health.expiring}</p>}
                {health.expired > 0 && <p className="text-red-600">Expired: {health.expired}</p>}
                {health.revoked > 0 && <p className="text-gray-600">Revoked: {health.revoked}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

/**
 * Metrics row component
 */
function MetricsRow({ metrics, className }: { metrics: ValueChain['metrics']; className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 text-sm text-muted-foreground', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span>{metrics.departmentCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Departments: {metrics.departmentCount}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Boxes className="h-4 w-4" />
              <span>{metrics.workUnitCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Work Units: {metrics.workUnitCount}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{metrics.userCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Active Users: {metrics.userCount}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

/**
 * ValueChainCard Component
 */
export function ValueChainCard({
  valueChain,
  onViewChain,
  onTrustMap,
  onCompliance,
  onAudit,
}: ValueChainCardProps) {
  const statusBadge = getStatusBadge(valueChain.status);
  const lastAudit = formatDistanceToNow(new Date(valueChain.lastAuditAt), { addSuffix: true });

  // Check if there are trust issues requiring attention
  const hasWarning =
    valueChain.trustHealth.expiring > 0 ||
    valueChain.trustHealth.expired > 0;

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        hasWarning && 'border-amber-300 dark:border-amber-700'
      )}
      data-testid={`value-chain-card-${valueChain.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{valueChain.name}</h3>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{valueChain.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Department Flow Visualization */}
        <DepartmentFlowVisualization
          departments={valueChain.departments}
          compact
        />

        {/* Metrics Row */}
        <MetricsRow metrics={valueChain.metrics} />

        {/* Trust Health and Last Audit */}
        <div className="flex items-center justify-between pt-2 border-t">
          <TrustHealthSummary health={valueChain.trustHealth} />
          <span className="text-xs text-muted-foreground">
            Audit: {lastAudit}
          </span>
        </div>

        {/* Warning banner if expiring trust */}
        {hasWarning && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              {valueChain.trustHealth.expiring} units have expiring trust
              {valueChain.trustHealth.expired > 0 && `, ${valueChain.trustHealth.expired} expired`}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewChain}
          data-testid="view-chain-button"
        >
          <GitBranch className="h-4 w-4 mr-1" />
          View Chain
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onTrustMap}
          data-testid="trust-map-button"
        >
          <Network className="h-4 w-4 mr-1" />
          Trust Map
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCompliance}
          data-testid="compliance-button"
        >
          <Shield className="h-4 w-4 mr-1" />
          Compliance
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onAudit}
          data-testid="audit-button"
        >
          <FileText className="h-4 w-4 mr-1" />
          Audit
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ValueChainCard;
