import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ResponsiveContainer, ResponsiveGrid } from "../components/layout";
import { Skeleton } from "../components/ui/skeleton";
import { useBreakpoint } from "../hooks";
import {
  Plus,
  RefreshCw,
  Boxes,
  Workflow,
  Server,
  Activity,
  Clock,
} from "lucide-react";
import {
  useWorkUnits,
  useProcesses,
  useTeamActivity,
} from "@/features/work-units/hooks";
import { useDeployments } from "@/features/deployments/hooks";
import type { ActivityEvent } from "@/features/work-units/api/work-units";

interface ActivityItem {
  id: string;
  type: "agent" | "pipeline" | "deployment";
  action: string;
  target: string;
  timestamp: Date;
}

/**
 * Transform API activity event to UI activity item
 */
function transformActivityEvent(event: ActivityEvent): ActivityItem {
  // Map API event type to UI type
  const typeMapping: Record<ActivityEvent["type"], ActivityItem["type"]> = {
    run: "agent",
    delegation: "pipeline",
    error: "agent",
    completion: "agent",
  };

  // Map API event type to action string
  const actionMapping: Record<ActivityEvent["type"], string> = {
    run: "started run",
    delegation: "delegated",
    error: "encountered error",
    completion: "completed",
  };

  return {
    id: event.id,
    type: typeMapping[event.type],
    action: actionMapping[event.type],
    target: event.workUnitName,
    timestamp: new Date(event.timestamp),
  };
}

export function Dashboard() {
  const { user } = useAuthStore();
  const { breakpoint, isMobile } = useBreakpoint();

  // Fetch real data from API
  const {
    data: workUnitsData,
    isLoading: isLoadingWorkUnits,
    refetch: refetchWorkUnits,
    dataUpdatedAt: workUnitsUpdatedAt,
  } = useWorkUnits();

  const {
    data: processesData,
    isLoading: isLoadingProcesses,
    refetch: refetchProcesses,
  } = useProcesses();

  const {
    data: deploymentsData,
    isLoading: isLoadingDeployments,
    refetch: refetchDeployments,
  } = useDeployments();

  const {
    data: activityData,
    isLoading: isLoadingActivity,
    refetch: refetchActivity,
    isFetching: isFetchingActivity,
  } = useTeamActivity(10);

  // Derive stats from real data
  const stats = useMemo(
    () => ({
      activeWorkUnits: workUnitsData?.total ?? 0,
      activeProcesses: processesData?.length ?? 0,
      deployments: deploymentsData?.total ?? 0,
    }),
    [workUnitsData?.total, processesData?.length, deploymentsData?.total]
  );

  // Transform activity data to UI format
  const recentActivity = useMemo<ActivityItem[]>(() => {
    if (!activityData) return [];
    return activityData.map(transformActivityEvent);
  }, [activityData]);

  // Compute loading states
  const isLoadingStats =
    isLoadingWorkUnits || isLoadingProcesses || isLoadingDeployments;
  const isRefreshing = isFetchingActivity;

  // Last refresh timestamp from React Query
  const lastRefresh = useMemo(
    () => new Date(workUnitsUpdatedAt || Date.now()),
    [workUnitsUpdatedAt]
  );

  const handleRefresh = useCallback(async () => {
    // Refetch all queries in parallel
    await Promise.all([
      refetchWorkUnits(),
      refetchProcesses(),
      refetchDeployments(),
      refetchActivity(),
    ]);
  }, [refetchWorkUnits, refetchProcesses, refetchDeployments, refetchActivity]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "agent":
      case "work-unit":
        return Boxes;
      case "pipeline":
      case "process":
        return Workflow;
      case "deployment":
        return Server;
      default:
        return Activity;
    }
  };

  if (!user) return null;

  return (
    <ResponsiveContainer maxWidth="full" className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back, {user.name}!
            {!isMobile && (
              <span className="ml-2 text-xs">({breakpoint} view)</span>
            )}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/build/work-units/new">
              <Plus className="mr-2 h-4 w-4" />
              New Work Unit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/build/workspaces/new">
              <Plus className="mr-2 h-4 w-4" />
              New Workspace
            </Link>
          </Button>
        </div>
      </div>

      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Organization</p>
              <p className="text-sm text-muted-foreground">
                {user.organization_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Role</p>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card with Refresh */}
        <Card className="widget" data-testid="stats-widget">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Your activity overview</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingStats}
              aria-label="refresh stats"
              title="refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing || isLoadingStats ? "animate-spin" : ""}`}
              />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Active Work Units</span>
                </div>
                {isLoadingWorkUnits ? (
                  <Skeleton className="h-5 w-8" />
                ) : (
                  <Badge>{stats.activeWorkUnits}</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Active Processes</span>
                </div>
                {isLoadingProcesses ? (
                  <Skeleton className="h-5 w-8" />
                ) : (
                  <Badge>{stats.activeProcesses}</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Deployments</span>
                </div>
                {isLoadingDeployments ? (
                  <Skeleton className="h-5 w-8" />
                ) : (
                  <Badge>{stats.deployments}</Badge>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Last updated: {formatTimeAgo(lastRefresh)}
            </p>
          </CardContent>
        </Card>

        {/* Getting Started Card */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Begin your journey with Kaizen Studio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Kaizen Studio is your AI agent platform. Explore the features in
              the sidebar to get started.
            </p>
          </CardContent>
        </Card>
      </ResponsiveGrid>

      {/* Recent Activity Section */}
      <Card data-testid="activity-section">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions in your workspace</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingActivity}
            aria-label="refresh activity"
            title="refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing || isLoadingActivity ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingActivity ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No recent activity
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    data-testid="activity-item"
                  >
                    <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.target}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.action}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}

export default Dashboard;
