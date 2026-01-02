import { ResponsiveContainer } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LogsPage() {
  return (
    <ResponsiveContainer maxWidth="full" className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          System Logs
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View and search system logs
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Log Viewer</CardTitle>
              <CardDescription>
                Real-time system logs and application events
              </CardDescription>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Log viewer functionality will be available soon
              </p>
              <p className="text-xs text-muted-foreground">
                This feature will include log streaming, filtering, and search
                capabilities
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}

export default LogsPage;
