import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { InvocationsTab } from "./details/InvocationsTab";
import { LineageViewer } from "./details/LineageViewer";
import { GovernanceTab } from "./details/GovernanceTab";
import type { ExternalAgent } from "../types";

interface ExternalAgentDetailsModalProps {
  agent: ExternalAgent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExternalAgentDetailsModal({
  agent,
  open,
  onOpenChange,
}: ExternalAgentDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        aria-labelledby="agent-details-title"
        aria-describedby="agent-details-description"
      >
        <DialogHeader>
          <DialogTitle id="agent-details-title">{agent.name}</DialogTitle>
          <DialogDescription id="agent-details-description">
            {agent.description || `External agent integration for ${agent.provider}`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invocations">Invocations</TabsTrigger>
            <TabsTrigger value="lineage">Lineage</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Agent Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Provider:</span>
                    <div className="mt-1">
                      <Badge variant="outline" className="capitalize">
                        {agent.provider}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-1">
                      <Badge
                        variant={
                          agent.status === "active" ? "default" : "secondary"
                        }
                      >
                        {agent.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <div className="mt-1 font-medium">
                      {new Date(agent.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>
                    <div className="mt-1 font-medium">
                      {new Date(agent.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  {agent.last_invocation_at && (
                    <div>
                      <span className="text-muted-foreground">Last Invocation:</span>
                      <div className="mt-1 font-medium">
                        {new Date(agent.last_invocation_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {agent.tags && agent.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-3">Authentication</h3>
                <div className="text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <div className="mt-1">
                    <Badge variant="outline" className="capitalize">
                      {agent.auth_config.type.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Platform Configuration</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(agent.platform_config).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground capitalize">
                        {key.replace("_", " ")}:
                      </span>
                      <div className="mt-1 font-medium">
                        {typeof value === "string" && (value.includes("token") || value.includes("secret"))
                          ? "••••••••"
                          : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invocations" className="mt-4">
            <InvocationsTab agentId={agent.id} />
          </TabsContent>

          <TabsContent value="lineage" className="mt-4">
            <LineageViewer agentId={agent.id} />
          </TabsContent>

          <TabsContent value="governance" className="mt-4">
            <GovernanceTab agentId={agent.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
