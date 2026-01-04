/**
 * DepartmentFlowVisualization Component
 *
 * Visual representation of department flow in a value chain.
 * Shows departments as connected boxes with trust status indicators.
 */

import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Department, TrustStatus, DepartmentFlowVisualizationProps } from '../../types';

/**
 * Get trust status icon and color
 */
function getTrustStatusDisplay(status: TrustStatus) {
  switch (status) {
    case 'valid':
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-300 dark:border-green-700',
        label: 'Valid',
      };
    case 'expiring':
      return {
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        borderColor: 'border-amber-300 dark:border-amber-700',
        label: 'Expiring Soon',
      };
    case 'expired':
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-red-300 dark:border-red-700',
        label: 'Expired',
      };
    case 'revoked':
      return {
        icon: AlertTriangle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        borderColor: 'border-gray-300 dark:border-gray-700',
        label: 'Revoked',
      };
  }
}

/**
 * DepartmentBox Component
 * Individual department box in the flow
 */
function DepartmentBox({
  department,
  trustStatus,
  compact,
}: {
  department: Department;
  trustStatus: TrustStatus;
  compact?: boolean;
}) {
  const statusDisplay = getTrustStatusDisplay(trustStatus);
  const StatusIcon = statusDisplay.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex flex-col items-center justify-center border-2 rounded-lg transition-colors',
              statusDisplay.bgColor,
              statusDisplay.borderColor,
              compact ? 'px-3 py-2 min-w-[80px]' : 'px-4 py-3 min-w-[120px]'
            )}
            data-testid={`department-box-${department.id}`}
          >
            <span
              className={cn(
                'font-medium text-center',
                compact ? 'text-xs' : 'text-sm'
              )}
            >
              {department.name}
            </span>
            {department.roleLabel && !compact && (
              <span className="text-xs text-muted-foreground mt-0.5">
                ({department.roleLabel})
              </span>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  compact ? 'px-1 py-0 text-[10px]' : 'px-1.5 py-0'
                )}
              >
                {department.workUnitCount} {compact ? 'u' : 'units'}
              </Badge>
              <StatusIcon
                className={cn(
                  statusDisplay.color,
                  compact ? 'h-3 w-3' : 'h-4 w-4'
                )}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{department.name}</p>
            {department.description && (
              <p className="text-xs text-muted-foreground">{department.description}</p>
            )}
            <div className="text-xs space-y-0.5">
              <p>Work Units: {department.workUnitCount}</p>
              <p>Active Users: {department.userCount}</p>
              <p className={statusDisplay.color}>Trust: {statusDisplay.label}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Arrow Component
 * Connecting arrow between departments
 */
function FlowArrow({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center justify-center">
      <ArrowRight
        className={cn(
          'text-muted-foreground',
          compact ? 'h-4 w-4 mx-1' : 'h-5 w-5 mx-2'
        )}
      />
    </div>
  );
}

/**
 * DepartmentFlowVisualization Component
 */
export function DepartmentFlowVisualization({
  departments,
  trustStatus = {},
  compact = false,
  className,
}: DepartmentFlowVisualizationProps) {
  if (!departments || departments.length === 0) {
    return (
      <div
        className={cn('text-sm text-muted-foreground py-4', className)}
        data-testid="department-flow-empty"
      >
        No departments in this value chain
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-y-2',
        compact ? 'gap-x-0' : 'gap-x-1',
        className
      )}
      data-testid="department-flow-visualization"
    >
      {departments.map((department, index) => (
        <div key={department.id} className="flex items-center">
          <DepartmentBox
            department={department}
            trustStatus={trustStatus[department.id] || department.trustStatus}
            compact={compact}
          />
          {index < departments.length - 1 && <FlowArrow compact={compact} />}
        </div>
      ))}
    </div>
  );
}

export default DepartmentFlowVisualization;
