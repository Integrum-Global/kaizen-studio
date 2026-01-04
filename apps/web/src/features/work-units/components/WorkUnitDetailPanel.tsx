/**
 * WorkUnitDetailPanel Component
 *
 * Slide-over panel showing full work unit details.
 * Content varies based on user level:
 * - Level 1: Simplified view (name, description, capabilities, recent results)
 * - Level 2+: Full view (add trust section, constraints, sub-units)
 *
 * @see docs/plans/eatp-frontend/03-work-units-ui.md
 */

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Settings,
  Share2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import type { WorkUnit, UserLevel, RunResult, SubUnit } from '../types';
import { WorkUnitIcon } from './WorkUnitIcon';
import { TrustStatusBadge } from './TrustStatusBadge';
import { CapabilityTags } from './CapabilityTags';
import { ForLevel } from '@/contexts/UserLevelContext';

export interface WorkUnitDetailPanelProps {
  /**
   * Work unit to display
   */
  workUnit: WorkUnit | null;

  /**
   * Whether the panel is open
   */
  isOpen: boolean;

  /**
   * Handler for closing the panel
   */
  onClose: () => void;

  /**
   * Current user level
   */
  userLevel: UserLevel;

  /**
   * Recent run results
   */
  recentRuns?: RunResult[];

  /**
   * Handler for running the work unit
   */
  onRun?: () => void;

  /**
   * Handler for opening configuration
   */
  onConfigure?: () => void;

  /**
   * Handler for opening delegation wizard
   */
  onDelegate?: () => void;

  /**
   * Handler for viewing trust chain
   */
  onViewTrustChain?: () => void;

  /**
   * Handler for viewing a run result
   */
  onViewRun?: (runId: string) => void;

  /**
   * Whether an action is loading
   */
  isLoading?: boolean;
}

/**
 * Format timestamp as relative time
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
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Run status badge component
 */
function RunStatusBadge({ status }: { status: RunResult['status'] }) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    case 'running':
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
          Cancelled
        </Badge>
      );
    default:
      return null;
  }
}

/**
 * Sub-unit list item
 */
function SubUnitItem({ subUnit }: { subUnit: SubUnit }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <WorkUnitIcon type={subUnit.type} size="sm" />
        <span className="text-sm font-medium">{subUnit.name}</span>
      </div>
      <TrustStatusBadge status={subUnit.trustStatus} size="sm" />
    </div>
  );
}

/**
 * WorkUnitDetailPanel provides detailed view of a work unit.
 *
 * The panel adapts to user level:
 * - Level 1 sees simplified "What it can do" section
 * - Level 2+ sees full capabilities, trust chain, constraints
 */
export function WorkUnitDetailPanel({
  workUnit,
  isOpen,
  onClose,
  userLevel,
  recentRuns = [],
  onRun,
  onConfigure,
  onDelegate,
  onViewTrustChain,
  onViewRun,
  isLoading = false,
}: WorkUnitDetailPanelProps) {
  if (!workUnit) return null;

  const trustStatus = workUnit.trustInfo?.status || 'pending';
  const isComposite = workUnit.type === 'composite';
  const canRun = trustStatus === 'valid';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <WorkUnitIcon type={workUnit.type} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <SheetTitle className="text-xl">{workUnit.name}</SheetTitle>
                <TrustStatusBadge
                  status={trustStatus}
                  expiresAt={workUnit.trustInfo?.expiresAt}
                  showExpiry
                  onClick={onViewTrustChain}
                />
              </div>
              <SheetDescription className="mt-1">
                {isComposite ? 'Composite Work Unit' : 'Atomic Work Unit'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-12rem)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Description */}
            {workUnit.description && (
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  DESCRIPTION
                </h3>
                <p className="text-sm">{workUnit.description}</p>
              </section>
            )}

            <Separator />

            {/* Capabilities - different labels by level */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {userLevel === 1 ? 'WHAT IT CAN DO' : 'CAPABILITIES'}
              </h3>
              {userLevel === 1 ? (
                // Simplified list for Level 1
                <ul className="space-y-1.5">
                  {workUnit.capabilities.map((cap) => (
                    <li key={cap} className="text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {cap.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </li>
                  ))}
                </ul>
              ) : (
                // Full capability tags for Level 2+
                <CapabilityTags
                  capabilities={workUnit.capabilities}
                  maxVisible={10}
                />
              )}
            </section>

            {/* Trust Section - Level 2+ only */}
            <ForLevel min={2}>
              <Separator />
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  TRUST
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <TrustStatusBadge status={trustStatus} />
                  </div>
                  {workUnit.trustInfo?.expiresAt && trustStatus === 'valid' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Expires</span>
                      <span className="text-sm">
                        {new Date(workUnit.trustInfo.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {workUnit.trustInfo?.delegatedBy && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Delegated by</span>
                      <span className="text-sm">
                        {workUnit.trustInfo.delegatedBy.userName}
                        {workUnit.trustInfo.delegatedBy.role && (
                          <span className="text-muted-foreground"> ({workUnit.trustInfo.delegatedBy.role})</span>
                        )}
                      </span>
                    </div>
                  )}
                  {onViewTrustChain && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between mt-2"
                      onClick={onViewTrustChain}
                    >
                      View Trust Chain
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </section>
            </ForLevel>

            {/* Sub-units - Composite only, Level 2+ */}
            {isComposite && workUnit.subUnits && workUnit.subUnits.length > 0 && (
              <ForLevel min={2}>
                <Separator />
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      SUB-UNITS ({workUnit.subUnits.length})
                    </h3>
                  </div>
                  <div className="space-y-1 bg-muted/30 rounded-lg p-2">
                    {workUnit.subUnits.map((subUnit) => (
                      <SubUnitItem key={subUnit.id} subUnit={subUnit} />
                    ))}
                  </div>
                </section>
              </ForLevel>
            )}

            <Separator />

            {/* Recent Runs */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {userLevel === 1 ? 'RECENT RESULTS' : 'RECENT RUNS'}
              </h3>
              {recentRuns.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No recent runs
                </p>
              ) : (
                <div className="space-y-2">
                  {recentRuns.slice(0, 5).map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => onViewRun?.(run.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-3">
                        <RunStatusBadge status={run.status} />
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(run.startedAt)}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
          {userLevel === 1 ? (
            // Level 1: Single prominent Run button
            <Button
              className="w-full"
              size="lg"
              onClick={onRun}
              disabled={!canRun || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Now
            </Button>
          ) : (
            // Level 2+: Multiple action buttons
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={onRun}
                disabled={!canRun || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Run
              </Button>
              <Button variant="outline" onClick={onConfigure}>
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button variant="outline" onClick={onDelegate} disabled={!canRun}>
                <Share2 className="w-4 h-4 mr-2" />
                Delegate
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default WorkUnitDetailPanel;
