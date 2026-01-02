import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import {
  MoreVertical,
  Key,
  RefreshCw,
  Ban,
  Copy,
  Clock,
  Calendar,
} from "lucide-react";
import type { ApiKey } from "../types";
import { formatDistanceToNow } from "date-fns";

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onRegenerate: (id: string) => void;
  onRevoke: (id: string) => void;
  onCopyKey: (key: string) => void;
}

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  revoked: "bg-red-500/10 text-red-500 border-red-500/20",
  expired: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export function ApiKeyCard({
  apiKey,
  onRegenerate,
  onRevoke,
  onCopyKey,
}: ApiKeyCardProps) {
  const canRegenerate = apiKey.status === "active";
  const canRevoke = apiKey.status === "active";

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="transition-all hover:shadow-lg hover:border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-lg">{apiKey.name}</CardTitle>
            <Badge className={statusColors[apiKey.status]}>
              {apiKey.status}
            </Badge>
          </div>
          <CardDescription>
            <div className="flex items-center gap-2 font-mono text-xs">
              <Key className="h-3 w-3" />
              {apiKey.key}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => onCopyKey(apiKey.key)}
                title="Copy key"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canRegenerate && (
              <DropdownMenuItem onClick={() => onRegenerate(apiKey.id)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </DropdownMenuItem>
            )}
            {canRevoke && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onRevoke(apiKey.id)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Revoke
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm">
            <p className="text-muted-foreground">Permissions</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {apiKey.permissions.length > 0 ? (
                apiKey.permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  No permissions
                </span>
              )}
            </div>
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground">Scopes</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {apiKey.scopes.length > 0 ? (
                apiKey.scopes.map((scope) => (
                  <Badge key={scope} variant="secondary" className="text-xs">
                    {scope}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No scopes</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
          {apiKey.lastUsedAt && (
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Last Used</p>
                <p className="font-medium text-xs">
                  {formatDate(apiKey.lastUsedAt)}
                </p>
              </div>
            </div>
          )}
          {apiKey.expiresAt && (
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Expires</p>
                <p className="font-medium text-xs">
                  {formatDate(apiKey.expiresAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
