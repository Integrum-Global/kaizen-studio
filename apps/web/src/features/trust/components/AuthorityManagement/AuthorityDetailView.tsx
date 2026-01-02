/**
 * AuthorityDetailView Component
 *
 * Full detail view for an authority with tabs
 */

import { format } from "date-fns";
import {
  Building2,
  User,
  Shield,
  Edit,
  Power,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuthorityById, useAuthorityAgents } from "../../hooks";
import type { Authority } from "../../types";

interface AuthorityDetailViewProps {
  authorityId: string;
  onEdit?: (authority: Authority) => void;
  onDeactivate?: (authority: Authority) => void;
}

const AUTHORITY_TYPE_ICONS = {
  organization: Building2,
  system: Shield,
  human: User,
};

const AUTHORITY_TYPE_LABELS = {
  organization: "Organization",
  system: "System",
  human: "Human",
};

export function AuthorityDetailView({
  authorityId,
  onEdit,
  onDeactivate,
}: AuthorityDetailViewProps) {
  const { toast } = useToast();
  const { data: authority, isPending } = useAuthorityById(authorityId);
  const { data: agents, isPending: isPendingAgents } =
    useAuthorityAgents(authorityId);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied to clipboard",
      description: `${field} copied successfully`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isPending || !authority) {
    return <AuthorityDetailViewSkeleton />;
  }

  const Icon = AUTHORITY_TYPE_ICONS[authority.type];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{authority.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {AUTHORITY_TYPE_LABELS[authority.type]}
              </Badge>
              <Badge
                variant={authority.isActive ? "default" : "secondary"}
                className={cn(
                  authority.isActive
                    ? "bg-green-500/10 text-green-700 dark:text-green-300"
                    : ""
                )}
              >
                {authority.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onEdit?.(authority)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant={authority.isActive ? "destructive" : "default"}
            onClick={() => onDeactivate?.(authority)}
          >
            <Power className="h-4 w-4 mr-2" />
            {authority.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">
            Agents ({authority.agentCount})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authority Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              {authority.description && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {authority.description}
                  </p>
                </div>
              )}

              {/* ID */}
              <div>
                <h3 className="text-sm font-medium mb-1">Authority ID</h3>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {authority.id}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(authority.id, "Authority ID")
                    }
                  >
                    {copiedField === "Authority ID" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Certificate Hash */}
              {authority.certificateHash && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Certificate Hash</h3>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {authority.certificateHash}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          authority.certificateHash!,
                          "Certificate Hash"
                        )
                      }
                    >
                      {copiedField === "Certificate Hash" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Parent Authority */}
              {authority.parentAuthorityId && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Parent Authority</h3>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {authority.parentAuthorityId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          authority.parentAuthorityId!,
                          "Parent Authority ID"
                        )
                      }
                    >
                      {copiedField === "Parent Authority ID" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h3 className="text-sm font-medium mb-1">Created</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(authority.createdAt), "PPP 'at' p")}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Last Updated</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(authority.updatedAt), "PPP 'at' p")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agents Established by this Authority</CardTitle>
            </CardHeader>
            <CardContent>
              {isPendingAgents ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : agents && agents.length > 0 ? (
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <div
                      key={agent.agent_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.agent_id}
                        </p>
                      </div>
                      <Badge
                        variant={
                          agent.status === "online" ? "default" : "secondary"
                        }
                      >
                        {agent.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No agents have been established by this authority yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Activity tracking coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authority Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Advanced settings coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AuthorityDetailViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <Skeleton className="h-96 w-full" />
    </div>
  );
}
