/**
 * RunDetailsPage
 *
 * Page for viewing individual run details including status, timestamps,
 * input/output data, and error information.
 *
 * @see docs/plans/eatp-frontend/05-level-based-experience.md
 */

import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { useRunDetails } from '@/features/work-units/hooks';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

/**
 * Status configuration for run status badges
 */
const statusConfig: Record<
  string,
  {
    icon: typeof CheckCircle;
    color: string;
    bgColor: string;
    badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
    animate?: boolean;
  }
> = {
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    badgeVariant: 'default',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    badgeVariant: 'destructive',
    label: 'Failed',
  },
  running: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    badgeVariant: 'secondary',
    label: 'Running',
    animate: true,
  },
  cancelled: {
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800/50',
    badgeVariant: 'outline',
    label: 'Cancelled',
  },
};

/**
 * Default status config for unknown statuses
 */
const defaultStatusConfig = {
  icon: AlertCircle,
  color: 'text-gray-600',
  bgColor: 'bg-gray-100 dark:bg-gray-800/50',
  badgeVariant: 'outline' as const,
  label: 'Unknown',
  animate: false,
};

/**
 * Format a timestamp for display
 */
function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Calculate and format duration between two timestamps
 */
function calculateDuration(startedAt: string, completedAt?: string): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diffMs = end - start;

  if (diffMs < 1000) {
    return `${diffMs}ms`;
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * JSON Viewer component for displaying formatted JSON data
 */
function JsonViewer({
  data,
  label,
}: {
  data: Record<string, unknown> | undefined;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">No {label.toLowerCase()} data</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border bg-muted/30">
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <pre className="overflow-auto p-4 text-sm">
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  );
}

/**
 * Loading skeleton for the run details page
 */
function RunDetailsSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Status card skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Input/Output skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Error state component
 */
function RunDetailsError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to load run details</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            {error.message || 'An unexpected error occurred while loading the run details.'}
          </p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * RunDetailsPage displays detailed information about a specific run.
 *
 * Shows status, timestamps, duration, input/output data, and error messages.
 */
export function RunDetailsPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();

  const {
    data: run,
    isLoading,
    error,
    refetch,
  } = useRunDetails(runId);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleRerun = useCallback(() => {
    // Navigate back to tasks page - the actual re-run would need the work unit ID
    // which we may need to fetch or pass through the run details
    navigate('/work/tasks');
  }, [navigate]);

  // Loading state
  if (isLoading) {
    return <RunDetailsSkeleton />;
  }

  // Error state
  if (error) {
    return <RunDetailsError error={error as Error} onRetry={refetch} />;
  }

  // Not found state
  if (!run) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Run not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The run you are looking for does not exist or has been deleted.
            </p>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = statusConfig[run.status] ?? defaultStatusConfig;
  const StatusIcon = config.icon;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Run Details</h1>
              <Badge
                variant={config.badgeVariant}
                className={cn(
                  config.badgeVariant === 'default' && 'bg-green-600',
                  'gap-1'
                )}
              >
                <StatusIcon
                  className={cn('w-3 h-3', config.animate && 'animate-spin')}
                />
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              {run.id}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleRerun}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Re-run Task
        </Button>
      </div>

      {/* Status and Timing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Execution Details</CardTitle>
          <CardDescription>Timing and status information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Started At */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-background">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Started At</p>
                <p className="text-sm text-muted-foreground">
                  {formatTimestamp(run.startedAt)}
                </p>
              </div>
            </div>

            {/* Completed At */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-background">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Completed At</p>
                <p className="text-sm text-muted-foreground">
                  {run.completedAt ? formatTimestamp(run.completedAt) : 'In progress...'}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className={cn('p-2 rounded-lg', config.bgColor)}>
                <StatusIcon
                  className={cn('w-4 h-4', config.color, config.animate && 'animate-spin')}
                />
              </div>
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {calculateDuration(run.startedAt, run.completedAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert (if failed) */}
      {run.status === 'failed' && run.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Execution Failed</AlertTitle>
          <AlertDescription className="mt-2">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {run.error}
            </pre>
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Input/Output Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Input</CardTitle>
            <CardDescription>Data provided to the task</CardDescription>
          </CardHeader>
          <CardContent>
            <JsonViewer data={run.input} label="Input" />
          </CardContent>
        </Card>

        {/* Output Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Output</CardTitle>
            <CardDescription>Result from the task execution</CardDescription>
          </CardHeader>
          <CardContent>
            <JsonViewer data={run.output} label="Output" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RunDetailsPage;
