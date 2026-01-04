/**
 * ProcessCard Component
 *
 * Extended work unit card for composite work units (processes).
 * Shows flow preview, delegation info, team size, and activity stats.
 *
 * @see docs/plans/eatp-ontology/02-work-unit-model.md
 */

import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Settings,
  Share2,
  Play,
  History,
  Users,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import { WorkUnitIcon } from './WorkUnitIcon';
import { TrustStatusBadge } from './TrustStatusBadge';
import { ProcessFlowPreview } from './ProcessFlowPreview';
import type { TrustStatus, SubUnit } from '../types';

interface ProcessCardProps {
  /** The composite work unit (process) to display */
  process: {
    id: string;
    name: string;
    description?: string;
    subUnits?: SubUnit[];
    delegatedBy?: { id: string; name: string };
    teamSize?: number;
    runsToday?: number;
    errorsToday?: number;
    trustInfo?: {
      status: TrustStatus;
      expiresAt?: string;
    };
  };
  /** Configure process handler */
  onConfigure: () => void;
  /** Delegate process handler */
  onDelegate: () => void;
  /** View runs handler */
  onViewRuns: () => void;
  /** Audit trail handler (optional) */
  onAudit?: () => void;
  /** Optional run handler */
  onRun?: () => void;
  /** Optional card click handler */
  onClick?: () => void;
  /** Whether the card is in a loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Stat badge for runs/errors
 */
function StatBadge({
  icon: Icon,
  value,
  label,
  variant = 'default',
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  variant?: 'default' | 'success' | 'error';
}) {
  const colors = {
    default: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-500',
    error: 'text-red-600 dark:text-red-500',
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1 text-sm', colors[variant])}>
            <Icon className="w-4 h-4" />
            <span className="font-medium">{value}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * ProcessCard displays a composite work unit with its flow and stats.
 *
 * Key features:
 * - Inline flow visualization of sub-units
 * - Delegation info (who delegated trust)
 * - Team size indicator
 * - Activity stats (runs today, errors)
 * - Action buttons (Configure, Delegate, View Runs, Audit)
 */
export function ProcessCard({
  process,
  onConfigure,
  onDelegate,
  onViewRuns,
  onAudit: _onAudit,
  onRun,
  onClick,
  isLoading,
  className,
}: ProcessCardProps) {
  // Note: onAudit is available for future audit button
  void _onAudit;
  const trustStatus: TrustStatus = process.trustInfo?.status || 'pending';
  const canRun = trustStatus === 'valid' && !isLoading;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
      data-testid="process-card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <WorkUnitIcon type="composite" size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-lg truncate">{process.name}</h3>
              <TrustStatusBadge
                status={trustStatus}
                expiresAt={process.trustInfo?.expiresAt}
                size="sm"
              />
            </div>
            {process.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {process.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Flow Preview */}
        {process.subUnits && process.subUnits.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-3" data-testid="process-flow-section">
            <ProcessFlowPreview
              subUnits={process.subUnits}
              compact
              maxNodes={4}
            />
          </div>
        )}

        {/* Info Row */}
        <div className="flex items-center justify-between text-sm">
          {/* Trust/Delegation Info */}
          <div className="flex items-center gap-2">
            {process.delegatedBy ? (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <span>Valid from {process.delegatedBy.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Trust delegated by {process.delegatedBy.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span className="text-muted-foreground">No delegation</span>
            )}
          </div>

          {/* Team Size */}
          {process.teamSize !== undefined && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{process.teamSize}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{process.teamSize} team member{process.teamSize !== 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-3">
            <StatBadge
              icon={CheckCircle}
              value={process.runsToday ?? 0}
              label={`${process.runsToday ?? 0} run${(process.runsToday ?? 0) !== 1 ? 's' : ''} today`}
              variant="success"
            />
            {(process.errorsToday ?? 0) > 0 && (
              <StatBadge
                icon={AlertCircle}
                value={process.errorsToday ?? 0}
                label={`${process.errorsToday ?? 0} error${(process.errorsToday ?? 0) !== 1 ? 's' : ''} today`}
                variant="error"
              />
            )}
          </div>
          {process.subUnits && process.subUnits.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {process.subUnits.length} step{process.subUnits.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t bg-muted/20">
        <div className="flex items-center gap-2 w-full">
          {onRun && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRun();
              }}
              disabled={!canRun}
              data-testid="process-run-btn"
            >
              <Play className="w-4 h-4 mr-1" />
              Run
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure();
            }}
            data-testid="process-configure-btn"
          >
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelegate();
            }}
            disabled={trustStatus !== 'valid'}
            data-testid="process-delegate-btn"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Delegate
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewRuns();
            }}
            data-testid="process-runs-btn"
          >
            <History className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default ProcessCard;
