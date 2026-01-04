/**
 * MyTasksPage
 *
 * Primary view for Level 1 (Task Performer) users.
 * Shows available tasks and recent results in a clean, simple interface.
 *
 * @see docs/plans/eatp-frontend/05-level-based-experience.md
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, CheckCircle, XCircle, Loader2, ChevronRight } from 'lucide-react';
import {
  WorkUnitCard,
  WorkUnitDetailPanel,
} from '@/features/work-units/components';
import {
  useAvailableTasks,
  useUserRecentRuns,
  useRunWorkUnit,
  useWorkUnitRuns,
} from '@/features/work-units/hooks';
import { useUserLevel } from '@/contexts/UserLevelContext';
import type { WorkUnit, RunResult } from '@/features/work-units/types';
import { cn } from '@/lib/utils';

/**
 * Empty state component
 */
function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Search className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {description}
      </p>
    </div>
  );
}

/**
 * Loading skeleton for task cards
 */
function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Run result item component
 */
function RecentRunItem({
  run,
  workUnitName,
  onClick,
}: {
  run: RunResult;
  workUnitName?: string;
  onClick: () => void;
}) {
  const statusConfig: Record<string, {
    icon: typeof CheckCircle;
    color: string;
    bgColor: string;
    label: string;
    animate?: boolean;
  }> = {
    completed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Completed',
    },
    failed: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: 'Failed',
    },
    running: {
      icon: Loader2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      label: 'Running',
      animate: true,
    },
    cancelled: {
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      label: 'Cancelled',
    },
  };

  // Default to cancelled config for unknown statuses
  const defaultConfig: typeof statusConfig[keyof typeof statusConfig] = {
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Unknown',
    animate: false,
  };
  const config = statusConfig[run.status] ?? defaultConfig;
  const Icon = config.icon;

  const formatTime = (isoDate: string) => {
    const now = new Date();
    const date = new Date(isoDate);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between p-3 rounded-lg',
        'hover:bg-muted/50 transition-colors text-left'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-1.5 rounded-full', config.bgColor)}>
          <Icon
            className={cn(
              'w-4 h-4',
              config.color,
              config.animate && 'animate-spin'
            )}
          />
        </div>
        <div>
          <p className="text-sm font-medium">{workUnitName || 'Task'}</p>
          <p className="text-xs text-muted-foreground">
            {config.label} • {formatTime(run.startedAt)}
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

/**
 * MyTasksPage displays available tasks and recent results.
 *
 * This is the primary interface for Level 1 users (Task Performers).
 * It focuses on simplicity and quick task execution.
 */
export function MyTasksPage() {
  const navigate = useNavigate();
  const { level } = useUserLevel();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkUnit, setSelectedWorkUnit] = useState<WorkUnit | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch available tasks
  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useAvailableTasks();

  // Fetch user's recent runs
  const {
    data: recentRuns,
    isLoading: runsLoading,
  } = useUserRecentRuns(10);

  // Fetch runs for selected work unit
  const { data: selectedWorkUnitRuns } = useWorkUnitRuns(selectedWorkUnit?.id, 5);

  // Run work unit mutation
  const runMutation = useRunWorkUnit();

  // Filter tasks by search query
  const filteredTasks = tasks?.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.name.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.capabilities.some((cap) => cap.toLowerCase().includes(query))
    );
  });

  // Handlers
  const handleTaskClick = useCallback((task: WorkUnit) => {
    setSelectedWorkUnit(task);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedWorkUnit(null);
  }, []);

  const handleRun = useCallback((workUnitId: string) => {
    runMutation.mutate({ workUnitId });
  }, [runMutation]);

  const handleViewRun = useCallback((runId: string) => {
    navigate(`/work/runs/${runId}`);
  }, [navigate]);

  const handleViewTrustChain = useCallback(() => {
    if (selectedWorkUnit?.trustInfo?.trustChainId) {
      navigate(`/trust/${selectedWorkUnit.id}`);
    }
  }, [navigate, selectedWorkUnit]);

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">
            Tasks available for you to run
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchTasks()}
            disabled={tasksLoading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', tasksLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Available Tasks Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Available to Run</h2>
          {tasks && tasks.length > 0 && (
            <Badge variant="secondary">{tasks.length} tasks</Badge>
          )}
        </div>

        {tasksError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load tasks. Please try again.
          </div>
        )}

        {tasksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <TaskCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredTasks && filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTasks.map((task) => (
              <WorkUnitCard
                key={task.id}
                workUnit={task}
                userLevel={level}
                onClick={() => handleTaskClick(task)}
                onRun={() => handleRun(task.id)}
                showActions={false}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={searchQuery ? 'No matching tasks' : 'No tasks available'}
            description={
              searchQuery
                ? 'Try a different search term'
                : 'Tasks will appear here when they are delegated to you'
            }
          />
        )}
      </section>

      {/* Recent Results Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Results</h2>
          {recentRuns && recentRuns.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/work/runs')}>
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {runsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : recentRuns && recentRuns.length > 0 ? (
          <div className="rounded-lg border divide-y">
            {recentRuns.slice(0, 5).map((run) => (
              <RecentRunItem
                key={run.id}
                run={run}
                onClick={() => handleViewRun(run.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No recent results. Run a task to see results here.
            </p>
          </div>
        )}
      </section>

      {/* Detail Panel */}
      <WorkUnitDetailPanel
        workUnit={selectedWorkUnit}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        userLevel={level}
        recentRuns={selectedWorkUnitRuns}
        onRun={() => selectedWorkUnit && handleRun(selectedWorkUnit.id)}
        onViewTrustChain={handleViewTrustChain}
        onViewRun={handleViewRun}
        isLoading={runMutation.isPending}
      />
    </div>
  );
}

export default MyTasksPage;
