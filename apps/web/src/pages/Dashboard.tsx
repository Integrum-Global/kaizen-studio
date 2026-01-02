import { useState, useCallback } from "react";
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
import { useBreakpoint } from "../hooks";
import {
  Plus,
  RefreshCw,
  Users,
  GitBranch,
  Server,
  Activity,
  Clock,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "agent" | "pipeline" | "deployment";
  action: string;
  target: string;
  timestamp: Date;
}

export function Dashboard() {
  const { user } = useAuthStore();
  const { breakpoint, isMobile } = useBreakpoint();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Mock stats - in a real app these would come from an API
  const [stats, setStats] = useState({
    activeAgents: 0,
    runningPipelines: 0,
    deployments: 0,
  });

  // Mock recent activity - in a real app this would come from an API
  const [recentActivity] = useState<ActivityItem[]>([
    {
      id: "1",
      type: "agent",
      action: "created",
      target: "Customer Support Bot",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    },
    {
      id: "2",
      type: "pipeline",
      action: "deployed",
      target: "Data Processing Pipeline",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: "3",
      type: "deployment",
      action: "updated",
      target: "Production API",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    },
  ]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Update stats (in real app, fetch from API)
    setStats((prev) => ({ ...prev }));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  }, []);

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
        return Users;
      case "pipeline":
        return GitBranch;
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
            <Link to="/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              New Agent
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/pipelines/new">
              <Plus className="mr-2 h-4 w-4" />
              New Pipeline
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
              disabled={isRefreshing}
              aria-label="refresh stats"
              title="refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Active Agents</span>
                </div>
                <Badge>{stats.activeAgents}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Running Pipelines</span>
                </div>
                <Badge>{stats.runningPipelines}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Deployments</span>
                </div>
                <Badge>{stats.deployments}</Badge>
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
            disabled={isRefreshing}
            aria-label="refresh activity"
            title="refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
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
