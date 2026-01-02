import { ApiKeyList } from "@/features/api-keys";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";

export function ApiKeysPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground mt-1">
          Manage API keys for programmatic access to Kaizen Studio
        </p>
      </div>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Create and manage API keys to authenticate your applications and
            services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeyList />
        </CardContent>
      </Card>
    </div>
  );
}
