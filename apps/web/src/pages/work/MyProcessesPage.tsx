/**
 * MyProcessesPage
 *
 * Primary view for Level 2 (Process Owner) users.
 * Shows composite work units (processes) the user can manage,
 * with flow visualization and team activity feed.
 *
 * @see docs/plans/eatp-frontend/05-level-based-experience.md
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Plus, Workflow } from 'lucide-react';
import {
  ProcessCard,
  WorkUnitDetailPanel,
} from '@/features/work-units/components';
import {
  useProcesses,
  useTeamActivity,
  useRunWorkUnit,
  useWorkUnitRuns,
} from '@/features/work-units/hooks';
import { TeamActivityFeed } from '@/features/activity';
import { useUserLevel, ForLevel } from '@/contexts/UserLevelContext';
import type { ProcessResponse } from '@/features/work-units/api/work-units';
import { cn } from '@/lib/utils';

/**
 * Empty state component
 */
function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Workflow className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Loading skeleton for process cards
 */
function ProcessCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

/**
 * MyProcessesPage displays composite work units the user manages.
 *
 * This is the primary interface for Level 2 users (Process Owners).
 * Key features:
 * - Process cards with flow visualization
 * - Team activity feed
 * - Delegation and configuration actions
 */
export function MyProcessesPage() {
  const navigate = useNavigate();
  const { level } = useUserLevel();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<ProcessResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch processes (composite work units)
  const {
    data: processes,
    isLoading: processesLoading,
    error: processesError,
    refetch: refetchProcesses,
  } = useProcesses();

  // Fetch team activity
  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = useTeamActivity(10);

  // Fetch runs for selected process
  const { data: selectedProcessRuns } = useWorkUnitRuns(selectedProcess?.id, 5);

  // Run work unit mutation
  const runMutation = useRunWorkUnit();

  // Filter processes by search query
  const filteredProcesses = processes?.filter((process) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      process.name.toLowerCase().includes(query) ||
      process.description?.toLowerCase().includes(query)
    );
  });

  // Handlers
  const handleProcessClick = useCallback((process: ProcessResponse) => {
    setSelectedProcess(process);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedProcess(null);
  }, []);

  const handleConfigure = useCallback((processId: string) => {
    navigate(`/build/work-units/${processId}/configure`);
  }, [navigate]);

  const handleDelegate = useCallback((processId: string) => {
    navigate(`/trust/delegate/${processId}`);
  }, [navigate]);

  const handleViewRuns = useCallback((processId: string) => {
    navigate(`/work/runs?workUnitId=${processId}`);
  }, [navigate]);

  const handleAudit = useCallback((processId: string) => {
    navigate(`/audit?workUnitId=${processId}`);
  }, [navigate]);

  const handleRun = useCallback((workUnitId: string) => {
    runMutation.mutate({ workUnitId });
  }, [runMutation]);

  const handleViewError = useCallback((runId: string) => {
    navigate(`/work/runs/${runId}`);
  }, [navigate]);

  const handleRetry = useCallback((workUnitId: string) => {
    runMutation.mutate({ workUnitId });
  }, [runMutation]);

  const handleViewAllActivity = useCallback(() => {
    navigate('/audit?type=team');
  }, [navigate]);

  const handleNewProcess = useCallback(() => {
    navigate('/build/work-units?new=composite');
  }, [navigate]);

  const handleViewTrustChain = useCallback(() => {
    if (selectedProcess) {
      navigate(`/trust/${selectedProcess.id}`);
    }
  }, [navigate, selectedProcess]);

  const handleViewRun = useCallback((runId: string) => {
    navigate(`/work/runs/${runId}`);
  }, [navigate]);

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Processes</h1>
              <p className="text-muted-foreground">
                Composite work units you manage
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchProcesses()}
                disabled={processesLoading}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', processesLoading && 'animate-spin')} />
                Refresh
              </Button>
              <ForLevel min={2}>
                <Button size="sm" onClick={handleNewProcess}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Process
                </Button>
              </ForLevel>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search processes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Processes Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Active Processes</h2>
              {processes && processes.length > 0 && (
                <Badge variant="secondary">{processes.length} processes</Badge>
              )}
            </div>

            {processesError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                Failed to load processes. Please try again.
              </div>
            )}

            {processesLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ProcessCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProcesses && filteredProcesses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredProcesses.map((process) => (
                  <ProcessCard
                    key={process.id}
                    process={process}
                    onClick={() => handleProcessClick(process)}
                    onConfigure={() => handleConfigure(process.id)}
                    onDelegate={() => handleDelegate(process.id)}
                    onViewRuns={() => handleViewRuns(process.id)}
                    onAudit={() => handleAudit(process.id)}
                    onRun={() => handleRun(process.id)}
                    isLoading={runMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={searchQuery ? 'No matching processes' : 'No processes yet'}
                description={
                  searchQuery
                    ? 'Try a different search term'
                    : 'Create your first composite work unit to orchestrate multiple tasks'
                }
                action={
                  !searchQuery && (
                    <Button onClick={handleNewProcess}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Process
                    </Button>
                  )
                }
              />
            )}
          </section>
        </div>

        {/* Sidebar - 1/3 width on large screens */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <TeamActivityFeed
              events={activity}
              isLoading={activityLoading}
              error={activityError}
              limit={5}
              onViewError={handleViewError}
              onRetry={handleRetry}
              onViewAll={handleViewAllActivity}
              onRefresh={() => refetchActivity()}
              showViewAll={true}
            />
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedProcess && (
        <WorkUnitDetailPanel
          workUnit={{
            ...selectedProcess,
            type: 'composite',
            capabilities: [],
            createdBy: '',
            createdAt: '',
            updatedAt: '',
          }}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          userLevel={level}
          recentRuns={selectedProcessRuns}
          onRun={() => handleRun(selectedProcess.id)}
          onViewTrustChain={handleViewTrustChain}
          onViewRun={handleViewRun}
          isLoading={runMutation.isPending}
        />
      )}
    </div>
  );
}

export default MyProcessesPage;
